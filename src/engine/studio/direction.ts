/**
 * Direction resolver — the Design Brain's studio decision.
 *
 * Deterministic: same brief + palette + variation → same direction. Hints (LLM art director,
 * validated knowledge, user words) can bias or pin choices but only from the closed vocabulary.
 */
import type { CopyLocale, DesignBrief, Palette, StyleType } from '../../types'
import type { SectorId } from '../designSystem/types'
import { ensureAccentContrast, paletteFromBrief, parseBriefColors } from '../artwork/briefPalette'
import { resolveSector } from '../designSystem/sector'
import { darken, fromHsl, hsl, isDark, lighten, luminance, mix, readableInk, saturate, separateAccent } from './color'
import {
  claimChip,
  copyBankFor,
  isGenericTagline,
  refineBenefits,
  refineCategory,
  samePackLine,
  volumeLine,
} from './copyBank'
import { familyOf } from './family'
import { archetypesFor, dnaFor, type ArchetypeDna } from './referenceDna'
import type {
  CopySource,
  DesignDirection,
  DirectionHints,
  StudioArchetype,
  StudioDirectionOffer,
  StudioFamily,
  StudioPalette,
  StudioSurface,
  Temperament,
} from './types'

export type DirectionInput = {
  brief: DesignBrief
  sector: SectorId
  style: StyleType
  surface: StudioSurface
  faceW: number
  faceH: number
  palette: Palette
  locale: CopyLocale
  variationIndex: number
  copy: { brand: string; product: string; tagline: string; volume: string }
  hints?: DirectionHints[]
}

/** Arrangements available inside one archetype. Keep in sync with the layout `switch`es. */
export const LAYOUT_VARIANTS = 3

export function hashSeed(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h >>> 0
}

/**
 * The brief named its colours and none of them carry hue (black / white / grey / cream).
 * `vivid-mono` forces saturation to at least 0.55, so applying it here would invent a colour
 * the customer never asked for — measured 2026-09-17: "siyah · beyaz" came back turquoise.
 */
function briefIsAchromatic(brief: DesignBrief): boolean {
  const hexes = parseBriefColors(brief.colors)
  if (!hexes.length) return false
  // Near-black and near-white read as neutral whatever their nominal saturation: at those
  // lightnesses the hue is not visible on press.
  return hexes.every((hex) => {
    const { s, l } = hsl(hex)
    return s < 0.2 || l < 0.12 || l > 0.9
  })
}

/**
 * The mood decides the colour treatment. Sector may break a tie; it may not overrule.
 *
 * Measured 2026-09-17: this used to test the sector first, so `sector === 'cream'` returned
 * `vivid-mono` before luxury or minimal were ever considered — every mood produced the same face
 * on a cream brief. Paired with the palette ignoring the mood, that is why the mood knob was dead:
 * two independent short-circuits, either one of which was enough on its own.
 *
 * Layer 2 owns this, so the mapping is deliberately total and boring — one mood in, one treatment
 * out. A customer paying a credit per change has to be able to predict the change.
 */
function temperamentFor(sector: SectorId, style: StyleType, palette: Palette, _brief: DesignBrief): Temperament {
  const dark = isDark(palette.bg)
  switch (style) {
    case 'luxury':
      return dark ? 'dark-luxe' : 'light-luxe'
    case 'classic':
      return 'light-luxe'
    case 'minimal':
      return 'clean-clinical'
    case 'eco':
      return 'natural-warm'
    case 'playful':
      return 'vivid-mono'
    case 'modern':
      // The only place sector still speaks: a dark modern face on electronics is the tech look,
      // the same mood on a food or cosmetic brief is not.
      return sector === 'electronics' || dark ? 'tech-dark' : 'clean-clinical'
  }
}

/**
 * What a mood will do to this brief's colours, without generating anything.
 *
 * A credit is spent per change, so the customer has to be able to see where a mood goes *before*
 * they pay for it. This runs the same chain the painter runs — brief colours, mood treatment,
 * temperament — and stops at the palette, which is cheap and pure.
 */
export function moodPreview(brief: DesignBrief, mood: StyleType): { ground: string; accent: string; ink: string } {
  const base = ensureAccentContrast(paletteFromBrief(brief, mood))
  const pal = studioPalette(base, temperamentFor(resolveSector(brief), mood, base, brief))
  return { ground: pal.ground, accent: pal.accent, ink: pal.ink }
}

/** Build the studio palette from the engine palette + temperament. Hue comes from the brief; the temperament sets lightness/role. */
/**
 * The deep surface a box's sides wear when its front is a card floating on art.
 *
 * Measured 2026-09-17, before this existed: the layouts read `accent2`, which holds a texture
 * sibling and was never meant to be a surface. A near-black luxury box came back with cream sides,
 * a modern box's sides were *lighter* than its front, and an eco box's sides were brown while the
 * brief had asked for green. None of those are a deep surface; they are whatever that slot happened
 * to contain.
 *
 * Derived from the ground instead, so it always reads as the same object seen deeper. `step` is the
 * mood's decision: a restrained mood moves a little, an ornate one moves a lot, and a mood whose
 * ground is already dark barely moves at all because there is nowhere deeper to go.
 */
