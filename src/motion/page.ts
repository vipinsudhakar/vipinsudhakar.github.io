import { initAnchors } from './anchors'
import { initButtons } from './buttons'
import { initContactLinks, initYear } from './contact'
import { gsap, ScrollTrigger, SplitText } from './core'
import { initFooterReveal } from './footer'
import { initLenis } from './lenis'
import { initMessageBox } from './message'
import { initScheme } from './scheme'
import { initSplitRandom } from './split'
import { initThemeNav, refreshNavTheme } from './theme-nav'
import { initPageTransitions, uncover } from './transition'

/**
 * The motion for a project write-up (src/pages/projects/[slug].astro). The curtain pulls away and
 * the head plays in; after that everything answers the scroll, in the home page's language:
 * the preview opens out of a letterbox, figures count up, section brackets slide in as their
 * rules draw, lines rise out of masks, a band of the name slides past, and the next project fills
 * with blue as it arrives.
 */
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const all = <T extends Element = HTMLElement>(selector: string, scope: ParentNode = document) => [
  ...scope.querySelectorAll<T>(selector),
]

/** The head: hidden now, played in by the returned timeline once the curtain starts to lift. */
function prepareEntrance() {
  const title = document.querySelector<HTMLElement>('[data-enter-title]')
  const chars = title ? SplitText.create(title, { type: 'chars', aria: 'auto' }).chars : []
  const lines = all('[data-enter-lines]').flatMap(
    (el) => SplitText.create(el, { type: 'lines', mask: 'lines', aria: 'none' }).lines,
  )
  const rows = all('[data-enter-row]')
  const rowText = rows.flatMap((row) => all('.facts__label, .facts__what', row))
  const simple = all('[data-enter]')

  if (title) gsap.set(title, { perspective: 700 })
  gsap.set(chars, { yPercent: 70, rotationX: -95, autoAlpha: 0, transformOrigin: '50% 100%' })
  gsap.set(lines, { yPercent: 110 })
  gsap.set(rows, { '--rule': '0%' })
  gsap.set(rowText, { autoAlpha: 0, y: 14 })
  gsap.set(simple, { autoAlpha: 0, y: 24 })

  return () =>
    gsap
      .timeline()
      .to(simple[0] ?? [], { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out' }, 0)
      .to(chars, { yPercent: 0, rotationX: 0, autoAlpha: 1, duration: 0.9, ease: 'power4.out', stagger: 0.035 }, 0.05)
      .to(lines, { yPercent: 0, duration: 0.9, ease: 'power4.out', stagger: 0.08 }, 0.35)
      .to(rows, { '--rule': '100%', duration: 0.9, ease: 'house', stagger: 0.08 }, 0.4)
      .to(rowText, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.04 }, 0.5)
      .to(simple.slice(1), { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out' }, 0.75)
}

/** The preview opens out of a letterbox while its picture settles from a zoom. */
function initMedia() {
  const frame = document.querySelector<HTMLElement>('[data-writeup-frame]')
  const zoom = frame?.querySelector<HTMLElement>('[data-writeup-zoom]')
  if (!frame || !zoom) return
  gsap.fromTo(
    frame,
    { clipPath: 'inset(14% 4% round 0.65em)' },
    {
      clipPath: 'inset(0% 0% round 0.65em)',
      ease: 'scroll',
      scrollTrigger: { trigger: frame, start: 'top 95%', end: 'center 55%', scrub: true },
    },
  )
  gsap.fromTo(
    zoom,
    { scale: 1.2 },
    { scale: 1, ease: 'scroll', scrollTrigger: { trigger: frame, start: 'top bottom', end: 'center 50%', scrub: true } },
  )
}

/** Each figure counts up from zero as it arrives, with its rule drawing above it. */
function initStats() {
  const stats = all('.writeup__stat')
  stats.forEach((stat, i) => {
    const value = stat.querySelector<HTMLElement>('[data-count]')
    const label = stat.querySelector<HTMLElement>('.writeup__stat-label')
    if (!value) return
    const text = value.textContent?.trim() ?? ''
    // Screen readers get the figure as written; the counting copy is for the eye.
    const copy = Object.assign(document.createElement('span'), { className: 'sr-only', textContent: text })
    value.after(copy)
    value.setAttribute('aria-hidden', 'true')

    const match = text.match(/\d[\d,]*(\.\d+)?/)
    const before = match ? text.slice(0, match.index) : text
    const after = match ? text.slice((match.index ?? 0) + match[0].length) : ''
    const target = match ? parseFloat(match[0].replaceAll(',', '')) : 0
    const decimals = match?.[1] ? match[1].length - 1 : 0
    const grouped = match ? match[0].includes(',') : false
    const counter = { n: 0 }
    const show = () => {
      const n = grouped ? Math.round(counter.n).toLocaleString('en-GB') : counter.n.toFixed(decimals)
      value.textContent = before + n + after
    }
    if (match) show()
    gsap.set(stat, { '--rule': '0%' })
    gsap.set(label ?? [], { autoAlpha: 0, y: 12 })

    ScrollTrigger.create({
      trigger: stat,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        const delay = (i % 3) * 0.12
        gsap.to(stat, { '--rule': '100%', duration: 1, ease: 'house', delay })
        gsap.to(label ?? [], { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out', delay: delay + 0.2 })
        if (match) gsap.to(counter, { n: target, duration: 1.8, ease: 'power3.out', delay, onUpdate: show })
      },
    })
  })
}

/** The story: brackets slide in as each section's rules draw, and lines rise out of masks. */
function initProse() {
  const prose = document.querySelector<HTMLElement>('[data-prose]')
  if (!prose) return
  prose.classList.add('is-live')

  all(':scope > h2', prose).forEach((h2) => {
    const bracket = (char: string, side: string) =>
      Object.assign(document.createElement('span'), { className: `prose__b is-${side}`, textContent: char })
    const left = bracket('[', 'left')
    const right = bracket(']', 'right')
    left.setAttribute('aria-hidden', 'true')
    right.setAttribute('aria-hidden', 'true')
    h2.prepend(left)
    h2.append(right)
    gsap
      .timeline({ scrollTrigger: { trigger: h2, start: 'top bottom', end: 'top 55%', scrub: true } })
      .fromTo(left, { xPercent: -300 }, { xPercent: 0, ease: 'scroll' }, 0)
      .fromTo(right, { xPercent: 300 }, { xPercent: 0, ease: 'scroll' }, 0)
  })

  all(':scope > h2, :scope > h2 + *', prose).forEach((el) =>
    gsap.fromTo(
      el,
      { '--rule': '0%' },
      { '--rule': '100%', ease: 'scroll', scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 55%', scrub: true } },
    ),
  )

  const blocks = all(':scope > p, :scope > blockquote, :scope > ul > li, :scope > ol > li', prose)
  blocks.forEach((block) => {
    SplitText.create(block, {
      type: 'lines',
      mask: 'lines',
      aria: 'none',
      autoSplit: true,
      onSplit: (self) => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: block, start: 'top 90%', once: true } })
        // A list item's marker arrives with its text.
        if (block.tagName === 'LI') tl.from(block, { autoAlpha: 0, duration: 0.4 }, 0)
        return tl.from(self.lines, { yPercent: 110, duration: 0.85, ease: 'power4.out', stagger: 0.06 }, 0)
      },
    })
  })
  all('table', prose).forEach((table) =>
    gsap.from(all('tr', table), {
      autoAlpha: 0,
      y: 16,
      duration: 0.7,
      ease: 'expo.out',
      stagger: 0.08,
      scrollTrigger: { trigger: table, start: 'top 88%', once: true },
    }),
  )
}

/** A reading-progress hairline along the top of the screen. */
function initProgress() {
  const bar = document.querySelector<HTMLElement>('[data-progress]')
  if (!bar) return
  gsap.to(bar, {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: true },
  })
}

