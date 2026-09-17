/**
 * Anatomy painters — the reusable parts every reference-level surface is built from.
 * Panel-local coordinates. Each painter records what it placed in the Ledger so the
 * studio preflight can reason about collisions and type sizes without parsing SVG.
 */
import { barcodeSvg } from '../barcode'
import { iconEmark, iconFlammable, iconGlassFork, iconKeepAway, iconKeepDry, iconLeaflet, iconPao, iconRecycle, iconThisWayUp, iconWeee } from '../artwork/icons'
import { perfumeAssetMark } from '../marks/perfumeAssets'
import { escapeSvg } from '../artwork/svgGeometry'
import { mulberry32 } from './backgrounds'
import { darken, isDark, lighten, mix } from './color'
import { categoryBesideProduct } from './copyBank'
import { Ledger, STUDIO_TYPE_FLOOR_MM, fitSize, pairingFaces, textEl, textWidth, typeSize, wrapByWidth, type Face } from './text'
import {
  clampStudioScale,
  type BenefitIcon,
  type BenefitItem,
  type DesignDirection,
  type StudioIdentity,
  type StudioPalette,
} from './types'

const f = (n: number) => (Math.round(n * 100) / 100).toString()

export type MarkKind = 'drop' | 'mountain' | 'wings' | 'monogram' | 'leaf' | 'crest' | 'bolt' | 'bee'

/* ------------------------------------------------------------- benefit icons */

const ICON_PATH: Record<BenefitIcon, string> = {
  leaf: '<path d="M6 2.1C3.2 4.2 2.6 7.6 4.6 9.5c1.4 1.3 3.4 1.3 4.8 0 1.9-1.9 1.2-5.3-1.5-7.4Z"/><path d="M6 3.3v6.2"/>',
  drop: '<path d="M6 2.45C6 2.45 3.55 6.2 3.55 8.05a2.45 2.45 0 0 0 4.9 0C8.45 6.2 6 2.45 6 2.45Z"/>',
  sun: '<circle cx="6" cy="6" r="1.65"/><path d="M6 2.35v1.15M6 8.5v1.15M2.35 6h1.15M8.5 6h1.15M3.4 3.4l.8.8M7.8 7.8l.8.8M8.6 3.4l-.8.8M3.4 8.6l.8-.8"/>',
  mountain: '<path d="M1.9 9.15 4.55 4.55 7.05 8.05 8.25 6.35 10.2 9.15Z"/><path d="M3.9 5.7l.65.6.7-.9"/>',
  bee: '<ellipse cx="6" cy="6.7" rx="1.85" ry="2.35"/><path d="M4.15 5.35C2.7 3.55 4.55 2.7 5.55 4.15"/><path d="M7.85 5.35C9.3 3.55 7.45 2.7 6.45 4.15"/><path d="M4.3 6.6h3.4M4.5 7.8h3"/>',
  jar: '<path d="M4 4.55h4v5.3H4Z"/><path d="M4.55 3.25h2.9v1.3H4.55Z"/>',
  check: '<circle cx="6" cy="6" r="3.6"/><path d="M4.2 6.1 5.5 7.4 7.9 4.7"/>',
  shield: '<path d="M6 2.3 9.2 3.5v2.7c0 2-1.4 3.4-3.2 4.2C4.2 9.6 2.8 8.2 2.8 6.2V3.5Z"/><path d="M4.6 6.1l1 1 1.9-2.1"/>',
  bolt: '<path d="M6.6 2.2 3.6 6.6h2.3L5.4 9.8l3-4.4H6.1Z"/>',
  flask: '<path d="M4.9 2.4h2.2M5.3 2.4v2.6L2.9 9.1c-.3.5.1 1 .6 1h5c.5 0 .9-.5.6-1L6.7 5V2.4"/><path d="M4.1 7.4h3.8"/>',
  heart: '<path d="M6 9.4 3 6.5C1.9 5.4 2.1 3.6 3.5 3.1c.9-.3 1.9.1 2.5.9.6-.8 1.6-1.2 2.5-.9 1.4.5 1.6 2.3.5 3.4Z"/>',
  star: '<path d="M6 2.4 7.1 4.8 9.7 5.1 7.8 6.9 8.3 9.5 6 8.2 3.7 9.5 4.2 6.9 2.3 5.1 4.9 4.8Z"/>',
}

export function benefitIcon(kind: BenefitIcon, cx: number, cy: number, r: number, color: string, ring = true): string {
  const s = r * 1.5
  const ringEl = ring ? `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="none" stroke="${color}" stroke-width="${f(Math.max(0.16, r * 0.07))}" />` : ''
  return `<g data-art="benefit-icon" data-icon="${kind}">${ringEl}<g transform="translate(${f(cx - s / 2)} ${f(cy - s / 2)}) scale(${f(s / 12)})" fill="none" stroke="${color}" stroke-width="0.85" stroke-linecap="round" stroke-linejoin="round">${ICON_PATH[kind]}</g></g>`
}

/* --------------------------------------------------------------- brand mark */

