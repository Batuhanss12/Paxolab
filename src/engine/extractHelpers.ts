/**
 * Extract helpers — labeled-value parsers and name/sector/palette predicates.
 * Extracted from extract.ts to isolate utility helpers from extraction logic.
 */
import { GENERIC_PRODUCT_RE, PALETTE_TOKEN, SECTOR_NOUN_RE } from './extractRules'

function labeled(text: string, keys: string[]): string {
  const re = new RegExp(`(?:${keys.join('|')})\\s*(?:adı|adın)?\\s*[:\\-–]\\s*["'“”]?([^,.;\\n"“”]+)`, 'i')
  return text.match(re)?.[1]?.trim() ?? ''
}

/** Firma / adres: A.Ş. ve cadde noktalarını kesme; sonraki etiket veya satırda dur. */
function labeledBlock(text: string, keys: string[]): string {
  const stop = 'üretici|ithalatçı|manufacturer|firma|adres|address|fabrika|barkod|marka|ürün|brand|product'
  const re = new RegExp(
    `(?:${keys.join('|')})\\s*(?:adı|adın)?\\s*[:\\-–]\\s*["'“”]?(.+?)(?=\\s*,\\s*(?:${stop})\\s*[:\\-–]|\\n|$)`,
    'i',
  )
  return text.match(re)?.[1]?.trim().replace(/[,;]+$/, '') ?? ''
}

/** L×W×H tokens such as 70x35x140 must never become a lockup name. */
export function isMeasureToken(value: string): boolean {
  return /^\d+([.,]\d+)?(?:\s*[x×]\s*\d+([.,]\d+)?){1,2}(?:\s*mm)?$/i.test(value.trim())
}

function looksLikeName(value: string): boolean {
  return (
    !!value &&
    value.length < 48 &&
    !/[?]/.test(value) &&
    /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(value) &&
    !isMeasureToken(value)
  )
}

export function isPaletteName(value: string): boolean {
  return PALETTE_TOKEN.test(value.trim())
}

export function sameName(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase('tr') === b.trim().toLocaleLowerCase('tr') && a.trim().length > 0
}

export function looksLikeSector(value: string): boolean {
  return SECTOR_NOUN_RE.test(value.trim())
}

/** Sector / surface nouns (and common typos) must never become a brand lockup. */
export function isSectorOrSurfaceName(value: string): boolean {
  const t = value.trim()
  if (!t || t.length > 32) return false
  if (looksLikeSector(t) || isGenericProductName(t)) return true
  return /^(elektro?ni[kc]|elektornik|teknoloji|gıda|gida|kozmetik|kahve|coffee|kutu|etiket|label|box)$/i.test(t)
}

/** Sector nouns are not SKU names — lockup must not read PARFÜM under EAU DE PARFUM. */
export function isGenericProductName(value: string): boolean {
  return GENERIC_PRODUCT_RE.test(value.trim())
}

export { labeled, labeledBlock, looksLikeName }
