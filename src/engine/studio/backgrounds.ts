/**
 * Procedural backgrounds — vector textures distilled from the reference set.
 * Every painter is seeded and pure: same seed → same path data. Panel-local coordinates (0..w, 0..h).
 * No raster, no filters; print-safe vectors only.
 */
import type { BackgroundFamily, StudioPalette } from './types'
import { darken, lighten, mix } from './color'
import { speciesLeaf, speciesTree, type Species } from './species'

export type Rng = () => number

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const f = (n: number) => (Math.round(n * 100) / 100).toString()

export type BackgroundOpts = {
  /** Unique id prefix for gradients / clips. */
  uid: string
  /** 0–1 strength: how loud the texture is. */
  intensity?: number
  /** Where an ink wash / scene sits. */
  corner?: 'bl' | 'br' | 'tl' | 'tr'
  /** For landscapes: vertical span (0–1 of h) the scene occupies from the bottom. */
  span?: number
  /** Keep this right-side fraction of the face free of the main stripe (label lockup column). */
  clearRight?: number
  /**
   * What the scenery is of. The archetype owns the composition; this owns the silhouettes,
   * so an olive oil carton gets an olive grove instead of the default conifers.
   */
  species?: Species
}

export function paintBackground(family: BackgroundFamily, w: number, h: number, pal: StudioPalette, seed: number, opts: BackgroundOpts): string {
  switch (family) {
    case 'marble':
      return marble(w, h, pal, seed, opts)
    case 'botanical':
      return botanical(w, h, pal, seed, opts)
    case 'diagonal':
      return diagonal(w, h, pal, seed, opts)
    case 'landscape-moon':
      return landscapeMoon(w, h, pal, seed, opts)
    case 'landscape-meadow':
      return landscapeMeadow(w, h, pal, seed, opts)
    case 'ink-wash':
      return inkWash(w, h, pal, seed, opts)
    case 'gradient-wash':
      return gradientWash(w, h, pal, seed, opts)
    case 'line-scene':
      return lineScene(w, h, pal, seed, opts)
    case 'wave':
      return wave(w, h, pal, seed, opts)
    case 'circuit':
      return circuit(w, h, pal, seed, opts)
    case 'paper':
    default:
      return paper(w, h, pal, seed)
  }
}

export function ground(w: number, h: number, fill: string): string {
  return `<rect x="0" y="0" width="${f(w)}" height="${f(h)}" fill="${fill}" />`
}

/* ------------------------------------------------------------------ marble */

type Pt = { x: number; y: number }

/**
 * The centreline of one vein.
 *
 * A vein is a crack that was filled, so it holds a direction and only bends by a little at a
 * time. The old painter jumped to a new random point each step, which is why a zoomed face read
 * as a road map: hard vertices, and the same turn repeated across the panel.
 *
 * Drifting the *heading* fixes the corners but not the shape — independent nudges cancel out over
 * 30 steps and leave a straight blade. So what drifts is the turn rate: it persists, which bends
 * the run into a long sweep before easing back. That is the difference between a shard and a vein.
 */
function veinSpine(rng: Rng, start: Pt, heading: number, len: number, steps: number): Pt[] {
  const pts: Pt[] = [start]
  let { x, y } = start
  let a = heading
  let turn = (rng() - 0.5) * 0.08
  const step = len / steps
  for (let i = 0; i < steps; i++) {
    turn = Math.max(-0.16, Math.min(0.16, turn + (rng() - 0.5) * 0.07))
    a += turn + (rng() - 0.5) * 0.04
    x += Math.cos(a) * step
    y += Math.sin(a) * step
    pts.push({ x, y })
  }
  return pts
}

function headingAt(pts: Pt[], i: number): number {
  const a = pts[Math.max(0, i - 1)]
  const b = pts[Math.min(pts.length - 1, i + 1)]
  return Math.atan2(b.y - a.y, b.x - a.x)
}

/**
 * A stroke has one width for its whole length; a vein does not — it swells and thins away to
 * nothing. So the spine is drawn as a filled ribbon: out along one side at the profile's
 * half-width, back along the other. That single change is most of the difference between
 * "scratches on paper" and stone.
 */
function veinRibbon(pts: Pt[], maxW: number, peak: number): string {
  const n = pts.length - 1
  const halfWidth = (i: number) => {
    const t = i / n
    const s = t < peak ? t / peak : 1 - (t - peak) / (1 - peak)
    return (maxW / 2) * Math.max(0, s) ** 0.6
  }
  const side = (i: number, sign: number) => {
    const a = headingAt(pts, i) + Math.PI / 2
    const k = halfWidth(i) * sign
    return `${f(pts[i].x + Math.cos(a) * k)} ${f(pts[i].y + Math.sin(a) * k)}`
  }
  let d = `M${side(0, 1)}`
  for (let i = 1; i <= n; i++) d += `L${side(i, 1)}`
  for (let i = n; i >= 0; i--) d += `L${side(i, -1)}`
  return `${d}Z`
}