export function brandMark(kind: MarkKind, cx: number, cy: number, r: number, color: string, initials = 'A'): string {
  const sw = Math.max(0.18, r * 0.09)
  switch (kind) {
    case 'drop':
      return `<g data-art="brand-mark" data-mark="drop"><path d="M${f(cx)} ${f(cy - r)} C${f(cx + r * 0.9)} ${f(cy - r * 0.05)} ${f(cx + r * 0.95)} ${f(cy + r * 0.45)} ${f(cx)} ${f(cy + r)} C${f(cx - r * 0.95)} ${f(cy + r * 0.45)} ${f(cx - r * 0.9)} ${f(cy - r * 0.05)} ${f(cx)} ${f(cy - r)}Z" fill="${color}" /><path d="M${f(cx - r * 0.28)} ${f(cy - r * 0.25)} C${f(cx + r * 0.3)} ${f(cy - r * 0.35)} ${f(cx + r * 0.3)} ${f(cy + r * 0.2)} ${f(cx - r * 0.15)} ${f(cy + r * 0.3)} C${f(cx - r * 0.45)} ${f(cy + r * 0.38)} ${f(cx - r * 0.4)} ${f(cy + r * 0.55)} ${f(cx + r * 0.1)} ${f(cy + r * 0.62)}" fill="none" stroke="${isDark(color) ? '#f4efe6' : '#171512'}" stroke-opacity="0.9" stroke-width="${f(sw)}" stroke-linecap="round" /></g>`
    case 'mountain':
      return `<g data-art="brand-mark" data-mark="mountain" fill="none" stroke="${color}" stroke-width="${f(sw)}" stroke-linejoin="round"><path d="M${f(cx - r)} ${f(cy + r * 0.55)} L${f(cx - r * 0.35)} ${f(cy - r * 0.6)} L${f(cx)} ${f(cy - r * 0.05)} L${f(cx + r * 0.3)} ${f(cy - r * 0.75)} L${f(cx + r)} ${f(cy + r * 0.55)}Z" /><path d="M${f(cx - r * 0.5)} ${f(cy - r * 0.32)} l${f(r * 0.15)} ${f(r * 0.18)} l${f(r * 0.15)} ${f(-r * 0.22)}" /><path d="M${f(cx + r * 0.12)} ${f(cy - r * 0.42)} l${f(r * 0.18)} ${f(r * 0.2)} l${f(r * 0.16)} ${f(-r * 0.25)}" /></g>`
    case 'wings': {
      const wing = (dir: 1 | -1) =>
        `<path d="M${f(cx)} ${f(cy + r * 0.2)} C${f(cx + dir * r * 0.5)} ${f(cy - r * 0.2)} ${f(cx + dir * r * 0.8)} ${f(cy - r * 0.9)} ${f(cx + dir * r * 1.3)} ${f(cy - r)} C${f(cx + dir * r * 1.1)} ${f(cy - r * 0.55)} ${f(cx + dir * r * 1.0)} ${f(cy - r * 0.3)} ${f(cx + dir * r * 0.75)} ${f(cy - r * 0.15)} C${f(cx + dir * r * 0.95)} ${f(cy + r * 0.05)} ${f(cx + dir * r * 0.8)} ${f(cy + r * 0.3)} ${f(cx + dir * r * 0.55)} ${f(cy + r * 0.3)} C${f(cx + dir * r * 0.65)} ${f(cy + r * 0.45)} ${f(cx + dir * r * 0.4)} ${f(cy + r * 0.55)} ${f(cx)} ${f(cy + r * 0.45)}Z" fill="${color}" />`
      return `<g data-art="brand-mark" data-mark="wings">${wing(1)}${wing(-1)}<circle cx="${f(cx)}" cy="${f(cy + r * 0.05)}" r="${f(r * 0.22)}" fill="${color}" /></g>`
    }
    case 'monogram': {
      const text = initials.slice(0, 2).toLocaleUpperCase('en-US')
      const size = r * 1.9
      return `<g data-art="brand-mark" data-mark="monogram">${textEl({ x: cx, y: cy + size * 0.36, text, size, face: 'serif', fill: color, anchor: 'middle', tracking: -size * 0.04 })}</g>`
    }
    case 'leaf':
      return `<g data-art="brand-mark" data-mark="leaf"><path d="M${f(cx)} ${f(cy - r)} C${f(cx + r * 1.1)} ${f(cy - r * 0.5)} ${f(cx + r * 0.9)} ${f(cy + r * 0.8)} ${f(cx - r * 0.1)} ${f(cy + r)} C${f(cx - r * 1.05)} ${f(cy + r * 0.4)} ${f(cx - r * 0.9)} ${f(cy - r * 0.6)} ${f(cx)} ${f(cy - r)}Z" fill="${color}" /><path d="M${f(cx - r * 0.05)} ${f(cy + r * 0.9)} L${f(cx + r * 0.15)} ${f(cy - r * 0.7)}" stroke="${isDark(color) ? '#f4efe6' : '#171512'}" stroke-opacity="0.8" stroke-width="${f(sw)}" stroke-linecap="round" /></g>`
    case 'crest':
      return `<g data-art="brand-mark" data-mark="crest" fill="none" stroke="${color}" stroke-width="${f(sw)}"><path d="M${f(cx - r)} ${f(cy - r * 0.75)} L${f(cx + r)} ${f(cy - r * 0.75)} L${f(cx)} ${f(cy + r)}Z" />${textEl({ x: cx, y: cy - r * 0.02, text: initials.slice(0, 1).toLocaleUpperCase('en-US'), size: r * 0.9, face: 'serif', fill: color, anchor: 'middle' })}</g>`
    case 'bolt':
      return `<g data-art="brand-mark" data-mark="bolt"><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="none" stroke="${color}" stroke-width="${f(sw)}" /><path d="M${f(cx + r * 0.15)} ${f(cy - r * 0.62)} L${f(cx - r * 0.4)} ${f(cy + r * 0.1)} L${f(cx)} ${f(cy + r * 0.1)} L${f(cx - r * 0.15)} ${f(cy + r * 0.62)} L${f(cx + r * 0.4)} ${f(cy - r * 0.1)} L${f(cx)} ${f(cy - r * 0.1)}Z" fill="${color}" /></g>`
    case 'bee':
    default:
      return benefitIcon('bee', cx, cy, r, color, false)
  }
}

/** Below this radius the slot stays a vector mark even when a user logo is present. */
export const STUDIO_MIN_LOGO_R = 2.5

function escapeHref(href: string): string {
  return href.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
}

/** Centered user logo. Replaces the vector monogram/mark when the brief carries a file. */
export function brandLogo(cx: number, cy: number, r: number, href: string): string {
  const s = r * 2
  return `<image data-art="brand-logo" href="${escapeHref(href)}" x="${f(cx - s / 2)}" y="${f(cy - s / 2)}" width="${f(s)}" height="${f(s)}" preserveAspectRatio="xMidYMid meet" />`
}

/** Vector mark, or the user logo when href is present and the slot is large enough. */
export function paintMark(
  kind: MarkKind,
  cx: number,
  cy: number,
  r: number,
  color: string,
  initials = 'A',
  identity?: Partial<StudioIdentity>,
): string {
  const href = identity?.logoHref?.trim()
  const scale = clampStudioScale(identity?.logoScale)
  if (href && r >= STUDIO_MIN_LOGO_R) return brandLogo(cx, cy, r * scale, href)
  return brandMark(kind, cx, cy, r, color, initials)
}

export function markKindFor(direction: DesignDirection): MarkKind {
  const s = direction.sector
  if (s === 'beverage') return 'drop'
  if (s === 'food') return direction.background.startsWith('landscape') ? 'mountain' : 'bee'
  if (s === 'health' || s === 'baby') return 'wings'
  if (s === 'electronics') return 'bolt'
  if (s === 'cleaning') return 'drop'
  if (s === 'perfume') return direction.archetype === 'ink-wash' || direction.archetype === 'ink-panel' ? 'monogram' : 'crest'
  if (s === 'cream' || s === 'serum') return direction.archetype === 'diagonal-split' || direction.archetype === 'diagonal-tech' ? 'monogram' : 'leaf'
  return 'monogram'
}

/* ------------------------------------------------------------------ frames */

export function thinDoubleFrame(w: number, h: number, inset: number, color: string, opacity = 0.9): string {
  const gap = Math.max(0.5, inset * 0.28)
  return `<g data-art="frame" data-frame="thin-double" fill="none" stroke="${color}" stroke-opacity="${f(opacity)}"><rect x="${f(inset)}" y="${f(inset)}" width="${f(w - inset * 2)}" height="${f(h - inset * 2)}" stroke-width="0.32" /><rect x="${f(inset + gap)}" y="${f(inset + gap)}" width="${f(w - (inset + gap) * 2)}" height="${f(h - (inset + gap) * 2)}" stroke-width="0.14" /></g>`
}

