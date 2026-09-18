import type { DesignBrief, DesignSpec, Panel } from '../../types'
import { categoryBesideProduct } from './copyBank'
import { Ledger } from './text'
import { speciesFor, type Species } from './species'
import {
  clampStudioScale,
  DEFAULT_STUDIO_IDENTITY,
  type DesignDirection,
  type StudioIdentity,
} from './types'

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
  logoHref?: string
  logoScale: number
  titleScale: number
  /** Which plant the scenery depicts — resolved from the product, not the archetype. */
  species: Species
}

export function makeCtx(
  panel: Panel,
  d: DesignDirection,
  copy: DesignSpec['copy'],
  brief: DesignBrief,
  uid: string,
  paoMonths: string,
  wrapSeam = false,
  hasBack = false,
  identity: Partial<StudioIdentity> = {},
): LayoutCtx {
  const product = copy.product.trim() || d.categoryLine
  const href = identity.logoHref?.trim()
  return {
    panel,
    w: panel.w,
    h: panel.h,
    d,
    copy: { ...copy, product },
    brief,
    uid,
    ledger: new Ledger(panel),
    paoMonths,
    wrapSeam,
    hasBack,
    logoHref: href || undefined,
    logoScale: clampStudioScale(identity.logoScale, DEFAULT_STUDIO_IDENTITY.logoScale),
    titleScale: clampStudioScale(identity.titleScale, DEFAULT_STUDIO_IDENTITY.titleScale),
    species: speciesFor({ sector: brief.sector, subProduct: brief.subProduct, productName: product, story: brief.story }),
  }
}

/** Spread onto lockup/stack opts so identity reaches anatomy without extra positional args. */
export function withIdent<const T extends object>(ctx: LayoutCtx, opts: T): T & StudioIdentity {
  return { ...opts, logoHref: ctx.logoHref, logoScale: ctx.logoScale, titleScale: ctx.titleScale }
}

export function identOf(ctx: LayoutCtx): StudioIdentity {
  return { logoHref: ctx.logoHref, logoScale: ctx.logoScale, titleScale: ctx.titleScale }
}

/** Landscape face: wider than tall by a clear margin. Layouts switch to two columns. */
export function isLandscape(w: number, h: number): boolean {
  return w >= h * 1.15
}

/**
 * A round face, read off the geometry rather than off a flag.
 *
 * Every rectangular panel here is four points; a disc is sampled into many. Asking the panel is
 * better than threading a structure id down to the painter, because it stays true for any future
 * shape that happens to be round — and a painter that believes a disc is a rectangle prints over
 * the knife at the top and bottom, where the chord is barely half the bounding box.
 */
export function isDisc(panel: Panel): boolean {
  return panel.polygon.length > 8 && Math.abs(panel.w - panel.h) < 0.01
}

/** A curved cut — disc or oval. Both punish a rectangular layout the same way and share a painter. */
export function isRound(panel: Panel): boolean {
  return panel.polygon.length > 8
}

/**
 * How wide the panel actually is at a given panel-local y, read off the cut line.
 *
 * A plain rectangle answers its full width, so a caller can use this unconditionally. A rounded
 * corner or a curved rim answers less, which is the point: a line placed a millimetre from the
 * bottom edge of a hang tag sits where the corner radius has already taken the width away — the
 * tag's producer line was set to the full width there and crossed the cut by 1.7 mm.
 */
export function spanAt(panel: Panel, y: number): { left: number; right: number; width: number } {
  const poly = panel.polygon
  const full = { left: 0, right: panel.w, width: panel.w }
  if (!poly || poly.length < 3) return full
  let lo = Infinity
  let hi = -Infinity
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const ay = poly[i].y - panel.y
    const by = poly[j].y - panel.y
    if (ay > y === by > y) continue
    const t = (y - ay) / (by - ay)
    const x = poly[i].x - panel.x + t * (poly[j].x - poly[i].x)
    lo = Math.min(lo, x)
    hi = Math.max(hi, x)
  }
  return Number.isFinite(lo) && hi > lo ? { left: lo, right: hi, width: hi - lo } : full
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

/** Category line under the product; empty when the product already is that line. */
export function categoryCaption(ctx: LayoutCtx): string {
  return categoryBesideProduct(ctx.copy.product, ctx.d.categoryLine)
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
