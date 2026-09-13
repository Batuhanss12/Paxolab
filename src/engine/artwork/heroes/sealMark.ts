/**
 * Seal hero — Pressed wax seal with guilloché pattern.
 * Layered: outer octagon → dashed inner border → radial guilloché → inner hexagon → center dot.
 * Used by: classic (kolonya, bal).
 */
import { guillocheRays, mm, polygonPoints } from './vectorPrimitives'

export function paintSeal(cx: number, cy: number, r: number, accent: string): string {
  const R = r * 1.18
  const outer = polygonPoints(cx, cy, R, 8, -22.5)
  const innerHex = polygonPoints(cx, cy, R * 0.4, 6, 0)
  const guilloche = guillocheRays(cx, cy, R * 0.35, R * 0.72, 12, accent, 0.18, 0.1)

  return `
    <polygon points="${outer}" fill="${accent}" fill-opacity="0.07" stroke="${accent}" stroke-width="0.3" />
    <polygon points="${outer}" fill="none" stroke="${accent}" stroke-opacity="0.3" stroke-width="0.12" stroke-dasharray="0.6 0.4" />
    ${guilloche}
    <polygon points="${innerHex}" fill="${accent}" fill-opacity="0.1" stroke="${accent}" stroke-width="0.18" />
    <circle cx="${mm(cx)}" cy="${mm(cy)}" r="${mm(R * 0.12)}" fill="${accent}" fill-opacity="0.25" />
  `
}
