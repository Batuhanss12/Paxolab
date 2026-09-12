import type { DesignBrief, Palette, StyleType } from '../../types'

export type LanguageId = 'perfume-luxury' | 'cosmetics-soft' | 'food-harvest' | 'electronics-precision' | 'neutral'

export function languageId(brief: DesignBrief): LanguageId {
  const blob = `${brief.sector} ${brief.subProduct} ${brief.productName}`.toLocaleLowerCase('tr')
  if (/parfüm|parfum|perfume|eau de/.test(blob)) return 'perfume-luxury'
  if (/elektronik|teknoloji|kulaklık|kablo|cihaz/.test(blob)) return 'electronics-precision'
  if (/gıda|yağ|çay|atıştırmalık|reçel|bal|çikolata/.test(blob)) return 'food-harvest'
  if (/kozmetik|krem|serum/.test(blob)) return 'cosmetics-soft'
  return 'neutral'
}

export function paletteFor(brief: DesignBrief, style: StyleType, premium: boolean): Palette {
  const lang = languageId(brief)
  const words = brief.colors.toLocaleLowerCase('tr')
  const userDark = /siyah|black/.test(words)
  const userGold = /altın|gold/.test(words)

  if (style === 'eco') {
    return { bg: '#2a3324', fg: '#f3ead4', accent: '#c4b48a', muted: '#8a8468', paper: '#1b2116' }
  }
  if (style === 'playful') {
    return { bg: '#1a1220', fg: '#fff6ea', accent: '#e59a6b', muted: '#b08a78', paper: '#241820' }
  }
  if (style === 'minimal' && !premium) {
    return { bg: '#0c0c0c', fg: '#f5f5f5', accent: '#f5f5f5', muted: '#7a7a7a', paper: '#141414' }
  }
  if (style === 'modern' && lang === 'electronics-precision') {
    return { bg: '#0a0d12', fg: '#eef3f8', accent: '#8fd0d8', muted: '#6f7d88', paper: '#10151c' }
  }

  if (lang === 'perfume-luxury' || premium || userGold) {
    return { bg: userDark ? '#050505' : '#070707', fg: '#f4efe6', accent: '#c9a86c', muted: '#8a7a5c', paper: '#111111' }
  }
  if (lang === 'food-harvest') {
    return { bg: '#231910', fg: '#f6ecd8', accent: '#d4a05a', muted: '#9a7d55', paper: '#2c2014' }
  }
  if (lang === 'electronics-precision') {
    return { bg: '#0b0e13', fg: '#eef2f6', accent: '#9aa7b4', muted: '#6b7580', paper: '#12171e' }
  }
  if (lang === 'cosmetics-soft') {
    return { bg: '#141012', fg: '#f6ebe6', accent: '#d4a8a0', muted: '#8a706c', paper: '#1a1516' }
  }
  return { bg: '#0a0a0a', fg: '#f4efe6', accent: '#c9a86c', muted: '#7a7468', paper: '#111111' }
}

export function styleWeight(style: StyleType): { ornament: number; tracking: number; frame: number; serif: boolean } {
  switch (style) {
    case 'luxury':
      return { ornament: 1, tracking: 6.2, frame: 2, serif: true }
    case 'classic':
      return { ornament: 0.85, tracking: 5.2, frame: 2, serif: true }
    case 'modern':
      return { ornament: 0.25, tracking: 3.2, frame: 1, serif: false }
    case 'minimal':
      return { ornament: 0, tracking: 4.4, frame: 0, serif: false }
    case 'eco':
      return { ornament: 0.45, tracking: 3.6, frame: 1, serif: true }
    case 'playful':
      return { ornament: 0.55, tracking: 2.4, frame: 1, serif: false }
    default:
      return { ornament: 0.4, tracking: 4, frame: 1, serif: true }
  }
}
