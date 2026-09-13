/**
 * Drop hero — Serum droplet with highlight.
 * Layered: drop body → highlight reflection → stem accent.
 * Used by: serum, botanical variation.
 */
import { mm } from './vectorPrimitives'

export function paintDrop(cx: number, cy: number, r: number, accent: string): string {
  return `
    <path d="M${mm(cx)} ${mm(cy - r * 1.05)}
      C${mm(cx + r * 0.72)} ${mm(cy - r * 0.15)} ${mm(cx + r * 0.7)} ${mm(cy + r * 0.7)} ${mm(cx)} ${mm(cy + r * 1.15)}
      C${mm(cx - r * 0.7)} ${mm(cy + r * 0.7)} ${mm(cx - r * 0.72)} ${mm(cy - r * 0.15)} ${mm(cx)} ${mm(cy - r * 1.05)}Z"
      fill="${accent}" fill-opacity="0.12" stroke="${accent}" stroke-width="0.28" />
    <ellipse cx="${mm(cx - r * 0.12)}" cy="${mm(cy - r * 0.15)}" rx="${mm(r * 0.18)}" ry="${mm(r * 0.28)}" fill="${accent}" fill-opacity="0.2" />
  `
}
