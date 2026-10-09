const KEY = 'vs:scheme'

/**
 * Day (silver and blue) or night (charcoal and crimson), from the toggle in the header. The head
 * script in Base.astro sets the starting theme before the first paint and tokens.css holds the
 * colours. Switching spreads the new theme out from the button in a circle, where the browser
 * supports view transitions; elsewhere it simply swaps.
 */
export function initScheme() {
  const root = document.documentElement
  const meta = document.querySelector<HTMLMetaElement>('[data-theme-color]')
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('[data-scheme-toggle]')]

  const sync = () => {
    const night = root.dataset.scheme === 'night'
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(night))
      button.title = night ? 'Switch to the day theme' : 'Switch to the night theme'
    }
    meta?.setAttribute('content', getComputedStyle(root).getPropertyValue('--bg').trim())
  }
  sync()

  for (const button of buttons) {
    button.addEventListener('click', () => {
      const next = root.dataset.scheme === 'night' ? 'day' : 'night'
      const apply = () => {
        root.dataset.scheme = next
        try {
          localStorage.setItem(KEY, next)
        } catch {
          // Storage blocked: the choice lasts until the page is left.
        }
        sync()
      }
      if (!document.startViewTransition) {
        apply()
        return
      }
      const box = button.getBoundingClientRect()
      const x = box.left + box.width / 2
      const y = box.top + box.height / 2
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
      document.startViewTransition(apply).ready.then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 800, easing: 'cubic-bezier(0.625, 0.05, 0, 1)', pseudoElement: '::view-transition-new(root)' },
        )
      })
    })
  }
}
