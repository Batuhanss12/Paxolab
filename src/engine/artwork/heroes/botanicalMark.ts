/**
 * Botanical hero — Leaf with central vein and side curves.
 * Layered: leaf body → central vein → side curves → stem.
 * Used by: eco, botanical variation.
 */
import { mm } from './vectorPrimitives'

export function paintBotanical(cx: number, cy: number, r: number, accent: string): string {
  return `
    <path d="M${mm(cx)} ${mm(cy - r * 1.05)} C${mm(cx + r * 0.7)} ${mm(cy - r * 0.35)} ${mm(cx + r * 0.62)} ${mm(cy + r * 0.55)} ${mm(cx)} ${mm(cy + r * 1.1)}
      C${mm(cx - r * 0.62)} ${mm(cy + r * 0.55)} ${mm(cx - r * 0.7)} ${mm(cy - r * 0.35)} ${mm(cx)} ${mm(cy - r * 1.05)}Z"
      fill="${accent}" fill-opacity="0.1" stroke="${accent}" stroke-width="0.28" />
    <line x1="${mm(cx)}" y1="${mm(cy - r * 0.85)}" x2="${mm(cx)}" y2="${mm(cy + r * 0.95)}" stroke="${accent}" stroke-width="0.2" />
    <path d="M${mm(cx)} ${mm(cy - r * 0.05)} C${mm(cx + r * 0.7)} ${mm(cy - r * 0.55)} ${mm(cx + r * 0.85)} ${mm(cy + r * 0.05)} ${mm(cx + r * 0.22)} ${mm(cy + r * 0.2)}" fill="none" stroke="${accent}" stroke-opacity="0.55" stroke-width="0.16" />
    <path d="M${mm(cx)} ${mm(cy + r * 0.25)} C${mm(cx - r * 0.65)} ${mm(cy - r * 0.15)} ${mm(cx - r * 0.8)} ${mm(cy + r * 0.35)} ${mm(cx - r * 0.18)} ${mm(cy + r * 0.45)}" fill="none" stroke="${accent}" stroke-opacity="0.45" stroke-width="0.16" />
    <line x1="${mm(cx)}" y1="${mm(cy + r * 1.05)}" x2="${mm(cx)}" y2="${mm(cy + r * 1.35)}" stroke="${accent}" stroke-width="0.22" />
  `
}
