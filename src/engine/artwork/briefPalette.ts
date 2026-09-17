/**
 * The palette layer.
 *
 * Two inputs meet here and neither owns the result on its own:
 *   - the brief names the **hues** (Phase 15: a colour the customer typed is never dropped),
 *   - the mood decides their **roles** (L2-C: which hue grounds the face, how light, how loud).
 *
 * Getting that split wrong in either direction has already shipped once each way — see the L2-C
 * note above `rolesOf` for what each failure looked like on a face.
 */
import type { DesignBrief, Palette, StyleType } from '../../types'
import { fromHsl, hsl } from '../studio/color'
import { moodPrior } from '../brain/moodPriors'
import { paletteFor } from './paletteTable'

const HEX = /#([0-9a-fA-F]{3,8})\b/g

/**
 * Colour words a brief may actually use. Specific shades come first so "koyu yeşil" does not
 * only register as plain green.
 *
 * Measured 2026-09-17: the old 12-entry table had no pink, purple, orange, blue, yellow or red,
 * so "pembe · mor" matched nothing, fell through to the sector default and the customer got an
 * orange box. A colour the brief names must never be silently dropped.
 */
const NAMED: Array<[RegExp, string]> = [
  // dark / light qualifiers first
  [/koyu\s*ye[sş]il|dark\s*green/i, '#1f4733'],
  [/a[cç][ıi]k\s*ye[sş]il|light\s*green/i, '#7fb069'],
  [/koyu\s*mavi|dark\s*blue/i, '#123a63'],
  [/a[cç][ıi]k\s*mavi|light\s*blue|bebek\s*mavi/i, '#8ec5e3'],
  [/koyu\s*gri|antrasit|charcoal/i, '#2e3235'],
  // named hues
  // Neutral, not a warm near-black: #1a0a0a carries 44% saturation, so a "siyah · beyaz" brief
  // read as chromatic and the vivid temperament derived a red ground from it.
  [/siyah|black/i, '#141414'],
  [/beyaz|white/i, '#f7f4ee'],
  [/altın|altin|gold/i, '#c9a227'],
  [/g[uü]m[uü][sş]|silver/i, '#c5ccd6'],
  [/bak[ıi]r|copper|bronz|bronze/i, '#a9623a'],
  // Materials a packaging brief names as often as hues. "mermer · altın" used to reduce to gold
  // alone, because marble matched nothing — and a single surviving colour becomes the ground.
  [/mermer|marble/i, '#f2efe9'],
  [/fildi[sş]i|ivory/i, '#f6f1e3'],
  [/kum|sand|[sş]ampanya|champagne/i, '#e3d5bd'],
  [/vizon|taupe/i, '#a8998c'],
  [/ta[sş]|stone|beton|concrete/i, '#b6b2ab'],
  [/krem|cream|nude/i, '#f5f0e8'],
  [/bej|beige/i, '#d8cbb8'],
  [/kraft|eco/i, '#cbb892'],
  [/zeytin|olive/i, '#3f4a32'],
  [/haki|khaki/i, '#6b6f4a'],
  [/ye[sş]il|green/i, '#2d6a4f'],
  [/nane|mint/i, '#8fd3b6'],
  [/turkuaz|turquoise|teal/i, '#2f9c9c'],
  [/lacivert|navy/i, '#0e1624'],
  [/mavi|blue/i, '#2a5d9f'],
  [/mor|purple|lila|lavanta|lavender/i, '#6b4f9e'],
  [/fu[sş]ya|fuchsia|magenta/i, '#b8336a'],
  [/pembe|pink|gül\s*kurusu|rose/i, '#e59bb0'],
  [/k[ıi]rm[ıi]z[ıi]|red/i, '#b8331f'],
  [/bordo|burgundy|vi[sş]ne|cherry/i, '#6b1d2a'],
  [/turuncu|orange/i, '#de5e21'],
  [/[sş]eftali|peach|somon|salmon/i, '#f0a98a'],
  [/sar[ıi]|yellow|hardal|mustard/i, '#e0b31c'],
  [/kahve(?:rengi)?|brown|[cç]ikolata\s*rengi/i, '#5b3a26'],
  [/toprak|earth|terracotta|terakota/i, '#6b5344'],
  [/gri|gray|grey/i, '#8a8f94'],
  [/pastel/i, '#e8dff0'],
]

export function normalizeHex(raw: string): string {
  let h = raw.replace('#', '').toLowerCase()
  if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('')
  if (h.length > 6) h = h.slice(0, 6)
  if (h.length !== 6 || Number.isNaN(Number.parseInt(h, 16))) return '#808080'
  return `#${h}`
}