/** Two rows of the name and stack slide opposite ways with the scroll, skewing with its speed. */
function initBand() {
  const band = document.querySelector<HTMLElement>('[data-band]')
  if (!band) return
  const rows = all('[data-band-row]', band)
  const skews = rows.map((row) => gsap.quickTo(row, 'skewX', { duration: 0.5, ease: 'power3' }))
  rows.forEach((row) => {
    const travel = () => window.innerWidth * 0.7
    const leftward = Number(row.dataset.bandRow) < 0
    gsap.fromTo(
      row,
      { x: () => (leftward ? 0 : -travel()) },
      {
        x: () => (leftward ? -travel() : 0),
        ease: 'none',
        scrollTrigger: { trigger: band, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
      },
    )
  })
  ScrollTrigger.create({
    trigger: band,
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: (self) => {
      const skew = gsap.utils.clamp(-10, 10, self.getVelocity() / -250)
      skews.forEach((to) => to(skew))
    },
    onLeave: () => skews.forEach((to) => to(0)),
    onLeaveBack: () => skews.forEach((to) => to(0)),
  })
}

/**
 * The next project fills with the accent as it arrives (the same scribble as the Expertise
 * hand-off), its name gathering as it comes. Both finish as the block reaches the top, filling the
 * screen; it holds there a moment, the arrow edging forward, before the footer is revealed.
 */
function initNext() {
  const next = document.querySelector<HTMLElement>('[data-next]')
  const ink = next?.querySelector<SVGPathElement>('.writeup__next-ink path')
  const arrow = next?.querySelector<HTMLElement>('.writeup__arrow')
  if (!next || !ink) return
  gsap.set(ink, { drawSVG: '0% 0%', strokeWidth: '5%' })
  gsap
    .timeline({
      scrollTrigger: {
        trigger: next,
        start: 'top 85%',
        end: 'top top',
        scrub: true,
        onUpdate: ({ progress }) => {
          next.classList.toggle('is-filled', progress > 0.55)
          const theme = progress > 0.4 ? 'light' : 'dark'
          if (next.dataset.theme !== theme) {
            next.dataset.theme = theme
            refreshNavTheme()
          }
        },
      },
    })
    .to(ink, { drawSVG: '0% 85%', duration: 1, ease: 'none' }, 0)
    .to(ink, { strokeWidth: '75%', duration: 1, ease: 'power1.in' }, 0)
    .fromTo(next, { '--fill': 0 }, { '--fill': 1, duration: 0.06, ease: 'none' }, 0.94)

  gsap.timeline({
    scrollTrigger: {
      trigger: next,
      start: 'top top',
      end: '+=35%',
      pin: true,
      pinSpacing: true,
      scrub: true,
      invalidateOnRefresh: true,
    },
  }).fromTo(arrow ?? [], { x: 0 }, { x: '0.35em', ease: 'scroll' })
}

async function boot() {
  initPageTransitions()
  initScheme()
  initContactLinks()
  initYear()
  initButtons()
  // Text splitting measures lines, so let the webfont arrive first (the curtain covers the wait).
  await Promise.race([document.fonts.ready, wait(1500)])

  const lenis = initLenis()
  initThemeNav()
  const enter = prepareEntrance()
  initMedia()
  initStats()
  initProse()
  initProgress()
  initBand()
  initSplitRandom(document)
  initNext()
  initFooterReveal(document)
  initAnchors(lenis)
  initMessageBox(lenis)
  ScrollTrigger.refresh()

  window.scrollTo(0, 0)
  uncover()
  await wait(350)
  enter()
}

boot()
window.addEventListener('load', () => ScrollTrigger.refresh())
