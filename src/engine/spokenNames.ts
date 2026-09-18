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

function stop(word: string): boolean {
  return NAME_STOP_RE.test(word) || SECTOR_NOUN_RE.test(word) || isPaletteName(word) || isGenericProductName(word)
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
