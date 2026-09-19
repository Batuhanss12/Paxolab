/**
 * Label archetypes — six full-anatomy label faces + one shared utility back.
 * Panel-local coordinates; every element goes through the ledger.
 */
import {
  barcodeBlock,
  benefitRow,
  bezelFrame,
  brandMark,
  brandPill,
  chip,
  claimBand,
  cornerBrackets,
  hairline,
  heroInk,
  legalColumn,
  legalTypeSize,
  markKindFor,
  monogramLockup,
  netQuantity,
  nutritionTable,
  nutritionTableHeight,
  paintFrame,
  paintMark,
  paragraph,
  pictogramRow,
  pictogramsFor,
  pictogramsForBack,
  productStack,
  qrPlaceholder,
  secondaryMax,
  linesThatFit,
  spacedLine,
  stackedLockup,
  stackedWords,
  thinDoubleFrame,
  titleCard,
  STUDIO_MIN_LOGO_R,
  type Section,
} from './anatomy'
import { ground, paintBackground } from './backgrounds'
import { paintComposition } from './compositions'
import { FIELD_INTENSITY, FIELD_MUTE, fieldPalette, secondaryField } from './panelField'
import { heroStyle, speciesHero } from './species'
import { isReferenceArchetype, paintReferenceFace, paintReferenceRoundFace, paintReferenceSkin, paintReferenceTagFace } from './refArchetypes'
import { fitSubject } from './subject'
import { titleFaces } from './typeSystem'
import { darken, isDark, lighten, mix, readableInk } from './color'
import { backHeaders, claimLine, liveClaim, nutritionRows, usageCopy } from './copyBank'
import { fitLabelBarcode } from '../barcode'
import { cityLine, identOf, isLandscape, isRound, isTiny, marginFor, seamMark, spanAt, withIdent, categoryCaption, type LayoutCtx } from './layoutContext'
import { Ledger, fitSize, fitsAtFloor, pairingFaces, textEl, textWidth, typeSize, wrapByWidth } from './text'
import type { LabelArchetype } from './types'

const f = (n: number) => (Math.round(n * 100) / 100).toString()

function legalSections(ctx: LayoutCtx): Section[] {
  const hdr = backHeaders(ctx.d.locale)
  return [
    { title: hdr.usage, body: usageCopy(ctx.copy, ctx.d.sector, ctx.d.locale), edit: 'usage' },
    { title: hdr.warnings, body: ctx.copy.warnings, edit: 'warnings' },
    { title: hdr.ingredients, body: ctx.copy.ingredients, edit: 'ingredients' },
  ]
}

function producerLine(ctx: LayoutCtx): string {
  return `${ctx.copy.manufacturer} · ${ctx.copy.address}`
}

/* -------------------------------------------------------------- card-on-art */

function cardOnArt(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const landscape = isLandscape(w, h)
  const parts: string[] = [paintBackground(d.background, w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, intensity: 0.85, ornament: d.ornament })]
  const pill = brandPill(ledger, d, w - m, m, copy.brand, w * 0.42, identOf(ctx))
  parts.push(pill.markup)
  const ink = d.palette.ink
  // bottom-left reserve: pictograms + net quantity (measured first so the card block can avoid it)
  const picS = Math.max(4, Math.min(6, h * 0.075))
  const picY = h - m - picS
  const volSize = Math.max(2, Math.min(3.2, w * 0.035))
  const vol = d.volumeLine
  const reserveTop = vol ? picY - volSize * 1.9 : picY - 1
  const bandText = liveClaim(copy, d.chips[0] ?? d.categoryLine)
  // title card + claim band + sentence: measure on a probe ledger, then place the block so it ends above the reserve
  const cardW = landscape ? w * 0.44 : w - m * 2
  const cardX = landscape ? w - m - cardW : m
  const sentenceSize = Math.max(1.6, Math.min(2.3, cardW * 0.045))
  const sentenceText = d.taglineLine || copy.tagline
  const probe = new Ledger(ledger.panel)
  const pCard = titleCard(probe, d, cardX, 0, cardW, copy.product, d.categoryLine, withIdent(ctx, { prefix: d.productPrefix }))
  const pBand = claimBand(probe, d, cardX, pCard.bottom, cardW, bandText)
  const pSentence = paragraph(probe, cardX, pBand.bottom + 2, cardW, sentenceText, sentenceSize, 'sans', ink, 2, 'middle')
  const blockH = pSentence.bottom
  const wanted = landscape ? pill.box.y + pill.box.h + h * 0.12 : h * 0.36
  const blockBottomLimit = landscape ? h - m : reserveTop - 2.5
  const cardY = Math.max(pill.box.y + pill.box.h + 2, Math.min(wanted, blockBottomLimit - blockH))
  const card = titleCard(ledger, d, cardX, cardY, cardW, copy.product, d.categoryLine, withIdent(ctx, { prefix: d.productPrefix }))
  parts.push(card.markup)
  const band = claimBand(ledger, d, cardX, card.bottom, cardW, bandText, undefined, undefined, 'cta')
  parts.push(band.markup)
  // On a small face the block floor wins over `blockBottomLimit`, so the sentence can reach the
  // pictogram / net-quantity reserve. Drop lines instead of overprinting them.
  const sentenceLimit = landscape ? h - m : reserveTop - 1
  const sentenceLines = linesThatFit(band.bottom + 2, sentenceLimit, sentenceSize, 2)
  if (sentenceLines > 0) {
    const sentence = paragraph(ledger, cardX, band.bottom + 2, cardW, sentenceText, sentenceSize, 'sans', ink, sentenceLines, 'middle', false, 'tagline')
    parts.push(sentence.markup)
  }
  const pic = pictogramRow(ledger, m, picY, picS, pictogramsFor(d).filter((k) => k !== 'flammable').slice(0, 3), ink, ctx.paoMonths)
  parts.push(pic.markup)
  if (vol) parts.push(netQuantity(ledger, m, picY - volSize * 0.9, vol, volSize, ink, 'start'))
  if (ctx.wrapSeam) parts.push(seamMark(w, h, ink))
  return parts.join('')
}

/* ------------------------------------------------------------ marble-frame */

function marbleFrame(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const landscape = isLandscape(w, h)
  const parts: string[] = [paintBackground('marble', w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, intensity: 0.85, ornament: d.ornament })]
  const ink = d.palette.ink
  const accent = d.palette.accent
  // lockup inside corner brackets in the upper third
  const bx = m * 1.6
  const bw = w - bx * 2
  const by = h * 0.1
  const lock = stackedLockup(ledger, d, w / 2, by + 3, bw - 6, copy.brand, liveClaim(copy, d.chips[1] ?? d.taglineLine), withIdent(ctx, { mark: true, markColor: accent, color: d.palette.accent2, brandMax: Math.min(bw * 0.15, 10), subEdit: 'cta' }))
  parts.push(lock.markup)
  const bh = lock.bottom - by + 3
  parts.push(cornerBrackets(bx, by, bw, bh, accent, Math.min(bw * 0.22, 12)))
  // tiny "HIGH-QUALITY COFFEE" style category under the bracket
  const catSize = 1.5
  const marbleCat = categoryCaption(ctx)
  // product at the foot: script prefix + heavy product
  const volSize = d.volumeLine ? Math.max(2, Math.min(2.8, w * 0.032, h * 0.07)) : 0
  // Tied to the brand that was actually drawn, not to a ceiling beside it — see `secondaryMax`.
  const stackMax = Math.min(secondaryMax(lock.brandSize), w * 0.11, landscape || h < 55 ? Math.max(2.8, h * 0.18) : 8.5)
  const stackH = stackMax * (d.productPrefix ? 1.9 : 1.35) + (volSize ? volSize * 2.4 : 2)
  const productTop = Math.max(lock.bottom + 4, Math.min(h * 0.7, h - m - stackH))
  /*
   * `stackH` is an estimate used to place the stack; it was never enforced, so on a 120 × 50 device
   * label the caption, the script prefix and the product all landed on top of each other and the
   * last two ran off the panel. The caption yields when the stack is right behind it, and the stack
   * is handed the room the net quantity actually leaves it.
   */
  if (marbleCat && productTop - (by + bh + catSize * 2.2) > catSize * 3) {
    parts.push(spacedLine(ledger, w / 2, by + bh + catSize * 2.2, marbleCat, catSize, ink, bw))
  }
  const stack = productStack(ledger, d, w / 2, productTop, w - m * 2, copy.product, withIdent(ctx, {
    color: ink,
    accent,
    prefix: d.productPrefix,
    max: stackMax,
    room: Math.max(0, h - m - (volSize || 2) * 2.4 - productTop),
  }))
  parts.push(stack.markup)
  if (d.volumeLine) {
    const size = volSize || Math.max(2, Math.min(2.8, w * 0.032))
    parts.push(netQuantity(ledger, w / 2, Math.min(h - m, stack.bottom + size * 2.2), d.volumeLine, size, ink))
  }
  if (ctx.wrapSeam) parts.push(seamMark(w, h, ink))
  return parts.join('')
}

/* ----------------------------------------------------------- diagonal-split */

