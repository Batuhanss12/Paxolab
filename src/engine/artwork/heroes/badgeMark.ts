/**
 * Badge hero — Ticket / stamp plate with corner brackets.
 * Layered: outer plate → inner frame → 4 corner brackets → center label.
 * Used by: playful, zebra variation.
 */
import { cornerBracket, mm } from './vectorPrimitives'

export function paintBadge(cx: number, cy: number, r: number, accent: string): string {
  const w = r * 2.35
  const h = r * 1.45
  const x = cx - w / 2
  const y = cy - h / 2
  const k = Math.min(1.35, r * 0.28)
  const inset = 0.9
  const bracketSize = k * 1.4
  return `
    <rect x="${mm(x)}" y="${mm(y)}" width="${mm(w)}" height="${mm(h)}" rx="${mm(r * 0.18)}" fill="${accent}" fill-opacity="0.08" stroke="${accent}" stroke-width="0.3" />
    <rect x="${mm(x + inset)}" y="${mm(y + inset)}" width="${mm(w - inset * 2)}" height="${mm(h - inset * 2)}" rx="${mm(r * 0.12)}" fill="none" stroke="${accent}" stroke-opacity="0.35" stroke-width="0.14" />
    ${cornerBracket(x + k, y + k, bracketSize, accent, 0.2, 'tl')}
    ${cornerBracket(x + w - k, y + k, bracketSize, accent, 0.2, 'tr')}
    ${cornerBracket(x + k, y + h - k, bracketSize, accent, 0.2, 'bl')}
    ${cornerBracket(x + w - k, y + h - k, bracketSize, accent, 0.2, 'br')}
    <rect x="${mm(cx - r * 0.55)}" y="${mm(cy - r * 0.18)}" width="${mm(r * 1.1)}" height="${mm(r * 0.36)}" rx="${mm(r * 0.06)}" fill="${accent}" fill-opacity="0.18" stroke="${accent}" stroke-opacity="0.3" stroke-width="0.12" />
  `
}
