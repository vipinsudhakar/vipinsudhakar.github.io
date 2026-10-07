import { gsap, reducedMotion, select } from './core'

/**
 * The footer stays put while the page above slides off it, so it looks revealed from underneath.
 * It moves down exactly as fast as its wrapper scrolls up, so this one stays linear: any curve
 * would make it drift. Tablet width and up.
 */
export function initFooterReveal(scope: ParentNode) {
  if (reducedMotion) return
  select(scope, '[data-footer]').forEach((wrap) => {
    const inner = wrap.querySelector<HTMLElement>('[data-footer-inner]')
    if (!inner) return
    gsap.matchMedia().add('(min-width: 768px)', () => {
      gsap.from(inner, {
        yPercent: -100,
        ease: 'none',
        scrollTrigger: { trigger: wrap, start: 'clamp(top bottom)', end: 'clamp(top top)', scrub: true },
      })
    })
  })
}
