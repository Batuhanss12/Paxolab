import type { CopyLocale, StyleType } from '../../types'
import type { VisualConceptBlock } from '../brain/DesignPlan'
import { lockupForConcept } from './conceptKitAlignment'
import type { DecorFamily, LockupId, SectorId, TypeScale } from './types'

export function categoryFor(sector: SectorId, blob: string, locale: CopyLocale = 'tr'): string {
  const en = locale === 'en'
  if (sector === 'perfume') {
    if (/kolonya/.test(blob)) return en ? 'EAU DE COLOGNE' : 'KOLONYA'
    return 'EAU DE PARFUM'
  }
  if (sector === 'serum') return en ? 'CONCENTRATE SERUM' : 'SERUM'
  if (sector === 'cream') return en ? 'FACE CREAM' : 'YÜZ KREMİ'
  if (sector === 'food') {
    if (/zeytin|yağ/.test(blob)) return en ? 'EXTRA VIRGIN' : 'SIZMA ZEYTİNYAĞI'
    if (/çikolata/.test(blob)) return en ? 'CHOCOLATE' : 'ÇİKOLATA'
    if (/kurabiye/.test(blob)) return en ? 'BISCUIT' : 'KURABİYE'
    if (/reçel|jam/.test(blob)) return en ? 'PRESERVE' : 'REÇEL'
    if (/çay|tea/.test(blob)) return en ? 'HERBAL TEA' : 'ÇAY'
    return en ? 'ARTISAN FOOD' : 'GURME GIDA'
  }
  if (sector === 'beverage') {
    if (/kombucha/.test(blob)) return en ? 'FERMENTED TEA' : 'FERMENTE ÇAY'
    return en ? 'CRAFT BEVERAGE' : 'İÇECEK'
  }
  if (sector === 'health') return en ? 'DAILY SUPPLEMENT' : 'GÜNLÜK TAKVİYE'
  if (sector === 'baby') return en ? 'GENTLE BABY CARE' : 'HASSAS BEBEK BAKIMI'
  if (sector === 'electronics') {
    if (/kulaklık|earbuds/.test(blob)) return en ? 'WIRELESS AUDIO' : 'KABLOSUZ SES'
    if (/kablo|şarj/.test(blob)) return en ? 'POWER ACCESSORY' : 'ŞARJ AKSESUARI'
    return en ? 'PRECISION SERIES' : 'HASSAS SERİ'
  }
  if (sector === 'cleaning') return en ? 'SURFACE CARE' : 'YÜZEY BAKIMI'
  return ''
}

function pickLockupByStyle(style: StyleType, sector: SectorId): LockupId {
  if (sector === 'cleaning') return style === 'classic' ? 'serif-cartouche' : 'left-index'
  if (style === 'luxury') {
    if (sector === 'food' || sector === 'beverage') return 'harvest-seal'
    if (sector === 'electronics') return 'metal-plaque'
    if (sector === 'cream' || sector === 'serum' || sector === 'health' || sector === 'baby') return 'soft-oval'
    return 'centered-crest'
  }
  if (style === 'modern') return sector === 'electronics' ? 'tech-grid' : 'left-index'
  if (style === 'minimal') return 'air-rule'
  if (style === 'eco') return 'stamp-center'
  if (style === 'playful') return 'badge-capsule'
  if (sector === 'food' || sector === 'beverage') return 'harvest-seal'
  if (sector === 'electronics') return 'metal-plaque'
  if (sector === 'cream' || sector === 'serum' || sector === 'health' || sector === 'baby') return 'soft-oval'
  return 'serif-cartouche'
}

export function pickLockup(
  style: StyleType,
  sector: SectorId,
  grammar: 'box' | 'label',
  wrap: boolean,
  concept?: VisualConceptBlock,
): LockupId {
  if (grammar === 'label') return wrap ? 'label-wrap' : 'label-stack'
  return lockupForConcept(concept, pickLockupByStyle(style, sector))
}

