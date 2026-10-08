import { gsap, reducedMotion, select } from './core'

/** Items in a [data-reveal-group] rise into place one after another when the group scrolls in. */
export function initReveal(scope: ParentNode) {
  if (reducedMotion) return
  select(scope, '[data-reveal-group]').forEach((group) => {
    gsap.from(group.querySelectorAll('[data-reveal-item]'), {
      y: 14,
      autoAlpha: 0,
      duration: 0.6,
      ease: 'power3.out',
      stagger: 0.025,
      scrollTrigger: { trigger: group, start: 'top 88%', once: true },
    })
  })
}
