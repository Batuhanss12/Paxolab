/**
 * extract — facade re-exporting the decomposed extraction modules.
 * Helpers, field extraction, and awaiting assignment now live in their own modules.
 * This file preserves the public API and the applyExtraction orchestrator.
 */
import type { Attachment, AwaitingKey, DesignBrief } from '../types'
import { mergeBrief, parseDimensions } from './fields'
import { applyVolumeCarton } from './catalog/volumeCarton'
import { assignAwaiting } from './assignAwaiting'
import { extractFields } from './extractFields'
import { labeled, looksLikeSector, sameName } from './extractHelpers'
import { spokenBrandName, spokenProductName } from './spokenNames'

export { isPaletteName, sameName, looksLikeSector, isGenericProductName, isSectorOrSurfaceName } from './extractHelpers'
export { extractFields } from './extractFields'
export { assignAwaiting } from './assignAwaiting'

export function applyExtraction(
  brief: DesignBrief,
  text: string,
  attachments: Attachment[],
  awaiting: AwaitingKey | null,
): DesignBrief {
  const assigned = assignAwaiting(text, awaiting)
  const extracted = extractFields(text, attachments)
  if (awaiting === 'brandName') {
    const explicitProduct = labeled(text, ['ürün', 'product'])
    if (!explicitProduct) delete extracted.productName
    if (!looksLikeSector(text)) {
      delete extracted.sector
      delete extracted.subProduct
    }
    /*
     * Same trap as `productName` below, and worse: the heuristic takes `words[0]` as the brand, so
     * a two- or three-word house answering "what is the brand?" lost everything after the first
     * word — measured, "Elite Brew" became "Elite" and "Verda Botanicals Apothecary" became
     * "Verda". The brand is the largest thing on the pack; it cannot be a guess when the customer
     * has just been asked for it outright.
     */
    if (assigned.brandName) delete extracted.brandName
  }
  if (awaiting === 'productName') {
    delete extracted.brandName
    if (assigned.productName && sameName(assigned.productName, brief.brandName)) {
      delete assigned.productName
    }
    if (extracted.productName && sameName(extracted.productName, brief.brandName)) {
      delete extracted.productName
    }
    /*
     * A direct answer beats a scan of the same sentence.
     *
     * `assigned` takes the whole reply as the product name, which is what the customer was asked
     * for; `extracted` then runs the general heuristic over it and merges *last*, so its guess won
     * — and that heuristic picks a single word after the first one. Measured: "Fleur de Nuit"
     * printed as "DE", "Rose de Mai" as "de", "Gece Çiçeği" as "Çiçeği". Every multi-word product
     * name reached the label mangled; only single words survived.
     */
    if (assigned.productName) delete extracted.productName
  }
  /*
   * A correction is not noise.
   *
   * While any of these fields was awaited, the brand, product, sub-product and sector were deleted
   * from the free-text reading outright. The reason was sound — answering "50 ml" must not let the
   * positional heuristic decide that "50" is a brand — but the cure threw away the customer saying
   * something deliberate: type "aslında marka adı Noktis olsun" at the barcode question and the
   * correction vanished, silently, with the old name still on the pack.
   *
   * So the guess is still dropped and the *labelled* reading is kept. "marka X", "ürün Y" and
   * "X diye bir marka" are the customer naming a field on purpose; nothing else gets through.
   */
  if (
    awaiting === 'volume' ||
    awaiting === 'dimensionsMm' ||
    awaiting === 'barcode' ||
    awaiting === 'manufacturerName' ||
    awaiting === 'manufacturerAddress' ||
    awaiting === 'templateId' ||
    awaiting === 'copyLocale' ||
    awaiting === 'colors' ||
    awaiting === 'styleType'
  ) {
    const labelledBrand = spokenBrandName(text)
    const labelledProduct = spokenProductName(text)
    if (!labelledBrand) delete extracted.brandName
    if (!labelledProduct) delete extracted.productName
    delete extracted.subProduct
    delete extracted.sector
    if (labelledBrand) extracted.brandName = labelledBrand
    if (labelledProduct) extracted.productName = labelledProduct
  }
  /*
   * A guess may fill an empty field. It may not overwrite one the customer already gave.
   *
   * Every guard above is keyed on `awaiting`, and once a design exists `awaiting` is null — so none
   * of them ran, and `extractFields`' positional fallback (first word = brand, next = product) was
   * free to rewrite the name on the pack from whatever was typed next. Two measured cases, both
   * from ordinary use after the first design:
   *
   *   - typing `başlat` to re-run set the brand to **başlat** — the start word became the name;
   *   - "hedef kitle 25-40 yaş, teknoloji meraklısı, online satılacak" set the brand to **hedef**
   *     and the product to **kitle**, while the audience it was describing landed correctly in
   *     `brief.audience`. The customer described their buyer and lost their brand.
   *
   * The positional reading exists for the opening message, where nothing is known and word order
   * is the only signal. Past that point the customer has to *say* they are renaming something —
   * which is what `spokenBrandName` / `spokenProductName` detect, and what already lets "aslında
   * marka adı Noktis olsun" through at any point in the conversation.
   */
  if (brief.brandName.trim() && extracted.brandName && !spokenBrandName(text)) {
    delete extracted.brandName
  }
  if (brief.productName.trim() && extracted.productName && !spokenProductName(text)) {
    delete extracted.productName
  }

  if (awaiting === 'copyLocale') delete extracted.copyLocale
  if (brief.copyLocale && awaiting !== 'copyLocale') delete extracted.copyLocale
  if (
    !brief.packagingMode &&
    !assigned.packagingMode &&
    !extracted.packagingMode &&
    (extracted.sector || extracted.subProduct || assigned.sector) &&
    !/etiket|label|wrap/i.test(text)
  ) {
    extracted.packagingMode = 'box'
  }
  let next = mergeBrief(mergeBrief(brief, assigned), extracted)
  if (awaiting === 'dimensionsMm') {
    const dims = parseDimensions(text)
    if (dims) next = mergeBrief(next, { dimensionsMm: dims })
  }
  if (next.productName && next.brandName && sameName(next.productName, next.brandName)) {
    next = { ...next, productName: '' }
  }
  return applyVolumeCarton(next)
}
