/**
 * GraphicLibrary — public API.
 * Import this module to register all graphics and access the grammar.
 * Side effect: importing this module populates the registry.
 */
import type { PaintCtx, GraphicId } from './types'
import { paintGraphic } from './registry'

// Side-effect imports — these modules register their graphics on load.
import './patterns'
import './motifs'
import './primitives'
import './compositions'
import './heroes'

export type { GraphicCategory, GraphicId, GraphicMeta, PainterFn, PaintCtx, GraphicEntry, GrammarInput, GrammarPicks, CompositionIntent, SafeRect } from './types'
export { registerGraphic, registerGraphics, getGraphic, listGraphics, listGraphicIds, hasGraphic, paintGraphic, clearCategory } from './registry'
export { resolveGrammar } from './grammar'

/** Resolve graphics for a brief+style+sector, then paint the full panel composition. */
export function paintPanelComposition(
  compositionId: GraphicId,
  ctx: PaintCtx,
): string {
  return paintGraphic('composition', compositionId, ctx)
}