function deepSurface(ground: string, ink: string, step: number): string {
  return isDark(ground) ? darken(ground, step * 0.35) : mix(ground, ink, step)
}

export function studioPalette(base: Palette, temperament: Temperament): StudioPalette {
  const accentH = hsl(base.accent)
  const bgH = hsl(base.bg)
  const warmAccent = accentH.s > 0.15 && ((accentH.h >= 20 && accentH.h <= 60) || accentH.h < 12 || accentH.h > 340)
  const gold = warmAccent ? fromHsl(accentH.h, Math.max(0.45, accentH.s), 0.56) : '#c9a45c'
  switch (temperament) {
    case 'dark-luxe': {
      const ground = isDark(base.bg) ? base.bg : fromHsl(bgH.h, Math.min(0.35, bgH.s), 0.08)
      const accent = separateAccent(ground, luminance(base.accent) < 0.12 ? gold : base.accent)
      return {
        ground,
        ink: readableInk(ground, base.fg),
        accent,
        accent2: darken(accent, 0.16),
        deep: deepSurface(ground, readableInk(ground, base.fg), 0.12),
        card: lighten(base.paper, 0.05),
        cardInk: darken(ground, 0.02),
        muted: mix(readableInk(ground, base.fg), ground, 0.35),
      }
    }
    case 'light-luxe': {
      const ground = isDark(base.bg) ? fromHsl(bgH.h, Math.min(0.28, bgH.s + 0.1), 0.94) : lighten(base.bg, 0.04)
      const deep = isDark(base.fg) ? base.fg : fromHsl(accentH.s > 0.2 ? accentH.h : bgH.h, 0.45, 0.2)
      const accent = separateAccent(ground, warmAccent ? gold : darken(base.accent, 0.05))
      return {
        ground,
        ink: readableInk(ground, deep),
        accent,
        accent2: deep,
        deep: deepSurface(ground, deep, 0.7),
        card: ground,
        cardInk: readableInk(ground, deep),
        muted: mix(deep, ground, 0.45),
      }
    }
    case 'vivid-mono': {
      // The mood already chose the ground's hue *and* how light it sits. This case may only
      // guarantee the chroma that makes the treatment "vivid" — recomputing the lightness is what
      // used to throw the mood away, so every mood came back at l=0.5 on the same hue.
      const hue = bgH.s > 0.2 ? bgH : accentH.s > 0.25 ? accentH : { h: 265, s: 0.6, l: 0.5 }
      const l = Math.min(0.74, Math.max(0.28, bgH.s > 0.2 ? bgH.l : 0.5))
      const ground = fromHsl(hue.h, Math.max(0.55, hue.s), l)
      const art = fromHsl(hue.h, Math.max(0.55, hue.s), Math.max(0.2, l - 0.14))
      const ink = readableInk(ground, base.fg)
      return {
        ground,
        ink,
        accent: separateAccent(ground, ink),
        accent2: art,
        deep: deepSurface(ground, ink, 0.24),
        card: '#ffffff',
        cardInk: fromHsl(hue.h, Math.max(0.55, hue.s), 0.3),
        muted: mix(ink, ground, 0.4),
      }
    }
    case 'natural-warm': {
      // Warmed toward paper, not replaced by it. Mixing toward a cream also drags the *hue* toward
      // that cream — a blue-green brief kept arriving as olive, 70° off what the customer asked
      // for. So the mix sets the lightness and the chroma, and the brief's own hue is put back.
      const warmed = mix(lighten(base.bg, 0.04), '#f3e9d3', 0.3)
      const w = hsl(warmed)
      const ground = isDark(base.bg) ? '#f3e9d3' : bgH.s > 0.1 ? fromHsl(bgH.h, w.s, w.l) : warmed
      // Ink and accent were hardcoded browns, so three different briefs came back with the same
      // type colour in eco — the mood held but the brief stopped showing through it.
      const ink = isDark(base.fg) ? base.fg : fromHsl(bgH.s > 0.12 ? bgH.h : 30, 0.4, 0.2)
      const accent = separateAccent(ground, warmAccent ? gold : darken(base.accent, 0.08))
      return {
        ground,
        ink,
        accent,
        accent2: darken(accent, 0.18),
        deep: deepSurface(ground, ink, 0.34),
        card: '#fbf6ea',
        cardInk: ink,
        muted: mix(ink, ground, 0.45),
      }
    }
    case 'clean-clinical': {
      // Clinical means bright and quiet, not literally white: a mood that tinted the paper keeps
      // its tint. Only a ground too dark to read as clinical is replaced outright.
      const ground = luminance(base.bg) > 0.62 ? base.bg : '#ffffff'
      const ink = isDark(base.fg) ? (hsl(base.fg).s > 0.2 ? base.fg : fromHsl(accentH.s > 0.2 ? accentH.h : 240, 0.5, 0.3)) : fromHsl(240, 0.5, 0.3)
      // A dark accent is not an unusable one — on a white clinical ground it is the *best* one.
      // Requiring luminance > 0.2 threw away the brief's deep green and substituted a hardcoded
      // orange, so a "yeşil · krem" brief in minimal came back with no green anywhere on the face.
      // `separateAccent` already guarantees the contrast; this only decides whether the brief gave
      // us anything with a hue to work with.
      const usableAccent = accentH.s > 0.18 || luminance(base.accent) < 0.35
      const accent = separateAccent(ground, usableAccent ? base.accent : '#f2a93b')
      return {
        ground,
        ink,
        accent,
        accent2: saturate(lighten(ink, 0.3), 0.1),
        deep: deepSurface(ground, ink, 0.16),
        card: '#ffffff',
        cardInk: ink,
        muted: mix(ink, ground, 0.5),
      }
    }
    case 'tech-dark':
    default: {
      const ground = isDark(base.bg) ? base.bg : '#15181d'
      // The brief's accent may be unusable here (a "siyah · beyaz" brief hands us black, which
      // vanishes on a dark ground). Reach for another colour the brief actually gave — its paper
      // — before inventing the cyan default.
      const usable = accentH.s > 0.2 || luminance(base.accent) > 0.5
      // ...and if the brief gave no usable light colour either, its own ink beats the cyan
      // default: a "siyah · beyaz" brief has no business coming back with a cyan accent.
      const fallback = luminance(base.paper) > 0.5 ? base.paper : luminance(base.fg) > 0.5 ? base.fg : '#6fd3e0'
      const accent = separateAccent(ground, usable ? base.accent : fallback)
      return {
        ground,
        ink: readableInk(ground, base.fg),
        accent,
        accent2: mix(accent, ground, 0.55),
        deep: deepSurface(ground, readableInk(ground, base.fg), 0.12),
        card: lighten(ground, 0.08),
        cardInk: readableInk(ground, base.fg),
        muted: mix(readableInk(ground, base.fg), ground, 0.4),
      }
    }
  }
}