function diagonalSplit(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const parts: string[] = [paintBackground('diagonal', w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, clearRight: 0.48, ornament: d.ornament })]
  const ink = d.palette.ink
  const accent = d.palette.accent
  const lockInk = readableInk(d.palette.ground, ink)
  const landscape = isLandscape(w, h)
  const tiny = isTiny(w, h)
  const split = !tiny
  const colW = split ? w * 0.46 : w - m * 2
  const chipText = claimLine(copy, d.chips) || 'PROFESSIONAL'
  // left column: light + heavy product title
  const words = copy.product.toLocaleUpperCase('tr').split(/\s+/)
  const first = words.length > 1 ? words.slice(0, -1).join(' ') : ''
  const last = words[words.length - 1] ?? ''
  const titleMax = Math.min(landscape ? 7.5 : 8.5, colW * 0.17) * ctx.titleScale
  // The painter's own light + heavy sans on its native pairing; the type system's faces on any other.
  const tf = titleFaces(d.typePairing, 'sans-light/sans-heavy', { light: 'sans-light', heavy: 'sans-heavy', tracking: 0.02 })
  const tSize = Math.min(fitSize(first || last, colW, titleMax, 2.8 * ctx.titleScale, tf.light, tf.tracking), fitSize(last, colW, titleMax, 2.8 * ctx.titleScale, tf.heavy, tf.tracking))
  let y = m + tSize
  let productBlock = ''
  if (first) {
    productBlock += textEl({ x: m, y, text: first, size: tSize, face: tf.light, fill: ink, tracking: tSize * tf.tracking })
    ledger.text('product-light', m, y, textWidth(first, tSize, tf.light, tSize * tf.tracking), tSize)
    y += tSize * 1.05
  }
  productBlock += textEl({ x: m, y, text: last, size: tSize, face: tf.heavy, fill: ink, tracking: tSize * tf.tracking })
  ledger.text('product', m, y, textWidth(last, tSize, tf.heavy, tSize * tf.tracking), tSize)
  parts.push(`<g data-edit="product">${productBlock}</g>`)
  y += tSize * 0.9
  // sub + chip + gold category
  const subSize = Math.max(1.5, tSize * 0.32)
  parts.push(textEl({ x: m, y, text: d.taglineLine, size: subSize, face: 'sans', fill: d.palette.muted, extra: 'data-edit="tagline"' }))
  ledger.text('sub', m, y, textWidth(d.taglineLine, subSize, 'sans'), subSize)
  y += subSize * 1.6
  const c = chip(ledger, d, m, y, chipText, { color: ink, size: Math.max(1.5, subSize * 0.95), edit: 'cta' })
  parts.push(c.markup)
  y += c.h + subSize * 1.3
  const catSize = Math.max(1.9, tSize * 0.42)
  const splitCat = categoryCaption(ctx)
  if (splitCat) {
    parts.push(textEl({ x: m, y, text: splitCat, size: catSize, face: 'sans-heavy', fill: accent, tracking: catSize * 0.12 }))
    ledger.text('category', m, y, textWidth(splitCat, catSize, 'sans-heavy', catSize * 0.12), catSize)
  }
  // bottom-left: pictos only — address / usage / warnings live on the back
  const picS = Math.max(3.6, Math.min(5.2, h * 0.065))
  const picY = h - m - picS
  const pics = pictogramRow(ledger, m, picY, picS, pictogramsFor(d).filter((k) => k !== 'flammable').slice(0, 3), ink, ctx.paoMonths)
  parts.push(pics.markup)
  // right column: true split on both orientations — never overlay the left title
  const rx = split ? w * 0.52 : m
  const rw = split ? w - rx - m : w - m * 2
  const rcx = rx + rw / 2
  const rTop = m
  const mono = monogramLockup(ledger, d, rcx, rTop, copy.brand, rw * 0.6, lockInk, identOf(ctx), {
    maxStackH: Math.min(h * 0.32, landscape ? 24 : 20),
  })
  parts.push(mono.markup)
  if (landscape && !tiny) {
    parts.push(brandMark('leaf', rcx, mono.bottom + 4, 2.2, mix(accent, '#3f8a3a', 0.4)))
    ledger.add('element', 'leaf-mark', rcx - 2.4, mono.bottom + 1.6, 4.8, 4.8)
  }
  const volSize = Math.max(2, Math.min(2.8, rw * 0.06))
  const volBase = h - m * 0.6
  if (d.volumeLine) parts.push(netQuantity(ledger, rcx, volBase, d.volumeLine, volSize, ink))
  if (ctx.wrapSeam) parts.push(seamMark(w, h, ink))
  return parts.join('')
}

/* --------------------------------------------------------------- line-scene */

/** DNA Pharma system — white field, two-tone title, line-drawn scene. Shared by label and box front. */
export function paintLineSceneFace(ctx: LayoutCtx, opts: { rounded?: boolean } = {}): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const parts: string[] = [ground(w, h, d.palette.ground)]
  const ink = d.palette.ink
  const accent = d.palette.accent
  if (opts.rounded !== false) {
    /*
     * The label variant always carries this rounded edge; when the direction asked for
     * `rounded-card` it is also the frame it promised, so it says so. Drawn either way — the
     * declaration records what the ink already is, it does not decide whether to lay it down.
     */
    const declares = d.frame === 'rounded-card' ? ' data-frame="rounded-card"' : ''
    parts.push(`<rect x="0.4" y="0.4" width="${f(w - 0.8)}" height="${f(h - 0.8)}" rx="${f(Math.min(4, w * 0.06))}" fill="none" stroke="${mix(ink, d.palette.ground, 0.75)}" stroke-width="0.2"${declares} />`)
  }
  // brand mark + brand
  const r = Math.min(w * 0.1, 6)
  parts.push(paintMark(markKindFor(d), w / 2, m + r, r, ink, copy.brand, identOf(ctx)))
  ledger.add('element', ctx.logoHref && r >= STUDIO_MIN_LOGO_R ? 'brand-logo' : 'brand-mark', w / 2 - r * 1.4, m, r * 2.8, r * 2)
  // The painter's own heavy sans on its native pairing; the type system's faces on any other.
  const tf = titleFaces(d.typePairing, 'sans-light/sans-heavy', { light: 'sans-light', heavy: 'sans-heavy', tracking: 0.1 })
  const brandTrack = tf.tracking === 0.1 ? 0.12 : tf.tracking
  /*
   * This archetype's DNA declares `lockup: 'stacked-center'` — a display line, brand first. The
   * brand was boxed at 4.4 mm while the two-tone title below it reached 7.5 mm, so every one of the
   * 25 measured hierarchy violations in the engine was this painter breaking its own contract. The
   * brand gets the title's band; the title is then held to the size the brand actually achieved.
   */
  const displayBand = Math.min(7.5, w * 0.11) * ctx.titleScale
  const brandSize = fitSize(copy.brand.toLocaleUpperCase('tr'), w * 0.7, displayBand, 2.2 * ctx.titleScale, tf.heavy, brandTrack)
  const brandY = m + r * 2 + brandSize * 1.4
  parts.push(textEl({ x: w / 2, y: brandY, text: copy.brand.toLocaleUpperCase('tr'), size: brandSize, face: tf.heavy, fill: ink, anchor: 'middle', tracking: brandSize * brandTrack, extra: 'data-edit="brand"' }))
  ledger.text('brand', w / 2, brandY, textWidth(copy.brand.toLocaleUpperCase('tr'), brandSize, tf.heavy, brandSize * brandTrack), brandSize, 'middle')
  // two-tone title
  const words = copy.product.toLocaleUpperCase('tr').split(/\s+/)
  const a = words.length > 1 ? words.slice(0, Math.ceil(words.length / 2)).join(' ') : words[0]
  const b = words.length > 1 ? words.slice(Math.ceil(words.length / 2)).join(' ') : ''
  const titleMax = Math.min(displayBand, brandSize)
  const full = b ? `${a} ${b}` : a
  const size = fitSize(full, w - m * 2, titleMax, 2.6 * ctx.titleScale, tf.heavy, tf.tracking)
  const track = size * tf.tracking
  const wa = textWidth(a, size, tf.light, track)
  const wb = b ? textWidth(` ${b}`, size, tf.heavy, track) : 0
  const startX = w / 2 - (wa + wb) / 2
  // Same stack-over-scene skeleton, three rhythms: tight title with a taller scene, standard,
  // airy title with a shallower scene.
  const titleGap = d.variant === 1 ? 1.9 : d.variant === 2 ? 3.4 : 2.6
  const sceneSpan = d.variant === 1 ? 0.52 : d.variant === 2 ? 0.4 : 0.46
  const titleY = brandY + size * titleGap
  let productBlock = textEl({ x: startX, y: titleY, text: a, size, face: tf.light, fill: d.palette.accent2, tracking: track, weight: tf.light === 'sans-light' ? 400 : undefined })
  if (b) productBlock += textEl({ x: startX + wa, y: titleY, text: ` ${b}`, size, face: tf.heavy, fill: ink, tracking: track })
  parts.push(`<g data-edit="product">${productBlock}</g>`)
  ledger.text('product', w / 2, titleY, wa + wb, size, 'middle')
  const subSize = Math.max(1.6, size * 0.36)
  const sceneCat = categoryCaption(ctx)
  /*
   * The net quantity owns the foot. Giving the brand its display band pushes everything under it
   * down, and on a 90 × 90 electronics carton the caption arrived on top of the quantity — the
   * caption is the line that can be spared, so it yields, exactly as it does on `marble-frame`.
   */
  const netSize = d.volumeLine ? Math.max(2, Math.min(2.8, w * 0.034)) : 0
  const footTop = d.volumeLine ? h - m * 0.9 - netSize * 1.2 : h
  const capBaseline = titleY + subSize * 2.1
  if (sceneCat && capBaseline < footTop) parts.push(spacedLine(ledger, w / 2, capBaseline, sceneCat, subSize, ink, w - m * 2))
  // scene
  /*
   * Literal, and deliberately so. This face paints its scenery *after* the type, because a line
   * scene occupies only the lower `span` and belongs under nothing. Fed `d.background` it will
   * happily accept a family that fills the whole panel — tried with `paper`, which covered the
   * brand, the title and the caption and left a blank carton with a net quantity on it. The
   * promise was the DNA's, not the painter's: `paper` has been taken off this archetype's list.
   */
  parts.push(paintBackground('line-scene', w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, span: sceneSpan }))
  // volume
  if (d.volumeLine) parts.push(netQuantity(ledger, w / 2, h - m * 0.9, d.volumeLine, netSize, ink))
  void accent
  if (ctx.wrapSeam) parts.push(seamMark(w, h, ink))
  return parts.join('')
}

