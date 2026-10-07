/**
 * Fills in the email, phone and WhatsApp links from the encoded details on <body> (see
 * Base.astro), so the addresses are never written out in the HTML.
 */
export function initContactLinks() {
  const key = document.body.dataset.k
  if (!key) return
  let details: { e: string; p: string; d: string }
  try {
    details = JSON.parse(atob(key))
  } catch {
    return
  }
  const href: Record<string, string> = {
    email: `mailto:${details.e}`,
    phone: `tel:+${details.p}`,
    whatsapp: `https://wa.me/${details.p}`,
  }
  const text: Record<string, string> = { email: details.e, phone: details.d }

  document.querySelectorAll<HTMLAnchorElement>('a[data-contact]').forEach((link) => {
    const url = href[link.dataset.contact ?? '']
    if (url) link.href = url
  })
  document.querySelectorAll<HTMLElement>('[data-contact-text]').forEach((el) => {
    const value = text[el.dataset.contactText ?? '']
    if (value) el.textContent = value
  })
}

/** Keeps the footer year current without a rebuild. */
export function initYear() {
  const year = String(new Date().getFullYear())
  document.querySelectorAll<HTMLElement>('[data-year]').forEach((el) => (el.textContent = year))
}
