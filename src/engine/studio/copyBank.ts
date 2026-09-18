/**
 * Sector copy bank — the anatomy words a reference-level surface carries besides brand/product:
 * benefit rows, claim chips, stacked manifesto words, category line, tagline, story, net quantity.
 * Everything is sample copy the user can overwrite; nothing here claims certification.
 */
import type { CopyLocale, DesignBrief } from '../../types'
import type { SectorId } from '../designSystem/types'
import type { BenefitItem } from './types'

type Bank = {
  benefits: BenefitItem[]
  chips: string[]
  manifesto: string[]
  category: string
  tagline: string
  story: string
  prefixes: string[]
}

const TR: Record<SectorId, Bank> = {
  perfume: {
    benefits: [
      { icon: 'drop', label: 'Yoğun esans' },
      { icon: 'star', label: 'Uzun kalıcılık' },
      { icon: 'leaf', label: 'Doğal notalar' },
    ],
    chips: ['EAU DE PARFUM', 'VAPORISATEUR · NATURAL SPRAY'],
    manifesto: ['CESUR', 'ZAMANSIZ', 'ÖZGÜN', 'SEN'],
    category: 'EAU DE PARFUM',
    tagline: 'DOĞA GÜCÜ ATEŞLER',
    story:
      'Vahşi doğadan ilham alan bu koku, özgürlüğün, gücün ve özgünlüğün ruhunu taşır. Karakterli açılışı, sıcak ve kalıcı bir izle tamamlanır.',
    prefixes: ['Signature', 'Intense', 'Noir'],
  },
  cream: {
    benefits: [
      { icon: 'drop', label: 'Yoğun nem' },
      { icon: 'leaf', label: 'Bitkisel içerik' },
      { icon: 'shield', label: 'Onarıcı bakım' },
    ],
    chips: ['ARGAN + KERATIN', 'GÜNLÜK BAKIM'],
    manifesto: ['PARLAK', 'SAĞLIKLI', 'İPEKSİ', 'SEN'],
    category: 'BAKIM KREMİ',
    tagline: 'PARLAK VE İPEKSİ GÖRÜNÜM',
    story: 'Zengin formülü ciltle uyumlu çalışır; günlük kullanımda daha pürüzsüz, daha dengeli ve daha canlı bir görünüm hedefler.',
    prefixes: ['Care', 'Restorative', 'Daily'],
  },
  serum: {
    benefits: [
      { icon: 'drop', label: 'Konsantre formül' },
      { icon: 'flask', label: 'Aktif içerik' },
      { icon: 'check', label: 'Hızlı emilim' },
    ],
    chips: ['NIACINAMIDE + HYALURONIC', 'GECE & GÜNDÜZ'],
    manifesto: ['SAF', 'ETKİLİ', 'DENGELİ', 'SEN'],
    category: 'KONSANTRE SERUM',
    tagline: 'TEK DAMLA · GÖRÜNÜR FARK',
    story: 'Hafif dokulu serum, aktif içeriğini hızla bırakır. Düzenli kullanımda ten daha dengeli ve aydınlık görünür.',
    prefixes: ['Pure', 'Active', 'Glow'],
  },
  food: {
    benefits: [
      { icon: 'leaf', label: '%100 doğal' },
      { icon: 'flask', label: 'Katkı maddesi içermez' },
      { icon: 'bee', label: 'Doğal arı ürünü' },
      { icon: 'mountain', label: 'Anadolu kaynaklı' },
    ],
    chips: ['%100 DOĞAL', 'KATKISIZ'],
    manifesto: ['DOĞADAN', 'SOFRANIZA', 'SAF', 'LEZZET'],
    category: 'DOĞAL LEZZET',
    tagline: 'DOĞANIN SAF ARMAĞANI',
    story:
      'Zengin bitki örtüsüne sahip yüksek yaylalarda, doğal yöntemlerle üretilir. Saf ve eşsiz lezzetini sofranıza ulaştırır.',
    prefixes: ['Doğal', 'Yayla', 'Özel Seri'],
  },
  beverage: {
    benefits: [
      { icon: 'drop', label: 'Yoğun aroma' },
      { icon: 'leaf', label: 'Seçilmiş çekirdek' },
      { icon: 'sun', label: 'Yavaş kavrum' },
    ],
    chips: ['HIGH-QUALITY COFFEE', 'SAVOR THE DISTINCTION'],
    manifesto: ['SEÇKİN', 'YOĞUN', 'SICAK', 'AN'],
    category: 'KAHVE',
    tagline: 'SAVOR THE DISTINCTION',
    story: 'Özenle seçilen çekirdekler, karakterini koruyacak şekilde yavaş kavrulur. Her fincanda dengeli gövde ve uzun bir bitiş.',
    prefixes: ['Golden', 'Platinum', 'Signature'],
  },
  health: {
    benefits: [
      { icon: 'shield', label: 'Bağışıklık desteği' },
      { icon: 'flask', label: 'Laboratuvar kontrollü' },
      { icon: 'check', label: 'Günde 1 kapsül' },
    ],
    chips: ['TAKVİYE EDİCİ GIDA', '60 KAPSÜL'],
    manifesto: ['DENGE', 'GÜÇ', 'HER GÜN', 'SEN'],
    category: 'TAKVİYE EDİCİ GIDA',
    tagline: 'HER GÜN DENGELİ DESTEK',
    story: 'Formülü günlük ihtiyaçlar düşünülerek geliştirildi. Dengeli beslenmenin yerine geçmez; onu destekler.',
    prefixes: ['Daily', 'Balance', 'Vital'],
  },
  baby: {
    benefits: [
      { icon: 'heart', label: 'Hassas ciltle uyumlu' },
      { icon: 'leaf', label: 'Paraben içermez' },
      { icon: 'drop', label: 'Göz yakmaz' },
    ],
    chips: ['PARABEN İÇERMEZ', 'DERMATOLOJİK TEST'],
    manifesto: ['NAZİK', 'GÜVENLİ', 'YUMUŞAK', 'MİNİK'],
    category: 'BEBEK BAKIM',
    tagline: 'İLK GÜNDEN NAZİK BAKIM',
    story: 'Hassas bebek cildi için nazik formül. Günlük bakımda yumuşaklık ve rahatlık sağlar.',
    prefixes: ['Soft', 'Gentle', 'Pure'],
  },
  electronics: {
    benefits: [
      { icon: 'bolt', label: 'Hızlı şarj' },
      { icon: 'shield', label: '2 yıl garanti' },
      { icon: 'check', label: 'Evrensel uyum' },
    ],
    chips: ['USB-C · FAST CHARGE', 'BLUETOOTH 5.3'],
    manifesto: ['HIZLI', 'SESSİZ', 'GÜÇLÜ', 'SEN'],
    category: 'KABLOSUZ CİHAZ',
    tagline: 'SES · GÜÇ · SADELİK',
    story: 'Günlük kullanım için tasarlandı: uzun pil ömrü, hızlı bağlantı ve sade bir form.',
    prefixes: ['Pro', 'Air', 'One'],
  },
  cleaning: {
    benefits: [
      { icon: 'check', label: 'Güçlü temizlik' },
      { icon: 'leaf', label: 'Bitkisel bazlı' },
      { icon: 'drop', label: 'Leke çözücü' },
    ],
    chips: ['KONSANTRE FORMÜL', 'FERAH KOKU'],
    manifesto: ['TEMİZ', 'FERAH', 'HIZLI', 'EV'],
    category: 'YÜZEY TEMİZLEYİCİ',
    tagline: 'TEK HAMLEDE FERAHLIK',
    story: 'Konsantre formülü kirleri hızla çözer, yüzeyde ferah bir iz bırakır.',
    prefixes: ['Fresh', 'Power', 'Pure'],
  },
  generic: {
    benefits: [
      { icon: 'check', label: 'Kalite kontrol' },
      { icon: 'leaf', label: 'Özenli üretim' },
      { icon: 'star', label: 'Premium seri' },
    ],
    chips: ['PREMIUM QUALITY'],
    manifesto: ['ÖZGÜN', 'ÖZENLİ', 'SEÇKİN', 'SEN'],
    category: 'PREMIUM SERİ',
    tagline: 'ÖZENLE ÜRETİLDİ',
    story: 'Özenle seçilen malzemeler ve dikkatli üretim. Her detayda kalite.',
    prefixes: ['Signature', 'Select', 'Original'],
  },
}

