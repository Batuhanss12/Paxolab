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
  if (sector === 'cleaning') return 'SURFACE CARE'
  return ''
}

export function pickLockup(style: StyleType, sector: SectorId, grammar: 'box' | 'label', wrap: boolean): LockupId {
  if (grammar === 'label') return wrap ? 'label-wrap' : 'label-stack'
  if (sector === 'cleaning') return style === 'classic' ? 'serif-cartouche' : 'left-index'
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

function ramp(
  display: number,
  product: number,
  meta: number,
  legal: number,
  volume: number,
  minMm: number,
  tracking: { d: number; p: number; m: number; l: number },
  volumeCase: TypeScale['volumeCase'] = 'upper',
  opticalLift = 0.018,
): TypeScale {
  return {
    displayMm: display,
    productMm: product,
    metaMm: meta,
    legalMm: legal,
    brandMm: display,
    categoryMm: meta,
    taglineMm: Math.max(meta + 0.55, 2.9),
    volumeMm: volume,
    minMm,
    trackingDisplay: tracking.d,
    trackingProduct: tracking.p,
    trackingMeta: tracking.m,
    trackingLegal: tracking.l,
    volumeCase,
    opticalLift,
  }
}

export function typeScaleFor(style: StyleType, grammar: 'box' | 'label'): TypeScale {
  const label = grammar === 'label'
  const minMm = label ? 2.8 : 1.9
  if (style === 'luxury') {
    return ramp(
      label ? 7.4 : 9.4,
      label ? 3.6 : 3.4,
      2.45,
      label ? 2.25 : 2.02,
      3.1,
      minMm,
      { d: 0.95, p: 1.15, m: 1.75, l: 0.35 },
      'smallcaps',
      0.022,
    )
  }
  if (style === 'modern') {
    return ramp(
      label ? 6.8 : 7.4,
      3.3,
      2.3,
      2.05,
      2.4,
      minMm,
      { d: 0.36, p: 2.2, m: 1.8, l: 0.2 },
      'upper',
      0.012,
    )
  }
  if (style === 'minimal') {
    return ramp(label ? 6.2 : 6.1, 2.95, 2.1, 2.0, 2.5, minMm, { d: 1.1, p: 1.4, m: 1.6, l: 0.15 }, 'upper', 0)
  }
  if (style === 'eco') {
    return ramp(label ? 6.8 : 8.2, 3.2, 2.35, 2.05, 2.7, minMm, { d: 0.7, p: 1.1, m: 1.2, l: 0.2 }, 'upper', 0.014)
  }
  if (style === 'playful') {
    return ramp(label ? 6.6 : 8.0, 3.3, 2.4, 2.05, 2.85, minMm, { d: 0.25, p: 0.8, m: 0.9, l: 0.15 }, 'upper', 0.01)
  }
  return ramp(label ? 6.8 : 8.4, 3.25, 2.35, 2.02, 2.6, minMm, { d: 0.85, p: 1.2, m: 1.4, l: 0.25 }, 'smallcaps', 0.016)
}

export const STYLE_KITS: Record<StyleType, LockupId[]> = {
  luxury: ['centered-crest', 'harvest-seal', 'metal-plaque'],
  modern: ['left-index', 'tech-grid'],
  minimal: ['air-rule'],
  eco: ['stamp-center'],
  playful: ['badge-capsule'],
  classic: ['serif-cartouche'],
}
