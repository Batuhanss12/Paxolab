/**
 * Studio layer — reference-level layouts.
 *
 * The Design Brain resolves a `DesignDirection` (archetype + background + type pairing + copy anatomy)
 * and the deterministic painters in this folder turn it into full-anatomy SVG faces. The LLM may
 * *propose* a direction from a closed vocabulary; it never draws.
 */
import type { CopyLocale, Palette } from '../../types'
import type { SectorId } from '../designSystem/types'
import type { Fingerprint } from './fingerprint'

export type StudioSurface = 'label' | 'box'

/** Label archetypes distilled from TASARIM REF. */
export type LabelArchetype =
  | 'card-on-art' // woo.originals — tone-on-tone botanical, white title card, dark claim band, legal column
  | 'marble-frame' // Elite Brew — marble field, corner-bracket lockup, script + bold product at the foot
  | 'diagonal-split' // Capelli Fellici — dark field with diagonal metallic blocks, two-column pro anatomy
  | 'line-scene' // DNA Pharma — white, two-tone title, line-drawn scene in the lower half
  | 'ink-panel' // Rebull Noir — cream panel, ink wash rising from a corner with metallic veins
  | 'wave-panel' // cleaning / care — horizontal wave bands, stacked sans lockup
  | 'specimen-hero' // drawn subject at the centre, type stacked above and below it
  | 'atelier-plate' // Diako — three-tier type plate: brand / product / attribution, band-hairline edge
  | 'crest-panel' // Azzurra — roundel with a crest mark on a flat arabesque field
  | 'noir-plate' // the dark-luxe family's label: deep field, centred type, tagline above the foot
  /*
   * The reference repertoire (`refArchetypes.ts`) — eight skeletons distilled from the reference
   * folder that none of the ten above can paint. Reached only when the customer presses "show me
   * other designs"; the ten above are what the engine offers by default and what the frozen faces
   * were painted with.
   */
  | 'arch-crown' // arched crown, layered small-caps tiers, oversized display, dark spec band at the foot
  | 'collage-plate' // fixed wordmark, an arch window holding the engraved subject, a rotated word up one side, a seal
  | 'silhouette-foot' // small brand block at the top, one oversized flat silhouette filling the foot
  | 'ribbon-crest' // cut-silhouette double frame, medallion crown, laurel, a ribbon band carrying the claim
  | 'grid-mono' // oversized rotated condensed display, flat cut-paper cluster, a monospace body grid
  | 'pattern-float' // full-bleed pattern, monogram above, the wordmark floating on a quiet plate
  | 'blob-acid' // acid duotone, one giant blob crossing the face, a heavy grotesk block in the corner
  | 'inner-card' // quiet face, an inset art card holding the line subject, a vertical icon column

/** Box front archetypes. Back / side / top anatomy follows the same direction. */
export type BoxArchetype =
  | 'noir-stack' // GUESS Sauvage — black + gold, deep gilded field, centred lockup over a tagline
  | 'ink-wash' // Rebull Noir — cream front, navy ink from the corner, navy sides with stacked words
  | 'marble-frame' // marble field carton with corner-bracket lockup
  | 'botanical-card' // vivid tone-on-tone botanical carton with a white title card
  | 'diagonal-tech' // charcoal with diagonal blocks — electronics / pro care
  | 'line-scene' // DNA Pharma system on a carton — white field, two-tone title, line-drawn scene
  | 'wave-panel' // cleaning carton — wave bands, stacked sans lockup
  | 'specimen-hero' // drawn subject at the centre, type stacked above and below it
  | 'atelier-plate' // Diako — three-tier type plate on a carton front
  | 'crest-panel' // Azzurra — roundel with a crest mark on a flat arabesque field
  /* The reference repertoire paints one front for both surfaces — see `LabelArchetype`. */
  | 'arch-crown'
  | 'collage-plate'
  | 'silhouette-foot'
  | 'ribbon-crest'
  | 'grid-mono'
  | 'pattern-float'
  | 'blob-acid'
  | 'inner-card'

export type StudioArchetype = LabelArchetype | BoxArchetype

