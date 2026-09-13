/**
 * Harvest hero — Olive/laurel wreath with central stem.
 * Layered: 3 leaves (left, right, center) → central stem.
 * Used by: food (olive oil, honey, jam, tea, chocolate).
 */
import { leafPath, mm } from './vectorPrimitives'

export function paintHarvest(cx: number, cy: number, r: number, accent: string): string {
  return `
    ${leafPath(cx - r * 0.55, cy + r * 0.05, r * 0.7, accent, 0.14, 1, 0.2, -38)}
    ${leafPath(cx + r * 0.55, cy + r * 0.08, r * 0.68, accent, 0.14, 1, 0.2, 42)}
    ${leafPath(cx, cy - r * 0.15, r * 0.55, accent, 0.14, 1, 0.2, 8)}
    <line x1="${mm(cx)}" y1="${mm(cy + r * 0.15)}" x2="${mm(cx)}" y2="${mm(cy + r * 0.95)}" stroke="${accent}" stroke-width="0.22" />
  `
}
