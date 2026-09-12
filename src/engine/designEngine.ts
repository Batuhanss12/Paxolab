import type {
  BriefFields,
  DesignKind,
  DesignOverrides,
  DesignSpec,
  Palette,
  PaletteShift,
} from '../types'
import { uid } from './fields'

const DEFAULT_OVERRIDES: DesignOverrides = {
  logoScale: 1,
  titleScale: 1,
  premium: false,
  printReady: false,
  paletteShift: 'default',
  barcodeVisible: true,
  customTagline: '',
}

function hashHue(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0
  return h % 360
}

function kindFromBrief(brief: BriefFields): DesignKind {
  const pack = `${brief.ambalajTipi} ${brief.kategori}`.toLowerCase()
  if (/landing|dijital|web/.test(pack)) return 'landing'
  if (/etiket|label/.test(pack)) return 'label'
  return 'packaging'
}

function parseMm(brief: BriefFields): { widthMm: number; heightMm: number; depthMm: number } {
  const nums = [...brief.olculer.matchAll(/(\d+(?:[.,]\d+)?)/g)].map((m) =>
    Number(m[1].replace(',', '.')),
  )
  const kind = kindFromBrief(brief)
  if (kind === 'landing') return { widthMm: 1440, heightMm: 900, depthMm: 0 }
  if (kind === 'label') {
    return {
      widthMm: nums[0] || 70,
      heightMm: nums[1] || 120,
      depthMm: 0,
    }
  }
  return {
    widthMm: nums[0] || 80,
    depthMm: nums[1] || 40,
    heightMm: nums[2] || nums[1] || 120,
  }
}

function colorFromWord(word: string): string | null {
  const w = word.toLowerCase()
  if (w.startsWith('#')) return w
  const map: Record<string, string> = {
    siyah: '#0a0a0a',
    black: '#0a0a0a',
    beyaz: '#f6f4ef',
    white: '#f6f4ef',
    altın: '#c9a86c',
    gold: '#c9a86c',
    gümüş: '#b8b8b4',
    silver: '#b8b8b4',
    krem: '#efe6d4',
    cream: '#efe6d4',
    nude: '#e4cfc2',
    pembe: '#e8c4c4',
    rose: '#e8c4c4',
    bordo: '#6b2430',
    kırmızı: '#9b2c2c',
    yeşil: '#3f4f36',
    zeytin: '#6b7f5a',
    lacivert: '#1b2a4a',
    mavi: '#1b2a4a',
    mor: '#3a2454',
    terracotta: '#b85c38',
    bronz: '#8c6a3d',
    kahve: '#4a3424',
    şampanya: '#e6d5a8',
  }
  for (const [k, v] of Object.entries(map)) {
    if (w.includes(k)) return v
  }
  return null
}

function shiftPalette(base: Palette, shift: PaletteShift, premium: boolean): Palette {
  if (shift === 'gold' || premium) {
    return { bg: '#070707', fg: '#f4efe6', accent: '#c9a86c', muted: '#8a7a5c', paper: '#111111' }
  }
  if (shift === 'minimal') {
    return { bg: '#0b0b0b', fg: '#f5f5f5', accent: '#f5f5f5', muted: '#7a7a7a', paper: '#141414' }
  }
  if (shift === 'dark') {
    return { bg: '#000000', fg: '#ececec', accent: base.accent, muted: '#5c5c5c', paper: '#0a0a0a' }
  }
  if (shift === 'warm') {
    return { bg: '#16100c', fg: '#f3e7d3', accent: '#c4844a', muted: '#8a6a4a', paper: '#1c1510' }
  }
  return base
}

function buildPalette(brief: BriefFields, overrides: DesignOverrides): Palette {
  const words = brief.renkler.split(/[·,]/).map((s) => s.trim()).filter(Boolean)
  const parsed = words.map(colorFromWord).filter((c): c is string => !!c)
  const style = brief.stil.toLowerCase()
  const pack = `${brief.ambalajTipi} ${brief.kategori}`.toLowerCase()

  let base: Palette
  if (parsed.length >= 2) {
    base = {
      bg: parsed[0],
      accent: parsed[1],
      fg: parsed[2] || '#f4efe6',
      muted: '#8a8070',
      paper: '#121212',
    }
  } else if (parsed.length === 1) {
    const hue = hashHue(brief.markaAdi || brief.urunAdi || 'forma')
    base = {
      bg: parsed[0],
      accent: `hsl(${(hue + 40) % 360} 28% 58%)`,
      fg: '#f4efe6',
      muted: '#8a8070',
      paper: '#121212',
    }
  } else if (/organik|doğal/.test(style) || /gıda/.test(pack)) {
    base = { bg: '#1c2416', fg: '#f0ead8', accent: '#c4b48a', muted: '#7d8468', paper: '#14180f' }
  } else if (/klinik/.test(style)) {
    base = { bg: '#e8e6e1', fg: '#141414', accent: '#2a2a2a', muted: '#6a6a6a', paper: '#f4f2ec' }
  } else if (/landing|dijital/.test(pack)) {
    base = { bg: '#050505', fg: '#f5f5f5', accent: '#ffffff', muted: '#8a8a8a', paper: '#0c0c0c' }
  } else if (/kozmetik/.test(pack) || /yumuşak|feminen/.test(style)) {
    base = { bg: '#141012', fg: '#f6ebe6', accent: '#d4a8a0', muted: '#8a706c', paper: '#1a1516' }
  } else {
    const hue = hashHue(brief.markaAdi || 'forma')
    base = {
      bg: '#0a0a0a',
      fg: '#f4efe6',
      accent: `hsl(${hue} 22% 62%)`,
      muted: '#7a7468',
      paper: '#111111',
    }
  }

  return shiftPalette(base, overrides.paletteShift, overrides.premium)
}