function lineScene(ctx: LayoutCtx): string {
  return paintLineSceneFace(ctx)
}

/* ---------------------------------------------------------------- wave-panel */

/** FERAH / surface-care — horizontal wave bands, stacked sans lockup. Shared by label and box front. */
export function paintWavePanelFace(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const parts: string[] = [paintBackground('wave', w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, ornament: d.ornament })]
  const ink = d.palette.ink
  const accent = d.palette.accent
  // Same lockup-over-stack skeleton, three rhythms: high and tight, standard, low and open.
  const lockTop = m * (d.variant === 1 ? 1.1 : d.variant === 2 ? 2.3 : 1.5)
  const stackGap = h * (d.variant === 1 ? 0.05 : d.variant === 2 ? 0.12 : 0.08)
  const brandMax = Math.min(11, w * 0.16)
  const lock = stackedLockup(ledger, d, w / 2, lockTop, w - m * 2, copy.brand, '', withIdent(ctx, {
    color: ink,
    mark: true,
    markColor: accent,
    brandMax,
  }))
  parts.push(lock.markup)
  const waveCat = categoryCaption(ctx)
  if (waveCat) parts.push(spacedLine(ledger, w / 2, lock.bottom + 2.6, waveCat, Math.max(1.5, Math.min(2.2, w * 0.03)), ink, w - m * 2))
  const stack = productStack(ledger, d, w / 2, lock.bottom + stackGap, w - m * 2, copy.product, withIdent(ctx, {
    color: ink,
    accent,
    max: Math.min(secondaryMax(lock.brandSize), w * 0.11),
  }))
  parts.push(stack.markup)
  if (d.volumeLine) {
    parts.push(netQuantity(ledger, w / 2, h - m * 0.9, d.volumeLine, Math.max(1.9, Math.min(2.6, w * 0.032)), ink))
  }
  if (ctx.wrapSeam) parts.push(seamMark(w, h, ink))
  return parts.join('')
}

/* ------------------------------------------------------------- brand kit */

/**
 * Swing tag.
 *
 * Narrow, tall, and with a hole punched through the top — so the first thing the layout does is
 * give that hole away. It is recorded in the ledger as a container so the preflight treats it as
 * occupied space rather than something to fill: the commonest way a tag goes wrong at the printer
 * is a brand mark centred into the punch.
 *
 * Deliberately not a label. A tag has no net quantity, no barcode and no legal column — it carries
 * the name and one line, because it is read while the customer is holding the product, not while
 * they are deciding to buy it.
 */
export function paintTagFace(ctx: LayoutCtx): string {
  // A swing tag of the second repertoire keeps its archetype's field, brand and subject — see `refArchetypes.ts`.
  if (isReferenceArchetype(ctx.d.archetype)) return paintReferenceTagFace(ctx)
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const ink = readableInk(d.palette.ground, d.palette.ink)
  const holeR = Math.max(1.6, Math.min(2.6, w * 0.06))
  const holeY = Math.max(holeR * 2.2, h * 0.075)
  const clear = holeY + holeR * 2.4

  const parts: string[] = [
    paintBackground(d.background, w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, intensity: 0.5 }),
    thinDoubleFrame(w, h, m * 0.7, ink, 0.4),
    `<circle cx="${f(w / 2)}" cy="${f(holeY)}" r="${f(holeR)}" fill="none" stroke="${ink}" stroke-width="0.25" stroke-opacity="0.5" />`,
  ]
  ledger.add('container', 'punch', w / 2 - holeR * 1.6, 0, holeR * 3.2, clear)

  const inner = w - m * 2.4
  const lock = stackedLockup(ledger, d, w / 2, clear + m * 0.4, inner, copy.brand, '', withIdent(ctx, {
    color: ink,
    mark: false,
    brandMax: Math.min(6.5, w * 0.17),
  }))
  parts.push(lock.markup)

  const ruleY = lock.bottom + h * 0.035
  parts.push(hairline(w / 2 - inner * 0.2, ruleY, w / 2 + inner * 0.2, ink, 0.6, Math.max(0.16, w * 0.006)))

  const stack = productStack(ledger, d, w / 2, ruleY + h * 0.05, inner, copy.product, withIdent(ctx, {
    color: ink,
    accent: d.palette.accent,
    max: Math.min(secondaryMax(lock.brandSize), w * 0.13),
    prefix: d.productPrefix,
  }))
  parts.push(stack.markup)

  // A sprig at the foot, small enough to stay an accent rather than become the subject.
  const artW = inner * 0.72
  const artTop = Math.max(stack.bottom + h * 0.04, h - m - artW * 0.6)
  if (h - artTop > w * 0.22) {
    ledger.add('element', 'tag-sprig', w / 2 - artW / 2, artTop, artW, h - m - artTop)
    parts.push(
      speciesHero(ctx.species, w / 2, artTop + (h - m - artTop) / 2, artW, heroInk(d.palette), d.seed, {
        uid: `${ctx.uid}-t`,
        layout: 'sprig',
        style: heroStyle(d.lineSeed),
      }),
    )
  }
  return parts.join('')
}

/**
 * Thank-you / care card.
 *
 * The one piece in the kit that is not selling anything, which is exactly why it changes how a pack
 * reads: it speaks in the brand's own words after the sale. Landscape, split — a mark and a line on
 * the left, the brand's sentence on the right — because a card is read at arm's length in one go
 * rather than scanned like a shelf face.
 */
export function paintCardFace(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const ink = readableInk(d.palette.ground, d.palette.ink)
  const parts: string[] = [
    paintBackground(d.background, w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, intensity: 0.45 }),
    thinDoubleFrame(w, h, m * 0.7, ink, 0.4),
  ]

  const colX = w * 0.34
  const artW = colX - m * 1.6
  if (artW > w * 0.12) {
    ledger.add('element', 'card-sprig', m * 0.9, h / 2 - artW * 0.45, artW, artW * 0.9)
    parts.push(
      speciesHero(ctx.species, m * 0.9 + artW / 2, h / 2, artW, heroInk(d.palette), d.seed, {
        uid: `${ctx.uid}-c`,
        layout: 'sprig',
        style: heroStyle(d.lineSeed),
      }),
    )
  }

  const textW = w - colX - m * 1.4
  const lock = stackedLockup(ledger, d, colX + textW / 2, m * 1.5, textW, copy.brand, '', withIdent(ctx, {
    color: ink,
    mark: false,
    brandMax: Math.min(6, w * 0.075),
  }))
  parts.push(lock.markup)

  const noteSize = Math.max(1.8, Math.min(2.6, textW * 0.05))
  const note = d.taglineLine || copy.tagline || d.story
  const lines = linesThatFit(lock.bottom + noteSize * 1.6, h - m * 1.8, noteSize, 3)
  if (lines > 0 && note) {
    parts.push(
      paragraph(ledger, colX, lock.bottom + noteSize * 1.6, textW, note, noteSize, 'serif-italic', ink, lines, 'middle', true, 'tagline').markup,
    )
  }

  const cityText = cityLine(ctx.brief)
  if (cityText) {
    const capSize = Math.max(1.5, Math.min(1.9, textW * 0.032))
    parts.push(spacedLine(ledger, colX + textW / 2, h - m * 1.1, cityText, capSize, ink, textW))
  }
  return parts.join('')
}

/**
 * Every label back carries the front's field.
 *
 * All three back painters used to start with a bare `ground()` while all twelve front painters laid
 * down the direction's own background — so opening the "Ön + arka etiket seti" showed a textured
 * front beside a blank back, two surfaces that plainly do not belong to the same product. This is
 * the same defect the carton had before F-14, which is why the rule now lives in one shared module
 * (`panelField.ts`) instead of being written out twice.
 *
 * Quiet on purpose: the back holds the ingredient column, the warnings and the barcode, so the
 * field is present enough to say "same product" and no louder.
 */
function backField(ctx: LayoutCtx, bg: string, seedOffset = 7): string {
  const { w, h, d } = ctx
  return paintBackground(secondaryField(d), w, h, fieldPalette(d.palette, d.archetype, bg, FIELD_MUTE.back), d.seed + seedOffset, {
    species: ctx.species,
    uid: `${ctx.uid}-bf`,
    intensity: FIELD_INTENSITY.back,
  })
}

/**
 * The back of a kit piece.
 *
 * Measured before it was written: a 38 × 76 mm swing tag was being handed to `paintLabelBack` and
 * came back carrying a full regulatory label — nutrition table, ingredients, warnings, pictograms,
 * barcode, thirty-two elements at the type floor. The ledger called it clean, because every one of
 * them fitted. It was still wrong: nobody prints an ingredients panel on a swing tag, and the
 * pieces exist precisely because they are *not* the regulated surface.
 *
 * So the back of a kit piece says who made it and where to find them, and nothing else.
 */
