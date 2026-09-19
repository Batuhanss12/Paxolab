/**
 * The drawn subject, fitted by what it really reaches.
 *
 * `speciesHero` takes a nominal size and says nothing about how far the picture spills past it —
 * an arch reaches 1.5 × its size wide, a spray 1.5 × tall, a lavender sprig half a size wide. The
 * `heroAspect` table that sized subjects before described the arrangement, not the drawing: on a
 * band label a flora arch was drawn 42 mm tall in a room booked as 25 and put its flower head
 * through the city line, and the ledger saw a box that was never where the picture was.
 *
 * So every painter that places a subject comes through here: the picture is drawn once at a probe
 * size and measured (`svgHull`), the nominal size is scaled so the measured reach fills the room,
 * and the box handed back is the box of what was actually drawn. The illustrator's geometry is
 * linear in size, so the probe's proportions hold at the final size; the final markup is measured
 * again anyway, and that is what the caller books.
 */
import { heroLayout, heroStyle, speciesHero, type HeroInk, type HeroLayout, type HeroStyle, type Species } from './species'
import { svgHull } from './svgHull'

export type SubjectRoom = { left: number; right: number; top: number; bottom: number }
export type SubjectBox = { x: number; y: number; w: number; h: number }
export type SubjectFit = {
  markup: string
  /** The drawn box — measured on the final markup, mirrored the way the drawing is. */
  box: SubjectBox
  /** The nominal size the illustrator was asked for. */
  size: number
  cx: number
  cy: number
}

const PROBE_SIZE = 100
const f = (n: number) => (Math.round(n * 100) / 100).toString()

/** Where a drawing reaches, as fractions of its nominal size, on each side of its centre. */
type Reach = { l: number; r: number; t: number; b: number }

function reachOf(markup: string, size: number): Reach | null {
  const hull = svgHull(markup)
  if (!hull) return null
  return { l: -hull.minX / size, r: hull.maxX / size, t: -hull.minY / size, b: hull.maxY / size }
}

/**
 * Fit the subject into `room`. Null when the drawing would come out narrower than `minWidth`,
 * because a small drawing stops being the subject and starts being a smudge — better a quiet
 * face owned by the type than a bad picture.
 *
 * `anchor: 'end'` sets it against the room's right edge (a corner block); `valign: 'bottom'`
 * sits it on the room's floor (the branch that straddles a band, the sprig on its rule);
 * `flip` mirrors it about its own centre line for the second flank, with the reach mirrored to
 * match, so the box still says where the picture is.
 */
export function fitSubject(input: {
  species: Species
  ink: HeroInk
  seed: number
  /** The range's line seed decides arrangement and render mode; `layout` / `style` override it. */
  lineSeed?: number
  layout?: HeroLayout
  style?: HeroStyle
  uid: string
  room: SubjectRoom
  /** The drawn extent below which the subject is left out — judged on the short side of the face, and only when the drawing is small both ways. */
  minWidth: number
  anchor?: 'middle' | 'end'
  valign?: 'middle' | 'bottom'
  flip?: boolean
}): SubjectFit | null {
  const lineSeed = input.lineSeed ?? input.seed
  const heroOpts = { layout: input.layout ?? heroLayout(input.species, lineSeed), style: input.style ?? heroStyle(lineSeed) }
  return fitDrawing({
    ...input,
    draw: (cx, cy, size, uid) => speciesHero(input.species, cx, cy, size, input.ink, input.seed, { ...heroOpts, uid }),
  })
}

/**
 * The same fit for any drawing.
 *
 * `fitSubject` is this with the illustrator's plant wired in: draw once at a probe size, measure
 * what it really reaches, scale so the reach fills the room, and hand back the box of what was
 * drawn. Splitting the measuring half out keeps the plant path byte for byte what the frozen faces
 * were painted with, and gives any future drawing that is not a species the same treatment without
 * widening `fitSubject`.
 */
export function fitDrawing(input: {
  draw: (cx: number, cy: number, size: number, uid: string) => string
  uid: string
  room: SubjectRoom
  minWidth: number
  anchor?: 'middle' | 'end'
  valign?: 'middle' | 'bottom'
  flip?: boolean
}): SubjectFit | null {
  const probe = reachOf(input.draw(0, 0, PROBE_SIZE, 'probe'), PROBE_SIZE)
  if (!probe) return null
  // The second flank is mirrored, so what reached left now reaches right.
  const reach: Reach = input.flip ? { ...probe, l: probe.r, r: probe.l } : probe
  const { room } = input
  const roomW = Math.max(0, room.right - room.left)
  const roomH = Math.max(0, room.bottom - room.top)
  const size = Math.min(roomW / Math.max(0.05, reach.l + reach.r), roomH / Math.max(0.05, reach.t + reach.b))
  // A smudge is small both ways. A tall sprig in a short room on a wide label is narrow and still
  // a subject; judged by width alone it was dropped and the face went quiet for no reason.
  if (!(size > 0) || ((reach.l + reach.r) * size < input.minWidth && (reach.t + reach.b) * size < input.minWidth)) return null
  // The drawn box, not the nominal one, is what sits centred, right-aligned or on the floor.
  const cx = input.anchor === 'end' ? room.right - reach.r * size : (room.left + room.right) / 2 + ((reach.l - reach.r) * size) / 2
  const cy = input.valign === 'bottom' ? room.bottom - reach.b * size : (room.top + room.bottom) / 2 + ((reach.t - reach.b) * size) / 2
  const hero = input.draw(cx, cy, size, input.uid)
  const markup = input.flip ? `<g transform="translate(${f(cx * 2)} 0) scale(-1 1)">${hero}</g>` : hero
  const drawn = svgHull(hero)
  const box: SubjectBox = drawn
    ? { x: input.flip ? 2 * cx - drawn.maxX : drawn.minX, y: drawn.minY, w: drawn.maxX - drawn.minX, h: drawn.maxY - drawn.minY }
    : { x: cx - reach.l * size, y: cy - reach.t * size, w: (reach.l + reach.r) * size, h: (reach.t + reach.b) * size }
  return { markup, box, size, cx, cy }
}
