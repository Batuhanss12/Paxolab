/**
 * extract — facade re-exporting the decomposed extraction modules.
 * Helpers, field extraction, and awaiting assignment now live in their own modules.
 * This file preserves the public API and the applyExtraction orchestrator.
 */
import type { Attachment, AwaitingKey, DesignBrief } from '../types'
import { mergeBrief, parseDimensions } from './fields'
import { assignAwaiting } from './assignAwaiting'
import { extractFields } from './extractFields'
import { labeled, looksLikeSector, sameName } from './extractHelpers'

export { isPaletteName, sameName, looksLikeSector, isGenericProductName } from './extractHelpers'
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
  }
  if (awaiting === 'productName') {
    delete extracted.brandName
    if (assigned.productName && sameName(assigned.productName, brief.brandName)) {
      delete assigned.productName
    }
    if (extracted.productName && sameName(extracted.productName, brief.brandName)) {
      delete extracted.productName
    }
  }
  if (
    awaiting === 'volume' ||
    awaiting === 'dimensionsMm' ||
    awaiting === 'barcode' ||
    awaiting === 'manufacturerName' ||
    awaiting === 'manufacturerAddress' ||
    awaiting === 'templateId' ||
    awaiting === 'copyLocale'
  ) {
    delete extracted.brandName
    delete extracted.productName
    delete extracted.subProduct
    delete extracted.sector
  }
  if (awaiting === 'copyLocale') delete extracted.copyLocale
  if (brief.copyLocale && awaiting !== 'copyLocale') delete extracted.copyLocale
  let next = mergeBrief(mergeBrief(brief, assigned), extracted)
  if (awaiting === 'dimensionsMm') {
    const dims = parseDimensions(text)
    if (dims) next = mergeBrief(next, { dimensionsMm: dims })
  }
  if (next.productName && next.brandName && sameName(next.productName, next.brandName)) {
    next = { ...next, productName: '' }
  }
  return next
}
