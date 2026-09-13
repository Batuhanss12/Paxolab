import type { CopyLocale, DesignBrief, DesignSpec } from '../types'
import type { DesignSystem } from './designSystem/types'

export type { CopyLocale }

const TR_CHARS = /[çğıöşüÇĞİÖŞÜ]/
const PERFUME_OK = /EAU DE PARFUM|EAU DE COLOGNE/
const EN_CATEGORY = /FACE CREAM|CONCENTRATE SERUM|ARTISAN FOOD|EXTRA VIRGIN|NET WEIGHT|WIRELESS AUDIO|POWER ACCESSORY|PRECISION SERIES|SURFACE CARE|FERMENTED TEA|CRAFT BEVERAGE|DAILY SUPPLEMENT|GENTLE BABY CARE/
const INCI_OK = /NIACINAMIDE|HYALURONIC|CERAMIDE|AQUA|PARFUM|GLYCERIN|TOCOPHEROL|LINALOOL/

export function resolveCopyLocale(brief?: Pick<DesignBrief, 'copyLocale'> | null): CopyLocale {
  return brief?.copyLocale === 'en' ? 'en' : 'tr'
}

export function parseCopyLocale(text: string): CopyLocale | undefined {
  const t = text.trim().toLocaleLowerCase('tr')
  if (!t) return undefined
  if (/^(en|eng|english|ingilizce|english please)$/i.test(t) || /\b(ingilizce|in english|english copy)\b/i.test(t)) return 'en'
  if (/^(tr|türkçe|turkce|turkish)$/i.test(t) || /\b(türkçe|turkce|turkish)\b/i.test(t)) return 'tr'
  return undefined
}

/** Infer from free text. Turkish letters → tr. Explicit English request → en. Otherwise unset. */
export function inferCopyLocale(text: string): CopyLocale | undefined {
  const parsed = parseCopyLocale(text)
  if (parsed) return parsed
  if (TR_CHARS.test(text)) return 'tr'
  return undefined
}

export function hasTurkishCopy(text: string): boolean {
  return TR_CHARS.test(text)
}

/** Face display caps — Turkish i/İ stays correct on TR packs. */
export function faceUpper(text: string, locale: CopyLocale = 'tr'): string {
  return text.toLocaleUpperCase(locale === 'en' ? 'en-US' : 'tr')
}

export function faceHasProduct(face: string, product: string): boolean {
  const raw = product.trim()
  if (!raw) return false
  return face.includes(raw.toUpperCase()) || face.includes(raw.toLocaleUpperCase('tr'))
}

export function isAllowedLocaleException(text: string): boolean {
  return PERFUME_OK.test(text) || INCI_OK.test(text)
}

/** Face mix: EN category table + TR tagline, unless perfume EDP / INCI. */
export function detectCopyLocaleMix(
  spec: Pick<DesignSpec, 'copy' | 'brief' | 'overrides'>,
  system: DesignSystem,
  face = '',
): { mix: boolean; detail: string } {
  const locale = resolveCopyLocale(spec.brief)
  const tagline = spec.copy.tagline ?? ''
  const category = system.category ?? ''
  const product = spec.copy.product ?? ''
  const blob = `${category}\n${tagline}\n${product}\n${face}`

  if (locale === 'tr') {
    const enCat = EN_CATEGORY.test(category) && !PERFUME_OK.test(category)
    const trTag = hasTurkishCopy(tagline)
    if (enCat && trTag) return { mix: true, detail: `EN kategori (${category}) + TR slogan` }
    const namedEn = /\b(NIGHT CREAM|FACE CREAM|CONCENTRATE|WIRELESS|SURFACE)\b/i.test(product)
    const sampleTr = /^(gece kremi|gece|yüzey|konsantre|kurabiye)$/i.test(product.trim())
    const latinPhrase = /[A-Za-z]{3,}/.test(product) && /\s/.test(product) && !hasTurkishCopy(product) && !sampleTr
    if ((namedEn || latinPhrase) && trTag && !isAllowedLocaleException(product) && !sampleTr) {
      return { mix: true, detail: `EN ürün satırı + TR slogan — kullanıcı metni çevrilmedi` }
    }
  }

  if (locale === 'en' && hasTurkishCopy(tagline) && !isAllowedLocaleException(tagline)) {
    return { mix: true, detail: 'EN locale + TR slogan' }
  }

  if (locale === 'en' && hasTurkishCopy(category) && !PERFUME_OK.test(category)) {
    return { mix: true, detail: `EN locale + TR kategori (${category})` }
  }

  void blob
  return { mix: false, detail: locale === 'tr' ? 'TR birincil' : 'EN birincil' }
}
