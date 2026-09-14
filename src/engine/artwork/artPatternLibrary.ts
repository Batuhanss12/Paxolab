/**
 * Phase 12 — motor-facing library for user-dropped vector patterns.
 *
 * Canonical source (copy only; never edit):
 *   C:\Users\Admin\Desktop\ART-PATTERN-DESİGN
 * Dest:
 *   <repo>/assets/art-pattern-library/{id}.svg + library.json
 *
 * Overlay is opt-in via DesignOverrides.artPatternId so the default gallery
 * faces stay HOLD. Paint uses a self-closing <image> (data URI) so nested
 * Illustrator </g> tags cannot early-close the front-panel parser.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Palette, Panel, StyleType } from '../../types'
import type { SafeRect } from './patternMotifs'

export const ART_PATTERN_SOURCE_DIR = 'C:\\Users\\Admin\\Desktop\\ART-PATTERN-DESİGN'
export const FORBIDDEN_SOURCE_NAME = 'FORMA-Stil-Referans'

const HERE = path.dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = path.resolve(HERE, '../../..')
export const ART_PATTERN_ASSET_DIR = path.join(REPO_ROOT, 'assets', 'art-pattern-library')

export type PlacementHint = 'field' | 'frame' | 'band'

export type ArtPatternEntry = {
  id: string
  sourcePath: string
  sourceName: string
  assetPath: string
  tags: string[]
  placementHint: PlacementHint
  skipReason?: string
  viewBox?: string
  bytes: number
}

export type ArtPatternLibraryFile = {
  sourceDir: string
  ingestedAt: string
  entries: ArtPatternEntry[]
}

export type MixSlot = {
  sectorKey: string
  preferTags: string[]
}

const WHITE = /^(#fff(?:fff)?|#ffffff|white|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))$/i

let cached: { dir: string; data: ArtPatternLibraryFile } | null = null
const markupCache = new Map<string, string>()

export function resolveArtPatternLibraryDir(): string {
  return process.env.FORMA_ART_PATTERN_LIBRARY || ART_PATTERN_ASSET_DIR
}

export function clearArtPatternLibraryCache(): void {
  cached = null
  markupCache.clear()
}

export function slugFromFilename(name: string): string {
  const stem = name.replace(/\.[a-z0-9]+$/i, '')
  const ascii = stem
    .replace(/\s*\[d[oö]n[uü][sş]t[uü]r[uü]lm[uü][sş]\]/gi, '')
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 'S')
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'U')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'O')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'C')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return ascii || 'pattern'
}

export function tagsFromFilename(name: string): string[] {
  const n = name.toLowerCase()
  const tags = new Set<string>()
  if (/art[-_\s]?deco|artdeco/.test(n)) {
    tags.add('classic')
    tags.add('artdeco')
  }
  if (/vintage/.test(n)) {
    tags.add('classic')
    tags.add('vintage')
  }
  if (/leaf|botanic|organic|palm|meadow/.test(n)) tags.add('eco')
  if (/blob|playful/.test(n)) tags.add('playful')
  if (/pattern\d|geometric|hex|grid|deco/.test(n) && !tags.has('artdeco')) tags.add('geometric')
  if (/artdeco/.test(n)) tags.add('geometric')
  if (/islamic|ornament/.test(n)) tags.add('classic')
  if (tags.size === 0) tags.add('misc')
  return [...tags]
}

export function placementFromFilename(name: string): PlacementHint {
  const n = name.toLowerCase()
  if (/frame|border|islamic/.test(n)) return 'frame'
  if (/divider|band|m04_i036/.test(n)) return 'band'
  return 'field'
}

export function skipReasonForSvg(name: string, markup: string): string | undefined {
  const title = markup.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? ''
  if (/dieline/i.test(title) || /dieline/i.test(name)) return 'dieline-not-pattern'
  if (/FORMA dieline/i.test(markup)) return 'dieline-not-pattern'
  if (/<text[^>]*>\s*(glue|front|topTuck|bottomTuck)\s*</i.test(markup) && /stroke="#c00"/i.test(markup)) {
    return 'dieline-not-pattern'
  }
  return undefined
}

export function assertAllowedSourceDir(sourceDir: string): void {
  const normalized = sourceDir.replace(/\//g, '\\')
  if (normalized.includes(FORBIDDEN_SOURCE_NAME)) {
    throw new Error(`Refusing ${FORBIDDEN_SOURCE_NAME}. Phase 12 reads only ART-PATTERN-DESİGN.`)
  }
}

function uniqueId(slug: string, used: Set<string>): string {
  let id = slug
  let n = 2
  while (used.has(id)) {
    id = `${slug}-${n}`
    n += 1
  }
  used.add(id)
  return id
}

function listPatternFiles(sourceDir: string): { abs: string; name: string }[] {
  if (!existsSync(sourceDir)) {
    throw new Error(`ART-PATTERN-DESİGN not found: ${sourceDir}. Drop SVGs there, then re-run.`)
  }
  const found: { abs: string; name: string }[] = []
  const walk = (dir: string) => {
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, ent.name)
      if (ent.isDirectory()) walk(abs)
      else if (/\.(svg|png)$/i.test(ent.name)) found.push({ abs, name: ent.name })
    }
  }
  walk(sourceDir)
  found.sort((a, b) => a.name.localeCompare(b.name, 'en'))
  if (!found.length) {
    throw new Error(
      `ART-PATTERN-DESİGN is empty: ${sourceDir}. Refusing to fall back to ${FORBIDDEN_SOURCE_NAME}.`,
    )
  }
  return found
}

export function parseViewBox(svg: string): { x: number; y: number; w: number; h: number; raw: string } {
  const raw = svg.match(/viewBox\s*=\s*"([^"]+)"/i)?.[1] ?? '0 0 100 100'
  const parts = raw.trim().split(/[\s,]+/).map(Number)
  const [x, y, w, h] = [parts[0] || 0, parts[1] || 0, parts[2] || 100, parts[3] || 100]
  return { x, y, w, h, raw }
}

function isWhiteFill(value: string): boolean {
  return WHITE.test(value.trim())
}

function neutralizeRect(
  attrs: string,
  vb: { w: number; h: number },
): { attrs: string; plateClass?: string } {
  const width = parseFloat(attrs.match(/\bwidth="([^"]+)"/)?.[1] ?? '0')
  const height = parseFloat(attrs.match(/\bheight="([^"]+)"/)?.[1] ?? '0')
  const fill = attrs.match(/\bfill="([^"]+)"/)?.[1]
  const cls = attrs.match(/\bclass="([^"]+)"/)?.[1]?.split(/\s+/)[0]
  const area = width * height
  const vbArea = Math.max(1, vb.w * vb.h)
  const isLarge = area > vbArea * 0.78 || (width >= vb.w * 0.95 && height >= vb.h * 0.95)
  if (!isLarge) return { attrs }
  if (fill && isWhiteFill(fill)) {
    return { attrs: attrs.replace(/\bfill="[^"]+"/, 'fill="none"') }
  }
  if (cls && !fill) return { attrs, plateClass: cls }
  return { attrs }
}

/** Strip full-bleed white plates; map solid fills toward currentColor; keep viewBox. */
export function normalizeArtPatternSvg(markup: string): { markup: string; viewBox: string } {
  let svg = markup.replace(/^\uFEFF/, '')
  const vb = parseViewBox(svg)
  const plateClasses = new Set<string>()

  svg = svg.replace(/<rect\b([^>]*?)(\/>|>)/gi, (_full, attrs: string, tail: string) => {
    const next = neutralizeRect(attrs, vb)
    if (next.plateClass) plateClasses.add(next.plateClass)
    return `<rect${next.attrs}${tail}`
  })

  for (const cls of plateClasses) {
    const re = new RegExp(`\\.${cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`, 'g')
    svg = svg.replace(re, (_block, body: string) => {
      const next = String(body).replace(/fill:\s*#[0-9a-fA-F]{3,8}/i, 'fill: none')
      return `.${cls} {${next}}`
    })
  }

  svg = svg.replace(/fill:\s*(#[0-9a-fA-F]{3,8}|white)\s*;/gi, (_m, color: string) => {
    if (isWhiteFill(color)) return 'fill: none;'
    return 'fill: currentColor;'
  })
  svg = svg.replace(/\bfill="(#[0-9a-fA-F]{3,8}|white)"/gi, (_m, color: string) => {
    if (isWhiteFill(color)) return 'fill="none"'
    return 'fill="currentColor"'
  })
  svg = svg.replace(/\bstroke="(#[0-9a-fA-F]{3,8})"/gi, 'stroke="currentColor"')
  svg = svg.replace(/stop-color="[^"]+"/gi, 'stop-color="currentColor"')

  if (!/\sxmlns=/.test(svg)) {
    svg = svg.replace(/<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"')
  }
  return { markup: svg, viewBox: vb.raw }
}

export function ingestArtPatternLibrary(
  sourceDir = ART_PATTERN_SOURCE_DIR,
  destDir = ART_PATTERN_ASSET_DIR,
): ArtPatternEntry[] {
  assertAllowedSourceDir(sourceDir)
  const files = listPatternFiles(sourceDir)
  mkdirSync(destDir, { recursive: true })
  const used = new Set<string>()
  const entries: ArtPatternEntry[] = []

  for (const file of files) {
    const id = uniqueId(slugFromFilename(file.name), used)
    const assetPath = path.join(destDir, `${id}.svg`)
    let skipReason: string | undefined
    let viewBox: string | undefined
    let bytes = 0

    if (/\.png$/i.test(file.name)) {
      const pngDest = path.join(destDir, `${id}.png`)
      writeFileSync(pngDest, readFileSync(file.abs))
      bytes = readFileSync(pngDest).length
      entries.push({
        id,
        sourcePath: file.abs,
        sourceName: file.name,
        assetPath: pngDest,
        tags: tagsFromFilename(file.name),
        placementHint: placementFromFilename(file.name),
        bytes,
      })
      continue
    }

    const raw = readFileSync(file.abs, 'utf8')
    bytes = Buffer.byteLength(raw, 'utf8')
    skipReason = skipReasonForSvg(file.name, raw)
    const normalized = skipReason ? { markup: raw, viewBox: parseViewBox(raw).raw } : normalizeArtPatternSvg(raw)
    viewBox = normalized.viewBox
    writeFileSync(assetPath, normalized.markup, 'utf8')
    entries.push({
      id,
      sourcePath: file.abs,
      sourceName: file.name,
      assetPath,
      tags: tagsFromFilename(file.name),
      placementHint: skipReason ? 'field' : placementFromFilename(file.name),
      skipReason,
      viewBox,
      bytes,
    })
  }

  const data: ArtPatternLibraryFile = {
    sourceDir,
    ingestedAt: new Date().toISOString(),
    entries,
  }
  writeFileSync(path.join(destDir, 'library.json'), JSON.stringify(data, null, 2), 'utf8')
  cached = { dir: destDir, data }
  markupCache.clear()
  return entries
}

export function loadArtPatternLibrary(dir = resolveArtPatternLibraryDir()): ArtPatternEntry[] {
  if (cached?.dir === dir) return cached.data.entries
  const jsonPath = path.join(dir, 'library.json')
  if (!existsSync(jsonPath)) return []
  const data = JSON.parse(readFileSync(jsonPath, 'utf8')) as ArtPatternLibraryFile
  cached = { dir, data }
  return data.entries
}

export function usableArtPatterns(entries = loadArtPatternLibrary()): ArtPatternEntry[] {
  return entries.filter((e) => !e.skipReason)
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const next = items.slice()
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

export function assignMixPatterns(
  entries: ArtPatternEntry[],
  slots: MixSlot[],
  seed = 12,
): { sectorKey: string; entry: ArtPatternEntry }[] {
  const pool = shuffle(usableArtPatterns(entries), mulberry32(seed))
  const taken = new Set<string>()
  const out: { sectorKey: string; entry: ArtPatternEntry }[] = []
  for (const slot of slots) {
    const open = pool.filter((e) => !taken.has(e.id))
    const ranked = open
      .map((entry) => {
        const hit = slot.preferTags.findIndex((t) => entry.tags.includes(t))
        return { entry, hit: hit === -1 ? Number.POSITIVE_INFINITY : hit }
      })
      .sort((a, b) => a.hit - b.hit)
    const preferred = ranked[0]?.entry
    if (!preferred) break
    taken.add(preferred.id)
    out.push({ sectorKey: slot.sectorKey, entry: preferred })
  }
  return out
}

function hexLuma(hex: string): number {
  const n = hex.replace('#', '')
  if (n.length < 6) return 0.5
  const r = parseInt(n.slice(0, 2), 16)
  const g = parseInt(n.slice(2, 4), 16)
  const b = parseInt(n.slice(4, 6), 16)
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

export function patternOpacity(style: StyleType | string | undefined, hint: PlacementHint): number {
  const base = hint === 'frame' ? 0.14 : hint === 'band' ? 0.13 : 0.11
  if (style === 'minimal') return 0.08
  if (style === 'luxury') return Math.min(0.16, base + 0.02)
  if (style === 'modern') return 0.1
  return Math.max(0.08, Math.min(0.16, base))
}

function placementRect(panel: Panel, hint: PlacementHint): { x: number; y: number; w: number; h: number; par: string } {
  const { x, y, w, h } = panel
  if (hint === 'band') {
    return { x, y, w, h: Math.max(8, h * 0.22), par: 'xMidYMid slice' }
  }
  if (hint === 'frame') {
    const inset = Math.min(w, h) * 0.04
    return { x: x + inset, y: y + inset, w: w - inset * 2, h: h - inset * 2, par: 'xMidYMid meet' }
  }
  return { x, y, w, h, par: 'xMidYMid slice' }
}

function readAssetMarkup(entry: ArtPatternEntry): string {
  const hit = markupCache.get(entry.assetPath)
  if (hit) return hit
  if (!existsSync(entry.assetPath)) return ''
  const raw = readFileSync(entry.assetPath, 'utf8')
  markupCache.set(entry.assetPath, raw)
  return raw
}

function tintMarkup(svg: string, accent: string): string {
  return svg.replace(/currentColor/g, accent)
}

function toImageHref(svg: string): string {
  const b64 = Buffer.from(svg, 'utf8').toString('base64')
  return `data:image/svg+xml;base64,${b64}`
}

export function paintArtPattern(
  panel: Panel,
  p: Palette,
  entry: ArtPatternEntry,
  opts: { safe?: SafeRect; style?: StyleType | string } = {},
): string {
  if (entry.skipReason) return ''
  const markup = readAssetMarkup(entry)
  if (!markup) return ''
  const tinted = tintMarkup(markup, p.accent)
  const href = toImageHref(tinted)
  const box = placementRect(panel, entry.placementHint)
  const op = patternOpacity(opts.style, entry.placementHint)
  const blend = hexLuma(p.bg) < 0.45 ? 'soft-light' : 'multiply'
  const clip = opts.safe && panel.id ? ` clip-path="url(#lockout-${panel.id})"` : ''
  const x = box.x.toFixed(2)
  const y = box.y.toFixed(2)
  const w = box.w.toFixed(2)
  const h = box.h.toFixed(2)
  return `<image data-art="art-pattern" data-pattern-lib="${entry.id}" data-placement="${entry.placementHint}" x="${x}" y="${y}" width="${w}" height="${h}" href="${href}" opacity="${op}" style="mix-blend-mode:${blend}" preserveAspectRatio="${box.par}"${clip} />`
}

export function paintArtPatternOverlay(
  panel: Panel,
  p: Palette,
  artPatternId: string,
  opts: { safe?: SafeRect; style?: StyleType | string } = {},
): string {
  const entry = loadArtPatternLibrary().find((item) => item.id === artPatternId)
  if (!entry) return ''
  return paintArtPattern(panel, p, entry, opts)
}
