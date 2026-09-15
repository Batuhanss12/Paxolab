/**
 * Crest hero — maison shield. No flacon / bottle (user veto: clip-art bottle drawings).
 * Layered: outer shield → inner frame → top bar. Dense adds outer ticks.
 * Used by: perfume luxury. Classic omits this glyph (lockup chrome only).
 */
import { mm } from './vectorPrimitives'

export function paintCrest(cx: number, cy: number, r: number, accent: string, dense = false): string {
  const shield = `M${mm(cx)} ${mm(cy - r * 1.08)}
    C${mm(cx + r * 0.7)} ${mm(cy - r * 1.02)} ${mm(cx + r * 0.9)} ${mm(cy - r * 0.12)} ${mm(cx + r * 0.8)} ${mm(cy + r * 0.28)}
    C${mm(cx + r * 0.58)} ${mm(cy + r * 0.78)} ${mm(cx + r * 0.16)} ${mm(cy + r * 1.08)} ${mm(cx)} ${mm(cy + r * 1.2)}
    C${mm(cx - r * 0.16)} ${mm(cy + r * 1.08)} ${mm(cx - r * 0.58)} ${mm(cy + r * 0.78)} ${mm(cx - r * 0.8)} ${mm(cy + r * 0.28)}
    C${mm(cx - r * 0.9)} ${mm(cy - r * 0.12)} ${mm(cx - r * 0.7)} ${mm(cy - r * 1.02)} ${mm(cx)} ${mm(cy - r * 1.08)}Z`
  const inner = `M${mm(cx)} ${mm(cy - r * 0.78)}
    C${mm(cx + r * 0.48)} ${mm(cy - r * 0.72)} ${mm(cx + r * 0.62)} ${mm(cy - r * 0.08)} ${mm(cx + r * 0.54)} ${mm(cy + r * 0.2)}
    C${mm(cx + r * 0.38)} ${mm(cy + r * 0.55)} ${mm(cx + r * 0.1)} ${mm(cy + r * 0.76)} ${mm(cx)} ${mm(cy + r * 0.86)}
    C${mm(cx - r * 0.1)} ${mm(cy + r * 0.76)} ${mm(cx - r * 0.38)} ${mm(cy + r * 0.55)} ${mm(cx - r * 0.54)} ${mm(cy + r * 0.2)}
    C${mm(cx - r * 0.62)} ${mm(cy - r * 0.08)} ${mm(cx - r * 0.48)} ${mm(cy - r * 0.72)} ${mm(cx)} ${mm(cy - r * 0.78)}Z`

  const bar = `
    <line x1="${mm(cx - r * 0.28)}" y1="${mm(cy - r * 0.52)}" x2="${mm(cx + r * 0.28)}" y2="${mm(cy - r * 0.52)}" stroke="${accent}" stroke-width="0.18" />
  `

  let ticks = ''
  if (dense) {
    const tickAngles = [-90, -45, 0, 45, 90]
    ticks = tickAngles
      .map((deg) => {
        const a = (deg * Math.PI) / 180
        const x1 = cx + Math.cos(a) * r * 1.22
        const y1 = cy + Math.sin(a) * r * 1.08
        const x2 = cx + Math.cos(a) * r * 1.42
        const y2 = cy + Math.sin(a) * r * 1.26
        return `<line x1="${mm(x1)}" y1="${mm(y1)}" x2="${mm(x2)}" y2="${mm(y2)}" stroke="${accent}" stroke-width="0.2" />`
      })
      .join('')
  }

  return `
    <path d="${shield}" fill="${accent}" fill-opacity="0.1" stroke="${accent}" stroke-width="0.34" />
    <path d="${inner}" fill="none" stroke="${accent}" stroke-opacity="0.45" stroke-width="0.16" />
    ${bar}
    ${ticks}
  `
}
