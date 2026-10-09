import { initAnchors, scrollToHash } from './anchors'
import { initBrackets } from './brackets'
import { initButtons } from './buttons'
import { initContactLinks, initYear } from './contact'
import { initContactWords } from './contact-words'
import { ScrollTrigger } from './core'
import { initExpertise } from './expertise'
import { initFooterReveal } from './footer'
import { playIntro, startLoader } from './intro'
import { initLenis } from './lenis'
import { initLogoScroll } from './logo-scroll'
import { initMessageBox } from './message'
import { initOrbit } from './orbit'
import { initParallax } from './parallax'
import { initScrollDraw } from './scroll-draw'
import { initSplitLines, initSplitRandom, initSplitRolling } from './split'
import { initThemeNav } from './theme-nav'
import { initToolkit } from './toolkit'
import { initScheme } from './scheme'
import { initPageTransitions } from './transition'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Set once the intro has played, so a reload in the same session gets the quick loader.
const SEEN = 'vs:intro-seen'
const seenIntro = () => {
  try {
    return sessionStorage.getItem(SEEN) === '1'
  } catch {
    return false
  }
}

const pageLoaded = () =>
  document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise<void>((resolve) => window.addEventListener('load', () => resolve(), { once: true }))

async function boot() {
  // The loader takes over from the blue first frame; scrolling stays locked (html.is-loading).
  const loader = startLoader({ quick: seenIntro() })
  initPageTransitions()
  initScheme()
  loader.set(24)
  window.scrollTo(0, 0)
  initContactLinks()
  initYear()
  initButtons()

  // Text splitting measures lines, so let the webfont arrive first (but don't hang on it).
  await Promise.race([document.fonts.ready, wait(2500)])
  loader.set(55)

  const lenis = initLenis()
  lenis.stop()
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
    initToolkit(section, lenis)
    initContactWords(section)
    initFooterReveal(section)
  }
  initAnchors(lenis)
  initMessageBox(lenis)
  ScrollTrigger.refresh()
  loader.set(85)

  await Promise.race([pageLoaded(), wait(4000)])
  ScrollTrigger.refresh()
  await loader.finish()
  window.scrollTo(0, 0)
  await playIntro()
  try {
    sessionStorage.setItem(SEEN, '1')
  } catch {
    // Storage blocked: every visit gets the full loader.
  }
  document.documentElement.classList.remove('is-loading')
  lenis.start()
  if (location.hash) scrollToHash(location.hash, lenis)
}

boot()
window.addEventListener('load', () => ScrollTrigger.refresh())
