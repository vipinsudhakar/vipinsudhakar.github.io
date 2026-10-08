import { gsap } from './core'

/**
 * Shrinks the full-width wordmark into the header's corner as the hero scrolls away, by running
 * the --p variable that Header.astro's CSS turns into width and offset. Past the hero, the
 * wordmark becomes a back-to-top link.
 */
export function initLogoScroll() {
  const brand = document.querySelector<HTMLElement>('[data-brand]')
  const hero = document.querySelector<HTMLElement>('[data-hero]')
  if (!brand || !hero) return
  const compact = (on: boolean) => brand.classList.toggle('is-compact', on)

  gsap.fromTo(
    brand,
    { '--p': 0 },
    {
      '--p': 1,
      ease: 'scroll',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
        onLeave: () => compact(true),
        onEnterBack: () => compact(false),
      },
    },
  )
}
