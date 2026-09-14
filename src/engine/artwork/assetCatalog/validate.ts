/**
 * Asset library validation — metadata + SVG sanity. Does not paint faces.
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { loadArtPatternLibrary } from '../artPatternLibrary'
import { catalogRecords, MOTIF_FAMILIES_DIR } from './catalog'
import { FAMILY_COMPAT, canonicalizeFamily } from './familyMatrix'
import type { CanonicalAssetRecord } from './types'
import type { MotifFamilyId } from '../../brain/DesignPlan'

export type AssetIssue = { id: string; level: 'error' | 'warning'; message: string }

export type FamilyBucket =
  | 'BOTANICAL'
  | 'HERALDIC'
  | 'ISLAMIC'
  | 'GEOMETRIC'
  | 'MINIMAL'
  | 'ORGANIC'
  | 'TECH'
  | 'ORNAMENTAL'
  | 'UNCLASSIFIED'

export type AssetLibraryReport = {
  totalAssets: number
  counts: Record<FamilyBucket, number>
  issues: AssetIssue[]
  unclassifiedIds: string[]
}

const COLOR_OK = /^(none|currentColor|inherit|transparent|#[0-9a-fA-F]{3,8}|rgb(a)?\(|hsl(a)?\(|url\()/

function bucketOf(family?: string, subfamily?: string): FamilyBucket {
  const canon = canonicalizeFamily(family)
  if (!canon) return 'UNCLASSIFIED'
  if (canon === 'botanical') return 'BOTANICAL'
  if (canon === 'harvest') return 'ORGANIC'
  if (canon === 'heraldic') return 'HERALDIC'
  if (canon === 'linear-tech') return 'TECH'
  if (canon === 'quiet-line') return 'MINIMAL'
  if (canon === 'geometric-deco' || canon === 'mineral-frame') return 'GEOMETRIC'
  if (canon === 'ornate-stamp') {
    if (/islamic/.test(`${family} ${subfamily}`)) return 'ISLAMIC'
    return 'ORNAMENTAL'
  }
  return 'UNCLASSIFIED'
}

function emptyCounts(): Record<FamilyBucket, number> {
  return {
    BOTANICAL: 0,
    HERALDIC: 0,
    ISLAMIC: 0,
    GEOMETRIC: 0,
    MINIMAL: 0,
    ORGANIC: 0,
    TECH: 0,
    ORNAMENTAL: 0,
    UNCLASSIFIED: 0,
  }
}

function checkSvg(id: string, svg: string, issues: AssetIssue[]): void {
  if (!/<svg[\s>]/i.test(svg)) {
    issues.push({ id, level: 'error', message: 'SVG kök elemanı yok' })
    return
  }
  if (!/viewBox\s*=\s*"[^"]+"/i.test(svg)) {
    issues.push({ id, level: 'error', message: 'viewBox yok' })
  }
  const hasGeom = /<(path|circle|ellipse|line|polyline|polygon|rect)\b/i.test(svg)
  if (!hasGeom) issues.push({ id, level: 'error', message: 'path/geom yok' })
  const paths = svg.match(/<path\b[^>]*>/gi) ?? []
  for (const tag of paths) {
    const d = tag.match(/\bd\s*=\s*"([^"]*)"/i)
    if (!d || !d[1].trim()) issues.push({ id, level: 'error', message: 'invalid path (d yok)' })
  }
  const paints = [...svg.matchAll(/\b(fill|stroke)\s*=\s*"([^"]*)"/gi)]
  for (const m of paints) {
    const v = m[2].trim()
    if (v && !COLOR_OK.test(v)) issues.push({ id, level: 'error', message: `geçersiz ${m[1]}: ${v}` })
  }
}

function checkRecord(rec: CanonicalAssetRecord, issues: AssetIssue[]): void {
  if (!rec.family) issues.push({ id: rec.id, level: 'error', message: 'family yok' })
  if (!rec.subfamily) issues.push({ id: rec.id, level: 'error', message: 'subfamily yok' })
  if (!FAMILY_COMPAT[rec.family as MotifFamilyId] && !canonicalizeFamily(rec.family)) {
    issues.push({ id: rec.id, level: 'error', message: `family compatibility tanımsız: ${rec.family}` })
  }
  if (!rec.conceptCompatibility) issues.push({ id: rec.id, level: 'error', message: 'concept compatibility yok' })
  if (!rec.preferredPlacement?.length) issues.push({ id: rec.id, level: 'error', message: 'placement yok' })
  if (!rec.file) return
  const assetPath = path.join(MOTIF_FAMILIES_DIR, rec.file)
  if (!existsSync(assetPath)) {
    issues.push({ id: rec.id, level: 'error', message: `SVG dosyası yok: ${rec.file}` })
    return
  }
  try {
    checkSvg(rec.id, readFileSync(assetPath, 'utf8'), issues)
  } catch (err) {
    issues.push({ id: rec.id, level: 'error', message: `SVG okunamadı: ${String(err)}` })
  }
}

export function validateAssetLibrary(): AssetLibraryReport {
  const issues: AssetIssue[] = []
  const counts = emptyCounts()
  const seen = new Set<string>()
  const unclassifiedIds: string[] = []

  for (const rec of catalogRecords()) {
    seen.add(rec.id)
    if (rec.sheetId) seen.add(rec.sheetId)
    checkRecord(rec, issues)
    counts[bucketOf(rec.family, rec.subfamily)] += 1
  }

  for (const entry of loadArtPatternLibrary()) {
    if (entry.skipReason) continue
    if (seen.has(entry.id)) continue
    unclassifiedIds.push(entry.id)
    counts.UNCLASSIFIED += 1
    issues.push({ id: entry.id, level: 'warning', message: 'UNCLASSIFIED — catalog kaydı yok' })
  }

  const totalAssets = catalogRecords().length + unclassifiedIds.length
  if (counts.UNCLASSIFIED > 0) {
    issues.push({
      id: '*',
      level: 'warning',
      message: `UNCLASSIFIED ${counts.UNCLASSIFIED} > 0`,
    })
  }

  return { totalAssets, counts, issues, unclassifiedIds }
}
