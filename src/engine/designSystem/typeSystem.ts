import type { DesignOverrides, Panel } from '../../types'
import { fontStack, typeFaces } from '../artwork/languages'
import type { SafeRect } from '../artwork/motifs'
import type { DesignSystem, TypeScale } from './types'

export type LockupCopy = {
  brand: string
  product: string
  tagline: string
  volume: string
}

export type LockupLayout = {
  rect: SafeRect
  opticalY: number
  ax: number
  anchor: 'middle' | 'start'
  brandY: number
  brandLines: string[]
  brandYs: number[]
  productY: number
  categoryY: number
  taglineY: number
  ruleY?: number
  brandSize: number
  productSize: number
  categorySize: number
  taglineSize: number
  brandTracking: number
  productTracking: number
  categoryTracking: number
  brandFont: string
  productFont: string
  metaFont: string
  legalFont: string
  brandWeight: number
  productWeight: number
  metaWeight: number
  hasRule: boolean
  ruleKind: 'foil' | 'double' | 'hair' | 'eco' | 'none'
}

const SERIF_EM = 0.66
const SANS_EM = 0.58

function em(face: 'serif' | 'sans'): number {
  return face === 'serif' ? SERIF_EM : SANS_EM
}

/** Soft glyph advance — optical bbox, not a TTF outline. Pair kerning stays parked. */
export function glyphAdvance(ch: string, face: 'serif' | 'sans'): number {
  if (ch === ' ') return face === 'serif' ? 0.28 : 0.26
  if (/[.,'’|:;!]/.test(ch)) return 0.22
  if (/[il1]/.test(ch)) return face === 'serif' ? 0.3 : 0.28
  if (ch === 'I' || ch === 'İ' || ch === 'ı') return face === 'serif' ? 0.34 : 0.32
  if (/[jfrt]/.test(ch)) return face === 'serif' ? 0.38 : 0.36
  if (/[mwMW]/.test(ch)) return face === 'serif' ? 0.92 : 0.84
  if (/[@%&]/.test(ch)) return 0.86
  if (/[JL]/.test(ch)) return face === 'serif' ? 0.58 : 0.52
  if (/[A-ZÇĞÖŞÜ]/.test(ch)) return face === 'serif' ? 0.74 : 0.64
  if (/[0-9]/.test(ch)) return face === 'serif' ? 0.56 : 0.54
  return em(face)
}

export function estimateLineWidth(text: string, size: number, tracking: number, face: 'serif' | 'sans'): number {
  const chars = [...text]
  if (!chars.length) return 0
  let w = 0
  for (const ch of chars) w += size * glyphAdvance(ch, face)
  return w + Math.max(0, chars.length - 1) * tracking
}

export type LineBox = { role: string; x: number; y: number; w: number; h: number }

export function lineBBox(
  text: string,
  size: number,
  tracking: number,
  face: 'serif' | 'sans',
  ax: number,
  baseline: number,
  anchor: 'middle' | 'start' | 'end',
  role: string,
): LineBox {
  const w = estimateLineWidth(text, size, tracking, face)
  const h = size * 0.78
  const x = anchor === 'middle' ? ax - w / 2 : anchor === 'end' ? ax - w : ax
  return { role, x, y: baseline - size * 0.72, w, h }
}

export type CollisionReport = { hit: boolean; reasons: string[] }

/** Fitted line boxes vs panel + reserved lockup. Decor is excluded by lockout clip, not guessed as strings. */
export function measureLockupCollision(
  panel: Panel,
  system: DesignSystem,
  copy: LockupCopy,
  overrides: Pick<DesignOverrides, 'titleScale'>,
  labelFace: boolean,
): CollisionReport {
  const layout = layoutFrontLockup(panel, system, copy, overrides, labelFace)
  const faces = typeFaces(system.style)
  const reasons: string[] = []
  const slack = 0.55
  const { rect } = layout
  if (rect.x < panel.x - slack) reasons.push('lockup-left')
  if (rect.y < panel.y - slack) reasons.push('lockup-top')
  if (rect.x + rect.w > panel.x + panel.w + slack) reasons.push('lockup-right')
  if (rect.y + rect.h > panel.y + panel.h + slack) reasons.push('lockup-bottom')

  const brandLines = layout.brandLines.length ? layout.brandLines : [copy.brand.toUpperCase()]
  const brandYs = layout.brandYs.length ? layout.brandYs : [layout.brandY]
  const boxes: LineBox[] = brandLines.map((line, i) =>
    lineBBox(line, layout.brandSize, layout.brandTracking, faces.display, layout.ax, brandYs[i] ?? layout.brandY, layout.anchor, 'brand'),
  )
  if (copy.product.trim()) {
    boxes.push(
      lineBBox(copy.product.toUpperCase(), layout.productSize, layout.productTracking, faces.product, layout.ax, layout.productY, layout.anchor, 'product'),
    )
  }
  if (system.category && system.style !== 'minimal') {
    boxes.push(
      lineBBox(system.category, layout.categorySize, layout.categoryTracking, faces.meta, layout.ax, layout.categoryY, layout.anchor, 'category'),
    )
  }
  if (copy.tagline.trim()) {
    boxes.push(
      lineBBox(copy.tagline, layout.taglineSize, 0, system.serif ? 'serif' : 'sans', layout.ax, layout.taglineY, layout.anchor, 'tagline'),
    )
  }

  for (const box of boxes) {
    if (box.w <= 0) continue
    if (box.x < panel.x - slack) reasons.push(`${box.role}-panel-left`)
    if (box.x + box.w > panel.x + panel.w + slack) reasons.push(`${box.role}-panel-right`)
    if (box.y < panel.y - slack) reasons.push(`${box.role}-panel-top`)
    if (box.y + box.h > panel.y + panel.h + slack) reasons.push(`${box.role}-panel-bottom`)
    if (box.x < rect.x - 1.4) reasons.push(`${box.role}-lockup-left`)
    if (box.x + box.w > rect.x + rect.w + 1.4) reasons.push(`${box.role}-lockup-right`)
    if (box.y < rect.y - 1.6) reasons.push(`${box.role}-lockup-top`)
    if (box.y + box.h > rect.y + rect.h + 1.6) reasons.push(`${box.role}-lockup-bottom`)
  }

  if (layout.ruleY != null && layout.ruleY < layout.brandY + layout.brandSize * 0.1) reasons.push('rule-brand')
  if (copy.product.trim() && layout.ruleY != null && layout.productY < layout.ruleY + 0.45) reasons.push('rule-product')
  if (system.goldBar) {
    const goldTop = panel.y + panel.h - 13.2
    for (const box of boxes) {
      if (box.y + box.h > goldTop + 0.8) reasons.push(`${box.role}-goldbar`)
    }
  }

  return { hit: reasons.length > 0, reasons }
}

/** Shrink tracking first, then size, so display letters stay inside the lockup — not the foil rule. */
export function fitLine(
  text: string,
  size: number,
  tracking: number,
  maxW: number,
  minMm: number,
  face: 'serif' | 'sans',
): { size: number; tracking: number; width: number } {
  let s = size
  let t = tracking
  const target = Math.max(8, maxW * 0.94)
  const floorT = Math.min(0.04, tracking * 0.18)
  while (estimateLineWidth(text, s, t, face) > target && t > floorT) {
    t = Math.max(floorT, t * 0.84)
  }
  while (estimateLineWidth(text, s, t, face) > target && s > minMm) {
    s = Math.max(minMm, s * 0.92)
  }
  return { size: s, tracking: t, width: estimateLineWidth(text, s, t, face) }
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function splitBrand(text: string): [string, string] | null {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length < 2) return null
  if (words.length >= 3) return [words.slice(0, -1).join(' '), words[words.length - 1]]
  return [words[0], words.slice(1).join(' ')]
}

function ruleKindOf(system: DesignSystem, _labelFace: boolean): LockupLayout['ruleKind'] {
  if (system.style === 'luxury') return 'foil'
  if (system.style === 'classic') return 'double'
  if (system.style === 'minimal') return 'hair'
  if (system.style === 'eco') return 'eco'
  return 'none'
}

export function layoutFrontLockup(
  panel: Panel,
  system: DesignSystem,
  copy: LockupCopy,
  overrides: Pick<DesignOverrides, 'titleScale'>,
  labelFace: boolean,
): LockupLayout {
  const { x, y, w, h } = panel
  const type = system.type
  const faces = typeFaces(system.style)
  const wrap = labelFace && system.wrapSeam
  const left = system.align === 'left' || wrap
  const tScale = overrides.titleScale || 1
  const narrow = w < 56
  const padX = (narrow ? type.lockupPadX * 0.72 : type.lockupPadX) + (left ? 1.4 : 0)
  const frameReserve = system.style === 'luxury' || system.style === 'classic' ? (narrow ? 1.6 : 3.2) : 1.1
  const seamReserve = wrap ? Math.max(12, w * 0.16) : 0
  const ax = wrap ? x + Math.max(7.2, w * 0.1) : left ? x + (labelFace ? 6.4 : narrow ? 5.4 : 8.2) : x + w / 2
  const maxTextW = wrap
    ? Math.max(28, x + w - seamReserve - padX - ax)
    : left
      ? x + w - padX - ax
      : Math.max(22, w - padX * 2 - frameReserve)

  const brandText = copy.brand.toUpperCase()
  const productText = copy.product.trim().toUpperCase()
  const hasProduct = productText.length > 0
  const cat = system.category

  const brandCap = Math.min(type.displayMm, w * (system.style === 'minimal' ? 0.1 : 0.126), h * (labelFace ? 0.155 : 0.088))
  const brandCapSize = Math.max(type.minMm, brandCap * tScale)
  const singleFit = fitLine(brandText, brandCapSize, type.trackingDisplay, maxTextW, type.minMm, faces.display)
  const parts = splitBrand(brandText)
  const squeezed = singleFit.size < brandCap * 0.78 || singleFit.tracking < type.trackingDisplay * 0.72
  const wrapBrand = !!parts && (brandText.split(/\s+/).filter(Boolean).length >= 3 || squeezed)
  let brandLines = [brandText]
  let brandFit = singleFit
  if (wrapBrand && parts) {
    const a = fitLine(parts[0], brandCapSize, type.trackingDisplay, maxTextW, type.minMm, faces.display)
    const b = fitLine(parts[1], brandCapSize, type.trackingDisplay, maxTextW, type.minMm, faces.display)
    const size = Math.min(a.size, b.size)
    const tracking = Math.min(a.tracking, b.tracking)
    brandLines = parts
    brandFit = {
      size,
      tracking,
      width: Math.max(
        estimateLineWidth(parts[0], size, tracking, faces.display),
        estimateLineWidth(parts[1], size, tracking, faces.display),
      ),
    }
  }
  const productFit = fitLine(
    productText,
    Math.max(type.minMm, Math.min(type.productMm, w * 0.048) * tScale),
    type.trackingProduct,
    maxTextW,
    type.minMm,
    faces.product,
  )
  const categoryFit = fitLine(
    cat && system.style !== 'minimal' ? cat : '',
    Math.max(type.minMm - (labelFace ? 0 : 0.15), Math.min(type.metaMm, type.categoryMm)),
    type.trackingMeta,
    maxTextW,
    Math.max(1.7, type.minMm - 0.4),
    faces.meta,
  )
  const categorySize = cat && system.style !== 'minimal' ? categoryFit.size : Math.max(type.minMm - (labelFace ? 0 : 0.15), Math.min(type.metaMm, type.categoryMm))
  const categoryTrack = cat && system.style !== 'minimal' ? categoryFit.tracking : type.trackingMeta
  const taglineFit = fitLine(copy.tagline, Math.max(type.minMm, type.taglineMm), 0, maxTextW, type.minMm, system.serif ? 'serif' : 'sans')
  const taglineSize = taglineFit.size

  const kind = ruleKindOf(system, labelFace)
  const hasRule = kind !== 'none'
  const lineStep = brandLines.length > 1 ? brandFit.size * 1.14 : 0

  // Font-weight hierarchy: brand carries authority, product supports, meta recedes.
  // Minimal uses light weights for an airy editorial voice; luxury/classic lean heavier.
  const brandWeight =
    system.style === 'minimal' ? 500 :
    system.style === 'luxury' || system.style === 'classic' ? 700 :
    system.style === 'playful' ? 700 :
    600
  const productWeight =
    system.style === 'minimal' ? 300 :
    system.style === 'luxury' || system.style === 'classic' ? 500 :
    400
  const metaWeight =
    system.style === 'minimal' ? 300 :
    system.style === 'luxury' || system.style === 'classic' ? 500 :
    400

  const afterBrand = (hasRule ? brandFit.size * 0.2 + type.ruleGapMm : brandFit.size * 0.42) + lineStep
  const afterRule = hasProduct ? productFit.size * 0.82 + (hasRule ? type.ruleGapMm * 0.55 : 0) : 0
  const afterProduct = cat && system.style !== 'minimal' ? categorySize * 1.55 : 0
  const airToTag = labelFace ? Math.min(5.2, h * 0.08) : Math.min(7.2, h * 0.055)

  const cap = brandFit.size * 0.72
  let stackH = cap + afterBrand + afterRule + afterProduct + airToTag + taglineSize * 0.35
  const crest = ['crest', 'cartouche', 'leaf', 'badge', 'olive', 'harvest'].includes(system.decor)
  const topLimit = y + h * (wrap ? 0.18 : crest ? 0.235 : labelFace ? 0.14 : 0.16)
  const bottomLimit = y + h - (system.goldBar ? 13.2 : wrap ? 9.2 : labelFace ? 11.5 : 10.4)
  const avail = bottomLimit - topLimit
  let gapScale = 1
  if (stackH > avail && avail > 12) {
    gapScale = Math.max(0.62, avail / stackH)
    stackH = Math.min(stackH, avail)
  }

  const opticalY = y + h * type.opticalCenter
  let brandTop = opticalY - stackH * 0.42
  if (brandTop < topLimit) brandTop = topLimit
  if (brandTop + stackH > bottomLimit) brandTop = bottomLimit - stackH

  const brandY = brandTop + cap
  const brandYs = brandLines.map((_, i) => brandY + i * lineStep * gapScale)
  const ruleY = hasRule ? brandY + afterBrand * gapScale : undefined
  const productY = brandY + (afterBrand + afterRule) * gapScale
  const categoryY = productY + afterProduct * gapScale
  const taglineY = categoryY + airToTag * gapScale

  const rectTop = brandTop - type.lockupPadY
  const rectBot = taglineY + taglineSize * 0.4 + type.lockupPadY
  const rect: SafeRect = {
    x: left ? ax - 1.8 : x + padX,
    y: rectTop,
    w: wrap ? maxTextW + 2.4 : left ? x + w - padX - (ax - 1.8) : w - padX * 2,
    h: Math.max(14, rectBot - rectTop),
  }

  return {
    rect,
    opticalY,
    ax,
    anchor: left ? 'start' : 'middle',
    brandY,
    brandLines,
    brandYs,
    productY,
    categoryY,
    taglineY,
    ruleY,
    brandSize: brandFit.size,
    productSize: productFit.size,
    categorySize,
    taglineSize,
    brandTracking: brandFit.tracking,
    productTracking: productFit.tracking,
    categoryTracking: categoryTrack,
    brandFont: fontStack(faces.display, { role: 'display', style: system.style, sector: system.sector }),
    productFont: fontStack(faces.product, { role: 'product', style: system.style, sector: system.sector }),
    metaFont: fontStack(faces.meta, { role: 'meta', style: system.style, sector: system.sector }),
    legalFont: fontStack(faces.legal, { role: 'legal', style: system.style, sector: system.sector }),
    brandWeight,
    productWeight,
    metaWeight,
    hasRule,
    ruleKind: kind,
  }
}

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function smallCapsRuns(text: string): { text: string; kind: 'full' | 'small' }[] {
  const runs: { text: string; kind: 'full' | 'small' }[] = []
  let buf = ''
  let kind: 'full' | 'small' | null = null
  for (const ch of text) {
    const next: 'full' | 'small' = /\p{L}/u.test(ch) ? 'small' : 'full'
    if (kind && next !== kind) {
      runs.push({ text: kind === 'small' ? buf.toLocaleUpperCase('tr') : buf, kind })
      buf = ch
      kind = next
    } else {
      buf += ch
      kind = next
    }
  }
  if (buf && kind) {
    runs.push({ text: kind === 'small' ? buf.toLocaleUpperCase('tr') : buf, kind })
  }
  return runs
}

/** Real small caps: lining figures stay full size; letters are drawn as smaller capitals. No font-variant. */
export function smallCapsText(
  x: number,
  y: number,
  text: string,
  size: number,
  tracking: number,
  fill: string,
  anchor: 'middle' | 'start' | 'end',
  font: string,
  ratio: number,
): string {
  const tspans = smallCapsRuns(text)
    .map((run) => {
      const fs = run.kind === 'small' ? size * ratio : size
      return `<tspan font-size="${fs.toFixed(2)}">${esc(run.text)}</tspan>`
    })
    .join('')
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${fill}" font-family="${font}" font-weight="600" letter-spacing="${tracking}">${tspans}</text>`
}

export function volumeMarkup(
  x: number,
  y: number,
  raw: string,
  type: TypeScale,
  fill: string,
  anchor: 'middle' | 'start' | 'end',
  font: string,
  estimated: boolean,
): string {
  const body = raw.trim()
  const label = `${estimated ? '℮  ' : ''}${body}`
  if (type.volumeCase === 'smallcaps') {
    return smallCapsText(x, y, label, type.volumeMm, 1.15, fill, anchor, font, type.smallCapsRatio)
  }
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${fill}" font-family="${font}" font-weight="600" font-size="${type.volumeMm}" letter-spacing="1.35">${esc(label.toUpperCase())}</text>`
}
