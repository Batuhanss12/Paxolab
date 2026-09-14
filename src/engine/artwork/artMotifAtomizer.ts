/**
 * Phase 14 — Motif Atomizer.
 * Sheet SVG → atoms with tight viewBoxes (real parts, not viewBox crops of the full body).
 */
import {
  type BBox,
  type Matrix,
  IDENTITY,
  bboxArea,
  bboxExpand,
  bboxOverlaps,
  bboxPad,
  bboxUnion,
  bboxViewBox,
  countPrimitives,
  multiply,
  parseTransform,
  primitiveBBox,
} from './artMotifGeom'
import { parseViewBox, type ArtPatternEntry } from './artPatternLibrary'
import { ensureMotifDesign, type MotifDesignMetadata, type MotifRole } from './artMotifMeta'

export type { MotifRole, MotifDesignMetadata }

export type MotifAtom = {
  id: string
  sheetId: string
  sourceName: string
  bbox: BBox
  viewBox: string
  markup: string
  bytes: number
  tags: string[]
  roleGuess: MotifRole
  roleConfirmed?: MotifRole
  complexity: number
  design?: MotifDesignMetadata
}

const SKIP_TAGS = new Set([
  'defs',
  'style',
  'title',
  'desc',
  'metadata',
  'sodipodi:namedview',
  'clippath',
  'mask',
  'filter',
  'lineargradient',
  'radialgradient',
])

const PRIMITIVE = new Set(['path', 'circle', 'ellipse', 'rect', 'polygon', 'polyline', 'line'])
const MAX_ATOMS = 40

type Node = { tag: string; markup: string }

