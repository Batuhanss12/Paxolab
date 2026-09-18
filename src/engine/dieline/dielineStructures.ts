/**
 * Dieline structures — tuck-end box, simple tray, flat label, wrap label.
 * Extracted from buildDieline.ts to isolate structure definitions from geometry.
 */
import type { DielineModel, DimensionsMm, Panel, Point } from '../../types'
import { bounds, creaseBetween, outlineUnion, rect } from './dielineGeometry'

function tuckEnd(d: DimensionsMm): DielineModel {
  const L = d.L
  const W = d.W
  const H = d.H
  const G = Math.min(18, Math.max(10, W * 0.42))
  const T = Math.min(20, Math.max(12, W * 0.5))
  const dust = Math.min(16, Math.max(8, W * 0.4))
  const top = T + W

  const glue = rect('glue', 'glue', 0, top, G, H)
  const left = rect('left', 'body', G, top, W, H)
  const front = rect('front', 'body', G + W, top, L, H)
  const right = rect('right', 'body', G + W + L, top, W, H)
  const back = rect('back', 'body', G + W + L + W, top, L, H)
  const topPanel = rect('top', 'flap', G + W, T, L, W)
  const topTuck = rect('topTuck', 'tuck', G + W, 0, L, T)
  const bottom = rect('bottom', 'flap', G + W, top + H, L, W)
  const bottomTuck = rect('bottomTuck', 'tuck', G + W, top + H + W, L, T)
  const leftDustT = rect('leftDustTop', 'flap', G, top - dust, W, dust)
  const rightDustT = rect('rightDustTop', 'flap', G + W + L, top - dust, W, dust)
  const leftDustB = rect('leftDustBottom', 'flap', G, top + H, W, dust)
  const rightDustB = rect('rightDustBottom', 'flap', G + W + L, top + H, W, dust)

  const panels = [
    glue, left, front, right, back,
    topPanel, topTuck, bottom, bottomTuck,
    leftDustT, rightDustT, leftDustB, rightDustB,
  ]

  const pairs: [Panel, Panel][] = [
    [glue, left], [left, front], [front, right], [right, back],
    [topTuck, topPanel], [topPanel, front], [front, bottom], [bottom, bottomTuck],
    [leftDustT, left], [rightDustT, right], [left, leftDustB], [right, rightDustB],
  ]
  const crease = pairs.map(([a, b]) => creaseBetween(a, b)).filter((x): x is [Point, Point] => !!x)

  const issues: string[] = []
  if (Math.abs(front.w - back.w) > 0.01) issues.push('Front/back width mismatch')
  if (Math.abs(left.w - right.w) > 0.01) issues.push('Left/right width mismatch')
  if (Math.abs(front.h - left.h) > 0.01) issues.push('Body height mismatch')
  if (Math.abs(topPanel.w - L) > 0.01 || Math.abs(topPanel.h - W) > 0.01) issues.push('Top panel not L×W')
  if (Math.abs(bottom.w - L) > 0.01 || Math.abs(bottom.h - W) > 0.01) issues.push('Bottom panel not L×W')

  const { width, height } = bounds(panels)
  return {
    structureId: 'tuck-end-box',
    unit: 'mm',
    width,
    height,
    dimensions: d,
    panels,
    cut: [outlineUnion(panels)],
    crease,
    glueIds: ['glue'],
    consistent: issues.length === 0,
    issues,
  }
}

function simpleTray(d: DimensionsMm): DielineModel {
  const { L, W, H } = d
  const back = rect('trayBack', 'body', H, 0, L, H)
  const left = rect('trayLeft', 'body', 0, H, H, W)
  const bottom = rect('trayBottom', 'body', H, H, L, W)
  const right = rect('trayRight', 'body', H + L, H, H, W)
  const front = rect('trayFront', 'body', H, H + W, L, H)
  const panels = [back, left, bottom, right, front]
  const crease = [
    creaseBetween(back, bottom),
    creaseBetween(left, bottom),
    creaseBetween(bottom, right),
    creaseBetween(bottom, front),
  ].filter((x): x is [Point, Point] => !!x)
  const { width, height } = bounds(panels)
  return {
    structureId: 'simple-tray',
    unit: 'mm',
    width,
    height,
    dimensions: d,
    panels,
    cut: [outlineUnion(panels)],
    crease,
    glueIds: [],
    consistent: true,
    issues: [],
  }
}

