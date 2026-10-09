// Renders the link-preview card (public/og.png, 1200×630) from the site's data, fonts and scribble.
// Re-run after changing the name, status, education or expertise:  node scripts/og.mjs
import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { site } from '../src/data/site.ts'
import { screenScribble } from '../src/lib/scribble.ts'

const font = readFileSync(
  new URL('../node_modules/@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2', import.meta.url),
).toString('base64')
const scribble = screenScribble({ seed: 8 })
// The Expertise titles, read from the file's text (it imports images, which Node can't load).
const areas = [...readFileSync(new URL('../src/data/expertise.ts', import.meta.url), 'utf8').matchAll(/^    title: '([^']+)'/gm)].map((m) => m[1])
const { education } = site

const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @font-face { font-family: Archivo; src: url(data:font/woff2;base64,${font}) format('woff2'); font-weight: 100 900; }
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; overflow: hidden; background: #2a4093; color: #e2e1e1;
    font-family: Archivo, sans-serif; text-transform: uppercase; position: relative; }
  svg.scribble { position: absolute; inset: 0; width: 100%; height: 100%; }
  svg.scribble path { fill: none; stroke: #e2e1e1; stroke-width: 1.4; opacity: 0.16; vector-effect: non-scaling-stroke; }
  .top { position: absolute; top: 44px; left: 56px; right: 56px; display: flex; justify-content: space-between; align-items: center; font-size: 19px; letter-spacing: 0.04em; }
  .pill { display: flex; align-items: center; gap: 10px; padding: 7px 16px; border: 1.5px solid #e2e1e1; border-radius: 40px; }
  .pill i { width: 9px; height: 9px; border-radius: 50%; background: #e2e1e1; }
  .name { position: absolute; left: 50px; right: 50px; top: 196px; font-size: 128px; font-weight: 700; line-height: 0.9; letter-spacing: -0.01em; white-space: nowrap; }
  .what { position: absolute; left: 56px; right: 56px; top: 334px; font-size: 22px; font-weight: 500; letter-spacing: 0.02em; white-space: nowrap; }
  .what b { font-weight: 300; padding: 0 0.35em; }
  .foot { position: absolute; left: 56px; right: 56px; bottom: 48px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 19px; letter-spacing: 0.04em; line-height: 1.35; }
  .foot .right { text-align: right; }
</style></head><body>
  <svg class="scribble" viewBox="0 0 3200 3100" preserveAspectRatio="none"><path d="${scribble}"/></svg>
  <div class="top"><span>[ Portfolio ]</span><span class="pill"><i></i>${site.status}</span></div>
  <div class="name">${site.name}</div>
  <div class="what">${areas.map((title) => title.replace('&', '&amp;')).join('<b>/</b>')}</div>
  <div class="foot">
    <span>${education.degree.replace('B.Tech in ', 'B.Tech · ')}<br>${education.school}, ${education.campus} · ${education.start}–${education.end}</span>
    <span class="right">${site.url.replace('https://', '')}</span>
  </div>
</body></html>`

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.setContent(html)
await page.evaluate(() => document.fonts.ready)
// Fit the name to the card's width exactly.
await page.evaluate(() => {
  const name = document.querySelector('.name')
  const room = name.clientWidth
  const size = parseFloat(getComputedStyle(name).fontSize)
  name.style.fontSize = `${(size * room) / name.scrollWidth}px`
})
await page.screenshot({ path: new URL('../public/og.png', import.meta.url).pathname.replace(/^\/(\w:)/, '$1') })
await browser.close()
console.log('wrote public/og.png')
