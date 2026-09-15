/**
 * Awaiting assignment — map conversational state answers to brief patches.
 * Extracted from extract.ts to isolate the Q&A state machine from free-text extraction.
 */
import type { AwaitingKey, DesignBrief } from '../types'
import { parseCopyLocale } from './copyLocale'
import { parseDimensions, parseStyle } from './fields'
import { SKIP_UTTERANCE } from './extractRules'
import { isGenericProductName, isPaletteName, looksLikeName, looksLikeSector } from './extractHelpers'

export function assignAwaiting(text: string, awaiting: AwaitingKey | null): Partial<DesignBrief> {
  if (!awaiting || awaiting === 'templateId') return {}
  const cleaned =
    awaiting === 'manufacturerName' || awaiting === 'manufacturerAddress'
      ? text.replace(/^[\s\-–:]+/, '').trim()
      : text.replace(/^[\s\-–:]+/, '').replace(/[?.!]+$/, '').trim()
  if (!cleaned || cleaned.length > 80) return {}
  if (awaiting === 'volume') {
    if (SKIP_UTTERANCE.test(cleaned) || /^(yok|yoktur)$/i.test(cleaned)) return { volumeDefaulted: true }
    const vol = cleaned.match(/(\d+(?:[.,]\d+)?)\s*(ml|cl|l|gr|g|kg)?/i)
    if (vol) return { volume: `${vol[1]} ${(vol[2] || 'ml').toLowerCase()}`, volumeDefaulted: false }
    return { volume: cleaned, volumeDefaulted: false }
  }
  if (awaiting === 'dimensionsMm') {
    if (SKIP_UTTERANCE.test(cleaned)) return { dimsDefaulted: true }
    const dims = parseDimensions(cleaned)
    return dims ? { dimensionsMm: dims, dimsDefaulted: false } : {}
  }
  if (awaiting === 'productName') {
    if (SKIP_UTTERANCE.test(cleaned) || /^(yok|yoktur|sadece marka|marka yeter)$/i.test(cleaned)) {
      return { productSkipped: true }
    }
    if (isGenericProductName(cleaned)) return { productSkipped: true }
    return { productName: cleaned, productSkipped: false }
  }
  if (awaiting === 'barcode') {
    if (SKIP_UTTERANCE.test(cleaned) || /^(yok|üret|otomatik)$/i.test(cleaned)) return { barcodeDefaulted: true }
    const digits = cleaned.match(/\d{8,14}/)
    return digits ? { barcode: digits[0], barcodeDefaulted: false } : { barcodeDefaulted: true }
  }
  if (awaiting === 'manufacturerName') {
    if (SKIP_UTTERANCE.test(cleaned)) return { manufacturerDefaulted: true }
    return { manufacturerName: cleaned, manufacturerDefaulted: false }
  }
  if (awaiting === 'manufacturerAddress') {
    if (SKIP_UTTERANCE.test(cleaned)) return { addressDefaulted: true }
    return { manufacturerAddress: cleaned, addressDefaulted: false }
  }
  if (/^(evet|hayır|ok|tamam|olur|yok|bilmiyorum)$/i.test(cleaned)) {
    if (awaiting === 'colors' && /yok|bilmiyorum|hayır/i.test(cleaned)) return { colors: 'Motor paleti' }
    return {}
  }
  if (awaiting === 'packagingMode') {
    if (/etiket|label/i.test(cleaned) && !/kutu|box/i.test(cleaned)) return { packagingMode: 'label' }
    return { packagingMode: 'box' }
  }
  if (awaiting === 'styleType') {
    const style = parseStyle(cleaned)
    return style ? { styleType: style } : { styleType: 'luxury' }
  }
  if (awaiting === 'copyLocale') {
    return { copyLocale: parseCopyLocale(cleaned) ?? (/en|eng|english|ingiliz/i.test(cleaned) ? 'en' : 'tr') }
  }
  if (awaiting === 'sector') {
    if (looksLikeSector(cleaned) && cleaned.split(/\s+/).length <= 2) return { sector: cleaned }
    return {}
  }
  if (awaiting === 'brandName') {
    const words = cleaned.split(/\s+/).filter(Boolean)
    if (words.length <= 3 && looksLikeName(cleaned) && !isGenericProductName(cleaned) && !isPaletteName(cleaned)) {
      return { brandName: cleaned }
    }
    return {}
  }
  return { [awaiting]: cleaned } as Partial<DesignBrief>
}
