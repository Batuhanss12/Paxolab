import type { StyleType } from '../../types'
import type { DecorFamily, LockupId, SectorId, TypeScale } from './types'

export function categoryFor(sector: SectorId, blob: string): string {
  if (sector === 'perfume') return /kolonya/.test(blob) ? 'EAU DE COLOGNE' : 'EAU DE PARFUM'
  if (sector === 'serum') return 'CONCENTRATE SERUM'
  if (sector === 'cream') return 'FACE CREAM'
  if (sector === 'food') {
    if (/zeytin|yağ/.test(blob)) return 'EXTRA VIRGIN'
    if (/atıştırmalık|çikolata|kurabiye/.test(blob)) return 'NET WEIGHT'
    return 'ARTISAN FOOD'
  }
  if (sector === 'electronics') {
    if (/kulaklık|earbuds/.test(blob)) return 'WIRELESS AUDIO'
    if (/kablo|şarj/.test(blob)) return 'POWER ACCESSORY'
    return 'PRECISION SERIES'
  }
  return ''
}

export function pickLockup(style: StyleType, sector: SectorId, grammar: 'box' | 'label', wrap: boolean): LockupId {
  if (grammar === 'label') return wrap ? 'label-wrap' : 'label-stack'
  if (style === 'luxury') {
    if (sector === 'food') return 'harvest-seal'
    if (sector === 'electronics') return 'metal-plaque'
    if (sector === 'cream' || sector === 'serum') return 'soft-oval'
    return 'centered-crest'
  }
  if (style === 'modern') return sector === 'electronics' ? 'tech-grid' : 'left-index'
  if (style === 'minimal') return 'air-rule'
  if (style === 'eco') return 'stamp-center'
  if (style === 'playful') return 'badge-capsule'
  return 'serif-cartouche'
}

export function pickDecor(style: StyleType, sector: SectorId, lockup: LockupId): DecorFamily {
  if (lockup === 'centered-crest') return 'crest'
  if (lockup === 'harvest-seal') return 'olive'
  if (lockup === 'metal-plaque' || lockup === 'tech-grid') return 'grid'
  if (lockup === 'soft-oval') return sector === 'serum' ? 'drop' : 'oval'
  if (lockup === 'left-index') return 'stripe'
  if (lockup === 'air-rule') return 'none'
  if (lockup === 'stamp-center') return sector === 'food' ? 'harvest' : 'leaf'
  if (lockup === 'badge-capsule') return 'badge'
  if (lockup === 'serif-cartouche') return 'cartouche'
  if (style === 'luxury' && sector === 'perfume') return 'crest'
  if (sector === 'food') return 'olive'
  if (sector === 'electronics') return 'grid'
  return 'none'
}

export function typeScaleFor(style: StyleType, grammar: 'box' | 'label'): TypeScale {
  const labelBoost = grammar === 'label'
  const minMm = labelBoost ? 2.8 : 1.9
  if (style === 'luxury') {
    return {
      brandMm: labelBoost ? 7.4 : 9.4,
      productMm: labelBoost ? 3.6 : 3.4,
      categoryMm: 2.45,
      taglineMm: 3.15,
      legalMm: labelBoost ? 2.25 : 2.02,
      volumeMm: 3.1,
      minMm,
    }
  }
  if (style === 'modern') {
    return {
      brandMm: labelBoost ? 6.8 : 7.4,
      productMm: 3.3,
      categoryMm: 2.3,
      taglineMm: 3.0,
      legalMm: 2.05,
      volumeMm: 2.4,
      minMm,
    }
  }
  if (style === 'minimal') {
    return {
      brandMm: labelBoost ? 6.2 : 6.1,
      productMm: 2.95,
      categoryMm: 2.1,
      taglineMm: 3.0,
      legalMm: 2.0,
      volumeMm: 2.5,
      minMm,
    }
  }
  if (style === 'eco') {
    return {
      brandMm: labelBoost ? 6.8 : 8.2,
      productMm: 3.2,
      categoryMm: 2.35,
      taglineMm: 3.1,
      legalMm: 2.05,
      volumeMm: 2.7,
      minMm,
    }
  }
  if (style === 'playful') {
    return {
      brandMm: labelBoost ? 6.6 : 8.0,
      productMm: 3.3,
      categoryMm: 2.4,
      taglineMm: 3.1,
      legalMm: 2.05,
      volumeMm: 2.85,
      minMm,
    }
  }
  return {
    brandMm: labelBoost ? 6.8 : 8.4,
    productMm: 3.25,
    categoryMm: 2.35,
    taglineMm: 3.15,
    legalMm: 2.02,
    volumeMm: 2.6,
    minMm,
  }
}

export const STYLE_KITS: Record<StyleType, LockupId[]> = {
  luxury: ['centered-crest', 'harvest-seal', 'metal-plaque'],
  modern: ['left-index', 'tech-grid'],
  minimal: ['air-rule'],
  eco: ['stamp-center'],
  playful: ['badge-capsule'],
  classic: ['serif-cartouche'],
}