export type ArchetypeScoreParts = {
  sectorFit: number
  styleFit: number
  aspectFit: number
  tempFit: number
  productFamily: number
  hintPin: number
  veto: number
  backgroundMismatch: number
}

function scoreArchetype(
  dna: ArchetypeDna,
  input: DirectionInput,
  temperament: Temperament,
  hints: DirectionHints,
  achromatic = false,
): { score: number; parts: ArchetypeScoreParts } {
  const sectorFit = dna.sectors[input.sector] ?? 0.2
  const styleFit = dna.styles[input.style] ?? 0.3
  const ratio = input.faceH / Math.max(1, input.faceW)
  const aspectFit = dna.aspect === 'any' ? 0.7 : dna.aspect === 'portrait' ? (ratio >= 1.1 ? 1 : 0.3) : ratio <= 0.95 ? 1 : 0.3
  const tempFit = dna.temperaments.includes(temperament) ? 1 : 0.3
  const productFamily = productFamilyFit(dna.id, input)
  const avoided = hints.avoidArchetypes?.includes(dna.id) ?? false
  const hintPin = hints.archetype === dna.id && !avoided ? (hints.source === 'heuristic' ? 0.85 : 2) : 0
  const veto = avoided ? -1.5 : 0
  const bgMiss = hints.background && !dna.backgrounds.includes(hints.background) ? -0.15 : 0
  const bgAvoid = hints.avoidBackgrounds?.length && dna.backgrounds.every((b) => hints.avoidBackgrounds?.includes(b)) ? -0.6 : 0
  // An archetype that can only wear one saturated temperament cannot serve a brief that asked
  // for black / white / grey — it would invent a hue. Loud faces lose on quiet briefs.
  const paletteClash = achromatic && dna.temperaments.every((t) => t === 'vivid-mono') ? -0.5 : 0
  const backgroundMismatch = bgMiss + bgAvoid + paletteClash
  const score = sectorFit * 0.22 + styleFit * 0.35 + aspectFit * 0.1 + tempFit * 0.18 + productFamily + hintPin + veto + backgroundMismatch
  return {
    score,
    parts: { sectorFit, styleFit, aspectFit, tempFit, productFamily, hintPin, veto, backgroundMismatch },
  }
}

