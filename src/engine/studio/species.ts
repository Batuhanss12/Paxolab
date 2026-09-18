/**
 * What the picture is actually *of*.
 *
 * The archetype decides composition (arched window, corner brackets, title card); until now it
 * also decided the imagery, so an olive oil carton got pine trees and a chocolate box got marble.
 * Measured 2026-09-17 across 28 briefs: marble and generic botany were being applied as
 * "luxury" and "natural" wallpaper to unrelated food categories.
 *
 * This layer answers a different question — given the product, which plant belongs on the face.
 * Composition stays with the archetype; only the silhouettes change.
 */

export type Species =
  | 'olive'
  | 'coffee'
  | 'tea'
  | 'grain'
  | 'citrus'
  | 'cocoa'
  | 'flora'
  | 'conifer'
  | 'aloe'
  | 'lavender'
  | 'chamomile'
  | 'rose'
  | 'mint'
  | 'grape'
  | 'berry'
  | 'blossom'

const RULES: { re: RegExp; species: Species }[] = [
  { re: /aloe|aloe\s*vera|sukulent/i, species: 'aloe' },
  { re: /lavanta|lavender|lavandula/i, species: 'lavender' },
  { re: /papatya|chamomile|camomile|matricaria/i, species: 'chamomile' },
  { re: /\bgül\b|gülsuyu|\brose\b|rosa\b|rosehip|kuşburnu/i, species: 'rose' },
  { re: /nane|\bmint\b|mentol|menthol|melisa/i, species: 'mint' },
  { re: /üzüm|grape|şarap|\bwine\b|\bbağ\b/i, species: 'grape' },
  { re: /çilek|strawberry|böğürtlen|frambuaz|ahududu|yaban\s*mersini|berry|orman\s*meyve/i, species: 'berry' },
  /*
   * Honey is a blossom, not a grain. It sat in the wheat rule because both read as "golden food",
   * but the customer's picture of honey is the flower the bee worked, and that is a different
   * drawing entirely — the only reason it was ever wheat is that there was no flower to give it.
   */
  { re: /\bbal\b|honey|çiçek\s*bal|petek/i, species: 'blossom' },
  { re: /zeytin|olive|sızma|natürel\s*sızma/i, species: 'olive' },
  { re: /kahve|coffee|espresso|filtre|çekirdek|arabica|robusta/i, species: 'coffee' },
  { re: /çay|tea|matcha|bitki\s*çay/i, species: 'tea' },
  { re: /buğday|wheat|tahıl|grain|kurabiye|biscuit|bisküvi|kraker|ekmek|bread|makarna|bulgur|pirinç/i, species: 'grain' },
  { re: /limon|lemon|portakal|orange|narenciye|citrus|greyfurt|mandalina|bergamot/i, species: 'citrus' },
  { re: /çikolata|chocolate|kakao|cocoa|kakaolu/i, species: 'cocoa' },
]

/**
 * Sector and sub-product first, then the product name — a brand may say "Zeytin" in the name
 * while the category field stays generic.
 */
export function speciesFor(input: { sector?: string; subProduct?: string; productName?: string; story?: string }): Species {
  const blob = `${input.subProduct ?? ''} ${input.sector ?? ''} ${input.productName ?? ''} ${input.story ?? ''}`
  for (const rule of RULES) {
    if (rule.re.test(blob)) return rule.species
  }
  /*
   * Care and remedy read as botany; only genuinely unclassified work keeps the conifer scenery.
   *
   * Health used to fall through to `conifer`, so an ointment carton was drawn a pine sprig — the
   * `specimen-hero` DNA scores health at the recognition floor, so that face really was reachable.
   * A remedy's picture is a medicinal flower; chamomile is the one a Turkish shelf reads without
   * being told. Electronics never reaches this archetype (it scores below the floor), which is why
   * the conifer fallback is now rare enough to be honest about being a fallback.
   */
  if (/merhem|balm|pomad|ointment|takviye|vitamin|supplement|şurup|sağlık/i.test(blob)) return 'chamomile'
  if (/kozmetik|krem|serum|şampuan|bakım|sabun|cosmetic|cream|care|bebek|baby|eczane|pharma/i.test(blob)) return 'flora'
  return 'conifer'
}

const f = (n: number) => (Math.round(n * 100) / 100).toString()

/* ------------------------------------------------------------------ trees */

/** Rounded crown on a short trunk — olive, citrus and cocoa read as orchard silhouettes. */
function orchardTree(x: number, baseY: number, hgt: number, fill: string, opacity: number, lean = 0): string {
  const crownR = hgt * 0.42
  const crownY = baseY - hgt * 0.62
  const trunkW = hgt * 0.07
  const tip = x + lean * hgt * 0.1
  return (
    `<path d="M${f(x - trunkW / 2)} ${f(baseY)} L${f(tip - trunkW * 0.35)} ${f(crownY)} L${f(tip + trunkW * 0.35)} ${f(crownY)} L${f(x + trunkW / 2)} ${f(baseY)}Z" fill="${fill}" fill-opacity="${f(opacity)}" />` +
    `<ellipse cx="${f(tip)}" cy="${f(crownY)}" rx="${f(crownR)}" ry="${f(crownR * 0.82)}" fill="${fill}" fill-opacity="${f(opacity)}" />` +
    `<ellipse cx="${f(tip - crownR * 0.6)}" cy="${f(crownY + crownR * 0.28)}" rx="${f(crownR * 0.5)}" ry="${f(crownR * 0.42)}" fill="${fill}" fill-opacity="${f(opacity)}" />` +
    `<ellipse cx="${f(tip + crownR * 0.58)}" cy="${f(crownY + crownR * 0.22)}" rx="${f(crownR * 0.46)}" ry="${f(crownR * 0.4)}" fill="${fill}" fill-opacity="${f(opacity)}" />`
  )
}

/** Upright stalk with a heavy head — wheat / grain fields. */
function grainStalk(x: number, baseY: number, hgt: number, fill: string, opacity: number): string {
  const headH = hgt * 0.42
  const headW = hgt * 0.1
  let ears = ''
  for (let i = 0; i < 5; i++) {
    const t = i / 4
    const y = baseY - hgt + headH * t
    ears += `<ellipse cx="${f(x - headW)}" cy="${f(y)}" rx="${f(headW * 0.85)}" ry="${f(headH * 0.14)}" fill="${fill}" fill-opacity="${f(opacity)}" transform="rotate(-28 ${f(x - headW)} ${f(y)})" />`
    ears += `<ellipse cx="${f(x + headW)}" cy="${f(y)}" rx="${f(headW * 0.85)}" ry="${f(headH * 0.14)}" fill="${fill}" fill-opacity="${f(opacity)}" transform="rotate(28 ${f(x + headW)} ${f(y)})" />`
  }
  return (
    `<path d="M${f(x)} ${f(baseY)} L${f(x)} ${f(baseY - hgt)}" stroke="${fill}" stroke-opacity="${f(opacity)}" stroke-width="${f(hgt * 0.05)}" stroke-linecap="round" fill="none" />` +
    ears
  )
}

/** Tall bare-stemmed shrub row — tea terraces read as low rounded hedges. */
function hedgeRow(x: number, baseY: number, hgt: number, fill: string, opacity: number): string {
  const r = hgt * 0.5
  return `<path d="M${f(x - r * 1.5)} ${f(baseY)} q${f(r * 0.75)} ${f(-hgt)} ${f(r * 1.5)} 0 q${f(r * 0.75)} ${f(-hgt)} ${f(r * 1.5)} 0Z" fill="${fill}" fill-opacity="${f(opacity)}" />`
}

function conifer(x: number, baseY: number, hgt: number, fill: string, opacity: number): string {
  const wdt = hgt * 0.38
  return `<path d="M${f(x)} ${f(baseY - hgt)} L${f(x + wdt * 0.55)} ${f(baseY - hgt * 0.55)} L${f(x + wdt * 0.3)} ${f(baseY - hgt * 0.55)} L${f(x + wdt)} ${f(baseY - hgt * 0.15)} L${f(x + wdt * 0.6)} ${f(baseY - hgt * 0.15)} L${f(x + wdt * 0.6)} ${f(baseY)} L${f(x - wdt * 0.6)} ${f(baseY)} L${f(x - wdt * 0.6)} ${f(baseY - hgt * 0.15)} L${f(x - wdt)} ${f(baseY - hgt * 0.15)} L${f(x - wdt * 0.3)} ${f(baseY - hgt * 0.55)} L${f(x - wdt * 0.55)} ${f(baseY - hgt * 0.55)}Z" fill="${fill}" fill-opacity="${f(opacity)}" />`
}

