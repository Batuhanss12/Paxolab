/**
 * The reference repertoire — eight faces the first ten cannot paint.
 *
 * The ten studio archetypes are each one reference distilled into a field-plus-anatomy system, and
 * between them they cover a particular shelf: a centred lockup over a texture, with the variations
 * Phases 2B–5 added. Read against the thirty-one references, the audit found that whole skeletons
 * were missing — not decorations on the ten, but different ways of organising a face: an arched
 * crown over a spec band, a subject inside an arch window with a word turned up the side, one
 * oversized silhouette owning the lower half, a cut-silhouette frame with a ribbon through it, a
 * rotated display beside a monospace grid, a pattern with the type floating on it, a blob crossing
 * the whole face, an art card inset into a quiet one.
 *
 * So this is a second complete set of eight, offered only when the customer asks for other designs
 * (`brief.studioRepertoire`). The ten stay exactly as they are — every frozen face is painted by
 * them, and nothing here is reachable by default.
 *
 * What these take from the references is their *grammar*: where the mass sits, what the type does
 * against it, which panel carries what, how the colour is split. No reference file enters the
 * runtime and nothing is traced — the rule the audit opens with, and the reason the drawing is
 * still `speciesHero`, the fields still `graphicFields`, the marks still the studio's own library.
 */
import {
  archWindow,
  benefitColumn,
  benefitIcon,
  chip,
  chipWidth,
  hairline,
  heroInk,
  markKindFor,
  netQuantity,
  paintFrame,
  paintMark,
  productStack,
  secondaryMax,
  spacedLine,
  STUDIO_MIN_LOGO_R,
  verticalBrand,
} from './anatomy'
import { ground, paintBackground } from './backgrounds'
import { isDark, lighten, mix, readableInk } from './color'
import { categoryCaption, cityLine, identOf, isLandscape, isTiny, marginFor, seamMark, withIdent, type LayoutCtx } from './layoutContext'
import { motifAspect, paintMotif } from './motifs'
import { STUDIO_FLOOR_TEXT_MM } from './studioPreflight'
import { companionSpecies, heroLayout, type Species } from './species'
import { fitSubject } from './subject'
import { fitSize, pairingFaces, textEl, textWidth, typeSize } from './text'
import { brandCase, brandScale, brandTracking } from './typeSystem'
import type { StudioArchetype } from './types'

const f = (n: number) => (Math.round(n * 100) / 100).toString()

const PAINTERS: Partial<Record<StudioArchetype, (ctx: LayoutCtx) => string>> = {
  'arch-crown': paintArchCrownFace,
  'collage-plate': paintCollagePlateFace,
  'silhouette-foot': paintSilhouetteFootFace,
  'ribbon-crest': paintRibbonCrestFace,
  'grid-mono': paintGridMonoFace,
  'pattern-float': paintPatternFloatFace,
  'blob-acid': paintBlobAcidFace,
  'inner-card': paintInnerCardFace,
}

/** The face for a reference-repertoire direction, or null when the studio repertoire owns it. */
export function paintReferenceFace(ctx: LayoutCtx): string | null {
  const painter = PAINTERS[ctx.d.archetype]
  return painter ? painter(ctx) : null
}

export function isReferenceArchetype(id: StudioArchetype): boolean {
  return id in PAINTERS
}

/* ----------------------------------------------------- the secondary panels */

/**
 * What a reference archetype leaves on the panels that are not its front.
 *
 * Measured before this existed: the eight archetypes were front-only painters. `paintBoxBack` and
 * `paintBoxSide` took the incoming archetype as `d.archetype as BoxArchetype` and branched on the
 * ten studio names, so the eight new ones were never recognised and fell silently to the default
 * branch — the cast meant the compiler could not say so either. The result was the owner's report
 * with a dieline on screen: the front carried the arch, the medallion and the frame, and no other
 * panel carried any of it. Measured across 108 cartons: the front's signature reached only 54% of
 * the other panels, against 75% for the studio repertoire.
 *
 * The fix is a skin, not eight more painters. The back already owns the hard part — the mandatory
 * legal stack, the nutrition table, the barcode, the producer line — and duplicating that per
 * archetype would double the surface to fix a surface problem. So the content machinery stays
 * exactly where it is and the archetype dresses it: its own outline instead of the generic frame,
 * and its own crowned mark instead of a bare sector glyph.
 *
 * Every skin is stroke-only and hugs the panel edge, so it can never collide with the content laid
 * over it and needs no ledger entry — the same contract `paintFrame` already works under.
 */
type SecondarySkin = 'arch' | 'crest' | 'plate' | 'rule'

function secondarySkin(id: StudioArchetype): SecondarySkin {
  if (id === 'arch-crown' || id === 'collage-plate') return 'arch'
  if (id === 'ribbon-crest') return 'crest'
  if (id === 'grid-mono' || id === 'inner-card') return 'plate'
  // `pattern-float`, `blob-acid`, `silhouette-foot`: the field is the signature and it already
  // carries, so the skin only has to agree with it rather than draw over it.
  return 'rule'
}

/**
 * Does this archetype's front show a brand mark at all?
 *
 * Two of the eight do; the rest put the wordmark up alone. A side panel that draws the generic
 * sector glyph on a carton whose face never showed one is not a detail — it is a second brand
 * mark, and it was happening on 116 of 614 reference panels. A panel may only wear the mark the
 * face established.
 *
 * `collage-plate` is deliberately not in this list even though its seal contains a mark. The seal
 * is a plate detail at the foot of the window, not a brand crown, and it is only stamped when the
 * window is big enough — so on a narrow carton the face showed no mark at all while the side still
 * crowned one. Measured: the last 8 splits were all exactly that.
 */
export function referenceFrontShowsMark(id: StudioArchetype): boolean {
  return id === 'arch-crown' || id === 'pattern-float'
}

/** The archetype's outline for a back or a side, in place of the generic rectangular frame. */
export function paintReferenceSkin(ctx: LayoutCtx, where: 'back' | 'side'): string | null {
  const { w, h, d } = ctx
  if (!isReferenceArchetype(d.archetype)) return null
  const m = marginFor(w, h)
  const inset = where === 'back' ? m * 0.55 : Math.min(m * 0.5, 1.8)
  const color = mix(d.palette.accent, d.palette.ground, 0.15)
  const stroke = Math.max(0.18, Math.min(w, h) * 0.006)
  const line = (x1: number, y1: number, x2: number, y2: number, op: number) =>
    `<path d="M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}" stroke="${color}" stroke-width="${f(stroke)}" opacity="${op}" fill="none" />`
  const box = (i: number, op: number) =>
    `<rect x="${f(i)}" y="${f(i)}" width="${f(w - i * 2)}" height="${f(h - i * 2)}" fill="none" stroke="${color}" stroke-width="${f(stroke)}" opacity="${op}" />`

  const parts: string[] = [`<g data-art="frame" data-skin="${secondarySkin(d.archetype)}">`]
  switch (secondarySkin(d.archetype)) {
    case 'arch': {
      if (where === 'back') {
        /*
         * A back wears the arch's shoulders, not the whole arch.
         *
         * The full outline takes exactly the width the mandatory legal stack needs. Measured on an
         * 80 × 110 label: the arch curved inward across the upper third and the nutrition table ran
         * straight through it — the decoration and the content were laid out against two different
         * shapes, and the content cannot yield because it is the regulatory block.
         *
         * The shoulder is what makes an arch read as an arch, and the top corners are the one
         * region a two-column back never uses. So the corners curve and the columns keep their
         * width, which is the same gesture without the argument.
         */
        const rr = Math.max(inset * 1.4, Math.min(w, h) * 0.13)
        parts.push(
          `<path d="M${f(inset)} ${f(inset + rr)} A ${f(rr)} ${f(rr)} 0 0 1 ${f(inset + rr)} ${f(inset)}" stroke="${color}" stroke-width="${f(stroke)}" fill="none" opacity="0.85" />`,
          `<path d="M${f(w - inset - rr)} ${f(inset)} A ${f(rr)} ${f(rr)} 0 0 1 ${f(w - inset)} ${f(inset + rr)}" stroke="${color}" stroke-width="${f(stroke)}" fill="none" opacity="0.85" />`,
          // The foot closes the frame the two shoulders open.
          line(inset, h - inset, w - inset, h - inset, 0.7),
        )
        break
      }
      // The same arch the face is built on, turned into the panel's own outline.
      const arch = archWindow(`${ctx.uid}-skin`, inset, inset, w - inset * 2, h - inset * 2)
      parts.push(`<defs>${arch.defs}</defs>`, arch.outline(color))
      break
    }
    case 'crest':
      // R29 / R30 run two rules inside the trim; the medallion stays on the face.
      parts.push(box(inset, 0.85), box(inset + Math.max(0.7, m * 0.3), 0.5))
      break
    case 'plate':
      // The inset card the grid and the art card both sit on.
      parts.push(box(inset + Math.max(0.6, m * 0.25), 0.8))
      break
    case 'rule':
      // A field-led face has nothing to outline, so the panel agrees with it at head and foot.
      parts.push(line(inset, inset, w - inset, inset, 0.8), line(inset, h - inset, w - inset, h - inset, 0.8))
      break
  }
  parts.push('</g>')
  return parts.join('')
}

/**
 * The face's crowned mark, for a panel that would otherwise wear the bare sector glyph.
 *
 * Returns null when the face shows no mark — in which case the caller must draw none either.
 */