const EN: Record<SectorId, Bank> = {
  perfume: {
    benefits: [
      { icon: 'drop', label: 'Intense essence' },
      { icon: 'star', label: 'Long lasting' },
      { icon: 'leaf', label: 'Natural notes' },
    ],
    chips: ['EAU DE PARFUM', 'VAPORISATEUR · NATURAL SPRAY'],
    manifesto: ['WILD', 'CONFIDENT', 'AUTHENTIC', 'YOU'],
    category: 'EAU DE PARFUM',
    tagline: 'NATURE IGNITES STRENGTH',
    story:
      'A bold fragrance inspired by untamed nature. It captures the spirit of freedom, strength and authenticity, and settles into a warm, lasting trace.',
    prefixes: ['Signature', 'Intense', 'Noir'],
  },
  cream: {
    benefits: [
      { icon: 'drop', label: 'Deep moisture' },
      { icon: 'leaf', label: 'Botanical blend' },
      { icon: 'shield', label: 'Repair care' },
    ],
    chips: ['ARGAN + KERATIN', 'DAILY CARE'],
    manifesto: ['SHINE', 'HEALTHY', 'SILKY', 'YOU'],
    category: 'CARE CREAM',
    tagline: 'SHINY AND SILKY LOOK',
    story: 'A rich formula that works with the skin; smoother, balanced and more radiant with daily use.',
    prefixes: ['Care', 'Restorative', 'Daily'],
  },
  serum: {
    benefits: [
      { icon: 'drop', label: 'Concentrated' },
      { icon: 'flask', label: 'Active complex' },
      { icon: 'check', label: 'Fast absorbing' },
    ],
    chips: ['NIACINAMIDE + HYALURONIC', 'DAY & NIGHT'],
    manifesto: ['PURE', 'ACTIVE', 'BALANCED', 'YOU'],
    category: 'CONCENTRATE SERUM',
    tagline: 'ONE DROP · VISIBLE CHANGE',
    story: 'A light serum that releases its actives fast. Skin looks balanced and luminous with regular use.',
    prefixes: ['Pure', 'Active', 'Glow'],
  },
  food: {
    benefits: [
      { icon: 'leaf', label: '100% natural' },
      { icon: 'flask', label: 'No additives' },
      { icon: 'bee', label: 'Natural bee product' },
      { icon: 'mountain', label: 'Highland origin' },
    ],
    chips: ['100% NATURAL', 'NO ADDITIVES'],
    manifesto: ['NATURE', 'TO', 'YOUR', 'TABLE'],
    category: 'NATURAL TASTE',
    tagline: "NATURE'S PURE GIFT",
    story: 'Produced with natural methods on high plateaus rich in flora. Pure, distinct taste for your table.',
    prefixes: ['Natural', 'Highland', 'Special Series'],
  },
  beverage: {
    benefits: [
      { icon: 'drop', label: 'Intense aroma' },
      { icon: 'leaf', label: 'Selected beans' },
      { icon: 'sun', label: 'Slow roast' },
    ],
    chips: ['HIGH-QUALITY COFFEE', 'SAVOR THE DISTINCTION'],
    manifesto: ['SELECT', 'INTENSE', 'WARM', 'MOMENT'],
    category: 'COFFEE',
    tagline: 'SAVOR THE DISTINCTION',
    story: 'Carefully selected beans, slow roasted to keep their character. Balanced body and a long finish in every cup.',
    prefixes: ['Golden', 'Platinum', 'Signature'],
  },
  health: {
    benefits: [
      { icon: 'shield', label: 'Immune support' },
      { icon: 'flask', label: 'Lab controlled' },
      { icon: 'check', label: '1 capsule daily' },
    ],
    chips: ['FOOD SUPPLEMENT', '60 CAPSULES'],
    manifesto: ['BALANCE', 'STRENGTH', 'EVERY DAY', 'YOU'],
    category: 'FOOD SUPPLEMENT',
    tagline: 'BALANCED DAILY SUPPORT',
    story: 'Developed for daily needs. Does not replace a balanced diet; it supports one.',
    prefixes: ['Daily', 'Balance', 'Vital'],
  },
  baby: {
    benefits: [
      { icon: 'heart', label: 'Sensitive skin' },
      { icon: 'leaf', label: 'Paraben free' },
      { icon: 'drop', label: 'No tears' },
    ],
    chips: ['PARABEN FREE', 'DERMATOLOGICALLY TESTED'],
    manifesto: ['GENTLE', 'SAFE', 'SOFT', 'LITTLE'],
    category: 'BABY CARE',
    tagline: 'GENTLE FROM DAY ONE',
    story: 'A gentle formula for delicate baby skin. Softness and comfort in daily care.',
    prefixes: ['Soft', 'Gentle', 'Pure'],
  },
  electronics: {
    benefits: [
      { icon: 'bolt', label: 'Fast charge' },
      { icon: 'shield', label: '2-year warranty' },
      { icon: 'check', label: 'Universal fit' },
    ],
    chips: ['USB-C · FAST CHARGE', 'BLUETOOTH 5.3'],
    manifesto: ['FAST', 'QUIET', 'POWERFUL', 'YOU'],
    category: 'WIRELESS DEVICE',
    tagline: 'SOUND · POWER · SIMPLICITY',
    story: 'Designed for daily use: long battery life, fast pairing and a clean form.',
    prefixes: ['Pro', 'Air', 'One'],
  },
  cleaning: {
    benefits: [
      { icon: 'check', label: 'Powerful clean' },
      { icon: 'leaf', label: 'Plant based' },
      { icon: 'drop', label: 'Stain solver' },
    ],
    chips: ['CONCENTRATED FORMULA', 'FRESH SCENT'],
    manifesto: ['CLEAN', 'FRESH', 'FAST', 'HOME'],
    category: 'SURFACE CLEANER',
    tagline: 'FRESHNESS IN ONE MOVE',
    story: 'A concentrated formula that lifts dirt fast and leaves a fresh trace.',
    prefixes: ['Fresh', 'Power', 'Pure'],
  },
  generic: {
    benefits: [
      { icon: 'check', label: 'Quality control' },
      { icon: 'leaf', label: 'Careful making' },
      { icon: 'star', label: 'Premium series' },
    ],
    chips: ['PREMIUM QUALITY'],
    manifesto: ['ORIGINAL', 'CAREFUL', 'SELECT', 'YOU'],
    category: 'PREMIUM SERIES',
    tagline: 'MADE WITH CARE',
    story: 'Carefully selected materials and attentive production. Quality in every detail.',
    prefixes: ['Signature', 'Select', 'Original'],
  },
}

