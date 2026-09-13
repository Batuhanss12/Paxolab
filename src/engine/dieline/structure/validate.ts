import type { DielineModel, Point } from '../../../types'
import type { GlueArea, PanelEdge, StructuralFlap, ValidationFinding } from './types'
import { graphConnected } from './graph'

const EPS = 0.08

function dist(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function closed(path: Point[]): boolean {
  if (path.length < 3) return false
  const a = path[0]!
  const b = path[path.length - 1]!
  return dist(a, b) <= 0.2
}

/** FORMA rings are drawn with SVG Z even when the first point is not repeated. */
function manufacturingRing(path: Point[]): boolean {
  return path.length >= 3
}

function orient(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
}

function onSeg(a: Point, b: Point, p: Point): boolean {
  return (
    Math.min(a.x, b.x) - EPS <= p.x &&
    p.x <= Math.max(a.x, b.x) + EPS &&
    Math.min(a.y, b.y) - EPS <= p.y &&
    p.y <= Math.max(a.y, b.y) + EPS
  )
}

function segmentsCross(a: Point, b: Point, c: Point, d: Point): boolean {
  if (dist(a, b) < EPS || dist(c, d) < EPS) return false
  const o1 = orient(a, b, c)
  const o2 = orient(a, b, d)
  const o3 = orient(c, d, a)
  const o4 = orient(c, d, b)
  if (Math.abs(o1) < EPS && onSeg(a, b, c)) return false
  if (Math.abs(o2) < EPS && onSeg(a, b, d)) return false
  if (Math.abs(o3) < EPS && onSeg(c, d, a)) return false
  if (Math.abs(o4) < EPS && onSeg(c, d, b)) return false
  return o1 * o2 < 0 && o3 * o4 < 0
}

function selfIntersects(path: Point[]): boolean {
  const pts = closed(path) ? path.slice(0, -1) : path
  const n = pts.length
  if (n < 4) return false
  for (let i = 0; i < n; i++) {
    const a = pts[i]!
    const b = pts[(i + 1) % n]!
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue
      const c = pts[j]!
      const d = pts[(j + 1) % n]!
      if (segmentsCross(a, b, c, d)) return true
    }
  }
  return false
}

function pointInPoly(p: Point, poly: Point[]): boolean {
  const pts = closed(poly) ? poly.slice(0, -1) : poly
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i]!
    const b = pts[j]!
    const hit = a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y + 1e-12) + a.x
    if (hit) inside = !inside
  }
  return inside
}

function bboxOverlap(a: Point[], b: Point[], pad = 0): boolean {
  const ax = a.map((p) => p.x)
  const ay = a.map((p) => p.y)
  const bx = b.map((p) => p.x)
  const by = b.map((p) => p.y)
  return !(
    Math.max(...ax) < Math.min(...bx) - pad ||
    Math.max(...bx) < Math.min(...ax) - pad ||
    Math.max(...ay) < Math.min(...by) - pad ||
    Math.max(...by) < Math.min(...ay) - pad
  )
}

function interiorsOverlap(a: Point[], b: Point[]): boolean {
  if (a.length < 3 || b.length < 3 || !bboxOverlap(a, b, -0.4)) return false
  const pa = closed(a) ? a.slice(0, -1) : a
  const pb = closed(b) ? b.slice(0, -1) : b
  for (let i = 0; i < pa.length; i++) {
    const a1 = pa[i]!
    const a2 = pa[(i + 1) % pa.length]!
    for (let j = 0; j < pb.length; j++) {
      const b1 = pb[j]!
      const b2 = pb[(j + 1) % pb.length]!
      if (segmentsCross(a1, a2, b1, b2)) return true
    }
  }
  const ca = { x: pa.reduce((s, p) => s + p.x, 0) / pa.length, y: pa.reduce((s, p) => s + p.y, 0) / pa.length }
  const cb = { x: pb.reduce((s, p) => s + p.x, 0) / pb.length, y: pb.reduce((s, p) => s + p.y, 0) / pb.length }
  return pointInPoly(ca, pb) || pointInPoly(cb, pa)
}

function segKey(a: Point, b: Point): string {
  const k1 = `${a.x.toFixed(2)},${a.y.toFixed(2)}`
  const k2 = `${b.x.toFixed(2)},${b.y.toFixed(2)}`
  return k1 < k2 ? `${k1}>${k2}` : `${k2}>${k1}`
}