/** The silhouette that stands on a hillside for this product. */
export function speciesTree(species: Species, x: number, baseY: number, hgt: number, fill: string, opacity = 1): string {
  switch (species) {
    case 'olive':
      return orchardTree(x, baseY, hgt, fill, opacity, -0.4)
    case 'citrus':
    case 'cocoa':
      return orchardTree(x, baseY, hgt, fill, opacity, 0.2)
    case 'coffee':
      return orchardTree(x, baseY, hgt * 0.85, fill, opacity, 0.35)
    case 'blossom':
      // Honey comes off an orchard in flower, not a wheat field — the same correction the routing
      // rule makes, carried down to the scenery so the two scales agree.
      return orchardTree(x, baseY, hgt, fill, opacity, 0.15)
    case 'grain':
    case 'chamomile':
      return grainStalk(x, baseY, hgt, fill, opacity)
    case 'tea':
    case 'aloe':
    case 'lavender':
    case 'rose':
    case 'mint':
    case 'grape':
    case 'berry':
      // Everything grown in rows reads as a low hedge on a hillside: lavender, vines, soft fruit.
      return hedgeRow(x, baseY, hgt * 0.6, fill, opacity)
    case 'flora':
    case 'conifer':
    default:
      return conifer(x, baseY, hgt, fill, opacity)
  }
}

/* ------------------------------------------------------------------ leaves */

/** Paired narrow leaves along a stem, with fruit — olive, coffee, citrus. */
function sprig(cx: number, cy: number, len: number, angle: number, fill: string, opacity: number, fruit: number, leafRatio: number): string {
  const leaves: string[] = []
  const pairs = 5
  for (let i = 1; i <= pairs; i++) {
    const t = i / (pairs + 1)
    const y = -len * t
    const lw = len * leafRatio
    const lh = len * leafRatio * 0.3
    leaves.push(`<ellipse cx="${f(lw * 0.75)}" cy="${f(y)}" rx="${f(lw * 0.75)}" ry="${f(lh)}" transform="rotate(-24 ${f(lw * 0.75)} ${f(y)})" />`)
    leaves.push(`<ellipse cx="${f(-lw * 0.75)}" cy="${f(y)}" rx="${f(lw * 0.75)}" ry="${f(lh)}" transform="rotate(24 ${f(-lw * 0.75)} ${f(y)})" />`)
  }
  let fruits = ''
  for (let i = 0; i < fruit; i++) {
    const t = 0.35 + i * 0.22
    fruits += `<ellipse cx="${f(len * 0.07 * (i % 2 ? 1 : -1))}" cy="${f(-len * t)}" rx="${f(len * 0.055)}" ry="${f(len * 0.075)}" fill-opacity="${f(Math.min(1, opacity + 0.2))}" />`
  }
  return (
    `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${f(angle)})" fill="${fill}" fill-opacity="${f(opacity)}">` +
    `<path d="M0 0 L0 ${f(-len)}" stroke="${fill}" stroke-opacity="${f(opacity)}" stroke-width="${f(len * 0.022)}" fill="none" />` +
    leaves.join('') +
    fruits +
    '</g>'
  )
}

/** Broad pointed leaf — the neutral botany already used for care products. */
function broad(cx: number, cy: number, len: number, angle: number, fill: string, opacity: number): string {
  const wdt = len * 0.34
  return `<path transform="rotate(${f(angle)} ${f(cx)} ${f(cy)})" d="M${f(cx)} ${f(cy)} C${f(cx + wdt)} ${f(cy - len * 0.3)} ${f(cx + wdt * 0.7)} ${f(cy - len * 0.78)} ${f(cx)} ${f(cy - len)} C${f(cx - wdt * 0.7)} ${f(cy - len * 0.78)} ${f(cx - wdt)} ${f(cy - len * 0.3)} ${f(cx)} ${f(cy)}Z" fill="${fill}" fill-opacity="${f(opacity)}" />`
}

/** The leaf/branch this product's botany is made of. */
export function speciesLeaf(species: Species, cx: number, cy: number, len: number, angle: number, fill: string, opacity: number): string {
  switch (species) {
    case 'olive':
      return sprig(cx, cy, len, angle, fill, opacity, 3, 0.17)
    case 'coffee':
      return sprig(cx, cy, len, angle, fill, opacity, 2, 0.26)
    case 'citrus':
      return sprig(cx, cy, len, angle, fill, opacity, 2, 0.24)
    case 'tea':
      return sprig(cx, cy, len * 0.9, angle, fill, opacity, 0, 0.2)
    case 'berry':
      return sprig(cx, cy, len, angle, fill, opacity, 2, 0.22)
    case 'grain':
    case 'lavender':
    case 'chamomile':
      return sprig(cx, cy, len, angle, fill, opacity, 0, 0.13)
    case 'blossom':
      return sprig(cx, cy, len, angle, fill, opacity, 0, 0.18)
    case 'cocoa':
    case 'flora':
    case 'conifer':
    case 'rose':
    case 'mint':
    case 'grape':
    default:
      return broad(cx, cy, len, angle, fill, opacity)
  }
}

/* -------------------------------------------------------------------- hero */

/**
 * Hero scale — the subject standing at the centre of the face, not a silhouette on a hillside.
 *
 * `speciesTree` and `speciesLeaf` above are single-fill silhouettes, which is right at scenery
 * size: a 4 mm shape on a horizon does not need tonal depth and would only turn muddy if it had
 * any. Blown up to 40 mm the same flat shape reads as clip art, so this is a separate family of
 * drawings rather than the old ones scaled up.
 *
 * Three things make the difference, and they are the three the reference plates teach:
 *   - a back layer in a deeper tone, so leaves read as passing behind each other,
 *   - leaves set along a curving bough at the bough's own angle, rather than fanned from a point,
 *   - one focal element in a contrasting colour, given room.
 *
 * Every colour arrives as a parameter. That is the whole reason this is drawn rather than placed:
 * a scanned watercolour olive is always olive-green, while this one wears whatever the brief said.
 * The public-domain botanical plates were the reference for the geometry — leaf ratio, how drupes
 * hang, how an aloe rosette opens — and nothing from them ships.
 */

export type HeroInk = {
  /** The lit edge — where a leaf catches the light, and the rim the reference plates gild. */
  leafLight: string
  /** Front leaves. */
  leaf: string
  /** The middle plane — the third value that turns two overlapping layers into depth. */
  leafMid: string
  /** Back leaves — the same hue, furthest from the light. */
  leafDeep: string
  /** The focal fruit / bloom. */
  fruit: string
  /** Shaded side of the focal element. */
  fruitDeep: string
  /** Stems, midribs and hairlines. */
  stem: string
}

/**
 * What the plant flowers as.
 *
 * Every species started out as leaves plus fruit, which quietly excluded most of what Paxolab
 * actually prints: cosmetics, baby care and perfume are a floral language, not a fruiting one.
 * A lavender without its spike or a chamomile without its disc is not that plant at all.
 */
export type BloomKind = 'none' | 'daisy' | 'spike' | 'umbel' | 'cup' | 'cluster' | 'corolla'

/**
 * Leaf anatomy, which is what actually names a plant.
 *
 * The first version of this drew every species from one blade and varied only its width ratio.
 * Measured against the reference plates that is the wrong variable: an olive and a coffee leaf are
 * close in proportion and nothing alike in outline. Shape is the identity — where the leaf is
 * widest, whether the edge is smooth or toothed, whether the tip draws out or blunts off.
 */
export type LeafShape = 'lanceolate' | 'ovate' | 'obovate' | 'serrate' | 'needle' | 'succulent'

/**
 * How the drawing is rendered.
 *
 * `solid` is flat masses with a light direction — contemporary, reads at thumbnail size.
 * `engraved` is outline and hatching with no fill, which is the older botanical-plate language and
 * the one premium skincare and spirits packs lean on. They are two different products from one
 * geometry, so carrying both roughly doubles the repertoire for the cost of a render branch.
 */
export type HeroStyle = 'solid' | 'engraved'

/**
 * The arrangement. A species that always draws the same silhouette stops being an illustration and
 * becomes a logo, so the composition is seeded alongside the jitter.
 */
export type HeroLayout = 'arch' | 'sprig' | 'wreath' | 'crossed' | 'spray' | 'rosette' | 'citrus'

export type HeroOpts = { style?: HeroStyle; layout?: HeroLayout; uid?: string }

type Pt = { x: number; y: number }
type Rng = () => number

function rngOf(seed: number): Rng {
  let a = (seed >>> 0) + 0x9e3779b9
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function qAt(p0: Pt, p1: Pt, p2: Pt, t: number): Pt {
  const u = 1 - t
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  }
}

