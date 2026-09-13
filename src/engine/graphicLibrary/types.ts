/**
 * GraphicLibrary types — shared types for the graphic library.
 * A graphic is identified by category + id. Each graphic has metadata (for grammar selection)
 * and a painter function (for SVG rendering).
 */
import type { Panel, Palette, StyleType } from '../../types'
import type { SectorId } from '../designSystem/types'

export type GraphicCategory = 'pattern' | 'motif' | 'primitive' | 'composition' | 'hero'

export type GraphicId = string

export type SafeRect = { x: number; y: number; w: number; h: number }

export type CompositionIntent = 'symmetric' | 'grid' | 'asymmetric' | 'offset' | 'diagonal' | 'editorial' | 'floating' | 'full-bleed'

/**
 * Paint context — everything a painter needs to render SVG.
 * Pattern/motif/primitive painters use panel + palette + opacity + safe + seed.
 * Composition painters additionally receive pre-rendered markup blocks to arrange.
 */
export type PaintCtx = {
  panel: Panel
  palette: Palette
  opacity: number
  safe?: SafeRect
  seed: number
  scale?: number
  // Hero positioning — composition zone + scale from DesignPlan
  heroYFrac?: number
  heroXFrac?: number
  heroScale?: number
  // Composition painters arrange these blocks within the panel:
  lockupMarkup?: string
  heroMarkup?: string
  decorMarkup?: string
  patternMarkup?: string
  primitivesMarkup?: string
}

/** Painter function — pure, returns SVG string. */
export type PainterFn = (ctx: PaintCtx) => string

/** Graphic metadata — what the grammar uses to select graphics. */
export type GraphicMeta = {
  id: GraphicId
  category: GraphicCategory
  label: string
  /** Styles this graphic fits. Empty = all styles. */
  styles: StyleType[]
  /** Sectors this graphic fits. Empty = all sectors. */
  sectors: SectorId[]
  density: 'sparse' | 'balanced' | 'dense'
  opacityCap: number
  /** For compositions: the layout intent this painter implements. */
  intent?: CompositionIntent
}

/** Registry entry — metadata + painter. */
export type GraphicEntry = {
  meta: GraphicMeta
  paint: PainterFn
}

/** Selection input for the grammar. */
export type GrammarInput = {
  style: StyleType
  sector: SectorId
  surface: 'box' | 'label'
  variationIndex: number
  density: 'sparse' | 'balanced' | 'dense'
}

/** Grammar output — concrete graphic picks for a panel. */
export type GrammarPicks = {
  pattern: GraphicId | null
  motif: GraphicId | null
  primitive: GraphicId | null
  composition: GraphicId
  hero: GraphicId | null
}
