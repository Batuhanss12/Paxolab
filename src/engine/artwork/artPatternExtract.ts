/**
 * Decompose ART-PATTERN-DESİGN SVGs into reusable parts:
 * compositional crops (tile / frame / band / medallion) plus top-level groups
 * and (for small files) individual paths. Originals are never edited.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  ART_PATTERN_ASSET_DIR,
  type ArtPatternEntry,
  loadArtPatternLibrary,
  parseViewBox,
  usableArtPatterns,
} from './artPatternLibrary'

export type PatternPartKind =
  | 'full'
  | 'tile-center'
  | 'tile-nw'
  | 'tile-ne'
  | 'tile-sw'
  | 'tile-se'
  | 'band-top'
  | 'band-bottom'
  | 'rail-left'
  | 'rail-right'
  | 'frame-ring'
  | 'medallion'
  | 'part'

export type PatternPart = {
  id: string
  sourceId: string
  kind: PatternPartKind
  viewBox: string
  markup: string
  bytes: number
}

export type PatternAnalysis = {
  sourceId: string
  sourceName: string
  viewBox: string
  bytes: number
  tags: string[]
  placementHint: string
  counts: {
    paths: number
    groups: number
    rects: number
    circles: number
    ellipses: number
    polygons: number
    topLevel: number
    gradients: number
  }
  aspect: number
  role: 'frame' | 'band' | 'tile' | 'ornament' | 'illustration'
  parts: PatternPart[]
}

const SKIP_TAGS = new Set(['defs', 'style', 'title', 'desc', 'metadata', 'sodipodi:namedview'])

function unwrapSvg(svg: string): { open: string; defs: string; body: string } {
  const open = svg.match(/<svg\b[^>]*>/i)?.[0] ?? '<svg xmlns="http://www.w3.org/2000/svg">'
  const defs = svg.match(/<defs\b[\s\S]*?<\/defs>/i)?.[0] ?? ''
  let body = svg.replace(/^[\s\S]*?<svg\b[^>]*>/i, '').replace(/<\/svg>\s*$/i, '')
  body = body.replace(/<defs\b[\s\S]*?<\/defs>/i, '')
  body = body.replace(/<\?xml[^?]+\?>/g, '').trim()
  return { open, defs, body }
}

function wrapSvg(viewBox: string, defs: string, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${viewBox}">\n${defs}\n${body}\n</svg>\n`
}

function topLevelNodes(body: string): { tag: string; markup: string }[] {
  const nodes: { tag: string; markup: string }[] = []
  let i = 0
  const s = body
  while (i < s.length) {
    const start = s.indexOf('<', i)
    if (start === -1) break
    if (s.startsWith('<!--', start)) {
      const end = s.indexOf('-->', start)
      i = end === -1 ? s.length : end + 3
      continue
    }
    const tagMatch = s.slice(start).match(/^<\/?([A-Za-z][\w:.-]*)/)
    if (!tagMatch) {
      i = start + 1
      continue
    }
    const tag = tagMatch[1].toLowerCase()
    if (s[start + 1] === '/') {
      i = start + 1
      continue
    }
    const gt = s.indexOf('>', start)
    if (gt === -1) break
    const head = s.slice(start, gt + 1)
    const selfClose = /\/\s*>$/.test(head)
    if (selfClose) {
      if (!SKIP_TAGS.has(tag)) nodes.push({ tag, markup: head })
      i = gt + 1
      continue
    }
    const close = `</${tagMatch[1]}>`
    let depth = 1
    let cursor = gt + 1
    while (depth > 0 && cursor < s.length) {
      const nextOpen = s.indexOf(`<${tagMatch[1]}`, cursor)
      const nextClose = s.indexOf(close, cursor)
      if (nextClose === -1) {
        cursor = s.length
        break
      }
      if (nextOpen !== -1 && nextOpen < nextClose && !s.startsWith(`</`, nextOpen)) {
        depth += 1
        cursor = nextOpen + tagMatch[1].length + 1
      } else {
        depth -= 1
        cursor = nextClose + close.length
      }
    }
    const markup = s.slice(start, cursor)
    if (!SKIP_TAGS.has(tag)) nodes.push({ tag, markup })
    i = cursor
  }
  return nodes
}

function countTag(svg: string, tag: string): number {
  return (svg.match(new RegExp(`<${tag}\\b`, 'gi')) || []).length
}

function inferRole(entry: ArtPatternEntry, counts: PatternAnalysis['counts'], aspect: number): PatternAnalysis['role'] {
  if (entry.placementHint === 'frame') return 'frame'
  if (entry.placementHint === 'band') return 'band'
  if (aspect > 2.4 || aspect < 0.42) return 'band'
  if (entry.tags.includes('artdeco') || entry.tags.includes('geometric') || entry.tags.includes('vintage')) return 'tile'
  const primitives = counts.paths + counts.polygons + counts.circles + counts.ellipses
  if (entry.bytes < 80_000 && primitives <= 8 && counts.topLevel <= 8) return 'ornament'
  return 'illustration'
}

function cropRect(
  vb: { x: number; y: number; w: number; h: number },
  fx: number,
  fy: number,
  fw: number,
  fh: number,
) {
  return {
    x: vb.x + vb.w * fx,
    y: vb.y + vb.h * fy,
    w: vb.w * fw,
    h: vb.h * fh,
  }
}

function croppedSvg(
  sourceId: string,
  kind: PatternPartKind,
  vb: { x: number; y: number; w: number; h: number },
  crop: { x: number; y: number; w: number; h: number },
  defs: string,
  body: string,
  evenoddHole = false,
): PatternPart {
  const clipId = `ap-${sourceId}-${kind}`.replace(/[^a-zA-Z0-9_-]/g, '')
  const clip = evenoddHole
    ? `<clipPath id="${clipId}" clipPathUnits="userSpaceOnUse"><path fill-rule="evenodd" d="M${vb.x} ${vb.y}h${vb.w}v${vb.h}h${-vb.w}z M${crop.x} ${crop.y}h${crop.w}v${crop.h}h${-crop.w}z"/></clipPath>`
    : `<clipPath id="${clipId}" clipPathUnits="userSpaceOnUse"><rect x="${crop.x}" y="${crop.y}" width="${crop.w}" height="${crop.h}"/></clipPath>`
  const viewBox = evenoddHole
    ? `${vb.x} ${vb.y} ${vb.w} ${vb.h}`
    : `${crop.x} ${crop.y} ${crop.w} ${crop.h}`
  const markup = wrapSvg(
    viewBox,
    `${defs}\n<defs>${clip}</defs>`,
    `<g clip-path="url(#${clipId})">${body}</g>`,
  )
  return {
    id: `${sourceId}__${kind}`,
    sourceId,
    kind,
    viewBox,
    markup,
    bytes: Buffer.byteLength(markup, 'utf8'),
  }
}

function partSvg(sourceId: string, index: number, vbRaw: string, defs: string, nodeMarkup: string): PatternPart {
  const markup = wrapSvg(vbRaw, defs, nodeMarkup)
  return {
    id: `${sourceId}__part-${String(index).padStart(2, '0')}`,
    sourceId,
    kind: 'part',
    viewBox: vbRaw,
    markup,
    bytes: Buffer.byteLength(markup, 'utf8'),
  }
}

export function analyzeAndExtract(entry: ArtPatternEntry, raw: string): PatternAnalysis {
  const vb = parseViewBox(raw)
  const { defs, body } = unwrapSvg(raw)
  const nodes = topLevelNodes(body)
  const counts = {
    paths: countTag(raw, 'path'),
    groups: countTag(raw, 'g'),
    rects: countTag(raw, 'rect'),
    circles: countTag(raw, 'circle'),
    ellipses: countTag(raw, 'ellipse'),
    polygons: countTag(raw, 'polygon'),
    topLevel: nodes.length,
    gradients: countTag(raw, 'linearGradient') + countTag(raw, 'radialGradient'),
  }
  const aspect = vb.w / Math.max(1, vb.h)
  const role = inferRole(entry, counts, aspect)
  const parts: PatternPart[] = []

  const fullMarkup = raw.startsWith('<svg') ? raw : wrapSvg(vb.raw, defs, body)
  parts.push({
    id: `${entry.id}__full`,
    sourceId: entry.id,
    kind: 'full',
    viewBox: vb.raw,
    markup: fullMarkup,
    bytes: Buffer.byteLength(fullMarkup, 'utf8'),
  })

  const center = cropRect(vb, 0.32, 0.32, 0.36, 0.36)
  parts.push(croppedSvg(entry.id, 'tile-center', vb, center, defs, body))
  parts.push(croppedSvg(entry.id, 'tile-nw', vb, cropRect(vb, 0, 0, 0.32, 0.32), defs, body))
  parts.push(croppedSvg(entry.id, 'tile-ne', vb, cropRect(vb, 0.68, 0, 0.32, 0.32), defs, body))
  parts.push(croppedSvg(entry.id, 'tile-sw', vb, cropRect(vb, 0, 0.68, 0.32, 0.32), defs, body))
  parts.push(croppedSvg(entry.id, 'tile-se', vb, cropRect(vb, 0.68, 0.68, 0.32, 0.32), defs, body))
  parts.push(croppedSvg(entry.id, 'band-top', vb, cropRect(vb, 0, 0, 1, 0.2), defs, body))
  parts.push(croppedSvg(entry.id, 'band-bottom', vb, cropRect(vb, 0, 0.8, 1, 0.2), defs, body))
  parts.push(croppedSvg(entry.id, 'rail-left', vb, cropRect(vb, 0, 0, 0.16, 1), defs, body))
  parts.push(croppedSvg(entry.id, 'rail-right', vb, cropRect(vb, 0.84, 0, 0.16, 1), defs, body))
  const hole = cropRect(vb, 0.14, 0.14, 0.72, 0.72)
  parts.push(croppedSvg(entry.id, 'frame-ring', vb, hole, defs, body, true))
  parts.push(croppedSvg(entry.id, 'medallion', vb, cropRect(vb, 0.38, 0.38, 0.24, 0.24), defs, body))

  const extractParts = entry.bytes < 120_000 && nodes.length >= 2 && nodes.length <= 24
  if (extractParts) {
    nodes.forEach((node, i) => {
      if (node.markup.length < 40) return
      parts.push(partSvg(entry.id, i, vb.raw, defs, node.markup))
    })
  }

  return {
    sourceId: entry.id,
    sourceName: entry.sourceName,
    viewBox: vb.raw,
    bytes: entry.bytes,
    tags: entry.tags,
    placementHint: entry.placementHint,
    counts,
    aspect,
    role,
    parts,
  }
}

export function writePatternParts(
  analyses: PatternAnalysis[],
  destDir: string,
): void {
  mkdirSync(destDir, { recursive: true })
  for (const analysis of analyses) {
    const dir = path.join(destDir, analysis.sourceId)
    mkdirSync(dir, { recursive: true })
    for (const part of analysis.parts) {
      writeFileSync(path.join(dir, `${part.kind === 'part' ? part.id.split('__')[1] : part.kind}.svg`), part.markup, 'utf8')
    }
  }
}

export function extractLibraryParts(
  entries = usableArtPatterns(loadArtPatternLibrary()),
): PatternAnalysis[] {
  return entries.map((entry) => {
    const raw = existsSync(entry.assetPath) ? readFileSync(entry.assetPath, 'utf8') : ''
    return analyzeAndExtract(entry, raw)
  })
}

export function componentsRoot(base = ART_PATTERN_ASSET_DIR): string {
  return path.join(base, 'components')
}
