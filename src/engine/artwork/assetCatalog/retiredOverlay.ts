/**
 * User veto: floating clip-art, corner L-stamps, and bottle / flacon drawings never paint.
 * Files stay on disk for geometry tests; match / compose / hero skip them.
 */
import { lookupAssetRecord, lookupAssetRecordForAtom } from './catalog'
import type { MotifAtom } from '../artMotifAtomizer'

const RETIRED_IDS = new Set(['crest-spot', 'ribbon-corner', 'cartouche-arc', 'double-line-corner'])
const UUID_SHEET =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuidSheetId(id: string | undefined): boolean {
  if (!id) return false
  const stem = id.replace(/__atom-\d+$/i, '')
  return UUID_SHEET.test(stem)
}

export function isRetiredOverlayId(id: string | undefined): boolean {
  if (!id) return false
  const lower = id.toLowerCase()
  const stem = lower.replace(/__atom-\d+$/i, '').replace(/\.svg$/i, '')
  if (RETIRED_IDS.has(stem)) return true
  if (UUID_SHEET.test(stem)) return true
  return /crest-spot|ribbon-corner|cartouche-arc|double-line-corner/.test(lower)
}

export function isRetiredOverlayAtom(atom: {
  id?: string
  sheetId?: string
  sourceName?: string
}): boolean {
  const rec =
    lookupAssetRecordForAtom(atom.sheetId ?? atom.id ?? '', atom.id, atom.sourceName) ??
    lookupAssetRecord(atom.sheetId ?? '') ??
    lookupAssetRecord(atom.id ?? '')
  if (rec?.retired) return true
  return (
    isRetiredOverlayId(atom.id) ||
    isRetiredOverlayId(atom.sheetId) ||
    isRetiredOverlayId(atom.sourceName) ||
    isUuidSheetId(atom.sheetId) ||
    isUuidSheetId(atom.id)
  )
}

export function rejectRetiredOverlayAtoms<T extends MotifAtom>(atoms: T[]): T[] {
  return atoms.filter((atom) => !isRetiredOverlayAtom(atom))
}