export function cornerBrackets(x: number, y: number, w: number, h: number, color: string, arm: number, sw = 0.36): string {
  return `<g data-art="frame" data-frame="corner-brackets" fill="none" stroke="${color}" stroke-width="${f(sw)}" stroke-linecap="square"><path d="M${f(x)} ${f(y + arm)} V${f(y)} H${f(x + arm)}" /><path d="M${f(x + w)} ${f(y + h - arm)} V${f(y + h)} H${f(x + w - arm)}" /></g>`
}

export function hairline(x1: number, y: number, x2: number, color: string, opacity = 0.8, sw = 0.22): string {
  return `<line x1="${f(x1)}" y1="${f(y)}" x2="${f(x2)}" y2="${f(y)}" stroke="${color}" stroke-opacity="${f(opacity)}" stroke-width="${f(sw)}" />`
}

/* ------------------------------------------------------------------ lockups */

export type LockupResult = { markup: string; bottom: number; top: number }

/** Stacked brand lockup: optional mark, brand, tracked sub line. Centered on cx. */
export function stackedLockup(
  ledger: Ledger,
  d: DesignDirection,
  cx: number,
  top: number,
  maxW: number,
  brand: string,
  sub: string,
  opts: {
    color?: string
    mark?: boolean
    markColor?: string
    brandMax?: number
    brandMin?: number
    markKind?: MarkKind
    logoHref?: string
    logoScale?: number
    titleScale?: number
    subEdit?: string
  } = {},
): LockupResult {
  const faces = pairingFaces(d.typePairing)
  const color = opts.color ?? d.palette.ink
  const brandUpper = d.typePairing === 'script-accent/sans-heavy' ? brand : brand.toLocaleUpperCase('tr')
  const tracking = d.typePairing === 'spaced-serif/spaced-sans' ? 0.16 : d.typePairing === 'serif-display/sans-meta' ? 0.08 : 0.02
  const titleScale = clampStudioScale(opts.titleScale)
  const brandMax = (opts.brandMax ?? Math.min(maxW * 0.16, 11)) * titleScale
  const size = fitSize(brandUpper, maxW, brandMax, (opts.brandMin ?? 2.4) * titleScale, faces.brand, tracking)
  let y = top
  let brandOut = ''
  const href = opts.logoHref?.trim()
  if (opts.mark || href) {
    const r = Math.max(2.2, size * 0.75)
    const paintLogo = Boolean(href && r >= STUDIO_MIN_LOGO_R)
    if (opts.mark || paintLogo) {
      const painted = paintLogo ? r * clampStudioScale(opts.logoScale) : r
      brandOut += paintMark(opts.markKind ?? markKindFor(d), cx, y + painted, r, opts.markColor ?? d.palette.accent, brand, opts)
      ledger.add('element', paintLogo ? 'brand-logo' : 'brand-mark', cx - painted * 1.3, y, painted * 2.6, painted * 2)
      y += painted * 2 + size * 0.55
    }
  }
  const baseline = y + size * 0.82
  brandOut += textEl({ x: cx, y: baseline, text: brandUpper, size, face: faces.brand, fill: color, anchor: 'middle', tracking: size * tracking })
  ledger.text('brand', cx, baseline, textWidth(brandUpper, size, faces.brand, size * tracking), size, 'middle')
  y = baseline + size * 0.32
  let subOut = ''
  if (sub) {
    const subSize = Math.max(1.5, Math.min(size * 0.3, 2.6))
    const subUpper = sub.toLocaleUpperCase('tr')
    const subBase = y + subSize
    const subTrack = subSize * 0.32
    const subW = textWidth(subUpper, subSize, faces.meta, subTrack)
    subOut = textEl({ x: cx, y: subBase, text: subUpper, size: subSize, face: faces.meta, fill: opts.markColor ?? d.palette.accent, anchor: 'middle', tracking: subTrack })
    ledger.text('brand-sub', cx, subBase, subW, subSize, 'middle')
    y = subBase + subSize * 0.4
  }
  if (opts.subEdit && subOut) {
    return {
      markup: `<g data-art="lockup" data-lockup="stacked"><g data-edit="brand">${brandOut}</g><g data-edit="${opts.subEdit}">${subOut}</g></g>`,
      bottom: y,
      top,
    }
  }
  return { markup: `<g data-art="lockup" data-lockup="stacked" data-edit="brand">${brandOut}${subOut}</g>`, bottom: y, top }
}

/** White rounded pill with the brand — woo.originals top-right. Returns the pill box. */
export function brandPill(
  ledger: Ledger,
  d: DesignDirection,
  right: number,
  top: number,
  brand: string,
  maxW: number,
  ident: Partial<StudioIdentity> = {},
): { markup: string; box: { x: number; y: number; w: number; h: number } } {
  const faces = pairingFaces(d.typePairing)
  const titleScale = clampStudioScale(ident.titleScale)
  const size = fitSize(brand, maxW - 6, 5.2 * titleScale, 2.2 * titleScale, 'sans-heavy', -0.02)
  const textW = textWidth(brand, size, 'sans-heavy', -size * 0.02)
  const padX = size * 0.9
  const w = textW + padX * 2
  const h = size * 1.9
  const x = right - w
  const rx = h / 2
  let markup = `<g data-art="lockup" data-lockup="pill" data-edit="brand"><rect x="${f(x)}" y="${f(top)}" width="${f(w)}" height="${f(h)}" rx="${f(rx)}" fill="${d.palette.card}" />${textEl({ x: x + w / 2, y: top + h * 0.68, text: brand, size, face: faces.brand === 'sans-heavy' ? 'sans-heavy' : faces.brand, fill: d.palette.cardInk, anchor: 'middle', tracking: -size * 0.02 })}</g>`
  ledger.add('container', 'brand-pill', x, top, w, h)
  ledger.text('brand', x + w / 2, top + h * 0.68, textW, size, 'middle')
  const href = ident.logoHref?.trim()
  if (href) {
    const r = (h / 2) * clampStudioScale(ident.logoScale)
    const cx = Math.max(r + 0.4, x - r - 1.2)
    const cy = top + h / 2
    markup = `${brandLogo(cx, cy, r, href)}${markup}`
    ledger.add('element', 'brand-logo', cx - r, cy - r, r * 2, r * 2)
  }
  return { markup, box: { x, y: top, w, h } }
}

