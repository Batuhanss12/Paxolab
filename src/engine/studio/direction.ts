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
  concentrationLine,
  copyBankFor,
  isGenericTagline,
  refineBenefits,
  refineCategory,
  samePackLine,
  volumeLine,
} from './copyBank'
import { STUDIO_FAMILIES, familyOf } from './family'
import type { StudioIntent } from './studioPlanBridge'
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
  /**
   * Step past the archetype the mood would otherwise pick.
   *
   * Used when the chosen face turned out not to fit this panel: the engine paints, reads the
   * ledger, and asks for the next candidate rather than shipping something broken. Separate from
   * `variationIndex` so the variation the customer is looking at keeps its number.
   */
  archetypeStep?: number
  copy: { brand: string; product: string; tagline: string; volume: string }
  hints?: DirectionHints[]
  /** The front is a disc or an oval. A `bezel` frame is a property of that cut, not of any archetype. */
  round?: boolean
  /**
   * What the design brain wants on the three preference axes. Read by the ranking as a small fit
   * term — an archetype whose lists can wear the plan's pairing, frame and ornament edges ahead of
   * one that cannot — never as a pin.
   */
  intent?: StudioIntent
}

/** How many directions the customer is offered to choose between after a generation. */
/**
 * How many designs the customer is offered.
 *
 * Measured 2026-09-18. The pool's hard ceiling is the number of visual families, 10 — asking for
 * 12 returns 10 on a carton and 9 on a label, because `dark-luxe` and `ink` share `ink-panel`
 * there. Cost is not the constraint: a full generation with ten painted candidate fronts runs
 * 10–20 ms end to end, 1–2 ms per extra face, ~21–35 KB of SVG each.
 *
 * Eight, not ten, because the tail stops being an option worth showing. On the honey carton the
 * ranked scores run 1.95, 0.41, 0.38, 0.24, 0.12, 0.11, 0.11, 0.09 — and then 0.05 and **−0.03**,
 * that last one a circuit-board field on a jar of honey. Offering it does not widen the choice,
 * it spends the customer's attention on a design the engine itself scored as wrong.
 */
export const DIRECTION_OFFER_SIZE = 8

/**
 * A negative score means the archetype's own DNA rejects this sector. No amount of wanting more
 * choice makes such a row worth a card, so it is cut even when the offer is short.
 */
const OFFER_SCORE_FLOOR = 0

/** Fixed presentation order for the offer, so a card never changes place under the customer. */
const FAMILY_ORDER = Object.keys(STUDIO_FAMILIES) as StudioFamily[]

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

/**
 * The same, for the tone knob: what *this* treatment would do to *this* brief.
 *
 * Tone is a second, deliberate dimension on top of the mood. Six moods alone give six palettes;
 * six tones against them give thirty-six, and that range is the difference between a customer who
 * keeps clicking and one who concludes the engine only knows one answer.
 */
export function tonePreview(
  brief: DesignBrief,
  mood: StyleType,
  temperament: Temperament,
): { ground: string; accent: string; ink: string } {
  const pal = studioPalette(ensureAccentContrast(paletteFromBrief(brief, mood)), temperament)
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
  /*
   * "Warm" requires a hue the eye can actually see.
   *
   * This tested saturation and hue but not lightness, and the table's cream — `#f5f0e8`, the colour
   * a brief means by "krem" — reports hue 37° at saturation 0.39 and lightness 0.94. No hue reads at
   * that lightness, but the check fired, and a "yeşil · krem" brief came back with a gold accent and
   * a brown sibling: two colours nobody asked for, on the face. Same defect `isNeutral` fixed on the
   * palette side; this copy never got the rule.
   */
  const accentReadable = accentH.l > 0.12 && accentH.l < 0.9
  const warmAccent =
    accentH.s > 0.15 && accentReadable && ((accentH.h >= 20 && accentH.h <= 60) || accentH.h < 12 || accentH.h > 340)
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
      /*
       * The accent comes from the brief before it comes from the mood.
       *
       * "yeşil · krem" put the cream in the accent slot, and cream has nothing to say against a pale
       * sage ground — `separateAccent` pushed it until it separated, and what came out was ochre.
       * A green-and-cream brief was returning a brown face with no green accent anywhere.
       *
       * Eco's warmth belongs in the treatment — paper-toned ground, warm ink — not in inventing a
       * colour. So when the brief's accent carries no usable hue, the accent is drawn from the hue
       * the brief *did* give, deepened until it reads. Gold stays as the last resort, for briefs
       * that named nothing usable at all.
       */
      const briefHue = accentReadable ? accentH : bgH.s > 0.12 ? bgH : null
      const naturalAccent = briefHue
        ? fromHsl(briefHue.h, Math.max(0.3, Math.min(0.6, briefHue.s)), 0.32)
        : warmAccent
          ? gold
          : '#b8892f'
      const accent = separateAccent(ground, naturalAccent)
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
  /** 0–1: how many of the brain's axis intents this archetype's preference lists can wear. 1 when the brain said nothing. */
  intentFit: number
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
  /*
   * The brain's axis intents, as a fit rather than a pin. Each intent the archetype's lists can
   * wear counts; an archetype that can wear none of them loses 0.05 — enough to break a tie between
   * two faces the sector likes equally, not enough to outvote the sector or the mood. Measured
   * against the frozen table at 0.05: one carton moved — the minimal health box went from ink-wash
   * to diagonal-tech, which is the family its own label had already been given, so the pair now
   * agree — and the other seventeen archetypes held. The term exists to order the *pool*.
   */
  const asks: [unknown, readonly unknown[]][] = [
    [input.intent?.typePairing, dna.typePairings],
    [input.intent?.frame, dna.frames],
    [input.intent?.ornament, dna.ornaments],
  ].filter(([ask]) => ask !== undefined) as [unknown, readonly unknown[]][]
  const intentFit = asks.length ? asks.filter(([ask, list]) => list.includes(ask)).length / asks.length : 1
  const score =
    sectorFit * 0.22 + styleFit * 0.35 + aspectFit * 0.1 + tempFit * 0.18 + intentFit * 0.05 + productFamily + hintPin + veto + backgroundMismatch
  return {
    score,
    parts: { sectorFit, styleFit, aspectFit, tempFit, productFamily, hintPin, veto, backgroundMismatch, intentFit },
  }
}

