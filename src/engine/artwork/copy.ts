import type { DesignBrief } from '../../types'
import { languageId } from './languages'

export function monogram(brand: string): string {
  const parts = brand.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'F'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function categoryLine(brief: DesignBrief): string {
  const blob = `${brief.subProduct} ${brief.productName} ${brief.sector}`.toLocaleLowerCase('tr')
  if (/parfüm|perfume|eau de|edp/.test(blob)) return 'EAU DE PARFUM'
  if (/kolonya/.test(blob)) return 'EAU DE COLOGNE'
  if (/serum/.test(blob)) return 'CONCENTRATE SERUM'
  if (/krem|cream/.test(blob)) return 'FACE CREAM'
  if (/zeytin|yağ/.test(blob)) return 'EXTRA VIRGIN'
  if (/atıştırmalık|çikolata|kurabiye/.test(blob)) return 'NET WEIGHT'
  if (/gıda/.test(blob)) return 'ARTISAN FOOD'
  if (/kulaklık|earbuds/.test(blob)) return 'WIRELESS AUDIO'
  if (/kablo|şarj/.test(blob)) return 'POWER ACCESSORY'
  if (/elektronik|teknoloji/.test(blob)) return 'PRECISION SERIES'
  return ''
}

export function sampleCopy(brief: DesignBrief): {
  tagline: string
  volume: string
  ingredients: string
  warnings: string
  cta: string
} {
  const lang = languageId(brief)
  const sub = `${brief.subProduct} ${brief.productName}`.toLocaleLowerCase('tr')
  const custom = brief.copyOverrides.trim()

  if (lang === 'perfume-luxury') {
    return {
      tagline: custom || 'Sessiz bir yoğunluk.',
      volume: brief.volume || '50 ml',
      ingredients: 'Alcohol Denat., Parfum (Fragrance), Aqua (Water), Linalool, Limonene, Coumarin, Citronellol, Geraniol.',
      warnings: 'Alev alabilir. Gözle temasından kaçının. Ciltte tahriş yaparsa kullanımı bırakın. Çocukların ulaşamayacağı yerde saklayın. 12M.',
      cta: 'Üretime al',
    }
  }
  if (/serum/.test(sub)) {
    return {
      tagline: custom || 'Tek damla. Net sonuç.',
      volume: brief.volume || '30 ml',
      ingredients: 'Aqua, Propanediol, Niacinamide, Sodium Hyaluronate, Panthenol, Tocopherol, Glycerin. pH 5.5.',
      warnings: 'Sabah ve akşam 2–3 damla. Güneş koruyucu kullanın. Göz çevresine sürmeyin. 12M.',
      cta: 'Üretime al',
    }
  }
  if (/krem|cream/.test(sub) || lang === 'cosmetics-soft') {
    return {
      tagline: custom || 'Gece boyunca onarır.',
      volume: brief.volume || '50 ml',
      ingredients: 'Aqua, Butyrospermum Parkii, Glycerin, Cetearyl Alcohol, Niacinamide, Ceramide NP, Tocopherol, Sodium Hyaluronate.',
      warnings: 'Temiz cilde uygulayın. Gözle temasından kaçının. Tahrişte bırakın. Çocuklardan uzak tutun. 12M.',
      cta: 'Üretime al',
    }
  }
  if (lang === 'food-harvest') {
    const oil = /yağ|zeytin/.test(sub)
    return {
      tagline: custom || (oil ? 'Soğuk sıkım. Tek bahçe.' : 'Fırından, olduğu gibi.'),
      volume: brief.volume || (oil ? '500 ml' : '180 g'),
      ingredients: oil
        ? 'Soğuk sıkım sızma zeytinyağı. Menşei: Ege. Asit ≤ 0,8%.'
        : 'Buğday unu, tereyağı, kakao kitlesi, deniz tuzu. Alerjen: gluten, süt.',
      warnings: oil
        ? 'Serin, karanlık yerde saklayın. Işıktan koruyun. Best before pakette.'
        : 'Serin ve kuru yerde saklayın. Alerjen bilgisi yukarıdadır.',
      cta: 'Üretime al',
    }
  }
  if (lang === 'electronics-precision') {
    return {
      tagline: custom || 'Kesin. Sessiz. Kalıcı.',
      volume: brief.volume || '',
      ingredients: 'Input 5V ⎓ 1A · Bluetooth 5.3 · IPX4 · 18h playback. Designed for daily carry.',
      warnings: 'WEEE: elektronik atık olarak ayırın. Lityum pili evsel atığa atmayın. Nemden koruyun.',
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
