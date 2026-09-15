/**
 * Phase 15 — brief colors[] are the primary palette seed.
 * Mood only tweaks contrast / neutrals. No style-pack costumes.
 */
import type { DesignBrief, Palette, StyleType } from '../../types'
import { moodPrior } from '../brain/moodPriors'
import { paletteFor } from './paletteTable'

const HEX = /#([0-9a-fA-F]{3,8})\b/g

const NAMED: Array<[RegExp, string]> = [
  [/siyah|black/i, '#1a0a0a'],
  [/altın|altin|gold/i, '#c9a227'],
  [/krem|cream|nude/i, '#f5f0e8'],
  [/bej|beige/i, '#d8cbb8'],
  [/beyaz|white/i, '#f7f4ee'],
  [/ye[sş]il|green/i, '#2d6a4f'],
  [/toprak|earth/i, '#6b5344'],
  [/lacivert|navy/i, '#0e1624'],
  [/g[uü]m[uü][sş]|silver/i, '#c5ccd6'],
  [/bordo|burgundy/i, '#6b1d2a'],
  [/kraft|eco/i, '#cbb892'],
  [/zeytin|olive/i, '#3f4a32'],
]

export function normalizeHex(raw: string): string {
  let h = raw.replace('#', '').toLowerCase()
  if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('')
  if (h.length > 6) h = h.slice(0, 6)
  if (h.length !== 6 || Number.isNaN(Number.parseInt(h, 16))) return '#808080'
  return `#${h}`
}

export function parseBriefColors(colors: string): string[] {
  const text = (colors || '').trim()
  if (!text || /^motor paleti$/i.test(text)) return []
  const out: string[] = []
  const seen = new Set<string>()
  const push = (hex: string) => {
    const n = normalizeHex(hex)
    if (seen.has(n)) return
    seen.add(n)
    out.push(n)
  }
  for (const match of text.matchAll(HEX)) push(match[0])
  for (const [re, hex] of NAMED) {
    if (re.test(text)) push(hex)
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

function paletteFromHexes(hexes: string[], mood: StyleType): Palette {
  const sorted = [...hexes].sort((a, b) => hexLuminance(a) - hexLuminance(b))
  const dark = sorted[0]
  const light = sorted[sorted.length - 1]
  const mid = hexes.find((h) => h !== dark && h !== light) ?? (mood === 'luxury' || mood === 'classic' ? light : dark)
  const family = colorFamilyOf(hexes)
  const preferLight =
    family === 'light' ||
    family === 'botanical' ||
    mood === 'minimal' ||
    mood === 'eco' ||
    (hexLuminance(light) > 0.62 && mood !== 'luxury')
  if (!preferLight && hexLuminance(dark) < 0.42) {
    const fg = hexLuminance(light) > 0.55 ? light : '#f6f0e4'
    return ensureAccentContrast(
      tweakNeutrals(
        {
          bg: dark,
          fg,
          accent: hexLuminance(mid) > 0.2 ? mid : light,
          muted: mixHex(dark, fg, 0.38),
          paper: mixHex(dark, fg, 0.08),
        },
        mood,
      ),
    )
  }
  const ink = hexLuminance(dark) < 0.55 ? dark : '#1a1a1a'
  const accent = mid !== light && mid !== dark ? mid : hexLuminance(dark) < 0.4 ? dark : ink
  return ensureAccentContrast(
    tweakNeutrals(
      {
        bg: hexLuminance(light) > 0.55 ? light : '#f4f1ea',
        fg: ink,
        accent,
        muted: mixHex(ink, light, 0.55),
        paper: mixHex(light, ink, 0.06),
      },
      mood,
    ),
  )
}

/** Production palette: colors[] win; mood only nudges contrast. */
export function paletteFromBrief(brief: DesignBrief, mood: StyleType, premium = false): Palette {
  const hexes = parseBriefColors(brief.colors)
  if (hexes.length) return paletteFromHexes(hexes, mood)
  return ensureAccentContrast(tweakNeutrals(paletteFor(brief, mood, premium), mood))
}
