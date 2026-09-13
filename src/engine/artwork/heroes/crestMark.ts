/**
 * Crest hero — Maison shield with flacon silhouette.
 * Layered: outer shield → inner shield frame → flacon → accent ticks.
 * Used by: perfume luxury, classic.
 */
import { flaconSilhouette, mm } from './vectorPrimitives'

export function paintCrest(cx: number, cy: number, r: number, accent: string, dense = false): string {
  // Outer shield path — heraldic shape
  const shield = `M${mm(cx)} ${mm(cy - r * 1.08)}
    C${mm(cx + r * 0.7)} ${mm(cy - r * 1.02)} ${mm(cx + r * 0.9)} ${mm(cy - r * 0.12)} ${mm(cx + r * 0.8)} ${mm(cy + r * 0.28)}
    C${mm(cx + r * 0.58)} ${mm(cy + r * 0.78)} ${mm(cx + r * 0.16)} ${mm(cy + r * 1.08)} ${mm(cx)} ${mm(cy + r * 1.2)}
    C${mm(cx - r * 0.16)} ${mm(cy + r * 1.08)} ${mm(cx - r * 0.58)} ${mm(cy + r * 0.78)} ${mm(cx - r * 0.8)} ${mm(cy + r * 0.28)}
    C${mm(cx - r * 0.9)} ${mm(cy - r * 0.12)} ${mm(cx - r * 0.7)} ${mm(cy - r * 1.02)} ${mm(cx)} ${mm(cy - r * 1.08)}Z`
  // Inner shield — smaller heraldic frame
  const inner = `M${mm(cx)} ${mm(cy - r * 0.78)}
    C${mm(cx + r * 0.48)} ${mm(cy - r * 0.72)} ${mm(cx + r * 0.62)} ${mm(cy - r * 0.08)} ${mm(cx + r * 0.54)} ${mm(cy + r * 0.2)}
    C${mm(cx + r * 0.38)} ${mm(cy + r * 0.55)} ${mm(cx + r * 0.1)} ${mm(cy + r * 0.76)} ${mm(cx)} ${mm(cy + r * 0.86)}
    C${mm(cx - r * 0.1)} ${mm(cy + r * 0.76)} ${mm(cx - r * 0.38)} ${mm(cy + r * 0.55)} ${mm(cx - r * 0.54)} ${mm(cy + r * 0.2)}
    C${mm(cx - r * 0.62)} ${mm(cy - r * 0.08)} ${mm(cx - r * 0.48)} ${mm(cy - r * 0.72)} ${mm(cx)} ${mm(cy - r * 0.78)}Z`

  // Flacon silhouette — centered in shield
  const flacon = flaconSilhouette(cx, cy + r * 0.05, r * 0.4, r * 0.7, accent, 0.2, 0.16)

  // Decorative top bar + crown mark
  const crown = `
    <line x1="${mm(cx - r * 0.28)}" y1="${mm(cy - r * 0.52)}" x2="${mm(cx + r * 0.28)}" y2="${mm(cy - r * 0.52)}" stroke="${accent}" stroke-width="0.18" />
    <rect x="${mm(cx - r * 0.07)}" y="${mm(cy - r * 0.46)}" width="${mm(r * 0.14)}" height="${mm(r * 0.12)}" fill="none" stroke="${accent}" stroke-width="0.16" />
  `

  // Accent ticks — radial marks outside shield (dense variant)
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
    ${crown}
    ${flacon}
    ${ticks}
  `
}