/** Monogram + brand under it (Capelli Fellici right column). */
export function monogramLockup(
  ledger: Ledger,
  _d: DesignDirection,
  cx: number,
  top: number,
  brand: string,
  maxW: number,
  color: string,
  ident: Partial<StudioIdentity> = {},
  opts: { maxStackH?: number } = {},
): LockupResult {
  const initials = brand
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toLocaleUpperCase('en-US')
  const titleScale = clampStudioScale(ident.titleScale)
  const logoScale = clampStudioScale(ident.logoScale)
  const href = ident.logoHref?.trim()
  const rawMono = Math.min(maxW * 0.42, 16)
  const capped = opts.maxStackH != null ? Math.min(rawMono, opts.maxStackH * 0.42) : rawMono
  const monoSize = capped * (href ? logoScale : 1)
  const baseline = top + monoSize * 0.85
  let out = ''
  if (href) {
    const r = monoSize * 0.48
    out = brandLogo(cx, top + r, r, href)
    ledger.add('element', 'brand-logo', cx - r, top, r * 2, r * 2)
  } else {
    out = textEl({ x: cx, y: baseline, text: initials, size: monoSize, face: 'serif', fill: color, anchor: 'middle', tracking: -monoSize * 0.06 })
    ledger.text('monogram', cx, baseline, textWidth(initials, monoSize, 'serif', -monoSize * 0.06), monoSize, 'middle')
  }
  const brandSize = fitSize(brand.toLocaleUpperCase('tr'), maxW, 2.8 * titleScale, 1.6 * titleScale, 'sans', 0.3)
  const bBase = baseline + Math.max(brandSize * 2.35, monoSize * 0.38)
  const track = brandSize * 0.3
  out += textEl({ x: cx, y: bBase, text: brand.toLocaleUpperCase('tr'), size: brandSize, face: 'sans', fill: color, anchor: 'middle', tracking: track })
  ledger.text('brand', cx, bBase, textWidth(brand.toLocaleUpperCase('tr'), brandSize, 'sans', track), brandSize, 'middle')
  return { markup: `<g data-art="lockup" data-lockup="monogram" data-edit="brand">${out}</g>`, bottom: bBase + brandSize * 0.5, top }
}

/* -------------------------------------------------------------- product set */

export type ProductLines = { markup: string; bottom: number }

/** Script prefix + heavy product name + optional category line (Elite Brew / woo). */
export function productStack(
  ledger: Ledger,
  d: DesignDirection,
  cx: number,
  top: number,
  maxW: number,
  product: string,
  opts: {
    color?: string
    accent?: string
    prefix?: string
    category?: string
    max?: number
    anchor?: 'middle' | 'start'
    upper?: boolean
    titleScale?: number
    logoHref?: string
    logoScale?: number
  } = {},
): ProductLines {
  const faces = pairingFaces(d.typePairing)
  const color = opts.color ?? d.palette.ink
  const accent = opts.accent ?? d.palette.accent
  const anchor = opts.anchor ?? 'middle'
  const titleScale = clampStudioScale(opts.titleScale)
  const x = cx
  let y = top
  let out = ''
  if (opts.prefix) {
    const pSize = Math.min((opts.max ?? 8) * 0.78, 6.4) * titleScale
    const face: Face = faces.prefix
    const base = y + pSize * 0.9
    out += textEl({ x, y: base, text: opts.prefix, size: pSize, face, fill: accent, anchor, italic: face === 'serif-italic' })
    ledger.text('product-prefix', x, base, textWidth(opts.prefix, pSize, face), pSize, anchor)
    y = base + pSize * 0.3
  }
  const text = opts.upper === false ? product : product.toLocaleUpperCase('tr')
  const lines = wrapByWidth(text, maxW, 1, faces.product, 2).length > 1 && textWidth(text, (opts.max ?? 8) * titleScale, faces.product) > maxW ? splitTitle(text) : [text]
  const max = (opts.max ?? 8) * titleScale
  const size = Math.min(...lines.map((l) => fitSize(l, maxW, max, 2.6 * titleScale, faces.product, faces.product === 'sans-heavy' ? 0.02 : 0.06)))
  const track = size * (faces.product === 'sans-heavy' ? 0.02 : 0.06)
  for (const line of lines) {
    const base = y + size * 0.95
    out += textEl({ x, y: base, text: line, size, face: faces.product, fill: color, anchor, tracking: track })
    ledger.text('product', x, base, textWidth(line, size, faces.product, track), size, anchor)
    y = base + size * 0.22
  }
  const catLine = categoryBesideProduct(product, opts.category ?? '')
  if (catLine) {
    const cSize = Math.max(1.6, Math.min(size * 0.34, 3))
    const cTrack = cSize * 0.36
    const base = y + cSize * 1.45
    const cat = catLine.toLocaleUpperCase('tr')
    out += textEl({ x, y: base, text: cat, size: cSize, face: faces.meta, fill: accent, anchor, tracking: cTrack })
    ledger.text('category', x, base, textWidth(cat, cSize, faces.meta, cTrack), cSize, anchor)
    y = base + cSize * 0.4
  }
  return { markup: `<g data-art="product" data-edit="product">${out}</g>`, bottom: y }
}

function splitTitle(text: string): string[] {
  const words = text.split(/\s+/)
  if (words.length < 2) return [text]
  const mid = Math.ceil(words.length / 2)
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')]
}

/* -------------------------------------------------------------------- cards */

export function titleCard(
  ledger: Ledger,
  d: DesignDirection,
  x: number,
  y: number,
  w: number,
  product: string,
  category: string,
  opts: { prefix?: string; titleScale?: number; logoHref?: string; logoScale?: number } = {},
): { markup: string; bottom: number } {
  const pad = Math.max(2.2, w * 0.07)
  const inner = w - pad * 2
  const stackOpts = {
    color: d.palette.cardInk,
    accent: d.palette.cardInk,
    prefix: opts.prefix,
    category,
    max: Math.min(9, inner * 0.16),
    titleScale: opts.titleScale,
    logoHref: opts.logoHref,
    logoScale: opts.logoScale,
  }
  const probe = new Ledger(ledger.panel)
  const stack = productStack(probe, d, x + w / 2, y + pad, inner, product, stackOpts)
  const h = stack.bottom - y + pad * 0.9
  const rx = Math.min(3, w * 0.08)
  const card = `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(rx)}" fill="${d.palette.card}" />`
  ledger.add('container', 'title-card', x, y, w, h)
  const real = productStack(ledger, d, x + w / 2, y + pad, inner, product, stackOpts)
  return { markup: `<g data-art="title-card">${card}${real.markup}</g>`, bottom: y + h }
}

export function claimBand(ledger: Ledger, d: DesignDirection, x: number, y: number, w: number, text: string, fill?: string, ink?: string, optsEdit?: string): { markup: string; bottom: number } {
  const h = Math.max(4.2, w * 0.11)
  const size = fitSize(text, w - 4, h * 0.42, 1.5, 'sans-heavy', 0.12)
  const track = size * 0.12
  const bg = fill ?? darken(d.palette.accent2, 0.12)
  const color = ink ?? d.palette.card
  const base = y + h * 0.64
  const edit = optsEdit ? ` data-edit="${optsEdit}"` : ''
  const markup = `<g data-art="claim-band"${edit}><rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${bg}" />${textEl({ x: x + w / 2, y: base, text, size, face: 'sans-heavy', fill: color, anchor: 'middle', tracking: track })}</g>`
  ledger.add('container', 'claim-band', x, y, w, h)
  ledger.text('claim', x + w / 2, base, textWidth(text, size, 'sans-heavy', track), size, 'middle')
  return { markup, bottom: y + h }
}

