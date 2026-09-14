/**
 * Carton L×W×H from fill volume.
 * Families are the catalog defaults we already ship — not a mill ISO table.
 */
import type { DesignBrief, DimensionsMm, FormaTemplate } from '../../types'

export type VolumeFamily = {
  ml: number
  dims: DimensionsMm
}

const PERFUME: VolumeFamily = { ml: 50, dims: { L: 70, W: 35, H: 140 } }
const SERUM: VolumeFamily = { ml: 30, dims: { L: 45, W: 45, H: 120 } }
const CREAM: VolumeFamily = { ml: 50, dims: { L: 80, W: 40, H: 80 } }
const OIL: VolumeFamily = { ml: 500, dims: { L: 80, W: 50, H: 180 } }

export function parseVolumeMl(volume: string): number | null {
  const m = volume.trim().match(/^(\d+(?:[.,]\d+)?)\s*(ml|cl|l)\b/i)
  if (!m) return null
  const n = Number(m[1]!.replace(',', '.'))
  if (!Number.isFinite(n) || n <= 0) return null
  const unit = m[2]!.toLowerCase()
  if (unit === 'cl') return n * 10
  if (unit === 'l') return n * 1000
  return n
}

function familyFor(brief: Pick<DesignBrief, 'sector' | 'subProduct'>, template?: FormaTemplate): VolumeFamily | null {
  const blob = `${brief.sector} ${brief.subProduct} ${template?.id ?? ''} ${template?.templateGroup ?? ''}`.toLocaleLowerCase('tr')
  if (/yağ|zeytin|sos|oil|pour/.test(blob)) return OIL
  if (/serum|ampul/.test(blob)) return SERUM
  if (/krem|cream/.test(blob)) return CREAM
  if (/parfüm|parfum|perfume|edp|kolonya|kozmetik/.test(blob)) return PERFUME
  return null
}

function roundMm(n: number): number {
  return Math.max(1, Math.round(n))
}

/** Scale a catalog carton with the cube root of (asked ml / family ml). Clamped. */
export function estimateCartonMm(
  volume: string,
  brief: Pick<DesignBrief, 'sector' | 'subProduct' | 'packagingMode'>,
  template?: FormaTemplate,
): DimensionsMm | null {
  if (brief.packagingMode === 'label') return null
  const ml = parseVolumeMl(volume)
  if (ml == null) return null
  const family = familyFor(brief, template)
  if (!family) return null
  const base = template?.defaultsMm.W ? template.defaultsMm : family.dims
  const baseMl = template?.id?.includes('serum') ? SERUM.ml : family.ml
  const scale = Math.min(1.55, Math.max(0.72, Math.cbrt(ml / baseMl)))
  return {
    L: roundMm(base.L * scale),
    W: roundMm((base.W || family.dims.W) * scale),
    H: roundMm(base.H * scale),
  }
}

export function applyVolumeCarton(brief: DesignBrief): DesignBrief {
  if (brief.packagingMode === 'label') return brief
  if (!brief.volume.trim() || brief.volumeDefaulted) return brief
  const userLocked = brief.dimensionsMm.L > 0 && brief.dimensionsMm.H > 0 && !brief.dimsDefaulted && !brief.dimsFromVolume
  if (userLocked) return brief
  const dims = estimateCartonMm(brief.volume, brief)
  if (!dims) return brief
  return { ...brief, dimensionsMm: dims, dimsDefaulted: true, dimsFromVolume: true }
}
