let update = () => {}

/**
 * Sets body[data-nav-theme] from whichever section is under the middle of the header, so the
 * header can switch to light text over the blue and black sections.
 */
export function initThemeNav() {
  const header = document.querySelector<HTMLElement>('[data-header]')
  const sections = [...document.querySelectorAll<HTMLElement>('[data-theme]')]
  let current = document.body.dataset.navTheme ?? ''
  let queued = false

  update = () => {
    queued = false
    const probe = header ? header.offsetHeight / 2 : 0
    for (const section of sections) {
      const { top, bottom } = section.getBoundingClientRect()
      if (top <= probe && bottom >= probe) {
        const theme = section.dataset.theme ?? 'dark'
        if (theme !== current) {
          current = theme
          document.body.dataset.navTheme = theme
        }
        return
      }
    }
  }
  const queue = () => {
    if (queued) return
    queued = true
    requestAnimationFrame(update)
  }
  window.addEventListener('scroll', queue, { passive: true })
  window.addEventListener('resize', queue)
  update()
}

/** Re-checks straight away; for sections that change their own theme mid-scroll. */
export const refreshNavTheme = () => update()
