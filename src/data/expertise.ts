import bio from '../assets/expertise/bio.jpg'
import fullstack from '../assets/expertise/fullstack.jpg'
import gpu from '../assets/expertise/gpu.jpg'
import systems from '../assets/expertise/systems.jpg'

export type Area = {
  title: string
  text: string
  /** An image imported from src/assets. Without one, the panel shows a styled placeholder. */
  image?: ImageMetadata
  alt?: string
}

/** The numbered rows in the blue Expertise section. Four reads best; three to six work. */
export const expertise: Area[] = [
  {
    title: 'Full-stack web',
    text: 'Interfaces in React and TypeScript on top of Spring Boot or FastAPI services, with PostgreSQL or SQLite. I like owning the whole path, from the schema to the last pixel.',
    image: fullstack,
    alt: "Strand's protein tool analysing Green Fluorescent Protein: length, molecular weight, isoelectric point and composition",
  },
  {
    title: 'GPU & simulation',
    text: 'Real-time compute in the browser with WebGPU and WGSL: agent simulations, trail maps and shaders that hold their frame rate.',
    image: gpu,
    alt: 'The Filament studio: a live Physarum simulation with its tool bar, species controls and playback bar',
  },
  {
    title: 'ML & bioinformatics',
    text: "Turning models into tools people can use: Gemma 4 reading cancer patients' medical reports into profiles for a clinical-trial matcher, and protein structure prediction with ESMFold.",
    image: bio,
    alt: 'Haemoglobin subunit alpha folded in 3D by ESMFold in Strand, coloured by prediction confidence',
  },
  {
    title: 'Systems & security',
    text: 'Backend systems in Java with an eye on integrity: Merkle forests, tamper-evident logs, and content-anchored chunking that keeps a change to the log local.',
    image: systems,
    alt: 'The CAAC visualiser proving one log entry: a verified Merkle proof, with the path to the root traced through both trees',
  },
]
