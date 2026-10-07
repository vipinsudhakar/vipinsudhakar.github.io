import { initAnchors, scrollToHash } from './anchors'
import { initBrackets } from './brackets'
import { initButtons } from './buttons'
import { initContactLinks, initYear } from './contact'
import { initContactWords } from './contact-words'
import { reducedMotion, ScrollTrigger } from './core'
import { initExpertise } from './expertise'
import { initFooterReveal } from './footer'
import { playIntro } from './intro'
import { initLenis } from './lenis'
import { initLogoScroll } from './logo-scroll'
import { initOrbit } from './orbit'
import { initParallax } from './parallax'
import { initScrollDraw } from './scroll-draw'
import { initSplitLines, initSplitRandom, initSplitRolling } from './split'
import { initThemeNav } from './theme-nav'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function boot() {
  window.scrollTo(0, 0)
  initContactLinks()
  initYear()
  initButtons()

  // Text splitting measures lines, so let the webfont arrive first (but don't hang on it).
  await Promise.race([document.fonts.ready, wait(2500)])

  const lenis = reducedMotion ? null : initLenis()
  lenis?.stop()
  initThemeNav()
  initLogoScroll()

  // Section by section, top to bottom, so every scroll effect is measured after the pinned
  // sections above it have added their scroll distance.
  for (const section of document.querySelectorAll<HTMLElement>('.main > *')) {
    initParallax(section)
    initScrollDraw(section)
    initSplitRolling(section)
    initSplitLines(section)
    initBrackets(section)
    initExpertise(section)
    initOrbit(section)
    initSplitRandom(section)
    initContactWords(section)
    initFooterReveal(section)
  }
  initAnchors(lenis)
  ScrollTrigger.refresh()

  await playIntro()
  lenis?.start()
  if (location.hash) scrollToHash(location.hash, lenis)
}

boot()
window.addEventListener('load', () => ScrollTrigger.refresh())
