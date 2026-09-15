/**
 * Direction resolver — the Design Brain's studio decision.
 *
 * Deterministic: same brief + palette + variation → same direction. Hints (LLM art director,
 * validated knowledge, user words) can bias or pin choices but only from the closed vocabulary.
 */
import type { CopyLocale, DesignBrief, Palette, StyleType } from '../../types'
import type { SectorId } from '../designSystem/types'
import { darken, fromHsl, hsl, isDark, lighten, luminance, mix, readableInk, saturate, separateAccent } from './color'
import { claimChip, copyBankFor, isGenericTagline, refineBenefits, refineCategory, volumeLine } from './copyBank'
import { archetypesFor, dnaFor, type ArchetypeDna } from './referenceDna'
import type { DesignDirection, DirectionHints, StudioArchetype, StudioPalette, StudioSurface, Temperament } from './types'

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

function scoreArchetype(dna: ArchetypeDna, input: DirectionInput, temperament: Temperament, hints: DirectionHints): number {
  const sectorFit = dna.sectors[input.sector] ?? 0.2
  const styleFit = dna.styles[input.style] ?? 0.3
  const ratio = input.faceH / Math.max(1, input.faceW)
  const aspectFit = dna.aspect === 'any' ? 0.7 : dna.aspect === 'portrait' ? (ratio >= 1.1 ? 1 : 0.3) : ratio <= 0.95 ? 1 : 0.3
  const tempFit = dna.temperaments.includes(temperament) ? 1 : 0.3
  let score = sectorFit * 0.5 + styleFit * 0.3 + aspectFit * 0.1 + tempFit * 0.1
  score += productFamilyFit(dna.id, input)
  if (hints.archetype === dna.id) score += 2
  if (hints.avoidArchetypes?.includes(dna.id)) score -= 1.5
  if (hints.background && !dna.backgrounds.includes(hints.background)) score -= 0.15
  if (hints.avoidBackgrounds?.length && dna.backgrounds.every((b) => hints.avoidBackgrounds?.includes(b))) score -= 0.6
  return score
}

/** TASARIM REF product families → the archetype distilled from that reference. */
function productFamilyFit(id: string, input: DirectionInput): number {
  const blob = `${input.brief.sector} ${input.brief.subProduct} ${input.brief.productName}`.toLocaleLowerCase('tr')
  if (/kahve|coffee|espresso|frappe|brew/.test(blob)) return id === 'marble-frame' ? 0.55 : id === 'dark-landscape' ? 0.1 : -0.15
  if (/\bbal\b|honey|reçel|dağ/.test(blob)) return id === 'landscape-window' || id === 'landscape-badge' ? 0.55 : -0.1
  if (/serum|ampul/.test(blob) || input.sector === 'serum') {
    return id === 'line-scene' ? 0.55 : id === 'botanical-card' || id === 'card-on-art' ? -0.2 : 0
  }
  if (/bebek|baby/.test(blob) || input.sector === 'baby') {
    return id === 'line-scene' ? 0.55 : id === 'botanical-card' || id === 'card-on-art' ? -0.2 : 0
  }
  if (/temizlik|deterjan/.test(blob) || input.sector === 'cleaning') {
    return id === 'wave-panel' ? 0.55 : id === 'botanical-card' || id === 'card-on-art' ? -0.25 : 0
  }
  if (/şampuan|shampoo|krem|bakım/.test(blob) && !/parfüm|perfume/.test(blob)) {
    return id === 'botanical-card' || id === 'card-on-art' ? 0.5 : id === 'diagonal-tech' || id === 'diagonal-split' ? 0.15 : 0
  }
  if (/parfüm|perfume|eau de/.test(blob)) return id === 'dark-landscape' || id === 'ink-wash' || id === 'ink-panel' ? 0.5 : 0
  if (/elektronik|kulaklık|earbuds|tech/.test(blob)) return id === 'diagonal-tech' || id === 'diagonal-split' ? 0.5 : -0.1
  return 0
}