export function paintReferenceCrownMark(ctx: LayoutCtx, cx: number, top: number, r: number, color: string): string | null {
  const { d, copy } = ctx
  if (!referenceFrontShowsMark(d.archetype)) return null
  const wreath = r * 2.4
  return (
    paintMotif('olive-wreath', cx - wreath / 2, top, wreath, wreath, mix(color, d.palette.ground, 0.2), { opacity: 0.9 }) +
    paintMark(markKindFor(d), cx, top + wreath / 2, r * 0.62, color, copy.brand, identOf(ctx))
  )
}

/* ------------------------------------------------------------------ helpers */

/**
 * The brand line as this face's type system sets it — fitted, booked, and told where it ends.
 *
 * Takes the *top* of the line rather than its baseline. A caller that passes a baseline has to
 * guess the size first, and every guess here was a fraction of the face's width: on a 90 × 45
 * carton the guess put a 14 mm brand on a 45 mm panel and the product printed through it. So the
 * size is decided here, from the room and from the face's own height, and the baseline follows
 * from it.
 */
function brandLine(
  ctx: LayoutCtx,
  cx: number,
  top: number,
  maxW: number,
  max: number,
  color: string,
  anchor: 'start' | 'middle' | 'end' = 'middle',
): { markup: string; size: number; width: number; baseline: number; bottom: number } {
  const { d, ledger, copy } = ctx
  const faces = pairingFaces(d.typePairing)
  const text = brandCase(d.typePairing, copy.brand)
  const tracking = brandTracking(d.typePairing)
  /*
   * A brand line taller than a fifth of the face is wrong on any face, however wide the room is.
   *
   * The cap used to be applied before the two scale factors, so it was not a cap at all: an
   * oversized display system multiplies by 1.4 and a 50 mm label came back with a 14 mm wordmark,
   * which pushed the product line down into the spec band and printed it through the net quantity.
   * The face's own height is the last word, after every multiplier.
   */
  const ceiling = Math.min(max * ctx.titleScale * brandScale(d.typePairing), ctx.h * 0.2)
  const size = fitSize(text, maxW, Math.max(2.4 * ctx.titleScale, ceiling), 2.4 * ctx.titleScale, faces.brand, tracking)
  const width = textWidth(text, size, faces.brand, size * tracking)
  const baseline = top + size * 0.82
  ledger.text('brand', cx, baseline, width, size, anchor)
  return {
    markup: `<g data-art="lockup" data-edit="brand">${textEl({ x: cx, y: baseline, text, size, face: faces.brand, fill: color, anchor, tracking: size * tracking })}</g>`,
    size,
    width,
    baseline,
    bottom: baseline + size * 0.3,
  }
}

/**
 * A tracked line, drawn only if it really fits the room it was given.
 *
 * `fitSize` stops shrinking at the print floor and returns it, so a long line in a narrow room
 * comes back *wider* than the room and runs into whatever sits beside it — measured on the arch
 * crown, where a long claim in the spec band printed through the net quantity. Measuring at the
 * floor first is the same guard `stackedLockup` learned for a three-word brand.
 */
function spacedIfFits(
  ctx: LayoutCtx,
  x: number,
  baseline: number,
  text: string,
  size: number,
  color: string,
  maxW: number,
  anchor: 'start' | 'middle' | 'end' = 'middle',
): string {
  if (!text || maxW <= 0) return ''
  /*
   * Judged at the press floor, not at `spacedLine`'s own 1.3 mm stop. A line that only fits below
   * 1.5 mm is a line the printer cannot hold, and the export gate refuses the whole design for it
   * — measured on the serum carton's monospace grid at 1.40 mm, which blocked twelve faces.
   */
  const floor = typeSize(STUDIO_FLOOR_TEXT_MM)
  if (textWidth(text.toLocaleUpperCase('tr'), floor, 'sans', floor * 0.34) > maxW) return ''
  return spacedLine(ctx.ledger, x, baseline, text, Math.max(STUDIO_FLOOR_TEXT_MM, size), color, maxW, anchor)
}

/** Layered small-caps tiers — the stack of short lines the heritage plates put above a display line. */
function tierLines(ctx: LayoutCtx, cx: number, top: number, maxW: number, size: number, color: string, lines: string[]): { markup: string; bottom: number } {
  let y = top
  let out = ''
  for (const line of lines) {
    if (!line) continue
    const base = y + size
    const drawn = spacedIfFits(ctx, cx, base, line, size, color, maxW)
    if (!drawn) continue
    out += drawn
    y = base + size * 0.8
  }
  return { markup: out, bottom: y }
}

/** A row of small stars — the heraldic plates' quality mark. Booked as one element. */
function starRow(ctx: LayoutCtx, cx: number, cy: number, count: number, r: number, color: string): string {
  const gap = r * 3
  const span = gap * (count - 1)
  let out = ''
  for (let i = 0; i < count; i++) {
    const x = cx - span / 2 + i * gap
    const pts: string[] = []
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2 - Math.PI / 2
      const rr = k % 2 === 0 ? r : r * 0.44
      pts.push(`${f(x + Math.cos(a) * rr)} ${f(cy + Math.sin(a) * rr)}`)
    }
    out += `<path d="M${pts.join(' L')}Z" />`
  }
  ctx.ledger.add('element', 'stars', cx - span / 2 - r, cy - r, span + r * 2, r * 2)
  return `<g data-art="stars" fill="${color}">${out}</g>`
}

/**
 * A ribbon band with notched ends carrying one short claim (R29, R30).
 *
 * Drawn rather than taken from the motif library because it has to stretch to the claim it holds:
 * a ribbon sized to its text is a band, a ribbon sized to the panel is a stripe.
 */
function ribbonBand(ctx: LayoutCtx, cx: number, cy: number, text: string, size: number, fill: string, ink: string, maxW: number): { markup: string; h: number } {
  const label = text.toLocaleUpperCase('tr')
  const s = fitSize(label, maxW * 0.7, size, STUDIO_FLOOR_TEXT_MM, 'sans', size * 0.3)
  const tw = textWidth(label, s, 'sans', s * 0.3)
  const h = s * 2.1
  const w = Math.min(maxW, tw + s * 3)
  const notch = h * 0.42
  const x0 = cx - w / 2
  const x1 = cx + w / 2
  const y0 = cy - h / 2
  const y1 = cy + h / 2
  const body = `M${f(x0)} ${f(y0)} H${f(x1)} L${f(x1 - notch)} ${f(cy)} L${f(x1)} ${f(y1)} H${f(x0)} L${f(x0 + notch)} ${f(cy)}Z`
  ctx.ledger.add('container', 'ribbon', x0, y0, w, h)
  ctx.ledger.text('ribbon-text', cx, cy + s * 0.35, tw, s, 'middle')
  return {
    markup:
      `<g data-art="ribbon"><path d="${body}" fill="${fill}" />` +
      textEl({ x: cx, y: cy + s * 0.35, text: label, size: s, face: 'sans', fill: ink, anchor: 'middle', tracking: s * 0.3 }) +
      `</g>`,
    h,
  }
}

/**
 * Three engraved plates laid over each other — what makes a collage a collage.
 *
 * Measured before this existed: the window held **one** drawing, spanning a third to a half of the
 * plate, with the rest of the arch empty. The references it was distilled from are not that. R16
 * layers an animal, a plant and a figure inside one tone-on-tone arch; R05 fills every panel with
 * overlapping engravings and cuts a band through them. A single sprig in a tall arch reads as a
 * specimen label, which the studio already has, and not as a plate.
 *
 * So: a lead plate at full ink in the middle, and two satellites at smaller scale offset to either
 * side — each a step further back in tone, drawn behind the lead. The lead is the product's own
 * plant and both satellites are companion plants (`companionSpecies`), picked a step apart so they
 * are not the same drawing twice. The arrangements differ too, so even where a companion resembles
 * the lead the three still read as three.
 *
 * An engraved animal used to take the third plate — the layer the references actually collage
 * with. It was removed on the owner's call: a parametric vector creature did not reach the quality
 * of the rest of the plate, and it was drawing at ~21 mm on 94% of collage faces, so the weakest
 * drawing in the system had the widest reach. Three plants is the honest version of this plate.
 *
 * The satellites are dropped one at a time when the window is too small to hold them, so a jar
 * label degrades to a lead and a satellite, then to a lead alone, rather than to a smudge.
 */
