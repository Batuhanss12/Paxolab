/**
 * Hero registry — wraps existing hero painters into the GraphicLibrary.
 * Heroes are the primary brand mark (crest, seal, oval, botanical, harvest, tech, etc.).
 * Hero painters use composition zone (heroYFrac, heroXFrac) + scale from PaintCtx.
 */
import type { GraphicEntry, GraphicMeta, PaintCtx } from '../types'
import { registerGraphics } from '../registry'
import { paintHeroGraphic, wrapHero } from '../../artwork/heroes'
import type { HeroFamily } from '../../brain/DesignPlan'
import type { StyleType } from '../../../types'
import type { SectorId } from '../../designSystem/types'

function heroPainter(family: HeroFamily): (ctx: PaintCtx) => string {
  return (ctx) => {
    const yFrac = ctx.heroYFrac ?? 0.148
    const xFrac = ctx.heroXFrac ?? 0.5
    const scale = ctx.heroScale ?? ctx.scale ?? 1
    const markup = paintHeroGraphic(family, ctx.panel, ctx.palette, scale, yFrac, xFrac)
    return wrapHero(family, markup)
  }
}

function entry(
  id: HeroFamily,
  label: string,
  styles: StyleType[],
  sectors: SectorId[],
  density: 'sparse' | 'balanced' | 'dense',
): GraphicEntry {
  const meta: GraphicMeta = { id, category: 'hero', label, styles, sectors, density, opacityCap: 1 }
  return { meta, paint: heroPainter(id) }
}

export const heroEntries: GraphicEntry[] = [
  entry('crest', 'Crest', ['luxury', 'classic'], ['perfume'], 'balanced'),
  entry('oval', 'Oval plaque', ['luxury', 'modern'], ['cream', 'serum'], 'balanced'),
  entry('emblem', 'Badge emblem', ['playful', 'modern'], ['cream', 'serum'], 'balanced'),
  entry('botanical', 'Botanical', ['eco'], ['food', 'beverage'], 'balanced'),
  entry('harvest', 'Harvest', ['eco', 'classic'], ['food', 'beverage'], 'balanced'),
  entry('tech', 'Tech grid', ['modern'], ['electronics'], 'balanced'),
  entry('monstera', 'Monstera leaf', ['eco', 'playful'], ['cream', 'serum'], 'balanced'),
  entry('palm', 'Palm frond', ['eco', 'playful'], ['cream', 'serum'], 'balanced'),
  entry('organic-wave', 'Organic wave', ['playful', 'eco'], ['cream', 'serum'], 'balanced'),
  entry('zebra', 'Zebra pattern', ['modern', 'playful'], ['cream', 'serum'], 'balanced'),
  entry('line-scene', 'Line horizon', ['minimal'], ['cream', 'serum', 'baby'], 'sparse'),
  entry('none', 'No hero', ['minimal'], [], 'sparse'),
]

registerGraphics(heroEntries)

// Register brand-specific heroes (luxury-monogram, eco-leaf-hero).
import './brandHeroes'
