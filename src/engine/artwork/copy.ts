import type { DesignBrief } from '../../types'
import { categoryFor } from '../designSystem/kits'
import { resolveSector, sectorBlob } from '../designSystem/sector'
import { resolveMarkRecipe } from '../marks/MarkMatrix'

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
        ? `${markWarn} Işıktan koruyun.`
        : `${markWarn} Alerjen: gluten, süt.`,
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
      ingredients: 'Örnek formülasyon satırı — düzenlenebilir. GHS uydurulmadı.',
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