function paintCollage(
  ctx: LayoutCtx,
  room: { left: number; right: number; top: number; bottom: number },
  tone: string,
  uid: string,
): { markup: string; boxes: { x: number; y: number; w: number; h: number }[] } {
  const { d } = ctx
  const roomW = Math.max(0, room.right - room.left)
  const roomH = Math.max(0, room.bottom - room.top)
  const style = d.subjectStyle ?? 'engraved'
  // Three arrangements and three plants, chosen off the line seed so a range shares its plate.
  const lead = heroLayout(ctx.species, d.lineSeed)
  const others = (['spray', 'arch', 'sprig', 'wreath', 'crossed'] as const).filter((l) => l !== lead)
  const step = Math.abs(Math.trunc(d.lineSeed))
  const back = others[step % others.length]!
  const companions = companionSpecies(ctx.species)
  const backSpecies = companions[step % companions.length] ?? ctx.species
  // A step apart, so the two satellites are two plants rather than the same one drawn twice.
  const sideSpecies = companions[(step + 1) % companions.length] ?? backSpecies
  const sideLayout = others[(step + 2) % others.length]!
  /** The same ink pushed `k` of the way back into the plate's own tone. */
  const recede = (k: number) => heroInk({ ...d.palette, ground: tone, accent: mix(d.palette.accent, tone, k), accent2: mix(d.palette.accent2, tone, k) })

  const plates: { markup: string; box: { x: number; y: number; w: number; h: number } }[] = []
  /** Each plate says what it is, so a test and a reader can both see the collage is a collage. */
  const keep = (label: string, fit: ReturnType<typeof fitSubject>) => {
    if (fit) plates.push({ markup: `<g data-plate="${label}">${fit.markup}</g>`, box: fit.box })
  }
  const add = (
    species: Species,
    layout: typeof lead,
    ink: ReturnType<typeof heroInk>,
    seedStep: number,
    box: { left: number; right: number; top: number; bottom: number },
    minWidth: number,
  ) => {
    keep(
      species,
      fitSubject({ species, ink, seed: d.seed + seedStep, lineSeed: d.lineSeed, layout, style, uid: `${uid}-${seedStep}`, room: box, minWidth }),
    )
  }
  // The satellites first: they sit behind, so they are drawn first and recede in tone.
  const satMin = Math.min(roomW, roomH) * 0.2
  if (roomW > 18 && roomH > 26) {
    add(backSpecies, back, recede(0.52), 31, { left: room.left - roomW * 0.06, right: room.left + roomW * 0.5, top: room.top + roomH * 0.04, bottom: room.top + roomH * 0.52 }, satMin)
    add(sideSpecies, sideLayout, recede(0.3), 67, { left: room.right - roomW * 0.56, right: room.right + roomW * 0.04, top: room.top + roomH * 0.44, bottom: room.bottom }, satMin)
  }
  // The lead last and largest, at full ink, so nothing crosses in front of it.
  add(ctx.species, lead, heroInk({ ...d.palette, ground: tone }), 0, { left: room.left + roomW * 0.1, right: room.right - roomW * 0.1, top: room.top + roomH * 0.14, bottom: room.bottom - roomH * 0.06 }, Math.min(roomW, roomH) * 0.3)

  return { markup: `<g data-art="collage">${plates.map((p) => p.markup).join('')}</g>`, boxes: plates.map((p) => p.box) }
}

/**
 * The wax seal the engraved plates stamp their foot with (R16, R20).
 *
 * Two rings, the house mark inside, and a ring of ticks — small, and sitting on the plate's lower
 * edge so it reads as stamped onto the artwork rather than laid out beside it.
 */
function paintSeal(ctx: LayoutCtx, cx: number, cy: number, r: number, color: string, plate: string): string {
  const { ledger, copy, d } = ctx
  let ticks = ''
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2
    const r0 = r * 0.86
    const r1 = r * 0.94
    ticks += `<path d="M${f(cx + Math.cos(a) * r0)} ${f(cy + Math.sin(a) * r0)} L${f(cx + Math.cos(a) * r1)} ${f(cy + Math.sin(a) * r1)}" />`
  }
  ledger.add('element', 'seal', cx - r, cy - r, r * 2, r * 2)
  return (
    `<g data-art="seal">` +
    `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${plate}" fill-opacity="0.92" stroke="${color}" stroke-width="${f(Math.max(0.18, r * 0.07))}" />` +
    `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.78)}" fill="none" stroke="${color}" stroke-width="0.16" />` +
    `<g fill="none" stroke="${color}" stroke-width="0.14" stroke-opacity="0.75">${ticks}</g>` +
    paintMark(markKindFor(d), cx, cy, r * 0.44, color, copy.brand) +
    `</g>`
  )
}

/** The cut silhouette a heraldic label is trimmed to — arch, shield or cartouche, by variant. */
function cutSilhouette(shape: 'arch' | 'shield' | 'cartouche', x: number, y: number, w: number, h: number): string {
  const r = w / 2
  switch (shape) {
    case 'shield':
      return `M${f(x)} ${f(y)} H${f(x + w)} V${f(y + h * 0.62)} C${f(x + w)} ${f(y + h * 0.86)} ${f(x + w * 0.62)} ${f(y + h)} ${f(x + w / 2)} ${f(y + h)} C${f(x + w * 0.38)} ${f(y + h)} ${f(x)} ${f(y + h * 0.86)} ${f(x)} ${f(y + h * 0.62)}Z`
    case 'cartouche':
      return (
        `M${f(x + w * 0.5)} ${f(y)} C${f(x + w * 0.92)} ${f(y)} ${f(x + w)} ${f(y + h * 0.18)} ${f(x + w)} ${f(y + h * 0.5)} ` +
        `C${f(x + w)} ${f(y + h * 0.82)} ${f(x + w * 0.92)} ${f(y + h)} ${f(x + w * 0.5)} ${f(y + h)} ` +
        `C${f(x + w * 0.08)} ${f(y + h)} ${f(x)} ${f(y + h * 0.82)} ${f(x)} ${f(y + h * 0.5)} ` +
        `C${f(x)} ${f(y + h * 0.18)} ${f(x + w * 0.08)} ${f(y)} ${f(x + w * 0.5)} ${f(y)}Z`
      )
    case 'arch':
    default:
      return `M${f(x)} ${f(y + h)} V${f(y + Math.min(r, h * 0.45))} A${f(r)} ${f(Math.min(r, h * 0.45))} 0 0 1 ${f(x + w)} ${f(y + Math.min(r, h * 0.45))} V${f(y + h)}Z`
  }
}

/* --------------------------------------------------------------- arch-crown */

/**
 * `arch-crown` — R17 Roselle, R20 Don José.
 *
 * An arched field fills the face down to a dark band at the foot. Inside the arch, from the top:
 * a wreath medallion at the crown, two or three tracked small-caps tiers, the oversized display
 * brand, the drawn subject under it. The band at the foot is where the spec goes — net quantity,
 * lot, producer — which is what both references do and what no studio archetype has: a face whose
 * regulatory line is part of the composition instead of a caption squeezed above the edge.
 */
export function paintArchCrownFace(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const tiny = isTiny(w, h)
  const ink = d.palette.ink
  const accent = d.palette.accent
  const bandH = Math.max(7, Math.min(h * 0.2, tiny ? h * 0.16 : h * 0.15))
  const bandY = h - bandH
  const band = d.palette.deep
  const bandInk = readableInk(band, d.palette.card)
  const archTop = m * 0.6
  const archW = w - m * 1.2
  const arch = archWindow(`${ctx.uid}-crown`, m * 0.6, archTop, archW, bandY - archTop - m * 0.3)

  const parts: string[] = [
    `<g data-composition="arch-crown">`,
    ground(w, h, d.palette.ground),
    `<defs>${arch.defs}</defs>`,
    `<g clip-path="url(#${arch.clipId})">${paintBackground(d.background, w, h, d.palette, d.seed, {
      species: ctx.species,
      uid: ctx.uid,
      ornament: d.ornament,
      intensity: 0.55,
    })}</g>`,
    arch.outline(mix(accent, d.palette.ground, 0.35)),
  ]
  if (ctx.wrapSeam) parts.push(seamMark(w, h, ink))

  const inner = archW - m * 1.6
  const cx = w / 2
  let y = archTop + m * (tiny ? 0.8 : 1.2)

  // The crown: a wreath medallion, or the customer's logo where one is large enough to read.
  const crownR = Math.min(w * 0.11, bandY * 0.1, 7)
  if (!tiny && crownR > 2.4) {
    const wreath = crownR * 2.4
    parts.push(paintMotif('olive-wreath', cx - wreath / 2, y, wreath, wreath, mix(accent, ink, 0.2), { opacity: 0.9 }))
    const markR = crownR * 0.62
    parts.push(paintMark(markKindFor(d), cx, y + wreath / 2, markR, accent, copy.brand, identOf(ctx)))
    ledger.add('element', ctx.logoHref && markR >= STUDIO_MIN_LOGO_R ? 'crown-logo' : 'crown-mark', cx - wreath / 2, y, wreath, wreath)
    y += wreath + m * 0.3
  }

  // Layered tiers above the display line — the reference stacks two or three short tracked lines.
  const tierSize = Math.max(STUDIO_FLOOR_TEXT_MM, Math.min(2, w * 0.024))
  const tiers = tierLines(ctx, cx, y, inner * 0.72, tierSize, mix(ink, d.palette.ground, 0.25), tiny ? [cityLine(ctx.brief)] : [cityLine(ctx.brief), d.categoryLine])
  parts.push(tiers.markup)
  y = tiers.bottom + m * 0.5

  // The display brand: this face's reason to exist, so it takes the room the arch gives it.
  const brand = brandLine(ctx, cx, y, inner, tiny ? 7 : Math.min(inner * 0.2, 14), ink)
  parts.push(brand.markup)
  y = brand.bottom + brand.size * 0.12
  parts.push(hairline(cx - inner * 0.22, y, cx + inner * 0.22, accent, 0.7, 0.24))
  y += m * 0.5

  // The product, under the rule, capped against the brand.
  /*
   * The product is bounded by the room left above the band, not only by the brand. On a short
   * label format the stack ran past the band's top edge and printed through the net quantity —
   * measured as `product × net-quantity` in the ledger.
   */
  const stackRoom = bandY - m * 0.5 - y
  const stack = productStack(ledger, d, cx, y, inner, copy.product, withIdent(ctx, {
    color: ink,
    accent,
    category: '',
    max: Math.min(secondaryMax(brand.size), w * 0.09, Math.max(2.4, stackRoom / 2.6)),
    prefix: tiny || stackRoom < w * 0.14 ? undefined : d.productPrefix,
    // Capping the product's size was not enough: the prefix sits above it and the pair still ran
    // through the spec band on a 120 × 50 face. The stack now owns the budget and sheds to fit.
    room: Math.max(0, stackRoom - Math.min(w, h) * 0.12),
  }))
  parts.push(stack.markup)

  // The subject fills what is left between the product and the band.
  const fit = fitSubject({
    species: ctx.species,
    ink: heroInk(d.palette),
    seed: d.seed,
    lineSeed: d.lineSeed,
    style: d.subjectStyle,
    uid: `${ctx.uid}-hero`,
    room: { left: cx - inner * 0.46, right: cx + inner * 0.46, top: stack.bottom + m * 0.4, bottom: bandY - m * 0.5 },
    minWidth: Math.min(w, h) * 0.2,
  })
  if (fit) {
    ledger.add('element', 'specimen', fit.box.x, fit.box.y, fit.box.w, fit.box.h)
    parts.push(fit.markup)
  }

  // The spec band: net quantity at the centre, the claim and the city to either side.
  parts.push(`<rect x="0" y="${f(bandY)}" width="${f(w)}" height="${f(bandH)}" fill="${band}" data-art="spec-band" />`)
  const specSize = Math.max(STUDIO_FLOOR_TEXT_MM, Math.min(2.2, w * 0.026))
  const specY = bandY + bandH / 2 + specSize * 0.35
  if (d.volumeLine) parts.push(netQuantity(ledger, cx, specY, d.volumeLine, specSize, bandInk))
  if (!tiny) {
    const side = Math.max(1.2, specSize * 0.78)
    const claim = d.chips[0] ?? d.taglineLine
    const room = w / 2 - textWidth(d.volumeLine, specSize, 'sans', specSize * 0.06) / 2 - m * 1.6
    if (room > w * 0.14) {
      parts.push(spacedIfFits(ctx, m, specY, claim, side, mix(bandInk, band, 0.25), room, 'start'))
      parts.push(spacedIfFits(ctx, w - m, specY, cityLine(ctx.brief), side, mix(bandInk, band, 0.25), room, 'end'))
    }
  }
  parts.push('</g>')
  return parts.join('')
}

