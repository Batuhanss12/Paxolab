import ic1 from './assets/perfume/ic1-flammable.svg?raw'
import ic2 from './assets/perfume/ic2-keepaway.svg?raw'
import ic3 from './assets/perfume/ic3-pao.svg?raw'
import ic4 from './assets/perfume/ic4-leaflet-pap.svg?raw'
import type { PerfumeAssetId } from './types'

const RAW: Record<PerfumeAssetId, string> = {
  ic1,
  ic2,
  ic3,
  ic4,
}

const RED = '#fb0102'

function viewBoxOf(raw: string): string {
  return raw.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 100 100'
}

function stripSvg(raw: string): string {
  return raw
    .replace(/<\?xml[^>]*>/g, '')
    .replace(/<!DOCTYPE[^>]*>/g, '')
    .replace(/<svg[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '')
}

/** IC1: keep GHS red diamond, recast black flame to gold. Other assets: gold, never muted-black. */
function colorize(raw: string, id: PerfumeAssetId, gold: string): string {
  let body = stripSvg(raw)
  if (id === 'ic1') {
    body = body
      .replace(/#0[12]0[12]0[12]/gi, gold)
      .replace(/#7a7a7a/gi, gold)
    return body
  }
  body = body
    .replace(/#0[12]0[12]0[12]/gi, gold)
    .replace(/#000000/gi, gold)
    .replace(/#7a7a7a/gi, gold)
    .replace(/fill="black"/gi, `fill="${gold}"`)
    .replace(/stroke="black"/gi, `stroke="${gold}"`)
  return `<g fill="${gold}" stroke="${gold}">${body}</g>`
}

/** Nested SVG so exported artwork stays self-contained vector (no raster, no href). */
export function perfumeAssetMark(
  id: PerfumeAssetId,
  x: number,
  y: number,
  s: number,
  gold: string,
  paoMonths = '36M',
): string {
  const raw = RAW[id]
  let inner = colorize(raw, id, gold)
  if (id === 'ic3' && paoMonths !== '36M') {
    inner = `<defs><clipPath id="ic3-jar"><rect width="986" height="955"/></clipPath></defs><g clip-path="url(#ic3-jar)">${inner}</g><text x="493" y="1128" text-anchor="middle" fill="${gold}" font-family="Inter, Arial, sans-serif" font-size="168" font-weight="600">${paoMonths}</text>`
  }
  return `<svg x="${x}" y="${y}" width="${s}" height="${s}" viewBox="${viewBoxOf(raw)}" overflow="visible">${inner}</svg>`
}

export const PERFUME_FLAMMABLE_RED = RED
/** Unique viewBoxes from PARFUM İCON — used to detect sector leak. */
export const PERFUME_VIEWBOXES = ['2004.78', '986.01', '1004.2', '1433.45']

export const PERFUME_ASSET_ROLE: Record<PerfumeAssetId, string> = {
  ic1: 'flammable',
  ic2: 'keepaway',
  ic3: 'pao-36M',
  ic4: 'leaflet-pap21',
}
