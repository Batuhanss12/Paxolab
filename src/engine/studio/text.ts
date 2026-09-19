/**
 * Text metrics + placement ledger.
 *
 * SVG has no layout engine, so the studio measures text with per-face average glyph widths and
 * records every placed box. The ledger is what the studio preflight reads for collisions,
 * out-of-bounds and type-fit — it never parses the SVG back.
 */
import type { PlacedBox, StudioPanelReport, TypePairing } from './types'
import type { Panel } from '../../types'
import { escapeSvg } from '../artwork/svgGeometry'
import { typeSystem } from './typeSystem'

export type Face =
  | 'serif'
  | 'serif-italic'
  | 'serif-heavy'
  | 'sans'
  | 'sans-light'
  | 'sans-heavy'
  | 'script'
  | 'mono'
  | 'condensed-serif'
  | 'condensed-serif-italic'
  | 'condensed-grotesk'
  | 'rounded'

/** Loaded in `index.css` and inlined on the studio SVG so live previews match the DNA faces. */
export const STUDIO_FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Great+Vibes&family=Montserrat:wght@300;500;700&display=swap'

/** Latin + Turkish. Named faces, not a packed WOFF subset. */
export const STUDIO_FONT_UNICODE_RANGE =
  'U+0000-00FF, U+0100-024F, U+011E-011F, U+0130-0131, U+015E-015F, U+1E00-1EFF'

export const STUDIO_EXPORT_FONT_COMMENT =
  'Grapxor fonts: unicode-range Latin+TR named faces; binary WOFF not embedded; press fallback Georgia/Arial.'

/**
 * The families the Phase 4 faces come from, as Google Fonts asks for them. Imported only when the
 * face's type system uses one, so a face set in the original three families carries the same
 * style block it always did.
 */
const EXTRA_FAMILY: Partial<Record<Face, string>> = {
  'condensed-serif': 'Instrument+Serif:ital@0;1',
  'condensed-serif-italic': 'Instrument+Serif:ital@0;1',
  'condensed-grotesk': 'Barlow+Condensed:wght@600;700',
  rounded: 'Righteous',
  mono: 'IBM+Plex+Mono:wght@400;500',
}

export function studioFontStyle(pairing?: TypePairing): string {
  const extra = pairing ? [...new Set(Object.values(pairingFaces(pairing)).map((face) => EXTRA_FAMILY[face]).filter((f): f is string => Boolean(f)))] : []
  const imports = [STUDIO_FONT_HREF]
  if (extra.length) imports.push(`https://fonts.googleapis.com/css2?${extra.map((f) => `family=${f}`).join('&')}&display=swap`)
  return `<style data-art="studio-fonts">${imports.map((u) => `@import url('${u}');`).join('')}</style>`
}

function studioSubsetFaces(): string {
  const faces: Array<[string, string]> = [
    ['Cormorant Garamond', "local('Cormorant Garamond'), local('Georgia')"],
    ['Montserrat', "local('Montserrat'), local('Arial')"],
    ['Great Vibes', "local('Great Vibes'), local('Segoe Script')"],
    ['Instrument Serif', "local('Instrument Serif'), local('Georgia')"],
    ['Barlow Condensed', "local('Barlow Condensed'), local('Arial Narrow')"],
    ['Righteous', "local('Righteous'), local('Arial Rounded MT Bold')"],
    ['IBM Plex Mono', "local('IBM Plex Mono'), local('Consolas')"],
  ]
  return faces
    .map(
      ([family, src]) =>
        `@font-face{font-family:'${family}';src:${src};unicode-range:${STUDIO_FONT_UNICODE_RANGE};font-display:swap}`,
    )
    .join('')
}

/** Export SVG: drop the Google @import (RIP has no network) and declare named local faces. */
export function studioExportFontStyle(): string {
  return `<style data-art="studio-fonts-subset">${studioSubsetFaces()}</style>`
}

