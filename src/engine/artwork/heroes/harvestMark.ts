/**
 * Harvest hero — Olive/laurel wreath with central stem.
 * Layered: 3 leaves (left, right, center) → central stem.
 * Used by: food (olive oil, honey, jam, tea, chocolate).
 */
import { leafPath, mm } from './vectorPrimitives'

export function paintHarvest(cx: number, cy: number, r: number, accent: string): string {
  return `
    ${leafPath(cx - r * 0.62, cy + r * 0.22, r * 0.62, accent, 0.14, 1, 0.22, -48)}
    ${leafPath(cx - r * 0.48, cy - r * 0.12, r * 0.7, accent, 0.14, 1, 0.22, -28)}
    ${leafPath(cx + r * 0.62, cy + r * 0.24, r * 0.6, accent, 0.14, 1, 0.22, 50)}
    ${leafPath(cx + r * 0.48, cy - r * 0.1, r * 0.68, accent, 0.14, 1, 0.22, 30)}
    ${leafPath(cx, cy - r * 0.22, r * 0.58, accent, 0.14, 1, 0.22, 6)}
    <line x1="${mm(cx)}" y1="${mm(cy - r * 0.05)}" x2="${mm(cx)}" y2="${mm(cy + r * 0.98)}" stroke="${accent}" stroke-width="0.26" />
    <ellipse cx="${mm(cx - r * 0.22)}" cy="${mm(cy + r * 0.42)}" rx="${mm(r * 0.08)}" ry="${mm(r * 0.11)}" fill="${accent}" />
    <ellipse cx="${mm(cx + r * 0.22)}" cy="${mm(cy + r * 0.4)}" rx="${mm(r * 0.08)}" ry="${mm(r * 0.11)}" fill="${accent}" />
  `
}
