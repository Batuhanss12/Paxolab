/**
 * Conversation ask data — ASK prompt tables + sequence + nextMissing logic.
 * Extracted from conversation.ts to isolate prompt data from the state machine.
 */
import type { AwaitingKey, DesignBrief } from '../types'
import {
  acceptedAddressDefault,
  acceptedBarcodeDefault,
  acceptedDimsDefault,
  acceptedManufacturerDefault,
  acceptedProductSkip,
  acceptedVolumeDefault,
  hasUserAddress,
  hasUserBarcode,
  hasUserDims,
  hasUserManufacturer,
  hasUserVolume,
} from './fields'

const ASK: Partial<Record<AwaitingKey, string>> = {
  packagingMode: 'Kutu mu tasarlıyoruz, yoksa etiket mi?',
  sector: 'Sektör nedir — kozmetik, gıda, elektronik?',
  brandName: 'Markanın adı nedir? Tipografide bunu taşıyacağız.',
  productName: 'Ürün hattı veya SKU adı nedir? Marka adı değil — örneğin Noir. Yoksa “örnek” yazın; lockup’ta yalnız marka kalır.',
  volume: 'Hacim nedir — örneğin 50 ml? Bilmiyorsanız “örnek” yazın; Girdiler’de varsayılan diye işaretlerim.',
  dimensionsMm:
    'Ölçüler nedir (L×W×H mm)? Yazmazsanız şablon varsayılanını kullanırım — “şablon” yazmanız yeterli.',
  barcode:
    'Barkod / GTIN nedir? Yazmazsanız örnek bir barkod çizerim — Girdiler’de örnek diye işaretlenir, gerçek GS1 değildir.',
  manufacturerName: 'Üretici veya ithalatçı unvanı nedir? Bilmiyorsanız “örnek” yazın.',
  manufacturerAddress: 'Üretici adresi nedir (ilçe, şehir, ülke)? Bilmiyorsanız “örnek” yazın.',
  styleType: 'Soldaki ruh hali çipleri ipucu: Lüks, Modern, Minimal, Eco, Eğlenceli, Klasik. Kostüm şablonu değil — renk ve motifler brief’ten kurulur.',
  colors:
    'Renkler nedir — hex veya isim (ör. #1a0a0a · #c9a227, siyah altın)? “yok” derseniz paleti ruh hali ve sektörden türetirim.',
  templateId: 'Sağdaki şablon kartlarından birini seçin — dieline canlı güncellenir.',
  copyLocale: 'Metinler Türkçe mi, İngilizce mi?',
}

const ASK_LABEL: Partial<Record<AwaitingKey, string>> = {
  productName: 'Ön etiket hattı nedir (markadan farklı — örn. Noir)? Yoksa “örnek” yazın.',
  volume: 'Ön yüzde hacim yazılsın mı — örneğin 50 ml? “örnek” veya “yok” yazabilirsiniz.',
  dimensionsMm: 'Etiket ölçüsü nedir (genişlik × yükseklik mm)? “şablon” yazmanız yeterli.',
}

const ASK_BOX: AwaitingKey[] = [
  'packagingMode',
  'sector',
  'brandName',
  'productName',
  'volume',
  'dimensionsMm',
  'barcode',
  'manufacturerName',
  'manufacturerAddress',
]

const ASK_LABEL_SEQ: AwaitingKey[] = [
  'packagingMode',
  'sector',
  'brandName',
  'productName',
  'volume',
  'dimensionsMm',
]

export function askCopy(brief: DesignBrief, key: AwaitingKey): string {
  if (brief.packagingMode === 'label' && ASK_LABEL[key]) return ASK_LABEL[key] as string
  return ASK[key] ?? ''
}

export function nextMissing(brief: DesignBrief): AwaitingKey | null {
  const sequence = brief.packagingMode === 'label' ? ASK_LABEL_SEQ : ASK_BOX
  for (const key of sequence) {
    if (key === 'packagingMode' && !brief.packagingMode) return key
    if (key === 'sector' && !brief.sector.trim()) return key
    if (key === 'brandName' && !brief.brandName.trim()) return key
    if (key === 'productName' && !brief.productName.trim() && !acceptedProductSkip(brief)) return key
    if (key === 'volume' && !hasUserVolume(brief) && !acceptedVolumeDefault(brief)) return key
    if (key === 'dimensionsMm' && !hasUserDims(brief) && !acceptedDimsDefault(brief)) return key
    if (key === 'barcode' && !hasUserBarcode(brief) && !acceptedBarcodeDefault(brief)) return key
    if (key === 'manufacturerName' && !hasUserManufacturer(brief) && !acceptedManufacturerDefault(brief)) return key
    if (key === 'manufacturerAddress' && !hasUserAddress(brief) && !acceptedAddressDefault(brief)) return key
  }
  if (!brief.templateId) return 'templateId'
  if (!brief.copyLocale) return 'copyLocale'
  return null
}
