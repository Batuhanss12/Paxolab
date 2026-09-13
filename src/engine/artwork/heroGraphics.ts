import type { Palette, Panel } from '../../types'
import type { HeroFamily } from '../brain/DesignPlan'
import type { DecorFamily } from '../designSystem/types'

export function kitHeroFamily(decor: DecorFamily): HeroFamily {
  if (decor === 'crest') return 'crest'
  if (decor === 'cartouche') return 'seal'
  if (decor === 'leaf' || decor === 'drop') return 'botanical'
  if (decor === 'badge') return 'emblem'
  if (decor === 'olive' || decor === 'harvest') return 'harvest'
  if (decor === 'oval') return 'oval'
  if (decor === 'grid' || decor === 'plaque') return 'tech'
  return 'none'
}

function origin(panel: Panel, scale: number): { cx: number; cy: number; r: number } {
  const cx = panel.x + panel.w / 2
  const cy = panel.y + panel.h * 0.148
  const r = Math.min(panel.w, panel.h) * 0.072 * scale
  return { cx, cy, r }
}

/** Library heroes only. Crest / oval / harvest kit paths stay in composeArtwork. */
export function paintHeroGraphic(family: HeroFamily, panel: Panel, p: Palette, scale = 1): string {
  const { cx, cy, r } = origin(panel, scale)
  if (family === 'seal') {
    return `
      <circle cx="${cx}" cy="${cy}" r="${r + 2.4}" fill="none" stroke="${p.accent}" stroke-width="0.2" />
      <circle cx="${cx}" cy="${cy}" r="${r + 1.05}" fill="none" stroke="${p.accent}" stroke-opacity="0.55" stroke-width="0.16" />
      <circle cx="${cx}" cy="${cy}" r="${r * 0.42}" fill="none" stroke="${p.accent}" stroke-width="0.28" />
      <path d="M${cx - r * 0.7} ${cy} A${r * 0.7} ${r * 0.7} 0 0 1 ${cx + r * 0.7} ${cy}" fill="none" stroke="${p.accent}" stroke-width="0.2" />
    `
  }
  if (family === 'botanical') {
    return `
      <path d="M${cx} ${cy - r} C${cx + r * 0.85} ${cy - r * 0.2} ${cx + r * 0.7} ${cy + r * 0.55} ${cx} ${cy + r}
        C${cx - r * 0.7} ${cy + r * 0.55} ${cx - r * 0.85} ${cy - r * 0.2} ${cx} ${cy - r}" fill="none" stroke="${p.accent}" stroke-width="0.3" />
      <line x1="${cx}" y1="${cy - r * 0.85}" x2="${cx}" y2="${cy + r * 0.85}" stroke="${p.accent}" stroke-width="0.16" />
      <path d="M${cx} ${cy - r * 0.15} C${cx + r * 1.15} ${cy - r * 0.95} ${cx + r * 1.35} ${cy + r * 0.2} ${cx + r * 0.2} ${cy + r * 0.05}" fill="none" stroke="${p.accent}" stroke-opacity="0.7" stroke-width="0.18" />
    `
  }
  if (family === 'emblem') {
    const s = r * 0.95
    return `
      <polygon points="${cx},${cy - s} ${cx + s * 0.72},${cy - s * 0.2} ${cx + s * 0.45},${cy + s * 0.75} ${cx - s * 0.45},${cy + s * 0.75} ${cx - s * 0.72},${cy - s * 0.2}" fill="none" stroke="${p.accent}" stroke-width="0.32" />
      <circle cx="${cx}" cy="${cy}" r="${r * 0.28}" fill="none" stroke="${p.accent}" stroke-width="0.2" />
    `
  }
  if (family === 'harvest') {
    return `
      <ellipse cx="${cx}" cy="${cy}" rx="${r * 1.55}" ry="${r * 0.72}" fill="none" stroke="${p.accent}" stroke-width="0.3" />
      <ellipse cx="${cx}" cy="${cy}" rx="${r * 1.15}" ry="${r * 0.48}" fill="none" stroke="${p.accent}" stroke-opacity="0.55" stroke-width="0.16" />
      <path d="M${cx} ${cy - r * 0.7} C${cx + r * 0.55} ${cy - r * 0.1} ${cx + r * 0.5} ${cy + r * 0.45} ${cx} ${cy + r * 0.7}
        C${cx - r * 0.5} ${cy + r * 0.45} ${cx - r * 0.55} ${cy - r * 0.1} ${cx} ${cy - r * 0.7}" fill="none" stroke="${p.accent}" stroke-width="0.22" />
    `
  }
  if (family === 'tech') {
    const w = r * 2.4
    const h = r * 1.15
    return `
      <rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" fill="none" stroke="${p.accent}" stroke-width="0.28" />
      <line x1="${cx - w / 2 + 1.1}" y1="${cy - h / 2 + 1}" x2="${cx + w / 2 - 1.1}" y2="${cy - h / 2 + 1}" stroke="${p.accent}" stroke-opacity="0.4" stroke-width="0.12" />
      <circle cx="${cx + w / 2 - 1.6}" cy="${cy}" r="0.55" fill="${p.accent}" fill-opacity="0.7" />
    `
  }
  if (family === 'oval') {
    return `<ellipse cx="${cx}" cy="${cy}" rx="${r * 1.45}" ry="${r * 0.62}" fill="none" stroke="${p.accent}" stroke-width="0.28" />`
  }
  return ''
}

export function wrapHero(family: HeroFamily, markup: string): string {
  if (!markup) return ''
  return `<g data-art="hero" data-hero="${family}">${markup}</g>`
}