export function copyBank(sector: SectorId, locale: CopyLocale): Bank {
  return (locale === 'en' ? EN : TR)[sector] ?? (locale === 'en' ? EN.generic : TR.generic)
}

/** Food sector includes coffee; TASARIM REF coffee uses the beverage bank, not honey/harvest copy. */
export function copyBankFor(brief: Pick<DesignBrief, 'sector' | 'subProduct' | 'productName'>, sector: SectorId, locale: CopyLocale): Bank {
  const blob = `${brief.subProduct} ${brief.productName} ${brief.sector}`.toLocaleLowerCase('tr')
  if (/kahve|coffee|espresso|frappe|brew/.test(blob)) return copyBank('beverage', locale)
  return copyBank(sector, locale)
}

export const GENERIC_SAMPLE_TAGLINE =
  /masada duran lezzet|gurme gıda|artisan food|flavour that holds the table|character that holds the surface|yüzeyde duran karakter|premium quality|kaliteli ürün|en iyi seçim|lezzet şöleni|taste the difference|crafted with (passion|love)/i

/** True when a spoken/LLM tagline is kit-leak or boilerplate and must not paint the studio face. */
export function isGenericTagline(text: string, brand?: string): boolean {
  const t = text.trim()
  if (!t) return true
  if (GENERIC_SAMPLE_TAGLINE.test(t)) return true
  const brandKey = (brand ?? '').trim().toLocaleLowerCase('tr')
  if (brandKey && t.toLocaleLowerCase('tr') === brandKey) return true
  if (/^(premium(\s+(quality|series|product))?|quality (first|product))$/i.test(t)) return true
  return false
}