/**
 * Heuristic art-direction from the brief. Closed vocabulary only — never invents geometry.
 * Conversation / LLM hints overlay this; catalog jobs omit studio so freeze is untouched.
 */
export function hintsFromBrief(brief: DesignBrief, sector: SectorId, surface: StudioSurface): DirectionHints {
  const blob = `${brief.sector} ${brief.subProduct} ${brief.productName} ${brief.colors} ${brief.directorCue ?? ''}`.toLocaleLowerCase('tr')
  const label = surface === 'label'
  const hints: DirectionHints = { source: 'heuristic', rationale: [] }
  if (/kahve|coffee|espresso|frappe|brew/.test(blob)) {
    hints.archetype = 'marble-frame'
    hints.background = 'marble'
    hints.rationale = ['Kahve — Elite Brew mermer + köşe parantez sistemi.']
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
  if (/mermer|marble/.test(blob)) hints.background = 'marble'
  if (/botanik|yaprak|leaf/.test(blob)) hints.background = 'botanical'
  if (sector === 'perfume' && !hints.archetype) {
    hints.archetype = label ? 'ink-panel' : 'dark-landscape'
  }
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

export function resolveDirection(input: DirectionInput): DesignDirection {
  const hints = mergeHints(input.hints)
  const { brief, sector, style, surface, locale } = input
  const temperamentGuess = hints.temperament ?? temperamentFor(sector, style, input.palette, brief)
  const candidates = archetypesFor(surface)
    .map((dna) => ({ dna, score: scoreArchetype(dna, input, temperamentGuess, hints) }))
    .sort((a, b) => b.score - a.score || a.dna.id.localeCompare(b.dna.id))
  const pinned = hints.archetype ? candidates.find((c) => c.dna.id === hints.archetype) : undefined
  const pool = candidates.slice(0, 3)
  const pick = pinned ?? pool[input.variationIndex % pool.length] ?? candidates[0]
  const dna = pick.dna
  const temperament: Temperament = dna.temperaments.includes(temperamentGuess) ? temperamentGuess : (hints.temperament ?? dna.temperaments[0])
  const background =
    hints.background && dna.backgrounds.includes(hints.background)
      ? hints.background
      : dna.backgrounds.filter((b) => !hints.avoidBackgrounds?.includes(b))[Math.floor(input.variationIndex / 3) % Math.max(1, dna.backgrounds.length)] ?? dna.backgrounds[0]
  const palette = studioPalette(input.palette, temperament)
  const bank = copyBankFor(brief, sector, locale)
  const seed = hashSeed(`${brief.brandName}|${brief.productName}|${sector}|${surface}|${input.variationIndex}`)
  const category = hints.categoryLine || refineCategory(brief, sector, locale) || bank.category
  const chipsFromBrief = claimChip(brief, bank.chips[0])
  const chips = hints.chips?.length ? hints.chips : [chipsFromBrief, ...bank.chips.filter((c) => c !== chipsFromBrief)].slice(0, 2)
  const productPrefix =
    hints.productPrefix ?? (dna.typePairing === 'script-accent/sans-heavy' || dna.typePairing === 'spaced-serif/spaced-sans' ? bank.prefixes[input.variationIndex % bank.prefixes.length] : '')
  const spokenTag = (hints.taglineLine || input.copy.tagline || '').trim()
  const tagline = (isGenericTagline(spokenTag, brief.brandName) ? '' : spokenTag) || bank.tagline
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
    taglineLine: tagline.length > 42 ? tagline.slice(0, 40).replace(/\s+\S*$/, '') : tagline,
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

/** Short TR summary for the chat / process note. */
export function describeDirection(d: DesignDirection): string {
  const surface = d.surface === 'label' ? 'etiket' : 'kutu'
  return `${surface} · ${d.archetype} · ${d.background} · ${d.temperament}${d.productPrefix ? ` · "${d.productPrefix}"` : ''}`
}

export { dnaFor }
