import type { CopyLocale, DesignBrief, PackagingMode, StyleType } from '../types'
import { isPriceTier } from './briefDepth'
import { withProvenance } from './briefProvenance'
import type { DirectorCue } from './brain/DesignPlan'
import { getLlmProvider } from './llm/provider'

/** Confidence stamped on LLM-extracted fields. Heuristic USER_EXPLICIT values outrank them in mergeBrief. */
export const LLM_EXTRACT_CONFIDENCE = 0.75

const SYSTEM_PROMPT =
  'Extract a FORMA DesignBrief JSON only. Keys: brandName, productName, sector, subProduct, packagingMode (box|label — box if they asked for both box and label), styleType (mood hint: luxury|modern|minimal|eco|playful|classic — not a template; if they avoid classic/cheap and ask editorial/premium use luxury or modern, never classic), directorCue (luxury-tighten for editorial/restrained/quiet; else omit), colors (hex or names including beige/bej, green/yeşil, earth/toprak; primary palette seed), volume, barcode, manufacturerName, manufacturerAddress, copyLocale (tr|en). ' +
  'Brief depth, only when the user said it: audience (who buys it, short phrase), channel (raf|e-ticaret|butik|eczane|salon|hediye|otel / spa|ihracat), priceTier (mass|mid|premium|boutique), feeling (short phrase: sakin, sıcak, güçlü, taze, zarif…), avoidLike (what it must not look like, as they said it). ' +
  'Perfume copy tiers, only when given: concentration (edp|edt|extrait|eau de cologne or as written), edition, attribution (a "by …" line), origin (city · year). ' +
  'Leave barcode empty if the user did not give digits. Leave dimensions out of JSON unless they gave L×W×H or W×H. Leave copyLocale empty unless the user asked for Turkish or English copy. Do not set productName to generic sector words (Parfüm, Krem, Serum, Kahve). Leave productName empty if the user only named the category or only gave a brand. Never copy brandName into productName. For labels, do not invent manufacturer or box L×W×H. Never invent depth or tier values that were not said. No image generation. No SVG, path, coordinates, templateId, or structureId.'

const BRIEF_KEYS = [
  'brandName',
  'productName',
  'sector',
  'subProduct',
  'packagingMode',
  'styleType',
  'directorCue',
  'colors',
  'volume',
  'barcode',
  'manufacturerName',
  'manufacturerAddress',
  'copyLocale',
  'audience',
  'channel',
  'priceTier',
  'feeling',
  'avoidLike',
  'concentration',
  'edition',
  'attribution',
  'origin',
] as const

const STYLES = new Set<StyleType>(['luxury', 'modern', 'minimal', 'eco', 'playful', 'classic'])
const CUES = new Set<DirectorCue>([
  'none',
  'luxury-arrive',
  'luxury-tighten',
  'open-air',
  'warm-natural',
  'graphic-push',
])
const GEOMETRY = /<svg|<\/svg>|viewBox|stroke-width|\bpath\b|d="|polygon|polyline|\bfold\b|\bbleed\b|\b[xy]\s*=|width\s*=|height\s*=/i
const SECTOR_OK =
  /kozmetik|gıda|içecek|sağlık|takviye|bebek|elektronik|parfüm|parfum|krem|serum|yağ|temizlik|kahve|coffee/i

function cleanText(value: unknown): string {
  if (typeof value !== 'string') return ''
  const text = value.trim()
  if (!text || GEOMETRY.test(text)) return ''
  return text
}

function hasPayload(patch: Partial<DesignBrief>): boolean {
  return BRIEF_KEYS.some((key) => {
    const value = patch[key]
    return typeof value === 'string' && value.trim().length > 0
  })
}

/**
 * Closed semantic allowlist. templateId / dimensions / SVG / unknown families never enter the brief.
 */