/** Sub-product refinements on top of the sector bank (coffee, honey, shampoo, oil…). */
export function refineCategory(brief: Pick<DesignBrief, 'subProduct' | 'productName' | 'sector'>, sector: SectorId, locale: CopyLocale): string | null {
  const blob = `${brief.subProduct} ${brief.productName} ${brief.sector}`.toLocaleLowerCase('tr')
  const tr = locale !== 'en'
  if (/kahve|coffee|espresso/.test(blob)) return tr ? 'KAHVE' : 'COFFEE'
  if (/\bbal\b|honey/.test(blob)) return tr ? 'DOĞAL BAL' : 'NATURAL HONEY'
  if (/zeytin|olive|sızma/.test(blob)) return tr ? 'NATÜREL SIZMA ZEYTİNYAĞI' : 'EXTRA VIRGIN OLIVE OIL'
  if (/çay|\btea\b/.test(blob)) return tr ? 'ÇAY' : 'TEA'
  if (/çikolata|chocolate/.test(blob)) return tr ? 'ÇİKOLATA' : 'CHOCOLATE'
  if (/şampuan|sampuan|shampoo/.test(blob)) return tr ? 'ŞAMPUAN' : 'SHAMPOO'
  if (/saç kremi|conditioner/.test(blob)) return tr ? 'SAÇ BAKIM KREMİ' : 'HAIR CONDITIONER'
  if (/maske|mask/.test(blob)) return tr ? 'BAKIM MASKESİ' : 'CARE MASK'
  if (/köpük|mousse/.test(blob)) return tr ? 'SAÇ KÖPÜĞÜ' : 'HAIR MOUSSE'
  if (/sabun|soap/.test(blob)) return tr ? 'DOĞAL SABUN' : 'NATURAL SOAP'
  if (/kulaklık|earbuds|headphone/.test(blob)) return tr ? 'KABLOSUZ KULAKLIK' : 'WIRELESS EARBUDS'
  if (/kablo|cable|şarj/.test(blob)) return tr ? 'ŞARJ KABLOSU' : 'CHARGING CABLE'
  if (/kolonya|cologne/.test(blob)) return tr ? 'KOLONYA' : 'COLOGNE'
  if (/deterjan|detergent/.test(blob)) return tr ? 'ÇAMAŞIR DETERJANI' : 'LAUNDRY DETERGENT'
  if (/vitamin/.test(blob)) return tr ? 'VİTAMİN TAKVİYESİ' : 'VITAMIN SUPPLEMENT'
  if (sector === 'perfume') return 'EAU DE PARFUM'
  return null
}