/** "PROFESSIONAL · STEP 1" style chip: label on a pill, last token inverted. */
export function chip(ledger: Ledger, d: DesignDirection, x: number, y: number, text: string, opts: { color?: string; fill?: string; size?: number; anchor?: 'start' | 'middle'; edit?: string } = {}): { markup: string; w: number; h: number } {
  const size = opts.size ?? 1.9
  const color = opts.color ?? d.palette.ink
  const fill = opts.fill ?? (opts.edit ? 'transparent' : 'none')
  const track = size * 0.14
  const textW = textWidth(text, size, 'sans-heavy', track)
  const padX = size * 0.9
  const w = textW + padX * 2
  const h = size * 1.75
  const left = opts.anchor === 'middle' ? x - w / 2 : x
  const edit = opts.edit ? ` data-edit="${opts.edit}"` : ''
  const markup = `<g data-art="chip"${edit}><rect x="${f(left)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(h / 2)}" fill="${fill}" stroke="${color}" stroke-width="0.24" />${textEl({ x: left + w / 2, y: y + h * 0.66, text, size, face: 'sans-heavy', fill: color, anchor: 'middle', tracking: track })}</g>`
  ledger.add('container', 'chip', left, y, w, h)
  ledger.text('chip-text', left + w / 2, y + h * 0.66, textW, size, 'middle')
  return { markup, w, h }
}

/** Outlined "PREMIUM QUALITY" badge with tiny sub line. */
export function qualityBadge(ledger: Ledger, _d: DesignDirection, cx: number, y: number, text: string, sub: string, color: string): { markup: string; bottom: number } {
  const size = 2.1
  const track = size * 0.16
  const textW = textWidth(text, size, 'sans-heavy', track)
  const w = textW + size * 2.4
  const h = size * 2.2
  const x = cx - w / 2
  let markup = `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(h * 0.3)}" fill="none" stroke="${color}" stroke-width="0.3" />`
  markup += textEl({ x: cx, y: y + h * 0.58, text, size, face: 'sans-heavy', fill: color, anchor: 'middle', tracking: track })
  ledger.add('container', 'quality-badge', x, y, w, h)
  ledger.text('badge-text', cx, y + h * 0.58, textW, size, 'middle')
  if (sub) {
    const s = 1.1
    markup += textEl({ x: cx, y: y + h * 0.88, text: sub, size: s, face: 'sans', fill: color, anchor: 'middle', tracking: s * 0.3, opacity: 0.85 })
  }
  return { markup: `<g data-art="quality-badge">${markup}</g>`, bottom: y + h }
}

/* ---------------------------------------------------------------- benefits */

export function benefitRow(ledger: Ledger, _d: DesignDirection, x: number, y: number, w: number, items: BenefitItem[], color: string, opts: { labelColor?: string; r?: number } = {}): { markup: string; bottom: number } {
  const n = Math.max(1, items.length)
  const cell = w / n
  const r = opts.r ?? Math.min(cell * 0.22, 4.2)
  const labelSize = typeSize(Math.min(r * 0.52, 2.1))
  let out = ''
  let bottom = y
  items.forEach((item, i) => {
    const cx = x + cell * (i + 0.5)
    const cy = y + r
    out += benefitIcon(item.icon, cx, cy, r, color)
    ledger.add('element', `benefit-${item.icon}`, cx - r, y, r * 2, r * 2)
    const lines = wrapByWidth(item.label.toLocaleUpperCase('tr'), cell - 1.5, labelSize, 'sans', 2, labelSize * 0.08)
    let ly = cy + r + labelSize * 1.5
    for (const line of lines) {
      out += textEl({ x: cx, y: ly, text: line, size: labelSize, face: 'sans', fill: opts.labelColor ?? color, anchor: 'middle', tracking: labelSize * 0.08 })
      ledger.text('benefit-label', cx, ly, textWidth(line, labelSize, 'sans', labelSize * 0.08), labelSize, 'middle')
      ly += labelSize * 1.25
    }
    bottom = Math.max(bottom, ly - labelSize * 0.6)
  })
  return { markup: `<g data-art="benefit-row">${out}</g>`, bottom }
}

export function benefitColumn(ledger: Ledger, _d: DesignDirection, x: number, y: number, w: number, items: BenefitItem[], color: string, gap = 2.4, maxBottom = Infinity): { markup: string; bottom: number } {
  const r = Math.min(w * 0.14, 3.6)
  const labelSize = typeSize(Math.min(r * 0.6, 2.2))
  let out = ''
  let cy = y + r
  for (const item of items) {
    const lines = wrapByWidth(item.label.toLocaleUpperCase('tr'), w, labelSize, 'sans', 2, labelSize * 0.1)
    // Skip items that would run past the reserved bottom edge.
    if (cy + r + labelSize * 1.4 + (lines.length - 1) * labelSize * 1.25 > maxBottom) break
    out += benefitIcon(item.icon, x + w / 2, cy, r, color)
    ledger.add('element', `benefit-${item.icon}`, x + w / 2 - r, cy - r, r * 2, r * 2)
    let ly = cy + r + labelSize * 1.4
    for (const line of lines) {
      out += textEl({ x: x + w / 2, y: ly, text: line, size: labelSize, face: 'sans', fill: color, anchor: 'middle', tracking: labelSize * 0.1 })
      ledger.text('benefit-label', x + w / 2, ly, textWidth(line, labelSize, 'sans', labelSize * 0.1), labelSize, 'middle')
      ly += labelSize * 1.25
    }
    cy = ly + gap + r
  }
  return { markup: `<g data-art="benefit-column">${out}</g>`, bottom: cy - r - gap }
}

/* ---------------------------------------------------------------- text blocks */

export type Section = { title: string; body: string; edit?: string }

/** Readable legal type that still clips inside `room` instead of colliding with the footer. */
export function legalTypeSize(panelW: number, room: number, kind: 'box' | 'label' | 'aside' = 'box'): number {
  // Legal copy is the text most likely to be read under bad light — it never goes below the floor.
  const cap = Math.max(kind === 'label' ? 1.95 : kind === 'aside' ? 1.7 : 1.85, STUDIO_TYPE_FLOOR_MM)
  const floor = typeSize(kind === 'aside' ? 1.3 : kind === 'label' ? 1.45 : 1.4)
  const byWidth = panelW * (kind === 'label' ? 0.023 : kind === 'aside' ? 0.021 : 0.024)
  const byRoom = Math.max(0, room) * (kind === 'aside' ? 0.16 : 0.12)
  return Math.max(floor, Math.min(cap, byWidth, byRoom > 0 ? byRoom : floor))
}

