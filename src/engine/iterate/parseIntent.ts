import type { DesignBrief, DesignOverrides, DesignSpec, StyleType } from '../../types'
import type { DirectionHints, StudioFamily } from '../studio/types'
import { DESIGN_COMMAND_WORDS, parseDesignCommands } from './parseDesignCommands'

export type IterateIntent = {
  overridePatch: Partial<DesignOverrides>
  copyPatch: Partial<DesignSpec['copy']>
  briefPatch: Partial<DesignBrief>
  note: string
}

const STYLES: [RegExp, StyleType][] = [
  [/luxury\s*yap|lüks\s*yap|luxury['’]?ya\s*geç|stil\s*luxury|altın\s*çerçeve|daha\s*premium|daha\s*lüks|\bluxury\b|\bgold\b|\baltın\b/i, 'luxury'],
  [/minimal\s*(yap|stil)|sadeleştir|daha\s*minimal|daha\s*sade|\bminimal\b/i, 'minimal'],
  [/modern\s*(yap|stil)|modern['’]?[aeıy]\s*geç|daha\s*modern|\bmodern\b/i, 'modern'],
  [/eco['’]?ya\s*geç|eco\s*(yap|stil)|daha\s*eco|\beco\b|organik|doğal/i, 'eco'],
  [/playful\s*(yap|stil)|eğlenc\w*\s*(yap|stil)|daha\s*eğlenc|renkli\s*yap|\bplayful\b/i, 'playful'],
  [/klasik\s*(yap|stil)|classic\s*(yap|stil)|daha\s*klasik|\bclassic\b|\bklasik\b/i, 'classic'],
]

export function parseIntent(text: string, currentStyle: StyleType | '' = ''): IterateIntent {
  const overridePatch: Partial<DesignOverrides> = {}
  const copyPatch: Partial<DesignSpec['copy']> = {}
  const briefPatch: Partial<DesignBrief> = {}
  const notes: string[] = []

  if (/logoyu\s*büyüt|logo\s*büyüt/i.test(text)) {
    overridePatch.logoScale = 1.35
    notes.push('Logo ölçeğini büyüttüm.')
  } else if (/logoyu\s*küçült|logo\s*küçült/i.test(text)) {
    overridePatch.logoScale = 0.72
    notes.push('Logo ölçeğini küçülttüm.')
  }

  if (/yazıyı\s*büyüt|başlığı\s*büyüt|ürün(?:ün)?\s*adın[ıi]\s*büyüt|ürünü\s*büyüt/i.test(text)) {
    overridePatch.titleScale = 1.28
    notes.push('Başlık tipografisini açtım.')
  } else if (/yazıyı\s*küçült|başlığı\s*küçült|ürün(?:ün)?\s*adın[ıi]\s*küçült|ürünü\s*küçült/i.test(text)) {
    overridePatch.titleScale = 0.82
    notes.push('Başlığı daha sessiz hale getirdim.')
  }

  for (const [re, style] of STYLES) {
    if (re.test(text)) {
      briefPatch.styleType = style
      if (style === 'luxury') {
        overridePatch.premium = true
        if (currentStyle === 'luxury' && /daha\s*(lüks|premium)/i.test(text)) {
          overridePatch.directorCue = 'luxury-tighten'
          notes.push('Yönetmen: daha fazla hava, daha az motif — altın yağmuru değil.')
        } else if (currentStyle !== 'luxury') {
          overridePatch.directorCue = 'luxury-arrive'
          overridePatch.paletteShift = 'gold'
        }
      }
      if (style === 'minimal') {
        overridePatch.premium = false
        overridePatch.paletteShift = 'minimal'
        overridePatch.directorCue = currentStyle === 'minimal' ? 'open-air' : 'none'
      }
      if (style === 'eco' && currentStyle === 'eco') overridePatch.directorCue = 'warm-natural'
      if ((style === 'modern' || style === 'playful') && currentStyle === style) overridePatch.directorCue = 'graphic-push'
      notes.push(`${style} hale çekiyorum — palet ve tipografi sıfırdan.`)
      break
    }
  }

  if (/altın\s*ekle|gold\s*(?:ekle|add)|altın\s*vurgu|foil\s*ekle/i.test(text)) {
    overridePatch.paletteShift = 'gold'
    overridePatch.premium = true
    if (!briefPatch.styleType) briefPatch.styleType = 'luxury'
    notes.push('Altın vurgu ekledim.')
  }

  if (/daha\s*(cesur|grafik)|kontrastı\s*artır/i.test(text)) {
    overridePatch.directorCue = 'graphic-push'
    overridePatch.titleScale = Math.max(overridePatch.titleScale ?? 1, 1.12)
    notes.push('Kontrastı ve grafik otoriteyi yükselttim.')
  }
  if (/daha\s*(genç|dinamik)/i.test(text)) {
    briefPatch.styleType = 'playful'
    overridePatch.directorCue = 'graphic-push'
    notes.push('Duruşu daha genç ve dinamik yaptım.')
  }
  if (/daha\s*(olgun|zamansız|güvenilir)/i.test(text)) {
    briefPatch.styleType = 'classic'
    overridePatch.directorCue = 'open-air'
    notes.push('Duruşu daha olgun ve zamansız yaptım.')
  }

  if (/daha\s*koyu|darker/i.test(text)) {
    overridePatch.paletteShift = 'dark'
    const direction: DirectionHints = { ...overridePatch.direction, temperament: 'dark-luxe', source: 'user' }
    overridePatch.direction = direction
    notes.push('Zemin daha derin.')
  } else if (/daha\s*sıcak|warm/i.test(text)) {
    overridePatch.paletteShift = 'warm'
    notes.push('Paleti sıcak tarafa aldım.')
  }

  if (/daha\s*mermer|mermer\s*(yap|olsun)|more\s*marble/i.test(text)) {
    briefPatch.studioFamily = 'marble' satisfies StudioFamily
    overridePatch.direction = { ...overridePatch.direction, background: 'marble', source: 'user', rationale: ['Kullanıcı: daha mermer.'] }
    notes.push('Görsel aileyi mermer sistemine aldım.')
  } else if (/daha\s*botanik|botanik\s*(yap|olsun)/i.test(text)) {
    briefPatch.studioFamily = 'botanical'
    overridePatch.direction = { ...overridePatch.direction, background: 'botanical', source: 'user', rationale: ['Kullanıcı: daha botanik.'] }
    notes.push('Görsel aileyi botanik karta aldım.')
  } else if (/daha\s*(dalga|wave)/i.test(text)) {
    briefPatch.studioFamily = 'wave'
    overridePatch.direction = { ...overridePatch.direction, background: 'wave', source: 'user', rationale: ['Kullanıcı: daha dalga.'] }
    notes.push('Görsel aileyi dalga paneline aldım.')
  }

  if (/daha\s*klinik/i.test(text)) {
    overridePatch.direction = { ...overridePatch.direction, temperament: 'clean-clinical', source: 'user' }
    notes.push('Yönü klinik ve sade tuttum.')
  } else if (/daha\s*(sakin|sessiz|editorial)/i.test(text)) {
    overridePatch.direction = { ...overridePatch.direction, temperament: 'light-luxe', source: 'user' }
    if (!overridePatch.directorCue) overridePatch.directorCue = 'luxury-tighten'
    notes.push('Yönü daha sakin ve editorial aldım.')
  } else if (/daha\s*canlı|daha\s*vivid/i.test(text)) {
    overridePatch.direction = { ...overridePatch.direction, temperament: 'vivid-mono', source: 'user' }
    notes.push('Yönü daha canlı tek tona aldım.')
  }

  // Frame / ornament / pairing / lockup / copy tiers / family words — the direction's own vocabulary.
  const cmds = parseDesignCommands(text)
  if (Object.keys(cmds.direction).length) {
    overridePatch.direction = {
      ...overridePatch.direction,
      ...cmds.direction,
      rationale: [...(overridePatch.direction?.rationale ?? []), ...(cmds.direction.rationale ?? [])],
      source: 'user',
    }
  }
  Object.assign(briefPatch, cmds.briefPatch)
  notes.push(...cmds.notes)

  if (/baskıya\s*hazırla|üretime\s*gönder|print\s*ready/i.test(text)) {
    overridePatch.printReady = true
    notes.push('Üretim ön kontrolünü çalıştırdım.')
  }

  if (/barkod.*kaldır|qr.*kaldır/i.test(text)) {
    overridePatch.barcodeVisible = false
    notes.push('Barkodu yüzeyden kaldırdım.')
  } else if (/barkod\s*ekle|qr\s*ekle/i.test(text)) {
    overridePatch.barcodeVisible = true
    notes.push('Barkod yalnızca verdiğiniz numarayla gösterilir.')
  }

  const tagline = text.match(
    /(?:sloganı|tagline['’]?i|metni)\s+(?:olarak\s+)?["“']?([^"”']+?)["”']?\s*(?:yap|olsun|değiştir)/i,
  )
  if (tagline?.[1]) {
    const value = tagline[1].trim()
    overridePatch.customTagline = value
    copyPatch.tagline = value
    briefPatch.copyOverrides = value
    notes.push(`Metni “${value}” olarak güncelledim.`)
  }

  const product = text.match(/(?:ürün(?:ün)?\s*adın[ıi]|ürünü)\s+(?:olarak\s+)?["“']?([^"”']+?)["”']?\s*(?:yap|olsun)/i)
  if (product?.[1]) {
    copyPatch.product = product[1].trim()
    briefPatch.productName = product[1].trim()
    notes.push(`Ürün adını “${product[1].trim()}” yaptım.`)
  }

  const brand = text.match(/(?:marka(?:yı|nın\s*adın[ıi])?)\s+(?:olarak\s+)?["“']?([^"”']+?)["”']?\s*(?:yap|olsun)/i)
  if (brand?.[1]) {
    copyPatch.brand = brand[1].trim()
    briefPatch.brandName = brand[1].trim()
    notes.push(`Markayı “${brand[1].trim()}” olarak güncelledim.`)
  }

  if (/yeniden\s*üret|regenerate|baştan/i.test(text) && notes.length === 0) {
    notes.push('Aynı brief ile yeniden çiziyorum.')
  }
  if (notes.length === 0) notes.push('İsteği yüzeye uyguluyorum.')

  return { overridePatch, copyPatch, briefPatch, note: notes.join(' ') }
}

export function isIteration(text: string): boolean {
  return (
    /logo|premium|minimal|baskı|yazı|metn|renk|daha\s|küçült|büyüt|hazırla|koyu|sıcak|sade|yeniden|tagline|slogan|barkod|qr|altın|gold|foil|vurgu|stil|eco|modern|klasik|classic|luxury|lüks|playful|eğlenc|çerçeve|geç|cesur|grafik|kontrast|genç|dinamik|olgun|zamansız|güvenilir|ürün\s*ad|mermer|botanik|klinik|sakin|sessiz|dalga|yoğun|dolu|sıkışık|kalabalık/i.test(
      text,
    ) || DESIGN_COMMAND_WORDS.test(text)
  )
}
