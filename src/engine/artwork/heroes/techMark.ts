/**
 * Tech hero — Circuit panel with header bar and trace.
 * Layered: panel rect → header bar → center chip → trace line.
 * Used by: electronics (audio, cable, device).
 */
import { mm } from './vectorPrimitives'

export function paintTech(cx: number, cy: number, r: number, accent: string): string {
  const w = r * 2.5
  const h = r * 1.2
  return `
    <rect x="${mm(cx - w / 2)}" y="${mm(cy - h / 2)}" width="${mm(w)}" height="${mm(h)}" fill="${accent}" fill-opacity="0.06" stroke="${accent}" stroke-width="0.26" />
    <line x1="${mm(cx - w / 2 + 0.9)}" y1="${mm(cy - h / 2 + 0.85)}" x2="${mm(cx + w / 2 - 0.9)}" y2="${mm(cy - h / 2 + 0.85)}" stroke="${accent}" stroke-opacity="0.45" stroke-width="0.12" />
    <rect x="${mm(cx - r * 0.7)}" y="${mm(cy - r * 0.18)}" width="${mm(r * 1.15)}" height="${mm(r * 0.36)}" fill="${accent}" fill-opacity="0.2" />
    <line x1="${mm(cx + r * 0.62)}" y1="${mm(cy)}" x2="${mm(cx + w / 2 - 1.1)}" y2="${mm(cy)}" stroke="${accent}" stroke-width="0.16" />
  `
}
