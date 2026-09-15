import type { DesignBrief } from '../types'
import { withProvenance } from './briefProvenance'
import { getLlmProvider } from './llm/provider'

/** Confidence stamped on LLM-extracted fields. Heuristic USER_EXPLICIT values outrank them in mergeBrief. */
export const LLM_EXTRACT_CONFIDENCE = 0.75

const SYSTEM_PROMPT =
  'Extract a FORMA DesignBrief JSON only. Keys: brandName, productName, sector, subProduct, packagingMode (box|label — box if they asked for both box and label), styleType (mood hint: luxury|modern|minimal|eco|playful|classic — not a template; if they avoid classic/cheap and ask editorial/premium use luxury or modern, never classic), directorCue (luxury-tighten for editorial/restrained/quiet; else omit), colors (hex or names including beige/bej, green/yeşil, earth/toprak; primary palette seed), volume, barcode, manufacturerName, manufacturerAddress, copyLocale (tr|en). Leave barcode empty if the user did not give digits. Leave dimensions out of JSON unless they gave L×W×H or W×H. Leave copyLocale empty unless the user asked for Turkish or English copy. Do not set productName to generic sector words (Parfüm, Krem, Serum, Kahve). Leave productName empty if the user only named the category or only gave a brand. Never copy brandName into productName. For labels, do not invent manufacturer or box L×W×H. No image generation.'

/**
 * Optional LLM brief extract through the provider abstraction. Heuristic engine stays
 * the default; every returned field is stamped LLM_INFERRED so it can never be
 * presented as user fact or overwrite an explicit answer.
 */
export async function extractBriefWithLlm(text: string): Promise<Partial<DesignBrief> | null> {
  const provider = getLlmProvider()
  if (!provider.enabled()) return null
  const parsed = await provider.generateStructured<Partial<DesignBrief>>({
    task: 'brief-extract',
    system: SYSTEM_PROMPT,
    user: text,
    timeoutMs: 8000,
  })
  if (!parsed || typeof parsed !== 'object') return null
  const brand = parsed.brandName?.trim() ?? ''
  const brandKey = brand.toLocaleLowerCase('tr')
  if (brandKey && parsed.productName?.trim().toLocaleLowerCase('tr') === brandKey) delete parsed.productName
  if (brandKey && parsed.sector?.trim().toLocaleLowerCase('tr') === brandKey) delete parsed.sector
  if (brandKey && parsed.subProduct?.trim().toLocaleLowerCase('tr') === brandKey) delete parsed.subProduct
  if (parsed.sector && !/kozmetik|gıda|içecek|sağlık|takviye|bebek|elektronik|parfüm|parfum|krem|serum|yağ|temizlik|kahve|coffee/i.test(parsed.sector)) {
    delete parsed.sector
  }
  delete parsed.provenance
  return withProvenance(parsed, 'LLM_INFERRED', LLM_EXTRACT_CONFIDENCE)
}
