import type { DesignSpec, Palette, Panel } from '../../../types'
import { escapeSvg as esc, panelClip as clip } from '../svgGeometry'

/** Restrained wall — not a second hero. Brand only, clipped to the polygon. */
export function polygonWallArt(panel: Panel, copy: DesignSpec['copy'], p: Palette): string {
  const { x, y, w, h } = panel
  const brand = (copy.brand || '').trim()
  const size = Math.min(3.2, Math.max(1.8, Math.min(w, h) * 0.08))
  const mark = brand ? `<text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-size="${size}" letter-spacing="0.6">${esc(brand.toUpperCase())}</text>` : ''
  return `<g clip-path="${clip(panel)}" data-art="polygon-wall"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.bg}" />${mark}</g>`
}
