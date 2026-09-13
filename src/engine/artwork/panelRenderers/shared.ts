/**
 * Shared panel renderer helpers — used by front/back/side/top renderers.
 * Extracted from composeArtwork.ts to reduce monolith size.
 */
import type { Palette, Panel } from '../../../types'
import type { DesignSystem } from '../../designSystem/types'
import { layoutFrontLockup } from '../../designSystem/typeSystem'
import { diamondAt, lBrackets, type SafeRect } from '../motifs'
import { escapeSvg as esc, panelClip as clip } from '../svgGeometry'

export { esc, clip, type SafeRect }

/** Clip path that knocks out the lockup safe area from the panel. */
export function lockoutClip(id: string, panel: Panel, hole: SafeRect): string {
  const { x, y, w, h } = panel
  return `<defs><clipPath id="lockout-${id}" clipPathUnits="userSpaceOnUse"><path fill-rule="evenodd" d="M${x} ${y}h${w}v${h}h${-w}z M${hole.x} ${hole.y}h${hole.w}v${hole.h}h${-hole.w}z" /></clipPath></defs>`
}

/** Decorative rule under lockup — foil diamond, double line, hair, or eco. */
export function lockupRule(layout: ReturnType<typeof layoutFrontLockup>, panel: Panel, p: Palette): string {
  if (!layout.hasRule || layout.ruleY == null) return ''
  const { ax, ruleY, ruleKind } = layout
  const cx = panel.x + panel.w / 2
  const left = layout.anchor === 'start'
  const origin = left ? ax : cx
  if (ruleKind === 'foil') {
    const ruleW = panel.w * (layout.taglineSize < 3 ? 0.16 : 0.17)
    return `<line x1="${origin - (left ? 0 : ruleW)}" y1="${ruleY}" x2="${origin + ruleW}" y2="${ruleY}" stroke="${p.accent}" stroke-width="0.34" />
      <path d="M${origin} ${ruleY - 0.72} L${origin + 0.78} ${ruleY} L${origin} ${ruleY + 0.72} L${origin - 0.78} ${ruleY} Z" fill="${p.accent}" />`
  }
  if (ruleKind === 'double') {
    const ruleW = panel.w * 0.15
    return `<line x1="${origin - (left ? 0 : ruleW)}" y1="${ruleY - 0.32}" x2="${origin + ruleW}" y2="${ruleY - 0.32}" stroke="${p.accent}" stroke-width="0.16" />
      <line x1="${origin - (left ? 0 : ruleW)}" y1="${ruleY + 0.32}" x2="${origin + ruleW}" y2="${ruleY + 0.32}" stroke="${p.accent}" stroke-width="0.16" />`
  }
  if (ruleKind === 'hair') {
    const ruleW = panel.w * 0.09
    return `<line x1="${cx - ruleW}" y1="${ruleY}" x2="${cx + ruleW}" y2="${ruleY}" stroke="${p.fg}" stroke-width="0.18" />`
  }
  if (ruleKind === 'eco') {
    return `<line x1="${cx - panel.w * 0.13}" y1="${ruleY}" x2="${cx + panel.w * 0.13}" y2="${ruleY}" stroke="${p.accent}" stroke-width="0.2" />`
  }
  return ''
}

/** Nested rectangular frames — luxury uses 4 thinning rings. */
export function frames(panel: Panel, p: Palette, count: number, rounded: boolean, luxury = false): string {
  if (count <= 0) return ''
  const r = rounded ? 2.2 : 0
  const steps = luxury
    ? [1.15, 2.05, 3.1, 4.25]
    : count === 3
      ? [1.35, 2.45, 3.65]
      : count === 2
        ? [1.7, 3.05]
        : [2.3]
  return steps
    .map((inset, i) => {
      const sw = luxury ? [0.52, 0.28, 0.18, 0.12][i] : i === 0 ? 0.46 : i === 1 ? 0.22 : 0.16
      const op = luxury ? 1 - i * 0.14 : 1 - i * 0.18
      return `<rect x="${panel.x + inset}" y="${panel.y + inset}" width="${panel.w - inset * 2}" height="${panel.h - inset * 2}" rx="${r}" fill="none" stroke="${p.accent}" stroke-opacity="${op}" stroke-width="${sw}" />`
    })
    .join('')
}

/** Sector-specific frame: electronics uses corner brackets, food uses decorative corners. */
export function sectorFrame(panel: Panel, p: Palette, sector: string, style: string): string {
  if (sector === 'electronics' && (style === 'modern' || style === 'minimal')) {
    return lBrackets(panel, p.accent)
  }
  if ((sector === 'food' || sector === 'beverage') && (style === 'luxury' || style === 'classic')) {
    const inset = 2.3
    const d = diamondAt(panel.x + inset, panel.y + inset, p.accent, 0.6)
    const d2 = diamondAt(panel.x + panel.w - inset, panel.y + inset, p.accent, 0.6)
    const d3 = diamondAt(panel.x + inset, panel.y + panel.h - inset, p.accent, 0.6)
    const d4 = diamondAt(panel.x + panel.w - inset, panel.y + panel.h - inset, p.accent, 0.6)
    return `${frames(panel, p, 1, false, false)}${d}${d2}${d3}${d4}`
  }
  return frames(panel, p, 1, style === 'eco' || style === 'playful', style === 'luxury')
}

/** Modern style left stripe. */
export function modernStripe(panel: Panel, p: Palette): string {
  return `
    <rect x="${panel.x}" y="${panel.y}" width="3.05" height="${panel.h}" fill="${p.accent}" />
    <line x1="${panel.x + 3.05}" y1="${panel.y}" x2="${panel.x + panel.w}" y2="${panel.y}" stroke="${p.accent}" stroke-width="0.28" />
  `
}

/** Glue panel — plain paper with GLUE label. */
export function glueOnly(panel: Panel, p: Palette): string {
  const { x, y, w, h } = panel
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.paper}" />
    <text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" fill="${p.muted}" font-size="${Math.min(2.4, h * 0.16)}" font-family="Inter, Arial, sans-serif" letter-spacing="0.9">GLUE</text>`
}

/** Tuck/flap panel — plain paper with optional luxury tick or mark. */
export function flapGround(panel: Panel, p: Palette, luxuryTick: boolean, mark = ''): string {
  const { x, y, w, h } = panel
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.paper}" />`
  if (luxuryTick && w > 8 && h > 6) {
    out += `<line x1="${x + 1.2}" y1="${y + 1.2}" x2="${x + 3.4}" y2="${y + 1.2}" stroke="${p.accent}" stroke-opacity="0.45" stroke-width="0.16" />`
  }
  if (mark && w > 10 && h > 8) {
    out += `<text x="${x + w / 2}" y="${y + h / 2 + 0.7}" text-anchor="middle" fill="${p.muted}" font-family="Georgia, 'Times New Roman', serif" font-size="${Math.min(2.6, h * 0.28)}" letter-spacing="0.8">${esc(mark)}</text>`
  }
  return out
}

/** Label decor — frame or stripe depending on style. */
export function labelDecor(panel: Panel, system: DesignSystem, p: Palette): string {
  const { style } = system
  if (system.wrapSeam) return ''
  if (style === 'luxury' || style === 'classic') return frames(panel, p, 1, false, false)
  if (style === 'playful' || style === 'eco') return frames(panel, p, 1, true)
  if (style === 'modern') return modernStripe(panel, p)
  return ''
}