/**
 * Which repertoire an archetype belongs to.
 *
 * `studio` is the ten systems the engine has always offered and the eighteen frozen faces were
 * painted with. `reference` is the eight distilled in F-32 from the reference folder — a second,
 * complete set of eight the customer reaches by asking for other designs. The two never mix in
 * one strip: eight of one, or eight of the other, so "change the designs" means what it says.
 */
export type StudioRepertoire = 'studio' | 'reference'

/** Shared visual system across box + label (companion generate keeps this key). */
export type StudioFamily =
  | 'marble'
  | 'botanical'
  | 'line-scene'
  | 'wave'
  | 'ink'
  | 'dark-luxe'
  | 'tech'
  | 'specimen'
  | 'atelier'
  | 'crest'
  /* The reference repertoire — one family per archetype (F-32). */
  | 'arch'
  | 'collage'
  | 'silhouette'
  | 'ribbon'
  | 'grid'
  | 'pattern'
  | 'acid'
  | 'inner-card'

export type BackgroundFamily =
  | 'marble'
  | 'botanical'
  | 'diagonal'
  | 'ink-wash'
  | 'gradient-wash'
  | 'line-scene'
  | 'paper'
  | 'wave'
  | 'circuit'
  | 'arabesque' // flat interlaced star lattice — the Azzurra field; geometry, not texture
  /* Phase 5 — the graphic languages the reference set had and the repertoire lacked (`graphicFields.ts`). */
  | 'blob' // organic flat masses in the palette's colours — R10, R15, R24, R27
  | 'ogee' // pointed-arch lattice with a feather in each cell — R01
  | 'celestial' // a crescent, stars, sparks and rings in one line — R07, R16
  | 'pictogram' // the benefit icons as a staggered repeat — R13
  | 'toile' // small engraved sprigs of the product's plant, repeated in one ink — R06

export type TypePairing =
  | 'serif-display/sans-meta' // GUESS / Anadolu — serif brand, spaced sans meta
  | 'script-accent/sans-heavy' // woo / Elite Brew — script prefix + heavy sans product
  | 'sans-light/sans-heavy' // Capelli / DNA — light + bold sans title
  | 'spaced-serif/spaced-sans' // Rebull — tracked serif brand, tracked sans product
  /* Phase 4 — the behaviours the reference set had and the repertoire lacked (`typeSystem.ts`). */
  | 'condensed-serif/mono' // R02 / R26 — condensed display serif, oversized, over a mono spec line
  | 'condensed-grotesk/sans-light' // R14 — condensed grotesk display
  | 'rounded/sans' // R13 / R15 / R27 — rounded retro display
  | 'display-serif-oversized/sans-meta' // R01 / R09 / R17 / R20 — high-contrast serif, oversized
  | 'heavy-grotesk-block/sans' // R10 / R23 — heavy grotesk block, tight
  | 'light-geometric/wide' // R11 / R04 — light geometric sans, very wide tracking

export type Temperament =
  | 'dark-luxe'
  | 'light-luxe'
  | 'vivid-mono'
  | 'natural-warm'
  | 'clean-clinical'
  | 'tech-dark'

/**
 * Frame vocabulary.
 *
 * `band-hairline` is a solid band with a hairline inside it, separated by a gap — the Diako /
 * Odette plate edge. `fleuron-crown` is not a continuous frame at all: an ornament in each corner
 * and one at the top centre, which is how the Heeva plate reads. `bezel` is the metallic rim a
 * disc or oval label carries and is ignored on a rectangular face.
 */
export type FrameStyle =
  | 'none'
  | 'thin-double'
  | 'corner-brackets'
  | 'rounded-card'
  | 'band-hairline'
  | 'fleuron-crown'
  | 'bezel'
  /** Two laurel branches rising along the sides from the foot — the heritage member on R29 / R30. */
  | 'laurel'
  /** A cartouche arc at the crown and double-line corners, from the studio's own motif library (R20, R29). */
  | 'cartouche'

/**
 * How much decoration a face is allowed to carry.
 *
 * Until this existed, ornament was whatever the archetype's painter happened to draw, at whatever
 * intensity was hardcoded into the call. It is now a decision of its own: the same archetype can be
 * painted quiet (a 40 TL supermarket cream) or rich (a 400 TL boutique one) without changing its
 * skeleton, and the brief's positioning can ask for either.
 */
