/**
 * Food-specific elements — nutrition table, claim strip, ingredient badges.
 * Extracted from composeArtwork.ts.
 * P1-B: claim strip now measures label widths and shrinks/shortens/drops to fit panel.
 * P1-C: ingredient badges now measure text widths and scale/drop to fit panel + volume band.
 */
import type { Palette, Panel } from '../../../types'
import type { DesignSystem } from '../../designSystem/types'
import { estimateLineWidth } from '../../designSystem/glyphMetrics'

/** Ingredient claim badges — rounded pills with + separators. */
export function ingredientBadges(raw: string, ax: number, y: number, anchor: 'middle' | 'start', p: Palette, minMm: number, panelW: number): string {
  const allClaims = raw.split(/[+,;·]/).map((s) => s.trim().toUpperCase()).filter(Boolean).slice(0, 4)
  if (!allClaims.length) return ''
  const badgeH = 4.8
  const gap = 2.2
  const sz = Math.max(minMm, 1.6)
  const margin = 4

  // P1-C: badgeW = max(14, textWidth(label)+3.2), then scale set so totalW <= panelW - 2*margin
  function computeBadges(claims: string[], fontSz: number): { totalW: number; widths: number[] } {
    const widths = claims.map((label) => Math.max(14, estimateLineWidth(label, fontSz, 0.25, 'sans') + 3.2))
    const totalW = claims.length * widths.reduce((a, b) => Math.max(a, b), 0) + (claims.length - 1) * gap
    return { totalW, widths }
  }

  // Try with all claims first, then drop longest if overflow
  let claims = [...allClaims]
  let fontSz = sz
  let { totalW, widths } = computeBadges(claims, fontSz)
  const maxW = panelW - 2 * margin

  // Step 1: shrink font down to minMm
  while (totalW > maxW && fontSz > minMm) {
    fontSz = Math.max(minMm, fontSz - 0.15)
    const r = computeBadges(claims, fontSz)
    totalW = r.totalW
    widths = r.widths
  }

  // Step 2: drop longest claim
  while (totalW > maxW && claims.length > 2) {
    claims.pop()
    const r = computeBadges(claims, fontSz)
    totalW = r.totalW
    widths = r.widths
  }

  // Step 3: uniform badge width = max of all widths
  const badgeW = widths.reduce((a, b) => Math.max(a, b), 0)
  const startX = anchor === 'middle' ? ax - totalW / 2 : ax
  let out = ''
  claims.forEach((label, i) => {
    const bx = startX + i * (badgeW + gap)
    out += `<rect x="${bx}" y="${y}" width="${badgeW}" height="${badgeH}" rx="${badgeH / 2}" fill="none" stroke="${p.accent}" stroke-width="0.24" />`
    out += `<text x="${bx + badgeW / 2}" y="${y + badgeH * 0.62}" text-anchor="middle" fill="${p.accent}" font-family="Inter, Arial, sans-serif" font-weight="500" font-size="${fontSz}" letter-spacing="0.25">${label}</text>`
  })
  if (claims.length > 1) {
    for (let i = 0; i < claims.length - 1; i++) {
      const px = startX + (i + 1) * badgeW + i * gap + gap / 2
      out += `<text x="${px}" y="${y + badgeH * 0.65}" text-anchor="middle" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-size="${Math.max(minMm, 1.4)}">+</text>`
    }
  }
  return `<g data-art="ingredient-badges">${out}</g>`
}

/** Nutrition facts table — tabular figures, sector-specific rows. */
export function foodNutritionTable(x: number, y: number, w: number, p: Palette, system: DesignSystem, compact = false): string {
  const rows = compact
    ? [
        ['Enerji', '1360 kJ / 320 kcal'],
        ['Yağ', '0 g'],
        ['Karbonhidrat', '80 g'],
        ['Protein', '0,3 g'],
      ]
    : [
        ['Enerji', '1360 kJ / 320 kcal'],
        ['Yağ', '0 g'],
        ['Karbonhidrat', '80 g'],
        ['  - Şeker', '80 g'],
        ['Protein', '0,3 g'],
        ['Tuz', '0 g'],
      ]
  const colW = Math.min(w * (compact ? 0.62 : 0.48), compact ? 42 : 36)
  const sz = Math.max(system.type.legalMm, compact ? 1.55 : 1.7)
  const lineH = sz + (compact ? 0.7 : 0.95)
  let out = ''
  let cy = y
  out += `<text x="${x}" y="${cy}" fill="${p.accent}" font-family="Inter, Arial, sans-serif" font-weight="600" font-size="2.0" letter-spacing="1.1">BESİN DEĞERLERİ (100 g)</text>`
  cy += 3.2
  out += `<line x1="${x}" y1="${cy}" x2="${x + colW}" y2="${cy}" stroke="${p.accent}" stroke-width="0.2" />`
  cy += 1.2
  rows.forEach(([label, value], i) => {
    out += `<text x="${x}" y="${cy + i * lineH}" fill="${p.fg}" font-family="Inter, Arial, sans-serif" font-weight="400" font-size="${sz}">${label}</text>`
    out += `<text x="${x + colW}" y="${cy + i * lineH}" text-anchor="end" fill="${p.fg}" font-family="Inter, Arial, sans-serif" font-weight="500" font-feature-settings="'tnum'" font-size="${sz}">${value}</text>`
  })
  cy += rows.length * lineH + 1.2
  out += `<line x1="${x}" y1="${cy}" x2="${x + colW}" y2="${cy}" stroke="${p.accent}" stroke-width="0.14" />`
  return `<g data-art="nutrition-table">${out}</g>`
}

