/**
 * Label back panel — usage/warnings/marks for label packaging.
 * Extracted from composeArtwork.ts.
 */
import type { DesignBrief, DesignSpec, Palette, Panel } from '../../../types'
import type { DesignSystem } from '../../designSystem/types'
import { resolveStickerMarks } from '../../marks/MarkMatrix'
import { renderMarkStrip } from '../../marks/render'
import { perfumeAssetsAllowed } from '../../marks/MarkMatrix'
import { barcodeSvg } from '../../barcode'
import { resolveCopyLocale } from '../../copyLocale'
import { escapeSvg as esc, panelClip as clip, wrapSvgLines as wrapLines } from '../svgGeometry'
import { foodNutritionTable } from './foodElements'

export function labelBackArt(
  panel: Panel,
  copy: DesignSpec['copy'],
  p: Palette,
  system: DesignSystem,
  brief: DesignBrief,
): string {
  const { x, y, w, h } = panel
  const sticker = resolveStickerMarks(system.sector, w, h, brief)
  const header = 11.2
  const footer = Math.min(22, Math.max(14, h * 0.22))
  const lineH = Math.max(2.65, h < 50 ? 2.35 : 2.65)
  const bodySpace = h - header - footer - 8
  const maxLines = Math.max(3, Math.floor(bodySpace / lineH))
  const usage = wrapLines(copy.warnings || sticker.warnings, Math.max(16, Math.floor((w - 8) / 1.9)), Math.ceil(maxLines * 0.55))
  const how = wrapLines(copy.ingredients, Math.max(16, Math.floor((w - 8) / 1.9)), Math.max(2, maxLines - usage.length - 2))
  const ids = sticker.strip
  const footY = y + h - footer
  let body = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.bg}" />`
  const locale = resolveCopyLocale(brief)
  body += `<text x="${x + 4}" y="${y + 5.4}" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-weight="500" font-size="1.7" letter-spacing="1.2">${locale === 'en' ? 'BACK' : 'ARKA YÜZ'}</text>`
  body += `<text x="${x + w - 4}" y="${y + 5.4}" text-anchor="end" fill="${p.accent}" font-family="Inter, Arial, sans-serif" font-weight="600" font-size="1.7" letter-spacing="0.8">${esc(copy.brand.toUpperCase())}</text>`
  body += `<text x="${x + 4}" y="${y + 9.6}" fill="${p.fg}" font-family="Inter, Arial, sans-serif" font-weight="600" font-size="2.2" letter-spacing="1.05">${locale === 'en' ? 'HOW TO USE' : 'KULLANIM'}</text>`
  let cursor = y + header + 1.2
  how.forEach((line) => {
    body += `<text x="${x + 4}" y="${cursor}" fill="${p.fg}" font-family="Inter, Arial, sans-serif" font-weight="400" font-size="1.95">${esc(line)}</text>`
    cursor += lineH
  })
  cursor += 2.4
  body += `<text x="${x + 4}" y="${cursor}" fill="${p.accent}" font-family="Inter, Arial, sans-serif" font-weight="600" font-size="2.05" letter-spacing="1.05">${locale === 'en' ? 'WARNING' : 'UYARI'}</text>`
  cursor += 3.1
  usage.forEach((line) => {
    body += `<text x="${x + 4}" y="${cursor}" fill="${p.fg}" font-family="Inter, Arial, sans-serif" font-weight="400" font-size="1.95">${esc(line)}</text>`
    cursor += lineH
  })
  if (system.sector === 'food' && cursor + 14 < footY - 6) {
    body += foodNutritionTable(x + 4, cursor + 2.2, w - 8, p, system, true, locale)
  }
  if (copy.manufacturer) {
    body += `<text x="${x + 4}" y="${footY - 3.8}" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-weight="500" font-size="1.7">${esc(copy.manufacturer)}</text>`
  }
  if (copy.address) {
    body += `<text x="${x + 4}" y="${footY - 1.6}" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-weight="400" font-size="1.55">${esc(copy.address)}</text>`
  }
  body += `<line x1="${x + 4}" y1="${footY}" x2="${x + w - 4}" y2="${footY}" stroke="${p.muted}" stroke-opacity="0.5" stroke-width="0.16" />`
  if (ids.length) {
    const reserve = copy.barcode ? 28 : 6
    const span = Math.max(18, w - reserve - 6)
    body += renderMarkStrip(x + 4, footY + 2.2, span, p.accent, ids, sticker.recipe, perfumeAssetsAllowed(system.sector), 7.2)
  }
  if (copy.barcode) {
    body += barcodeSvg(copy.barcode, x + w - 28, footY + 2.4, 24, 7.2, p.fg)
  }
  return `<g clip-path="${clip(panel)}">${body}</g>`
}
