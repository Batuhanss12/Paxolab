/**
 * Food-specific elements — nutrition table, claim strip, ingredient badges.
 * Extracted from composeArtwork.ts.
 */
import type { Palette, Panel } from '../../../types'
import type { DesignSystem } from '../../designSystem/types'

/** Ingredient claim badges — rounded pills with + separators. */
export function ingredientBadges(raw: string, ax: number, y: number, anchor: 'middle' | 'start', p: Palette, minMm: number): string {
  const claims = raw.split(/[+,;·]/).map((s) => s.trim().toUpperCase()).filter(Boolean).slice(0, 4)
  if (!claims.length) return ''
  const badgeW = Math.max(14, Math.min(22, 60 / claims.length))
  const badgeH = 4.8
  const gap = 2.2
  const totalW = claims.length * badgeW + (claims.length - 1) * gap
  const startX = anchor === 'middle' ? ax - totalW / 2 : ax
  const sz = Math.max(minMm, 1.6)
  let out = ''
  claims.forEach((label, i) => {
    const bx = startX + i * (badgeW + gap)
    out += `<rect x="${bx}" y="${y}" width="${badgeW}" height="${badgeH}" rx="${badgeH / 2}" fill="none" stroke="${p.accent}" stroke-width="0.24" />`
    out += `<text x="${bx + badgeW / 2}" y="${y + badgeH * 0.62}" text-anchor="middle" fill="${p.accent}" font-family="Inter, Arial, sans-serif" font-weight="500" font-size="${sz}" letter-spacing="0.25">${label}</text>`
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

/** Food claim strip — natural/additive-free badges. */
export function foodClaimStrip(panel: Panel, p: Palette, y: number, ax: number, anchor: 'middle' | 'start', minMm: number): string {
  const claims: [string, string][] = [
    ['%100', 'DOĞAL'],
    ['✓', 'KATKISIZ'],
    ['❋', 'DOĞAL ÜRÜN'],
  ]
  const gap = Math.min(18, panel.w * 0.22)
  const r = Math.min(4.2, panel.w * 0.054)
  const sz = Math.max(minMm, 1.55)
  const iconSz = Math.max(minMm + 0.5, 2.2)
  let out = ''
  claims.forEach(([icon, label], i) => {
    const cx = anchor === 'middle' ? ax + (i - 1) * gap : ax + i * gap + 4
    out += `<rect x="${cx - r}" y="${y - r}" width="${r * 2}" height="${r * 2}" fill="${p.accent}" fill-opacity="0.08" stroke="${p.accent}" stroke-width="0.24" />`
    out += `<line x1="${cx - r + 0.7}" y1="${y - r + 0.55}" x2="${cx + r - 0.7}" y2="${y - r + 0.55}" stroke="${p.accent}" stroke-opacity="0.4" stroke-width="0.12" />`
    out += `<text x="${cx}" y="${y + 0.65}" text-anchor="middle" fill="${p.accent}" font-family="Inter, Arial, sans-serif" font-weight="600" font-size="${iconSz}" letter-spacing="0.1">${icon}</text>`
    out += `<text x="${cx}" y="${y + r + 2.4}" text-anchor="middle" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-weight="500" font-size="${sz}" letter-spacing="0.4">${label}</text>`
  })
  return `<g data-art="claim-strip">${out}</g>`
}
