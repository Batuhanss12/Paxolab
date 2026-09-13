/**
 * Volume formatter — single source of truth for volume display strings.
 * Critique P1-D: all volume painters must consume `normalizeVolume(raw).display`.
 *
 * Canonical display:
 * - liquid: `℮ 50 ml` (thin space after ℮, one space before unit, unit lower-case Latin for ml/g)
 * - solid:  `℮ 300 g`
 * - TR units: `adet`, `kapsül` as-is
 * - estimated flag false → omit ℮ (non-perfume / non-food may stay without ℮ per sector kit)
 *
 * Forbidden:
 * - per-glyph forced gaps that look like `5 0 M L` (lining figures stay full size, no extra spaces between digits)
 * - `letter-spacing` on digit runs > `0.4` for volume role
 */

export type VolumeUnit = 'ml' | 'g' | 'kg' | 'adet' | 'kapsül' | 'L' | 'mg' | ''

export type NormalizedVolume = {
  /** Numeric amount, e.g. "50", "300", "1" */
  amount: string
  /** Canonical unit, e.g. "ml", "g", "adet" */
  unit: VolumeUnit
  /** Full display string, e.g. "℮ 50 ml", "300 g", "1 adet" */
  display: string
  /** Display string without ℮ prefix, e.g. "50 ml", "300 g" */
  body: string
}

const UNIT_MAP: Record<string, VolumeUnit> = {
  ml: 'ml',
  ML: 'ml',
  Ml: 'ml',
  mililitre: 'ml',
  'mıl': 'ml',
  g: 'g',
  G: 'g',
  gram: 'g',
  gr: 'g',
  kg: 'kg',
  KG: 'kg',
  kilogram: 'kg',
  mg: 'mg',
  MG: 'mg',
  L: 'L',
  l: 'L',
  lt: 'L',
  litre: 'L',
  adet: 'adet',
  Adet: 'adet',
  ADET: 'adet',
  ad: 'adet',
  '': '',
  kapsül: 'kapsül',
  kapsul: 'kapsül',
  KAPSÜL: 'kapsül',
}

/** Parse a raw volume string like "50 ml", "300g", "1 adet", "80 g" into a normalized volume. */
export function normalizeVolume(raw: string): NormalizedVolume {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return { amount: '', unit: '', display: '', body: '' }

  // Match: number (with optional decimal/comma) + optional space + unit
  const m = trimmed.match(/^(\d+(?:[.,]\d+)?)\s*([a-zA-ZçğıöşüÇĞİÖŞÜ]*)/)
  if (!m) {
    // Fallback: whole string as body, no ℮
    return { amount: trimmed, unit: '', display: trimmed, body: trimmed }
  }
  const amount = m[1]
  const rawUnit = m[2] || ''
  const unit = UNIT_MAP[rawUnit] ?? ''
  const body = unit ? `${amount} ${unit}` : amount
  return { amount, unit, display: body, body }
}

/** Build the full display string with optional ℮ prefix. */
export function volumeDisplay(raw: string, estimated: boolean): string {
  const v = normalizeVolume(raw)
  if (!v.body) return ''
  return estimated ? `℮ ${v.body}` : v.body
}
