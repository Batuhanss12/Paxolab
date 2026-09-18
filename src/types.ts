export type AttachmentKind = 'logo' | 'referans'

export type Attachment = {
  id: string
  name: string
  kind: AttachmentKind
  dataUrl: string
}

export type PackagingMode = 'box' | 'label'
/** Label 3D vessel only — never used for carton dieline/3D. */
export type BottleShape = 'cylinder' | 'square'
export type StyleType = 'luxury' | 'modern' | 'minimal' | 'eco' | 'playful' | 'classic'
/** How the product is priced — a brief-depth field; closed so it can drive a decision. */
export type PriceTier = 'mass' | 'mid' | 'premium' | 'boutique'
/** Customer-facing copy language. Not ArtworkModel.language (that is a palette id). */
export type CopyLocale = 'tr' | 'en'
export const STRUCTURE_IDS = [
  'tuck-end-box',
  'simple-tray',
  'flat-label',
  'round-label',
  'oval-label',
  'hang-tag',
  'insert-card',
  'wrap-label',
  'mailer-box',
  'sleeve',
  'pillow-box',
  'snap-lock-box',
  'tray-box',
  'rigid-gift-box',
  'polygon-box',
  'product-carrier-tray',
  'reverse-tuck-end-box',
  'tuck-top-auto-bottom',
  'rsc-carton',
] as const

export type StructureId = (typeof STRUCTURE_IDS)[number]
export type TemplateLibrary = 'core' | 'advanced'
export type TemplateStatus = 'active' | 'soon'
export type DesignKind = 'packaging' | 'label'

export type DimensionsMm = {
  L: number
  W: number
  H: number
}

/**
 * Where a brief value came from. Inferred values are never presented as user fact.
 * Precedence when merging: USER_EXPLICIT > HEURISTIC_INFERRED > LLM_INFERRED > KNOWLEDGE_DERIVED > SYSTEM_DEFAULT.
 */
export type FieldSource = 'USER_EXPLICIT' | 'HEURISTIC_INFERRED' | 'LLM_INFERRED' | 'KNOWLEDGE_DERIVED' | 'SYSTEM_DEFAULT'

export type FieldProvenance = {
  source: FieldSource
  /** 0–1. USER_EXPLICIT is 1 unless the phrasing was ambiguous. */
  confidence: number
}

