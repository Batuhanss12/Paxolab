/**
 * Box archetypes — front hero + back information + side manifesto + top/bottom brand + flaps.
 * Panel-local coordinates; every element goes through the ledger.
 */
import {
  barcodeBlock,
  benefitRow,
  brandPill,
  chip,
  chipWidth,
  claimBand,
  cornerBrackets,
  hairline,
  legalColumn,
  legalTypeSize,
  paintFrame,
  markKindFor,
  monogramLockup,
  netQuantity,
  notesTable,
  nutritionTable,
  nutritionTableHeight,
  paintMark,
  paragraph,
  pictogramRow,
  pictogramsForBack,
  productStack,
  qrPlaceholder,
  linesThatFit,
  qualityBadge,
  secondaryMax,
  spacedLine,
  stackedLockup,
  stackedWords,
  titleCard,
  verticalBrand,
  STUDIO_MIN_LOGO_R,
  type Section,
} from './anatomy'
import { ground, paintBackground } from './backgrounds'
import { paintComposition, paintCompositionSide } from './compositions'
import { isReferenceArchetype, paintReferenceCrownMark, paintReferenceFace, paintReferenceSkin } from './refArchetypes'
import { titleFaces } from './typeSystem'
import { FIELD_INTENSITY, FIELD_MUTE, fieldPalette, secondaryField } from './panelField'
import { isDark, lighten, mix, readableInk } from './color'
import { backHeaders, nutritionRows, scentPyramid, usageCopy, usageLine } from './copyBank'
import { paintAtelierPlateFace, paintCrestPanelFace, paintLineSceneFace, paintSpecimenHeroFace, paintWavePanelFace } from './labelLayouts'
import { cityLine, identOf, marginFor, withIdent, categoryCaption, type LayoutCtx } from './layoutContext'
import { fitSize, pairingFaces, textEl, textWidth, typeSize, wrapByWidth } from './text'
import type { BoxArchetype, StudioArchetype, StudioPalette } from './types'

/**
 * Sides / top / flaps.
 *
 * The archetype decides *whether* its sides wear the deep surface — a front that is a card
 * floating on art wants coloured sides, a front that is already a full-bleed field does not.
 * That is composition, so it belongs here. What the deep surface *is* belongs to the palette,
 * which is why this no longer reaches for `accent2`: that slot holds a texture sibling and was
 * never a surface, so the sides ended up cream on a near-black box, lighter than the front on a
 * modern one, and brown on a brief that asked for green.
 */
/**
 * The studio archetype whose secondary treatment this panel follows, or null when there is none.
 *
 * `d.archetype as BoxArchetype` used to stand wherever this is called. That cast is exactly how the
 * eight reference archetypes lost their backs and sides: they are not box archetypes, the cast told
 * the compiler they were, every branch below missed them, and they fell silently to the default.
 * Answering null instead forces each branch to say what it does with an archetype it does not know,
 * and `paintReferenceSkin` to say what that archetype draws instead.
 */
function studioArchetypeOf(id: StudioArchetype): BoxArchetype | null {
  return isReferenceArchetype(id) ? null : (id as BoxArchetype)
}

function deepGround(p: StudioPalette, archetype: BoxArchetype | null): string {
  if (archetype === 'ink-wash' || archetype === 'botanical-card' || archetype === 'line-scene' || archetype === 'wave-panel') {
    return p.deep
  }
  return p.ground
}

function deepInk(p: StudioPalette, archetype: BoxArchetype | null): string {
  const g = deepGround(p, archetype)
  // Readable on whatever the deep surface turned out to be, rather than on an assumption about it.
  return readableInk(g, isDark(g) ? p.card : p.cardInk)
}

/* ------------------------------------------------------------------ fronts */

function noirStack(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const parts: string[] = [ground(w, h, d.palette.ground)]
  // Same moonlit-landscape skeleton, three horizons: scene high and close, standard, scene low.
  const span = d.variant === 1 ? 0.76 : d.variant === 2 ? 0.56 : 0.66
  const lockTop = h * (d.variant === 1 ? 0.05 : d.variant === 2 ? 0.12 : 0.08)
  const stackGap = h * (d.variant === 1 ? 0.01 : d.variant === 2 ? 0.03 : 0.015)
  /*
   * `d.background`, not a literal. This archetype's DNA offers `marble` as its second field and the
   * painter never drew it — so variation 1 reported marble, painted moonlight, and the offer strip
   * and golden table both repeated the claim. Measured across the eight multi-background
   * archetypes, only this one and the `line-scene` carton had that mismatch; everywhere else a
   * hardcoded family matches a single-entry DNA list and is simply the archetype being itself.
   */
  parts.push(paintBackground(d.background, w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, span, ornament: d.ornament }))
  const ink = d.palette.ink
  const accent = d.palette.accent
  const brandMax = Math.min(12, w * 0.17)
  const lock = stackedLockup(ledger, d, w / 2, lockTop, w - m * 2, copy.brand, '', withIdent(ctx, { color: ink, brandMax, markColor: accent }))
  parts.push(lock.markup)
  const stack = productStack(ledger, d, w / 2, lock.bottom + stackGap, w - m * 2, copy.product, withIdent(ctx, { color: accent, accent, category: d.categoryLine, max: Math.min(secondaryMax(lock.brandSize), w * 0.085) }))
  parts.push(stack.markup)
  // tagline above the foot
  const tagY = h * 0.86
  parts.push(spacedLine(ledger, w / 2, tagY, d.taglineLine, Math.max(1.6, Math.min(2.2, w * 0.03)), accent, w - m * 2, 'middle', 'sans', 'tagline'))
  // foot row: volume left · spray chip right
  const footY = h - m * 0.9
  const vs = Math.max(1.8, Math.min(2.4, w * 0.032))
  if (d.volumeLine) parts.push(netQuantity(ledger, m, footY, d.volumeLine, vs, ink, 'start'))
  const right = d.chips[1] ?? d.chips[0]
  if (right) {
    const lines = wrapByWidth(right, w * 0.42, 1.3, 'sans', 2, 0.35)
    let ly = footY - (lines.length - 1) * 1.9
    for (const line of lines) {
      parts.push(spacedLine(ledger, w - m, ly, line, 1.3, ink, w * 0.42, 'end'))
      ly += 1.9
    }
  }
  return parts.join('')
}

