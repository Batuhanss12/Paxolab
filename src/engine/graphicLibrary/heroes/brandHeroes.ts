/**
 * Brand-specific heroes — 2 new real SVG hero painters.
 * luxury-monogram: luxury monogram crest (ring + initial + laurel)
 * eco-leaf-hero: eco leaf hero (large leaf with stem)
 */
import type { GraphicEntry, GraphicMeta, PaintCtx } from '../types'
import { registerGraphics } from '../registry'
import { wrapHero } from '../../artwork/heroes'
import type { StyleType } from '../../../types'
import type { SectorId } from '../../designSystem/types'

/** Luxury monogram — ring + initial + laurel accents. */
export function paintLuxuryMonogram(ctx: PaintCtx): string {
  const { panel, palette, heroYFrac, heroXFrac, heroScale } = ctx
  const cx = panel.x + panel.w * (heroXFrac ?? 0.5)
  const cy = panel.y + panel.h * (heroYFrac ?? 0.148)
  const r = Math.min(panel.w, panel.h) * 0.08 * (heroScale ?? 1)
  let out = ''
  // Outer ring
  out += `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}" fill="none" stroke="${palette.accent}" stroke-width="0.32" />`
  // Inner ring
  out += `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${(r * 0.82).toFixed(2)}" fill="none" stroke="${palette.accent}" stroke-opacity="0.5" stroke-width="0.16" />`
  // Laurel accents — 2 small leaves on each side
  for (const side of [-1, 1]) {
    const lx = cx + side * r * 1.15
    const ly = cy
    out += `<path d="M${lx.toFixed(2)} ${(ly - r * 0.4).toFixed(2)} Q${(lx + side * r * 0.2).toFixed(2)} ${ly.toFixed(2)} ${lx.toFixed(2)} ${(ly + r * 0.4).toFixed(2)}" fill="none" stroke="${palette.accent}" stroke-opacity="0.6" stroke-width="0.16" />`
  }
  // Initial
  out += `<text x="${cx.toFixed(2)}" y="${(cy + r * 0.35).toFixed(2)}" text-anchor="middle" fill="${palette.accent}" font-family="Georgia, serif" font-size="${(r * 0.85).toFixed(2)}" font-weight="500">M</text>`
  return wrapHero('crest', out)
}

/** Eco leaf hero — large leaf with stem. */
export function paintEcoLeafHero(ctx: PaintCtx): string {
  const { panel, palette, heroYFrac, heroXFrac, heroScale } = ctx
  const cx = panel.x + panel.w * (heroXFrac ?? 0.5)
  const cy = panel.y + panel.h * (heroYFrac ?? 0.148)
  const r = Math.min(panel.w, panel.h) * 0.09 * (heroScale ?? 1)
  let out = ''
  // Stem
  out += `<line x1="${cx.toFixed(2)}" y1="${(cy + r).toFixed(2)}" x2="${cx.toFixed(2)}" y2="${(cy - r * 0.5).toFixed(2)}" stroke="${palette.accent}" stroke-width="0.2" />`
  // Leaf body
  out += `<path d="M${cx.toFixed(2)} ${(cy - r).toFixed(2)} C${(cx + r * 0.8).toFixed(2)} ${(cy - r * 0.5).toFixed(2)} ${(cx + r * 0.6).toFixed(2)} ${(cy + r * 0.5).toFixed(2)} ${cx.toFixed(2)} ${cy.toFixed(2)} C${(cx - r * 0.6).toFixed(2)} ${(cy + r * 0.5).toFixed(2)} ${(cx - r * 0.8).toFixed(2)} ${(cy - r * 0.5).toFixed(2)} ${cx.toFixed(2)} ${(cy - r).toFixed(2)} Z" fill="none" stroke="${palette.accent}" stroke-width="0.24" />`
  // Leaf vein
  out += `<line x1="${cx.toFixed(2)}" y1="${(cy - r).toFixed(2)}" x2="${cx.toFixed(2)}" y2="${cy.toFixed(2)}" stroke="${palette.accent}" stroke-opacity="0.4" stroke-width="0.14" />`
  // Side veins
  for (const side of [-1, 1]) {
    for (let i = 0; i < 2; i++) {
      const t = 0.3 + i * 0.3
      const vy = cy - r + t * r * 1.2
      out += `<line x1="${cx.toFixed(2)}" y1="${vy.toFixed(2)}" x2="${(cx + side * r * 0.3).toFixed(2)}" y2="${(vy + r * 0.15).toFixed(2)}" stroke="${palette.accent}" stroke-opacity="0.3" stroke-width="0.1" />`
    }
  }
  return wrapHero('botanical', out)
}

function entry(
  id: string,
  label: string,
  styles: StyleType[],
  sectors: SectorId[],
  density: 'sparse' | 'balanced' | 'dense',
  paint: GraphicEntry['paint'],
): GraphicEntry {
  const meta: GraphicMeta = { id, category: 'hero', label, styles, sectors, density, opacityCap: 1 }
  return { meta, paint }
}

export const brandHeroEntries: GraphicEntry[] = [
  entry('luxury-monogram', 'Luxury monogram crest', ['luxury', 'classic'], ['perfume'], 'balanced', paintLuxuryMonogram),
  entry('eco-leaf-hero', 'Eco leaf hero', ['eco'], ['food', 'beverage', 'cream', 'serum'], 'balanced', paintEcoLeafHero),
]

registerGraphics(brandHeroEntries)