/** TASARIM REF product families → the archetype distilled from that reference. */
function productFamilyFit(id: string, input: DirectionInput): number {
  const blob = `${input.brief.sector} ${input.brief.subProduct} ${input.brief.productName}`.toLocaleLowerCase('tr')
  if (/kahve|coffee|espresso|frappe|brew/.test(blob)) return id === 'marble-frame' ? 0.22 : id === 'dark-landscape' ? 0.05 : -0.08
  if (/\bbal\b|honey|reçel|dağ/.test(blob)) return id === 'landscape-window' || id === 'landscape-badge' ? 0.22 : -0.08
  if (/serum|ampul/.test(blob) || input.sector === 'serum') {
    return id === 'line-scene' ? 0.22 : id === 'botanical-card' || id === 'card-on-art' ? -0.2 : 0
  }
  if (/bebek|baby/.test(blob) || input.sector === 'baby') {
    return id === 'line-scene' ? 0.22 : id === 'botanical-card' || id === 'card-on-art' ? -0.2 : 0
  }
  if (/temizlik|deterjan/.test(blob) || input.sector === 'cleaning') {
    return id === 'wave-panel' ? 0.22 : id === 'botanical-card' || id === 'card-on-art' ? -0.25 : 0
  }
  if (/şampuan|shampoo|krem|bakım/.test(blob) && !/parfüm|perfume/.test(blob)) {
    return id === 'botanical-card' || id === 'card-on-art' ? 0.22 : id === 'diagonal-tech' || id === 'diagonal-split' ? 0.08 : 0
  }
  if (/parfüm|perfume|eau de/.test(blob)) return id === 'dark-landscape' || id === 'ink-wash' || id === 'ink-panel' ? 0.22 : 0
  if (/elektronik|kulaklık|earbuds|tech/.test(blob)) return id === 'diagonal-tech' || id === 'diagonal-split' ? 0.22 : -0.08
  return 0
}

/**
 * Heuristic art-direction from the brief. Closed vocabulary only — never invents geometry.
 * Visual words (mermer, botanik, klinik…) override the sector baseline so a coffee DNA
 * is not glued to electronics, and marble can land on a perfume or tech brief.
 * Conversation / LLM hints overlay this; catalog jobs omit studio so freeze is untouched.
 */
function visualOverrideFromBrief(blob: string, label: boolean): DirectionHints {
  if (/mermer|marble/.test(blob)) {
    return { archetype: 'marble-frame', background: 'marble', pinSource: 'visual', rationale: ['Brief: mermer — sektör pin’inin önüne geçer.'] }
  }
  if (/botanik|yaprak|\bleaf\b/.test(blob)) {
    return {
      archetype: label ? 'card-on-art' : 'botanical-card',
      background: 'botanical',
      temperament: 'vivid-mono',
      pinSource: 'visual',
      rationale: ['Brief: botanik.'],
    }
  }
  if (/line[\s-]?scene|klinik|çizgisel|line[\s-]?art/.test(blob)) {
    return {
      archetype: 'line-scene',
      background: 'line-scene',
      temperament: 'clean-clinical',
      pinSource: 'visual',
      rationale: ['Brief: klinik / çizgisel.'],
    }
  }
  if (/\bdalga\b|\bwave\b/.test(blob)) {
    return { archetype: 'wave-panel', background: 'wave', temperament: 'clean-clinical', pinSource: 'visual', rationale: ['Brief: dalga.'] }
  }
  if (/manzara|landscape|mürekkep|\bink\b/.test(blob)) {
    return {
      archetype: label ? 'ink-panel' : 'dark-landscape',
      temperament: 'dark-luxe',
      pinSource: 'visual',
      rationale: ['Brief: manzara / mürekkep.'],
    }
  }
  if (/diyagonal|diagonal|antrasit/.test(blob)) {
    return {
      archetype: label ? 'diagonal-split' : 'diagonal-tech',
      temperament: 'tech-dark',
      pinSource: 'visual',
      rationale: ['Brief: diyagonal / antrasit.'],
    }
  }
  return {}
}

