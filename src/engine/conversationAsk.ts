/**
 * Conversation ask data — critical follow-ups only (CHAT-1).
 * Barcode / manufacturer / SKU / volume are sample defaults, not a gauntlet.
 */
import type { AwaitingKey, DesignBrief } from '../types'
import { acceptedDimsDefault, hasUserDims } from './fields'

const ASK: Partial<Record<AwaitingKey, string>> = {
  packagingMode: 'Kutu mu tasarlıyoruz, etiket mi, yoksa ikisi birden mi?',
  sector: 'Ürün nedir — kozmetik, gıda, kahve, elektronik?',
  brandName: 'Markanın adı nedir? Tipografide bunu taşıyacağız.',
  productName: 'Ürün hattı veya SKU adı nedir? Marka adı değil — örneğin Noir. Yoksa “örnek” yazın; lockup’ta yalnız marka kalır.',
  volume: 'Hacim nedir — örneğin 50 ml? Bilmiyorsanız “örnek” yazın; Girdiler’de varsayılan diye işaretlerim.',
  dimensionsMm:
    'Ölçüler nedir (L×W×H mm)? Bilmiyorsan “şablon” yaz; sektörün standart kutusunu kullanırım.',
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
  dimensionsMm: 'Etiket ölçüsü nedir (genişlik × yükseklik mm)? “şablon” yazman yeterli.',
}

/** Ask only what still blocks a first design. Production samples fill the rest. */
const ASK_CRITICAL: AwaitingKey[] = ['packagingMode', 'sector', 'brandName', 'dimensionsMm']

function dimensionsAsk(brief: DesignBrief): string {
  if (brief.packagingMode === 'label') return ASK_LABEL.dimensionsMm as string
  const blob = `${brief.subProduct} ${brief.sector} ${brief.productName}`.toLocaleLowerCase('tr')
  if (/serum/.test(blob)) {
    return 'Standart bir serum kutusu ölçüsü kullanayım mı, yoksa L×W×H mm verir misin? “şablon” dersen sektör varsayılanına geçerim.'
  }
  if (/kahve|coffee/.test(blob)) {
    return 'Kahve kutusu için standart ölçü kullanayım mı, yoksa L×W×H mm verir misin? “şablon” yazman yeterli.'
  }
  if (/parfüm|parfum|perfume/.test(blob)) {
    return 'Parfüm kutusu için standart bir ölçü kullanayım mı, yoksa L×W×H mm verir misin? “şablon” yazman yeterli.'
  }
  return ASK.dimensionsMm as string
}

export function askCopy(brief: DesignBrief, key: AwaitingKey): string {
  if (key === 'dimensionsMm') return dimensionsAsk(brief)
  if (brief.packagingMode === 'label' && ASK_LABEL[key]) return ASK_LABEL[key] as string
  return ASK[key] ?? ''
}

export function nextMissing(brief: DesignBrief): AwaitingKey | null {
  for (const key of ASK_CRITICAL) {
    if (key === 'packagingMode' && !brief.packagingMode) return key
    if (key === 'sector' && !brief.sector.trim()) return key
    if (key === 'brandName' && !brief.brandName.trim()) return key
    if (key === 'dimensionsMm' && !hasUserDims(brief) && !acceptedDimsDefault(brief)) return key
  }
  if (!brief.templateId) return 'templateId'
  return null
}