/**
 * Colours in the order the brief names them.
 *
 * The order matters: whatever comes first is the colour the customer leads with, and downstream
 * that is the one that carries the face. This used to return them in *table* order, so "pembe ·
 * mor" came back purple-first purely because purple sits higher in `NAMED` — the box led with the
 * colour they mentioned second.
 */
export function parseBriefColors(colors: string): string[] {
  const text = (colors || '').trim()
  if (!text || /^motor paleti$/i.test(text)) return []
  const found: { at: number; hex: string }[] = []
  for (const match of text.matchAll(HEX)) found.push({ at: match.index ?? 0, hex: normalizeHex(match[0]) })
  for (const [re, hex] of NAMED) {
    const m = re.exec(text)
    if (m) found.push({ at: m.index, hex })
  }
  found.sort((a, b) => a.at - b.at)
  const out: string[] = []
  const seen = new Set<string>()
  for (const { hex } of found) {
    if (seen.has(hex)) continue
    seen.add(hex)
    out.push(hex)
  }
  return out
}

export function hexLuminance(hex: string): number {
  const n = normalizeHex(hex)
  const r = Number.parseInt(n.slice(1, 3), 16) / 255
  const g = Number.parseInt(n.slice(3, 5), 16) / 255
  const b = Number.parseInt(n.slice(5, 7), 16) / 255
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function mixHex(a: string, b: string, amount: number): string {
  const parse = (value: string) => [1, 3, 5].map((index) => Number.parseInt(normalizeHex(value).slice(index, index + 2), 16))
  const [ar, ag, ab] = parse(a)
  const [br, bg, bb] = parse(b)
  const channel = (from: number, to: number) => Math.round(from + (to - from) * amount).toString(16).padStart(2, '0')
  return `#${channel(ar, br)}${channel(ag, bg)}${channel(ab, bb)}`
}

export type ColorFamily = 'dark-metal' | 'botanical' | 'light' | 'warm'

export function colorFamilyOf(hexes: string[]): ColorFamily {
  if (!hexes.length) return 'light'
  const avg = hexes.reduce((n, h) => n + hexLuminance(h), 0) / hexes.length
  const hasGreen = hexes.some((h) => {
    const r = Number.parseInt(normalizeHex(h).slice(1, 3), 16)
    const g = Number.parseInt(normalizeHex(h).slice(3, 5), 16)
    const b = Number.parseInt(normalizeHex(h).slice(5, 7), 16)
    return g > r + 12 && g > b
  })
  const hasGold = hexes.some((h) => {
    const r = Number.parseInt(normalizeHex(h).slice(1, 3), 16)
    const g = Number.parseInt(normalizeHex(h).slice(3, 5), 16)
    const b = Number.parseInt(normalizeHex(h).slice(5, 7), 16)
    return r > 140 && g > 110 && b < 90 && r >= g
  })
  if (hasGreen && avg > 0.28) return 'botanical'
  if (avg < 0.32 && (hasGold || avg < 0.18)) return 'dark-metal'
  if (avg < 0.32) return 'dark-metal'
  if (hasGold || avg > 0.55) return avg > 0.62 ? 'light' : 'warm'
  return 'light'
}

export function accentContrastsGround(bg: string, accent: string, floor = 0.22): boolean {
  return Math.abs(hexLuminance(bg) - hexLuminance(accent)) >= floor
}

export function ensureAccentContrast(p: Palette): Palette {
  if (accentContrastsGround(p.bg, p.accent)) return p
  const darkBg = hexLuminance(p.bg) < 0.45
  const lifted = darkBg
    ? hexLuminance(p.fg) >= 0.45
      ? p.fg
      : '#c9a227'
    : hexLuminance(p.fg) <= 0.4
      ? p.fg
      : '#1a1a1a'
  if (accentContrastsGround(p.bg, lifted)) return { ...p, accent: lifted }
  return { ...p, accent: darkBg ? '#d8bc72' : '#1a1a1a' }
}

function tweakNeutrals(base: Palette, mood: StyleType): Palette {
  const prior = moodPrior(mood)
  if (prior.contrastBoost <= 0) return base
  const dark = hexLuminance(base.bg) < 0.35
  return {
    ...base,
    fg: dark ? mixHex(base.fg, '#ffffff', prior.contrastBoost * 0.12) : mixHex(base.fg, '#111111', prior.contrastBoost * 0.18),
    muted: mixHex(base.muted, dark ? base.fg : base.accent, 0.1),
    paper: dark ? mixHex(base.bg, base.fg, 0.06) : mixHex(base.bg, base.fg, 0.05),
  }
}

/**
 * L2-C — what the mood knob is for.
 *
 * Measured 2026-09-17: with any colour in the brief, all six moods produced the *same* ground,
 * and three of six produced a byte-identical face. The knob was dead, because this file's older
 * contract ("brief colors[] are the primary seed, mood only tweaks contrast") let the brief decide
 * the whole palette and left the mood nothing to do. Before that change the studio painted from a
 * sector×style table, so the mood repainted everything — and the brief's own colours were ignored,
 * which is the bug that prompted the change. Both halves were wrong in the same way: each treated
 * colour as owned by exactly one input.
 *
 * The rule now is the one a designer works to: **the brief says which colours, the mood says how
 * they are used.** The hues are locked — a brief that says green always gets green — and the mood
 * decides the roles: which hue carries the ground, how light or dark that ground sits, how much
 * chroma survives, and how far the ink is pushed from it.
 */
type Roles = {
  /** The colour the brief is actually about. */
  hero: string
  /** A supporting brief colour, or one derived from the hero when the brief named only one. */
  second: string
  /** A light surface the brief named (krem, beyaz), or a paper tinted from the hero. */
  light: string
  /** True when `second` is a colour the brief actually named, rather than one derived from the hero. */
  secondFromBrief: boolean
}

/**
 * Below this, a colour has no usable hue and must keep it that way.
 *
 * Every rule here that reaches for a *minimum* saturation — "modern is bold", "playful is loud" —
 * is a way to invent a hue the brief never named. That is the turquoise bug in a new costume: a
 * "siyah · beyaz" brief has nothing to be loud *with*, so on a neutral brief the moods have to
 * express themselves through lightness and contrast alone.
 */
const NEUTRAL_S = 0.12

/**
 * Neutrality is not saturation alone — it is saturation the eye can actually see.
 *
 * `#f7f4ee`, this table's "beyaz", carries a nominal 31% saturation, but at 95% lightness no hue
 * reads on press. Testing `s` on its own let a white brief count as chromatic, and `modern` then
 * pushed that "hue" to a mid gold: a "siyah · beyaz" brief came back as a gold box. This mirrors
 * the rule `briefIsAchromatic` already uses on the direction side.
 */
function isNeutral(hex: string): boolean {
  const { s, l } = hsl(hex)
  return s < NEUTRAL_S || l < 0.12 || l > 0.9
}

/** Raise saturation toward `target`, but never lift a neutral off zero. */
function chromaUp(s: number, target: number): number {
  return s < NEUTRAL_S ? s : Math.max(target, s)
}

function rolesOf(hexes: string[]): Roles {
  // The first colour the brief names that can actually show a hue. Word order is the customer's
  // own ranking, so it leads; neutrals are skipped only because "siyah · yeşil" means a green box
  // with black type, not a black box.
  const hero = hexes.find((hex) => !isNeutral(hex)) ?? hexes[0]
  const lightest = [...hexes].sort((a, b) => hexLuminance(b) - hexLuminance(a))[0]
  const h = hsl(hero)
  const light = hexLuminance(lightest) > 0.55 ? lightest : fromHsl(h.h, Math.min(0.1, h.s), 0.95)
  const rest = hexes.filter((hex) => hex !== hero && hex !== light)
  const derived = fromHsl(h.h, h.s < NEUTRAL_S ? h.s : Math.min(0.5, h.s + 0.1), h.l < 0.5 ? 0.66 : 0.28)
  return { hero, second: rest[0] ?? derived, light, secondFromBrief: rest.length > 0 }
}

/** Ink that is guaranteed to read on the ground, without inventing a hue the brief never named. */
function inkOn(ground: string, roles: Roles): string {
  const dark = hexLuminance(ground) < 0.4
  const h = hsl(roles.hero)
  return dark ? (hexLuminance(roles.light) > 0.55 ? roles.light : '#f6f0e4') : fromHsl(h.h, Math.min(0.5, h.s), 0.16)
}

const MOOD_GROUND: Record<StyleType, (r: Roles) => string> = {
  // Deep, quiet, expensive: the hero hue pushed down to near-black but still legibly itself.
  luxury: (r) => {
    const { h, s, l } = hsl(r.hero)
    // A colour the customer typed that is already luxury-dark is used verbatim. Re-lighting it to
    // the band's centre would hand back a different hex than the one they asked for.
    return l <= 0.22 ? r.hero : fromHsl(h, Math.min(0.42, s), 0.13)
  },
  // Air. The hero barely tints the paper and does its work in the ink and the accent instead.
  minimal: (r) => {
    const { h, s } = hsl(r.hero)
    return hexLuminance(r.light) > 0.8 ? r.light : fromHsl(h, Math.min(0.06, s), 0.96)
  },
  // One bold flat field — the hero as a colour block, not as decoration. With no hue to be bold
  // with, "bold" becomes the extreme of the hero's own lightness instead.
  modern: (r) => {
    const { h, s, l } = hsl(r.hero)
    if (isNeutral(r.hero)) return fromHsl(h, s, l < 0.5 ? 0.1 : 0.93)
    return l >= 0.36 && l <= 0.58 ? r.hero : fromHsl(h, Math.min(0.85, chromaUp(s, 0.5)), 0.46)
  },
  // Natural: the hero knocked back so it reads as paper and plant, not as print. A neutral brief
  // goes to a neutral paper — pulling it toward kraft would tint it a warmth nobody asked for.
  eco: (r) => {
    const { h, s } = hsl(r.hero)
    if (isNeutral(r.hero)) return '#e8e5e0'
    // Knocked back *in its own hue*. Mixing half-and-half toward kraft dragged a blue-green 70°
    // round the wheel and handed back olive — the brief's green stopped being the brief's green.
    // The warmth that makes it read "eco" is a light touch of kraft on top, not a new hue.
    return mixHex(fromHsl(h, Math.min(0.26, Math.max(0.1, s * 0.45)), 0.76), '#cbb892', 0.18)
  },
  // Warm cream with the hero only breathing through it; a neutral brief gets a neutral paper.
  classic: (r) => {
    const { h, s } = hsl(r.hero)
    return mixHex(isNeutral(r.hero) ? '#f2f0ec' : '#f5ecdc', fromHsl(h, Math.min(0.5, s), 0.5), 0.12)
  },
  // Loud and bright: the hero at the top of its chroma, or at the top of its contrast if it has
  // no chroma to push.
  playful: (r) => {
    const { h, s, l } = hsl(r.hero)
    if (isNeutral(r.hero)) return fromHsl(h, s, l < 0.5 ? 0.18 : 0.9)
    return l >= 0.52 && l <= 0.74 ? r.hero : fromHsl(h, chromaUp(s, 0.62), 0.62)
  },
}

function paletteFromMood(hexes: string[], mood: StyleType): Palette {
  const roles = rolesOf(hexes)
  const bg = MOOD_GROUND[mood](roles)
  const fg = inkOn(bg, roles)
  const dark = hexLuminance(bg) < 0.4
  // The accent is the brief's supporting colour, lifted or dropped until it separates from the
  // ground. It is never invented: `ensureAccentContrast` only steps in if the brief left nothing
  // that can carry it.
  const s2 = hsl(roles.second)
  // Whichever colour the brief named is *not* carrying the ground is the accent, used exactly as
  // typed. Re-lighting it to the mood's band would hand back a colour the customer never chose —
  // a "#f5f0e8 · #2d6a4f" brief grounds on the off-white, so the green is the accent, verbatim.
  const groundSource = bg === roles.light ? roles.light : roles.hero
  const spare = hexes.find((hex) => hex !== groundSource && accentContrastsGround(bg, hex))
  const accent =
    spare ??
    (roles.secondFromBrief && accentContrastsGround(bg, roles.second)
      ? roles.second
      : fromHsl(s2.h, chromaUp(s2.s, 0.3), dark ? 0.62 : 0.34))
  return ensureAccentContrast(
    tweakNeutrals(
      {
        bg,
        fg,
        accent,
        muted: mixHex(fg, bg, dark ? 0.42 : 0.5),
        paper: mixHex(bg, fg, dark ? 0.08 : 0.05),
      },
      mood,
    ),
  )
}

/**
 * Metallics a brief names as foil, not as fill.
 *
 * Measured 2026-09-17: "mermer · altın" produced a box flooded in mustard. Two causes stacked —
 * marble matched no entry and dropped out, and the one colour left standing became the ground.
 * Even alone, gold must not do that: no printer floods a face in solid metallic and no designer
 * asks for it. A named metallic is a request for foil, so it belongs on the accent slot while the
 * ground comes from whatever else the brief said, or from the sector default if it said nothing.
 */
const METALLIC = new Set(['#c9a227', '#c5ccd6', '#a9623a'])

/** Production palette: colors[] win; mood only nudges contrast. */
export function paletteFromBrief(brief: DesignBrief, mood: StyleType, premium = false): Palette {
  const hexes = parseBriefColors(brief.colors)
  const metal = hexes.find((hex) => METALLIC.has(hex))
  const ground = hexes.filter((hex) => !METALLIC.has(hex))
  const base = ground.length
    ? paletteFromMood(ground, mood)
    : ensureAccentContrast(tweakNeutrals(paletteFor(brief, mood, premium), mood))
  if (!metal) return base
  return ensureAccentContrast({ ...base, accent: metal })
}