/** Food claim strip — natural/additive-free badges. P1-B: measures label widths and fits. */
export function foodClaimStrip(panel: Panel, p: Palette, y: number, ax: number, anchor: 'middle' | 'start', minMm: number): string {
  // P1-B: label map with shorten fallback (DOĞAL ÜRÜN → DOĞAL)
  const allClaims: [string, string][] = [
    ['%100', 'DOĞAL'],
    ['✓', 'KATKISIZ'],
    ['❋', 'DOĞAL ÜRÜN'],
  ]
  const shortenMap: Record<string, string> = { 'DOĞAL ÜRÜN': 'DOĞAL' }
  const r = Math.min(4.2, panel.w * 0.054)
  const iconSz = Math.max(minMm + 0.5, 2.2)
  const margin = 4
  const maxW = panel.w - 2 * margin

  // Measure label width at sz, compute required gap
  function measureGap(label: string, sz: number): number {
    const labelW = estimateLineWidth(label, sz, 0.4, 'sans')
    return Math.max(labelW, r * 2) / 2 + r + 1.2
  }

  function tryFit(claims: [string, string][], sz: number): { gap: number; fits: boolean } {
    const gaps = claims.map(([, label]) => measureGap(label, sz))
    const maxGap = Math.max(...gaps)
    const totalW = (claims.length - 1) * maxGap * 2 + maxGap
    return { gap: maxGap, fits: totalW <= maxW }
  }

  // Step 1: shrink sz from 1.55 down to minMm (step 0.15)
  let sz = Math.max(minMm, 1.55)
  let claims = [...allClaims]
  let fit = tryFit(claims, sz)
  while (!fit.fits && sz > minMm) {
    sz = Math.max(minMm, sz - 0.15)
    fit = tryFit(claims, sz)
  }

  // Step 2: shorten labels (DOĞAL ÜRÜN → DOĞAL)
  if (!fit.fits) {
    claims = claims.map(([icon, label]) => [icon, shortenMap[label] ?? label]) as [string, string][]
    fit = tryFit(claims, sz)
  }

  // Step 3: drop to 2 claims (%100 + KATKISIZ)
  if (!fit.fits && claims.length > 2) {
    claims = claims.slice(0, 2)
    fit = tryFit(claims, sz)
  }

  const gap = fit.gap
  let out = ''
  claims.forEach(([icon, label], i) => {
    const cx = anchor === 'middle' ? ax + (i - (claims.length - 1) / 2) * gap * 2 : ax + i * gap * 2 + 4
    out += `<rect x="${cx - r}" y="${y - r}" width="${r * 2}" height="${r * 2}" fill="${p.accent}" fill-opacity="0.08" stroke="${p.accent}" stroke-width="0.24" />`
    out += `<line x1="${cx - r + 0.7}" y1="${y - r + 0.55}" x2="${cx + r - 0.7}" y2="${y - r + 0.55}" stroke="${p.accent}" stroke-opacity="0.4" stroke-width="0.12" />`
    out += `<text x="${cx}" y="${y + 0.65}" text-anchor="middle" fill="${p.accent}" font-family="Inter, Arial, sans-serif" font-weight="600" font-size="${iconSz}" letter-spacing="0.1">${icon}</text>`
    out += `<text x="${cx}" y="${y + r + 2.4}" text-anchor="middle" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-weight="500" font-size="${sz}" letter-spacing="0.4">${label}</text>`
  })
  return `<g data-art="claim-strip">${out}</g>`
}