/** Sub-product benefit swaps: coffee/honey/oil override the food defaults. */
export function refineBenefits(brief: Pick<DesignBrief, 'subProduct' | 'productName' | 'sector'>, base: BenefitItem[], locale: CopyLocale): BenefitItem[] {
  const blob = `${brief.subProduct} ${brief.productName} ${brief.sector}`.toLocaleLowerCase('tr')
  const tr = locale !== 'en'
  if (/kahve|coffee|espresso/.test(blob)) {
    return [
      { icon: 'drop', label: tr ? 'Yoğun aroma' : 'Intense aroma' },
      { icon: 'leaf', label: tr ? 'Seçilmiş çekirdek' : 'Selected beans' },
      { icon: 'sun', label: tr ? 'Yavaş kavrum' : 'Slow roast' },
    ]
  }
  if (/\bbal\b|honey/.test(blob)) {
    return [
      { icon: 'leaf', label: tr ? '%100 doğal' : '100% natural' },
      { icon: 'flask', label: tr ? 'Katkı maddesi içermez' : 'No additives' },
      { icon: 'bee', label: tr ? 'Doğal arı ürünü' : 'Natural bee product' },
      { icon: 'mountain', label: tr ? 'Yayla kaynaklı' : 'Highland origin' },
    ]
  }
  if (/zeytin|olive/.test(blob)) {
    return [
      { icon: 'leaf', label: tr ? 'Erken hasat' : 'Early harvest' },
      { icon: 'drop', label: tr ? 'Soğuk sıkım' : 'Cold pressed' },
      { icon: 'sun', label: tr ? 'Ege güneşi' : 'Aegean sun' },
    ]
  }
  if (/şampuan|sampuan|shampoo|saç|hair|keratin/.test(blob)) {
    return [
      { icon: 'leaf', label: tr ? 'Argan + keratin' : 'Argan + keratin' },
      { icon: 'drop', label: tr ? 'Nem dengesi' : 'Moisture balance' },
      { icon: 'shield', label: tr ? 'Dökülmeye karşı' : 'Anti breakage' },
    ]
  }
  return base
}