export function hintsFromBrief(brief: DesignBrief, sector: SectorId, surface: StudioSurface): DirectionHints {
  const blob = `${brief.sector} ${brief.subProduct} ${brief.productName} ${brief.colors} ${brief.styleType} ${brief.directorCue ?? ''} ${brief.story ?? ''} ${brief.copyOverrides}`.toLocaleLowerCase('tr')
  const label = surface === 'label'
  const visual = visualOverrideFromBrief(blob, label)
  if (visual.archetype) return { source: 'heuristic', ...visual }

  const hints: DirectionHints = { source: 'heuristic', pinSource: 'sector', rationale: [] }
  if (/kahve|coffee|espresso|frappe|brew/.test(blob)) {
    hints.archetype = 'marble-frame'
    hints.background = 'marble'
    hints.rationale = ['Kahve — Elite Brew mermer + köşe parantez sistemi (sektör prior, brief sözcüğü yok).']
  } else if (/\bbal\b|honey|reçel/.test(blob)) {
    hints.archetype = label ? 'landscape-badge' : 'landscape-window'
    hints.background = 'landscape-meadow'
    hints.rationale = ['Gıda / bal — kemerli manzara penceresi.']
  } else if (/serum|ampul/.test(blob) || sector === 'serum') {
    hints.archetype = 'line-scene'
    hints.background = 'line-scene'
    hints.temperament = 'clean-clinical'
    hints.rationale = ['Serum — DNA Pharma klinik line-scene sistemi.']
  } else if (/bebek|baby/.test(blob) || sector === 'baby') {
    hints.archetype = 'line-scene'
    hints.background = 'line-scene'
    hints.rationale = ['Bebek — line-scene; botanik karta düşmez.']
  } else if (/temizlik|deterjan/.test(blob) || sector === 'cleaning') {
    hints.archetype = 'wave-panel'
    hints.background = 'wave'
    hints.temperament = 'clean-clinical'
    hints.rationale = ['Temizlik — FERAH dalga paneli.']
  } else if (/şampuan|shampoo|krem|bakım/.test(blob) && !/parfüm|perfume/.test(blob)) {
    hints.archetype = label ? 'card-on-art' : 'botanical-card'
    hints.temperament = 'vivid-mono'
    hints.rationale = ['Kozmetik bakım — woo.originals botanik kart sistemi.']
  } else if (/parfüm|perfume|eau de/.test(blob)) {
    hints.archetype = label ? 'ink-panel' : 'dark-landscape'
    hints.temperament = /krem|cream|light/.test(blob) ? 'light-luxe' : 'dark-luxe'
    hints.rationale = ['Parfüm — Guess / Rebull koyu lüks manzara + mürekkep.']
  } else if (/elektronik|kulaklık|earbuds|tech/.test(blob)) {
    hints.archetype = label ? 'diagonal-split' : 'diagonal-tech'
    hints.temperament = 'tech-dark'
    hints.rationale = ['Elektronik — Capelli diyagonal metalik sistem.']
  }
  if (sector === 'perfume' && !hints.archetype) {
    hints.archetype = label ? 'ink-panel' : 'dark-landscape'
  }
  if (!hints.archetype) delete hints.pinSource
  return hints
}

function mergeHints(list: DirectionHints[] | undefined): DirectionHints {
  const out: DirectionHints = {}
  for (const h of list ?? []) {
    for (const [k, v] of Object.entries(h)) {
      if (v == null || (Array.isArray(v) && !v.length) || v === '') continue
      if (k === 'avoidArchetypes' || k === 'avoidBackgrounds' || k === 'rationale') {
        const prev = (out as Record<string, unknown>)[k] as unknown[] | undefined
        ;(out as Record<string, unknown>)[k] = [...(prev ?? []), ...(v as unknown[])]
      } else {
        ;(out as Record<string, unknown>)[k] = v
      }
    }
  }
  return out
}

function fitTagline(text: string): string {
  const t = text.trim()
  if (t.length <= 42) return t
  return t.slice(0, 40).replace(/\s+\S*$/, '')
}

/**
 * User line → brief/LLM/sample line → copyBank. Bank slogans never beat an explicit user line.
 */
export function resolveStudioCopy(input: {
  brief: DesignBrief
  spokenTag: string
  bankTagline: string
}): { tagline: string; copySource: CopySource } {
  const user = input.brief.copyOverrides.trim()
  const spoken = input.spokenTag.trim()
  if (user && !isGenericTagline(user, input.brief.brandName)) {
    return { tagline: fitTagline(user), copySource: 'user' }
  }
  if (spoken && !isGenericTagline(spoken, input.brief.brandName) && spoken !== input.bankTagline) {
    return { tagline: fitTagline(spoken), copySource: 'brief' }
  }
  return { tagline: input.bankTagline, copySource: 'bank' }
}

function directionRationale(dna: ArchetypeDna, temperament: Temperament, background: string, palette: StudioPalette): string[] {
  const temp: Record<Temperament, string> = {
    'dark-luxe': 'koyu lüks — koyu zemin, metalik vurgu',
    'light-luxe': 'açık lüks — krem zemin, derin mürekkep + metalik',
    'vivid-mono': 'canlı tek ton — doygun zemin, ton-üstü-ton doku, beyaz kart',
    'natural-warm': 'doğal sıcak — krem kâğıt, altın, kahve tonları',
    'clean-clinical': 'temiz klinik — beyaz zemin, tek mürekkep, sıcak vurgu',
    'tech-dark': 'teknik koyu — antrasit, soğuk vurgu',
  }
  return [
    `Arketip ${dna.id}: ${dna.summaryTr}`,
    `Referans: ${dna.reference}.`,
    `Doku: ${background} · Palet: ${temp[temperament]} (${palette.ground} / ${palette.accent}).`,
  ]
}

export type DirectionClaimKey = 'visualOverride' | 'sectorPrior' | 'productFamily' | 'styleFit' | 'userPin' | 'veto'

export type DirectionClaim = {
  key: DirectionClaimKey
  authority: 'REAL'
  text: string
  briefField?: 'colors' | 'subProduct' | 'styleType' | 'studioFamily' | 'productName'
}

export type DirectionScoreRow = {
  id: StudioArchetype
  score: number
  parts: ArchetypeScoreParts
}