/** Small legal column: bold spaced header + wrapped body, stacked. Returns the bottom edge. */
export function legalColumn(
  ledger: Ledger,
  x: number,
  y: number,
  w: number,
  maxBottom: number,
  sections: Section[],
  color: string,
  opts: { size?: number; titleColor?: string; anchor?: 'start' | 'middle'; maxLines?: number } = {},
): { markup: string; bottom: number } {
  const size = opts.size ?? 1.7
  const lineH = size * 1.32
  const anchor = opts.anchor ?? 'start'
  const tx = anchor === 'middle' ? x + w / 2 : x
  let out = ''
  let cy = y
  for (const s of sections) {
    if (!s.body.trim()) continue
    if (cy + lineH * 2 > maxBottom) break
    let section = ''
    if (s.title) {
      const tSize = size * 1.05
      const track = tSize * 0.24
      const base = cy + tSize
      section += textEl({ x: tx, y: base, text: s.title.toLocaleUpperCase('tr'), size: tSize, face: 'sans-heavy', fill: opts.titleColor ?? color, anchor, tracking: track })
      ledger.text('legal-title', tx, base, textWidth(s.title.toLocaleUpperCase('tr'), tSize, 'sans-heavy', track), tSize, anchor)
      cy = base + size * 0.55
    }
    const room = Math.max(1, Math.floor((maxBottom - cy) / lineH))
    const lines = wrapByWidth(s.body, w, size, 'sans', Math.min(opts.maxLines ?? 12, room))
    for (const line of lines) {
      const base = cy + size
      section += textEl({ x: tx, y: base, text: line, size, face: 'sans', fill: color, anchor, weight: 600 })
      ledger.text('legal', tx, base, textWidth(line, size, 'sans'), size, anchor)
      cy = base + size * 0.36
    }
    out += s.edit ? `<g data-edit="${s.edit}">${section}</g>` : section
    cy += size * 1.1
  }
  return { markup: `<g data-art="legal-column">${out}</g>`, bottom: cy }
}

/**
 * How many paragraph lines fit between `top` and `limit`, capped at `max`.
 * Layouts call this before `paragraph` so a growing block never runs into a footer that is
 * anchored to the panel edge (net quantity, pictogram row).
 */
export function linesThatFit(top: number, limit: number, size: number, max: number): number {
  const room = limit - top
  if (room <= 0) return 0
  return Math.max(0, Math.min(max, Math.floor(room / (size * 1.45))))
}

export function paragraph(ledger: Ledger, x: number, y: number, w: number, text: string, size: number, face: Face, color: string, maxLines: number, anchor: 'start' | 'middle' = 'middle', italic = false, edit?: string): { markup: string; bottom: number } {
  const lines = wrapByWidth(text, w, size, face, maxLines)
  const tx = anchor === 'middle' ? x + w / 2 : x
  let out = ''
  let cy = y
  for (const line of lines) {
    const base = cy + size
    out += textEl({ x: tx, y: base, text: line, size, face, fill: color, anchor, italic })
    ledger.text('paragraph', tx, base, textWidth(line, size, face), size, anchor)
    cy = base + size * 0.45
  }
  return { markup: `<g data-art="paragraph"${edit ? ` data-edit="${edit}"` : ''}>${out}</g>`, bottom: cy }
}

/** Spaced caps line, e.g. tagline. */
export function spacedLine(ledger: Ledger, cx: number, baseline: number, text: string, size: number, color: string, maxW: number, anchor: 'middle' | 'start' | 'end' = 'middle', face: Face = 'sans', edit?: string): string {
  const upper = text.toLocaleUpperCase('tr')
  const s = fitSize(upper, maxW, size, 1.3, face, size * 0.34)
  const track = s * 0.34
  ledger.text('spaced', cx, baseline, textWidth(upper, s, face, track), s, anchor)
  return textEl({ x: cx, y: baseline, text: upper, size: s, face, fill: color, anchor, tracking: track, extra: edit ? `data-edit="${edit}"` : undefined })
}

/** Stacked manifesto words: WILD / CONFIDENT / AUTHENTIC / YOU with a short rule. */
export function stackedWords(ledger: Ledger, cx: number, top: number, words: string[], size: number, color: string, maxW: number): { markup: string; bottom: number } {
  let out = ''
  let cy = top
  const s = Math.min(...words.map((w) => fitSize(w.toLocaleUpperCase('tr'), maxW, size, 1.4, 'sans', size * 0.34)))
  for (const w of words) {
    const base = cy + s
    out += spacedLine(ledger, cx, base, w, s, color, maxW)
    cy = base + s * 1.1
  }
  out += hairline(cx - maxW * 0.18, cy + s * 0.4, cx + maxW * 0.18, color, 0.8, 0.22)
  return { markup: `<g data-art="manifesto">${out}</g>`, bottom: cy + s }
}

/** Vertical (rotated) brand along a spine. Always includes rotate(-90) — the box gate reads it. */
export function verticalBrand(ledger: Ledger, cx: number, cy: number, text: string, size: number, color: string, maxLen: number, face: Face = 'sans'): string {
  const upper = text.toLocaleUpperCase('tr')
  const s = fitSize(upper, maxLen, size, 1.6, face, size * 0.3)
  const track = s * 0.3
  const len = textWidth(upper, s, face, track)
  ledger.add('text', 'vertical-brand', cx - s * 0.6, cy - len / 2, s * 1.2, len, s)
  return `<g data-art="spine" transform="translate(${f(cx)} ${f(cy)}) rotate(-90)">${textEl({ x: 0, y: s * 0.35, text: upper, size: s, face, fill: color, anchor: 'middle', tracking: track })}</g>`
}

/* ----------------------------------------------------------------- utility */

export function netQuantity(ledger: Ledger, cx: number, baseline: number, text: string, size: number, color: string, anchor: 'middle' | 'start' | 'end' = 'middle'): string {
  if (!text) return ''
  ledger.text('net-quantity', cx, baseline, textWidth(text, size, 'sans', size * 0.06), size, anchor)
  return `<g data-art="net-quantity" data-edit="volume">${textEl({ x: cx, y: baseline, text, size, face: 'sans', fill: color, anchor, tracking: size * 0.06 })}</g>`
}

export type PictoKind = 'recycle' | 'pao' | 'flammable' | 'emark' | 'glassfork' | 'weee' | 'keepdry' | 'thiswayup' | 'keepaway' | 'leaflet'

