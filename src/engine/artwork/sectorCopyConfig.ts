/**
 * Sector copy templates — data-driven default copy for each sector.
 * Extracted from copy.ts sampleCopy().
 * Sub-product-specific copy uses a matcher function.
 */
import type { CopyLocale } from '../../types'
import type { SectorId } from '../designSystem/types'

export type SectorCopyTemplate = {
  sector: SectorId
  tagline: string
  volume: string
  ingredients: string
  /** Extra warnings appended after mark warnings. */
  extraWarnings: string
  cta: string
}

/** Sub-product-specific override: returns partial template if matcher hits. */
export type SubProductOverride = {
  /** Returns true if this override applies. */
  match: (sub: string) => boolean
  /** Partial template fields to override. */
  override: Partial<SectorCopyTemplate>
}

export const SUB_PRODUCT_OVERRIDES: SubProductOverride[] = [
  {
    match: (sub) => /yağ|zeytin/.test(sub) && !/reçel|jam/.test(sub),
    override: {
      tagline: 'Soğuk sıkım. Tek bahçe.',
      volume: '500 ml',
      ingredients: '100% soğuk sıkım sızma zeytinyağı. Menşei: Ege, TR. Asit ≤ 0,8%. Lot / SKT kapakta.',
      extraWarnings: 'Işıktan koruyun. Serin ve karanlık saklayın.',
    },
  },
  {
    match: (sub) => /\bbal\b|honey|çiçek bal/.test(sub),
    override: {
      tagline: 'Dağ çiçeği. Saf damla.',
      volume: '340 g',
      ingredients: 'Çiçek balı. Alerjen: yok (örnek). Üretim yeri: TR.',
      extraWarnings: 'Alerjen: yok (örnek). Serin ve kuru yerde saklayın.',
    },
  },
  {
    match: (sub) => /reçel|jam|preserve/.test(sub),
    override: {
      tagline: 'Bahçeden kavanoza.',
      volume: '300 g',
      ingredients: 'Meyve, şeker. Alerjen: yok (örnek).',
      extraWarnings: 'Alerjen: yok (örnek). Açıldıktan sonra buzdolabında saklayın.',
    },
  },
  {
    match: (sub) => /çay|tea|adaçayı/.test(sub),
    override: {
      tagline: 'Demlikte sakin.',
      volume: '100 g',
      ingredients: 'Adaçayı yaprağı. Alerjen: yok (örnek).',
      extraWarnings: 'Alerjen: yok (örnek). Kuru ve ışıksız saklayın.',
    },
  },
  {
    match: (sub) => /çikolata|cacao|chocolate|kakao/.test(sub),
    override: {
      tagline: 'Kakaodan gelen yoğunluk.',
      volume: '80 g',
      ingredients: 'Kakao kitlesi, kakao yağı, şeker. Alerjen: süt olabilir (örnek).',
      extraWarnings: 'Alerjen: süt olabilir (örnek). Serin ve kuru yerde saklayın.',
    },
  },
  {
    match: (sub) => /kurabiye|biscuit|cookie/.test(sub),
    override: {
      tagline: 'Fırından, olduğu gibi.',
      volume: '180 g',
      ingredients: 'Buğday unu, tereyağı, kakao kitlesi, deniz tuzu. Alerjen: gluten, süt. Üretim yeri: TR.',
      extraWarnings: 'Alerjen: gluten, süt. Serin ve kuru yerde saklayın.',
    },
  },
  {
    match: (sub) => /kulaklık|earbuds|audio/i.test(sub),
    override: {
      tagline: 'Sessiz sahne. Gün boyu.',
      ingredients: 'BT 5.3 · 18h + case 24h · IPX4 · 5V⎓1A · 42g. Driver 10mm.',
    },
  },
]

