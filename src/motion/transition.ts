import { gsap } from './core'

/**
 * Page transitions with the curtain (PageCurtain.astro). Clicking a link to another page of this
 * site (home or a write-up) sweeps the blue scribble over the screen, then navigates; the next
 * page opens covered and pulls it away. Links to other sites, new tabs and in-page anchors are
 * left alone.
 */
const curtain = () => document.querySelector<HTMLElement>('[data-curtain]')
const pathOf = (el: HTMLElement | null) => el?.querySelector<SVGPathElement>('[data-curtain-path]') ?? null

/** Pulls the curtain away. Resolves once the page is uncovered. */
export function uncover(): Promise<void> {
  const el = curtain()
  const path = pathOf(el)
  if (!el || !path) return Promise.resolve()
  el.style.animation = 'none'
  return new Promise((resolve) => {
    gsap
      .timeline({
        onComplete: () => {
          gsap.set(el, { visibility: 'hidden' })
          resolve()
        },
      })
      .set(el, { visibility: 'visible' })
      .set(path, { drawSVG: '0% 100%', strokeWidth: '80%' })
      .to(path, { drawSVG: '100% 100%', strokeWidth: '5%', duration: 1.1, ease: 'power2.inOut' })
  })
}

/** Sweeps the curtain over the screen. Resolves once it's solid. */
function cover(): Promise<void> {
  const el = curtain()
  const path = pathOf(el)
  if (!el || !path) return Promise.resolve()
  el.style.animation = 'none'
  return new Promise((resolve) => {
    gsap
      .timeline({ onComplete: resolve })
      .set(el, { visibility: 'visible' })
      .fromTo(
        path,
        { drawSVG: '0% 0%', strokeWidth: '5%' },
        { drawSVG: '0% 100%', strokeWidth: '80%', duration: 0.75, ease: 'power2.in' },
      )
  })
}

/** Only the site's own pages get the transition: home and the project write-ups. */
const isPage = (url: URL) => url.origin === location.origin && /^\/($|projects\/[^/]+\/?$)/.test(url.pathname)

export function initPageTransitions() {
  let leaving = false
  document.addEventListener('click', (event) => {
    if (leaving || event.defaultPrevented || event.button !== 0) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href]')
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return
    const url = new URL(link.href, location.href)
    if (!isPage(url)) return
    // A jump within this page is the anchors' job.
    if (url.pathname === location.pathname && url.hash) return
    event.preventDefault()
    leaving = true
    cover().then(() => location.assign(url.href))
  })
  // Coming back with the back button can restore this page as it was left: covered.
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return
    leaving = false
    const el = curtain()
    if (el) gsap.set(el, { visibility: 'hidden' })
  })
}
