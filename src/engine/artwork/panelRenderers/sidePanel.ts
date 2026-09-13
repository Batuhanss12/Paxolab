/**
 * Side panel renderer — spine text + side pattern.
 * Extracted from composeArtwork.ts.
 */
import type { DesignSpec, Palette, Panel } from '../../../types'
import type { DesignSystem } from '../../designSystem/types'
import type { DesignPlan } from '../../brain/DesignPlan'
import { monogram } from '../copy'
import { paintPatternFamily, wrapSidePattern } from '../patternFamilies'
import { spineLuxuryField } from '../motifs'
import { escapeSvg as esc, panelClip as clip } from '../svgGeometry'

export function renderSidePanel(
  panel: Panel,
  copy: DesignSpec['copy'],
  p: Palette,
  system: DesignSystem,
  designPlan?: DesignPlan,
): string {
  const { x, y, w, h } = panel
  const cx = x + w / 2
  const font = system.serif ? "Georgia, 'Times New Roman', serif" : 'Inter, Arial, sans-serif'
  let body = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.bg}" />`

  if (system.style === 'modern') {
    body += `<rect x="${x}" y="${y}" width="${w}" height="2.2" fill="${p.accent}" />`
  }
  body += paintSidePattern(panel, system, p, designPlan)

  const primary = (copy.brand.trim() || copy.product).toUpperCase()
  const maxChars = Math.max(6, Math.floor((h - 18) / 3.4))
  const spine = primary.length > maxChars ? monogram(copy.brand || copy.product) : primary
  const spineSize = Math.min(3.15, (h - 20) / Math.max(1, spine.length) * 0.32, w * 0.28)
  const spineTracking = Math.min(1.5, spineSize * 0.48)
  body += `<line x1="${cx}" y1="${y + 5.2}" x2="${cx}" y2="${y + Math.min(9.4, h * 0.07)}" stroke="${p.accent}" stroke-width="0.2" />`
  body += `<text transform="translate(${cx + 1.05} ${y + h / 2}) rotate(-90)" text-anchor="middle" fill="${p.fg}" font-family="${font}" font-weight="600" font-size="${spineSize}" letter-spacing="${spineTracking}">${esc(spine)}</text>`
  if (copy.volume && h > 40) {
    body += `<text x="${cx}" y="${y + h - 4.6}" text-anchor="middle" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-weight="400" font-size="${Math.min(2.05, w * 0.18)}">${esc(copy.volume)}</text>`
  }

  return `<g clip-path="${clip(panel)}">${body}</g>`
}

function paintSidePattern(panel: Panel, system: DesignSystem, p: Palette, plan?: DesignPlan): string {
  const style = system.style
  const want = !!plan?.patternSystem.sideIntentional || style === 'luxury' || style === 'modern'
  if (!want) return ''
  if (panel.w < 8 || panel.h < 18) return ''

  const planned = plan?.patternSystem.family
  const family =
    planned && planned !== 'none'
      ? planned
      : style === 'luxury'
        ? 'contour'
        : style === 'modern'
          ? 'lattice'
          : style === 'eco'
            ? 'grain'
            : 'stripe'

  if (style === 'luxury') {
    return wrapSidePattern(family, spineLuxuryField(panel, p.accent))
  }

  const dens = plan?.density.side ?? 'sparse'
  const base = plan?.patternSystem.opacity ?? 0.1
  const op = dens === 'sparse' ? Math.min(0.07, base * 0.45) : dens === 'dense' ? base : base * 0.72
  return wrapSidePattern(family, paintPatternFamily(family, panel, p.accent, op))
}
