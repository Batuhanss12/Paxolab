/**
 * A conservative bounding box for a fragment of studio markup — the control-point hull.
 *
 * The illustrator draws with paths, circles and ellipses under translate/rotate groups, and says
 * nothing about how far the drawing reaches: `speciesHero` takes a nominal size, and the picture
 * spills past it by a species- and arrangement-dependent amount. Measured in the browser at a
 * nominal 100: an arch reaches 155 wide, a spray 148 tall, a lavender sprig only 48 wide. The
 * `heroAspect` table that sized the subject before said 56 for that arch. On a face with room to
 * spare the difference was invisible; in a composition that sits the subject under a brand line
 * and on a band's edge it put a flower head through the city line.
 *
 * So the reach is read off the markup itself: every point a path passes through or bends toward,
 * every ellipse's exact extent under its transform, padded by half the stroke. A Bézier curve
 * never leaves the hull of its control points, so the box is never smaller than the drawing and
 * rarely more than a few percent larger. Checked against the browser's own `getBBox` over
 * 16 species × 7 arrangements × 2 styles × 5 seeds.
 *
 * Not a general SVG engine: `<defs>`, clip paths and masks are skipped (a clip can only make the
 * drawing smaller, so ignoring it keeps the box conservative), arc flags must be space-separated
 * as the studio writes them, and text is not measured here — the ledger books type from the
 * metrics in `text.ts`.
 */
export type Hull = { minX: number; minY: number; maxX: number; maxY: number }

/** SVG matrix [a b c d e f]: x' = a·x + c·y + e, y' = b·x + d·y + f. */
type Mat = readonly [number, number, number, number, number, number]
const IDENTITY: Mat = [1, 0, 0, 1, 0, 0]

/** m × n — n is applied first, then m. */
function multiply(m: Mat, n: Mat): Mat {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ]
}

/** How much a length grows under the matrix, for stroke padding — the geometric mean scale. */
function scaleOf(m: Mat): number {
  return Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])) || 1
}

export function parseTransform(value: string | undefined): Mat {
  let m: Mat = IDENTITY
  if (!value) return m
  const re = /(matrix|translate|rotate|scale|skewX|skewY)\s*\(([^)]*)\)/g
  let hit: RegExpExecArray | null
  while ((hit = re.exec(value))) {
    const args = hit[2].split(/[\s,]+/).filter(Boolean).map(Number)
    let t: Mat = IDENTITY
    switch (hit[1]) {
      case 'matrix':
        if (args.length === 6) t = [args[0]!, args[1]!, args[2]!, args[3]!, args[4]!, args[5]!]
        break
      case 'translate':
        t = [1, 0, 0, 1, args[0] ?? 0, args[1] ?? 0]
        break
      case 'scale':
        t = [args[0] ?? 1, 0, 0, args[1] ?? args[0] ?? 1, 0, 0]
        break
      case 'rotate': {
        const rad = ((args[0] ?? 0) * Math.PI) / 180
        const cos = Math.cos(rad)
        const sin = Math.sin(rad)
        const rot: Mat = [cos, sin, -sin, cos, 0, 0]
        if (args.length >= 3) {
          const cx = args[1]!
          const cy = args[2]!
          t = multiply(multiply([1, 0, 0, 1, cx, cy], rot), [1, 0, 0, 1, -cx, -cy])
        } else t = rot
        break
      }
      case 'skewX':
        t = [1, 0, Math.tan(((args[0] ?? 0) * Math.PI) / 180), 1, 0, 0]
        break
      case 'skewY':
        t = [1, Math.tan(((args[0] ?? 0) * Math.PI) / 180), 0, 1, 0, 0]
        break
    }
    m = multiply(m, t)
  }
  return m
}

function attr(attrs: string, name: string): string | undefined {
  const hit = new RegExp(`(?:^|\\s)${name}="([^"]*)"`).exec(attrs)
  return hit ? hit[1] : undefined
}