export function svgNodes(body: string): Node[] {
  const nodes: Node[] = []
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
      if (nextOpen !== -1 && nextOpen < nextClose && !s.startsWith('</', nextOpen)) {
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

export function unwrapSvg(svg: string): { defs: string; body: string } {
  const defs = svg.match(/<defs\b[\s\S]*?<\/defs>/i)?.[0] ?? ''
  const style = svg.match(/<style\b[\s\S]*?<\/style>/i)?.[0] ?? ''
  let body = svg.replace(/^[\s\S]*?<svg\b[^>]*>/i, '').replace(/<\/svg>\s*$/i, '')
  body = body.replace(/<defs\b[\s\S]*?<\/defs>/i, '')
  body = body.replace(/<\?xml[^?]+\?>/g, '').trim()
  const bundled = [defs, !defs.includes('<style') ? style : ''].filter(Boolean).join('\n')
  return { defs: bundled, body }
}

function innerMarkup(markup: string): string {
  const gt = markup.indexOf('>')
  if (gt < 0) return ''
  if (/\/\s*>$/.test(markup.slice(0, gt + 1))) return ''
  const close = markup.lastIndexOf('</')
  if (close < 0) return markup.slice(gt + 1)
  return markup.slice(gt + 1, close)
}

function openTag(markup: string): string {
  const gt = markup.indexOf('>')
  return gt >= 0 ? markup.slice(0, gt + 1) : markup
}

function nodeTransform(markup: string, parent: Matrix): Matrix {
  const tr = openTag(markup).match(/\btransform="([^"]+)"/i)?.[1]
  return multiply(parent, parseTransform(tr))
}

function isPlateRect(node: Node, sheet: BBox): boolean {
  if (node.tag !== 'rect') return false
  const box = primitiveBBox(node.markup)
  if (!box) return true
  return bboxArea(box) > bboxArea(sheet) * 0.78
}

function nodeBBox(node: Node, parent: Matrix = IDENTITY): BBox | null {
  const mat = nodeTransform(node.markup, parent)
  if (PRIMITIVE.has(node.tag)) return primitiveBBox(node.markup, parent)
  if (node.tag !== 'g') return primitiveBBox(node.markup, parent)
  let box: BBox | null = null
  for (const child of svgNodes(innerMarkup(node.markup))) {
    box = bboxUnion(box, nodeBBox(child, mat))
  }
  return box
}

function wrapAtom(viewBox: string, defs: string, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${viewBox}">\n${defs}\n${body}\n</svg>\n`
}

function guessRole(box: BBox, sheet: BBox, complexity: number): MotifRole {
  const ar = box.w / Math.max(0.01, box.h)
  const areaFrac = bboxArea(box) / Math.max(1, bboxArea(sheet))
  const cx = (box.x + box.w / 2 - sheet.x) / Math.max(1, sheet.w)
  const cy = (box.y + box.h / 2 - sheet.y) / Math.max(1, sheet.h)
  if (ar > 2.4 || ar < 0.42) return 'band'
  if (areaFrac > 0.55) return cy < 0.2 || cy > 0.8 || cx < 0.18 || cx > 0.82 ? 'frame' : 'field-fill'
  const corner =
    (cx < 0.22 && cy < 0.22) ||
    (cx > 0.78 && cy < 0.22) ||
    (cx < 0.22 && cy > 0.78) ||
    (cx > 0.78 && cy > 0.78)
  if (corner && areaFrac < 0.28) return 'corner'
  if (complexity <= 6 && areaFrac < 0.2) return 'stamp'
  if (areaFrac < 0.18) return 'stamp'
  return 'ornament'
}

function guessTags(role: MotifRole, sourceTags: string[]): string[] {
  const tags = new Set(sourceTags)
  tags.add(role)
  if (role === 'band') tags.add('border')
  if (role === 'corner' || role === 'frame') tags.add('border')
  if (role === 'stamp' || role === 'ornament') tags.add('crestish')
  return [...tags]
}

type RawAtom = { markup: string; bbox: BBox; complexity: number }

function clusterRaw(items: RawAtom[], sheet: BBox, gapFrac: number): RawAtom[] {
  const n = items.length
  if (n <= 1) return items
  const gap = Math.min(sheet.w, sheet.h) * gapFrac
  const parent = Array.from({ length: n }, (_, i) => i)
  const find = (a: number): number => {
    while (parent[a] !== a) {
      parent[a] = parent[parent[a]]
      a = parent[a]
    }
    return a
  }
  const unite = (a: number, b: number) => {
    const pa = find(a)
    const pb = find(b)
    if (pa !== pb) parent[pa] = pb
  }
  const expanded = items.map((item) => bboxExpand(item.bbox, gap))
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (bboxOverlaps(expanded[i], expanded[j])) unite(i, j)
    }
  }
  const groups = new Map<number, RawAtom[]>()
  for (let i = 0; i < n; i++) {
    const root = find(i)
    const list = groups.get(root) ?? []
    list.push(items[i])
    groups.set(root, list)
  }
  const out: RawAtom[] = []
  for (const list of groups.values()) {
    let box: BBox | null = null
    let complexity = 0
    const markup = list.map((item) => item.markup).join('')
    for (const item of list) {
      box = bboxUnion(box, item.bbox)
      complexity += item.complexity
    }
    if (box) out.push({ markup, bbox: box, complexity })
  }
  return out
}

function adaptiveCluster(items: RawAtom[], sheet: BBox): RawAtom[] {
  if (items.length <= MAX_ATOMS) {
    const clustered = clusterRaw(items, sheet, 0.018)
    if (clustered.length >= 8) return clustered
  }
  for (const gap of [0.02, 0.012, 0.007, 0.004]) {
    const clustered = clusterRaw(items, sheet, gap)
    if (clustered.length >= 12 && clustered.length <= MAX_ATOMS) return clustered
    if (clustered.length > MAX_ATOMS) {
      return clustered.sort((a, b) => bboxArea(b.bbox) - bboxArea(a.bbox)).slice(0, MAX_ATOMS)
    }
  }
  return items.sort((a, b) => bboxArea(b.bbox) - bboxArea(a.bbox)).slice(0, MAX_ATOMS)
}

