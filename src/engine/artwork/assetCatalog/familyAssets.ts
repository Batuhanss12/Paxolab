/**
 * Atomic family SVGs live beside the ingested pattern library.
 * Each file is one motif — never split by the sheet atomizer.
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { parseViewBox, type ArtPatternEntry, type PlacementHint } from '../artPatternLibrary'
import { ensureMotifDesign, type MotifRegionId, type MotifRole } from '../artMotifMeta'
import type { MotifAtom } from '../artMotifAtomizer'
import { catalogRecords, lookupAssetRecord, MOTIF_FAMILIES_DIR } from './catalog'
import type { CanonicalAssetRecord } from './types'

let entryCache: ArtPatternEntry[] | null = null
let atomCache: MotifAtom[] | null = null

export function clearFamilyAssetCache(): void {
  entryCache = null
  atomCache = null
}

function placementHintOf(rec: CanonicalAssetRecord): PlacementHint {
  const p = rec.preferredPlacement.join(' ')
  if (/frame|corner/.test(p)) return 'frame'
  if (/band|bottom|top/.test(p)) return 'band'
  return 'field'
}

function preferredRegionsOf(rec: CanonicalAssetRecord): MotifRegionId[] {
  const out: MotifRegionId[] = []
  for (const p of rec.preferredPlacement) {
    if (p === 'nw' || p === 'ne' || p === 'sw' || p === 'se' || p === 'top' || p === 'bottom' || p === 'left' || p === 'right' || p === 'center' || p === 'field') {
      out.push(p)
    }
    if (p === 'corner') out.push('nw', 'ne', 'sw', 'se')
    if (p === 'side') out.push('left', 'right')
    if (p === 'band') out.push('top', 'bottom')
  }
  return [...new Set(out)]
}

function compatibleStylesOf(rec: CanonicalAssetRecord): string[] {
  const tags = rec.style.map((s) => s.toLowerCase())
  const out = new Set<string>()
  if (tags.some((t) => /editorial|premium|luxury/.test(t))) {
    out.add('luxury')
    out.add('classic')
  }
  if (tags.some((t) => /organic|eco|natural/.test(t))) out.add('eco')
  if (tags.some((t) => /minimal|quiet/.test(t))) out.add('minimal')
  if (tags.some((t) => /modern|tech/.test(t))) out.add('modern')
  if (tags.some((t) => /playful/.test(t))) out.add('playful')
  return [...out]
}

export function loadAtomicFamilyEntries(): ArtPatternEntry[] {
  if (entryCache) return entryCache
  const out: ArtPatternEntry[] = []
  for (const rec of catalogRecords()) {
    if (!rec.file) continue
    const assetPath = path.join(MOTIF_FAMILIES_DIR, rec.file)
    if (!existsSync(assetPath)) continue
    const raw = readFileSync(assetPath, 'utf8')
    out.push({
      id: rec.id,
      sourcePath: assetPath,
      sourceName: path.basename(rec.file),
      assetPath,
      tags: [...rec.style, rec.family, rec.subfamily],
      placementHint: placementHintOf(rec),
      viewBox: parseViewBox(raw).raw,
      bytes: Buffer.byteLength(raw, 'utf8'),
      atomic: true,
    })
  }
  entryCache = out
  return out
}

export function atomFromCanonicalRecord(rec: CanonicalAssetRecord, markup: string): MotifAtom {
  const vb = parseViewBox(markup)
  const role = (rec.role ?? 'stamp') as MotifRole
  const paths = (markup.match(/<path\b/gi) ?? []).length
  return ensureMotifDesign({
    id: `${rec.id}__atom-01`,
    sheetId: rec.id,
    sourceName: rec.file ? path.basename(rec.file) : `${rec.id}.svg`,
    bbox: { x: vb.x, y: vb.y, w: vb.w, h: vb.h },
    viewBox: vb.raw,
    markup,
    bytes: Buffer.byteLength(markup, 'utf8'),
    tags: [...rec.style, rec.family, rec.subfamily],
    roleGuess: role,
    complexity: Math.max(4, Math.round(rec.complexity * 40) + paths),
    design: {
      family: rec.family,
      subfamily: rec.subfamily,
      visualWeight: rec.visualWeight,
      complexity: Math.round(rec.complexity * 40),
      compatibleSectors: rec.sectorCompatibility,
      compatibleStyles: compatibleStylesOf(rec),
      styleTags: rec.family === 'botanical' ? [...rec.style, 'botanic', 'eco'] : rec.style,
      preferredRegions: preferredRegionsOf(rec),
      source: 'explicit',
      minOpacity: 0.42,
      maxOpacity: 0.88,
      minScale: 0.4,
      maxScale: 1.15,
    },
  })
}

export function loadAtomicFamilyAtoms(): MotifAtom[] {
  if (atomCache) return atomCache
  const atoms: MotifAtom[] = []
  for (const entry of loadAtomicFamilyEntries()) {
    const rec = lookupAssetRecord(entry.id)
    if (!rec || !existsSync(entry.assetPath)) continue
    atoms.push(atomFromCanonicalRecord(rec, readFileSync(entry.assetPath, 'utf8')))
  }
  atomCache = atoms
  return atoms
}
