import { gsap, reducedMotion, select } from './core'
import { refreshNavTheme } from './theme-nav'

/**
 * Pins the section while a scribble draws across it and its stroke swells until the screen is
 * solid blue, handing over to the blue section that follows (see SkillsIntro.astro).
 */
export function initScrollDraw(scope: ParentNode) {
  select(scope, '[data-scroll-draw]').forEach((wrap) => {
    const content = wrap.querySelector<HTMLElement>('[data-scroll-draw-content]')
    const overlay = wrap.querySelector<HTMLElement>('[data-scroll-draw-overlay]')
    const paths = overlay?.querySelectorAll('path')
    if (!content || !overlay || !paths?.length) return
    if (reducedMotion) {
      overlay.hidden = true
      return
    }

    const fit = () => void gsap.set(wrap, { height: Math.max(content.scrollHeight, window.innerHeight) })
    fit()
    gsap.set(paths, { drawSVG: '0% 0%', strokeWidth: '5%' })
    gsap
      .timeline({
        scrollTrigger: {
          trigger: wrap,
          start: 'top top',
          end: '+=200%',
          scrub: true,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefreshInit: fit,
          // Light header text once the blue has covered the top of the screen.
          onUpdate: ({ progress }) => {
            const theme = progress > 0.35 ? 'light' : 'dark'
            if (wrap.dataset.theme !== theme) {
              wrap.dataset.theme = theme
              refreshNavTheme()
            }
          },
        },
      })
      .to(paths, { drawSVG: '0% 85%', duration: 1, ease: 'scroll' }, 0)
      .to(paths, { strokeWidth: '80%', duration: 0.75, ease: 'scroll' }, 0.25)
  })
}
