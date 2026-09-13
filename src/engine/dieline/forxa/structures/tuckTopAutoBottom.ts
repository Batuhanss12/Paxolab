/**
 * Forxa — Tuck-top auto-bottom carton
 * ECMA A60.20.00.03, traced from owner drawing becf-11101.pdf
 * (Die Cut Templates BEECF-11101, 100 × 50 × 150 mm, 300 g / 0.389 mm).
 *
 * Net: [Glue] [Back A] [Side B] [Front A + top tuck] [Side B]
 * Bottom: interlocking auto-bottom flaps (flat net, no overlap).
 */
import type {
  DielineResult,
  FoldLine,
  PackagingStructure,
  Panel,
  Path,
  Point,
  StructureParameter,
  ValidationResult,
} from '../types'
import { bbox, linePath, polygonPath, rect, SVGBuilder } from '../svgBuilder'
import { getDefaultParams, mergeParams, validateParameters } from '../validator'

function close(points: Point[]): Path {
  if (!points.length) return []
  const first = points[0]!
  const last = points[points.length - 1]!
  if (first.x === last.x && first.y === last.y) return polygonPath(points)
  return polygonPath([...points, { ...first }])
}

function dustFlap(x0: number, x1: number, yBody: number, height: number, side: 'left' | 'right'): Point[] {
  const w = x1 - x0
  const inset = w * 0.16
  const tip = w * 0.19
  if (side === 'left') {
    return [
      { x: x0, y: yBody },
      { x: x0 + inset * 0.2, y: yBody - height * 0.22 },
      { x: x0 + inset, y: yBody - height },
      { x: x1, y: yBody - height },
      { x: x1, y: yBody },
    ]
  }
  return [
    { x: x0, y: yBody },
    { x: x0, y: yBody - height },
    { x: x1 - tip, y: yBody - height },
    { x: x1 - inset * 0.2, y: yBody - height * 0.22 },
    { x: x1, y: yBody },
  ]
}

function tuckTop(x0: number, x1: number, yBody: number, body: number, head: number, inset: number): Point[] {
  const yNeck = yBody - body
  const yTop = yNeck - head
  const xL = x0 + inset
  const xR = x1 - inset
  return [
    { x: x0, y: yBody },
    { x: x0, y: yNeck },
    { x: xL, y: yNeck },
    { x: xL, y: yNeck - 1 },
    { x: xL + (xR - xL) * 0.02, y: yTop },
    { x: xR - (xR - xL) * 0.02, y: yTop },
    { x: xR, y: yNeck - 1 },
    { x: xR, y: yNeck },
    { x: x1, y: yNeck },
    { x: x1, y: yBody },
  ]
}

/** A-panel crash-lock flap — ratios from becf-11101 at A=100, depth=36. */
function autoBottomA(x0: number, A: number, yBody: number, depth: number): Point[] {
  const d = depth
  return [
    { x: x0, y: yBody },
    { x: x0 + A * 0.0315, y: yBody + d },
    { x: x0 + A * 0.445, y: yBody + d },
    { x: x0 + A * 0.505, y: yBody + d * (30 / 36) },
    { x: x0 + A * 0.5, y: yBody + d * (25 / 36) },
    { x: x0 + A * 0.75, y: yBody + d * (25 / 36) },
    { x: x0 + A * 0.86, y: yBody + d },
    { x: x0 + A * 0.98, y: yBody + d },
    { x: x0 + A * 0.98, y: yBody + d * (7.9 / 36) },
    { x: x0 + A * 0.947, y: yBody + d * (4.6 / 36) },
    { x: x0 + A, y: yBody },
  ]
}

/** B-panel web flap — trapezoid from the same drawing. */
function autoBottomB(x0: number, B: number, yBody: number, depth: number): Point[] {
  const d = depth * (25 / 36)
  return [
    { x: x0, y: yBody },
    { x: x0 + B * 0.182, y: yBody + d },
    { x: x0 + B * 0.5, y: yBody + d },
    { x: x0 + B, y: yBody },
  ]
}

export class TuckTopAutoBottom implements PackagingStructure {
  id = 'tuck-top-auto-bottom'
  name = 'Tuck Top Auto Bottom'
  category = 'box' as const
  description = 'ECMA A60.20.00.03 — üst tuck, otomatik dip kilit'
  icon = 'box'