/* ------------------------------------------------------------ collage-plate */

/**
 * `collage-plate` — R16 SYLOVE, R05 Dr. Sebaa.
 *
 * The wordmark is fixed at the top and never moves; the subject lives inside a tone-on-tone arch
 * window in the middle; one word runs up the side, turned; a small seal sits at the foot. It is
 * the skeleton a range is built on — six SKUs of one perfume, the same plate, a different ground
 * colour and a different subject each time — and the studio had no face where the window, rather
 * than the field, is what holds the art.
 *
 * A landscape face turns it on its side rather than dropping it. The references are all portrait,
 * and an arch tall enough to hold a collage does not fit under a wordmark on an 80 × 60 label —
 * measured, the window was skipped on 22% of the sweep and those faces fell back to type on an
 * empty ground. So on a wide face the plate takes the left column and the type the right, which
 * is the same grammar read across instead of down.
 */
export function paintCollagePlateFace(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const tiny = isTiny(w, h)
  const wide = isLandscape(w, h)
  const ink = d.palette.ink
  const accent = d.palette.accent
  const faces = pairingFaces(d.typePairing)
  const parts: string[] = [
    `<g data-composition="collage-plate">`,
    paintBackground(d.background, w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, ornament: d.ornament, intensity: 0.5 }),
    paintFrame(d, w, h, { inset: m * 0.55, color: accent, opacity: 0.6 }),
  ]
  if (ctx.wrapSeam) parts.push(seamMark(w, h, ink))

  // The strip the rotated word runs up — kept clear of the window.
  const stripW = tiny ? 0 : Math.max(6, Math.min(w * 0.12, 14))
  // Wide: the plate holds the left column and the type the right. Tall: everything stacks.
  const plateW = wide ? (w - stripW) * 0.46 : 0
  const cx = plateW + (w - stripW - plateW) / 2
  const inner = w - stripW - plateW - m * 2.4

  // The fixed wordmark.
  const brand = brandLine(ctx, cx, m * 1.4, inner, wide ? 7.5 : Math.min(inner * 0.14, 10), ink)
  parts.push(brand.markup)
  let y = brand.bottom + brand.size * 0.18
  const subSize = Math.max(STUDIO_FLOOR_TEXT_MM, Math.min(1.9, w * 0.022))
  if (!tiny) {
    parts.push(spacedLine(ledger, cx, y + subSize, cityLine(ctx.brief), subSize, mix(accent, ink, 0.25), inner * 0.6))
    y += subSize * 2.4
  }

  /*
   * The window: an arch of the ground's own colour a step deeper, holding the engraved subject.
   *
   * Its height is what is left once the foot is reserved, and the reserve is measured rather than
   * guessed at a few margins — on a 38 mm serum carton a margin-sized reserve left three
   * millimetres for a two-line product name and the net quantity, and they printed through each
   * other.
   */
  const volSize = Math.max(STUDIO_FLOOR_TEXT_MM, Math.min(2.2, w * 0.026))
  const prodMax = Math.min(secondaryMax(brand.size), w * 0.085)
  const footRoom = m * 1.1 + volSize * 1.9 + prodMax * (tiny ? 1.7 : 3)
  // Wide: the plate runs the full height of its own column and the type keeps its own.
  const winW = wide ? plateW - m * 1.4 : Math.min(inner * 0.86, Math.max(0, h - y - footRoom) * 0.82)
  const winH = wide ? h - m * 1.8 : h - y - footRoom
  const winX = wide ? m * 0.7 + (plateW - m * 1.4) / 2 : cx
  const winY = wide ? m * 0.9 : y
  if (winW > w * 0.16 && winH > h * 0.18) {
    const win = archWindow(`${ctx.uid}-win`, winX - winW / 2, winY, winW, winH)
    // A step deeper than the ground, and far enough to read as a plate rather than a shadow.
    const tone = isDark(d.palette.ground) ? lighten(d.palette.ground, 0.075) : mix(d.palette.ground, d.palette.deep, 0.2)
    parts.push(`<defs>${win.defs}</defs>`)
    parts.push(`<g clip-path="url(#${win.clipId})"><rect x="${f(winX - winW / 2)}" y="${f(winY)}" width="${f(winW)}" height="${f(winH)}" fill="${tone}" data-art="window" /></g>`)
    ledger.add('container', 'window', winX - winW / 2, winY, winW, winH)
    parts.push(win.outline(mix(accent, tone, 0.4)))

    // The seal sits on the plate's foot; the collage keeps clear of it.
    const sealR = Math.min(winW * 0.13, winH * 0.1, 6)
    const sealed = !tiny && sealR > 2.2
    const collage = paintCollage(
      ctx,
      { left: winX - winW * 0.44, right: winX + winW * 0.44, top: winY + winH * 0.1, bottom: winY + winH - (sealed ? sealR * 1.9 : winH * 0.06) },
      tone,
      `${ctx.uid}-hero`,
    )
    for (const box of collage.boxes) ledger.add('element', 'specimen', box.x, box.y, box.w, box.h)
    parts.push(`<g clip-path="url(#${win.clipId})">${collage.markup}</g>`)
    if (sealed) parts.push(paintSeal(ctx, winX, winY + winH - sealR * 1.05, sealR, mix(accent, ink, 0.2), tone))
    if (!wide) y += winH + m * 0.5
  }

  // The product in the system's italic, bounded by the room the foot actually left it.
  const footY = h - m * 0.95
  const stackRoom = footY - volSize * 1.8 - y
  const stack = productStack(ledger, d, cx, y, inner, copy.product, withIdent(ctx, {
    color: ink,
    accent,
    category: tiny || stackRoom < w * 0.12 ? '' : categoryCaption(ctx),
    max: Math.min(prodMax, Math.max(STUDIO_FLOOR_TEXT_MM, stackRoom / 2.7)),
    prefix: tiny || stackRoom < w * 0.14 ? undefined : d.productPrefix,
    upper: false,
  }))
  parts.push(stack.markup)
  if (d.volumeLine) parts.push(netQuantity(ledger, cx, footY, d.volumeLine, volSize, ink))

  // The rotated word up the strip — the range's word, not the brand, so a range reads as one.
  if (stripW > 0) {
    const word = (d.categoryLine || copy.product).toLocaleUpperCase('tr')
    parts.push(verticalBrand(ledger, w - stripW / 2, h / 2, word, Math.min(stripW * 0.5, 4), mix(ink, d.palette.ground, 0.25), h * 0.66, faces.meta, 'accent'))
    parts.push(`<line x1="${f(w - stripW)}" y1="${f(m)}" x2="${f(w - stripW)}" y2="${f(h - m)}" stroke="${accent}" stroke-opacity="0.35" stroke-width="0.18" />`)
  }
  parts.push('</g>')
  return parts.join('')
}

/* --------------------------------------------------------- silhouette-foot */

/**
 * `silhouette-foot` — R31 O'live, R23 MOU:.
 *
 * A small brand block in the top-left, a grid of meta under it, and then one flat silhouette so
 * large it owns the lower half of the face and runs off both edges. The whole design is the
 * silhouette's shape and one accent colour; the type is deliberately quiet and small. No studio
 * archetype lets the subject be this big, because in all ten the type is the composition.
 */
