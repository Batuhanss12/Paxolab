/**
 * Field extraction — parse free-text user message into a brief patch.
 * Extracted from extract.ts to isolate the extraction logic from conversational state.
 */
import type { Attachment, DesignBrief } from '../types'
import { inferCopyLocale } from './copyLocale'
import { parseDimensions, parseStyle } from './fields'
import {
  GREETING_RE,
  MODE_RULES,
  NAME_STOP_RE,
  SECTOR_NOUN_RE,
  SECTOR_RULES,
  SKIP_UTTERANCE,
  normaliseSectorTypos,
  stripBrandTail,
} from './extractRules'
import {
  isGenericProductName,
  isPaletteName,
  isSectorOrSurfaceName,
  labeledBlock,
  looksLikeName,
  looksLikeSector,
  sameName,
} from './extractHelpers'
import { spokenBrandName, spokenProductName } from './spokenNames'
import { templateIdFromUtterance } from './catalog/structureOffer'
import { extractSpokenCopy } from './extractCopy'

export function extractFields(text: string, attachments: Attachment[]): Partial<DesignBrief> {
  const patch: Partial<DesignBrief> = {}
  // "Elektornik kutu" is a mistyped category, not a brand called Elektornik.
  const raw = normaliseSectorTypos(text.trim())
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
  const structureTmpl = templateIdFromUtterance(raw, patch.packagingMode || '')
  if (structureTmpl) patch.templateId = structureTmpl
  for (const rule of SECTOR_RULES) {
    if (rule.re.test(raw)) {
      if (!patch.sector) patch.sector = rule.sector
      if (rule.sub && !patch.subProduct) patch.subProduct = rule.sub
      break
    }
  }
  if (patch.sector && !looksLikeSector(patch.sector)) delete patch.sector

  /*
   * What the customer labelled, read before anything is guessed from word order.
   *
   * `spokenNames` holds the three readings, most explicit first, and `extract.ts` uses the same
   * module to decide which corrections survive while another question is pending — one definition
   * of "the customer named this field on purpose", not two that can drift apart. The measured
   * failure it fixes: "Noctis markası için parfüm şişesi etiketi, ürün Gece Serisi" set the
   * product to "şişesi" while the answer sat in the sentence, spelled out.
   */
  const brand = spokenBrandName(raw)
  if (brand) patch.brandName = brand
  const product = spokenProductName(raw)
  if (product && !sameName(product, brand)) patch.productName = product

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
  // "Nexora markası için…" — the possessive tail is grammar, not part of the name.
  const icinName = icin ? stripBrandTail(icin[1]) : ''
  if (icinName && looksLikeName(icinName) && !patch.brandName) {
    const parts = icinName.split(/\s+/).filter(Boolean)
    if (parts.length >= 3 && !isGenericProductName(parts[parts.length - 1] ?? '')) {
      patch.brandName = parts.slice(0, -1).join(' ')
      if (!patch.productName) patch.productName = parts[parts.length - 1]
    } else {
      patch.brandName = icinName
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
      const rawWords = cut.split(/\s+/).filter(Boolean)
      const words = rawWords.filter((w) => {
        const token = w.replace(/[:\-–]+$/g, '')
        return !isPaletteName(token) && !NAME_STOP_RE.test(token)
      })
      // "Elite Brew kutu" / "Hair Process etiket": a leading run of capitalised name tokens
      // followed only by category words is one multi-word brand, not brand + product.
      const run: string[] = []
      for (const w of rawWords) {
        const token = w.replace(/[:\-–,]+$/g, '')
        const nameLike =
          /^[A-ZÇĞİÖŞÜ][\wÇĞİÖŞÜçğıöşü.'’&-]*$/.test(token) &&
          !NAME_STOP_RE.test(token) &&
          !isPaletteName(token) &&
          !isGenericProductName(token) &&
          !SKIP_UTTERANCE.test(token)
        if (!nameLike) break
        run.push(token)
      }
      const after = rawWords.slice(run.length).map((w) => w.replace(/[,.:;]+$/g, '').toLocaleLowerCase('tr'))
      const onlyCategoryAfter =
        after.length > 0 && after.every((w) => NAME_STOP_RE.test(w) || SECTOR_NOUN_RE.test(w) || isGenericProductName(w))
      let brandRun = 0
      if (!patch.brandName && run.length >= 2 && run.length <= 3 && onlyCategoryAfter) {
        patch.brandName = run.join(' ')
        brandRun = run.length
      }
      // The positional fallback, and the last place a greeting could have become a brand.
      if (
        !patch.brandName &&
        words[0] &&
        looksLikeName(words[0]) &&
        !SKIP_UTTERANCE.test(words[0]) &&
        !GREETING_RE.test(words[0])
      ) {
        patch.brandName = words[0]
      }
      if (!patch.productName && !brand && !spokenBrand && words.length > 1 && !brandRun) {
        // Compare against the brand's *words*, not the whole string: with brand "Elite Brew",
        // "Brew" is not a product name — taking it would later chop the brand back to "Elite".
        const brandWords = new Set(
          (patch.brandName ?? '')
            .toLocaleLowerCase('tr')
            .split(/\s+/)
            .filter(Boolean),
        )
        const rest = words.slice(1).find(
          (w) =>
            looksLikeName(w) &&
            !isGenericProductName(w) &&
            !isPaletteName(w) &&
            stripBrandTail(w) !== '' &&
            !brandWords.has(w.toLocaleLowerCase('tr')),
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
  if (patch.brandName && (SKIP_UTTERANCE.test(patch.brandName) || isPaletteName(patch.brandName) || isSectorOrSurfaceName(patch.brandName))) {
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

  /*
   * A word inside a refusal is not a request.
   *
   * These tests only asked whether the word appeared. Measured on an ordinary sentence — "çok
   * klinik durmasın, sıcak bir şey istiyorum" — the brief came back with `colors: "Klinik"`, the
   * customer's palette set to the one thing they had just ruled out. The negated span is removed
   * before anything is read from it; `avoidMotifs` in `conversationUnderstand` is where a refusal
   * is supposed to land, and it still gets the original text.
   */
  const wanted = raw.replace(
    /(\S+(?:\s+\S+){0,3}?)\s+(?:durmasın|olmasın|istemiyorum|istemem|olmasını istemiyorum|yapma|kullanma|sevmiyorum)/gi,
    ' ',
  )

  const colors: string[] = []
  const hex = wanted.match(/#([0-9a-fA-F]{3,8})/g)
  if (hex) colors.push(...hex)
  if (/siyah|black/i.test(wanted)) colors.push('Siyah')
  if (/altın|gold/i.test(wanted)) colors.push('Altın')
  if (/bej|beige/i.test(wanted)) colors.push('Bej')
  if (/koyu\s*ye[sş]il|dark\s*green/i.test(wanted)) colors.push('Koyu yeşil')
  else if (/ye[sş]il|green/i.test(wanted)) colors.push('Yeşil')
  if (/toprak|earth\s*tone/i.test(wanted)) colors.push('Toprak')
  if (/krem|cream/i.test(wanted) && !/yüz\s*krem|face\s*cream|night\s*cream/i.test(wanted)) colors.push('Krem')
  if (/mermer|marble/i.test(wanted)) colors.push('Mermer')
  if (/botanik|\bleaf\b|yaprak/i.test(wanted)) colors.push('Botanik')
  if (/klinik|clinical/i.test(wanted)) colors.push('Klinik')
  if (/\bdalga\b|\bwave\b/i.test(wanted)) colors.push('Dalga')
  if (/manzara|landscape/i.test(wanted)) colors.push('Manzara')
  if (/diyagonal|diagonal|antrasit/i.test(wanted)) colors.push('Antrasit')
  if (colors.length) patch.colors = [...new Set(colors)].join(' · ')

  const spokenCopy = extractSpokenCopy(raw)
  if (spokenCopy.copyOverrides) patch.copyOverrides = spokenCopy.copyOverrides
  if (spokenCopy.story) patch.story = spokenCopy.story

  const ingredientMatch = raw.match(/(?:içerik|ingredient|aktif|active|formül)\s*[:\-–]\s*([^.,;]{3,60})/i)
  if (ingredientMatch) {
    patch.ingredientClaims = ingredientMatch[1].trim()
  } else {
    const plusChain = raw.match(/\b([A-Za-zÇĞİÖŞÜçğıöşü]+\s*\+\s*[A-Za-zÇĞİÖŞÜçğıöşü]+(?:\s*\+\s*[A-Za-zÇĞİÖŞÜçğıöşü]+)*)\b/)
    if (plusChain && /biotin|collagen|keratin|argan|vitamin|hyaluronic|niacinamide|retinol|peptide/i.test(plusChain[1])) {
      patch.ingredientClaims = plusChain[1].trim()
    }
  }

  if (/barkod|\bean[\s-]?13\b|\bgtin\b/i.test(raw)) {
    const digits = raw.match(/\b\d{8,14}\b/)
    if (digits) {
      patch.barcode = digits[0]
      patch.barcodeDefaulted = false
    } else if (/barkod\s*(?:yok|örnek|olmasın|gerekmiyor|sonra)|(?:örnek|yok)\s*barkod/i.test(raw)) {
      /*
       * "Barkod örnek" answers the barcode question inside an ordinary sentence. It used to be
       * ignored, so a customer who had already said it was asked again on the next turn — and on
       * the opener a customer is most likely to type, that question was the only thing standing
       * between them and their design.
       */
      patch.barcodeDefaulted = true
    }
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
