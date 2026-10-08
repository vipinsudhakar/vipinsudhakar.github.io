/**
 * The relay between the portfolio's message box and Discord. It checks a message, picks the
 * channel's webhook from the environment, and posts it there as an embed. The webhook links are
 * secrets: they only ever live in the environment (Vercel's settings), never in the page or repo.
 */
import { GENERAL, KINDS } from './kinds.mjs'

export const ALLOWED_ORIGINS = ['https://vipinsudhakar.github.io', 'http://127.0.0.1:4321', 'http://localhost:4321']

const LIMITS = { name: [1, 80], reply: [3, 120], message: [10, 2000] }
const MAX_BODY = 12_000 // characters; generous for 2000-character messages
const MIN_FILL_MS = 3000 // people take longer than this to write anything; bots don't
const RATE = { max: 5, windowMs: 10 * 60 * 1000 }
const BLUE = 0x2a4093

/** @typedef {Record<string, string | undefined>} Env */

// Best effort only: each serverless instance keeps its own memory, and it resets on a cold start.
/** @type {Map<string, number[]>} */
const hits = new Map()

/** Records a message from `ip` and says whether it is over the limit. */
export function rateLimited(ip, now = Date.now()) {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE.windowMs)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > RATE.max
}

/** Text as typed, minus control characters (newlines and tabs stay) and runs of blank lines. */
export function clean(value) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * @param {any} body
 * @returns {{ ok: true, data: { name: string, reply: string, message: string, kind: string | null } }
 *   | { ok: false, error: string }}
 */
export function validate(body) {
  if (!body || typeof body !== 'object') return { ok: false, error: 'That message could not be read.' }
  const name = clean(body.name)
  const reply = clean(body.reply)
  const message = clean(body.message)
  const kind = body.kind == null || body.kind === '' ? null : String(body.kind)
  const within = (text, [min, max]) => text.length >= min && text.length <= max
  if (!within(name, LIMITS.name)) return { ok: false, error: 'Please add your name (up to 80 characters).' }
  if (!within(reply, LIMITS.reply)) return { ok: false, error: 'Please say how I can reply: an email, Discord or phone.' }
  if (!within(message, LIMITS.message)) return { ok: false, error: 'Please write a message of 10 to 2000 characters.' }
  if (kind && !KINDS.some((k) => k.id === kind)) return { ok: false, error: 'Please pick what the message is about.' }
  return { ok: true, data: { name, reply, message, kind } }
}

/** The kind a message belongs to and the webhook it goes to (its own, or GENERAL's). */
export function routeFor(kindId, env) {
  const kind = KINDS.find((k) => k.id === kindId) ?? GENERAL
  const own = env[kind.env]
  if (own) return { kind, url: own }
  return { kind, url: env[GENERAL.env] }
}

const cut = (text, max) => (text.length > max ? `${text.slice(0, max - 1)}…` : text)

/** The Discord webhook body: one embed, and a ping for the owner only if DISCORD_USER_ID is set. */
export function discordPayload({ name, reply, message }, kind, env, now = new Date()) {
  const userId = /^\d{5,25}$/.test(env.DISCORD_USER_ID ?? '') ? env.DISCORD_USER_ID : null
  return {
    ...(userId ? { content: `<@${userId}>` } : {}),
    // Nothing a visitor types can ping anyone; only the owner mention above is allowed.
    allowed_mentions: { parse: [], users: userId ? [userId] : [] },
    embeds: [
      {
        title: cut(`${kind.label} from ${name}`, 256),
        description: cut(message, 4000),
        color: BLUE,
        fields: [{ name: 'Reply to', value: cut(reply, 1000) }],
        footer: { text: 'vipinsudhakar.github.io' },
        timestamp: now.toISOString(),
      },
    ],
  }
}

/** CORS headers for an allowed origin, or null for any other. */
function cors(origin) {
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) return null
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

const json = (status, body, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } })

/** @param {Request} request */
export function handleOptions(request) {
  const headers = cors(request.headers.get('origin'))
  return headers ? new Response(null, { status: 204, headers }) : new Response(null, { status: 403 })
}

/** Says which channels have a webhook set, so a deploy can be checked without revealing any. */
export function handleStatus(env) {
  const configured = [...KINDS, GENERAL].filter((k) => env[k.env]).map((k) => k.id)
  return json(200, { ok: true, service: 'portfolio inbox', configured })
}

/**
 * @param {Request} request
 * @param {Env} env
 */
export async function handleMessage(request, env, now = Date.now()) {
  const headers = cors(request.headers.get('origin'))
  if (!headers) return json(403, { ok: false, error: 'Messages can only be sent from the portfolio.' })

  const text = await request.text()
  if (text.length > MAX_BODY) return json(413, { ok: false, error: 'That message is too long.' }, headers)
  let body
  try {
    body = JSON.parse(text)
  } catch {
    return json(400, { ok: false, error: 'That message could not be read.' }, headers)
  }

  // Spam: a filled hidden field, or a box submitted faster than anyone can type. Pretend it worked.
  if (clean(body?.website) || !(Number(body?.elapsed) >= MIN_FILL_MS)) return json(200, { ok: true }, headers)

  const ip = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown'
  if (rateLimited(ip, now)) {
    return json(429, { ok: false, error: 'That is a lot of messages. Please try again in a few minutes.' }, headers)
  }

  const checked = validate(body)
  if (!checked.ok) return json(400, { ok: false, error: checked.error }, headers)

  const { kind, url } = routeFor(checked.data.kind, env)
  if (!url) return json(503, { ok: false, error: 'The inbox is not set up yet.' }, headers)

  let sent
  try {
    sent = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload(checked.data, kind, env, new Date(now))),
      signal: AbortSignal.timeout(8000),
    })
  } catch {
    return json(502, { ok: false, error: 'Discord could not be reached. Please try again.' }, headers)
  }
  if (sent.status === 429) return json(503, { ok: false, error: 'Discord is busy. Please try again in a minute.' }, headers)
  if (!sent.ok) return json(502, { ok: false, error: 'Discord did not take the message. Please try again.' }, headers)
  return json(200, { ok: true }, headers)
}