export type OrnamentLevel = 'quiet' | 'measured' | 'rich'

/**
 * The composition's skeleton — where the weight sits.
 *
 * The first four are the skeletons the ten archetypes were distilled with, one each. The audit
 * measured sixteen of twenty archetypes on `stacked-center` and found the reference set full of
 * arrangements the engine could not make; the two below are the most frequent of them, painted
 * as *compositions* that borrow an archetype's field, palette, type pairing and frame rather than
 * as new archetypes — see `compositions.ts`.
 *
 *   - `band-split`: a horizontal band at the foot carries the product and the net quantity, the
 *     field above carries the brand (Pure Bloom, Pure Life olive oil, Blossome).
 *   - `rotated-brand`: the brand set at ninety degrees in a strip along the left edge, the field
 *     beside it carries the product (Xfacio, FORÊT, The Majestic, Amora).
 */
export type LockupStyle =
  | 'stacked-center'
  | 'top-right-pill'
  | 'left-column'
  | 'monogram-right'
  | 'band-split'
  | 'rotated-brand'
  /** Brand and product as a block in the top-left corner, meta at the foot, the field free (OILY, O'live). */
  | 'top-left-block'
  /** Carton only: a quiet front, one side carrying the field or the subject at full strength (Matka). */
  | 'art-panel'
  /** Carton only: a solid deep front, both sides carrying the subject, mirrored (Lunara). */
  | 'flanked'

/**
 * The carton roles whose lead element — the field, the subject — lives on a side panel. A label
 * cannot list them, and an evaluator reading the front alone would score the design for lacking
 * the very thing it put next door.
 */
export const SIDE_LED_LOCKUPS: readonly LockupStyle[] = ['art-panel', 'flanked']

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
  /**
   * The deep surface: sides, top and flaps of a box whose front is a card floating on art.
   *
   * It is a *relationship* to the ground — always the same hue family, always reading as the
   * deeper face of the same object — and how far it travels from the ground is the mood's call.
   * Before this existed the layouts borrowed `accent2`, which was never designed for the job.
   */
  deep: string
  /** Light panel / card colour. */
  card: string
  /** Text on card. */
  cardInk: string
  /** Muted text on ground. */
  muted: string
}

export type DirectionSource = 'heuristic' | 'llm' | 'knowledge' | 'user' | 'family'

/**
 * One decision, structured: which axis, what was chosen, why in the customer's terms, and what
 * the nearest alternative was. `rationale` stays the spoken list; this is the record a log, a
 * learning signal or a debugger can read without parsing prose.
 */
export type DirectionReason = {
  axis: 'archetype' | 'typePairing' | 'lockup' | 'ornament' | 'temperament'
  chosen: string
  because: string
  alternative?: string
}

/** Studio tagline origin. Bank is fallback only. */
export type CopySource = 'user' | 'brief' | 'bank'

