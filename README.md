# vipinsudhakar.github.io

My portfolio: who I am, what I've built, what I work with, and how to reach me.
Live at **https://vipinsudhakar.github.io**.

Built with [Astro](https://astro.build) and TypeScript. Motion uses [GSAP](https://gsap.com) and
[Lenis](https://lenis.darkroom.engineering). The design is inspired by
[alejandroha.com](https://alejandroha.com/en); the code, copy and artwork here are my own.

## Run it

```sh
npm install
npm run dev        # http://127.0.0.1:4321
npm run check      # type-check
npm run build      # static site in dist/
npm run preview    # serve dist/
```

## Edit the content

Everything personal lives in `src/data/`, and the sections read from there:

| File | What's in it |
| --- | --- |
| `site.ts` | Name, status pill, location, contact details, hero photo, resume, footer menu |
| `copy.ts` | The words in each section |
| `projects.ts` | The project ring: title, blurb, links, poster, preview video, stack |
| `expertise.ts` | The numbered areas in the blue Expertise section |
| `toolkit.ts` | Every tool in the Toolkit section, by group (logos from [Simple Icons](https://simpleicons.org)) |

**Hero photo or resume:** drop the file in `public/` and set `heroImage` or `resume` in `site.ts`.

**Add a project:** append an entry to `projects.ts`, then capture its poster (and, if you like, a
short preview loop) with the project's dev server or live site running. Posters and Expertise images
live in `src/assets/` and are imported by the data files, so the build serves them as AVIF/WebP at
the right sizes; videos go in `public/videos/`.

```sh
node scripts/grab.mjs https://example.com src/assets/projects/example.jpg
# Filament's card: just the home-page simulation and its wordmark, recorded for 6 seconds
node scripts/grab.mjs http://localhost:5173/ src/assets/projects/filament.jpg \
  --only "[class*=_heroCanvasWrap_], h1" --record public/videos/filament.webm --seconds 6
```

`--click` presses things first (repeatable), `--only` hides everything but the given elements, and
`--record` films the visible page. Every option is listed at the top of `scripts/grab.mjs`.

**Message box:** the "Send a message" box posts to Discord (one channel per kind of message) through a small relay in `relay/`. Set it up with [relay/README.md](relay/README.md), then put its address in `site.ts` → `inbox.endpoint`. Until then the box stays hidden.

**Colours and the night theme:** `src/styles/tokens.css` holds the palette and the roles the
components use (page, text, accent, text on the accent, the dark panel). The night theme (charcoal
and crimson) redefines the roles under `:root[data-scheme='night']`; the toggle in the header
switches it, and a visitor's choice is remembered (before that, it follows their system setting).

**Check the look:** with `npm run dev` running, `node scripts/shot.mjs captures/x.png --scroll 0,900,2400`
saves a screenshot at each scroll position (`--size 390x844` for a phone).

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`: type-check, build, and publish to
GitHub Pages. In the repo settings, Pages must be set to deploy from **GitHub Actions**.

Never add a page at `/filament` or `/physarum` here. Those paths belong to the project sites in
their own repos.

## Accessibility

The site always plays its full motion, including for visitors whose system asks for reduced motion.
Without JavaScript it still reads top to bottom (the email and phone links need JS, since they're
assembled in the browser to keep them away from scrapers).