export function paintSilhouetteFootFace(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const tiny = isTiny(w, h)
  const ink = d.palette.ink
  const accent = d.palette.accent
  const parts: string[] = [
    `<g data-composition="silhouette-foot">`,
    ground(w, h, d.palette.ground),
    paintBackground(d.background, w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, ornament: d.ornament, intensity: 0.3 }),
  ]
  if (ctx.wrapSeam) parts.push(seamMark(w, h, ink))

  const x = m * 1.1
  const blockW = w * (isLandscape(w, h) ? 0.46 : 0.66)
  const brand = brandLine(ctx, x, m * 1.1, blockW, tiny ? 5.5 : Math.min(blockW * 0.18, 10), ink, 'start')
  parts.push(brand.markup)
  let y = brand.bottom + brand.size * 0.23

  const stack = productStack(ledger, d, x, y, blockW, copy.product, withIdent(ctx, {
    color: ink,
    accent,
    category: tiny ? '' : categoryCaption(ctx),
    max: Math.min(secondaryMax(brand.size), w * 0.075),
    anchor: 'start',
  }))
  parts.push(stack.markup)
  y = stack.bottom + m * 0.5

  // The meta grid: two short tracked lines, small, under the block. The reference keeps them tiny.
  const gridSize = Math.max(STUDIO_FLOOR_TEXT_MM, Math.min(1.8, w * 0.02))
  if (!tiny && d.taglineLine) {
    parts.push(spacedIfFits(ctx, x, y + gridSize, d.taglineLine, gridSize, mix(ink, d.palette.ground, 0.3), blockW, 'start'))
    y += gridSize * 2
  }

  // The silhouette: as wide as the face allows, sitting on the foot, in one flat ink.
  const footY = h - m * (tiny ? 0.8 : 1.1)
  const volSize = Math.max(1.5, Math.min(2.2, w * 0.026))
  const flat = mix(accent, d.palette.ground, isDark(d.palette.ground) ? 0.15 : 0.05)
  const fit = fitSubject({
    species: ctx.species,
    ink: { leafLight: flat, leaf: flat, leafMid: flat, leafDeep: flat, fruit: flat, fruitDeep: flat, stem: flat },
    seed: d.seed,
    lineSeed: d.lineSeed,
    // The silhouette is what this face *is*; a brief that asked for engraving gets it anyway.
    style: d.subjectStyle === 'engraved' ? 'engraved' : 'silhouette',
    uid: `${ctx.uid}-hero`,
    room: { left: -w * 0.06, right: w * 1.06, top: Math.max(y + m * 0.4, h * 0.36), bottom: footY - volSize * 2.4 },
    minWidth: Math.min(w, h) * 0.26,
    valign: 'bottom',
  })
  if (fit) {
    ledger.add('element', 'specimen', Math.max(0, fit.box.x), fit.box.y, Math.min(w, fit.box.x + fit.box.w) - Math.max(0, fit.box.x), fit.box.h)
    parts.push(fit.markup)
  }
  if (d.volumeLine) parts.push(netQuantity(ledger, x, footY, d.volumeLine, volSize, ink, 'start'))
  const chipText = d.chips[0] ?? ''
  if (chipText && !tiny) {
    const size = typeSize(Math.min(1.7, w * 0.02))
    if (w - m - chipWidth(chipText, size) > x + blockW * 0.4) {
      parts.push(chip(ledger, d, w - m - chipWidth(chipText, size), footY - size * 1.9, chipText, { color: ink, size }).markup)
    }
  }
  parts.push('</g>')
  return parts.join('')
}

/* ------------------------------------------------------------- ribbon-crest */

/**
 * `ribbon-crest` — R29, R30.
 *
 * The heraldic olive-oil plate: the label is trimmed to a shape (an arch, a shield, a cartouche —
 * the variant decides), a double frame runs inside the trim, a medallion sits at the crown with a
 * row of stars under it, the brand stacks in the middle, and a ribbon band crosses the lower third
 * carrying the claim. `crest-panel` has a roundel on a flat field; this has the whole apparatus,
 * which is a different design and the one the premium food shelf is full of.
 */
export function paintRibbonCrestFace(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const tiny = isTiny(w, h)
  const ink = d.palette.ink
  const accent = d.palette.accent
  const shape = d.variant === 1 ? 'shield' : d.variant === 2 ? 'cartouche' : 'arch'
  const plateX = m * 0.7
  const plateY = m * 0.7
  const plateW = w - plateX * 2
  const plateH = h - plateY * 2
  const parts: string[] = [
    `<g data-composition="ribbon-crest">`,
    ground(w, h, d.palette.ground),
    paintBackground(d.background, w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, ornament: d.ornament, intensity: 0.5 }),
  ]
  // The trim, drawn twice: the cut the label would be died to, and a hairline inside it.
  const outline = cutSilhouette(shape, plateX, plateY, plateW, plateH)
  const gap = Math.max(0.8, m * 0.34)
  const innerOutline = cutSilhouette(shape, plateX + gap, plateY + gap, plateW - gap * 2, plateH - gap * 2)
  parts.push(`<g data-art="frame" data-frame="cut-${shape}" fill="none" stroke="${accent}" stroke-opacity="0.9"><path d="${outline}" stroke-width="${f(Math.max(0.3, m * 0.12))}" /><path d="${innerOutline}" stroke-width="0.16" /></g>`)
  if (ctx.wrapSeam) parts.push(seamMark(w, h, ink))

  const cx = w / 2
  const inner = plateW - m * 2.6
  let y = plateY + plateH * (shape === 'arch' ? 0.12 : 0.08) + m * 0.4

  // The crown medallion.
  const medR = Math.min(w * 0.1, h * 0.08, 6.5)
  if (!tiny && medR > 2.2) {
    const spot = medR * 2.2
    parts.push(paintMotif('crest-spot', cx - spot / 2 / motifAspect('crest-spot') / 1.2, y, spot / motifAspect('crest-spot') / 1.2, spot, accent, { opacity: 0.92 }))
    ledger.add('element', 'medallion', cx - spot * 0.45, y, spot * 0.9, spot)
    y += spot + m * 0.25
    parts.push(starRow(ctx, cx, y, 3, Math.max(0.6, medR * 0.16), mix(accent, ink, 0.15)))
    y += medR * 0.5
  }

  const brand = brandLine(ctx, cx, y, inner * 0.9, tiny ? 6 : Math.min(inner * 0.18, 12), ink)
  parts.push(brand.markup)
  y = brand.bottom + brand.size * 0.18
  const catSize = Math.max(STUDIO_FLOOR_TEXT_MM, Math.min(1.9, w * 0.022))
  if (!tiny) {
    parts.push(spacedLine(ledger, cx, y + catSize, d.categoryLine, catSize, mix(accent, ink, 0.2), inner * 0.7))
    y += catSize * 2.2
  }

  // The foot is measured before the product is set, not after: the stack has to know what room it
  // is being given. Without that the prefix and the product ran through the net quantity on a
  // 120 × 50 label — measured as `product × net-quantity`.
  const footY = plateY + plateH - m * (shape === 'arch' ? 1.1 : 1.8)
  const volSize = Math.max(STUDIO_FLOOR_TEXT_MM, Math.min(2.1, w * 0.025))
  const stack = productStack(ledger, d, cx, y, inner * 0.86, copy.product, withIdent(ctx, {
    color: ink,
    accent,
    category: '',
    max: Math.min(secondaryMax(brand.size), w * 0.08),
    prefix: tiny ? undefined : d.productPrefix,
    room: Math.max(0, footY - volSize * 2.2 - y),
  }))
  parts.push(stack.markup)
  y = stack.bottom

  // The ribbon crossing the lower third.
  const claim = d.chips[0] || d.taglineLine
  const ribbonY = (y + footY) / 2
  if (!tiny && claim && footY - y > m * 4) {
    const ribbon = ribbonBand(ctx, cx, ribbonY, claim, Math.max(1.5, Math.min(2.2, w * 0.026)), accent, readableInk(accent, d.palette.ground), inner * 0.88)
    parts.push(ribbon.markup)
  }
  if (d.volumeLine) parts.push(netQuantity(ledger, cx, footY, d.volumeLine, volSize, ink))
  parts.push('</g>')
  return parts.join('')
}

/* ---------------------------------------------------------------- grid-mono */

/**
 * `grid-mono` — R26 FORÊT.
 *
 * Three columns that do not look like columns: an oversized condensed display turned up the left
 * edge, a flat cut-paper subject in the middle, and a monospace grid of short body lines on the
 * right, under an icon row. The technical-botanical shelf — sodas, supplements, cold brew — is
 * built on this and the studio had nothing like it: `rotated-brand` turns the brand but keeps a
 * centred field beside it, where this is a grid all the way across.
 */