function inkWashFront(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  // Same wash-and-frame skeleton; the wash enters from a different corner and the stack breathes
  // differently. The corner is the most visible of the three arrangements.
  const washCorner = d.variant === 1 ? 'br' : d.variant === 2 ? 'tl' : 'bl'
  const lockTop = m * (d.variant === 1 ? 1.4 : d.variant === 2 ? 2.8 : 2)
  const gap = h * (d.variant === 1 ? 0.035 : d.variant === 2 ? 0.07 : 0.05)
  const parts: string[] = [paintBackground('ink-wash', w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, corner: washCorner, ornament: d.ornament })]
  const ink = d.palette.ink
  const accent = d.palette.accent
  parts.push(paintFrame(d, w, h, { inset: m * 0.5, color: accent, opacity: 0.85 }))
  const brandMax = Math.min(11, w * 0.16)
  const lock = stackedLockup(ledger, d, w / 2, lockTop, w - m * 3, copy.brand, cityLine(ctx.brief), withIdent(ctx, { color: ink, markColor: accent, brandMax }))
  parts.push(lock.markup)
  const stack = productStack(ledger, d, w / 2, lock.bottom + gap, w - m * 3, copy.product, withIdent(ctx, { color: ink, accent, category: d.categoryLine, max: Math.min(secondaryMax(lock.brandSize), w * 0.14) }))
  parts.push(stack.markup)
  const tagWords = wrapByWidth(d.taglineLine.toLocaleUpperCase('tr'), w * 0.5, 1.5, 'sans', 3, 0.5)
  const tag = stackedWords(ledger, w / 2, stack.bottom + gap, tagWords, 1.6, ink, w * 0.55)
  parts.push(`<g data-edit="tagline">${tag.markup}</g>`)
  // foot on the wash → card colour
  const footY = h - m * 1.1
  const footColor = d.palette.card
  parts.push(spacedLine(ledger, w / 2, footY - 3.8, copy.tagline || d.chips[0] || '', 1.25, footColor, w - m * 3, 'middle', 'sans', 'tagline'))
  if (d.volumeLine) parts.push(netQuantity(ledger, w / 2, footY, d.volumeLine, Math.max(1.8, Math.min(2.4, w * 0.032)), footColor))
  return parts.join('')
}

function marbleFront(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const parts: string[] = [paintBackground('marble', w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, intensity: 0.8, ornament: d.ornament })]
  const ink = d.palette.ink
  const accent = d.palette.accent
  const bx = m * 1.6
  const bw = w - bx * 2
  // Same bracket-and-stack skeleton, three rhythms: tight/high, standard, airy/low.
  const by = h * (d.variant === 1 ? 0.06 : d.variant === 2 ? 0.16 : 0.09)
  const stackY = h * (d.variant === 1 ? 0.58 : d.variant === 2 ? 0.76 : 0.7)
  // Bounded by the face's height as well as the bracket's width: on a 90 × 45 front the block was
  // sized on width alone, ate the room the product stack needed, and pushed it off the panel.
  const brandMax = Math.min(bw * 0.15, 11, h * 0.16)
  const lock = stackedLockup(ledger, d, w / 2, by + 3, bw - 6, copy.brand, d.chips[1] ?? d.taglineLine, withIdent(ctx, { mark: true, markColor: accent, color: d.palette.accent2, brandMax }))
  parts.push(lock.markup)
  const bh = lock.bottom - by + 3
  parts.push(cornerBrackets(bx, by, bw, bh, accent, Math.min(bw * 0.22, 12)))
  /*
   * On a squat carton the bracket block, the category caption and the product stack were each
   * sized on their own and then laid down in order, so on a 90 × 45 front the caption sat 4 mm
   * above a prefix that needed 6, and the stack itself ran off the bottom edge — measured as
   * `spaced × product-prefix` plus `product-prefix` and `product` out of bounds.
   *
   * The caption yields when the stack is close behind it, and the stack is told what room the foot
   * leaves it rather than being trusted to land inside the panel.
   */
  const stackTop = Math.max(stackY, by + bh + 8)
  const volSize = Math.max(1.9, Math.min(2.6, w * 0.032))
  const cat = categoryCaption(ctx)
  if (cat && stackTop - (by + bh + 3.6) > 5) parts.push(spacedLine(ledger, w / 2, by + bh + 3.6, cat, 1.5, ink, bw))
  const stack = productStack(ledger, d, w / 2, stackTop, w - m * 2, copy.product, withIdent(ctx, {
    color: ink,
    accent,
    prefix: d.productPrefix,
    max: Math.min(secondaryMax(lock.brandSize), w * 0.11),
    room: Math.max(0, h - m - volSize * 2.4 - stackTop),
  }))
  parts.push(stack.markup)
  if (d.volumeLine) parts.push(netQuantity(ledger, w / 2, Math.min(h - m, stack.bottom + 5), d.volumeLine, volSize, ink))
  return parts.join('')
}

