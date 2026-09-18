/**
 * Vision — the model looks at the face.
 *
 * Every LLM channel before F-7 was text: the model was told the brief and asked for a direction,
 * and never saw what was painted. That leaves the one judgement a studio makes last — "does this
 * read?" — to the ledger, which can count collisions but cannot see a face that is technically
 * clean and visibly wrong. Three tasks fill that gap:
 *
 *   - `vision-critique`   the rendered front → legibility, balance, hierarchy, ≤3 issues, and a
 *                         suggestion on the direction's own axes;
 *   - `vision-reference`  a customer's reference image → closed-vocabulary direction hints and a
 *                         short palette;
 *   - `vision-compare`    two rendered fronts → which one, and why.
 *
 * Nothing the model says becomes geometry. Every enum goes through the same gates as the art
 * director's, free text is capped and screened for coordinates and hex, and a critique reaches
 * the face only as an *offer* whose utterance is a design command the customer could have typed.
 * The rasteriser is injected: the browser turns the SVG into a PNG data URL, tests pass a stub,
 * and the engine never touches the DOM itself.
 */
import type { DesignSpec } from '../../types'
import { renderFrontSvg } from '../artwork/renderArtwork'
import { sanitizeStudioDirection } from './studioDirectorLlm'
import { getLlmProvider } from './provider'
import {
  ALL_ARCHETYPES,
  ALL_BACKGROUNDS,
  ALL_FRAMES,
  ALL_ORNAMENTS,
  ALL_TEMPERAMENTS,
  ALL_TYPE_PAIRINGS,
  isFrame,
  isOrnament,
  isTemperament,
  isTypePairing,
} from '../studio/referenceDna'
import type { DirectionHints, FrameStyle, OrnamentLevel, StudioCriticOffer, Temperament, TypePairing } from '../studio/types'

/** SVG markup → image data URL (PNG). Null when no rasteriser is available (server, tests). */
export type Rasterise = (svg: string) => Promise<string | null>

const GEOMETRY = /svg|viewBox|stroke-width|path\s|d="|#[0-9a-fA-F]{3,8}\b|\b\d+(\.\d+)?\s*(mm|px)\b|\.svg\b|filename|x\s*=\s*\d|y\s*=\s*\d/i

const LEGIBILITY = ['ok', 'weak', 'poor'] as const
const BALANCE = ['ok', 'top-heavy', 'bottom-heavy', 'crowded', 'empty'] as const
const HIERARCHY = ['brand-leads', 'product-leads', 'unclear'] as const

export type VisionCritique = {
  legibility: (typeof LEGIBILITY)[number]
  balance: (typeof BALANCE)[number]
  hierarchy: (typeof HIERARCHY)[number]
  /** ≤3 short sentences, screened for geometry. */
  issues: string[]
  /** What the model would move, on the direction's own axes only. */
  suggest: { frame?: FrameStyle; ornament?: OrnamentLevel; typePairing?: TypePairing; temperament?: Temperament }
}

export type VisionReference = {
  direction: DirectionHints | null
  /** ≤3 hex colours read off the reference — the one place hex is *expected* from the model. */
  palette: string[]
  notes: string
}

export type VisionCompare = { preferred: 0 | 1; reason: string }

function cleanLine(value: unknown, max = 120): string {
  if (typeof value !== 'string') return ''
  const t = value.trim().slice(0, max)
  return t && !GEOMETRY.test(t) ? t : ''
}

function oneOf<T extends readonly string[]>(list: T, value: unknown): T[number] | undefined {
  return typeof value === 'string' && (list as readonly string[]).includes(value) ? (value as T[number]) : undefined
}

/** Closed-vocabulary gate for the critique. Null when the reply carries nothing usable. */
export function sanitizeVisionCritique(raw: unknown): VisionCritique | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const parsed = raw as Record<string, unknown>
  const legibility = oneOf(LEGIBILITY, parsed.legibility)
  const balance = oneOf(BALANCE, parsed.balance)
  const hierarchy = oneOf(HIERARCHY, parsed.hierarchy)
  const issues = (Array.isArray(parsed.issues) ? parsed.issues : []).map((row) => cleanLine(row)).filter(Boolean).slice(0, 3)
  const s = (parsed.suggest && typeof parsed.suggest === 'object' ? parsed.suggest : {}) as Record<string, unknown>
  const suggest: VisionCritique['suggest'] = {}
  if (isFrame(s.frame)) suggest.frame = s.frame
  if (isOrnament(s.ornament)) suggest.ornament = s.ornament
  if (isTypePairing(s.typePairing)) suggest.typePairing = s.typePairing
  if (isTemperament(s.temperament)) suggest.temperament = s.temperament
  if (!legibility && !balance && !hierarchy && !issues.length && !Object.keys(suggest).length) return null
  return { legibility: legibility ?? 'ok', balance: balance ?? 'ok', hierarchy: hierarchy ?? 'brand-leads', issues, suggest }
}

