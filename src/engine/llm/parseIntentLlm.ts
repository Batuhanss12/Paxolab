/**
 * LLM-backed intent parsing — semantic iteration commands.
 * Falls back to local regex parser when LLM is unavailable or fails.
 * Only style/scale/palette/tagline/product/brand fields are accepted;
 * the LLM cannot inject arbitrary overrides.
 */
import type { DesignBrief, DesignOverrides, DesignSpec, StyleType } from '../../types'
import type { IterateIntent } from '../iterate/parseIntent'
import { llmComplete, parseLlmJson } from './client'

interface LlmIntentResponse {
  styleType?: StyleType
  titleScale?: number
  logoScale?: number
  paletteShift?: 'gold' | 'dark' | 'warm' | 'minimal' | ''
  premium?: boolean
  printReady?: boolean
  barcodeVisible?: boolean
  directorCue?: string
  tagline?: string
  product?: string
  brand?: string
  note?: string
}

const SYSTEM_PROMPT = `You are an intent parser for FORMA, a packaging design tool.
Parse the user's iteration request and return a JSON object with only the fields that apply.
Accepted fields:
- styleType: one of "luxury" | "modern" | "minimal" | "eco" | "playful" | "classic"
- titleScale: number (e.g. 1.28 to enlarge, 0.82 to shrink) — only if user asks to resize text
- logoScale: number (e.g. 1.35 to enlarge, 0.72 to shrink) — only if user asks to resize logo
- paletteShift: "gold" | "dark" | "warm" | "minimal" | "" — only if user mentions color/finish
- premium: true if user wants luxury/premium feel
- printReady: true if user wants print-ready / production check
- barcodeVisible: boolean — only if user mentions barcode/QR
- directorCue: "graphic-push" | "open-air" | "warm-natural" | "luxury-arrive" | "luxury-tighten" | "" — compositional mood
- tagline: new tagline text — only if user explicitly sets a new tagline
- product: new product name — only if user explicitly renames the product
- brand: new brand name — only if user explicitly renames the brand
- note: short Turkish confirmation of what changed
Rules:
- Do NOT invent fields the user did not request.
- Keep note in Turkish, 1 sentence.
- Return JSON only.`

/** Parse iteration intent via LLM. Returns null when unavailable or invalid. */
export async function parseIntentWithLlm(
  text: string,
  currentStyle: StyleType | '',
  brief: DesignBrief,
): Promise<IterateIntent | null> {
  if (!import.meta.env.VITE_FORMA_LLM_URL) return null

  const userPrompt = `Current style: ${currentStyle || '(none)'}
Current brand: ${brief.brandName || '(none)'}
Current product: ${brief.productName || '(none)'}
User request: "${text}"`

  const content = await llmComplete(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    { json: true, timeoutMs: 8000 },
  )
  if (!content) return null

  const parsed = parseLlmJson<LlmIntentResponse>(content)
  if (!parsed) return null

  const overridePatch: Partial<DesignOverrides> = {}
  const copyPatch: Partial<DesignSpec['copy']> = {}
  const briefPatch: Partial<DesignBrief> = {}
  const notes: string[] = []

  if (parsed.styleType) {
    briefPatch.styleType = parsed.styleType
    if (parsed.styleType === 'luxury') {
      overridePatch.premium = true
      if (currentStyle === 'luxury') overridePatch.directorCue = 'luxury-tighten'
      else {
        overridePatch.directorCue = 'luxury-arrive'
        overridePatch.paletteShift = 'gold'
      }
    }
    if (parsed.styleType === 'minimal') {
      overridePatch.premium = false
      overridePatch.paletteShift = 'minimal'
    }
    notes.push(`Stil ${parsed.styleType} yönüne çekildi.`)
  }

  if (parsed.titleScale && parsed.titleScale > 0 && parsed.titleScale < 3) {
    overridePatch.titleScale = parsed.titleScale
    notes.push(parsed.titleScale > 1 ? 'Başlığı büyüttüm.' : 'Başlığı küçülttüm.')
  }

  if (parsed.logoScale && parsed.logoScale > 0 && parsed.logoScale < 3) {
    overridePatch.logoScale = parsed.logoScale
    notes.push(parsed.logoScale > 1 ? 'Logo ölçeğini büyüttüm.' : 'Logo ölçeğini küçülttüm.')
  }

  if (parsed.paletteShift) {
    overridePatch.paletteShift = parsed.paletteShift
    if (parsed.paletteShift === 'gold') {
      overridePatch.premium = true
      if (!briefPatch.styleType) briefPatch.styleType = 'luxury'
    }
    notes.push('Paleti güncelledim.')
  }

  if (parsed.premium === true) overridePatch.premium = true
  if (parsed.printReady === true) {
    overridePatch.printReady = true
    notes.push('Üretim ön kontrolünü çalıştırdım.')
  }
  if (parsed.barcodeVisible !== undefined) {
    overridePatch.barcodeVisible = parsed.barcodeVisible
    notes.push(parsed.barcodeVisible ? 'Barkodu ekledim.' : 'Barkodu kaldırdım.')
  }
  if (parsed.directorCue) overridePatch.directorCue = parsed.directorCue

  if (parsed.tagline) {
    const value = parsed.tagline.trim().slice(0, 80)
    overridePatch.customTagline = value
    copyPatch.tagline = value
    briefPatch.copyOverrides = value
    notes.push(`Metni güncelledim.`)
  }

  if (parsed.product) {
    const value = parsed.product.trim().slice(0, 60)
    copyPatch.product = value
    briefPatch.productName = value
    notes.push(`Ürün adını güncelledim.`)
  }

  if (parsed.brand) {
    const value = parsed.brand.trim().slice(0, 60)
    copyPatch.brand = value
    briefPatch.brandName = value
    notes.push(`Markayı güncelledim.`)
  }

  if (parsed.note && notes.length === 0) notes.push(parsed.note.slice(0, 120))
  if (notes.length === 0) notes.push('İsteği motora ilettim, yüzeyi güncelledim.')

  return { overridePatch, copyPatch, briefPatch, note: notes.join(' ') }
}
