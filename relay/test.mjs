/**
 * Offline tests for the relay: a fake Discord on a local port records what would be posted.
 * Run with `node relay/test.mjs` (or `npm test` inside relay/). No network, no real webhooks.
 */
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { handleMessage, handleOptions, handleStatus } from './inbox.mjs'

// --- a fake Discord: each webhook path records the bodies it receives
const received = []
let discordStatus = 204
const fake = createServer(async (req, res) => {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  received.push({ path: req.url, body: JSON.parse(Buffer.concat(chunks).toString()) })
  res.writeHead(discordStatus).end()
})
await new Promise((resolve) => fake.listen(0, '127.0.0.1', resolve))
const base = `http://127.0.0.1:${fake.address().port}`
const env = {
  DISCORD_WEBHOOK_GENERAL: `${base}/general`,
  DISCORD_WEBHOOK_PROJECT: `${base}/project`,
  DISCORD_WEBHOOK_QUESTION: `${base}/question`,
  DISCORD_USER_ID: '123456789012345678',
  // INTERNSHIP and HELLO deliberately unset: they should fall back to general
}

const ORIGIN = 'https://vipinsudhakar.github.io'
let ipCounter = 0
const send = (body, { origin = ORIGIN, ip = `10.0.0.${++ipCounter}`, raw } = {}) =>
  handleMessage(
    new Request('https://inbox.example/api/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(origin ? { origin } : {}), 'x-forwarded-for': ip },
      body: raw ?? JSON.stringify(body),
    }),
    env,
  )
const good = (extra = {}) => ({
  name: 'Ada',
  reply: 'ada@example.com',
  message: 'I have a project idea about trial matching.',
  kind: 'project',
  website: '',
  elapsed: 9000,
  ...extra,
})
const lastAt = (path) => [...received].reverse().find((r) => r.path === path)

let passed = 0
const test = async (name, fn) => {
  await fn()
  passed++
  console.log(`  ok  ${name}`)
}

await test('a valid message posts an embed to its own channel', async () => {
  const res = await send(good())
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { ok: true })
  const hit = lastAt('/project')
  assert.ok(hit, 'project webhook called')
  const embed = hit.body.embeds[0]
  assert.equal(embed.title, 'Project idea from Ada')
  assert.equal(embed.description, 'I have a project idea about trial matching.')
  assert.deepEqual(embed.fields, [{ name: 'Reply to', value: 'ada@example.com' }])
  assert.equal(embed.color, 0x2a4093)
  assert.equal(res.headers.get('access-control-allow-origin'), ORIGIN)
})

await test('each kind reaches its own webhook', async () => {
  await send(good({ kind: 'question' }))
  assert.ok(lastAt('/question'))
  assert.equal(lastAt('/question').body.embeds[0].title, 'Question from Ada')
})

await test('a kind without its own webhook falls back to general, keeping its label', async () => {
  const before = received.length
  await send(good({ kind: 'internship' }))
  const hit = received[before]
  assert.equal(hit.path, '/general')
  assert.equal(hit.body.embeds[0].title, 'Internship / work from Ada')
})

await test('no kind goes to general', async () => {
  const before = received.length
  await send(good({ kind: undefined }))
  assert.equal(received[before].path, '/general')
  assert.equal(received[before].body.embeds[0].title, 'Message from Ada')
})

await test('only the owner can be pinged; typed mentions are inert', async () => {
  const before = received.length
  await send(good({ message: '@everyone look <@999999999999999999> here please' }))
  const body = received[before].body
  assert.equal(body.content, '<@123456789012345678>')
  assert.deepEqual(body.allowed_mentions, { parse: [], users: ['123456789012345678'] })
})

await test('bad fields are refused with a reason', async () => {
  for (const bad of [{ name: '' }, { reply: 'a' }, { message: 'too short' }, { kind: 'admin' }, { message: 'x'.repeat(2001) }]) {
    const before = received.length
    const res = await send(good(bad))
    assert.equal(res.status, 400, JSON.stringify(bad))
    assert.equal((await res.json()).ok, false)
    assert.equal(received.length, before, 'nothing sent')
  }
  const res = await send(null, { raw: '{not json' })
  assert.equal(res.status, 400)
})

await test('the honeypot and too-fast submits are dropped quietly', async () => {
  const before = received.length
  assert.equal((await send(good({ website: 'http://spam.example' }))).status, 200)
  assert.equal((await send(good({ elapsed: 800 }))).status, 200)
  assert.equal((await send(good({ elapsed: undefined }))).status, 200)
  assert.equal(received.length, before, 'nothing sent')
})

await test('a sixth message from one address within 10 minutes is refused', async () => {
  for (let i = 0; i < 5; i++) assert.equal((await send(good(), { ip: '10.9.9.9' })).status, 200)
  const res = await send(good(), { ip: '10.9.9.9' })
  assert.equal(res.status, 429)
})

await test('other origins are refused', async () => {
  const before = received.length
  assert.equal((await send(good(), { origin: 'https://evil.example' })).status, 403)
  assert.equal((await send(good(), { origin: null })).status, 403)
  assert.equal(received.length, before)
  const pre = handleOptions(new Request('https://inbox.example/api/message', { method: 'OPTIONS', headers: { origin: ORIGIN } }))
  assert.equal(pre.status, 204)
  assert.equal(pre.headers.get('access-control-allow-methods'), 'POST, OPTIONS')
})

await test('Discord errors come back as a friendly failure', async () => {
  discordStatus = 429
  assert.equal((await send(good())).status, 503)
  discordStatus = 500
  assert.equal((await send(good())).status, 502)
  discordStatus = 204
})

await test('without any webhook the inbox says it is not set up', async () => {
  const res = await handleMessage(
    new Request('https://inbox.example/api/message', {
      method: 'POST',
      headers: { origin: ORIGIN, 'x-forwarded-for': '10.1.1.1' },
      body: JSON.stringify(good()),
    }),
    {},
  )
  assert.equal(res.status, 503)
})

await test('the status check lists configured channels without the links', async () => {
  const body = await handleStatus(env).json()
  assert.deepEqual(body.configured.sort(), ['general', 'project', 'question'])
  assert.ok(!JSON.stringify(body).includes('127.0.0.1'))
})

fake.close()
console.log(`\n${passed} passed`)
