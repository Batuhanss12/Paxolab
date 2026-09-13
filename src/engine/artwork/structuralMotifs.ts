/**
 * Structural motifs — L-brackets, claim capsules, series marks, lockup windows, diamonds, legal chrome.
 * Extracted from motifs.ts to isolate structural decor elements from background patterns.
 */
import type { Palette, Panel } from '../../types'
import type { SafeRect } from './patternMotifs'

/** Elite Brew L-brackets — open corners, not a full box. */
export function lBrackets(panel: Panel, color: string): string {
  const { x, y, w, h } = panel
  const L = 7.2
  const o = 3.4
  const sw = 0.28
  const segs: [number, number, number, number][] = [
    [x + o, y + o + L, x + o, y + o],
    [x + o, y + o, x + o + L, y + o],
    [x + w - o - L, y + o, x + w - o, y + o],
    [x + w - o, y + o, x + w - o, y + o + L],
    [x + o, y + h - o - L, x + o, y + h - o],
    [x + o, y + h - o, x + o + L, y + h - o],
    [x + w - o - L, y + h - o, x + w - o, y + h - o],
    [x + w - o, y + h - o, x + w - o, y + h - o - L],
  ]
  return `<g data-art="l-bracket">${segs
    .map(([x1, y1, x2, y2]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${sw}" />`)
    .join('')}</g>`
}

/** Todbie / playful claim capsules. */
export function claimCapsules(panel: Panel, p: Palette): string {
  const { x, y, w } = panel
  const items = [
    { t: '01', dx: 0.22 },
    { t: '02', dx: 0.5 },
    { t: '03', dx: 0.78 },
  ]
  return items
    .map(({ t, dx }) => {
      const cx = x + w * dx
      const cy = y + 8.2
      return `<rect x="${cx - 4.2}" y="${cy - 2.4}" width="8.4" height="4.8" rx="2.4" fill="${p.accent}" opacity="0.22" />
        <text x="${cx}" y="${cy + 1.05}" text-anchor="middle" fill="${p.accent}" font-family="Inter, Arial, sans-serif" font-size="2.05" letter-spacing="0.4">${t}</text>`
    })
    .join('')
}

/** CF-style edition index — Nº 01, not a second billboard. */
export function seriesMark(x: number, y: number, series: string, color: string, anchor: 'start' | 'middle' | 'end' = 'end'): string {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${color}" font-family="Inter, Arial, sans-serif" font-size="2.05" letter-spacing="0.55">Nº ${series}</text>`
}

/** Thin plate around the reserved lockup — frames type, does not score it. */
export function lockupWindow(safe: SafeRect, color: string): string {
  const o = 1.35
  return `<rect x="${safe.x - o}" y="${safe.y - o}" width="${safe.w + o * 2}" height="${safe.h + o * 2}" fill="none" stroke="${color}" stroke-opacity="0.38" stroke-width="0.16" />`
}

export function diamondAt(cx: number, cy: number, color: string, r = 0.7): string {
  return `<path d="M${cx} ${cy - r} L${cx + r} ${cy} L${cx} ${cy + r} L${cx - r} ${cy} Z" fill="${color}" fill-opacity="0.85" />`
}

/** Glisso-style legal column: index plate + baseline ticks. */
export function legalColumnChrome(
  x: number,
  y: number,
  w: number,
  h: number,
  index: string,
  color: string,
  lineYs: number[],
): string {
  const plate = `
    <rect x="${x + 1.15}" y="${y + 1.05}" width="5.4" height="4.2" fill="none" stroke="${color}" stroke-width="0.2" />
    <text x="${x + 3.85}" y="${y + 3.95}" text-anchor="middle" fill="${color}" font-family="Inter, Arial, sans-serif" font-size="1.8" letter-spacing="0.3">${index}</text>`
  const ticks = lineYs
    .map((yy) => `<line x1="${x + 0.85}" y1="${yy}" x2="${x + 1.75}" y2="${yy}" stroke="${color}" stroke-opacity="0.4" stroke-width="0.14" />`)
    .join('')
  const floor = `<line x1="${x}" y1="${y + h}" x2="${x + w}" y2="${y + h}" stroke="${color}" stroke-opacity="0.18" stroke-width="0.12" />`
  return plate + ticks + floor
}
