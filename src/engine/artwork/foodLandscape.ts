/**
 * Food box landscape theatre — vector band + crest hierarchy.
 * Labels stay label-flat (do not call this on grammar==label).
 */
import type { Palette, Panel } from '../../types'
import type { DesignSystem } from '../designSystem/types'
import { kitLevel, paintBgKit } from './bgKits'
import type { FoodFamily } from './foodFamily'
import type { SafeRect } from './patternMotifs'

export function foodBoxTheatre(
  system: Pick<DesignSystem, 'sector' | 'grammar' | 'wrapSeam'>,
  panel: Pick<Panel, 'w' | 'h'>,
  labelFace = false,
): boolean {
  return (
    system.sector === 'food' &&
    system.grammar === 'box' &&
    !system.wrapSeam &&
    !labelFace &&
    panel.h >= 90 &&
    panel.h >= panel.w * 1.05
  )
}

export function landscapeBandHeight(panel: Pick<Panel, 'h'>): number {
  return panel.h * 0.48
}

/** Claim strip sits in the band, below the crest, above the lockup. */
export function foodTheatreClaimY(panel: Panel): number {
  return panel.y + panel.h * 0.32
}

export function landscapeHeroBand(
  panel: Panel,
  p: Palette,
  family: FoodFamily = 'default-food',
  opts: { density?: 0 | 1 | 2; safe?: SafeRect; variationIndex?: number } = {},
): string {
  const { x, y, w } = panel
  const bandH = landscapeBandHeight(panel)
  const sky = family === 'honey' || family === 'jam' ? p.accent : p.fg
  const ridge = y + bandH * 0.62
  const far = y + bandH * 0.78
  const sunR = Math.min(4.8, w * 0.07)
  const sunX = x + w * 0.78
  const sunY = y + bandH * 0.28
  const fil = Math.min(7.2, w * 0.1)
  const density = opts.density ?? kitLevel(opts.variationIndex)
  const kit = paintBgKit(panel, 'meadow-wash', p, { density, safe: opts.safe })
  return `<g data-art="landscape-band" data-food-family="${family}">
    <rect x="${x}" y="${y}" width="${w}" height="${bandH}" fill="${sky}" fill-opacity="0.1" />
    <path d="M${x} ${ridge} C${x + w * 0.22} ${ridge - 10} ${x + w * 0.4} ${ridge + 6} ${x + w * 0.58} ${ridge - 4} S${x + w * 0.86} ${ridge + 8} ${x + w} ${ridge - 2} L${x + w} ${y + bandH} L${x} ${y + bandH} Z" fill="${p.fg}" fill-opacity="0.08" />
    <path d="M${x} ${far} C${x + w * 0.18} ${far - 5} ${x + w * 0.46} ${far + 4} ${x + w * 0.7} ${far - 3} S${x + w * 0.9} ${far + 5} ${x + w} ${far} L${x + w} ${y + bandH} L${x} ${y + bandH} Z" fill="${p.accent}" fill-opacity="0.12" />
    <circle cx="${sunX}" cy="${sunY}" r="${sunR}" fill="none" stroke="${p.accent}" stroke-opacity="0.45" stroke-width="0.28" />
    <path d="M${x + 2.2} ${y + 2.2} L${x + 2.2 + fil} ${y + 2.2} M${x + 2.2} ${y + 2.2} L${x + 2.2} ${y + 2.2 + fil}" fill="none" stroke="${p.accent}" stroke-opacity="0.4" stroke-width="0.22" />
    <path d="M${x + w - 2.2} ${y + 2.2} L${x + w - 2.2 - fil} ${y + 2.2} M${x + w - 2.2} ${y + 2.2} L${x + w - 2.2} ${y + 2.2 + fil}" fill="none" stroke="${p.accent}" stroke-opacity="0.4" stroke-width="0.22" />
    <path d="M${x + 2.2} ${y + bandH - 2.4} L${x + 2.2 + fil * 0.7} ${y + bandH - 2.4} M${x + 2.2} ${y + bandH - 2.4} L${x + 2.2} ${y + bandH - 2.4 - fil * 0.55}" fill="none" stroke="${p.accent}" stroke-opacity="0.28" stroke-width="0.18" />
    <path d="M${x + w - 2.2} ${y + bandH - 2.4} L${x + w - 2.2 - fil * 0.7} ${y + bandH - 2.4} M${x + w - 2.2} ${y + bandH - 2.4} L${x + w - 2.2} ${y + bandH - 2.4 - fil * 0.55}" fill="none" stroke="${p.accent}" stroke-opacity="0.28" stroke-width="0.18" />
    ${kit}
  </g>`
}