export type DesignBrief = {
  brandName: string
  productName: string
  sector: string
  subProduct: string
  packagingMode: PackagingMode | ''
  templateId: string
  dimensionsMm: DimensionsMm
  styleType: StyleType | ''
  colors: string
  volume: string
  /** PAO window from the user (e.g. 12M). Empty = sector default. */
  paoMonths?: string
  /** User accepted a sample/template value instead of providing one */
  volumeDefaulted?: boolean
  dimsDefaulted?: boolean
  /** User skipped the optional colour / mood / story ask — painter uses product defaults. */
  directionDefaulted?: boolean
  /** L×W×H came from fill-ml carton estimate, not a typed mill size. */
  dimsFromVolume?: boolean
  /** User skipped a line name — lockup keeps brand only */
  productSkipped?: boolean
  barcode: string
  barcodeDefaulted?: boolean
  manufacturerName: string
  manufacturerAddress: string
  manufacturerDefaulted?: boolean
  addressDefaulted?: boolean
  logo: string
  references: string
  copyOverrides: string
  /** Ingredient claim badges for label front, e.g. "BIOTIN + COLLAGEN" or "KERATIN, ARGAN, COLLAGEN" */
  ingredientClaims?: string
  /** Brand story paragraph for perfume (and optional other backs). */
  story?: string
  /** Scent pyramid: "bergamot / rose / amber" or `none` to skip the notes table. */
  scentNotes?: string
  /**
   * Perfume copy tiers, from the STİCKERR REF plates. All optional; catalog briefs omit them.
   * `concentration` replaces the category line ("EAU DE TOILETTE", "EXTRAIT DE PARFUM");
   * `edition` ("No. 07", "LIMITED EDITION"), `attribution` ("by Diako Atelier") and `origin`
   * ("İSTANBUL · 1998") are drawn by the archetypes that carry a tier for them.
   */
  concentration?: string
  edition?: string
  attribution?: string
  origin?: string
  /**
   * Brief depth — what a designer asks before drawing and the five-field chat never did.
   * All optional; none blocks a generation. `priceTier` and `feeling` reach the studio direction
   * through `studioPlanBridge` (ornament); `avoidLike` reaches the LLM art director as text.
   */
  /** Who buys it: "kadın 30+", "genç erkek", "profesyonel kuaför", "bebek / ebeveyn". */
  audience?: string
  /** Where it sells: "raf", "e-ticaret", "butik", "eczane", "salon", "hediye". */
  channel?: string
  /** How it is priced — closed vocabulary. */
  priceTier?: PriceTier
  /** What it must not resemble, as the customer said it: "X gibi olmasın", "ucuz durmasın". */
  avoidLike?: string
  /** The feeling the pack should give: "sakin", "sıcak", "güçlü", "taze". */
  feeling?: string
  /** Primary copy locale. Missing → resolve as `tr`. Do not store on ArtworkModel.language. */
  copyLocale?: CopyLocale
  /**
   * Conversation-mapped director cue (luxury-tighten, open-air, …).
   * Not a visualLanguage key. createPlan reads it via overrides / brief fallback.
   */
  directorCue?: string
  /**
   * Motif avoid tokens from conversation (heavy-frame, generic-corners, …).
   * Catalog briefs omit this; createPlan unions onto visualConcept.avoid.
   */
  avoidMotifs?: string[]
  /** Requested surfaces from conversation. Catalog omits this. Engine paints one at a time. */
  deliverables?: PackagingMode[]
  /** Label 3D bottle. Catalog omits. Does not change carton 3D. */
  bottleShape?: BottleShape
  /**
   * Studio visual family (marble, botanical, line-scene…). Catalog omits this.
   * Companion generate (“etiketi de üret”) reads it so box and label stay in the same DNA.
   */
  studioFamily?: import('./engine/studio/types').StudioFamily
  /**
   * True only when the customer picked the direction themselves.
   *
   * The engine stamps `studioFamily` onto every brief it returns, and that stamp is a hard pin. So
   * without this flag the first generation silently locked the composition for the rest of the
   * session: changing the mood repainted the colours and could never move the skeleton again.
   * A stamp is a record of what happened; a lock is a decision, and only the customer makes one.
   */
  studioFamilyLocked?: boolean
  /**
   * Families the user vetoed this conversation. Catalog omits.
   * Scoring excludes their archetypes; generate must not re-pin them.
   */
  avoidStudioFamilies?: import('./engine/studio/types').StudioFamily[]
  /**
   * Chat vary step inside the current family. Catalog omits.
   * StyleBar still uses override variationIndex; this persists the chat step.
   */
  directionVariation?: number
  /**
   * Studio StyleBar temperament pin. Catalog omits.
   * Survives vary inside the locked family; kit STYLE_OPTIONS do not read this.
   */
  studioTemperament?: import('./engine/studio/types').Temperament
  /**
   * True only when the customer chose the tone from the tone control.
   *
   * The same distinction `studioFamilyLocked` draws, for the same reason. Picking a direction now
   * carries the tone that was on screen forward, because the owner's report was that choosing a
   * different design from the strip threw away the dark tone they had set and came back light. But
   * a tone that merely *travelled* is not a decision: without this flag, carrying it would freeze
   * the tone for the rest of the session and the mood knob could never move the colour again.
   * A carried tone is released by the next mood change; a chosen one holds until the customer
   * changes it themselves.
   */
  studioTemperamentLocked?: boolean
  /** Per-field source + confidence. Catalog omits this; mergeBrief keeps the strongest source. */
  provenance?: Partial<Record<string, FieldProvenance>>
}

export type BriefFieldKey = keyof DesignBrief

export type ChatRole = 'user' | 'assistant'

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  attachments?: Attachment[]
}

export type PaletteShift = 'default' | 'gold' | 'minimal' | 'dark' | 'warm'

export type DesignOverrides = {
  logoScale: number
  titleScale: number
  premium: boolean
  printReady: boolean
  paletteShift: PaletteShift
  barcodeVisible: boolean
  customTagline: string
  /** Director iteration cue — refine plan within StyleBar, do not invent a 7th style. */
  directorCue?: string
  /** v3.6 variation set. 0 = kit default. Each click bumps and picks another allowed hero/pattern. */
  variationIndex?: number
  /** Pin a library hero (monstera / palm / organic-wave / zebra). Must stay vocab-legal. */
  heroFamily?: import('./engine/brain/DesignPlan').HeroFamily
  /** Phase 12 opt-in overlay from ART-PATTERN-DESİGN. Gallery jobs omit this. */
  artPatternId?: string
  /**
   * Opt-in library composition: faces are built from extracted pattern/deco parts.
   * Default gallery / ossified lockup chrome stays off this path.
   */
  artPatternCompose?: boolean
  /** Phase 14 motif recipe. Opt-in; gallery jobs omit this. */
  motifRecipeId?: 'luxury-frame' | 'stamp-field' | 'band-story' | 'corner-deco'
  /**
   * Phase 15 production path: brief → blank face → motif match → compose.
   * Catalog / gallery fixtures omit this so style kits stay QA-reproducible.
   */
  blankCanvas?: boolean
  /**
   * Studio path: reference-level archetype layouts (TASARIM REF DNA) with full anatomy.
   * Catalog / gallery fixtures omit this so the frozen kit faces stay byte-stable.
   */
  studio?: boolean
  /** Closed-vocabulary direction hints (LLM art director, knowledge bias, user words). */
  direction?: import('./engine/studio/types').DirectionHints
}

export type Palette = {
  bg: string
  fg: string
  accent: string
  muted: string
  paper: string
}