export function sanitizeVisionReference(raw: unknown): VisionReference | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const parsed = raw as Record<string, unknown>
  const direction = sanitizeStudioDirection(parsed as Parameters<typeof sanitizeStudioDirection>[0])
  const palette = (Array.isArray(parsed.palette) ? parsed.palette : [])
    .map((row) => (typeof row === 'string' ? row.trim().toLowerCase() : ''))
    .filter((hex) => /^#[0-9a-f]{6}$/.test(hex))
    .slice(0, 3)
  const notes = cleanLine(parsed.notes, 160)
  if (!direction && !palette.length && !notes) return null
  return { direction, palette, notes }
}

export function sanitizeVisionCompare(raw: unknown): VisionCompare | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const parsed = raw as Record<string, unknown>
  const preferred = parsed.preferred === 0 || parsed.preferred === 1 ? parsed.preferred : parsed.preferred === '0' ? 0 : parsed.preferred === '1' ? 1 : null
  if (preferred === null) return null
  return { preferred, reason: cleanLine(parsed.reason, 160) }
}

const CRITIQUE_SYSTEM = `You are a senior packaging art director reviewing a rendered label or carton front.
Return JSON only: { "legibility": ok|weak|poor, "balance": ok|top-heavy|bottom-heavy|crowded|empty, "hierarchy": brand-leads|product-leads|unclear, "issues": [up to 3 short Turkish sentences], "suggest": { "frame"?, "ornament"?, "typePairing"?, "temperament"? } }.
frame ∈ none|thin-double|corner-brackets|rounded-card|band-hairline|fleuron-crown|bezel. ornament ∈ quiet|measured|rich. typePairing ∈ serif-display/sans-meta|script-accent/sans-heavy|sans-light/sans-heavy|spaced-serif/spaced-sans. temperament ∈ dark-luxe|light-luxe|vivid-mono|natural-warm|clean-clinical|tech-dark.
Judge what a shopper sees at arm's length: can the brand be read first, is the face balanced, is the decoration helping or competing. Suggest only what would change that. No coordinates, sizes, hex colours or file names — those are dropped.`

const REFERENCE_SYSTEM = `You are a packaging art director looking at a reference the customer likes.
Return JSON only: { "archetype"?, "background"?, "temperament"?, "typePairing"?, "frame"?, "ornament"?, "palette": [up to 3 hex], "notes": one short Turkish sentence }.
Use only these vocabularies. archetype ∈ ${ALL_ARCHETYPES.join('|')}. background ∈ ${ALL_BACKGROUNDS.join('|')}. temperament ∈ ${ALL_TEMPERAMENTS.join('|')}. typePairing ∈ ${ALL_TYPE_PAIRINGS.join('|')}. frame ∈ ${ALL_FRAMES.join('|')}. ornament ∈ ${ALL_ORNAMENTS.join('|')}.
Describe the reference's *system* — how the type sits, what the field is, how much decoration — not its exact artwork. Omit any key you are unsure about.`

const COMPARE_SYSTEM = `You are a packaging art director comparing two rendered fronts for the same brief (image 1, then image 2).
Return JSON only: { "preferred": 0|1, "reason": one short Turkish sentence }. Prefer the face a shopper reads faster and that better fits the brief's sector and mood. No coordinates, sizes or hex.`

export async function critiqueFaceWithVision(
  input: {
    svg: string
    brief: { brand: string; product: string; sector: string; style?: string; audience?: string; feeling?: string }
    direction: { archetype: string; frame: string; ornament: string; typePairing: string; temperament: string }
  },
  rasterise: Rasterise,
): Promise<VisionCritique | null> {
  const provider = getLlmProvider()
  if (!provider.enabled()) return null
  try {
    const image = await rasterise(input.svg)
    if (!image) return null
    const user = [
      `Brand: ${input.brief.brand || '(none)'}; product: ${input.brief.product || '(none)'}; sector: ${input.brief.sector}; mood: ${input.brief.style || '(none)'}`,
      `Audience: ${input.brief.audience || '(unsaid)'}; feeling asked: ${input.brief.feeling || '(unsaid)'}`,
      `Painted as: ${input.direction.archetype} · frame ${input.direction.frame} · ornament ${input.direction.ornament} · type ${input.direction.typePairing} · ${input.direction.temperament}`,
    ].join('\n')
    const parsed = await provider.generateStructured<unknown>({ task: 'vision-critique', system: CRITIQUE_SYSTEM, user, images: [image], timeoutMs: 12000 })
    return sanitizeVisionCritique(parsed)
  } catch {
    return null
  }
}

export async function describeReferenceWithVision(input: { imageUrl: string; note?: string }): Promise<VisionReference | null> {
  const provider = getLlmProvider()
  if (!provider.enabled() || !input.imageUrl) return null
  try {
    const parsed = await provider.generateStructured<unknown>({
      task: 'vision-reference',
      system: REFERENCE_SYSTEM,
      user: `Customer note: ${(input.note ?? '').trim().slice(0, 300) || '(none)'}`,
      images: [input.imageUrl],
      timeoutMs: 12000,
    })
    return sanitizeVisionReference(parsed)
  } catch {
    return null
  }
}