export const SUB_PRODUCT_OVERRIDES_EN: SubProductOverride[] = [
  {
    match: (sub) => /yağ|zeytin|olive/.test(sub) && !/reçel|jam/.test(sub) || /olive oil/.test(sub),
    override: {
      tagline: 'Cold pressed. Single grove.',
      volume: '500 ml',
      ingredients: '100% cold-pressed extra virgin olive oil. Origin: Aegean, TR. Acidity ≤ 0.8%. Lot / EXP on cap.',
      extraWarnings: 'Protect from light. Store cool and dark.',
    },
  },
  {
    match: (sub) => /\bbal\b|honey|çiçek bal/.test(sub),
    override: {
      tagline: 'Mountain flower. A clean drop.',
      volume: '340 g',
      ingredients: 'Blossom honey. Allergen: none (sample). Made in TR.',
      extraWarnings: 'Allergen: none (sample). Store cool and dry.',
    },
  },
  {
    match: (sub) => /reçel|jam|preserve/.test(sub),
    override: {
      tagline: 'From garden to jar.',
      volume: '300 g',
      ingredients: 'Fruit, sugar. Allergen: none (sample).',
      extraWarnings: 'Allergen: none (sample). Refrigerate after opening.',
    },
  },
  {
    match: (sub) => /çay|tea|adaçayı/.test(sub),
    override: {
      tagline: 'Quiet in the pot.',
      volume: '100 g',
      ingredients: 'Sage leaf. Allergen: none (sample).',
      extraWarnings: 'Allergen: none (sample). Store dry and away from light.',
    },
  },
  {
    match: (sub) => /çikolata|cacao|chocolate|kakao/.test(sub),
    override: {
      tagline: 'Density from cacao.',
      volume: '80 g',
      ingredients: 'Cocoa mass, cocoa butter, sugar. Allergen: may contain milk (sample).',
      extraWarnings: 'Allergen: may contain milk (sample). Store cool and dry.',
    },
  },
  {
    match: (sub) => /kurabiye|biscuit|cookie/.test(sub),
    override: {
      tagline: 'From the oven, as it is.',
      volume: '180 g',
      ingredients: 'Wheat flour, butter, cocoa mass, sea salt. Allergen: gluten, milk. Made in TR.',
      extraWarnings: 'Allergen: gluten, milk. Store cool and dry.',
    },
  },
  {
    match: (sub) => /kulaklık|earbuds|audio/i.test(sub),
    override: {
      tagline: 'Quiet stage. All day.',
      ingredients: 'BT 5.3 · 18h + case 24h · IPX4 · 5V⎓1A · 42g. Driver 10mm.',
    },
  },
]

export const SECTOR_COPY: Record<SectorId, SectorCopyTemplate> = {
  perfume: {
    sector: 'perfume',
    tagline: 'Sessiz bir yoğunluk.',
    volume: '50 ml',
    ingredients: 'Alcohol Denat., Parfum (Fragrance), Aqua (Water), Linalool, Limonene, Coumarin, Citronellol, Geraniol. Örnek / düzenlenebilir.',
    extraWarnings: '',
    cta: 'Üretime al',
  },
  serum: {
    sector: 'serum',
    tagline: 'Tek damla. Net parlama.',
    volume: '30 ml',
    ingredients: 'Aqua, Propanediol, Niacinamide, Sodium Hyaluronate, Panthenol, Tocopherol, Glycerin. pH 5.5.',
    extraWarnings: '',
    cta: 'Üretime al',
  },
  cream: {
    sector: 'cream',
    tagline: 'Gece boyunca onarır.',
    volume: '50 ml',
    ingredients: 'Aqua, Butyrospermum Parkii, Glycerin, Cetearyl Alcohol, Niacinamide, Ceramide NP, Tocopherol, Sodium Hyaluronate.',
    extraWarnings: '',
    cta: 'Üretime al',
  },
  food: {
    sector: 'food',
    tagline: 'Masada duran lezzet.',
    volume: '200 g',
    ingredients: 'İçerik listesi brief ile doğrulanmalıdır. Örnek / düzenlenebilir.',
    extraWarnings: 'Serin ve kuru yerde saklayın. Örnek alerjen satırı brief ile doğrulanmalıdır.',
    cta: 'Üretime al',
  },
  beverage: {
    sector: 'beverage',
    tagline: 'Taze tat. Net içerik.',
    volume: '330 ml',
    ingredients: 'Su, doğal aroma, meyve özü. Besin değerleri ve içerik örnek / düzenlenebilir.',
    extraWarnings: 'Serin yerde saklayın. Açıldıktan sonra soğuk tüketin.',
    cta: 'Üretime al',
  },
  health: {
    sector: 'health',
    tagline: 'Günlük rutine net destek.',
    volume: '30 kapsül',
    ingredients: 'Aktif bileşenler ve günlük porsiyon değerleri brief ile doğrulanmalıdır.',
    extraWarnings: 'Takviye edici gıdadır; ilaç değildir. Önerilen günlük porsiyonu aşmayın.',
    cta: 'Üretime al',
  },
  baby: {
    sector: 'baby',
    tagline: 'Hassas bakım. Yumuşak dokunuş.',
    volume: '200 ml',
    ingredients: 'Nazik bakım formülü. İçerik listesi üretici verisiyle doğrulanmalıdır.',
    extraWarnings: 'Yalnız harici kullanım içindir. Çocukların erişemeyeceği yerde saklayın.',
    cta: 'Üretime al',
  },
  electronics: {
    sector: 'electronics',
    tagline: 'Kesin. Sessiz. Kalıcı.',
    volume: '',
    ingredients: 'Input 5V⎓1A · cable 1.2m · 480Mbps. Housing: recycled ABS.',
    extraWarnings: '',
    cta: 'Üretime al',
  },
  cleaning: {
    sector: 'cleaning',
    tagline: 'Temiz yüzey. Ferah nefes.',
    volume: '750 ml',
    ingredients: 'Yüzey temizleyici. Örnek formülasyon — GHS piktogramı uydurulmadı.',
    extraWarnings: '',
    cta: 'Üretime al',
  },
  generic: {
    sector: 'generic',
    tagline: 'Yüzeyde duran karakter.',
    volume: '100 g',
    ingredients: 'İçerik satırı brief’ten gelecek.',
    extraWarnings: '',
    cta: 'Üretime al',
  },
}

