/**
 * Side panel renderer — spine text + side pattern + verbal role.
 * Extracted from composeArtwork.ts.
 */
import type { DesignBrief, DesignSpec, Palette, Panel } from '../../../types'
import type { DesignSystem } from '../../designSystem/types'
import type { DesignPlan } from '../../brain/DesignPlan'
import { resolveCopyLocale } from '../../copyLocale'
import { monogram } from '../copy'
import { paintPatternFamily, wrapSidePattern } from '../patternFamilies'
import { spineLuxuryField } from '../motifs'
import { sideFill } from '../sideFill'
import { escapeSvg as esc, panelClip as clip } from '../svgGeometry'

export function renderSidePanel(
  panel: Panel,
  copy: DesignSpec['copy'],
  p: Palette,
  system: DesignSystem,
  designPlan?: DesignPlan,
  brief?: DesignBrief,
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

  const locale = resolveCopyLocale(brief)
  const fill = sideFill(system, locale)
  if (fill && h > 36 && w >= 10) {
    body += paintSideRole(panel, fill, p, font)
  }

  if (copy.volume && h > 40) {
    body += `<text x="${cx}" y="${y + h - 4.6}" text-anchor="middle" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-weight="400" font-size="${Math.min(2.05, w * 0.18)}">${esc(copy.volume)}</text>`
  }

  return `<g clip-path="${clip(panel)}">${body}</g>`
}

function paintSideRole(
  panel: Panel,
  fill: NonNullable<ReturnType<typeof sideFill>>,
  p: Palette,
  font: string,
): string {
  const { x, y, w, h } = panel
  const cx = x + w / 2
  let out = `<g data-art="side-fill" data-side="${fill.kind}">`
  if (fill.kind === 'claims') {
    const n = fill.lines.length
    const start = y + Math.min(16, h * 0.12)
    const step = Math.min(11, (h * 0.28) / Math.max(1, n))
    fill.lines.forEach((line, i) => {
      const cy = start + i * step
      const r = Math.min(3.2, w * 0.26)
      out += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${p.accent}" fill-opacity="0.1" stroke="${p.accent}" stroke-width="0.2" />`
      out += `<text x="${cx}" y="${cy + 0.5}" text-anchor="middle" fill="${p.accent}" font-family="Inter, Arial, sans-serif" font-weight="600" font-size="${Math.min(1.55, w * 0.14)}">${esc(line)}</text>`
    })
  } else {
    const start = y + Math.min(14, h * 0.1)
    const step = 3.05
    const sz = Math.min(1.7, w * 0.15)
    fill.lines.forEach((line, i) => {
      out += `<text x="${cx}" y="${start + i * step}" text-anchor="middle" fill="${p.muted}" font-family="${font}" font-weight="400" font-size="${sz}" letter-spacing="0.12">${esc(line)}</text>`
    })
    if (fill.script && h > 70) {
      out += `<text x="${cx}" y="${y + h * 0.72}" text-anchor="middle" fill="${p.accent}" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-weight="400" font-size="${Math.min(3.2, w * 0.26)}" opacity="0.55" data-art="side-script">${esc(fill.script)}</text>`
    }
  }
  out += `</g>`
  return out
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
  const base = Math.min(0.18, plan?.patternSystem.opacity ?? 0.1)
  const op = dens === 'sparse' ? Math.min(0.07, base * 0.45) : dens === 'dense' ? base : base * 0.72
  return wrapSidePattern(family, paintPatternFamily(family, panel, p.accent, Math.min(0.18, op)))
}
