import { gsap, select, SplitText } from './core'

/** Letters roll up into place in 3D, one after another, as the text scrolls into view. */
export function initSplitRolling(scope: ParentNode) {
  select(scope, '[data-split-rolling]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines, chars',
      mask: 'lines',
      autoSplit: true,
      onSplit(self) {
        const depth = 0.6 * parseFloat(getComputedStyle(el).fontSize)
        gsap.set(self.lines, { perspective: 500 })
        return gsap.from(self.chars, {
          rotationX: -110,
          z: -depth,
          y: depth,
          opacity: 0,
          transformOrigin: `50% 50% -${depth}px`,
          duration: 0.8,
          ease: 'power4.out',
          stagger: 0.03,
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        })
      },
    })
  })
}

/** Lines slide up out of a mask, one after another. */
export function initSplitLines(scope: ParentNode) {
  select(scope, '[data-split-lines]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit(self) {
        return gsap.from(self.lines, {
          yPercent: 110,
          duration: 0.8,
          ease: 'power4.out',
          stagger: 0.1,
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        })
      },
    })
  })
}

/** Letters start scattered, turned and blurred, and gather into the word as you scroll. */
export function initSplitRandom(scope: ParentNode) {
  select(scope, '[data-split-random]').forEach((el) => {
    SplitText.create(el, {
      type: 'chars',
      autoSplit: true,
      onSplit(self) {
        const spread = Math.min(
          3 * parseFloat(getComputedStyle(el).fontSize),
          0.2 * Math.min(window.innerWidth, window.innerHeight),
        )
        const random = gsap.utils.random
        return gsap.fromTo(
          self.chars,
          {
            x: () => random(-spread, spread),
            y: () => random(-spread, spread),
            rotation: () => random(-90, 90),
            scale: () => random(0.5, 1.4),
            filter: 'blur(8px)',
          },
          {
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            filter: 'blur(0px)',
            ease: 'scroll',
            stagger: { each: 0.03, from: 'random' },
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 30%', scrub: true },
          },
        )
      },
    })
  })
}