function toRaw(node: Node, sheet: BBox, mat: Matrix): RawAtom | null {
  if (isPlateRect(node, sheet)) return null
  const box = nodeBBox(node, mat)
  if (!box || box.w < 0.4 || box.h < 0.4) return null
  if (bboxArea(box) < bboxArea(sheet) * 0.00008) return null
  return { markup: node.markup, bbox: box, complexity: Math.max(1, countPrimitives(node.markup)) }
}

function unwrapGroup(node: Node, sheet: BBox): Node {
  let cur = node
  for (let i = 0; i < 6; i++) {
    if (cur.tag !== 'g') return cur
    const children = svgNodes(innerMarkup(cur.markup))
    if (children.length === 1 && children[0].tag === 'g') {
      cur = children[0]
      continue
    }
    const withoutPlates = children.filter((k) => !isPlateRect(k, sheet))
    if (withoutPlates.length === 1 && withoutPlates[0].tag === 'g') {
      cur = withoutPlates[0]
      continue
    }
    return cur
  }
  return cur
}

function childCount(node: Node): number {
  if (node.tag !== 'g') return 0
  return svgNodes(innerMarkup(node.markup)).length
}

function collectStructural(nodes: Node[], sheet: BBox, depth: number, mat: Matrix): RawAtom[] {
  const unwrapped = nodes.map((node) => unwrapGroup(node, sheet))
  const usable = unwrapped.filter((n) => !isPlateRect(n, sheet))
  if (!usable.length || depth > 6) return []

  const heavy = usable.filter((n) => n.tag === 'g' && childCount(n) >= 8)
  if (heavy.length === 1 && usable.length <= 4 && depth < 6) {
    const node = heavy[0]
    return collectStructural(svgNodes(innerMarkup(node.markup)), sheet, depth + 1, nodeTransform(node.markup, mat))
  }

  if (usable.length === 1 && usable[0].tag === 'g' && depth < 6) {
    const kids = svgNodes(innerMarkup(usable[0].markup))
    if (kids.length >= 2) {
      return collectStructural(kids, sheet, depth + 1, nodeTransform(usable[0].markup, mat))
    }
  }

  const groups = usable.filter((n) => n.tag === 'g')
  const prims = usable.filter((n) => n.tag !== 'g')

  if (usable.length > 48 || (prims.length > 40 && groups.length < 8)) {
    const leftover: RawAtom[] = []
    const kept: RawAtom[] = []
    for (const node of usable) {
      if (node.tag === 'g' && countPrimitives(node.markup) >= 2 && node.markup.length > 800) {
        const raw = toRaw(node, sheet, mat)
        if (raw && bboxArea(raw.bbox) < bboxArea(sheet) * 0.8) kept.push(raw)
        else {
          const childMat = nodeTransform(node.markup, mat)
          leftover.push(
            ...svgNodes(innerMarkup(node.markup))
              .map((c) => toRaw(c, sheet, childMat))
              .filter((x): x is RawAtom => !!x),
          )
        }
      } else {
        const raw = toRaw(node, sheet, mat)
        if (raw) leftover.push(raw)
      }
    }
    return [...kept, ...adaptiveCluster(leftover, sheet)]
  }

  if (groups.length >= 8 || (groups.length >= 2 && prims.length < usable.length * 0.55)) {
    const out: RawAtom[] = []
    const leftover: RawAtom[] = []
    for (const node of usable) {
      const raw = toRaw(node, sheet, mat)
      if (!raw) continue
      if (bboxArea(raw.bbox) > bboxArea(sheet) * 0.8 && node.tag === 'g' && depth < 4) {
        const childMat = nodeTransform(node.markup, mat)
        const deeper = collectStructural(svgNodes(innerMarkup(node.markup)), sheet, depth + 1, childMat)
        if (deeper.length >= 2) {
          out.push(...deeper)
          continue
        }
      }
      if (node.tag === 'g' && countPrimitives(node.markup) <= 1 && raw.complexity <= 1) leftover.push(raw)
      else out.push(raw)
    }
    if (leftover.length) out.push(...adaptiveCluster(leftover, sheet))
    return out
  }

  return usable.map((n) => toRaw(n, sheet, mat)).filter((x): x is RawAtom => !!x)
}

