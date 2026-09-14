import { describe, expect, it } from 'vitest'
import { buildSrgbIcc, iccToAsciiHex, SRGB_OUTPUT_CONDITION } from './srgbIcc'

describe('sRGB ICC DestOutputProfile', () => {
  it('writes a sized ICC.1 header with acsp magic', () => {
    const icc = buildSrgbIcc()
    const size = (icc[0]! << 24) | (icc[1]! << 16) | (icc[2]! << 8) | icc[3]!
    expect(icc.length).toBe(size)
    expect(icc.length).toBeGreaterThan(128)
    expect(String.fromCharCode(icc[36]!, icc[37]!, icc[38]!, icc[39]!)).toBe('acsp')
    expect(String.fromCharCode(icc[16]!, icc[17]!, icc[18]!, icc[19]!)).toBe('RGB ')
    expect(String.fromCharCode(icc[12]!, icc[13]!, icc[14]!, icc[15]!)).toBe('mntr')
  })

  it('encodes ASCIIHex for the string PDF writer', () => {
    const hex = iccToAsciiHex(buildSrgbIcc())
    expect(hex.endsWith('>')).toBe(true)
    expect(hex).toMatch(/61637370/)
    expect(SRGB_OUTPUT_CONDITION).toBe('sRGB IEC61966-2.1')
  })
})