export function paintGridMonoFace(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const tiny = isTiny(w, h)
  const ink = d.palette.ink
  const accent = d.palette.accent
  const faces = pairingFaces(d.typePairing)
  const parts: string[] = [
    `<g data-composition="grid-mono">`,
    ground(w, h, d.palette.ground),
    paintBackground(d.background, w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, ornament: d.ornament, intensity: 0.32 }),
    paintFrame(d, w, h, { inset: m * 0.55, color: accent, opacity: 0.5 }),
  ]
  if (ctx.wrapSeam) parts.push(seamMark(w, h, ink))

  // Column 1: the display, turned, reading up the left edge at the size the face can hold.
  const dispW = Math.max(8, Math.min(w * 0.26, 24))
  const text = brandCase(d.typePairing, copy.brand)
  const tracking = brandTracking(d.typePairing)
  /*
   * The lane is a hard limit, and the type system's scale is not allowed past it: an oversized
   * system multiplied a 15.6 mm ceiling to 20.3 mm in an 18.2 mm lane and the rotated display's
   * box left the panel. The scale raises the ceiling, the lane caps it.
   */
  const dispMax = Math.min(dispW * 0.86, 22 * ctx.titleScale * brandScale(d.typePairing))
  const dispSize = fitSize(text, h - m * 2, dispMax, 3, faces.brand, tracking)
  const dispLen = textWidth(text, dispSize, faces.brand, dispSize * tracking)
  // Placed so the turned line's own box sits inside the lane rather than straddling its left edge.
  const dcx = m * 0.6 + dispSize * 0.78
  const dcy = h / 2
  parts.push(
    `<g data-art="lockup" data-edit="brand">${textEl({ x: dcx, y: dcy, text, size: dispSize, face: faces.brand, fill: ink, anchor: 'middle', tracking: dispSize * tracking, transform: `rotate(-90 ${f(dcx)} ${f(dcy)})` })}</g>`,
  )
  ledger.add('text', 'brand', dcx - dispSize * 0.78, dcy - dispLen / 2, dispSize * 0.98, dispLen, dispSize)

  const colX = m * 0.9 + dispW
  const rest = w - colX - m
  // Column 3: the monospace grid. On a narrow face it goes under the subject instead of beside it.
  const stacked = rest < w * 0.42 || tiny
  const gridW = stacked ? rest : rest * 0.42
  const artW = stacked ? rest : rest * 0.52
  const artX = colX + artW / 2

  // Column 2: the product over the flat subject.
  let y = m * 1.2
  const stack = productStack(ledger, d, artX, y, artW * 0.92, copy.product, withIdent(ctx, {
    color: ink,
    accent,
    category: categoryCaption(ctx),
    max: Math.min(secondaryMax(dispSize), w * 0.085),
    anchor: 'middle',
  }))
  parts.push(stack.markup)
  y = stack.bottom + m * 0.5

  const footY = h - m
  const volSize = Math.max(STUDIO_FLOOR_TEXT_MM, Math.min(2.1, w * 0.024))
  const gridTop = stacked ? Math.max(y, h * 0.6) : y
  const artBottom = (stacked ? gridTop - m * 0.5 : footY - volSize * 2.4) - m * 0.2
  const flat = mix(accent, d.palette.ground, 0.08)
  const fit = fitSubject({
    species: ctx.species,
    ink: { leafLight: lighten(flat, 0.12), leaf: flat, leafMid: flat, leafDeep: mix(flat, ink, 0.25), fruit: d.palette.accent2, fruitDeep: mix(d.palette.accent2, ink, 0.2), stem: mix(flat, ink, 0.3) },
    seed: d.seed,
    lineSeed: d.lineSeed,
    style: d.subjectStyle ?? 'cut-paper',
    uid: `${ctx.uid}-hero`,
    room: { left: colX, right: colX + artW, top: y, bottom: artBottom },
    minWidth: Math.min(w, h) * 0.18,
  })
  if (fit) {
    ledger.add('element', 'specimen', fit.box.x, fit.box.y, fit.box.w, fit.box.h)
    parts.push(fit.markup)
  }

  // The grid itself: short manifesto lines in the mono face, left-aligned, on a hairline rule.
  const gridX = stacked ? colX : colX + artW + m * 0.5
  const gridY = stacked ? gridTop : y + m * 0.3
  const bodySize = Math.max(STUDIO_FLOOR_TEXT_MM, Math.min(1.9, gridW * 0.07))
  const words = d.manifesto.slice(0, stacked ? 2 : 4).filter(Boolean)
  if (words.length && gridW > w * 0.16 && footY - gridY > bodySize * 4) {
    parts.push(hairline(gridX, gridY, gridX + gridW * 0.9, accent, 0.6, 0.18))
    let gy = gridY + bodySize * 1.5
    for (const word of words) {
      if (gy > footY - volSize * 2.6) break
      const label = word.toLocaleUpperCase('tr')
      const s = fitSize(label, gridW * 0.9, bodySize, STUDIO_FLOOR_TEXT_MM, faces.meta, bodySize * 0.12)
      // `fitSize` returns the floor when nothing fits, so the width has to be checked after it.
      const lineW = textWidth(label, s, faces.meta, s * 0.12)
      if (lineW > gridW * 0.9) continue
      parts.push(textEl({ x: gridX, y: gy, text: label, size: s, face: faces.meta, fill: mix(ink, d.palette.ground, 0.2), tracking: s * 0.12 }))
      ledger.text('grid-line', gridX, gy, lineW, s)
      gy += s * 1.9
    }
  }

  // The icon row and the signature rule at the foot.
  if (!tiny && d.benefits.length) {
    const r = Math.max(STUDIO_FLOOR_TEXT_MM, Math.min(2.4, w * 0.026))
    const gapX = r * 3.4
    const items = d.benefits.slice(0, Math.max(1, Math.min(4, Math.floor((rest - m) / gapX))))
    const startX = colX + r
    // Ringless: the reference reads as a row of glyphs, not a row of badges.
    for (let i = 0; i < items.length; i++) parts.push(benefitIcon(items[i]!.icon, startX + i * gapX, footY - volSize * 2.4, r, mix(ink, d.palette.ground, 0.25), false))
    ledger.add('element', 'icon-row', startX - r, footY - volSize * 2.4 - r, gapX * items.length, r * 2)
  }
  if (d.volumeLine) parts.push(netQuantity(ledger, w - m, footY, d.volumeLine, volSize, ink, 'end'))
  parts.push('</g>')
  return parts.join('')
}

/* ------------------------------------------------------------ pattern-float */

/**
 * `pattern-float` — R06 Sola, R13 Little Candle.
 *
 * The pattern is the design. It runs edge to edge at full strength, and the type floats on a small
 * quiet plate in the middle with almost no hierarchy under it: a monogram, the wordmark, one
 * tracked line. Every studio archetype treats its field as a background for a lockup; here the
 * relationship is the other way round, which is why the plate is small and the pattern is loud.
 */
export function paintPatternFloatFace(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const tiny = isTiny(w, h)
  const ink = d.palette.ink
  const accent = d.palette.accent
  const parts: string[] = [
    `<g data-composition="pattern-float">`,
    paintBackground(d.background, w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, ornament: d.ornament, intensity: 1 }),
  ]
  if (ctx.wrapSeam) parts.push(seamMark(w, h, ink))

  // The plate: small, centred, in the card colour so the pattern reads behind and around it.
  const plateW = Math.min(w * (isLandscape(w, h) ? 0.56 : 0.74), w - m * 2.4)
  const plateH = Math.min(h * (tiny ? 0.62 : 0.46), h - m * 2.4)
  const px = (w - plateW) / 2
  const py = (h - plateH) / 2
  const plate = d.palette.card
  const plateInk = readableInk(plate, d.palette.cardInk)
  parts.push(`<rect x="${f(px)}" y="${f(py)}" width="${f(plateW)}" height="${f(plateH)}" rx="${f(Math.min(2.4, plateW * 0.03))}" fill="${plate}" data-art="plate" />`)
  ledger.add('container', 'plate', px, py, plateW, plateH)
  parts.push(`<rect x="${f(px + m * 0.4)}" y="${f(py + m * 0.4)}" width="${f(plateW - m * 0.8)}" height="${f(plateH - m * 0.8)}" rx="${f(Math.min(1.6, plateW * 0.02))}" fill="none" stroke="${mix(accent, plate, 0.35)}" stroke-width="0.16" />`)

  const cx = w / 2
  const inner = plateW - m * 1.8
  let y = py + m * 0.9

  // The monogram above the wordmark, small.
  const monoR = Math.min(plateW * 0.08, plateH * 0.12, 4.6)
  if (!tiny && monoR > 1.8) {
    parts.push(paintMark(markKindFor(d), cx, y + monoR, monoR, mix(accent, plateInk, 0.2), copy.brand, identOf(ctx)))
    ledger.add('element', ctx.logoHref && monoR >= STUDIO_MIN_LOGO_R ? 'brand-logo' : 'brand-mark', cx - monoR * 1.3, y, monoR * 2.6, monoR * 2)
    y += monoR * 2 + m * 0.35
  }

  const brand = brandLine(ctx, cx, y, inner, tiny ? 6 : Math.min(inner * 0.17, 11), plateInk)
  parts.push(brand.markup)
  y = brand.bottom + brand.size * 0.12

  // One tracked line, and nothing else — the reference has almost no hierarchy.
  const lineSize = Math.max(STUDIO_FLOOR_TEXT_MM, Math.min(1.9, w * 0.022))
  const line = categoryCaption(ctx) || d.categoryLine
  if (line && y + lineSize * 2 < py + plateH - m * 0.6) {
    parts.push(spacedLine(ledger, cx, y + lineSize, line, lineSize, mix(plateInk, plate, 0.28), inner * 0.8))
    y += lineSize * 2.1
  }
  const stack = productStack(ledger, d, cx, y, inner * 0.9, copy.product, withIdent(ctx, {
    color: plateInk,
    accent: mix(accent, plateInk, 0.2),
    category: '',
    max: Math.min(secondaryMax(brand.size), w * 0.07),
    upper: false,
  }))
  parts.push(stack.markup)

  const volSize = Math.max(STUDIO_FLOOR_TEXT_MM, Math.min(2.1, w * 0.025))
  if (d.volumeLine) parts.push(netQuantity(ledger, cx, h - m * 0.95, d.volumeLine, volSize, readableInk(d.palette.ground, ink)))
  parts.push('</g>')
  return parts.join('')
}

