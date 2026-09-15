/**
 * Field extraction — parse free-text user message into a brief patch.
 * Extracted from extract.ts to isolate the extraction logic from conversational state.
 */
import type { Attachment, DesignBrief } from '../types'
import { inferCopyLocale } from './copyLocale'
import { parseDimensions, parseStyle } from './fields'
import {
  MODE_RULES,
  NAME_STOP_RE,
  SECTOR_RULES,
  SKIP_UTTERANCE,
} from './extractRules'
import {
  isGenericProductName,
  isPaletteName,
  labeled,
  labeledBlock,
  looksLikeName,
  sameName,
  looksLikeSector as looksLikeSectorLocal,
} from './extractHelpers'

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
  if (patch.sector && !looksLikeSectorLocal(patch.sector)) delete patch.sector

  const brand = labeled(raw, ['marka', 'brand'])
  if (looksLikeName(brand)) patch.brandName = brand
  const product = labeled(raw, ['ürün', 'product'])
  if (looksLikeName(product)) patch.productName = product

  const spokenBrand = raw.match(
    /(?:marka(?:nın)?\s+)?(?:adı|adın|adını)\s+([A-Za-zÇĞİÖŞÜçğıöşü][\wÇĞİÖŞÜçğıöşü'’-]{1,28})\s+olsun/i,
  )
  if (!patch.brandName && spokenBrand && looksLikeName(spokenBrand[1]) && !isGenericProductName(spokenBrand[1])) {
    patch.brandName = spokenBrand[1]
  }

  const quotes = [...raw.matchAll(/["“”']([^"“”']{2,40})["“”']/g)].map((m) => m[1].trim())
  if (!patch.brandName && quotes[0] && looksLikeName(quotes[0])) patch.brandName = quotes[0]
  if (!patch.productName && quotes[1] && looksLikeName(quotes[1])) patch.productName = quotes[1]

  const series = raw.match(
    /\b([A-Za-zÇĞİÖŞÜçğıöşü][\wÇĞİÖŞÜçğıöşü'’-]{1,28})\s+(special\s+series|özel\s+seri)\b/i,
  )
  if (series && looksLikeName(series[1]) && !isGenericProductName(series[1]) && !isPaletteName(series[1])) {
    if (!patch.brandName) patch.brandName = series[1]
    if (!patch.productName) patch.productName = /özel/i.test(series[2]) ? 'Özel Seri' : 'Special Series'
  }

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
    const wordCount = cut.split(/\s+/).filter(Boolean).length
    const shortOpen = wordCount <= 8 || /^\S+(?:\s+\S+){0,3}\s+için\b/i.test(cut)
    if (shortOpen) {
      const words = cut.split(/\s+/).filter((w) => {
        const token = w.replace(/[:\-–]+$/g, '')
        return !isPaletteName(token) && !NAME_STOP_RE.test(token)
      })
      if (!patch.brandName && words[0] && looksLikeName(words[0]) && !SKIP_UTTERANCE.test(words[0])) {
        patch.brandName = words[0]
      }
      if (!patch.productName && !brand && !spokenBrand && words.length > 1) {
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

  const locale = inferCopyLocale(raw)
  if (locale) patch.copyLocale = locale

  const dims = parseDimensions(raw)
  if (dims) patch.dimensionsMm = dims

  const vol = raw.match(/(\d+(?:[.,]\d+)?)\s*(ml|cl|l|gr|g|kg)\b/i)
  if (vol) patch.volume = `${vol[1]} ${vol[2].toLowerCase()}`

  const pao =
    raw.match(/\bpao\s*[:-]?\s*(\d{1,2})\s*(?:m|ay)?\b/i) ||
    raw.match(/\b(\d{1,2})\s*ay\b/i) ||
    raw.match(/\b(\d{1,2})M\b/)
  if (pao) patch.paoMonths = `${pao[1]}M`

  const colors: string[] = []
  const hex = raw.match(/#([0-9a-fA-F]{3,8})/g)
  if (hex) colors.push(...hex)
  if (/siyah|black/i.test(raw)) colors.push('Siyah')
  if (/altın|gold/i.test(raw)) colors.push('Altın')
  if (/bej|beige/i.test(raw)) colors.push('Bej')
  if (/koyu\s*ye[sş]il|dark\s*green/i.test(raw)) colors.push('Koyu yeşil')
  else if (/ye[sş]il|green/i.test(raw)) colors.push('Yeşil')
  if (/toprak|earth\s*tone/i.test(raw)) colors.push('Toprak')
  if (/krem|cream/i.test(raw) && !/yüz\s*krem|face\s*cream|night\s*cream/i.test(raw)) colors.push('Krem')
  if (colors.length) patch.colors = [...new Set(colors)].join(' · ')

  if (!patch.packagingMode && (patch.sector || patch.subProduct) && !/etiket|label|wrap/i.test(raw)) {
    patch.packagingMode = 'box'
  }

  const slogan = labeled(raw, ['slogan', 'tagline', 'metin'])
  if (slogan) patch.copyOverrides = slogan

  const ingredientMatch = raw.match(/(?:içerik|ingredient|aktif|active|formül)\s*[:\-–]\s*([^.,;]{3,60})/i)
  if (ingredientMatch) {
    patch.ingredientClaims = ingredientMatch[1].trim()
  } else {
    const plusChain = raw.match(/\b([A-Za-zÇĞİÖŞÜçğıöşü]+\s*\+\s*[A-Za-zÇĞİÖŞÜçğıöşü]+(?:\s*\+\s*[A-Za-zÇĞİÖŞÜçğıöşü]+)*)\b/)
    if (plusChain && /biotin|collagen|keratin|argan|vitamin|hyaluronic|niacinamide|retinol|peptide/i.test(plusChain[1])) {
      patch.ingredientClaims = plusChain[1].trim()
    }
  }

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
