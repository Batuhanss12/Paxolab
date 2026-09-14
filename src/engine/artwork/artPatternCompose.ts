/**
 * Library composition director — one intent per face, gallery hierarchy.
 * Never dump every crop. Field / frame / band / ornament-hero only.
 */
import { existsSync, readFileSync } from 'node:fs'
import type { Palette, Panel, StyleType } from '../../types'
import type { SafeRect } from './patternMotifs'
import { type ArtPatternEntry, loadArtPatternLibrary } from './artPatternLibrary'
import {
  type PatternAnalysis,
  type PatternPart,
  type PatternPartKind,
  analyzeAndExtract,
} from './artPatternExtract'

export type LibraryIntent = 'field' | 'frame' | 'band' | 'hero-ornament'

export type LibraryLayer = {
  kind: PatternPartKind
  box: 'full' | 'inset' | 'band-top' | 'band-bottom' | 'hero' | 'corner-nw' | 'corner-ne'
  opacity: number
  par: 'xMidYMid slice' | 'xMidYMid meet'
  lockout: boolean
}

export type LibraryRecipe = {
  intent: LibraryIntent
  keepHero: boolean
  layers: LibraryLayer[]
}

const analysisCache = new Map<string, PatternAnalysis>()

function analysisFor(entry: ArtPatternEntry): PatternAnalysis | null {
  const hit = analysisCache.get(entry.id)
  if (hit) return hit
  if (!existsSync(entry.assetPath)) return null
  const next = analyzeAndExtract(entry, readFileSync(entry.assetPath, 'utf8'))
  analysisCache.set(entry.id, next)
  return next
}

export function clearArtPatternComposeCache(): void {
  analysisCache.clear()
}

function tint(svg: string, accent: string): string {
  return svg.replace(/currentColor/g, accent)
}

