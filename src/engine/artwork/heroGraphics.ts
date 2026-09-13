import type { Palette, Panel } from '../../types'
import type { DesignPlan, HeroFamily } from '../brain/DesignPlan'
import type { DecorFamily } from '../designSystem/types'

/** Set 0 keeps kit Y. Variation / library heroes consume the plan zone + crop. */
export function heroYFrac(plan: DesignPlan | undefined, kitY: number): number {
  if (!plan || (plan.variationIndex ?? 0) <= 0) return kitY
  return plan.composition.heroZone.y ?? kitY
}

export function heroPaintScale(plan: DesignPlan | undefined, kitScale = 1): number {
  if (!plan) return kitScale
  const crop = plan.crop.heroCrop ?? 1
  const graphic = plan.heroGraphic.scale ?? 1
  if ((plan.variationIndex ?? 0) <= 0) return kitScale
  return kitScale * graphic * crop
}

export function kitHeroFamily(decor: DecorFamily): HeroFamily {
  if (decor === 'crest') return 'crest'
  if (decor === 'cartouche') return 'seal'
  if (decor === 'leaf' || decor === 'drop') return 'botanical'
  if (decor === 'badge') return 'emblem'
  if (decor === 'olive' || decor === 'harvest') return 'harvest'
  if (decor === 'oval') return 'oval'
  if (decor === 'grid' || decor === 'plaque') return 'tech'
  return 'none'
}

function origin(panel: Panel, scale: number, yFrac = 0.148, xFrac = 0.5): { cx: number; cy: number; r: number } {
  const cx = panel.x + panel.w * xFrac
  const cy = panel.y + panel.h * yFrac
  const r = Math.min(panel.w, panel.h) * 0.095 * scale
  return { cx, cy, r }
}

function mm(n: number): string {
  return n.toFixed(2)
}

/** Maison shield + flacon. Not concentric rings. */
export function paintCrestMark(cx: number, cy: number, r: number, accent: string, dense = false): string {
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
  const ticks = dense
    ? [ -90, 0, 90 ]
        .map((deg) => {
          const a = (deg * Math.PI) / 180
          const x1 = cx + Math.cos(a) * r * 1.22
          const y1 = cy + Math.sin(a) * r * 1.08
          const x2 = cx + Math.cos(a) * r * 1.42
          const y2 = cy + Math.sin(a) * r * 1.26
          return `<line x1="${mm(x1)}" y1="${mm(y1)}" x2="${mm(x2)}" y2="${mm(y2)}" stroke="${accent}" stroke-width="0.2" />`
        })
        .join('')
    : ''
  return `
    <path d="${shield}" fill="${accent}" fill-opacity="0.1" stroke="${accent}" stroke-width="0.34" />
    <path d="${inner}" fill="none" stroke="${accent}" stroke-opacity="0.45" stroke-width="0.16" />
    <line x1="${mm(cx - r * 0.28)}" y1="${mm(cy - r * 0.52)}" x2="${mm(cx + r * 0.28)}" y2="${mm(cy - r * 0.52)}" stroke="${accent}" stroke-width="0.18" />
    <rect x="${mm(cx - r * 0.07)}" y="${mm(cy - r * 0.46)}" width="${mm(r * 0.14)}" height="${mm(r * 0.12)}" fill="none" stroke="${accent}" stroke-width="0.16" />
    <path d="M${mm(cx - r * 0.2)} ${mm(cy - r * 0.3)} Q${mm(cx)} ${mm(cy - r * 0.36)} ${mm(cx + r * 0.2)} ${mm(cy - r * 0.3)}
      L${mm(cx + r * 0.22)} ${mm(cy + r * 0.28)} Q${mm(cx)} ${mm(cy + r * 0.42)} ${mm(cx - r * 0.22)} ${mm(cy + r * 0.28)}Z"
      fill="${accent}" fill-opacity="0.22" stroke="${accent}" stroke-width="0.2" />
    ${ticks}
  `
}

