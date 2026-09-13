/**
 * motifs — facade re-exporting the decomposed motif modules.
 * Pattern motifs and structural motifs now live in their own modules.
 * This file preserves the public API.
 */
export type { SafeRect } from './patternMotifs'
export {
  contourBand,
  contourGoldField,
  diagonalFoil,
  geoLattice,
  leafStampField,
  ornamentalRail,
  spineLuxuryField,
  waveRibbon,
  wrapContinuity,
} from './patternMotifs'
export {
  claimCapsules,
  diamondAt,
  lBrackets,
  legalColumnChrome,
  lockupWindow,
  seriesMark,
} from './structuralMotifs'
