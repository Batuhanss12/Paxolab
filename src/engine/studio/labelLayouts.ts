/**
 * Label archetypes — six full-anatomy label faces + one shared utility back.
 * Panel-local coordinates; every element goes through the ledger.
 */
import {
  archWindow,
  barcodeBlock,
  benefitRow,
  brandMark,
  brandPill,
  chip,
  claimBand,
  cornerBrackets,
  hairline,
  legalColumn,
  legalTypeSize,
  markKindFor,
  monogramLockup,
  netQuantity,
  nutritionTable,
  nutritionTableHeight,
  paintMark,
  paragraph,
  pictogramRow,
  pictogramsFor,
  pictogramsForBack,
  productBadge,
  productBadgeHeight,
  productStack,
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
import { darken, isDark, lighten, mix, readableInk } from './color'
import { backHeaders, claimLine, liveClaim, nutritionRows, usageCopy } from './copyBank'
import { fitLabelBarcode } from '../barcode'
import { cityLine, identOf, isLandscape, isTiny, marginFor, seamMark, withIdent, categoryCaption, type LayoutCtx } from './layoutContext'
import { Ledger, fitSize, textEl, textWidth, typeSize, wrapByWidth } from './text'
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
  const parts: string[] = [paintBackground(d.background, w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, intensity: 0.85 })]
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
  const parts: string[] = [paintBackground('marble', w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, intensity: 0.85 })]
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
  if (marbleCat) parts.push(spacedLine(ledger, w / 2, by + bh + catSize * 2.2, marbleCat, catSize, ink, bw))
  // product at the foot: script prefix + heavy product
  const volSize = d.volumeLine ? Math.max(2, Math.min(2.8, w * 0.032, h * 0.07)) : 0
  const stackMax = Math.min(8.5, w * 0.11, landscape || h < 55 ? Math.max(2.8, h * 0.18) : 8.5)
  const stackH = stackMax * (d.productPrefix ? 1.9 : 1.35) + (volSize ? volSize * 2.4 : 2)
  const productTop = Math.max(lock.bottom + 4, Math.min(h * 0.7, h - m - stackH))
  const stack = productStack(ledger, d, w / 2, productTop, w - m * 2, copy.product, withIdent(ctx, { color: ink, accent, prefix: d.productPrefix, max: stackMax }))
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
  const parts: string[] = [paintBackground('diagonal', w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, clearRight: 0.48 })]
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
  const tSize = Math.min(fitSize(first || last, colW, titleMax, 2.8 * ctx.titleScale, 'sans-light', 0.02), fitSize(last, colW, titleMax, 2.8 * ctx.titleScale, 'sans-heavy', 0.02))
  let y = m + tSize
  let productBlock = ''
  if (first) {
    productBlock += textEl({ x: m, y, text: first, size: tSize, face: 'sans-light', fill: ink, tracking: tSize * 0.02 })
    ledger.text('product-light', m, y, textWidth(first, tSize, 'sans-light', tSize * 0.02), tSize)
    y += tSize * 1.05
  }
  productBlock += textEl({ x: m, y, text: last, size: tSize, face: 'sans-heavy', fill: ink, tracking: tSize * 0.02 })
  ledger.text('product', m, y, textWidth(last, tSize, 'sans-heavy', tSize * 0.02), tSize)
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
    parts.push(`<rect x="0.4" y="0.4" width="${f(w - 0.8)}" height="${f(h - 0.8)}" rx="${f(Math.min(4, w * 0.06))}" fill="none" stroke="${mix(ink, d.palette.ground, 0.75)}" stroke-width="0.2" />`)
  }
  // brand mark + brand
  const r = Math.min(w * 0.1, 6)
  parts.push(paintMark(markKindFor(d), w / 2, m + r, r, ink, copy.brand, identOf(ctx)))
  ledger.add('element', ctx.logoHref && r >= STUDIO_MIN_LOGO_R ? 'brand-logo' : 'brand-mark', w / 2 - r * 1.4, m, r * 2.8, r * 2)
  const brandSize = fitSize(copy.brand.toLocaleUpperCase('tr'), w * 0.7, 4.4 * ctx.titleScale, 2.2 * ctx.titleScale, 'sans-heavy', 0.12)
  const brandY = m + r * 2 + brandSize * 1.4
  parts.push(textEl({ x: w / 2, y: brandY, text: copy.brand.toLocaleUpperCase('tr'), size: brandSize, face: 'sans-heavy', fill: ink, anchor: 'middle', tracking: brandSize * 0.12, extra: 'data-edit="brand"' }))
  ledger.text('brand', w / 2, brandY, textWidth(copy.brand.toLocaleUpperCase('tr'), brandSize, 'sans-heavy', brandSize * 0.12), brandSize, 'middle')
  // two-tone title
  const words = copy.product.toLocaleUpperCase('tr').split(/\s+/)
  const a = words.length > 1 ? words.slice(0, Math.ceil(words.length / 2)).join(' ') : words[0]
  const b = words.length > 1 ? words.slice(Math.ceil(words.length / 2)).join(' ') : ''
  const titleMax = Math.min(7.5, w * 0.11) * ctx.titleScale
  const full = b ? `${a} ${b}` : a
  const size = fitSize(full, w - m * 2, titleMax, 2.6 * ctx.titleScale, 'sans-heavy', 0.1)
  const track = size * 0.1
  const wa = textWidth(a, size, 'sans-light', track)
  const wb = b ? textWidth(` ${b}`, size, 'sans-heavy', track) : 0
  const startX = w / 2 - (wa + wb) / 2
  // Same stack-over-scene skeleton, three rhythms: tight title with a taller scene, standard,
  // airy title with a shallower scene.
  const titleGap = d.variant === 1 ? 1.9 : d.variant === 2 ? 3.4 : 2.6
  const sceneSpan = d.variant === 1 ? 0.52 : d.variant === 2 ? 0.4 : 0.46
  const titleY = brandY + size * titleGap
  let productBlock = textEl({ x: startX, y: titleY, text: a, size, face: 'sans-light', fill: d.palette.accent2, tracking: track, weight: 400 })
  if (b) productBlock += textEl({ x: startX + wa, y: titleY, text: ` ${b}`, size, face: 'sans-heavy', fill: ink, tracking: track })
  parts.push(`<g data-edit="product">${productBlock}</g>`)
  ledger.text('product', w / 2, titleY, wa + wb, size, 'middle')
  const subSize = Math.max(1.6, size * 0.36)
  const sceneCat = categoryCaption(ctx)
  if (sceneCat) parts.push(spacedLine(ledger, w / 2, titleY + subSize * 2.1, sceneCat, subSize, ink, w - m * 2))
  // scene
  parts.push(paintBackground('line-scene', w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, span: sceneSpan }))
  // volume
  if (d.volumeLine) {
    const vs = Math.max(2, Math.min(2.8, w * 0.034))
    parts.push(netQuantity(ledger, w / 2, h - m * 0.9, d.volumeLine, vs, ink))
  }
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
  const parts: string[] = [paintBackground('wave', w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid })]
  const ink = d.palette.ink
  const accent = d.palette.accent
  // Same lockup-over-stack skeleton, three rhythms: high and tight, standard, low and open.
  const lockTop = m * (d.variant === 1 ? 1.1 : d.variant === 2 ? 2.3 : 1.5)
  const stackGap = h * (d.variant === 1 ? 0.05 : d.variant === 2 ? 0.12 : 0.08)
  const lock = stackedLockup(ledger, d, w / 2, lockTop, w - m * 2, copy.brand, '', withIdent(ctx, {
    color: ink,
    mark: true,
    markColor: accent,
    brandMax: Math.min(11, w * 0.16),
  }))
  parts.push(lock.markup)
  const waveCat = categoryCaption(ctx)
  if (waveCat) parts.push(spacedLine(ledger, w / 2, lock.bottom + 2.6, waveCat, Math.max(1.5, Math.min(2.2, w * 0.03)), ink, w - m * 2))
  const stack = productStack(ledger, d, w / 2, lock.bottom + stackGap, w - m * 2, copy.product, withIdent(ctx, {
    color: ink,
    accent,
    max: Math.min(8, w * 0.11),
  }))
  parts.push(stack.markup)
  if (d.volumeLine) {
    parts.push(netQuantity(ledger, w / 2, h - m * 0.9, d.volumeLine, Math.max(1.9, Math.min(2.6, w * 0.032)), ink))
  }
  if (ctx.wrapSeam) parts.push(seamMark(w, h, ink))
  return parts.join('')
}

