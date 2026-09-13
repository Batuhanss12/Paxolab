import type { Palette, Panel, StyleType } from '../../types'
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

/** Style-specific background enrichment. Runs AFTER the base bg rect. */
export function paintStyleBackground(panel: Panel, style: StyleType, p: Palette): string {
  const { x, y, w, h } = panel

  if (style === 'eco') {
    const spots = [
      [0.12, 0.18],
      [0.28, 0.42],
      [0.48, 0.14],
      [0.66, 0.36],
      [0.82, 0.22],
      [0.18, 0.68],
      [0.38, 0.78],
      [0.58, 0.62],
      [0.74, 0.84],
      [0.88, 0.56],
      [0.08, 0.48],
      [0.52, 0.5],
    ]
    const dots = spots
      .map(([fx, fy], i) => {
        const cx = x + w * fx
        const cy = y + h * fy
        const r = 0.28 + (i % 3) * 0.08
        return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${p.fg}" opacity="0.055" />`
      })
      .join('')
    return `<g data-art="bg" data-bg="eco-grain">${dots}</g>`
  }

  if (style === 'playful') {
    const items = [
      { dx: 0.22, dy: 0.1 },
      { dx: 0.5, dy: 0.08 },
      { dx: 0.78, dy: 0.1 },
    ]
    const caps = items
      .map(({ dx, dy }) => {
        const cx = x + w * dx
        const cy = y + h * dy
        return `<rect x="${cx - 4.4}" y="${cy - 1.7}" width="8.8" height="3.4" rx="1.7" fill="${p.accent}" opacity="0.12" />`
      })
      .join('')
    return `<g data-art="bg" data-bg="playful-capsules">${caps}</g>`
  }

  if (style === 'modern') {
    return `
      <rect x="${x}" y="${y}" width="${w}" height="1.8" fill="${p.accent}" />
      <rect x="${x}" y="${y + h - 1.8}" width="${w}" height="1.8" fill="${p.accent}" opacity="0.55" />
    `
  }

  if (style === 'minimal') {
    // P2-B: foot rule stays as the single chrome element when no sector accent painted.
    // When sector bg accent is present, omit foot rule (max one chrome element).
    // Caller (composeArtwork) decides order; here we keep the rule but at quieter opacity.
    const ruleY = y + h * 0.88
    return `<line x1="${x + w * 0.2}" y1="${ruleY}" x2="${x + w * 0.8}" y2="${ruleY}" stroke="${p.accent}" stroke-opacity="0.2" stroke-width="0.18" />`
  }

  if (style === 'classic') {
    let out = ''
    const inset = 2.8
    out += `<rect x="${x + inset}" y="${y + inset}" width="${w - inset * 2}" height="${h - inset * 2}" fill="none" stroke="${p.accent}" stroke-opacity="0.2" stroke-width="0.16" />`
    const inner = inset + 1.4
    out += `<rect x="${x + inner}" y="${y + inner}" width="${w - inner * 2}" height="${h - inner * 2}" fill="none" stroke="${p.accent}" stroke-opacity="0.12" stroke-width="0.12" />`
    return out
  }

  return ''
}

/** Sector-specific background enrichment. Adds subtle texture that reinforces sector identity. */
export function paintSectorBackground(panel: Panel, sector: string, style: StyleType, p: Palette): string {
  const { x, y, w, h } = panel

  // Electronics: subtle technical grid lines at top and bottom.
  if (sector === 'electronics' && (style === 'modern' || style === 'minimal')) {
    let out = ''
    for (let i = 0; i < 3; i++) {
      const gy = y + 1.2 + i * 0.6
      out += `<line x1="${x + 4}" y1="${gy}" x2="${x + w - 4}" y2="${gy}" stroke="${p.accent}" stroke-opacity="0.04" stroke-width="0.1" />`
    }
    return `<g data-art="bg" data-bg="tech-grid">${out}</g>`
  }

  // Food/beverage: warm horizon line at lower third.
  // P2-B: minimal now allows this accent at quieter opacity (0.05 instead of 0.08).
  if (sector === 'food' || sector === 'beverage') {
    const hy = y + h * 0.72
    const op = style === 'minimal' ? 0.05 : 0.08
    return `<g data-art="bg" data-bg="warm-horizon"><line x1="${x + 2}" y1="${hy}" x2="${x + w - 2}" y2="${hy}" stroke="${p.accent}" stroke-opacity="${op}" stroke-width="0.14" /></g>`
  }

  // Cleaning: fresh diagonal accent.
  // P2-B: minimal now allows this accent at quieter opacity (0.04 instead of 0.06).
  if (sector === 'cleaning') {
    const op = style === 'minimal' ? 0.04 : 0.06
    return `<g data-art="bg" data-bg="fresh-accent"><line x1="${x + w * 0.7}" y1="${y + 2}" x2="${x + w - 2}" y2="${y + h * 0.3}" stroke="${p.accent}" stroke-opacity="${op}" stroke-width="0.12" /></g>`
  }

  return ''
}