/** TASARIM REF product families → the archetype distilled from that reference. */
function productFamilyFit(id: string, input: DirectionInput): number {
  const blob = `${input.brief.sector} ${input.brief.subProduct} ${input.brief.productName}`.toLocaleLowerCase('tr')
  if (/kahve|coffee|espresso|frappe|brew/.test(blob)) return id === 'marble-frame' ? 0.22 : id === 'noir-stack' ? 0.05 : -0.08
  if (/\bbal\b|honey|reçel|dağ/.test(blob)) return id === 'specimen-hero' ? 0.22 : -0.08
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
  if (/parfüm|perfume|eau de/.test(blob)) return id === 'noir-stack' || id === 'ink-wash' || id === 'ink-panel' ? 0.22 : 0
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
  if (/mürekkep|\bink\b/.test(blob)) {
    return {
      archetype: label ? 'ink-panel' : 'noir-stack',
      temperament: 'dark-luxe',
      pinSource: 'visual',
      rationale: ['Brief: mürekkep.'],
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
  // The two STİCKERR REF plates. Both archetypes are shared across surfaces, so no label/box fork.
  if (/\barma\b|\bcrest\b|arabesk|arabesque|roundel|madalyon/.test(blob)) {
    return { archetype: 'crest-panel', background: 'arabesque', pinSource: 'visual', rationale: ['Brief: arma / arabesk — Azzurra roundel sistemi.'] }
  }
  if (/at[öo]lye|atelier|\bplaka\b|\bplate\b/.test(blob)) {
    return { archetype: 'atelier-plate', frame: 'band-hairline', pinSource: 'visual', rationale: ['Brief: atölye / plaka — Diako üç katlı tip plakası.'] }
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
    // The drawn subject, not scenery: a honey pack's picture is the flower the bee worked.
    hints.archetype = 'specimen-hero'
    hints.background = 'gradient-wash'
    hints.rationale = ['Gıda / bal — çizilmiş botanik özne.']
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
    hints.archetype = label ? 'ink-panel' : 'noir-stack'
    hints.temperament = /krem|cream|light/.test(blob) ? 'light-luxe' : 'dark-luxe'
    hints.rationale = ['Parfüm — Guess / Rebull koyu lüks manzara + mürekkep.']
  } else if (/elektronik|kulaklık|earbuds|tech/.test(blob)) {
    hints.archetype = label ? 'diagonal-split' : 'diagonal-tech'
    hints.temperament = 'tech-dark'
    hints.rationale = ['Elektronik — Capelli diyagonal metalik sistem.']
  }
  if (sector === 'perfume' && !hints.archetype) {
    hints.archetype = label ? 'ink-panel' : 'noir-stack'
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
  // Only a pin the customer set themselves is absolute — an explicit direction pick, or a family
  // they locked in the UI. A guess the engine made from the sector or from a word in the brief
  // still scores heavily in `hintPin`, which keeps it at the top of the ranking; it just no longer
  // forbids the mood from looking further down.
  const userPinned = hints.pinSource === 'user' || hints.pinSource === 'family' || hints.source === 'user'
  const pinned =
    userPinned && hints.archetype && !avoided.has(hints.archetype)
      ? scored.find((c) => c.dna.id === hints.archetype)
      : undefined
  const eligible = scored.filter((c) => !avoided.has(c.dna.id as StudioArchetype))
  const ranked = eligible.length ? eligible : scored
  /*
   * Four, not three.
   *
   * The owner's ask: pressing "start" should put a spread in front of the customer — four
   * suitable designs from different systems — and let them choose, rather than handing them one
   * face and two runners-up. Four is what fits a strip without the choice becoming a catalogue,
   * and `uniqueFamilyRows` already guarantees they come from four different families.
   */
  const pool = uniqueFamilyRows(ranked, DIRECTION_OFFER_SIZE)
  /*
   * The mood may walk, but only among faces the sector recognises.
   *
   * The walk used to take whatever sat at its offset, however unrelated. On a baby-care brief —
   * mood `playful`, offset 5 — it stepped five places down and landed on `marble-frame`: stone
   * veining on a baby product. That is not range, it is the ranking being ignored.
   *
   * Windowing by *score* cannot fix it: measured, the scores are one clear leader and then a large
   * drop, so a window wide enough to keep any variety (4.2 archetypes per brief) is wide enough to
   * reach marble anyway, and a window tight enough to block marble collapses variety to 1.3.
   *
   * The useful distinction is not "low score", it is "the sector does not know this face". Each
   * archetype's DNA lists the sectors it serves — `line-scene` scores 1 on baby, `landscape-window`
   * 0.4, `wave-panel` 0.3, while marble, ink-wash and noir-stack do not appear at all. Walking
   * among the ones that appear keeps five faces reachable for a baby brief and none of them absurd.
   */
  /*
   * 0.3, chosen by sweeping it. At 0.25 the baby brief reaches `botanical-card`, which the reference
   * knowledge rejects for baby care; at 0.4 range drops to 2.8 archetypes per brief for no further
   * gain. 0.3 keeps 3.0 and lets the sector's own reference stay reachable.
   */
  const sectorFloor = 0.3
  // A word in the brief outranks the sector's opinion of it. "elektronik kutu ama mermer" means
  // marble, even though marble lists no electronics affinity — the customer is telling us something
  // the table does not know. The floor exists to stop the *mood* wandering, not to overrule them.
  const spoken = hints.archetype
  const recognised = input.brief.sector
    ? ranked.filter((row) => row.dna.id === spoken || (row.dna.sectors[input.sector] ?? 0) >= sectorFloor)
    : ranked
  const walk = uniqueFamilyRows(recognised.length ? recognised : ranked, 6)
  const step = MOOD_WALK_OFFSET[input.style] ?? 0
  const pick =
    pinned ??
    walk[(input.variationIndex + step + (input.archetypeStep ?? 0)) % Math.max(1, walk.length)] ??
    ranked[0] ??
    scored[0]
  return { hints, temperamentGuess, scored, scores, ranked, pool, pick }
}

/**
 * Where each mood starts walking the ranked archetypes.
 *
 * Measured 2026-09-17: on 3 of 4 briefs, clicking through all six moods returned the *same*
 * skeleton, the same background family and the same layout variant — only the paint moved. The
 * cause was `hintPin`, worth +2 against a scoring range of roughly 1: once the sector or a visual
 * word had named an archetype, nothing else could outvote it, so every mood repainted one face.
 *
 * The owner's call is maximum range: a mood may move the composition, not merely its colours. So
 * the mood chooses *where in the ranking* to look rather than trying to out-argue the pin. Every
 * candidate it can reach is still a well-scored one — suitability lives in the ranking — but six
 * moods now reach six different faces. A pin the user set themselves still wins outright; a guess
 * the engine made from the sector does not.
 */
const MOOD_WALK_OFFSET: Record<StyleType, number> = {
  luxury: 0,
  classic: 1,
  minimal: 2,
  modern: 3,
  eco: 4,
  playful: 5,
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
  const lineSeed = hashSeed(`${brief.brandName}|${sector}|${surface}|${variationIndex}`)
  // A concentration the brief named outranks the bank's EAU DE PARFUM — but never a spoken line.
  const category = hints.categoryLine || concentrationLine(brief.concentration) || refineCategory(brief, sector, locale) || bank.category
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
  /*
   * Each axis is its own decision. A hint wins when the archetype allows it; otherwise the
   * variation walks the archetype's preference list, and variation 0 takes the first entry so the
   * frozen faces stay where they are. Before this, all three were fixed properties of the archetype
   * — a marble face wore one pairing and one frame for its whole life.
   */
  const pickAxis = <T,>(list: readonly T[], hint: T | undefined): T => {
    if (hint !== undefined && list.includes(hint)) return hint
    return list[variationIndex > 0 ? variationIndex % Math.max(1, list.length) : 0] ?? list[0]
  }
  const typePairing = pickAxis(dna.typePairings, hints.typePairing)
  // A bezel belongs to a curved cut, so no archetype lists it; the hint is honoured on a round front
  // and dropped on a rectangle, where `paintFrame` would draw nothing and the face would lose its edge.
  const frame = hints.frame === 'bezel' && input.round ? 'bezel' : pickAxis(dna.frames, hints.frame === 'bezel' ? undefined : hints.frame)
  const ornament = pickAxis(dna.ornaments, hints.ornament)
  const productPrefix =
    hints.productPrefix ??
    (typePairing === 'script-accent/sans-heavy' || typePairing === 'spaced-serif/spaced-sans'
      ? bank.prefixes[variationIndex % bank.prefixes.length]
      : '')
  const rationale = [...directionRationale(dna, temperament, background, palette), ...(hints.rationale ?? [])]
  return {
    surface,
    archetype: dna.id as StudioArchetype,
    // Shifted off the texture rng so the arrangement and the background grain do not move together.
    variant: (seed >>> 5) % LAYOUT_VARIANTS,
    background,
    typePairing,
    temperament,
    frame,
    lockup: hints.lockup ?? dna.lockup,
    ornament,
    palette,
    benefits: refineBenefits(brief, bank.benefits, locale).slice(0, 4),
    chips,
    manifesto: hints.manifesto?.length ? hints.manifesto.slice(0, 4) : bank.manifesto,
    categoryLine: category,
    editionLine: (brief.edition ?? '').trim(),
    attributionLine: (brief.attribution ?? '').trim(),
    originLine: (brief.origin ?? '').trim(),
    taglineLine: selected.tagline,
    copySource: selected.copySource,
    story: (brief.story?.trim() || bank.story).trim(),
    volumeLine: volumeLine(input.copy.volume, locale),
    productPrefix,
    rationale,
    source: hints.source ?? (hints.archetype ? 'llm' : 'heuristic'),
    seed,
    lineSeed,
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
  /*
   * The offer is ranked as if nothing were picked.
   *
   * The pin that selects a family also boosts it in the ranking, and the boost can push whatever
   * sat on the cut line out of the set — measured on a honey carton, choosing `marble` or `crest`
   * swapped `ink` for `dark-luxe`, so two cards the customer had been looking at were replaced by
   * one they had not. Which design is *selected* is the customer's business; which designs are
   * *offered* belongs to the brief, and it should read the same on every visit.
   */
  const unpinned = input.hints?.some((hint) => hint.pinSource === 'family')
    ? rankDirectionPool({ ...input, hints: input.hints.filter((hint) => hint.pinSource !== 'family') })
    : ranked
  let rows = unpinned.pool
  if (!rows.some((row) => row.dna.id === winnerId)) {
    rows = [ranked.pick, ...rows.filter((row) => row.dna.id !== winnerId)].slice(0, DIRECTION_OFFER_SIZE)
  }
  // Keep the painted face whatever it scored — it is the design on screen — and cut the rest at
  // the floor. `slice` guards the case where everything below the winner is negative.
  const keep = rows.filter((row) => row.dna.id === winnerId || row.score > OFFER_SCORE_FLOOR)
  /*
   * Canonical order, not score order.
   *
   * The ranking puts the best fit first, and picking a design re-ranks with that family pinned —
   * so the card the customer just chose jumped to position 1 and everything else slid along. The
   * owner's report was that the row reshuffles as you click it, and a picker whose contents move
   * under the cursor is not a picker. Ordering by the family table instead means card 3 is the
   * same design before and after a click, and "3. yön" keeps meaning what it meant in the chat.
   *
   * The recommendation is not lost: it is carried by which candidate arrives `selected`, which is
   * what the preview shows and what the strip badges.
   */
  const ordered = (keep.length >= 2 ? keep : rows.slice(0, 2))
    .slice()
    .sort((a, b) => FAMILY_ORDER.indexOf(familyFor(a.dna.id as StudioArchetype)) - FAMILY_ORDER.indexOf(familyFor(b.dna.id as StudioArchetype)))
  const candidates: DirectionCandidate[] = ordered.map((row, i) => {
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
