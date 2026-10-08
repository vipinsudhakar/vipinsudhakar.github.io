/**
 * Screenshot the running site after a delay, and print any console errors.
 * A quick look, not a test. Start the site first (npm run dev, or npm run preview after a build).
 *
 * Usage:  node scripts/shot.mjs <out.png> [--size 1440x900] [--wait 4500] [--scroll 900,2400] [--full]
 *                                         [--url http://127.0.0.1:4321/]
 *   --scroll  wheel down to each offset in turn (so smooth scroll and scroll effects run as they
 *             would for a person), saving one capture per stop as out-<offset>.png
 *   --full    wheel through the whole page, then capture it in one tall image
 */
import { chromium } from '@playwright/test'

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(name)
  return i > -1 ? args[i + 1] : fallback
}
const valued = new Set(['--size', '--wait', '--scroll', '--url'])
const out = args.find((a, i) => !a.startsWith('--') && !valued.has(args[i - 1])) ?? 'captures/shot.png'
const [width, height] = flag('--size', '1440x900').split('x').map(Number)
const wait = Number(flag('--wait', '4500'))
const url = flag('--url', process.env.BASE_URL ?? 'http://127.0.0.1:4321/')

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width, height } })
const logs = []
page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && logs.push(`${m.type()}: ${m.text()}`))
page.on('pageerror', (e) => logs.push(`pageerror: ${e}`))

await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(wait)

const wheelTo = async (target) => {
  for (let i = 0; i < 400; i++) {
    const y = await page.evaluate(() => window.scrollY)
    if (Math.abs(target - y) < 4) break
    await page.mouse.move(width / 2, height / 2)
    await page.mouse.wheel(0, Math.max(-240, Math.min(240, target - y)))
    await page.waitForTimeout(40)
  }
}

const stops = flag('--scroll', '')
if (stops) {
  for (const target of stops.split(',').map(Number)) {
    await wheelTo(target)
    await page.waitForTimeout(1500)
    await page.screenshot({ path: out.replace(/\.png$/, `-${target}.png`) })
  }
} else if (args.includes('--full')) {
  const total = await page.evaluate(() => document.documentElement.scrollHeight)
  await wheelTo(total)
  await page.waitForTimeout(2000)
  await page.screenshot({ path: out, fullPage: true })
} else {
  await page.screenshot({ path: out })
}

console.log(`height  ${await page.evaluate(() => document.documentElement.scrollHeight)}`)
console.log(`saved   ${out}`)
console.log(logs.length ? logs.join('\n') : 'no errors')
await browser.close()
