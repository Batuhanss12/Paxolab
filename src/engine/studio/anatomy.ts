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
import { darken, isDark, lighten, mix, separateAccent } from './color'
import { type HeroInk } from './species'
import { categoryBesideProduct } from './copyBank'
import { Ledger, STUDIO_TYPE_FLOOR_MM, fitSize, pairingFaces, textEl, textWidth, typeSize, wrapByWidth, type Face } from './text'
import { brandCase, brandScale, brandTracking } from './typeSystem'
import { motifAspect, paintMotif } from './motifs'
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

/**
 * How far below the lead line the second one sits.
 *
 * Measured 2026-09-17 across ten briefs: in eight of them the brand and the product name came back
 * within 1.4× of each other, and five shared the *identical* pair 8.3 mm / 7.7 mm. That was not
 * content — each was clamped by its own hand-tuned ceiling, and the ceilings happened to land near
 * each other. Nothing in the layout had decided which element leads, so nothing led, and the face
 * read flat however well it was composed.
 *
 * The two faces that did read well, `noir-stack` (12 / 6.5) and `botanical-card`, were only
 * accidentally right — their two numbers happened to be far apart.
 *
 * So the subordinate ceiling is derived from the lead's instead of being tuned beside it. 0.55
 * gives roughly the 1.8× a packaging front wants: enough that the eye knows where to start,
 * not so much that the second line stops being readable.
 */
/**
 * The palette a drawn subject wears.
 *
 * `speciesHero` takes every colour as a parameter precisely so the illustration answers to the
 * brief instead of to whatever was scanned; this is where the studio palette is translated into
 * those five roles.
 *
 * Two rules do the work. The lead tone is the brief's accent pushed off the ground if it sits too
 * close to it — a gold branch on a black carton and a deep green one on cream are the same rule.
 * And the receding tone is mixed *towards the ground* rather than simply darkened: on a dark
 * ground darkening walks the back leaves into the background and they vanish, while receding
 * toward the ground is both self-limiting and what distance actually looks like.
 */
export function heroInk(p: StudioPalette): HeroInk {
  const lead = separateAccent(p.ground, p.accent)
  const focal = separateAccent(p.ground, p.accent2)
  return {
    /*
     * Four values along the leaf rather than one flat fill. A leaf is darker where it joins the
     * stem and lighter where it turns to the light, and that single gradient is most of the
     * distance between a drawn shape and a printed silhouette. The lit end travels toward the
     * palette's own light panel on a dark ground and simply lifts on a pale one, so it stays
     * inside the brief's colours either way.
     */
    leafLight: isDark(p.ground) ? mix(lead, p.card, 0.42) : lighten(lead, 0.2),
    leaf: lead,
    leafMid: mix(lead, p.ground, 0.16),
    leafDeep: mix(lead, p.ground, 0.32),
    fruit: focal,
    // The shaded side of a fruit is the one place a true darkening reads better than receding,
    // because it sits inside the silhouette rather than behind it.
    fruitDeep: isDark(p.ground) ? mix(focal, p.ground, 0.42) : darken(focal, 0.2),
    stem: mix(lead, p.ink, 0.35),
  }
}

