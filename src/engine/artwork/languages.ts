import type { DesignBrief, Palette, StyleType } from '../../types'

export type LanguageId = 'perfume-luxury' | 'cosmetics-soft' | 'food-harvest' | 'electronics-precision' | 'neutral'

export type StyleProfile = {
  ornament: number
  tracking: number
  frame: 0 | 1 | 2 | 3
  serif: boolean
  goldBar: boolean
  corners: boolean
  density: 'sparse' | 'balanced' | 'dense'
}

export function languageId(brief: DesignBrief): LanguageId {
  const blob = `${brief.sector} ${brief.subProduct} ${brief.productName}`.toLocaleLowerCase('tr')
  if (/parfüm|parfum|perfume|eau de|edp|kolonya/.test(blob)) return 'perfume-luxury'
  if (/elektronik|teknoloji|kulaklık|kablo|cihaz|earbuds/.test(blob)) return 'electronics-precision'
  if (/gıda|yağ|çay|atıştırmalık|reçel|bal|çikolata|zeytin/.test(blob)) return 'food-harvest'
  if (/kozmetik|krem|serum|cream/.test(blob)) return 'cosmetics-soft'
  return 'neutral'
}

export function paletteFor(brief: DesignBrief, style: StyleType, _premium: boolean): Palette {
  const lang = languageId(brief)
  const words = brief.colors.toLocaleLowerCase('tr')
  const wantGold = /altın|gold/.test(words)
  const wantBlack = /siyah|black/.test(words)

  if (style === 'luxury') {
    if (lang === 'food-harvest') {
      return { bg: '#1a120c', fg: '#f3e6c8', accent: '#c4a15a', muted: '#9a7d52', paper: '#24180f' }
    }
    if (lang === 'electronics-precision') {
      return { bg: '#08090b', fg: '#ece8e1', accent: '#b7a48a', muted: '#7a7468', paper: '#101114' }
    }
    if (lang === 'cosmetics-soft') {
      return { bg: '#0c0a0b', fg: '#f6eee8', accent: '#c9a090', muted: '#8a7068', paper: '#161214' }
    }
    return {
      bg: wantBlack ? '#050505' : '#070707',
      fg: '#f4efe6',
      accent: wantGold ? '#d4b56a' : '#c9a86c',
      muted: '#8a7a5c',
      paper: '#101010',
    }
  }

  if (style === 'modern') {
    if (lang === 'food-harvest') {
      return { bg: '#16120e', fg: '#f2eee8', accent: '#d26a3a', muted: '#8a7a6c', paper: '#1c1814' }
    }
    return { bg: '#101318', fg: '#eef2f6', accent: '#9aa8b4', muted: '#6d7884', paper: '#161a20' }
  }

  if (style === 'minimal') {
    return { bg: '#0b0b0b', fg: '#f7f7f7', accent: '#f7f7f7', muted: '#7a7a7a', paper: '#111111' }
  }

  if (style === 'eco') {
    return { bg: '#c4b396', fg: '#2a2418', accent: '#3f4a32', muted: '#5c5344', paper: '#b6a686' }
  }

  if (style === 'playful') {
    return { bg: '#1c1218', fg: '#fff6ea', accent: '#e59a4a', muted: '#c4a090', paper: '#261820' }
  }

  // classic
  if (lang === 'food-harvest') {
    return { bg: '#2a1c12', fg: '#f6ecd4', accent: '#c45c38', muted: '#a08058', paper: '#1e140c' }
  }
  return { bg: '#14110e', fg: '#f0e6d4', accent: '#8b3d3d', muted: '#8a7460', paper: '#1a1612' }
}

export function styleProfile(style: StyleType): StyleProfile {
  switch (style) {
    case 'luxury':
      return { ornament: 1, tracking: 6.4, frame: 3, serif: true, goldBar: true, corners: true, density: 'dense' }
    case 'classic':
      return { ornament: 0.8, tracking: 5.2, frame: 2, serif: true, goldBar: true, corners: true, density: 'balanced' }
    case 'modern':
      return { ornament: 0.3, tracking: 2.8, frame: 1, serif: false, goldBar: false, corners: false, density: 'balanced' }
    case 'minimal':
      return { ornament: 0, tracking: 5.6, frame: 0, serif: false, goldBar: false, corners: false, density: 'sparse' }
    case 'eco':
      return { ornament: 0.5, tracking: 3.2, frame: 1, serif: true, goldBar: false, corners: false, density: 'balanced' }
    case 'playful':
      return { ornament: 0.6, tracking: 1.8, frame: 1, serif: false, goldBar: true, corners: false, density: 'dense' }
    default:
      return { ornament: 0.4, tracking: 4, frame: 1, serif: true, goldBar: false, corners: false, density: 'balanced' }
  }
}

export function styleWeight(style: StyleType): { ornament: number; tracking: number; frame: number; serif: boolean } {
  const p = styleProfile(style)
  return { ornament: p.ornament, tracking: p.tracking, frame: p.frame, serif: p.serif }
}
