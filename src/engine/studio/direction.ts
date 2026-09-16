/**
 * Direction resolver — the Design Brain's studio decision.
 *
 * Deterministic: same brief + palette + variation → same direction. Hints (LLM art director,
 * validated knowledge, user words) can bias or pin choices but only from the closed vocabulary.
 */
import type { CopyLocale, DesignBrief, Palette, StyleType } from '../../types'
import type { SectorId } from '../designSystem/types'
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

export function hashSeed(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h >>> 0
}

function temperamentFor(sector: SectorId, style: StyleType, palette: Palette, brief: DesignBrief): Temperament {
  const dark = isDark(palette.bg)
  const colors = brief.colors.toLocaleLowerCase('tr')
  if (/neon|canlı|vivid|mor|lila|turkuaz|lime|fuşya|pembe/.test(colors) && sector !== 'perfume') return 'vivid-mono'
  if (sector === 'electronics') return dark || style !== 'minimal' ? 'tech-dark' : 'clean-clinical'
  if (sector === 'food' || style === 'eco') return dark && style === 'luxury' ? 'dark-luxe' : 'natural-warm'
  if (style === 'luxury' || style === 'classic') return dark ? 'dark-luxe' : 'light-luxe'
  if (style === 'minimal' || sector === 'health' || sector === 'serum') return 'clean-clinical'
  if (sector === 'cleaning') return 'clean-clinical'
  if (style === 'playful' || sector === 'cream' || sector === 'baby') return 'vivid-mono'
  if (style === 'modern') return dark ? 'tech-dark' : 'clean-clinical'
  return dark ? 'dark-luxe' : 'light-luxe'
}

/** Build the studio palette from the engine palette + temperament. Hue comes from the brief; the temperament sets lightness/role. */
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
        card: ground,
        cardInk: readableInk(ground, deep),
        muted: mix(deep, ground, 0.45),
      }
    }
    case 'vivid-mono': {
      const hue = accentH.s > 0.25 ? accentH : bgH.s > 0.25 ? bgH : { h: 265, s: 0.6, l: 0.5 }
      const ground = fromHsl(hue.h, Math.max(0.55, hue.s), 0.5)
      const art = fromHsl(hue.h, Math.max(0.55, hue.s), 0.36)
      return {
        ground,
        ink: '#ffffff',
        accent: '#ffffff',
        accent2: art,
        card: '#ffffff',
        cardInk: fromHsl(hue.h, Math.max(0.55, hue.s), 0.3),
        muted: fromHsl(hue.h, 0.3, 0.9),
      }
    }
    case 'natural-warm': {
      const ground = isDark(base.bg) ? '#f3e9d3' : mix(lighten(base.bg, 0.06), '#f3e9d3', 0.5)
      const accent = separateAccent(ground, warmAccent ? gold : '#b8892f')
      const ink = '#4a3521'
      return {
        ground,
        ink,
        accent,
        accent2: '#7a5a2b',
        card: '#fbf6ea',
        cardInk: ink,
        muted: mix(ink, ground, 0.45),
      }
    }
    case 'clean-clinical': {
      const ground = '#ffffff'
      const ink = isDark(base.fg) ? (hsl(base.fg).s > 0.2 ? base.fg : fromHsl(accentH.s > 0.2 ? accentH.h : 240, 0.5, 0.3)) : fromHsl(240, 0.5, 0.3)
      const accent = separateAccent(ground, accentH.s > 0.3 && luminance(base.accent) > 0.2 ? base.accent : '#f2a93b')
      return {
        ground,
        ink,
        accent,
        accent2: saturate(lighten(ink, 0.3), 0.1),
        card: '#ffffff',
        cardInk: ink,
        muted: mix(ink, ground, 0.5),
      }
    }
    case 'tech-dark':
    default: {
      const ground = isDark(base.bg) ? base.bg : '#15181d'
      const accent = separateAccent(ground, accentH.s > 0.2 ? base.accent : '#6fd3e0')
      return {
        ground,
        ink: readableInk(ground, base.fg),
        accent,
        accent2: mix(accent, ground, 0.55),
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
  const backgroundMismatch = bgMiss + bgAvoid
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

function rotateToFront<T>(list: readonly T[], first: T | undefined): T[] {
  const i = first != null ? list.indexOf(first) : -1
  if (i <= 0) return [...list]
  return [...list.slice(i), ...list.slice(0, i)]
}

/** S4: locked family stays. Unlocked vary walks ranked 1–6 so step 3 is not step 0. */
function rankDirectionPool(input: DirectionInput): RankedPool {
  const hints = mergeHints(input.hints)
  const temperamentGuess = hints.temperament ?? temperamentFor(input.sector, input.style, input.palette, input.brief)
  const avoided = new Set(hints.avoidArchetypes ?? [])
  const scored = archetypesFor(input.surface)
    .map((dna) => {
      const row = scoreArchetype(dna, input, temperamentGuess, hints)
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

/** variationIndex 0 honors pins (goldens). Later steps cycle DNA texture then temperament. */
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
      userHoldsTemperament(hints) && hints.temperament
        ? hints.temperament
        : dna.temperaments.includes(temperamentGuess)
          ? temperamentGuess
          : (hints.temperament ?? dna.temperaments[0])
    const background =
      hints.background && dna.backgrounds.includes(hints.background) ? hints.background : backgrounds[0] ?? dna.backgrounds[0]
    return { temperament, background }
  }
  const holdTemp = userHoldsTemperament(hints)
  const orderedTemps = holdTemp && hints.temperament ? [hints.temperament] : rotateToFront(dna.temperaments, temperamentGuess)
  const bgIndex = variationIndex % Math.max(1, backgrounds.length)
  const tempIndex = Math.floor(variationIndex / Math.max(1, backgrounds.length)) % Math.max(1, orderedTemps.length)
  return {
    background: backgrounds[bgIndex] ?? dna.backgrounds[0],
    temperament: orderedTemps[tempIndex] ?? dna.temperaments[0],
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