export function withStudioExportFonts(markup: string): string {
  if (!markup.includes('data-art="studio-fonts"')) return markup
  return `${studioExportFontStyle()}${markup.replace(/<style data-art="studio-fonts">[\s\S]*?<\/style>/g, '')}`
}

const FACE_STACK: Record<Face, string> = {
  serif: "'Cormorant Garamond', 'Playfair Display', Georgia, 'Times New Roman', serif",
  'serif-italic': "'Cormorant Garamond', 'Playfair Display', Georgia, 'Times New Roman', serif",
  'serif-heavy': "'Cormorant Garamond', 'Playfair Display', Georgia, 'Times New Roman', serif",
  sans: "'Montserrat', 'Inter', 'Segoe UI', Arial, sans-serif",
  'sans-light': "'Montserrat', 'Inter', 'Segoe UI', Arial, sans-serif",
  'sans-heavy': "'Montserrat', 'Inter', 'Segoe UI', Arial, sans-serif",
  script: "'Great Vibes', 'Allura', 'Brush Script MT', 'Segoe Script', cursive",
  mono: "'IBM Plex Mono', 'JetBrains Mono', Consolas, 'Courier New', monospace",
  'condensed-serif': "'Instrument Serif', 'Cormorant Garamond', Georgia, 'Times New Roman', serif",
  'condensed-serif-italic': "'Instrument Serif', 'Cormorant Garamond', Georgia, 'Times New Roman', serif",
  'condensed-grotesk': "'Barlow Condensed', 'Oswald', 'Arial Narrow', Arial, sans-serif",
  rounded: "'Righteous', 'Fredoka', 'Arial Rounded MT Bold', Arial, sans-serif",
}

/** Average advance width as a fraction of font size (em). Tuned for caps-heavy packaging copy. */
const FACE_EM: Record<Face, { upper: number; lower: number }> = {
  serif: { upper: 0.7, lower: 0.48 },
  'serif-italic': { upper: 0.66, lower: 0.46 },
  'serif-heavy': { upper: 0.72, lower: 0.5 },
  sans: { upper: 0.72, lower: 0.58 },
  'sans-light': { upper: 0.69, lower: 0.55 },
  'sans-heavy': { upper: 0.8, lower: 0.64 },
  script: { upper: 0.7, lower: 0.46 },
  mono: { upper: 0.62, lower: 0.62 },
  // Measured from the vendored subsets; the estimator only sees glyphs the tables lack.
  'condensed-serif': { upper: 0.52, lower: 0.42 },
  'condensed-serif-italic': { upper: 0.5, lower: 0.4 },
  'condensed-grotesk': { upper: 0.5, lower: 0.43 },
  rounded: { upper: 0.68, lower: 0.56 },
}

/**
 * Real advance widths, measured from the vendored faces by `scripts/build-font-outlines.py`.
 *
 * The estimator below drifted −10%…+20% against the actual fonts (worst on `script`). The
 * negative side was the damaging one: the engine believed a line was narrower than it renders,
 * declared it fitted, and let it overrun its box. Advances only — ~14 kB, so layout can measure
 * synchronously on every generate.
 */
import METRICS from './fontMetrics.json'

const METRIC_FACE: Record<Face, string> = {
  serif: 'cormorant-500',
  'serif-italic': 'cormorant-500i',
  'serif-heavy': 'cormorant-700',
  sans: 'montserrat-500',
  'sans-light': 'montserrat-300',
  'sans-heavy': 'montserrat-700',
  script: 'greatvibes-400',
  mono: 'ibmplexmono-400',
  'condensed-serif': 'instrumentserif-400',
  'condensed-serif-italic': 'instrumentserif-400i',
  'condensed-grotesk': 'barlowcondensed-600',
  rounded: 'righteous-400',
}

function measuredEm(ch: string, face: Face): number | undefined {
  const key = METRIC_FACE[face]
  if (!key) return undefined
  const advance = (METRICS.faces as Record<string, Record<string, number>>)[key]?.[ch]
  return advance == null ? undefined : advance / METRICS.em
}