/** True when two pack lines would read as the same painted string. */
export function samePackLine(a: string, b: string): boolean {
  const left = a.trim()
  const right = b.trim()
  if (!left || !right) return false
  return left.toLocaleUpperCase('tr') === right.toLocaleUpperCase('tr')
}

/**
 * The concentration a perfume brief names, spelled the way a plate spells it.
 *
 * Perfume labels read the category line as a legal register — EAU DE PARFUM is a claim about the
 * juice, not a product type. The bank has always answered EAU DE PARFUM for the sector; that was
 * right when the brief could not say otherwise and wrong the moment it could. Short forms and
 * common misspellings map to the canonical French line; anything else is trusted as typed.
 */
export function concentrationLine(raw: string | undefined): string {
  const t = (raw ?? '').trim()
  if (!t) return ''
  const key = t.toLocaleLowerCase('en').replace(/[.\s_-]+/g, ' ')
  if (/^(edp|eau de parfum|parfum spray)$/.test(key)) return 'EAU DE PARFUM'
  if (/^(edt|eau de toilette)$/.test(key)) return 'EAU DE TOILETTE'
  if (/^(edc|eau de cologne|kolonya|cologne)$/.test(key)) return 'EAU DE COLOGNE'
  if (/^(extrait|extrait de parfum|ekstre|parfum extrait)$/.test(key)) return 'EXTRAIT DE PARFUM'
  if (/^(parfum|perfume|parfüm)$/.test(key)) return 'PARFUM'
  if (/^(eau fraiche|eau fraîche)$/.test(key)) return 'EAU FRAÎCHE'
  // French / English register, so a dotless-i rule must not turn "ambiance" into "AMBİANCE".
  return t.toLocaleUpperCase('en-US')
}

/** Category under the product — empty when the product already is the category (EAU DE PARFUM ×2). */
export function categoryBesideProduct(product: string, category: string): string {
  const cat = category.trim()
  if (!cat) return ''
  return samePackLine(product, cat) ? '' : cat
}

/** "ARGAN + COLLAGEN + KERATIN" style chip from the user's ingredient claims. */
export function claimChip(brief: Pick<DesignBrief, 'ingredientClaims'>, fallback = ''): string {
  const raw = (brief.ingredientClaims ?? '').trim()
  if (!raw) return fallback
  const parts = raw
    .split(/[,+·/]|\s+ve\s+|\s+and\s+/i)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 3)
  return parts.length ? parts.map((p) => p.toLocaleUpperCase('tr')).join(' + ') : fallback
}