/** Pressed wax seal — octagonal medallion with radial guilloché pattern. */
export function paintSealMark(cx: number, cy: number, r: number, accent: string): string {
  const R = r * 1.18
  // Outer octagon
  const pts: string[] = []
  for (let i = 0; i < 8; i++) {
    const a = ((i * 45 - 22.5) * Math.PI) / 180
    pts.push(`${mm(cx + Math.cos(a) * R)},${mm(cy + Math.sin(a) * R)}`)
  }
  // Radial guilloché lines from center
  const guilloche: string[] = []
  for (let i = 0; i < 12; i++) {
    const a = (i * 30 * Math.PI) / 180
    const x1 = cx + Math.cos(a) * R * 0.35
    const y1 = cy + Math.sin(a) * R * 0.35
    const x2 = cx + Math.cos(a) * R * 0.72
    const y2 = cy + Math.sin(a) * R * 0.72
    guilloche.push(`<line x1="${mm(x1)}" y1="${mm(y1)}" x2="${mm(x2)}" y2="${mm(y2)}" stroke="${accent}" stroke-opacity="0.18" stroke-width="0.1" />`)
  }
  // Inner hexagon
  const innerPts: string[] = []
  for (let i = 0; i < 6; i++) {
    const a = ((i * 60) * Math.PI) / 180
    innerPts.push(`${mm(cx + Math.cos(a) * R * 0.4)},${mm(cy + Math.sin(a) * R * 0.4)}`)
  }
  return `
    <polygon points="${pts.join(' ')}" fill="${accent}" fill-opacity="0.07" stroke="${accent}" stroke-width="0.3" />
    <polygon points="${pts.join(' ')}" fill="none" stroke="${accent}" stroke-opacity="0.3" stroke-width="0.12" stroke-dasharray="0.6 0.4" />
    ${guilloche.join('')}
    <polygon points="${innerPts.join(' ')}" fill="${accent}" fill-opacity="0.1" stroke="${accent}" stroke-width="0.18" />
    <circle cx="${mm(cx)}" cy="${mm(cy)}" r="${mm(R * 0.12)}" fill="${accent}" fill-opacity="0.25" />
  `
}

/** Cosmetic emblem: Art deco layered medallion. Not a lone circle. */
export function paintOvalMark(cx: number, cy: number, r: number, accent: string): string {
  const R = r * 1.15
  // Outer 8-point sunburst frame
  const rays: string[] = []
  for (let i = 0; i < 8; i++) {
    const a = ((i * 45 - 22.5) * Math.PI) / 180
    const a2 = ((i * 45) * Math.PI) / 180
    const x1 = cx + Math.cos(a) * R
    const y1 = cy + Math.sin(a) * R
    const x2 = cx + Math.cos(a2) * R * 0.82
    const y2 = cy + Math.sin(a2) * R * 0.82
    const x3 = cx + Math.cos(a + Math.PI / 8) * R
    const y3 = cy + Math.sin(a + Math.PI / 8) * R
    rays.push(`<path d="M${mm(x1)} ${mm(y1)} L${mm(x2)} ${mm(y2)} L${mm(x3)} ${mm(y3)} Z" fill="${accent}" fill-opacity="0.08" />`)
  }
  // Inner diamond
  const dR = R * 0.55
  const diamond = `M${mm(cx)} ${mm(cy - dR)} L${mm(cx + dR * 0.7)} ${mm(cy)} L${mm(cx)} ${mm(cy + dR)} L${mm(cx - dR * 0.7)} ${mm(cy)} Z`
  // Center flacon silhouette
  const fW = R * 0.22
  const fH = R * 0.5
  const fY = cy - fH * 0.35
  return `
    <g data-art="hero-oval">
      ${rays.join('')}
      <circle cx="${mm(cx)}" cy="${mm(cy)}" r="${mm(R * 0.78)}" fill="none" stroke="${accent}" stroke-opacity="0.5" stroke-width="0.2" />
      <path d="${diamond}" fill="${accent}" fill-opacity="0.06" stroke="${accent}" stroke-width="0.22" />
      <path d="M${mm(cx - fW)} ${mm(fY)} L${mm(cx + fW)} ${mm(fY)} L${mm(cx + fW * 0.7)} ${mm(fY + fH)} L${mm(cx - fW * 0.7)} ${mm(fY + fH)} Z" fill="${accent}" fill-opacity="0.18" stroke="${accent}" stroke-width="0.16" />
      <line x1="${mm(cx - fW * 0.5)}" y1="${mm(fY - fH * 0.18)}" x2="${mm(cx + fW * 0.5)}" y2="${mm(fY - fH * 0.18)}" stroke="${accent}" stroke-width="0.18" />
      <rect x="${mm(cx - fW * 0.3)}" y="${mm(fY - fH * 0.28)}" width="${mm(fW * 0.6)}" height="${mm(fH * 0.12)}" fill="${accent}" fill-opacity="0.25" />
    </g>
  `
}

