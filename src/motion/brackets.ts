import { gsap, select } from './core'

/** The [ brackets ] of a BracketHeading slide in from either side as it scrolls up the screen. */
export function initBrackets(scope: ParentNode) {
  select(scope, '[data-bracket]').forEach((heading) => {
    const left = heading.querySelector('[data-bracket-l]')
    const right = heading.querySelector('[data-bracket-r]')
    if (!left || !right) return
    // Inside a pinned transition the heading stops moving before it reaches 40%,
    // so there the brackets close as the pin begins instead.
    const pinned = heading.closest<HTMLElement>('[data-scroll-draw]')
    gsap
      .timeline({
        scrollTrigger: {
          trigger: pinned ?? heading,
          start: 'top bottom',
          end: pinned ? 'top top' : 'top 40%',
          scrub: true,
        },
      })
      .fromTo(left, { xPercent: -160 }, { xPercent: 0, ease: 'scroll' }, 0)
      .fromTo(right, { xPercent: 160 }, { xPercent: 0, ease: 'scroll' }, 0)
  })
}