export function marble(w: number, h: number, pal: StudioPalette, seed: number, opts: BackgroundOpts): string {
  const rng = mulberry32(seed)
  const k = opts.intensity ?? 0.8
  const parts: string[] = [ground(w, h, pal.ground)]
  const area = Math.sqrt(w * h)
  // Veining reads as *stone* before it reads as colour, so it is mixed from the ground toward the
  // panel's own ink: dark threads on a pale slab, pale threads on a dark one, at any palette.
  const shadow = mix(pal.ground, pal.ink, 0.08)
  const stone = mix(pal.ground, pal.ink, 0.34)
  const hair = mix(pal.ground, pal.ink, 0.2)
  const gold = mix(pal.accent, pal.accent2, 0.25)

  // A slab is cut so the veining runs one way. Entering from the left or top edge on a shared
  // diagonal is what makes several veins look like one piece of stone rather than a tangle.
  const bias = 0.16 + rng() * 0.16
  /**
   * `lane` walks the entry along the edge instead of rolling for it. Left to chance, four veins
   * clumped into one corner and left the rest of the slab bare — the eye reads that as a stain,
   * not as stone.
   */
  const entry = (lane: number, lanes: number): { p: Pt; a: number } => {
    const a = Math.PI * (bias + (rng() - 0.5) * 0.12)
    const t = (lane + 0.15 + rng() * 0.7) / lanes
    return t < 0.6
      ? { p: { x: -w * 0.08, y: h * (t / 0.6) * 1.05 - h * 0.35 }, a }
      : { p: { x: w * ((t - 0.6) / 0.4) * 0.9 - w * 0.05, y: -h * 0.08 }, a }
  }

  let soft = ''
  const bands = 2 + Math.round(k * 2)
  for (let i = 0; i < bands; i++) {
    const { p, a } = entry(i, bands)
    soft += `<path d="${veinRibbon(veinSpine(rng, p, a, (w + h) * 1.1, 22), area * (0.1 + rng() * 0.14), 0.5)}" fill="${shadow}" fill-opacity="${f(0.5 + rng() * 0.3)}" />`
  }
  parts.push(soft)

  // Few and deliberate. The old painter drew ~27 veins in the accent colour, which on a gold
  // accent meant a gold grid over the whole face.
  const primaries = 1 + Math.round(k * 4)
  let veinMarkup = ''
  for (let i = 0; i < primaries; i++) {
    const { p, a } = entry(i, primaries)
    const spine = veinSpine(rng, p, a, (w + h) * (0.8 + rng() * 0.5), 30)
    const wide = area * (0.012 + rng() * 0.014)
    veinMarkup += `<path d="${veinRibbon(spine, wide, 0.3 + rng() * 0.3)}" fill="${stone}" fill-opacity="${f(0.45 + rng() * 0.25)}" />`
    // Veins fork. A vein that never branches is a line.
    for (let b = 0; b < 1 + Math.floor(rng() * 2); b++) {
      const at = Math.floor(spine.length * (0.2 + rng() * 0.55))
      const off = headingAt(spine, at) + (rng() < 0.5 ? -1 : 1) * (0.25 + rng() * 0.4)
      const child = veinSpine(rng, spine[at], off, (w + h) * (0.2 + rng() * 0.28), 16)
      veinMarkup += `<path d="${veinRibbon(child, wide * (0.3 + rng() * 0.25), 0.25)}" fill="${hair}" fill-opacity="${f(0.4 + rng() * 0.25)}" />`
    }
  }
  // Gold is the rare thread that makes the slab expensive, not the material it is made of.
  const threads = k > 0.7 ? 2 : k > 0.4 ? 1 : 0
  for (let i = 0; i < threads; i++) {
    const { p, a } = entry(i, threads)
    const spine = veinSpine(rng, p, a, (w + h) * (0.7 + rng() * 0.4), 26)
    veinMarkup += `<path d="${veinRibbon(spine, area * (0.005 + rng() * 0.006), 0.35)}" fill="${gold}" fill-opacity="${f(0.55 + rng() * 0.25)}" />`
  }
  parts.push(`<g data-texture="veins">${veinMarkup}</g>`)

  const flecks = Math.round(area * 0.55 * k)
  let dust = ''
  for (let i = 0; i < flecks; i++) {
    const cx = rng() * w
    const cy = rng() * h
    if (rng() < 0.28) {
      const rx = 0.1 + rng() * 0.26
      const ry = 0.04 + rng() * 0.08
      dust += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${f(rng() * 180)} ${f(cx)} ${f(cy)})" fill="${gold}" fill-opacity="${f(0.2 + rng() * 0.35)}" />`
    } else {
      dust += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(0.05 + rng() * 0.14)}" fill="${stone}" fill-opacity="${f(0.18 + rng() * 0.32)}" />`
    }
  }
  parts.push(`<g data-texture="dust">${dust}</g>`)
  return `<g data-bg="marble">${parts.join('')}</g>`
}

/* --------------------------------------------------------------- botanical */

function frond(cx: number, cy: number, len: number, angle: number, fill: string, opacity: number, rng: Rng): string {
  // palm frond: central rib + lanceolate leaflets both sides
  const leaflets = 7 + Math.floor(rng() * 4)
  let g = ''
  for (let i = 1; i <= leaflets; i++) {
    const t = i / (leaflets + 1)
    const px = t * len
    const l = len * (0.28 + 0.2 * Math.sin(Math.PI * t))
    const wdt = l * 0.16
    for (const side of [-1, 1]) {
      const sweep = side * (32 + rng() * 10)
      g += `<path transform="translate(${f(px)} 0) rotate(${f(sweep)})" d="M0 0 C${f(l * 0.25)} ${f(-wdt)} ${f(l * 0.75)} ${f(-wdt)} ${f(l)} 0 C${f(l * 0.75)} ${f(wdt * 0.6)} ${f(l * 0.25)} ${f(wdt * 0.6)} 0 0Z" />`
    }
  }
  g += `<path d="M0 0 L${f(len)} 0" stroke="${fill}" stroke-width="${f(len * 0.012)}" stroke-linecap="round" fill="none" />`
  return `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${f(angle)})" fill="${fill}" fill-opacity="${f(opacity)}" stroke-opacity="${f(opacity)}">${g}</g>`
}

function broadLeaf(cx: number, cy: number, len: number, angle: number, fill: string, opacity: number): string {
  const wdt = len * 0.42
  const d = `M0 0 C${f(-wdt * 0.2)} ${f(-len * 0.25)} ${f(-wdt)} ${f(-len * 0.55)} ${f(-wdt * 0.55)} ${f(-len * 0.8)} C${f(-wdt * 0.3)} ${f(-len * 0.95)} ${f(-wdt * 0.05)} ${f(-len)} 0 ${f(-len)} C${f(wdt * 0.05)} ${f(-len)} ${f(wdt * 0.3)} ${f(-len * 0.95)} ${f(wdt * 0.55)} ${f(-len * 0.8)} C${f(wdt)} ${f(-len * 0.55)} ${f(wdt * 0.2)} ${f(-len * 0.25)} 0 0Z`
  const rib = `<path d="M0 0 L0 ${f(-len * 0.96)}" stroke="${fill}" stroke-opacity="${f(opacity * 0.5)}" stroke-width="${f(len * 0.012)}" fill="none" />`
  return `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${f(angle)})"><path d="${d}" fill="${fill}" fill-opacity="${f(opacity)}" />${rib}</g>`
}

