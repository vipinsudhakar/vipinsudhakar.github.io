import { gsap, reducedMotion, ScrollTrigger } from './core'

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

  if (reducedMotion) {
    // No shrinking: the hero shows a static masthead instead, so keep the corner logo out of the
    // way until that masthead has scrolled off.
    brand.style.setProperty('--p', '1')
    compact(true)
    const mark = hero.querySelector<HTMLElement>('.hero__mark')
    if (mark) {
      brand.classList.add('is-hidden')
      ScrollTrigger.create({
        trigger: mark,
        start: 'bottom top',
        onEnter: () => brand.classList.remove('is-hidden'),
        onLeaveBack: () => brand.classList.add('is-hidden'),
      })
    }
    return
  }
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
