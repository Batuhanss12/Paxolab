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
  markKindFor,
  monogramLockup,
  netQuantity,
  nutritionTable,
  nutritionTableHeight,
  paragraph,
  pictogramRow,
  pictogramsFor,
  productBadge,
  productBadgeHeight,
  productStack,
  qrPlaceholder,
  qualityBadge,
  spacedLine,
  stackedLockup,
  stackedWords,
  thinDoubleFrame,
  titleCard,
  type Section,
} from './anatomy'
import { ground, paintBackground } from './backgrounds'
import { darken, isDark, lighten, mix } from './color'
import { backHeaders, nutritionRows, usageLine } from './copyBank'
import { cityLine, isLandscape, isTiny, marginFor, seamMark, type LayoutCtx } from './layoutContext'
import { Ledger, fitSize, textEl, textWidth, wrapByWidth } from './text'
import type { LabelArchetype } from './types'

const f = (n: number) => (Math.round(n * 100) / 100).toString()

function legalSections(ctx: LayoutCtx): Section[] {
  const hdr = backHeaders(ctx.d.locale)
  return [
    { title: hdr.usage, body: usageLine(ctx.d.sector, ctx.d.locale) },
    { title: hdr.warnings, body: ctx.copy.warnings },
    { title: hdr.ingredients, body: ctx.copy.ingredients },
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
  const parts: string[] = [paintBackground(d.background, w, h, d.palette, d.seed, { uid: ctx.uid, intensity: 0.85 })]
  const pill = brandPill(ledger, d, w - m, m, copy.brand, w * 0.42)
  parts.push(pill.markup)
  const ink = d.palette.ink
  // bottom-left reserve: pictograms + net quantity (measured first so the card block can avoid it)
  const picS = Math.max(4, Math.min(6, h * 0.075))
  const picY = h - m - picS
  const volSize = Math.max(2, Math.min(3.2, w * 0.035))
  const vol = d.volumeLine
  const reserveTop = vol ? picY - volSize * 1.9 : picY - 1
  // legal column only when the label has no utility back — the reference fronts stay clean
  let legalBottom = m
  if (!ctx.hasBack) {
    const colW = landscape ? w * 0.4 : w * 0.46
    const colBottom = landscape ? reserveTop - 2 : h * 0.4
    const legal = legalColumn(ledger, m, m + (landscape ? 0 : pill.box.h + 1.5), colW, colBottom, legalSections(ctx), ink, { size: Math.max(1.25, Math.min(1.55, w * 0.016)), titleColor: ink })
    parts.push(legal.markup)
    legalBottom = legal.bottom
  }
  // title card + claim band + sentence: measure on a probe ledger, then place the block so it ends above the reserve
  const cardW = landscape ? w * 0.44 : w - m * 2
  const cardX = landscape ? w - m - cardW : m
  const sentenceSize = Math.max(1.6, Math.min(2.3, cardW * 0.045))
  const sentenceText = d.taglineLine || copy.tagline
  const probe = new Ledger(ledger.panel)
  const pCard = titleCard(probe, d, cardX, 0, cardW, copy.product, d.categoryLine, { prefix: d.productPrefix })
  const pBand = claimBand(probe, d, cardX, pCard.bottom, cardW, d.chips[0] ?? d.categoryLine)
  const pSentence = paragraph(probe, cardX, pBand.bottom + 2, cardW, sentenceText, sentenceSize, 'sans', ink, 2, 'middle')
  const blockH = pSentence.bottom
  const wanted = landscape ? pill.box.y + pill.box.h + h * 0.12 : ctx.hasBack ? h * 0.36 : Math.max(legalBottom + 2, h * 0.44)
  const blockBottomLimit = landscape ? h - m : reserveTop - 2.5
  const cardY = Math.max(pill.box.y + pill.box.h + 2, Math.min(wanted, blockBottomLimit - blockH))
  const card = titleCard(ledger, d, cardX, cardY, cardW, copy.product, d.categoryLine, { prefix: d.productPrefix })
  parts.push(card.markup)
  const band = claimBand(ledger, d, cardX, card.bottom, cardW, d.chips[0] ?? d.categoryLine)
  parts.push(band.markup)
  const sentence = paragraph(ledger, cardX, band.bottom + 2, cardW, sentenceText, sentenceSize, 'sans', ink, 2, 'middle')
  parts.push(sentence.markup)
  // pictograms + QR + net quantity
  const pic = pictogramRow(ledger, m, picY, picS, pictogramsFor(d).filter((k) => k !== 'flammable').slice(0, 3), ink, ctx.paoMonths)
  parts.push(pic.markup)
  parts.push(qrPlaceholder(ledger, m + pic.w + 2, picY, picS, ink, d.seed))
  if (vol) parts.push(netQuantity(ledger, m, picY - volSize * 0.9, vol, volSize, ink, 'start'))
  if (ctx.wrapSeam) parts.push(seamMark(w, h, ink))
  return parts.join('')
}

/* ------------------------------------------------------------ marble-frame */

function marbleFrame(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const parts: string[] = [paintBackground('marble', w, h, d.palette, d.seed, { uid: ctx.uid, intensity: 0.85 })]
  const ink = d.palette.ink
  const accent = d.palette.accent
  // lockup inside corner brackets in the upper third
  const bx = m * 1.6
  const bw = w - bx * 2
  const by = h * 0.1
  const lock = stackedLockup(ledger, d, w / 2, by + 3, bw - 6, copy.brand, d.chips[1] ?? d.taglineLine, { mark: true, markColor: accent, color: d.palette.accent2, brandMax: Math.min(bw * 0.15, 10) })
  parts.push(lock.markup)
  const bh = lock.bottom - by + 3
  parts.push(cornerBrackets(bx, by, bw, bh, accent, Math.min(bw * 0.22, 12)))
  // tiny "HIGH-QUALITY COFFEE" style category under the bracket
  const catSize = 1.5
  parts.push(spacedLine(ledger, w / 2, by + bh + catSize * 2.2, d.categoryLine, catSize, ink, bw))
  // product at the foot: script prefix + heavy product
  const productTop = h * 0.7
  const stack = productStack(ledger, d, w / 2, productTop, w - m * 2, copy.product, { color: ink, accent, prefix: d.productPrefix, max: Math.min(8.5, w * 0.11) })
  parts.push(stack.markup)
  if (d.volumeLine) {
    const size = Math.max(2, Math.min(2.8, w * 0.032))
    parts.push(netQuantity(ledger, w / 2, Math.min(h - m, stack.bottom + size * 2.2), d.volumeLine, size, ink))
  }
  if (ctx.wrapSeam) parts.push(seamMark(w, h, ink))
  return parts.join('')
}

/* ----------------------------------------------------------- diagonal-split */

function diagonalSplit(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const parts: string[] = [paintBackground('diagonal', w, h, d.palette, d.seed, { uid: ctx.uid })]
  const ink = d.palette.ink
  const accent = d.palette.accent
  const landscape = isLandscape(w, h)
  const tiny = isTiny(w, h)
  const colW = landscape ? w * 0.42 : w - m * 2
  // left column: light + heavy product title
  const words = copy.product.toLocaleUpperCase('tr').split(/\s+/)
  const first = words.length > 1 ? words.slice(0, -1).join(' ') : ''
  const last = words[words.length - 1] ?? ''
  const titleMax = Math.min(landscape ? 7.5 : 8.5, colW * 0.17)
  const tSize = Math.min(fitSize(first || last, colW, titleMax, 2.8, 'sans-light', 0.02), fitSize(last, colW, titleMax, 2.8, 'sans-heavy', 0.02))
  let y = m + tSize
  if (first) {
    parts.push(textEl({ x: m, y, text: first, size: tSize, face: 'sans-light', fill: ink, tracking: tSize * 0.02 }))
    ledger.text('product-light', m, y, textWidth(first, tSize, 'sans-light', tSize * 0.02), tSize)
    y += tSize * 1.05
  }
  parts.push(textEl({ x: m, y, text: last, size: tSize, face: 'sans-heavy', fill: ink, tracking: tSize * 0.02 }))
  ledger.text('product', m, y, textWidth(last, tSize, 'sans-heavy', tSize * 0.02), tSize)
  y += tSize * 0.9
  // sub + chip + gold category
  const subSize = Math.max(1.5, tSize * 0.32)
  parts.push(textEl({ x: m, y, text: d.taglineLine, size: subSize, face: 'sans', fill: d.palette.muted }))
  ledger.text('sub', m, y, textWidth(d.taglineLine, subSize, 'sans'), subSize)
  y += subSize * 1.6
  const c = chip(ledger, d, m, y, d.chips[1] ?? d.chips[0] ?? 'PROFESSIONAL', { color: ink, size: Math.max(1.5, subSize * 0.95) })
  parts.push(c.markup)
  y += c.h + subSize * 1.3
  const catSize = Math.max(1.9, tSize * 0.42)
  parts.push(textEl({ x: m, y, text: d.categoryLine, size: catSize, face: 'sans-heavy', fill: accent, tracking: catSize * 0.12 }))
  ledger.text('category', m, y, textWidth(d.categoryLine, catSize, 'sans-heavy', catSize * 0.12), catSize)
  y += catSize * 0.9
  // bottom-left reserve: producer + pictos + QR
  const picS = Math.max(3.6, Math.min(5.2, h * 0.065))
  const picY = h - m - picS
  const producerTop = tiny ? picY - 1 : picY - 4.2
  // legal stack under the category (skipped on tiny faces or when a utility back carries it)
  let legalBottom = y
  if (!tiny && !ctx.hasBack) {
    const limit = landscape ? producerTop - 2 : h * 0.62
    const legal = legalColumn(ledger, m, y, colW, limit, [legalSections(ctx)[2], legalSections(ctx)[0], legalSections(ctx)[1]], ink, { size: Math.max(1.2, Math.min(1.45, w * 0.014)), titleColor: ink })
    parts.push(legal.markup)
    legalBottom = legal.bottom
  }
  if (!tiny) {
    const producer = paragraph(ledger, m, producerTop, colW, producerLine(ctx), 1.15, 'sans', d.palette.muted, 2, 'start')
    parts.push(producer.markup)
  }
  const pics = pictogramRow(ledger, m, picY, picS, pictogramsFor(d).filter((k) => k !== 'flammable').slice(0, 3), ink, ctx.paoMonths)
  parts.push(pics.markup)
  if (!tiny) parts.push(qrPlaceholder(ledger, m + pics.w + 2, picY, picS, ink, d.seed))
  // right column: monogram lockup, centered title, chip, badge, volume
  const rx = landscape ? w * 0.52 : m
  const rw = landscape ? w - rx - m : w - m * 2
  const rcx = rx + rw / 2
  const rTop = landscape ? m : legalBottom + 2
  const mono = monogramLockup(ledger, d, rcx, rTop, copy.brand, rw * 0.6, accent)
  parts.push(mono.markup)
  parts.push(brandMark('leaf', rcx, mono.bottom + 4, 2.2, mix(accent, '#3f8a3a', 0.4)))
  ledger.add('element', 'leaf-mark', rcx - 2.4, mono.bottom + 1.6, 4.8, 4.8)
  const volSize = Math.max(2, Math.min(2.8, rw * 0.06))
  const volBase = h - m * 0.6
  if (tiny) {
    // small jar / sachet: monogram + category + volume; the left column already carries the title
    const catBase = Math.min(mono.bottom + 9, volBase - volSize * 2.2)
    parts.push(spacedLine(ledger, rcx, catBase, d.categoryLine, 1.7, accent, rw))
    if (d.volumeLine) parts.push(netQuantity(ledger, rcx, volBase, d.volumeLine, volSize, ink))
  } else {
    const stack = productStack(ledger, d, rcx, mono.bottom + 9, rw, copy.product, { color: ink, accent, category: d.categoryLine, max: Math.min(6.8, rw * 0.13) })
    parts.push(stack.markup)
    const chipText = d.chips[1] ?? d.chips[0] ?? 'PROFESSIONAL'
    const chipSize = 1.6
    const chipH = chipSize * 1.75
    const badgeH = 2.1 * 2.2
    const roomBelowChip = volBase - volSize * 1.4 - (stack.bottom + 2.2 + chipH)
    if (roomBelowChip > 2) parts.push(chip(ledger, d, rcx, stack.bottom + 2.2, chipText, { color: ink, size: chipSize, anchor: 'middle' }).markup)
    if (roomBelowChip > badgeH + 3) {
      const badgeY = stack.bottom + 2.2 + chipH + 3
      const badge = qualityBadge(ledger, d, rcx, badgeY, d.locale === 'en' ? 'PREMIUM QUALITY' : 'PREMIUM KALİTE', d.locale === 'en' ? 'BEST CHOICE' : 'EN İYİ SEÇİM', accent)
      parts.push(badge.markup)
    }
    if (d.volumeLine) parts.push(netQuantity(ledger, rcx, volBase, d.volumeLine, volSize, ink))
  }
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
  parts.push(brandMark(markKindFor(d), w / 2, m + r, r, ink, copy.brand))
  ledger.add('element', 'brand-mark', w / 2 - r * 1.4, m, r * 2.8, r * 2)
  const brandSize = fitSize(copy.brand.toLocaleUpperCase('tr'), w * 0.7, 4.4, 2.2, 'sans-heavy', 0.12)
  const brandY = m + r * 2 + brandSize * 1.4
  parts.push(textEl({ x: w / 2, y: brandY, text: copy.brand.toLocaleUpperCase('tr'), size: brandSize, face: 'sans-heavy', fill: ink, anchor: 'middle', tracking: brandSize * 0.12 }))
  ledger.text('brand', w / 2, brandY, textWidth(copy.brand.toLocaleUpperCase('tr'), brandSize, 'sans-heavy', brandSize * 0.12), brandSize, 'middle')
  // two-tone title
  const words = copy.product.toLocaleUpperCase('tr').split(/\s+/)
  const a = words.length > 1 ? words.slice(0, Math.ceil(words.length / 2)).join(' ') : words[0]
  const b = words.length > 1 ? words.slice(Math.ceil(words.length / 2)).join(' ') : ''
  const titleMax = Math.min(7.5, w * 0.11)
  const full = b ? `${a} ${b}` : a
  const size = fitSize(full, w - m * 2, titleMax, 2.6, 'sans-heavy', 0.1)
  const track = size * 0.1
  const wa = textWidth(a, size, 'sans-light', track)
  const wb = b ? textWidth(` ${b}`, size, 'sans-heavy', track) : 0
  const startX = w / 2 - (wa + wb) / 2
  const titleY = brandY + size * 2.6
  parts.push(textEl({ x: startX, y: titleY, text: a, size, face: 'sans-light', fill: d.palette.accent2, tracking: track, weight: 400 }))
  if (b) parts.push(textEl({ x: startX + wa, y: titleY, text: ` ${b}`, size, face: 'sans-heavy', fill: ink, tracking: track }))
  ledger.text('product', w / 2, titleY, wa + wb, size, 'middle')
  const subSize = Math.max(1.6, size * 0.36)
  parts.push(spacedLine(ledger, w / 2, titleY + subSize * 2.1, d.categoryLine, subSize, ink, w - m * 2))
  // scene
  parts.push(paintBackground('line-scene', w, h, d.palette, d.seed, { uid: ctx.uid, span: 0.46 }))
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
  const parts: string[] = [paintBackground('wave', w, h, d.palette, d.seed, { uid: ctx.uid })]
  const ink = d.palette.ink
  const accent = d.palette.accent
  const lock = stackedLockup(ledger, d, w / 2, m * 1.5, w - m * 2, copy.brand, '', {
    color: ink,
    mark: true,
    markColor: accent,
    brandMax: Math.min(11, w * 0.16),
  })
  parts.push(lock.markup)
  parts.push(spacedLine(ledger, w / 2, lock.bottom + 2.6, d.categoryLine, Math.max(1.5, Math.min(2.2, w * 0.03)), ink, w - m * 2))
  const stack = productStack(ledger, d, w / 2, lock.bottom + h * 0.08, w - m * 2, copy.product, {
    color: ink,
    accent,
    max: Math.min(8, w * 0.11),
  })
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
  const parts: string[] = [paintBackground('paper', w, h, d.palette, d.seed, { uid: ctx.uid })]
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
    if (chips[1]) parts.push(spacedLine(ledger, cx + span * 0.28, y, chips[1], chipSize, ink, span * 0.42))
    parts.push(brandMark(markKind, cx, y - 0.6, 1.6, accent))
    ledger.add('element', 'foot-mark', cx - 1.8, y - 2.4, 3.6, 3.6)
  }
  const window = (winX: number, winY: number, winW: number, winH: number, badgeOverlap: number) => {
    const arch = archWindow(ctx.uid, winX, winY, winW, winH)
    parts.push(`<defs>${arch.defs}</defs>`)
    parts.push(`<g clip-path="url(#${arch.clipId})"><g transform="translate(${f(winX)} ${f(winY)})">${paintBackground('landscape-meadow', winW, winH, d.palette, d.seed, { uid: `${ctx.uid}-w` })}</g></g>`)
    parts.push(arch.outline(accent))
    ledger.add('ground', 'window', winX, winY, winW, winH)
    const badgeW = winW * 0.78
    const badgeH = productBadgeHeight(d, badgeW, copy.product, d.categoryLine, d.volumeLine)
    const badge = productBadge(ledger, d, winX + winW / 2, winY + winH - badgeH * badgeOverlap, badgeW, copy.product, d.categoryLine, d.volumeLine)
    parts.push(badge.markup)
    return badge
  }
  if (landscape) {
    const colW = w * 0.46 - m
    const colCx = m + colW / 2
    const lock = stackedLockup(ledger, d, colCx, m * 1.4, colW, copy.brand, '', { mark: true, markKind: 'mountain', markColor: accent, color: ink, brandMax: Math.min(opts.brandMax ?? 9, colW * 0.16) })
    parts.push(lock.markup)
    const preSize = Math.max(2, Math.min(3.2, colW * 0.07))
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
    if (foot - chipY > 3.5) parts.push(spacedLine(ledger, colCx, foot, d.taglineLine, 1.4, d.palette.muted, colW))
  } else {
    const lock = stackedLockup(ledger, d, w / 2, m * 1.4, w - m * 3, copy.brand, '', { mark: true, markKind: 'mountain', markColor: accent, color: ink, brandMax: Math.min(opts.brandMax ?? 9, w * 0.13) })
    parts.push(lock.markup)
    const preSize = Math.max(2, Math.min(3.4, w * 0.045))
    parts.push(textEl({ x: w / 2, y: lock.bottom + preSize * 0.9, text: prefix, size: preSize, face: 'serif-italic', fill: d.palette.accent2, anchor: 'middle', italic: true }))
    ledger.text('prefix', w / 2, lock.bottom + preSize * 0.9, textWidth(prefix, preSize, 'serif-italic'), preSize, 'middle')
    // reserve the foot: badge overhang + chips + tagline, then let the window fill the rest
    const winX = m * 1.6
    const winW = w - winX * 2
    const winY = lock.bottom + preSize * 2
    const badgeH = productBadgeHeight(d, winW * 0.78, copy.product, d.categoryLine, d.volumeLine)
    const footNeed = badgeH * 0.45 + 3.4 + chipSize * 1.2 + 4.2
    const winH = Math.max(winW * 0.55, h - m * 1.1 - footNeed - winY)
    const badge = window(winX, winY, winW, winH, 0.55)
    const chipY = Math.min(h - m * 1.6, badge.bottom + 3.4)
    chipBlock(w / 2, chipY, winW)
    const foot = h - m * 0.75
    if (foot - chipY > 3.5) parts.push(spacedLine(ledger, w / 2, foot, d.taglineLine, 1.4, d.palette.muted, w - m * 3))
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
  const parts: string[] = [paintBackground('ink-wash', w, h, d.palette, d.seed, { uid: ctx.uid, corner: 'bl' })]
  const ink = d.palette.ink
  const accent = d.palette.accent
  parts.push(thinDoubleFrame(w, h, m * 0.5, accent, 0.8))
  const lock = stackedLockup(ledger, d, w / 2, m * 1.8, w - m * 3, copy.brand, cityLine(ctx.brief), { color: ink, markColor: accent, brandMax: Math.min(10, w * 0.14) })
  parts.push(lock.markup)
  const stack = productStack(ledger, d, w / 2, lock.bottom + h * 0.06, w - m * 3, copy.product, { color: ink, accent, category: d.categoryLine, max: Math.min(9, w * 0.13) })
  parts.push(stack.markup)
  // stacked tagline
  const tagWords = wrapByWidth(d.taglineLine.toLocaleUpperCase('tr'), w * 0.5, 1.6, 'sans', 3, 0.5)
  const tagTop = stack.bottom + h * 0.05
  const tag = stackedWords(ledger, w / 2, tagTop, tagWords, 1.7, ink, w * 0.55)
  parts.push(tag.markup)
  // foot: tagline / volume on the right-bottom (ink wash occupies bottom-left)
  const footY = h - m * 1.1
  const onInk = footY > h * 0.6
  const footColor = onInk ? d.palette.card : ink
  if (d.volumeLine) parts.push(netQuantity(ledger, w - m, footY, d.volumeLine, Math.max(1.9, Math.min(2.6, w * 0.03)), footColor, 'end'))
  parts.push(spacedLine(ledger, w - m, footY - 4, copy.tagline || d.chips[0] || '', 1.3, footColor, w * 0.6, 'end'))
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
  const tSize = fitSize(title, w - m * 2, 4.2, 2.2, 'sans-heavy', 0.12)
  parts.push(textEl({ x: w / 2, y: m + tSize, text: title, size: tSize, face: 'sans-heavy', fill: ink, anchor: 'middle', tracking: tSize * 0.12 }))
  ledger.text('back-title', w / 2, m + tSize, textWidth(title, tSize, 'sans-heavy', tSize * 0.12), tSize, 'middle')
  parts.push(hairline(m, m + tSize * 1.8, w - m, d.palette.accent, 0.8, 0.22))
  const barH = Math.max(7, Math.min(10, h * 0.12))
  const footTop = h - m - barH - 3.4
  const sections: Section[] = [
    { title: hdr.usage, body: usageLine(d.sector, d.locale) },
    { title: hdr.warnings, body: copy.warnings },
    { title: hdr.ingredients, body: copy.ingredients },
    { title: hdr.producer, body: producerLine(ctx) },
  ]
  const legalSize = Math.max(1.25, Math.min(1.6, w * 0.017))
  const titleColor = d.palette.accent === ink ? ink : vivid ? ink : d.palette.accent
  let legalTop = m + tSize * 2.4
  let legalX = m
  let legalW = w - m * 2
  const food = d.sector === 'food' || d.sector === 'beverage'
  if (food) {
    // Food backs carry the nutrition table: beside the legal copy when wide, above it otherwise.
    const blob = `${ctx.brief.subProduct} ${ctx.brief.productName} ${ctx.brief.sector}`.toLocaleLowerCase('tr')
    const tableSize = Math.max(1.15, Math.min(1.4, w * 0.015))
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
  const legal = legalColumn(ledger, legalX, legalTop, legalW, footTop - 1.5, sections, ink, { size: legalSize, anchor: food && legalW < w - m * 2 ? 'start' : 'middle', titleColor })
  parts.push(legal.markup)
  // foot row: pictograms | barcode | volume
  const picS = Math.max(3.6, Math.min(5.2, barH * 0.6))
  const pics = pictogramsFor(d).slice(0, 3)
  const picW = pics.length * picS + (pics.length - 1) * picS * 0.35
  const barW = Math.min(w * 0.42, 30)
  const rowY = h - m - barH
  parts.push(pictogramRow(ledger, m, rowY + (barH - picS) / 2 - 1.2, picS, pics, ink, ctx.paoMonths).markup)
  const barX = Math.max(m + picW + 2, w - m - barW)
  parts.push(barcodeBlock(ledger, barX, rowY, Math.min(barW, w - m - barX), barH - 3.2, copy.barcode, ink, !isDark(bg)))
  if (d.volumeLine) {
    const vs = Math.max(1.6, Math.min(2.2, w * 0.026))
    const volX = m + picW + 1.5
    const volW = textWidth(d.volumeLine, vs, 'sans', vs * 0.06)
    // measured: the line must end before the barcode quiet zone; otherwise it sits above the pictograms
    if (volX + volW < barX - 2.5) parts.push(netQuantity(ledger, volX, rowY + barH * 0.55, d.volumeLine, vs, ink, 'start'))
    else if (rowY - 1 > legal.bottom + vs * 1.2) parts.push(netQuantity(ledger, m, rowY - 1.2, d.volumeLine, vs, ink, 'start'))
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