function num(attrs: string, name: string, fallback = 0): number {
  const raw = attr(attrs, name)
  const n = raw === undefined ? NaN : Number(raw)
  return Number.isFinite(n) ? n : fallback
}

class HullBuilder {
  minX = Infinity
  minY = Infinity
  maxX = -Infinity
  maxY = -Infinity

  private extend(x: number, y: number, pad: number): void {
    this.minX = Math.min(this.minX, x - pad)
    this.minY = Math.min(this.minY, y - pad)
    this.maxX = Math.max(this.maxX, x + pad)
    this.maxY = Math.max(this.maxY, y + pad)
  }

  point(m: Mat, x: number, y: number, pad: number): void {
    this.extend(m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5], pad)
  }

  /** An ellipse under an affine map is an ellipse; its axis-aligned extent has a closed form. */
  ellipse(m: Mat, cx: number, cy: number, rx: number, ry: number, pad: number): void {
    const px = m[0] * cx + m[2] * cy + m[4]
    const py = m[1] * cx + m[3] * cy + m[5]
    const hw = Math.hypot(m[0] * rx, m[2] * ry)
    const hh = Math.hypot(m[1] * rx, m[3] * ry)
    this.extend(px - hw, py - hh, pad)
    this.extend(px + hw, py + hh, pad)
  }

  get empty(): boolean {
    return !Number.isFinite(this.minX)
  }

  hull(): Hull {
    return { minX: this.minX, minY: this.minY, maxX: this.maxX, maxY: this.maxY }
  }
}

