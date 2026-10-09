import { finePointer, gsap, ScrollTrigger, select, SplitText } from './core'

/**
 * The project ring (markup in Orbit.astro). Tiles sit on a line through the centre, spaced evenly
 * around a circle seen edge-on: sideways offset from the angle's sine, depth (size, blur, stacking)
 * from its cosine. The whole line slowly turns, so the tiles orbit the card in front.
 */
export function initOrbit(scope: ParentNode) {
  select(scope, '[data-orbit]').forEach(setUp)
}

function setUp(root: HTMLElement) {
  const list = root.querySelector<HTMLElement>('[data-orbit-list]')
  const tiles = [...root.querySelectorAll<HTMLElement>('[data-orbit-tile]')]
  const texts = [...root.querySelectorAll<HTMLElement>('[data-orbit-text]')]
  const counter = root.querySelector<HTMLElement>('[data-orbit-current]')
  if (!list || tiles.length < 2 || !texts.length) return

  const cards = tiles.map((tile) => tile.querySelector<HTMLElement>('[data-orbit-card]')!)
  const videos = tiles.map((tile) => tile.querySelector<HTMLVideoElement>('[data-orbit-video]'))
  const count = tiles.length
  const wrap = gsap.utils.wrap(0, count)
  const projectOf = (tile: number) => Number(tiles[tile].dataset.project ?? 0)

  const ring = { step: 0, spin: 0 } // step: which tile is in front (fractional while moving); spin: degrees
  let target = 0 // the step being moved to; keeps counting past the ends so the ring never spins back
  let front = 0
  let cardWidth = 0
  let inView = false
  let keysActive = false

  const measure = () => {
    const grow = parseFloat(getComputedStyle(cards[0]).getPropertyValue('--grow')) || 1
    cardWidth = cards[0].offsetWidth / grow
  }

  const layout = () => {
    const radius = 0.8 * cardWidth
    gsap.set(list, { rotation: ring.spin })
    tiles.forEach((tile, i) => {
      const angle = ((i - ring.step) / count) * Math.PI * 2
      const depth = ((Math.cos(angle) + 1) / 2) ** 1.3
      gsap.set(tile, {
        x: Math.sin(angle) * radius,
        rotation: -ring.spin,
        scale: 0.2 + 0.8 * depth,
        filter: `blur(${(0.05 * cardWidth * (1 - depth)).toFixed(2)}px)`,
        zIndex: Math.round(depth * 1000),
      })
    })
  }

  // The front card grows a little and opens its letterbox.
  const emphasise = (i: number, on: boolean, animate = true) => {
    const vars = { '--grow': on ? 1.15 : 1, '--reveal': on ? 1 : 0 }
    if (!animate) gsap.set(cards[i], vars)
    else gsap.to(cards[i], { ...vars, duration: on ? 0.75 : 0.55, ease: 'house', overwrite: true })
  }

  const pauseAll = () => videos.forEach((video) => video?.pause())
  // Posters wait in data-poster until the ring first comes on screen (see Orbit.astro).
  const loadPosters = () =>
    videos.forEach((video) => {
      if (video?.dataset.poster && !video.poster) video.poster = video.dataset.poster
    })
  const playFront = () => {
    if (!inView) return
    videos.forEach((video, i) => i !== front && video?.pause())
    videos[front]?.play().catch(() => {})
  }

  // Text panel: lines of the outgoing project lift out, the incoming ones rise in.
  let shown = -1
  let textTl: gsap.core.Timeline | null = null
  const blocks = texts.map((el, index) => ({
    el,
    fade: [...el.querySelectorAll<HTMLElement>('[data-orbit-fade]')],
    split: SplitText.create(el.querySelectorAll('[data-orbit-reveal]'), {
      type: 'lines',
      mask: 'lines',
      // Lines keep whole words, so screen readers read them as they are.
      aria: 'none',
      autoSplit: true,
      onSplit: (self) => void gsap.set(self.lines, { yPercent: index === shown ? 0 : 110 }),
    }),
  }))
  const showText = (index: number, animate = true) => {
    if (index === shown) return
    const prev = shown >= 0 ? blocks[shown] : null
    const next = blocks[index]
    shown = index
    textTl?.kill()
    blocks.forEach((block, i) => {
      block.el.setAttribute('aria-hidden', String(i !== index))
      if (block !== prev && i !== index) gsap.set(block.el, { autoAlpha: 0 })
    })
    if (!animate) {
      if (prev) gsap.set(prev.el, { autoAlpha: 0 })
      gsap.set(next.el, { autoAlpha: 1 })
      gsap.set(next.split.lines, { yPercent: 0 })
      gsap.set(next.fade, { autoAlpha: 1 })
      return
    }
    textTl = gsap.timeline()
    if (prev) {
      textTl
        .to(prev.split.lines, { yPercent: -110, duration: 0.35, stagger: 0.025, ease: 'power3.in' })
        .to(prev.fade, { autoAlpha: 0, duration: 0.25 }, 0)
        .set(prev.el, { autoAlpha: 0 })
    }
    textTl
      .set(next.el, { autoAlpha: 1 })
      .fromTo(
        next.split.lines,
        { yPercent: 110 },
        { yPercent: 0, duration: 0.7, stagger: 0.055, ease: 'power4.out' },
        prev ? '-=0.1' : 0,
      )
      .fromTo(next.fade, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, '<0.2')
  }

  const setCount = (project: number, animate = true) => {
    if (!counter) return
    const label = String(project + 1).padStart(2, '0')
    if (counter.textContent === label) return
    gsap.killTweensOf(counter)
    if (!animate) {
      counter.textContent = label
      return
    }
    gsap
      .timeline()
      .to(counter, { yPercent: -100, autoAlpha: 0, duration: 0.3, ease: 'power3.in' })
      .call(() => void (counter.textContent = label))
      .set(counter, { yPercent: 100 })
      .to(counter, { yPercent: 0, autoAlpha: 1, duration: 0.4, ease: 'power3.out' })
  }

  // Only the front card can be focused or clicked.
  const setFront = (index: number) => tiles.forEach((tile, i) => (tile.inert = i !== index))

  const go = (direction: 1 | -1) => {
    const previous = front
    target += direction
    front = wrap(target)
    pauseAll()
    emphasise(previous, false)
    emphasise(front, true)
    setFront(front)
    showText(projectOf(front))
    setCount(projectOf(front))
    // overwrite 'auto' only replaces the running step tween, never the spin.
    gsap.to(ring, { step: target, duration: 0.7, ease: 'house', overwrite: 'auto', onUpdate: layout, onComplete: playFront })
  }

  measure()
  tiles.forEach((_, i) => emphasise(i, i === 0, false))
  setFront(0)
  showText(projectOf(0), false)
  layout()
  new ResizeObserver(() => {
    measure()
    layout()
  }).observe(root)

  const spin = gsap.to(ring, { spin: 360, duration: 24, ease: 'none', repeat: -1, paused: true, onUpdate: layout })
  ScrollTrigger.create({
    trigger: root,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: ({ isActive }) => {
      inView = isActive
      if (isActive) loadPosters()
      if (isActive) {
        spin.play()
        playFront()
      } else {
        spin.pause()
        pauseAll()
      }
    },
  })
  ScrollTrigger.create({
    trigger: root,
    start: 'top center',
    end: 'bottom center',
    onToggle: ({ isActive }) => (keysActive = isActive),
  })

  root.querySelectorAll<HTMLElement>('[data-orbit-btn]').forEach((button) =>
    button.addEventListener('click', () => go(button.dataset.orbitBtn === 'prev' ? -1 : 1)),
  )
  window.addEventListener('keydown', (event) => {
    if (!keysActive || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
    if (document.activeElement?.matches('input, textarea, select, [contenteditable="true"]')) return
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault()
      go(event.key === 'ArrowRight' ? 1 : -1)
    }
  })

  // Swipe sideways on touch screens. A swipe that ends on the front card mustn't open it too.
  let startX: number | null = null
  let swiped = false
  const stage = list.parentElement ?? list
  stage.addEventListener('pointerdown', (event) => {
    swiped = false
    if (event.pointerType === 'touch') startX = event.clientX
  })
  stage.addEventListener('pointerup', (event) => {
    if (startX === null) return
    const dx = event.clientX - startX
    startX = null
    if (Math.abs(dx) > 40) {
      swiped = true
      go(dx < 0 ? 1 : -1)
    }
  })
  stage.addEventListener(
    'click',
    (event) => {
      if (!swiped) return
      swiped = false
      event.preventDefault()
      event.stopPropagation()
    },
    true,
  )

  // Over the front card, a "View project" badge follows the pointer (mouse only).
  const cursor = root.querySelector<HTMLElement>('[data-orbit-cursor]')
  if (cursor && finePointer) {
    const moveX = gsap.quickTo(cursor, 'x', { duration: 0.45, ease: 'power3' })
    const moveY = gsap.quickTo(cursor, 'y', { duration: 0.45, ease: 'power3' })
    let shown = false
    const show = (on: boolean) => {
      if (on === shown) return
      shown = on
      gsap.to(cursor, {
        scale: on ? 1 : 0,
        duration: on ? 0.5 : 0.3,
        ease: on ? 'back.out(1.6)' : 'power3.in',
        overwrite: 'auto',
      })
    }
    gsap.set(cursor, { scale: 0 })
    stage.addEventListener('pointermove', (event) => {
      const box = stage.getBoundingClientRect()
      moveX(event.clientX - box.left)
      moveY(event.clientY - box.top)
      show((event.target as Element | null)?.closest('[data-orbit-tile]') === tiles[front])
    })
    stage.addEventListener('pointerleave', () => show(false))
  }
}