export function paintKitBack(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const ink = readableInk(d.palette.ground, d.palette.ink)
  const parts: string[] = [ground(w, h, d.palette.ground), backField(ctx, d.palette.ground), thinDoubleFrame(w, h, m * 0.7, ink, 0.35)]

  /*
   * A swing tag and a card back carry a brand line, a city, a QR and nothing else — no ingredients,
   * no usage, no warnings, no nutrition, no barcode block, no pictogram row, no net quantity. That
   * is what this surface is, not an omission: the declarations belong on the pack the tag hangs
   * from, and the QR is what a tag carries instead of a barcode. Measured — the net quantity is the
   * telling one, because the brief *does* supply it (250 ml ℮ · 8.45 fl.oz) and the surface still
   * does not state it. Without these records the required-information detector reads every one of
   * them as a renderer that failed.
   */
  for (const register of ['nutrition-table', 'barcode', 'pictograms', 'net-quantity', 'ingredients', 'usage', 'warnings', 'storage'] as const) {
    ledger.skip(register, 'not-this-surface')
  }

  const markR = Math.min(w * 0.13, h * 0.1, 5)
  parts.push(paintMark(markKindFor(d), w / 2, m + markR, markR, ink, copy.brand, identOf(ctx)))
  ledger.add('element', 'kit-mark', w / 2 - markR * 1.4, m, markR * 2.8, markR * 2)

  /*
   * Every line is measured against the cut at the y it sits on, not against the panel's width.
   * A tag is a rounded rectangle: near the top and bottom edges the corners have already taken the
   * width away, and a full-width line there crosses the knife — measured on a 38 × 76 tag, the
   * producer line overhung by 1.7 mm and blocked the export.
   */
  const lineW = (atY: number) => Math.max(8, spanAt(ctx.panel, atY).width - m * 2)

  const capSize = Math.max(1.6, Math.min(2.2, w * 0.035))
  let y = m + markR * 2 + capSize * 2
  parts.push(spacedLine(ledger, w / 2, y, copy.brand.toLocaleUpperCase('tr'), capSize, ink, lineW(y)))

  // The one line that belongs on a back: where it came from.
  const city = cityLine(ctx.brief)
  if (city) {
    y += capSize * 2.2
    parts.push(spacedLine(ledger, w / 2, y, city, capSize * 0.85, ink, lineW(y)))
  }

  /*
   * The foot is measured before the QR is placed, because it can be two lines.
   *
   * A line that cannot fit at the print floor has to wrap, not overflow: `fitSize` correctly
   * refuses to go below 1.5 mm and `spacedLine` then drew the full string anyway — "Verda
   * Botanicals Üretim A.Ş." measured 39.3 mm of type in the 30 mm the tag's rounded bottom leaves,
   * crossed the cut and blocked the export. Wrapping fixed that and introduced the next one: the
   * second line grew upward into the QR, which had been positioned as though the foot were always
   * one line. So the foot is laid out first and the QR takes what is left.
   */
  const producer = `${copy.manufacturer}`.trim().toLocaleUpperCase('tr')
  const pSize = Math.max(1.5, Math.min(1.9, w * 0.03))
  const pY = h - m * 0.9
  const footLines = producer
    ? fitsAtFloor(producer, lineW(pY), 'sans', 0.34)
      ? [producer]
      : wrapByWidth(producer, lineW(pY), pSize, 'sans', 2, pSize * 0.34)
    : []
  const footTop = footLines.length ? pY - (footLines.length - 1) * pSize * 1.6 - pSize : h - m

  // A QR only when there is room for it to be scannable rather than decorative.
  const qrS = Math.min(w * 0.4, h * 0.3)
  if (qrS >= 9 && footTop - capSize * 1.2 - qrS > y + capSize * 1.6) {
    const qrY = Math.max(y + capSize * 1.6, footTop - capSize * 1.2 - qrS)
    parts.push(qrPlaceholder(ledger, w / 2 - qrS / 2, qrY, qrS, ink, d.seed, ''))
  }

  let ly = pY - (footLines.length - 1) * pSize * 1.6
  for (const line of footLines) {
    parts.push(spacedLine(ledger, w / 2, ly, line, pSize, ink, lineW(ly)))
    ly += pSize * 1.6
  }
  return parts.join('')
}

/* -------------------------------------------------------------- round face */

/**
 * The jar lid, the balm tin, the soap seal.
 *
 * A disc is not a small rectangle, and treating it as one is the whole trap. Measured on a 60 mm
 * lid: the layout placed the net quantity 5 mm from the bottom edge and sized it against a 60 mm
 * width, but the chord at that height is 33 mm. It happened to fit because the copy was short —
 * a longer brand name would have printed over the knife.
 *
 * So every line here is measured against the *chord at its own height* rather than the bounding
 * box, and the composition is concentric because that is what a disc reads as: a ring, a centred
 * stack inside it, and nothing in the corners, because there are no corners.
 */
export function paintRoundFace(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  /*
   * Disc or oval. The disc formulas below are kept literally for the round case — an oval is the
   * same composition with two radii, and writing the disc as a degenerate ellipse would move the
   * frozen lid faces by floating-point rounding alone. `r` is the short radius either way.
   */
  const rx = w / 2
  const ry = h / 2
  const r = Math.min(rx, ry)
  const oval = Math.abs(rx - ry) > 0.01
  const cx = w / 2
  const cy = h / 2
  /*
   * A medallion, and the reason for it is a defect worth recording.
   *
   * A 45 mm clinical lid came back with the brand, the product and the net quantity all recorded in
   * the ledger, zero collisions, export green — and blank to the eye. The type was drawn in the
   * palette ink, which is chosen against `palette.ground`; but the background *painter* covers that
   * ground with its own field, and on a wave ground the centre is deep blue. `readableInk(ground,
   * ink)` cannot see that and returned the ink unchanged, so no contrast guard anywhere in the
   * engine could have caught it.
   *
   * Reaching for a cleverer ink is the wrong answer: the painter would have to know what every
   * background puts under every point. A lid label solves it the way lid labels have always solved
   * it — a plain medallion under the lockup, which guarantees the contrast instead of predicting it
   * and is the idiom besides.
   */
  const medallion = d.palette.card
  const ink = readableInk(medallion, d.palette.ink)
  const rim = Math.max(2.4, r * 0.09)

  /** Usable width at a given y — the chord, inset by the rim on both sides. */
  const chord = (y: number) => {
    const dy = Math.abs(y - cy)
    if (oval) {
      const ix = rx - rim
      const iy = ry - rim
      return dy >= iy ? 0 : 2 * ix * Math.sqrt(1 - (dy / iy) ** 2)
    }
    const inner = r - rim
    return dy >= inner ? 0 : 2 * Math.sqrt(inner * inner - dy * dy)
  }

  const clip = `${ctx.uid}-disc`
  const cut = oval
    ? `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" />`
    : `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" />`
  /*
   * The rim. An oval wears a bezel whenever the direction chose a drawn frame at all — Raavi's
   * metallic edge is what a rectangular frame *becomes* on a curved cut, and the one frame that
   * exists only there. A disc keeps the quiet hairline ring it has always worn (its wreath is the
   * ornament) unless a bezel was asked for by name.
   */
  const drawnFrame = d.frame !== 'none' && d.frame !== 'corner-brackets' && d.frame !== 'rounded-card'
  /*
   * The ring *is* the frame here, so it says which one it is standing in for. A rectangular edge
   * cannot be drawn on a disc — corner brackets would land outside the cut entirely — and this
   * painter has always answered that by wearing the curved equivalent. Staying silent about it made
   * the decoration reading report "çerçeve seçildi, çizilmedi" on every round lid and oval label
   * whose direction chose a frame, and once export depended on that reading it blocked them.
   */
  const declares = d.frame === 'none' ? '' : ` data-frame="${d.frame}"`
  const ring =
    d.frame === 'bezel' || (oval && drawnFrame)
      ? bezelFrame(w, h, rim * 0.4, d.palette.accent, 0.9)
      : oval
        ? `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx - rim * 0.55)}" ry="${f(ry - rim * 0.55)}" fill="none" stroke="${ink}" stroke-width="${f(Math.max(0.18, r * 0.012))}" stroke-opacity="0.5"${declares} />`
        : `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r - rim * 0.55)}" fill="none" stroke="${ink}" stroke-width="${f(Math.max(0.18, r * 0.012))}" stroke-opacity="0.5"${declares} />`
  const parts: string[] = [
    `<defs><clipPath id="${clip}">${cut}</clipPath></defs>`,
    `<g clip-path="url(#${clip})">${paintBackground(d.background, w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, intensity: 0.6, ornament: d.ornament })}</g>`,
    ring,
  ]

  /*
   * A wreath, not a hero. The first version centred the subject and put the type on top of it,
   * which the ledger correctly called three collisions — on a disc there is nowhere else for the
   * type to go, so the drawing has to give up the middle. A ring of foliage around the rim with
   * the lockup inside is also simply what a lid label *is*, and the `wreath` arrangement already
   * opens at the top, so nothing has to be invented for it.
   *
   * Recorded as a `container` rather than an `element`: the Ledger treats containers as things
   * that intentionally hold text, which is exactly what a wreath does, while still bounds-checking
   * it against the panel.
   */
  // A wreath is round; on an oval it would either cross the cut or leave the ends bare, so the
  // oval keeps the medallion and the rim and lets the type carry it — which is the Raavi plate.
  const artW = (r - rim * 0.4) * 2
  if (!oval && artW > r) {
    ledger.add('container', 'wreath', cx - artW / 2, cy - artW / 2, artW, artW)
    parts.push(
      `<g clip-path="url(#${clip})">${speciesHero(ctx.species, cx, cy, artW, heroInk(d.palette), d.seed, { uid: `${ctx.uid}-h`, layout: 'wreath', style: heroStyle(d.lineSeed) })}</g>`,
    )
  }

  // Sized to hold the stack with air around it, and drawn before the type so nothing is covered.
  const medR = r * 0.52
  const medRx = oval ? rx * 0.66 : medR
  const medRy = oval ? ry * 0.64 : medR
  parts.push(
    oval
      ? `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(medRx)}" ry="${f(medRy)}" fill="${medallion}" fill-opacity="0.94" />` +
          `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(medRx)}" ry="${f(medRy)}" fill="none" stroke="${ink}" stroke-width="${f(Math.max(0.14, r * 0.008))}" stroke-opacity="0.35" />`
      : `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(medR)}" fill="${medallion}" fill-opacity="0.94" />` +
          `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(medR)}" fill="none" stroke="${ink}" stroke-width="${f(Math.max(0.14, r * 0.008))}" stroke-opacity="0.35" />`,
  )
  ledger.add('container', 'medallion', cx - medRx, cy - medRy, medRx * 2, medRy * 2)

  /*
   * Usable width *on the medallion* at a given y — the chord discipline applied to the plate the
   * type sits on rather than to the panel.
   *
   * The cap used to be `medRx * 1.72`, which is a width the medallion only has across its centre.
   * The brand sits a third of the radius above that, where the plate is narrower, so a long name
   * ran off it and onto the wreath: measured on a 60 mm lid, "VERDA" reached 89 % of the radius
   * where the medallion offered 79 %, and the foliage crossed the letters. The type belongs on
   * its plate — that is what the plate is for.
   */
  const medChord = (y: number): number => {
    const dy = Math.abs(y - cy)
    if (dy >= medRy) return 0
    // 0.88 keeps the line off the medallion's own stroke.
    return 2 * medRx * Math.sqrt(1 - (dy / medRy) ** 2) * 0.88
  }

  const brandY = cy - ry * 0.34
  const lock = stackedLockup(ledger, d, cx, brandY, Math.min(chord(brandY), medChord(brandY)), copy.brand, '', withIdent(ctx, {
    color: ink,
    mark: false,
    brandMax: Math.min(r * 0.26, 7.5),
  }))
  parts.push(lock.markup)

  const ruleY = lock.bottom + r * 0.06
  const ruleW = Math.min(chord(ruleY), medChord(ruleY)) * 0.46
  parts.push(hairline(cx - ruleW / 2, ruleY, cx + ruleW / 2, ink, 0.6, Math.max(0.16, r * 0.01)))

  const prodY = ruleY + r * 0.1
  // A script prefix ("Doğal", "Signature") is a third line in a medallion that has room for two on
  // a small lid: measured on a 40 mm disc it pushed the product onto the net quantity.
  const stack = productStack(ledger, d, cx, prodY, Math.min(chord(prodY + r * 0.14), medChord(prodY + r * 0.14)), copy.product, withIdent(ctx, {
    color: ink,
    accent: d.palette.accent,
    max: Math.min(secondaryMax(lock.brandSize), r * 0.2),
    prefix: r >= 25 ? d.productPrefix : undefined,
  }))
  parts.push(stack.markup)

  if (d.volumeLine) {
    /*
     * Inside the ring, not on it. The wreath sits on a circle at about 0.72 r with foliage reaching
     * inward, so anything past roughly half the radius is printed over leaves — the first version
     * put the net quantity at 0.62 r and it landed in the foliage on every disc. Below the product
     * when the product runs long, never past the medallion's lower edge.
     */
    const volSize = Math.max(1.9, Math.min(2.4, r * 0.07))
    const volY = Math.min(cy + medRy - volSize * 0.9, Math.max(cy + medRy * 0.74, stack.bottom + volSize * 1.2))
    parts.push(netQuantity(ledger, cx, volY, d.volumeLine, volSize, ink))
  }
  return parts.join('')
}

