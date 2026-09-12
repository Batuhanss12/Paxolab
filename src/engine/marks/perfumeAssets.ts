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

function viewBoxOf(raw: string): string {
  return raw.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 100 100'
}

function innerMarkup(raw: string, tint: string): string {
  let body = raw
    .replace(/<\?xml[^>]*>/g, '')
    .replace(/<!DOCTYPE[^>]*>/g, '')
    .replace(/<svg[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '')
  body = body
    .replace(/#0[12]0[12]0[12]/gi, tint)
    .replace(/#7a7a7a/gi, tint)
    .replace(/#fdfdfd/gi, tint)
  return body
}

/** Nested SVG so exported artwork stays self-contained vector (no raster, no href). */
export function perfumeAssetMark(id: PerfumeAssetId, x: number, y: number, s: number, color: string): string {
  const raw = RAW[id]
  return `<svg x="${x}" y="${y}" width="${s}" height="${s}" viewBox="${viewBoxOf(raw)}" overflow="visible">${innerMarkup(raw, color)}</svg>`
}

export const PERFUME_ASSET_ROLE: Record<PerfumeAssetId, string> = {
  ic1: 'flammable',
  ic2: 'keepaway',
  ic3: 'pao-36M',
  ic4: 'leaflet-pap21',
}
