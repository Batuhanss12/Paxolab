import type { DesignBrief, DesignOverrides, DesignSpec, StyleType } from '../../types'

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

export function parseIntent(text: string): IterateIntent {
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

  if (/yazıyı\s*büyüt|başlığı\s*büyüt/i.test(text)) {
    overridePatch.titleScale = 1.28
    notes.push('Başlık tipografisini açtım.')
  } else if (/yazıyı\s*küçült|başlığı\s*küçült/i.test(text)) {
    overridePatch.titleScale = 0.82
    notes.push('Başlığı daha sessiz hale getirdim.')
  }

  for (const [re, style] of STYLES) {
    if (re.test(text)) {
      briefPatch.styleType = style
      if (style === 'luxury') {
        overridePatch.premium = true
        overridePatch.paletteShift = 'gold'
      }
      if (style === 'minimal') {
        overridePatch.premium = false
        overridePatch.paletteShift = 'minimal'
      }
      notes.push(`Stil ${style} yönüne çekildi — yüzey yeniden kuruldu.`)
      break
    }
  }

  if (/daha\s*koyu|darker/i.test(text)) {
    overridePatch.paletteShift = 'dark'
    notes.push('Zemin daha derin.')
  } else if (/daha\s*sıcak|warm/i.test(text)) {
    overridePatch.paletteShift = 'warm'
    notes.push('Paleti sıcak tarafa aldım.')
  }

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
    notes.push('Motoru aynı brief ile yeniden çalıştırdım.')
  }
  if (notes.length === 0) notes.push('İsteği motora ilettim, yüzeyi güncelledim.')

  return { overridePatch, copyPatch, briefPatch, note: notes.join(' ') }
}

export function isIteration(text: string): boolean {
  return /logo|premium|minimal|baskı|yazı|metn|renk|daha\s|küçült|büyüt|hazırla|koyu|sıcak|sade|yeniden|tagline|slogan|barkod|qr|altın|gold|stil|eco|modern|klasik|classic|luxury|lüks|playful|eğlenc|çerçeve|geç/i.test(
    text,
  )
}
