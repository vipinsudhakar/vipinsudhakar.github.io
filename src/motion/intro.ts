import { gsap } from './core'

/** Plays the load intro (see Intro.astro). Resolves once the page is uncovered. */
export function playIntro(): Promise<void> {
  const intro = document.querySelector<HTMLElement>('[data-intro]')
  const reveal = document.querySelectorAll<HTMLElement>('[data-intro-reveal]')
  const scribble = intro?.querySelector<SVGPathElement>('[data-intro-scribble]')

  if (!intro || !scribble) {
    intro?.remove()
    gsap.set(reveal, { autoAlpha: 1 })
    return Promise.resolve()
  }
  // The scripts are running, so the CSS failsafe that hides the overlay isn't needed.
  intro.style.animation = 'none'

  const signature = intro.querySelector<SVGSVGElement>('[data-intro-signature]')
  const strokes = signature ? [...signature.querySelectorAll('path')] : []
  const uncover = { drawSVG: '100% 100%', strokeWidth: '5%', duration: 1.25, ease: 'power1.inOut' }

  return new Promise((resolve) => {
    const tl = gsap.timeline({
      onComplete: () => {
        intro.remove()
        resolve()
      },
    })
    tl.set(scribble, { drawSVG: '0% 100%', strokeWidth: '80%' })

    if (signature && strokes.length) {
      // Write each stroke in turn, longer strokes taking a little longer, then rub it out.
      const lengths = strokes.map((stroke) => stroke.getTotalLength())
      const longest = Math.max(...lengths)
      tl.set(strokes, { drawSVG: '0% 0%' }).set(signature, { autoAlpha: 1 })
      strokes.forEach((stroke, i) => {
        const duration = gsap.utils.mapRange(0, longest, 0.25, 0.5, lengths[i])
        tl.to(stroke, { drawSVG: '0% 100%', duration, ease: 'none' })
      })
      tl.to({}, { duration: 0.35 })
      tl.to(strokes, { drawSVG: '100% 100%', duration: 0.8, stagger: 0.03, ease: 'power2.inOut' })
      tl.to(scribble, uncover, '<0.35')
    } else {
      tl.to(scribble, uncover, 0.45)
    }

    tl.fromTo(
      reveal,
      { yPercent: 25, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, duration: 1, stagger: 0.15, ease: 'expo.out' },
      '<0.15',
    )
  })
}
