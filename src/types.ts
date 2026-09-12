export type AttachmentKind = 'logo' | 'referans'

export type Attachment = {
  id: string
  name: string
  kind: AttachmentKind
  dataUrl: string
}

export type BriefFields = {
  markaAdi: string
  urunAdi: string
  kategori: string
  ambalajTipi: string
  olculer: string
  metinler: string
  renkler: string
  stil: string
  logo: string
  gorseller: string
  icerik: string
  uyarilar: string
  barkodQr: string
  diger: string
}

export type FieldKey = keyof BriefFields

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
}

export type Palette = {
  bg: string
  fg: string
  accent: string
  muted: string
  paper: string
}

export type DesignKind = 'packaging' | 'label' | 'landing'

export type DesignSpec = {
  id: string
  kind: DesignKind
  brief: BriefFields
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
    cta: string
  }
  overrides: DesignOverrides
  generatedAt: number
  revision: number
}

export type TabId = 'konusma' | 'vektor' | 'onizleme3d' | 'uretim'

export type AppPhase = 'landing' | 'workspace'

export type EngineResult = {
  brief: BriefFields
  awaiting: FieldKey | null
  replies: string[]
  shouldGenerate: boolean
  overridePatch: Partial<DesignOverrides>
  copyPatch: Partial<DesignSpec['copy']>
  note: string
}
