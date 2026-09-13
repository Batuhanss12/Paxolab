import type { DesignBrief, DesignSpec, DielineModel } from '../../types'
import type { DesignSystem } from '../designSystem/types'
import { perfumeAssetsAllowed, resolveMarks } from '../marks/MarkMatrix'
import type { ResolvedMarks } from '../marks/types'

export type CraftStage =
  | 'brief'
  | 'strategy'
  | 'structure'
  | 'type'
  | 'decor'
  | 'verbal'
  | 'marks'
  | 'proof'

export type CraftPlan = {
  stages: CraftStage[]
  sector: DesignSystem['sector']
  surface: DesignSystem['surfaceMode']
  grammar: DesignSystem['grammar']
  style: DesignSystem['style']
  focal: string
  hierarchy: string
  density: DesignSystem['density']
  ink: string
  lockupY: number
  marks: ResolvedMarks
  allowPerfumeAssets: boolean
  sampleLegal: true
}

function inkFor(system: DesignSystem): string {
  if (system.style === 'luxury') return system.goldBar ? 'black-gold-foil' : 'dark-metal'
  if (system.style === 'modern') return 'slate-spot'
  if (system.style === 'minimal') return 'paper-one-ink'
  if (system.style === 'eco') return 'kraft-soy'
  if (system.style === 'playful') return 'spot-capsule'
  return 'cream-burgundy'
}

function focalFor(system: DesignSystem): string {
  if (system.grammar === 'label') return system.wrapSeam ? 'wrap-single-face' : 'label-stack'
  return system.lockup
}

function hierarchyFor(system: DesignSystem): string {
  if (system.grammar === 'label') {
    return system.wrapSeam
      ? 'ön lockup → SEAM · arka kullanım / barkod'
      : 'ön tasarım · arka kullanım / barkod'
  }
  return 'front hero · side spine · back legal stack'
}

/** Staged designer workflow — composeArtwork consults this before drawing. */
export function buildCraftPlan(
  brief: DesignBrief,
  dieline: DielineModel,
  _copy: DesignSpec['copy'],
  system: DesignSystem,
): CraftPlan {
  const face =
    dieline.panels.find((p) => p.id === 'front' || p.id === 'label' || p.id === 'trayFront') ??
    dieline.panels[0]
  const markFace =
    dieline.panels.find((p) => p.id === 'back' || p.id === 'trayBack' || p.id === 'labelBack' || p.id === 'warnLabel') ?? face
  const marks = resolveMarks(system.sector, system.surfaceMode, markFace.w, markFace.h, brief)
  const lockupY = system.type.opticalCenter
  return {
    stages: ['brief', 'strategy', 'structure', 'type', 'decor', 'verbal', 'marks', 'proof'],
    sector: system.sector,
    surface: system.surfaceMode,
    grammar: system.grammar,
    style: system.style,
    focal: focalFor(system),
    hierarchy: hierarchyFor(system),
    density: system.density,
    ink: inkFor(system),
    lockupY,
    marks,
    allowPerfumeAssets: perfumeAssetsAllowed(system.sector),
    sampleLegal: true,
  }
}

export function craftMeta(plan: CraftPlan, brief: DesignBrief): string {
  return `${plan.grammar}/${plan.sector}/${plan.style} · ${brief.brandName} · ${plan.marks.recipe.key}`
}