/** Woo-style fenestrated leaf: silhouette with evenodd cutouts so layers show through. */
function fenestratedLeaf(cx: number, cy: number, len: number, angle: number, fill: string, opacity: number, rng: Rng): string {
  const wdt = len * 0.5
  const body = `M0 0 C${f(-wdt * 0.12)} ${f(-len * 0.16)} ${f(-wdt)} ${f(-len * 0.38)} ${f(-wdt * 0.72)} ${f(-len * 0.68)} C${f(-wdt * 0.22)} ${f(-len * 0.94)} ${f(-wdt * 0.04)} ${f(-len)} 0 ${f(-len)} C${f(wdt * 0.04)} ${f(-len)} ${f(wdt * 0.22)} ${f(-len * 0.94)} ${f(wdt * 0.72)} ${f(-len * 0.68)} C${f(wdt)} ${f(-len * 0.38)} ${f(wdt * 0.12)} ${f(-len * 0.16)} 0 0Z`
  let holes = ''
  const n = 4 + Math.floor(rng() * 3)
  for (let i = 0; i < n; i++) {
    const t = 0.2 + (i / n) * 0.58
    const side = i % 2 === 0 ? -1 : 1
    const hx = side * wdt * (0.16 + rng() * 0.18)
    const hy = -len * t
    const rx = len * (0.035 + rng() * 0.045)
    const ry = len * (0.05 + rng() * 0.04)
    holes += ` M${f(hx - rx)} ${f(hy)} a${f(rx)} ${f(ry)} 0 1 0 ${f(rx * 2)} 0 a${f(rx)} ${f(ry)} 0 1 0 ${f(-rx * 2)} 0`
  }
  const rib = `<path d="M0 ${f(-len * 0.04)} L0 ${f(-len * 0.94)}" stroke="${fill}" stroke-opacity="${f(opacity * 0.38)}" stroke-width="${f(len * 0.013)}" fill="none" />`
  return `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${f(angle)})"><path fill-rule="evenodd" d="${body}${holes}" fill="${fill}" fill-opacity="${f(opacity)}" />${rib}</g>`
}

function edgeAnchor(rng: Rng, w: number, h: number): { cx: number; cy: number } {
  const edge = rng()
  const cx = edge < 0.55 ? (rng() < 0.5 ? -w * 0.08 + rng() * w * 0.28 : w * 0.74 + rng() * w * 0.3) : rng() * w
  const cy = edge < 0.55 ? rng() * h : rng() < 0.5 ? -h * 0.06 + rng() * h * 0.28 : h * 0.7 + rng() * h * 0.34
  return { cx, cy }
}

export function botanical(w: number, h: number, pal: StudioPalette, seed: number, opts: BackgroundOpts): string {
  const rng = mulberry32(seed)
  const k = opts.intensity ?? 0.8
  const tones = [pal.accent2, darken(pal.accent2, 0.07), darken(pal.accent2, 0.14), mix(pal.accent2, pal.ground, 0.22)]
  const parts: string[] = [ground(w, h, pal.ground)]
  const diag = Math.sqrt(w * w + h * h)
  const back = Math.round(4 + k * 3)
  const mid = Math.round(4 + k * 3)
  const front = Math.round(2 + k * 2)
  for (let i = 0; i < back; i++) {
    const { cx, cy } = edgeAnchor(rng, w, h)
    const len = diag * (0.34 + rng() * 0.28)
    parts.push(broadLeaf(cx, cy, len, rng() * 360, tones[i % tones.length], 0.42 + rng() * 0.22))
  }
  let cutouts = ''
  for (let i = 0; i < mid; i++) {
    const { cx, cy } = edgeAnchor(rng, w, h)
    const len = diag * (0.26 + rng() * 0.24)
    cutouts += fenestratedLeaf(cx, cy, len, rng() * 360, tones[(i + 1) % tones.length], 0.58 + rng() * 0.28, rng)
  }
  parts.push(`<g data-texture="cutouts">${cutouts}</g>`)
  // Foreground is the layer you actually read, so it carries the product's own botany.
  const species = opts.species ?? 'flora'
  for (let i = 0; i < front; i++) {
    const { cx, cy } = edgeAnchor(rng, w, h)
    const len = diag * (0.2 + rng() * 0.18)
    const fill = tones[(i + 2) % tones.length]
    const opacity = 0.62 + rng() * 0.28
    if (species !== 'flora' && species !== 'conifer') {
      parts.push(speciesLeaf(species, cx, cy, len, rng() * 360, fill, opacity))
    } else {
      parts.push(rng() < 0.45 ? frond(cx, cy, len, rng() * 360, fill, opacity, rng) : broadLeaf(cx, cy, len * 0.85, rng() * 360, fill, opacity))
    }
  }
  return `<g data-bg="botanical">${parts.join('')}</g>`
}

/* ---------------------------------------------------------------- diagonal */

