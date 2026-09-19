/**
 * Compositions — arrangements an archetype can wear that are not the skeleton it was born with.
 *
 * The ten archetypes are field + anatomy systems, each distilled from one reference and painted
 * by its own function. The creative-brain audit read the reference folder and found the
 * arrangements the customers' shelves are actually full of — a band across the foot, a brand set
 * on its side, a block in a corner, a quiet front with the art on a side — appearing in a dozen
 * references and in none of the ten painters. Sixteen of the twenty archetypes sat on
 * `stacked-center`.
 *
 * Adding a band variant to each of twenty painters is not how a studio works either. A painter
 * here borrows what makes the archetype *itself* — its field, its palette, its type pairing, its
 * frame, its ornament level, and since Phase 2B its drawn subject — and supplies the arrangement.
 * So a marble face and a noir face can both be set as a band split, and each still reads as
 * marble or noir. The dispatch in `paintLabelFace` / `paintBoxFront` sends a direction whose
 * `lockup` is a composition here before it reaches the archetype's own painter; `paintBoxSide`
 * does the same for the two carton roles, whose whole point is what the *sides* carry.
 */
import { chip, chipWidth, hairline, heroInk, markKindFor, netQuantity, paintFrame, paintMark, productStack, secondaryMax, spacedLine, stackedLockup, STUDIO_MIN_LOGO_R, verticalBrand } from './anatomy'
import { ground, paintBackground } from './backgrounds'
import { isDark, lighten, mix, readableInk } from './color'
import { categoryCaption, cityLine, identOf, isLandscape, marginFor, seamMark, withIdent, type LayoutCtx } from './layoutContext'
import { FIELD_MUTE, fieldPalette } from './panelField'
import { fitSubject } from './subject'
import { brandCase, brandScale, brandTracking } from './typeSystem'
import { fitSize, pairingFaces, textEl, textWidth, typeSize, wrapByWidth } from './text'
import type { LockupStyle } from './types'

export const COMPOSITIONS: readonly LockupStyle[] = ['band-split', 'rotated-brand', 'top-left-block', 'art-panel', 'flanked']

export function isComposition(lockup: LockupStyle): boolean {
  return COMPOSITIONS.includes(lockup)
}

/**
 * Archetypes whose reason to exist is a drawn subject that the field does not bring by itself.
 * `line-scene` is subject-led too, but its scene *is* its background, so every composition that
 * paints the field already carries it.
 */
const DRAWS_SUBJECT = new Set<string>(['specimen-hero'])

const f = (n: number) => (Math.round(n * 100) / 100).toString()

/** A rectangular zone the field is confined to. Backgrounds paint their whole box; the clip keeps the box honest. */
function zone(uid: string, id: string, x: number, y: number, w: number, h: number): { defs: string; open: string; close: string } {
  const clipId = `${uid}-${id}`
  return {
    defs: `<clipPath id="${clipId}"><rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" /></clipPath>`,
    open: `<g clip-path="url(#${clipId})"><g transform="translate(${f(x)} ${f(y)})">`,
    close: '</g></g>',
  }
}

type Room = { left: number; right: number; top: number; bottom: number }

/**
 * The drawn subject, for archetypes that are about one — fitted by its measured reach
 * (`fitSubject`), booked in the ledger as the specimen so the collision reading and the craft
 * score see it, and marked as the hero so the evaluator knows the archetype's reason to exist was
 * painted. `minWidth` is the drawn width below which the subject is left out.
 */
function paintSubject(
  ctx: LayoutCtx,
  room: Room,
  minWidth: number,
  opts: { anchor?: 'middle' | 'end'; valign?: 'middle' | 'bottom'; flip?: boolean } = {},
): string {
  const { d, ledger } = ctx
  if (!DRAWS_SUBJECT.has(d.archetype)) return ''
  const fit = fitSubject({ species: ctx.species, ink: heroInk(d.palette), seed: d.seed, lineSeed: d.lineSeed, style: d.subjectStyle, uid: `${ctx.uid}-hero`, room, minWidth, ...opts })
  if (!fit) return ''
  ledger.add('element', 'specimen', fit.box.x, fit.box.y, fit.box.w, fit.box.h)
  return `<g data-art="hero" data-subject="${ctx.species}">${fit.markup}</g>`
}

