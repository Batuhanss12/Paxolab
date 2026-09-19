/**
 * Graphic languages — five fields the reference set is full of and the repertoire had none of.
 *
 * The audit (§4.3) read thirty-one references and listed the graphic languages against what the
 * studio could paint: eleven fields, all textures or scenes, and a botanical illustrator. What the
 * shelves showed and the studio lacked, from cheapest to build to dearest: an organic blob field
 * (R10, R15, R24, R27), an ogee / feather lattice (R01), a celestial line set (R07, R16), a repeat
 * pattern of pictograms (R13) and a heritage toile (R06). Each is a field like the others —
 * seeded, pure, panel-local, print-safe vectors, no raster and no filters — and answers to the
 * same `BackgroundOpts` (intensity, ornament level, species), so every painter that reads the
 * direction's background can wear it, and the strip and the variation walk can reach it.
 *
 * What is deliberately *not* here: mascots, human figures, photographs, embossing and the
 * engraved landscape — all closed by the owner (§3.0, §3.1).
 */
import { benefitIcon } from './anatomy'
import { blob, gain, ground, mulberry32, type BackgroundOpts } from './backgrounds'
import { darken, isDark, lighten, mix } from './color'
import { toileSprig, type Species } from './species'
import type { BenefitIcon, StudioPalette } from './types'

const f = (n: number) => (Math.round(n * 100) / 100).toString()

/* ------------------------------------------------------------------- blob */

/**
 * Two to four soft organic masses in the palette's own colours, overlapping, off-centre.
 *
 * The blob is the youngest language on the shelf — OILY's acid field, the retro creams, the
 * playful pouches. It is drawn with the ink wash's own blob path, which already knows how to be
 * organic without being lumpy, but flat: no gradient, no wash edge, so it reads as cut colour
 * rather than paint. The masses sit against edges and corners (never centred) so the type has a
 * quiet side, and each is a different colour of the brief's palette at a different opacity —
 * the overlap makes the third colour the way real cut paper does.
 */
export function blobField(w: number, h: number, pal: StudioPalette, seed: number, opts: BackgroundOpts): string {
  const rng = mulberry32(seed)
  const k = gain(opts, 0.85)
  const count = 2 + Math.round(k * 1.6)
  const tones = [pal.accent2, pal.accent, pal.deep, mix(pal.accent, pal.ground, 0.4)]
  const parts: string[] = [ground(w, h, pal.ground)]
  const corners = [
    { x: w * 0.1, y: h * 0.15 },
    { x: w * 0.9, y: h * 0.8 },
    { x: w * 0.85, y: h * 0.18 },
    { x: w * 0.12, y: h * 0.85 },
  ]
  for (let i = 0; i < count; i++) {
    const at = corners[(i + Math.floor(rng() * 2)) % corners.length]!
    const rx = w * (0.28 + rng() * 0.22) * Math.min(1.2, k + 0.4)
    const ry = h * (0.22 + rng() * 0.2) * Math.min(1.2, k + 0.4)
    const cx = at.x + (rng() - 0.5) * w * 0.14
    const cy = at.y + (rng() - 0.5) * h * 0.14
    const opacity = Math.min(1, (0.55 + i * 0.12) * (0.7 + k * 0.3))
    parts.push(
      `<path d="${blob(rng, cx, cy, rx, ry)}" fill="${tones[i % tones.length]}" fill-opacity="${f(opacity)}" transform="rotate(${f((rng() - 0.5) * 30)} ${f(cx)} ${f(cy)})" />`,
    )
  }
  return `<g data-bg="blob">${parts.join('')}</g>`
}

/* ------------------------------------------------------------------- ogee */

/**
 * The ogee lattice — pointed arches nested in staggered rows, a feather spine inside each.
 *
 * The Azzurra field is a star lattice; the peacock plate (R01) is an ogee, which is the older
 * and softer geometry: every cell is a leaf-shaped arch, and the rows interlock so the eye reads
 * a net of feathers. Drawn as outlines at the arabesque's opacity so type sits on it, with every
 * other cell tinted a step so the net has depth without a second colour.
 */
