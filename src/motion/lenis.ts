import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { gsap, ScrollTrigger } from './core'

/** Smooth scrolling, driven by GSAP's ticker so ScrollTrigger and Lenis stay in step. */
export function initLenis(): Lenis {
  const lenis = new Lenis({ lerp: 0.15, wheelMultiplier: 1.2 })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
  return lenis
}

/** Ease for scrolls the page starts itself: anchors and back to top. */
export const easeInOutQuart = (t: number) => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2)
