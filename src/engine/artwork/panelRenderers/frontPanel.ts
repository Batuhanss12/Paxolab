/**
 * Front panel renderer — facade combining decor, lockup, and seam.
 * Decor assembly extracted to frontDecor.ts.
 * Lockup rendering extracted to frontLockup.ts.
 * This file preserves the public renderFrontPanel API.
 */
import type { DesignBrief, DesignOverrides, DesignSpec, Palette, Panel } from '../../../types'
import type { DesignPlan } from '../../brain/DesignPlan'
import type { DesignSystem } from '../../designSystem/types'
import { kitGradeSkipsOverlay, kitLexiconUsedByKit, kitSuppliesFocalLockup } from '../../designSystem/conceptKitAlignment'
import { layoutFrontLockup } from '../../designSystem/typeSystem'
import { expandKitSafe, kitLevel } from '../bgKits'
import { paintArtPatternOverlay } from '../artPatternLibrary'
import { paintArtPatternCompositionById } from '../artPatternCompose'
import { paintMotifRecipeById, type MotifPaintOpts } from '../artMotifCompose'
import { matchMotifs } from '../artMotifMatch'
import { clearCompositionSearch, selectMotifComposition } from '../compositionCandidates'
import { paintPlanHero, resolveFrontHeroPlacement } from './heroDispatch'
import { paintBackgroundTreatment, paintSectorBackground, paintStyleBackground } from '../backgroundTreatments'
import { foodBoxTheatre } from '../foodLandscape'
import { wrapContinuity } from '../motifs'
import { panelClip as clip } from '../svgGeometry'
import { lockoutClip } from './shared'
import { frontDecor } from './frontDecor'
import { renderFrontLockup } from './frontLockup'

/** Professional seam indicator: dashed registration line with tick marks. */
function wrapSeam(panel: Panel, p: Palette, printReady: boolean): string {
  const { x, y, w, h } = panel
  const sx = x + w - 1.6
  const top = y + 2.5
  const bot = y + h - 2.5
  const ticks = 5
  let tickMarks = ''
  for (let i = 0; i <= ticks; i++) {
    const ty = top + ((bot - top) / ticks) * i
    tickMarks += `<line x1="${sx - 0.8}" y1="${ty}" x2="${sx + 0.4}" y2="${ty}" stroke="${p.accent}" stroke-opacity="0.35" stroke-width="0.1" />`
  }
  void printReady
  const label = ''
  return `
    <g data-art="seam">
    <line x1="${sx}" y1="${top}" x2="${sx}" y2="${bot}" stroke="${p.accent}" stroke-opacity="0.3" stroke-width="0.12" stroke-dasharray="0.8 0.6" />
    ${tickMarks}
    ${label}
    </g>
  `
}

