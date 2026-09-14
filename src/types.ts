export type AttachmentKind = 'logo' | 'referans'

export type Attachment = {
  id: string
  name: string
  kind: AttachmentKind
  dataUrl: string
}

export type PackagingMode = 'box' | 'label'
export type StyleType = 'luxury' | 'modern' | 'minimal' | 'eco' | 'playful' | 'classic'
/** Customer-facing copy language. Not ArtworkModel.language (that is a palette id). */
export type CopyLocale = 'tr' | 'en'
export const STRUCTURE_IDS = [
  'tuck-end-box',
  'simple-tray',
  'flat-label',
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
  /** Primary copy locale. Missing → resolve as `tr`. Do not store on ArtworkModel.language. */
  copyLocale?: CopyLocale
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