function labelBack(x: number, y: number, w: number, h: number): Panel {
  return rect('labelBack', 'body', x, y, w, h)
}

/**
 * A disc panel: bounding box like any other, but the cut line is a circle.
 *
 * `Panel` already carries `polygon` separately from `x/y/w/h`, so a round face needs no new type —
 * the box stays the layout's coordinate space and the polygon becomes what the knife follows.
 * Sampled at 72 steps because that is where the facets stop being visible against a 40 mm rim on a
 * 300 dpi proof, and the file stays small enough not to matter.
 */
function disc(id: string, x: number, y: number, dia: number): Panel {
  const r = dia / 2
  const polygon: Point[] = []
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2
    polygon.push({ x: x + r + Math.cos(a) * r, y: y + r + Math.sin(a) * r })
  }
  return { id, role: 'body', x, y, w: dia, h: dia, polygon }
}

/** A circle as a cut path — the punched hole a tag hangs from. */
function hole(cx: number, cy: number, r: number): Point[] {
  const pts: Point[] = []
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2
    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r })
  }
  return pts
}

/** Rounded rectangle outline, sampled at the corners only — a tag is not a disc. */
function roundedOutline(x: number, y: number, w: number, h: number, rad: number): Point[] {
  const pts: Point[] = []
  const corner = (cx: number, cy: number, from: number) => {
    for (let i = 0; i <= 6; i++) {
      const a = from + (i / 6) * (Math.PI / 2)
      pts.push({ x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad })
    }
  }
  corner(x + rad, y + rad, Math.PI)
  corner(x + w - rad, y + rad, -Math.PI / 2)
  corner(x + w - rad, y + h - rad, 0)
  corner(x + rad, y + h - rad, Math.PI / 2)
  return pts
}

/**
 * Swing tag — the piece that turns a design into a brand kit.
 *
 * Every bundle in the reference shop carries one, and Paxolab had no answer: a customer got a box
 * or a label and nothing to tie onto the product. The geometry is the only part that is not a plain
 * rectangle — a punched hole, which is a second cut path rather than part of the outline, because
 * the knife has to lift for it.
 */
function hangTag(d: DimensionsMm): DielineModel {
  const w = Math.max(24, d.L || 38)
  const h = Math.max(36, d.H || 76)
  const rad = Math.min(w * 0.16, 6)
  const holeR = Math.max(1.6, Math.min(2.6, w * 0.06))
  const holeY = Math.max(holeR * 2.2, h * 0.075)
  const gap = 8
  const front: Panel = { id: 'tag', role: 'body', x: 0, y: 0, w, h, polygon: roundedOutline(0, 0, w, h, rad) }
  const back: Panel = { id: 'tagBack', role: 'body', x: w + gap, y: 0, w, h, polygon: roundedOutline(w + gap, 0, w, h, rad) }
  return {
    structureId: 'hang-tag',
    unit: 'mm',
    width: back.x + back.w,
    height: h,
    dimensions: { L: w, W: 0, H: h },
    panels: [front, back],
    cut: [
      front.polygon,
      hole(w / 2, holeY, holeR),
      back.polygon,
      hole(w + gap + w / 2, holeY, holeR),
    ],
    crease: [],
    glueIds: [],
    consistent: true,
    issues: [],
  }
}

/**
 * Thank-you / care card — flat, two-sided, and the other half of a brand kit.
 *
 * No geometry to speak of, which is the point: what it needed was not a dieline but a *reason*, and
 * the reason is that a pack without one arrives as a product while a pack with one arrives as a
 * brand. Landscape by default, because that is how a card sits in a box.
 */
function insertCard(d: DimensionsMm): DielineModel {
  const w = Math.max(50, d.L || 90)
  const h = Math.max(35, d.H || 55)
  const gap = 8
  const front = rect('card', 'body', 0, 0, w, h)
  const back = rect('cardBack', 'body', w + gap, 0, w, h)
  return {
    structureId: 'insert-card',
    unit: 'mm',
    width: back.x + back.w,
    height: h,
    dimensions: { L: w, W: 0, H: h },
    panels: [front, back],
    cut: [front.polygon, back.polygon],
    crease: [],
    glueIds: [],
    consistent: true,
    issues: [],
  }
}