/* ---------------------------------------------------------------- blob-acid */

/**
 * `blob-acid` — R10 OILY, R15 Mellis Florae.
 *
 * Two loud colours, one blob crossing the whole face, a heavy grotesk block hard into the top-left
 * corner, and a second word turned up the right edge. It is the youngest language on the shelf and
 * the studio's closest face, `wave-panel`, is a calm one — bands across a field with a centred
 * lockup. This is deliberately off-balance: the mass is on one diagonal and the type on the other.
 */
export function paintBlobAcidFace(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const tiny = isTiny(w, h)
  const ink = d.palette.ink
  const accent = d.palette.accent
  const faces = pairingFaces(d.typePairing)
  const parts: string[] = [
    `<g data-composition="blob-acid">`,
    paintBackground(d.background, w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, ornament: d.ornament, intensity: 1 }),
  ]
  if (ctx.wrapSeam) parts.push(seamMark(w, h, ink))

  // The block, hard into the corner: brand over product, tight, in the display face.
  const x = m * 1.1
  const blockW = w * (isLandscape(w, h) ? 0.5 : 0.74) - m
  const brand = brandLine(ctx, x, m * 1.05, blockW, tiny ? 6.5 : Math.min(blockW * 0.22, 13), ink, 'start')
  parts.push(brand.markup)
  let y = brand.bottom + brand.size * 0.06
  const stack = productStack(ledger, d, x, y, blockW, copy.product, withIdent(ctx, {
    color: ink,
    accent,
    category: tiny ? '' : categoryCaption(ctx),
    max: Math.min(secondaryMax(brand.size), w * 0.095),
    anchor: 'start',
  }))
  parts.push(stack.markup)
  y = stack.bottom + m * 0.4

  // The turned word up the right edge — the reference's oversized rotated secondary.
  const stripW = tiny ? 0 : Math.max(6, Math.min(w * 0.13, 15))
  if (stripW > 0) {
    const word = (d.chips[0] || d.categoryLine || copy.product).toLocaleUpperCase('tr')
    parts.push(verticalBrand(ledger, w - stripW * 0.45, h * 0.56, word, Math.min(stripW * 0.62, 6), mix(ink, d.palette.ground, 0.15), h * 0.62, faces.brand, 'accent'))
  }

  const footY = h - m * (tiny ? 0.8 : 1)
  const volSize = Math.max(1.5, Math.min(2.2, w * 0.026))
  const metaW = w - m * 2 - stripW
  if (!tiny && d.taglineLine) {
    const tagSize = Math.max(STUDIO_FLOOR_TEXT_MM, Math.min(1.9, w * 0.022))
    parts.push(spacedIfFits(ctx, x, footY - volSize * 2.2, d.taglineLine, tagSize, mix(ink, d.palette.ground, 0.25), metaW, 'start'))
  }
  if (d.volumeLine) parts.push(netQuantity(ledger, x, footY, d.volumeLine, volSize, ink, 'start'))
  const chipText = d.chips[1] ?? d.chips[0] ?? ''
  if (chipText && !tiny) {
    const size = typeSize(Math.min(1.7, w * 0.02))
    const cxChip = w - stripW - m - chipWidth(chipText, size)
    /*
     * The chip shares the foot with the net quantity, so it has to clear the line that is actually
     * set rather than a guess at a third of the block. Measured on a 70 × 140 perfume carton: the
     * volume line ran 25 mm from the left and the chip started at 28 with a 3 mm overlap of boxes.
     */
    const volW = d.volumeLine ? textWidth(d.volumeLine, volSize, 'sans', volSize * 0.06) : 0
    if (cxChip > x + Math.max(blockW * 0.3, volW + m)) parts.push(chip(ledger, d, cxChip, footY - size * 1.9, chipText, { color: ink, size }).markup)
  }
  void y
  parts.push('</g>')
  return parts.join('')
}

/* --------------------------------------------------------------- inner-card */

/**
 * `inner-card` — R19 POES, R03 Matka.
 *
 * A quiet face with the display wordmark at the top, an art card inset into it holding the line
 * subject, and a vertical column of small icons down one side. The card is a *recess*, a rectangle
 * a shade off the ground with its own hairline, and the drawing lives only inside it — which is
 * the opposite of `card-on-art`, where a white card floats on top of a loud field.
 */
export function paintInnerCardFace(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const tiny = isTiny(w, h)
  const wide = isLandscape(w, h)
  const ink = d.palette.ink
  const accent = d.palette.accent
  const parts: string[] = [
    `<g data-composition="inner-card">`,
    ground(w, h, d.palette.ground),
    paintBackground(d.background, w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, ornament: d.ornament, intensity: 0.28 }),
    paintFrame(d, w, h, { inset: m * 0.55, color: accent, opacity: 0.45 }),
  ]
  if (ctx.wrapSeam) parts.push(seamMark(w, h, ink))

  // The icon column down the left, when the face is wide enough to give it a lane of its own.
  const colW = tiny || !d.benefits.length ? 0 : Math.max(7, Math.min(w * 0.13, 13))
  const cx = (w + colW) / 2
  const inner = w - colW - m * 2.4

  const brand = brandLine(ctx, cx, m * 1.3, inner, tiny ? 6.5 : Math.min(inner * 0.18, 12), ink)
  parts.push(brand.markup)
  let y = brand.bottom + brand.size * 0.18
  const subSize = Math.max(STUDIO_FLOOR_TEXT_MM, Math.min(1.8, w * 0.02))
  if (!tiny) {
    parts.push(spacedLine(ledger, cx, y + subSize, cityLine(ctx.brief), subSize, mix(accent, ink, 0.3), inner * 0.6))
    y += subSize * 2.3
  }

  // Measured, not guessed — see `collage-plate`: the card must leave the foot its room.
  const volSize = Math.max(STUDIO_FLOOR_TEXT_MM, Math.min(2.1, w * 0.025))
  const prodMax = Math.min(secondaryMax(brand.size), w * 0.075)
  const footRoom = m * 1.1 + volSize * 1.9 + prodMax * (tiny ? 1.7 : 3)
  const cardW = Math.min(inner * 0.92, wide ? w * 0.42 : inner)
  const cardH = h - y - footRoom
  if (cardW > w * 0.2 && cardH > h * 0.16) {
    const cardX = cx - cardW / 2
    const tone = isDark(d.palette.ground) ? lighten(d.palette.ground, 0.06) : mix(d.palette.ground, d.palette.deep, 0.1)
    parts.push(`<rect x="${f(cardX)}" y="${f(y)}" width="${f(cardW)}" height="${f(cardH)}" fill="${tone}" data-art="inner-card" />`)
    parts.push(`<rect x="${f(cardX + m * 0.3)}" y="${f(y + m * 0.3)}" width="${f(cardW - m * 0.6)}" height="${f(cardH - m * 0.6)}" fill="none" stroke="${mix(accent, tone, 0.45)}" stroke-width="0.16" />`)
    ledger.add('container', 'inner-card', cardX, y, cardW, cardH)
    const line = mix(ink, tone, 0.1)
    const fit = fitSubject({
      species: ctx.species,
      ink: { leafLight: line, leaf: line, leafMid: line, leafDeep: line, fruit: accent, fruitDeep: accent, stem: line },
      seed: d.seed,
      lineSeed: d.lineSeed,
      style: d.subjectStyle ?? 'engraved',
      uid: `${ctx.uid}-hero`,
      room: { left: cardX + m * 0.7, right: cardX + cardW - m * 0.7, top: y + m * 0.7, bottom: y + cardH - m * 0.7 },
      minWidth: Math.min(w, h) * 0.14,
    })
    if (fit) {
      ledger.add('element', 'specimen', fit.box.x, fit.box.y, fit.box.w, fit.box.h)
      parts.push(fit.markup)
    }
    y += cardH + m * 0.5
  }

  const footY = h - m * 0.95
  const stackRoom = footY - volSize * 1.8 - y
  const stack = productStack(ledger, d, cx, y, inner * 0.9, copy.product, withIdent(ctx, {
    color: ink,
    accent,
    category: tiny || stackRoom < w * 0.12 ? '' : categoryCaption(ctx),
    max: Math.min(prodMax, Math.max(STUDIO_FLOOR_TEXT_MM, stackRoom / 2.7)),
    upper: false,
  }))
  parts.push(stack.markup)

  if (colW > 0) {
    const col = benefitColumn(ledger, d, m * 0.8, m * 1.6, colW, d.benefits.slice(0, 4), mix(ink, d.palette.ground, 0.2), m * 0.9, h - m * 2.6)
    parts.push(col.markup)
  }
  if (d.volumeLine) parts.push(netQuantity(ledger, cx, footY, d.volumeLine, volSize, ink))
  parts.push('</g>')
  return parts.join('')
}


/* ------------------------------------------------- round and tag surfaces */

