import type { Attachment, AwaitingKey, DesignBrief, PackagingMode } from '../types'
import { mergeBrief, parseDimensions, parseStyle } from './fields'

const MODE_RULES: { re: RegExp; mode: PackagingMode; sector?: string; sub?: string }[] = [
  { re: /kozmetik\s*kutusu|parfüm\s*kut/i, mode: 'box', sector: 'kozmetik', sub: 'parfüm' },
  { re: /gıda\s*ambalaj|gıda\s*kut/i, mode: 'box', sector: 'gıda' },
  { re: /elektronik\s*kut|kulaklık/i, mode: 'box', sector: 'elektronik', sub: 'kulaklık' },
  { re: /kutu\s*ambalaj|\bkutu\b/i, mode: 'box' },
  { re: /etiket|label|wrap/i, mode: 'label' },
]

const SECTOR_RULES: { re: RegExp; sector: string; sub?: string }[] = [
  { re: /parfüm|perfume|eau de/i, sector: 'kozmetik', sub: 'parfüm' },
  { re: /krem|cream/i, sector: 'kozmetik', sub: 'krem' },
  { re: /serum/i, sector: 'kozmetik', sub: 'serum' },
  { re: /kozmetik|cilt\s*bakım/i, sector: 'kozmetik' },
  { re: /zeytinyağ|yağ\b/i, sector: 'gıda', sub: 'yağ' },
  { re: /atıştırmalık|çikolata|kurabiye/i, sector: 'gıda', sub: 'atıştırmalık' },
  { re: /gıda|reçel|bal|çay/i, sector: 'gıda' },
  { re: /kulaklık|earbuds/i, sector: 'elektronik', sub: 'kulaklık' },
  { re: /kablo|şarj/i, sector: 'elektronik', sub: 'kablo' },
  { re: /elektronik|teknoloji/i, sector: 'elektronik' },
]

function labeled(text: string, keys: string[]): string {
  const re = new RegExp(`(?:${keys.join('|')})\\s*(?:adı|adın)?\\s*[:\\-–]\\s*["'“”]?([^,.;\\n"“”]+)`, 'i')
  return text.match(re)?.[1]?.trim() ?? ''
}

/** Firma / adres: A.Ş. ve cadde noktalarını kesme; sonraki etiket veya satırda dur. */
function labeledBlock(text: string, keys: string[]): string {
  const stop = 'üretici|ithalatçı|manufacturer|firma|adres|address|fabrika|barkod|marka|ürün|brand|product'
  const re = new RegExp(
    `(?:${keys.join('|')})\\s*(?:adı|adın)?\\s*[:\\-–]\\s*["'“”]?(.+?)(?=\\s*,\\s*(?:${stop})\\s*[:\\-–]|\\n|$)`,
    'i',
  )
  return text.match(re)?.[1]?.trim().replace(/[,;]+$/, '') ?? ''
}

function looksLikeName(value: string): boolean {
  return !!value && value.length < 48 && !/[?]/.test(value) && /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(value)
}

const SKIP_UTTERANCE = /^(şablon|varsayılan|örnek|geç|fark\s*etmez|farketmez|olsun|bilmiyorum|tamam|ok)$/i
const PALETTE_TOKEN =
  /^(siyah|black|beyaz|white|altın|gold|gümüş|silver|krem|kraft|navy|lacivert)(?:[-\s·]+(siyah|black|beyaz|white|altın|gold|gümüş|silver|krem|kraft))?$/i

export function isPaletteName(value: string): boolean {
  return PALETTE_TOKEN.test(value.trim())
}

export function sameName(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase('tr') === b.trim().toLocaleLowerCase('tr') && a.trim().length > 0
}

export function looksLikeSector(value: string): boolean {
  return /kozmetik|gıda|elektronik|parfüm|parfum|perfume|krem|serum|yağ|temizlik|food|cosmetic|tech/i.test(
    value.trim(),
  )
}

