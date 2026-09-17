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

export type Species = 'olive' | 'coffee' | 'tea' | 'grain' | 'citrus' | 'cocoa' | 'flora' | 'conifer'

const RULES: { re: RegExp; species: Species }[] = [
  { re: /zeytin|olive|sızma|natürel\s*sızma/i, species: 'olive' },
  { re: /kahve|coffee|espresso|filtre|çekirdek|arabica|robusta/i, species: 'coffee' },
  { re: /çay|tea|matcha|bitki\s*çay/i, species: 'tea' },
  { re: /\bbal\b|honey|buğday|wheat|tahıl|grain|kurabiye|biscuit|bisküvi|kraker|ekmek|bread|makarna|bulgur|pirinç/i, species: 'grain' },
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
  // Cosmetics/care read as leafy botany; anything else keeps the neutral conifer scenery.
  if (/kozmetik|krem|serum|şampuan|bakım|sabun|cosmetic|cream|care|bebek|baby/i.test(blob)) return 'flora'
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
    case 'grain':
      return grainStalk(x, baseY, hgt, fill, opacity)
    case 'tea':
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
    case 'grain':
      return sprig(cx, cy, len, angle, fill, opacity, 0, 0.13)
    case 'cocoa':
    case 'flora':
    case 'conifer':
    default:
      return broad(cx, cy, len, angle, fill, opacity)
  }
}
