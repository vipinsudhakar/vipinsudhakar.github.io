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
 * effect picks up quickly and then settles slowly as it nears its end. Every scrubbed animation
 * uses it (except the parallax and the footer reveal, which must track the scroll exactly), so
 * retune the feel of them all here.
 */
CustomEase.create('scroll', '0.4, 0, 0.2, 1')

export const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches

/** Elements matching the selector inside scope, including scope itself. */
export function select<T extends HTMLElement = HTMLElement>(scope: ParentNode, selector: string): T[] {
  const found = [...scope.querySelectorAll<T>(selector)]
  return scope instanceof HTMLElement && scope.matches(selector) ? [scope as T, ...found] : found
}

export { gsap, ScrollTrigger, SplitText }