function botanicalCardFront(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const parts: string[] = [paintBackground(d.background, w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, intensity: 0.85, ornament: d.ornament })]
  const ink = d.palette.ink
  const pill = brandPill(ledger, d, w - m, m, copy.brand, w * 0.6, identOf(ctx))
  parts.push(pill.markup)
  const cardW = w - m * 2
  const footY = h - m * 0.9
  // Same skeleton, three weights: block near the pill, block mid-face, block at the foot.
  // Clamped so the band + sentence + net quantity always keep their room above the foot.
  const wanted =
    d.variant === 1
      ? Math.max(pill.box.y + pill.box.h + h * 0.05, h * 0.26)
      : d.variant === 2
        ? Math.max(pill.box.y + pill.box.h + h * 0.2, h * 0.56)
        : Math.max(pill.box.y + pill.box.h + h * 0.14, h * 0.4)
  const cardY = Math.min(wanted, footY - h * 0.3)
  // Net quantity is pinned to the foot, so the sentence above it must give way, not overprint.
  const sentenceSize = Math.max(1.6, Math.min(2.3, cardW * 0.045))
  const volSize = Math.max(1.9, Math.min(2.6, w * 0.032))
  // The card is told what room it has, rather than sized on width and then trusted to land inside.
  const card = titleCard(ledger, d, m, cardY, cardW, copy.product, d.categoryLine, withIdent(ctx, { prefix: d.productPrefix, room: Math.max(0, footY - volSize * 1.3 - cardY) }))
  parts.push(card.markup)
  /*
   * The claim band is a fixed fraction of the card's width, so on a wide, short front it is tall
   * (9 mm on a 90 × 45) while the room under the card is not. It used to be drawn regardless and
   * printed past the panel edge — measured as `claim-band` and `claim` out of bounds. It is a
   * claim, not a mandatory line, so it yields.
   */
  const bandRoom = footY - volSize * 1.3 - card.bottom
  const band =
    bandRoom >= Math.max(4.2, cardW * 0.11) ? claimBand(ledger, d, m, card.bottom, cardW, d.chips[0] ?? d.categoryLine) : { markup: '', bottom: card.bottom }
  parts.push(band.markup)
  const sentenceLines = linesThatFit(band.bottom + 2.2, footY - volSize * 1.3, sentenceSize, 2)
  if (sentenceLines > 0) {
    const sentence = paragraph(ledger, m, band.bottom + 2.2, cardW, d.taglineLine || copy.tagline, sentenceSize, 'sans', ink, sentenceLines, 'middle', false, 'tagline')
    parts.push(sentence.markup)
  }
  if (d.volumeLine) parts.push(netQuantity(ledger, m, footY, d.volumeLine, volSize, ink, 'start'))
  return parts.join('')
}

function diagonalTechFront(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const parts: string[] = [paintBackground(d.background, w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, ornament: d.ornament })]
  const ink = d.palette.ink
  const accent = d.palette.accent
  // brand small top-left, monogram top-right — the painter's own faces on its native pairing, the type system's on any other
  const tf = titleFaces(d.typePairing, 'sans-light/sans-heavy', { light: 'sans-light', heavy: 'sans-heavy', tracking: 0.02 })
  const brandTrack = tf.tracking === 0.02 ? 0.2 : Math.max(0.06, tf.tracking)
  const bSize = fitSize(copy.brand.toLocaleUpperCase('tr'), w * 0.5, 3.4 * ctx.titleScale, 1.8 * ctx.titleScale, tf.heavy, brandTrack)
  parts.push(textEl({ x: m, y: m + bSize, text: copy.brand.toLocaleUpperCase('tr'), size: bSize, face: tf.heavy, fill: ink, tracking: bSize * brandTrack, extra: 'data-edit="brand"' }))
  ledger.text('brand', m, m + bSize, textWidth(copy.brand.toLocaleUpperCase('tr'), bSize, tf.heavy, bSize * brandTrack), bSize)
  const mono = monogramLockup(ledger, d, w - m - w * 0.12, m, copy.brand, w * 0.24, accent, identOf(ctx), {
    maxStackH: Math.min(h * 0.22, 22),
  })
  parts.push(mono.markup)
  // product light + heavy, left aligned, mid
  const words = copy.product.toLocaleUpperCase('tr').split(/\s+/)
  const first = words.length > 1 ? words.slice(0, -1).join(' ') : ''
  const last = words[words.length - 1] ?? ''
  const colW = w - m * 2
  const titleMax = Math.min(9, colW * 0.16) * ctx.titleScale
  const tSize = Math.min(fitSize(first || last, colW, titleMax, 2.8 * ctx.titleScale, tf.light, tf.tracking), fitSize(last, colW, titleMax, 2.8 * ctx.titleScale, tf.heavy, tf.tracking))
  // Same corner-brand + diagonal skeleton, three drops for the product block.
  const dropAt = d.variant === 1 ? 0.32 : d.variant === 2 ? 0.54 : 0.42
  let y = Math.max(mono.bottom + 6, h * dropAt)
  let productBlock = ''
  if (first) {
    productBlock += textEl({ x: m, y, text: first, size: tSize, face: tf.light, fill: ink, tracking: tSize * tf.tracking })
    ledger.text('product-light', m, y, textWidth(first, tSize, tf.light, tSize * tf.tracking), tSize)
    y += tSize * 1.05
  }
  productBlock += textEl({ x: m, y, text: last, size: tSize, face: tf.heavy, fill: ink, tracking: tSize * tf.tracking })
  ledger.text('product', m, y, textWidth(last, tSize, tf.heavy, tSize * tf.tracking), tSize)
  parts.push(`<g data-edit="product">${productBlock}</g>`)
  y += tSize * 0.6
  const cat = categoryCaption(ctx)
  const catSize = Math.max(1.7, tSize * 0.36)
  if (cat) {
    parts.push(textEl({ x: m, y: y + catSize * 1.2, text: cat, size: catSize, face: 'sans', fill: accent, tracking: catSize * 0.3 }))
    ledger.text('category', m, y + catSize * 1.2, textWidth(cat, catSize, 'sans', catSize * 0.3), catSize)
    y += catSize * 2.6
  }
  let cx = m
  let chipsBottom = y
  for (const c of d.chips.slice(0, 2)) {
    // Measured before it is booked: `chip` ledgers as it draws, so checking afterwards left a
    // booked-but-unpainted element behind and preflight failed the face for it.
    const size = typeSize(Math.min(1.9, w * 0.024))
    if (cx + chipWidth(c, size) > w - m) break
    const el = chip(ledger, d, cx, y, c, { color: ink, size })
    parts.push(el.markup)
    cx += el.w + 2
    chipsBottom = Math.max(chipsBottom, y + el.h)
  }
  /*
   * Foot: quality badge left, volume right. The badge sits at a fixed height from the foot; on a
   * squat front (the 90 × 45 earbuds carton) the product block drops to where the chips land on
   * the same line and the badge printed through them — measured as `chip-text × badge-text` in
   * the ledger. The badge is the one thing here that can go without being missed, so it yields.
   */
  const badgeTop = h - m - 5.2
  if (badgeTop > chipsBottom + 1) {
    const badge = qualityBadge(ledger, d, m + 14, badgeTop, d.locale === 'en' ? 'PREMIUM QUALITY' : 'PREMIUM KALİTE', '', accent)
    parts.push(badge.markup)
  }
  if (d.volumeLine) parts.push(netQuantity(ledger, w - m, h - m * 0.9, d.volumeLine, Math.max(1.8, Math.min(2.4, w * 0.03)), ink, 'end'))
  return parts.join('')
}

