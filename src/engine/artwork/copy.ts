import type { DesignBrief } from '../../types'
import { categoryFor } from '../designSystem/kits'
import { resolveSector, sectorBlob } from '../designSystem/sector'
import type { SectorId } from '../designSystem/types'
import { isGenericProductName, sameName } from '../extract'
import { paoMonthsFromBrief, resolveMarkRecipe } from '../marks/MarkMatrix'

export function resolveProductLine(brief: DesignBrief, fallback = ''): string {
  const raw = (fallback || brief.productName).trim()
  if (!raw || isGenericProductName(raw) || /^untitled$/i.test(raw)) return ''
  if (sameName(raw, brief.brandName)) return ''
  return raw
}

export function frontSpecLine(ingredients: string): string {
  const first = ingredients.split(/[·.|]/)[0]?.trim() ?? ''
  return first.length > 42 ? `${first.slice(0, 40)}…` : first
}

export type BackFillBlock = { title: string; lines: string[] }

export function monogram(brand: string): string {
  const parts = brand.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'F'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function categoryLine(brief: DesignBrief): string {
  return categoryFor(resolveSector(brief), sectorBlob(brief))
}

export function sampleCopy(brief: DesignBrief): {
  tagline: string
  volume: string
  ingredients: string
  warnings: string
  cta: string
} {
  const sector = resolveSector(brief)
  const sub = `${brief.subProduct} ${brief.productName}`.toLocaleLowerCase('tr')
  const custom = brief.copyOverrides.trim()
  const surface = brief.packagingMode === 'label' ? 'label' : 'box'
  const markWarn = resolveMarkRecipe(sector, surface).requiredTextWarnings.join(' ')

  if (sector === 'perfume') {
    return {
      tagline: custom || 'Sessiz bir yoğunluk.',
      volume: brief.volume || '50 ml',
      ingredients: 'Alcohol Denat., Parfum (Fragrance), Aqua (Water), Linalool, Limonene, Coumarin, Citronellol, Geraniol. Örnek / düzenlenebilir.',
      warnings: markWarn,
      cta: 'Üretime al',
    }
  }
  if (sector === 'serum' || /serum/.test(sub)) {
    return {
      tagline: custom || 'Tek damla. Net sonuç.',
      volume: brief.volume || '30 ml',
      ingredients: 'Aqua, Propanediol, Niacinamide, Sodium Hyaluronate, Panthenol, Tocopherol, Glycerin. pH 5.5.',
      warnings: markWarn,
      cta: 'Üretime al',
    }
  }
  if (sector === 'cream' || /krem|cream/.test(sub)) {
    return {
      tagline: custom || 'Gece boyunca onarır.',
      volume: brief.volume || '50 ml',
      ingredients: 'Aqua, Butyrospermum Parkii, Glycerin, Cetearyl Alcohol, Niacinamide, Ceramide NP, Tocopherol, Sodium Hyaluronate.',
      warnings: markWarn,
      cta: 'Üretime al',
    }
  }
  if (sector === 'food') {
    const oil = /yağ|zeytin/.test(sub)
    return {
      tagline: custom || (oil ? 'Soğuk sıkım. Tek bahçe.' : 'Fırından, olduğu gibi.'),
      volume: brief.volume || (oil ? '500 ml' : '180 g'),
      ingredients: oil
        ? '100% soğuk sıkım sızma zeytinyağı. Menşei: Ege, TR. Asit ≤ 0,8%. Lot / SKT kapakta.'
        : 'Buğday unu, tereyağı, kakao kitlesi, deniz tuzu. Alerjen: gluten, süt. Üretim yeri: TR.',
      warnings: oil
        ? `${markWarn} Işıktan koruyun. Serin ve karanlık saklayın.`
        : `${markWarn} Alerjen: gluten, süt. Serin ve kuru yerde saklayın.`,
      cta: 'Üretime al',
    }
  }
  if (sector === 'electronics') {
    const buds = /kulaklık|earbuds|audio/i.test(sub)
    return {
      tagline: custom || (buds ? 'Sessiz sahne. Gün boyu.' : 'Kesin. Sessiz. Kalıcı.'),
      volume: brief.volume || '',
      ingredients: buds
        ? 'BT 5.3 · 18h + case 24h · IPX4 · 5V⎓1A · 42g. Driver 10mm.'
        : 'Input 5V⎓1A · cable 1.2m · 480Mbps. Housing: recycled ABS.',
      warnings: markWarn,
      cta: 'Üretime al',
    }
  }
  if (sector === 'cleaning') {
    return {
      tagline: custom || 'Temiz yüzey. Net sonuç.',
      volume: brief.volume || '750 ml',
      ingredients: 'Yüzey temizleyici. Örnek formülasyon — GHS piktogramı uydurulmadı.',
      warnings: markWarn,
      cta: 'Üretime al',
    }
  }
  return {
    tagline: custom || 'Yüzeyde duran karakter.',
    volume: brief.volume || '100 g',
    ingredients: 'İçerik satırı brief’ten gelecek.',
    warnings: 'Üretici talimatlarına uyun.',
    cta: 'Üretime al',
  }
}

/** Kutu sırtı: 01/02 altındaki boşluğu sektör + ürüne göre doldurur. */
export function backFill(brief: DesignBrief, volume: string): { blocks: BackFillBlock[]; seal: string } {
  const sector = resolveSector(brief)
  const blob = sectorBlob(brief)
  const vol = volume || brief.volume
  const months = paoMonthsFromBrief(brief, sector === 'perfume' ? '36M' : '12M')
  return { blocks: fillBlocks(sector, blob, vol, months), seal: fillSeal(sector, blob, vol, months) }
}

function fillBlocks(sector: SectorId, blob: string, vol: string, months: string): BackFillBlock[] {
  if (sector === 'perfume') {
    const cologne = /kolonya/.test(blob)
    return [
      {
        title: cologne ? 'ORIGIN · FORMULA' : 'ORIGIN · LOT',
        lines: cologne
          ? ['Üretim: TR (örnek).', 'Alkol bazlı formül.', 'Lot / parti: iç kanat.', 'Oda sıcaklığında saklayın.']
          : ['Made in TR · örnek parti.', 'Lot no. iç kanatta.', 'Dikey saklayın. 15–25°C.', 'Işıktan ve nemden koruyun.'],
      },
      {
        title: cologne ? 'USE' : 'ALCOHOL · STORE',
        lines: cologne
          ? ['Cilde sürün, ovalamayın.', vol ? `Net ${vol}.` : 'Net hacim ön yüzde.', 'Gözle temasından kaçının.']
          : ['Alcohol Denat. ağırlıklı.', vol ? `Net ${vol}.` : 'Net hacim ön yüzde.', 'Alevden ve ısıdan uzak tutun.'],
      },
    ]
  }
  if (sector === 'serum') {
    return [
      {
        title: 'HOW TO USE',
        lines: ['2–3 damla, sabah ve akşam.', 'Temiz cilde, nemlendiriciden önce.', 'Gözle doğrudan temastan kaçının.'],
      },
      {
        title: 'PAO · STORE',
        lines: [`Açıldıktan sonra ${months.replace('M', '')} ay.`, '5–25°C, ışıktan uzak.', vol ? `Net ${vol}.` : 'Net hacim ön yüzde.'],
      },
    ]
  }
  if (sector === 'cream') {
    return [
      {
        title: 'HOW TO USE',
        lines: ['Temiz cilde, gece uygulayın.', 'İnce tabaka halinde yayın.', 'Tahrişte kullanımı bırakın.'],
      },
      {
        title: 'PAO · STORE',
        lines: [`Açıldıktan sonra ${months.replace('M', '')} ay.`, '5–25°C, güneşten uzak.', vol ? `Net ${vol}.` : 'Net hacim ön yüzde.'],
      },
    ]
  }
  if (sector === 'food') {
    const oil = /yağ|zeytin/.test(blob)
    return oil
      ? [
          {
            title: 'HARVEST · TRACE',
            lines: ['Soğuk sıkım. Tek bahçe.', 'Asit ≤ 0,8%. Hasat yılı örnek.', 'Lot / SKT kapakta veya yakada.'],
          },
          {
            title: 'STORE',
            lines: ['Serin ve karanlık. 10–18°C.', 'Açıldıktan sonra 3 ay içinde.', vol ? `Net ${vol}.` : 'Net hacim ön yüzde.'],
          },
        ]
      : [
          {
            title: 'NET · TRACE',
            lines: [vol ? `Net ${vol}.` : 'Net ağırlık ön yüzde.', 'Lot / SKT ambalaj üzeri.', 'Üretim yeri: TR (örnek).'],
          },
          {
            title: 'STORE',
            lines: ['Serin, kuru yerde saklayın.', 'Alerjen bilgisi üst blokta.', 'Açıldıktan sonra tüketiniz.'],
          },
        ]
  }
  if (sector === 'electronics') {
    const buds = /kulaklık|earbuds|audio/i.test(blob)
    return [
      {
        title: 'COMPLIANCE',
        lines: buds
          ? ['CE (örnek işaret) · RoHS.', 'WEEE: ayrı toplama.', 'IP ve batarya değerleri üstte.']
          : ['CE (örnek işaret) · RoHS.', 'WEEE: ayrı toplama.', 'Yalnız belirtilen giriş gerilimi.'],
      },
      {
        title: 'SUPPORT',
        lines: ['24 ay garanti (örnek).', 'Yetkili servis ağı: TR.', buds ? 'Kılıf ile birlikte saklayın.' : 'Kabloyu zorlamayın / bükmayın.'],
      },
    ]
  }
  if (sector === 'cleaning') {
    return [
      {
        title: 'USE',
        lines: ['Kullanmadan önce etiketi okuyun.', 'Havalandırın. Eldiven önerilir.', 'Başka kimyasallarla karıştırmayın.'],
      },
      {
        title: 'STORE',
        lines: ['Çocuklardan uzak, kilitli.', 'Dondurmayın. Oda sıcaklığı.', vol ? `Net ${vol}.` : 'Net hacim ön yüzde.'],
      },
    ]
  }
  return [
    {
      title: 'ORIGIN',
      lines: ['Üretici bilgisi alt bantta.', 'Lot / parti: iç kanat.', vol ? `Net ${vol}.` : ''],
    },
  ]
}

function fillSeal(sector: SectorId, blob: string, vol: string, months: string): string {
  if (sector === 'perfume') return /kolonya/.test(blob) ? 'ALC. · COLOGNE' : `ALC. DENAT. · ${months}`
  if (sector === 'serum') return `CONCENTRATE · ${months}`
  if (sector === 'cream') return `FACE CARE · ${months}`
  if (sector === 'food') return /yağ|zeytin/.test(blob) ? 'COLD PRESSED' : vol ? `NET ${vol.toUpperCase()}` : 'NET WT.'
  if (sector === 'electronics') return /kulaklık|earbuds/.test(blob) ? 'CE · RoHS · AUDIO' : 'CE · RoHS'
  if (sector === 'cleaning') return 'SURFACE CARE'
  return 'FORMA'
}
