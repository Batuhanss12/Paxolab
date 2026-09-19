/**
 * Type systems — what a pairing *does*, not which font it names.
 *
 * The reference set (audit §4.2) had thirteen typographic behaviours; the repertoire had four
 * pairings on three families and expressed each behaviour as a scattered ternary in a painter
 * (`typePairing === 'spaced-serif/spaced-sans' ? 0.16 : …`). This table is the one place a
 * pairing is described: the five faces it sets, how tightly its brand line is tracked, whether
 * the brand is set in capitals, how far its display size may push past the painter's ceiling,
 * and what kind of wordmark it suits. Painters read it through the helpers below.
 *
 * The four systems the frozen faces were painted with keep their exact values — the same
 * faces, the same tracking, the same case, a scale of one — so nothing golden moves. The six
 * that follow are the behaviours the audit found missing, each on a face vendored for it
 * (Instrument Serif, Barlow Condensed, Righteous, IBM Plex Mono — all SIL OFL) or on a weight
 * the studio already had. They are appended to the archetypes' preference lists, never first,
 * and a brief's personality or a picked card is what reaches them.
 */
import type { Face } from './text'
import type { TypePairing } from './types'

export type TrackingClass = 'tight' | 'normal' | 'loose' | 'spaced' | 'wide'

/** Letter-spacing of the brand line, in em. The first four are the values the painters carried. */
export const TRACKING_EM: Record<TrackingClass, number> = { tight: -0.01, normal: 0.02, loose: 0.08, spaced: 0.16, wide: 0.3 }

export type TypeSystem = {
  id: TypePairing
  faces: { brand: Face; product: Face; prefix: Face; meta: Face; body: Face }
  tracking: TrackingClass
  /** `upper` sets the brand in capitals; `as-is` keeps the customer's own casing (a script, a rounded display). */
  caseMode: 'upper' | 'as-is'
  /** Multiplier on the painter's brand-size ceiling. One is the painter's own; an oversized display pushes past it where the room allows. */
  scale: number
  /** How far the display weight sits from the secondary's — a reading aid for the evaluator, not a knob. */
  weightContrast: 'low' | 'high'
  /** `short`: an oversized, condensed or very widely tracked display wants a short wordmark; a long name would be shrunk to fit and lose the behaviour. */
  shape: 'any' | 'short'
  /** Whether the product line takes a spoken prefix ("Golden", "Pure") in the prefix face. */
  prefixed: boolean
  /** The behaviour in the customer's words. */
  talk: string
  /** Which references it was read off. */
  references: string
}

export const TYPE_SYSTEMS: Record<TypePairing, TypeSystem> = {
  'serif-display/sans-meta': {
    id: 'serif-display/sans-meta',
    faces: { brand: 'serif', product: 'sans', prefix: 'serif-italic', meta: 'sans', body: 'sans' },
    tracking: 'loose',
    caseMode: 'upper',
    scale: 1,
    weightContrast: 'high',
    shape: 'any',
    prefixed: false,
    talk: 'serif başlık, sans künye',
    references: 'GUESS, Anadolu — R17, R18, R20, R29',
  },
  'script-accent/sans-heavy': {
    id: 'script-accent/sans-heavy',
    faces: { brand: 'sans-heavy', product: 'sans-heavy', prefix: 'script', meta: 'sans', body: 'sans' },
    tracking: 'normal',
    caseMode: 'as-is',
    scale: 1,
    weightContrast: 'high',
    shape: 'any',
    prefixed: true,
    talk: 'el yazısı vurgu, kalın sans ürün',
    references: 'woo, Elite Brew — R02, R24, R30',
  },
  'sans-light/sans-heavy': {
    id: 'sans-light/sans-heavy',
    faces: { brand: 'serif', product: 'sans-heavy', prefix: 'sans-light', meta: 'sans', body: 'sans' },
    tracking: 'normal',
    caseMode: 'upper',
    scale: 1,
    weightContrast: 'high',
    shape: 'any',
    prefixed: false,
    talk: 'ince + kalın sans',
    references: 'Capelli, DNA — R04, R11',
  },
  'spaced-serif/spaced-sans': {
    id: 'spaced-serif/spaced-sans',
    faces: { brand: 'serif', product: 'sans', prefix: 'serif-italic', meta: 'sans', body: 'serif' },
    tracking: 'spaced',
    caseMode: 'upper',
    scale: 1,
    weightContrast: 'low',
    shape: 'any',
    prefixed: true,
    talk: 'aralıklı serif marka, aralıklı sans ürün',
    references: 'Rebull, Diako — R19, R28',
  },
  /* ------------------------------------------------ Phase 4: the behaviours the audit found missing */
  'condensed-serif/mono': {
    id: 'condensed-serif/mono',
    faces: { brand: 'condensed-serif', product: 'condensed-serif', prefix: 'condensed-serif-italic', meta: 'mono', body: 'mono' },
    tracking: 'tight',
    caseMode: 'upper',
    scale: 1.3,
    weightContrast: 'low',
    shape: 'short',
    prefixed: true,
    talk: 'dar serif başlık, mono künye',
    references: 'R02, R26 — condensed display serif over a monospace spec line',
  },
  'condensed-grotesk/sans-light': {
    id: 'condensed-grotesk/sans-light',
    faces: { brand: 'condensed-grotesk', product: 'condensed-grotesk', prefix: 'sans-light', meta: 'sans', body: 'sans' },
    tracking: 'tight',
    caseMode: 'upper',
    scale: 1.25,
    weightContrast: 'low',
    shape: 'short',
    prefixed: false,
    talk: 'dar grotesk başlık',
    references: 'R14 — condensed sans display',
  },
  'rounded/sans': {
    id: 'rounded/sans',
    faces: { brand: 'rounded', product: 'sans-heavy', prefix: 'sans-light', meta: 'sans', body: 'sans' },
    tracking: 'normal',
    caseMode: 'as-is',
    scale: 1.05,
    weightContrast: 'high',
    shape: 'any',
    prefixed: false,
    talk: 'yuvarlak retro başlık',
    references: 'R13, R15, R27 — rounded / retro display',
  },
  'display-serif-oversized/sans-meta': {
    id: 'display-serif-oversized/sans-meta',
    faces: { brand: 'serif-heavy', product: 'sans', prefix: 'serif-italic', meta: 'sans', body: 'sans' },
    tracking: 'tight',
    caseMode: 'upper',
    scale: 1.4,
    weightContrast: 'high',
    shape: 'short',
    prefixed: true,
    talk: 'aşırı büyük yüksek kontrastlı serif',
    references: 'R01, R09, R17, R20 — high-contrast display serif, oversized',
  },
  'heavy-grotesk-block/sans': {
    id: 'heavy-grotesk-block/sans',
    faces: { brand: 'sans-heavy', product: 'sans', prefix: 'sans', meta: 'sans', body: 'sans' },
    tracking: 'tight',
    caseMode: 'upper',
    scale: 1.2,
    weightContrast: 'low',
    shape: 'any',
    prefixed: false,
    talk: 'ağır grotesk blok',
    references: 'R10, R23 — heavy grotesk block, tight setting',
  },
  'light-geometric/wide': {
    id: 'light-geometric/wide',
    faces: { brand: 'sans-light', product: 'sans', prefix: 'sans-light', meta: 'sans', body: 'sans' },
    tracking: 'wide',
    caseMode: 'upper',
    scale: 1,
    weightContrast: 'low',
    shape: 'short',
    prefixed: false,
    talk: 'ince geometrik, çok geniş aralık',
    references: 'R11, R04 — light geometric sans, very wide tracking',
  },
}

