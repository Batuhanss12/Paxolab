/**
 * Hair-wrap retail chrome — step pill + bilingual product line.
 * No catalog SKU required; gated on brief blob.
 */
import type { CopyLocale, DesignBrief } from '../../types'

const HAIR_RE = /şampuan|sampuan|keratin|saç|shampoo|\bhair\b/

export function isHairRetail(brief: Pick<DesignBrief, 'subProduct' | 'productName' | 'sector'>): boolean {
  const blob = `${brief.subProduct} ${brief.productName} ${brief.sector}`.toLocaleLowerCase('tr')
  return HAIR_RE.test(blob)
}

export function hairStepLabel(locale: CopyLocale): string {
  return locale === 'en' ? '01 · APPLY' : '01 · UYGULA'
}

export function hairBilingualLine(product: string, _locale: CopyLocale): { display: string; sub: string } {
  const key = product.trim().toLocaleLowerCase('tr')
  if (/keratin/.test(key)) return { display: 'KERATIN REPAIR', sub: 'Onarıcı bakım' }
  if (/şampuan|sampuan|shampoo/.test(key)) return { display: 'DAILY CLEANSE', sub: 'Günlük temizlik' }
  if (product.trim()) return { display: product.toLocaleUpperCase('en-US'), sub: 'Onarıcı bakım' }
  return { display: 'KERATIN REPAIR', sub: 'Onarıcı bakım' }
}
