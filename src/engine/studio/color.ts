/** Small colour toolkit for studio palettes. Deterministic, no DOM. */

export type Rgb = { r: number; g: number; b: number }
export type Hsl = { h: number; s: number; l: number }

export function parseHex(hex: string): Rgb {
  const m = hex.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (!m) return { r: 128, g: 128, b: 128 }
  let h = m[1]
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) }
}

export function toHex({ r, g, b }: Rgb): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0)
  else if (max === gn) h = (bn - rn) / d + 2
  else h = (rn - gn) / d + 4
  return { h: (h * 60) % 360, s, l }
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const hue = ((h % 360) + 360) % 360
  if (s === 0) return { r: l * 255, g: l * 255, b: l * 255 }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const f = (t: number) => {
    let x = t
    if (x < 0) x += 1
    if (x > 1) x -= 1
    if (x < 1 / 6) return p + (q - p) * 6 * x
    if (x < 1 / 2) return q
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6
    return p
  }
  const hn = hue / 360
  return { r: f(hn + 1 / 3) * 255, g: f(hn) * 255, b: f(hn - 1 / 3) * 255 }
}

export function hsl(hex: string): Hsl {
  return rgbToHsl(parseHex(hex))
}

export function fromHsl(h: number, s: number, l: number): string {
  return toHex(hslToRgb({ h, s: clamp01(s), l: clamp01(l) }))
}

export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

export function lighten(hex: string, amount: number): string {
  const c = hsl(hex)
  return fromHsl(c.h, c.s, c.l + amount)
}

export function darken(hex: string, amount: number): string {
  return lighten(hex, -amount)
}

export function saturate(hex: string, amount: number): string {
  const c = hsl(hex)
  return fromHsl(c.h, c.s + amount, c.l)
}

export function withLightness(hex: string, l: number): string {
  const c = hsl(hex)
  return fromHsl(c.h, c.s, l)
}

export function mix(a: string, b: string, t: number): string {
  const ca = parseHex(a)
  const cb = parseHex(b)
  const k = clamp01(t)
  return toHex({ r: ca.r + (cb.r - ca.r) * k, g: ca.g + (cb.g - ca.g) * k, b: ca.b + (cb.b - ca.b) * k })
}

export function luminance(hex: string): number {
  const { r, g, b } = parseHex(hex)
  const lin = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

export function isDark(hex: string): boolean {
  return luminance(hex) < 0.35
}

/** Pick the better-reading ink for a ground: prefer the candidate, else fall back to near-white / near-black. */
export function readableInk(ground: string, candidate: string, min = 3.2): string {
  if (contrastRatio(ground, candidate) >= min) return candidate
  return isDark(ground) ? '#f4efe6' : '#171512'
}

/** Ensure an accent separates from the ground; nudge lightness away from the ground until it does. */
export function separateAccent(ground: string, accent: string, minDelta = 0.22): string {
  let out = accent
  for (let i = 0; i < 6 && Math.abs(luminance(ground) - luminance(out)) < minDelta; i++) {
    out = isDark(ground) ? lighten(out, 0.08) : darken(out, 0.08)
  }
  return out
}
