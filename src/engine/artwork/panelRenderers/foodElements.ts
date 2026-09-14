/**
 * Food-specific elements — nutrition table, claim strip, ingredient badges.
 * Extracted from composeArtwork.ts.
 * P1-B: claim strip now measures label widths and shrinks/shortens/drops to fit panel.
 * P1-C: ingredient badges now measure text widths and scale/drop to fit panel + volume band.
 */
import type { Palette, Panel, StyleType } from '../../../types'
import type { DesignSystem } from '../../designSystem/types'
import { estimateLineWidth } from '../../designSystem/glyphMetrics'
import {
  foodFamilyFromBlob,
  foodNutritionBasis,
  foodNutritionBlockHeight,
  foodNutritionRows,
  foodTableFooter,
  type FoodFamily,
} from '../foodFamily'
import { foodBoxTheatre, foodTheatreClaimY } from '../foodLandscape'
import { claimMotifSvg, type ClaimMotifKind } from '../icons'

export { foodNutritionBlockHeight }
export type FoodNutritionOpts = {
  family?: FoodFamily
  volume?: string
  sugarSalt?: boolean
  blob?: string
}

export type FittedIngredientBadges = {
  claims: string[]
  widths: number[]
  totalW: number
  startX: number
  fontSz: number
  badgeH: number
  gap: number
}

const BADGE_H = 4.8
const BADGE_GAP = 2.2
const BADGE_MARGIN = 3.2
const BADGE_MIN_FONT = 1.15

/** Shared badge fit — painter and collision use the same boxes. */
export function fitIngredientBadges(
  raw: string,
  ax: number,
  anchor: 'middle' | 'start',
  minMm: number,
  panel: { x: number; w: number },
): FittedIngredientBadges | null {
  const allClaims = raw.split(/[+,;·]/).map((s) => s.trim().toUpperCase()).filter(Boolean).slice(0, 4)
  if (!allClaims.length) return null
  const maxW = panel.w - 2 * BADGE_MARGIN

  function compute(claims: string[], fontSz: number): { totalW: number; widths: number[] } {
    const widths = claims.map((label) => Math.max(11, estimateLineWidth(label, fontSz, 0.25, 'sans') + 2.6))
    const totalW = widths.reduce((sum, w) => sum + w, 0) + Math.max(0, claims.length - 1) * BADGE_GAP
    return { totalW, widths }
  }

  let claims = [...allClaims]
  let fontSz = Math.max(minMm, 1.6)
  let { totalW, widths } = compute(claims, fontSz)

  while (totalW > maxW && fontSz > BADGE_MIN_FONT) {
    fontSz = Math.max(BADGE_MIN_FONT, fontSz - 0.12)
    const r = compute(claims, fontSz)
    totalW = r.totalW
    widths = r.widths
  }
  while (totalW > maxW && claims.length > 1) {
    let drop = 0
    for (let i = 1; i < claims.length; i++) {
      if ((claims[i]?.length ?? 0) > (claims[drop]?.length ?? 0)) drop = i
    }
    claims.splice(drop, 1)
    const r = compute(claims, fontSz)
    totalW = r.totalW
    widths = r.widths
  }
  if (totalW > maxW) return null

  let startX = anchor === 'middle' ? ax - totalW / 2 : ax
  const minX = panel.x + BADGE_MARGIN
  const maxX = panel.x + panel.w - BADGE_MARGIN - totalW
  startX = Math.min(Math.max(startX, minX), maxX)
  return { claims, widths, totalW, startX, fontSz, badgeH: BADGE_H, gap: BADGE_GAP }
}

/** Ingredient claim badges — style-keyed chrome (eco stamp, playful sticker, modern chip). */
export function ingredientBadges(
  raw: string,
  ax: number,
  y: number,
  anchor: 'middle' | 'start',
  p: Palette,
  minMm: number,
  panel: { x: number; w: number },
  style: StyleType | '' = '',
): string {
  const fitted = fitIngredientBadges(raw, ax, anchor, minMm, panel)
  if (!fitted) return ''
  const playful = style === 'playful'
  const modern = style === 'modern'
  const eco = style === 'eco'
  const rx = modern ? 0.45 : eco ? 1.1 : fitted.badgeH / 2
  const fill = playful ? p.accent : eco ? p.accent : 'none'
  const fillOp = playful ? 0.22 : eco ? 0.1 : 0
  const stroke = playful ? 'none' : p.accent
  const tracking = modern ? 0.38 : 0.25
  const textFill = playful ? p.fg : p.accent
  let out = ''
  let cursor = fitted.startX
  fitted.claims.forEach((label, i) => {
    const badgeW = fitted.widths[i] ?? 11
    const bx = cursor
    out += `<rect x="${bx}" y="${y}" width="${badgeW}" height="${fitted.badgeH}" rx="${rx}" fill="${fill}" fill-opacity="${fillOp}" stroke="${stroke}" stroke-width="${stroke === 'none' ? 0 : 0.24}" />`
    out += `<text x="${bx + badgeW / 2}" y="${y + fitted.badgeH * 0.62}" text-anchor="middle" fill="${textFill}" font-family="Inter, Arial, sans-serif" font-weight="${modern ? 600 : 500}" font-size="${fitted.fontSz}" letter-spacing="${tracking}">${label}</text>`
    cursor += badgeW + fitted.gap
  })
  if (fitted.claims.length > 1 && !playful) {
    cursor = fitted.startX
    for (let i = 0; i < fitted.claims.length - 1; i++) {
      const badgeW = fitted.widths[i] ?? 11
      const px = cursor + badgeW + fitted.gap / 2
      out += `<text x="${px}" y="${y + fitted.badgeH * 0.65}" text-anchor="middle" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-size="${Math.max(BADGE_MIN_FONT, 1.3)}">+</text>`
      cursor += badgeW + fitted.gap
    }
  }
  return `<g data-art="ingredient-badges" data-badge="${style || 'default'}">${out}</g>`
}