export function typeSystem(pairing: TypePairing): TypeSystem {
  return TYPE_SYSTEMS[pairing] ?? TYPE_SYSTEMS['serif-display/sans-meta']
}

/** Letter-spacing of the brand line, in em, for this pairing. */
export function brandTracking(pairing: TypePairing): number {
  return TRACKING_EM[typeSystem(pairing).tracking]
}

/** The brand as this pairing sets it: capitals, or the customer's own casing. */
export function brandCase(pairing: TypePairing, brand: string): string {
  return typeSystem(pairing).caseMode === 'as-is' ? brand : brand.toLocaleUpperCase('tr')
}

/** Multiplier on a painter's brand-size ceiling. */
export function brandScale(pairing: TypePairing): number {
  return typeSystem(pairing).scale
}

/** The shape of a wordmark, as far as a type system cares: how many letters, how many words. */
export function copyShape(brand: string): { chars: number; words: number; short: boolean } {
  const trimmed = brand.trim()
  const words = trimmed ? trimmed.split(/\s+/).length : 0
  const chars = trimmed.replace(/\s+/g, '').length
  return { chars, words, short: chars > 0 && chars <= 9 && words <= 2 }
}

/** Whether this pairing suits the wordmark — an oversized or condensed display wants a short one. */
export function suitsCopy(pairing: TypePairing, brand: string): boolean {
  return typeSystem(pairing).shape === 'any' || copyShape(brand).short
}

/**
 * An archetype's pairings for this wordmark: its own first entry always (the frozen faces were
 * painted with it, whatever the name), then the rest of the list where the shape allows.
 */
export function pairingsFor(list: readonly TypePairing[], brand: string): TypePairing[] {
  return list.filter((pairing, i) => i === 0 || suitsCopy(pairing, brand))
}

/**
 * The faces of a painter whose title is set light + heavy in its own two sans weights (the
 * diagonal faces, the line scene). On the pairing the painter was written for it keeps its own
 * faces and its own tracking, byte for byte — those faces are frozen. On any other system the
 * heavy role takes the system's display face, the light role its prefix face, and the tracking
 * is the system's, which is how a condensed grotesk, a heavy block or a wide light geometric
 * reaches a face that never called `pairingFaces`.
 */
export function titleFaces(pairing: TypePairing, native: TypePairing, own: { light: Face; heavy: Face; tracking: number }): { light: Face; heavy: Face; tracking: number } {
  if (pairing === native) return own
  const faces = typeSystem(pairing).faces
  return { light: faces.prefix, heavy: faces.brand, tracking: brandTracking(pairing) }
}

export const ALL_TYPE_SYSTEMS: TypePairing[] = Object.keys(TYPE_SYSTEMS) as TypePairing[]
