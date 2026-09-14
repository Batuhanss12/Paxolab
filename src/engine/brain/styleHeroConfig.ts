/**
 * Style×Sector → hero family preferences.
 * Data-driven config extracted from ArtDirection.ts styleHeroes().
 * Add new style/sector combinations by appending to STYLE_HEROES.
 */
import type { SectorId } from '../designSystem/types'
import type { HeroFamily } from './DesignPlan'
import type { StyleType } from '../../types'

export type StyleHeroEntry = {
  style: StyleType
  sector: SectorId | '*'
  heroes: HeroFamily[]
}

/**
 * Ordered preference table. First match wins.
 * Sector-specific entries must come before '*' fallbacks.
 */
export const STYLE_HEROES: StyleHeroEntry[] = [
  // Minimal always none
  { style: 'minimal', sector: '*', heroes: ['none'] },

  // Perfume
  { style: 'luxury', sector: 'perfume', heroes: ['crest', 'oval'] },
  { style: 'classic', sector: 'perfume', heroes: ['crest'] },
  { style: 'eco', sector: 'perfume', heroes: ['botanical', 'monstera'] },
  { style: 'playful', sector: 'perfume', heroes: ['emblem'] },
  { style: 'modern', sector: 'perfume', heroes: ['none'] },

  // Cream
  { style: 'eco', sector: 'cream', heroes: ['botanical', 'monstera', 'palm'] },
  { style: 'playful', sector: 'cream', heroes: ['emblem', 'oval'] },
  { style: 'classic', sector: 'cream', heroes: ['oval', 'crest'] },
  { style: 'modern', sector: 'cream', heroes: ['oval', 'emblem'] },
  { style: 'luxury', sector: 'cream', heroes: ['oval', 'botanical'] },

  // Serum
  { style: 'eco', sector: 'serum', heroes: ['botanical', 'monstera', 'palm'] },
  { style: 'playful', sector: 'serum', heroes: ['emblem', 'oval'] },
  { style: 'modern', sector: 'serum', heroes: ['oval', 'emblem'] },
  { style: 'luxury', sector: 'serum', heroes: ['botanical', 'oval'] },
  { style: 'classic', sector: 'serum', heroes: ['botanical', 'oval'] },

  // Food
  { style: 'luxury', sector: 'food', heroes: ['harvest', 'botanical'] },
  { style: 'classic', sector: 'food', heroes: ['harvest', 'botanical'] },
  { style: 'modern', sector: 'food', heroes: ['harvest', 'botanical'] },
  { style: 'eco', sector: 'food', heroes: ['harvest', 'botanical'] },
  { style: 'playful', sector: 'food', heroes: ['harvest', 'botanical'] },
  { style: 'minimal', sector: 'food', heroes: ['harvest', 'botanical'] },

  // Electronics
  { style: 'luxury', sector: 'electronics', heroes: ['tech', 'none'] },
  { style: 'classic', sector: 'electronics', heroes: ['tech', 'none'] },
  { style: 'modern', sector: 'electronics', heroes: ['tech', 'none'] },
  { style: 'eco', sector: 'electronics', heroes: ['tech', 'none'] },
  { style: 'playful', sector: 'electronics', heroes: ['tech', 'none'] },
  { style: 'minimal', sector: 'electronics', heroes: ['tech', 'none'] },

  // Generic fallbacks by style
  { style: 'playful', sector: '*', heroes: ['emblem', 'oval'] },
  { style: 'eco', sector: '*', heroes: ['botanical', 'monstera', 'palm'] },
  { style: 'classic', sector: '*', heroes: ['crest', 'oval'] },
  { style: 'luxury', sector: '*', heroes: ['crest', 'oval'] },
  { style: 'modern', sector: '*', heroes: ['oval', 'none'] },
  { style: 'minimal', sector: '*', heroes: ['none'] },
]

/** Look up style×sector hero preferences. First match wins. */
export function styleHeroes(style: StyleType, sector: SectorId): HeroFamily[] {
  for (const entry of STYLE_HEROES) {
    if (entry.style !== style) continue
    if (entry.sector === sector || entry.sector === '*') return entry.heroes
  }
  return ['none']
}