export function paintBoxFront(ctx: LayoutCtx): string {
  // The second repertoire paints its own front — see `refArchetypes.ts`.
  const reference = paintReferenceFace(ctx)
  if (reference !== null) return reference
  // A composition borrows the archetype's field and type and supplies the arrangement — see `compositions.ts`.
  const composed = paintComposition(ctx)
  if (composed !== null) return composed

  switch (studioArchetypeOf(ctx.d.archetype)) {
    case 'ink-wash':
      return inkWashFront(ctx)
    case 'marble-frame':
      return marbleFront(ctx)
    case 'botanical-card':
      return botanicalCardFront(ctx)
    case 'diagonal-tech':
      return diagonalTechFront(ctx)
    case 'line-scene':
      return paintLineSceneFace(ctx, { rounded: false })
    case 'wave-panel':
      return paintWavePanelFace(ctx)
    case 'specimen-hero':
      return paintSpecimenHeroFace(ctx)
    case 'atelier-plate':
      return paintAtelierPlateFace(ctx)
    case 'crest-panel':
      return paintCrestPanelFace(ctx)
    case 'noir-stack':
    default:
      return noirStack(ctx)
  }
}

/* -------------------------------------------------------------------- back */

export function paintBoxBack(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const arche = studioArchetypeOf(d.archetype)
  const light = arche === 'ink-wash' || arche === 'line-scene' || arche === 'atelier-plate'
  const bg = light ? d.palette.card : arche === 'marble-frame' ? d.palette.ground : arche === 'botanical-card' || arche === 'wave-panel' ? d.palette.ground : d.palette.ground
  const ink = light ? d.palette.cardInk : d.palette.ink
  const accent = arche === 'botanical-card' ? '#ffffff' : d.palette.accent
  const parts: string[] = [ground(w, h, bg)]
  // The back carries the densest type on the carton, so its field is a whisper of the front's
  // system rather than a repeat of it — present enough that the panel belongs to the box, quiet
  // enough that the ingredient column stays the thing you read.
  parts.push(
    paintBackground(secondaryField(d), w, h, fieldPalette(d.palette, d.archetype, bg, FIELD_MUTE.back), d.seed + 7, {
      species: ctx.species,
      uid: `${ctx.uid}-b`,
      intensity: FIELD_INTENSITY.back,
    }),
  )
  // A reference archetype wears its own outline here; the studio ten wear the shared frame.
  parts.push(paintReferenceSkin(ctx, 'back') ?? paintFrame(d, w, h, { inset: m * 0.55, color: accent, opacity: 0.8 }))
  const hdr = backHeaders(d.locale)
  // header lockup
  /*
   * The back's header answers to the panel's height as well as its width. Sized on width alone,
   * a 140 x 40 pillow back spent 18 of its 40 mm on brand + product + category and left the
   * mandatory legal block 4.2 mm — room for a heading and not for a line under it.
   */
  const brandMax = Math.min(7, w * 0.1, h * 0.12)
  const lock = stackedLockup(ledger, d, w / 2, m * 1.4, w - m * 3, copy.brand, '', withIdent(ctx, { color: ink, markColor: accent, brandMax }))
  parts.push(lock.markup)
  const stack = productStack(ledger, d, w / 2, lock.bottom + 1, w - m * 3, copy.product, withIdent(ctx, { color: ink, accent, category: d.categoryLine, max: Math.min(secondaryMax(lock.brandSize), w * 0.065) }))
  parts.push(stack.markup)
  let y = stack.bottom + Math.min(3, Math.max(1.2, h * 0.03))
  const blob = `${ctx.brief.subProduct} ${ctx.brief.productName} ${ctx.brief.sector}`.toLocaleLowerCase('tr')
  // footer reserve: pictos + barcode + producer
  const barH = Math.max(7, Math.min(10, h * 0.07))
  /*
   * The strip under the barcode holds the producer line. It was a flat 9 mm, which is a fifth
   * of a 40 mm pillow-box back — enough on its own to leave the mandatory legal block with no
   * room at all. It scales with the panel now, so a short back spends its height on content.
   */
  const footTop = h - m - barH - Math.min(9, Math.max(4.5, h * 0.13))

  /*
   * The legal block is mandatory; the brand story is not.
   *
   * The story used to take four lines unconditionally, before anything measured what was left. On
   * a tall carton that is fine. On a wide, short back — a pillow box, a tray, a carrier, a rigid
   * gift base, all roughly 40–50 mm tall — the header and those four lines ran past the footer
   * reserve, `legalColumn` found `y` already below its limit and drew *nothing*, and the export
   * gate correctly refused the file for having no regulatory stack. Measured across the catalogue:
   * 7 of the 41 realistic template × sector pairings failed this way.
   *
   * So the mandatory block is reserved first and the story takes what is genuinely spare.
   */
  const sectionCount = d.sector === 'food' || d.sector === 'beverage' ? 2 : 3
  const legalFloor = typeSize(1.5)
  const perSection = legalFloor * 4.06 // title + one body line + the gap after it
  const legalReserve = Math.min(perSection * sectionCount, Math.max(perSection, (footTop - y) * 0.55))

  // story
  const bodySize = typeSize(Math.min(1.8, w * 0.024))
  const storyLines = linesThatFit(y, footTop - legalReserve, bodySize, 4)
  if (storyLines > 0) {
    const story = paragraph(ledger, m * 1.4, y, w - m * 2.8, d.story, bodySize, pairingFaces(d.typePairing).body, ink, storyLines, 'middle')
    parts.push(story.markup)
    y = story.bottom + 2
  }
  // sector block: notes (perfume) / nutrition + benefits (food) / spec chips (electronics)
  // Every sector block stops short of the legal reserve too — the notes table and the nutrition
  // table are informative, not mandatory, and on a short back they used to consume the room the
  // regulatory stack needed (and, unbounded, to overlap themselves: `notes-head × notes-head`).
  const blockLimit = footTop - legalReserve
  /*
   * A food back keeps its ingredients beside the nutrition table, so the legal column below leaves
   * them out. When the table cannot be drawn they had nowhere to go and simply vanished — measured
   * on five catalogue shapes, a regulated register missing from a file the customer sends to print.
   * The column takes them back whenever the table did not.
   */
  let ingredientsBesideTable = false
  if (d.sector === 'perfume') {
    const pyramid = scentPyramid(ctx.brief)
    if (pyramid && blockLimit - y > 22) {
      parts.push(spacedLine(ledger, w / 2, y + 1.6, d.taglineLine, 1.5, accent, w - m * 3, 'middle', 'sans', 'tagline'))
      const notes = notesTable(ledger, m, y + 4.5, w - m * 2, hdr.notes, pyramid, ink, accent)
      parts.push(notes.markup)
      y = notes.bottom + 1.5
    }
  } else if ((d.sector === 'food' || d.sector === 'beverage') && blockLimit - y <= 26) {
    // The food register never opens: not a renderer fault, a back with no room left for it.
    for (const reg of ['nutrition-table', 'storage'] as const) ledger.skip(reg, 'no-space')
  } else if (d.sector === 'food' || d.sector === 'beverage') {
    const row = benefitRow(ledger, d, m, y, w - m * 2, d.benefits.slice(0, 4), accent, { labelColor: ink, r: Math.min(3.6, w * 0.06) })
    parts.push(row.markup)
    y = row.bottom + 2.5
    const tableSize = typeSize(Math.min(1.58, w * 0.02))
    // leave room for at least the usage / warnings block under the table
    const tableLimit = Math.min(blockLimit, footTop - Math.max(14, (footTop - y) * 0.42))
    if (y + nutritionTableHeight(3, tableSize) >= tableLimit) {
      ledger.skip('nutrition-table', 'no-space')
      // Storage rides with the table and has no second home; ingredients fall back to the column.
      ledger.skip('storage', 'no-space')
    }
    if (y + nutritionTableHeight(3, tableSize) < tableLimit) {
      const tableW = Math.min(w - m * 2, Math.max(28, (w - m * 2) * 0.58))
      const table = nutritionTable(ledger, m, y, tableW, hdr.nutrition, nutritionRows(d.locale, blob), ink, tableSize, tableLimit)
      parts.push(table.markup)
      // right of the table: ingredients + storage
      if (w - m * 2 - tableW > 18) {
        const rx = m + tableW + 2.5
        const right = legalColumn(ledger, rx, y, w - m - rx, table.bottom, [
          { title: hdr.ingredients, body: copy.ingredients, edit: 'ingredients' },
          { title: hdr.storage, body: usageLine('food', d.locale), id: 'storage' },
        ], ink, { size: legalTypeSize(w, table.bottom - y, 'aside'), titleColor: ink })
        parts.push(right.markup)
        ingredientsBesideTable = true
        y = Math.max(table.bottom, right.bottom) + 1.5
      } else {
        // No room beside the table: storage has no second home, ingredients fall back below.
        ledger.skip('storage', 'no-space')
        y = table.bottom + 1.5
      }
    }
  } else if (d.sector === 'electronics' && blockLimit - y > 14) {
    let cx = m
    for (const c of d.chips.slice(0, 3)) {
      const size = typeSize(Math.min(1.7, w * 0.02))
      if (cx + chipWidth(c, size) > w - m) break
      const el = chip(ledger, d, cx, y, c, { color: ink, size })
      parts.push(el.markup)
      cx += el.w + 1.8
    }
    y += 6
  } else if (blockLimit - y > 22) {
    const row = benefitRow(ledger, d, m, y, w - m * 2, d.benefits.slice(0, 3), accent, { labelColor: ink, r: Math.min(3.4, w * 0.055) })
    parts.push(row.markup)
    y = row.bottom + 2.5
  }
  // legal sections (the gate reads KULLANIM / INGREDIENTS / DIRECTIONS here)
  const sections: Section[] = [
    ...(ingredientsBesideTable ? [] : [{ title: hdr.ingredients, body: copy.ingredients, edit: 'ingredients' }]),
    { title: hdr.usage, body: usageCopy(copy, d.sector, d.locale), edit: 'usage' },
    { title: hdr.warnings, body: copy.warnings, edit: 'warnings' },
  ]
  /*
   * The reserve is a floor, not a target. The blocks above stop at `footTop - legalReserve`, but
   * each leaves a gap after itself, and that gap pushed the start past the reserve — measured on
   * a 160 x 40 food tray, the legal block was left 4.36 mm where it needed 4.44 and drew nothing
   * at all. Clamping the start guarantees the mandatory block the room that was set aside for it.
   */
  const legalTop = Math.min(y, Math.max(0, footTop - legalReserve))
  const legal = legalColumn(ledger, m * 1.2, legalTop, w - m * 2.4, footTop, sections, ink, { size: legalTypeSize(w, footTop - legalTop), anchor: 'middle', titleColor: accent === ink ? ink : accent })
  parts.push(legal.markup)
  // footer: pictos left, volume middle, barcode right
  const rowY = h - m - barH - 5.5
  const picS = Math.max(3.8, Math.min(5.5, barH * 0.62))
  const pics = pictogramsForBack(d).slice(0, 4)
  const pic = pictogramRow(ledger, m, rowY + (barH - picS) / 2 - 1.6, picS, pics, ink, ctx.paoMonths, { quality: true })
  parts.push(pic.markup)
  const barW = Math.min(w * 0.4, 30)
  const barX = w - m - barW
  parts.push(barcodeBlock(ledger, barX, rowY, barW, barH - 3.2, copy.barcode, ink, !isDark(bg)))
  const vs = Math.max(1.5, Math.min(2.1, w * 0.025))
  const volX = m + pic.w + 2
  const volW = d.volumeLine ? textWidth(d.volumeLine, vs, 'sans', vs * 0.06) : 0
  const qrRoom = d.sector === 'food' && barX - picS - 3 - (volX + volW) > 2.5
  if (d.volumeLine && volX + volW < barX - 2.5) {
    parts.push(netQuantity(ledger, volX, rowY + barH * 0.52, d.volumeLine, vs, ink, 'start'))
  }
  if (qrRoom) parts.push(qrPlaceholder(ledger, barX - picS - 3, rowY, picS, ink, d.seed + 3))
  // producer + origin
  const pSize = typeSize(Math.min(1.45, w * 0.017))
  const producer = paragraph(ledger, m, h - m - 3.2, w - m * 2, `${copy.manufacturer} · ${copy.address}`, pSize, 'sans', ink, 1, 'middle', false, 'manufacturer')
  parts.push(producer.markup)
  parts.push(spacedLine(ledger, w / 2, h - m * 0.55, d.locale === 'en' ? 'MADE IN TÜRKİYE' : 'TÜRKİYE’DE ÜRETİLDİ', 1.1, ink, w - m * 2))
  return parts.join('')
}