/* ---------------------------------------------------------- landscape-badge */

/**
 * Arched landscape window with the product badge riding its foot (Anadolu Bal).
 * Shared by the label face and the box front. Portrait: lockup → prefix → window → badge → chips → foot line.
 * Landscape: lockup + prefix + chips + tagline in a left column, window + badge on the right.
 */
export function paintLandscapeWindowFace(ctx: LayoutCtx, opts: { frameInset?: number; brandMax?: number } = {}): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const parts: string[] = [paintBackground('paper', w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid })]
  const ink = d.palette.ink
  const accent = d.palette.accent
  parts.push(thinDoubleFrame(w, h, opts.frameInset ?? m * 0.55, accent))
  const landscape = isLandscape(w, h)
  const markKind = d.sector === 'food' ? 'bee' : 'leaf'
  const prefix = (d.productPrefix || d.taglineLine).toLocaleLowerCase('tr')
  const chips = d.chips.slice(0, 2)
  const chipSize = 1.5
  const chipBlock = (cx: number, y: number, span: number) => {
    // two spaced chips around a small mark
    if (chips[0]) parts.push(spacedLine(ledger, cx - span * 0.28, y, chips[0], chipSize, ink, span * 0.42))
    if (chips[1]) {
      parts.push(
        spacedLine(
          ledger,
          cx + span * 0.28,
          y,
          claimLine(copy, d.chips),
          chipSize,
          ink,
          span * 0.42,
          'middle',
          'sans',
          d.surface === 'label' ? 'cta' : undefined,
        ),
      )
    }
    parts.push(brandMark(markKind, cx, y - 0.6, 1.6, accent))
    ledger.add('element', 'foot-mark', cx - 1.8, y - 2.4, 3.6, 3.6)
  }
  const window = (winX: number, winY: number, winW: number, winH: number, badgeOverlap: number) => {
    const arch = archWindow(ctx.uid, winX, winY, winW, winH)
    parts.push(`<defs>${arch.defs}</defs>`)
    parts.push(`<g clip-path="url(#${arch.clipId})"><g transform="translate(${f(winX)} ${f(winY)})">${paintBackground('landscape-meadow', winW, winH, d.palette, d.seed, { species: ctx.species, uid: `${ctx.uid}-w` })}</g></g>`)
    parts.push(arch.outline(accent))
    ledger.add('ground', 'window', winX, winY, winW, winH)
    const badgeW = winW * 0.78
    const badgeH = productBadgeHeight(d, badgeW, copy.product, d.categoryLine, d.volumeLine, ctx.titleScale)
    const badge = productBadge(ledger, d, winX + winW / 2, winY + winH - badgeH * badgeOverlap, badgeW, copy.product, d.categoryLine, d.volumeLine, ctx.titleScale)
    parts.push(badge.markup)
    return badge
  }
  if (landscape) {
    const colW = w * 0.46 - m
    const colCx = m + colW / 2
    const lock = stackedLockup(ledger, d, colCx, m * 1.4, colW, copy.brand, '', withIdent(ctx, { mark: true, markKind: 'mountain', markColor: accent, color: ink, brandMax: Math.min(opts.brandMax ?? 9, colW * 0.16) }))
    parts.push(lock.markup)
    const preSize = Math.max(2, Math.min(3.2, colW * 0.07)) * ctx.titleScale
    parts.push(textEl({ x: colCx, y: lock.bottom + preSize * 0.9, text: prefix, size: preSize, face: 'serif-italic', fill: d.palette.accent2, anchor: 'middle', italic: true }))
    ledger.text('prefix', colCx, lock.bottom + preSize * 0.9, textWidth(prefix, preSize, 'serif-italic'), preSize, 'middle')
    const winX = w * 0.5
    const winW = w - winX - m * 1.4
    const winY = m * 1.3
    const winH = h - winY - m * 1.3
    window(winX, winY, winW, winH, 1.0)
    const chipY = Math.min(h - m * 2.6, lock.bottom + preSize * 3.2)
    if (chipY > lock.bottom + preSize * 2.4) chipBlock(colCx, chipY, colW)
    const foot = h - m * 0.9
    if (foot - chipY > 3.5) parts.push(spacedLine(ledger, colCx, foot, d.taglineLine, 1.4, d.palette.muted, colW, 'middle', 'sans', 'tagline'))
  } else {
    const lock = stackedLockup(ledger, d, w / 2, m * 1.4, w - m * 3, copy.brand, '', withIdent(ctx, { mark: true, markKind: 'mountain', markColor: accent, color: ink, brandMax: Math.min(opts.brandMax ?? 9, w * 0.13) }))
    parts.push(lock.markup)
    const preSize = Math.max(2, Math.min(3.4, w * 0.045)) * ctx.titleScale
    parts.push(textEl({ x: w / 2, y: lock.bottom + preSize * 0.9, text: prefix, size: preSize, face: 'serif-italic', fill: d.palette.accent2, anchor: 'middle', italic: true }))
    ledger.text('prefix', w / 2, lock.bottom + preSize * 0.9, textWidth(prefix, preSize, 'serif-italic'), preSize, 'middle')
    // reserve the foot: badge overhang + chips + tagline, then let the window fill the rest
    const winX = m * 1.6
    const winW = w - winX * 2
    // Same window-and-badge skeleton, three proportions: tight with a deep badge, standard,
    // airy with the badge sitting mostly below the window.
    const gap = d.variant === 1 ? 1.2 : d.variant === 2 ? 3 : 2
    const overlap = d.variant === 1 ? 0.72 : d.variant === 2 ? 0.38 : 0.55
    const winY = lock.bottom + preSize * gap
    const badgeH = productBadgeHeight(d, winW * 0.78, copy.product, d.categoryLine, d.volumeLine, ctx.titleScale)
    const footNeed = badgeH * 0.45 + 3.4 + chipSize * 1.2 + 4.2
    const winH = Math.max(winW * 0.55, h - m * 1.1 - footNeed - winY)
    const badge = window(winX, winY, winW, winH, overlap)
    const chipY = Math.min(h - m * 1.6, badge.bottom + 3.4)
    chipBlock(w / 2, chipY, winW)
    const foot = h - m * 0.75
    if (foot - chipY > 3.5) parts.push(spacedLine(ledger, w / 2, foot, d.taglineLine, 1.4, d.palette.muted, w - m * 3, 'middle', 'sans', 'tagline'))
  }
  if (ctx.wrapSeam) parts.push(seamMark(w, h, ink))
  return parts.join('')
}