function hrefOf(svg: string, accent: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(tint(svg, accent), 'utf8').toString('base64')}`
}

function partByKind(analysis: PatternAnalysis, kind: PatternPartKind): PatternPart | undefined {
  return analysis.parts.find((item) => item.kind === kind)
}

export function resolveLibraryRecipe(analysis: PatternAnalysis, style?: StyleType | string): LibraryRecipe {
  const luxury = style === 'luxury' || style === 'classic'
  const minimal = style === 'minimal'
  const fieldOp = minimal ? 0.1 : luxury ? 0.16 : 0.12

  if (analysis.role === 'frame' || analysis.placementHint === 'frame') {
    const atlas = analysis.counts.paths > 200 && analysis.counts.topLevel <= 4
    if (atlas) {
      return {
        intent: 'frame',
        keepHero: true,
        layers: [
          { kind: 'tile-nw', box: 'corner-nw', opacity: 0.78, par: 'xMidYMid meet', lockout: false },
          { kind: 'tile-ne', box: 'corner-ne', opacity: 0.78, par: 'xMidYMid meet', lockout: false },
        ],
      }
    }
    return {
      intent: 'frame',
      keepHero: true,
      layers: [
        {
          kind: 'frame-ring',
          box: 'inset',
          opacity: luxury ? 0.86 : 0.62,
          par: 'xMidYMid meet',
          lockout: true,
        },
      ],
    }
  }

  if (analysis.role === 'band' || analysis.placementHint === 'band') {
    if (analysis.counts.topLevel > 8) {
      return {
        intent: 'band',
        keepHero: true,
        layers: [{ kind: 'part', box: 'band-top', opacity: 0.82, par: 'xMidYMid meet', lockout: true }],
      }
    }
    const layers: LibraryLayer[] = [
      { kind: 'band-top', box: 'band-top', opacity: 0.55, par: 'xMidYMid slice', lockout: true },
    ]
    if (!luxury) {
      layers.push({ kind: 'band-bottom', box: 'band-bottom', opacity: 0.42, par: 'xMidYMid slice', lockout: true })
    }
    return { intent: 'band', keepHero: true, layers }
  }

  if (analysis.role === 'ornament') {
    return {
      intent: 'hero-ornament',
      keepHero: false,
      layers: [{ kind: 'full', box: 'hero', opacity: 0.92, par: 'xMidYMid meet', lockout: false }],
    }
  }

  return {
    intent: 'field',
    keepHero: true,
    layers: [
      {
        kind: analysis.role === 'tile' ? 'full' : 'tile-center',
        box: 'full',
        opacity: fieldOp,
        par: 'xMidYMid slice',
        lockout: true,
      },
    ],
  }
}

function layerBox(
  panel: Panel,
  box: LibraryLayer['box'],
  safe?: SafeRect,
): { x: number; y: number; w: number; h: number } {
  const { x, y, w, h } = panel
  if (box === 'inset') {
    const inset = Math.min(w, h) * 0.055
    return { x: x + inset, y: y + inset, w: w - inset * 2, h: h - inset * 2 }
  }
  if (box === 'band-top') {
    return { x, y, w, h: Math.max(8, h * 0.16) }
  }
  if (box === 'band-bottom') {
    const bh = Math.max(8, h * 0.14)
    return { x, y: y + h - bh, w, h: bh }
  }
  if (box === 'hero') {
    const size = Math.min(w * 0.34, Math.min(w, h) * 0.28)
    const top = safe ? Math.max(y + 2.4, safe.y - size - 2.8) : y + h * 0.08
    return { x: x + (w - size) / 2, y: top, w: size, h: size }
  }
  if (box === 'corner-nw' || box === 'corner-ne') {
    const size = Math.min(w, h) * 0.2
    const inset = Math.min(w, h) * 0.045
    return {
      x: box === 'corner-nw' ? x + inset : x + w - inset - size,
      y: y + inset,
      w: size,
      h: size,
    }
  }
  return { x, y, w, h }
}

function paintLayer(
  analysis: PatternAnalysis,
  recipe: LibraryRecipe,
  layer: LibraryLayer,
  panel: Panel,
  p: Palette,
  safe?: SafeRect,
): string {
  const part = partByKind(analysis, layer.kind)
  if (!part) return ''
  const box = layerBox(panel, layer.box, safe)
  if (box.w <= 0.4 || box.h <= 0.4) return ''
  const clip = layer.lockout && panel.id ? ` clip-path="url(#lockout-${panel.id})"` : ''
  return `<image data-art="art-pattern-compose" data-pattern-lib="${part.sourceId}" data-pattern-part="${part.kind}" data-library-recipe="${recipe.intent}" x="${box.x.toFixed(2)}" y="${box.y.toFixed(2)}" width="${box.w.toFixed(2)}" height="${box.h.toFixed(2)}" href="${hrefOf(part.markup, p.accent)}" opacity="${layer.opacity}" preserveAspectRatio="${layer.par}"${clip} />`
}

export function paintArtPatternComposition(
  panel: Panel,
  p: Palette,
  entry: ArtPatternEntry,
  opts: { safe?: SafeRect; style?: StyleType | string } = {},
): { markup: string; recipe: LibraryRecipe } {
  const empty = { markup: '', recipe: { intent: 'field' as const, keepHero: true, layers: [] } }
  if (entry.skipReason) return empty
  const analysis = analysisFor(entry)
  if (!analysis) return empty
  const recipe = resolveLibraryRecipe(analysis, opts.style)
  const markup = recipe.layers.map((layer) => paintLayer(analysis, recipe, layer, panel, p, opts.safe)).join('')
  return { markup, recipe }
}

export function paintArtPatternCompositionById(
  panel: Panel,
  p: Palette,
  artPatternId: string,
  opts: { safe?: SafeRect; style?: StyleType | string } = {},
): { markup: string; recipe: LibraryRecipe } {
  const entry = loadArtPatternLibrary().find((item) => item.id === artPatternId)
  if (!entry) return { markup: '', recipe: { intent: 'field', keepHero: true, layers: [] } }
  return paintArtPatternComposition(panel, p, entry, opts)
}