function dedupeCopies(nodes: Node[]): Node[] {
  if (nodes.length < 2 || nodes.length > 8) return nodes
  if (nodes.some((n) => n.markup.length < 40_000)) return nodes
  const sizes = nodes.map((n) => n.markup.length)
  const mean = sizes.reduce((a, b) => a + b, 0) / sizes.length
  const similar = sizes.every((s) => Math.abs(s - mean) / Math.max(1, mean) < 0.08)
  if (similar && nodes.every((n) => n.tag === 'g')) return [nodes[0]]
  return nodes
}

function finishAtoms(
  raw: RawAtom[],
  entry: ArtPatternEntry,
  sheet: BBox,
  defs: string,
): MotifAtom[] {
  const sheetArea = bboxArea(sheet)
  const minArea = sheetArea * 0.0002
  const filtered = raw
    .filter((item) => {
      const area = bboxArea(item.bbox)
      if (area < minArea || item.complexity < 1) return false
      if (area > sheetArea * 0.72) return false
      if (entry.bytes > 200_000 && item.markup.length > entry.bytes * 0.42) return false
      return true
    })
    .sort((a, b) => bboxArea(b.bbox) - bboxArea(a.bbox))
    .slice(0, MAX_ATOMS)

  return filtered.map((item, i) => {
    const pad = Math.min(6, Math.max(0.8, Math.max(item.bbox.w, item.bbox.h) * 0.03))
    const tight = bboxPad(item.bbox, pad)
    const viewBox = bboxViewBox(tight)
    const markup = wrapAtom(viewBox, defs, item.markup)
    const roleGuess = guessRole(item.bbox, sheet, item.complexity)
    const atom: MotifAtom = {
      id: `${entry.id}__atom-${String(i).padStart(2, '0')}`,
      sheetId: entry.id,
      sourceName: entry.sourceName,
      bbox: { x: round2(item.bbox.x), y: round2(item.bbox.y), w: round2(item.bbox.w), h: round2(item.bbox.h) },
      viewBox,
      markup,
      bytes: Buffer.byteLength(markup, 'utf8'),
      tags: guessTags(roleGuess, entry.tags),
      roleGuess,
      complexity: item.complexity,
    }
    return ensureMotifDesign(atom, sheet)
  })
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

const atomCache = new Map<string, MotifAtom[]>()

export function clearArtMotifAtomizerCache(): void {
  atomCache.clear()
}

export function atomizeArtPattern(entry: ArtPatternEntry, raw: string): MotifAtom[] {
  if (entry.skipReason) return []
  const key = `${entry.id}:${entry.bytes}:${raw.length}`
  const hit = atomCache.get(key)
  if (hit) return hit
  const vb = parseViewBox(raw)
  const sheet: BBox = { x: vb.x, y: vb.y, w: vb.w, h: vb.h }
  const { defs, body } = unwrapSvg(raw)
  const top = dedupeCopies(svgNodes(body))
  const collected = collectStructural(top, sheet, 0, IDENTITY)
  const atoms = finishAtoms(collected, entry, sheet, defs)
  atomCache.set(key, atoms)
  return atoms
}

export function isWeakSheet(entry: ArtPatternEntry, atoms: MotifAtom[]): boolean {
  if (!atoms.length) return true
  if (atoms.length >= 3) return false
  const complexity = atoms.reduce((n, a) => n + a.complexity, 0)
  if (complexity < 4) return true
  if (entry.bytes < 4000 && atoms.length <= 1) return true
  return false
}
