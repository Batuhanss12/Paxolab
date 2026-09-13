/**
 * Lockup layout — front panel lockup positioning, line fitting, and collision detection.
 * Extracted from typeSystem.ts to isolate layout logic from glyph metrics.
 */
import type { DesignOverrides, Panel } from '../../types'
import { fontStack, typeFaces } from '../artwork/languages'
import type { SafeRect } from '../artwork/motifs'
import type { DesignSystem, LineBox } from './types'
import { estimateLineWidth, lineBBox } from './glyphMetrics'
import { boxesOverlap, type ArtBox } from './artBox'
import { fitFoodClaims, fitIngredientBadges } from '../artwork/panelRenderers/foodElements'
import { placeFrontExtras } from '../artwork/panelRenderers/frontExtras'
import { volumeDisplay, volumeUsesEstimated } from './volumeFormat'
import { faceUpper } from '../copyLocale'

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

export type CollisionReport = { hit: boolean; reasons: string[] }

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

function splitBrand(text: string): [string, string] | null {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length < 2) return null
  if (words.length >= 3) return [words.slice(0, -1).join(' '), words[words.length - 1]]
  return [words[0], words.slice(1).join(' ')]
}

function showMinimalCategory(system: DesignSystem): boolean {
  return system.style === 'minimal' && (system.sector === 'serum' || system.sector === 'cream' || system.sector === 'cleaning')
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
  const productText = faceUpper(copy.product.trim())
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
  // P2-C: minimal serum/cream/cleaning shows category as quiet meta.
  const minimalShowCat = showMinimalCategory(system)
  const categoryFit = fitLine(
    cat && (system.style !== 'minimal' || minimalShowCat) ? cat : '',
    Math.max(type.minMm - (labelFace ? 0 : 0.15), Math.min(type.metaMm, type.categoryMm)),
    type.trackingMeta,
    maxTextW,
    Math.max(1.7, type.minMm - 0.4),
    faces.meta,
  )
  const categorySize = cat && (system.style !== 'minimal' || minimalShowCat) ? categoryFit.size : Math.max(type.minMm - (labelFace ? 0 : 0.15), Math.min(type.metaMm, type.categoryMm))
  const categoryTrack = cat && (system.style !== 'minimal' || minimalShowCat) ? categoryFit.tracking : type.trackingMeta
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
  const afterProduct = cat && (system.style !== 'minimal' || minimalShowCat) ? categorySize * 1.55 : 0
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

/** Brand / product / category / tagline glyph boxes — the lockup column, not the wide reserved rect. */
export function collectLockupGlyphBoxes(layout: LockupLayout, system: DesignSystem, copy: LockupCopy): ArtBox[] {
  const faces = typeFaces(system.style)
  const boxes: ArtBox[] = []
  const brandLines = layout.brandLines.length ? layout.brandLines : [copy.brand.toUpperCase()]
  const brandYs = layout.brandYs.length ? layout.brandYs : [layout.brandY]
  brandLines.forEach((line, i) => {
    const box = lineBBox(line, layout.brandSize, layout.brandTracking, faces.display, layout.ax, brandYs[i] ?? layout.brandY, layout.anchor, 'brand')
    if (box.w > 0) boxes.push({ id: `lockup-${box.role}-${i}`, x: box.x, y: box.y, w: box.w, h: box.h })
  })
  if (copy.product.trim()) {
    const box = lineBBox(faceUpper(copy.product), layout.productSize, layout.productTracking, faces.product, layout.ax, layout.productY, layout.anchor, 'product')
    if (box.w > 0) boxes.push({ id: 'lockup-product', x: box.x, y: box.y, w: box.w, h: box.h })
  }
  if (system.category && (system.style !== 'minimal' || showMinimalCategory(system))) {
    const box = lineBBox(system.category, layout.categorySize, layout.categoryTracking, faces.meta, layout.ax, layout.categoryY, layout.anchor, 'category')
    if (box.w > 0) boxes.push({ id: 'lockup-category', x: box.x, y: box.y, w: box.w, h: box.h })
  }
  if (copy.tagline.trim()) {
    const box = lineBBox(copy.tagline, layout.taglineSize, 0, system.serif ? 'serif' : 'sans', layout.ax, layout.taglineY, layout.anchor, 'tagline')
    if (box.w > 0) boxes.push({ id: 'lockup-tagline', x: box.x, y: box.y, w: box.w, h: box.h })
  }
  return boxes
}

/** Volume / NET / claim / badge boxes used by Phase 1 decor collision and Phase 3 hero clearance. */
export function collectFrontDecorBoxes(
  panel: Panel,
  system: DesignSystem,
  copy: LockupCopy,
  overrides: Pick<DesignOverrides, 'titleScale'>,
  labelFace: boolean,
  ingredientClaims: string,
): ArtBox[] {
  const layout = layoutFrontLockup(panel, system, copy, overrides, labelFace)
  const { x, y, w, h } = panel
  const boxes: ArtBox[] = []

  if (copy.volume.trim()) {
    const volDisplay = volumeDisplay(copy.volume, volumeUsesEstimated(copy.volume))
    const volW = estimateLineWidth(volDisplay, system.type.volumeMm, 0.28, 'sans')
    const volX = layout.anchor === 'start' ? layout.ax : layout.ax - volW / 2
    if (system.goldBar && !labelFace) {
      const bh = 9.15
      boxes.push({ id: 'volume-goldbar', x, y: y + h - bh, w, h: bh })
    } else if (!labelFace && system.style === 'playful') {
      const bw = Math.min(w * 0.62, 38)
      const bh = 8.4
      const bx = x + (w - bw) / 2
      const by = y + h - bh - 4.2
      boxes.push({ id: 'volume-capsule', x: bx, y: by, w: bw, h: bh })
    } else if (!labelFace && system.style === 'eco') {
      const sw = Math.min(18, w * 0.32)
      const sh = 5.6
      const cx = x + w / 2
      const cy = y + h * 0.84
      boxes.push({ id: 'volume-stamp', x: cx - sw / 2, y: cy - sh / 2, w: sw, h: sh })
    } else if (!labelFace && system.style === 'modern') {
      const bw = Math.min(28, w * 0.42)
      const bh = 6.4
      const left = system.align === 'left'
      const bx = left ? layout.ax : x + w / 2 - bw / 2
      const by = y + h * 0.8
      boxes.push({ id: 'volume-outline', x: bx, y: by, w: bw, h: bh })
    } else {
      const extras = placeFrontExtras(panel, system, layout, ingredientClaims, labelFace)
      const volY = extras.volumeY
      boxes.push({ id: 'volume-plain', x: volX, y: volY - system.type.volumeMm * 0.72, w: volW, h: system.type.volumeMm * 0.78 })
    }
  }

  if (system.sector === 'food' && copy.volume.trim()) {
    const netY = layout.taglineY + (labelFace ? 3.4 : 4.2)
    const netW = estimateLineWidth('NET', system.type.metaMm, 1.1, 'sans')
    const netX = layout.anchor === 'start' ? layout.ax : layout.ax - netW / 2
    boxes.push({ id: 'net', x: netX, y: netY - system.type.metaMm * 0.72, w: netW, h: system.type.metaMm * 0.78 })
    const volBody = volumeDisplay(copy.volume, false)
    const volNetW = estimateLineWidth(volBody, system.type.metaMm + (labelFace ? 0.2 : 0.5), 0.8, 'sans')
    const netVolX = layout.anchor === 'start' ? layout.ax : layout.ax - volNetW / 2
    boxes.push({ id: 'net-volume', x: netVolX, y: netY + (labelFace ? 2.6 : 3.0) - system.type.metaMm * 0.72, w: volNetW, h: system.type.metaMm * 0.78 })
  }

  if (system.sector === 'food') {
    const netY = layout.taglineY + (labelFace ? 3.4 : 4.2)
    const claimY = netY + (copy.volume ? (labelFace ? 7.2 : 11.4) : (labelFace ? 5.4 : 8.6))
    if (claimY + (labelFace ? 6 : 8) < y + h - (labelFace ? 8 : 14)) {
      const locale = /PRESERVE|ARTISAN FOOD|EXTRA VIRGIN|CHOCOLATE|BISCUIT|HERBAL TEA/.test(system.category)
        ? 'en'
        : 'tr'
      const fitted = fitFoodClaims(panel, claimY, layout.ax, layout.anchor, system.type.minMm, locale)
      fitted.forEach((claim, i) => {
        const box = { id: `claim-${i}`, x: claim.cx - claim.r, y: claimY - claim.r, w: claim.r * 2, h: claim.r * 2 + 3 }
        if (box.x < x - 0.55 || box.x + box.w > x + w + 0.55) return
        boxes.push(box)
      })
    }
  }

  if (ingredientClaims.trim()) {
    const extras = placeFrontExtras(panel, system, layout, ingredientClaims, labelFace)
    const fitted = fitIngredientBadges(ingredientClaims, layout.ax, layout.anchor, system.type.minMm, panel)
    if (extras.showBadges && fitted) {
      let cursor = fitted.startX
      fitted.claims.forEach((_, i) => {
        const badgeW = fitted.widths[i] ?? 11
        boxes.push({ id: `badge-${i}`, x: cursor, y: extras.badgeY, w: badgeW, h: fitted.badgeH })
        cursor += badgeW + fitted.gap
      })
    }
  }

  return boxes
}

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
      lineBBox(faceUpper(copy.product), layout.productSize, layout.productTracking, faces.product, layout.ax, layout.productY, layout.anchor, 'product'),
    )
  }
  // P2-C: minimal serum/cream shows category as quiet meta.
  if (system.category && (system.style !== 'minimal' || showMinimalCategory(system))) {
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

/**
 * P1-A: Measure front-panel decor collision — claim strip, ingredient badges, volume, NET.
 * Extends lockup collision to include decor elements that the lockup collision doesn't check.
 * Returns collision reasons for pairwise gaps < 1.2 mm (label) or < 1.6 mm (box).
 */
export function measureFrontDecorCollision(
  panel: Panel,
  system: DesignSystem,
  copy: LockupCopy,
  overrides: Pick<DesignOverrides, 'titleScale'>,
  labelFace: boolean,
  ingredientClaims: string,
): CollisionReport {
  const reasons: string[] = []
  const { x, y, w, h } = panel
  const minGap = labelFace ? 1.2 : 1.6
  const boxes = collectFrontDecorBoxes(panel, system, copy, overrides, labelFace, ingredientClaims)

  // Pairwise collision check — only between decor elements (not panel bounds for badges)
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      if (boxesOverlap(boxes[i], boxes[j], -minGap)) {
        const gap = Math.abs(Math.min(
          boxes[i].x + boxes[i].w - boxes[j].x,
          boxes[j].x + boxes[j].w - boxes[i].x,
          boxes[i].y + boxes[i].h - boxes[j].y,
          boxes[j].y + boxes[j].h - boxes[i].y,
        ))
        if (gap < minGap) {
          reasons.push(`${boxes[i].id}-${boxes[j].id}`)
        }
      }
    }
    // Panel bounds check — skip for badges (ingredientBadges already fits to panel)
    const b = boxes[i]
    if (b.id.startsWith('badge-')) continue
    if (b.x < x - 0.55) reasons.push(`${b.id}-panel-left`)
    if (b.x + b.w > x + w + 0.55) reasons.push(`${b.id}-panel-right`)
    if (b.y < y - 0.55) reasons.push(`${b.id}-panel-top`)
    if (b.y + b.h > y + h + 0.55) reasons.push(`${b.id}-panel-bottom`)
  }

  return { hit: reasons.length > 0, reasons }
}
