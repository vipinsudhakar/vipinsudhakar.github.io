import type Lenis from 'lenis'
import { easeInOutQuart } from './lenis'

/** Scrolls to #id (or the very top for #top). Returns false if there is nothing to scroll to. */
export function scrollToHash(hash: string, lenis: Lenis | null): boolean {
  const target = hash === '#top' ? null : document.querySelector<HTMLElement>(hash)
  if (hash !== '#top' && !target) return false
  if (lenis) lenis.scrollTo(target ?? 0, { duration: 1.2, easing: easeInOutQuart })
  else if (target) target.scrollIntoView({ behavior: 'smooth' })
  else window.scrollTo({ top: 0, behavior: 'smooth' })
  return true
}

/** In-page links marked data-anchor scroll smoothly instead of jumping. */
export function initAnchors(lenis: Lenis | null) {
  document.addEventListener('click', (event) => {
    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[data-anchor]')
    const hash = link?.getAttribute('href')
    if (!hash?.startsWith('#')) return
    if (scrollToHash(hash, lenis)) {
      event.preventDefault()
      history.replaceState(null, '', hash === '#top' ? location.pathname : hash)
    }
  })
}
