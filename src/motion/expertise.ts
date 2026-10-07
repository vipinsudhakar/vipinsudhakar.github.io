import { gsap, reducedMotion, select } from './core'

/**
 * Wide screens: pins the Expertise section and, step by step, closes the open panel while the
 * next one opens, its image wiping in from the left. The list rises so that only the previous
 * row stays above the open one. Everywhere else the section stays a plain list.
 */
export function initExpertise(scope: ParentNode) {
  if (reducedMotion) return
  select(scope, '[data-xp]').forEach((section) => {
    const sticky = section.querySelector<HTMLElement>('.xp__sticky')
    const list = section.querySelector<HTMLElement>('[data-xp-list]')
    const items = [...section.querySelectorAll<HTMLElement>('[data-xp-item]')].map((item) => ({
      row: item.querySelector<HTMLElement>('[data-xp-row]')!,
      visual: item.querySelector<HTMLElement>('[data-xp-visual]')!,
      img: item.querySelector<HTMLElement>('[data-xp-img]')!,
    }))
    if (!sticky || !list || items.length < 2) return

    gsap.matchMedia().add('(min-width: 992px)', () => {
      section.classList.add('is-pinned')

      // Each panel fills the screen below the header band, its own row and the row above it.
      const size = () => {
        const band = parseFloat(getComputedStyle(sticky).paddingTop) || 0
        items.forEach(({ row, visual }, i) => {
          const above = i > 0 ? items[i - 1].row.offsetHeight : 0
          gsap.set(visual, { height: Math.max(window.innerHeight - band - row.offsetHeight - above, 0) })
        })
      }
      const rise = (open: number) =>
        -items.slice(0, Math.max(open - 1, 0)).reduce((sum, { row }) => sum + row.offsetHeight, 0)

      size()
      items.forEach(({ img }, i) => gsap.set(img, { clipPath: i === 0 ? 'inset(0% 0% 0% 0%)' : 'inset(0% 100% 0% 0%)' }))

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${window.innerHeight * items.length}`,
          scrub: true,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefreshInit: size,
        },
      })
      items.slice(0, -1).forEach((current, i) => {
        const next = items[i + 1]
        tl.to(current.visual, { height: 0, duration: 1, ease: 'scroll' }, i)
          .to(current.img, { clipPath: 'inset(0% 0% 0% 100%)', duration: 1, ease: 'scroll' }, i)
          .fromTo(
            next.img,
            { clipPath: 'inset(0% 100% 0% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'scroll' },
            i,
          )
          .to(list, { y: () => rise(i + 1), duration: 1, ease: 'scroll' }, i)
      })

      return () => {
        section.classList.remove('is-pinned')
        gsap.set([list, ...items.flatMap(({ visual, img }) => [visual, img])], { clearProps: 'all' })
      }
    })
  })
}
