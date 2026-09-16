/**
 * Awaiting assignment — map conversational state answers to brief patches.
 * Extracted from extract.ts to isolate the Q&A state machine from free-text extraction.
 */
import type { AwaitingKey, DesignBrief } from '../types'
import { parseCopyLocale } from './copyLocale'
import { parseDimensions, parseStyle } from './fields'
import { templateIdFromUtterance } from './catalog/structureOffer'
import { isGenericProductName, isPaletteName, isSectorOrSurfaceName, looksLikeName, looksLikeSector } from './extractHelpers'
import { NAME_STOP_RE, SKIP_UTTERANCE, normaliseSectorTypos } from './extractRules'
import { isSpokenStory, isSpokenTagline } from './extractCopy'

export function assignAwaiting(text: string, awaiting: AwaitingKey | null): Partial<DesignBrief> {
  if (!awaiting) return {}
  const cleaned =
    awaiting === 'manufacturerName' || awaiting === 'manufacturerAddress'
      ? text.replace(/^[\s\-–:]+/, '').trim()
      : text.replace(/^[\s\-–:]+/, '').replace(/[?.!]+$/, '').trim()
  if (!cleaned) return {}
  if (cleaned.length > 80 && awaiting !== 'colors' && awaiting !== 'styleType') return {}
  if (awaiting === 'templateId') {
    if (SKIP_UTTERANCE.test(cleaned) || /^(devam|önerdi[gğ]in|olsun)$/i.test(cleaned)) return {}
    const id = templateIdFromUtterance(cleaned, '')
    return id ? { templateId: id } : {}
  }
  if (awaiting === 'colors' || awaiting === 'styleType') {
    if (SKIP_UTTERANCE.test(cleaned) || /^(yok|yoktur|hayır)$/i.test(cleaned)) return { directionDefaulted: true }
    if (!/[A-Za-zÇĞİÖŞÜçğıöşü#]/.test(cleaned)) return {}
    if (isSpokenStory(cleaned) || isSpokenStory(text)) {
      return { directionDefaulted: false, story: isSpokenStory(text) ? text.trim() : cleaned }
    }
    if (isSpokenTagline(cleaned) || isSpokenTagline(text)) {
      return { directionDefaulted: false, copyOverrides: isSpokenTagline(text) ? text.trim().replace(/[?.!]+$/, '') : cleaned }
    }
    const style = parseStyle(cleaned)
    const moodOnly =
      /^(lüks|luxury|premium|minimal|sade|eco|modern|klasik|classic|editorial|editöryal|çağdaş|contemporary)$/i.test(
        cleaned,
      )
    return {
      directionDefaulted: false,
      ...(style ? { styleType: style } : {}),
      ...(moodOnly ? {} : { colors: cleaned }),
      ...(cleaned.length > 40 ? { story: cleaned } : {}),
    }
  }
  if (cleaned.length > 80) return {}
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
    if (/kutu.+(etiket|label)|(etiket|label).+kutu|\+/i.test(cleaned)) {
      return { packagingMode: 'box', deliverables: ['box', 'label'] }
    }
    if (/etiket|label/i.test(cleaned) && !/kutu|box/i.test(cleaned)) {
      return { packagingMode: 'label', deliverables: ['label'] }
    }
    return { packagingMode: 'box', deliverables: ['box'] }
  }
  if (awaiting === 'copyLocale') {
    return { copyLocale: parseCopyLocale(cleaned) ?? (/en|eng|english|ingiliz/i.test(cleaned) ? 'en' : 'tr') }
  }
  if (awaiting === 'sector') {
    const canonical = normaliseSectorTypos(cleaned)
    if (looksLikeSector(canonical) && canonical.split(/\s+/).length <= 2) return { sector: canonical }
    return {}
  }
  if (awaiting === 'brandName') {
    if (SKIP_UTTERANCE.test(cleaned)) return {}
    const words = cleaned.split(/\s+/).filter(Boolean)
    const canonical = normaliseSectorTypos(cleaned)
    // "Elektronik" / "kahve" answering a brand prompt is a sector, not a lockup.
    if (isSectorOrSurfaceName(canonical) || isSectorOrSurfaceName(cleaned)) {
      return looksLikeSector(canonical) ? { sector: canonical } : {}
    }
    const stopWord = words.length === 1 && NAME_STOP_RE.test(words[0])
    if (words.length <= 3 && !stopWord && looksLikeName(cleaned) && !isGenericProductName(cleaned) && !isPaletteName(cleaned)) {
      return { brandName: cleaned }
    }
    return {}
  }
  return { [awaiting]: cleaned } as Partial<DesignBrief>
}