/** "250 ml ℮ · 8.45 fl.oz" — dual-unit net quantity like the references. */
export function volumeLine(volume: string, locale: CopyLocale): string {
  const raw = volume.trim()
  if (!raw) return ''
  const m = raw.match(/([\d.,]+)\s*(ml|mL|l|L|g|gr|kg|G|adet|kapsül|capsules?)?/i)
  if (!m) return raw
  const value = parseFloat(m[1].replace(',', '.'))
  const unit = (m[2] ?? 'ml').toLowerCase()
  if (!Number.isFinite(value)) return raw
  if (unit === 'ml') {
    const floz = value / 29.5735
    return `${trimNum(value)} ml ℮ · ${floz.toFixed(floz >= 10 ? 1 : 2)} fl.oz`
  }
  if (unit === 'l') return `${trimNum(value)} L ℮ · ${(value * 33.814).toFixed(1)} fl.oz`
  if (unit === 'g' || unit === 'gr') {
    const oz = value / 28.3495
    return `${trimNum(value)} g ℮ · ${oz.toFixed(oz >= 10 ? 1 : 2)} oz`
  }
  if (unit === 'kg') return `${trimNum(value)} kg ℮ · ${(value * 2.20462).toFixed(2)} lb`
  /*
   * Count units stay the unit the customer typed. These three used to share one branch that
   * returned "kapsül" for all of them, so the earbuds carton in the gallery — brief volume
   * "1 adet" — printed "1 kapsül" on its front, and the English side said "1 capsules".
   */
  if (/adet|piece|pcs?\b/.test(unit)) return locale === 'en' ? `${trimNum(value)} ${value === 1 ? 'pc' : 'pcs'}` : `${trimNum(value)} adet`
  if (/kapsül|capsule/.test(unit)) return locale === 'en' ? `${trimNum(value)} ${value === 1 ? 'capsule' : 'capsules'}` : `${trimNum(value)} kapsül`
  return raw
}

function trimNum(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1).replace(/\.0$/, '')
}

/** Localised section headers for backs. */
export function backHeaders(locale: CopyLocale): {
  usage: string
  warnings: string
  ingredients: string
  storage: string
  nutrition: string
  producer: string
  address: string
  notes: { top: string; heart: string; base: string; title: string }
  story: string
} {
  if (locale === 'en') {
    return {
      usage: 'DIRECTIONS',
      warnings: 'WARNINGS',
      ingredients: 'INGREDIENTS',
      storage: 'STORAGE',
      nutrition: 'Nutrition Facts (per 100 g)',
      producer: 'PRODUCER',
      address: 'ADDRESS',
      notes: { top: 'TOP NOTES', heart: 'HEART NOTES', base: 'BASE NOTES', title: 'FRAGRANCE NOTES' },
      story: 'OUR STORY',
    }
  }
  return {
    usage: 'KULLANIM',
    warnings: 'UYARI',
    ingredients: 'İÇİNDEKİLER',
    storage: 'SAKLAMA KOŞULLARI',
    nutrition: 'Besin Değerleri (100 g için)',
    producer: 'ÜRETİCİ',
    address: 'ADRES',
    notes: { top: 'TEPE NOTALAR', heart: 'KALP NOTALAR', base: 'DİP NOTALAR', title: 'KOKU PİRAMİDİ' },
    story: 'HİKÂYEMİZ',
  }
}

export function isGenericCta(text: string): boolean {
  return /^(üretime\s*al|send to production)$/i.test(text.trim())
}

/** Live canvas `cta`, else a painted fallback. Generic production CTAs are not chips. */
export function liveClaim(copy: { cta?: string }, fallback: string): string {
  const cta = copy.cta?.trim() ?? ''
  if (cta && !isGenericCta(cta)) return cta
  return fallback
}

/** Claim chip on the face: live canvas `cta`, else bank chips. */
export function claimLine(copy: { cta?: string }, chips: readonly string[]): string {
  return liveClaim(copy, chips[1] ?? chips[0] ?? '')
}

/** Back-of-pack directions: live canvas `usage`, else sector sample. */
export function usageCopy(copy: { usage?: string }, sector: SectorId, locale: CopyLocale): string {
  const live = copy.usage?.trim() ?? ''
  return live || usageLine(sector, locale)
}

