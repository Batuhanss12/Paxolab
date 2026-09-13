/**
 * Top/bottom panel renderer — brand + category text.
 * Extracted from composeArtwork.ts.
 */
import type { DesignSpec, Palette, Panel } from '../../../types'
import type { DesignSystem } from '../../designSystem/types'
import { monogram } from '../copy'
import { escapeSvg as esc, panelClip as clip } from '../svgGeometry'

export function renderTopPanel(
  panel: Panel,
  copy: DesignSpec['copy'],
  p: Palette,
  system: DesignSystem,
): string {
  const { x, y, w, h } = panel
  const cx = x + w / 2
  const font = system.serif ? "Georgia, 'Times New Roman', serif" : 'Inter, Arial, sans-serif'
  const cat = system.category
  let body = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.bg}" />`

  const topBrand = copy.brand.trim()
  const topSize = Math.min(2.55, h * 0.2, w * 0.065)
  const catSize = Math.min(1.85, h * 0.15, w * 0.05)
  if (topBrand) {
    const topLabel = topBrand.length > Math.floor(w / 4.5) ? monogram(topBrand) : topBrand.toUpperCase()
    body += `<text x="${cx}" y="${y + h * 0.38}" text-anchor="middle" fill="${p.fg}" font-family="${font}" font-weight="600" font-size="${topSize}" letter-spacing="1.1">${esc(topLabel)}</text>`
    if (cat && h > 12) {
      body += `<text x="${cx}" y="${y + h * 0.6}" text-anchor="middle" fill="${p.accent}" font-family="Inter, Arial, sans-serif" font-weight="500" font-size="${catSize}" letter-spacing="0.9">${esc(cat)}</text>`
    }
  } else if (cat) {
    body += `<text x="${cx}" y="${y + h * 0.42}" text-anchor="middle" fill="${p.accent}" font-family="Inter, Arial, sans-serif" font-weight="500" font-size="${Math.min(2.15, topSize)}" letter-spacing="1.2">${esc(cat)}</text>`
  } else if (copy.volume) {
    body += `<text x="${cx}" y="${y + h * 0.42}" text-anchor="middle" fill="${p.fg}" font-family="Inter, Arial, sans-serif" font-size="${Math.min(2.4, topSize)}">${esc(copy.volume)}</text>`
  }

  return `<g clip-path="${clip(panel)}">${body}</g>`
}