  parameters: StructureParameter[] = [
    { key: 'length', label: 'Boy (A)', unit: 'mm', min: 20, max: 400, default: 100, step: 1, required: true },
    { key: 'width', label: 'En (B)', unit: 'mm', min: 15, max: 250, default: 50, step: 1, required: true },
    { key: 'height', label: 'Yükseklik (C)', unit: 'mm', min: 20, max: 400, default: 150, step: 1, required: true },
    { key: 'glueTabWidth', label: 'Yapıştırma', unit: 'mm', min: 8, max: 20, default: 13, step: 0.5, required: false },
    { key: 'tuckLength', label: 'Tuck gövde', unit: 'mm', min: 10, max: 200, default: 50, step: 1, required: false },
    { key: 'dustFlapWidth', label: 'Dust yükseklik', unit: 'mm', min: 8, max: 80, default: 32, step: 1, required: false },
    { key: 'materialThickness', label: 'Kalınlık', unit: 'mm', min: 0, max: 2, default: 0, step: 0.01, required: false },
  ]

  getDefaultParameters(): Record<string, number> {
    return getDefaultParams(this.parameters)
  }

  validateParameters(params: Record<string, number>): ValidationResult {
    const base = validateParameters(params, this.parameters)
    if (!base.valid) return base
    const warnings: string[] = []
    if (params.tuckLength > params.width * 1.05) {
      warnings.push('Tuck uzunluğu derinlikten büyük — A60 referansında tuck ≈ B')
    }
    return { valid: true, errors: base.errors, warnings: [...base.warnings, ...warnings] }
  }

