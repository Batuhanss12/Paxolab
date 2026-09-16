/**
 * Label 3D vessel — closed vocabulary. Carton dieline/3D never reads this.
 */
import type { BottleShape, DesignBrief } from '../../types'

/**
 * Screen-space 50–100 ml cylindrical spray. Diameter is not wrap-label / 2π
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

export function recommendBottleShape(brief: Pick<DesignBrief, 'sector' | 'subProduct' | 'productName' | 'templateId' | 'bottleShape'>): BottleShape {
  if (brief.bottleShape === 'cylinder' || brief.bottleShape === 'square') return brief.bottleShape
  const blob = `${brief.sector} ${brief.subProduct} ${brief.productName} ${brief.templateId}`.toLocaleLowerCase('tr')
  if (/kare|square|kavanoz|jar|flat-label/.test(blob) && !/parfüm|perfume|eau/.test(blob)) return 'square'
  if (/parfüm|perfume|eau|şişe|wrap|silindir|cylinder/.test(blob)) return 'cylinder'
  if (/wrap-label/.test(blob)) return 'cylinder'
  return 'square'
}

export function isBottleShape(value: unknown): value is BottleShape {
  return value === 'cylinder' || value === 'square'
}