/** Route a direction whose lockup is a composition to its painter; null when the archetype's own painter should run. */
export function paintComposition(ctx: LayoutCtx): string | null {
  switch (ctx.d.lockup) {
    case 'band-split':
      return paintBandSplitFace(ctx)
    case 'rotated-brand':
      return paintRotatedBrandFace(ctx)
    case 'top-left-block':
      return paintTopLeftBlockFace(ctx)
    case 'art-panel':
      return ctx.d.surface === 'box' ? paintArtPanelFront(ctx) : null
    case 'flanked':
      return ctx.d.surface === 'box' ? paintFlankedFront(ctx) : null
    default:
      return null
  }
}

/** The carton roles paint their sides too. Null when the side should be the archetype's usual spine. */
export function paintCompositionSide(ctx: LayoutCtx, index: number): string | null {
  switch (ctx.d.lockup) {
    case 'art-panel':
      return index === 0 ? paintArtSide(ctx, false) : null
    case 'flanked':
      return paintArtSide(ctx, index === 1)
    default:
      return null
  }
}

/**
 * `band-split` — the field carries the brand (and the subject), a band across the foot carries
 * the product.
 *
 * Read off Pure Bloom (three creams, the band colour changing per SKU), Pure Life (white over
 * olive, the branch across the seam) and Blossome (cream over teal). The band is painted in the
 * palette's `deep` — the colour the mood already reserves for the deeper face of the same object —
 * so it belongs to the design rather than being a stripe laid on it. Brand over product holds:
 * the product in the band is capped at `secondaryMax` of the brand line above it. A subject-led
 * archetype drops the mark, draws its subject under the brand sitting on the band's edge and
 * reaching a little into it the way the olive branch does, and sets the product in the band's
 * lower half, clear of it.
 */
export function paintBandSplitFace(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const wide = isLandscape(w, h)
  const bandH = Math.max(12, Math.min(h * 0.4, h * (wide ? 0.34 : 0.28)))
  const fieldH = h - bandH
  const bandY = fieldH
  const band = d.palette.deep
  const bandInk = readableInk(band, d.palette.ink)
  const ink = d.palette.ink
  const accent = d.palette.accent
  const subjectLed = DRAWS_SUBJECT.has(d.archetype)
  const field = zone(ctx.uid, 'field', 0, 0, w, fieldH)
  const parts: string[] = [`<g data-composition="band-split">`, ground(w, h, d.palette.ground), `<defs>${field.defs}</defs>`]
  parts.push(
    field.open,
    paintBackground(d.background, w, fieldH, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, ornament: d.ornament, intensity: subjectLed ? 0.6 : undefined }),
    paintFrame(d, w, fieldH, { inset: m * 0.55, color: accent, opacity: 0.7, ownsGeometry: true }),
    field.close,
  )
  parts.push(`<rect x="0" y="${f(bandY)}" width="${f(w)}" height="${f(bandH)}" fill="${band}" data-art="band" />`)
  parts.push(hairline(0, bandY, w, accent, 0.5, 0.2))
  if (ctx.wrapSeam) parts.push(seamMark(w, h, ink))

  // Field: the brand, with its mark, in the upper part of the field; a tagline under it when there is room.
  const inner = w - m * 2.4
  const lock = stackedLockup(ledger, d, w / 2, fieldH * (wide ? 0.2 : 0.17), inner, copy.brand, cityLine(ctx.brief), {
    ...withIdent(ctx, { color: ink, markColor: accent, brandMax: Math.min(wide ? 8 : 9.5, w * 0.14) }),
    mark: !subjectLed,
  })
  parts.push(lock.markup)
  const tagSize = Math.max(1.5, Math.min(2.1, w * 0.026))
  const tagY = lock.bottom + tagSize * 2.2
  const tagged = Boolean(d.taglineLine) && tagY < fieldH - tagSize * 1.6 && !subjectLed
  if (tagged) parts.push(spacedLine(ledger, w / 2, tagY, d.taglineLine, tagSize, mix(accent, ink, 0.3), inner, 'middle', 'sans', 'tagline'))

  // The subject, when the archetype is about one: from under the brand down onto the band's edge.
  const subject = subjectLed
    ? paintSubject(ctx, { left: m * 1.2, right: w - m * 1.2, top: lock.bottom + m * 0.6, bottom: bandY + bandH * 0.14 }, Math.min(w, h) * 0.26, { valign: 'bottom' })
    : ''
  parts.push(subject)

  // Band: product (prefix, name, category) from the left, net quantity at the right.
  const volSize = Math.max(1.6, Math.min(2.3, w * 0.028))
  const volW = d.volumeLine ? textWidth(d.volumeLine, volSize, 'sans', volSize * 0.06) + m : 0
  const stack = productStack(ledger, d, m, bandY + bandH * (subject ? 0.42 : 0.2), w - m * 2 - volW, copy.product, withIdent(ctx, {
    color: bandInk,
    accent: mix(bandInk, band, 0.25),
    category: categoryCaption(ctx),
    max: Math.min(secondaryMax(lock.brandSize), bandH * (subject ? 0.26 : 0.34), w * 0.09),
    prefix: subject ? undefined : d.productPrefix,
    anchor: 'start',
  }))
  parts.push(stack.markup)
  const footY = h - m * 0.95
  if (d.volumeLine) parts.push(netQuantity(ledger, w - m, footY, d.volumeLine, volSize, bandInk, 'end'))
  const chipText = d.chips[0] ?? ''
  if (chipText) {
    const size = typeSize(Math.min(1.8, w * 0.022))
    if (stack.bottom + size * 2.4 < footY && m + chipWidth(chipText, size) < w - m - volW) {
      parts.push(chip(ledger, d, m, footY - size * 1.9, chipText, { color: bandInk, size }).markup)
    }
  }
  parts.push('</g>')
  return parts.join('')
}