export function ogeeField(w: number, h: number, pal: StudioPalette, seed: number, opts: BackgroundOpts): string {
  const rng = mulberry32(seed)
  const k = gain(opts, 0.8)
  const cw = Math.max(7, Math.min(w, h) / (4.2 + k * 1.6))
  const ch = cw * 1.55
  const phaseX = rng() * cw
  const phaseY = rng() * ch
  const line = pal.accent2
  const sw = Math.max(0.12, cw * 0.016)
  const strokeOp = Math.min(1, 0.32 * k)
  const fillOp = Math.min(1, 0.06 * k)
  // One ogee: from the bottom point, up the right flank, over the top point, down the left flank.
  const ogee = (cx: number, cy: number): string =>
    `M${f(cx)} ${f(cy + ch / 2)} ` +
    `C${f(cx + cw * 0.62)} ${f(cy + ch * 0.28)} ${f(cx + cw * 0.5)} ${f(cy - ch * 0.02)} ${f(cx + cw * 0.5)} ${f(cy - ch * 0.12)} ` +
    `C${f(cx + cw * 0.5)} ${f(cy - ch * 0.3)} ${f(cx + cw * 0.12)} ${f(cy - ch * 0.36)} ${f(cx)} ${f(cy - ch / 2)} ` +
    `C${f(cx - cw * 0.12)} ${f(cy - ch * 0.36)} ${f(cx - cw * 0.5)} ${f(cy - ch * 0.3)} ${f(cx - cw * 0.5)} ${f(cy - ch * 0.12)} ` +
    `C${f(cx - cw * 0.5)} ${f(cy - ch * 0.02)} ${f(cx - cw * 0.62)} ${f(cy + ch * 0.28)} ${f(cx)} ${f(cy + ch / 2)}Z`
  // The feather: a spine with three short barbs each side, inside the upper two thirds.
  const feather = (cx: number, cy: number): string => {
    let d = `M${f(cx)} ${f(cy + ch * 0.28)} L${f(cx)} ${f(cy - ch * 0.34)}`
    for (let i = 0; i < 3; i++) {
      const y = cy + ch * (0.16 - i * 0.16)
      d += ` M${f(cx)} ${f(y)} L${f(cx - cw * 0.16)} ${f(y - ch * 0.07)} M${f(cx)} ${f(y)} L${f(cx + cw * 0.16)} ${f(y - ch * 0.07)}`
    }
    return d
  }
  let cells = ''
  let tinted = ''
  let feathers = ''
  let row = 0
  for (let y = -ch + phaseY; y < h + ch; y += ch * 0.5, row++) {
    const offset = row % 2 === 0 ? 0 : cw * 0.5
    let col = 0
    for (let x = -cw + phaseX + offset; x < w + cw; x += cw, col++) {
      cells += `<path d="${ogee(x, y)}" />`
      if ((row + col) % 2 === 0) tinted += `<path d="${ogee(x, y)}" />`
      feathers += `<path d="${feather(x, y)}" />`
    }
  }
  return (
    `<g data-bg="ogee">${ground(w, h, pal.ground)}` +
    `<g data-texture="tint" fill="${line}" fill-opacity="${f(fillOp)}" stroke="none">${tinted}</g>` +
    `<g data-texture="lattice" fill="none" stroke="${line}" stroke-opacity="${f(strokeOp)}" stroke-width="${f(sw)}" stroke-linejoin="round">${cells}</g>` +
    `<g data-texture="feathers" fill="none" stroke="${line}" stroke-opacity="${f(strokeOp * 0.55)}" stroke-width="${f(sw * 0.8)}" stroke-linecap="round">${feathers}</g>` +
    `</g>`
  )
}

/* -------------------------------------------------------------- celestial */

/**
 * A night set in one line: a crescent, small stars, sparks and rings, scattered thin.
 *
 * Lunara's flanks (R07) and the sun plate (R16) draw the sky as a few line glyphs with a lot of
 * air between them, never as a starfield. So: one crescent set off a corner at a fifth of the
 * face, a handful of eight-point stars, sparks (two crossed hairlines) and rings, all in the
 * accent, all at an opacity that lets type sit on any of them. On a dark ground the ink lifts a
 * step so the set reads as light; on a pale one it takes the accent as drawn.
 */