export type Point = { x: number; y: number }

export type PanelRole = 'body' | 'flap' | 'glue' | 'tuck'

export type PanelKind =
  | 'hero-front'
  | 'legal-back'
  | 'side-spine'
  | 'glue'
  | 'tuck-flap'
  | 'polygon-wall'
  | 'product-window'
  | 'device-overlay'
  | 'plain'

export type Panel = {
  id: string
  role: PanelRole
  kind?: PanelKind
  /** Forxa net face — 3D maps left/right/top/lid without id aliases. */
  face?: string
  x: number
  y: number
  w: number
  h: number
  polygon: Point[]
}

export type DielineModel = {
  structureId: StructureId
  unit: 'mm'
  width: number
  height: number
  dimensions: DimensionsMm
  panels: Panel[]
  cut: Point[][]
  crease: [Point, Point][]
  /** Perforation / kiss-cut. Not CUT, not CREASE. */
  perf?: Point[][]
  glueIds: string[]
  consistent: boolean
  issues: string[]
  structural?: import('./engine/dieline/structure/types').StructuralSolution
}

export type ArtworkLayer = {
  panelId: string
  markup: string
}

export type ArtworkModel = {
  layers: ArtworkLayer[]
  frontPanelId: string
  language: string
  systemKey?: string
}

export type PreflightStatus = 'pass' | 'warn' | 'fail' | 'na'

export type PreflightItem = {
  id: string
  label: string
  detail: string
  status: PreflightStatus
}

export type PreflightReport = {
  items: PreflightItem[]
  blocking: boolean
  exportOk: boolean
  collisions: boolean
}

export type DesignSpec = {
  id: string
  kind: DesignKind
  brief: DesignBrief
  palette: Palette
  layout: {
    widthMm: number
    heightMm: number
    depthMm: number
  }
  copy: {
    brand: string
    product: string
    tagline: string
    volume: string
    ingredients: string
    warnings: string
    barcode: string
    manufacturer: string
    address: string
    cta: string
    /** Directions / kullanım — back of labels. Empty → copyBank usageLine. */
    usage?: string
    /** Perfume copy tiers — see `DesignBrief.concentration` and friends. Empty → not drawn. */
    concentration?: string
    edition?: string
    attribution?: string
    origin?: string
  }
  overrides: DesignOverrides
  generatedAt: number
  revision: number
  templateId: string
  structureId: StructureId
  dieline: DielineModel
  document: import('./engine/document/types').DesignDocument
  artwork: ArtworkModel
  preflight: PreflightReport
  designPlan?: import('./engine/brain/DesignPlan').DesignPlan
  critique?: import('./engine/brain/CritiqueEngine').CritiqueReport
  /** Structured critic findings (category/target/severity/evidence). Read-only; never edits SVG. */
  designCritique?: import('./engine/brain/DesignCritic').DesignCritique[]
  /** Design-quality scorecard over the shipped markup. Report only — never gates repair or export. */
  craftScore?: import('./engine/brain/DesignScore').VisualCraftScorecard
  /** Active knowledge rule ids that shaped this design's brief (KNOWLEDGE_DERIVED). */
  appliedKnowledge?: string[]
  /** Studio direction + ledger report when overrides.studio painted the faces. */
  studio?: import('./engine/studio/types').StudioReport
  /** Mirror of brief.copyLocale for export manifest. */
  copyLocale?: CopyLocale
}

export type TabId = 'konusma' | 'vektor' | 'karsilastir' | 'dieline' | 'onizleme3d' | 'uretim'

export type AppPhase = 'landing' | 'workspace'

export type AwaitingKey = BriefFieldKey | 'templateId'

export type EngineResult = {
  brief: DesignBrief
  awaiting: AwaitingKey | null
  replies: string[]
  shouldGenerate: boolean
  showTemplates: boolean
  overridePatch: Partial<DesignOverrides>
  copyPatch: Partial<DesignSpec['copy']>
  note: string
  designPlan?: import('./engine/brain/DesignPlan').DesignPlan
  critiqueNotes?: string[]
  feedback?: import('./engine/brain/DesignDecisionLog').StructuredFeedback[]
  /** Asked / answered ledger after this turn. */
  state?: import('./engine/conversationState').ConversationState
  /** C5 ranked structure families. Absent on ask/hint turns. */
  structureOffer?: import('./engine/catalog/structureRecommend').StructureRecommendation
  /** D3 ranked studio directions. User picks “2. yön”; critic does not. */
  directionOffer?: import('./engine/studio/types').StudioDirectionOffer
}

export type DesignRating = {
  designId: string
  stars: number
  tags: string[]
  at: number
}

export type FormaTemplate = {
  id: string
  title: string
  templateGroup: string
  sectors: string[]
  subProducts: string[]
  structureId: StructureId
  packagingMode: PackagingMode
  defaultsMm: DimensionsMm
  status: TemplateStatus
  library?: TemplateLibrary
  auxDevice?: string
  engineParams?: Record<string, number>
}