function qDeg(p0: Pt, p1: Pt, p2: Pt, t: number): number {
  const u = 1 - t
  const dx = 2 * u * (p1.x - p0.x) + 2 * t * (p2.x - p1.x)
  const dy = 2 * u * (p1.y - p0.y) + 2 * t * (p2.y - p1.y)
  return (Math.atan2(dy, dx) * 180) / Math.PI
}

/* ------------------------------------------------------------------- leaves */

/** Outline in local space: base at the origin, tip at (len, 0). The caller rotates and places it. */
function leafPath(shape: LeafShape, len: number, wid: number): string {
  switch (shape) {
    case 'lanceolate':
      // Widest at about a third, then a long straight taper to a fine point — olive, willow.
      return (
        `M0 0 C${f(len * 0.18)} ${f(-wid)} ${f(len * 0.62)} ${f(-wid * 0.74)} ${f(len)} 0 ` +
        `C${f(len * 0.62)} ${f(wid * 0.74)} ${f(len * 0.18)} ${f(wid)} 0 0Z`
      )
    case 'ovate':
      // Broad shoulders near the base falling to a drawn-out tip — coffee, citrus, laurel.
      return (
        `M0 0 C${f(len * 0.1)} ${f(-wid * 1.12)} ${f(len * 0.52)} ${f(-wid * 1.02)} ${f(len * 0.84)} ${f(-wid * 0.26)} ` +
        `C${f(len * 0.93)} ${f(-wid * 0.09)} ${f(len * 0.98)} ${f(-wid * 0.02)} ${f(len)} 0 ` +
        `C${f(len * 0.98)} ${f(wid * 0.02)} ${f(len * 0.93)} ${f(wid * 0.09)} ${f(len * 0.84)} ${f(wid * 0.26)} ` +
        `C${f(len * 0.52)} ${f(wid * 1.02)} ${f(len * 0.1)} ${f(wid * 1.12)} 0 0Z`
      )
    case 'obovate':
      // Widest past the middle and blunt at the end — cocoa, magnolia.
      return (
        `M0 0 C${f(len * 0.28)} ${f(-wid * 0.46)} ${f(len * 0.62)} ${f(-wid * 1.18)} ${f(len)} 0 ` +
        `C${f(len * 0.62)} ${f(wid * 1.18)} ${f(len * 0.28)} ${f(wid * 0.46)} 0 0Z`
      )
    case 'serrate': {
      /*
       * Toothed on both edges — tea, mint, nettle. The teeth have to be part of the silhouette
       * rather than decoration drawn over it, or they vanish the moment the leaf overlaps another.
       * Nine steps is the point where the edge still reads as toothed at print size without
       * turning into noise.
       */
      const n = 9
      const prof = (t: number) => wid * Math.sin(Math.PI * Math.min(1, t) ** 0.72)
      const edge = (sign: number, from: number, to: number) => {
        const out: string[] = []
        const step = from < to ? 1 : -1
        for (let i = from; step > 0 ? i <= to : i >= to; i += step) {
          const t = i / n
          out.push(`L${f(len * t)} ${f(sign * prof(t) * (i % 2 ? 1 : 0.78))}`)
        }
        return out.join('')
      }
      return `M0 0${edge(-1, 1, n)}${edge(1, n, 1)}Z`
    }
    case 'needle':
      // Barely a leaf: grain, rosemary, conifer. A straight sliver with a soft belly.
      return `M0 0 Q${f(len * 0.5)} ${f(-wid)} ${f(len)} 0 Q${f(len * 0.5)} ${f(wid)} 0 0Z`
    case 'succulent':
    default:
      // Thick and fleshy, carrying its width most of the way before rounding off — aloe, agave.
      return (
        `M0 0 C${f(len * 0.16)} ${f(-wid)} ${f(len * 0.72)} ${f(-wid * 0.66)} ${f(len)} 0 ` +
        `C${f(len * 0.72)} ${f(wid * 0.66)} ${f(len * 0.16)} ${f(wid)} 0 0Z`
      )
  }
}

/**
 * Midrib and side veins.
 *
 * One hairline down the centre is the single cheapest thing that turns a filled shape into a leaf;
 * the side pairs only earn their place once the leaf is broad enough to hold them, which is why
 * they are gated on width rather than drawn always.
 */
function leafVeins(len: number, wid: number, colour: string, sw: number, dense: boolean): string {
  let g =
    `<path d="M${f(len * 0.05)} 0 L${f(len * 0.94)} 0" fill="none" stroke="${colour}" ` +
    `stroke-width="${f(sw)}" stroke-linecap="round" stroke-opacity="0.55" />`
  if (wid < len * 0.14) return g
  const pairs = dense ? 5 : 3
  for (let i = 1; i <= pairs; i++) {
    const t = 0.16 + (i / (pairs + 1)) * 0.68
    const x = len * t
    const reach = wid * 0.66 * Math.sin(Math.PI * Math.min(1, t * 1.05))
    for (const sign of [-1, 1]) {
      g +=
        `<path d="M${f(x)} 0 Q${f(x + len * 0.08)} ${f(sign * reach * 0.45)} ${f(x + len * 0.15)} ${f(sign * reach)}" ` +
        `fill="none" stroke="${colour}" stroke-width="${f(sw * 0.75)}" stroke-linecap="round" stroke-opacity="0.4" />`
    }
  }
  return g
}

/**
 * The gradients every leaf is filled with.
 *
 * Declared once per drawing and referenced by all of them. `objectBoundingBox` units are what make
 * that possible: each leaf is drawn base-at-origin, tip-at-(len,0) and then rotated, so the bounding
 * box's x axis *is* the leaf's own axis whichever way it ends up pointing. One definition therefore
 * lights every leaf from its own base toward its own tip, with no per-leaf defs and no ids to keep
 * unique.
 *
 * The stop positions are the shape of a leaf in light: dark where it joins the stem, full colour
 * across the belly, and lifting only in the last fifth, which is the part that turns to the sun.
 */
function leafGradients(uid: string, ink: HeroInk): string {
  const ramp = (id: string, a: string, b: string, c: string) =>
    `<linearGradient id="${uid}-${id}" x1="0" y1="0" x2="1" y2="0">` +
    `<stop offset="0" stop-color="${a}" /><stop offset="0.52" stop-color="${b}" />` +
    `<stop offset="1" stop-color="${c}" /></linearGradient>`
  return (
    ramp('lf', ink.leafDeep, ink.leaf, ink.leafLight) +
    ramp('lm', ink.leafDeep, ink.leafMid, ink.leaf) +
    ramp('lb', ink.leafDeep, ink.leafDeep, ink.leafMid) +
    `<linearGradient id="${uid}-pt" x1="0" y1="0" x2="1" y2="0">` +
    `<stop offset="0" stop-color="${ink.fruitDeep}" /><stop offset="1" stop-color="${ink.fruit}" /></linearGradient>`
  )
}

/** One leaf, placed and rotated. `plane` chooses how far back it sits. */
function leaf(
  at: Pt,
  deg: number,
  shape: LeafShape,
  len: number,
  wid: number,
  ink: HeroInk,
  style: HeroStyle,
  plane: 'back' | 'mid' | 'front',
  uid?: string,
  curl = 0,
): string {
  const tone = plane === 'back' ? ink.leafDeep : plane === 'mid' ? ink.leafMid : ink.leaf
  /*
   * Engraving is a line, and a line has to carry the whole shape on its own. Drawn in the leaf's
   * own mid tone at a hairline weight it washed out to nothing on a cream ground — measured by
   * eye against the solid version, which reads at a glance where the outline did not. So the
   * outline takes the darker stem tone and roughly twice the weight, and the back layer keeps its
   * receding tone so depth survives the loss of fill.
   */
  const line = plane === 'back' ? ink.leafDeep : plane === 'mid' ? ink.leafMid : ink.stem
  const ramp = uid ? `url(#${uid}-${plane === 'back' ? 'lb' : plane === 'mid' ? 'lm' : 'lf'})` : tone
  const d = leafPath(shape, len, wid)
  const body =
    style === 'engraved'
      ? `<path d="${d}" fill="none" stroke="${line}" stroke-width="${f(Math.max(len * 0.026, 0.16))}" stroke-linejoin="round" />`
      : `<path d="${d}" fill="${ramp}" />`
  /*
   * The fold. A leaf that lies perfectly flat is the giveaway of a drawn one — real foliage turns,
   * and the turned half falls into shadow. Drawing that as a darker sliver along one side of the
   * midrib costs one path and does more for the "photographed specimen" read than another vein.
   */
  const fold =
    curl > 0.02 && style === 'solid' && shape !== 'needle'
      ? `<path d="M${f(len * 0.06)} 0 Q${f(len * 0.45)} ${f(-wid * curl * 1.5)} ${f(len * 0.95)} 0 Q${f(len * 0.45)} ${f(-wid * curl * 0.2)} ${f(len * 0.06)} 0Z" fill="${plane === 'front' ? ink.leaf : ink.leafDeep}" fill-opacity="0.5" />`
      : ''
  const veins =
    shape === 'needle'
      ? ''
      : leafVeins(len, wid, style === 'engraved' ? line : ink.stem, Math.max(len * (style === 'engraved' ? 0.018 : 0.011), 0.1), style === 'engraved')
  return `<g transform="translate(${f(at.x)} ${f(at.y)}) rotate(${f(deg)})">${body}${fold}${veins}</g>`
}

