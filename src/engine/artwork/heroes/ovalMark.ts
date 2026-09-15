/**
 * Oval hero — Art deco layered medallion.
 * Layered: sunburst rays → ring frame → diamond → flacon silhouette.
 * Used by: cream, serum, organic-wave variation.
 */
import { flaconSilhouette, mm, polar } from './vectorPrimitives'

export function paintOval(cx: number, cy: number, r: number, accent: string): string {
  const R = r * 1.15
  // Outer 8-point sunburst frame
  const rays: string[] = []
  for (let i = 0; i < 8; i++) {
    const a = ((i * 45 - 22.5) * Math.PI) / 180
    const a2 = ((i * 45) * Math.PI) / 180
    const [x1, y1] = polar(cx, cy, R, a)
    const [x2, y2] = polar(cx, cy, R * 0.82, a2)
    const [x3, y3] = polar(cx, cy, R, a + Math.PI / 8)
    rays.push(`<path d="M${mm(x1)} ${mm(y1)} L${mm(x2)} ${mm(y2)} L${mm(x3)} ${mm(y3)} Z" fill="${accent}" fill-opacity="0.08" />`)
  }
  // Inner diamond
  const dR = R * 0.55
  const diamond = `M${mm(cx)} ${mm(cy - dR)} L${mm(cx + dR * 0.7)} ${mm(cy)} L${mm(cx)} ${mm(cy + dR)} L${mm(cx - dR * 0.7)} ${mm(cy)} Z`
  // Center flacon
  const flacon = flaconSilhouette(cx, cy, R * 0.3, R * 0.55, accent, 0.18, 0.16)

  return `
    <g data-art="hero-oval">
      ${rays.join('')}
      <circle cx="${mm(cx)}" cy="${mm(cy)}" r="${mm(R * 0.86)}" fill="none" stroke="${accent}" stroke-opacity="0.62" stroke-width="0.28" />
      <circle cx="${mm(cx)}" cy="${mm(cy)}" r="${mm(R * 0.7)}" fill="none" stroke="${accent}" stroke-opacity="0.42" stroke-width="0.16" />
      <path d="${diamond}" fill="${accent}" fill-opacity="0.06" stroke="${accent}" stroke-width="0.22" />
      ${flacon}
    </g>
  `
}