/**
 * The back of a disc or an oval.
 *
 * The front short-circuits to `paintRoundFace` when the panel is round; the back did not, so a lid
 * and a bottle oval were handed the rectangular regulatory layout and it was laid out against the
 * bounding box. Measured on a 60 mm lid and a 70 × 45 oval: seven and five recorded corners fell
 * outside the cut, the barcode worst at 117 % and 121 % of the radius — printed past the knife.
 *
 * Squeezing the rectangular panel into an inscribed box would fit, and would still look like a
 * rectangle that lost an argument. A lid back is its own composition: the title across the widest
 * chord, the legal column in the middle band where there is room, and the marks stacked down the
 * centre where a round label has always carried them. Every width is taken from the chord at the
 * y it is drawn at, so nothing can reach the rim.
 */
/**
 * The registers a round back carries when it is not leading with a nutrition table.
 *
 * Shared by both paths on purpose: a food label whose band cannot hold the table still has to
 * carry its ingredients, and before this it carried nothing at all.
 */
function roundLegalColumn(ctx: LayoutCtx, cx: number, top: number, w: number, bottom: number, ink: string, vivid: boolean): string {
  const { d, copy, ledger } = ctx
  const hdr = backHeaders(d.locale)
  const sections: Section[] = [
    { title: hdr.usage, body: usageCopy(copy, d.sector, d.locale), edit: 'usage' },
    { title: hdr.warnings, body: copy.warnings, edit: 'warnings' },
    { title: hdr.ingredients, body: copy.ingredients, edit: 'ingredients' },
    { title: hdr.producer, body: producerLine(ctx), edit: 'manufacturer' },
  ]
  return legalColumn(ledger, cx - w / 2, top, w, bottom, sections, ink, {
    size: legalTypeSize(w, bottom - top, 'label'),
    anchor: 'middle',
    titleColor: d.palette.accent === ink ? ink : vivid ? ink : d.palette.accent,
  }).markup
}

export function paintRoundBack(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const rx = w / 2
  const ry = h / 2
  const r = Math.min(rx, ry)
  const cx = w / 2
  const cy = h / 2
  const oval = Math.abs(rx - ry) > 0.01
  const rim = Math.max(2.2, r * 0.08)

  /** Usable width at a given y — the chord, inset by the rim on both sides. */
  const chord = (y: number): number => {
    const dy = Math.abs(y - cy)
    const ix = rx - rim
    const iy = ry - rim
    return dy >= iy ? 0 : 2 * ix * Math.sqrt(1 - (dy / iy) ** 2)
  }

  /**
   * The narrowest chord an element spans, for anything with height.
   *
   * `chord(y)` answers for one line. A barcode is a block: sized on the chord at its top it fits
   * there and hangs out at the bottom, where the disc has already curved in. Measured on a 60 mm
   * lid: the barcode cleared the die by **0.2 mm** — inside the cut, and close enough that the
   * guillotine would shave it. The ledger could not see it either, because it was checking the
   * panel's bounding rectangle rather than the round cut.
   */
  const chordSpan = (top: number, bottom: number): number => Math.min(chord(top), chord(bottom), chord((top + bottom) / 2))

  const vivid = d.temperament === 'vivid-mono'
  const bg = vivid ? d.palette.ground : isDark(d.palette.ground) ? lighten(d.palette.ground, 0.04) : d.palette.card
  const ink = vivid ? '#ffffff' : isDark(bg) ? d.palette.ink : d.palette.cardInk
  const parts: string[] = [ground(w, h, bg), backField(ctx, bg)]

  // The same ring the front wears, so the two faces read as one label.
  const ringSw = Math.max(0.18, r * 0.012)
  parts.push(
    oval
      ? `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx - rim * 0.55)}" ry="${f(ry - rim * 0.55)}" fill="none" stroke="${d.palette.accent}" stroke-width="${f(ringSw)}" stroke-opacity="0.55" />`
      : `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r - rim * 0.55)}" fill="none" stroke="${d.palette.accent}" stroke-width="${f(ringSw)}" stroke-opacity="0.55" />`,
  )

  const hdr = backHeaders(d.locale)

  /* Foot, built upward from the rim so the marks always clear the cut. */
  const vs = Math.max(1.5, Math.min(2.1, r * 0.07))
  const volY = cy + (ry - rim) * 0.78
  if (d.volumeLine) parts.push(netQuantity(ledger, cx, volY, d.volumeLine, vs, ink))

  const barH = Math.max(5.2, Math.min(9, ry * 0.3))
  const barY = volY - vs * 1.2 - barH
  const pics = pictogramsForBack(d).slice(0, 3)
  const picS = Math.max(3, Math.min(5.2, r * 0.17))
  const picGap = picS * 0.35
  const picW = pics.length ? pics.length * picS + (pics.length - 1) * picGap : 0
  /*
   * Marks on one band when the chord can hold them.
   *
   * Stacking the pictograms above the barcode cost a whole row — on a 70 × 45 oval that left the
   * copy about 9 mm, one section, and a back that read as unfinished beside a flat label. Side by
   * side the same marks take the width the middle of an oval has to spare and give the row back to
   * the text. A narrow disc has no such width, so it keeps the stack.
   */
  const gap = picS * 0.6
  // The block's own span, not one line of it — see `chordSpan`.
  const barBand = chordSpan(barY, barY + barH)
  const barW = Math.min(barBand * (picW ? 0.56 : 0.7), r * 1.25)
  const rowW = barW + (picW ? picW + gap : 0)
  const sideBySide = picW > 0 && rowW <= barBand * 0.9
  let marksTop: number
  if (sideBySide) {
    const left = cx - rowW / 2
    parts.push(pictogramRow(ledger, left, barY + (barH - picS) / 2, picS, pics, ink, ctx.paoMonths, { quality: false }).markup)
    parts.push(barcodeBlock(ledger, left + picW + gap, barY, barW, Math.max(3.2, barH - 3.2), copy.barcode, ink, !isDark(bg), Math.max(1.1, vs * 0.62)))
    marksTop = barY
  } else {
    parts.push(barcodeBlock(ledger, cx - barW / 2, barY, barW, Math.max(3.2, barH - 3.2), copy.barcode, ink, !isDark(bg), Math.max(1.1, vs * 0.62)))
    const picY = barY - picS - vs * 0.6
    if (pics.length) parts.push(pictogramRow(ledger, cx - picW / 2, picY, picS, pics, ink, ctx.paoMonths, { quality: false }).markup)
    marksTop = pics.length ? picY : barY
  }

  /* Title across the widest chord the upper band offers, set high so the copy gets the middle. */
  const titleY = cy - (ry - rim) * 0.72
  const titleW = Math.min(chord(titleY), rx * 1.45)
  const title = copy.product.toLocaleUpperCase('tr')
  const tSize = fitSize(title, titleW, Math.min(3.4, r * 0.13), 1.7, 'sans-heavy', 0.1)
  const tBase = titleY + tSize
  parts.push(textEl({ x: cx, y: tBase, text: title, size: tSize, face: 'sans-heavy', fill: ink, anchor: 'middle', tracking: tSize * 0.1, extra: 'data-edit="product"' }))
  ledger.text('back-title', cx, tBase, textWidth(title, tSize, 'sans-heavy', tSize * 0.1), tSize, 'middle')
  const ruleY = tBase + tSize * 0.6
  const ruleW = Math.min(chord(ruleY), titleW) * 0.52
  parts.push(hairline(cx - ruleW / 2, ruleY, cx + ruleW / 2, d.palette.accent, 0.8, Math.max(0.14, r * 0.008)))

  /*
   * Legal copy in the middle band. The width is the chord at the *top* of the block — the
   * narrowest line it will occupy — so the column cannot widen into the rim as it grows.
   */
  const legalTop = ruleY + tSize * 0.7
  const legalBottom = marksTop - vs * 0.5
  const legalW = Math.min(chord(legalTop), chord(legalBottom), rx * 1.5)
  const food = d.sector === 'food' || d.sector === 'beverage'
  if (legalBottom > legalTop + 2) {
    if (food) {
      /*
       * A food back leads with the table, and it is not optional: the `ds-food-family` gate reads
       * the "/100 g" column off the back art, so an oil that shows no table exports as a blocked
       * file. Dropping it for tidiness is what broke the 80 × 55 olive-oil oval. The type is
       * shrunk toward the print floor until two rows fit the band rather than the table being
       * left out — a smaller table still tells the truth; an absent one does not.
       */
      const blob = `${ctx.brief.subProduct} ${ctx.brief.productName} ${ctx.brief.sector}`.toLocaleLowerCase('tr')
      const rows = nutritionRows(d.locale, blob)
      const band = legalBottom - legalTop
      let tableSize = Math.min(1.55, r * 0.06)
      while (tableSize > 1.5 && nutritionTableHeight(2, tableSize) > band) tableSize -= 0.05
      const tableW = Math.min(legalW, r * 1.7)
      const table = nutritionTable(ledger, cx - tableW / 2, legalTop, tableW, hdr.nutrition, rows, ink, typeSize(tableSize), legalBottom)
      parts.push(table.markup)
      /*
       * The table leads a food back, but it is not the whole of one. When the band cannot hold it
       * the branch used to end here and the label went out with no ingredients, no usage and no
       * warnings at all — the same disappearance the carton back had, one painter over, and this
       * one left no record either. The registers a non-food back carries are drawn instead.
       */
      if (!table.markup) parts.push(roundLegalColumn(ctx, cx, legalTop, legalW, legalBottom, ink, vivid))
    } else {
      /*
       * The same registers a flat back carries, in the same order. The first pass shipped only
       * usage and warnings, which left the middle of the label bare next to a flat one — the owner
       * read it, rightly, as an unfinished back. `legalColumn` is bounded by `legalBottom`, so it
       * takes what the chord can hold and drops the rest rather than overflowing the rim.
       */
      parts.push(roundLegalColumn(ctx, cx, legalTop, legalW, legalBottom, ink, vivid))
    }
  }
  return parts.join('')
}