/** Sector nouns are not SKU names — lockup must not read PARFÜM under EAU DE PARFUM. */
export function isGenericProductName(value: string): boolean {
  return /^(parfüm|parfum|perfume|krem|cream|serum|etiket|kutu|kutusu|ambalaj|kozmetik|gıda|şişe|wrap|label)$/i.test(
    value.trim(),
  )
}

export function extractFields(text: string, attachments: Attachment[]): Partial<DesignBrief> {
  const patch: Partial<DesignBrief> = {}
  const raw = text.trim()
  if (!raw || SKIP_UTTERANCE.test(raw)) {
    if (attachments.length) {
      const logos = attachments.filter((a) => a.kind === 'logo')
      const refs = attachments.filter((a) => a.kind === 'referans')
      if (logos.length) patch.logo = logos.map((a) => a.name).join(', ')
      if (refs.length) patch.references = refs.map((a) => a.name).join(', ')
      if (!patch.logo && attachments[0]) patch.logo = attachments[0].name
    }
    return patch
  }

  for (const rule of MODE_RULES) {
    if (rule.re.test(raw)) {
      patch.packagingMode = rule.mode
      if (rule.sector) patch.sector = rule.sector
      if (rule.sub) patch.subProduct = rule.sub
      break
    }
  }
  for (const rule of SECTOR_RULES) {
    if (rule.re.test(raw)) {
      if (!patch.sector) patch.sector = rule.sector
      if (rule.sub && !patch.subProduct) patch.subProduct = rule.sub
      break
    }
  }
  if (patch.sector && !looksLikeSector(patch.sector)) delete patch.sector

  const brand = labeled(raw, ['marka', 'brand'])
  if (looksLikeName(brand)) patch.brandName = brand
  const product = labeled(raw, ['ürün', 'product'])
  if (looksLikeName(product)) patch.productName = product

  const quotes = [...raw.matchAll(/["“”']([^"“”']{2,40})["“”']/g)].map((m) => m[1].trim())
  if (!patch.brandName && quotes[0] && looksLikeName(quotes[0])) patch.brandName = quotes[0]
  if (!patch.productName && quotes[1] && looksLikeName(quotes[1])) patch.productName = quotes[1]

  const icin = raw.match(/^["“']?([A-Za-zÇĞİÖŞÜçğıöşü0-9][\wÇĞİÖŞÜçğıöşü&.'’\s-]{1,40}?)["”']?\s+için\b/i)
  if (icin && looksLikeName(icin[1]) && !patch.brandName) {
    const parts = icin[1].trim().split(/\s+/).filter(Boolean)
    if (parts.length >= 3 && !isGenericProductName(parts[parts.length - 1] ?? '')) {
      patch.brandName = parts.slice(0, -1).join(' ')
      if (!patch.productName) patch.productName = parts[parts.length - 1]
    } else {
      patch.brandName = icin[1].trim()
    }
  }

  const named = raw.match(
    /\biçin\s+([A-Za-zÇĞİÖŞÜçğıöşü][\wÇĞİÖŞÜçğıöşü'’-]{1,28})\s+(?:parfüm|perfume|krem|cream|serum|kutusu|kutu|etiket)\b/i,
  )
  if (named && !isGenericProductName(named[1]) && !isPaletteName(named[1]) && !patch.productName) {
    patch.productName = named[1]
  }

  if (!patch.brandName || !patch.productName) {
    const cut = raw.split(/[,.;]/)[0] ?? raw
    const words = cut.split(/\s+/).filter((w) => {
      const token = w.replace(/[:\-–]+$/g, '')
      return (
        !isPaletteName(token) &&
        !/^(için|bir|ve|ile|adı|adın|adını|marka|brand|ürün|product|kozmetik|kutusu|kutu|ambalaj|etiket|gıda|elektronik|luxury|modern|minimal|eco|playful|classic|daha|premium|lüks|parfüm|perfume|krem|serum)$/i.test(
          token,
        )
      )
    })
    if (!patch.brandName && words[0] && looksLikeName(words[0]) && !SKIP_UTTERANCE.test(words[0])) {
      patch.brandName = words[0]
    }
    if (!patch.productName && !brand && words.length > 1) {
      const rest = words.slice(1).find(
        (w) =>
          looksLikeName(w) &&
          !isGenericProductName(w) &&
          !isPaletteName(w) &&
          !sameName(w, patch.brandName ?? ''),
      )
      if (rest) patch.productName = rest
    }
  }

  if (patch.productName && (isGenericProductName(patch.productName) || isPaletteName(patch.productName))) {
    delete patch.productName
  }
  if (patch.productName && patch.brandName && sameName(patch.productName, patch.brandName)) {
    delete patch.productName
  }
  if (patch.brandName && patch.productName) {
    const parts = patch.brandName.split(/\s+/).filter(Boolean)
    if (parts.length >= 2 && sameName(parts[parts.length - 1] ?? '', patch.productName)) {
      patch.brandName = parts.slice(0, -1).join(' ')
    }
  }
  if (patch.brandName && (SKIP_UTTERANCE.test(patch.brandName) || isPaletteName(patch.brandName))) {
    delete patch.brandName
  }

  const style = parseStyle(raw)
  if (style) patch.styleType = style

  const dims = parseDimensions(raw)
  if (dims) patch.dimensionsMm = dims

  const vol = raw.match(/(\d+(?:[.,]\d+)?)\s*(ml|cl|l|gr|g|kg)\b/i)
  if (vol) patch.volume = `${vol[1]} ${vol[2].toLowerCase()}`

  const pao =
    raw.match(/\bpao\s*[:\-]?\s*(\d{1,2})\s*(?:m|ay)?\b/i) ||
    raw.match(/\b(\d{1,2})\s*ay\b/i) ||
    raw.match(/\b(\d{1,2})M\b/)
  if (pao) patch.paoMonths = `${pao[1]}M`

  const colors: string[] = []
  const hex = raw.match(/#([0-9a-fA-F]{3,8})/g)
  if (hex) colors.push(...hex)
  if (/siyah|black/i.test(raw)) colors.push('Siyah')
  if (/altın|gold/i.test(raw)) colors.push('Altın')
  if (/krem|cream/i.test(raw)) colors.push('Krem')
  if (colors.length) patch.colors = [...new Set(colors)].join(' · ')

  const slogan = labeled(raw, ['slogan', 'tagline', 'metin'])
  if (slogan) patch.copyOverrides = slogan

  if (/\bbarkod\b|\bean[\s-]?13\b/i.test(raw)) {
    const digits = raw.match(/\b\d{8,14}\b/)
    if (digits) patch.barcode = digits[0]
  } else {
    const lone = raw.match(/^\s*(\d{8,14})\s*$/)
    if (lone) patch.barcode = lone[1]
  }

  const maker = labeledBlock(raw, ['üretici', 'ithalatçı', 'manufacturer', 'firma'])
  if (maker && (looksLikeName(maker) || maker.length > 3)) patch.manufacturerName = maker
  const addr = labeledBlock(raw, ['adres', 'address', 'fabrika'])
  if (addr.length > 4) patch.manufacturerAddress = addr

  if (attachments.length) {
    const logos = attachments.filter((a) => a.kind === 'logo')
    const refs = attachments.filter((a) => a.kind === 'referans')
    if (logos.length) patch.logo = logos.map((a) => a.name).join(', ')
    if (refs.length) patch.references = refs.map((a) => a.name).join(', ')
    if (!patch.logo && attachments[0]) patch.logo = attachments[0].name
  }

  return patch
}

const DEFAULT_SKIP = SKIP_UTTERANCE

export function assignAwaiting(text: string, awaiting: AwaitingKey | null): Partial<DesignBrief> {
  if (!awaiting || awaiting === 'templateId') return {}
  const cleaned =
    awaiting === 'manufacturerName' || awaiting === 'manufacturerAddress'
      ? text.replace(/^[\s\-–:]+/, '').trim()
      : text.replace(/^[\s\-–:]+/, '').replace(/[?.!]+$/, '').trim()
  if (!cleaned || cleaned.length > 80) return {}
  if (awaiting === 'volume') {
    if (DEFAULT_SKIP.test(cleaned) || /^(yok|yoktur)$/i.test(cleaned)) return { volumeDefaulted: true }
    const vol = cleaned.match(/(\d+(?:[.,]\d+)?)\s*(ml|cl|l|gr|g|kg)?/i)
    if (vol) return { volume: `${vol[1]} ${(vol[2] || 'ml').toLowerCase()}`, volumeDefaulted: false }
    return { volume: cleaned, volumeDefaulted: false }
  }
  if (awaiting === 'dimensionsMm') {
    if (DEFAULT_SKIP.test(cleaned)) return { dimsDefaulted: true }
    const dims = parseDimensions(cleaned)
    return dims ? { dimensionsMm: dims, dimsDefaulted: false } : {}
  }
  if (awaiting === 'productName') {
    if (DEFAULT_SKIP.test(cleaned) || /^(yok|yoktur|sadece marka|marka yeter)$/i.test(cleaned)) {
      return { productSkipped: true }
    }
    if (isGenericProductName(cleaned)) return { productSkipped: true }
    return { productName: cleaned, productSkipped: false }
  }
  if (awaiting === 'barcode') {
    if (DEFAULT_SKIP.test(cleaned) || /^(yok|üret|otomatik)$/i.test(cleaned)) return { barcodeDefaulted: true }
    const digits = cleaned.match(/\d{8,14}/)
    return digits ? { barcode: digits[0], barcodeDefaulted: false } : { barcodeDefaulted: true }
  }
  if (awaiting === 'manufacturerName') {
    if (DEFAULT_SKIP.test(cleaned)) return { manufacturerDefaulted: true }
    return { manufacturerName: cleaned, manufacturerDefaulted: false }
  }
  if (awaiting === 'manufacturerAddress') {
    if (DEFAULT_SKIP.test(cleaned)) return { addressDefaulted: true }
    return { manufacturerAddress: cleaned, addressDefaulted: false }
  }
  if (/^(evet|hayır|ok|tamam|olur|yok|bilmiyorum)$/i.test(cleaned)) {
    if (awaiting === 'colors' && /yok|bilmiyorum|hayır/i.test(cleaned)) return { colors: 'Motor paleti' }
    return {}
  }
  if (awaiting === 'packagingMode') {
    return { packagingMode: /etiket|label/i.test(cleaned) ? 'label' : 'box' }
  }
  if (awaiting === 'styleType') {
    const style = parseStyle(cleaned)
    return style ? { styleType: style } : { styleType: 'luxury' }
  }
  return { [awaiting]: cleaned } as Partial<DesignBrief>
}

export function applyExtraction(
  brief: DesignBrief,
  text: string,
  attachments: Attachment[],
  awaiting: AwaitingKey | null,
): DesignBrief {
  const assigned = assignAwaiting(text, awaiting)
  const extracted = extractFields(text, attachments)
  if (awaiting === 'brandName') {
    const explicitProduct = labeled(text, ['ürün', 'product'])
    if (!explicitProduct) delete extracted.productName
    if (!looksLikeSector(text)) {
      delete extracted.sector
      delete extracted.subProduct
    }
  }
  if (awaiting === 'productName') {
    delete extracted.brandName
    if (assigned.productName && sameName(assigned.productName, brief.brandName)) {
      delete assigned.productName
    }
    if (extracted.productName && sameName(extracted.productName, brief.brandName)) {
      delete extracted.productName
    }
  }
  if (
    awaiting === 'volume' ||
    awaiting === 'dimensionsMm' ||
    awaiting === 'barcode' ||
    awaiting === 'manufacturerName' ||
    awaiting === 'manufacturerAddress' ||
    awaiting === 'templateId'
  ) {
    delete extracted.brandName
    delete extracted.productName
    delete extracted.subProduct
    delete extracted.sector
  }
  let next = mergeBrief(mergeBrief(brief, assigned), extracted)
  if (awaiting === 'dimensionsMm') {
    const dims = parseDimensions(text)
    if (dims) next = mergeBrief(next, { dimensionsMm: dims })
  }
  if (next.productName && next.brandName && sameName(next.productName, next.brandName)) {
    next = { ...next, productName: '' }
  }
  return next
}