const NUMBER = /[a-zA-Z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g

/** Every point a path passes through or bends toward, in the path's own coordinates, mapped through `m`. */
function walkPath(d: string, m: Mat, pad: number, out: HullBuilder): void {
  const tokens = d.match(NUMBER) ?? []
  let i = 0
  let cmd = ''
  let last = ''
  let x = 0
  let y = 0
  let startX = 0
  let startY = 0
  // The last control point, for the smooth curve commands that reflect it.
  let ctrlX = 0
  let ctrlY = 0
  const next = (): number => {
    const n = Number(tokens[i++])
    return Number.isFinite(n) ? n : 0
  }
  while (i < tokens.length) {
    const token = tokens[i]!
    if (/[a-zA-Z]/.test(token)) {
      cmd = token
      i += 1
    } else if (cmd === 'M') cmd = 'L'
    else if (cmd === 'm') cmd = 'l'
    if (!cmd) break
    const rel = cmd === cmd.toLowerCase()
    const op = cmd.toUpperCase()
    const dx = rel ? x : 0
    const dy = rel ? y : 0
    switch (op) {
      case 'M':
      case 'L': {
        const nx = next() + dx
        const ny = next() + dy
        out.point(m, nx, ny, pad)
        x = nx
        y = ny
        if (op === 'M') {
          startX = x
          startY = y
        }
        break
      }
      case 'H': {
        const nx = next() + dx
        out.point(m, nx, y, pad)
        x = nx
        break
      }
      case 'V': {
        const ny = next() + dy
        out.point(m, x, ny, pad)
        y = ny
        break
      }
      case 'C': {
        const x1 = next() + dx
        const y1 = next() + dy
        const x2 = next() + dx
        const y2 = next() + dy
        const nx = next() + dx
        const ny = next() + dy
        out.point(m, x1, y1, pad)
        out.point(m, x2, y2, pad)
        out.point(m, nx, ny, pad)
        ctrlX = x2
        ctrlY = y2
        x = nx
        y = ny
        break
      }
      case 'S': {
        const x1 = /[CS]/i.test(last) ? 2 * x - ctrlX : x
        const y1 = /[CS]/i.test(last) ? 2 * y - ctrlY : y
        const x2 = next() + dx
        const y2 = next() + dy
        const nx = next() + dx
        const ny = next() + dy
        out.point(m, x1, y1, pad)
        out.point(m, x2, y2, pad)
        out.point(m, nx, ny, pad)
        ctrlX = x2
        ctrlY = y2
        x = nx
        y = ny
        break
      }
      case 'Q': {
        const x1 = next() + dx
        const y1 = next() + dy
        const nx = next() + dx
        const ny = next() + dy
        out.point(m, x1, y1, pad)
        out.point(m, nx, ny, pad)
        ctrlX = x1
        ctrlY = y1
        x = nx
        y = ny
        break
      }
      case 'T': {
        const x1 = /[QT]/i.test(last) ? 2 * x - ctrlX : x
        const y1 = /[QT]/i.test(last) ? 2 * y - ctrlY : y
        const nx = next() + dx
        const ny = next() + dy
        out.point(m, x1, y1, pad)
        out.point(m, nx, ny, pad)
        ctrlX = x1
        ctrlY = y1
        x = nx
        y = ny
        break
      }
      case 'A': {
        const rx = Math.abs(next())
        const ry = Math.abs(next())
        const phi = next()
        const large = next() !== 0
        const sweep = next() !== 0
        const nx = next() + dx
        const ny = next() + dy
        for (const [px, py] of arcPoints(x, y, rx, ry, phi, large, sweep, nx, ny)) out.point(m, px, py, pad)
        x = nx
        y = ny
        break
      }
      case 'Z': {
        x = startX
        y = startY
        break
      }
      default:
        // An unknown letter: skip it so a stray token cannot loop forever.
        break
    }
    last = cmd
  }
}

/**
 * Points along an elliptical arc, dense enough that the chords miss the curve by a hair.
 *
 * The endpoint form SVG writes is converted to a centre and a sweep (SVG spec F.6.5), then the arc
 * is sampled every five degrees plus both ends. Sampling rather than solving for the extremes
 * keeps the answer right under any transform the caller applies afterwards. The wreath's ring
 * is an arc: boxed by its radii around both ends, as a first cut did, it reported a hull 1.7 ×
 * wider than the drawing and the wreath was fitted at two-thirds of the room it had.
 */
function arcPoints(x1: number, y1: number, rxIn: number, ryIn: number, phiDeg: number, large: boolean, sweep: boolean, x2: number, y2: number): [number, number][] {
  if (rxIn === 0 || ryIn === 0 || (x1 === x2 && y1 === y2)) return [[x1, y1], [x2, y2]]
  const phi = (phiDeg * Math.PI) / 180
  const cosPhi = Math.cos(phi)
  const sinPhi = Math.sin(phi)
  const hx = (x1 - x2) / 2
  const hy = (y1 - y2) / 2
  const x1p = cosPhi * hx + sinPhi * hy
  const y1p = -sinPhi * hx + cosPhi * hy
  let rx = rxIn
  let ry = ryIn
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry)
  if (lambda > 1) {
    rx *= Math.sqrt(lambda)
    ry *= Math.sqrt(lambda)
  }
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p
  const coef = (large !== sweep ? 1 : -1) * Math.sqrt(Math.max(0, den === 0 ? 0 : num / den))
  const cxp = (coef * rx * y1p) / ry
  const cyp = (coef * -ry * x1p) / rx
  const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2
  const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2
  const angle = (ux: number, uy: number, vx: number, vy: number): number => {
    const dot = ux * vx + uy * vy
    const len = Math.hypot(ux, uy) * Math.hypot(vx, vy)
    const a = Math.acos(Math.max(-1, Math.min(1, dot / len)))
    return ux * vy - uy * vx < 0 ? -a : a
  }
  const theta1 = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry)
  let delta = angle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry)
  if (!sweep && delta > 0) delta -= Math.PI * 2
  if (sweep && delta < 0) delta += Math.PI * 2
  const steps = Math.max(2, Math.ceil(Math.abs(delta) / (Math.PI / 36)))
  const pts: [number, number][] = []
  for (let k = 0; k <= steps; k++) {
    const t = theta1 + (delta * k) / steps
    pts.push([cx + rx * Math.cos(t) * cosPhi - ry * Math.sin(t) * sinPhi, cy + rx * Math.cos(t) * sinPhi + ry * Math.sin(t) * cosPhi])
  }
  // The chord of a five-degree step sits inside the curve by r·(1 − cos 2.5°); pad that back.
  const sag = Math.max(rx, ry) * (1 - Math.cos(Math.PI / 72))
  return pts.flatMap(([px, py]) => [
    [px - sag, py - sag],
    [px + sag, py + sag],
  ])
}

