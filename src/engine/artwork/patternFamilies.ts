import type { Panel } from '../../types'
import type { PatternFamily } from '../brain/DesignPlan'
import { contourGoldField, geoLattice, leafStampField } from './motifs'

export const PATTERN_OPACITY_CAP: Record<PatternFamily, number> = {
  contour: 0.22,
  lattice: 0.18,
  stripe: 0.2,
  grain: 0.12,
  ornament: 0.18,
  capsule: 0.2,
  weave: 0.14,
  dotgrid: 0.1,
  wave: 0.16,
  hexagon: 0.12,
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
  if (family === 'grain') return leafStampField(panel, color, op, safe)
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
  if (family === 'weave') {
    // Basket-weave texture for food/eco — interlocking horizontal + vertical bands.
    const { x, y, w, h } = panel
    let out = ''
    const step = 6.4
    for (let gy = y + 4; gy < y + h - 3; gy += step) {
      if (safe && gy > safe.y - 2 && gy < safe.y + safe.h + 2) continue
      out += `<line x1="${x + 3}" y1="${gy}" x2="${x + w - 3}" y2="${gy}" stroke="${color}" stroke-opacity="${op}" stroke-width="0.2" />`
    }
    for (let gx = x + 4; gx < x + w - 3; gx += step) {
      if (safe && gx > safe.x - 2 && gx < safe.x + safe.w + 2) continue
      out += `<line x1="${gx}" y1="${y + 3}" x2="${gx}" y2="${y + h - 3}" stroke="${color}" stroke-opacity="${op * 0.7}" stroke-width="0.14" />`
    }
    return out
  }
  if (family === 'dotgrid') {
    // Dot grid for modern/tech — precise registration marks.
    const { x, y, w, h } = panel
    let out = ''
    const step = 5.2
    for (let gy = y + 4; gy < y + h - 3; gy += step) {
      for (let gx = x + 4; gx < x + w - 3; gx += step) {
        if (safe && gx > safe.x - 2 && gx < safe.x + safe.w + 2 && gy > safe.y - 2 && gy < safe.y + safe.h + 2) continue
        out += `<circle cx="${gx}" cy="${gy}" r="0.32" fill="${color}" fill-opacity="${op}" />`
      }
    }
    return out
  }
  if (family === 'wave') {
    // Wave pattern for playful/cleaning — flowing parallel waves.
    const { x, y, w, h } = panel
    let out = ''
    for (let i = 0; i < 5; i++) {
      const yy = y + h * (0.14 + i * 0.17)
      if (safe && yy > safe.y - 3 && yy < safe.y + safe.h + 3) continue
      out += `<path d="M${x + 2} ${yy} C${x + w * 0.28} ${yy - 2.4} ${x + w * 0.55} ${yy + 2.6} ${x + w - 2} ${yy}" fill="none" stroke="${color}" stroke-opacity="${op}" stroke-width="0.2" />`
    }
    return out
  }
  if (family === 'hexagon') {
    // Hex grid for electronics — technical honeycomb.
    const { x, y, w, h } = panel
    let out = ''
    const r = 2.6
    const stepX = r * 1.7
    const stepY = r * 1.5
    for (let row = 0, gy = y + 4; gy < y + h - 3; gy += stepY, row++) {
      const offset = row % 2 === 0 ? 0 : stepX / 2
      for (let gx = x + 4 + offset; gx < x + w - 3; gx += stepX) {
        if (safe && gx > safe.x - 3 && gx < safe.x + safe.w + 3 && gy > safe.y - 3 && gy < safe.y + safe.h + 3) continue
        const pts = []
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i - Math.PI / 6
          pts.push(`${(gx + r * Math.cos(a)).toFixed(2)},${(gy + r * Math.sin(a)).toFixed(2)}`)
        }
        out += `<polygon points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-opacity="${op}" stroke-width="0.14" />`
      }
    }
    return out
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