export function pickDecor(style: StyleType, sector: SectorId, lockup: LockupId): DecorFamily {
  if (lockup === 'label-wrap') {
    if (sector === 'perfume') return style === 'classic' ? 'cartouche' : 'crest'
    if (sector === 'food' || sector === 'beverage') return 'harvest'
    if (sector === 'cream' || sector === 'health' || sector === 'baby') return 'oval'
    if (sector === 'serum') return 'drop'
    return 'none'
  }
  if (lockup === 'label-stack') {
    if (sector === 'food' || sector === 'beverage') return 'harvest'
    if (style === 'eco') return 'leaf'
    if (style === 'playful') return 'badge'
    if (sector === 'perfume') return style === 'classic' ? 'cartouche' : 'crest'
    if (sector === 'cream' || sector === 'health' || sector === 'baby') return 'oval'
    if (sector === 'serum') return 'drop'
    return 'none'
  }
  if (lockup === 'centered-crest') return 'crest'
  if (lockup === 'harvest-seal') return 'olive'
  if (lockup === 'metal-plaque' || lockup === 'tech-grid') return 'grid'
  if (lockup === 'soft-oval') return sector === 'serum' ? 'drop' : 'oval'
  if (lockup === 'left-index') return 'stripe'
  if (lockup === 'air-rule') return 'none'
  if (lockup === 'stamp-center') return sector === 'food' || sector === 'beverage' ? 'harvest' : 'leaf'
  if (lockup === 'badge-capsule') return 'badge'
  if (lockup === 'serif-cartouche') return 'cartouche'
  if (style === 'luxury' && sector === 'perfume') return 'crest'
  if (sector === 'food' || sector === 'beverage') return 'olive'
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
  extras: {
    volumeCase?: TypeScale['volumeCase']
    opticalLift?: number
    opticalCenter?: number
    ruleGapMm?: number
    lockupPadX?: number
    lockupPadY?: number
    smallCapsRatio?: number
    taglineMm?: number
  } = {},
): TypeScale {
  return {
    displayMm: display,
    productMm: product,
    metaMm: meta,
    legalMm: legal,
    brandMm: display,
    categoryMm: meta,
    taglineMm: extras.taglineMm ?? Math.max(meta + 0.45, minMm + 0.15),
    volumeMm: volume,
    minMm,
    trackingDisplay: tracking.d,
    trackingProduct: tracking.p,
    trackingMeta: tracking.m,
    trackingLegal: tracking.l,
    volumeCase: extras.volumeCase ?? 'upper',
    opticalCenter: extras.opticalCenter ?? 0.4,
    opticalLift: extras.opticalLift ?? 0.018,
    ruleGapMm: extras.ruleGapMm ?? 1.25,
    lockupPadX: extras.lockupPadX ?? 4.8,
    lockupPadY: extras.lockupPadY ?? 2.2,
    smallCapsRatio: extras.smallCapsRatio ?? 0.72,
  }
}

function sectorVoice(type: TypeScale, style: StyleType, sector?: SectorId): TypeScale {
  if (!sector || sector === 'perfume') return type
  if (sector === 'food') {
    const luxury = style === 'luxury' || style === 'classic'
    return {
      ...type,
      displayMm: luxury ? type.displayMm * 0.92 : type.displayMm,
      trackingDisplay: luxury ? type.trackingDisplay * 0.82 : type.trackingDisplay * 0.9,
      productMm: type.productMm + 0.2,
      opticalCenter: style === 'luxury' ? 0.42 : type.opticalCenter,
    }
  }
  if (sector === 'electronics') {
    return {
      ...type,
      displayMm: style === 'luxury' ? type.displayMm * 0.9 : type.displayMm,
      trackingDisplay: Math.min(type.trackingDisplay, 0.28),
      opticalCenter: 0.39,
    }
  }
  if (sector === 'cream' || sector === 'serum' || sector === 'health' || sector === 'baby') {
    return {
      ...type,
      displayMm: style === 'luxury' ? type.displayMm * 0.94 : type.displayMm,
      opticalCenter: style === 'luxury' ? 0.43 : type.opticalCenter,
    }
  }
  return type
}