/**
 * `rotated-brand` — the brand on its side in a strip along the left edge, the product beside it.
 *
 * Read off Xfacio (black, the brand as a whole panel), FORÊT (oversized condensed serif), The
 * Majestic (script + serif up the fold) and Amora (the wordmark over the image). The strip shares
 * the field's ground so the face stays one object; a hairline marks the seam. The rotated line is
 * booked in the ledger as the brand it is, so hierarchy and collision reading see it like any
 * other brand line — turned, not hidden. A subject-led archetype draws its subject in the field
 * under the product.
 */
export function paintRotatedBrandFace(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const wide = isLandscape(w, h)
  const stripW = Math.max(11, Math.min(26, w * (wide ? 0.18 : 0.22)))
  const fieldW = w - stripW
  const ink = d.palette.ink
  const accent = d.palette.accent
  const faces = pairingFaces(d.typePairing)
  const subjectLed = DRAWS_SUBJECT.has(d.archetype)
  const field = zone(ctx.uid, 'field', stripW, 0, fieldW, h)
  const parts: string[] = [`<g data-composition="rotated-brand">`, ground(w, h, d.palette.ground), `<defs>${field.defs}</defs>`]
  parts.push(
    field.open,
    paintBackground(d.background, fieldW, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, ornament: d.ornament, intensity: subjectLed ? 0.6 : undefined }),
    paintFrame(d, fieldW, h, { inset: m * 0.5, color: accent, opacity: 0.7, ownsGeometry: true }),
    field.close,
  )
  // The strip: the same ground, a shade apart, and a hairline where it meets the field.
  const stripFill = isDark(d.palette.ground) ? lighten(d.palette.ground, 0.035) : mix(d.palette.ground, d.palette.card, 0.35)
  parts.push(`<rect x="0" y="0" width="${f(stripW)}" height="${f(h)}" fill="${stripFill}" data-art="brand-strip" />`)
  parts.push(`<line x1="${f(stripW)}" y1="${f(m * 0.6)}" x2="${f(stripW)}" y2="${f(h - m * 0.6)}" stroke="${accent}" stroke-opacity="0.45" stroke-width="0.2" />`)
  if (ctx.wrapSeam) parts.push(seamMark(w, h, ink))

  // The brand, reading upward. Its length runs along the height, its size across the strip.
  const brandText = brandCase(d.typePairing, copy.brand)
  const tracking = brandTracking(d.typePairing)
  const brandMax = Math.min(stripW * 0.62, 14) * ctx.titleScale * brandScale(d.typePairing)
  const size = fitSize(brandText, h - m * 2.2, brandMax, 2.6, faces.brand, tracking)
  const width = textWidth(brandText, size, faces.brand, size * tracking)
  const cx = stripW / 2 + size * 0.34
  const cy = h / 2
  parts.push(
    `<g data-art="lockup" data-edit="brand">${textEl({ x: cx, y: cy, text: brandText, size, face: faces.brand, fill: ink, anchor: 'middle', tracking: size * tracking, transform: `rotate(-90 ${f(cx)} ${f(cy)})` })}</g>`,
  )
  ledger.add('text', 'brand', cx - size * 0.78, cy - width / 2, size * 0.98, width, size)

  // The field: product stack in the upper third, tagline under it, net quantity and a chip at the foot.
  const fx = stripW + fieldW / 2
  const inner = fieldW - m * 2.2
  const stack = productStack(ledger, d, fx, h * (wide ? 0.2 : 0.17), inner, copy.product, withIdent(ctx, {
    color: ink,
    accent,
    category: categoryCaption(ctx),
    max: Math.min(secondaryMax(size), fieldW * 0.13, wide ? 6.5 : 8),
    prefix: d.productPrefix,
  }))
  parts.push(stack.markup)
  const tagSize = Math.max(1.5, Math.min(2.1, fieldW * 0.03))
  const footY = h - m
  const tagY = stack.bottom + tagSize * 2.4
  const tagged = Boolean(d.taglineLine) && tagY < footY - tagSize * 3 && !subjectLed
  if (tagged) parts.push(spacedLine(ledger, fx, tagY, d.taglineLine, tagSize, mix(accent, ink, 0.3), inner, 'middle', 'sans', 'tagline'))
  const volSize = Math.max(1.6, Math.min(2.3, fieldW * 0.034))
  if (subjectLed) {
    parts.push(paintSubject(ctx, { left: stripW + m * 1.1, right: w - m * 1.1, top: stack.bottom + m * 0.8, bottom: footY - volSize * 2.2 }, Math.min(fieldW, h) * 0.28))
  }
  if (d.volumeLine) parts.push(netQuantity(ledger, w - m, footY, d.volumeLine, volSize, ink, 'end'))
  const chipText = d.chips[0] ?? ''
  if (chipText) {
    const chipSize = typeSize(Math.min(1.8, fieldW * 0.028))
    const volW = d.volumeLine ? textWidth(d.volumeLine, volSize, 'sans', volSize * 0.06) + m : 0
    if (stripW + m + chipWidth(chipText, chipSize) < w - m - volW) {
      parts.push(chip(ledger, d, stripW + m, footY - chipSize * 1.9, chipText, { color: ink, size: chipSize }).markup)
    }
  }
  parts.push('</g>')
  return parts.join('')
}

