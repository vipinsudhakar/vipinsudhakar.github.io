import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

/**
 * One write-up per project, in src/content/writeups/<slug>.md, shown at /projects/<slug>.
 * The title, links, stack and media come from src/data/projects.ts; the file holds the story.
 */
const writeups = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/writeups' }),
  schema: z.object({
    /** The project's slug in projects.ts. */
    project: z.string(),
    /** One sentence under the title. */
    summary: z.string(),
    role: z.string(),
    team: z.string(),
    when: z.string(),
    /** Two to four headline figures, counted up as they scroll in. Only numbers from the sources. */
    stats: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  }),
})

export const collections = { writeups }
