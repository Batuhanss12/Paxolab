import type { Palette, Panel } from '../../../types'

/** Additive X-device geometry — stroke only, never a hero. */
export function deviceOverlayArt(panel: Panel, p: Palette): string {
  const points = panel.polygon.map((pt) => `${pt.x},${pt.y}`).join(' ')
  if (!points) return ''
  return `<g data-art="device-overlay"><polygon points="${points}" fill="none" stroke="${p.accent}" stroke-width="0.32" stroke-dasharray="1.4 0.8" /></g>`
}