/**
 * `top-left-block` — brand and product as one block in the top-left corner, the meta at the foot,
 * the field free.
 *
 * Read off OILY (heavy grotesk block, acid field, blob crossing the panels) and O'live (black,
 * the brand top-left, a large flat silhouette filling the foot). The block is left-aligned and
 * tight; everything the eye needs first sits in one corner, and the rest of the face belongs to
 * the field or the subject. Neither reference carries a mark, so the composition draws none — a
 * customer's own logo, when there is one, sits above the block. A subject-led archetype draws
 * its subject in the lower-right quadrant, which is where the olive branch sits on the reference.
 */
export function paintTopLeftBlockFace(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const wide = isLandscape(w, h)
  const short = h < 55
  const ink = d.palette.ink
  const accent = d.palette.accent
  const faces = pairingFaces(d.typePairing)
  const subjectLed = DRAWS_SUBJECT.has(d.archetype)
  const parts: string[] = [
    `<g data-composition="top-left-block">`,
    ground(w, h, d.palette.ground),
    paintBackground(d.background, w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, ornament: d.ornament, intensity: subjectLed ? 0.6 : undefined }),
    paintFrame(d, w, h, { inset: m * 0.5, color: accent, opacity: 0.7, ownsGeometry: true }),
  ]
  if (ctx.wrapSeam) parts.push(seamMark(w, h, ink))

  // The block: a logo when the customer has one, the brand, then product and category — all from the left edge.
  const x = m * 1.1
  const blockW = w * (wide ? 0.5 : 0.7) - x
  let y = m * 1.1
  const logoR = Math.min(w * 0.07, 6)
  if (ctx.logoHref && logoR >= STUDIO_MIN_LOGO_R) {
    parts.push(paintMark(markKindFor(d), x + logoR, y + logoR, logoR, accent, copy.brand, identOf(ctx)))
    ledger.add('element', 'brand-logo', x, y, logoR * 2, logoR * 2)
    y += logoR * 2 + m * 0.5
  }
  const brandText = brandCase(d.typePairing, copy.brand)
  const tracking = brandTracking(d.typePairing)
  const brandMax = Math.min(wide ? 8 : 9.5, w * 0.14, short ? Math.max(3, h * 0.17) : Infinity) * ctx.titleScale * brandScale(d.typePairing)
  const brandMin = 2.4 * ctx.titleScale
  const size = fitSize(brandText, blockW, brandMax, brandMin, faces.brand, tracking)
  // The same wrap rule as the stacked lockup: a brand that cannot fit one line at the floor wraps to two.
  const floor = typeSize(brandMin)
  const lines = textWidth(brandText, floor, faces.brand, floor * tracking) <= blockW ? [brandText] : wrapByWidth(brandText, blockW, size, faces.brand, 2, size * tracking)
  let baseline = y + size * 0.82
  let brandOut = ''
  for (const line of lines) {
    brandOut += textEl({ x, y: baseline, text: line, size, face: faces.brand, fill: ink, anchor: 'start', tracking: size * tracking })
    ledger.text('brand', x, baseline, textWidth(line, size, faces.brand, size * tracking), size, 'start')
    if (line !== lines[lines.length - 1]) baseline += size * 1.12
  }
  parts.push(`<g data-art="lockup" data-lockup="corner" data-edit="brand">${brandOut}</g>`)
  y = baseline + size * 0.5
  const stack = productStack(ledger, d, x, y, blockW, copy.product, withIdent(ctx, {
    color: ink,
    accent,
    category: categoryCaption(ctx),
    max: Math.min(secondaryMax(size), w * 0.09, short ? Math.max(2.6, h * 0.15) : Infinity),
    prefix: short ? undefined : d.productPrefix,
    anchor: 'start',
  }))
  parts.push(stack.markup)

  // The foot: net quantity at the right; tagline and chip at the left, stacked upward from the foot.
  const footY = h - m
  const volSize = Math.max(1.6, Math.min(2.3, w * 0.028, h * 0.07))
  const volW = d.volumeLine ? textWidth(d.volumeLine, volSize, 'sans', volSize * 0.06) + m : 0
  if (d.volumeLine) parts.push(netQuantity(ledger, w - m, footY, d.volumeLine, volSize, ink, 'end'))
  // The top edge of whatever meta has been placed at the foot so far — the subject stops above it.
  let metaTop = d.volumeLine ? footY - volSize * 0.78 : footY
  const tagSize = Math.max(1.5, Math.min(2, w * 0.024))
  if (d.taglineLine && footY - tagSize * 2.2 > stack.bottom + m) {
    /*
     * Beside the net quantity when the line fits there at the print floor; otherwise on the line
     * above it, with the whole width. `spacedLine` stops shrinking at the floor, so a long tagline
     * on a narrow carton ran straight into the net quantity when it was only *given* the room.
     */
    const floorSize = typeSize(1.5)
    const beside = w - m - volW - x
    const fits = textWidth(d.taglineLine.toLocaleUpperCase('tr'), floorSize, 'sans', floorSize * 0.34) <= beside
    const tagY = fits ? footY : metaTop - m * 0.35
    parts.push(spacedLine(ledger, x, tagY, d.taglineLine, tagSize, mix(accent, ink, 0.3), fits ? beside : w - m - x, 'start', 'sans', 'tagline'))
    metaTop = Math.min(metaTop, tagY - tagSize * 0.78)
  }
  const chipText = d.chips[0] ?? ''
  if (chipText) {
    const chipSize = typeSize(Math.min(1.8, w * 0.022))
    const chipY = metaTop - m * 0.5 - chipSize * 1.9
    if (chipY > stack.bottom + m * 0.6 && x + chipWidth(chipText, chipSize) < w - m - volW) {
      parts.push(chip(ledger, d, x, chipY, chipText, { color: ink, size: chipSize }).markup)
      metaTop = chipY
    }
  }

  // The subject in the lower-right quadrant, sitting on the meta line, against the right edge.
  if (subjectLed) {
    parts.push(paintSubject(ctx, { left: w * 0.34, right: w - m, top: stack.bottom + m * 0.6, bottom: metaTop - m * 0.4 }, Math.min(w, h) * 0.28, { anchor: 'end', valign: 'bottom' }))
  }
  parts.push('</g>')
  return parts.join('')
}

