/**
 * Glyph metrics — optical glyph advance estimation and line width measurement.
 * Extracted from typeSystem.ts to isolate glyph-level measurement from layout.
 */
import type { LineBox } from './types'

const SERIF_EM = 0.66
const SANS_EM = 0.58

function em(face: 'serif' | 'sans'): number {
  return face === 'serif' ? SERIF_EM : SANS_EM
}

/** Soft glyph advance — optical bbox, not a TTF outline. Pair kerning stays parked. */
export function glyphAdvance(ch: string, face: 'serif' | 'sans'): number {
  if (ch === ' ') return face === 'serif' ? 0.28 : 0.26
  if (/[.,'’|:;!]/.test(ch)) return 0.22
  if (/[il1]/.test(ch)) return face === 'serif' ? 0.3 : 0.28
  if (ch === 'I' || ch === 'İ' || ch === 'ı') return face === 'serif' ? 0.34 : 0.32
  if (/[jfrt]/.test(ch)) return face === 'serif' ? 0.38 : 0.36
  if (/[mwMW]/.test(ch)) return face === 'serif' ? 0.92 : 0.84
  if (/[@%&]/.test(ch)) return 0.86
  if (/[JL]/.test(ch)) return face === 'serif' ? 0.58 : 0.52
  if (/[A-ZÇĞÖŞÜ]/.test(ch)) return face === 'serif' ? 0.74 : 0.64
  if (/[0-9]/.test(ch)) return face === 'serif' ? 0.56 : 0.54
  return em(face)
}

export function estimateLineWidth(text: string, size: number, tracking: number, face: 'serif' | 'sans'): number {
  const chars = [...text]
  if (!chars.length) return 0
  let w = 0
  for (const ch of chars) w += size * glyphAdvance(ch, face)
  return w + Math.max(0, chars.length - 1) * tracking
}

export function lineBBox(
  text: string,
  size: number,
  tracking: number,
  face: 'serif' | 'sans',
  ax: number,
  baseline: number,
  anchor: 'middle' | 'start' | 'end',
  role: string,
): LineBox {
  const w = estimateLineWidth(text, size, tracking, face)
  const h = size * 0.78
  const x = anchor === 'middle' ? ax - w / 2 : anchor === 'end' ? ax - w : ax
  return { role, x, y: baseline - size * 0.72, w, h }
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}
