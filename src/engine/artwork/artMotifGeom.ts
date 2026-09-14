/**
 * Lightweight SVG geometry for motif atomization (no DOM).
 * BBoxes are conservative (control points included) — good enough to cluster
 * and to crop a tight viewBox around a motif.
 */
export type BBox = { x: number; y: number; w: number; h: number }
export type Matrix = [number, number, number, number, number, number]

export const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0]

export function bboxArea(b: BBox): number {
  return Math.max(0, b.w) * Math.max(0, b.h)
}

export function bboxUnion(a: BBox | null, b: BBox | null): BBox | null {
  if (!a) return b
  if (!b) return a
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y }
}

export function bboxPad(b: BBox, pad: number): BBox {
  return { x: b.x - pad, y: b.y - pad, w: b.w + pad * 2, h: b.h + pad * 2 }
}

export function bboxExpand(b: BBox, gap: number): BBox {
  return bboxPad(b, gap)
}

export function bboxOverlaps(a: BBox, b: BBox): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

export function bboxIntersection(a: BBox, b: BBox): BBox | null {
  const x = Math.max(a.x, b.x)
  const y = Math.max(a.y, b.y)
  const r = Math.min(a.x + a.w, b.x + b.w)
  const btm = Math.min(a.y + a.h, b.y + b.h)
  if (r <= x || btm <= y) return null
  return { x, y, w: r - x, h: btm - y }
}

export function bboxIntersectionArea(a: BBox, b: BBox): number {
  const hit = bboxIntersection(a, b)
  return hit ? bboxArea(hit) : 0
}

export function bboxViewBox(b: BBox): string {
  return `${round(b.x)} ${round(b.y)} ${round(Math.max(0.01, b.w))} ${round(Math.max(0.01, b.h))}`
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}

export function multiply(a: Matrix, b: Matrix): Matrix {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ]
}

export function applyMat(m: Matrix, x: number, y: number): { x: number; y: number } {
  return { x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] }
}

export function parseTransform(attr: string | undefined): Matrix {
  if (!attr) return IDENTITY
  let m = IDENTITY
  const re = /(matrix|translate|scale|rotate)\s*\(([^)]*)\)/gi
  let hit: RegExpExecArray | null
  while ((hit = re.exec(attr))) {
    const kind = hit[1].toLowerCase()
    const nums = hit[2].trim().split(/[\s,]+/).filter(Boolean).map(Number)
    if (kind === 'matrix' && nums.length >= 6) {
      m = multiply(m, [nums[0], nums[1], nums[2], nums[3], nums[4], nums[5]])
    } else if (kind === 'translate') {
      m = multiply(m, [1, 0, 0, 1, nums[0] || 0, nums[1] || 0])
    } else if (kind === 'scale') {
      const sx = nums[0] ?? 1
      const sy = nums[1] ?? sx
      m = multiply(m, [sx, 0, 0, sy, 0, 0])
    } else if (kind === 'rotate') {
      const ang = ((nums[0] || 0) * Math.PI) / 180
      const cx = nums[1] || 0
      const cy = nums[2] || 0
      const c = Math.cos(ang)
      const s = Math.sin(ang)
      m = multiply(m, multiply([1, 0, 0, 1, cx, cy], multiply([c, s, -s, c, 0, 0], [1, 0, 0, 1, -cx, -cy])))
    }
  }
  return m
}

const NUM = /[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g

function nums(s: string): number[] {
  const out: number[] = []
  let hit: RegExpExecArray | null
  NUM.lastIndex = 0
  const src = s
  while ((hit = NUM.exec(src))) out.push(Number(hit[0]))
  return out
}

function attr(tag: string, name: string): number | undefined {
  const m = tag.match(new RegExp(`\\b${name}="([^"]+)"`, 'i'))
  if (!m) return undefined
  const n = parseFloat(m[1])
  return Number.isFinite(n) ? n : undefined
}

function attrStr(tag: string, name: string): string | undefined {
  return tag.match(new RegExp(`\\b${name}="([^"]+)"`, 'i'))?.[1]
}

class Bounds {
  minX = Infinity
  minY = Infinity
  maxX = -Infinity
  maxY = -Infinity
  add(x: number, y: number) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return
    if (x < this.minX) this.minX = x
    if (y < this.minY) this.minY = y
    if (x > this.maxX) this.maxX = x
    if (y > this.maxY) this.maxY = y
  }
  box(): BBox | null {
    if (!Number.isFinite(this.minX)) return null
    return { x: this.minX, y: this.minY, w: this.maxX - this.minX, h: this.maxY - this.minY }
  }
}

