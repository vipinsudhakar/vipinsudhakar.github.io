/**
 * Everything personal on the site lives here and in copy.ts, projects.ts, expertise.ts and toolkit.ts.
 *
 * The email address and phone number are stored in pieces on purpose. The page joins them in the
 * browser, so neither appears whole in this repo or in the HTML that scrapers read.
 */
export const site = {
  name: 'Vipin Sudhakar',
  url: 'https://vipinsudhakar.github.io',
  title: 'Vipin Sudhakar · Software Developer',
  description:
    'Undergraduate software developer building full-stack web apps, GPU simulations and tools for computational biology. Open to internships.',

  /** The pill at the bottom left of the hero. */
  status: 'Open to internships',
  /** The lines at the bottom right of the hero, next to the globe. */
  location: ['Based in India', 'Working worldwide'],

  /** Full-bleed hero photo under public/, e.g. { src: '/images/hero.jpg', alt: 'Vipin Sudhakar' }. null shows the placeholder. */
  heroImage: null as { src: string; alt: string } | null,
  /** A PDF under public/, e.g. '/resume.pdf'. null hides the Resume button. */
  resume: null as string | null,

  contact: {
    /** Name and domain, joined with @ in the browser. */
    email: ['vipinsudhakar007', 'gmail.com'],
    /** Country code first, then the number in the groups it is shown in. Also used for WhatsApp. */
    phone: ['91', '73059', '43540'],
    /** Your LinkedIn profile URL. Left empty, the LinkedIn links are hidden. */
    linkedin: 'https://www.linkedin.com/in/vipin-sudhakar/',
    github: 'https://github.com/vipinsudhakar',
  },

  /** Footer menu; each href is a section id on the page. */
  nav: [
    { label: 'About', href: '#about' },
    { label: 'Expertise', href: '#expertise' },
    { label: 'Projects', href: '#projects' },
    { label: 'Contact', href: '#contact' },
  ],
}