export function typeScaleFor(style: StyleType, grammar: 'box' | 'label', wrap = false, sector?: SectorId): TypeScale {
  const label = grammar === 'label'
  const minMm = label ? 2.8 : 1.9
  let type: TypeScale
  if (style === 'luxury') {
    type = ramp(
      label ? (wrap ? 6.0 : 6.6) : 9.1,
      label ? 3.15 : 3.2,
      label ? 2.8 : 2.35,
      label ? 2.8 : 2.02,
      label ? 2.9 : 2.85,
      minMm,
      { d: 0.62, p: 0.95, m: 1.45, l: 0.28 },
      {
        volumeCase: 'smallcaps',
        opticalLift: 0.02,
        opticalCenter: wrap ? 0.46 : label ? 0.34 : 0.405,
        ruleGapMm: 1.35,
        lockupPadX: wrap ? 7.2 : label ? 4.2 : 5.0,
        lockupPadY: wrap ? 1.8 : 2.4,
        smallCapsRatio: 0.7,
        taglineMm: label ? 2.85 : 3.05,
      },
    )
  } else if (style === 'modern') {
    type = ramp(
      label ? 6.2 : 7.2,
      label ? 3.0 : 3.05,
      label ? 2.8 : 2.25,
      label ? 2.8 : 2.0,
      2.45,
      minMm,
      { d: 0.22, p: 1.65, m: 1.4, l: 0.18 },
      {
        opticalLift: 0.01,
        opticalCenter: wrap ? 0.45 : label ? 0.33 : 0.39,
        ruleGapMm: 1.05,
        lockupPadX: wrap ? 7.0 : label ? 5.2 : 6.2,
        lockupPadY: 2.0,
        taglineMm: label ? 2.8 : 2.95,
      },
    )
  } else if (style === 'minimal') {
    // P2-C: bump brand mm +10% for large brand in air (FAILURE_CATALOG bar).
    type = ramp(
      label ? 6.4 : 6.6,
      2.9,
      label ? 2.8 : 2.1,
      label ? 2.8 : 2.0,
      2.5,
      minMm,
      { d: 0.85, p: 1.15, m: 1.35, l: 0.12 },
      {
        opticalLift: 0,
        opticalCenter: wrap ? 0.46 : label ? 0.38 : 0.46,
        ruleGapMm: 1.7,
        lockupPadX: wrap ? 7.0 : 5.4,
        lockupPadY: 2.8,
        taglineMm: label ? 2.8 : 2.9,
      },
    )
  } else if (style === 'eco') {
    type = ramp(
      label ? 6.4 : 8.0,
      3.1,
      label ? 2.8 : 2.3,
      label ? 2.8 : 2.02,
      2.65,
      minMm,
      { d: 0.55, p: 0.9, m: 1.05, l: 0.18 },
      {
        opticalLift: 0.012,
        opticalCenter: wrap ? 0.45 : label ? 0.35 : 0.42,
        ruleGapMm: 1.2,
        lockupPadX: wrap ? 7.0 : 5.0,
        lockupPadY: 2.3,
        taglineMm: label ? 2.85 : 3.0,
      },
    )
  } else if (style === 'playful') {
    type = ramp(
      label ? 6.2 : 7.6,
      3.2,
      label ? 2.8 : 2.35,
      label ? 2.8 : 2.02,
      2.75,
      minMm,
      { d: 0.18, p: 0.55, m: 0.7, l: 0.12 },
      {
        opticalLift: 0.008,
        opticalCenter: wrap ? 0.45 : label ? 0.34 : 0.4,
        ruleGapMm: 1.1,
        lockupPadX: wrap ? 6.8 : 4.6,
        lockupPadY: 2.0,
        taglineMm: label ? 2.85 : 3.05,
      },
    )
  } else {
    type = ramp(
      label ? 6.4 : 8.2,
      3.15,
      label ? 2.8 : 2.3,
      label ? 2.8 : 2.02,
      2.55,
      minMm,
      { d: 0.68, p: 1.0, m: 1.2, l: 0.22 },
      {
        volumeCase: 'smallcaps',
        opticalLift: 0.014,
        opticalCenter: wrap ? 0.45 : label ? 0.35 : 0.41,
        ruleGapMm: 1.2,
        lockupPadX: wrap ? 7.0 : 5.0,
        lockupPadY: 2.2,
        smallCapsRatio: 0.72,
        taglineMm: label ? 2.85 : 3.0,
      },
    )
  }
  type = sectorVoice(type, style, sector)
  if (style === 'luxury' && !label) {
    type = { ...type, opticalCenter: 0.38 }
  }
  return type
}

export const STYLE_KITS: Record<StyleType, LockupId[]> = {
  luxury: ['centered-crest', 'harvest-seal', 'soft-oval', 'metal-plaque', 'label-wrap', 'label-stack'],
  modern: ['left-index', 'tech-grid', 'label-wrap', 'label-stack'],
  minimal: ['air-rule', 'label-wrap', 'label-stack'],
  eco: ['stamp-center', 'label-wrap', 'label-stack'],
  playful: ['badge-capsule', 'label-wrap', 'label-stack'],
  classic: ['centered-crest', 'serif-cartouche', 'label-wrap', 'label-stack'],
}
