import { finePointer, gsap, reducedMotion } from './core'

/**
 * On mouse hover a pill button gets scribbled full of its hover colour; on leave the stroke runs
 * off the end. Touch screens and reduced motion keep the plain colour swap from Button.astro.
 */
export function initButtons() {
  if (!finePointer || reducedMotion) return
  document.querySelectorAll<HTMLElement>('[data-btn]').forEach((button) => {
    const path = button.querySelector<SVGPathElement>('.btn__ink path')
    if (!path) return
    button.dataset.inkable = ''
    gsap.set(path, { drawSVG: '0% 0%', strokeWidth: 0 })
    let tween: gsap.core.Tween | null = null

    const fill = () => {
      // Start a fresh stroke from the left, unless the last one is still running off.
      if (!tween?.isActive()) gsap.set(path, { drawSVG: '0% 0%', strokeWidth: 0 })
      tween?.kill()
      button.classList.add('is-inked')
      tween = gsap.to(path, { drawSVG: '0% 100%', strokeWidth: 60, duration: 0.8, ease: 'ink' })
    }
    const clear = () => {
      tween?.kill()
      button.classList.remove('is-inked')
      tween = gsap.to(path, {
        drawSVG: '100% 100%',
        strokeWidth: 4,
        duration: 0.8,
        ease: 'ink',
        onComplete: () => void gsap.set(path, { strokeWidth: 0 }),
      })
    }

    button.addEventListener('pointerenter', fill)
    button.addEventListener('pointerleave', clear)
    button.addEventListener('focusin', () => button.matches(':focus-visible') && fill())
    button.addEventListener('focusout', clear)
  })
}
