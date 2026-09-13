import type { Palette, Panel } from '../../types'
import type { BackgroundTreatment } from '../brain/DesignPlan'

/** Extra fields only. dark-field / quiet-paper / kraft keep the existing rect + eco grain. */
export function paintBackgroundTreatment(panel: Panel, treatment: BackgroundTreatment, p: Palette): string {
  const { x, y, w, h } = panel
  if (treatment === 'vignette') {
    return `
      <rect x="${x}" y="${y}" width="${w}" height="${h * 0.16}" fill="${p.fg}" opacity="0.06" />
      <rect x="${x}" y="${y + h * 0.84}" width="${w}" height="${h * 0.16}" fill="${p.fg}" opacity="0.06" />
    `
  }
  if (treatment === 'dual-tone') {
    return `<rect x="${x}" y="${y}" width="${w}" height="0.9" fill="${p.fg}" opacity="0.05" data-art="bg" data-bg="dual-tone" />`
  }
  return ''
}
