import type { CopyLocale, DesignBrief, DesignSpec } from '../types'
import type { DesignSystem } from './designSystem/types'

export type { CopyLocale }

const TR_CHARS = /[çğıöşüÇĞİÖŞÜ]/
const PERFUME_OK = /EAU DE PARFUM|EAU DE COLOGNE/
const EN_CATEGORY = /FACE CREAM|CONCENTRATE SERUM|ARTISAN FOOD|EXTRA VIRGIN|NET WEIGHT|WIRELESS AUDIO|POWER ACCESSORY|PRECISION SERIES|SURFACE CARE|FERMENTED TEA|CRAFT BEVERAGE|DAILY SUPPLEMENT|GENTLE BABY CARE/
const INCI_OK = /NIACINAMIDE|HYALURONIC|CERAMIDE|AQUA|PARFUM|GLYCERIN|TOCOPHEROL|LINALOOL/

/**
 * English words a product line actually uses, matched on word boundaries.
 *
 * The mixed-language check used to decide "this product name is English" from the *absence* of
 * ç/ğ/ı/ö/ş/ü, which is not a test for English — it is a test for diacritics. Plenty of ordinary
 * Turkish names carry none: "Gece Serisi", "Beyaz Sabun", "Altin Seri". Measured, a Turkish
 * perfume label named "Gece Serisi" was refused a print-ready export as a language mix, so the
 * last step of the funnel was closed to a whole class of Turkish names.
 *
 * Asking for a known English word instead is both stricter and kinder: "Night Serum" still trips
 * it, "Gece Serisi" does not. The word boundaries matter — `series` must not match `Serisi`.
 */
const EN_PRODUCT_WORD =
  /\b(night|day|daily|face|facial|body|hand|hair|skin|cream|serum|oil|water|milk|foam|balm|mask|scrub|soap|care|repair|renew|glow|shine|smooth|soft|silk|pure|fresh|natural|organic|deep|light|rich|gold|golden|silver|black|white|blue|green|rose|honey|ocean|forest|wild|power|force|precision|wireless|surface|concentrate|extract|essence|edition|limited|collection|series|premium|classic|original|advanced|intense|ultra)\b/i

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
    const sampleTr = /^(gece kremi|gece|yüzey|konsantre|kurabiye)$/i.test(product.trim())
    // A known English word, not merely the absence of Turkish letters — see `EN_PRODUCT_WORD`.
    const namedEn = EN_PRODUCT_WORD.test(product)
    if (namedEn && trTag && !isAllowedLocaleException(product) && !sampleTr) {
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
