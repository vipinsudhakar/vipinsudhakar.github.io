import { site } from '../data/site'

/**
 * Where the message box posts. PUBLIC_INBOX_ENDPOINT overrides site.inbox.endpoint, which is handy
 * for trying the box against a local relay: PUBLIC_INBOX_ENDPOINT=http://127.0.0.1:8787/api/message
 */
export const inboxEndpoint: string = import.meta.env.PUBLIC_INBOX_ENDPOINT || site.inbox.endpoint
