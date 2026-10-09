// Renders the one-page résumé (public/resume.pdf, A4) from the site's data and fonts, with a preview at
// captures/resume-preview.png. Re-run after changing the details, projects or skills:  node scripts/resume.mjs
import { chromium } from '@playwright/test'
import { mkdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { site } from '../src/data/site.ts'
import { toolkit } from '../src/data/toolkit.ts'

const file = (path) => fileURLToPath(new URL(path, import.meta.url))
const font = (subset) =>
  readFileSync(
    file(`../node_modules/@fontsource-variable/archivo/files/archivo-${subset}-wght-normal.woff2`),
  ).toString('base64')

const projects = [
  {
    name: 'TrialBridge',
    context: 'Hacktoberfest Hack Day Coimbatore, Team Latent',
    year: 2026,
    points: [
      'Matches cancer patients in India to recruiting clinical trials: Gemma 4 reads photos of their medical reports into a structured, evidence-quoted profile, then checks the patient against each eligibility rule of each plausible trial.',
      'My part: application architecture and AI integration, covering the Next.js structure, the Gemma integration, medical-document extraction, prompt development and API error handling.',
      'Explainable by design: code splits each trial’s rules and decides the outcome; the model answers one narrow question per rule. Cut one trial check from about 3 minutes to 26 seconds by setting thinking to minimal and moving the reasoning hints into the prompt.',
    ],
    stack: 'Next.js 16, React 19, TypeScript, Gemma 4 (Gemini API), Zod, ClinicalTrials.gov API, Vercel',
    live: 'https://trialbridge-beta.vercel.app',
  },
  {
    name: 'CAAC: Content-Anchored Adaptive Chunking',
    context: 'Advanced DSA course project, team of four',
    year: 2026,
    points: [
      'Extends a 2026 tamper-evident logging paper (Yağız, Horasan and Yurttakal) with content-anchored chunking over a forest of Merkle trees, so a change to the log stays local.',
      'At 100,000 entries, absorbing an insertion takes about 62× fewer SHA-256 operations than the paper’s pipeline (about 67× for an edit); proofs stay O(log n) and tamper detection stays 100%.',
      'Built the whole system: a Java 21 engine with RFC 6962 hashing and counted rebuild costs (367 tests), a Spring Boot + PostgreSQL API, and a React visualiser.',
    ],
    stack: 'Java 21, Spring Boot, PostgreSQL, React, TypeScript, Docker, Render',
    live: 'https://caac-cicn.onrender.com',
    repo: 'https://github.com/vipinsudhakar/merkle-log-integrity',
  },
  {
    name: 'Filament',
    context: 'Personal project',
    year: 2026,
    points: [
      'Real-time multi-species Physarum (slime mould) simulation: hundreds of thousands of agents in WebGPU compute shaders (WGSL), with no 3D library in between.',
      'A studio to paint food, walls, repellent and lures, mix up to four species, and share any run as a link that replays bit-for-bit (fixed-point atomic deposits, a seeded PCG hash shared between TypeScript and WGSL).',
      'Tuned to hold 60 fps on integrated laptop GPUs.',
    ],
    stack: 'WebGPU, WGSL, TypeScript, React, Vite',
    live: 'https://vipinsudhakar.github.io/filament',
    repo: 'https://github.com/vipinsudhakar/filament',
  },
  {
    name: 'Strand',
    context: 'Personal project',
    year: 2026,
    points: [
      'Rebuilt a single-file prototype as a full-stack app after finding its numbers untrustworthy (a guessed isoelectric point, a DNA molecular weight off by about 1000×): the science now runs server-side in Biopython.',
      'Protein and DNA analysis, plus 3D structure prediction with ESMFold proxied through the backend and rendered with 3Dmol, coloured by per-residue confidence.',
    ],
    stack: 'FastAPI, Biopython, SQLModel/SQLite, React, TypeScript, Docker',
    live: 'https://strand-0rgw.onrender.com',
    repo: 'https://github.com/vipinsudhakar/Strand',
  },
]

// A short pick from each Toolkit group; Testing & tooling and Ship & host share the last line.
const skills = {
  Languages: ['TypeScript', 'JavaScript', 'Python', 'Java', 'SQL', 'WGSL', 'HTML', 'CSS'],
  'Frontend & graphics': ['React', 'Next.js', 'Astro', 'Vite', 'Tailwind CSS', 'GSAP', 'WebGPU', '3Dmol.js'],
  'Backend & data': ['Spring Boot', 'JPA / Hibernate', 'OpenAPI', 'FastAPI', 'Pydantic', 'SQLModel', 'Node.js', 'PostgreSQL', 'Zod'],
  'AI & data science': ['Gemma 4', 'Gemini API', 'PyTorch', 'scikit-learn', 'XGBoost', 'OpenCV', 'NumPy', 'pandas', 'Biopython'],
  'Tools & deployment': ['Git', 'GitHub Actions', 'Docker', 'Vercel', 'Render', 'Playwright', 'Vitest', 'JUnit', 'pytest'],
}
const known = new Set(toolkit.flatMap((group) => group.tools.map((tool) => tool.label)))
for (const tool of Object.values(skills).flat()) {
  if (!known.has(tool)) throw new Error(`${tool} is not in src/data/toolkit.ts`)
}

const esc = (text) => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const bare = (url) => url.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, '')
const link = (href, text = bare(href)) => `<a href="${href}">${esc(text)}</a>`
const dot = '<span class="dot">·</span>'
const row = (what, when) => `<div class="row">${what}<span class="when">${when}</span></div>`