  generateDieline(userParams: Record<string, number>): DielineResult {
    const params = mergeParams(this.getDefaultParameters(), userParams)
    const validation = this.validateParameters(params)
    if (!validation.valid) {
      return {
        success: false,
        structureId: this.id,
        structureName: this.name,
        svg: '',
        paths: { cut: [], crease: [], glue: [], perf: [] },
        folds: [],
        panels: [],
        bounds: { width: 0, height: 0 },
        metadata: {
          totalArea: 0,
          materialUsage: 0,
          wastePercentage: 0,
          boundingBox: { width: 0, height: 0 },
          recommendedMaterial: '',
          complexity: 'medium',
          industryCompliance: ['ECMA-A60.20.00.03'],
        },
        warnings: validation.warnings,
        errors: validation.errors,
      }
    }

    const A = params.length
    const B = params.width
    const C = params.height
    const G = params.glueTabWidth
    const tuckBody = params.tuckLength || B
    const tuckHead = B * 0.28
    const tuckInset = B * 0.18
    const dustH = params.dustFlapWidth || B * 0.64
    const bottomH = B * 0.72
    const glueAngle = G * 0.27

    const x0 = 0
    const x1 = G
    const x2 = G + A
    const x3 = G + A + B
    const x4 = G + A + B + A
    const x5 = G + A + B + A + B

    const y1 = tuckHead + tuckBody
    const y2 = y1 + C

    const dustL = dustFlap(x2, x3, y1, dustH, 'left')
    const tuck = tuckTop(x3, x4, y1, tuckBody, tuckHead, tuckInset)
    const dustR = dustFlap(x4, x5, y1, dustH, 'right')
    const botR = autoBottomB(x4, B, y2, bottomH)
    const botFront = autoBottomA(x3, A, y2, bottomH)
    const botL = autoBottomB(x2, B, y2, bottomH)
    const botBack = autoBottomA(x1, A, y2, bottomH)

    const interior = (pts: Point[]) => (pts.length > 2 ? pts.slice(1, -1) : [])
    const outer: Point[] = [
      { x: x0, y: y1 + glueAngle },
      { x: x1, y: y1 },
      { x: x2, y: y1 },
      ...interior(dustL),
      { x: x3, y: y1 },
      ...interior(tuck),
      { x: x4, y: y1 },
      ...interior(dustR),
      { x: x5, y: y1 },
      { x: x5, y: y2 },
      ...interior(botR).reverse(),
      { x: x4, y: y2 },
      ...interior(botFront).reverse(),
      { x: x3, y: y2 },
      ...interior(botL).reverse(),
      { x: x2, y: y2 },
      ...interior(botBack).reverse(),
      { x: x1, y: y2 },
      { x: x0, y: y2 - glueAngle },
    ]

    const cutPaths: Path[] = [close(outer)]
    cutPaths.push(linePath({ x: x2, y: y1 }, { x: x2, y: y1 - dustH * 0.15 }))
    cutPaths.push(linePath({ x: x3, y: y1 }, { x: x3, y: y1 - tuckBody }))
    cutPaths.push(linePath({ x: x4, y: y1 }, { x: x4, y: y1 - tuckBody }))
    cutPaths.push(linePath({ x: x2, y: y2 }, { x: x2, y: y2 + bottomH * 0.2 }))
    cutPaths.push(linePath({ x: x3, y: y2 }, { x: x3, y: y2 + bottomH * 0.2 }))
    cutPaths.push(linePath({ x: x4, y: y2 }, { x: x4, y: y2 + bottomH * 0.2 }))

    const creasePaths: Path[] = [
      linePath({ x: x1, y: y1 }, { x: x1, y: y2 }),
      linePath({ x: x2, y: y1 }, { x: x2, y: y2 }),
      linePath({ x: x3, y: y1 }, { x: x3, y: y2 }),
      linePath({ x: x4, y: y1 }, { x: x4, y: y2 }),
      linePath({ x: x1, y: y1 }, { x: x2, y: y1 }),
      linePath({ x: x2, y: y1 }, { x: x3, y: y1 }),
      linePath({ x: x3, y: y1 }, { x: x4, y: y1 }),
      linePath({ x: x4, y: y1 }, { x: x5, y: y1 }),
      linePath({ x: x1, y: y2 }, { x: x2, y: y2 }),
      linePath({ x: x2, y: y2 }, { x: x3, y: y2 }),
      linePath({ x: x3, y: y2 }, { x: x4, y: y2 }),
      linePath({ x: x4, y: y2 }, { x: x5, y: y2 }),
      linePath({ x: x3 + tuckInset, y: y1 - tuckBody }, { x: x4 - tuckInset, y: y1 - tuckBody }),
    ]

    const gluePoly = close([
      { x: x0, y: y1 + glueAngle },
      { x: x1, y: y1 },
      { x: x1, y: y2 },
      { x: x0, y: y2 - glueAngle },
    ])
    const gluePaths: Path[] = [gluePoly]

    const folds: FoldLine[] = creasePaths.map((p) => ({
      from: p[0]!,
      to: p[1]!,
      angle: 90,
      type: 'valley' as const,
    }))

    const panels: Panel[] = [
      { id: 'glue-tab', name: 'Yapıştırma', polygon: gluePoly, face: 'glue' },
      { id: 'back', name: 'Arka', polygon: rect(x1, y1, A, C), face: 'back' },
      { id: 'side-left', name: 'Sol yan', polygon: rect(x2, y1, B, C), face: 'left' },
      { id: 'front', name: 'Ön', polygon: rect(x3, y1, A, C), face: 'front' },
      { id: 'side-right', name: 'Sağ yan', polygon: rect(x4, y1, B, C), face: 'right' },
      { id: 'top-tuck', name: 'Üst tuck', polygon: close(tuck), face: 'top' },
      { id: 'dust-left', name: 'Sol dust', polygon: close(dustL), face: 'top' },
      { id: 'dust-right', name: 'Sağ dust', polygon: close(dustR), face: 'top' },
      { id: 'auto-bottom-back', name: 'Dip kilit arka', polygon: close(botBack), face: 'bottom' },
      { id: 'auto-bottom-left', name: 'Dip kilit sol', polygon: close(botL), face: 'bottom' },
      { id: 'auto-bottom-front', name: 'Dip kilit ön', polygon: close(botFront), face: 'bottom' },
      { id: 'auto-bottom-right', name: 'Dip kilit sağ', polygon: close(botR), face: 'bottom' },
    ]

    const totalWidth = x5
    const totalHeight = y2 + bottomH
    const builder = new SVGBuilder({
      width: totalWidth,
      height: totalHeight,
      margin: 12,
      showGrid: false,
      showDimensions: true,
      showRegMarks: true,
    })
    for (const p of cutPaths) builder.addCutPath(p)
    for (const p of creasePaths) builder.addCreasePath(p)
    for (const p of gluePaths) builder.addGluePath(p)
    for (const f of folds) builder.addFold(f)
    for (const panel of panels) builder.addPanel(panel)

    const bb = bbox([...cutPaths, ...creasePaths])
    return {
      success: true,
      structureId: this.id,
      structureName: this.name,
      svg: builder.build(),
      paths: { cut: cutPaths, crease: creasePaths, glue: gluePaths, perf: [] },
      folds,
      panels,
      bounds: { width: totalWidth, height: totalHeight },
      metadata: {
        totalArea: bb.w * bb.h,
        materialUsage: 2 * A * C + 2 * B * C + A * tuckBody + G * C,
        wastePercentage: 0,
        boundingBox: { width: totalWidth, height: totalHeight },
        recommendedMaterial: '300 g/m² karton (becf-11101 referans)',
        complexity: 'medium',
        industryCompliance: ['ECMA-A60.20.00.03'],
      },
      warnings: validation.warnings,
      errors: [],
    }
  }
}

export default TuckTopAutoBottom