export function celestialField(w: number, h: number, pal: StudioPalette, seed: number, opts: BackgroundOpts): string {
  const rng = mulberry32(seed)
  const k = gain(opts, 0.8)
  const dark = isDark(pal.ground)
  const line = dark ? lighten(pal.accent, 0.12) : pal.accent
  const sw = Math.max(0.14, Math.min(w, h) * 0.0032)
  const parts: string[] = [ground(w, h, pal.ground)]
  const star = (cx: number, cy: number, r: number): string => {
    const pts: string[] = []
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2
      const rr = i % 2 === 0 ? r : r * 0.38
      pts.push(`${f(cx + Math.cos(a) * rr)} ${f(cy + Math.sin(a) * rr)}`)
    }
    return `<path d="M${pts.join(' L')}Z" />`
  }
  const spark = (cx: number, cy: number, r: number): string =>
    `<path d="M${f(cx - r)} ${f(cy)} L${f(cx + r)} ${f(cy)} M${f(cx)} ${f(cy - r)} L${f(cx)} ${f(cy + r)}" />`
  const ring = (cx: number, cy: number, r: number): string => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" />`
  // The crescent: the moon's disc less a second disc pushed off to one side, as one path of two arcs.
  const crescent = (cx: number, cy: number, r: number, tilt: number): string =>
    `<path transform="rotate(${f(tilt)} ${f(cx)} ${f(cy)})" d="M${f(cx)} ${f(cy - r)} A${f(r)} ${f(r)} 0 1 1 ${f(cx)} ${f(cy + r)} A${f(r * 0.78)} ${f(r * 0.78)} 0 1 0 ${f(cx)} ${f(cy - r)}Z" />`
  const corner = rng() < 0.5 ? { x: w * 0.2, y: h * 0.2 } : { x: w * 0.8, y: h * 0.22 }
  const moonR = Math.min(w, h) * 0.11
  const glyphs: string[] = [crescent(corner.x, corner.y, moonR, (rng() - 0.5) * 50)]
  const n = Math.round((6 + rng() * 4) * (0.6 + k * 0.6))
  for (let i = 0; i < n; i++) {
    const cx = rng() * w
    const cy = rng() * h
    if (Math.hypot(cx - corner.x, cy - corner.y) < moonR * 1.8) continue
    const r = Math.min(w, h) * (0.012 + rng() * 0.022)
    const kind = rng()
    glyphs.push(kind < 0.4 ? star(cx, cy, r) : kind < 0.75 ? spark(cx, cy, r) : ring(cx, cy, r * 0.7))
  }
  // Dust: a few dots, so the sky has depth without a texture.
  let dust = ''
  for (let i = 0; i < Math.round(10 * k); i++) dust += `<circle cx="${f(rng() * w)}" cy="${f(rng() * h)}" r="${f(sw * 0.9)}" />`
  return (
    `<g data-bg="celestial">${parts.join('')}` +
    `<g data-texture="sky" fill="none" stroke="${line}" stroke-opacity="${f(Math.min(1, 0.6 * k + 0.2))}" stroke-width="${f(sw)}" stroke-linecap="round" stroke-linejoin="round">${glyphs.join('')}</g>` +
    `<g data-texture="dust" fill="${line}" fill-opacity="${f(Math.min(1, 0.4 * k))}">${dust}</g>` +
    `</g>`
  )
}

/* -------------------------------------------------------------- pictogram */

/** Which of the studio's benefit icons a product's botany suggests for its repeat. */
const ICONS_BY_SPECIES: Partial<Record<Species, BenefitIcon[]>> = {
  olive: ['leaf', 'sun', 'jar'],
  coffee: ['jar', 'sun', 'heart'],
  tea: ['leaf', 'jar', 'sun'],
  grain: ['sun', 'leaf', 'check'],
  citrus: ['sun', 'drop', 'leaf'],
  cocoa: ['heart', 'jar', 'star'],
  conifer: ['mountain', 'leaf', 'star'],
  aloe: ['drop', 'leaf', 'check'],
  lavender: ['flask', 'heart', 'leaf'],
  chamomile: ['sun', 'heart', 'leaf'],
  rose: ['heart', 'drop', 'star'],
  mint: ['leaf', 'drop', 'bolt'],
  grape: ['sun', 'heart', 'jar'],
  berry: ['heart', 'sun', 'drop'],
  blossom: ['heart', 'star', 'leaf'],
}

