/**
 * Pattern registry — wraps existing patternFamilies painters into the GraphicLibrary.
 * Each existing pattern family gets a GraphicMeta + PainterFn adapter.
 */
import type { GraphicEntry, GraphicMeta } from '../types'
import { registerGraphics } from '../registry'
import { paintPatternFamily, PATTERN_OPACITY_CAP } from '../../artwork/patternFamilies'
import type { PatternFamily } from '../../brain/DesignPlan'
import type { StyleType } from '../../../types'
import type { SectorId } from '../../designSystem/types'

function wrap(
  id: PatternFamily,
  label: string,
  styles: StyleType[],
  sectors: SectorId[],
  density: 'sparse' | 'balanced' | 'dense',
): GraphicEntry {
  const meta: GraphicMeta = {
    id,
    category: 'pattern',
    label,
    styles,
    sectors,
    density,
    opacityCap: PATTERN_OPACITY_CAP[id],
  }
  return {
    meta,
    paint: (ctx) =>
      paintPatternFamily(id, ctx.panel, ctx.palette.accent, ctx.opacity, ctx.safe),
  }
}

export const patternEntries: GraphicEntry[] = [
  wrap('contour', 'Contour gold field', ['luxury', 'classic'], ['perfume'], 'balanced'),
  wrap('lattice', 'Geometric lattice', ['modern'], ['electronics'], 'balanced'),
  wrap('stripe', 'Horizontal stripes', ['modern'], [], 'balanced'),
  wrap('grain', 'Leaf stamp grain', ['eco'], ['food', 'beverage'], 'sparse'),
  wrap('ornament', 'Ornamental frame', ['classic', 'luxury'], [], 'balanced'),
  wrap('capsule', 'Claim capsules', ['playful'], [], 'balanced'),
  wrap('weave', 'Basket weave', ['eco'], ['food', 'beverage'], 'balanced'),
  wrap('dotgrid', 'Dot grid', ['modern', 'minimal'], ['electronics'], 'sparse'),
  wrap('wave', 'Wave ribbon', ['playful', 'eco'], ['cleaning'], 'balanced'),
  wrap('hexagon', 'Hexagon grid', ['modern'], ['electronics'], 'balanced'),
  wrap('none', 'No pattern', [], [], 'sparse'),
]

registerGraphics(patternEntries)

// Register new patterns (marble, organic, luxury-line, botanical, technical).
import './newPatterns'
// Register seasonal patterns (snowflake, blossom).
import './seasonalPatterns'