/**
 * Jar lid, balm tin, soap seal — the format the repertoire had no answer for.
 *
 * Diameter comes from the shorter of the two plan dimensions, because that is what a lid actually
 * measures; a customer who types 60 × 60 × 20 for a balm tin means a 60 mm disc, and one who types
 * 80 × 50 means the lid fits the 50.
 */
function roundLabel(d: DimensionsMm): DielineModel {
  const dia = Math.max(20, Math.min(d.L || 60, d.W || d.L || 60))
  const gap = 8
  const face = disc('label', 0, 0, dia)
  const back = disc('labelBack', dia + gap, 0, dia)
  return {
    structureId: 'round-label',
    unit: 'mm',
    width: back.x + back.w,
    height: dia,
    dimensions: { L: dia, W: dia, H: 0 },
    panels: [face, back],
    cut: [face.polygon, back.polygon],
    crease: [],
    glueIds: [],
    consistent: true,
    issues: [],
  }
}

/** An elliptical panel — the disc with two radii. Same sampling, same reasons. */
function ellipse(id: string, x: number, y: number, w: number, h: number): Panel {
  const rx = w / 2
  const ry = h / 2
  const polygon: Point[] = []
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2
    polygon.push({ x: x + rx + Math.cos(a) * rx, y: y + ry + Math.sin(a) * ry })
  }
  return { id, role: 'body', x, y, w, h, polygon }
}

/**
 * Oval bottle / jar label — the Raavi plate in the STİCKERR REF set, and the second curved
 * format after the disc. Width from L, height from H (the label's own two measures, as every
 * flat label here); a customer who types only one gets the classic 70 × 45 perfume oval.
 */
function ovalLabel(d: DimensionsMm): DielineModel {
  const w = Math.max(24, d.L || 70)
  const h = Math.max(16, d.H || Math.round(w * 0.64))
  const gap = 8
  const face = ellipse('label', 0, 0, w, h)
  const back = ellipse('labelBack', w + gap, 0, w, h)
  return {
    structureId: 'oval-label',
    unit: 'mm',
    width: back.x + back.w,
    height: h,
    dimensions: { L: w, W: 0, H: h },
    panels: [face, back],
    cut: [face.polygon, back.polygon],
    crease: [],
    glueIds: [],
    consistent: true,
    issues: [],
  }
}

function flatLabel(d: DimensionsMm): DielineModel {
  const w = d.L || 70
  const h = d.H || 90
  const gap = 8
  const panel = rect('label', 'body', 0, 0, w, h)
  const back = labelBack(w + gap, 0, w, h)
  return {
    structureId: 'flat-label',
    unit: 'mm',
    width: back.x + back.w,
    height: h,
    dimensions: { L: w, W: 0, H: h },
    panels: [panel, back],
    cut: [panel.polygon, back.polygon],
    crease: [],
    glueIds: [],
    consistent: true,
    issues: [],
  }
}

function wrapLabel(d: DimensionsMm): DielineModel {
  const w = d.L || 90
  const h = d.H || 70
  const overlap = Math.min(12, w * 0.12)
  const gap = 8
  const face = rect('label', 'body', 0, 0, w, h)
  const glue = rect('overlap', 'glue', w, 0, overlap, h)
  const crease = creaseBetween(face, glue)
  const back = labelBack(w + overlap + gap, 0, w, h)
  return {
    structureId: 'wrap-label',
    unit: 'mm',
    width: back.x + back.w,
    height: h,
    dimensions: { L: w, W: 0, H: h },
    panels: [face, glue, back],
    cut: [outlineUnion([face, glue]), back.polygon],
    crease: crease ? [crease] : [],
    glueIds: ['overlap'],
    consistent: true,
    issues: [],
  }
}

export { tuckEnd, simpleTray, flatLabel, wrapLabel, roundLabel, ovalLabel, hangTag, insertCard }
