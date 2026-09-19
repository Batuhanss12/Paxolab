/**
 * The brand or product a customer named on purpose, in one call.
 *
 * `extractFields` reads these three ways in order of how explicit they are, and so must the guard
 * in `extract.ts` that decides what survives while a different question is pending. Keeping the
 * order in one place means the two cannot drift: if a shape counts as "the customer naming a field"
 * for extraction, it counts as a correction too.
 */
import { labeled } from './extractHelpers'
import { namedBefore, spokenField } from './spokenFields'
import { NAME_STOP_RE, SECTOR_NOUN_RE } from './extractRules'
import { isGenericProductName, isPaletteName, looksLikeName } from './extractHelpers'

/**
 * Where a name ends.
 *
 * A category noun normally ends it: "ürün parfüm şişesi etiketi" must not read *parfüm şişesi* as
 * the product. But a category noun is also frequently the second half of a real product name, and
 * then this rule cut it off — measured on an ordinary honey brief, "ürün Çiçek Balı" came back as
 * **Çiçek**, and the jar would have been printed that way. `bal` is a sector noun, so `Balı`
 * stopped the read one word early.
 *
 * The customer distinguishes the two cases themselves, by capitalising: *Çiçek Balı* is a name,
 * *parfüm şişesi* is a description. So a category noun may continue a name that has already begun
 * when it is capitalised, and stops it otherwise. Stop words and palette words are unconditional —
 * "Siyah" is capitalised too, and it is still a colour.
 */
function stop(word: string, taken = 0): boolean {
  if (NAME_STOP_RE.test(word) || isPaletteName(word)) return true
  if (!SECTOR_NOUN_RE.test(word) && !isGenericProductName(word)) return false
  return !(taken > 0 && /^[A-ZÇĞİÖŞÜ]/.test(word))
}

/** A brand the customer labelled — "marka Noctis", "marka: Noctis", "Noctis diye bir marka". */
export function spokenBrandName(text: string): string {
  const value =
    labeled(text, ['marka', 'brand']) || namedBefore(text, ['marka', 'firma', 'brand']) || spokenField(text, ['marka', 'brand'], stop)
  return looksLikeName(value) && !isGenericProductName(value) ? value : ''
}

/** A product line the customer labelled — "ürün Gece Serisi", "ürün adı: Gece Serisi". */
export function spokenProductName(text: string): string {
  const value =
    labeled(text, ['ürün', 'product']) || namedBefore(text, ['ürün', 'product']) || spokenField(text, ['ürün', 'product'], stop)
  return looksLikeName(value) ? value : ''
}