export function usageLine(sector: SectorId, locale: CopyLocale): string {
  const tr = locale !== 'en'
  switch (sector) {
    case 'perfume':
      return tr ? 'Cilde veya kıyafete 15–20 cm mesafeden püskürtün.' : 'Spray onto skin or clothing from 15–20 cm.'
    case 'cream':
      return tr ? 'Temiz cilde ince bir tabaka uygulayın, nazikçe masaj yapın.' : 'Apply a thin layer to clean skin and massage gently.'
    case 'serum':
      return tr ? 'Temiz cilde 2–3 damla uygulayın; nemlendiriciden önce kullanın.' : 'Apply 2–3 drops to clean skin before moisturiser.'
    case 'food':
      return tr ? 'Serin ve kuru yerde, doğrudan güneş ışığından uzakta saklayın.' : 'Store in a cool, dry place away from direct sunlight.'
    case 'beverage':
      return tr ? 'Açtıktan sonra buzdolabında saklayın, 3 gün içinde tüketin.' : 'Refrigerate after opening and consume within 3 days.'
    case 'health':
      return tr ? 'Günde 1 kapsül, yemekle birlikte bol su ile alın.' : 'Take 1 capsule daily with a meal and plenty of water.'
    case 'baby':
      return tr ? 'Islak cilde uygulayın, köpürtün ve bol su ile durulayın.' : 'Apply to wet skin, lather and rinse with plenty of water.'
    case 'electronics':
      return tr ? 'İlk kullanımdan önce cihazı tam şarj edin. Kılavuzu okuyun.' : 'Fully charge before first use. Read the manual.'
    case 'cleaning':
      return tr ? 'Yüzeye püskürtün, 30 saniye bekleyin ve nemli bezle silin.' : 'Spray on surface, wait 30 seconds and wipe with a damp cloth.'
    default:
      return tr ? 'Kullanım için ürün kılavuzuna bakın.' : 'See the product guide for use.'
  }
}

export function nutritionRows(locale: CopyLocale, blob: string): [string, string][] {
  const tr = locale !== 'en'
  if (/\bbal\b|honey/.test(blob)) {
    return [
      [tr ? 'Enerji' : 'Energy', '1360 kJ / 320 kcal'],
      [tr ? 'Yağ' : 'Fat', '0 g'],
      [tr ? 'Karbonhidrat' : 'Carbohydrate', '80 g'],
      [tr ? 'Şeker' : 'Sugars', '80 g'],
      [tr ? 'Protein' : 'Protein', '0,3 g'],
      [tr ? 'Tuz' : 'Salt', '0 g'],
    ]
  }
  if (/zeytin|olive/.test(blob)) {
    return [
      [tr ? 'Enerji' : 'Energy', '3700 kJ / 900 kcal'],
      [tr ? 'Yağ' : 'Fat', '100 g'],
      [tr ? 'Doymuş yağ' : 'Saturates', '14 g'],
      [tr ? 'Karbonhidrat' : 'Carbohydrate', '0 g'],
      [tr ? 'Protein' : 'Protein', '0 g'],
      [tr ? 'Tuz' : 'Salt', '0 g'],
    ]
  }
  if (/kahve|coffee/.test(blob)) {
    return [
      [tr ? 'Enerji' : 'Energy', '2 kJ / 1 kcal'],
      [tr ? 'Yağ' : 'Fat', '0 g'],
      [tr ? 'Karbonhidrat' : 'Carbohydrate', '0 g'],
      [tr ? 'Protein' : 'Protein', '0,1 g'],
      [tr ? 'Tuz' : 'Salt', '0 g'],
    ]
  }
  return [
    [tr ? 'Enerji' : 'Energy', '— kJ / — kcal'],
    [tr ? 'Yağ' : 'Fat', '— g'],
    [tr ? 'Karbonhidrat' : 'Carbohydrate', '— g'],
    [tr ? 'Protein' : 'Protein', '— g'],
    [tr ? 'Tuz' : 'Salt', '— g'],
  ]
}

/** Scent pyramid from brief.scentNotes ("bergamot / rose / amber") or a sample. */
export function scentPyramid(brief: Pick<DesignBrief, 'scentNotes'>): { top: string[]; heart: string[]; base: string[] } | null {
  const raw = (brief.scentNotes ?? '').trim()
  if (/^none$/i.test(raw)) return null
  if (raw) {
    const groups = raw.split(/\s*[/|;]\s*/).map((g) => g.split(/\s*,\s*|\s+\+\s+/).filter(Boolean))
    return {
      top: groups[0] ?? ['Bergamot'],
      heart: groups[1] ?? ['Iris'],
      base: groups[2] ?? ['Amber'],
    }
  }
  return { top: ['Bergamot', 'Black Pepper'], heart: ['Lavender', 'Iris', 'Cedarwood'], base: ['Amber', 'Patchouli', 'Musk'] }
}