/**
 * `art-panel` front — quiet: the card colour, the mark and the type, no field. The field and the
 * subject live on the first side panel (Matka Botanicals: a bare front, one brown panel of art).
 */
export function paintArtPanelFront(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const bg = d.palette.card
  const ink = readableInk(bg, d.palette.cardInk)
  const accent = readableInk(bg, d.palette.accent, 2.2)
  const parts: string[] = [`<g data-composition="art-panel" data-role-front="quiet">`, ground(w, h, bg)]
  parts.push(paintFrame(d, w, h, { inset: m * 0.55, color: accent, opacity: 0.5, ownsGeometry: true }))
  if (ctx.wrapSeam) parts.push(seamMark(w, h, ink))
  const inner = w - m * 2.6
  const lock = stackedLockup(ledger, d, w / 2, h * 0.14, inner, copy.brand, cityLine(ctx.brief), {
    ...withIdent(ctx, { color: ink, markColor: accent, brandMax: Math.min(8.5, w * 0.12) }),
    mark: true,
  })
  parts.push(lock.markup)
  const stack = productStack(ledger, d, w / 2, lock.bottom + h * 0.06, inner, copy.product, withIdent(ctx, {
    color: ink,
    accent,
    category: categoryCaption(ctx),
    max: Math.min(secondaryMax(lock.brandSize), w * 0.1),
    prefix: d.productPrefix,
  }))
  parts.push(stack.markup)
  const tagSize = Math.max(1.5, Math.min(2, w * 0.026))
  const footY = h - m * 1.1
  const tagY = stack.bottom + tagSize * 2.6
  if (d.taglineLine && tagY < footY - tagSize * 3) parts.push(spacedLine(ledger, w / 2, tagY, d.taglineLine, tagSize, mix(accent, ink, 0.3), inner, 'middle', 'sans', 'tagline'))
  const volSize = Math.max(1.6, Math.min(2.3, w * 0.028))
  if (d.volumeLine) parts.push(netQuantity(ledger, w / 2, footY, d.volumeLine, volSize, ink))
  parts.push('</g>')
  return parts.join('')
}

