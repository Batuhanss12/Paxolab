import type { DielineModel } from '../../types'

/** Sheet bleed from the structural solver (A60 drawing uses 3 mm). Not an invented mill table. */
export const PRESS_BLEED_MM = 3
export const PRESS_SAFE_MM = 3
export const PRESS_MEDIA_PAD_MM = 8

export function pressBleedMm(model?: Pick<DielineModel, 'structural'>): number {
  return model?.structural?.solved.bleed.amount ?? PRESS_BLEED_MM
}

export function pressSafeMm(model?: Pick<DielineModel, 'structural'>): number {
  return model?.structural?.solved.safeInset ?? PRESS_SAFE_MM
}

/** Combined SVG proof comment. Dieline PDF is PDF/X-4 sRGB; trap/FOGRA are not claimed. */
export function pressProofSvgComment(model?: Pick<DielineModel, 'structural'>): string {
  const safe = pressSafeMm(model)
  const bleed = pressBleedMm(model)
  return `FORMA proof: ${safe} mm safe inset · ${bleed} mm bleed guide · dieline PDF/X-4 sRGB · trap yok · FOGRA değil`
}
