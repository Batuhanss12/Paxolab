import type { Attachment, AwaitingKey, DesignBrief, PackagingMode } from '../types'
import { mergeBrief, parseDimensions, parseStyle } from './fields'

const MODE_RULES: { re: RegExp; mode: PackagingMode; sector?: string; sub?: string }[] = [
  { re: /kozmetik\s*kutusu|parfüm\s*kut/i, mode: 'box', sector: 'kozmetik', sub: 'parfüm' },
  { re: /gıda\s*ambalaj|gıda\s*kut/i, mode: 'box', sector: 'gıda' },
  { re: /elektronik\s*kut|kulaklık/i, mode: 'box', sector: 'elektronik', sub: 'kulaklık' },
  { re: /kutu\s*ambalaj|\bkutu\b/i, mode: 'box' },
  { re: /\betiket\b|label|wrap/i, mode: 'label' },
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

function looksLikeName(value: string): boolean {
  return !!value && value.length < 48 && !/[?]/.test(value) && /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(value)
}

export function extractFields(text: string, attachments: Attachment[]): Partial<DesignBrief> {
  const patch: Partial<DesignBrief> = {}
  const raw = text.trim()

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

  const brand = labeled(raw, ['marka', 'brand'])
  if (looksLikeName(brand)) patch.brandName = brand
  const product = labeled(raw, ['ürün', 'product'])
  if (looksLikeName(product)) patch.productName = product

  const quotes = [...raw.matchAll(/["“”']([^"“”']{2,40})["“”']/g)].map((m) => m[1].trim())
  if (!patch.brandName && quotes[0] && looksLikeName(quotes[0])) patch.brandName = quotes[0]
  if (!patch.productName && quotes[1] && looksLikeName(quotes[1])) patch.productName = quotes[1]

  const icin = raw.match(/^["“']?([A-Za-zÇĞİÖŞÜçğıöşü0-9][\wÇĞİÖŞÜçğıöşü&.'’\s-]{1,40}?)["”']?\s+için\b/i)
  if (icin && looksLikeName(icin[1]) && !patch.brandName) patch.brandName = icin[1].trim()

  if (!patch.productName && /parfüm|perfume/i.test(raw)) patch.productName = 'Parfüm'
  if (!patch.productName && /serum/i.test(raw)) patch.productName = 'Serum'
  if (!patch.productName && /krem|cream/i.test(raw)) patch.productName = 'Krem'

  if (!patch.brandName || !patch.productName) {
    const cut = raw.split(/[,.;]/)[0] ?? raw
    const words = cut.split(/\s+/).filter((w) => !/^(için|bir|ve|ile|kozmetik|kutusu|kutu|ambalaj|etiket|gıda|elektronik|siyah|altın|luxury)$/i.test(w))
    if (!patch.brandName && words[0] && looksLikeName(words[0])) patch.brandName = words[0]
    if (!patch.productName && words.length > 1) {
      const rest = words.slice(1, 3).join(' ')
      if (looksLikeName(rest)) patch.productName = rest
    }
  }

  const style = parseStyle(raw)
  if (style) patch.styleType = style

  const dims = parseDimensions(raw)
  if (dims) patch.dimensionsMm = dims

  const vol = raw.match(/(\d+(?:[.,]\d+)?)\s*(ml|cl|l|gr|g|kg)\b/i)
  if (vol) patch.volume = `${vol[1]} ${vol[2].toLowerCase()}`

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
  }

  if (attachments.length) {
    const logos = attachments.filter((a) => a.kind === 'logo')
    const refs = attachments.filter((a) => a.kind === 'referans')
    if (logos.length) patch.logo = logos.map((a) => a.name).join(', ')
    if (refs.length) patch.references = refs.map((a) => a.name).join(', ')
    if (!patch.logo && attachments[0]) patch.logo = attachments[0].name
  }

  return patch
}

export function assignAwaiting(text: string, awaiting: AwaitingKey | null): Partial<DesignBrief> {
  if (!awaiting || awaiting === 'dimensionsMm' || awaiting === 'templateId') return {}
  const cleaned = text.replace(/^[\s\-–:]+/, '').replace(/[?.!]+$/, '').trim()
  if (!cleaned || cleaned.length > 80) return {}
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
  let next = mergeBrief(mergeBrief(brief, assigned), extracted)
  if (awaiting === 'dimensionsMm') {
    const dims = parseDimensions(text)
    if (dims) next = mergeBrief(next, { dimensionsMm: dims })
  }
  return next
}
