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

export function barcodeSvg(code: string, x: number, y: number, w: number, h: number, color: string, caption = true): string {
  const digits = normalizeEan13(code)
  const bits = ean13Modules(digits)
  const barW = w / bits.length
  let bars = ''
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === '1') bars += `<rect x="${(x + i * barW).toFixed(3)}" y="${y}" width="${Math.max(0.22, barW).toFixed(3)}" height="${h}" fill="${color}" />`
  }
  const sample = isFormaSampleEan(digits)
  const captionText = sample ? `${digits} · örnek` : digits
  const label = caption
    ? `<text x="${x + w / 2}" y="${y + h + 2.4}" text-anchor="middle" fill="${color}" font-family="Inter, Arial, sans-serif" font-size="1.7" letter-spacing="0.35">${captionText}</text>`
    : ''
  return `<g data-mark="barcode">${bars}${label}</g>`
}