/** Per-glyph multiplier on the face average. Narrow/wide Latin+TR so long brands don't overflow and short ones don't collapse. */
function estimatedGlyphEm(ch: string, face: Face): number {
  const em = FACE_EM[face]
  if (ch === ' ') return 0.28
  if (/[.,·'’:;|]/.test(ch)) return 0.2
  if (ch === '-' || ch === '–' || ch === '—') return 0.38
  const letter = /[A-Za-zÀ-ÖØ-öø-ÿÇĞİÖŞÜçğıöşü]/.test(ch)
  const upper = letter && ch === ch.toUpperCase() && ch !== ch.toLowerCase()
  const base = upper || /\d/.test(ch) ? em.upper : em.lower
  const folded = ch.toLocaleUpperCase('tr')
  if ('IİJ1!'.includes(folded) || 'ijıl'.includes(ch)) return base * 0.42
  if ('LTF'.includes(folded)) return base * 0.62
  if ('MWĞÖ'.includes(folded)) return base * 1.28
  if (upper && 'OQDCGUNA'.includes(folded)) return base * 1.08
  if (/\d/.test(ch)) return em.upper * 0.88
  return base
}

function glyphEm(ch: string, face: Face): number {
  return measuredEm(ch, face) ?? estimatedGlyphEm(ch, face)
}

export function faceFamily(face: Face): string {
  return FACE_STACK[face]
}

export function faceWeight(face: Face): number {
  if (face === 'sans-heavy' || face === 'serif-heavy') return 700
  if (face === 'condensed-grotesk') return 600
  if (face === 'sans-light') return 300
  if (face === 'serif') return 500
  if (face === 'sans') return 500
  return 400
}

/** Estimated rendered width in the same unit as `size` (mm). */
export function textWidth(text: string, size: number, face: Face, tracking = 0): number {
  let w = 0
  for (const ch of text) w += glyphEm(ch, face)
  const chars = Math.max(0, [...text].length - 1)
  return w * size + chars * tracking
}

/**
 * Commercial print floor. Type below this is not legible on a carton, so the studio never
 * draws it — a face that cannot fit its copy at this size must give up a line instead.
 * (Mandatory food legal text has a stricter x-height rule; that is a per-sector check,
 * not this global floor.)
 */
export const STUDIO_TYPE_FLOOR_MM = 1.5

/** Single clamp for every computed type size, so drawing and the ledger never disagree. */
export function typeSize(mm: number): number {
  return Math.max(STUDIO_TYPE_FLOOR_MM, mm)
}

/** Largest size in [min, max] whose measured width fits `maxWidth`. */
/**
 * Whether `text` can sit inside `maxWidth` without dropping below the print floor.
 *
 * `fitSize` never returns a size under `STUDIO_TYPE_FLOOR_MM`, because type below that does not
 * survive print. That is the right call and it must not change — but it means a `maxWidth` narrower
 * than the text's own floor width simply cannot be honoured, and `fitSize` returns the floor and
 * overflows silently. Measured 2026-09-17: "SEÇİLMİŞ ÇEKİRDEK" asked to fit 20 mm comes back
 * 23.8 mm wide, and the ledger reports it as a collision with whatever was sitting beside it.
 *
 * A layout with a real alternative — one line instead of two, a stack instead of a row — asks this
 * first and picks the composition that fits, which is what a designer does when copy will not sit
 * in a column at a legible size. Shrinking past legibility is never the answer.
 */
export function fitsAtFloor(text: string, maxWidth: number, face: Face = 'sans', trackingEm = 0): boolean {
  if (!text) return true
  return textWidth(text, STUDIO_TYPE_FLOOR_MM, face, STUDIO_TYPE_FLOOR_MM * trackingEm) <= maxWidth
}

export function fitSize(text: string, maxWidth: number, max: number, min: number, face: Face, trackingEm = 0): number {
  const floor = typeSize(min)
  if (!text) return Math.max(max, floor)
  const width1 = textWidth(text, 1, face, trackingEm)
  if (width1 <= 0) return Math.max(max, floor)
  const safety = [...text].length <= 4 ? 1 : 0.97
  const fit = (maxWidth / width1) * safety
  return Math.max(floor, Math.min(Math.max(max, floor), fit))
}

/** Greedy word wrap by measured width. */
export function wrapByWidth(text: string, maxWidth: number, size: number, face: Face, maxLines: number, tracking = 0): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (textWidth(next, size, face, tracking) > maxWidth && current) {
      lines.push(current)
      current = word
      if (lines.length >= maxLines) break
    } else {
      current = next
    }
  }
  if (lines.length < maxLines && current) lines.push(current)
  if (lines.length === maxLines && words.join(' ') !== lines.join(' ')) {
    const last = lines[maxLines - 1]
    lines[maxLines - 1] = last.replace(/[.,;:]?$/, '…')
  }
  return lines
}

