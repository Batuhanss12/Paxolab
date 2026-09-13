/**
 * Motif registry — wraps existing structuralMotifs + patternMotifs into the GraphicLibrary.
 * Motifs are panel-scale decorative elements (frames, brackets, ribbons, marks).
 */
import type { GraphicEntry } from '../types'
import { registerGraphics } from '../registry'
import {
  lBrackets,
  claimCapsules,
  seriesMark,
  lockupWindow,
  diamondAt,
  legalColumnChrome,
} from '../../artwork/structuralMotifs'
import {
  ornamentalRail,
  waveRibbon,
  wrapContinuity,
  diagonalFoil,
  contourBand,
  spineLuxuryField,
} from '../../artwork/patternMotifs'
import type { StyleType } from '../../../types'
import type { SectorId } from '../../designSystem/types'

function entry(
  id: string,
  label: string,
  styles: StyleType[],
  sectors: SectorId[],
  density: 'sparse' | 'balanced' | 'dense',
  opacityCap: number,
  paint: GraphicEntry['paint'],
): GraphicEntry {
  return { meta: { id, category: 'motif', label, styles, sectors, density, opacityCap }, paint }
}

export const motifEntries: GraphicEntry[] = [
  entry('l-bracket', 'L-brackets (open corners)', ['modern'], ['electronics'], 'sparse', 0.55,
    (ctx) => lBrackets(ctx.panel, ctx.palette.accent)),
  entry('claim-capsules', 'Claim capsules', ['playful'], [], 'balanced', 0.22,
    (ctx) => claimCapsules(ctx.panel, ctx.palette)),
  entry('series-mark', 'Series mark (Nº)', ['luxury', 'classic'], [], 'sparse', 0.6,
    (ctx) => seriesMark(ctx.panel.x + ctx.panel.w - 4, ctx.panel.y + 6, '01', ctx.palette.accent)),
  entry('lockup-window', 'Lockup window plate', ['luxury', 'classic', 'modern'], [], 'sparse', 0.38,
    (ctx) => ctx.safe ? lockupWindow(ctx.safe, ctx.palette.accent) : ''),
  entry('diamond', 'Diamond mark', ['luxury', 'classic'], [], 'sparse', 0.85,
    (ctx) => diamondAt(ctx.panel.x + ctx.panel.w / 2, ctx.panel.y + 4, ctx.palette.accent)),
  entry('legal-chrome', 'Legal column chrome', ['luxury', 'classic', 'modern'], [], 'sparse', 0.4,
    (ctx) => legalColumnChrome(ctx.panel.x, ctx.panel.y, ctx.panel.w, ctx.panel.h, '01', ctx.palette.accent, [])),
  entry('ornamental-rail', 'Ornamental double rail', ['classic', 'luxury'], [], 'balanced', 0.55,
    (ctx) => ornamentalRail(ctx.panel, ctx.palette.accent)),
  entry('wave-ribbon', 'Wave ribbon', ['playful', 'eco'], ['cleaning'], 'balanced', 0.5,
    (ctx) => waveRibbon(ctx.panel, ctx.palette.accent)),
  entry('wrap-continuity', 'Wrap continuity waves', ['playful', 'eco', 'modern'], [], 'balanced', 0.4,
    (ctx) => wrapContinuity(ctx.panel, ctx.palette.accent)),
  entry('diagonal-foil', 'Diagonal foil plane', ['luxury', 'modern'], ['perfume'], 'sparse', 0.1,
    (ctx) => diagonalFoil(ctx.panel, ctx.palette.accent)),
  entry('contour-band', 'Contour band', ['luxury', 'classic'], ['perfume'], 'balanced', 0.18,
    (ctx) => contourBand(ctx.panel.x, ctx.panel.y, ctx.panel.w, ctx.panel.h, ctx.palette.accent, ctx.opacity, 5)),
  entry('spine-luxury', 'Spine luxury rail', ['luxury', 'classic'], [], 'sparse', 0.4,
    (ctx) => spineLuxuryField(ctx.panel, ctx.palette.accent)),
]

registerGraphics(motifEntries)

// Register new motifs (flower, star, monogram, sun, abstract).
import './newMotifs'
// Register sector-specific motifs (foil-stripe, perfume-bottle, wheat-sheaf, honeycomb, circuit, chip).
import './sectorMotifs'
