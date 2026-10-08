/**
 * The kinds of message the portfolio's message box offers, and where each one lands. Shared by
 * the relay (to pick the webhook) and the site (to draw the choice), so they can't drift apart.
 *
 * To add a kind: add a line here, make a channel and a webhook for it in Discord, and add the
 * webhook under `env` in Vercel. A kind whose webhook isn't set yet falls back to GENERAL.
 *
 * @typedef {{ id: string, label: string, channel: string, env: string }} Kind
 */

/** @type {Kind[]} */
export const KINDS = [
  { id: 'project', label: 'Project idea', channel: '#project-ideas', env: 'DISCORD_WEBHOOK_PROJECT' },
  { id: 'question', label: 'Question', channel: '#questions', env: 'DISCORD_WEBHOOK_QUESTION' },
  { id: 'internship', label: 'Internship / work', channel: '#internships', env: 'DISCORD_WEBHOOK_INTERNSHIP' },
  { id: 'hello', label: 'Just saying hi', channel: '#hello', env: 'DISCORD_WEBHOOK_HELLO' },
]

/** Where messages go when no kind is chosen, or the chosen kind has no webhook of its own. */
/** @type {Kind} */
export const GENERAL = { id: 'general', label: 'Message', channel: '#general-inbox', env: 'DISCORD_WEBHOOK_GENERAL' }