/**
 * The benefit icons as a repeat — a staggered grid of three glyphs, ringless, turned a little
 * each way, at an opacity that makes them a pattern rather than a message.
 *
 * R13 sets its whole face on a repeat of small pictograms; the studio already had twelve icons
 * drawn for the benefit row and never laid them out as a field. Which three depends on the
 * product's own botany, so the repeat belongs to the product rather than to the sector.
 */
export function pictogramField(w: number, h: number, pal: StudioPalette, seed: number, opts: BackgroundOpts): string {
  const rng = mulberry32(seed)
  const k = gain(opts, 0.75)
  const icons = ICONS_BY_SPECIES[opts.species ?? 'flora'] ?? ['leaf', 'sun', 'heart']
  const cell = Math.max(7, Math.min(w, h) / (4 + k * 2))
  const r = cell * 0.2
  const line = mix(pal.accent2, pal.ground, 0.1)
  const phaseX = rng() * cell
  const phaseY = rng() * cell
  let glyphs = ''
  let row = 0
  for (let y = -cell + phaseY; y < h + cell; y += cell * 0.86, row++) {
    const offset = row % 2 === 0 ? 0 : cell * 0.5
    let col = 0
    for (let x = -cell + phaseX + offset; x < w + cell; x += cell, col++) {
      const icon = icons[(row + col) % icons.length]!
      const tilt = ((row + col) % 2 === 0 ? -1 : 1) * (8 + rng() * 10)
      glyphs += `<g transform="rotate(${f(tilt)} ${f(x)} ${f(y)})">${benefitIcon(icon, x, y, r, line, false)}</g>`
    }
  }
  return `<g data-bg="pictogram">${ground(w, h, pal.ground)}<g data-texture="repeat" opacity="${f(Math.min(1, 0.3 * k + 0.08))}">${glyphs}</g></g>`
}

/* ------------------------------------------------------------------ toile */

/**
 * A heritage toile: small engraved sprigs of the product's own plant, repeated in one ink.
 *
 * The toile (R06) is a printed textile language — a single colour, a drawing repeated, the drawing
 * an engraving. The studio's illustrator already draws engraved sprigs; here it draws a small one
 * per cell of a staggered grid, alternately turned, in the accent's darker step on the ground.
 * Kept thin (one ink, low opacity, hairline strokes) so the field stays a field, and drawn as
 * real paths in every cell rather than one symbol reused, because the delivered file carries no
 * references.
 */
export function toileField(w: number, h: number, pal: StudioPalette, seed: number, opts: BackgroundOpts): string {
  const rng = mulberry32(seed)
  const k = gain(opts, 0.75)
  const species = opts.species ?? 'flora'
  const line = isDark(pal.ground) ? lighten(pal.accent2, 0.1) : darken(pal.accent2, 0.08)
  const cell = Math.max(12, Math.min(w, h) / (2.6 + k * 1.2))
  const phaseX = rng() * cell
  const phaseY = rng() * cell
  const sprigs: string[] = []
  let row = 0
  let i = 0
  for (let y = -cell + phaseY; y < h + cell; y += cell * 0.92, row++) {
    const offset = row % 2 === 0 ? 0 : cell * 0.5
    for (let x = -cell + phaseX + offset; x < w + cell; x += cell, i++) {
      const tilt = (row % 2 === 0 ? -1 : 1) * (12 + rng() * 16)
      sprigs.push(`<g transform="rotate(${f(tilt)} ${f(x)} ${f(y)})">${toileSprig(species, x, y, cell * 0.62, line, seed + i * 7, `${opts.uid}-t${i}`)}</g>`)
    }
  }
  return `<g data-bg="toile">${ground(w, h, pal.ground)}<g data-texture="toile" opacity="${f(Math.min(1, 0.42 * k + 0.1))}">${sprigs.join('')}</g></g>`
}

