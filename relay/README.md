# Portfolio inbox relay

The portfolio's "Send a message" box posts here. The relay checks the message, then a bot posts it
in your Discord inbox server, in the channel for its kind. It runs as one Vercel function. The
Discord webhook links are secrets: they live only in Vercel's settings, never in the site or this
repo (anyone holding a webhook link can post to, or delete, that webhook).

| Kind (in the form) | Channel | Vercel variable |
| --- | --- | --- |
| Project idea | `#project-ideas` | `DISCORD_WEBHOOK_PROJECT` |
| Question | `#questions` | `DISCORD_WEBHOOK_QUESTION` |
| Internship / work | `#internships` | `DISCORD_WEBHOOK_INTERNSHIP` |
| Just saying hi | `#hello` | `DISCORD_WEBHOOK_HELLO` |
| no kind chosen, or a kind with no webhook yet | `#general-inbox` | `DISCORD_WEBHOOK_GENERAL` (required) |
| (optional) ping you on every message | | `DISCORD_USER_ID` |

The kinds are listed once, in `kinds.mjs`; the site reads the same list to draw the choice.

## 1. Discord (about 3 minutes)

1. Create a server, e.g. "Portfolio inbox", and the channels above. `#general-inbox` is the only
   one you need to start; the rest can come later.
2. In each channel: **Edit Channel (⚙) → Integrations → Webhooks → New Webhook**. Name it
   `Portfolio` and give each the same avatar, so it reads as one bot. **Copy Webhook URL**.
   Don't paste these into chats or commit them.
3. Optional pings: **User Settings → Advanced → Developer Mode** on, then right-click your own
   name → **Copy User ID**.

## 2. Vercel

```sh
cd relay
npx vercel login               # once, in your own terminal (it opens the browser)
npx vercel deploy --prod       # first run: creates the project; accept the defaults
npx vercel env add DISCORD_WEBHOOK_GENERAL production   # paste the URL when asked
# ...repeat for each channel you made, and DISCORD_USER_ID if you want pings
npx vercel deploy --prod       # redeploy so the variables take effect
```

You can also add the variables in the dashboard: **Project → Settings → Environment Variables**.

Check it: open `https://<project>.vercel.app/api/message` in a browser. It lists which channels
have a webhook set (never the links themselves).

## 3. Turn the box on

Put the address in `src/data/site.ts` → `inbox.endpoint`, e.g.
`'https://vipinsudhakar-inbox.vercel.app/api/message'`, and publish the site. While it's empty, the
box and its buttons stay hidden. `inbox.chooseKind: false` hides the choice and sends everything
to `#general-inbox`.

## What it guards against

- Only the portfolio's own address (and `127.0.0.1:4321` for local dev) can post.
- Length limits on every field, and control characters stripped.
- A hidden honeypot field, and boxes sent under 3 seconds after opening, are dropped quietly.
- Up to 5 messages per address per 10 minutes (best effort; each server instance counts alone).
- Nobody can make the bot ping anyone. Only the owner mention from `DISCORD_USER_ID` is allowed.

## Local

```sh
node test.mjs          # offline tests against a fake Discord
DISCORD_WEBHOOK_GENERAL=... node dev-server.mjs    # relay on http://127.0.0.1:8787/api/message
# then, in the site folder:
PUBLIC_INBOX_ENDPOINT=http://127.0.0.1:8787/api/message npm run dev
```