/**
 * `flanked` front — solid in the palette's deep colour, the lockup centred, the subject on both
 * sides (Lunara: a navy front between two white panels of line-drawn botany and moons).
 */
export function paintFlankedFront(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const bg = d.palette.deep
  const ink = readableInk(bg, d.palette.ink)
  const accent = readableInk(bg, d.palette.accent, 2.2)
  const parts: string[] = [`<g data-composition="flanked" data-role-front="solid">`, ground(w, h, bg)]
  parts.push(paintFrame(d, w, h, { inset: m * 0.55, color: accent, opacity: 0.6, ownsGeometry: true }))
  if (ctx.wrapSeam) parts.push(seamMark(w, h, ink))
  const inner = w - m * 2.6
  const lock = stackedLockup(ledger, d, w / 2, h * 0.16, inner, copy.brand, cityLine(ctx.brief), {
    ...withIdent(ctx, { color: ink, markColor: accent, brandMax: Math.min(8.5, w * 0.12) }),
    mark: true,
  })
  parts.push(lock.markup)
  const stack = productStack(ledger, d, w / 2, lock.bottom + h * 0.07, inner, copy.product, withIdent(ctx, {
    color: ink,
    accent,
    category: categoryCaption(ctx),
    max: Math.min(secondaryMax(lock.brandSize), w * 0.1),
    prefix: d.productPrefix,
  }))
  parts.push(stack.markup)
  const tagSize = Math.max(1.5, Math.min(2, w * 0.026))
  const footY = h - m * 1.1
  const tagY = stack.bottom + tagSize * 2.8
  if (d.taglineLine && tagY < footY - tagSize * 3) parts.push(spacedLine(ledger, w / 2, tagY, d.taglineLine, tagSize, mix(accent, ink, 0.2), inner, 'middle', 'sans', 'tagline'))
  const volSize = Math.max(1.6, Math.min(2.3, w * 0.028))
  if (d.volumeLine) parts.push(netQuantity(ledger, w / 2, footY, d.volumeLine, volSize, ink))
  parts.push('</g>')
  return parts.join('')
}

