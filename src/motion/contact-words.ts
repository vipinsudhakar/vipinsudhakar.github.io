import { gsap, select } from './core'

/** "Contact" in a handful of the world's languages. */
const WORDS = [
  'CONTACT',
  'CONTACTO',
  'KONTAKT',
  'CONTATTO',
  'CONTATO',
  'İLETİŞİM',
  'КОНТАКТ',
  'ΕΠΙΚΟΙΝΩΝΙΑ',
  'संपर्क',
  'தொடர்பு',
  'ബന്ധപ്പെടുക',
  'যোগাযোগ',
  '連絡',
  '联系',
  '연락',
  'تواصل',
  'HUBUNGI',
]
const COUNT = 48

/** Landing spots in vw/vh from the centre, spaced around an ellipse. */
const ring = (n: number, rx: number, ry: number, offset: number) =>
  Array.from({ length: n }, (_, i) => {
    const angle = offset + (i / n) * Math.PI * 2
    return { x: Math.cos(angle) * rx, y: Math.sin(angle) * ry }
  })

/**
 * While the contact section scrolls by, words fly out of the distance, settle briefly around the
 * heading and rush past the viewer. The heading block itself un-blurs as the section arrives.
 */
export function initContactWords(scope: ParentNode) {
  select(scope, '[data-contact-section]').forEach((section) => {
    const content = section.querySelector<HTMLElement>('[data-contact-content]')
    const layer = section.querySelector<HTMLElement>('[data-contact-words]')
    if (!content || !layer) return

    gsap.fromTo(
      content,
      { autoAlpha: 0, yPercent: 25, scale: 0.96, filter: 'blur(8px)' },
      {
        autoAlpha: 1,
        yPercent: 0,
        scale: 1,
        filter: 'blur(0px)',
        ease: 'scroll',
        scrollTrigger: { trigger: section, start: 'top 60%', end: 'top 25%', scrub: true },
      },
    )

    // Two rings, the inner one turned half a step, so words land around the heading, not on it.
    const spots = [...ring(8, 42, 38, 0), ...ring(8, 24, 22, Math.PI / 8)]
    const random = gsap.utils.random
    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: 1 },
    })

    for (let i = 0; i < COUNT; i++) {
      const word = document.createElement('span')
      word.className = 'contact__word'
      word.textContent = WORDS[i % WORDS.length]
      layer.append(word)

      const spot = spots[i % spots.length]
      const at = random(0, 0.5) + Math.floor(i / spots.length) * 0.12
      const arrive = random(0.12, 0.18)
      const size = random(0.7, 1.3)
      const x = spot.x + random(-4, 4)
      const y = spot.y + random(-4, 4)

      gsap.set(word, {
        xPercent: -50,
        yPercent: -50,
        x: `${spot.x * random(0.08, 0.22)}vw`,
        y: `${spot.y * random(0.08, 0.22)}vh`,
        z: random(-1600, -1100),
        scale: 0.35 * size,
        autoAlpha: 0,
        filter: 'blur(10px)',
      })
      tl.to(
        word,
        {
          x: `${x}vw`,
          y: `${y}vh`,
          z: 0,
          scale: size,
          autoAlpha: random(0.25, 0.6),
          filter: 'blur(0px)',
          duration: arrive,
          ease: 'power1.inOut',
        },
        at,
      ).to(
        word,
        {
          x: `${x + random(-3, 3)}vw`,
          y: `${y + random(-3, 3)}vh`,
          z: random(800, 1200),
          scale: size * random(1.3, 1.65),
          autoAlpha: 0,
          filter: 'blur(8px)',
          duration: random(0.12, 0.18),
          ease: 'power1.in',
        },
        at + arrive,
      )
    }
  })
}
