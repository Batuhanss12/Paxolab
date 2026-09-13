/**
 * Palm hero — Palm fronds radiating from center.
 * Layered: stem → 5 fronds → center node.
 * Used by: eco palm variation, playful palm.
 */
import { polar } from './vectorPrimitives'

export function paintPalm(cx: number, cy: number, r: number, accent: string): string {
  const s = r * 1.2
  const fronds: string[] = []
  const angles = [-50, -20, 10, 40, 70]
  angles.forEach((deg) => {
    const a = (deg * Math.PI) / 180
    const [tipX, tipY] = polar(cx, cy, s * 1.4, -a + Math.PI / 2)
    const [cp1x, cp1y] = polar(cx, cy, s * 0.55, -a + Math.PI / 2)
    const tipAdjX = tipX - Math.cos(a) * s * 0.4
    const tipAdjY = tipY + Math.sin(a) * s * 0.2
    fronds.push(`<path d="M${cx} ${cy} C${cp1x} ${cp1y} ${tipAdjX} ${tipAdjY} ${tipX} ${tipY}" fill="none" stroke="${accent}" stroke-width="0.24" stroke-opacity="0.7" />`)
  })
  return `
    <line x1="${cx}" y1="${cy + s * 0.2}" x2="${cx}" y2="${cy + s * 1.3}" stroke="${accent}" stroke-width="0.3" />
    ${fronds.join('')}
    <circle cx="${cx}" cy="${cy}" r="${s * 0.12}" fill="${accent}" fill-opacity="0.35" />
  `
}
