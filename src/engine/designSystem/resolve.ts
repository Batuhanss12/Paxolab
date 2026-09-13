import type { DesignBrief, StructureId, StyleType } from '../../types'
import { styleProfile } from '../artwork/languages'
import { resolveMarkRecipe } from '../marks/MarkMatrix'
import { resolveCopyLocale } from '../copyLocale'
import { categoryFor, pickDecor, pickLockup, typeScaleFor } from './kits'
import { resolveSector, sectorBlob } from './sector'
import type { DesignSystem, LegalBlockDef, MarkSet, SurfaceMode } from './types'

function legalPlan(sector: DesignSystem['sector'], locale: 'tr' | 'en' = 'tr'): LegalBlockDef[] {
  const en = locale === 'en'
  if (sector === 'perfume') {
    return [
      { id: 'composition', title: en ? 'COMPOSITION' : 'İÇERİK', source: 'ingredients' },
      { id: 'caution', title: en ? 'FLAMMABLE · CAUTION' : 'YANICI · UYARI', source: 'warnings' },
    ]
  }
  if (sector === 'serum' || sector === 'cream') {
    return [
      { id: 'inci', title: 'INCI', source: 'ingredients' },
      { id: 'directions', title: en ? 'DIRECTIONS · CAUTION' : 'KULLANIM · UYARI', source: 'warnings' },
    ]
  }
  if (sector === 'food') {
    return [
      { id: 'origin', title: en ? 'INGREDIENTS / ORIGIN' : 'İÇERİK / MENŞEİ', source: 'ingredients' },
      { id: 'storage', title: en ? 'STORAGE · ALLERGENS' : 'SAKLAMA · ALERJEN', source: 'warnings' },
    ]
  }
  if (sector === 'beverage') {
    return [
      { id: 'ingredients', title: en ? 'INGREDIENTS / NUTRITION' : 'İÇERİK / BESİN', source: 'ingredients' },
      { id: 'storage', title: en ? 'STORAGE · SERVING' : 'SAKLAMA · SERVİS', source: 'warnings' },
    ]
  }
  if (sector === 'health') {
    return [
      { id: 'active', title: en ? 'ACTIVE INGREDIENTS' : 'AKTİF BİLEŞENLER', source: 'ingredients' },
      { id: 'directions', title: en ? 'DIRECTIONS · WARNINGS' : 'KULLANIM · UYARI', source: 'warnings' },
    ]
  }
  if (sector === 'baby') {
    return [
      { id: 'ingredients', title: en ? 'INGREDIENTS' : 'İÇERİK', source: 'ingredients' },
      { id: 'care', title: en ? 'USE · SAFETY' : 'KULLANIM · GÜVENLİK', source: 'warnings' },
    ]
  }
  if (sector === 'electronics') {
    return [
      { id: 'spec', title: en ? 'CONTENTS / SPEC' : 'İÇERİK / SPEC', source: 'ingredients' },
      { id: 'safety', title: en ? 'WEEE · SAFETY' : 'WEEE · GÜVENLİK', source: 'warnings' },
    ]
  }
  if (sector === 'cleaning') {
    return [
      { id: 'directions', title: en ? 'DIRECTIONS' : 'KULLANIM', source: 'ingredients' },
      { id: 'caution', title: en ? 'KEEP OUT OF REACH' : 'ÇOCUKLARDAN UZAK TUTUN', source: 'warnings' },
    ]
  }
  return [
    { id: 'spec', title: en ? 'SPECIFICATION' : 'ÖZELLİKLER', source: 'ingredients' },
    { id: 'caution', title: en ? 'DIRECTIONS · CAUTION' : 'KULLANIM · UYARI', source: 'warnings' },
  ]
}

function markSet(sector: DesignSystem['sector']): MarkSet {
  if (sector === 'food' || sector === 'beverage') return 'food'
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
    type: typeScaleFor(style, grammar, wrap, sector),
    marks: markSet(sector),
    markRecipe: resolveMarkRecipe(sector, surfaceMode, brief),
    legal: legalPlan(sector, resolveCopyLocale(brief)),
    category: categoryFor(sector, blob, resolveCopyLocale(brief)),
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