const { contact, education } = site
const email = contact.email.join('@')
const [country, ...groups] = contact.phone
const contacts = [
  link(`mailto:${email}`, email),
  link(`tel:+${contact.phone.join('')}`, `+${country} ${groups.join(' ')}`),
  link(contact.linkedin),
  link(contact.github),
]
const role = `Software developer ${dot} ${education.degree.replace('B.Tech in ', 'B.Tech, ')} (${education.start}–${education.end})`

const section = (title, body) => `<section><h2>[ ${title} ]</h2>${body}</section>`
const project = (p) => `<article>
  ${row(`<h3>${esc(p.name)} ${dot} <span class="ctx">${esc(p.context)}</span></h3>`, p.year)}
  <ul>${p.points.map((point) => `<li>${esc(point)}</li>`).join('')}</ul>
  <dl>
    <dt>Stack</dt><dd>${esc(p.stack)}</dd>
    <dt>Live</dt><dd>${link(p.live)}${p.repo ? `<span class="label">Repo</span>${link(p.repo)}` : ''}</dd>
  </dl>
</article>`

const html = `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><title>${esc(site.name)} · Résumé</title><style>
  @font-face { font-family: Archivo; src: url(data:font/woff2;base64,${font('latin')}) format('woff2'); font-weight: 100 900;
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329,
      U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
  @font-face { font-family: Archivo; src: url(data:font/woff2;base64,${font('latin-ext')}) format('woff2'); font-weight: 100 900;
    unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF,
      U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF; }
  @page { size: A4; margin: 0; }
  :root { --ink: #080912; --blue: #2a4093; --muted: rgb(8 9 18 / 0.66); --rule: rgb(8 9 18 / 0.15); }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #fff; color: var(--ink); font-family: Archivo, sans-serif; font-size: 9.5pt; line-height: 1.33;
    -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  /* The sheet is the page: its padding is the margin, so the preview matches the PDF. */
  .sheet { width: 210mm; height: 297mm; padding: 14mm 16mm; }
  a { color: var(--blue); text-decoration: none; }
  .dot { color: var(--muted); padding: 0 0.3em; }

  .top { display: flex; justify-content: space-between; align-items: baseline; gap: 6mm; }
  .top a { font-size: 9pt; }
  h1 { font-size: 25pt; font-weight: 700; line-height: 1; letter-spacing: -0.005em; text-transform: uppercase; }
  .role { margin-top: 2.6mm; font-size: 10.5pt; font-weight: 500; }
  .contact { margin-top: 1mm; font-size: 9pt; }

  h2 { display: flex; align-items: center; gap: 2.5mm; margin: 4.4mm 0 2mm; color: var(--blue);
    font-size: 8.25pt; font-weight: 600; letter-spacing: 0.12em; line-height: 1; text-transform: uppercase; }
  h2::after { content: ''; flex: 1; border-top: 0.75pt solid var(--rule); }
  h3 { font-size: 10pt; font-weight: 650; }
  .ctx { font-weight: 400; color: var(--muted); }
  .row { display: flex; justify-content: space-between; align-items: baseline; gap: 6mm; }
  .when { flex: none; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .sub { color: var(--muted); }

  article + article { margin-top: 2.6mm; }
  ul { margin-top: 0.6mm; padding-left: 3.6mm; }
  li { padding-left: 0.6mm; }
  li + li { margin-top: 0.35mm; }
  li::marker { color: var(--muted); }
  dl { display: grid; grid-template-columns: max-content 1fr; column-gap: 2.5mm; margin-top: 0.6mm; font-size: 8.75pt; }
  dt, .label { color: var(--muted); font-size: 7.25pt; letter-spacing: 0.08em; text-transform: uppercase; line-height: 1.6; }
  .label { margin: 0 2mm 0 4mm; }

  .skills { display: grid; grid-template-columns: 34mm 1fr; row-gap: 0.4mm; }
  .skills dt { color: var(--ink); font-size: inherit; letter-spacing: 0; text-transform: none; line-height: inherit; font-weight: 600; }
  .milestones .row + .row { margin-top: 0.6mm; }
</style></head><body><div class="sheet">
  <header>
    <div class="top"><h1>${esc(site.name)}</h1>${link(site.url)}</div>
    <p class="role">${role}</p>
    <p class="contact">${contacts.join(` ${dot} `)}</p>
  </header>
  ${section(
    'Education',
    `${row(`<h3>${esc(education.degree)}</h3>`, `${education.start}–${education.end} (expected)`)}
    <p class="sub">${esc(education.school)}, ${esc(education.campus)} ${dot} CGPA ${esc(education.cgpa)}</p>`,
  )}
  ${section('Projects', projects.map(project).join(''))}
  ${section(
    'Skills',
    `<dl class="skills">${Object.entries(skills)
      .map(([group, tools]) => `<dt>${esc(group)}</dt><dd>${esc(tools.join(', '))}</dd>`)
      .join('')}</dl>`,
  )}
  ${section(
    'Milestones',
    `<div class="milestones">${site.milestones
      .map((m) => row(`<h3>${esc(m.title)} ${dot} <span class="ctx">${esc(m.detail)}</span></h3>`, m.year))
      .join('')}</div>`,
  )}
</div></body></html>`

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 })
await page.setContent(html)
await page.evaluate(() => document.fonts.ready)
// Stop rather than let anything spill onto a second page or past the bottom margin.
const spare = await page.evaluate(() => {
  const sheet = document.querySelector('.sheet')
  const end = sheet.getBoundingClientRect().bottom - parseFloat(getComputedStyle(sheet).paddingBottom)
  const last = [...sheet.querySelectorAll('*')].reduce((max, el) => Math.max(max, el.getBoundingClientRect().bottom), 0)
  return ((end - last) * 25.4) / 96
})
mkdirSync(file('../captures'), { recursive: true })
await page.screenshot({ path: file('../captures/resume-preview.png'), fullPage: true })
if (spare < 0) {
  await browser.close()
  throw new Error(`the résumé runs ${(-spare).toFixed(1)}mm past the bottom margin; tighten the text`)
}
await page.pdf({ path: file('../public/resume.pdf'), preferCSSPageSize: true, printBackground: true, tagged: true })
await browser.close()
const kb = (statSync(file('../public/resume.pdf')).size / 1024).toFixed(0)
console.log(`wrote public/resume.pdf (${kb} KB, ${spare.toFixed(1)}mm to spare) and captures/resume-preview.png`)
