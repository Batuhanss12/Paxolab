/** Sample / user EAN-13. Prefix 200 is internal — never claim GS1 registration. */

const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011']
const G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111']
const R = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100']
const PARITY = ['AAAAAA', 'AABABB', 'AABBAB', 'AABBBA', 'ABAABB', 'ABBAAB', 'ABBBAA', 'ABABAB', 'ABABBA', 'ABBABA']

export function ean13CheckDigit(digits12: string): string {
  const d = digits12.replace(/\D/g, '').slice(0, 12).padStart(12, '0')
  let sum = 0
  for (let i = 0; i < 12; i++) sum += Number(d[i]) * (i % 2 === 0 ? 1 : 3)
  return String((10 - (sum % 10)) % 10)
}

export function normalizeEan13(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length >= 13) return digits.slice(0, 13)
  if (digits.length === 12) return digits + ean13CheckDigit(digits)
  if (digits.length >= 8) return formaSampleEan(digits)
  return formaSampleEan(raw)
}

export function formaSampleEan(seed: string): string {
  let h = 2166136261
  for (const ch of seed || 'FORMA') {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  const body = String(Math.abs(h) % 1_000_000_000).padStart(9, '0')
  const d12 = `200${body}`
  return d12 + ean13CheckDigit(d12)
}

export function isFormaSampleEan(code: string): boolean {
  return /^200\d{10}$/.test(code.replace(/\s/g, ''))
}

/** Motor-invented country-looking GTIN. Sample 200… is honest; defaulted 869… is not. */
export function isInventedRegisteredGtin(code: string, defaulted?: boolean): boolean {
  const d = code.replace(/\D/g, '')
  if (!d) return false
  if (isFormaSampleEan(d)) return false
  return !!defaulted
}

export function ean13Modules(code: string): string {
  const d = normalizeEan13(code)
  const p = PARITY[Number(d[0])]
  let bits = '101'
  for (let i = 1; i <= 6; i++) bits += (p[i - 1] === 'A' ? L : G)[Number(d[i])]
  bits += '01010'
  for (let i = 7; i <= 12; i++) bits += R[Number(d[i])]
  bits += '101'
  return bits
}

export type LabelBarcodeFit = {
  x: number
  y: number
  w: number
  barsH: number
  barH: number
  captionSize: number
  picCount: number
  picS: number
  picX: number
  picY: number
  footTop: number
}

function picRowWidth(count: number, size: number): number {
  if (count <= 0) return 0
  return count * size + (count - 1) * size * 0.35
}

/**
 * Footer: pictograms left, EAN in leftover width. Inset is proportional so a
 * size change cannot pin the quiet-zone plate to the double frame.
 */
export function fitLabelBarcode(opts: {
  w: number
  h: number
  margin: number
  picCount?: number
  bottomReserve?: number
  leftExtra?: number
}): LabelBarcodeFit {
  const w = Math.max(1, opts.w)
  const h = Math.max(1, opts.h)
  const m = Math.max(0.8, opts.margin)
  const reserve = Math.max(0, opts.bottomReserve ?? 0)
  const barH = Math.max(7, Math.min(10, h * 0.12))
  const barsH = Math.max(3.6, barH - 4.4)
  const pics = Math.max(0, Math.floor(opts.picCount ?? 0))
  const picS = Math.max(3.6, Math.min(5.2, barH * 0.6))
  const picW = picRowWidth(pics, picS)
  const leftPics = m + (picW ? picW + 2.4 : 0)
  const frame = Math.max(1.15, m * 0.55)
  const whitePad = 1
  const rightInset = Math.min(6.35, Math.max(5, m + 2.15, frame + 3.25))
  const right = w - rightInset
  const minBar = Math.min(16, Math.max(10, right - leftPics))
  const extra = Math.max(0, opts.leftExtra ?? 0)
  const left = extra && right - leftPics - extra >= minBar ? leftPics + extra : leftPics
  const avail = Math.max(0.8, right - left)
  const barW = Math.max(minBar, Math.min(avail, Math.max(22, Math.min(w * 0.48, 36))))
  const used = Math.min(barW, avail)
  const x = Math.max(left, right - used)
  const captionSize = Math.max(1.25, Math.min(1.85, used / 9.2))
  const capPad = Math.max(4.2, captionSize * 2.15)
  const lift = Math.min(1.15, Math.max(0.55, Math.min(w, h) * 0.015))
  const blockH = barsH + capPad
  const minY = frame + whitePad
  const maxY = h - reserve - frame - (blockH - whitePad)
  const desiredY = h - m - barH - reserve - lift
  const y =
    maxY >= minY
      ? Math.max(minY, Math.min(desiredY, maxY))
      : Math.max(0.35, Math.min(desiredY, h - reserve - (blockH - whitePad)))

  return {
    x: Math.max(left, Math.min(x, w - rightInset - used)),
    y,
    w: used,
    barsH,
    barH,
    captionSize,
    picCount: pics,
    picS,
    picX: m,
    picY: y + (barH - picS) / 2 - 1.2,
    footTop: y - 3.4,
  }
}

export function barcodeSvg(
  code: string,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  caption = true,
  captionSize = 1.7,
): string {
  const digits = normalizeEan13(code)
  const bits = ean13Modules(digits)
  const modules = Math.max(1, bits.length)
  const barW = w / modules
  let bars = ''
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === '1') {
      bars += `<rect x="${(x + i * barW).toFixed(3)}" y="${y}" width="${barW.toFixed(4)}" height="${h}" fill="${color}" shape-rendering="crispEdges" />`
    }
  }
  const sample = isFormaSampleEan(digits)
  const cap = Math.max(1.15, Math.min(captionSize, 1.85, (w - 0.8) / 8.6))
  const capY = y + h + Math.max(2.2, cap * 1.22)
  const span = Math.max(8, w - 1)
  const digitsEl = caption
    ? `<text data-barcode-digits="${digits}" x="${x + w / 2}" y="${capY.toFixed(2)}" text-anchor="middle" fill="${color}" font-family="Inter, Arial, sans-serif" font-size="${cap.toFixed(2)}" letter-spacing="${Math.min(0.32, cap * 0.16).toFixed(2)}" textLength="${span.toFixed(2)}" lengthAdjust="spacing">${digits}</text>`
    : ''
  const note =
    caption && sample
      ? `<text x="${x + w / 2}" y="${(capY + cap * 0.88).toFixed(2)}" text-anchor="middle" fill="${color}" fill-opacity="0.78" font-family="Inter, Arial, sans-serif" font-size="${Math.min(1.05, cap * 0.68).toFixed(2)}">örnek</text>`
      : ''
  return `<g data-mark="barcode">${bars}${digitsEl}${note}</g>`
}
