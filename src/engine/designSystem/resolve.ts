import type { DesignBrief, StructureId, StyleType } from '../../types'
import { styleProfile } from '../artwork/languages'
import { resolveMarkRecipe } from '../marks/MarkMatrix'
import { categoryFor, pickDecor, pickLockup, typeScaleFor } from './kits'
import { resolveSector, sectorBlob } from './sector'
import type { DesignSystem, LegalBlockDef, MarkSet, SurfaceMode } from './types'

function legalPlan(sector: DesignSystem['sector']): LegalBlockDef[] {
  if (sector === 'perfume') {
    return [
      { id: 'composition', title: 'COMPOSITION', source: 'ingredients' },
      { id: 'caution', title: 'FLAMMABLE · CAUTION', source: 'warnings' },
    ]
  }
  if (sector === 'serum' || sector === 'cream') {
    return [
      { id: 'inci', title: 'INCI', source: 'ingredients' },
      { id: 'directions', title: 'DIRECTIONS · CAUTION', source: 'warnings' },
    ]
  }
  if (sector === 'food') {
    return [
      { id: 'origin', title: 'INGREDIENTS / ORIGIN', source: 'ingredients' },
      { id: 'storage', title: 'STORAGE · ALLERGENS', source: 'warnings' },
    ]
  }
  if (sector === 'electronics') {
    return [
      { id: 'spec', title: 'CONTENTS / SPEC', source: 'ingredients' },
      { id: 'safety', title: 'WEEE · SAFETY', source: 'warnings' },
    ]
  }
  if (sector === 'cleaning') {
    return [
      { id: 'directions', title: 'DIRECTIONS', source: 'ingredients' },
      { id: 'caution', title: 'KEEP OUT OF REACH', source: 'warnings' },
    ]
  }
  return [
    { id: 'spec', title: 'SPECIFICATION', source: 'ingredients' },
    { id: 'caution', title: 'DIRECTIONS · CAUTION', source: 'warnings' },
  ]
}

function markSet(sector: DesignSystem['sector']): MarkSet {
  if (sector === 'food') return 'food'
  if (sector === 'electronics') return 'electronics'
  if (sector === 'cleaning') return 'generic'
  return 'cosmetics'
}

export function resolveDesignSystem(brief: DesignBrief, structureId?: StructureId): DesignSystem {
  const style = (brief.styleType || 'luxury') as StyleType
  const surfaceMode: SurfaceMode = brief.packagingMode === 'label' ? 'label' : 'box'
  const grammar = surfaceMode
  const sector = resolveSector(brief)
  const blob = sectorBlob(brief)
  const wrap = structureId === 'wrap-label' || /wrap/i.test(brief.templateId)
  const lockup = pickLockup(style, sector, grammar, wrap)
  const sw = styleProfile(style)
  const goldBar = sw.goldBar && grammar === 'box' && style === 'luxury'

  return {
    key: `${surfaceMode}:${sector}:${style}:${lockup}`,
    surfaceMode,
    grammar,
    sector,
    style,
    lockup,
    decor: pickDecor(style, sector, lockup),
    density: sw.density,
    type: typeScaleFor(style, grammar, wrap),
    marks: markSet(sector),
    markRecipe: resolveMarkRecipe(sector, surfaceMode, brief),
    legal: legalPlan(sector),
    category: categoryFor(sector, blob),
    flammable: sector === 'perfume',
    pao: sector === 'perfume' || sector === 'cream' || sector === 'serum',
    goldBar,
    serif: sw.serif,
    align: wrap ? 'left' : grammar === 'label' ? (style === 'modern' ? 'left' : 'center') : sw.align,
    wrapSeam: grammar === 'label' && wrap,
    brandOnSides: false,
    brandOnTucks: false,
    brandOnTop: true,
    fullDecorOnFrontOnly: true,
  }
}
