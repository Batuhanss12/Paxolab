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
    <rect x="${mm(cx - w / 2)}" y="${mm(cy - h / 2)}" width="${mm(w)}" height="${mm(h)}" fill="${accent}" fill-opacity="0.06" stroke="${accent}" stroke-width="0.32" />
    <rect x="${mm(cx - w / 2 + 0.7)}" y="${mm(cy - h / 2 + 0.7)}" width="${mm(w - 1.4)}" height="${mm(h - 1.4)}" fill="none" stroke="${accent}" stroke-opacity="0.4" stroke-width="0.16" />
    <line x1="${mm(cx - w / 2 + 0.9)}" y1="${mm(cy - h / 2 + 0.85)}" x2="${mm(cx + w / 2 - 0.9)}" y2="${mm(cy - h / 2 + 0.85)}" stroke="${accent}" stroke-opacity="0.5" stroke-width="0.16" />
    <rect x="${mm(cx - r * 0.55)}" y="${mm(cy - r * 0.2)}" width="${mm(r * 1.1)}" height="${mm(r * 0.4)}" fill="${accent}" fill-opacity="0.22" stroke="${accent}" stroke-width="0.14" />
    <line x1="${mm(cx)}" y1="${mm(cy - r * 0.2)}" x2="${mm(cx)}" y2="${mm(cy + r * 0.2)}" stroke="${accent}" stroke-width="0.16" />
    <line x1="${mm(cx + r * 0.62)}" y1="${mm(cy)}" x2="${mm(cx + w / 2 - 1.1)}" y2="${mm(cy)}" stroke="${accent}" stroke-width="0.2" />
    <rect x="${mm(cx - w / 2)}" y="${mm(cy - h / 2)}" width="${mm(r * 0.22)}" height="${mm(r * 0.22)}" fill="none" stroke="${accent}" stroke-width="0.18" />
  `
}
