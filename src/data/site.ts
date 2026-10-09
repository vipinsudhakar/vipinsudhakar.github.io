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
  /** A PDF under public/ (made by scripts/resume.mjs). null hides the Résumé links. */
  resume: '/resume.pdf' as string | null,

  /** Where you study. Also used by search engines (Base.astro) and the résumé. */
  education: {
    degree: 'B.Tech in Artificial Intelligence and Data Science',
    school: 'Amrita Vishwa Vidyapeetham',
    campus: 'Coimbatore',
    start: 2025,
    end: 2029,
    cgpa: '9.1/10',
  },
  /** Shown under About and on the résumé. */
  milestones: [
    { title: 'Hacktoberfest Hack Day Coimbatore', detail: 'Built TrialBridge with Team Latent', year: 2026 },
    { title: 'CAAC course project', detail: 'Advanced DSA, team of four, reviewed', year: 2026 },
  ],

  contact: {
    /** Name and domain, joined with @ in the browser. */
    email: ['vipinsudhakar007', 'gmail.com'],
    /** Country code first, then the number in the groups it is shown in. Also used for WhatsApp. */
    phone: ['91', '73059', '43540'],
    /** Your LinkedIn profile URL. Left empty, the LinkedIn links are hidden. */
    linkedin: 'https://www.linkedin.com/in/vipin-sudhakar/',
    github: 'https://github.com/vipinsudhakar',
  },

  /**
   * The "Send a message" box, which posts to Discord through the relay in relay/ (see its README).
   * While `endpoint` is empty the box and its buttons stay hidden.
   */
  inbox: {
    /** The deployed relay, e.g. 'https://vipinsudhakar-inbox.vercel.app/api/message'. */
    endpoint: 'https://vipinsudhakar-inbox.vercel.app/api/message',
    /** Let visitors pick what the message is about; each kind goes to its own channel. Off: all to #general-inbox. */
    chooseKind: true,
  },

  /** Footer menu; each href is a section id on the page. */
  nav: [
    { label: 'About', href: '#about' },
    { label: 'Expertise', href: '#expertise' },
    { label: 'Projects', href: '#projects' },
    { label: 'Contact', href: '#contact' },
  ],
}
