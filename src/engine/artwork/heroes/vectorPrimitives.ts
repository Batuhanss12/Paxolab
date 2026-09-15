/**
 * Vector primitives for layered hero composition.
 * These are the building blocks heroes use — not raw SVG elements.
 * Each helper produces a coherent visual element, not a single shape.
 */

/** Format a number to 2 decimal places for SVG output. */
export function mm(n: number): string {
  return n.toFixed(2)
}

/** Polar → cartesian point. */
export function polar(cx: number, cy: number, r: number, angleRad: number): [number, number] {
  return [cx + Math.cos(angleRad) * r, cy + Math.sin(angleRad) * r]
}

/** Regular polygon points string (for <polygon points="...">). */
export function polygonPoints(cx: number, cy: number, r: number, sides: number, rotationDeg = 0): string {
  const pts: string[] = []
  for (let i = 0; i < sides; i++) {
    const a = ((i * (360 / sides) + rotationDeg) * Math.PI) / 180
    pts.push(`${mm(cx + Math.cos(a) * r)},${mm(cy + Math.sin(a) * r)}`)
  }
  return pts.join(' ')
}

/** Star points string — alternating outer/inner radius. */
export function starPoints(cx: number, cy: number, rOuter: number, rInner: number, points: number, rotationDeg = 0): string {
  const pts: string[] = []
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner
    const a = ((i * (180 / points) + rotationDeg) * Math.PI) / 180
    pts.push(`${mm(cx + Math.cos(a) * r)},${mm(cy + Math.sin(a) * r)}`)
  }
  return pts.join(' ')
}

/** Radial guilloché lines — bank-note style pattern from center. */
export function guillocheRays(cx: number, cy: number, rInner: number, rOuter: number, count: number, accent: string, opacity = 0.18, width = 0.1): string {
  const lines: string[] = []
  for (let i = 0; i < count; i++) {
    const a = (i * (360 / count) * Math.PI) / 180
    const [x1, y1] = polar(cx, cy, rInner, a)
    const [x2, y2] = polar(cx, cy, rOuter, a)
    lines.push(`<line x1="${mm(x1)}" y1="${mm(y1)}" x2="${mm(x2)}" y2="${mm(y2)}" stroke="${accent}" stroke-opacity="${opacity}" stroke-width="${width}" />`)
  }
  return lines.join('')
}

/** Concentric arc — partial circle (for rings, frames). */
export function arc(cx: number, cy: number, r: number, startDeg: number, endDeg: number, accent: string, width = 0.2, opacity = 0.5): string {
  const a1 = (startDeg * Math.PI) / 180
  const a2 = (endDeg * Math.PI) / 180
  const [x1, y1] = polar(cx, cy, r, a1)
  const [x2, y2] = polar(cx, cy, r, a2)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `<path d="M${mm(x1)} ${mm(y1)} A${mm(r)} ${mm(r)} 0 ${large} 1 ${mm(x2)} ${mm(y2)}" fill="none" stroke="${accent}" stroke-width="${width}" stroke-opacity="${opacity}" />`
}

/** Bezier leaf shape — botanical element. */
export function leafPath(cx: number, cy: number, s: number, accent: string, fillOpacity = 0.14, strokeOpacity = 1, width = 0.2, rotationDeg = 0): string {
  const d = `M${mm(cx)} ${mm(cy - s)} C${mm(cx + s * 0.55)} ${mm(cy - s * 0.15)} ${mm(cx + s * 0.5)} ${mm(cy + s * 0.45)} ${mm(cx)} ${mm(cy + s)}
    C${mm(cx - s * 0.5)} ${mm(cy + s * 0.45)} ${mm(cx - s * 0.55)} ${mm(cy - s * 0.15)} ${mm(cx)} ${mm(cy - s)}Z`
  const transform = rotationDeg !== 0 ? ` transform="rotate(${rotationDeg} ${mm(cx)} ${mm(cy)})"` : ''
  return `<g${transform}><path d="${d}" fill="${accent}" fill-opacity="${fillOpacity}" stroke="${accent}" stroke-opacity="${strokeOpacity}" stroke-width="${width}" /></g>`
}

/** Petal/teardrop shape — radial floral element. */
export function petalPath(cx: number, cy: number, s: number, accent: string, fillOpacity = 0.1, width = 0.22, rotationDeg = 0): string {
  const d = `M${mm(cx)} ${mm(cy - s)} C${mm(cx + s * 0.72)} ${mm(cy - s * 0.15)} ${mm(cx + s * 0.7)} ${mm(cy + s * 0.7)} ${mm(cx)} ${mm(cy + s * 1.15)}
    C${mm(cx - s * 0.7)} ${mm(cy + s * 0.7)} ${mm(cx - s * 0.72)} ${mm(cy - s * 0.15)} ${mm(cx)} ${mm(cy - s * 1.05)}Z`
  const transform = rotationDeg !== 0 ? ` transform="rotate(${rotationDeg} ${mm(cx)} ${mm(cy)})"` : ''
  return `<g${transform}><path d="${d}" fill="${accent}" fill-opacity="${fillOpacity}" stroke="${accent}" stroke-width="${width}" /></g>`
}

/** Corner bracket — L-shaped registration mark. */
export function cornerBracket(x: number, y: number, size: number, accent: string, width = 0.2, corner: 'tl' | 'tr' | 'bl' | 'br' = 'tl'): string {
  const dx = corner === 'tr' || corner === 'br' ? -1 : 1
  const dy = corner === 'bl' || corner === 'br' ? -1 : 1
  return `<path d="M${mm(x)} ${mm(y + dy * size)} L${mm(x)} ${mm(y)} L${mm(x + dx * size)} ${mm(y)}" fill="none" stroke="${accent}" stroke-width="${width}" />`
}

/** Dashed registration line — measurement/tick mark style. */
export function dashedLine(x1: number, y1: number, x2: number, y2: number, accent: string, width = 0.12, opacity = 0.3, dash = '0.8 0.6'): string {
  return `<line x1="${mm(x1)}" y1="${mm(y1)}" x2="${mm(x2)}" y2="${mm(y2)}" stroke="${accent}" stroke-width="${width}" stroke-opacity="${opacity}" stroke-dasharray="${dash}" />`
}

/** Retired — bottle / flacon drawings never paint (user veto). */
export function flaconSilhouette(_cx: number, _cy: number, _w: number, _h: number, _accent: string, _fillOpacity = 0.18, _width = 0.16): string {
  return ''
}

/** Concentric ring set — decorative frame rings. */
export function ringSet(cx: number, cy: number, radii: number[], accent: string, width = 0.16, opacity = 0.4): string {
  return radii
    .map((r) => `<circle cx="${mm(cx)}" cy="${mm(cy)}" r="${mm(r)}" fill="none" stroke="${accent}" stroke-opacity="${opacity}" stroke-width="${width}" />`)
    .join('')
}