const SKIPPED = new Set(['defs', 'clippath', 'mask', 'symbol', 'marker', 'pattern', 'lineargradient', 'radialgradient', 'filter', 'style', 'title', 'desc', 'metadata'])
const CONTAINERS = new Set(['g', 'svg', 'a', 'switch'])

const TAG = /<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g

/** The hull of everything drawn in the fragment, or null when nothing is. */
export function svgHull(markup: string): Hull | null {
  const out = new HullBuilder()
  const stack: { m: Mat; stroke: number }[] = [{ m: IDENTITY, stroke: 0 }]
  let skipDepth = 0
  TAG.lastIndex = 0
  let hit: RegExpExecArray | null
  while ((hit = TAG.exec(markup))) {
    const closing = hit[1] === '/'
    const name = hit[2]!.toLowerCase()
    const attrs = hit[3] ?? ''
    const selfClosing = hit[4] === '/'
    if (closing) {
      if (SKIPPED.has(name)) skipDepth = Math.max(0, skipDepth - 1)
      else if (!skipDepth && CONTAINERS.has(name) && stack.length > 1) stack.pop()
      continue
    }
    if (SKIPPED.has(name)) {
      if (!selfClosing) skipDepth += 1
      continue
    }
    if (skipDepth) continue
    const parent = stack[stack.length - 1]!
    const m = multiply(parent.m, parseTransform(attr(attrs, 'transform')))
    const strokeAttr = attr(attrs, 'stroke-width')
    const stroke = strokeAttr !== undefined && Number.isFinite(Number(strokeAttr)) ? Number(strokeAttr) : parent.stroke
    if (CONTAINERS.has(name)) {
      if (!selfClosing) stack.push({ m, stroke })
      continue
    }
    const painted = attr(attrs, 'stroke') !== 'none' && (attr(attrs, 'stroke') !== undefined || parent.stroke > 0)
    const pad = (painted ? stroke / 2 : 0) * scaleOf(m)
    switch (name) {
      case 'path':
        walkPath(attr(attrs, 'd') ?? '', m, pad, out)
        break
      case 'circle': {
        const r = num(attrs, 'r')
        out.ellipse(m, num(attrs, 'cx'), num(attrs, 'cy'), r, r, pad)
        break
      }
      case 'ellipse':
        out.ellipse(m, num(attrs, 'cx'), num(attrs, 'cy'), num(attrs, 'rx'), num(attrs, 'ry'), pad)
        break
      case 'rect': {
        const x = num(attrs, 'x')
        const y = num(attrs, 'y')
        const w = num(attrs, 'width')
        const h = num(attrs, 'height')
        for (const [px, py] of [
          [x, y],
          [x + w, y],
          [x, y + h],
          [x + w, y + h],
        ] as const) out.point(m, px, py, pad)
        break
      }
      case 'line':
        out.point(m, num(attrs, 'x1'), num(attrs, 'y1'), pad)
        out.point(m, num(attrs, 'x2'), num(attrs, 'y2'), pad)
        break
      case 'polygon':
      case 'polyline': {
        const pts = (attr(attrs, 'points') ?? '').match(/[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g)?.map(Number) ?? []
        for (let k = 0; k + 1 < pts.length; k += 2) out.point(m, pts[k]!, pts[k + 1]!, pad)
        break
      }
      default:
        break
    }
  }
  return out.empty ? null : out.hull()
}