export function diagonal(w: number, h: number, pal: StudioPalette, seed: number, opts: BackgroundOpts): string {
  const rng = mulberry32(seed)
  const k = opts.intensity ?? 0.8
  const id = `${opts.uid}-dg`
  const warm = pal.accent
  const warm2 = pal.accent2
  const clear = opts.clearRight ?? 0
  const maxRight = clear > 0 ? w * (1 - clear) : w
  const clip = clear > 0 ? `\n    <clipPath id="${id}-clear"><rect x="0" y="0" width="${f(maxRight)}" height="${f(h)}" /></clipPath>` : ''
  const defs = `<defs>
    <linearGradient id="${id}-a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lighten(warm, 0.08)}" /><stop offset="0.55" stop-color="${warm}" /><stop offset="1" stop-color="${darken(warm2, 0.12)}" /></linearGradient>
    <linearGradient id="${id}-b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lighten(pal.ground, 0.14)}" /><stop offset="1" stop-color="${pal.ground}" /></linearGradient>${clip}
  </defs>`
  const parts: string[] = [defs, ground(w, h, pal.ground)]
  // main metallic block: parallelogram sweeping from top-centre to bottom-right
  const shift = Math.min(w * (0.32 + rng() * 0.1), Math.max(w * 0.12, maxRight * 0.45))
  const x0 = Math.min(w * (0.36 + rng() * 0.08), Math.max(w * 0.12, maxRight - w * 0.34))
  const bw = Math.min(w * (0.16 + k * 0.1), Math.max(w * 0.1, maxRight - x0 - w * 0.06))
  const stripe: string[] = []
  stripe.push(`<polygon points="${f(x0)},0 ${f(x0 + bw)},0 ${f(x0 + bw + shift)},${f(h)} ${f(x0 + shift)},${f(h)}" fill="url(#${id}-a)" />`)
  const x1 = x0 - w * 0.22
  stripe.push(`<polygon points="${f(x1)},0 ${f(x1 + bw * 0.55)},0 ${f(x1 + bw * 0.55 + shift)},${f(h)} ${f(x1 + shift)},${f(h)}" fill="url(#${id}-b)" opacity="0.9" />`)
  const x2 = x0 + bw + w * 0.05
  stripe.push(`<polygon points="${f(x2)},0 ${f(x2 + 0.6)},0 ${f(x2 + 0.6 + shift)},${f(h)} ${f(x2 + shift)},${f(h)}" fill="${warm}" opacity="0.7" />`)
  parts.push(clear > 0 ? `<g clip-path="url(#${id}-clear)">${stripe.join('')}</g>` : stripe.join(''))
  return `<g data-bg="diagonal">${parts.join('')}</g>`
}

/* ------------------------------------------------------------- landscapes */

function ridge(rng: Rng, w: number, baseY: number, amp: number, peaks: number): string {
  const ys: number[] = []
  for (let i = 0; i <= peaks; i++) {
    const taper = i === 0 || i === peaks ? 0.32 : 1
    ys.push(baseY - amp * (0.18 + rng() * 0.82) * taper * (i % 2 === 0 ? 1 : 0.4))
  }
  let d = `M0 ${f(ys[0])}`
  const step = w / peaks
  for (let i = 1; i <= peaks; i++) {
    const x0 = (i - 1) * step
    const x1 = i * step
    d += ` C${f(x0 + step * 0.42)} ${f(ys[i - 1])} ${f(x1 - step * 0.42)} ${f(ys[i])} ${f(x1)} ${f(ys[i])}`
  }
  return d
}

function pine(x: number, baseY: number, hgt: number, fill: string, opacity = 1): string {
  const wdt = hgt * 0.38
  return `<path d="M${f(x)} ${f(baseY - hgt)} L${f(x + wdt * 0.55)} ${f(baseY - hgt * 0.55)} L${f(x + wdt * 0.3)} ${f(baseY - hgt * 0.55)} L${f(x + wdt)} ${f(baseY - hgt * 0.15)} L${f(x + wdt * 0.6)} ${f(baseY - hgt * 0.15)} L${f(x + wdt * 0.6)} ${f(baseY)} L${f(x - wdt * 0.6)} ${f(baseY)} L${f(x - wdt * 0.6)} ${f(baseY - hgt * 0.15)} L${f(x - wdt)} ${f(baseY - hgt * 0.15)} L${f(x - wdt * 0.3)} ${f(baseY - hgt * 0.55)} L${f(x - wdt * 0.55)} ${f(baseY - hgt * 0.55)}Z" fill="${fill}" fill-opacity="${f(opacity)}" />`
}