/* -------------------------------------------------------------------- fruit */

/**
 * A round fruit with one crescent of shade and the stub of a calyx.
 *
 * Built from two offset ellipses rather than an arc pair. The first attempt drew the crescent as
 * two arcs with different radii, which self-intersects once the radius grows — on the cocoa pod it
 * came out as a pale wedge sitting across the stem. Two solid ellipses cannot do that.
 */
function orb(cx: number, cy: number, rx: number, ry: number, ink: HeroInk, style: HeroStyle): string {
  if (style === 'engraved') {
    let hatch = ''
    for (let i = 1; i <= 3; i++) {
      const t = i / 4
      const y = cy - ry + ry * 2 * t
      const half = rx * Math.sin(Math.acos(Math.max(-1, Math.min(1, (y - cy) / ry)))) * 0.82
      hatch += `<path d="M${f(cx + half * 0.1)} ${f(y)} L${f(cx + half)} ${f(y)}" stroke="${ink.fruitDeep}" stroke-width="${f(rx * 0.09)}" stroke-linecap="round" stroke-opacity="0.7" fill="none" />`
    }
    return (
      `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="none" stroke="${ink.fruit}" stroke-width="${f(rx * 0.17)}" />` +
      hatch
    )
  }
  return (
    `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${ink.fruitDeep}" />` +
    `<ellipse cx="${f(cx - rx * 0.2)}" cy="${f(cy - ry * 0.14)}" rx="${f(rx * 0.92)}" ry="${f(ry * 0.92)}" fill="${ink.fruit}" />`
  )
}

/** Elongated ridged pod — cocoa, cardamom, vanilla. A pod is a shape, not a berry. */
function pod(cx: number, cy: number, len: number, wid: number, deg: number, ink: HeroInk, style: HeroStyle): string {
  const ridges: string[] = []
  for (let i = 1; i <= 3; i++) {
    const t = i / 4
    ridges.push(
      `<path d="M${f(-len * 0.42)} ${f((-wid + wid * 2 * t) * 0.62)} Q0 ${f((-wid + wid * 2 * t) * 1.02)} ${f(len * 0.42)} ${f((-wid + wid * 2 * t) * 0.62)}" fill="none" stroke="${ink.fruitDeep}" stroke-opacity="0.55" stroke-width="${f(wid * 0.07)}" />`,
    )
  }
  const body =
    style === 'engraved'
      ? `<ellipse cx="0" cy="0" rx="${f(len * 0.5)}" ry="${f(wid)}" fill="none" stroke="${ink.fruit}" stroke-width="${f(wid * 0.17)}" />`
      : `<ellipse cx="0" cy="0" rx="${f(len * 0.5)}" ry="${f(wid)}" fill="${ink.fruitDeep}" />` +
        `<ellipse cx="${f(-len * 0.04)}" cy="${f(-wid * 0.12)}" rx="${f(len * 0.47)}" ry="${f(wid * 0.9)}" fill="${ink.fruit}" />`
  return `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${f(deg)})">${body}${ridges.join('')}</g>`
}

/* ------------------------------------------------------------------ blooms */

/** Ray petals around a disc — chamomile, calendula, daisy. */
function daisy(cx: number, cy: number, r: number, ink: HeroInk, style: HeroStyle, rng: Rng): string {
  const petals: string[] = []
  const n = 11
  for (let i = 0; i < n; i++) {
    const deg = (i / n) * 360 + rng() * 6
    const len = r * (0.92 + rng() * 0.22)
    const wid = len * 0.3
    petals.push(
      style === 'engraved'
        ? `<path transform="translate(${f(cx)} ${f(cy)}) rotate(${f(deg)})" d="${leafPath('obovate', len, wid)}" fill="none" stroke="${ink.fruit}" stroke-width="${f(r * 0.055)}" />`
        : `<path transform="translate(${f(cx)} ${f(cy)}) rotate(${f(deg)})" d="${leafPath('obovate', len, wid)}" fill="${ink.fruit}" />`,
    )
  }
  const disc =
    style === 'engraved'
      ? `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.32)}" fill="none" stroke="${ink.fruitDeep}" stroke-width="${f(r * 0.07)}" />`
      : `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.32)}" fill="${ink.fruitDeep}" />`
  return petals.join('') + disc
}

/** Whorled florets climbing a stem — lavender, salvia, hyssop. */
function spike(cx: number, cy: number, len: number, deg: number, ink: HeroInk, style: HeroStyle, rng: Rng): string {
  const rows = 8
  const w = len * 0.17
  let g = `<path d="M0 0 L${f(len)} 0" fill="none" stroke="${ink.stem}" stroke-width="${f(len * 0.035)}" stroke-linecap="round" />`
  for (let i = 0; i < rows; i++) {
    const t = 0.14 + (i / rows) * 0.82
    // The spike narrows to its tip, which is most of what makes it read as lavender rather than
    // a row of dots.
    const s = w * (1 - t * 0.55) * (0.85 + rng() * 0.3)
    for (const side of [-1, 1]) {
      g +=
        style === 'engraved'
          ? `<ellipse cx="${f(len * t)}" cy="${f(side * s * 0.62)}" rx="${f(s * 0.92)}" ry="${f(s * 0.66)}" fill="none" stroke="${ink.fruit}" stroke-width="${f(s * 0.24)}" />`
          : `<ellipse cx="${f(len * t)}" cy="${f(side * s * 0.62)}" rx="${f(s * 0.92)}" ry="${f(s * 0.66)}" fill="${side < 0 ? ink.fruitDeep : ink.fruit}" />`
    }
  }
  return `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${f(deg)})">${g}</g>`
}

/** Stalks radiating to a flat head of tiny florets — elder, dill, yarrow, and what honey reads as. */
function umbel(cx: number, cy: number, r: number, ink: HeroInk, style: HeroStyle, rng: Rng): string {
  let g = ''
  const n = 9
  for (let i = 0; i < n; i++) {
    const deg = -170 + (i / (n - 1)) * 160
    const a = (deg * Math.PI) / 180
    const reach = r * (0.72 + rng() * 0.34)
    const ex = cx + Math.cos(a) * reach
    const ey = cy + Math.sin(a) * reach
    g += `<path d="M${f(cx)} ${f(cy)} Q${f(cx + Math.cos(a) * reach * 0.5)} ${f(cy + Math.sin(a) * reach * 0.62)} ${f(ex)} ${f(ey)}" fill="none" stroke="${ink.stem}" stroke-width="${f(r * 0.035)}" stroke-linecap="round" />`
    const fr = r * 0.17
    g +=
      style === 'engraved'
        ? `<circle cx="${f(ex)}" cy="${f(ey)}" r="${f(fr)}" fill="none" stroke="${ink.fruit}" stroke-width="${f(fr * 0.42)}" />`
        : `<circle cx="${f(ex)}" cy="${f(ey)}" r="${f(fr)}" fill="${i % 2 ? ink.fruit : ink.fruitDeep}" />`
  }
  return g
}

/**
 * An open face of overlapping petals with a stamen boss — camellia, magnolia, wild rose.
 *
 * The one element on a premium botanical pack that carries the whole design, so it gets modelling
 * the leaves do not: every petal is its own shape with its own light, laid in two rings that
 * overlap, and the centre is drawn rather than implied — filaments with anthers on the ends.
 * Measured against the reference, that boss is what the eye lands on; without it the same petals
 * read as a paper rosette.
 */