/** Ticket / stamp — rounded plate with corner brackets and inner frame. */
export function paintBadgeMark(cx: number, cy: number, r: number, accent: string): string {
  const w = r * 2.35
  const h = r * 1.45
  const x = cx - w / 2
  const y = cy - h / 2
  const k = Math.min(1.35, r * 0.28)
  const inset = 0.9
  return `
    <rect x="${mm(x)}" y="${mm(y)}" width="${mm(w)}" height="${mm(h)}" rx="${mm(r * 0.18)}" fill="${accent}" fill-opacity="0.08" stroke="${accent}" stroke-width="0.3" />
    <rect x="${mm(x + inset)}" y="${mm(y + inset)}" width="${mm(w - inset * 2)}" height="${mm(h - inset * 2)}" rx="${mm(r * 0.12)}" fill="none" stroke="${accent}" stroke-opacity="0.35" stroke-width="0.14" />
    <path d="M${mm(x + k)} ${mm(y + k)} L${mm(x + k * 2.4)} ${mm(y + k)} M${mm(x + k)} ${mm(y + k)} L${mm(x + k)} ${mm(y + k * 2.4)}" stroke="${accent}" stroke-width="0.2" />
    <path d="M${mm(x + w - k)} ${mm(y + k)} L${mm(x + w - k * 2.4)} ${mm(y + k)} M${mm(x + w - k)} ${mm(y + k)} L${mm(x + w - k)} ${mm(y + k * 2.4)}" stroke="${accent}" stroke-width="0.2" />
    <path d="M${mm(x + k)} ${mm(y + h - k)} L${mm(x + k * 2.4)} ${mm(y + h - k)} M${mm(x + k)} ${mm(y + h - k)} L${mm(x + k)} ${mm(y + h - k * 2.4)}" stroke="${accent}" stroke-width="0.2" />
    <path d="M${mm(x + w - k)} ${mm(y + h - k)} L${mm(x + w - k * 2.4)} ${mm(y + h - k)} M${mm(x + w - k)} ${mm(y + h - k)} L${mm(x + w - k)} ${mm(y + h - k * 2.4)}" stroke="${accent}" stroke-width="0.2" />
    <rect x="${mm(cx - r * 0.55)}" y="${mm(cy - r * 0.18)}" width="${mm(r * 1.1)}" height="${mm(r * 0.36)}" rx="${mm(r * 0.06)}" fill="${accent}" fill-opacity="0.18" stroke="${accent}" stroke-opacity="0.3" stroke-width="0.12" />
  `
}

export function paintDropMark(cx: number, cy: number, r: number, accent: string): string {
  return `
    <path d="M${mm(cx)} ${mm(cy - r * 1.05)}
      C${mm(cx + r * 0.72)} ${mm(cy - r * 0.15)} ${mm(cx + r * 0.7)} ${mm(cy + r * 0.7)} ${mm(cx)} ${mm(cy + r * 1.15)}
      C${mm(cx - r * 0.7)} ${mm(cy + r * 0.7)} ${mm(cx - r * 0.72)} ${mm(cy - r * 0.15)} ${mm(cx)} ${mm(cy - r * 1.05)}Z"
      fill="${accent}" fill-opacity="0.12" stroke="${accent}" stroke-width="0.28" />
    <ellipse cx="${mm(cx - r * 0.12)}" cy="${mm(cy - r * 0.15)}" rx="${mm(r * 0.18)}" ry="${mm(r * 0.28)}" fill="${accent}" fill-opacity="0.2" />
  `
}