export function pathBBox(d: string, mat: Matrix = IDENTITY): BBox | null {
  const b = new Bounds()
  const add = (x: number, y: number) => {
    const p = applyMat(mat, x, y)
    b.add(p.x, p.y)
  }
  const tokens: (string | number)[] = []
  const re = /([MmLlHhVvCcSsQqTtAaZz])|([-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?)/g
  let hit: RegExpExecArray | null
  while ((hit = re.exec(d))) {
    if (hit[1]) tokens.push(hit[1])
    else tokens.push(Number(hit[2]))
  }
  let i = 0
  let cx = 0
  let cy = 0
  let sx = 0
  let sy = 0
  let last = 'L'
  const take = () => {
    const v = tokens[i]
    i += 1
    return typeof v === 'number' ? v : 0
  }
  const hasNum = () => typeof tokens[i] === 'number'
  while (i < tokens.length) {
    const t = tokens[i]
    let cmd: string
    if (typeof t === 'string') {
      cmd = t
      i += 1
      last = cmd
    } else {
      cmd = last === 'M' ? 'L' : last === 'm' ? 'l' : last
    }
    const rel = cmd === cmd.toLowerCase()
    const c = cmd.toUpperCase()
    if (c === 'Z') {
      cx = sx
      cy = sy
      last = cmd
      continue
    }
    if (c === 'M' || c === 'L' || c === 'T') {
      while (hasNum()) {
        const x = take()
        const y = take()
        if (rel) {
          cx += x
          cy += y
        } else {
          cx = x
          cy = y
        }
        add(cx, cy)
        if (c === 'M') {
          sx = cx
          sy = cy
          last = rel ? 'm' : 'M'
        } else last = rel ? c.toLowerCase() : c
        if (c === 'M') {
          last = rel ? 'l' : 'L'
        }
      }
      continue
    }
    if (c === 'H') {
      while (hasNum()) {
        const x = take()
        cx = rel ? cx + x : x
        add(cx, cy)
      }
      last = cmd
      continue
    }
    if (c === 'V') {
      while (hasNum()) {
        const y = take()
        cy = rel ? cy + y : y
        add(cx, cy)
      }
      last = cmd
      continue
    }
    if (c === 'C') {
      while (hasNum()) {
        const x1 = take()
        const y1 = take()
        const x2 = take()
        const y2 = take()
        const x = take()
        const y = take()
        const p1x = rel ? cx + x1 : x1
        const p1y = rel ? cy + y1 : y1
        const p2x = rel ? cx + x2 : x2
        const p2y = rel ? cy + y2 : y2
        const px = rel ? cx + x : x
        const py = rel ? cy + y : y
        add(p1x, p1y)
        add(p2x, p2y)
        add(px, py)
        cx = px
        cy = py
      }
      last = cmd
      continue
    }
    if (c === 'S' || c === 'Q') {
      while (hasNum()) {
        const x1 = take()
        const y1 = take()
        const x = take()
        const y = take()
        const p1x = rel ? cx + x1 : x1
        const p1y = rel ? cy + y1 : y1
        const px = rel ? cx + x : x
        const py = rel ? cy + y : y
        add(p1x, p1y)
        add(px, py)
        cx = px
        cy = py
      }
      last = cmd
      continue
    }
    if (c === 'A') {
      while (hasNum()) {
        const rx = Math.abs(take())
        const ry = Math.abs(take())
        take()
        take()
        take()
        const x = take()
        const y = take()
        const px = rel ? cx + x : x
        const py = rel ? cy + y : y
        add(cx - rx, cy - ry)
        add(cx + rx, cy + ry)
        add(px - rx, py - ry)
        add(px + rx, py + ry)
        cx = px
        cy = py
      }
      last = cmd
      continue
    }
    i += 1
  }
  return b.box()
}

export function primitiveBBox(markup: string, parent: Matrix = IDENTITY): BBox | null {
  const gt = markup.indexOf('>')
  const head = gt >= 0 ? markup.slice(0, gt + 1) : markup
  const tag = head.match(/^<([A-Za-z][\w:.-]*)/)?.[1]?.toLowerCase() ?? ''
  const mat = multiply(parent, parseTransform(attrStr(head, 'transform')))
  if (tag === 'path') {
    const d = attrStr(head, 'd')
    return d ? pathBBox(d, mat) : null
  }
  if (tag === 'rect') {
    const x = attr(head, 'x') ?? 0
    const y = attr(head, 'y') ?? 0
    const w = attr(head, 'width') ?? 0
    const h = attr(head, 'height') ?? 0
    const p1 = applyMat(mat, x, y)
    const p2 = applyMat(mat, x + w, y + h)
    const p3 = applyMat(mat, x + w, y)
    const p4 = applyMat(mat, x, y + h)
    const box = new Bounds()
    box.add(p1.x, p1.y)
    box.add(p2.x, p2.y)
    box.add(p3.x, p3.y)
    box.add(p4.x, p4.y)
    return box.box()
  }
  if (tag === 'circle') {
    const cx = attr(head, 'cx') ?? 0
    const cy = attr(head, 'cy') ?? 0
    const r = attr(head, 'r') ?? 0
    const c = applyMat(mat, cx, cy)
    return { x: c.x - r, y: c.y - r, w: r * 2, h: r * 2 }
  }
  if (tag === 'ellipse') {
    const cx = attr(head, 'cx') ?? 0
    const cy = attr(head, 'cy') ?? 0
    const rx = attr(head, 'rx') ?? 0
    const ry = attr(head, 'ry') ?? 0
    const c = applyMat(mat, cx, cy)
    return { x: c.x - rx, y: c.y - ry, w: rx * 2, h: ry * 2 }
  }
  if (tag === 'line') {
    const p1 = applyMat(mat, attr(head, 'x1') ?? 0, attr(head, 'y1') ?? 0)
    const p2 = applyMat(mat, attr(head, 'x2') ?? 0, attr(head, 'y2') ?? 0)
    return bboxUnion(
      { x: p1.x, y: p1.y, w: 0, h: 0 },
      { x: p2.x, y: p2.y, w: 0, h: 0 },
    )
  }
  if (tag === 'polygon' || tag === 'polyline') {
    const pts = nums(attrStr(head, 'points') ?? '')
    const box = new Bounds()
    for (let i = 0; i + 1 < pts.length; i += 2) {
      const p = applyMat(mat, pts[i], pts[i + 1])
      box.add(p.x, p.y)
    }
    return box.box()
  }
  return null
}

export function countPrimitives(markup: string): number {
  return (markup.match(/<(path|circle|ellipse|rect|polygon|polyline|line)\b/gi) || []).length
}