/* -------------------------------------------------------------------- sides */

export function paintBoxSide(ctx: LayoutCtx, index: number): string {
  // The carton roles decide what a side carries — see `compositions.ts`.
  const composed = paintCompositionSide(ctx, index)
  if (composed !== null) return composed

  const { w, h, d, ledger, copy } = ctx
  const arche = studioArchetypeOf(d.archetype)
  const bg = deepGround(d.palette, arche)
  const ink = deepInk(d.palette, arche)
  const m = marginFor(w, h)
  const parts: string[] = [ground(w, h, bg)]
  parts.push(
    paintBackground(secondaryField(d), w, h, fieldPalette(d.palette, d.archetype, bg, FIELD_MUTE.side), d.seed + 11 + index, {
      species: ctx.species,
      uid: `${ctx.uid}-s${index}`,
      intensity: FIELD_INTENSITY.side,
    }),
  )
  parts.push(paintReferenceSkin(ctx, 'side') ?? paintFrame(d, w, h, { inset: Math.min(m * 0.5, 1.8), color: d.palette.accent, opacity: 0.75 }))
  // Three side regimes: full column (≥ 28 mm wide, ≥ 60 mm tall), compact (≥ 20 mm wide), spine (rotated text only).
  const full = w >= 28 && h >= 60
  const compact = !full && w >= 20 && h >= 40
  const colW = w - m * 1.6
  if (full) {
    // GUESS / Rebull side: mark top, stacked manifesto middle, brand bottom, spine text along the edge
    const r = Math.min(w * 0.14, 5)
    /*
     * A reference face either crowns its mark or shows none at all. This side used to draw the bare
     * sector glyph either way, which on a face that never showed one is a second brand mark — it was
     * happening on 116 of 614 reference panels. So: the face's own crowned mark where there is one,
     * nothing where there is not, and the studio ten keep the glyph they have always had.
     */
    const crowned = arche === null ? paintReferenceCrownMark(ctx, w / 2, m, r, ink) : null
    if (crowned !== null) {
      parts.push(crowned)
      ledger.add('element', 'side-mark', w / 2 - r * 1.2, m, r * 2.4, r * 2.4)
    } else if (arche !== null) {
      parts.push(paintMark(markKindFor(d), w / 2, m + r * 1.2, r, ink, copy.brand, identOf(ctx)))
      ledger.add('element', ctx.logoHref && r >= STUDIO_MIN_LOGO_R ? 'side-logo' : 'side-mark', w / 2 - r * 1.4, m, r * 2.8, r * 2.4)
    }
    const words = stackedWords(ledger, w / 2, h * 0.36, d.manifesto.slice(0, 4), Math.min(2.4, w * 0.085), ink, colW)
    parts.push(words.markup)
    const brandSize = fitSize(copy.brand.toLocaleUpperCase('tr'), colW, Math.min(3.6, w * 0.12), 1.6, pairingFaces(d.typePairing).brand, 0.16)
    const by = h - m * 2.4
    parts.push(textEl({ x: w / 2, y: by, text: copy.brand.toLocaleUpperCase('tr'), size: brandSize, face: pairingFaces(d.typePairing).brand, fill: ink, anchor: 'middle', tracking: brandSize * 0.16 }))
    ledger.text('side-brand', w / 2, by, textWidth(copy.brand.toLocaleUpperCase('tr'), brandSize, pairingFaces(d.typePairing).brand, brandSize * 0.16), brandSize, 'middle')
    parts.push(spacedLine(ledger, w / 2, by + 2.6, cityLine(ctx.brief), 1.1, mix(ink, bg, 0.3), colW))
    parts.push(verticalBrand(ledger, w - m * 0.55, h * 0.5, d.categoryLine, 1.4, mix(ink, bg, 0.55), h * 0.5))
    return parts.join('')
  }
  if (compact) {
    // mark on top, brand near the foot, rotated product line between them
    const r = Math.min(w * 0.16, 3.6)
    parts.push(paintMark(markKindFor(d), w / 2, m + r * 1.1, r, ink, copy.brand, identOf(ctx)))
    ledger.add('element', ctx.logoHref && r >= STUDIO_MIN_LOGO_R ? 'side-logo' : 'side-mark', w / 2 - r * 1.4, m, r * 2.8, r * 2.2)
    const brandSize = fitSize(copy.brand.toLocaleUpperCase('tr'), colW, Math.min(2.8, w * 0.12), 1.4, pairingFaces(d.typePairing).brand, 0.14)
    const by = h - m * 1.6
    parts.push(textEl({ x: w / 2, y: by, text: copy.brand.toLocaleUpperCase('tr'), size: brandSize, face: pairingFaces(d.typePairing).brand, fill: ink, anchor: 'middle', tracking: brandSize * 0.14 }))
    ledger.text('side-brand', w / 2, by, textWidth(copy.brand.toLocaleUpperCase('tr'), brandSize, pairingFaces(d.typePairing).brand, brandSize * 0.14), brandSize, 'middle')
    const spineTop = m + r * 2.6
    const spineBottom = by - brandSize * 1.6
    const spineLen = spineBottom - spineTop
    const spineLine = categoryCaption(ctx) ? `${copy.product} · ${categoryCaption(ctx)}` : copy.product
    // This spine shares the panel's centre line with the mark above and the brand below, so it
    // only gets painted when the gap can hold the rotated line at its smallest size. Without the
    // guard `fitSize` floors at 1.6 mm and the text runs straight across both of them.
    const spineFits = spineLen > 0 && textWidth(spineLine.toLocaleUpperCase('tr'), 1.6, 'sans', 1.6 * 0.3) <= spineLen
    if (spineFits) {
      parts.push(verticalBrand(ledger, w / 2, (spineTop + spineBottom) / 2, spineLine, Math.min(2.4, w * 0.11), mix(ink, bg, 0.2), spineLen))
    } else if (w > h && spineLen > 4) {
      // A side wider than tall reads its spine along the width, unrotated — still the spine, and
      // marked as one for the carton gate (the squat earbuds carton had none and could not export).
      const s = Math.min(2.4, h * 0.09)
      parts.push(`<g data-art="spine">${spacedLine(ledger, w / 2, (spineTop + spineBottom) / 2 + s * 0.35, spineLine, s, mix(ink, bg, 0.2), w - m * 2.4)}</g>`)
    }
    return parts.join('')
  }
  // narrow spine: one line along the long axis (rotated when the panel is taller than wide)
  const spineText = `${copy.brand}  ·  ${copy.product}`
  if (h >= w) {
    parts.push(verticalBrand(ledger, w / 2, h / 2, spineText, Math.min(3, w * 0.4), ink, h - m * 3, pairingFaces(d.typePairing).brand))
  } else {
    // A side wider than tall reads its spine the way it stands: along the width, unrotated. It is
    // still the spine, and marked as one — the carton gate used to look only for the rotation and
    // refused to export the squat earbuds carton, one of the eighteen frozen faces.
    const s = Math.min(3, h * 0.4)
    parts.push(`<g data-art="spine">${spacedLine(ledger, w / 2, h / 2 + s * 0.35, spineText, s, ink, w - m * 3, 'middle', pairingFaces(d.typePairing).brand)}</g>`)
  }
  return parts.join('')
}