/** Nutrition facts table — family-keyed rows, not a single cookie matrix. */
export function foodNutritionTable(
  x: number,
  y: number,
  w: number,
  p: Palette,
  system: DesignSystem,
  compact = false,
  locale: 'tr' | 'en' = 'tr',
  opts: FoodNutritionOpts = {},
): string {
  const en = locale === 'en'
  const family = opts.family ?? foodFamilyFromBlob(opts.blob ?? '')
  const sugarSalt = opts.sugarSalt ?? !compact
  const rows = foodNutritionRows(family, locale, { compact, sugarSalt })
  const basis = foodNutritionBasis(family, opts.volume ?? '', locale)
  const colW = Math.min(w * (compact ? 0.72 : 0.58), compact ? 48 : 42)
  const sz = Math.max(system.type.legalMm, compact ? 1.55 : 1.7)
  const lineH = sz + (compact ? 0.7 : 0.95)
  let out = ''
  let cy = y
  out += `<text x="${x}" y="${cy}" fill="${p.accent}" font-family="Inter, Arial, sans-serif" font-weight="600" font-size="2.0" letter-spacing="1.05">${en ? `NUTRITION FACTS (${basis})` : `BESİN DEĞERLERİ (${basis})`}</text>`
  cy += 3.2
  out += `<line x1="${x}" y1="${cy}" x2="${x + colW}" y2="${cy}" stroke="${p.accent}" stroke-width="0.2" />`
  cy += 1.2
  rows.forEach((row, i) => {
    out += `<text x="${x}" y="${cy + i * lineH}" fill="${p.fg}" font-family="Inter, Arial, sans-serif" font-weight="400" font-size="${sz}">${row.label}</text>`
    out += `<text x="${x + colW}" y="${cy + i * lineH}" text-anchor="end" fill="${p.fg}" font-family="Inter, Arial, sans-serif" font-weight="500" font-feature-settings="'tnum'" font-size="${sz}">${row.value}</text>`
  })
  cy += rows.length * lineH + 1.2
  out += `<line x1="${x}" y1="${cy}" x2="${x + colW}" y2="${cy}" stroke="${p.accent}" stroke-width="0.14" />`
  const foot = foodTableFooter(family, locale)
  if (foot) {
    cy += 2.1
    out += `<text x="${x}" y="${cy}" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-weight="400" font-size="${Math.max(1.35, sz - 0.2)}">${foot}</text>`
  }
  return `<g data-art="nutrition-table" data-food-family="${family}">${out}</g>`
}

export type FittedFoodClaim = {
  icon: ClaimMotifKind
  label: string
  cx: number
  r: number
  sz: number
}

export type FoodClaimOpts = {
  family?: FoodFamily
  theatre?: boolean
  /** Family-voice phrases on any food face (label or box). */
  rich?: boolean
}

export function foodClaimStripY(
  panel: Panel,
  system: DesignSystem,
  layout: { taglineY: number },
  labelFace: boolean,
  hasVolume: boolean,
): number | null {
  if (foodBoxTheatre(system, panel, labelFace)) return foodTheatreClaimY(panel)
  const netY = layout.taglineY + (labelFace ? 3.4 : 4.2)
  const claimY = netY + (hasVolume ? (labelFace ? 7.2 : 11.4) : (labelFace ? 5.4 : 8.6))
  if (claimY + (labelFace ? 6 : 8) < panel.y + panel.h - (labelFace ? 8 : 14)) return claimY
  return null
}

