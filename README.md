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
| `toolkit.ts` | The logo row ([Simple Icons](https://simpleicons.org)) |
| `signature.ts` | The signature the intro writes (make it with `tools/sign.html`) |

**Hero photo or resume:** drop the file in `public/` and set `heroImage` or `resume` in `site.ts`.

**Signature:** open `tools/sign.html` in a browser, sign, press Copy, and paste over the object in
`src/data/signature.ts`.

**Add a project:** append an entry to `projects.ts`, then capture its poster (and, if you like, a
short preview loop) with the project's dev server or live site running:

```sh
node scripts/grab.mjs https://example.com public/images/projects/example.jpg
# Filament's card: just the home-page simulation and its wordmark, recorded for 6 seconds
node scripts/grab.mjs http://localhost:5173/ public/images/projects/filament.jpg \
  --only "[class*=_heroCanvasWrap_], h1" --record public/videos/filament.webm --seconds 6
```

`--click` presses things first (repeatable), `--only` hides everything but the given elements, and
`--record` films the visible page. Every option is listed at the top of `scripts/grab.mjs`.

**Check the look:** with `npm run dev` running, `node scripts/shot.mjs captures/x.png --scroll 0,900,2400`
saves a screenshot at each scroll position (`--size 390x844` for a phone, `--reduced` for reduced motion).

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`: type-check, build, and publish to
GitHub Pages. In the repo settings, Pages must be set to deploy from **GitHub Actions**.

Never add a page at `/filament` or `/physarum` here. Those paths belong to the project sites in
their own repos.

## Accessibility

Everything works without the motion: with *reduce motion* switched on, the intro, pinning and
scroll effects are skipped and each section shows in its final state. Without JavaScript the page
still reads top to bottom (the email and phone links need JS, since they're assembled in the
browser to keep them away from scrapers).
