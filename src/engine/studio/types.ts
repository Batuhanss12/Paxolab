/**
 * Studio layer — reference-level layouts.
 *
 * The Design Brain resolves a `DesignDirection` (archetype + background + type pairing + copy anatomy)
 * and the deterministic painters in this folder turn it into full-anatomy SVG faces. The LLM may
 * *propose* a direction from a closed vocabulary; it never draws.
 */
import type { CopyLocale, Palette } from '../../types'
import type { SectorId } from '../designSystem/types'

export type StudioSurface = 'label' | 'box'

/** Label archetypes distilled from TASARIM REF. */
export type LabelArchetype =
  | 'card-on-art' // woo.originals — tone-on-tone botanical, white title card, dark claim band, legal column
  | 'marble-frame' // Elite Brew — marble field, corner-bracket lockup, script + bold product at the foot
  | 'diagonal-split' // Capelli Fellici — dark field with diagonal metallic blocks, two-column pro anatomy
  | 'line-scene' // DNA Pharma — white, two-tone title, line-drawn scene in the lower half
  | 'landscape-badge' // Anadolu Bal — cream + thin double frame, landscape window, dark product badge
  | 'ink-panel' // Rebull Noir — cream panel, ink wash rising from a corner with metallic veins
  | 'wave-panel' // cleaning / care — horizontal wave bands, stacked sans lockup

/** Box front archetypes. Back / side / top anatomy follows the same direction. */
export type BoxArchetype =
  | 'dark-landscape' // GUESS Sauvage — black + gold, moonlit landscape fading into the ground
  | 'ink-wash' // Rebull Noir — cream front, navy ink from the corner, navy sides with stacked words
  | 'landscape-window' // Anadolu Bal — arched landscape window, thin gold frame, benefit icons on sides
  | 'marble-frame' // marble field carton with corner-bracket lockup
  | 'botanical-card' // vivid tone-on-tone botanical carton with a white title card
  | 'diagonal-tech' // charcoal with diagonal blocks — electronics / pro care
  | 'line-scene' // DNA Pharma system on a carton — white field, two-tone title, line-drawn scene
  | 'wave-panel' // cleaning carton — wave bands, stacked sans lockup

export type StudioArchetype = LabelArchetype | BoxArchetype

/** Shared visual system across box + label (companion generate keeps this key). */
export type StudioFamily = 'marble' | 'botanical' | 'line-scene' | 'wave' | 'landscape' | 'ink' | 'dark-luxe' | 'tech'

export type BackgroundFamily =
  | 'marble'
  | 'botanical'
  | 'diagonal'
  | 'landscape-moon'
  | 'landscape-meadow'
  | 'ink-wash'
  | 'line-scene'
  | 'paper'
  | 'wave'
  | 'circuit'

export type TypePairing =
  | 'serif-display/sans-meta' // GUESS / Anadolu — serif brand, spaced sans meta
  | 'script-accent/sans-heavy' // woo / Elite Brew — script prefix + heavy sans product
  | 'sans-light/sans-heavy' // Capelli / DNA — light + bold sans title
  | 'spaced-serif/spaced-sans' // Rebull — tracked serif brand, tracked sans product

export type Temperament =
  | 'dark-luxe'
  | 'light-luxe'
  | 'vivid-mono'
  | 'natural-warm'
  | 'clean-clinical'
  | 'tech-dark'

export type FrameStyle = 'none' | 'thin-double' | 'corner-brackets' | 'rounded-card'

export type LockupStyle = 'stacked-center' | 'top-right-pill' | 'left-column' | 'monogram-right'

export type BenefitIcon = 'leaf' | 'drop' | 'sun' | 'mountain' | 'bee' | 'jar' | 'check' | 'shield' | 'bolt' | 'flask' | 'heart' | 'star'

export type BenefitItem = { icon: BenefitIcon; label: string }

export type StudioPalette = {
  /** Main ground (field) colour. */
  ground: string
  /** Body text on ground. */
  ink: string
  /** Metallic / signal accent (gold, copper, indigo…). */
  accent: string
  /** Secondary accent: darker or lighter sibling for texture. */
  accent2: string
  /** Light panel / card colour. */
  card: string
  /** Text on card. */
  cardInk: string
  /** Muted text on ground. */
  muted: string
}

export type DirectionSource = 'heuristic' | 'llm' | 'knowledge' | 'user' | 'family'

/** Studio tagline origin. Bank is fallback only. */
export type CopySource = 'user' | 'brief' | 'bank'