export function validateProduction(input: {
  model: DielineModel
  edges: PanelEdge[]
  flaps: StructuralFlap[]
  glueAreas: GlueArea[]
}): ValidationFinding[] {
  const findings: ValidationFinding[] = []
  const { model, edges, flaps, glueAreas } = input
  const { L, W, H } = model.dimensions

  if (L <= 0 || H <= 0) {
    findings.push({ code: 'DIMENSIONS_INVALID', severity: 'FATAL', message: 'width/height mm geçersiz' })
  }
  if (model.structureId !== 'flat-label' && model.structureId !== 'wrap-label' && W <= 0) {
    findings.push({ code: 'DIMENSIONS_INVALID', severity: 'ERROR', message: 'kutu derinliği (depth) yok' })
  }

  if (!graphConnected(edges, model.panels.map((p) => p.id))) {
    findings.push({ code: 'PANELS_DISCONNECTED', severity: 'ERROR', message: 'gövde panelleri crease ile bağlı değil' })
  }

  const rings = model.cut.filter((r) => r.length >= 3)
  if (rings.length === 0) {
    findings.push({ code: 'CUT_MISSING', severity: 'FATAL', message: 'CUT kontur yok' })
  }
  for (const [i, ring] of rings.entries()) {
    if (!manufacturingRing(ring)) {
      findings.push({ code: 'CUT_OPEN', severity: 'FATAL', message: `CUT ${i} açık kontur` })
    } else if (!closed(ring)) {
      findings.push({ code: 'CUT_OPEN', severity: 'INFO', message: `CUT ${i} örtük kapalı (Z)` })
    }
    if (selfIntersects(ring)) {
      findings.push({ code: 'CUT_SELF_INTERSECTION', severity: 'FATAL', message: `CUT ${i} kendini kesiyor` })
    }
    for (let k = 0; k < ring.length - 1; k++) {
      if (dist(ring[k]!, ring[k + 1]!) < EPS) {
        findings.push({ code: 'ZERO_LENGTH_EDGE', severity: 'WARNING', message: `CUT ${i} sıfır uzunluk` })
        break
      }
    }
  }

  const seen = new Set<string>()
  for (const [a, b] of model.crease) {
    if (dist(a, b) < EPS) {
      findings.push({ code: 'CREASE_ZERO', severity: 'ERROR', message: 'sıfır uzunlukta crease' })
      continue
    }
    const key = segKey(a, b)
    if (seen.has(key)) findings.push({ code: 'DUPLICATE_GEOMETRY', severity: 'WARNING', message: 'yinelenen crease' })
    seen.add(key)
  }

  if (model.structureId !== 'flat-label' && model.structureId !== 'wrap-label' && model.crease.length === 0) {
    findings.push({ code: 'CREASE_MISSING', severity: 'ERROR', message: 'CREASE yok' })
  }

  for (let i = 0; i < flaps.length; i++) {
    for (let j = i + 1; j < flaps.length; j++) {
      const A = flaps[i]!
      const B = flaps[j]!
      if (A.parentPanel && A.parentPanel === B.parentPanel) continue
      if (interiorsOverlap(A.polygon, B.polygon)) {
        findings.push({
          code: 'STRUCTURAL_COLLISION',
          severity: 'FATAL',
          message: `${A.id} ∩ ${B.id} düz nette yasak flap çakışması`,
        })
      }
    }
  }

  for (const glue of glueAreas) {
    if (glue.width < 6 || glue.height < 10) {
      findings.push({ code: 'GLUE_AREA_SMALL', severity: 'WARNING', message: `${glue.panelId} yapışma yüzeyi dar` })
    }
    for (const flap of flaps) {
      if (interiorsOverlap(glue.polygon, flap.polygon)) {
        findings.push({
          code: 'GLUE_FLAP_OVERLAP',
          severity: 'ERROR',
          message: `yapışma ${glue.panelId} flap ${flap.id} ile kesişiyor`,
        })
      }
    }
  }

  return findings
}

export function releaseReady(findings: ValidationFinding[]): boolean {
  return findings.every((f) => f.severity === 'INFO' || f.severity === 'WARNING')
}
