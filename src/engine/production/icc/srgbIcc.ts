/**
 * Compact ICC.1 monitor profile for sRGB IEC61966-2.1.
 * PDF/X-4 DestOutputProfile only. Not FOGRA / GRACoL / a mill press condition.
 */

function u32(n: number): number[] {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]
}

function sig(s: string): number[] {
  return [s.charCodeAt(0)!, s.charCodeAt(1)!, s.charCodeAt(2)!, s.charCodeAt(3)!]
}

function s15(n: number): number[] {
  return u32(Math.round(n * 65536))
}

function xyzType(x: number, y: number, z: number): number[] {
  return [...sig('XYZ '), 0, 0, 0, 0, ...s15(x), ...s15(y), ...s15(z)]
}

function u8fixed8(n: number): number[] {
  const v = Math.round(n * 256)
  return [(v >> 8) & 255, v & 255]
}

function curvGamma(gamma: number): number[] {
  return [...sig('curv'), 0, 0, 0, 0, ...u32(1), ...u8fixed8(gamma)]
}

function textDesc(ascii: string): number[] {
  const bytes = [...ascii].map((c) => c.charCodeAt(0))
  return [
    ...sig('desc'),
    0,
    0,
    0,
    0,
    ...u32(bytes.length + 1),
    ...bytes,
    0,
    ...u32(0),
    ...u32(0),
    0,
    0,
    0,
  ]
}

function pad4(data: number[]): number[] {
  const out = [...data]
  while (out.length % 4) out.push(0)
  return out
}

export const SRGB_OUTPUT_CONDITION = 'sRGB IEC61966-2.1'

export function buildSrgbIcc(): Uint8Array {
  const desc = pad4(textDesc(SRGB_OUTPUT_CONDITION))
  const rXYZ = pad4(xyzType(0.436066, 0.222488, 0.013916))
  const gXYZ = pad4(xyzType(0.385147, 0.716873, 0.097076))
  const bXYZ = pad4(xyzType(0.143066, 0.060608, 0.714096))
  const wtpt = pad4(xyzType(0.964203, 1, 0.824905))
  const trc = pad4(curvGamma(2.2))

  const tags: { name: string; data: number[] }[] = [
    { name: 'desc', data: desc },
    { name: 'wtpt', data: wtpt },
    { name: 'rXYZ', data: rXYZ },
    { name: 'gXYZ', data: gXYZ },
    { name: 'bXYZ', data: bXYZ },
    { name: 'rTRC', data: trc },
    { name: 'gTRC', data: trc },
    { name: 'bTRC', data: trc },
  ]

  const header = 128
  const tagTableLen = 4 + tags.length * 12
  let cursor = header + tagTableLen
  const entries = tags.map((tag) => {
    const offset = cursor
    cursor += tag.data.length
    return { name: tag.name, offset, size: tag.data.length, data: tag.data }
  })
  const size = cursor

  const headerBytes: number[] = [
    ...u32(size),
    ...sig('NONE'),
    ...u32(0x02400000),
    ...sig('mntr'),
    ...sig('RGB '),
    ...sig('XYZ '),
    ...u32(0),
    ...u32(0),
    ...u32(0),
    ...sig('acsp'),
    ...u32(0),
    ...u32(0),
    ...sig('FRXA'),
    ...u32(0),
    ...u32(0),
    ...u32(0),
    ...u32(0),
    ...s15(0.964203),
    ...s15(1),
    ...s15(0.824905),
    ...sig('FRXA'),
  ]
  while (headerBytes.length < 128) headerBytes.push(0)
  headerBytes.length = 128

  const body: number[] = [...headerBytes, ...u32(tags.length)]
  for (const e of entries) body.push(...sig(e.name), ...u32(e.offset), ...u32(e.size))
  for (const e of entries) body.push(...e.data)
  return new Uint8Array(body)
}

export function iccToAsciiHex(icc: Uint8Array): string {
  let hex = ''
  for (let i = 0; i < icc.length; i++) {
    hex += icc[i]!.toString(16).padStart(2, '0')
    if ((i + 1) % 32 === 0) hex += '\n'
  }
  if (!hex.endsWith('\n')) hex += '\n'
  return `${hex}>`
}