export async function compareFacesWithVision(
  input: { svgs: [string, string]; brief: { brand: string; sector: string; style?: string } },
  rasterise: Rasterise,
): Promise<VisionCompare | null> {
  const provider = getLlmProvider()
  if (!provider.enabled()) return null
  try {
    const images = await Promise.all(input.svgs.map((svg) => rasterise(svg)))
    if (images.some((img) => !img)) return null
    const parsed = await provider.generateStructured<unknown>({
      task: 'vision-compare',
      system: COMPARE_SYSTEM,
      user: `Brand: ${input.brief.brand || '(none)'}; sector: ${input.brief.sector}; mood: ${input.brief.style || '(none)'}`,
      images: images as string[],
      timeoutMs: 12000,
    })
    return sanitizeVisionCompare(parsed)
  } catch {
    return null
  }
}

/**
 * A critique as offers — each one a command the customer could have typed, so "önerini uygula"
 * runs it through `parseDesignCommands` like any other sentence. At most three, deduplicated;
 * the reason is the model's own sentence where it gave one.
 */
export function visionCritiqueToOffers(critique: VisionCritique): StudioCriticOffer[] {
  const out: StudioCriticOffer[] = []
  const why = (fallback: string) => critique.issues[0] || fallback
  const push = (utterance: string, reason: string) => {
    if (out.some((row) => row.utterance === utterance)) return
    out.push({ kind: 'vision', utterance, reason })
  }
  const { suggest } = critique
  if (suggest.ornament === 'quiet') push('süsü azalt', why('Görsel kritik: süs okumayı zorluyor.'))
  if (suggest.ornament === 'rich') push('daha zengin dursun', why('Görsel kritik: yüz çıplak kalıyor.'))
  if (suggest.frame === 'none') push('çerçeveyi kaldır', why('Görsel kritik: çerçeve yüzü sıkıştırıyor.'))
  if (suggest.frame === 'band-hairline') push('bant çerçeve olsun', why('Görsel kritik: kenar daha kararlı olmalı.'))
  if (suggest.frame === 'thin-double') push('ince çift çerçeve', why('Görsel kritik: ince bir kenar toparlar.'))
  if (suggest.frame === 'fleuron-crown') push('köşe süsü ekle', why('Görsel kritik: köşeler boş.'))
  if (suggest.typePairing === 'spaced-serif/spaced-sans') push('aralıklı serif olsun', why('Görsel kritik: marka daha soylu durmalı.'))
  if (suggest.typePairing === 'serif-display/sans-meta') push('serif başlık', why('Görsel kritik: başlık serif istiyor.'))
  if (suggest.typePairing === 'sans-light/sans-heavy') push('serifsiz yap', why('Görsel kritik: daha temiz bir tip.'))
  if (suggest.typePairing === 'script-accent/sans-heavy') push('el yazısı vurgu', why('Görsel kritik: bir vurgu satırı eksik.'))
  if (suggest.temperament === 'light-luxe' || suggest.temperament === 'clean-clinical') push('daha sakin olsun', why('Görsel kritik: yüz gürültülü.'))
  if (suggest.temperament === 'vivid-mono') push('daha canlı', why('Görsel kritik: yüz sönük.'))
  if (suggest.temperament === 'dark-luxe') push('daha koyu', why('Görsel kritik: zemin derinlik istiyor.'))
  // Readings without a suggestion still map to the nearest command.
  if (!out.length && (critique.legibility === 'poor' || critique.balance === 'crowded')) push('süsü azalt', why('Görsel kritik: okunurluk zayıf.'))
  if (!out.length && critique.balance === 'empty') push('daha zengin dursun', why('Görsel kritik: yüz boş kalıyor.'))
  if (!out.length && (critique.balance === 'top-heavy' || critique.balance === 'bottom-heavy')) push('ortala', why('Görsel kritik: ağırlık bir uçta.'))
  if (!out.length && critique.hierarchy !== 'brand-leads') push('başlığı büyüt', why('Görsel kritik: marka önde okunmuyor.'))
  return out.slice(0, 3)
}

/** The whole pass for a finished studio design: render, look, and return offers (empty when silent). */
export async function studioVisionOffers(spec: DesignSpec, rasterise: Rasterise): Promise<StudioCriticOffer[]> {
  const studio = spec.studio
  if (!studio) return []
  const svg = renderFrontSvg(spec.dieline, spec.artwork, spec.palette)
  if (!svg) return []
  const critique = await critiqueFaceWithVision(
    {
      svg,
      brief: { brand: spec.copy.brand, product: spec.copy.product, sector: spec.brief.sector, style: spec.brief.styleType || undefined, audience: spec.brief.audience, feeling: spec.brief.feeling },
      direction: {
        archetype: studio.direction.archetype,
        frame: studio.direction.frame,
        ornament: studio.direction.ornament,
        typePairing: studio.direction.typePairing,
        temperament: studio.direction.temperament,
      },
    },
    rasterise,
  )
  return critique ? visionCritiqueToOffers(critique) : []
}