export function landscapeMoon(w: number, h: number, pal: StudioPalette, seed: number, opts: BackgroundOpts): string {
  const rng = mulberry32(seed)
  const id = `${opts.uid}-lm`
  const span = opts.span ?? 0.62
  const top = h * (1 - span)
  const bottom = h
  const sceneH = bottom - top
  const glow = mix(pal.ground, pal.accent, 0.35)
  const parts: string[] = []
  parts.push(`<defs>
    <linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${pal.ground}" stop-opacity="0" /><stop offset="0.35" stop-color="${mix(pal.ground, pal.accent, 0.16)}" /><stop offset="1" stop-color="${mix(pal.ground, pal.accent, 0.08)}" /></linearGradient>
    <linearGradient id="${id}-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${pal.ground}" stop-opacity="0" /><stop offset="1" stop-color="${pal.ground}" stop-opacity="1" /></linearGradient>
    <radialGradient id="${id}-moon"><stop offset="0" stop-color="${lighten(pal.accent, 0.25)}" /><stop offset="0.7" stop-color="${pal.accent}" /><stop offset="1" stop-color="${darken(pal.accent, 0.1)}" /></radialGradient>
  </defs>`)
  parts.push(`<rect x="0" y="${f(top)}" width="${f(w)}" height="${f(sceneH)}" fill="url(#${id}-sky)" />`)
  // stars
  let stars = ''
  for (let i = 0; i < Math.round(w * 0.9); i++) {
    stars += `<circle cx="${f(rng() * w)}" cy="${f(top + rng() * sceneH * 0.5)}" r="${f(0.06 + rng() * 0.14)}" fill="${pal.accent}" fill-opacity="${f(0.25 + rng() * 0.6)}" />`
  }
  parts.push(`<g data-texture="stars">${stars}</g>`)
  // moon
  const moonR = Math.min(w, sceneH) * 0.16
  const moonX = w * (0.42 + rng() * 0.16)
  const moonY = top + sceneH * 0.32
  parts.push(`<circle cx="${f(moonX)}" cy="${f(moonY)}" r="${f(moonR * 2.15)}" fill="${glow}" fill-opacity="0.12" />`)
  parts.push(`<circle cx="${f(moonX)}" cy="${f(moonY)}" r="${f(moonR * 1.55)}" fill="${glow}" fill-opacity="0.2" />`)
  parts.push(`<circle cx="${f(moonX)}" cy="${f(moonY)}" r="${f(moonR)}" fill="url(#${id}-moon)" />`)
  // mountain ridges (far → near), cubic silhouettes
  const layers = 4
  for (let i = 0; i < layers; i++) {
    const t = i / (layers - 1)
    const baseY = top + sceneH * (0.46 + t * 0.22)
    const amp = sceneH * (0.28 - t * 0.05)
    const fill = mix(pal.ground, pal.accent, 0.32 - t * 0.1)
    parts.push(`<path d="${ridge(rng, w, baseY, amp, 7 + i * 2)} L${f(w)} ${f(bottom)} L0 ${f(bottom)}Z" fill="${fill}" />`)
  }
  const treeBase = top + sceneH * 0.72
  for (let i = 0; i < Math.round(w / 4.5); i++) {
    const x = rng() * w
    const hgt = sceneH * (0.055 + rng() * 0.09)
    parts.push(pine(x, treeBase + rng() * sceneH * 0.03, hgt, darken(pal.ground, 0.03), 0.92 + rng() * 0.08))
  }
  const waterY = top + sceneH * 0.74
  parts.push(`<path d="M0 ${f(waterY + sceneH * 0.02)} C${f(w * 0.28)} ${f(waterY - sceneH * 0.03)} ${f(w * 0.62)} ${f(waterY + sceneH * 0.04)} ${f(w)} ${f(waterY)} L${f(w)} ${f(bottom)} L0 ${f(bottom)}Z" fill="${mix(pal.ground, pal.accent, 0.12)}" />`)
  const reflectH = sceneH * 0.16
  parts.push(`<g data-texture="reflection">
    <ellipse cx="${f(moonX)}" cy="${f(waterY + reflectH * 0.42)}" rx="${f(moonR * 0.42)}" ry="${f(reflectH * 0.55)}" fill="${pal.accent}" fill-opacity="0.2" />
    <ellipse cx="${f(moonX)}" cy="${f(waterY + reflectH * 0.28)}" rx="${f(moonR * 0.22)}" ry="${f(reflectH * 0.32)}" fill="${lighten(pal.accent, 0.2)}" fill-opacity="0.28" />
  </g>`)
  let ripples = ''
  for (let i = 0; i < 28; i++) {
    const near = rng() < 0.55
    const y = waterY + rng() * (bottom - waterY) * 0.68
    const x = moonX + (rng() - 0.5) * w * (near ? 0.28 : 0.62)
    const len = w * (0.025 + rng() * (near ? 0.07 : 0.12))
    ripples += `<line x1="${f(x - len / 2)}" y1="${f(y)}" x2="${f(x + len / 2)}" y2="${f(y)}" stroke="${pal.accent}" stroke-opacity="${f(0.22 + rng() * 0.5)}" stroke-width="${f(0.1 + rng() * 0.22)}" />`
  }
  parts.push(`<g data-texture="ripples">${ripples}</g>`)
  // fade to ground at the bottom so copy sits on solid colour
  parts.push(`<rect x="0" y="${f(bottom - sceneH * 0.32)}" width="${f(w)}" height="${f(sceneH * 0.32)}" fill="url(#${id}-fade)" />`)
  return `<g data-bg="landscape-moon" data-art="hero">${parts.join('')}</g>`
}

export function landscapeMeadow(w: number, h: number, pal: StudioPalette, seed: number, opts: BackgroundOpts): string {
  const rng = mulberry32(seed)
  const id = `${opts.uid}-me`
  const sky = lighten(pal.ground, 0.03)
  const skyDeep = mix(pal.ground, pal.accent, 0.3)
  const rock = pal.accent2
  const snow = pal.card
  const meadow = mix(pal.accent2, '#6f8a3a', 0.55)
  const meadowLight = lighten(meadow, 0.12)
  const parts: string[] = []
  parts.push(`<defs><linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky}" /><stop offset="1" stop-color="${skyDeep}" /></linearGradient></defs>`)
  parts.push(`<rect x="0" y="0" width="${f(w)}" height="${f(h)}" fill="url(#${id}-sky)" />`)
  // sun glow
  parts.push(`<circle cx="${f(w * 0.5)}" cy="${f(h * 0.38)}" r="${f(Math.min(w, h) * 0.32)}" fill="${pal.accent}" fill-opacity="0.18" />`)
  // far snowy range
  const far = ridge(rng, w, h * 0.46, h * 0.2, 7)
  parts.push(`<path d="${far} L${f(w)} ${f(h)} L0 ${f(h)}Z" fill="${mix(rock, sky, 0.35)}" />`)
  // snow caps: same ridge, clipped high
  parts.push(`<clipPath id="${id}-caps"><rect x="0" y="0" width="${f(w)}" height="${f(h * 0.4)}" /></clipPath>`)
  parts.push(`<path d="${far} L${f(w)} ${f(h)} L0 ${f(h)}Z" fill="${snow}" fill-opacity="0.85" clip-path="url(#${id}-caps)" />`)
  // near range
  parts.push(`<path d="${ridge(rng, w, h * 0.58, h * 0.14, 5)} L${f(w)} ${f(h)} L0 ${f(h)}Z" fill="${rock}" />`)
  // meadow hills
  parts.push(`<path d="M0 ${f(h * 0.78)} C${f(w * 0.3)} ${f(h * 0.68)} ${f(w * 0.6)} ${f(h * 0.82)} ${f(w)} ${f(h * 0.72)} L${f(w)} ${f(h)} L0 ${f(h)}Z" fill="${meadow}" />`)
  parts.push(`<path d="M0 ${f(h * 0.88)} C${f(w * 0.35)} ${f(h * 0.8)} ${f(w * 0.7)} ${f(h * 0.94)} ${f(w)} ${f(h * 0.86)} L${f(w)} ${f(h)} L0 ${f(h)}Z" fill="${meadowLight}" />`)
  // trees along the hill — an orchard for olive/citrus, stalks for grain, conifers otherwise
  const species = opts.species ?? 'conifer'
  for (let i = 0; i < Math.round(w / 5); i++) {
    const x = rng() * w
    const base = h * (0.74 + rng() * 0.06)
    parts.push(speciesTree(species, x, base, h * (0.07 + rng() * 0.07), darken(meadow, 0.18)))
  }
  // flowers
  let flowers = ''
  const petals = [pal.accent, '#e9e2d0', '#c9a0d6', '#f2d16b']
  for (let i = 0; i < Math.round(w * 0.7); i++) {
    const x = rng() * w
    const y = h * (0.86 + rng() * 0.12)
    const r = 0.35 + rng() * 0.5
    flowers += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${petals[Math.floor(rng() * petals.length)]}" fill-opacity="0.9" />`
  }
  parts.push(`<g data-texture="flowers">${flowers}</g>`)
  return `<g data-bg="landscape-meadow" data-art="hero">${parts.join('')}</g>`
}