function corolla(cx: number, cy: number, r: number, ink: HeroInk, style: HeroStyle, rng: Rng, uid?: string): string {
  const parts: string[] = []
  const rings = [
    { n: 7, rr: r, wid: 0.88, tone: ink.fruitDeep, twist: 0 },
    { n: 6, rr: r * 0.7, wid: 0.92, tone: ink.fruit, twist: 26 },
  ]
  for (const ring of rings) {
    for (let i = 0; i < ring.n; i++) {
      const deg = (i / ring.n) * 360 + ring.twist + (rng() - 0.5) * 9
      const len = ring.rr * (0.9 + rng() * 0.2)
      /*
       * Broad and round-ended, not pointed. The first petal tapered to a tip, which is a star and
       * not a flower — a camellia petal is widest past halfway and ends in a soft curve, and seven
       * of those overlapping is what fills a corolla instead of spoking it.
       */
      const w = len * ring.wid * 0.5
      const petal =
        `M0 0 C${f(len * 0.12)} ${f(-w * 0.85)} ${f(len * 0.52)} ${f(-w * 1.12)} ${f(len * 0.86)} ${f(-w * 0.62)} ` +
        `C${f(len * 1.06)} ${f(-w * 0.3)} ${f(len * 1.06)} ${f(w * 0.3)} ${f(len * 0.86)} ${f(w * 0.62)} ` +
        `C${f(len * 0.52)} ${f(w * 1.12)} ${f(len * 0.12)} ${f(w * 0.85)} 0 0Z`
      parts.push(
        style === 'engraved'
          ? `<path transform="translate(${f(cx)} ${f(cy)}) rotate(${f(deg)})" d="${petal}" fill="none" stroke="${ring.tone}" stroke-width="${f(r * 0.055)}" stroke-linejoin="round" />`
          : `<path transform="translate(${f(cx)} ${f(cy)}) rotate(${f(deg)})" d="${petal}" fill="${uid ? `url(#${uid}-pt)` : ring.tone}" />` +
            `<path transform="translate(${f(cx)} ${f(cy)}) rotate(${f(deg)})" d="M${f(len * 0.1)} 0 L${f(len * 0.88)} 0" fill="none" stroke="${ink.fruitDeep}" stroke-width="${f(r * 0.022)}" stroke-opacity="0.45" />`,
      )
    }
  }
  const boss = r * 0.3
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + rng() * 0.2
    const reach = boss * (0.7 + rng() * 0.6)
    const ex = cx + Math.cos(a) * reach
    const ey = cy + Math.sin(a) * reach
    parts.push(
      `<path d="M${f(cx)} ${f(cy)} L${f(ex)} ${f(ey)}" fill="none" stroke="${ink.fruitDeep}" stroke-width="${f(r * 0.02)}" stroke-opacity="0.8" />`,
    )
    parts.push(`<circle cx="${f(ex)}" cy="${f(ey)}" r="${f(r * 0.035)}" fill="${ink.leafLight}" />`)
  }
  parts.push(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(boss * 0.45)}" fill="${ink.fruitDeep}" />`)
  return parts.join('')
}

/**
 * A rose, drawn the way a rose is actually legible at small size.
 *
 * The first attempt fanned obovate petals out from one point, which is how a daisy works and not a
 * rose: measured by eye it came back as a gold lump with no centre. A rose reads by its *nested*
 * structure — an outer cup, two or three cupped bands inside it, and a tight curl at the middle.
 * So the petals are concentric here rather than radiating, and the curl is what the eye lands on.
 */
function cup(cx: number, cy: number, r: number, ink: HeroInk, style: HeroStyle, rng: Rng): string {
  /*
   * The nested-band rose only earns its complexity when it is the focal bloom.
   *
   * The threshold here was first guessed at 4 mm and never fired. Measured instead, on an 80 mm
   * label: the drawn subject comes out 61.5 mm, which puts a wreath rose at 8.1 mm and a focal one
   * at 12.3 mm. At 8 mm three concentric arcs do not read as petals, they read as a target — the
   * ring sat on the label looking like an eye. 10 mm separates the two cases cleanly, and below it
   * five rounded petals around a centre is the cruder rose and the far better small one.
   */
  if (r < 10) {
    const petals: string[] = []
    for (let i = 0; i < 5; i++) {
      const deg = (i / 5) * 360 + rng() * 8
      petals.push(
        `<path transform="translate(${f(cx)} ${f(cy)}) rotate(${f(deg)})" d="${leafPath('obovate', r, r * 0.62)}" ` +
          (style === 'engraved'
            ? `fill="none" stroke="${ink.fruit}" stroke-width="${f(r * 0.14)}" />`
            : `fill="${ink.fruit}" />`),
      )
    }
    return (
      petals.join('') +
      `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.3)}" ` +
      (style === 'engraved'
        ? `fill="none" stroke="${ink.fruitDeep}" stroke-width="${f(r * 0.14)}" />`
        : `fill="${ink.fruitDeep}" />`)
    )
  }
  const parts: string[] = []
  const wob = 1 + (rng() - 0.5) * 0.12
  const outer =
    `M${f(cx)} ${f(cy - r * wob)} C${f(cx + r * 1.12)} ${f(cy - r * 0.86)} ${f(cx + r * 0.98)} ${f(cy + r * 0.72)} ${f(cx)} ${f(cy + r)} ` +
    `C${f(cx - r * 0.98)} ${f(cy + r * 0.72)} ${f(cx - r * 1.12)} ${f(cy - r * 0.86)} ${f(cx)} ${f(cy - r * wob)}Z`
  parts.push(
    style === 'engraved'
      ? `<path d="${outer}" fill="none" stroke="${ink.fruitDeep}" stroke-width="${f(r * 0.1)}" />`
      : `<path d="${outer}" fill="${ink.fruitDeep}" />`,
  )
  // Cupped bands, each a little smaller and a little lower, alternating tone so the layering reads
  // even when the whole head is one hue.
  for (let i = 1; i <= 3; i++) {
    const rr = r * (1 - i * 0.2)
    const dy = cy + r * 0.07 * i
    parts.push(
      `<path d="M${f(cx - rr)} ${f(dy)} A${f(rr)} ${f(rr * 0.92)} 0 0 1 ${f(cx + rr)} ${f(dy)}" fill="none" ` +
        `stroke="${i % 2 ? ink.fruit : ink.fruitDeep}" stroke-width="${f(r * 0.15)}" stroke-linecap="round" />`,
    )
  }
  parts.push(
    `<path d="M${f(cx - r * 0.2)} ${f(cy + r * 0.12)} A${f(r * 0.22)} ${f(r * 0.22)} 0 1 1 ${f(cx + r * 0.18)} ${f(cy + r * 0.02)}" ` +
      `fill="none" stroke="${ink.fruit}" stroke-width="${f(r * 0.13)}" stroke-linecap="round" />`,
  )
  return parts.join('')
}

/** A hanging bunch of small orbs — grape, elderberry, currant. */
function cluster(cx: number, cy: number, r: number, ink: HeroInk, style: HeroStyle, rng: Rng): string {
  let g = ''
  const rows = 4
  for (let row = 0; row < rows; row++) {
    const count = rows - row
    const y = cy + row * r * 0.52
    for (let i = 0; i < count; i++) {
      const x = cx + (i - (count - 1) / 2) * r * 0.62
      const rr = r * 0.32 * (0.9 + rng() * 0.2)
      g += orb(x, y, rr, rr * 1.05, ink, style)
    }
  }
  return g
}

/**
 * A bee, at the scale a bloom is drawn.
 *
 * Kept to the silhouette a reader completes for themselves: a banded body, a small head, two wings
 * set back. Anything more — legs, antennae, a face — turns to noise below a couple of millimetres
 * and prints as a smudge, which is the same reason the plates this repertoire came from draw
 * insects as shapes rather than as diagrams.
 */
function bee(cx: number, cy: number, r: number, deg: number, ink: HeroInk, style: HeroStyle): string {
  const bodyL = r * 1.25
  const bodyW = r * 0.62
  const line = Math.max(0.1, r * 0.1)
  const wing = (sign: 1 | -1) =>
    `<ellipse cx="${f(-bodyL * 0.1)}" cy="${f(sign * bodyW * 0.78)}" rx="${f(bodyL * 0.52)}" ry="${f(bodyW * 0.44)}" transform="rotate(${sign * 22} ${f(-bodyL * 0.1)} ${f(sign * bodyW * 0.78)})" fill="${ink.leafLight}" fill-opacity="${style === 'engraved' ? 0 : 0.5}" stroke="${ink.leafDeep}" stroke-width="${f(line * 0.8)}" stroke-opacity="0.75" />`
  const bands = [0.1, 0.42].map(
    (t) =>
      `<path d="M${f(-bodyL * 0.5 + bodyL * t)} ${f(-bodyW * 0.82)} L${f(-bodyL * 0.5 + bodyL * t)} ${f(bodyW * 0.82)}" stroke="${ink.leafDeep}" stroke-width="${f(line * 1.5)}" stroke-linecap="round" fill="none" />`,
  )
  const body =
    style === 'engraved'
      ? `<ellipse cx="0" cy="0" rx="${f(bodyL * 0.5)}" ry="${f(bodyW)}" fill="none" stroke="${ink.fruit}" stroke-width="${f(line * 1.4)}" />`
      : `<ellipse cx="0" cy="0" rx="${f(bodyL * 0.5)}" ry="${f(bodyW)}" fill="${ink.fruit}" />`
  const head = `<circle cx="${f(bodyL * 0.56)}" cy="0" r="${f(bodyW * 0.52)}" fill="${style === 'engraved' ? 'none' : ink.fruitDeep}" stroke="${ink.fruitDeep}" stroke-width="${f(line)}" />`
  return `<g data-hero-mark="bee" transform="translate(${f(cx)} ${f(cy)}) rotate(${f(deg)})">${wing(-1)}${wing(1)}${body}${bands.join('')}${head}</g>`
}

