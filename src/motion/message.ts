import type Lenis from 'lenis'

/**
 * The "Send a message" box (MessageBox.astro): opens from any [data-open-message], posts to the
 * Discord relay, and shows sending, sent and error states. Esc or a click on the backdrop closes
 * it, page scrolling pauses while it's open, and focus goes back to whatever opened it.
 */
export function initMessageBox(lenis: Lenis | null) {
  const dialog = document.querySelector<HTMLDialogElement>('[data-message-box]')
  const form = dialog?.querySelector<HTMLFormElement>('[data-message-form]')
  const status = dialog?.querySelector<HTMLElement>('[data-message-status]')
  const count = dialog?.querySelector<HTMLElement>('[data-message-count]')
  const endpoint = dialog?.dataset.endpoint
  if (!dialog || !form || !status || !endpoint) return

  let opener: HTMLElement | null = null
  let openedAt = 0
  const setState = (state: 'idle' | 'sending' | 'sent' | 'error') => (dialog.dataset.state = state)

  const open = (from: HTMLElement) => {
    opener = from
    if (dialog.dataset.state === 'sent') {
      form.reset()
      updateCount()
      setState('idle')
      status.textContent = ''
    }
    dialog.showModal()
    openedAt = performance.now()
    lenis?.stop()
  }
  dialog.addEventListener('close', () => {
    lenis?.start()
    opener?.focus()
  })

  document.addEventListener('click', (event) => {
    const trigger = (event.target as Element | null)?.closest<HTMLElement>('[data-open-message]')
    if (!trigger) return
    event.preventDefault()
    open(trigger)
  })
  dialog.querySelectorAll('[data-message-close]').forEach((button) => button.addEventListener('click', () => dialog.close()))
  dialog.querySelector('[data-message-again]')?.addEventListener('click', () => {
    form.reset()
    updateCount()
    status.textContent = ''
    setState('idle')
    openedAt = performance.now()
    form.querySelector<HTMLInputElement>('input[name="name"]')?.focus()
  })
  // A click on the dialog element itself, outside the panel, is a click on the backdrop.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close()
  })

  const message = form.querySelector<HTMLTextAreaElement>('textarea[name="message"]')
  const updateCount = () => {
    if (count && message) count.textContent = `${message.value.length} / ${message.maxLength}`
  }
  message?.addEventListener('input', updateCount)

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    if (dialog.dataset.state === 'sending') return
    if (!form.reportValidity()) return

    const data = new FormData(form)
    const body = {
      name: data.get('name'),
      reply: data.get('reply'),
      message: data.get('message'),
      kind: data.get('kind') ?? undefined,
      website: data.get('website'),
      elapsed: Math.round(performance.now() - openedAt),
    }
    setState('sending')
    status.textContent = 'Sending…'
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = await response.json().catch(() => ({ ok: false }))
      if (!response.ok || !result.ok) throw new Error(result.error || 'The message could not be sent.')
      status.textContent = ''
      setState('sent')
      dialog.querySelector<HTMLElement>('[data-message-sent] [data-message-close]')?.focus()
    } catch (error) {
      setState('error')
      const reason = error instanceof Error && error.message !== 'Failed to fetch' ? error.message : 'The message could not be sent.'
      status.replaceChildren(`${reason} `, emailFallback())
    }
  })
}

/** "or email me instead", using the address the contact links were filled with. */
function emailFallback() {
  const email = document.querySelector<HTMLAnchorElement>('a[data-contact="email"][href^="mailto:"]')
  const link = document.createElement('a')
  link.href = email?.href ?? '#contact'
  link.textContent = 'Or email me instead.'
  return link
}
