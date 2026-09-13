import type { Palette, Panel } from '../../../types'
import { panelClip as clip } from '../svgGeometry'

/** Die-cut product cell — no lockup, no claims. Hole reads as a window. */
export function productWindowArt(panel: Panel, p: Palette): string {
  const { x, y, w, h } = panel
  const cx = x + w / 2
  const cy = y + h / 2
  const r = Math.max(2, Math.min(w, h) / 2 - 0.35)
  return `<g clip-path="${clip(panel)}" data-art="product-window">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.paper}" fill-opacity="0.35" />
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${p.muted}" stroke-width="0.28" stroke-dasharray="1.1 0.7" />
  </g>`
}