export type TextSpec = {
  x: number
  y: number
  text: string
  size: number
  face: Face
  fill: string
  anchor?: 'start' | 'middle' | 'end'
  tracking?: number
  opacity?: number
  weight?: number
  italic?: boolean
  transform?: string
  /** Extra attributes appended raw. */
  extra?: string
}

/** One <text> element, `y` is the baseline. */
export function textEl(spec: TextSpec): string {
  const weight = spec.weight ?? faceWeight(spec.face)
  const italic = spec.italic || spec.face === 'serif-italic' || spec.face === 'condensed-serif-italic' ? ' font-style="italic"' : ''
  const tracking = spec.tracking ? ` letter-spacing="${spec.tracking.toFixed(3)}"` : ''
  const opacity = spec.opacity != null && spec.opacity < 1 ? ` opacity="${spec.opacity}"` : ''
  const transform = spec.transform ? ` transform="${spec.transform}"` : ''
  const anchor = spec.anchor ?? 'start'
  return `<text x="${spec.x.toFixed(2)}" y="${spec.y.toFixed(2)}" text-anchor="${anchor}" fill="${spec.fill}" font-family="${faceFamily(spec.face)}" font-weight="${weight}" font-size="${spec.size.toFixed(2)}"${tracking}${italic}${opacity}${transform}${spec.extra ? ` ${spec.extra}` : ''}>${escapeSvg(spec.text)}</text>`
}

/** Faces implied by a type pairing — read off the type-system table, one row per pairing. */
export function pairingFaces(pairing: TypePairing): { brand: Face; product: Face; prefix: Face; meta: Face; body: Face } {
  return typeSystem(pairing).faces
}

/** Placement ledger — collision + bounds bookkeeping for one panel. */
export class Ledger {
  readonly panel: Panel
  readonly placed: PlacedBox[] = []
  private counter = 0

  constructor(panel: Panel) {
    this.panel = panel
  }

  /** Record a box in panel-local coordinates. Returns the id. */
  add(kind: PlacedBox['kind'], id: string, x: number, y: number, w: number, h: number, sizeMm?: number): string {
    const key = `${id}#${++this.counter}`
    this.placed.push({ id: key, x, y, w, h, kind, sizeMm })
    return key
  }

  /** Record a text baseline box: width measured, height ≈ size. */
  text(id: string, x: number, baseline: number, width: number, size: number, anchor: 'start' | 'middle' | 'end' = 'start'): string {
    const left = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x
    return this.add('text', id, left, baseline - size * 0.78, width, size * 0.98, size)
  }

