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

export type Face = 'serif' | 'serif-italic' | 'sans' | 'sans-light' | 'sans-heavy' | 'script' | 'mono'

/** Loaded in `index.css` and inlined on the studio SVG so live previews match the DNA faces. */
export const STUDIO_FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Great+Vibes&family=Montserrat:wght@300;500;700&display=swap'

/** Latin + Turkish. Named faces, not a packed WOFF subset. */
export const STUDIO_FONT_UNICODE_RANGE =
  'U+0000-00FF, U+0100-024F, U+011E-011F, U+0130-0131, U+015E-015F, U+1E00-1EFF'

export const STUDIO_EXPORT_FONT_COMMENT =
  'Grapxor fonts: unicode-range Latin+TR named faces; binary WOFF not embedded; press fallback Georgia/Arial.'

export function studioFontStyle(): string {
  return `<style data-art="studio-fonts">@import url('${STUDIO_FONT_HREF}');</style>`
}

function studioSubsetFaces(): string {
  const faces: Array<[string, string]> = [
    ['Cormorant Garamond', "local('Cormorant Garamond'), local('Georgia')"],
    ['Montserrat', "local('Montserrat'), local('Arial')"],
    ['Great Vibes', "local('Great Vibes'), local('Segoe Script')"],
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
  sans: "'Montserrat', 'Inter', 'Segoe UI', Arial, sans-serif",
  'sans-light': "'Montserrat', 'Inter', 'Segoe UI', Arial, sans-serif",
  'sans-heavy': "'Montserrat', 'Inter', 'Segoe UI', Arial, sans-serif",
  script: "'Great Vibes', 'Allura', 'Brush Script MT', 'Segoe Script', cursive",
  mono: "'JetBrains Mono', Consolas, 'Courier New', monospace",
}

/** Average advance width as a fraction of font size (em). Tuned for caps-heavy packaging copy. */
const FACE_EM: Record<Face, { upper: number; lower: number }> = {
  serif: { upper: 0.66, lower: 0.47 },
  'serif-italic': { upper: 0.62, lower: 0.45 },
  sans: { upper: 0.7, lower: 0.57 },
  'sans-light': { upper: 0.67, lower: 0.54 },
  'sans-heavy': { upper: 0.76, lower: 0.62 },
  script: { upper: 0.62, lower: 0.42 },
  mono: { upper: 0.62, lower: 0.62 },
}

export function faceFamily(face: Face): string {
  return FACE_STACK[face]
}

export function faceWeight(face: Face): number {
  if (face === 'sans-heavy') return 700
  if (face === 'sans-light') return 300
  if (face === 'serif') return 500
  if (face === 'sans') return 500
  return 400
}

/** Estimated rendered width in the same unit as `size` (mm). */
export function textWidth(text: string, size: number, face: Face, tracking = 0): number {
  const em = FACE_EM[face]
  let w = 0
  for (const ch of text) {
    if (ch === ' ') w += 0.3
    else if (/[.,·'’:;|]/.test(ch)) w += 0.28
    else if (/[iIl1!]/.test(ch)) w += (ch === ch.toUpperCase() ? em.upper : em.lower) * 0.55
    else if (/[mwMW]/.test(ch)) w += (ch === ch.toUpperCase() ? em.upper : em.lower) * 1.25
    else if (/\d/.test(ch)) w += em.upper * 0.85
    else if (ch === ch.toUpperCase() && ch !== ch.toLowerCase()) w += em.upper
    else w += em.lower
  }
  const chars = Math.max(0, [...text].length - 1)
  return w * size + chars * tracking
}

/** Largest size in [min, max] whose measured width fits `maxWidth`. */
export function fitSize(text: string, maxWidth: number, max: number, min: number, face: Face, trackingEm = 0): number {
  if (!text) return max
  const width1 = textWidth(text, 1, face, trackingEm)
  if (width1 <= 0) return max
  const fit = maxWidth / width1
  return Math.max(min, Math.min(max, fit))
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
  const italic = spec.italic || spec.face === 'serif-italic' ? ' font-style="italic"' : ''
  const tracking = spec.tracking ? ` letter-spacing="${spec.tracking.toFixed(3)}"` : ''
  const opacity = spec.opacity != null && spec.opacity < 1 ? ` opacity="${spec.opacity}"` : ''
  const transform = spec.transform ? ` transform="${spec.transform}"` : ''
  const anchor = spec.anchor ?? 'start'
  return `<text x="${spec.x.toFixed(2)}" y="${spec.y.toFixed(2)}" text-anchor="${anchor}" fill="${spec.fill}" font-family="${faceFamily(spec.face)}" font-weight="${weight}" font-size="${spec.size.toFixed(2)}"${tracking}${italic}${opacity}${transform}${spec.extra ? ` ${spec.extra}` : ''}>${escapeSvg(spec.text)}</text>`
}

/** Faces implied by a type pairing. */
export function pairingFaces(pairing: TypePairing): { brand: Face; product: Face; prefix: Face; meta: Face; body: Face } {
  switch (pairing) {
    case 'script-accent/sans-heavy':
      return { brand: 'sans-heavy', product: 'sans-heavy', prefix: 'script', meta: 'sans', body: 'sans' }
    case 'sans-light/sans-heavy':
      return { brand: 'serif', product: 'sans-heavy', prefix: 'sans-light', meta: 'sans', body: 'sans' }
    case 'spaced-serif/spaced-sans':
      return { brand: 'serif', product: 'sans', prefix: 'serif-italic', meta: 'sans', body: 'serif' }
    case 'serif-display/sans-meta':
    default:
      return { brand: 'serif', product: 'sans', prefix: 'serif-italic', meta: 'sans', body: 'sans' }
  }
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

  report(archetype: StudioPanelReport['archetype']): StudioPanelReport {
    const collisions: string[] = []
    const outOfBounds: string[] = []
    const solid = this.placed.filter((b) => b.kind !== 'ground')
    const tol = 0.15
    for (let i = 0; i < solid.length; i++) {
      const a = solid[i]
      if (a.x < -tol || a.y < -tol || a.x + a.w > this.panel.w + tol || a.y + a.h > this.panel.h + tol) {
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