/* ------------------------------------------------------------ specimen-hero */

/**
 * The drawn subject is the reason the face exists.
 *
 * Every other archetype here treats imagery as a field that type sits on — a marble slab, wave
 * bands, a wash rising from a corner. This one inverts it: the illustration takes the middle and
 * the type is arranged to give it room. That is the difference between a label that *shows what is
 * inside* and one that decorates around a name, and the repertoire had no archetype doing it.
 *
 * The order of operations is the whole design. The brand block above and the product block below
 * are measured first, on a probe ledger; the subject then gets whatever is genuinely left. So on a
 * tall face the drawing is large and on a squat one it simply shrinks — it can never push type off
 * the panel, which is the failure every "hero image" layout risks.
 *
 * Shared by the label face and the box front: a subject standing in the middle reads the same on a
 * carton as on a jar wrap, which is why `specimen` is the one family whose box and label archetypes
 * are the same id.
 */
export function paintSpecimenHeroFace(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const ink = d.palette.ink
  const parts: string[] = [
    // Quieter than the other faces on purpose: the ground is a stage here, not the performance.
    paintBackground(d.background, w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, intensity: 0.6, ornament: d.ornament }),
  ]
  parts.push(paintFrame(d, w, h, { inset: m * 0.6, color: ink, opacity: 0.45 }))

  const inner = w - m * 2.8
  /*
   * Every size below is clamped against the face's *height* as well as its width. A wrap label on
   * a 26 mm jar is 250 mm wide and 26 mm tall: sizing type from the width alone puts a 32 mm brand
   * on a 26 mm face, which is how a squat wrap came back with six collisions before this clamp.
   */
  const tiny = isTiny(w, h)
  const short = h < 55
  const lock = stackedLockup(
    ledger,
    d,
    w / 2,
    m * 1.7,
    inner,
    copy.brand,
    '',
    withIdent(ctx, { color: ink, mark: false, brandMax: Math.min(8.5, w * 0.125, short ? Math.max(3, h * 0.17) : Infinity) }),
  )
  parts.push(lock.markup)
  let top = lock.bottom

  // The category is the first thing to go: on a tiny face the brand and the net quantity are what
  // the label is legally and commercially for, and a third tier only steals their room.
  const cat = tiny ? '' : categoryCaption(ctx)
  if (cat) {
    const catSize = Math.max(1.5, Math.min(2.1, w * 0.028))
    parts.push(spacedLine(ledger, w / 2, top + catSize * 1.7, cat, catSize, ink, inner))
    top += catSize * 2.5
  }

  const volSize = Math.max(1.9, Math.min(2.6, w * 0.032, h * 0.075))
  const vol = d.volumeLine
  const footTop = h - m * (tiny ? 0.9 : 1.2) - (vol ? volSize * 1.7 : 0)

  const stackOpts = withIdent(ctx, {
    color: ink,
    accent: d.palette.accent,
    max: Math.min(secondaryMax(lock.brandSize), w * 0.1, short ? Math.max(2.6, h * 0.15) : Infinity),
    prefix: tiny ? undefined : d.productPrefix,
  })
  const probe = new Ledger(ledger.panel)
  const stackH = productStack(probe, d, w / 2, 0, inner, copy.product, stackOpts).bottom
  // Above the foot, and inside the panel — whichever binds first.
  const stackY = Math.max(top + 2, Math.min(footTop - stackH - 1, h - m - stackH))

  const bandTop = top + 2
  const bandBottom = stackY - 2
  /*
   * Fitted by what the drawing really reaches (`fitSubject`), not by a nominal size and an aspect
   * table: measured against the browser, the table said 0.56 for an arch that reaches 0.60–1.04
   * of its size, so the picture spilled past the box the ledger held for it. Arrangement and
   * render mode still come from the *line* seed, jitter from the piece's own — a range shares its
   * composition; only the subject and the small randomness change per SKU. Below roughly a
   * quarter of the face the drawing stops being the subject and starts being a smudge; better to
   * drop it and let the type own a quiet face than to print a bad one.
   */
  const fit = fitSubject({
    species: ctx.species,
    ink: heroInk(d.palette),
    seed: d.seed,
    lineSeed: d.lineSeed,
    style: d.subjectStyle,
    uid: `${ctx.uid}-hero`,
    room: { left: w / 2 - inner * 0.47, right: w / 2 + inner * 0.47, top: bandTop, bottom: bandBottom },
    minWidth: Math.min(w, h) * 0.26,
  })
  if (fit) {
    ledger.add('element', 'specimen', fit.box.x, fit.box.y, fit.box.w, fit.box.h)
    parts.push(fit.markup)
  }

  parts.push(productStack(ledger, d, w / 2, stackY, inner, copy.product, stackOpts).markup)
  if (vol) parts.push(netQuantity(ledger, w / 2, h - m * (tiny ? 0.7 : 1), vol, volSize, ink))
  if (ctx.wrapSeam) parts.push(seamMark(w, h, ink))
  return parts.join('')
}

/* ---------------------------------------------------------- landscape-badge */

/**
 * Arched landscape window with the product badge riding its foot (Anadolu Bal).
 * Shared by the label face and the box front. Portrait: lockup → prefix → window → badge → chips → foot line.
 * Landscape: lockup + prefix + chips + tagline in a left column, window + badge on the right.
 */
/* ---------------------------------------------------------------- ink-panel */

function inkPanel(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const parts: string[] = [paintBackground('ink-wash', w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, corner: 'bl', ornament: d.ornament })]
  const ink = d.palette.ink
  const accent = d.palette.accent
  parts.push(paintFrame(d, w, h, { inset: m * 0.5, color: accent, opacity: 0.8 }))
  const brandMax = Math.min(10, w * 0.14)
  const lock = stackedLockup(ledger, d, w / 2, m * 1.8, w - m * 3, copy.brand, cityLine(ctx.brief), withIdent(ctx, { color: ink, markColor: accent, brandMax }))
  parts.push(lock.markup)
  const stack = productStack(ledger, d, w / 2, lock.bottom + h * 0.06, w - m * 3, copy.product, withIdent(ctx, { color: ink, accent, category: d.categoryLine, max: Math.min(secondaryMax(lock.brandSize), w * 0.13) }))
  parts.push(stack.markup)
  // stacked tagline
  const tagWords = wrapByWidth(d.taglineLine.toLocaleUpperCase('tr'), w * 0.5, 1.6, 'sans', 3, 0.5)
  const tagTop = stack.bottom + h * 0.05
  const tag = stackedWords(ledger, w / 2, tagTop, tagWords, 1.7, ink, w * 0.55)
  parts.push(`<g data-edit="tagline">${tag.markup}</g>`)
  const footY = h - m * 1.1
  const onInk = footY > h * 0.6
  const footColor = onInk ? d.palette.card : ink
  const chipText = claimLine(copy, d.chips)
  if (chipText) parts.push(spacedLine(ledger, w - m, footY - 4, chipText, 1.3, footColor, w * 0.6, 'end', 'sans', 'cta'))
  if (d.volumeLine) parts.push(netQuantity(ledger, w - m, footY, d.volumeLine, Math.max(1.9, Math.min(2.6, w * 0.03)), footColor, 'end'))
  if (ctx.wrapSeam) parts.push(seamMark(w, h, ink))
  return parts.join('')
}