/* ---------------------------------------------------------------- ink wash */

function blob(rng: Rng, cx: number, cy: number, rx: number, ry: number): string {
  const n = 8
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const k = 0.7 + rng() * 0.6
    pts.push({ x: cx + Math.cos(a) * rx * k, y: cy + Math.sin(a) * ry * k })
  }
  let d = `M${f(pts[0].x)} ${f(pts[0].y)}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[i]
    const p1 = pts[(i + 1) % n]
    const cxp = (p0.x + p1.x) / 2 + (rng() - 0.5) * rx * 0.5
    const cyp = (p0.y + p1.y) / 2 + (rng() - 0.5) * ry * 0.5
    d += ` Q${f(cxp)} ${f(cyp)} ${f(p1.x)} ${f(p1.y)}`
  }
  return `${d}Z`
}

export function inkWash(w: number, h: number, pal: StudioPalette, seed: number, opts: BackgroundOpts): string {
  const rng = mulberry32(seed)
  const corner = opts.corner ?? 'bl'
  const ink = pal.accent2
  const parts: string[] = [ground(w, h, pal.ground)]
  const ox = corner.includes('l') ? 0 : w
  const oy = corner.includes('b') ? h : 0
  const dirX = corner.includes('l') ? 1 : -1
  const dirY = corner.includes('b') ? -1 : 1
  const R = Math.max(w, h)
  const layers = [
    { r: 0.62, op: 0.92 },
    { r: 0.5, op: 0.85 },
    { r: 0.4, op: 0.75 },
  ]
  for (const l of layers) {
    const cx = ox + dirX * R * l.r * 0.35
    const cy = oy + dirY * R * l.r * 0.3
    parts.push(`<path d="${blob(rng, cx, cy, R * l.r * 0.75, R * l.r * 0.65)}" fill="${ink}" fill-opacity="${f(l.op)}" />`)
  }
  // softer spray blobs
  for (let i = 0; i < 4; i++) {
    const cx = ox + dirX * R * (0.15 + rng() * 0.5)
    const cy = oy + dirY * R * (0.1 + rng() * 0.45)
    parts.push(`<path d="${blob(rng, cx, cy, R * (0.05 + rng() * 0.08), R * (0.04 + rng() * 0.07))}" fill="${ink}" fill-opacity="${f(0.35 + rng() * 0.3)}" />`)
  }
  // metallic veins along the wash edge
  let veins = ''
  for (let i = 0; i < 9; i++) {
    const x0 = ox + dirX * R * (0.05 + rng() * 0.55)
    const y0 = oy + dirY * R * (0.05 + rng() * 0.5)
    const len = R * (0.15 + rng() * 0.3)
    const a = Math.atan2(dirY, dirX) + (rng() - 0.5) * 1.4
    const x1 = x0 + Math.cos(a) * len
    const y1 = y0 + Math.sin(a) * len
    veins += `<path d="M${f(x0)} ${f(y0)} Q${f((x0 + x1) / 2 + (rng() - 0.5) * len * 0.5)} ${f((y0 + y1) / 2 + (rng() - 0.5) * len * 0.5)} ${f(x1)} ${f(y1)}" fill="none" stroke="${pal.accent}" stroke-opacity="${f(0.55 + rng() * 0.4)}" stroke-width="${f(0.12 + rng() * 0.35)}" stroke-linecap="round" />`
  }
  parts.push(`<g data-texture="veins">${veins}</g>`)
  let flecks = ''
  for (let i = 0; i < Math.round(R * 0.8); i++) {
    flecks += `<circle cx="${f(ox + dirX * R * rng() * 0.7)}" cy="${f(oy + dirY * R * rng() * 0.6)}" r="${f(0.08 + rng() * 0.25)}" fill="${pal.accent}" fill-opacity="${f(0.4 + rng() * 0.5)}" />`
  }
  parts.push(`<g data-texture="flecks">${flecks}</g>`)
  return `<g data-bg="ink-wash" data-art="hero">${parts.join('')}</g>`
}

/* ---------------------------------------------------------- gradient wash */

/**
 * Soft multi-point colour bleed — the only background here with no drawn subject and no edge.
 *
 * `ink-wash` is already a wash, so this had to earn its place by being a different *kind*. Ink-wash
 * anchors an opaque blob in one corner and works by contrast; this spreads several low-contrast
 * clouds across the whole field and works by transition. Side by side they read as two languages,
 * which is the point — the reference shops carry both and the repertoire only had one.
 *
 * Every hue comes from the palette. Nothing is invented here: the brief owns which colours exist
 * and the mood owns what they do, so a background that mixed its own would quietly become a third
 * colour knob and undo the layering. Each cloud is a palette colour pulled partway back to the
 * ground, which is also what keeps the field reading as one lit surface instead of three inks
 * fighting over a card.
 *
 * The softness is built from gradient stops rather than a blur filter. `<filter>` rasterises at the
 * RIP, and this markup is a print file — a resolution-dependent smudge in the middle of an
 * otherwise vector document is exactly the thing the export gate exists to prevent.
 */
export function gradientWash(w: number, h: number, pal: StudioPalette, seed: number, opts: BackgroundOpts): string {
  const rng = mulberry32(seed)
  const k = opts.intensity ?? 0.7
  const R = Math.max(w, h)
  // Keep the cloud centres out of the column the lockup owns, so type never lands on a colour edge.
  const rightLimit = opts.clearRight ? w * (1 - opts.clearRight) : w

  /*
   * Three values, not three hues. Measured first with `accent`/`accent2`/`deep` all mixed halfway
   * back to the ground, and on a one-colour brief the result read as flat paint: those three
   * palette roles are hue siblings, so there was nothing for the field to bleed *between*.
   *
   * The fix cannot be to invent a second hue — that would make the background a colour knob and
   * break the layering. So the spread is taken in *lightness* instead, which the brief already
   * owns: an accent-tinted cloud, a bloom that is the ground lifted, and a pool that is the deep
   * surface. A single-hue brief still gets depth; a two-hue brief still gets its own two hues.
   */
  const hues = [mix(pal.accent, pal.ground, 0.25), lighten(pal.ground, 0.16), mix(pal.deep, pal.ground, 0.35)]

  const defs: string[] = []
  const parts: string[] = [ground(w, h, pal.ground)]

  hues.forEach((hue, i) => {
    const id = `${opts.uid}-gw${i}`
    const cx = rng() * rightLimit
    const cy = rng() * h
    const r = R * (0.45 + rng() * 0.45)
    const peak = (0.5 + rng() * 0.3) * k
    defs.push(
      `<radialGradient id="${id}" cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" gradientUnits="userSpaceOnUse">` +
        `<stop offset="0" stop-color="${hue}" stop-opacity="${f(peak)}" />` +
        `<stop offset="0.55" stop-color="${hue}" stop-opacity="${f(peak * 0.45)}" />` +
        `<stop offset="1" stop-color="${hue}" stop-opacity="0" />` +
        `</radialGradient>`,
    )
    parts.push(`<rect x="0" y="0" width="${f(w)}" height="${f(h)}" fill="url(#${id})" />`)
  })

  /*
   * One vertical veil over the top. Without it three round clouds read as decoration floating on a
   * flat card; with it the face has a top and a bottom and reads as a single surface catching
   * light. It also pulls the peaks back down, which is what keeps type legible on the result.
   */
  const veil = `${opts.uid}-gwv`
  defs.push(
    `<linearGradient id="${veil}" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="${lighten(pal.ground, 0.08)}" stop-opacity="${f(0.2 * k)}" />` +
      `<stop offset="1" stop-color="${darken(pal.ground, 0.12)}" stop-opacity="${f(0.22 * k)}" />` +
      `</linearGradient>`,
  )
  parts.push(`<rect x="0" y="0" width="${f(w)}" height="${f(h)}" fill="url(#${veil})" />`)

  return `<g data-bg="gradient-wash" data-art="hero"><defs>${defs.join('')}</defs>${parts.join('')}</g>`
}