/* ------------------------------------------------------------- top / bottom */

export function paintBoxTop(ctx: LayoutCtx, which: 'top' | 'bottom'): string {
  const { w, h, d, ledger, copy } = ctx
  const arche = studioArchetypeOf(d.archetype)
  const bg = deepGround(d.palette, arche)
  const ink = deepInk(d.palette, arche)
  const m = marginFor(w, h)
  const parts: string[] = [ground(w, h, bg)]
  // The lid is the panel a customer sees first on a shelf, so it wears the field too.
  parts.push(
    paintBackground(secondaryField(d), w, h, fieldPalette(d.palette, d.archetype, bg, FIELD_MUTE.lid), d.seed + 19, {
      species: ctx.species,
      uid: `${ctx.uid}-${which}`,
      intensity: FIELD_INTENSITY.lid,
    }),
  )
  // The lid is on the shelf as much as the front is, so it wears the archetype's outline too.
  parts.push(paintReferenceSkin(ctx, 'side') ?? paintFrame(d, w, h, { inset: Math.min(m * 0.5, 1.6), color: d.palette.accent, opacity: 0.7 }))
  const tall = h >= 14
  const brandSize = fitSize(copy.brand.toLocaleUpperCase('tr'), w - m * 2, Math.min(tall ? 5 : 3.4, h * 0.34) * ctx.titleScale, 1.6 * ctx.titleScale, pairingFaces(d.typePairing).brand, 0.16)
  const by = h / 2 + (tall ? -0.5 : brandSize * 0.35)
  parts.push(textEl({ x: w / 2, y: by, text: copy.brand.toLocaleUpperCase('tr'), size: brandSize, face: pairingFaces(d.typePairing).brand, fill: ink, anchor: 'middle', tracking: brandSize * 0.16 }))
  ledger.text('top-brand', w / 2, by, textWidth(copy.brand.toLocaleUpperCase('tr'), brandSize, pairingFaces(d.typePairing).brand, brandSize * 0.16), brandSize, 'middle')
  if (tall) {
    const line = which === 'top' ? cityLine(ctx.brief) : d.taglineLine
    parts.push(spacedLine(ledger, w / 2, by + 3.2, line, 1.2, mix(ink, bg, 0.25), w - m * 2))
  }
  return parts.join('')
}

