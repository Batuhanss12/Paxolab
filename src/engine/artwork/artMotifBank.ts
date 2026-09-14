/**
 * Phase 14-B — Motif bank on disk.
 * assets/motif-bank/{sheetId}/atom-NN.svg + bank.json + sheetManifest.json
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  ART_PATTERN_SOURCE_DIR,
  REPO_ROOT,
  type ArtPatternEntry,
  loadArtPatternLibrary,
  usableArtPatterns,
} from './artPatternLibrary'
import { atomizeArtPattern, clearArtMotifAtomizerCache, isWeakSheet, type MotifAtom, type MotifRole } from './artMotifAtomizer'
import { ensureMotifDesign } from './artMotifMeta'

export const MOTIF_BANK_DIR = path.join(REPO_ROOT, 'assets', 'motif-bank')

export type MotifBankFile = {
  sourceDir: string
  ingestedAt: string
  sheets: {
    sheetId: string
    sourceName: string
    atomCount: number
    weak: boolean
  }[]
  atoms: MotifAtom[]
}

export type SheetManifest = {
  sheets: Record<string, string[]>
}

let cached: MotifBankFile | null = null

export function clearMotifBankCache(): void {
  cached = null
  clearArtMotifAtomizerCache()
}

export function writeMotifBank(
  entries: ArtPatternEntry[] = usableArtPatterns(loadArtPatternLibrary()),
  destDir = MOTIF_BANK_DIR,
): MotifBankFile {
  if (existsSync(destDir)) rmSync(destDir, { recursive: true, force: true })
  mkdirSync(destDir, { recursive: true })

  const atoms: MotifAtom[] = []
  const sheets: MotifBankFile['sheets'] = []
  const manifest: SheetManifest = { sheets: {} }

  for (const entry of entries) {
    if (!existsSync(entry.assetPath)) continue
    const raw = readFileSync(entry.assetPath, 'utf8')
    const sheetAtoms = atomizeArtPattern(entry, raw)
    const weak = isWeakSheet(entry, sheetAtoms)
    sheets.push({ sheetId: entry.id, sourceName: entry.sourceName, atomCount: sheetAtoms.length, weak })
    manifest.sheets[entry.id] = sheetAtoms.map((a) => a.id)
    if (!sheetAtoms.length) continue
    const dir = path.join(destDir, entry.id)
    mkdirSync(dir, { recursive: true })
    for (const atom of sheetAtoms) {
      const file = `${atom.id.split('__')[1] ?? atom.id}.svg`
      writeFileSync(path.join(dir, file), atom.markup, 'utf8')
    }
    atoms.push(...sheetAtoms)
  }

  const data: MotifBankFile = {
    sourceDir: ART_PATTERN_SOURCE_DIR,
    ingestedAt: new Date().toISOString(),
    sheets,
    atoms: atoms.map(({ markup: _m, ...meta }) => ({ ...meta, markup: '' })),
  }
  writeFileSync(path.join(destDir, 'bank.json'), JSON.stringify(data, null, 2), 'utf8')
  writeFileSync(path.join(destDir, 'sheetManifest.json'), JSON.stringify(manifest, null, 2), 'utf8')
  cached = { ...data, atoms }
  return cached
}

function hydrate(dir: string, atom: MotifAtom): MotifAtom {
  if (atom.markup) return ensureMotifDesign(atom)
  const file = path.join(dir, atom.sheetId, `${atom.id.split('__')[1] ?? atom.id}.svg`)
  if (!existsSync(file)) return ensureMotifDesign(atom)
  const markup = readFileSync(file, 'utf8')
  return ensureMotifDesign({ ...atom, markup, bytes: Buffer.byteLength(markup, 'utf8') })
}

export function loadMotifBank(dir = MOTIF_BANK_DIR): MotifBankFile {
  if (cached) return cached
  const jsonPath = path.join(dir, 'bank.json')
  if (!existsSync(jsonPath)) {
    const empty: MotifBankFile = { sourceDir: dir, ingestedAt: '', sheets: [], atoms: [] }
    cached = empty
    return empty
  }
  const data = JSON.parse(readFileSync(jsonPath, 'utf8')) as MotifBankFile
  data.atoms = data.atoms.map((atom) => hydrate(dir, atom))
  cached = data
  return data
}

export function atomsForSheet(sheetId: string, dir = MOTIF_BANK_DIR): MotifAtom[] {
  return loadMotifBank(dir).atoms.filter((atom) => atom.sheetId === sheetId)
}

export function atomsForEntry(entry: ArtPatternEntry): MotifAtom[] {
  if (!existsSync(entry.assetPath)) return atomsForSheet(entry.id)
  return atomizeArtPattern(entry, readFileSync(entry.assetPath, 'utf8'))
}

export type { MotifRole, MotifAtom }
export type { MotifDesignMetadata } from './artMotifMeta'
