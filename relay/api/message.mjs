// Vercel function: https://<project>.vercel.app/api/message
import { handleMessage, handleOptions, handleStatus } from '../inbox.mjs'

export function OPTIONS(request) {
  return handleOptions(request)
}

export function POST(request) {
  return handleMessage(request, process.env)
}

/** A health check: lists which channels have a webhook set (never the links themselves). */
export function GET() {
  return handleStatus(process.env)
}