function taglineFrom(brief: BriefFields): string {
  if (brief.metinler.trim()) return brief.metinler.trim()
  const style = brief.stil.toLowerCase()
  const cat = `${brief.kategori} ${brief.urunAdi}`.toLowerCase()
  if (/premium|lüks|sessiz/.test(style)) return 'Sessiz bir yoğunluk.'
  if (/minimal/.test(style)) return 'Sadece gereken.'
  if (/organik/.test(style)) return 'Doğadan, olduğu gibi.'
  if (/klinik/.test(style)) return 'Formül. Netlik. Sonuç.'
  if (/serum/.test(cat)) return 'Gece boyunca çalışır.'
  if (/landing/.test(brief.ambalajTipi.toLowerCase())) return 'Tasarımın üretimle buluştuğu yer.'
  if (/etiket/.test(brief.ambalajTipi.toLowerCase())) return 'Tek bakışta okunur.'
  return 'Yüzeyde duran karakter.'
}

function volumeFrom(brief: BriefFields): string {
  if (brief.icerik.trim()) return brief.icerik.trim()
  if (/landing/.test(brief.ambalajTipi.toLowerCase())) return ''
  if (/etiket/.test(brief.ambalajTipi.toLowerCase())) return brief.icerik || '250 ml'
  if (/kozmetik|serum|krem/.test(`${brief.kategori} ${brief.urunAdi}`.toLowerCase())) return '30 ml'
  return '100 g'
}

function ingredientsFrom(brief: BriefFields): string {
  if (/landing/.test(brief.ambalajTipi.toLowerCase())) {
    return brief.icerik || 'Ürün anlatımı, özellikler, sosyal kanıt.'
  }
  return (
    brief.icerik ||
    'Aqua, Glycerin, Niacinamide, Sodium Hyaluronate, Tocopherol.'
  )
}

function warningsFrom(brief: BriefFields): string {
  if (brief.uyarilar.trim()) return brief.uyarilar.trim()
  if (/landing/.test(brief.ambalajTipi.toLowerCase())) return ''
  return 'Gözle temasından kaçının. Çocukların ulaşamayacağı yerde saklayın.'
}

function barcodeFrom(brief: BriefFields): string {
  const digits = brief.barkodQr.match(/\d{8,14}/)
  if (digits) return digits[0]
  const seed = `${brief.markaAdi}${brief.urunAdi}`
  let n = 868000000000
  for (let i = 0; i < seed.length; i++) n += seed.charCodeAt(i) * (i + 3)
  return String(n).slice(0, 13)
}

function ctaFrom(brief: BriefFields): string {
  if (/landing/.test(brief.ambalajTipi.toLowerCase())) return 'Koleksiyonu gör'
  return 'Üretime al'
}

export function defaultOverrides(): DesignOverrides {
  return { ...DEFAULT_OVERRIDES }
}

export function generateDesign(
  brief: BriefFields,
  prev?: DesignSpec | null,
  overridePatch?: Partial<DesignOverrides>,
  copyPatch?: Partial<DesignSpec['copy']>,
): DesignSpec {
  const overrides: DesignOverrides = {
    ...(prev?.overrides ?? defaultOverrides()),
    ...overridePatch,
  }
  const palette = buildPalette(brief, overrides)
  const layout = parseMm(brief)
  const kind = kindFromBrief(brief)

  const copy = {
    brand: copyPatch?.brand || brief.markaAdi || prev?.copy.brand || 'FORMA',
    product: copyPatch?.product || brief.urunAdi || prev?.copy.product || 'Untitled',
    tagline:
      overrides.customTagline ||
      copyPatch?.tagline ||
      taglineFrom(brief),
    volume: copyPatch?.volume || volumeFrom(brief),
    ingredients: copyPatch?.ingredients || ingredientsFrom(brief),
    warnings: copyPatch?.warnings || warningsFrom(brief),
    barcode: copyPatch?.barcode || barcodeFrom(brief),
    cta: copyPatch?.cta || ctaFrom(brief),
  }

  return {
    id: prev?.id ?? uid(),
    kind,
    brief: { ...brief },
    palette,
    layout,
    copy,
    overrides,
    generatedAt: Date.now(),
    revision: (prev?.revision ?? 0) + 1,
  }
}

export function monogram(brand: string): string {
  const parts = brand.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'F'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}