/**
 * Labelled like `data-hero` and `data-bg` are, so the markup says what it drew.
 *
 * Not decoration: the first test written against blooms compared markup length and failed on
 * lavender, whose needle leaves skip veins and so produce a quarter of the characters a mint does.
 * Length was never the question — "is there a flower, and which one" was, and output that names
 * itself can be asked that directly.
 */
function bloom(kind: BloomKind, cx: number, cy: number, r: number, deg: number, ink: HeroInk, style: HeroStyle, rng: Rng, uid?: string): string {
  const body = (() => {
    switch (kind) {
      case 'daisy':
        return daisy(cx, cy, r, ink, style, rng)
      case 'spike':
        return spike(cx, cy, r * 2.6, deg, ink, style, rng)
      case 'umbel':
        return umbel(cx, cy, r * 1.5, ink, style, rng)
      case 'cup':
        return cup(cx, cy, r, ink, style, rng)
      case 'cluster':
        return cluster(cx, cy, r, ink, style, rng)
      case 'corolla':
        return corolla(cx, cy, r, ink, style, rng, uid)
      case 'none':
      default:
        return ''
    }
  })()
  return body ? `<g data-bloom="${kind}">${body}</g>` : ''
}

/* -------------------------------------------------------------- arrangements */

type Plant = {
  shape: LeafShape
  /** Leaf length as a fraction of `size`. */
  leafLen: number
  /** Leaf width as a fraction of its own length. */
  leafWid: number
  count: number
  /** How far leaves open from the stem, in degrees. */
  spread: number
  fruit: number
  fruitR: number
  round?: boolean
  podded?: boolean
  /** What it flowers as, and how big the head is as a fraction of `size`. */
  bloom?: BloomKind
  bloomR?: number
  /** How many blooms sit on the stem. */
  blooms?: number
  /**
   * Draw a bee working the top bloom.
   *
   * Only honey asks for this, and it is the reason honey stopped being wheat and then stopped
   * being a dark umbel: a flower alone says "botanical", and the owner's note was that a honey box
   * has to say *honey*. A bee is the one mark nobody has to be told the meaning of.
   */
  pollinator?: boolean
}

const PLANTS: Record<Species, Plant> = {
  olive: { shape: 'lanceolate', leafLen: 0.3, leafWid: 0.2, count: 7, spread: 58, fruit: 3, fruitR: 0.042 },
  coffee: { shape: 'ovate', leafLen: 0.4, leafWid: 0.33, count: 5, spread: 78, fruit: 4, fruitR: 0.052, round: true },
  tea: { shape: 'serrate', leafLen: 0.29, leafWid: 0.3, count: 8, spread: 50, fruit: 0, fruitR: 0 },
  grain: { shape: 'needle', leafLen: 0.26, leafWid: 0.13, count: 9, spread: 34, fruit: 0, fruitR: 0 },
  citrus: { shape: 'ovate', leafLen: 0.34, leafWid: 0.3, count: 5, spread: 70, fruit: 2, fruitR: 0.07, round: true },
  cocoa: { shape: 'obovate', leafLen: 0.44, leafWid: 0.36, count: 4, spread: 72, fruit: 2, fruitR: 0.05, podded: true },
  flora: { shape: 'ovate', leafLen: 0.36, leafWid: 0.32, count: 7, spread: 64, fruit: 0, fruitR: 0, bloom: 'corolla', bloomR: 0.3, blooms: 1 },
  conifer: { shape: 'needle', leafLen: 0.3, leafWid: 0.11, count: 11, spread: 40, fruit: 0, fruitR: 0 },
  aloe: { shape: 'succulent', leafLen: 0.32, leafWid: 0.42, count: 9, spread: 55, fruit: 0, fruitR: 0 },
  // Flowering species. The leaf still does the work of saying which plant it is; the bloom is what
  // makes it read as the *fragrance or infusion* of that plant rather than the crop.
  lavender: { shape: 'needle', leafLen: 0.24, leafWid: 0.1, count: 8, spread: 30, fruit: 0, fruitR: 0, bloom: 'spike', bloomR: 0.07, blooms: 3 },
  chamomile: { shape: 'needle', leafLen: 0.22, leafWid: 0.14, count: 10, spread: 44, fruit: 0, fruitR: 0, bloom: 'daisy', bloomR: 0.13, blooms: 3 },
  rose: { shape: 'serrate', leafLen: 0.28, leafWid: 0.32, count: 6, spread: 58, fruit: 0, fruitR: 0, bloom: 'cup', bloomR: 0.2, blooms: 1 },
  mint: { shape: 'serrate', leafLen: 0.3, leafWid: 0.36, count: 8, spread: 56, fruit: 0, fruitR: 0 },
  grape: { shape: 'serrate', leafLen: 0.36, leafWid: 0.42, count: 5, spread: 66, fruit: 0, fruitR: 0, bloom: 'cluster', bloomR: 0.1, blooms: 2 },
  berry: { shape: 'ovate', leafLen: 0.3, leafWid: 0.34, count: 6, spread: 62, fruit: 0, fruitR: 0, bloom: 'cluster', bloomR: 0.085, blooms: 2 },
  /*
   * Honey. The bloom was an `umbel`, which draws as a tight head of small dark orbs and reads as
   * elderberry rather than as a flower — measured against the rendered face, the honey label was
   * the one specimen a reader could not name. A `daisy` is unmistakably a flower, and the bee is
   * what makes it unmistakably honey.
   */
  blossom: { shape: 'lanceolate', leafLen: 0.26, leafWid: 0.24, count: 7, spread: 54, fruit: 0, fruitR: 0, bloom: 'daisy', bloomR: 0.13, blooms: 2, pollinator: true },
}

