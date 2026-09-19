/**
 * composeStudioArtwork — the production brain's studio path.
 * Direction in, full-anatomy faces out. Deterministic; never touches the LLM.
 */
import { rotatedRectFrame } from '../dieline/forxaAdapter'
import type { ArtworkModel, DesignBrief, DesignSpec, DielineModel, Panel } from '../../types'
import type { DesignSystem } from '../designSystem/types'
import { findHeroPanel, nativeKindFor } from '../dieline/panelKind'
import { panelClip } from '../artwork/svgGeometry'
import { languageId } from '../artwork/languages'
import { paintBoxBack, paintBoxFlap, paintBoxFront, paintBoxSide, paintBoxTop, paintGlue, paintPlain } from './boxLayouts'
import { paintLabelBack, paintLabelFace, paintRoundBack, paintTagFace, paintCardFace, paintKitBack } from './labelLayouts'
import { isRound, makeCtx } from './layoutContext'
import { studioCriticActions } from './studioCritic'
import { dnaFor } from './referenceDna'
import { studioFontStyle } from './text'
import type { DesignDirection, StudioIdentity, StudioPanelReport, StudioReport } from './types'

export type StudioComposeInput = {
  brief: DesignBrief
  dieline: DielineModel
  copy: DesignSpec['copy']
  direction: DesignDirection
  system: DesignSystem
  identity?: Partial<StudioIdentity>
}

const f = (n: number) => (Math.round(n * 100) / 100).toString()

function isStudioFlap(panel: Panel, kind: ReturnType<typeof nativeKindFor>): boolean {
  if (kind === 'tuck-flap' || panel.role === 'tuck') return true
  const id = panel.id.toLowerCase()
  return id.includes('dust') || id.includes('tuck') || (id.includes('lock') && !id.includes('glue'))
}

function wrap(panel: Panel, direction: DesignDirection, inner: string, role: string, fonts = false): string {
  const head = fonts ? studioFontStyle(direction.typePairing) : ''
  /*
   * The painter works in the panel's own frame. When the cut is a rectangle rotated on the sheet —
   * a polygon prism's wall — the frame is rotated with it, so the painted face lands on the wall
   * instead of on the wall's bounding box. Derived from the polygon the panel already carries; no
   * field is added for it.
   */
  const spin = rotatedRectFrame(panel.polygon ?? [])
  const place = spin ? `translate(${f(panel.x)} ${f(panel.y)}) rotate(${f(spin.deg)})` : `translate(${f(panel.x)} ${f(panel.y)})`
  return `${head}<g clip-path="${panelClip(panel)}" data-art="studio" data-archetype="${direction.archetype}" data-role="${role}"><g transform="${place}">${inner}</g></g>`
}

export function composeStudioArtwork(input: StudioComposeInput): { artwork: ArtworkModel; report: StudioReport } {
  const { brief, dieline, copy, direction, system, identity } = input
  const paoMonths = system.markRecipe?.paoMonths ?? '12M'
  const reports: StudioPanelReport[] = []
  let sideIndex = 0
  const hasBack = dieline.panels.some((p) => p.id === 'labelBack' || p.id === 'warnLabel' || p.id === 'tagBack' || p.id === 'cardBack' || nativeKindFor(p) === 'legal-back')
  const frontPanelId = findHeroPanel(dieline.panels)?.id ?? dieline.panels[0].id
  const layers = dieline.panels.map((panel) => {
    const uid = `st-${panel.id}-${(direction.seed % 9973).toString(36)}`
    const kind = nativeKindFor(panel)
    const ctx = makeCtx(panel, direction, copy, brief, uid, paoMonths, system.wrapSeam && (panel.id === 'label' || kind === 'hero-front'), hasBack, identity)
    /*
     * No volume in the brief means there is no net quantity to state — measured, all 24 faces that
     * reach this are electronics, where a pair of earbuds has none. The painters guard their own
     * `netQuantity` calls, so the primitive is never reached to say so; recorded here instead, once,
     * on the face where the footer registers are judged.
     */
    if (!direction.volumeLine && panel.id === frontPanelId) ctx.ledger.skip('net-quantity', 'no-content')
    let inner = ''
    let role: StudioPanelReport['archetype'] = 'plain'
    if (direction.surface === 'label') {
      if (panel.id === 'tag') {
        inner = paintTagFace(ctx)
        role = direction.archetype
      } else if (panel.id === 'card') {
        inner = paintCardFace(ctx)
        role = direction.archetype
      } else if (panel.id === 'tagBack' || panel.id === 'cardBack') {
        inner = paintKitBack(ctx)
        role = 'back'
      } else if (panel.id === 'labelBack' || panel.id === 'warnLabel') {
        // Shape wins over role on the back too — the front has done this since the disc landed.
        inner = isRound(panel) ? paintRoundBack(ctx) : paintLabelBack(ctx)
        role = 'back'
      } else if (kind === 'glue' || panel.role === 'glue') {
        /*
         * The wrap tab carries no artwork at all.
         *
         * It first looked like the tab should continue the front's field, the way a printed wrap
         * seam does — but the press disagrees and so does the preflight: `glue-art` fails any glue
         * face carrying hero art, because adhesive does not bond over ink. Painting it a flat slab
         * of the label colour, which is what used to happen, passes that gate but creates the band
         * the owner saw: a blank rectangle the same colour as the design, sitting beside it with
         * no explanation. Leaving it unpainted lets the dieline's own glue chrome and caption show
         * through, so the region reads as a production allowance instead of empty design space.
         */
        inner = ''
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
    } else if (isStudioFlap(panel, kind)) {
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
    return { panelId: panel.id, markup: wrap(panel, direction, inner, String(role), panel.id === frontPanelId) }
  })
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
    critic: studioCriticActions({ collisions, outOfBounds, temperament: direction.temperament }),
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

/**
 * The front alone, for a direction that was *not* painted.
 *
 * The offer strip used to show the two runner-up directions as a swatch and a family name —
 * "mermer", "botanik" — and asked the customer to spend a credit to find out what that meant.
 * A studio shows the candidate. This paints just the hero panel through the same painters, so
 * what the strip shows is exactly what choosing it would produce; nothing else is composed, no
 * ledger report is kept, and the credit model is untouched because nothing here is a generation.
 */
export function paintStudioFront(input: StudioComposeInput): { panelId: string; markup: string } | null {
  const { brief, dieline, copy, direction, system, identity } = input
  const panel = findHeroPanel(dieline.panels) ?? dieline.panels[0]
  if (!panel) return null
  const paoMonths = system.markRecipe?.paoMonths ?? '12M'
  const hasBack = dieline.panels.some((p) => p.id === 'labelBack' || p.id === 'warnLabel' || p.id === 'tagBack' || p.id === 'cardBack' || nativeKindFor(p) === 'legal-back')
  const uid = `st-${panel.id}-${(direction.seed % 9973).toString(36)}`
  const kind = nativeKindFor(panel)
  const ctx = makeCtx(panel, direction, copy, brief, uid, paoMonths, system.wrapSeam && (panel.id === 'label' || kind === 'hero-front'), hasBack, identity)
  const inner =
    direction.surface === 'label'
      ? panel.id === 'tag'
        ? paintTagFace(ctx)
        : panel.id === 'card'
          ? paintCardFace(ctx)
          : paintLabelFace(ctx)
      : paintBoxFront(ctx)
  return { panelId: panel.id, markup: wrap(panel, direction, inner, String(direction.archetype), true) }
}