/* -------------------------------------------------------------- line scene */

function palm(x: number, baseY: number, hgt: number, stroke: string, sw: number, lean: number): string {
  const topX = x + lean * hgt * 0.25
  const topY = baseY - hgt
  let g = `<path d="M${f(x)} ${f(baseY)} Q${f(x + lean * hgt * 0.05)} ${f(baseY - hgt * 0.55)} ${f(topX)} ${f(topY)}" fill="none" stroke="${stroke}" stroke-width="${f(sw * 1.6)}" stroke-linecap="round" />`
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI * 0.95 + (i / 5) * Math.PI * 0.9
    const len = hgt * (0.32 + (i % 2) * 0.08)
    const ex = topX + Math.cos(a) * len
    const ey = topY + Math.sin(a) * len + len * 0.35
    g += `<path d="M${f(topX)} ${f(topY)} Q${f((topX + ex) / 2)} ${f(topY - len * 0.25)} ${f(ex)} ${f(ey)}" fill="none" stroke="${stroke}" stroke-width="${f(sw)}" stroke-linecap="round" />`
    // leaflet ticks
    for (let k = 1; k <= 4; k++) {
      const t = k / 5
      const px = topX + (ex - topX) * t
      const py = topY + (ey - topY) * t - len * 0.12 * (1 - t)
      g += `<line x1="${f(px)}" y1="${f(py)}" x2="${f(px + Math.cos(a + 1.2) * len * 0.12)}" y2="${f(py + Math.sin(a + 1.2) * len * 0.12 + len * 0.08)}" stroke="${stroke}" stroke-width="${f(sw * 0.8)}" stroke-linecap="round" />`
    }
  }
  return g
}