export function pictogramsFor(d: DesignDirection): PictoKind[] {
  switch (d.sector) {
    case 'perfume':
      return ['flammable', 'pao', 'recycle']
    case 'cream':
    case 'serum':
    case 'baby':
      return ['pao', 'recycle']
    case 'food':
    case 'beverage':
      return ['emark', 'recycle', 'glassfork']
    case 'electronics':
      return ['weee', 'recycle', 'thiswayup', 'keepdry']
    case 'cleaning':
      return ['recycle', 'keepdry']
    case 'health':
      return ['recycle', 'keepdry']
    default:
      return ['recycle']
  }
}

/** Back / dieline strip: perfume uses the PARFUM İCON pack; other sectors keep their regulatory set. */
export function pictogramsForBack(d: DesignDirection): PictoKind[] {
  if (d.sector === 'perfume') return ['flammable', 'keepaway', 'pao', 'leaflet']
  return pictogramsFor(d)
}

function drawPicto(k: PictoKind, x: number, y: number, s: number, color: string, paoMonths: string, quality: boolean): string {
  if (quality) {
    if (k === 'flammable') return perfumeAssetMark('ic1', x, y, s, color, paoMonths)
    if (k === 'keepaway') return perfumeAssetMark('ic2', x, y, s, color, paoMonths)
    if (k === 'pao') return perfumeAssetMark('ic3', x, y, s, color, paoMonths)
    if (k === 'leaflet') return perfumeAssetMark('ic4', x, y, s, color, paoMonths)
  }
  if (k === 'recycle') return iconRecycle(x, y, s, color)
  if (k === 'pao') return iconPao(x, y, s, color, paoMonths)
  if (k === 'flammable') return iconFlammable(x, y, s, color)
  if (k === 'keepaway') return iconKeepAway(x, y, s, color)
  if (k === 'leaflet') return iconLeaflet(x, y, s, color)
  if (k === 'emark') return iconEmark(x, y, s, color)
  if (k === 'glassfork') return iconGlassFork(x, y, s, color)
  if (k === 'weee') return iconWeee(x, y, s, color)
  if (k === 'keepdry') return iconKeepDry(x, y, s, color)
  if (k === 'thiswayup') return iconThisWayUp(x, y, s, color)
  return ''
}

export function pictogramRow(
  ledger: Ledger,
  x: number,
  y: number,
  s: number,
  kinds: PictoKind[],
  color: string,
  paoMonths = '12M',
  opts: { gap?: number; quality?: boolean } = {},
): { markup: string; w: number } {
  const g = opts.gap ?? s * 0.35
  const quality = opts.quality === true
  let out = ''
  let cx = x
  for (const k of kinds) {
    out += drawPicto(k, cx, y, s, color, paoMonths, quality)
    ledger.add('element', `picto-${k}`, cx, y, s, s)
    cx += s + g
  }
  return { markup: `<g data-art="pictograms">${out}</g>`, w: cx - g - x }
}

export function barcodeBlock(
  ledger: Ledger,
  x: number,
  y: number,
  w: number,
  h: number,
  code: string,
  color: string,
  onLight = true,
  captionSize?: number,
): string {
  const cap = typeSize(captionSize ?? Math.max(1.25, Math.min(1.85, w / 9.2)))
  const capPad = Math.max(4.2, cap * 2.15)
  const box = onLight ? '' : `<rect x="${f(x - 1)}" y="${f(y - 1)}" width="${f(w + 2)}" height="${f(h + capPad)}" fill="#ffffff" />`
  ledger.add('element', 'barcode', x - 1, y - 1, w + 2, h + capPad)
  return `<g data-art="barcode-block" data-edit="barcode">${box}${barcodeSvg(code, x, y, w, h, onLight ? color : '#111111', true, cap)}</g>`
}

/** Deterministic QR-looking placeholder (not scannable; marked as sample). */
export function qrPlaceholder(ledger: Ledger, x: number, y: number, s: number, captionColor: string, seed: number, caption = ''): string {
  const rng = mulberry32(seed)
  const n = 21
  const cell = s / n
  // Modules are always dark on the white quiet zone — a light ink would erase the code.
  const color = isDark(captionColor) ? captionColor : '#111111'
  let out = `<rect x="${f(x)}" y="${f(y)}" width="${f(s)}" height="${f(s)}" fill="#ffffff" />`
  const finder = (fx: number, fy: number) =>
    `<rect x="${f(x + fx * cell)}" y="${f(y + fy * cell)}" width="${f(cell * 7)}" height="${f(cell * 7)}" fill="${color}" /><rect x="${f(x + (fx + 1) * cell)}" y="${f(y + (fy + 1) * cell)}" width="${f(cell * 5)}" height="${f(cell * 5)}" fill="#ffffff" /><rect x="${f(x + (fx + 2) * cell)}" y="${f(y + (fy + 2) * cell)}" width="${f(cell * 3)}" height="${f(cell * 3)}" fill="${color}" />`
  out += finder(0, 0) + finder(n - 7, 0) + finder(0, n - 7)
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const inFinder = (r < 8 && c < 8) || (r < 8 && c >= n - 8) || (r >= n - 8 && c < 8)
      if (inFinder) continue
      if (rng() < 0.45) out += `<rect x="${f(x + c * cell)}" y="${f(y + r * cell)}" width="${f(cell)}" height="${f(cell)}" fill="${color}" />`
    }
  }
  ledger.add('element', 'qr', x, y, s, s + (caption ? 2 : 0))
  // The caption sits under the code, so it may not shrink below the print floor to make room —
  // it has to fit the code's own width at a legible size instead.
  const capSize = caption ? fitSize(caption, s, typeSize(1.1), STUDIO_TYPE_FLOOR_MM, 'sans') : 0
  const cap = caption ? textEl({ x: x + s / 2, y: y + s + 1.6, text: caption, size: capSize, face: 'sans', fill: captionColor, anchor: 'middle' }) : ''
  return `<g data-art="qr" data-sample="true">${out}${cap}</g>`
}

/* ------------------------------------------------------------------- tables */

/** Height the table will take for `rows` rows at `size`. */
export function nutritionTableHeight(rows: number, size = 1.35): number {
  return size * 1.6 * (rows + 1) + size * 0.9
}

export function nutritionTable(ledger: Ledger, x: number, y: number, w: number, title: string, allRows: [string, string][], color: string, size = 1.35, maxBottom = Infinity): { markup: string; bottom: number } {
  const lineH = size * 1.6
  // Drop trailing rows until the table fits above maxBottom (never below the title + 2 rows).
  let rows = allRows
  while (rows.length > 2 && y + nutritionTableHeight(rows.length, size) > maxBottom) rows = rows.slice(0, -1)
  let out = `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(lineH * (rows.length + 1) + size * 0.8)}" fill="none" stroke="${color}" stroke-width="0.2" />`
  let cy = y + size * 0.5
  out += textEl({ x: x + 1.2, y: cy + size, text: title, size: size * 1.02, face: 'sans-heavy', fill: color })
  ledger.text('table-title', x + 1.2, cy + size, textWidth(title, size, 'sans-heavy'), size)
  cy += lineH
  out += hairline(x, cy - size * 0.2, x + w, color, 0.7, 0.16)
  for (const [k, v] of rows) {
    out += textEl({ x: x + 1.2, y: cy + size, text: k, size, face: 'sans', fill: color })
    out += textEl({ x: x + w - 1.2, y: cy + size, text: v, size, face: 'sans', fill: color, anchor: 'end' })
    ledger.text('table-row', x + 1.2, cy + size, textWidth(k, size, 'sans'), size)
    ledger.text('table-val', x + w - 1.2, cy + size, textWidth(v, size, 'sans'), size, 'end')
    cy += lineH
    out += hairline(x, cy - size * 0.2, x + w, color, 0.3, 0.12)
  }
  ledger.add('container', 'nutrition-table', x, y, w, cy - y)
  return { markup: `<g data-art="nutrition-table">${out}</g>`, bottom: cy + size * 0.4 }
}