/** Leaves and fruit set along a curve. `p0→p2` is the stem; everything hangs off it. */
function alongStem(
  p0: Pt,
  p1: Pt,
  p2: Pt,
  size: number,
  plant: Plant,
  ink: HeroInk,
  style: HeroStyle,
  seed: number,
  opts: { tipFruit?: boolean; uid?: string } = {},
): string {
  const rng = rngOf(seed)
  const back: string[] = []
  const mid: string[] = []
  const front: string[] = []
  for (let i = 0; i < plant.count; i++) {
    const t = 0.06 + (i / Math.max(1, plant.count - 1)) * 0.88
    const at = qAt(p0, p1, p2, t)
    const stemDeg = qDeg(p0, p1, p2, t)
    /*
     * Leaves shorten toward the tip. Before this the only variation along a bough was jitter, so
     * the silhouette came out as a slab of equal-length blades — a plant puts its biggest leaves
     * low, where the stem is thickest, and the taper is most of what reads as growth.
     */
    const taper = 1 - t * 0.34
    const len = size * plant.leafLen * taper * (0.86 + rng() * 0.3)
    const wid = len * plant.leafWid
    const side = i % 2 === 0 ? 1 : -1
    const backDeg = stemDeg + side * (plant.spread + 16 + rng() * 10)
    const frontDeg = stemDeg - side * (plant.spread - 4 + rng() * 12)
    /*
     * A leaf hanging below the branch is natural — olive does it — but on the broad-leaved species
     * a full-length one swings down through the middle of the composition and reads as a blade
     * lying across the drawing rather than as foliage. Shortening the downward ones keeps the
     * centre open, which is also how these plants carry their weight.
     */
    const drop = (deg: number) => (Math.sin((deg * Math.PI) / 180) > 0.25 ? 0.72 : 1)
    back.push(leaf(at, backDeg, plant.shape, len * 1.1 * drop(backDeg), wid * 0.95, ink, style, 'back', opts.uid))
    front.push(leaf(at, frontDeg, plant.shape, len * drop(frontDeg), wid, ink, style, 'front', opts.uid, rng() * 0.55))
    /*
     * A third plane, every other node. Two layers give you "in front of" and nothing else; the
     * middle value is what lets the eye read a depth of foliage rather than a cut-out pasted on a
     * silhouette. Half density on purpose — a full third layer closes the gaps that make the
     * other two legible.
     */
    if (i % 2 === 1) {
      mid.push(
        leaf(at, (backDeg + frontDeg) / 2 + (rng() - 0.5) * 14, plant.shape, len * 0.88, wid * 0.9, ink, style, 'mid', opts.uid, rng() * 0.35),
      )
    }
  }

  const stem =
    `<path d="M${f(p0.x)} ${f(p0.y)} Q${f(p1.x)} ${f(p1.y)} ${f(p2.x)} ${f(p2.y)}" fill="none" ` +
    `stroke="${ink.stem}" stroke-width="${f(size * 0.016)}" stroke-linecap="round" />`

  const fruits: string[] = []
  for (let i = 0; i < plant.fruit; i++) {
    const t = opts.tipFruit ? 0.62 + (i / Math.max(1, plant.fruit)) * 0.3 : 0.26 + (i / Math.max(1, plant.fruit)) * 0.54
    const at = qAt(p0, p1, p2, t)
    const r = size * plant.fruitR * (0.88 + rng() * 0.24)
    const dy = r * (1.5 + rng() * 0.7)
    const dx = (rng() - 0.5) * r * 1.2
    fruits.push(
      `<path d="M${f(at.x + dx)} ${f(at.y)} L${f(at.x + dx)} ${f(at.y + dy - r)}" fill="none" stroke="${ink.stem}" stroke-width="${f(size * 0.009)}" />`,
    )
    fruits.push(
      plant.podded
        ? pod(at.x + dx, at.y + dy + r * 0.4, r * 3.4, r * 1.25, 74 + (rng() - 0.5) * 18, ink, style)
        : orb(at.x + dx, at.y + dy, r, r * (plant.round ? 1 : 1.18), ink, style),
    )
  }
  const heads: string[] = []
  if (plant.bloom && plant.bloom !== 'none') {
    const n = plant.blooms ?? 1
    const r = size * (plant.bloomR ?? 0.1)
    for (let i = 0; i < n; i++) {
      // Blooms ride the last third of the stem: a flower opens at the growing end, and putting one
      // low on the branch is the tell that a drawing was assembled rather than observed.
      const t = 0.58 + (i / Math.max(1, n)) * 0.38
      const at = qAt(p0, p1, p2, t)
      const deg = qDeg(p0, p1, p2, t) - 90 + (rng() - 0.5) * 22
      heads.push(bloom(plant.bloom, at.x, at.y, r * (0.86 + rng() * 0.28), deg, ink, style, rng, opts.uid))
      // The bee works the topmost bloom, set off its edge so it reads as approaching rather than sitting on it.
      if (plant.pollinator && i === n - 1) {
        const away = ((deg + 120) * Math.PI) / 180
        heads.push(bee(at.x + Math.cos(away) * r * 1.5, at.y + Math.sin(away) * r * 1.5, r * 0.62, deg + 150, ink, style))
      }
    }
  }

  return back.join('') + stem + mid.join('') + front.join('') + fruits.join('') + heads.join('')
}

/** The wide arch: a cut bough laid across the face. */
function arch(cx: number, cy: number, size: number, plant: Plant, ink: HeroInk, style: HeroStyle, seed: number, uid: string): string {
  return `<g data-hero="arch">${alongStem(
    { x: cx - size * 0.44, y: cy + size * 0.3 },
    { x: cx + size * 0.02, y: cy - size * 0.46 },
    { x: cx + size * 0.46, y: cy + size * 0.2 },
    size,
    plant,
    ink,
    style,
    seed,
    { uid },
  )}</g>`
}

/** A single upright stem — the tall composition, for a narrow face or a centred lockup. */
function uprightSprig(cx: number, cy: number, size: number, plant: Plant, ink: HeroInk, style: HeroStyle, seed: number, uid: string): string {
  const lean = (rngOf(seed)() - 0.5) * size * 0.12
  return `<g data-hero="sprig">${alongStem(
    { x: cx + lean, y: cy + size * 0.48 },
    { x: cx - lean * 0.6, y: cy },
    { x: cx + lean * 0.3, y: cy - size * 0.48 },
    size,
    plant,
    ink,
    style,
    seed,
    { tipFruit: true, uid },
  )}</g>`
}

/**
 * The asymmetric spray: mass low on one side, stems rising away, one bloom carrying the top.
 *
 * Every other arrangement here is symmetric about a centre, which is what makes a drawing read as
 * an ornament. The premium botanical packs are not symmetric — they pile foliage into one corner
 * and let a single flower do the work at the opposite end, so the eye travels instead of settling.
 * That diagonal, and the fact that there is exactly *one* focal bloom rather than a scatter, is
 * most of the distance between "decorated" and "art directed".
 */
function spray(cx: number, cy: number, size: number, plant: Plant, ink: HeroInk, style: HeroStyle, seed: number, uid: string): string {
  const rng = rngOf(seed)
  const mirror = rng() > 0.5 ? 1 : -1
  const foot = { x: cx - mirror * size * 0.34, y: cy + size * 0.46 }
  // The long rising stem carries the bloom; two shorter ones fill the low mass behind it.
  const lead: Plant = { ...plant, count: Math.max(4, plant.count), blooms: plant.bloom ? 1 : 0 }
  const fill: Plant = { ...plant, count: Math.max(3, Math.round(plant.count * 0.55)), bloom: 'none', fruit: Math.max(0, plant.fruit - 1) }
  const parts = [
    alongStem(foot, { x: cx, y: cy + size * 0.12 }, { x: cx + mirror * size * 0.3, y: cy - size * 0.46 }, size, lead, ink, style, seed, { uid, tipFruit: true }),
    alongStem(foot, { x: cx - mirror * size * 0.28, y: cy + size * 0.1 }, { x: cx - mirror * size * 0.18, y: cy - size * 0.24 }, size * 0.78, fill, ink, style, seed + 17, { uid }),
    alongStem(foot, { x: cx + mirror * size * 0.02, y: cy + size * 0.3 }, { x: cx + mirror * size * 0.42, y: cy + size * 0.16 }, size * 0.62, fill, ink, style, seed + 41, { uid }),
  ]
  // Back to front: the low filler first, the bloom-bearing stem last so nothing crosses the flower.
  return `<g data-hero="spray">${parts[1]}${parts[2]}${parts[0]}</g>`
}

/** Two stems crossing low — the classic herbal pair. */
function crossed(cx: number, cy: number, size: number, plant: Plant, ink: HeroInk, style: HeroStyle, seed: number, uid: string): string {
  const half: Plant = { ...plant, count: Math.max(3, Math.round(plant.count * 0.6)), fruit: Math.max(0, Math.round(plant.fruit / 2)) }
  const foot = { x: cx, y: cy + size * 0.46 }
  const one = alongStem(foot, { x: cx - size * 0.3, y: cy - size * 0.05 }, { x: cx - size * 0.42, y: cy - size * 0.44 }, size, half, ink, style, seed, { uid })
  const two = alongStem(foot, { x: cx + size * 0.3, y: cy - size * 0.05 }, { x: cx + size * 0.42, y: cy - size * 0.44 }, size, half, ink, style, seed + 31, { uid })
  return `<g data-hero="crossed">${one}${two}</g>`
}

/**
 * Leaves set around an open ring.
 *
 * The most packaging-idiomatic arrangement there is, and the one that most needs restraint: the
 * ring stays open at the top so a monogram or a date can sit inside it, and the leaves are laid
 * tangentially rather than radiating like a sun.
 */
function wreath(cx: number, cy: number, size: number, plant: Plant, ink: HeroInk, style: HeroStyle, seed: number, uid: string): string {
  const rng = rngOf(seed)
  const r = size * 0.36
  const n = Math.max(8, plant.count * 2)
  const gap = 52
  const back: string[] = []
  const front: string[] = []
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const deg = -90 + gap / 2 + t * (360 - gap)
    const a = (deg * Math.PI) / 180
    const at = { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }
    const len = size * plant.leafLen * 0.62 * (0.85 + rng() * 0.3)
    const wid = len * plant.leafWid
    // Tangential: the leaf lies along the ring, tilted out, which is what keeps it from reading
    // as a sunburst.
    const tangent = deg + 90
    back.push(leaf(at, tangent + 30 + rng() * 10, plant.shape, len * 1.08, wid * 0.95, ink, style, 'back', uid))
    front.push(leaf(at, tangent - 22 - rng() * 10, plant.shape, len, wid, ink, style, 'front', uid, rng() * 0.4))
  }
  /*
   * A flowering wreath, and the reason is a range rather than a single face.
   *
   * Binding the arrangement to the line seed — so four SKUs of one brand share a composition —
   * cost the thing that told them apart: a rose and a chamomile in a leaf-only wreath are the same
   * picture. Blooms on the ring restore it without touching the layout, which is exactly how a
   * botanical range works: the same wreath, a different flower.
   */
  const heads: string[] = []
  if (plant.bloom && plant.bloom !== 'none') {
    const spots = [0.12, 0.5, 0.88]
    for (const t of spots) {
      const deg = -90 + gap / 2 + t * (360 - gap)
      const a = (deg * Math.PI) / 180
      heads.push(
        bloom(
          plant.bloom,
          cx + Math.cos(a) * r,
          cy + Math.sin(a) * r,
          size * (plant.bloomR ?? 0.1) * 0.66,
          deg + 90,
          ink,
          style,
          rng,
          uid,
        ),
      )
    }
  }

  const ringA = (-90 + gap / 2) * (Math.PI / 180)
  const ringB = (270 - gap / 2) * (Math.PI / 180)
  const ring =
    `<path d="M${f(cx + Math.cos(ringA) * r)} ${f(cy + Math.sin(ringA) * r)} ` +
    `A${f(r)} ${f(r)} 0 1 1 ${f(cx + Math.cos(ringB) * r)} ${f(cy + Math.sin(ringB) * r)}" ` +
    `fill="none" stroke="${ink.stem}" stroke-width="${f(size * 0.012)}" stroke-linecap="round" stroke-opacity="0.8" />`
  return `<g data-hero="wreath">${back.join('')}${ring}${front.join('')}${heads.join('')}</g>`
}