export function secondaryMax(leadMax: number): number {
  return leadMax * 0.55
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

/**
 * The rounded card read as an edge rather than as a lockup.
 *
 * A title card wraps the product stack; this wraps the region the caller owns. Only a caller that
 * owns the whole geometry may ask for it — see `paintFrame`.
 */
export function roundedCardFrame(w: number, h: number, inset: number, color: string, opacity = 0.9): string {
  const rx = Math.min(4, Math.min(w, h) * 0.06)
  return `<g data-art="frame" data-frame="rounded-card" fill="none" stroke="${color}" stroke-opacity="${f(opacity)}"><rect x="${f(inset)}" y="${f(inset)}" width="${f(w - inset * 2)}" height="${f(h - inset * 2)}" rx="${f(rx)}" stroke-width="0.32" /></g>`
}

/** Solid band with a hairline inside it — the Diako / Odette plate edge. */
export function bandHairlineFrame(w: number, h: number, inset: number, color: string, opacity = 0.9): string {
  const band = Math.max(0.5, inset * 0.32)
  const gap = Math.max(0.4, inset * 0.22)
  return (
    `<g data-art="frame" data-frame="band-hairline" fill="none" stroke="${color}" stroke-opacity="${f(opacity)}">` +
    `<rect x="${f(inset)}" y="${f(inset)}" width="${f(w - inset * 2)}" height="${f(h - inset * 2)}" stroke-width="${f(band)}" />` +
    `<rect x="${f(inset + band + gap)}" y="${f(inset + band + gap)}" width="${f(w - (inset + band + gap) * 2)}" height="${f(h - (inset + band + gap) * 2)}" stroke-width="0.14" />` +
    `</g>`
  )
}

/** One flourish in each corner and one at the top centre — the Heeva plate. Not a continuous frame. */
export function fleuronCrownFrame(w: number, h: number, inset: number, color: string, opacity = 0.9): string {
  const s = Math.max(2.2, Math.min(w, h) * 0.085)
  const sw = Math.max(0.16, s * 0.07)
  // A fleuron is a small three-lobed sprig; drawn once and reflected into the corners.
  const sprig = `M0 0 C${f(s * 0.45)} ${f(-s * 0.1)} ${f(s * 0.7)} ${f(-s * 0.45)} ${f(s)} ${f(-s * 0.15)} M0 0 C${f(s * 0.1)} ${f(-s * 0.45)} ${f(s * 0.45)} ${f(-s * 0.7)} ${f(s * 0.15)} ${f(-s)} M0 0 C${f(s * 0.32)} ${f(-s * 0.32)} ${f(s * 0.55)} ${f(-s * 0.55)} ${f(s * 0.62)} ${f(-s * 0.62)}`
  const at = (x: number, y: number, sx: number, sy: number) =>
    `<path transform="translate(${f(x)} ${f(y)}) scale(${sx} ${sy})" d="${sprig}" />`
  const crown = `<path transform="translate(${f(w / 2)} ${f(inset + s * 0.9)})" d="M${f(-s * 0.9)} 0 Q0 ${f(-s * 0.9)} ${f(s * 0.9)} 0 M${f(-s * 0.35)} 0 Q0 ${f(-s * 0.45)} ${f(s * 0.35)} 0 M0 0 V${f(-s * 0.9)}" />`
  return (
    `<g data-art="frame" data-frame="fleuron-crown" fill="none" stroke="${color}" stroke-opacity="${f(opacity)}" stroke-width="${f(sw)}" stroke-linecap="round">` +
    at(inset, inset + s, 1, -1) +
    at(w - inset, inset + s, -1, -1) +
    at(inset, h - inset - s, 1, 1) +
    at(w - inset, h - inset - s, -1, 1) +
    crown +
    `</g>`
  )
}

/**
 * Two laurel branches rising from the foot's centre along each side (R29, R30). Each branch is a
 * quadratic arc with paired pointed leaves along it; the leaves are the frame's own — a frame
 * member is an ornament, not a portrait of the product's plant. Drawn behind the lockup at the
 * frame's opacity, like every other member.
 */
export function laurelFrame(w: number, h: number, inset: number, color: string, opacity = 0.9): string {
  const len = Math.max(2, Math.min(w, h) * 0.07)
  const wid = len * 0.34
  const sw = Math.max(0.16, len * 0.06)
  const leafD = `M0 0 Q${f(len * 0.5)} ${f(-wid)} ${f(len)} 0 Q${f(len * 0.5)} ${f(wid)} 0 0Z`
  const parts: string[] = []
  for (const side of [-1, 1]) {
    const p0 = { x: w / 2 + side * w * 0.05, y: h - inset - len * 0.5 }
    const p1 = { x: w / 2 + side * (w / 2 - inset - len * 0.55), y: h * 0.4 }
    const c = { x: p1.x + side * w * 0.02, y: p0.y - (p0.y - p1.y) * 0.15 }
    parts.push(`<path d="M${f(p0.x)} ${f(p0.y)} Q${f(c.x)} ${f(c.y)} ${f(p1.x)} ${f(p1.y)}" fill="none" stroke="${color}" stroke-width="${f(sw)}" />`)
    const n = 7
    for (let i = 0; i < n; i++) {
      const t = 0.1 + (i / (n - 1)) * 0.84
      const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * c.x + t * t * p1.x
      const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * c.y + t * t * p1.y
      const tx = 2 * (1 - t) * (c.x - p0.x) + 2 * t * (p1.x - c.x)
      const ty = 2 * (1 - t) * (c.y - p0.y) + 2 * t * (p1.y - c.y)
      const tangent = (Math.atan2(ty, tx) * 180) / Math.PI
      const scale = 0.7 + t * 0.4
      for (const open of [-38, 38]) {
        parts.push(`<path transform="translate(${f(x)} ${f(y)}) rotate(${f(tangent + open)}) scale(${f(scale)})" d="${leafD}" fill="${color}" fill-opacity="${f(open < 0 ? 0.85 : 0.65)}" />`)
      }
    }
  }
  return `<g data-art="frame" data-frame="laurel" opacity="${f(opacity)}">${parts.join('')}</g>`
}

/**
 * A cartouche arc at the crown and a double-line corner in each corner — the two heraldic marks
 * ported from the studio's motif library (`motifs.ts`), sized like the fleuron crown so the
 * lockup below keeps its room.
 */
export function cartoucheFrame(w: number, h: number, inset: number, color: string, opacity = 0.9): string {
  const s = Math.max(2.2, Math.min(w, h) * 0.085)
  const arcW = s * 2.6
  const arcH = arcW * motifAspect('cartouche-arc')
  const corner = s * 1.3
  return (
    `<g data-art="frame" data-frame="cartouche" opacity="${f(opacity)}">` +
    paintMotif('cartouche-arc', w / 2 - arcW / 2, inset - arcH * 0.12, arcW, arcH, color) +
    paintMotif('double-line-corner', inset, inset, corner, corner, color) +
    paintMotif('double-line-corner', w - inset - corner, inset, corner, corner, color, { flipX: true }) +
    paintMotif('double-line-corner', inset, h - inset - corner, corner, corner, color, { flipY: true }) +
    paintMotif('double-line-corner', w - inset - corner, h - inset - corner, corner, corner, color, { flipX: true, flipY: true }) +
    `</g>`
  )
}

/** Metallic rim on a disc or oval; a no-op on a rectangle, where a bezel has nothing to sit on. */
export function bezelFrame(w: number, h: number, inset: number, color: string, opacity = 0.9): string {
  const rx = w / 2 - inset
  const ry = h / 2 - inset
  return (
    `<g data-art="frame" data-frame="bezel" fill="none" stroke="${color}" stroke-opacity="${f(opacity)}">` +
    `<ellipse cx="${f(w / 2)}" cy="${f(h / 2)}" rx="${f(rx)}" ry="${f(ry)}" stroke-width="${f(Math.max(0.6, inset * 0.5))}" />` +
    `<ellipse cx="${f(w / 2)}" cy="${f(h / 2)}" rx="${f(rx - inset * 0.7)}" ry="${f(ry - inset * 0.7)}" stroke-width="0.14" />` +
    `</g>`
  )
}

/**
 * The frame the direction decided, not the one the painter assumed.
 *
 * Front faces used to call `thinDoubleFrame` by name, which made the frame a property of the
 * archetype: the same face wore the same edge whatever the brief, the brain or the customer said.
 * Routing through the direction turns it into a decision. `corner-brackets` and `rounded-card`
 * are deliberately not drawn here — brackets sit around a lockup and a card *is* a composition, so
 * both stay with the painter that owns the geometry.
 *
 * That holds while such a painter exists. A composition owns the whole face and never reaches its
 * archetype's painter, so on 22 measured faces the direction promised one of those two frames and
 * nothing drew it. Those callers pass `ownsGeometry` and get the edge reading of the frame here.
 */
export function paintFrame(
  d: DesignDirection,
  w: number,
  h: number,
  opts: { inset: number; color: string; opacity?: number; round?: boolean; ownsGeometry?: boolean },
): string {
  const op = opts.opacity ?? 0.9
  switch (d.frame) {
    case 'thin-double':
      return thinDoubleFrame(w, h, opts.inset, opts.color, op)
    case 'band-hairline':
      return bandHairlineFrame(w, h, opts.inset, opts.color, op)
    case 'fleuron-crown':
      return fleuronCrownFrame(w, h, opts.inset, opts.color, op)
    case 'bezel':
      return opts.round ? bezelFrame(w, h, opts.inset, opts.color, op) : ''
    case 'laurel':
      return laurelFrame(w, h, opts.inset, opts.color, op)
    case 'cartouche':
      return cartoucheFrame(w, h, opts.inset, opts.color, op)
    case 'corner-brackets':
      return opts.ownsGeometry
        ? cornerBrackets(opts.inset, opts.inset, w - opts.inset * 2, h - opts.inset * 2, opts.color, Math.min(w, h) * 0.16)
        : ''
    case 'rounded-card':
      return opts.ownsGeometry ? roundedCardFrame(w, h, opts.inset, opts.color, op) : ''
    case 'none':
    default:
      return ''
  }
}

export function hairline(x1: number, y: number, x2: number, color: string, opacity = 0.8, sw = 0.22): string {
  return `<line x1="${f(x1)}" y1="${f(y)}" x2="${f(x2)}" y2="${f(y)}" stroke="${color}" stroke-opacity="${f(opacity)}" stroke-width="${f(sw)}" />`
}

/* ------------------------------------------------------------------ lockups */

export type LockupResult = {
  markup: string
  bottom: number
  top: number
  /**
   * The size the brand was actually drawn at.
   *
   * Relating the second line to the brand's *ceiling* is not enough: on the column variant of
   * `line-scene` the brand is boxed into a narrow column and came out at 4.4 mm while the product,
   * which has the full width, reached 6.0 mm on two lines — the brand smaller than the product it
   * belongs to. Only the achieved size can keep the relationship true in every layout.
   */
  brandSize: number
}

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
  const brandUpper = brandCase(d.typePairing, brand)
  const tracking = brandTracking(d.typePairing)
  const titleScale = clampStudioScale(opts.titleScale)
  // An oversized system pushes past the painter's ceiling; `fitSize` still stops at the room.
  const brandMax = (opts.brandMax ?? Math.min(maxW * 0.16, 11)) * titleScale * brandScale(d.typePairing)
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
  // A long brand on a narrow face cannot be solved by shrinking: `fitSize` stops at the print
  // floor, and below that the name is not legible on press anyway. Measured on a 38 mm label,
  // "Verda Botanicals Apothecary" came back at the floor and ran off the panel. So it wraps, which
  // is what a designer does with a three-word brand in a narrow column.
  /*
   * The wrap decision has to use the *same* floor the size clamp uses. It used `fitsAtFloor`,
   * which measures at the 1.5 mm print floor, while `fitSize` above stops at `brandMin` (2.4 mm):
   * a brand that fits at 1.5 but not at 2.4 was judged "fits", drawn at 2.4, and ran off the
   * panel — measured on a 38 mm face, "VERDA BOTANICALS APOTHECARY" at 44.8 mm wide. It stayed
   * hidden while the tracked-serif pairing happened to fail the 1.5 mm check too.
   */
  const brandFloor = typeSize((opts.brandMin ?? 2.4) * titleScale)
  const fitsOneLine = textWidth(brandUpper, brandFloor, faces.brand, brandFloor * tracking) <= maxW
  const brandLines = fitsOneLine
    ? [brandUpper]
    : wrapByWidth(brandUpper, maxW, size, faces.brand, 2, size * tracking)
  let baseline = y + size * 0.82
  for (const line of brandLines) {
    brandOut += textEl({ x: cx, y: baseline, text: line, size, face: faces.brand, fill: color, anchor: 'middle', tracking: size * tracking })
    ledger.text('brand', cx, baseline, textWidth(line, size, faces.brand, size * tracking), size, 'middle')
    if (line !== brandLines[brandLines.length - 1]) baseline += size * 1.12
  }
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
      brandSize: size,
    }
  }
  return {
    markup: `<g data-art="lockup" data-lockup="stacked" data-edit="brand">${brandOut}${subOut}</g>`,
    bottom: y,
    top,
    brandSize: size,
  }
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
  return { markup: `<g data-art="lockup" data-lockup="monogram" data-edit="brand">${out}</g>`, bottom: bBase + brandSize * 0.5, top, brandSize }
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
    /**
     * How much vertical room the stack may use, measured down from `top`.
     *
     * Without it the stack draws the prefix and then the product wherever they land, and every
     * caller has to guess the total height in advance — including the prefix, which sits *above*
     * the product and so is the part a caller most easily forgets. Measured across 324 catalogue
     * pairings: 7 designs were export-blocked and 4 of the 7 named `product-prefix`, all of them
     * on wide, short faces (120 × 50 label, 90 × 45 carton) where the caller had bounded the
     * product's size but not the stack's height.
     *
     * Given a budget the stack sheds in the order a designer would: the prefix first, then the
     * type size, then the second line. Only the press floor is absolute.
     */
    room?: number
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

  const text = opts.upper === false ? product : product.toLocaleUpperCase('tr')
  const rawMax = opts.max ?? 8
  let lines = wrapByWidth(text, maxW, 1, faces.product, 2).length > 1 && textWidth(text, rawMax * titleScale, faces.product) > maxW ? splitTitle(text) : [text]
  let ceiling = rawMax
  let prefix = opts.prefix

  if (opts.room !== undefined) {
    // A budget of zero means "there is no room", not "there is no budget" — the first version of
    // this guard skipped itself in exactly the case that needed it most, and the prefix went on
    // being drawn off the bottom of a 90 × 45 front. One line at the press floor is the minimum
    // any product line can be, so that is the floor of the budget too.
    const room = Math.max(opts.room, STUDIO_TYPE_FLOOR_MM * titleScale * 1.17)
    // Conservative: `size` can only come out at or under the ceiling, so bounding on the ceiling
    // never under-reserves. The multipliers are the advances the drawing loops below actually use.
    const prefixH = (m: number) => Math.min(m * 0.78, 6.4) * titleScale * 1.2
    const bodyH = (m: number, n: number) => m * titleScale * 1.17 * n
    const fits = (m: number, withPrefix: boolean, n: number) => (withPrefix ? prefixH(m) : 0) + bodyH(m, n) <= room
    if (!fits(ceiling, !!prefix, lines.length)) {
      if (prefix && fits(ceiling, false, lines.length)) prefix = undefined
      else {
        prefix = undefined
        // Shrink to fit, then give up the second line rather than print under the panel's foot.
        ceiling = Math.max(STUDIO_TYPE_FLOOR_MM, room / (titleScale * 1.17 * lines.length))
        if (ceiling <= STUDIO_TYPE_FLOOR_MM && lines.length > 1) {
          lines = [text]
          ceiling = Math.max(STUDIO_TYPE_FLOOR_MM, room / (titleScale * 1.17))
        }
      }
    }
  }

  if (prefix) {
    const pSize = Math.min(ceiling * 0.78, 6.4) * titleScale
    const face: Face = faces.prefix
    const base = y + pSize * 0.9
    out += textEl({ x, y: base, text: prefix, size: pSize, face, fill: accent, anchor, italic: face === 'serif-italic' })
    ledger.text('product-prefix', x, base, textWidth(prefix, pSize, face), pSize, anchor)
    y = base + pSize * 0.3
  }
  const max = ceiling * titleScale
  /*
   * The product's floor may not climb over its own ceiling.
   *
   * It was a flat 2.6 mm. Callers pass `max: secondaryMax(brandSize)` precisely so the product
   * stays under the brand, but when the face is tight enough that the brand itself sits on the
   * print floor, that ceiling drops below 2.6 and the floor won — measured on a 40 mm lid with
   * "Verda Botanicals": brand 2.4 mm, product 2.6 mm, the hierarchy inverted on the one rule the
   * owner asked never to loosen. The floor now yields to the ceiling, and only the print floor
   * itself is absolute.
   */
  const floor = Math.max(STUDIO_TYPE_FLOOR_MM, Math.min(2.6 * titleScale, max))
  const size = Math.min(...lines.map((l) => fitSize(l, maxW, max, floor, faces.product, faces.product === 'sans-heavy' ? 0.02 : 0.06)))
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
  /** `room` is the card's total height budget from `y`, not the stack's — the padding comes off here. */
  opts: { prefix?: string; titleScale?: number; logoHref?: string; logoScale?: number; room?: number } = {},
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
    room: opts.room === undefined ? undefined : opts.room - pad * 1.9,
  }
  const probe = new Ledger(ledger.panel)
  const stack = productStack(probe, d, x + w / 2, y + pad, inner, product, stackOpts)
  const h = stack.bottom - y + pad * 0.9
  const rx = Math.min(3, w * 0.08)
  const card = `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(rx)}" fill="${d.palette.card}" />`
  ledger.add('container', 'title-card', x, y, w, h)
  const real = productStack(ledger, d, x + w / 2, y + pad, inner, product, stackOpts)
  /*
   * When the direction asked for `rounded-card`, this card *is* that frame — `paintFrame` leaves it
   * to the painter that owns the geometry. Saying so here is what makes the promise checkable: the
   * decoration scorer used to look for `data-frame=` and report "çerçeve seçildi, çizilmedi" on 29
   * faces that were carrying the card all along.
   */
  const declares = d.frame === 'rounded-card' ? ' data-frame="rounded-card"' : ''
  return { markup: `<g data-art="title-card"${declares}>${card}${real.markup}</g>`, bottom: y + h }
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
/**
 * How wide a chip will be, without drawing it or booking it.
 *
 * A caller that lays chips in a row has to know whether the next one fits *before* committing it:
 * `chip` writes to the ledger as it draws, so a caller that drew first and measured afterwards left
 * a booked element that was never painted, and preflight reported it out of bounds.
 */