function claimPairs(locale: 'tr' | 'en', family: FoodFamily, rich: boolean): [ClaimMotifKind, string][] {
  const en = locale === 'en'
  if (!rich) {
    return en
      ? [
          ['leaf', 'NATURAL'],
          ['check', 'NO ADDITIVES'],
          ['drop', 'NATURAL PRODUCT'],
        ]
      : [
          ['leaf', 'DOĞAL'],
          ['check', 'KATKISIZ'],
          ['drop', 'DOĞAL ÜRÜN'],
        ]
  }
  if (family === 'honey') {
    return en
      ? [['mountain', 'HIGHLAND'], ['bee', 'HILL FLOWER'], ['drop', 'COLD DROP'], ['check', 'PLAIN']]
      : [['mountain', 'YAYLA'], ['bee', 'DAĞ ÇİÇEĞİ'], ['drop', 'SAF DAMLA'], ['check', 'KATKISIZ']]
  }
  if (family === 'jam') {
    return en
      ? [['leaf', 'GARDEN'], ['sun', 'SUN JAR'], ['jar', 'FRUIT'], ['check', 'PLAIN']]
      : [['leaf', 'BAHÇE'], ['sun', 'GÜNEŞ'], ['jar', 'MEYVE'], ['check', 'KATKISIZ']]
  }
  if (family === 'oil') {
    return en
      ? [['leaf', 'GROVE'], ['drop', 'VIRGIN'], ['mountain', 'EARLY'], ['check', 'PLAIN']]
      : [['leaf', 'KORU'], ['drop', 'SIZMA'], ['mountain', 'ERKEN'], ['check', 'KATKISIZ']]
  }
  return en
    ? [['leaf', 'TABLE'], ['mountain', 'LOCAL'], ['drop', 'HONEST'], ['check', 'PLAIN']]
    : [['leaf', 'SOFRA'], ['mountain', 'YEREL'], ['drop', 'SADIK TAT'], ['check', 'KATKISIZ']]
}

/** Shared claim-strip fit — painter and collision use the same boxes. */
export function fitFoodClaims(
  panel: Panel,
  y: number,
  ax: number,
  anchor: 'middle' | 'start',
  minMm: number,
  locale: 'tr' | 'en' = 'tr',
  opts: FoodClaimOpts = {},
): FittedFoodClaim[] {
  void y
  const family = opts.family ?? 'default-food'
  const rich = opts.rich ?? !!opts.theatre
  const allClaims = claimPairs(locale, family, rich)
  const shortenMap: Record<string, string> = locale === 'en'
    ? {
        'NATURAL PRODUCT': 'NATURAL',
        'NO ADDITIVES': 'PLAIN',
        'HILL FLOWER': 'FLOWER',
        'COLD DROP': 'DROP',
        'SUN JAR': 'SUN',
        'SADIK TAT': 'SADIK',
        HONEST: 'TRUE',
      }
    : { 'DOĞAL ÜRÜN': 'DOĞAL', 'DAĞ ÇİÇEĞİ': 'ÇİÇEK', 'SAF DAMLA': 'SAF', 'SADIK TAT': 'SADIK' }
  const r = Math.min(4.2, panel.w * 0.054)
  const margin = 4
  const maxW = panel.w - 2 * margin

  function measureGap(label: string, sz: number): number {
    const labelW = estimateLineWidth(label, sz, 0.4, 'sans')
    return Math.max(labelW, r * 2) / 2 + r + 1.2
  }

  function tryFit(claims: [ClaimMotifKind, string][], sz: number): { gap: number; fits: boolean } {
    const gaps = claims.map(([, label]) => measureGap(label, sz))
    const maxGap = Math.max(...gaps)
    const totalW = (claims.length - 1) * maxGap * 2 + maxGap
    return { gap: maxGap, fits: totalW <= maxW }
  }

  let sz = Math.max(minMm, 1.55)
  let claims = [...allClaims]
  let fit = tryFit(claims, sz)
  while (!fit.fits && sz > minMm) {
    sz = Math.max(minMm, sz - 0.15)
    fit = tryFit(claims, sz)
  }
  if (!fit.fits) {
    claims = claims.map(([icon, label]) => [icon, shortenMap[label] ?? label])
    fit = tryFit(claims, sz)
  }
  while (!fit.fits && claims.length > 2) {
    claims = claims.slice(0, -1)
    fit = tryFit(claims, sz)
  }

  return claims.map(([icon, label], i) => ({
    icon,
    label,
    cx: anchor === 'middle' ? ax + (i - (claims.length - 1) / 2) * fit.gap * 2 : ax + i * fit.gap * 2 + 4,
    r,
    sz,
  }))
}

/** Food claim strip — natural/additive-free badges. P1-B: measures label widths and fits. */
export function foodClaimStrip(
  panel: Panel,
  p: Palette,
  y: number,
  ax: number,
  anchor: 'middle' | 'start',
  minMm: number,
  locale: 'tr' | 'en' = 'tr',
  opts: FoodClaimOpts = {},
): string {
  const fitted = fitFoodClaims(panel, y, ax, anchor, minMm, locale, opts)
  let out = ''
  fitted.forEach(({ icon, label, cx, r, sz }) => {
    out += `<circle cx="${cx}" cy="${y}" r="${r}" fill="${p.accent}" fill-opacity="0.08" stroke="${p.accent}" stroke-width="0.24" />`
    out += claimMotifSvg(icon, cx, y, r, p.accent)
    out += `<text x="${cx}" y="${y + r + 2.4}" text-anchor="middle" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-weight="500" font-size="${sz}" letter-spacing="0.4">${label}</text>`
  })
  return `<g data-art="claim-strip">${out}</g>`
}
