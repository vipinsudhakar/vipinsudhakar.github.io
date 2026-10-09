/**
 * Capture a poster image (and optionally a short silent video) of a project, for the cards and
 * the Expertise panels.
 *
 * Usage:  node scripts/grab.mjs <url> <out.jpg> [--size 1200x900] [--wait 6000] [--click "text=Protein"]
 *                                              [--only "selector, ..."] [--canvas-only]
 *                                              [--scroll "selector"] [--play "js"]
 *                                              [--record out.webm | --video out.webm] [--seconds 6] [--kbps 3000]
 *                                              [--video-width 800]
 *   --click        click something first (repeatable, in order), e.g. to open a tab
 *   --only         hide everything on the page except these elements (comma-separated selectors)
 *   --canvas-only  shorthand for --only canvas (for WebGL/WebGPU projects)
 *   --scroll       scroll this element to the middle of the screen before the poster
 *   --play         JavaScript run in the page as recording starts (async OK), to give the loop
 *                  some motion: e.g. scroll the page slowly, or step a slider
 *   --record       record the visible page, HTML and all, through the browser's screencast
 *   --video        record just the page's first <canvas> (smoother, but canvas content only)
 *   --kbps         video bitrate; flat UI recordings look fine at about 1200
 *   --video-width  scale a --record video down to this width (cards show them at ~700px at most)
 *   e.g.  node scripts/grab.mjs http://localhost:5173/ src/assets/projects/filament.jpg
 *           --only "[class*=_heroCanvasWrap_], h1" --record public/videos/filament.webm
 */
import { Buffer } from 'node:buffer'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(name)
  return i > -1 ? args[i + 1] : fallback
}
const valued = new Set(['--size', '--wait', '--click', '--only', '--scroll', '--play', '--record', '--video', '--seconds', '--kbps', '--video-width'])
const [url, out] = args.filter((a, i) => !a.startsWith('--') && !valued.has(args[i - 1]))
if (!url || !out) {
  console.error('usage: node scripts/grab.mjs <url> <out.jpg> [options]')
  process.exit(1)
}
const [width, height] = flag('--size', '1200x900').split('x').map(Number)
const wait = Number(flag('--wait', '6000'))
const clicks = args.flatMap((a, i) => (a === '--click' ? [args[i + 1]] : []))
const only = args.includes('--canvas-only') ? 'canvas' : flag('--only')
const record = flag('--record')
const video = flag('--video')
const seconds = Number(flag('--seconds', '6'))
const kbps = Number(flag('--kbps', '3000'))
const videoWidth = Number(flag('--video-width', '0'))
const scrollTo = flag('--scroll')
const play = flag('--play')

const browser = await chromium.launch({
  channel: process.env.PW_CHANNEL ?? 'msedge',
  headless: true,
  args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage({ viewport: { width, height } })
await page.goto(url, { waitUntil: 'networkidle', timeout: 120_000 })
for (const selector of clicks) {
  await page.click(selector)
  await page.waitForTimeout(1500)
}
await page.waitForTimeout(wait)
if (scrollTo) {
  await page.evaluate((selector) => document.querySelector(selector)?.scrollIntoView({ block: 'center' }), scrollTo)
  await page.waitForTimeout(800)
}

if (only) {
  // Hide every element that is neither a kept element, inside one, nor on the way down to one.
  await page.evaluate((selector) => {
    const keep = [...document.querySelectorAll(selector)]
    const hideOthers = (root) => {
      for (const child of root.children) {
        if (keep.some((k) => k === child || k.contains(child))) continue
        if (keep.some((k) => child.contains(k))) hideOthers(child)
        else child.style.setProperty('visibility', 'hidden', 'important')
      }
    }
    hideOthers(document.body)
  }, only)
  await page.waitForTimeout(300)
}
await page.screenshot({ path: out, type: 'jpeg', quality: 84 })
console.log(`poster  ${out}`)

const saveWebm = (path, base64) => {
  const buffer = Buffer.from(base64, 'base64')
  writeFileSync(path, buffer)
  console.log(`video   ${path} (${Math.round(buffer.length / 1024)} KB)`)
}

// Runs in the page: records a canvas with MediaRecorder for `ms` while `draw` (if any) feeds it.
const RECORD_IN_PAGE = `async function recordCanvas(canvas, ms, draw) {
  const type = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((t) => MediaRecorder.isTypeSupported(t))
  const recorder = new MediaRecorder(canvas.captureStream(30), { mimeType: type, videoBitsPerSecond: ${kbps * 1000} })
  const chunks = []
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)
  const stopped = new Promise((resolve) => (recorder.onstop = resolve))
  recorder.start(250)
  if (draw) await draw()
  else await new Promise((resolve) => setTimeout(resolve, ms))
  recorder.stop()
  await stopped
  const bytes = new Uint8Array(await new Blob(chunks, { type: 'video/webm' }).arrayBuffer())
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}`

if (video) {
  const base64 = await page.evaluate(
    ([source, ms]) => {
      const recordCanvas = new Function(`return (${source})`)()
      const canvas = document.querySelector('canvas')
      if (!canvas) throw new Error('no canvas on the page')
      return recordCanvas(canvas, ms)
    },
    [RECORD_IN_PAGE, seconds * 1000],
  )
  saveWebm(video, base64)
}

if (record) {
  // 1. Collect screencast frames (JPEG, with timestamps) while the page plays.
  const cdp = await page.context().newCDPSession(page)
  const frames = []
  cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    frames.push({ data, t: metadata.timestamp })
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
  })
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: width, maxHeight: height })
  if (play) page.evaluate(`(async () => { ${play} })()`).catch((error) => console.error('play:', error.message))
  await page.waitForTimeout(seconds * 1000)
  await cdp.send('Page.stopScreencast')
  console.log(`frames  ${frames.length} in ${seconds}s`)

  // 2. Replay them onto a canvas at their original timing and encode that to WebM.
  const encoder = await browser.newPage()
  for (const frame of frames) await encoder.evaluate((f) => (window['__frames'] ??= []).push(f), frame)
  const base64 = await encoder.evaluate(async ([source, outWidth]) => {
    const recordCanvas = new Function(`return (${source})`)()
    const frames = window['__frames']
    const load = (data) =>
      new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = `data:image/jpeg;base64,${data}`
      })
    const images = await Promise.all(frames.map((f) => load(f.data)))
    const scale = outWidth ? outWidth / images[0].naturalWidth : 1
    const canvas = Object.assign(document.createElement('canvas'), {
      width: Math.round(images[0].naturalWidth * scale),
      height: Math.round(images[0].naturalHeight * scale),
    })
    const ctx = canvas.getContext('2d')
    const draw = (img) => ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    draw(images[0])
    return recordCanvas(canvas, 0, async () => {
      const start = performance.now()
      for (let i = 0; i < images.length; i++) {
        const due = (frames[i].t - frames[0].t) * 1000 - (performance.now() - start)
        if (due > 0) await new Promise((resolve) => setTimeout(resolve, due))
        draw(images[i])
      }
      await new Promise((resolve) => setTimeout(resolve, 120))
    })
  }, [RECORD_IN_PAGE, videoWidth])
  saveWebm(record, base64)
}
await browser.close()