export function lineScene(w: number, h: number, pal: StudioPalette, seed: number, opts: BackgroundOpts): string {
  const rng = mulberry32(seed)
  const span = opts.span ?? 0.5
  const top = h * (1 - span)
  const sceneH = h - top
  const ink = pal.ink
  const sw = Math.max(0.16, Math.min(w, h) * 0.0035)
  const parts: string[] = []
  const horizon = top + sceneH * 0.5
  // sun
  const sunR = sceneH * 0.11
  const sunX = w * 0.55
  const sunY = horizon - sunR * 0.5
  parts.push(`<circle cx="${f(sunX)}" cy="${f(sunY)}" r="${f(sunR)}" fill="${pal.accent}" />`)
  for (let i = 1; i <= 3; i++) {
    parts.push(`<path d="M${f(sunX - sunR * 1.3)} ${f(sunY + sunR * 0.2 * i)} q${f(sunR * 0.4)} ${f(-sunR * 0.18)} ${f(sunR * 0.8)} 0 t${f(sunR * 0.8)} 0 t${f(sunR * 0.8)} 0" fill="none" stroke="${pal.ground}" stroke-width="${f(sw * 1.4)}" />`)
  }
  // horizon + waves
  parts.push(`<line x1="${f(w * 0.05)}" y1="${f(horizon)}" x2="${f(w * 0.95)}" y2="${f(horizon)}" stroke="${ink}" stroke-width="${f(sw)}" />`)
  for (let i = 0; i < 6; i++) {
    const y = horizon + sceneH * (0.08 + i * 0.05)
    const x = w * (0.08 + rng() * 0.5)
    const len = w * (0.08 + rng() * 0.16)
    parts.push(`<path d="M${f(x)} ${f(y)} q${f(len * 0.25)} ${f(-sceneH * 0.03)} ${f(len * 0.5)} 0 t${f(len * 0.5)} 0" fill="none" stroke="${ink}" stroke-width="${f(sw)}" stroke-linecap="round" />`)
  }
  // sailboats
  for (let i = 0; i < 3; i++) {
    const x = w * (0.12 + rng() * 0.4)
    const y = horizon - sceneH * 0.01 - i * sceneH * 0.03
    const s = sceneH * (0.06 + rng() * 0.04)
    parts.push(`<path d="M${f(x)} ${f(y)} L${f(x)} ${f(y - s)} L${f(x + s * 0.55)} ${f(y - s * 0.15)}Z M${f(x - s * 0.35)} ${f(y)} L${f(x + s * 0.55)} ${f(y)} L${f(x + s * 0.4)} ${f(y + s * 0.15)} L${f(x - s * 0.25)} ${f(y + s * 0.15)}Z" fill="none" stroke="${ink}" stroke-width="${f(sw)}" stroke-linejoin="round" />`)
  }
  // clouds
  for (let i = 0; i < 3; i++) {
    const x = w * (0.1 + rng() * 0.7)
    const y = top + sceneH * (0.05 + rng() * 0.2)
    const s = sceneH * 0.06
    parts.push(`<path d="M${f(x)} ${f(y)} a${f(s * 0.5)} ${f(s * 0.5)} 0 0 1 ${f(s)} 0 a${f(s * 0.4)} ${f(s * 0.4)} 0 0 1 ${f(s * 0.8)} ${f(s * 0.2)} h${f(-s * 2.2)} a${f(s * 0.4)} ${f(s * 0.4)} 0 0 1 ${f(s * 0.4)} ${f(-s * 0.2)}Z" fill="none" stroke="${ink}" stroke-width="${f(sw)}" stroke-linejoin="round" />`)
  }
  // palms right, umbrella left
  parts.push(palm(w * 0.82, h * 0.98, sceneH * 0.62, ink, sw, -0.6))
  parts.push(palm(w * 0.9, h * 0.99, sceneH * 0.44, ink, sw, -0.3))
  const ux = w * 0.24
  const uy = h * 0.72
  const ur = sceneH * 0.17
  parts.push(`<path d="M${f(ux - ur)} ${f(uy)} Q${f(ux)} ${f(uy - ur * 0.9)} ${f(ux + ur)} ${f(uy)} Z" fill="none" stroke="${ink}" stroke-width="${f(sw)}" />`)
  for (let i = 1; i < 4; i++) {
    const t = -1 + (i / 4) * 2
    parts.push(`<path d="M${f(ux)} ${f(uy - ur * 0.9)} Q${f(ux + t * ur * 0.5)} ${f(uy - ur * 0.6)} ${f(ux + t * ur)} ${f(uy)}" fill="none" stroke="${ink}" stroke-width="${f(sw * 0.8)}" />`)
  }
  parts.push(`<line x1="${f(ux)}" y1="${f(uy)}" x2="${f(ux)}" y2="${f(h * 0.97)}" stroke="${ink}" stroke-width="${f(sw)}" />`)
  // sand line
  parts.push(`<path d="M0 ${f(h * 0.9)} Q${f(w * 0.3)} ${f(h * 0.86)} ${f(w * 0.6)} ${f(h * 0.9)} T${f(w)} ${f(h * 0.88)}" fill="none" stroke="${ink}" stroke-width="${f(sw)}" />`)
  return `<g data-bg="line-scene" data-art="hero">${parts.join('')}</g>`
}

/* -------------------------------------------------------------------- wave */

export function wave(w: number, h: number, pal: StudioPalette, seed: number, _opts: BackgroundOpts): string {
  const rng = mulberry32(seed)
  const parts: string[] = [ground(w, h, pal.ground)]
  const bands = 5
  for (let i = 0; i < bands; i++) {
    const y = h * (0.15 + (i / bands) * 0.9)
    const amp = h * (0.06 + rng() * 0.06)
    const d = `M0 ${f(y)} C${f(w * 0.25)} ${f(y - amp)} ${f(w * 0.5)} ${f(y + amp)} ${f(w)} ${f(y - amp * 0.4)} L${f(w)} ${f(h)} L0 ${f(h)}Z`
    parts.push(`<path d="${d}" fill="${pal.accent2}" fill-opacity="${f(0.18 + i * 0.12)}" />`)
  }
  return `<g data-bg="wave">${parts.join('')}</g>`
}

/* ----------------------------------------------------------------- circuit */

export function circuit(w: number, h: number, pal: StudioPalette, seed: number, _opts: BackgroundOpts): string {
  const rng = mulberry32(seed)
  const parts: string[] = [ground(w, h, pal.ground)]
  const step = Math.max(4, Math.min(w, h) / 9)
  let traces = ''
  for (let i = 0; i < 14; i++) {
    let x = Math.round((rng() * w) / step) * step
    let y = Math.round((rng() * h) / step) * step
    let d = `M${f(x)} ${f(y)}`
    for (let k = 0; k < 3; k++) {
      if (rng() < 0.5) x = Math.max(0, Math.min(w, x + (rng() < 0.5 ? -1 : 1) * step * (1 + Math.floor(rng() * 2))))
      else y = Math.max(0, Math.min(h, y + (rng() < 0.5 ? -1 : 1) * step * (1 + Math.floor(rng() * 2))))
      d += ` L${f(x)} ${f(y)}`
    }
    traces += `<path d="${d}" fill="none" stroke="${pal.accent}" stroke-opacity="0.22" stroke-width="0.18" /><circle cx="${f(x)}" cy="${f(y)}" r="0.5" fill="${pal.accent}" fill-opacity="0.4" />`
  }
  parts.push(`<g data-texture="traces">${traces}</g>`)
  return `<g data-bg="circuit">${parts.join('')}</g>`
}

/* ------------------------------------------------------------------- paper */

export function paper(w: number, h: number, pal: StudioPalette, seed: number): string {
  const rng = mulberry32(seed)
  let speckle = ''
  for (let i = 0; i < Math.round(w * h * 0.06); i++) {
    speckle += `<circle cx="${f(rng() * w)}" cy="${f(rng() * h)}" r="${f(0.05 + rng() * 0.1)}" fill="${pal.ink}" fill-opacity="0.06" />`
  }
  return `<g data-bg="paper">${ground(w, h, pal.ground)}<g data-texture="speckle">${speckle}</g></g>`
}
