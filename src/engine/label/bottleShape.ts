/**
 * Label 3D vessel — closed vocabulary. Carton dieline/3D never reads this.
 */
import type { BottleShape, DesignBrief } from '../../types'

/**
 * Screen-space cylindrical spray. Diameter is not wrap-label / 2π
 * (that made a test-tube). Body ~1.3× diameter, short neck, spray cap.
 */
export const PERFUME_CYLINDER_PX = {
  radius: 64,
  bodyH: 148,
  neckH: 20,
  capH: 30,
  collarH: 8,
  actuatorH: 10,
  neckRatio: 0.3,
  capRatio: 0.4,
} as const

/** Typical spray bottle circumference (mm) used to place a wrap as a band, not stretched 360°. */
export const PERFUME_WRAP_CIRC_MM = 145

export function recommendBottleShape(_brief?: Pick<DesignBrief, 'sector' | 'subProduct' | 'productName' | 'templateId' | 'bottleShape'>): BottleShape {
  return 'square'
}

export function isBottleShape(value: unknown): value is BottleShape {
  return value === 'cylinder' || value === 'square'
}
