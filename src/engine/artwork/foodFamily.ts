/**
 * Food product family — nutrition matrices + matchers.
 * Sample values are design placeholders for motor QA, not lab claims.
 */
import type { CopyLocale } from '../../types'

export type FoodFamily = 'oil' | 'honey' | 'jam' | 'tea' | 'chocolate' | 'biscuit' | 'default-food'

export type NutritionRow = {
  label: string
  value: string
  indent?: boolean
}

export function foodFamilyFromBlob(sub: string): FoodFamily {
  const s = sub.toLocaleLowerCase('tr')
  if (/yağ|zeytin|olive/.test(s) && !/reçel|jam/.test(s)) return 'oil'
  if (/\bbal\b|honey|çiçek bal/.test(s)) return 'honey'
  if (/reçel|jam|preserve|vişne reçel/.test(s)) return 'jam'
  if (/çay|tea|adaçayı/.test(s)) return 'tea'
  if (/çikolata|cacao|chocolate|kakao/.test(s)) return 'chocolate'
  if (/kurabiye|biscuit|cookie/.test(s)) return 'biscuit'
  return 'default-food'
}

export function foodNutritionBasis(family: FoodFamily, volume: string, locale: CopyLocale): string {
  const en = locale === 'en'
  if (family === 'oil' && /\bml\b/i.test(volume)) return en ? '100 ml' : '100 ml'
  if (family === 'tea') return en ? '100 g dry leaf' : '100 g kuru yaprak'
  return en ? '100 g' : '100 g'
}

/** Row set for the painted table. Compact keeps Enerji/Yağ/Karb/Protein; h≥60 adds Şeker+Tuz. */
export function foodNutritionRows(
  family: FoodFamily,
  locale: CopyLocale,
  opts: { compact: boolean; sugarSalt: boolean },
): NutritionRow[] {
  const en = locale === 'en'
  const L = {
    energy: en ? 'Energy' : 'Enerji',
    fat: en ? 'Fat' : 'Yağ',
    sat: en ? '  - Saturates' : '  - Doymuş',
    carb: en ? 'Carbohydrate' : 'Karbonhidrat',
    sugar: en ? '  - Sugars' : '  - Şeker',
    protein: en ? 'Protein' : 'Protein',
    salt: en ? 'Salt' : 'Tuz',
  }
  const profile: Record<FoodFamily, { energy: string; fat: string; sat?: string; carb: string; sugar: string; protein: string; salt: string }> = {
    oil: {
      energy: '3700 kJ / 884 kcal',
      fat: '100 g',
      sat: '14 g',
      carb: '0 g',
      sugar: '0 g',
      protein: '0 g',
      salt: '0 g',
    },
    honey: {
      energy: '1400 kJ / 334 kcal',
      fat: '0 g',
      carb: '82 g',
      sugar: '82 g',
      protein: en ? '0.3 g' : '0,3 g',
      salt: '0 g',
    },
    jam: {
      energy: '1100 kJ / 260 kcal',
      fat: '0 g',
      carb: '64 g',
      sugar: '58 g',
      protein: en ? '0.4 g' : '0,4 g',
      salt: '0 g',
    },
    tea: {
      energy: '1200 kJ / 287 kcal',
      fat: '3 g',
      carb: '40 g',
      sugar: '1 g',
      protein: '11 g',
      salt: '0 g',
    },
    chocolate: {
      energy: '2300 kJ / 550 kcal',
      fat: '35 g',
      carb: '50 g',
      sugar: '45 g',
      protein: '6 g',
      salt: en ? '0.1 g' : '0,1 g',
    },
    biscuit: {
      energy: '2000 kJ / 480 kcal',
      fat: '22 g',
      carb: '60 g',
      sugar: '25 g',
      protein: '6 g',
      salt: en ? '0.5 g' : '0,5 g',
    },
    'default-food': {
      energy: '1500 kJ / 360 kcal',
      fat: '12 g',
      carb: '50 g',
      sugar: '18 g',
      protein: '8 g',
      salt: en ? '0.4 g' : '0,4 g',
    },
  }
  const p = profile[family]
  const rows: NutritionRow[] = [
    { label: L.energy, value: p.energy },
    { label: L.fat, value: p.fat },
  ]
  if (!opts.compact && p.sat) rows.push({ label: L.sat, value: p.sat, indent: true })
  rows.push({ label: L.carb, value: p.carb })
  if (!opts.compact || opts.sugarSalt) rows.push({ label: L.sugar, value: p.sugar, indent: true })
  rows.push({ label: L.protein, value: p.protein })
  if (!opts.compact || opts.sugarSalt) rows.push({ label: L.salt, value: p.salt })
  return rows
}

export function foodNutritionBlockHeight(opts: { compact: boolean; sugarSalt: boolean; family?: FoodFamily }): number {
  const sat = !opts.compact && opts.family === 'oil' ? 1 : 0
  const extra = !opts.compact || opts.sugarSalt ? 2 : 0
  const n = 4 + extra + sat
  const lineH = opts.compact ? 2.25 : 2.65
  return 5.4 + n * lineH + 2.2
}

export function foodTableFooter(family: FoodFamily, locale: CopyLocale): string {
  if (family !== 'default-food') return ''
  return locale === 'en' ? 'Sample values — confirm with the brief' : 'Örnek değer — brief ile doğrulayın'
}
