/**
 * Mark recipes — sector/surface-specific mark recipe builders + warning text arrays.
 * Extracted from MarkMatrix.ts to isolate recipe data from resolution logic.
 */
import type { MarkId, MarkRecipe } from './types'

const SAMPLE = true as const

export function recipe(
  key: string,
  requiredMarks: MarkId[],
  optionalMarks: MarkId[],
  requiredTextWarnings: string[],
  placement: MarkRecipe['placement'],
  extra: Partial<Pick<MarkRecipe, 'paoMonths' | 'perfumeAssets'>> = {},
): MarkRecipe {
  return {
    key,
    requiredMarks,
    optionalMarks,
    requiredTextWarnings,
    placement,
    paoMonths: extra.paoMonths ?? '12M',
    sampleLegal: SAMPLE,
    perfumeAssets: extra.perfumeAssets ?? {},
  }
}

export const PERFUME_ASSETS: MarkRecipe['perfumeAssets'] = {
  flammable: 'ic1',
  keepaway: 'ic2',
  pao: 'ic3',
  leaflet: 'ic4',
  pap21: 'ic4',
}

export const PERFUME_WARN_BOX = [
  'Harici kullanıma mahsustur.',
  'Alevden ve ısı kaynaklarından uzak tutun.',
  'Gözle temasından kaçının.',
  'Tahrişte kullanımı bırakın.',
  'Çocukların ulaşamayacağı yerde saklayın.',
]

export const CREAM_WARN = [
  'Temiz cilde uygulayın.',
  'Gözle temasından kaçının.',
  'Tahrişte kullanımı bırakın.',
  'Çocuklardan uzak tutun.',
]

export const FOOD_WARN = [
  'Serin ve kuru yerde saklayın.',
  'Alerjen bilgisi etikette belirtilmiştir.',
  'Açıldıktan sonra önerilen sürede tüketin.',
]

export const ELEC_WARN = [
  'Elektronik atık olarak ayırın (WEEE).',
  'Lityum pili evsel atığa atmayın.',
  'Nemden koruyun. Yetkili servis dışında açmayın.',
]

export const CLEAN_WARN = [
  'Çocukların ulaşamayacağı yerde saklayın.',
  'Gözle temasından kaçının.',
  'Kullandıktan sonra ellerinizi yıkayın.',
]

export function perfumeBox(): MarkRecipe {
  return recipe(
    'perfume:box',
    ['flammable', 'keepaway', 'pao', 'leaflet'],
    [],
    PERFUME_WARN_BOX,
    { panel: 'back', minMm: 6.8, gapMm: 2.2, maxIcons: 4 },
    { paoMonths: '36M', perfumeAssets: PERFUME_ASSETS },
  )
}

export function perfumeLabel(): MarkRecipe {
  return recipe(
    'perfume:label',
    [],
    [],
    PERFUME_WARN_BOX,
    { panel: 'label', minMm: 5.4, gapMm: 1.8, maxIcons: 0 },
    { paoMonths: '36M', perfumeAssets: {} },
  )
}

export function creamBox(): MarkRecipe {
  return recipe(
    'cream:box',
    [],
    [],
    CREAM_WARN,
    { panel: 'back', minMm: 7.0, gapMm: 2.3, maxIcons: 0 },
    { paoMonths: '12M' },
  )
}

export function creamLabel(): MarkRecipe {
  return recipe(
    'cream:label',
    [],
    [],
    CREAM_WARN,
    { panel: 'label', minMm: 5.4, gapMm: 1.8, maxIcons: 0 },
    { paoMonths: '12M' },
  )
}

export function foodBox(): MarkRecipe {
  return recipe(
    'food:box',
    ['recycle', 'glassfork'],
    ['keepdry'],
    FOOD_WARN,
    { panel: 'back', minMm: 6.8, gapMm: 2.2, maxIcons: 3 },
  )
}

export function foodLabel(): MarkRecipe {
  return recipe(
    'food:label',
    [],
    [],
    FOOD_WARN,
    { panel: 'label', minMm: 5.2, gapMm: 1.7, maxIcons: 0 },
  )
}

export function electronicsBox(): MarkRecipe {
  return recipe(
    'electronics:box',
    ['weee', 'recycle'],
    ['thiswayup', 'keepdry'],
    ELEC_WARN,
    { panel: 'back', minMm: 7.0, gapMm: 2.3, maxIcons: 4 },
  )
}

export function electronicsLabel(): MarkRecipe {
  return recipe(
    'electronics:label',
    [],
    [],
    ELEC_WARN,
    { panel: 'label', minMm: 5.2, gapMm: 1.7, maxIcons: 0 },
  )
}

export function cleaningBox(): MarkRecipe {
  return recipe(
    'cleaning:box',
    ['keepaway', 'recycle'],
    ['emark', 'leaflet'],
    CLEAN_WARN,
    { panel: 'back', minMm: 6.8, gapMm: 2.2, maxIcons: 4 },
  )
}

export function genericBox(): MarkRecipe {
  return recipe(
    'generic:box',
    ['recycle', 'emark'],
    ['leaflet'],
    ['Üretici talimatlarına uyun.', 'Çocuklardan uzak tutun.'],
    { panel: 'back', minMm: 6.8, gapMm: 2.2, maxIcons: 4 },
  )
}

export const PERFUME_WARN_BOX_EN = [
  'For external use only.',
  'Keep away from flame and heat.',
  'Avoid contact with eyes.',
  'Discontinue if irritation occurs.',
  'Keep out of reach of children.',
]

export const CREAM_WARN_EN = [
  'Apply to clean skin.',
  'Avoid contact with eyes.',
  'Discontinue if irritation occurs.',
  'Keep away from children.',
]

export const FOOD_WARN_EN = [
  'Store in a cool, dry place.',
  'Allergen information is stated on the label.',
  'Consume within the recommended time after opening.',
]

export const ELEC_WARN_EN = [
  'Separate as electronic waste (WEEE).',
  'Do not dispose of lithium batteries in household waste.',
  'Keep dry. Do not open except at an authorized service.',
]

export const CLEAN_WARN_EN = [
  'Keep out of reach of children.',
  'Avoid contact with eyes.',
  'Wash hands after use.',
]

export function warningsForLocale(warnings: string[], locale: 'tr' | 'en'): string[] {
  if (locale !== 'en') return warnings
  if (warnings === PERFUME_WARN_BOX) return PERFUME_WARN_BOX_EN
  if (warnings === CREAM_WARN) return CREAM_WARN_EN
  if (warnings === FOOD_WARN) return FOOD_WARN_EN
  if (warnings === ELEC_WARN) return ELEC_WARN_EN
  if (warnings === CLEAN_WARN) return CLEAN_WARN_EN
  return [
    'Follow the manufacturer instructions.',
    'Keep away from children.',
  ]
}

export const SAMPLE_LEGAL = SAMPLE