export function renderFrontPanel(
  panel: Panel,
  brief: DesignBrief,
  copy: DesignSpec['copy'],
  p: Palette,
  overrides: DesignOverrides,
  system: DesignSystem,
  designPlan?: DesignPlan,
  logoHref?: string,
): string {
  const { x, y, w, h } = panel
  const id = panel.id
  const labelFace = system.grammar === 'label'

  const layout = layoutFrontLockup(panel, system, copy, overrides, labelFace)
  const lockup = layout?.rect
  const safe = expandKitSafe(lockup, system.style === 'eco' ? 3 : 2.4)
  const theatre = foodBoxTheatre(system, panel, labelFace)
  const density = kitLevel(designPlan?.variationIndex)

  let body = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.bg}"${system.blankCanvas ? ' data-face="blank-canvas"' : ''} />`
  if (safe) body += lockoutClip(id, panel, safe)

  const compose = Boolean(overrides.artPatternCompose && overrides.artPatternId)
  const blank = Boolean(system.blankCanvas || overrides.blankCanvas)
  const heroCtx = { copy, overrides, ingredientClaims: brief.ingredientClaims ?? '' }
  const heroPlace = resolveFrontHeroPlacement(panel, system, designPlan, heroCtx)
  const heroBox = heroPlace && !heroPlace.omitted && heroPlace.box.w > 0 ? heroPlace.box : undefined
  const motifOpts: MotifPaintOpts = {
    safe,
    style: system.style,
    seed: designPlan?.variationIndex ?? 0,
    lockup,
    heroBox,
    goldBar: system.goldBar,
    sector: system.sector,
    languages: designPlan?.visualConcept.languages,
    avoid: designPlan?.visualConcept.avoid,
    motifLexicon: designPlan?.visualConcept.motifLexicon,
    kitLexiconUsed: designPlan
      ? kitLexiconUsedByKit(designPlan.visualConcept, system.lockup, designPlan.heroGraphic.family)
      : undefined,
    kitSuppliesFocal: kitSuppliesFocalLockup(system.lockup, designPlan?.heroGraphic.family),
  }
  const skipOverlay = kitGradeSkipsOverlay(system.style)
  if (compose && !blank) {
    const motif = paintMotifRecipeById(panel, p, overrides.artPatternId!, {
      ...motifOpts,
      recipeId: overrides.motifRecipeId,
    })
    if (motif.markup) {
      body += motif.markup
      if (motif.keepHero) {
        body += paintPlanHero(panel, system, p, designPlan, {
          copy,
          overrides,
          ingredientClaims: brief.ingredientClaims ?? '',
        })
      }
    } else {
      const composed = paintArtPatternCompositionById(panel, p, overrides.artPatternId!, {
        safe,
        style: system.style,
      })
      body += composed.markup
      if (composed.recipe.keepHero) {
        body += paintPlanHero(panel, system, p, designPlan, {
          copy,
          overrides,
          ingredientClaims: brief.ingredientClaims ?? '',
        })
      }
    }
  } else {
    body += paintBackgroundTreatment(panel, designPlan?.backgroundTreatment ?? 'quiet-paper', p)
    body += paintStyleBackground(panel, system.style, p, {
      safe,
      density,
      sector: system.sector,
      grammar: system.grammar,
      theatre,
      variationIndex: designPlan?.variationIndex,
    })
    if (designPlan) body += paintSectorBackground(panel, system.sector, system.style, p)
    if (overrides.artPatternId) {
      body += paintArtPatternOverlay(panel, p, overrides.artPatternId, {
        safe,
        style: system.style,
      })
    }
    if (!skipOverlay && designPlan?.visualConcept.family) {
      const match = matchMotifs({
        mood: system.style,
        sector: system.sector,
        colors: brief.colors,
        seed: designPlan.variationIndex ?? 0,
        family: designPlan.visualConcept.family,
        supportFamily: designPlan.visualConcept.supportFamily,
        conceptId: designPlan.visualConcept.id,
        languages: designPlan.visualConcept.languages,
        avoid: designPlan.visualConcept.avoid,
        motifLexicon: designPlan.visualConcept.motifLexicon,
      })
      const picked = selectMotifComposition({
        panel,
        palette: p,
        atoms: match.atoms,
        plan: designPlan,
        opts: motifOpts,
        forcedRecipe: overrides.motifRecipeId,
      })
      if (picked.markup) body += picked.markup
    } else if (skipOverlay) {
      clearCompositionSearch()
    }

    body += frontDecor(panel, system, p, lockup, designPlan, {
      copy,
      overrides,
      ingredientClaims: brief.ingredientClaims ?? '',
    })
  }
  if (labelFace && system.wrapSeam) {
    body += wrapSeam(panel, p, overrides.printReady)
    body += wrapContinuity(panel, p.accent)
  }

  if (layout) {
    body += renderFrontLockup(panel, brief, copy, p, overrides, system, layout, logoHref)
  }

  return `<g clip-path="${clip(panel)}">${body}</g>`
}
