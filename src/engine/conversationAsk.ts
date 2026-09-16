/**
 * Conversation ask data — critical follow-ups only (CHAT-1).
 * Barcode / manufacturer / SKU / volume are sample defaults, not a gauntlet.
 */
import type { AwaitingKey, DesignBrief } from '../types'
import { acceptedDimsDefault, acceptedDirectionDefault, hasDirectionSignal, hasUserDims } from './fields'

const ASK: Partial<Record<AwaitingKey, string>> = {
  packagingMode: 'Kutu mu tasarlıyoruz, etiket mi, yoksa ikisi birden mi?',
  sector: 'Ne ürünü paketliyoruz — parfüm, serum, kahve, kulaklık, bal? Kategori adını yazmana gerek yok; ürünü söyle.',
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
    'Renk, duruş veya hikâye — bir cümle yeter (ör. siyah · altın, editorial, sessiz yoğunluk). Yoksa paleti üründen kurarım; “örnek” yaz.',
  templateId: 'Uygun yapılar sağda. Bir kart seç veya “1. yapı” / “mailer” yaz; tasarım ondan sonra başlar. “örnek” dersen önerdiğimle devam ederim.',
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

/**
 * Second ask — never the same sentence twice. Names what did not land, gives concrete
 * examples, and tells the user the shortest way out (a product noun, a quoted name, "şablon").
 */
export function askRetryCopy(brief: DesignBrief, key: AwaitingKey, lastAnswer: string): string {
  const said = lastAnswer.trim().length > 0 && lastAnswer.trim().length <= 40 ? `“${lastAnswer.trim()}”` : 'Bu'
  if (key === 'sector') {
    return `${said} bir ürüne oturmadı. Paketlenen şeyi yaz — örn. “cold brew kahve”, “onarıcı şampuan”, “çiçek balı”, “eau de parfum”, “D3 vitamini”, “bebek şampuanı”, “yüzey temizleyici”, “kablosuz kulaklık”.`
  }
  if (key === 'brandName') {
    return `${said} marka adı olarak okunmadı. Markayı tek başına yaz — örn. “Elite Brew” — istersen tırnak içinde. Ürün hattını ayrıca sorarım.`
  }
  if (key === 'packagingMode') {
    return `${said} yüzeyi belirlemedi. “kutu”, “etiket” ya da “kutu ve etiket” yaz; şişe/kavanoz için etiket, karton için kutu doğru seçim.`
  }
  if (key === 'colors') {
    return `${said} yön olarak okunmadı. Renk, ruh veya bir cümle hikâye yaz — örn. “bej ve koyu yeşil, editorial”, “siyah altın lüks”. Paleti üründen kurmamı istiyorsan “örnek” de.`
  }
  if (key === 'dimensionsMm') {
    return brief.packagingMode === 'label'
      ? `Ölçüyü “90x70” gibi genişlik×yükseklik mm yaz; bilmiyorsan “şablon” de, ${brief.subProduct || brief.sector || 'ürün'} için standart etiketi kullanırım.`
      : `Ölçüyü “80x50x180” gibi L×W×H mm yaz; bilmiyorsan “şablon” de, ${brief.subProduct || brief.sector || 'ürün'} için standart kutuyu kullanırım.`
  }
  return askCopy(brief, key)
}

export function nextMissing(brief: DesignBrief): AwaitingKey | null {
  for (const key of ASK_CRITICAL) {
    if (key === 'packagingMode' && !brief.packagingMode) return key
    if (key === 'sector' && !brief.sector.trim()) return key
    if (key === 'brandName' && !brief.brandName.trim()) return key
    if (key === 'dimensionsMm' && !hasUserDims(brief) && !acceptedDimsDefault(brief)) return key
  }
  if (!hasDirectionSignal(brief) && !acceptedDirectionDefault(brief)) return 'colors'
  if (!brief.templateId) return 'templateId'
  return null
}
