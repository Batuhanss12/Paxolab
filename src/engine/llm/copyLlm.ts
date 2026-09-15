/**
 * LLM-backed copy generation — tagline, ingredients, warnings.
 * Falls back to local sampleCopy when LLM is unavailable or fails.
 * Sector-specific safety rules are enforced post-generation.
 */
import type { DesignBrief } from '../../types'
import { resolveSector } from '../designSystem/sector'
import { resolveMarkRecipe } from '../marks/MarkMatrix'
import { isGenericTagline } from '../studio/copyBank'
import { getLlmProvider } from './provider'

export interface LlmCopy {
  tagline: string
  ingredients: string
  warnings: string
}

interface LlmCopyResponse {
  tagline?: string
  ingredients?: string
  warnings?: string
}

const SYSTEM_PROMPT = `You are a packaging copywriter for FORMA, a professional packaging design tool.
Generate concise, professional packaging copy in Turkish (TR) unless the brief is clearly English.
Rules:
- tagline: 3–6 words, evocative, sector-appropriate. Never copy the brand name into the tagline.
- ingredients: realistic INCI or spec line for the sector. Mark as "örnek / düzenlenebilir" if uncertain.
- warnings: required regulatory warnings for the sector. Keep factual and short.
- Never invent medical claims, dosages, or allergen-free statements.
- Return JSON only: { "tagline", "ingredients", "warnings" }.`

/** Generate copy via LLM. Returns null when unavailable or invalid. */
export async function generateCopyWithLlm(brief: DesignBrief): Promise<LlmCopy | null> {
  const provider = getLlmProvider()
  if (!provider.enabled()) return null

  const sector = resolveSector(brief)
  const surface = brief.packagingMode === 'label' ? 'label' : 'box'
  const markWarn = resolveMarkRecipe(sector, surface).requiredTextWarnings.join(' ')

  const userPrompt = `Brief:
- Brand: ${brief.brandName || '(none)'}
- Product: ${brief.productName || '(none)'}
- Sub-product: ${brief.subProduct || '(none)'}
- Sector: ${sector}
- Volume: ${brief.volume || '(none)'}
- Packaging: ${surface}
- Custom tagline override: ${brief.copyOverrides || '(none)'}
- Required regulatory warnings (must appear in warnings): ${markWarn}`

  const parsed = await provider.generateStructured<LlmCopyResponse>({
    task: 'copy',
    system: SYSTEM_PROMPT,
    user: userPrompt,
    timeoutMs: 10000,
  })
  if (!parsed) return null

  const tagline = (parsed.tagline || '').trim().slice(0, 80)
  const ingredients = (parsed.ingredients || '').trim().slice(0, 400)
  const llmWarn = (parsed.warnings || '').trim().slice(0, 300)
  const warnings = mergeWarnings(llmWarn, markWarn)

  if (!tagline && !ingredients) return null

  return {
    tagline: brief.copyOverrides.trim() || tagline,
    ingredients,
    warnings,
  }
}

function usableIngredientLine(text: string): boolean {
  const t = text.trim()
  if (t.length < 8) return false
  if (/^(içerik(ler)?|ingredients?|örnek|n\/a|yok)$/i.test(t)) return false
  if (/svg|viewBox|stroke|#[0-9a-fA-F]{3,8}\b/i.test(t)) return false
  return true
}

export type MergedLlmCopy = {
  tagline: string
  ingredients: string
  warnings: string
  usedLlm: { tagline: boolean; ingredients: boolean }
}

/**
 * Studio/kit copy merge. User line wins; LLM tagline only if it is not boilerplate;
 * otherwise the sample (and later the studio bank) stays. Warnings always keep
 * required mark text via the LLM helper's merge, then union with sample.
 */
export function mergeLlmCopy(input: {
  llm?: LlmCopy | null
  sample: { tagline: string; ingredients: string; warnings: string }
  userTagline?: string
  brand?: string
}): MergedLlmCopy {
  const user = (input.userTagline ?? '').trim()
  const llmTag = (input.llm?.tagline ?? '').trim()
  const llmOk = Boolean(llmTag) && !isGenericTagline(llmTag, input.brand)
  const tagline = user || (llmOk ? llmTag : '') || input.sample.tagline
  const llmIng = (input.llm?.ingredients ?? '').trim()
  const ingOk = usableIngredientLine(llmIng)
  const llmWarn = (input.llm?.warnings ?? '').trim()
  return {
    tagline,
    ingredients: ingOk ? llmIng : input.sample.ingredients,
    warnings: mergeWarnings(llmWarn, input.sample.warnings),
    usedLlm: { tagline: !user && llmOk, ingredients: ingOk },
  }
}

/** Merge LLM warnings with required regulatory text, deduping. */
function mergeWarnings(llmWarn: string, required: string): string {
  if (!llmWarn) return required
  if (!required) return llmWarn
  const parts = [llmWarn]
  for (const w of required.split(/\.|\n/).map((s) => s.trim()).filter(Boolean)) {
    if (!llmWarn.toLowerCase().includes(w.toLowerCase())) parts.push(w)
  }
  return parts.join('. ')
}
