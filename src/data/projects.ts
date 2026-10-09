import caac from '../assets/projects/caac.jpg'
import filament from '../assets/projects/filament.jpg'
import strand from '../assets/projects/strand.jpg'
import trialbridge from '../assets/projects/trialbridge.jpg'

export type Project = {
  title: string
  /** The write-up's address, /projects/<slug>, and its file in src/content/writeups. */
  slug: string
  blurb: string
  /** 'building' adds a "Building" tag next to the title. */
  status: 'live' | 'building'
  liveUrl?: string
  repoUrl?: string
  /** A still imported from src/assets/projects, 4:3 works best. Without one, the card shows a styled placeholder. */
  poster?: ImageMetadata
  /** A short, silent loop under public/ (webm). It plays on the card in front. */
  video?: string
  /** One line of background, e.g. the team, the event and your part in it. */
  context?: string
  stack: string[]
}

/**
 * The projects in the ring, in order. To add one, append an object, put its poster in
 * src/assets/projects (and import it above) and its video in public/videos.
 */
export const projects: Project[] = [
  {
    title: 'TrialBridge',
    slug: 'trialbridge',
    blurb:
      'Finds the clinical trials recruiting in India that a cancer patient may qualify for. Gemma 4 reads photos of their reports, then checks the patient against every eligibility rule of each plausible trial and explains each verdict.',
    status: 'live',
    liveUrl: 'https://trialbridge-beta.vercel.app',
    repoUrl: 'https://github.com/vipinsudhakar/hacktoberfest-hack-day-coimbatore-x-init-club-and-idea-club',
    poster: trialbridge,
    video: '/videos/trialbridge.webm',
    context:
      'Team Latent at Hacktoberfest Hack Day Coimbatore. My part was the application architecture and the Gemma 4 integration.',
    stack: ['Next.js', 'Gemma 4', 'TypeScript', 'ClinicalTrials.gov'],
  },
  {
    title: 'Filament',
    slug: 'filament',
    blurb:
      'A slime mould that draws with light: a multi-species Physarum simulation on WebGPU that you can paint into.',
    status: 'live',
    liveUrl: 'https://vipinsudhakar.github.io/filament/',
    repoUrl: 'https://github.com/vipinsudhakar/filament',
    poster: filament,
    video: '/videos/filament.webm',
    stack: ['WebGPU', 'WGSL', 'TypeScript', 'React'],
  },
  {
    title: 'Strand',
    slug: 'strand',
    blurb:
      'Protein and DNA sequence analysis on the web. Biopython does the calculations on the server, and ESMFold predicts the 3D structure.',
    status: 'live',
    liveUrl: 'https://strand-0rgw.onrender.com',
    repoUrl: 'https://github.com/vipinsudhakar/Strand',
    poster: strand,
    video: '/videos/strand.webm',
    stack: ['FastAPI', 'Biopython', 'ESMFold', 'React'],
  },
  {
    title: 'CAAC',
    slug: 'caac',
    blurb:
      "Tamper-evident logs where a change stays local. Entries are hashed into a forest of Merkle trees, cut where the content says, so absorbing an insertion into 100,000 entries takes about 62× fewer hashes than the base paper's pipeline.",
    status: 'live',
    liveUrl: 'https://caac-cicn.onrender.com',
    repoUrl: 'https://github.com/vipinsudhakar/merkle-log-integrity',
    poster: caac,
    video: '/videos/caac.webm',
    context:
      'Advanced DSA team project at Amrita; I built the whole system. It extends the adaptive chunking of Yağız, Horasan and Yurttakal (2026).',
    stack: ['Java 21', 'Spring Boot', 'PostgreSQL', 'React'],
  },
]