/** Thick succulent blades opening from one base — aloe, agave, any rosette. */
function rosette(cx: number, cy: number, size: number, plant: Plant, ink: HeroInk, style: HeroStyle, seed: number, uid: string): string {
  const rng = rngOf(seed)
  const base: Pt = { x: cx, y: cy + size * 0.42 }
  const back: string[] = []
  const front: string[] = []
  const n = plant.count
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    // Outer blades lie further over; the centre ones stand up. Length falls off towards the edge,
    // which is what gives a rosette its dome rather than a fan.
    const lean = Math.abs(t - 0.5) * 2
    const deg = -160 + t * 140 + (rng() - 0.5) * 8
    /*
     * A rosette blade runs most of the drawing's height, which is nothing like the leaf length the
     * same plant wears on a bough — so the length is the arrangement's business, not the species'.
     * Reading `leafLen` here was the bug that put a 0.86×size blade through `arch` and off the
     * panel; `leafWid` now means the same thing everywhere: a fraction of the leaf's own length.
     */
    const len = size * (0.86 - lean * 0.3) * (0.92 + rng() * 0.16)
    const wid = len * 0.17
    const spot = i % 2 === 0
    ;(spot ? back : front).push(leaf(base, deg, plant.shape, len, wid, ink, style, spot ? 'back' : 'front', uid, spot ? 0 : rng() * 0.3))
  }
  return (
    `<g data-hero="rosette">${back.join('')}${front.join('')}` +
    `<ellipse cx="${f(base.x)}" cy="${f(base.y)}" rx="${f(size * 0.1)}" ry="${f(size * 0.045)}" fill="${ink.stem}" fill-opacity="0.35" />` +
    '</g>'
  )
}

/** A whole fruit beside its cut half — the citrus device every juice and cologne pack uses. */
function citrusPair(cx: number, cy: number, size: number, plant: Plant, ink: HeroInk, style: HeroStyle, seed: number, uid: string): string {
  const rng = rngOf(seed)
  const r = size * 0.3
  const wx = cx - size * 0.16
  const hx = cx + size * 0.3
  const hy = cy + size * 0.1
  const stalk = { x: wx + r * 0.1, y: cy - r * 0.92 }
  const leaves =
    leaf(stalk, -142, plant.shape, size * 0.42, size * 0.042, ink, style, 'back', uid) +
    leaf(stalk, -58, plant.shape, size * 0.34, size * 0.036, ink, style, 'front', uid)

  let segs = ''
  const segN = 7
  for (let i = 0; i < segN; i++) {
    const a0 = -Math.PI / 2 + (i / segN) * Math.PI * 2 + 0.06
    const a1 = -Math.PI / 2 + ((i + 1) / segN) * Math.PI * 2 - 0.06
    const rr = r * 0.78 * (0.94 + rng() * 0.1)
    segs +=
      `<path d="M${f(hx)} ${f(hy)} L${f(hx + Math.cos(a0) * rr)} ${f(hy + Math.sin(a0) * rr)} ` +
      `A${f(rr)} ${f(rr)} 0 0 1 ${f(hx + Math.cos(a1) * rr)} ${f(hy + Math.sin(a1) * rr)}Z" ` +
      (style === 'engraved'
        ? `fill="none" stroke="${ink.fruit}" stroke-width="${f(r * 0.075)}" />`
        : `fill="${ink.fruit}" fill-opacity="0.9" />`)
  }

  const half =
    style === 'engraved'
      ? `<circle cx="${f(hx)}" cy="${f(hy)}" r="${f(r * 0.86)}" fill="none" stroke="${ink.fruitDeep}" stroke-width="${f(r * 0.1)}" />`
      : `<circle cx="${f(hx)}" cy="${f(hy)}" r="${f(r * 0.86)}" fill="${ink.fruitDeep}" />` +
        `<circle cx="${f(hx)}" cy="${f(hy)}" r="${f(r * 0.82)}" fill="${ink.stem}" fill-opacity="0.18" />`

  return `<g data-hero="citrus">${leaves}${orb(wx, cy, r, r, ink, style)}${half}${segs}</g>`
}

/* --------------------------------------------------------------- selection */

const FREE_LAYOUTS: HeroLayout[] = ['spray', 'arch', 'sprig', 'wreath', 'crossed']

/**
 * Which arrangement this seed draws.
 *
 * `aloe` and `citrus` are fixed: a rosette is what an aloe *is*, and the whole-plus-half device is
 * the citrus. Everything else rotates through the four free arrangements, so pressing "variation"
 * changes the picture and not only its colours.
 *
 * `heroAspect` reads the same function, because the layout has to agree with the height the
 * caller reserved for it.
 */
export function heroLayout(species: Species, seed = 1): HeroLayout {
  if (species === 'aloe') return 'rosette'
  if (species === 'citrus') return 'citrus'
  return FREE_LAYOUTS[Math.abs(Math.trunc(seed)) % FREE_LAYOUTS.length]
}

/** Outline botanical roughly one press in three; the rest are solid masses. */
export function heroStyle(seed = 1): HeroStyle {
  return Math.abs(Math.trunc(seed / 7)) % 3 === 0 ? 'engraved' : 'solid'
}

/**
 * How much of `size` the drawing actually fills vertically.
 *
 * An arch is a wide, flat bough; a sprig is taller than it is wide. Sizing every subject inside the
 * same square box left the wide ones floating in a tall band of air, because the limit that bound
 * them was the face's width while the height went unused. The layout uses this to size the subject
 * to the room it really has, and to record a ledger box that matches what is drawn rather than the
 * square it was drawn inside.
 */
export function heroAspect(species: Species, seed = 1): number {
  switch (heroLayout(species, seed)) {
    case 'sprig':
      return 1
    case 'wreath':
      return 0.86
    case 'crossed':
      return 0.9
    case 'spray':
      return 0.94
    case 'rosette':
      return 0.92
    case 'citrus':
      return 0.74
    case 'arch':
    default:
      return 0.56
  }
}

/** The subject, drawn large enough to be the reason the face exists. */
export function speciesHero(
  species: Species,
  cx: number,
  cy: number,
  size: number,
  ink: HeroInk,
  seed = 1,
  opts: HeroOpts = {},
): string {
  const plant = PLANTS[species] ?? PLANTS.flora
  const style = opts.style ?? heroStyle(seed)
  const uid = opts.uid ?? `h${Math.abs(Math.trunc(seed))}`
  const body = (() => {
    switch (opts.layout ?? heroLayout(species, seed)) {
      case 'rosette':
        return rosette(cx, cy, size, plant, ink, style, seed, uid)
      case 'citrus':
        return citrusPair(cx, cy, size, plant, ink, style, seed, uid)
      case 'sprig':
        return uprightSprig(cx, cy, size, plant, ink, style, seed, uid)
      case 'wreath':
        return wreath(cx, cy, size, plant, ink, style, seed, uid)
      case 'crossed':
        return crossed(cx, cy, size, plant, ink, style, seed, uid)
      case 'spray':
        return spray(cx, cy, size, plant, ink, style, seed, uid)
      case 'arch':
      default:
        return arch(cx, cy, size, plant, ink, style, seed, uid)
    }
  })()
  // Engraving has no fills to ramp, so it carries no defs — and an unused gradient in a print file
  // is one more thing for a RIP to decide about.
  return style === 'engraved' ? body : `<defs>${leafGradients(uid, ink)}</defs>${body}`
}