/** Library heroes only. Crest / oval / harvest kit paths stay in composeArtwork. */
export function paintHeroGraphic(family: HeroFamily, panel: Panel, p: Palette, scale = 1, yFrac = 0.148, xFrac = 0.5): string {
  const { cx, cy, r } = origin(panel, scale, yFrac, xFrac)
  if (family === 'crest') return paintCrestMark(cx, cy, r, p.accent, false)
  if (family === 'seal') return paintSealMark(cx, cy, r, p.accent)
  if (family === 'botanical') {
    return `
      <path d="M${mm(cx)} ${mm(cy - r * 1.05)} C${mm(cx + r * 0.7)} ${mm(cy - r * 0.35)} ${mm(cx + r * 0.62)} ${mm(cy + r * 0.55)} ${mm(cx)} ${mm(cy + r * 1.1)}
        C${mm(cx - r * 0.62)} ${mm(cy + r * 0.55)} ${mm(cx - r * 0.7)} ${mm(cy - r * 0.35)} ${mm(cx)} ${mm(cy - r * 1.05)}Z"
        fill="${p.accent}" fill-opacity="0.1" stroke="${p.accent}" stroke-width="0.28" />
      <line x1="${mm(cx)}" y1="${mm(cy - r * 0.85)}" x2="${mm(cx)}" y2="${mm(cy + r * 0.95)}" stroke="${p.accent}" stroke-width="0.2" />
      <path d="M${mm(cx)} ${mm(cy - r * 0.05)} C${mm(cx + r * 0.7)} ${mm(cy - r * 0.55)} ${mm(cx + r * 0.85)} ${mm(cy + r * 0.05)} ${mm(cx + r * 0.22)} ${mm(cy + r * 0.2)}" fill="none" stroke="${p.accent}" stroke-opacity="0.55" stroke-width="0.16" />
      <path d="M${mm(cx)} ${mm(cy + r * 0.25)} C${mm(cx - r * 0.65)} ${mm(cy - r * 0.15)} ${mm(cx - r * 0.8)} ${mm(cy + r * 0.35)} ${mm(cx - r * 0.18)} ${mm(cy + r * 0.45)}" fill="none" stroke="${p.accent}" stroke-opacity="0.45" stroke-width="0.16" />
      <line x1="${mm(cx)}" y1="${mm(cy + r * 1.05)}" x2="${mm(cx)}" y2="${mm(cy + r * 1.35)}" stroke="${p.accent}" stroke-width="0.22" />
    `
  }
  if (family === 'emblem') return paintBadgeMark(cx, cy, r, p.accent)
  if (family === 'harvest') {
    const leaf = (ox: number, oy: number, rot: number, s: number) => {
      const tx = cx + ox
      const ty = cy + oy
      return `<g transform="rotate(${rot} ${mm(tx)} ${mm(ty)})">
        <path d="M${mm(tx)} ${mm(ty - s)} C${mm(tx + s * 0.55)} ${mm(ty - s * 0.15)} ${mm(tx + s * 0.5)} ${mm(ty + s * 0.45)} ${mm(tx)} ${mm(ty + s)}
          C${mm(tx - s * 0.5)} ${mm(ty + s * 0.45)} ${mm(tx - s * 0.55)} ${mm(ty - s * 0.15)} ${mm(tx)} ${mm(ty - s)}Z"
          fill="${p.accent}" fill-opacity="0.14" stroke="${p.accent}" stroke-width="0.2" />
      </g>`
    }
    return `
      ${leaf(-r * 0.55, r * 0.05, -38, r * 0.7)}
      ${leaf(r * 0.55, r * 0.08, 42, r * 0.68)}
      ${leaf(0, -r * 0.15, 8, r * 0.55)}
      <line x1="${mm(cx)}" y1="${mm(cy + r * 0.15)}" x2="${mm(cx)}" y2="${mm(cy + r * 0.95)}" stroke="${p.accent}" stroke-width="0.22" />
    `
  }
  if (family === 'tech') {
    const w = r * 2.5
    const h = r * 1.2
    return `
      <rect x="${mm(cx - w / 2)}" y="${mm(cy - h / 2)}" width="${mm(w)}" height="${mm(h)}" fill="${p.accent}" fill-opacity="0.06" stroke="${p.accent}" stroke-width="0.26" />
      <line x1="${mm(cx - w / 2 + 0.9)}" y1="${mm(cy - h / 2 + 0.85)}" x2="${mm(cx + w / 2 - 0.9)}" y2="${mm(cy - h / 2 + 0.85)}" stroke="${p.accent}" stroke-opacity="0.45" stroke-width="0.12" />
      <rect x="${mm(cx - r * 0.7)}" y="${mm(cy - r * 0.18)}" width="${mm(r * 1.15)}" height="${mm(r * 0.36)}" fill="${p.accent}" fill-opacity="0.2" />
      <line x1="${mm(cx + r * 0.62)}" y1="${mm(cy)}" x2="${mm(cx + w / 2 - 1.1)}" y2="${mm(cy)}" stroke="${p.accent}" stroke-width="0.16" />
    `
  }
  if (family === 'oval') return paintOvalMark(cx, cy, r, p.accent)
  if (family === 'monstera') {
    const s = r * 1.1
    return `
      <path d="M${cx} ${cy - s * 0.9} C${cx + s * 0.95} ${cy - s * 0.45} ${cx + s * 1.2} ${cy + s * 0.15} ${cx + s * 0.65} ${cy + s * 0.85}
        C${cx + s * 0.2} ${cy + s * 1.05} ${cx - s * 0.2} ${cy + s * 1.05} ${cx - s * 0.65} ${cy + s * 0.85}
        C${cx - s * 1.2} ${cy + s * 0.15} ${cx - s * 0.95} ${cy - s * 0.45} ${cx} ${cy - s * 0.9}" fill="${p.accent}" fill-opacity="0.1" stroke="${p.accent}" stroke-width="0.32" />
      <line x1="${cx}" y1="${cy - s * 0.75}" x2="${cx}" y2="${cy + s * 0.9}" stroke="${p.accent}" stroke-width="0.2" />
      <path d="M${cx} ${cy - s * 0.15} C${cx + s * 0.55} ${cy - s * 0.55} ${cx + s * 0.85} ${cy - s * 0.15} ${cx + s * 0.55} ${cy + s * 0.35}" fill="none" stroke="${p.accent}" stroke-opacity="0.55" stroke-width="0.18" />
      <path d="M${cx} ${cy + s * 0.15} C${cx - s * 0.55} ${cy - s * 0.25} ${cx - s * 0.85} ${cy + s * 0.05} ${cx - s * 0.55} ${cy + s * 0.55}" fill="none" stroke="${p.accent}" stroke-opacity="0.55" stroke-width="0.18" />
      <ellipse cx="${cx + s * 0.35}" cy="${cy - s * 0.1}" rx="${s * 0.22}" ry="${s * 0.35}" fill="none" stroke="${p.accent}" stroke-opacity="0.25" stroke-width="0.12" />
    `
  }
  if (family === 'palm') {
    const s = r * 1.2
    const fronds: string[] = []
    const angles = [-50, -20, 10, 40, 70]
    angles.forEach((deg) => {
      const a = (deg * Math.PI) / 180
      const tipX = cx + Math.cos(a) * s * 1.4
      const tipY = cy - Math.sin(a) * s * 0.9
      const cp1x = cx + Math.cos(a) * s * 0.55
      const cp1y = cy - Math.sin(a) * s * 0.35
      fronds.push(`<path d="M${cx} ${cy} C${cp1x} ${cp1y} ${tipX - Math.cos(a) * s * 0.4} ${tipY + Math.sin(a) * s * 0.2} ${tipX} ${tipY}" fill="none" stroke="${p.accent}" stroke-width="0.24" stroke-opacity="0.7" />`)
    })
    return `
      <line x1="${cx}" y1="${cy + s * 0.2}" x2="${cx}" y2="${cy + s * 1.3}" stroke="${p.accent}" stroke-width="0.3" />
      ${fronds.join('')}
      <circle cx="${cx}" cy="${cy}" r="${s * 0.12}" fill="${p.accent}" fill-opacity="0.35" />
    `
  }
  if (family === 'organic-wave') return paintOvalMark(cx, cy, r, p.accent)
  if (family === 'zebra') return paintBadgeMark(cx, cy, r, p.accent)
  return ''
}

export function wrapHero(family: HeroFamily, markup: string): string {
  if (!markup) return ''
  return `<g data-art="hero" data-hero="${family}">${markup}</g>`
}
