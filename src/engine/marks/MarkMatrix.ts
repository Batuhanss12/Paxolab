/**
 * MarkMatrix — facade re-exporting the decomposed mark modules.
 * Recipe builders + warning arrays live in markRecipes.ts.
 * This file preserves the public API: paoMonthsFromBrief, resolveMarkRecipe, resolveMarks, resolveStickerMarks.
 */
import type { DesignBrief } from '../../types'
import type { SectorId, SurfaceMode } from '../designSystem/types'
import type { MarkId, MarkRecipe, ResolvedMarks } from './types'
import { STRIP_TINY_MM, opticalStrip } from './stripLayout'
import {
  creamBox,
  creamLabel,
  cleaningBox,
  electronicsBox,
  electronicsLabel,
  foodBox,
  foodLabel,
  genericBox,
  perfumeBox,
  perfumeLabel,
  recipe,
  SAMPLE_LEGAL,
} from './markRecipes'

export function paoMonthsFromBrief(brief: DesignBrief | undefined, fallback: string): string {
  if (brief?.paoMonths?.trim()) return normalizePao(brief.paoMonths)
  const blob = `${brief?.copyOverrides ?? ''} ${brief?.productName ?? ''} ${brief?.subProduct ?? ''} ${brief?.volume ?? ''}`
  const hit =
    blob.match(/\bpao\s*[:-]?\s*(\d{1,2})\b/i) ||
    blob.match(/\b(\d{1,2})\s*ay\b/i) ||
    blob.match(/\b(\d{1,2})M\b/)
  return hit ? normalizePao(hit[1]) : fallback
}

function normalizePao(raw: string): string {
  const n = raw.replace(/[^\d]/g, '')
  if (!n) return '12M'
  return `${Math.min(36, Math.max(3, Number(n)))}M`
}

export function resolveMarkRecipe(sector: SectorId, surface: SurfaceMode, brief?: DesignBrief): MarkRecipe {
  const base =
    sector === 'perfume'
      ? surface === 'label'
        ? perfumeLabel()
        : perfumeBox()
      : sector === 'cream' || sector === 'serum'
        ? surface === 'label'
          ? creamLabel()
          : creamBox()
        : sector === 'food'
          ? surface === 'label'
            ? foodLabel()
            : foodBox()
          : sector === 'electronics'
            ? surface === 'label'
              ? electronicsLabel()
              : electronicsBox()
            : sector === 'cleaning'
              ? cleaningBox()
              : surface === 'label'
                ? recipe(
                    'generic:label',
                    [],
                    [],
                    ['Üretici talimatlarına uyun.', 'Çocuklardan uzak tutun.'],
                    { panel: 'label', minMm: 5.2, gapMm: 1.7, maxIcons: 0 },
                  )
                : genericBox()
  return { ...base, paoMonths: paoMonthsFromBrief(brief, base.paoMonths) }
}

export function resolveMarks(
  sector: SectorId,
  surface: SurfaceMode,
  faceWidthMm: number,
  faceHeightMm: number,
  brief?: DesignBrief,
): ResolvedMarks {
  const recipe = resolveMarkRecipe(sector, surface, brief)
  const tinyFace = surface === 'label' || faceWidthMm < STRIP_TINY_MM || faceHeightMm < 28
  const required = tinyFace ? [] : recipe.requiredMarks
  const optional = tinyFace ? [] : recipe.optionalMarks
  const band = Math.max(0, faceWidthMm - 10)
  const strip = opticalStrip([...required, ...optional], band, recipe).ids
  const labelStrip: MarkId[] = []
  return {
    recipe,
    strip,
    labelStrip,
    warnings: recipe.requiredTextWarnings.join(' '),
    sampleLegal: SAMPLE_LEGAL,
  }
}

export function perfumeAssetsAllowed(sector: SectorId): boolean {
  return sector === 'perfume'
}

/** Extra transparent warning sticker — perfume box icons only, never on the main label face. */
export function resolveStickerMarks(
  sector: SectorId,
  widthMm: number,
  _heightMm: number,
  brief?: DesignBrief,
): ResolvedMarks {
  if (sector !== 'perfume') {
    const recipe = resolveMarkRecipe(sector, 'label', brief)
    return { recipe, strip: [], labelStrip: [], warnings: recipe.requiredTextWarnings.join(' '), sampleLegal: SAMPLE_LEGAL }
  }
  const recipe = resolveMarkRecipe('perfume', 'box', brief)
  const strip = widthMm < STRIP_TINY_MM ? [] : recipe.requiredMarks.slice(0, recipe.placement.maxIcons)
  return {
    recipe,
    strip,
    labelStrip: [],
    warnings: recipe.requiredTextWarnings.join(' '),
    sampleLegal: SAMPLE_LEGAL,
  }
}
