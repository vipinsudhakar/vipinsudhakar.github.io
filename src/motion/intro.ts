import { gsap } from './core'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * The loader inside the intro overlay (Intro.astro): an odometer percentage and a progress line
 * that follow the real loading. Call `set` as stages finish. The count climbs in a few rolling
 * steps toward it, each digit turning forward like a mechanical counter. `finish` runs it to 100
 * (after a short minimum, so it never just flashes) and rolls it away.
 *
 * `quick` is for a visitor who has already seen it this session: no steps and no minimum, just one
 * roll to 100 once the page is ready.
 */
export function startLoader({ quick = false } = {}) {
  const intro = document.querySelector<HTMLElement>('[data-intro]')
  const loader = intro?.querySelector<HTMLElement>('[data-loader]')
  // The scripts are running, so the CSS failsafes that would unlock the page early aren't needed.
  if (intro) intro.style.animation = 'none'
  document.documentElement.style.animation = 'none'
  document.body.style.animation = 'none'

  const strips = [...(loader?.querySelectorAll<HTMLElement>('[data-loader-digit]') ?? [])]
  const count = loader?.querySelector<HTMLElement>('.intro__count')
  const bar = loader?.querySelector<HTMLElement>('[data-loader-bar]')
  const startedAt = performance.now()
  const progress = { value: 0 }
  let shown = 0
  let target = 0
  let stepping: Promise<void> | undefined

  // One step: every digit that changes rolls forward to its new value (left to right, a beat
  // apart), and the line runs along with it. Each strip holds 0-9 twice, so a wrap past 9 rolls
  // into the second run and snaps back to the first afterwards. A cell is 5% of a strip.
  const rollTo = async (next: number) => {
    const from = String(shown).padStart(3, '0')
    const to = String(next).padStart(3, '0')
    shown = next
    if (next >= 100) count?.classList.add('is-full')
    const tl = gsap.timeline()
    tl.to(progress, {
      value: next,
      duration: 0.6,
      ease: 'house',
      onUpdate: () => {
        if (bar) gsap.set(bar, { scaleX: progress.value / 100 })
      },
    })
    strips.forEach((strip, i) => {
      const a = Number(from[i])
      const b = Number(to[i])
      if (a === b) return
      const end = b > a ? b : b + 10
      tl.fromTo(strip, { yPercent: -a * 5 }, { yPercent: -end * 5, duration: 0.5, ease: 'house' }, i * 0.05)
      if (end !== b) tl.set(strip, { yPercent: -b * 5 })
    })
    await tl
  }

  // Steps toward the target in a few big moves rather than ticking through every number.
  const step = async () => {
    while (shown < target) {
      const gap = target - shown
      const next = gap <= 40 ? target : shown + Math.round(gap * gsap.utils.random(0.45, 0.65))
      await rollTo(next)
      await wait(50)
    }
    stepping = undefined
  }

  return {
    /** Moves the target up (never down), 0 to 100. */
    set(value: number) {
      target = Math.max(target, Math.min(Math.round(value), 100))
      if (!quick && !stepping && target > shown) stepping = step()
    },
    /**
     * Runs to 100, then rolls the loader away. Resolves partway through that, so the intro can
     * start uncovering the page while the count leaves.
     */
    async finish(minimumMs = quick ? 0 : 700) {
      await wait(Math.max(0, minimumMs - (performance.now() - startedAt)))
      if (quick) {
        target = 100
        await rollTo(100)
      } else {
        this.set(100)
        while (stepping) await stepping
      }
      await wait(160)
      if (!loader) return
      const leave = gsap
        .timeline({ onComplete: () => loader.remove() })
        .to(loader.querySelectorAll('[data-loader-roll], .intro__label span'), {
          yPercent: -105,
          duration: 0.65,
          ease: 'house',
          stagger: 0.04,
        })
        .set(bar ?? [], { transformOrigin: 'right center' }, 0)
        .to(bar ?? [], { scaleX: 0, duration: 0.6, ease: 'house' }, 0)
        .to(loader.querySelector('.intro__bar') ?? [], { autoAlpha: 0, duration: 0.3 }, 0.3)
      await wait(leave.duration() * 250)
    },
  }
}

/** Plays the intro after the loader (see Intro.astro). Resolves once the page is uncovered. */
export function playIntro(): Promise<void> {
  const intro = document.querySelector<HTMLElement>('[data-intro]')
  const reveal = document.querySelectorAll<HTMLElement>('[data-intro-reveal]')
  const scribble = intro?.querySelector<SVGPathElement>('[data-intro-scribble]')

  if (!intro || !scribble) {
    intro?.remove()
    gsap.set(reveal, { autoAlpha: 1 })
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    gsap
      .timeline({
        onComplete: () => {
          intro.remove()
          resolve()
        },
      })
      .set(scribble, { drawSVG: '0% 100%', strokeWidth: '80%' })
      .to(scribble, { drawSVG: '100% 100%', strokeWidth: '5%', duration: 1.25, ease: 'power1.inOut' })
      .fromTo(
        reveal,
        { yPercent: 25, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: 1, stagger: 0.15, ease: 'expo.out' },
        '<0.15',
      )
  })
}
