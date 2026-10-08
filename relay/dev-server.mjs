/**
 * Runs the relay locally on http://127.0.0.1:8787/api/message, for trying the message box
 * without deploying. Webhooks come from the environment, as on Vercel:
 *   DISCORD_WEBHOOK_GENERAL=https://discord.com/api/webhooks/... node relay/dev-server.mjs
 */
import { createServer } from 'node:http'
import { handleMessage, handleOptions, handleStatus } from './inbox.mjs'

const port = Number(process.env.PORT ?? 8787)

createServer(async (req, res) => {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const request = new Request(`http://127.0.0.1:${port}${req.url}`, {
    method: req.method,
    headers: { ...req.headers, 'x-forwarded-for': req.socket.remoteAddress ?? '' },
    body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
  })
  const response = !req.url?.startsWith('/api/message')
    ? new Response('Not found', { status: 404 })
    : req.method === 'OPTIONS'
      ? handleOptions(request)
      : req.method === 'POST'
        ? await handleMessage(request, process.env)
        : handleStatus(process.env)
  res.writeHead(response.status, Object.fromEntries(response.headers))
  res.end(Buffer.from(await response.arrayBuffer()))
}).listen(port, '127.0.0.1', () => console.log(`relay on http://127.0.0.1:${port}/api/message`))
