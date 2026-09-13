/**
 * Palette table — language ID detection + per-style/sector palette + variation.
 * Extracted from languages.ts to isolate palette data from style/type config.
 */
import type { DesignBrief, Palette, StyleType } from '../../types'

export type LanguageId = 'perfume-luxury' | 'cosmetics-soft' | 'food-harvest' | 'electronics-precision' | 'neutral'

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
      return { bg: '#16100a', fg: '#f4e6c4', accent: '#c9a24e', muted: '#9a7c4a', paper: '#22180e' }
    }
    if (lang === 'electronics-precision') {
      return { bg: '#07080a', fg: '#ece6dc', accent: '#b8a48c', muted: '#7a7368', paper: '#101214' }
    }
    if (lang === 'cosmetics-soft') {
      return { bg: '#0b090a', fg: '#f7efe8', accent: '#c9a090', muted: '#8a7068', paper: '#161214' }
    }
    return {
      bg: wantBlack ? '#040404' : '#060606',
      fg: '#f6f0e4',
      accent: wantGold ? '#d8bc72' : '#c9a86c',
      muted: '#8d7b58',
      paper: '#0c0c0c',
    }
  }

  if (style === 'modern') {
    if (lang === 'food-harvest') {
      return { bg: '#1c1612', fg: '#f3eee6', accent: '#e06a32', muted: '#8a7a6c', paper: '#241c16' }
    }
    if (lang === 'perfume-luxury') {
      return { bg: '#12151c', fg: '#eef2f8', accent: '#c5ccd6', muted: '#7a8490', paper: '#181c24' }
    }
    return { bg: '#10141a', fg: '#eef3f8', accent: '#7ec8d4', muted: '#6d7a86', paper: '#161b22' }
  }

  if (style === 'minimal') {
    if (lang === 'food-harvest') {
      return { bg: '#f3eee4', fg: '#2a241c', accent: '#2a241c', muted: '#7a7268', paper: '#e8e2d6' }
    }
    return { bg: '#f4f1ea', fg: '#1a1a1a', accent: '#1a1a1a', muted: '#7a7a7a', paper: '#ebe7de' }
  }

  if (style === 'eco') {
    if (lang === 'electronics-precision') {
      return { bg: '#b7b09a', fg: '#1e2418', accent: '#2f3d28', muted: '#5a5848', paper: '#a8a088' }
    }
    if (lang === 'perfume-luxury') {
      return { bg: '#c6b492', fg: '#2a2216', accent: '#3a4630', muted: '#5c5344', paper: '#b8a682' }
    }
    return { bg: '#cbb892', fg: '#2a2418', accent: '#3f4a32', muted: '#5c5344', paper: '#b6a686' }
  }

  if (style === 'playful') {
    if (lang === 'food-harvest') {
      return { bg: '#2a1410', fg: '#fff4e4', accent: '#f0a040', muted: '#d4a080', paper: '#341c14' }
    }
    if (lang === 'perfume-luxury') {
      return { bg: '#2a1020', fg: '#fff4ea', accent: '#f08a6a', muted: '#d0a090', paper: '#381828' }
    }
    return { bg: '#1c1018', fg: '#fff6ea', accent: '#e88a4a', muted: '#c4a090', paper: '#281820' }
  }

  if (style === 'classic') {
    if (lang === 'perfume-luxury') {
      return { bg: '#f3ead8', fg: '#2a1418', accent: '#6b1d2a', muted: '#8a6a58', paper: '#e6d8c0' }
    }
    if (lang === 'food-harvest') {
      return { bg: '#f0e4cc', fg: '#2a1810', accent: '#8b3d1d', muted: '#8a6e50', paper: '#e4d4b4' }
    }
    if (lang === 'electronics-precision') {
      return { bg: '#0e1624', fg: '#efe6d4', accent: '#c4a574', muted: '#7a6e5c', paper: '#141c2a' }
    }
    return { bg: '#f2e8d6', fg: '#1c1410', accent: '#6b1d2a', muted: '#8a6e58', paper: '#e6d8c0' }
  }

  if (lang === 'food-harvest') {
    return { bg: '#2a1a10', fg: '#f6ecd4', accent: '#c45c30', muted: '#a08058', paper: '#1e140c' }
  }
  if (lang === 'electronics-precision') {
    return { bg: '#14120e', fg: '#efe8d8', accent: '#8b4040', muted: '#8a7460', paper: '#1a1814' }
  }
  return { bg: '#16120e', fg: '#f0e6d4', accent: '#8b3d3d', muted: '#8a7460', paper: '#1c1814' }
}

function mixHex(a: string, b: string, amount: number): string {
  const parse = (value: string) => [1, 3, 5].map((index) => Number.parseInt(value.slice(index, index + 2), 16))
  const [ar, ag, ab] = parse(a)
  const [br, bg, bb] = parse(b)
  const channel = (from: number, to: number) => Math.round(from + (to - from) * amount).toString(16).padStart(2, '0')
  return `#${channel(ar, br)}${channel(ag, bg)}${channel(ab, bb)}`
}

export function varyPalette(base: Palette, variationIndex: number): Palette {
  const variant = Math.max(0, Math.floor(variationIndex)) % 4
  if (variant === 0) return base
  if (variant === 1) {
    return {
      ...base,
      bg: mixHex(base.bg, '#000000', 0.18),
      paper: mixHex(base.paper, '#000000', 0.12),
      accent: mixHex(base.accent, base.fg, 0.12),
    }
  }
  if (variant === 2) {
    return {
      ...base,
      bg: mixHex(base.bg, base.fg, 0.12),
      paper: mixHex(base.paper, base.fg, 0.08),
      accent: mixHex(base.accent, base.fg, 0.24),
    }
  }
  return {
    ...base,
    bg: mixHex(base.bg, base.accent, 0.14),
    accent: mixHex(base.accent, base.fg, 0.18),
    muted: mixHex(base.muted, base.accent, 0.2),
  }
}