export const SECTOR_COPY_EN: Record<SectorId, SectorCopyTemplate> = {
  perfume: {
    sector: 'perfume',
    tagline: 'A quiet intensity.',
    volume: '50 ml',
    ingredients: 'Alcohol Denat., Parfum (Fragrance), Aqua (Water), Linalool, Limonene, Coumarin, Citronellol, Geraniol. Sample / editable.',
    extraWarnings: '',
    cta: 'Send to production',
  },
  serum: {
    sector: 'serum',
    tagline: 'One drop. Clear glow.',
    volume: '30 ml',
    ingredients: 'Aqua, Propanediol, Niacinamide, Sodium Hyaluronate, Panthenol, Tocopherol, Glycerin. pH 5.5.',
    extraWarnings: '',
    cta: 'Send to production',
  },
  cream: {
    sector: 'cream',
    tagline: 'Repairs overnight.',
    volume: '50 ml',
    ingredients: 'Aqua, Butyrospermum Parkii, Glycerin, Cetearyl Alcohol, Niacinamide, Ceramide NP, Tocopherol, Sodium Hyaluronate.',
    extraWarnings: '',
    cta: 'Send to production',
  },
  food: {
    sector: 'food',
    tagline: 'Flavour that holds the table.',
    volume: '200 g',
    ingredients: 'Ingredient list must be confirmed from the brief. Sample / editable.',
    extraWarnings: 'Store cool and dry. Sample allergen line must be confirmed from the brief.',
    cta: 'Send to production',
  },
  beverage: {
    sector: 'beverage',
    tagline: 'Fresh taste. Clear contents.',
    volume: '330 ml',
    ingredients: 'Water, natural flavour, fruit extract. Nutrition and ingredients sample / editable.',
    extraWarnings: 'Store cool. Refrigerate after opening.',
    cta: 'Send to production',
  },
  health: {
    sector: 'health',
    tagline: 'Clear support for a daily routine.',
    volume: '30 kapsül',
    ingredients: 'Actives and daily serving must be confirmed from the brief.',
    extraWarnings: 'Food supplement, not a medicine. Do not exceed the recommended daily serving.',
    cta: 'Send to production',
  },
  baby: {
    sector: 'baby',
    tagline: 'Sensitive care. Soft touch.',
    volume: '200 ml',
    ingredients: 'Gentle care formula. Ingredient list must be confirmed by the manufacturer.',
    extraWarnings: 'For external use only. Keep out of reach of children.',
    cta: 'Send to production',
  },
  electronics: {
    sector: 'electronics',
    tagline: 'Precise. Quiet. Lasting.',
    volume: '',
    ingredients: 'Input 5V⎓1A · cable 1.2m · 480Mbps. Housing: recycled ABS.',
    extraWarnings: '',
    cta: 'Send to production',
  },
  cleaning: {
    sector: 'cleaning',
    tagline: 'Clean surface. Fresh air.',
    volume: '750 ml',
    ingredients: 'Surface cleaner. Sample formula — no invented GHS pictogram.',
    extraWarnings: '',
    cta: 'Send to production',
  },
  generic: {
    sector: 'generic',
    tagline: 'Character that holds the surface.',
    volume: '100 g',
    ingredients: 'Ingredient line will come from the brief.',
    extraWarnings: '',
    cta: 'Send to production',
  },
}

/** Resolve copy template for a sector + sub-product blob. */
export function resolveSectorCopy(sector: SectorId, sub: string, locale: CopyLocale = 'tr'): SectorCopyTemplate {
  const table = locale === 'en' ? SECTOR_COPY_EN : SECTOR_COPY
  const overrides = locale === 'en' ? SUB_PRODUCT_OVERRIDES_EN : SUB_PRODUCT_OVERRIDES
  const base = table[sector] ?? table.generic
  for (const ov of overrides) {
    if (ov.match(sub)) {
      return { ...base, ...ov.override }
    }
  }
  return base
}
