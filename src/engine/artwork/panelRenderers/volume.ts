/**
 * Volume rendering — gold bar, capsule, stamp, outline, plain.
 * Extracted from composeArtwork.ts.
 */
import type { Palette, Panel } from '../../../types'
import type { DesignSystem } from '../../designSystem/types'
import { volumeMarkup } from '../../designSystem/typeSystem'
import { volumeUsesEstimated } from '../../designSystem/volumeFormat'
import { fontStack } from '../languages'

/** Gold bar — luxury bottom strip with volume. */
export function goldBar(panel: Panel, p: Palette, volume: string, estimated: boolean, system: DesignSystem): string {
  const bh = 9.15
  const y = panel.y + panel.h - bh
  const type = { ...system.type, volumeMm: Math.max(system.type.volumeMm, 2.95) }
  return `<g data-art="gold-bar">
    <rect x="${panel.x}" y="${y}" width="${panel.w}" height="${bh}" fill="${p.accent}" />
    <rect x="${panel.x + 1.15}" y="${y + 1.05}" width="${panel.w - 2.3}" height="${bh - 2.1}" fill="none" stroke="${p.bg}" stroke-opacity="0.38" stroke-width="0.22" />
    ${volumeMarkup(panel.x + panel.w / 2, y + bh * 0.64, volume, type, p.bg, 'middle', fontStack('sans'), estimated)}
  </g>`
}

/** Capsule volume — playful rounded pill. */
export function capsuleVolume(panel: Panel, p: Palette, volume: string, system: DesignSystem): string {
  const bw = Math.min(panel.w * 0.62, 38)
  const bh = 8.4
  const x = panel.x + (panel.w - bw) / 2
  const y = panel.y + panel.h - bh - 4.2
  return `<g data-art="capsule-volume">
    <rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="${bh / 2}" fill="${p.accent}" />
    ${volumeMarkup(x + bw / 2, y + bh * 0.66, volume, system.type, p.bg, 'middle', fontStack('sans'), volumeUsesEstimated(volume))}
  </g>`
}

/** Stamp volume — eco rectangular stamp. */
export function stampVolume(panel: Panel, p: Palette, volume: string, system: DesignSystem): string {
  const cx = panel.x + panel.w / 2
  const cy = panel.y + panel.h * 0.84
  const sw = Math.min(18, panel.w * 0.32)
  const sh = 5.6
  const inset = 0.6
  return `
    <rect x="${cx - sw / 2}" y="${cy - sh / 2}" width="${sw}" height="${sh}" rx="${sh * 0.12}" fill="none" stroke="${p.accent}" stroke-width="0.34" />
    <rect x="${cx - sw / 2 + inset}" y="${cy - sh / 2 + inset}" width="${sw - inset * 2}" height="${sh - inset * 2}" rx="${sh * 0.08}" fill="none" stroke="${p.accent}" stroke-opacity="0.4" stroke-width="0.14" />
    ${volumeMarkup(cx, cy + 1.1, volume, system.type, p.fg, 'middle', fontStack('serif'), true)}
  `
}

/** Outline volume — modern rectangular outline. */
export function outlineVolume(panel: Panel, p: Palette, volume: string, left: boolean, ax: number, system: DesignSystem): string {
  const bw = Math.min(28, panel.w * 0.42)
  const x = left ? ax : panel.x + panel.w / 2 - bw / 2
  const y = panel.y + panel.h * 0.8
  return `
    <rect x="${x}" y="${y}" width="${bw}" height="6.4" fill="none" stroke="${p.fg}" stroke-width="0.28" />
    ${volumeMarkup(x + bw / 2, y + 4.35, volume, system.type, p.fg, 'middle', fontStack('sans'), volumeUsesEstimated(volume))}
  `
}

/** Plain volume markup — fallback. */
export function plainVolume(ax: number, y: number, volume: string, system: DesignSystem, p: Palette, anchor: 'start' | 'middle', perfume: boolean, labelFace: boolean, panel: Panel): string {
  return volumeMarkup(
    ax,
    y + panel.h * (labelFace ? 0.78 : 0.82),
    volume,
    system.type,
    p.fg,
    anchor,
    fontStack('sans'),
    perfume || volumeUsesEstimated(volume),
  )
}
