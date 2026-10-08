import { gsap, select } from './core'

/**
 * The hero background drifts down slower than the page scrolls. Wide screens only. Linear on
 * purpose: depth only reads as real when the layers move in proportion to the scroll.
 */
export function initParallax(scope: ParentNode) {
  select(scope, '[data-parallax]').forEach((trigger) => {
    const target = trigger.querySelector<HTMLElement>('[data-parallax-target]') ?? trigger
    gsap.matchMedia().add('(min-width: 992px)', () => {
      gsap.fromTo(
        target,
        { yPercent: 0 },
        { yPercent: 40, ease: 'none', scrollTrigger: { trigger, start: 'top top', end: 'bottom top', scrub: true } },
      )
    })
  })
}
