import type Lenis from 'lenis'
import { gsap } from './core'

type State = 'idle' | 'sending' | 'sent' | 'error'

/**
 * The "Send a message" box (MessageBox.astro).
 *
 * Motion: the button you click grows into the panel (a shape morphs from the button's box,
 * colour and corner radius to the panel's), then the panel's contents rise in. Closing reverses
 * it back into the button. Sending sweeps a blue scribble across the panel, swaps in the
 * "Message sent" view underneath, and lets the panel ease to its new height.
 *
 * Behaviour: Esc, the Close buttons or a click on the scrim close it, page scrolling pauses while
 * it's open, and focus returns to whatever opened it.
 */
export function initMessageBox(lenis: Lenis | null) {
  const dialog = document.querySelector<HTMLDialogElement>('[data-message-box]')
  const panel = dialog?.querySelector<HTMLElement>('[data-message-panel]')
  const scrim = dialog?.querySelector<HTMLElement>('[data-message-scrim]')
  const morph = dialog?.querySelector<HTMLElement>('[data-message-morph]')
  const form = dialog?.querySelector<HTMLFormElement>('[data-message-form]')
  const status = dialog?.querySelector<HTMLElement>('[data-message-status]')
  const count = dialog?.querySelector<HTMLElement>('[data-message-count]')
  const sweep = dialog?.querySelector<SVGPathElement>('[data-message-sweep]')
  const endpoint = dialog?.dataset.endpoint
  if (!dialog || !panel || !scrim || !morph || !form || !status || !endpoint) return

  let opener: HTMLElement | null = null
  let openedAt = 0
  let motion: gsap.core.Timeline | null = null
  let closing = false

  const state = () => dialog.dataset.state as State
  const setState = (next: State) => (dialog.dataset.state = next)
  // The rising-in pieces of whichever view is showing (form or "sent").
  const steps = () =>
    [...panel.querySelectorAll<HTMLElement>('[data-message-step]')].filter((el) => el.offsetParent !== null)

  /** The visible box of the thing that opened the box: a pill's background, or the link itself. */
  const openerBox = () => {
    if (!opener?.isConnected) return null
    const shape = opener.querySelector<HTMLElement>('.btn__bg') ?? opener
    const rect = shape.getBoundingClientRect()
    if (!rect.width || rect.bottom < 0 || rect.top > innerHeight) return null
    const style = getComputedStyle(shape)
    const filled = style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent'
    return {
      rect,
      color: filled ? style.backgroundColor : getComputedStyle(document.documentElement).getPropertyValue('--c-silver'),
      radius: filled ? style.borderRadius : '0.4em',
    }
  }
  const panelRadius = () => getComputedStyle(panel).borderRadius
  const placeMorph = (rect: DOMRect, color: string, radius: string) =>
    gsap.set(morph, {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      backgroundColor: color,
      borderRadius: radius,
      autoAlpha: 1,
    })

  const resetForm = () => {
    form.reset()
    updateCount()
    status.textContent = ''
    setState('idle')
  }

  const open = (from: HTMLElement) => {
    if (dialog.open) return
    opener = from
    if (state() === 'sent' || state() === 'error') resetForm()
    motion?.kill()
    closing = false
    gsap.set([panel, scrim], { autoAlpha: 0 })
    gsap.set(steps(), { clearProps: 'all' })
    gsap.set(morph, { autoAlpha: 0 })
    dialog.showModal()
    openedAt = performance.now()
    lenis?.stop()

    const source = openerBox()
    if (!source) {
      motion = gsap.timeline().to([scrim, panel], { autoAlpha: 1, duration: 0.25, ease: 'power1.out' })
      return
    }
    const target = panel.getBoundingClientRect()
    const silver = getComputedStyle(panel).backgroundColor
    placeMorph(source.rect, source.color, source.radius)
    motion = gsap
      .timeline()
      .to(scrim, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, 0)
      .to(
        morph,
        {
          x: target.left,
          y: target.top,
          width: target.width,
          height: target.height,
          backgroundColor: silver,
          borderRadius: panelRadius(),
          duration: 0.75,
          ease: 'house',
        },
        0,
      )
      .set(panel, { autoAlpha: 1 }, 0.62)
      .to(morph, { autoAlpha: 0, duration: 0.18 }, 0.64)
      .fromTo(
        steps(),
        { y: 22, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.6, ease: 'power3.out', stagger: 0.05 },
        0.58,
      )
  }

  const close = () => {
    if (!dialog.open || closing) return
    closing = true
    motion?.kill()
    const finish = () => {
      dialog.close()
      gsap.set(morph, { autoAlpha: 0 })
      closing = false
    }
    const destination = openerBox()
    if (!destination) {
      motion = gsap.timeline({ onComplete: finish }).to([panel, scrim], { autoAlpha: 0, duration: 0.2 })
      return
    }
    const from = panel.getBoundingClientRect()
    placeMorph(from, getComputedStyle(panel).backgroundColor, panelRadius())
    gsap.set(morph, { autoAlpha: 0 })
    motion = gsap
      .timeline({ onComplete: finish })
      .to(steps(), { y: 12, autoAlpha: 0, duration: 0.14, ease: 'power2.in', stagger: 0.015 }, 0)
      .set(morph, { autoAlpha: 1 }, 0.12)
      .set(panel, { autoAlpha: 0 }, 0.13)
      .to(
        morph,
        {
          x: destination.rect.left,
          y: destination.rect.top,
          width: destination.rect.width,
          height: destination.rect.height,
          backgroundColor: destination.color,
          borderRadius: destination.radius,
          duration: 0.45,
          ease: 'expo.inOut',
        },
        0.12,
      )
      .to(scrim, { autoAlpha: 0, duration: 0.35, ease: 'power2.inOut' }, 0.2)
      .to(morph, { autoAlpha: 0, duration: 0.12 }, 0.5)
  }

  /** Swaps the panel to another view, easing its height from the old to the new. */
  const swapView = (next: State, after?: () => void) => {
    const before = panel.offsetHeight
    setState(next)
    const height = panel.offsetHeight
    return gsap
      .timeline({ onComplete: after })
      .fromTo(panel, { height: before }, { height, duration: 0.55, ease: 'expo.out', clearProps: 'height' }, 0)
      .fromTo(
        steps(),
        { y: 22, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.6, ease: 'power3.out', stagger: 0.06 },
        0.1,
      )
  }

  /** The send succeeded: sweep the panel in blue, show "Message sent" under it, draw the tick. */
  const showSent = () => {
    status.textContent = ''
    const done = () => panel.querySelector<HTMLElement>('[data-message-sent] [data-message-close]')?.focus()
    if (!sweep) {
      swapView('sent', done)
      return
    }
    const tick = panel.querySelector<SVGPathElement>('.msg__tick path')
    motion = gsap
      .timeline()
      .set(sweep, { drawSVG: '0% 0%', strokeWidth: 30 })
      .to(sweep, { drawSVG: '0% 100%', strokeWidth: 260, duration: 0.7, ease: 'power2.in' })
      .add(() => {
        swapView('sent', done)
        if (tick) gsap.fromTo(tick, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 0.6, delay: 0.35, ease: 'power2.out' })
      })
      .to(sweep, { drawSVG: '100% 100%', strokeWidth: 30, duration: 0.65, ease: 'power2.out' })
      .set(sweep, { strokeWidth: 0 })
  }

  const shake = () => {
    gsap.fromTo(panel, { x: 0 }, { keyframes: { x: [-9, 8, -5, 3, 0] }, duration: 0.42, ease: 'power2.out' })
  }

  dialog.addEventListener('close', () => {
    lenis?.start()
    gsap.set([panel, scrim, ...steps()], { clearProps: 'all' })
    opener?.focus({ preventScroll: true })
  })
  // Esc runs the same animated close instead of the instant default.
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault()
    close()
  })
  document.addEventListener('click', (event) => {
    const trigger = (event.target as Element | null)?.closest<HTMLElement>('[data-open-message]')
    if (!trigger) return
    event.preventDefault()
    open(trigger)
  })
  dialog.querySelectorAll('[data-message-close]').forEach((button) => button.addEventListener('click', close))
  scrim.addEventListener('click', close)
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close()
  })
  dialog.querySelector('[data-message-again]')?.addEventListener('click', () => {
    form.reset()
    updateCount()
    status.textContent = ''
    swapView('idle', () => form.querySelector<HTMLInputElement>('input[name="name"]')?.focus())
    openedAt = performance.now()
  })

  const message = form.querySelector<HTMLTextAreaElement>('textarea[name="message"]')
  const updateCount = () => {
    if (count && message) count.textContent = `${message.value.length} / ${message.maxLength}`
  }
  message?.addEventListener('input', updateCount)

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    if (state() === 'sending') return
    if (!form.reportValidity()) {
      shake()
      return
    }

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
    status.textContent = ''
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = await response.json().catch(() => ({ ok: false }))
      if (!response.ok || !result.ok) throw new Error(result.error || 'The message could not be sent.')
      showSent()
    } catch (error) {
      setState('error')
      const reason =
        error instanceof Error && error.message !== 'Failed to fetch' ? error.message : 'The message could not be sent.'
      status.replaceChildren(`${reason} `, emailFallback())
      shake()
    }
  })
}

/** "Or email me instead", using the address the contact links were filled with. */
function emailFallback() {
  const email = document.querySelector<HTMLAnchorElement>('a[data-contact="email"][href^="mailto:"]')
  const link = document.createElement('a')
  link.href = email?.href ?? '#contact'
  link.textContent = 'Or email me instead.'
  return link
}