/** Which round skeleton an archetype reads as: its crown, its field, or its subject. */
function roundKind(id: StudioArchetype): 'crown' | 'field' | 'subject' {
  if (id === 'arch-crown' || id === 'ribbon-crest' || id === 'collage-plate') return 'crown'
  if (id === 'pattern-float' || id === 'blob-acid') return 'field'
  return 'subject'
}

/** Half-width of the cut at a panel-local y — a disc and an oval both answer this. */
function halfAt(rx: number, ry: number, cy: number, y: number): number {
  const t = Math.abs(y - cy) / Math.max(0.001, ry)
  return t >= 1 ? 0 : rx * Math.sqrt(1 - t * t)
}

/**
 * The reference repertoire on a disc or an oval.
 *
 * A round cut has no corners to hang a crown, a window or a grid off, so the eight skeletons
 * collapse into the three things they are actually about: a crown over a centred stack, a field
 * with the type floating on a plate, or one subject filling the lower half. The archetype still
 * decides which — and brings its own field, frame, type system and render mode with it, so a
 * round `blob-acid` and a round `arch-crown` are not the same label with different colours.
 */
export function paintReferenceRoundFace(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const rx = w / 2
  const ry = h / 2
  const cx = rx
  const cy = ry
  const rim = Math.max(2, Math.min(w, h) * 0.055)
  const kind = roundKind(d.archetype)
  const ink = d.palette.ink
  const accent = d.palette.accent
  const parts: string[] = [
    `<g data-composition="ref-round" data-round="${kind}">`,
    ground(w, h, d.palette.ground),
    paintBackground(d.background, w, h, d.palette, d.seed, {
      species: ctx.species,
      uid: ctx.uid,
      ornament: d.ornament,
      intensity: kind === 'field' ? 1 : 0.4,
    }),
  ]
  // The rim: a hairline ellipse set in from the cut, which is what a round label's edge needs.
  parts.push(
    `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx - rim * 0.55)}" ry="${f(ry - rim * 0.55)}" fill="none" stroke="${accent}" stroke-opacity="0.65" stroke-width="${f(Math.max(0.2, rim * 0.12))}" />`,
  )

  const inner = (y: number, k = 0.82) => halfAt(rx, ry, cy, y) * 2 * k
  let y = cy - ry * (kind === 'field' ? 0.3 : 0.52)

  if (kind === 'crown') {
    const medR = Math.min(rx * 0.16, 6)
    if (medR > 1.8) {
      const wreath = medR * 2.6
      parts.push(paintMotif('olive-wreath', cx - wreath / 2, y, wreath, wreath, mix(accent, ink, 0.15), { opacity: 0.9 }))
      parts.push(paintMark(markKindFor(d), cx, y + wreath / 2, medR * 0.6, accent, copy.brand, identOf(ctx)))
      ledger.add('element', 'crown-mark', cx - wreath / 2, y, wreath, wreath)
      y += wreath + rim * 0.3
    }
  } else if (kind === 'field') {
    // A plate the type can sit on, sized to the middle band of the cut.
    const plateW = inner(cy, 0.78)
    const plateH = ry * 0.72
    const plate = d.palette.card
    parts.push(`<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(plateW / 2)}" ry="${f(plateH / 2)}" fill="${plate}" data-art="plate" />`)
    ledger.add('container', 'plate', cx - plateW / 2, cy - plateH / 2, plateW, plateH)
    y = cy - plateH * 0.3
  }

  const plateInk = kind === 'field' ? readableInk(d.palette.card, d.palette.cardInk) : ink
  const brandW = inner(y + rim, kind === 'field' ? 0.58 : 0.76)
  const brand = brandLine(ctx, cx, y, brandW, Math.min(brandW * 0.2, 10), plateInk)
  parts.push(brand.markup)
  y = brand.bottom + brand.size * 0.18

  const catSize = Math.max(STUDIO_FLOOR_TEXT_MM, Math.min(1.9, w * 0.028))
  const cat = categoryCaption(ctx) || d.categoryLine
  if (cat && !isTiny(w, h)) {
    parts.push(spacedLine(ledger, cx, y + catSize, cat, catSize, mix(plateInk, d.palette.ground, 0.25), inner(y, 0.6)))
    y += catSize * 2.2
  }
  const stack = productStack(ledger, d, cx, y, inner(y + rim, kind === 'field' ? 0.54 : 0.7), copy.product, withIdent(ctx, {
    color: plateInk,
    accent: kind === 'field' ? mix(accent, plateInk, 0.25) : accent,
    category: '',
    max: Math.min(secondaryMax(brand.size), w * 0.075),
  }))
  parts.push(stack.markup)
  y = stack.bottom

  const volSize = Math.max(1.5, Math.min(2.2, w * 0.03))
  const footY = cy + ry * 0.78
  if (kind === 'subject') {
    const flat = d.archetype === 'silhouette-foot' ? mix(accent, d.palette.ground, 0.08) : undefined
    const room = inner(cy + ry * 0.4, 0.86)
    const fit = fitSubject({
      species: ctx.species,
      ink: flat ? { leafLight: flat, leaf: flat, leafMid: flat, leafDeep: flat, fruit: flat, fruitDeep: flat, stem: flat } : heroInk(d.palette),
      seed: d.seed,
      lineSeed: d.lineSeed,
      style: d.subjectStyle ?? (d.archetype === 'silhouette-foot' ? 'silhouette' : d.archetype === 'inner-card' ? 'engraved' : 'cut-paper'),
      uid: `${ctx.uid}-hero`,
      room: { left: cx - room / 2, right: cx + room / 2, top: y + rim * 0.4, bottom: footY - volSize * 2.2 },
      minWidth: Math.min(w, h) * 0.18,
    })
    if (fit) {
      ledger.add('element', 'specimen', fit.box.x, fit.box.y, fit.box.w, fit.box.h)
      parts.push(fit.markup)
    }
  }
  if (d.volumeLine) parts.push(netQuantity(ledger, cx, footY, d.volumeLine, volSize, kind === 'field' ? readableInk(d.palette.ground, ink) : ink))
  parts.push('</g>')
  return parts.join('')
}

/**
 * The reference repertoire on a swing tag.
 *
 * A tag is narrow, tall and has a hole through the top, so it keeps one thing from the face it
 * belongs to and drops the rest: the archetype's field, its brand line, and either its subject or
 * its crown. No net quantity, no legal column — a tag is read in the hand, not on the shelf.
 */
export function paintReferenceTagFace(ctx: LayoutCtx): string {
  const { w, h, d, ledger, copy } = ctx
  const m = marginFor(w, h)
  const ink = readableInk(d.palette.ground, d.palette.ink)
  const accent = d.palette.accent
  const kind = roundKind(d.archetype)
  const holeR = Math.max(1.6, Math.min(2.6, w * 0.06))
  const holeY = Math.max(holeR * 2.2, h * 0.075)
  const clear = holeY + holeR * 2.4
  const parts: string[] = [
    `<g data-composition="ref-tag" data-round="${kind}">`,
    ground(w, h, d.palette.ground),
    paintBackground(d.background, w, h, d.palette, d.seed, { species: ctx.species, uid: ctx.uid, ornament: d.ornament, intensity: kind === 'field' ? 0.9 : 0.4 }),
    paintFrame(d, w, h, { inset: m * 0.7, color: accent, opacity: 0.5 }),
    `<circle cx="${f(w / 2)}" cy="${f(holeY)}" r="${f(holeR)}" fill="none" stroke="${ink}" stroke-width="0.25" stroke-opacity="0.5" />`,
  ]
  ledger.add('container', 'punch', w / 2 - holeR * 1.6, 0, holeR * 3.2, clear)

  const inner = w - m * 2.2
  let y = clear + m * 0.3
  if (kind === 'crown') {
    const medR = Math.min(w * 0.16, 5)
    parts.push(paintMark(markKindFor(d), w / 2, y + medR, medR, accent, copy.brand, identOf(ctx)))
    ledger.add('element', 'crown-mark', w / 2 - medR * 1.3, y, medR * 2.6, medR * 2)
    y += medR * 2 + m * 0.4
  }
  const brand = brandLine(ctx, w / 2, y, inner, Math.min(inner * 0.22, 8), ink)
  parts.push(brand.markup)
  y = brand.bottom + brand.size * 0.18
  const catSize = Math.max(STUDIO_FLOOR_TEXT_MM, Math.min(1.8, w * 0.05))
  const cat = categoryCaption(ctx) || d.categoryLine
  if (cat) {
    parts.push(spacedLine(ledger, w / 2, y + catSize, cat, catSize, mix(ink, d.palette.ground, 0.25), inner * 0.9))
    y += catSize * 2.1
  }
  if (kind !== 'field') {
    const fit = fitSubject({
      species: ctx.species,
      ink: heroInk(d.palette),
      seed: d.seed,
      lineSeed: d.lineSeed,
      style: d.subjectStyle ?? (d.archetype === 'silhouette-foot' ? 'silhouette' : 'engraved'),
      uid: `${ctx.uid}-hero`,
      room: { left: m, right: w - m, top: y + m * 0.3, bottom: h - m * 1.4 },
      minWidth: Math.min(w, h) * 0.22,
    })
    if (fit) {
      ledger.add('element', 'specimen', fit.box.x, fit.box.y, fit.box.w, fit.box.h)
      parts.push(fit.markup)
    }
  }
  parts.push('</g>')
  return parts.join('')
}
