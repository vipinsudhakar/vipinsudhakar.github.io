/**
 * Hand-drawn-looking scribble paths, generated at build time. Every scribble on the site (the
 * intro wipe, the scroll transition, the button fills, the placeholders) comes from here, seeded
 * so the output is the same on every build.
 */
type Point = [number, number]

/** Small deterministic PRNG (mulberry32). */
function random(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const round = (n: number) => Math.round(n * 10) / 10

/** A smooth curve through the points (uniform Catmull-Rom, written as cubic Béziers). */
export function smoothPath(points: Point[]): string {
  if (points.length < 2) return ''
  let d = `M${round(points[0][0])} ${round(points[0][1])}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += `C${round(c1x)} ${round(c1y)} ${round(c2x)} ${round(c2y)} ${round(p2[0])} ${round(p2[1])}`
  }
  return d
}

/**
 * A scribble that zig-zags across a w×h box, walking from the top-left corner to the bottom-right
 * and swinging out to either side as it goes. Drawn with a fat stroke it covers the whole box,
 * which is how the intro and the Expertise transition fill the screen.
 */
export function screenScribble({ seed = 3, w = 3200, h = 3100, passes = 9 } = {}): string {
  const rand = random(seed)
  const reachMax = Math.hypot(w, h) * 0.5
  const points: Point[] = []
  for (let i = 0; i <= passes; i++) {
    const t = i / passes
    const side = i % 2 === 0 ? -1 : 1
    // Swing furthest in the middle, where the corners off the diagonal are furthest away.
    const reach = (0.35 + 0.45 * Math.sin(Math.PI * t)) * reachMax
    const jx = (rand() - 0.5) * w * 0.08
    const jy = (rand() - 0.5) * h * 0.08
    points.push([t * w + side * reach * Math.SQRT1_2 + jx, t * h - side * reach * Math.SQRT1_2 + jy])
  }
  return smoothPath(points)
}

/** A quick left-to-right zig-zag for filling a 200×100 button box. */
export function buttonScribble(seed = 11): string {
  const rand = random(seed)
  const steps = 7
  const points: Point[] = []
  for (let i = 0; i <= steps; i++) {
    const x = 10 + (i / steps) * 180 + (rand() - 0.5) * 10
    const y = i % 2 === 0 ? 72 + rand() * 16 : 12 + rand() * 16
    points.push([x, y])
  }
  return smoothPath(points)
}

/** A looser, wandering line for decoration on placeholders. */
export function looseScribble({ seed = 5, w = 400, h = 300, loops = 6 } = {}): string {
  const rand = random(seed)
  const points: Point[] = []
  for (let i = 0; i <= loops * 2; i++) {
    const t = i / (loops * 2)
    const x = w * (0.08 + 0.84 * t) + (rand() - 0.5) * w * 0.12
    const y = i % 2 === 0 ? h * (0.15 + rand() * 0.25) : h * (0.6 + rand() * 0.25)
    points.push([x, y])
  }
  return smoothPath(points)
}
