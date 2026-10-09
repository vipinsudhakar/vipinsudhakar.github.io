import type Lenis from 'lenis'
import { gsap, ScrollTrigger, select } from './core'

/**
 * Each lane rolls round once in about this many seconds, so even the longest group passes fully
 * through view while you watch (within a readable speed range, px per second).
 */
const LOOP_SECONDS = 18
const SPEED = { min: 45, max: 95 }

/**
 * The Toolkit (markup in Toolkit.astro): every group is a rolling bar, alternate lanes running
 * opposite ways, carrying each tool through view. Scrolling speeds them up, skews them a little
 * and, scrolling back up, reverses them; hovering a lane slows it so a tool can be read.
 *
 * Without JS it stays the plain spec sheet.
 */
export function initToolkit(scope: ParentNode, lenis: Lenis | null) {
  select(scope, '[data-toolkit]').forEach((stage) => setUp(stage, lenis))
}

type Lane = {
  el: HTMLElement
  track: HTMLElement
  originals: HTMLElement[]
  clones: HTMLElement[]
  dir: 1 | -1
  x: number
  width: number
  speed: number
  /** What was last written, so a lane that hasn't moved isn't restyled every frame. */
  shown: { x: number; skew: number }
  hover: number
  hoverTarget: number
  setX: (value: number) => void
  setSkew: (value: number) => void
}

function setUp(stage: HTMLElement, lenis: Lenis | null) {
  const laneEls = [...stage.querySelectorAll<HTMLElement>('[data-toolkit-lane]')]
  if (!laneEls.length) return
  stage.classList.add('is-lanes')

  // Each lane repeats its tools enough times to cover the widest window, plus one set to roll into.
  const lanes: Lane[] = laneEls.map((el, i) => {
    const track = el.querySelector<HTMLElement>('[data-toolkit-track]')!
    const view = el.querySelector<HTMLElement>('[data-toolkit-window]')!
    const originals = [...track.children] as HTMLElement[]
    const copies = Math.max(1, Math.ceil(Math.max(view.offsetWidth, screen.width) / Math.max(track.scrollWidth, 1)))
    const clones: HTMLElement[] = []
    for (let c = 0; c < copies; c++) {
      for (const tool of originals) {
        const clone = tool.cloneNode(true) as HTMLElement
        clone.setAttribute('aria-hidden', 'true')
        track.append(clone)
        clones.push(clone)
      }
    }
    return {
      el,
      track,
      originals,
      clones,
      dir: i % 2 === 0 ? -1 : 1,
      x: 0,
      width: 0,
      speed: SPEED.min,
      shown: { x: NaN, skew: NaN },
      hover: 1,
      hoverTarget: 1,
      setX: gsap.quickSetter(track, 'x', 'px') as (value: number) => void,
      setSkew: gsap.quickSetter(track, 'skewX', 'deg') as (value: number) => void,
    }
  })
  // One set's width, gap included: where the first copy starts.
  const measure = () =>
    lanes.forEach((lane) => {
      lane.width = lane.clones[0].offsetLeft - lane.originals[0].offsetLeft
      lane.speed = gsap.utils.clamp(SPEED.min, SPEED.max, lane.width / LOOP_SECONDS)
    })
  measure()

  let velocity = 0
  const roll = (_time: number, deltaMs: number) => {
    const dt = Math.min(deltaMs, 64) / 1000
    velocity += ((lenis?.velocity ?? 0) - velocity) * 0.08
    const boost = 1 + Math.min(Math.abs(velocity) * 0.35, 6)
    const heading = velocity < -0.3 ? -1 : 1
    const skew = gsap.utils.clamp(-7, 7, velocity * -0.5)
    for (const lane of lanes) {
      lane.hover += (lane.hoverTarget - lane.hover) * 0.08
      lane.x += lane.dir * heading * lane.speed * boost * lane.hover * dt
      if (lane.x <= -lane.width) lane.x += lane.width
      else if (lane.x > 0) lane.x -= lane.width
      if (Math.abs(lane.x - lane.shown.x) > 0.01 || Number.isNaN(lane.shown.x)) lane.setX((lane.shown.x = lane.x))
      if (Math.abs(skew - lane.shown.skew) > 0.01 || Number.isNaN(lane.shown.skew)) lane.setSkew((lane.shown.skew = skew))
    }
  }
  // Only roll while the stage is on screen.
  ScrollTrigger.create({
    trigger: stage,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: ({ isActive }) => (isActive ? gsap.ticker.add(roll) : gsap.ticker.remove(roll)),
  })

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    for (const lane of lanes) {
      lane.el.addEventListener('pointerenter', () => (lane.hoverTarget = 0.12))
      lane.el.addEventListener('pointerleave', () => (lane.hoverTarget = 1))
    }
  }
  new ResizeObserver(() => {
    measure()
    for (const lane of lanes) lane.x = lane.width ? lane.x % lane.width : 0
  }).observe(stage)
}
