/**
 * composeStudioArtwork — the production brain's studio path.
 * Direction in, full-anatomy faces out. Deterministic; never touches the LLM.
 */
import type { ArtworkModel, DesignBrief, DesignSpec, DielineModel, Panel } from '../../types'
import type { DesignSystem } from '../designSystem/types'
import { findHeroPanel, nativeKindFor } from '../dieline/panelKind'
import { panelClip } from '../artwork/svgGeometry'
import { languageId } from '../artwork/languages'
import { paintBoxBack, paintBoxFlap, paintBoxFront, paintBoxSide, paintBoxTop, paintGlue, paintPlain } from './boxLayouts'
import { paintLabelBack, paintLabelFace } from './labelLayouts'
import { makeCtx } from './layoutContext'
import { dnaFor } from './referenceDna'
import type { DesignDirection, StudioPanelReport, StudioReport } from './types'

export type StudioComposeInput = {
  brief: DesignBrief
  dieline: DielineModel
  copy: DesignSpec['copy']
  direction: DesignDirection
  system: DesignSystem
}

const f = (n: number) => (Math.round(n * 100) / 100).toString()

function wrap(panel: Panel, direction: DesignDirection, inner: string, role: string): string {
  return `<g clip-path="${panelClip(panel)}" data-art="studio" data-archetype="${direction.archetype}" data-role="${role}"><g transform="translate(${f(panel.x)} ${f(panel.y)})">${inner}</g></g>`
}

export function composeStudioArtwork(input: StudioComposeInput): { artwork: ArtworkModel; report: StudioReport } {
  const { brief, dieline, copy, direction, system } = input
  const paoMonths = system.markRecipe?.paoMonths ?? '12M'
  const reports: StudioPanelReport[] = []
  let sideIndex = 0
  const hasBack = dieline.panels.some((p) => p.id === 'labelBack' || p.id === 'warnLabel' || nativeKindFor(p) === 'legal-back')
  const layers = dieline.panels.map((panel) => {
    const uid = `st-${panel.id}-${(direction.seed % 9973).toString(36)}`
    const kind = nativeKindFor(panel)
    const ctx = makeCtx(panel, direction, copy, brief, uid, paoMonths, system.wrapSeam && (panel.id === 'label' || kind === 'hero-front'), hasBack)
    let inner = ''
    let role: StudioPanelReport['archetype'] = 'plain'
    if (direction.surface === 'label') {
      if (panel.id === 'labelBack' || panel.id === 'warnLabel') {
        inner = paintLabelBack(ctx)
        role = 'back'
      } else if (kind === 'glue' || panel.role === 'glue') {
        inner = paintGlue(ctx)
        role = 'glue'
      } else if (kind === 'hero-front' || panel.id === 'label') {
        inner = paintLabelFace(ctx)
        role = direction.archetype
      } else {
        inner = paintPlain(ctx)
      }
    } else if (kind === 'glue' || panel.role === 'glue' || panel.id === 'glue' || panel.id === 'overlap') {
      inner = paintGlue(ctx)
      role = 'glue'
    } else if (kind === 'tuck-flap' || panel.role === 'tuck' || panel.id.includes('Dust')) {
      inner = paintBoxFlap(ctx)
      role = 'flap'
    } else if (kind === 'hero-front') {
      inner = paintBoxFront(ctx)
      role = direction.archetype
    } else if (kind === 'legal-back') {
      inner = paintBoxBack(ctx)
      role = 'back'
    } else if (kind === 'side-spine') {
      inner = paintBoxSide(ctx, sideIndex++)
      role = 'side'
    } else if (panel.id === 'top' || panel.id === 'bottom' || panel.id === 'trayBottom') {
      inner = paintBoxTop(ctx, panel.id === 'top' ? 'top' : 'bottom')
      role = 'top'
    } else {
      inner = paintPlain(ctx)
    }
    reports.push(ctx.ledger.report(role))
    return { panelId: panel.id, markup: wrap(panel, direction, inner, String(role)) }
  })
  const frontPanelId = findHeroPanel(dieline.panels)?.id ?? dieline.panels[0].id
  const collisions = reports.flatMap((r) => r.collisions.map((c) => `${r.panelId}:${c}`))
  const outOfBounds = reports.flatMap((r) => r.outOfBounds.map((c) => `${r.panelId}:${c}`))
  const sizes = reports.map((r) => r.minTextMm).filter((s) => s > 0)
  const report: StudioReport = {
    direction,
    panels: reports,
    collisions,
    outOfBounds,
    minTextMm: sizes.length ? Math.min(...sizes) : 0,
    anatomy: dnaFor(direction.archetype, direction.surface).anatomy,
  }
  return {
    artwork: {
      layers,
      frontPanelId,
      language: languageId(brief),
      systemKey: `${system.key}·studio:${direction.archetype}`,
    },
    report,
  }
}