export type DesignDirection = {
  surface: StudioSurface
  archetype: StudioArchetype
  /**
   * Who chose this archetype, when the painted one is the one that was pinned.
   *
   * `DirectionHints.pinSource` already carries this at decision time and `rankDirectionPool` leans
   * on it heavily, but it never reached the decision itself — so anything downstream could see
   * *what* was chosen and never *why*. The repair route needs exactly that distinction: the
   * engine's rule is that a word in the brief outranks the sector's opinion of it, and a route that
   * cannot tell "the customer said marble" from "the sector's default" will quietly overrule the
   * customer. Measured in Phase 2F: switching repair routing on without this turned
   * "elektronik kutu ama mermer ve altın" away from marble and stopped a sanitised LLM direction
   * being consumed.
   *
   * `undefined` means the walk landed here on its own — nobody pinned it.
   */
  archetypePin?: 'visual' | 'sector' | 'user' | 'family' | 'llm' | 'knowledge'
  /**
   * Arrangement inside the archetype (0–2). The archetype fixes the skeleton; this decides where
   * the weight sits — top, middle or foot. Derived from the brief's own seed, so two brands that
   * land on the same archetype do not get the same face. `variationIndex` is part of that seed,
   * so "yeni tasarım" also walks the arrangements.
   */
  variant: number
  background: BackgroundFamily
  typePairing: TypePairing
  temperament: Temperament
  frame: FrameStyle
  lockup: LockupStyle
  /** Decoration level — scales background intensity and frame weight. */
  ornament: OrnamentLevel
  /**
   * How a drawn subject is rendered, where the brief's personality decided it (Phase 5); absent,
   * the illustrator's own seed rule applies, which is what the frozen faces were painted with.
   */
  subjectStyle?: import('./species').HeroStyle
  palette: StudioPalette
  /** Sector benefit icons + short labels (3–4). */
  benefits: BenefitItem[]
  /** Claim chips: "ARGAN + COLLAGEN + KERATIN", "PROFESSIONAL · STEP 1". */
  chips: string[]
  /** Stacked manifesto words for spines / vertical columns. */
  manifesto: string[]
  /** Category line under the product: "EAU DE PARFUM", "SAÇ BAKIM KREMİ". */
  categoryLine: string
  /**
   * Copy tiers a perfume plate carries below the product, empty when the brief did not give them.
   *
   * Distilled from the STİCKERR REF set (Diako, Heeva, Raavi): the references all speak in more
   * registers than brand / product / net quantity — an edition ("No. 07", "LIMITED EDITION"), an
   * attribution ("by Diako Atelier"), an origin ("İSTANBUL · 1998"). The painters that have a tier
   * for them draw them; the others ignore them, which is the difference between a plate and a card.
   */
  editionLine: string
  attributionLine: string
  originLine: string
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
  /** The same decisions, structured — see `DirectionReason`. */
  reasons: DirectionReason[]
  source: DirectionSource
  seed: number
  /**
   * The seed a whole product *line* shares.
   *
   * `seed` carries the product name, which is right for jitter — two SKUs should not be byte
   * identical. It is wrong for anything a range must hold in common: measured on a four-SKU Verda
   * line, the drawn subject correctly changed per SKU (aloe, rose, chamomile, lavender) but so did
   * the arrangement, giving a rosette, a crossed pair, a wreath and a sprig. Four compositions
   * reads as four unrelated products on a shelf, not as a range.
   *
   * So this one drops the product and keeps brand, surface and variation: siblings share a
   * composition, pressing "variation" still changes it, and a different brand still gets its own.
   */
  lineSeed: number
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
  ornament?: OrnamentLevel
  productPrefix?: string
  taglineLine?: string
  categoryLine?: string
  manifesto?: string[]
  chips?: string[]
  rationale?: string[]
  /**
   * Which source set each pinned axis, recorded by `mergeHints` from the hint object that set it
   * (`axisSource` on the object itself first, its `source` second). A pin from the design brain
   * (`heuristic`) is a prior — a brief that said who the brand is outranks it on the type axis;
   * a pin from a picked card, a learned rule or the customer's own words is a pin.
   */
  axisSource?: Partial<Record<'archetype' | 'background' | 'temperament' | 'typePairing' | 'frame' | 'lockup' | 'ornament', DirectionSource>>
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
  /** What the painter was asked for and did not place. See `Ledger.skipped`. */
  skipped: { id: string; reason: 'no-space' | 'not-this-surface' | 'no-content' }[]
  collisions: string[]
  outOfBounds: string[]
  minTextMm: number
}

/**
 * `quieter` and `vary` are the ledger's two buttons. `vision` is the F-7 critic: an issue the
 * vision model saw on the rendered face, with an `utterance` that is a design command
 * ("süsü azalt", "çerçeveyi kaldır") — so "önerini uygula" runs it through the same parser as
 * anything the customer could have typed.
 */
export type StudioCriticKind = 'quieter' | 'vary' | 'vision'

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
  /**
   * The candidate's front, painted (a complete panel SVG). Every row carries one, the selected
   * row included — the customer is shown four finished designs and picks one, so a row without a
   * face is a hole in the set. Absent only if the engine could not paint that direction at all.
   */
  face?: string
  /** The direction reduced to the axes a customer can see differ — see `fingerprint.ts`. */
  fingerprint?: Fingerprint
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
  /** Set when the one-shot studio repair retuned identity scales and cleared ledger hits. */
  repaired?: string
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
