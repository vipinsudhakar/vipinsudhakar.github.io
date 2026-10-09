import type Lenis from 'lenis'
import { gsap, ScrollTrigger, select } from './core'

/**
 * Once sorted, each lane rolls round once in about this many seconds, so even the longest group
 * passes fully through view while you watch (within a readable speed range, px per second).
 * Scrolling speeds it up; hovering a lane slows it right down.
 */
const LOOP_SECONDS = 18
const SPEED = { min: 45, max: 95 }

/**
 * The Toolkit's scroll moment (markup in Toolkit.astro).
 *
 * 1. Chaos: the tools hang scattered through 3D space as the stage arrives.
 * 2. Order: scrolling flies every tool into its group's lane, lane by lane, while the count climbs
 *    to the total. It starts as the stage rises and finishes pinned. The scroll curve shapes
 *    each flight.
 * 3. Roll: once all have landed, each lane picks up speed into a rolling bar (alternate lanes run
 *    opposite ways) that carries every tool through view. Scrolling speeds them up, skews them a
 *    little and, scrolling back up, reverses them; hovering a lane slows it so a tool can be read.
 *
 * Without JS it stays the plain spec sheet.
 */
export function initToolkit(scope: ParentNode, lenis: Lenis | null) {
  select(scope, '[data-toolkit]').forEach((stage) => setUp(stage, lenis))
}

type Lane = {
  el: HTMLElement
  track: HTMLElement
  name: HTMLElement
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
  const counter = stage.querySelector<HTMLElement>('[data-toolkit-count]')
  const laneEls = [...stage.querySelectorAll<HTMLElement>('[data-toolkit-lane]')]
  if (!laneEls.length) return
  stage.classList.add('is-lanes')
  const total = Number(counter?.textContent ?? 0)

  // Each lane repeats its tools enough times to cover the widest window, plus one set to drift into.
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
      name: el.querySelector<HTMLElement>('[data-toolkit-name]')!,
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
  gsap.set(lanes.flatMap((lane) => lane.clones), { autoAlpha: 0 })

  // --- 1 & 2: scattered through space, then sorted into lanes by the scroll.
  const random = gsap.utils.random
  const stageBox = stage.getBoundingClientRect()
  const tl = gsap.timeline({ defaults: { ease: 'scroll' } })
  lanes.forEach((lane, li) => {
    tl.fromTo(lane.name, { autoAlpha: 0, x: -28 }, { autoAlpha: 1, x: 0, duration: 0.35 }, li * 0.1)
    lane.originals.forEach((tool, ti) => {
      const box = tool.getBoundingClientRect()
      // A random spot on the stage, as an offset from where the tool will land.
      const x = stageBox.left + random(0.03, 0.97) * stageBox.width - (box.left + box.width / 2)
      const y = stageBox.top + random(0.1, 0.9) * stageBox.height - (box.top + box.height / 2)
      tl.fromTo(
        tool,
        {
          x,
          y,
          z: random(-950, 220),
          rotation: random(-45, 45),
          rotationX: random(-50, 50),
          scale: random(0.55, 1.15),
          autoAlpha: random(0.18, 0.6),
        },
        { x: 0, y: 0, z: 0, rotation: 0, rotationX: 0, scale: 1, autoAlpha: 1, duration: 0.6 },
        li * 0.1 + ti * 0.012 + random(0, 0.12),
      )
    })
  })
  if (counter) {
    const tally = { n: 0 }
    tl.fromTo(
      tally,
      { n: 0 },
      {
        n: total,
        duration: tl.duration(),
        ease: 'power1.in',
        onUpdate: () => void (counter.textContent = String(Math.round(tally.n)).padStart(2, '0')),
      },
      0,
    )
  }

  // --- 3: drift, once everything has landed.
  let sorted = false
  let settle: gsap.core.Tween | null = null
  // 0 to 1: how far the lanes have picked up speed since they landed.
  const roll = { amount: 0 }
  const setSorted = (on: boolean) => {
    if (on === sorted) return
    sorted = on
    stage.classList.toggle('is-sorted', on)
    const clones = lanes.flatMap((lane) => lane.clones)
    gsap.to(clones, { autoAlpha: on ? 1 : 0, duration: on ? 0.5 : 0.2, overwrite: true })
    gsap.to(roll, { amount: on ? 1 : 0, duration: on ? 1.4 : 0.2, ease: on ? 'power2.in' : 'none', overwrite: true })
    if (!on) {
      // Heading back into the sort: glide the lanes home first so the tools fly from their places.
      settle?.kill()
      const from = lanes.map((lane) => lane.x)
      const glide = { t: 0 }
      settle = gsap.to(glide, {
        t: 1,
        duration: 0.45,
        ease: 'power3.out',
        onUpdate: () => lanes.forEach((lane, i) => (lane.x = from[i] * (1 - glide.t))),
      })
    }
  }

  const pinLength = () => (window.innerWidth < 768 ? 1.1 : 1.5) * window.innerHeight
  ScrollTrigger.create({
    trigger: stage,
    start: 'top top',
    end: () => `+=${pinLength()}`,
    pin: true,
    // The section is a flex column, where GSAP leaves pin spacing off unless asked.
    pinSpacing: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
  })
  // The tools start flying while the stage is still rising into place, so the sort is already
  // moving when it pins; it ends with the pin.
  const lead = 0.35
  ScrollTrigger.create({
    animation: tl,
    trigger: stage,
    start: `top ${lead * 100}%`,
    end: () => `+=${pinLength() + lead * window.innerHeight}`,
    scrub: 0.5,
    invalidateOnRefresh: true,
    onUpdate: (self) => setSorted(self.progress > 0.985),
  })

  let velocity = 0
  const drift = (_time: number, deltaMs: number) => {
    const dt = Math.min(deltaMs, 64) / 1000
    velocity += ((lenis?.velocity ?? 0) - velocity) * 0.08
    const boost = 1 + Math.min(Math.abs(velocity) * 0.35, 6)
    const heading = velocity < -0.3 ? -1 : 1
    const skew = sorted ? gsap.utils.clamp(-7, 7, velocity * -0.5) : 0
    for (const lane of lanes) {
      lane.hover += (lane.hoverTarget - lane.hover) * 0.08
      if (sorted && !settle?.isActive()) {
        lane.x += lane.dir * heading * lane.speed * roll.amount * boost * lane.hover * dt
        if (lane.x <= -lane.width) lane.x += lane.width
        else if (lane.x > 0) lane.x -= lane.width
      }
      if (Math.abs(lane.x - lane.shown.x) > 0.01 || Number.isNaN(lane.shown.x)) lane.setX((lane.shown.x = lane.x))
      if (Math.abs(skew - lane.shown.skew) > 0.01 || Number.isNaN(lane.shown.skew)) lane.setSkew((lane.shown.skew = skew))
    }
  }
  // Only tick while the stage is on screen. The trigger is the pin's spacer, not the stage: the
  // stage measures as if never pinned, so its 'bottom top' would come before the pin even ends.
  ScrollTrigger.create({
    trigger: stage.parentElement ?? stage,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: ({ isActive }) => (isActive ? gsap.ticker.add(drift) : gsap.ticker.remove(drift)),
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