  /**
   * The die's real shape in panel-local coordinates, or null when the panel is a plain rectangle.
   *
   * `panel.polygon` is stored in sheet coordinates while every box here is panel-local, so the two
   * have to be brought into the same space before they can be compared. Measured while this was
   * being written: comparing them directly reported a 104 mm overhang on a 60 mm label — the
   * distance between the two origins, not anything a printer would see.
   */
  private cutShape(): { x: number; y: number }[] | null {
    const poly = this.panel.polygon
    /*
     * Curved cuts only — a disc, an oval, a rounded tin lid.
     *
     * Those are the dies whose bounding rectangle lies about the shape, and they are approximated
     * here as many-sided polygons, so the point count identifies them. A rectilinear polygon of
     * four to six points is a flap, a wall or a trapezoid, and this deliberately leaves those
     * alone: the triangular gift box lays `wall-1` out as a *rotated* parallelogram on the sheet
     * while its painter works in an unrotated 156 × 131 box, so comparing the two spaces flags
     * every element on the panel and means nothing. Whether that carton has a real defect is an
     * open question that needs its own measurement, not an answer smuggled in through this gate.
     */
    if (!Array.isArray(poly) || poly.length < 12) return null
    return poly.map((p) => ({ x: p.x - this.panel.x, y: p.y - this.panel.y }))
  }

  /** Ray casting; the polygon is a fine approximation of the curve, so a corner on it counts as in. */
  private static insideCut(poly: { x: number; y: number }[], px: number, py: number): boolean {
    let hit = false
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i]!
      const b = poly[j]!
      if (a.y > py !== b.y > py && px < ((b.x - a.x) * (py - a.y)) / (b.y - a.y) + a.x) hit = !hit
    }
    return hit
  }

  report(archetype: StudioPanelReport['archetype']): StudioPanelReport {
    const collisions: string[] = []
    const outOfBounds: string[] = []
    const solid = this.placed.filter((b) => b.kind !== 'ground')
    const tol = 0.15
    /*
     * A round label is not a square one.
     *
     * The bounds test below asks whether a box is inside `panel.w × panel.h` — the panel's bounding
     * *rectangle*. On a rectangular label that is the cut and the test is right. On a disc, an oval
     * or any shaped die it is not: a barcode at the bottom centre of the bounding box sits inside
     * the rectangle and outside the disc. Every sweep reported "dirty 0" while the owner could see
     * a barcode hanging off the edge of a round label, because nothing here had ever read the
     * polygon the die actually cuts.
     *
     * Only content is judged against the cut. A ground or a field is *supposed* to run past it —
     * that is the bleed the trim eats.
     */
    const cut = this.cutShape()
    const insideCut = (b: PlacedBox): boolean => {
      if (!cut) return true
      const pad = 0.3
      const corners: [number, number][] = [
        [b.x + pad, b.y + pad],
        [b.x + b.w - pad, b.y + pad],
        [b.x + pad, b.y + b.h - pad],
        [b.x + b.w - pad, b.y + b.h - pad],
      ]
      return corners.every(([px, py]) => Ledger.insideCut(cut, px, py))
    }
    for (let i = 0; i < solid.length; i++) {
      const a = solid[i]
      if (a.x < -tol || a.y < -tol || a.x + a.w > this.panel.w + tol || a.y + a.h > this.panel.h + tol) {
        outOfBounds.push(a.id)
      } else if (a.kind !== 'container' && !insideCut(a)) {
        outOfBounds.push(a.id)
      }
      if (a.kind === 'container') continue
      for (let j = i + 1; j < solid.length; j++) {
        const b = solid[j]
        if (b.kind === 'container') continue
        if (a.kind !== 'text' && b.kind !== 'text') continue
        const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
        const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
        if (overlapX > tol && overlapY > tol) collisions.push(`${a.id}×${b.id}`)
      }
    }
    const sizes = this.placed.filter((b) => b.kind === 'text' && b.sizeMm).map((b) => b.sizeMm as number)
    return {
      panelId: this.panel.id,
      archetype,
      placed: this.placed,
      collisions,
      outOfBounds,
      minTextMm: sizes.length ? Math.min(...sizes) : 0,
    }
  }
}
