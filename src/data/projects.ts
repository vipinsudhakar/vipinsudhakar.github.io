export type Project = {
  title: string
  blurb: string
  /** 'building' adds a "Building" tag next to the title. */
  status: 'live' | 'building'
  liveUrl?: string
  repoUrl?: string
  /** A still under public/, 4:3 works best. Without one, the card shows a styled placeholder. */
  poster?: string
  /** A short, silent loop under public/ (webm). It plays on the card in front. */
  video?: string
  stack: string[]
}

/**
 * The projects in the ring, in order. To add one, append an object and drop its poster
 * and video into public/images/projects and public/videos.
 */
export const projects: Project[] = [
  {
    title: 'Filament',
    blurb:
      'A slime mould that draws with light: a multi-species Physarum simulation on WebGPU that you can paint into.',
    status: 'live',
    liveUrl: 'https://vipinsudhakar.github.io/filament/',
    repoUrl: 'https://github.com/vipinsudhakar/filament',
    poster: '/images/projects/filament.jpg',
    video: '/videos/filament.webm',
    stack: ['WebGPU', 'WGSL', 'TypeScript', 'React'],
  },
  {
    title: 'Strand',
    blurb:
      'Protein and DNA sequence analysis in the browser. Biopython does the calculations and ESMFold predicts the 3D structure.',
    status: 'live',
    liveUrl: 'https://strand-0rgw.onrender.com',
    repoUrl: 'https://github.com/vipinsudhakar/Strand',
    poster: '/images/projects/strand.jpg',
    stack: ['FastAPI', 'Biopython', 'ESMFold', 'React'],
  },
]
