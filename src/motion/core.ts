import { gsap } from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(CustomEase, DrawSVGPlugin, ScrollTrigger, SplitText)

/** Slow out of the blocks, long soft landing. Most UI motion uses it. */
CustomEase.create('house', '0.625, 0.05, 0, 1')
/** Quicker at both ends, like a marker stroke. The button scribbles use it. */
CustomEase.create('ink', '0.78, 0.18, 0.18, 1')
/**
 * How scroll-linked effects follow the scroll. Rather than moving in lockstep with the wheel, an
 * effect answers the first notch straight away (a little ahead of the scroll), then settles
 * gently as it nears its end. Neither end goes flat: a curve that starts or finishes at zero
 * speed leaves a stretch where you scroll and nothing moves. Most scrubbed effects use it.
 */
CustomEase.create('scroll', '0.18, 0.32, 0.36, 0.82')
/**
 * For scrubbed effects chained step after step (the Expertise panels): a soft S that eases into
 * and out of each step but never stops, so one step hands its speed to the next.
 */
CustomEase.create('scroll-step', '0.35, 0.15, 0.65, 0.85')

export const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches

/** Elements matching the selector inside scope, including scope itself. */
export function select<T extends HTMLElement = HTMLElement>(scope: ParentNode, selector: string): T[] {
  const found = [...scope.querySelectorAll<T>(selector)]
  return scope instanceof HTMLElement && scope.matches(selector) ? [scope as T, ...found] : found
}

export { gsap, ScrollTrigger, SplitText }