export function paintBoxFlap(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const arche = studioArchetypeOf(d.archetype)
  const bg = deepGround(d.palette, arche)
  const ink = mix(deepInk(d.palette, arche), bg, 0.2)
  const vol = d.volumeLine
  const canBrand = h >= 8 && w >= 16
  const canVol = Boolean(vol) && h >= 12 && w >= 22
  // Tuck flaps are folded away on the built box, but the customer reads the dieline flat before
  // anything is folded — a plain strip between two textured panels is the seam that made the
  // carton look assembled from parts.
  const parts: string[] = [
    `<g data-art="flap">${ground(w, h, bg)}`,
    paintBackground(secondaryField(d), w, h, fieldPalette(d.palette, d.archetype, bg, FIELD_MUTE.flap), d.seed + 23, {
      species: ctx.species,
      uid: `${ctx.uid}-flap`,
      intensity: FIELD_INTENSITY.flap,
    }),
  ]
  if (canBrand) {
    const brand = copy.brand.toLocaleUpperCase('tr')
    const face = pairingFaces(d.typePairing).brand
    const s = fitSize(brand, w - 4, Math.min(2.8, h * (canVol ? 0.22 : 0.28)), 1.2, face, 0.2)
    const brandY = canVol ? h * 0.38 + s * 0.35 : h / 2 + s * 0.35
    parts.push(textEl({ x: w / 2, y: brandY, text: brand, size: s, face, fill: ink, anchor: 'middle', tracking: s * 0.2 }))
    ledger.text('flap-brand', w / 2, brandY, textWidth(brand, s, face, s * 0.2), s, 'middle')
    if (canVol && vol) {
      let vs = Math.max(1.2, Math.min(2.2, h * 0.16))
      const maxW = w - 4
      while (vs > 1.2 && textWidth(vol, vs, 'sans', vs * 0.06) > maxW) vs -= 0.1
      if (textWidth(vol, vs, 'sans', vs * 0.06) <= maxW) {
        parts.push(netQuantity(ledger, w / 2, Math.min(h - 1.4, brandY + s * 0.85 + vs), vol, vs, mix(ink, bg, 0.12)))
      }
    }
  }
  parts.push('</g>')
  return parts.join('')
}

export function paintGlue(ctx: LayoutCtx): string {
  const arche = studioArchetypeOf(ctx.d.archetype)
  return ground(ctx.w, ctx.h, lighten(deepGround(ctx.d.palette, arche), 0.02))
}

export function paintPlain(ctx: LayoutCtx): string {
  const arche = studioArchetypeOf(ctx.d.archetype)
  const bg = deepGround(ctx.d.palette, arche)
  const parts = [ground(ctx.w, ctx.h, bg)]
  if (ctx.w > 20 && ctx.h > 10) {
    const s = Math.min(3, ctx.h * 0.25)
    parts.push(textEl({ x: ctx.w / 2, y: ctx.h / 2 + s * 0.35, text: ctx.copy.brand.toLocaleUpperCase('tr'), size: s, face: 'sans', fill: mix(deepInk(ctx.d.palette, arche), bg, 0.3), anchor: 'middle', tracking: s * 0.2 }))
    ctx.ledger.text('plain-brand', ctx.w / 2, ctx.h / 2 + s * 0.35, textWidth(ctx.copy.brand, s, 'sans', s * 0.2), s, 'middle')
  }
  return parts.join('')
}

export { hairline }