export function chipWidth(text: string, size = 1.9): number {
  return textWidth(text, size, 'sans-heavy', size * 0.14) + size * 0.9 * 2
}

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

/**
 * `id` names the register for the ledger when the column cannot set it. Optional because a section
 * without one is unnamed decoration; every regulated register passes it.
 */
export type Section = { title: string; body: string; edit?: string; id?: string }

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
  /*
   * `maxBottom` is a promise, not a hint.
   *
   * The room calculation used to be `Math.max(1, …)`, which drew a body line even when there was
   * none — harmless on a tall rectangular back, and a collision as soon as the band is tight. It
   * surfaced on a 40 mm lid, where the round back's legal column ran into the barcode. A section
   * that cannot fit its title *and* one line is not started at all.
   */
  const advance = size * 1.36
  /*
   * A dropped register says why it was dropped.
   *
   * All three exits below used to be silent, and two of them `break` — so one tight column dropped
   * every *remaining* register, not just the one that would not fit. Downstream there was no way to
   * tell "the customer has not written this yet" from "the column ran out of room" from "the
   * renderer failed", which is the distinction the required-information gate is built on.
   */
  const name = (s: Section) => s.id ?? s.edit ?? 'legal-section'
  for (const [i, s] of sections.entries()) {
    if (!s.body.trim()) {
      ledger.skip(name(s), 'no-content')
      continue
    }
    if (cy + lineH * 2 > maxBottom) {
      for (const rest of sections.slice(i)) if (rest.body.trim()) ledger.skip(name(rest), 'no-space')
      break
    }
    const tSize = size * 1.05
    const titleH = s.title ? tSize + size * 0.55 : 0
    const room = Math.floor((maxBottom - cy - titleH) / advance)
    if (room < 1) {
      for (const rest of sections.slice(i)) if (rest.body.trim()) ledger.skip(name(rest), 'no-space')
      break
    }
    let section = ''
    if (s.title) {
      const track = tSize * 0.24
      const base = cy + tSize
      section += textEl({ x: tx, y: base, text: s.title.toLocaleUpperCase('tr'), size: tSize, face: 'sans-heavy', fill: opts.titleColor ?? color, anchor, tracking: track })
      // Named after the register, so the ledger says which one was set as well as which was not.
      ledger.text(`legal-title:${name(s)}`, tx, base, textWidth(s.title.toLocaleUpperCase('tr'), tSize, 'sans-heavy', track), tSize, anchor)
      cy = base + size * 0.55
    }
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

/**
 * Vertical (rotated) text. Always includes rotate(-90) — the carton gate reads it.
 *
 * `role` says what the line *is*. A carton's side spine is `spine`, and a label carrying one is a
 * label wearing carton anatomy, which the label gate refuses. A rotated word used as a design
 * element on a face — the reference shelf is full of them — is `accent`, and belongs on either
 * surface. Before the role existed the gate tested the rotation itself and refused every label
 * with a turned word on it.
 */
export function verticalBrand(
  ledger: Ledger,
  cx: number,
  cy: number,
  text: string,
  size: number,
  color: string,
  maxLen: number,
  face: Face = 'sans',
  role: 'spine' | 'accent' = 'spine',
): string {
  const upper = text.toLocaleUpperCase('tr')
  const s = fitSize(upper, maxLen, size, 1.6, face, size * 0.3)
  const track = s * 0.3
  const len = textWidth(upper, s, face, track)
  ledger.add('text', role === 'spine' ? 'vertical-brand' : 'rotated-line', cx - s * 0.6, cy - len / 2, s * 1.2, len, s)
  return `<g data-art="${role === 'spine' ? 'spine' : 'rotated-line'}" transform="translate(${f(cx)} ${f(cy)}) rotate(-90)">${textEl({ x: 0, y: s * 0.35, text: upper, size: s, face, fill: color, anchor: 'middle', tracking: track })}</g>`
}

/* ----------------------------------------------------------------- utility */

export function netQuantity(ledger: Ledger, cx: number, baseline: number, text: string, size: number, color: string, anchor: 'middle' | 'start' | 'end' = 'middle'): string {
  if (!text) {
    /*
     * Nothing to state, and that is usually right: measured across the populations, all 24 faces
     * that reach here are electronics, where the brief carries no volume because a pair of earbuds
     * has no net quantity. Saying so is what separates it from a renderer that stopped emitting.
     */
    ledger.skip('net-quantity', 'no-content')
    return ''
  }
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

export function nutritionTable(ledger: Ledger, x: number, y: number, w: number, title: string, allRows: [string, string][], color: string, requested = 1.35, maxBottom = Infinity): { markup: string; bottom: number } {
  /*
   * A declaration is not truncated.
   *
   * This used to drop trailing rows until the table fitted. On a 70 × 45 olive-oil oval that left
   * two rows — Enerji and Yağ — and silently dropped **Doymuş yağ**, the one row an oil is required
   * to declare. A partial nutrition table is worse than none: it looks like a declaration and is
   * not one, and the gate that checks for the saturates row was right to refuse the file.
   *
   * So the type shrinks toward the press floor to fit the whole set, and if even that will not fit,
   * nothing is drawn. An absent table is a blank the producer fills; a clipped one is a false
   * statement about food.
   */
  let size = requested
  while (size > STUDIO_TYPE_FLOOR_MM && y + nutritionTableHeight(allRows.length, size) > maxBottom) size = Math.max(STUDIO_TYPE_FLOOR_MM, size - 0.05)
  if (y + nutritionTableHeight(allRows.length, size) > maxBottom) {
    // Absent and *said so*: an unrecorded absence is a renderer fault, this one is a shape fact.
    ledger.skip('nutrition-table', 'no-space')
    return { markup: '', bottom: y }
  }
  const rows = allRows
  const lineH = size * 1.6
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
  /*
   * A column's contents are fitted to the column, and the heading is shortened when even the print
   * floor will not fit it.
   *
   * The headings were drawn at a fixed size, so on a 45 mm carton back "TEPE NOTALAR" measured
   * 15.5 mm inside a 13 mm column and the three of them overlapped each other — `notes-head ×
   * notes-head`, which blocked the export of every narrow perfume carton. Shrinking cannot solve
   * it: at 1.5 mm the string is still 15.5 mm. The table already carries "KOKU PİRAMİDİ" as its
   * own title, so repeating "NOTALAR" in each column was redundant anyway — the first word is what
   * a perfume box actually prints.
   */
  const inner = colW * 0.92
  cols.forEach((col, i) => {
    const cx = x + colW * (i + 0.5)
    let cy = top
    const headTrack = size * 0.2
    const head = textWidth(col.h, STUDIO_TYPE_FLOOR_MM, 'sans-heavy', headTrack) <= inner ? col.h : col.h.split(/\s+/)[0]
    const headSize = fitSize(head, inner, typeSize(size * 0.9), STUDIO_TYPE_FLOOR_MM, 'sans-heavy', headTrack)
    out += textEl({ x: cx, y: cy, text: head, size: headSize, face: 'sans-heavy', fill: color, anchor: 'middle', tracking: headTrack })
    ledger.text('notes-head', cx, cy, textWidth(head, headSize, 'sans-heavy', headTrack), headSize, 'middle')
    cy += size * 1.6
    for (const item of col.items.slice(0, 3)) {
      const itemSize = fitSize(item, inner, size, STUDIO_TYPE_FLOOR_MM, 'sans')
      out += textEl({ x: cx, y: cy, text: item, size: itemSize, face: 'sans', fill: color, anchor: 'middle' })
      ledger.text('notes-item', cx, cy, textWidth(item, itemSize, 'sans'), itemSize, 'middle')
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