/**
 * A side that carries the art: the archetype's own field — at full strength when it is the
 * design's picture, held back under a drawn subject — the subject large when the archetype has
 * one, and the category line at the foot.
 *
 * An art panel is the field itself on the design's ground (Matka's brown panel). Flanks are
 * light around a deep front (Lunara), so their field is painted in the side's own palette the
 * way every other secondary panel does it. `mirrored` flips the art, never the type, so a
 * flanked carton's two sides read as a pair.
 */
function paintArtSide(ctx: LayoutCtx, mirrored: boolean): string {
  const { w, h, d, ledger } = ctx
  const m = marginFor(w, h)
  const subjectLed = DRAWS_SUBJECT.has(d.archetype)
  const flanked = d.lockup === 'flanked'
  const bg = flanked ? d.palette.card : d.palette.ground
  const ink = readableInk(bg, flanked ? d.palette.cardInk : d.palette.ink)
  const pal = flanked ? fieldPalette(d.palette, d.archetype, bg, FIELD_MUTE.side) : d.palette
  const parts: string[] = [`<g data-role-side="${mirrored ? 'mirrored' : 'art'}">`, ground(w, h, bg)]
  const field = paintBackground(d.background, w, h, pal, d.seed + 3, {
    species: ctx.species,
    uid: `${ctx.uid}-art`,
    ornament: subjectLed ? d.ornament : 'rich',
    intensity: subjectLed ? 0.55 : flanked ? 0.8 : 1,
  })
  parts.push(mirrored ? `<g transform="translate(${f(w)} 0) scale(-1 1)">${field}</g>` : field)
  /*
   * The category reads up the outer edge — the spine a carton shows when it stands sideways on a
   * shelf, and the one thing the box grammar asks of every side. On the mirrored flank it takes
   * the other edge, so the pair stays a pair; type itself is never mirrored.
   */
  const spineSize = Math.max(1.6, Math.min(2.2, w * 0.06))
  const spineX = mirrored ? m * 0.55 + spineSize * 0.78 : w - m * 0.55
  if (d.categoryLine) parts.push(verticalBrand(ledger, spineX, h / 2, d.categoryLine, spineSize, mix(ink, bg, 0.35), h * 0.6))
  const spineW = spineSize * 1.3 + m * 0.5
  const room = {
    left: mirrored ? m * 0.55 + spineW : m * 0.8,
    right: mirrored ? w - m * 0.8 : w - m * 0.55 - spineW,
    top: m * 1.2,
    bottom: h - m * 1.2,
  }
  parts.push(paintSubject(ctx, room, Math.min(w, h) * 0.36, { flip: mirrored }))
  parts.push('</g>')
  return parts.join('')
}