export function sanitizeBriefExtract(raw: unknown): Partial<DesignBrief> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const parsed = raw as Record<string, unknown>
  const out: Partial<DesignBrief> = {}

  const brand = cleanText(parsed.brandName)
  if (brand) out.brandName = brand
  const product = cleanText(parsed.productName)
  if (product) out.productName = product
  const sector = cleanText(parsed.sector)
  if (sector && SECTOR_OK.test(sector)) out.sector = sector
  const sub = cleanText(parsed.subProduct)
  if (sub) out.subProduct = sub

  const mode = cleanText(parsed.packagingMode)
  if (mode === 'box' || mode === 'label') out.packagingMode = mode as PackagingMode

  const style = cleanText(parsed.styleType)
  if (STYLES.has(style as StyleType)) out.styleType = style as StyleType

  const cue = cleanText(parsed.directorCue)
  if (CUES.has(cue as DirectorCue)) out.directorCue = cue

  const colors = cleanText(parsed.colors)
  if (colors) out.colors = colors
  const volume = cleanText(parsed.volume)
  if (volume) out.volume = volume

  const barcode = cleanText(parsed.barcode).replace(/\s+/g, '')
  if (/^\d{8,14}$/.test(barcode)) out.barcode = barcode

  const manufacturer = cleanText(parsed.manufacturerName)
  if (manufacturer) out.manufacturerName = manufacturer
  const address = cleanText(parsed.manufacturerAddress)
  if (address) out.manufacturerAddress = address

  const locale = cleanText(parsed.copyLocale)
  if (locale === 'tr' || locale === 'en') out.copyLocale = locale as CopyLocale

  // Brief depth and perfume tiers: free text through the same geometry gate, capped short so a
  // paragraph the model volunteers cannot become a label line; the price tier is a closed enum.
  const short = (value: unknown, max: number): string => cleanText(value).slice(0, max).trim()
  const audience = short(parsed.audience, 60)
  if (audience) out.audience = audience
  const channel = short(parsed.channel, 40)
  if (channel) out.channel = channel
  const tier = cleanText(parsed.priceTier)
  if (isPriceTier(tier)) out.priceTier = tier
  const feeling = short(parsed.feeling, 40)
  if (feeling) out.feeling = feeling
  const avoidLike = short(parsed.avoidLike, 80)
  if (avoidLike) out.avoidLike = avoidLike
  const concentration = short(parsed.concentration, 30)
  if (concentration) out.concentration = concentration
  const edition = short(parsed.edition, 40)
  if (edition) out.edition = edition
  const attribution = short(parsed.attribution, 50)
  if (attribution) out.attribution = attribution
  const origin = short(parsed.origin, 40)
  if (origin) out.origin = origin

  const brandKey = (out.brandName ?? '').toLocaleLowerCase('tr')
  if (brandKey && out.productName?.toLocaleLowerCase('tr') === brandKey) delete out.productName
  if (brandKey && out.sector?.toLocaleLowerCase('tr') === brandKey) delete out.sector
  if (brandKey && out.subProduct?.toLocaleLowerCase('tr') === brandKey) delete out.subProduct

  return hasPayload(out) ? out : null
}

/**
 * Optional LLM brief extract through the provider abstraction. Heuristic engine stays
 * the default; every returned field is stamped LLM_INFERRED so it can never be
 * presented as user fact or overwrite an explicit answer.
 */
export async function extractBriefWithLlm(text: string): Promise<Partial<DesignBrief> | null> {
  try {
    const provider = getLlmProvider()
    if (!provider.enabled()) return null
    const parsed = await provider.generateStructured<unknown>({
      task: 'brief-extract',
      system: SYSTEM_PROMPT,
      user: text,
      timeoutMs: 8000,
    })
    const clean = sanitizeBriefExtract(parsed)
    if (!clean) return null
    return withProvenance(clean, 'LLM_INFERRED', LLM_EXTRACT_CONFIDENCE)
  } catch {
    return null
  }
}
