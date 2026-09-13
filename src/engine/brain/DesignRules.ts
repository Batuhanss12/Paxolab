import type { StyleType } from '../../types'
import type { DecorFamily, Density, SectorId } from '../designSystem/types'
import type { MetallicRole, NegativeSpace, Positioning, TypeAuthority, VisualIntent } from './DesignPlan'

export type StyleRule = {
  positioning: Positioning
  visualIntent: VisualIntent
  density: Density
  negativeSpace: NegativeSpace
  authority: TypeAuthority
  trackingIntent: 'wide' | 'medium' | 'tight'
  metallic: MetallicRole
  displayFace: 'serif' | 'sans'
  productFace: 'serif' | 'sans'
  lockup: 'center' | 'left'
  allowedDecor: DecorFamily[]
}

const STYLE_RULES: Record<StyleType, StyleRule> = {
  luxury: {
    positioning: 'luxury',
    visualIntent: 'elegant',
    density: 'dense',
    negativeSpace: 'med',
    authority: 'display',
    trackingIntent: 'wide',
    metallic: 'foil',
    displayFace: 'serif',
    productFace: 'sans',
    lockup: 'center',
    allowedDecor: ['crest', 'olive', 'grid', 'oval', 'drop'],
  },
  modern: {
    positioning: 'premium',
    visualIntent: 'high-contrast',
    density: 'balanced',
    negativeSpace: 'med',
    authority: 'balanced',
    trackingIntent: 'tight',
    metallic: 'off',
    displayFace: 'sans',
    productFace: 'sans',
    lockup: 'left',
    allowedDecor: ['stripe', 'grid'],
  },
  minimal: {
    positioning: 'premium',
    visualIntent: 'air',
    density: 'sparse',
    negativeSpace: 'high',
    authority: 'quiet',
    trackingIntent: 'wide',
    metallic: 'off',
    displayFace: 'sans',
    productFace: 'sans',
    lockup: 'center',
    allowedDecor: ['none', 'drop', 'stripe'],
  },
  eco: {
    positioning: 'natural',
    visualIntent: 'warm',
    density: 'balanced',
    negativeSpace: 'med',
    authority: 'balanced',
    trackingIntent: 'medium',
    metallic: 'off',
    displayFace: 'serif',
    productFace: 'serif',
    lockup: 'center',
    allowedDecor: ['leaf', 'harvest', 'olive'],
  },
  playful: {
    positioning: 'playful',
    visualIntent: 'graphic',
    density: 'dense',
    negativeSpace: 'low',
    authority: 'balanced',
    trackingIntent: 'tight',
    metallic: 'off',
    displayFace: 'sans',
    productFace: 'sans',
    lockup: 'center',
    allowedDecor: ['badge'],
  },
  classic: {
    positioning: 'premium',
    visualIntent: 'elegant',
    density: 'balanced',
    negativeSpace: 'med',
    authority: 'display',
    trackingIntent: 'wide',
    metallic: 'restrained',
    displayFace: 'serif',
    productFace: 'sans',
    lockup: 'center',
    allowedDecor: ['cartouche'],
  },
}

export function styleRule(style: StyleType): StyleRule {
  return STYLE_RULES[style] ?? STYLE_RULES.classic
}

export function sectorRisks(sector: SectorId): string[] {
  const shared = [
    'gold_rule_cannot_cross_glyphs',
    'product_must_remain_visible',
    'no_invented_gtin',
  ]
  if (sector === 'perfume') {
    return [...shared, 'luxury_not_decorative_overload', 'sector_blind_test_perfume', 'perfume_marks_not_on_front']
  }
  if (sector === 'food') return [...shared, 'sector_blind_test_food', 'no_perfume_icons']
  if (sector === 'electronics') return [...shared, 'sector_blind_test_electronics', 'no_pao_on_electronics']
  if (sector === 'cream' || sector === 'serum') return [...shared, 'cream_is_not_edp']
  return shared
}

export function allowedDecorFor(style: StyleType, sector: SectorId): DecorFamily[] {
  const base = styleRule(style).allowedDecor
  if (sector === 'food') return base.includes('olive') || base.includes('harvest') ? ['olive', 'harvest'] : base
  if (sector === 'electronics') return base.includes('grid') ? ['grid'] : base
  if (sector === 'cream') return base.includes('oval') ? ['oval'] : base
  if (sector === 'serum') return base.includes('drop') ? ['drop'] : base
  return base
}
