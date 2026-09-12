import type { DesignBrief } from '../../types'
import { languageId } from './languages'

export function monogram(brand: string): string {
  const parts = brand.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'F'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function sampleCopy(brief: DesignBrief): {
  tagline: string
  volume: string
  ingredients: string
  warnings: string
  cta: string
} {
  if (brief.copyOverrides.trim()) {
    return {
      tagline: brief.copyOverrides.trim(),
      volume: brief.volume || defaultVolume(brief),
      ingredients: ingredientsFor(brief),
      warnings: warningsFor(brief),
      cta: 'Üretime al',
    }
  }
  const lang = languageId(brief)
  const sub = `${brief.subProduct} ${brief.productName}`.toLocaleLowerCase('tr')
  if (lang === 'perfume-luxury') {
    return {
      tagline: 'Sessiz bir yoğunluk.',
      volume: brief.volume || '50 ml',
      ingredients: 'Alcohol Denat., Parfum, Aqua, Linalool, Limonene, Coumarin.',
      warnings: 'Alev alabilir. Gözle temasından kaçının. Çocukların ulaşamayacağı yerde saklayın.',
      cta: 'Üretime al',
    }
  }
  if (/krem|cream/.test(sub)) {
    return {
      tagline: 'Gece boyunca onarır.',
      volume: brief.volume || '50 ml',
      ingredients: 'Aqua, Glycerin, Shea Butter, Niacinamide, Tocopherol, Sodium Hyaluronate.',
      warnings: 'Gözle temasından kaçının. Çocukların ulaşamayacağı yerde saklayın.',
      cta: 'Üretime al',
    }
  }
  if (/serum/.test(sub)) {
    return {
      tagline: 'Gece boyunca çalışır.',
      volume: brief.volume || '30 ml',
      ingredients: 'Aqua, Glycerin, Niacinamide, Sodium Hyaluronate, Tocopherol.',
      warnings: 'Gözle temasından kaçının. Çocukların ulaşamayacağı yerde saklayın.',
      cta: 'Üretime al',
    }
  }
  if (lang === 'food-harvest') {
    return {
      tagline: /yağ/.test(sub) ? 'Soğuk sıkım. Tek bahçe.' : 'Fırından, olduğu gibi.',
      volume: brief.volume || (/yağ/.test(sub) ? '250 ml' : '200 g'),
      ingredients: /yağ/.test(sub) ? 'Soğuk sıkım zeytinyağı.' : 'Un, tereyağı, kakao, deniz tuzu.',
      warnings: 'Serin ve kuru yerde saklayın. Alerjen bilgisi etikette.',
      cta: 'Üretime al',
    }
  }
  if (lang === 'electronics-precision') {
    return {
      tagline: 'Kesin. Sessiz. Kalıcı.',
      volume: brief.volume || '',
      ingredients: 'Precision Series · FORMA Engine',
      warnings: 'Elektronik atık olarak ayrıştırın. Nemden koruyun.',
      cta: 'Üretime al',
    }
  }
  return {
    tagline: 'Yüzeyde duran karakter.',
    volume: brief.volume || defaultVolume(brief),
    ingredients: ingredientsFor(brief),
    warnings: warningsFor(brief),
    cta: 'Üretime al',
  }
}

function defaultVolume(brief: DesignBrief): string {
  if (brief.packagingMode === 'label' && /elektronik/.test(brief.sector)) return ''
  return '100 g'
}

function ingredientsFor(brief: DesignBrief): string {
  return brief.volume ? `${brief.volume}` : 'İçerik satırı brief’ten gelecek.'
}

function warningsFor(_brief: DesignBrief): string {
  return 'Üretici talimatlarına uyun.'
}
