import type { DesignBrief, DesignSpec, Panel } from '../../types'
import { Ledger } from './text'
import type { DesignDirection } from './types'

export type LayoutCtx = {
  panel: Panel
  w: number
  h: number
  d: DesignDirection
  copy: DesignSpec['copy']
  brief: DesignBrief
  uid: string
  ledger: Ledger
  paoMonths: string
  wrapSeam: boolean
  /** The dieline carries a utility back (labelBack / legal-back) — fronts may drop legal copy. */
  hasBack: boolean
}

export function makeCtx(panel: Panel, d: DesignDirection, copy: DesignSpec['copy'], brief: DesignBrief, uid: string, paoMonths: string, wrapSeam = false, hasBack = false): LayoutCtx {
  const product = copy.product.trim() || d.categoryLine
  return { panel, w: panel.w, h: panel.h, d, copy: { ...copy, product }, brief, uid, ledger: new Ledger(panel), paoMonths, wrapSeam, hasBack }
}

/** Landscape face: wider than tall by a clear margin. Layouts switch to two columns. */
export function isLandscape(w: number, h: number): boolean {
  return w >= h * 1.15
}

/** Tiny face (small jar / sachet label): drop secondary anatomy. */
export function isTiny(w: number, h: number): boolean {
  return Math.min(w, h) < 50
}

/** Margin scaled to the face: 6% of the short side, clamped 2.6–7 mm. */
export function marginFor(w: number, h: number): number {
  return Math.max(2.6, Math.min(7, Math.min(w, h) * 0.065))
}

/** "İstanbul" from "Örnek Mah. No:1, 34000 İstanbul, TR" — sample city line for lockups. */
export function cityLine(brief: DesignBrief): string {
  const addr = brief.manufacturerAddress || ''
  const m = addr.match(/\d{5}\s+([A-Za-zÇĞİÖŞÜçğıöşü]+)/)
  const city = m?.[1] ?? 'İstanbul'
  return city.toLocaleUpperCase('tr')
}

export function seamMark(w: number, h: number, color: string): string {
  const x = w - 1.6
  let ticks = ''
  for (let i = 0; i <= 5; i++) {
    const y = 2.5 + ((h - 5) * i) / 5
    ticks += `<line x1="${(x - 0.8).toFixed(2)}" y1="${y.toFixed(2)}" x2="${(x + 0.4).toFixed(2)}" y2="${y.toFixed(2)}" stroke="${color}" stroke-opacity="0.35" stroke-width="0.1" />`
  }
  return `<g data-art="seam"><line x1="${x.toFixed(2)}" y1="2.5" x2="${x.toFixed(2)}" y2="${(h - 2.5).toFixed(2)}" stroke="${color}" stroke-opacity="0.3" stroke-width="0.12" stroke-dasharray="0.8 0.6" />${ticks}</g>`
}
