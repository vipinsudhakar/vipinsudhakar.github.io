export type Area = {
  title: string
  text: string
  /** An image under public/. Without one, the panel shows a styled placeholder. */
  image?: string
  alt?: string
}

/** The numbered rows in the blue Expertise section. Four reads best; three to six work. */
export const expertise: Area[] = [
  {
    title: 'Full-stack web',
    text: 'Interfaces in React and TypeScript on top of Spring Boot or FastAPI services and PostgreSQL. I like owning the whole path, from the schema to the last pixel.',
    image: '/images/expertise/fullstack.jpg',
    alt: "Strand's protein tool analysing Green Fluorescent Protein: length, molecular weight, isoelectric point and composition",
  },
  {
    title: 'GPU & simulation',
    text: 'Real-time compute in the browser with WebGPU and WGSL: agent simulations, trail maps and shaders that hold their frame rate.',
    image: '/images/expertise/gpu.jpg',
    alt: 'The Filament studio: a live Physarum simulation with its tool bar, species controls and playback bar',
  },
  {
    title: 'ML & bioinformatics',
    text: 'Turning models into tools people can use: protein structure prediction with ESMFold, and Gemma 4 reading medical reports to match cancer patients with clinical trials.',
    image: '/images/expertise/bio.jpg',
    alt: 'Haemoglobin subunit alpha folded in 3D by ESMFold in Strand, coloured by prediction confidence',
  },
  {
    title: 'Systems & security',
    text: 'Backend systems in Java with an eye on integrity: Merkle trees, tamper-evident logs and the chunking strategies behind them.',
    image: '/images/expertise/systems.jpg',
    alt: 'The CAAC visualiser proving one log entry: a verified Merkle proof, with the path to the root traced through both trees',
  },
]
