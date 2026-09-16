import type { DielineModel, Panel, PanelKind } from '../../types'

export function nativeKindFor(panel: Panel): PanelKind {
  if (panel.kind) return panel.kind
  const id = panel.id
  if (id === 'labelBack' || id === 'warnLabel') return 'legal-back'
  if (panel.role === 'glue' || id === 'glue' || id === 'overlap') return 'glue'
  const idLower = panel.id.toLowerCase()
  if (panel.role === 'tuck' || idLower.includes('dust') || idLower.includes('tuck') || (idLower.includes('lock') && !idLower.includes('glue'))) return 'tuck-flap'
  if (id === 'front' || id === 'label' || id === 'trayFront') return 'hero-front'
  if (id === 'back' || id === 'trayBack') return 'legal-back'
  if (id === 'left' || id === 'right' || id === 'trayLeft' || id === 'trayRight') return 'side-spine'
  return 'plain'
}

export function withPanelKinds(model: DielineModel): DielineModel {
  return {
    ...model,
    panels: model.panels.map((panel) => (panel.kind ? panel : { ...panel, kind: nativeKindFor(panel) })),
  }
}

export function isHeroPanel(panel: Panel): boolean {
  return nativeKindFor(panel) === 'hero-front'
}

export function findHeroPanel(panels: Panel[]): Panel | undefined {
  return panels.find((panel) => panel.kind === 'hero-front') ?? panels.find((panel) => isHeroPanel(panel))
}

export function findLegalPanel(panels: Panel[]): Panel | undefined {
  return (
    panels.find((panel) => nativeKindFor(panel) === 'legal-back' && panel.id !== 'labelBack' && panel.id !== 'warnLabel') ??
    panels.find((panel) => panel.id === 'back' || panel.id === 'trayBack')
  )
}

export function findLabelBackPanel(panels: Panel[]): Panel | undefined {
  return panels.find((panel) => panel.id === 'labelBack' || panel.id === 'warnLabel')
}

export function isSpinePanel(panel: Panel): boolean {
  return nativeKindFor(panel) === 'side-spine'
}

export function isGluePanel(panel: Panel): boolean {
  return nativeKindFor(panel) === 'glue'
}