export function notesTable(ledger: Ledger, x: number, y: number, w: number, headers: { title: string; top: string; heart: string; base: string }, pyramid: { top: string[]; heart: string[]; base: string[] }, color: string, accent: string): { markup: string; bottom: number } {
  const size = 1.5
  let out = spacedLine(ledger, x + w / 2, y + size * 1.1, headers.title, size, accent, w)
  const colW = w / 3
  const cols = [
    { h: headers.top, items: pyramid.top },
    { h: headers.heart, items: pyramid.heart },
    { h: headers.base, items: pyramid.base },
  ]
  const top = y + size * 3
  let bottom = top
  cols.forEach((col, i) => {
    const cx = x + colW * (i + 0.5)
    let cy = top
    const headSize = typeSize(size * 0.9)
    out += textEl({ x: cx, y: cy, text: col.h, size: headSize, face: 'sans-heavy', fill: color, anchor: 'middle', tracking: size * 0.2 })
    ledger.text('notes-head', cx, cy, textWidth(col.h, headSize, 'sans-heavy', size * 0.2), headSize, 'middle')
    cy += size * 1.6
    for (const item of col.items.slice(0, 3)) {
      out += textEl({ x: cx, y: cy, text: item, size, face: 'sans', fill: color, anchor: 'middle' })
      ledger.text('notes-item', cx, cy, textWidth(item, size, 'sans'), size, 'middle')
      cy += size * 1.45
    }
    bottom = Math.max(bottom, cy)
    if (i < 2) out += `<line x1="${f(x + colW * (i + 1))}" y1="${f(top - size)}" x2="${f(x + colW * (i + 1))}" y2="${f(bottom - size * 0.8)}" stroke="${color}" stroke-opacity="0.35" stroke-width="0.14" />`
  })
  return { markup: `<g data-art="notes-table">${out}</g>`, bottom }
}

/* ----------------------------------------------------------------- badges */

function badgeMetrics(d: DesignDirection, w: number, product: string, sub: string, volume: string, titleScale = 1) {
  const pad = Math.max(1.6, Math.min(2.4, w * 0.06))
  const inner = w - pad * 2
  const faces = pairingFaces(d.typePairing)
  const scale = clampStudioScale(titleScale)
  const title = product.toLocaleUpperCase('tr')
  const lines = textWidth(title, 5 * scale, faces.brand) > inner ? splitTitle(title) : [title]
  const size = Math.min(...lines.map((l) => fitSize(l, inner, Math.min(5.4, w * 0.14) * scale, 2.4 * scale, faces.brand, 0.06)))
  const caption = categoryBesideProduct(product, sub)
  const subSize = typeSize(Math.min(size * 0.36, 2))
  const volSize = Math.max(1.8, size * 0.55)
  const h = pad * 1.4 + lines.length * size * 1.15 + (caption ? subSize * 2.2 : 0) + (volume ? volSize * 1.8 : 0) + pad
  return { pad, faces, lines, size, subSize, volSize, h, caption }
}

/** Height a product badge of width `w` will take — lets layouts reserve room before painting. */
export function productBadgeHeight(d: DesignDirection, w: number, product: string, sub: string, volume: string, titleScale = 1): number {
  return badgeMetrics(d, w, product, sub, volume, titleScale).h
}

/** Dark rounded product badge with gold border (Anadolu Bal). */
export function productBadge(ledger: Ledger, d: DesignDirection, cx: number, y: number, w: number, product: string, sub: string, volume: string, titleScale = 1): { markup: string; bottom: number } {
  const { pad, faces, lines, size, subSize, volSize, h, caption } = badgeMetrics(d, w, product, sub, volume, titleScale)
  const x = cx - w / 2
  const ink = d.palette.accent2
  let out = `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(Math.min(2.6, w * 0.06))}" fill="${ink}" stroke="${d.palette.accent}" stroke-width="0.34" />`
  ledger.add('container', 'product-badge', x, y, w, h)
  let cy = y + pad * 1.2
  for (const line of lines) {
    const base = cy + size * 0.9
    out += textEl({ x: cx, y: base, text: line, size, face: faces.brand, fill: d.palette.card, anchor: 'middle', tracking: size * 0.06 })
    ledger.text('product', cx, base, textWidth(line, size, faces.brand, size * 0.06), size, 'middle')
    cy = base + size * 0.25
  }
  if (caption) {
    const base = cy + subSize * 1.5
    out += textEl({ x: cx, y: base, text: caption.toLocaleUpperCase('tr'), size: subSize, face: 'sans', fill: d.palette.accent, anchor: 'middle', tracking: subSize * 0.3 })
    ledger.text('badge-sub', cx, base, textWidth(caption.toLocaleUpperCase('tr'), subSize, 'sans', subSize * 0.3), subSize, 'middle')
    cy = base + subSize * 0.5
  }
  if (volume) {
    const base = cy + volSize * 1.35
    out += textEl({ x: cx, y: base, text: volume, size: volSize, face: 'serif', fill: d.palette.card, anchor: 'middle' })
    ledger.text('badge-volume', cx, base, textWidth(volume, volSize, 'serif'), volSize, 'middle')
  }
  return { markup: `<g data-art="product-badge" data-edit="product">${out}</g>`, bottom: y + h }
}

/** Arched window clip for landscape scenes. */
export function archWindow(uid: string, x: number, y: number, w: number, h: number): { clipId: string; defs: string; outline: (color: string) => string } {
  const clipId = `${uid}-arch`
  const r = w / 2
  const d = `M${f(x)} ${f(y + h)} V${f(y + r)} A${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(y + r)} V${f(y + h)}Z`
  return {
    clipId,
    defs: `<clipPath id="${clipId}"><path d="${d}" /></clipPath>`,
    outline: (color: string) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="0.36" />`,
  }
}

export function escape(text: string): string {
  return escapeSvg(text)
}

export function softenPalette(p: StudioPalette): StudioPalette {
  return { ...p, accent2: mix(p.accent2, p.ground, 0.25), muted: lighten(p.muted, 0.05) }
}
