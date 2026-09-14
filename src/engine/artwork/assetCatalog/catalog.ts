import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { REPO_ROOT } from '../artPatternLibrary'
import type { CanonicalAssetRecord, AssetCatalogFile } from './types'

export const MOTIF_FAMILIES_DIR = path.join(REPO_ROOT, 'assets', 'motif-families')
export const ASSET_CATALOG_PATH = path.join(MOTIF_FAMILIES_DIR, 'catalog.json')

let cached: AssetCatalogFile | null = null

export function clearAssetCatalogCache(): void {
  cached = null
}

export function loadAssetCatalog(): AssetCatalogFile {
  if (cached) return cached
  if (!existsSync(ASSET_CATALOG_PATH)) {
    cached = { version: 1, assets: [] }
    return cached
  }
  cached = JSON.parse(readFileSync(ASSET_CATALOG_PATH, 'utf8')) as AssetCatalogFile
  return cached
}

export function catalogRecords(): CanonicalAssetRecord[] {
  return loadAssetCatalog().assets
}

export function lookupAssetRecord(idOrSheet: string): CanonicalAssetRecord | undefined {
  const assets = catalogRecords()
  return assets.find((a) => a.id === idOrSheet || a.sheetId === idOrSheet)
}

export function lookupAssetRecordForAtom(sheetId: string, atomId?: string, sourceName?: string): CanonicalAssetRecord | undefined {
  const assets = catalogRecords()
  const byAtom = atomId ? assets.find((a) => a.id === atomId || atomId.startsWith(`${a.id}__`)) : undefined
  if (byAtom) return byAtom
  const bySheet = assets.find((a) => a.sheetId === sheetId || a.id === sheetId)
  if (bySheet) return bySheet
  if (!sourceName) return undefined
  const stem = sourceName.replace(/\.[a-z0-9]+$/i, '').toLowerCase()
  return assets.find((a) => a.id === stem || (a.file && a.file.toLowerCase().includes(stem)))
}