/* ------------------------------------------------------------ atelier-plate */

/** A copy tier: the patch the customer typed wins, then what the brief said; empty stays empty. */
function tierLine(patched: string | undefined, fromBrief: string): string {
  return (patched ?? '').trim() || fromBrief
}

/**
 * The Diako plate — type in three tiers, nothing else.
 *
 * Kept from the STİCKERR REF perfume set because it is the one composition the repertoire could
 * not make: every other face here puts type *on* something (a wash, a slab, a window, a drawing).
 * This one is a plate — brand, then product with its concentration, then the signature lines —
 * separated by short rules and held by a band-and-hairline edge. It is the difference between a
 * label and a nameplate, and it is what most niche perfume houses actually print.
 *
 * The hierarchy rule is untouched: the product is capped at `secondaryMax` of the brand. The
 * reference plate happens to obey it too; Dogwood & Fir's inverted version was reviewed and
 * dropped precisely because it does not.
 *
 * Shared by the label face and the box front, like `specimen-hero`: a plate of type reads the same
 * on a carton.
 */
export function paintAtelierPlateFace(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const ink = d.palette.ink
  const accent = d.palette.accent
  const parts: string[] = [paintBackground(d.background, w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, ornament: d.ornament })]
  parts.push(paintFrame(d, w, h, { inset: m * 0.55, color: accent, opacity: 0.85 }))
  const inner = w - m * 2.6
  const gap = Math.max(1.6, Math.min(w, h) * 0.04)
  const foot = h - m * 1.1
  const volSize = Math.max(1.8, Math.min(2.4, w * 0.03))
  const tierSize = Math.max(1.5, Math.min(2.2, w * 0.03))
  const rule = (y: number, frac: number) =>
    hairline(w / 2 - (inner * frac) / 2, y, w / 2 + (inner * frac) / 2, accent, 0.85, Math.max(0.16, Math.min(w, h) * 0.003))

  /** The three tiers from a given top; returns where they end. Pure in `top`, so it can be probed. */
  const tiersFrom = (book: Ledger, top: number): { markup: string; bottom: number } => {
    const out: string[] = []
    // Tier 1 — the house. The city is its sub line; no mark, a plate is type.
    const lock = stackedLockup(book, d, w / 2, top, inner, copy.brand, cityLine(ctx.brief), {
      ...withIdent(ctx, { color: ink, markColor: accent, brandMax: Math.min(10, w * 0.14) }),
      mark: false,
    })
    out.push(lock.markup)
    const r1 = lock.bottom + gap
    out.push(rule(r1, 0.6))
    // Tier 2 — the juice and its register. `categoryLine` already carries the concentration.
    const stack = productStack(book, d, w / 2, r1 + gap, inner, copy.product, withIdent(ctx, {
      color: ink,
      accent,
      category: d.categoryLine,
      max: Math.min(secondaryMax(lock.brandSize), w * 0.12),
      prefix: d.productPrefix,
    }))
    out.push(stack.markup)
    const r2 = stack.bottom + gap
    out.push(rule(r2, 0.6))
    // Tier 3 — the signature lines, in the order a plate reads them; only the ones the brief gave.
    const tiers: [string, string, string][] = [
      [tierLine(copy.attribution, d.attributionLine), 'attribution', ink],
      [tierLine(copy.edition, d.editionLine), 'edition', accent],
      [tierLine(copy.origin, d.originLine), 'origin', accent],
    ]
    let y = r2 + gap * 0.9 + tierSize
    let bottom = r2
    for (const [text, edit, color] of tiers) {
      if (!text) continue
      if (y > foot - volSize * 2.6) break
      out.push(spacedLine(book, w / 2, y, text, tierSize, color, inner * 0.9, 'middle', 'sans', edit))
      bottom = y
      y += tierSize * 1.75
    }
    return { markup: out.join(''), bottom }
  }

  /*
   * A plate is centred on its face, not hung from the top. Measured on the first pass, the block
   * ended at 42% of a 70 × 90 label and 27% of a 70 × 140 carton, leaving the lower half empty —
   * a nameplate reads as a nameplate only when the air above and below it is roughly equal. So
   * the tiers are laid out once on a probe ledger to learn their height, then placed at the
   * optical centre of the room between the top margin and the net quantity.
   */
  const top0 = m * 1.7
  const probe = tiersFrom(new Ledger(ctx.panel), top0)
  const blockH = probe.bottom - top0
  const room = foot - volSize * 2.2 - top0
  const top = top0 + Math.max(0, (room - blockH) * 0.44)
  parts.push(tiersFrom(ledger, top).markup)
  if (d.volumeLine) parts.push(netQuantity(ledger, w / 2, foot, d.volumeLine, volSize, ink))
  if (ctx.wrapSeam) parts.push(seamMark(w, h, ink))
  return parts.join('')
}

/* -------------------------------------------------------------- crest-panel */

/**
 * The Azzurra roundel — a crest in a medallion on a flat geometric field.
 *
 * The field is `arabesque`, the first background here that is geometry rather than texture. The
 * medallion is the same answer the round face gives: a known fill under the device, so the crest
 * reads whatever the lattice does behind it. A customer logo, when one is supplied and large
 * enough to print, takes the crest's place inside the roundel — and is therefore *not* repeated
 * above the brand, which the stacked lockup would otherwise do on its own.
 */
export function paintCrestPanelFace(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const ink = d.palette.ink
  const accent = d.palette.accent
  const parts: string[] = [paintBackground(d.background, w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, ornament: d.ornament })]
  parts.push(paintFrame(d, w, h, { inset: m * 0.55, color: accent, opacity: 0.85 }))
  const inner = w - m * 2.6
  const cx = w / 2
  const medR = Math.max(5, Math.min(w * (isLandscape(w, h) ? 0.15 : 0.21), h * 0.16))
  const medallion = d.palette.card
  const foot = h - m * 1.1
  const volSize = Math.max(1.8, Math.min(2.4, w * 0.03))
  const eSize = Math.max(1.5, Math.min(2.1, w * 0.028))
  // The small register lines sit on the lattice itself. On a dark field the foil accent carries
  // them; on a light one the same accent thins into the pattern (measured on cream · copper at
  // `rich`: the category read as part of the ground), so it is pulled toward the ink there.
  const meta = isDark(d.palette.ground) ? accent : mix(accent, ink, 0.45)
  const edition = tierLine(copy.edition, d.editionLine)


/** Roundel, brand, product and edition from a given top; returns where they end. */
  const blockFrom = (book: Ledger, top: number): { markup: string; bottom: number } => {
    const out: string[] = []
    const medCy = top + medR
    out.push(
      `<circle cx="${f(cx)}" cy="${f(medCy)}" r="${f(medR)}" fill="${medallion}" />` +
        `<circle cx="${f(cx)}" cy="${f(medCy)}" r="${f(medR * 0.9)}" fill="none" stroke="${accent}" stroke-width="${f(Math.max(0.16, medR * 0.03))}" stroke-opacity="0.85" />`,
    )
    book.add('container', 'roundel', cx - medR, medCy - medR, medR * 2, medR * 2)
    const markR = medR * 0.5
    out.push(paintMark('crest', cx, medCy, markR, readableInk(medallion, accent), copy.brand, identOf(ctx)))
    book.add('element', 'crest-mark', cx - markR * 1.3, medCy - markR, markR * 2.6, markR * 2)
    const lock = stackedLockup(book, d, cx, medCy + medR + h * 0.035, inner, copy.brand, '', {
      ...withIdent(ctx, { color: ink, markColor: accent, brandMax: Math.min(10, w * 0.14) }),
      mark: false,
      logoHref: undefined,
    })
    out.push(lock.markup)
    const stack = productStack(book, d, cx, lock.bottom + h * 0.03, inner, copy.product, withIdent(ctx, {
      color: ink,
      accent: meta,
      category: d.categoryLine,
      max: Math.min(secondaryMax(lock.brandSize), w * 0.12),
      prefix: d.productPrefix,
    }))
    out.push(stack.markup)
    let bottom = stack.bottom
    if (edition && stack.bottom + eSize * 2.2 < foot - volSize * 2.6) {
      const y = stack.bottom + eSize * 2.2
      out.push(spacedLine(book, cx, y, edition, eSize, meta, inner * 0.8, 'middle', 'sans', 'edition'))
      bottom = y
    }
    return { markup: out.join(''), bottom }
  }

  // Centred on the face for the same reason the atelier plate is — see `paintAtelierPlateFace`.
  const top0 = m * 1.4
  const probe = blockFrom(new Ledger(ctx.panel), top0)
  const blockH = probe.bottom - top0
  const room = foot - volSize * 2.2 - top0
  const top = top0 + Math.max(0, (room - blockH) * 0.44)
  parts.push(blockFrom(ledger, top).markup)
  if (d.volumeLine) parts.push(netQuantity(ledger, cx, foot, d.volumeLine, volSize, ink))
  if (ctx.wrapSeam) parts.push(seamMark(w, h, ink))
  return parts.join('')
}

/**
 * `noir-plate` — the dark-luxe family's own label.
 *
 * Until now `dark-luxe` and `ink` both mapped to `ink-panel` on labels, and since the offer
 * de-duplicates by family through `ARCHETYPE_FAMILY['ink-panel'] === 'ink'`, the dark-luxe family
 * was simply **unreachable on a label**: the pool topped out at nine families there against ten on
 * a carton, and a customer who chose "karanlık lüks" for their box could not find it again on the
 * bottle. This is the missing sibling, built from the same parts as the carton's `noir-stack` —
 * deep field, centred type, a tagline above the foot — at label proportions.
 */
