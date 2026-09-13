import type { Panel } from '../../types'
import type { PatternFamily } from '../brain/DesignPlan'
import { contourGoldField, geoLattice, leafStampField } from './motifs'

export const PATTERN_OPACITY_CAP: Record<PatternFamily, number> = {
  contour: 0.22,
  lattice: 0.12,
  stripe: 0.2,
  grain: 0.12,
  ornament: 0.18,
  capsule: 0.2,
  none: 0,
}

type SafeRect = { x: number; y: number; w: number; h: number }

/** Named families. Default kits already paint the matching family — call only for a swap. */
export function paintPatternFamily(
  family: PatternFamily,
  panel: Panel,
  color: string,
  opacity: number,
  safe?: SafeRect,
): string {
  const cap = PATTERN_OPACITY_CAP[family]
  const op = Math.min(opacity, cap)
  if (family === 'contour') return contourGoldField(panel, color, op, safe)
  if (family === 'lattice') return geoLattice(panel, color, op, safe)
  if (family === 'stripe') {
    let out = ''
    for (let i = 0; i < 5; i++) {
      const yy = panel.y + panel.h * (0.16 + i * 0.16)
      if (safe && yy > safe.y - 2 && yy < safe.y + safe.h + 2) continue
      out += `<line x1="${panel.x + 2}" y1="${yy}" x2="${panel.x + panel.w - 2}" y2="${yy}" stroke="${color}" stroke-opacity="${op}" stroke-width="0.18" />`
    }
    return out
  }
  if (family === 'grain') return leafStampField(panel, color)
  if (family === 'ornament') {
    const { x, y, w, h } = panel
    const cx = x + w / 2
    const inset = 4.6
    return `
      <rect x="${x + inset}" y="${y + inset}" width="${w - inset * 2}" height="${h - inset * 2}" fill="none" stroke="${color}" stroke-opacity="${op}" stroke-width="0.28" />
      <line x1="${x + 4}" y1="${y + 3.2}" x2="${x + w - 4}" y2="${y + 3.2}" stroke="${color}" stroke-opacity="${op}" stroke-width="0.2" />
      <line x1="${x + 4}" y1="${y + h - 3.2}" x2="${x + w - 4}" y2="${y + h - 3.2}" stroke="${color}" stroke-opacity="${op}" stroke-width="0.2" />
      <path d="M${cx} ${y + inset - 1.15} L${cx + 1.15} ${y + inset} L${cx} ${y + inset + 1.15} L${cx - 1.15} ${y + inset} Z" fill="${color}" fill-opacity="${Math.min(0.55, op + 0.25)}" />
    `
  }
  if (family === 'capsule') {
    const { x, y, w } = panel
    return `
      <rect x="${x + w * 0.18}" y="${y + 5.2}" width="${w * 0.28}" height="3.4" rx="1.7" fill="none" stroke="${color}" stroke-opacity="${op}" stroke-width="0.22" />
      <rect x="${x + w * 0.54}" y="${y + 5.2}" width="${w * 0.28}" height="3.4" rx="1.7" fill="none" stroke="${color}" stroke-opacity="${op}" stroke-width="0.22" />
    `
  }
  return ''
}

export function wrapPattern(family: PatternFamily, markup: string): string {
  if (!markup || family === 'none') return markup
  return `<g data-art="pattern" data-pattern="${family}">${markup}</g>`
}

export function wrapSidePattern(family: PatternFamily, markup: string): string {
  if (!markup) return ''
  return `<g data-art="side-pattern" data-pattern="${family}">${markup}</g>`
}
