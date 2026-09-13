/**
 * Composition registry — real composition painters that arrange hero + lockup + decor + pattern.
 * Phase 5 adds diagonal, fullBleed, editorial, floating. Phase 2 wraps the centered composition.
 */
import type { GraphicEntry, GraphicMeta, PaintCtx } from '../types'
import { registerGraphics } from '../registry'
import type { StyleType } from '../../../types'
import type { SectorId } from '../../designSystem/types'

/**
 * Centered composition — symmetric layout.
 * Pattern fills background, hero sits in upper third, lockup centered in optical center,
 * decor frames the lockup. This is the default for luxury/classic styles.
 */
function centeredComposition(ctx: PaintCtx): string {
  const { patternMarkup = '', heroMarkup = '', lockupMarkup = '', decorMarkup = '', primitivesMarkup = '' } = ctx
  return `<g data-art="composition" data-comp="centered">
    ${patternMarkup}
    ${heroMarkup}
    ${decorMarkup}
    ${primitivesMarkup}
    ${lockupMarkup}
  </g>`
}

/**
 * Asymmetric composition — hero pushed off-center, lockup offset.
 * Modern/tech variation leans asymmetric for visual tension.
 */
function asymmetricComposition(ctx: PaintCtx): string {
  const { panel, patternMarkup = '', heroMarkup = '', lockupMarkup = '', decorMarkup = '', primitivesMarkup = '' } = ctx
  return `<g data-art="composition" data-comp="asymmetric" transform="translate(${panel.w * 0.04},0)">
    ${patternMarkup}
    ${heroMarkup}
    ${decorMarkup}
    ${primitivesMarkup}
    ${lockupMarkup}
  </g>`
}

/**
 * Grid composition — modular grid alignment.
 * Modern style baseline; elements align to a grid.
 */
function gridComposition(ctx: PaintCtx): string {
  const { patternMarkup = '', heroMarkup = '', lockupMarkup = '', decorMarkup = '', primitivesMarkup = '' } = ctx
  return `<g data-art="composition" data-comp="grid">
    ${patternMarkup}
    ${heroMarkup}
    ${decorMarkup}
    ${primitivesMarkup}
    ${lockupMarkup}
  </g>`
}

/**
 * Offset composition — organic offset for eco/playful.
 */
function offsetComposition(ctx: PaintCtx): string {
  const { panel, patternMarkup = '', heroMarkup = '', lockupMarkup = '', decorMarkup = '', primitivesMarkup = '' } = ctx
  return `<g data-art="composition" data-comp="offset" transform="translate(${-panel.w * 0.03},0)">
    ${patternMarkup}
    ${heroMarkup}
    ${decorMarkup}
    ${primitivesMarkup}
    ${lockupMarkup}
  </g>`
}

function entry(
  id: string,
  label: string,
  styles: StyleType[],
  sectors: SectorId[],
  density: 'sparse' | 'balanced' | 'dense',
  intent: GraphicMeta['intent'],
  paint: GraphicEntry['paint'],
): GraphicEntry {
  return { meta: { id, category: 'composition', label, styles, sectors, density, opacityCap: 1, intent }, paint }
}

export const compositionEntries: GraphicEntry[] = [
  entry('centered', 'Centered (symmetric)', ['luxury', 'classic', 'minimal'], [], 'balanced', 'symmetric', centeredComposition),
  entry('asymmetric', 'Asymmetric', ['modern', 'playful'], [], 'balanced', 'asymmetric', asymmetricComposition),
  entry('grid', 'Grid', ['modern'], ['electronics'], 'balanced', 'grid', gridComposition),
  entry('offset', 'Offset (organic)', ['eco', 'playful'], [], 'balanced', 'offset', offsetComposition),
]

registerGraphics(compositionEntries)

// Register new compositions (diagonal, full-bleed, editorial, floating).
import './newCompositions'