export function paintNoirPlateFace(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const ink = d.palette.ink
  const accent = d.palette.accent
  const wide = isLandscape(w, h)
  const parts: string[] = [
    paintBackground(d.background, w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, ornament: d.ornament }),
  ]
  parts.push(paintFrame(d, w, h, { inset: m * 0.55, color: accent, opacity: 0.7 }))
  // A wrap label has to show the printer where the overlap lands; `ds-label` fails the export
  // without it. Every other label painter draws it, and leaving it out of a new one is how this
  // archetype first came back with a blocked export on a modern perfume bottle.
  if (ctx.wrapSeam) parts.push(seamMark(w, h, ink))

  const inner = w - m * 2.4
  const top = h * (wide ? 0.16 : 0.12)
  const gap = Math.max(1.4, Math.min(w, h) * 0.035)
  const lock = stackedLockup(ledger, d, w / 2, top, inner, copy.brand, cityLine(ctx.brief), {
    ...withIdent(ctx, { color: ink, markColor: accent, brandMax: Math.min(wide ? 7.5 : 9, w * 0.13) }),
    mark: false,
  })
  parts.push(lock.markup)

  const stack = productStack(ledger, d, w / 2, lock.bottom + gap, inner, copy.product, withIdent(ctx, {
    color: accent,
    accent,
    category: d.categoryLine,
    max: Math.min(secondaryMax(lock.brandSize), w * 0.08),
    prefix: d.productPrefix,
  }))
  parts.push(stack.markup)

  // The tagline rides above the foot rather than under the stack: on a wide bottle label the
  // middle band is the only place left once the lockup and the product have taken the top.
  const footY = h - m * 1.05
  const tagSize = Math.max(1.5, Math.min(2.1, w * 0.026))
  const tagY = Math.max(stack.bottom + gap + tagSize, footY - tagSize * 3.2)
  if (tagY < footY - tagSize * 1.4) {
    parts.push(spacedLine(ledger, w / 2, tagY, d.taglineLine, tagSize, mix(accent, ink, 0.25), inner, 'middle', 'sans', 'tagline'))
  }

  const volSize = Math.max(1.6, Math.min(2.3, w * 0.028))
  if (d.volumeLine) parts.push(netQuantity(ledger, m, footY, d.volumeLine, volSize, ink, 'start'))
  const right = tierLine(copy.edition, d.editionLine) || d.chips[0] || ''
  if (right) parts.push(spacedLine(ledger, w - m, footY, right, volSize * 0.82, mix(ink, d.palette.ground, 0.25), inner * 0.44, 'end'))
  return parts.join('')
}

export function paintLabelFace(ctx: LayoutCtx): string {
  /*
   * Shape wins over archetype. A disc has no corners to put a legal column in and no straight edge
   * to hang a diagonal off, so none of the rectangular faces below can be asked to draw one — the
   * round composition is its own thing and the archetype only survives as the background choice.
   */
  if (isRound(ctx.panel)) return isReferenceArchetype(ctx.d.archetype) ? paintReferenceRoundFace(ctx) : paintRoundFace(ctx)
  /*
   * The second repertoire (F-32) paints its own faces — eight skeletons the ten below cannot
   * make. Reached only when the customer asked for other designs, so the ten and their frozen
   * faces are untouched by it.
   */
  const reference = paintReferenceFace(ctx)
  if (reference !== null) return reference
  // A composition borrows the archetype's field and type and supplies the arrangement — see `compositions.ts`.
  const composed = paintComposition(ctx)
  if (composed !== null) return composed

  switch (ctx.d.archetype as LabelArchetype) {
    case 'card-on-art':
      return cardOnArt(ctx)
    case 'atelier-plate':
      return paintAtelierPlateFace(ctx)
    case 'crest-panel':
      return paintCrestPanelFace(ctx)
    case 'noir-plate':
      return paintNoirPlateFace(ctx)
    case 'diagonal-split':
      return diagonalSplit(ctx)
    case 'line-scene':
      return lineScene(ctx)
    case 'wave-panel':
      return paintWavePanelFace(ctx)
    case 'specimen-hero':
      return paintSpecimenHeroFace(ctx)
    case 'ink-panel':
      return inkPanel(ctx)
    case 'marble-frame':
    default:
      return marbleFrame(ctx)
  }
}

/* --------------------------------------------------------------- label back */

/** Utility back: product header, usage / warnings / ingredients, producer, pictograms + barcode + net quantity. */
export function paintLabelBack(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const vivid = d.temperament === 'vivid-mono'
  const bg = vivid ? d.palette.ground : isDark(d.palette.ground) ? lighten(d.palette.ground, 0.04) : d.palette.card
  const ink = vivid ? '#ffffff' : isDark(bg) ? d.palette.ink : d.palette.cardInk
  const parts: string[] = [ground(w, h, bg), backField(ctx, bg)]
  // A reference archetype wears its own outline here, exactly as it does on a carton back.
  parts.push(paintReferenceSkin(ctx, 'back') ?? paintFrame(d, w, h, { inset: m * 0.5, color: d.palette.accent, opacity: 0.7 }))
  const hdr = backHeaders(d.locale)
  const title = copy.product.toLocaleUpperCase('tr')
  /*
   * The design's own product face, not a hardcoded `sans-heavy`.
   *
   * Ten type systems decide how every other panel is set and this one ignored all of them, so a
   * face whose front is a display serif handed the customer a back headed in heavy grotesk — half
   * of why the owner read the front and the back as two different designs.
   */
  const titleFace = pairingFaces(d.typePairing).product
  const tSize = fitSize(title, w - m * 2, 4.2 * ctx.titleScale, 2.2 * ctx.titleScale, titleFace, 0.12)
  parts.push(textEl({ x: w / 2, y: m + tSize, text: title, size: tSize, face: titleFace, fill: ink, anchor: 'middle', tracking: tSize * 0.12, extra: 'data-edit="product"' }))
  ledger.text('back-title', w / 2, m + tSize, textWidth(title, tSize, titleFace, tSize * 0.12), tSize, 'middle')
  parts.push(hairline(m, m + tSize * 1.8, w - m, d.palette.accent, 0.8, 0.22))
  const pics = pictogramsForBack(d).slice(0, 3)
  const vs = Math.max(1.6, Math.min(2.2, w * 0.026))
  const volW = d.volumeLine ? textWidth(d.volumeLine, vs, 'sans', vs * 0.06) : 0
  const slot = fitLabelBarcode({ w, h, margin: m, picCount: pics.length, leftExtra: volW ? volW + 2.2 : 0 })
  const footTop = slot.footTop
  const sections: Section[] = [
    { title: hdr.usage, body: usageCopy(copy, d.sector, d.locale), edit: 'usage' },
    { title: hdr.warnings, body: copy.warnings, edit: 'warnings' },
    { title: hdr.ingredients, body: copy.ingredients, edit: 'ingredients' },
    { title: hdr.producer, body: copy.manufacturer, edit: 'manufacturer' },
    { title: hdr.address, body: copy.address, edit: 'address' },
  ]
  const titleColor = d.palette.accent === ink ? ink : vivid ? ink : d.palette.accent
  let legalTop = m + tSize * 2.4
  let legalX = m
  let legalW = w - m * 2
  const food = d.sector === 'food' || d.sector === 'beverage'
  if (food) {
    const blob = `${ctx.brief.subProduct} ${ctx.brief.productName} ${ctx.brief.sector}`.toLocaleLowerCase('tr')
    const tableSize = typeSize(Math.min(1.55, w * 0.018))
    const rows = nutritionRows(d.locale, blob)
    if (w - m * 2 >= 56) {
      const tableW = Math.max(26, (w - m * 2) * 0.42)
      const table = nutritionTable(ledger, w - m - tableW, legalTop, tableW, hdr.nutrition, rows, ink, tableSize, footTop - 1.5)
      parts.push(table.markup)
      legalW = w - m * 2 - tableW - 3
    } else if (legalTop + nutritionTableHeight(3, tableSize) < footTop - 14) {
      const table = nutritionTable(ledger, m, legalTop, w - m * 2, hdr.nutrition, rows, ink, tableSize, footTop - 14)
      parts.push(table.markup)
      legalTop = table.bottom + 1.5
    } else {
      // Too narrow for the side-by-side layout and too short for the stacked one.
      ledger.skip('nutrition-table', 'no-space')
    }
  }
  const legalSize = legalTypeSize(w, footTop - 1.5 - legalTop, 'label')
  const legal = legalColumn(ledger, legalX, legalTop, legalW, footTop - 1.5, sections, ink, { size: legalSize, anchor: food && legalW < w - m * 2 ? 'start' : 'middle', titleColor })
  parts.push(legal.markup)
  parts.push(pictogramRow(ledger, slot.picX, slot.picY, slot.picS, pics, ink, ctx.paoMonths, { quality: true }).markup)
  parts.push(barcodeBlock(ledger, slot.x, slot.y, slot.w, slot.barsH, copy.barcode, ink, !isDark(bg), slot.captionSize))
  if (d.volumeLine) {
    const picW = pics.length * slot.picS + (pics.length - 1) * slot.picS * 0.35
    const volX = m + picW + 1.5
    if (volX + volW < slot.x - 2) parts.push(netQuantity(ledger, volX, slot.y + slot.barH * 0.55, d.volumeLine, vs, ink, 'start'))
    else if (slot.y - 1 > legal.bottom + vs * 1.2) parts.push(netQuantity(ledger, m, slot.y - 1.2, d.volumeLine, vs, ink, 'start'))
  }
  return parts.join('')
}

/* ------------------------------------------------------------ small helpers */

export { legalSections, producerLine }

export function labelBenefitStrip(ctx: LayoutCtx, y: number): string {
  const { w, d, ledger } = ctx
  const m = marginFor(ctx.w, ctx.h)
  return benefitRow(ledger, d, m, y, w - m * 2, d.benefits.slice(0, 3), d.palette.accent, { labelColor: d.palette.ink }).markup
}

export function darkGround(ctx: LayoutCtx): string {
  return darken(ctx.d.palette.ground, 0.05)
}