export type DirectionDecision = {
  direction: DesignDirection
  scores: DirectionScoreRow[]
  claims: DirectionClaim[]
  winnerId: StudioArchetype
  offer: DirectionOffer
}

export type DirectionCandidate = {
  index: number
  family: StudioFamily
  direction: DesignDirection
  score: number
  selected: boolean
}

export type DirectionOffer = {
  candidates: DirectionCandidate[]
  selectedIndex: number
}

type ScoredDna = {
  dna: ArchetypeDna
  score: number
  parts: ArchetypeScoreParts
}

type RankedPool = {
  hints: DirectionHints
  temperamentGuess: Temperament
  scored: ScoredDna[]
  scores: DirectionScoreRow[]
  ranked: ScoredDna[]
  pool: ScoredDna[]
  pick: ScoredDna
}

function groundedClaims(
  input: DirectionInput,
  hints: DirectionHints,
  winner: DirectionScoreRow,
  runner: DirectionScoreRow | undefined,
): DirectionClaim[] {
  const claims: DirectionClaim[] = []
  const beat = (value: number, other: number | undefined) => other == null || value > other + 0.001
  if (hints.pinSource === 'visual' && hints.archetype === winner.id && winner.parts.hintPin > 0) {
    claims.push({
      key: 'visualOverride',
      authority: 'REAL',
      briefField: 'colors',
      text:
        hints.rationale?.[0] ??
        `brief'teki görsel sözcük (${input.brief.colors || input.brief.directorCue || 'görsel ipucu'}) bu arketipi pinledi`,
    })
  }
  if (hints.pinSource === 'sector' && hints.archetype === winner.id && winner.parts.hintPin > 0) {
    claims.push({
      key: 'sectorPrior',
      authority: 'REAL',
      briefField: 'subProduct',
      text: hints.rationale?.[0] ?? 'sektör priori bu aileyi önerdi',
    })
  }
  if (winner.parts.productFamily > 0 && beat(winner.parts.productFamily, runner?.parts.productFamily)) {
    const family = input.brief.subProduct || input.brief.productName || input.brief.sector
    claims.push({
      key: 'productFamily',
      authority: 'REAL',
      briefField: input.brief.subProduct ? 'subProduct' : 'productName',
      text: `ürün ailesi (${family}) bu arketipe +${winner.parts.productFamily.toFixed(2)} verdi`,
    })
  }
  if (winner.parts.styleFit >= 0.6 && beat(winner.parts.styleFit, runner?.parts.styleFit)) {
    claims.push({
      key: 'styleFit',
      authority: 'REAL',
      briefField: 'styleType',
      text: `${input.style} ruh hali bu arketipin stil uyumunu yükseltti`,
    })
  }
  if ((hints.source === 'user' || hints.source === 'family' || hints.pinSource === 'family') && hints.archetype === winner.id) {
    claims.push({
      key: 'userPin',
      authority: 'REAL',
      briefField: 'studioFamily',
      text: `kilitli görsel aile ${input.brief.studioFamily ?? winner.id} bu yönü sabitledi`,
    })
  }
  if (hints.avoidArchetypes?.length && winner.parts.veto === 0) {
    claims.push({
      key: 'veto',
      authority: 'REAL',
      text: `veto listesi (${hints.avoidArchetypes.join(', ')}) bu adayı dışlamadı; alternatifler düştü`,
    })
  }
  return claims
}

function uniqueFamilyRows(ranked: ScoredDna[], n: number): ScoredDna[] {
  const seen = new Set<StudioFamily>()
  const out: ScoredDna[] = []
  for (const row of ranked) {
    const family = familyFor(row.dna.id as StudioArchetype)
    if (seen.has(family)) continue
    seen.add(family)
    out.push(row)
    if (out.length >= n) break
  }
  return out.length ? out : ranked.slice(0, n)
}