function landscapeBadge(ctx: LayoutCtx): string {
  return paintLandscapeWindowFace(ctx)
}

/* ---------------------------------------------------------------- ink-panel */

function inkPanel(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const parts: string[] = [paintBackground('ink-wash', w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, corner: 'bl' })]
  const ink = d.palette.ink
  const accent = d.palette.accent
  parts.push(thinDoubleFrame(w, h, m * 0.5, accent, 0.8))
  const lock = stackedLockup(ledger, d, w / 2, m * 1.8, w - m * 3, copy.brand, cityLine(ctx.brief), withIdent(ctx, { color: ink, markColor: accent, brandMax: Math.min(10, w * 0.14) }))
  parts.push(lock.markup)
  const stack = productStack(ledger, d, w / 2, lock.bottom + h * 0.06, w - m * 3, copy.product, withIdent(ctx, { color: ink, accent, category: d.categoryLine, max: Math.min(9, w * 0.13) }))
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

export function paintLabelFace(ctx: LayoutCtx): string {
  switch (ctx.d.archetype as LabelArchetype) {
    case 'card-on-art':
      return cardOnArt(ctx)
    case 'diagonal-split':
      return diagonalSplit(ctx)
    case 'line-scene':
      return lineScene(ctx)
    case 'wave-panel':
      return paintWavePanelFace(ctx)
    case 'landscape-badge':
      return landscapeBadge(ctx)
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
  const parts: string[] = [ground(w, h, bg)]
  if (d.frame === 'thin-double') parts.push(thinDoubleFrame(w, h, m * 0.5, d.palette.accent, 0.7))
  const hdr = backHeaders(d.locale)
  const title = copy.product.toLocaleUpperCase('tr')
  const tSize = fitSize(title, w - m * 2, 4.2 * ctx.titleScale, 2.2 * ctx.titleScale, 'sans-heavy', 0.12)
  parts.push(textEl({ x: w / 2, y: m + tSize, text: title, size: tSize, face: 'sans-heavy', fill: ink, anchor: 'middle', tracking: tSize * 0.12, extra: 'data-edit="product"' }))
  ledger.text('back-title', w / 2, m + tSize, textWidth(title, tSize, 'sans-heavy', tSize * 0.12), tSize, 'middle')
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
