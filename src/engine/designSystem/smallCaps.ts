/**
 * Small caps + volume rendering — SVG text with optical small caps.
 * Extracted from typeSystem.ts to isolate rendering from layout.
 * P1-D: volumeMarkup now consumes normalizeVolume for consistent display.
 */
import type { TypeScale } from './types'
import { volumeDisplay } from './volumeFormat'

function esc(text: string): string {
  return text.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>')
}

export function smallCapsRuns(text: string): { text: string; kind: 'full' | 'small' }[] {
  const runs: { text: string; kind: 'full' | 'small' }[] = []
  let buf = ''
  let kind: 'full' | 'small' | null = null
  for (const ch of text) {
    const next: 'full' | 'small' = /\p{L}/u.test(ch) ? 'small' : 'full'
    if (kind && next !== kind) {
      runs.push({ text: kind === 'small' ? buf.toLocaleUpperCase('tr') : buf, kind })
      buf = ch
      kind = next
    } else {
      buf += ch
      kind = next
    }
  }
  if (buf && kind) {
    runs.push({ text: kind === 'small' ? buf.toLocaleUpperCase('tr') : buf, kind })
  }
  return runs
}

/** Real small caps: lining figures stay full size; letters are drawn as smaller capitals. No font-variant. */
export function smallCapsText(
  x: number,
  y: number,
  text: string,
  size: number,
  tracking: number,
  fill: string,
  anchor: 'middle' | 'start' | 'end',
  font: string,
  ratio: number,
): string {
  const tspans = smallCapsRuns(text)
    .map((run) => {
      const fs = run.kind === 'small' ? size * ratio : size
      return `<tspan font-size="${fs.toFixed(2)}">${esc(run.text)}</tspan>`
    })
    .join('')
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${fill}" font-family="${font}" font-weight="600" letter-spacing="${tracking}">${tspans}</text>`
}

export function volumeMarkup(
  x: number,
  y: number,
  raw: string,
  type: TypeScale,
  fill: string,
  anchor: 'middle' | 'start' | 'end',
  font: string,
  estimated: boolean,
): string {
  const label = volumeDisplay(raw, estimated)
  if (!label) return ''
  if (type.volumeCase === 'smallcaps') {
    return smallCapsText(x, y, label, type.volumeMm, 1.15, fill, anchor, font, type.smallCapsRatio)
  }
  // P1-D: lining figures stay full size, no extra spaces between digits.
  // letter-spacing capped at 0.4 for volume role (forbidden > 0.4 on digit runs).
  const tracking = Math.min(0.4, 1.35)
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${fill}" font-family="${font}" font-weight="600" font-size="${type.volumeMm}" letter-spacing="${tracking}">${esc(label.toUpperCase())}</text>`
}