export type DesignDirection = {
  surface: StudioSurface
  archetype: StudioArchetype
  background: BackgroundFamily
  typePairing: TypePairing
  temperament: Temperament
  frame: FrameStyle
  lockup: LockupStyle
  palette: StudioPalette
  /** Sector benefit icons + short labels (3–4). */
  benefits: BenefitItem[]
  /** Claim chips: "ARGAN + COLLAGEN + KERATIN", "PROFESSIONAL · STEP 1". */
  chips: string[]
  /** Stacked manifesto words for spines / vertical columns. */
  manifesto: string[]
  /** Category line under the product: "EAU DE PARFUM", "SAÇ BAKIM KREMİ". */
  categoryLine: string
  /** Short tagline in spaced caps. */
  taglineLine: string
  /** Where taglineLine came from: user utterance, brief/LLM/sample, or copyBank. */
  copySource: CopySource
  /** Brand story paragraph for the back. */
  story: string
  /** Net quantity with ℮ and imperial twin: "250 ml ℮ · 8.45 fl.oz". */
  volumeLine: string
  /** Optional script prefix for the product ("Golden", "Signature"). */
  productPrefix: string
  /** TR rationale lines shown to the user. */
  rationale: string[]
  source: DirectionSource
  seed: number
  sector: SectorId
  locale: CopyLocale
}

/** Closed-vocabulary hints (LLM art director, knowledge bias, or user words). */
export type DirectionHints = {
  archetype?: StudioArchetype
  background?: BackgroundFamily
  temperament?: Temperament
  typePairing?: TypePairing
  frame?: FrameStyle
  lockup?: LockupStyle
  productPrefix?: string
  taglineLine?: string
  categoryLine?: string
  manifesto?: string[]
  chips?: string[]
  rationale?: string[]
  /** Archetypes / backgrounds to avoid (knowledge or user veto). */
  avoidArchetypes?: StudioArchetype[]
  avoidBackgrounds?: BackgroundFamily[]
  source?: DirectionSource
  /** Why the archetype was pinned — used by C6 explanation grounding. */
  pinSource?: 'visual' | 'sector' | 'user' | 'family'
}

export type PlacedBox = {
  id: string
  x: number
  y: number
  w: number
  h: number
  /**
   * text — measured type; element — mark / icon / barcode (must not touch text);
   * container — card / pill / chip / table that intentionally holds text (bounds-checked only);
   * ground — background window, never checked.
   */
  kind: 'text' | 'element' | 'container' | 'ground'
  /** Font size in mm for text boxes. */
  sizeMm?: number
}

export type StudioPanelReport = {
  panelId: string
  archetype: StudioArchetype | 'back' | 'side' | 'top' | 'flap' | 'glue' | 'plain'
  placed: PlacedBox[]
  collisions: string[]
  outOfBounds: string[]
  minTextMm: number
}

export type StudioCriticKind = 'quieter' | 'vary'

/** C6 button the ledger recommends. Talk is reconstructed with talkForCritic(kind). */
export type StudioCriticOffer = {
  kind: StudioCriticKind
  utterance: string
  reason: string
}

/** One scored DesignDirection from decideDirection's ranked pool. User picks; critic does not. */
export type StudioDirectionCandidate = {
  index: number
  family: StudioFamily
  archetype: StudioArchetype
  background: BackgroundFamily
  temperament: Temperament
  score: number
  selected: boolean
}

export type StudioDirectionOffer = {
  candidates: StudioDirectionCandidate[]
  selectedIndex: number
}

export type StudioReport = {
  direction: DesignDirection
  panels: StudioPanelReport[]
  collisions: string[]
  outOfBounds: string[]
  minTextMm: number
  /** Face + back + side anatomy that was painted (for the process note). */
  anatomy: string[]
  /** Ledger → C6 quieter/vary. Empty when the face is clean. */
  critic: StudioCriticOffer[]
  /** Ranked sibling directions. The painted face is `direction`; this is not a multi-paint. */
  offer?: StudioDirectionOffer
}

export type StudioInput = {
  palette: Palette
}

/** User mark + type scale consumed by studio painters. Scale 1 is identity (golden faces unchanged). */
export type StudioIdentity = {
  logoHref?: string
  logoScale: number
  titleScale: number
}

export const DEFAULT_STUDIO_IDENTITY: StudioIdentity = { logoScale: 1, titleScale: 1 }

export function clampStudioScale(n: number | undefined, fallback = 1): number {
  if (n == null || !Number.isFinite(n) || n <= 0) return fallback
  return Math.max(0.55, Math.min(2.2, n))
}