/** S4: locked family stays. Unlocked vary walks ranked 1–6 so step 3 is not step 0. */
function rankDirectionPool(input: DirectionInput): RankedPool {
  const hints = mergeHints(input.hints)
  // A brief that named only neutral colours cannot wear a vivid-only archetype: that archetype
  // permits a single saturated temperament, so the face would invent a hue nobody asked for
  // (measured 2026-09-17: "siyah · beyaz" şampuan came back turquoise). Release the *sector*
  // pin and let scoring pick a face that can hold black / white / grey. A visual word
  // ("mermer"), a user pick or a locked family still wins — only the category guess yields.
  const achromatic = briefIsAchromatic(input.brief)
  if (hints.pinSource === 'sector' && hints.archetype && achromatic) {
    const hinted = dnaFor(hints.archetype, input.surface)
    if (hinted.temperaments.every((t) => t === 'vivid-mono')) {
      hints.archetype = undefined
      if (hints.temperament === 'vivid-mono') hints.temperament = undefined
    }
  }
  // A visual pin ("mermer") chooses the archetype and the background — that is layer 1, the
  // skeleton. It must not also choose the colour treatment, or the mood knob dies on exactly the
  // briefs that named a material. Only an explicit user pick outranks the mood here.
  const guessed =
    (userHoldsTemperament(hints) ? hints.temperament : undefined) ??
    temperamentFor(input.sector, input.style, input.palette, input.brief)
  // Single choke point for both the sector hint and the default: a brief that named only neutral
  // colours must not be pushed into `vivid-mono`, which forces saturation ≥ 0.55 and would invent
  // a hue nobody asked for. Measured 2026-09-17: "siyah · beyaz" came back turquoise, then red.
  const temperamentGuess: Temperament =
    guessed === 'vivid-mono' && achromatic
      ? isDark(input.palette.bg)
        ? 'tech-dark'
        : 'clean-clinical'
      : guessed
  const avoided = new Set(hints.avoidArchetypes ?? [])
  const scored = archetypesFor(input.surface)
    .map((dna) => {
      const row = scoreArchetype(dna, input, temperamentGuess, hints, achromatic)
      return { dna, score: row.score, parts: row.parts }
    })
    .sort((a, b) => b.score - a.score || a.dna.id.localeCompare(b.dna.id))
  const scores: DirectionScoreRow[] = scored.map((row) => ({ id: row.dna.id as StudioArchetype, score: row.score, parts: row.parts }))
  const pinned =
    hints.archetype && !avoided.has(hints.archetype) ? scored.find((c) => c.dna.id === hints.archetype) : undefined
  const eligible = scored.filter((c) => !avoided.has(c.dna.id as StudioArchetype))
  const ranked = eligible.length ? eligible : scored
  const pool = uniqueFamilyRows(ranked, 3)
  const walk = uniqueFamilyRows(ranked, 6)
  const pick = pinned ?? walk[input.variationIndex % Math.max(1, walk.length)] ?? ranked[0] ?? scored[0]
  return { hints, temperamentGuess, scored, scores, ranked, pool, pick }
}

function userHoldsTemperament(hints: DirectionHints): boolean {
  if (!hints.temperament) return false
  if (hints.source === 'user') return true
  return (hints.rationale ?? []).some((row) => /StyleBar temperament|daha sakin varyasyon/i.test(row))
}

/**
 * variationIndex 0 honors pins (goldens). Later steps cycle the DNA's background texture.
 *
 * They deliberately do *not* cycle the temperament any more. One credit buys six variations, so
 * the six have to be six takes on the same decision — if step 3 flips a light face to a dark one,
 * the mood the customer chose and paid for silently stops holding, and "variation" and "mood" turn
 * into the same knob with different labels.
 */
function varyFace(
  dna: ArchetypeDna,
  hints: DirectionHints,
  temperamentGuess: Temperament,
  variationIndex: number,
): { temperament: Temperament; background: (typeof dna.backgrounds)[number] } {
  const bgPool = dna.backgrounds.filter((b) => !hints.avoidBackgrounds?.includes(b))
  const backgrounds = bgPool.length ? bgPool : dna.backgrounds
  if (variationIndex <= 0) {
    const temperament: Temperament =
      userHoldsTemperament(hints) && hints.temperament ? hints.temperament : temperamentGuess
    const background =
      hints.background && dna.backgrounds.includes(hints.background) ? hints.background : backgrounds[0] ?? dna.backgrounds[0]
    return { temperament, background }
  }
  const bgIndex = variationIndex % Math.max(1, backgrounds.length)
  return {
    background: backgrounds[bgIndex] ?? dna.backgrounds[0],
    // The archetype's `temperaments` list is a *preference*, already paid for in `scoreArchetype`
    // via tempFit — an archetype that cannot wear the mood loses the ranking. It must not also be
    // a veto at paint time: `botanical-card` permits only `vivid-mono`, so every mood on a cream
    // brief came back vivid no matter what the customer chose. Layer 1 ranks; layer 2 decides.
    temperament: userHoldsTemperament(hints) && hints.temperament ? hints.temperament : temperamentGuess,
  }
}

function resolveStudioChips(input: {
  brief: DesignBrief
  bankChips: string[]
  category: string
  copySource: CopySource
  tagline: string
}): string[] {
  const claimed = claimChip(input.brief)
  const distinct = input.bankChips.filter(
    (c) => c && !samePackLine(c, input.category) && !samePackLine(c, claimed),
  )
  const primary = claimed || distinct[0] || ''
  const dropDup = (c: string) => c && !samePackLine(c, input.category)
  if (input.copySource === 'user') {
    return [primary, input.tagline].filter((c, i, a) => dropDup(c) && a.indexOf(c) === i).slice(0, 2)
  }
  return [primary, ...distinct.filter((c) => c !== primary)].filter(dropDup).slice(0, 2)
}

function materializeDirection(
  input: DirectionInput,
  dna: ArchetypeDna,
  hints: DirectionHints,
  temperamentGuess: Temperament,
  variationIndex: number,
): DesignDirection {
  const { brief, sector, surface, locale } = input
  const { temperament, background } = varyFace(dna, hints, temperamentGuess, variationIndex)
  const palette = studioPalette(input.palette, temperament)
  const bank = copyBankFor(brief, sector, locale)
  const seed = hashSeed(`${brief.brandName}|${brief.productName}|${sector}|${surface}|${variationIndex}`)
  const category = hints.categoryLine || refineCategory(brief, sector, locale) || bank.category
  const spokenTag = (hints.taglineLine || input.copy.tagline || '').trim()
  const selected = resolveStudioCopy({ brief, spokenTag, bankTagline: bank.tagline })
  const chips = hints.chips?.length
    ? hints.chips
    : resolveStudioChips({
        brief,
        bankChips: bank.chips,
        category,
        copySource: selected.copySource,
        tagline: selected.tagline,
      })
  const productPrefix =
    hints.productPrefix ??
    (dna.typePairing === 'script-accent/sans-heavy' || dna.typePairing === 'spaced-serif/spaced-sans'
      ? bank.prefixes[variationIndex % bank.prefixes.length]
      : '')
  const rationale = [...directionRationale(dna, temperament, background, palette), ...(hints.rationale ?? [])]
  return {
    surface,
    archetype: dna.id as StudioArchetype,
    // Shifted off the texture rng so the arrangement and the background grain do not move together.
    variant: (seed >>> 5) % LAYOUT_VARIANTS,
    background,
    typePairing: hints.typePairing ?? dna.typePairing,
    temperament,
    frame: hints.frame ?? dna.frame,
    lockup: hints.lockup ?? dna.lockup,
    palette,
    benefits: refineBenefits(brief, bank.benefits, locale).slice(0, 4),
    chips,
    manifesto: hints.manifesto?.length ? hints.manifesto.slice(0, 4) : bank.manifesto,
    categoryLine: category,
    taglineLine: selected.tagline,
    copySource: selected.copySource,
    story: (brief.story?.trim() || bank.story).trim(),
    volumeLine: volumeLine(input.copy.volume, locale),
    productPrefix,
    rationale,
    source: hints.source ?? (hints.archetype ? 'llm' : 'heuristic'),
    seed,
    sector,
    locale,
  }
}

function familyFor(archetype: StudioArchetype): StudioFamily {
  return familyOf(archetype) ?? 'marble'
}

export function slimDirectionOffer(offer: DirectionOffer): StudioDirectionOffer {
  return {
    selectedIndex: offer.selectedIndex,
    candidates: offer.candidates.map((row) => ({
      index: row.index,
      family: row.family,
      archetype: row.direction.archetype,
      background: row.direction.background,
      temperament: row.direction.temperament,
      score: row.score,
      selected: row.selected,
    })),
  }
}

export function directionOffer(
  input: DirectionInput,
  ranked = rankDirectionPool(input),
  painted?: DesignDirection,
): DirectionOffer {
  const winnerId = ranked.pick.dna.id as StudioArchetype
  let rows = ranked.pool
  if (!rows.some((row) => row.dna.id === winnerId)) {
    rows = [ranked.pick, ...rows.filter((row) => row.dna.id !== winnerId)].slice(0, 3)
  }
  const candidates: DirectionCandidate[] = rows.map((row, i) => {
    const selected = row.dna.id === winnerId
    const direction = selected
      ? (painted && painted.archetype === winnerId
          ? painted
          : materializeDirection(input, row.dna, ranked.hints, ranked.temperamentGuess, input.variationIndex))
      : materializeDirection(input, row.dna, ranked.hints, ranked.temperamentGuess, 0)
    return {
      index: i + 1,
      family: familyFor(direction.archetype),
      direction,
      score: row.score,
      selected,
    }
  })
  return {
    candidates,
    selectedIndex: candidates.find((row) => row.selected)?.index ?? 1,
  }
}

export function decideDirection(input: DirectionInput): DirectionDecision {
  const ranked = rankDirectionPool(input)
  const direction = materializeDirection(
    input,
    ranked.pick.dna,
    ranked.hints,
    ranked.temperamentGuess,
    input.variationIndex,
  )
  const winner = ranked.scores.find((row) => row.id === direction.archetype) ?? {
    id: direction.archetype,
    score: ranked.pick.score,
    parts: ranked.pick.parts,
  }
  const runner = ranked.scores.find((row) => row.id !== winner.id)
  return {
    direction,
    scores: ranked.scores,
    claims: groundedClaims(input, ranked.hints, winner, runner),
    winnerId: direction.archetype,
    offer: directionOffer(input, ranked, direction),
  }
}

export function resolveDirection(input: DirectionInput): DesignDirection {
  return decideDirection(input).direction
}

/** Short TR summary for the chat / process note. */
export function describeDirection(d: DesignDirection): string {
  const surface = d.surface === 'label' ? 'etiket' : 'kutu'
  return `${surface} · ${d.archetype} · ${d.background} · ${d.temperament}${d.productPrefix ? ` · "${d.productPrefix}"` : ''}`
}

export { dnaFor }
