/**
 * Legal block rendering — back panel legal columns and marks bar.
 * Extracted from composeArtwork.ts.
 */
import type { Palette } from '../../../types'
import { legalColumnChrome } from '../motifs'
import { renderMarkStrip } from '../../marks/render'
import { escapeSvg as esc } from '../svgGeometry'
import type { CraftPlan } from '../craft'

/** Legal section heading. */
export function legalHead(x: number, y: number, label: string, p: Palette, serif: boolean, tracking: number): string {
  const font = serif ? "Georgia, 'Times New Roman', serif" : 'Inter, Arial, sans-serif'
  return `<text x="${x}" y="${y}" fill="${p.accent}" font-family="${font}" font-weight="600" font-size="1.95" letter-spacing="${tracking}">${esc(label)}</text>`
}

/** Legal block — titled column with chrome and lines. */
export function legalBlock(
  x: number,
  y: number,
  w: number,
  title: string,
  lines: string[],
  p: Palette,
  serif: boolean,
  lineH: number,
  legalMm: number,
  trackingLegal: number,
  index = '01',
): { markup: string; height: number } {
  const pad = 2.15
  const h = pad + 3.2 + lines.length * lineH + pad
  const lineYs = lines.map((_, i) => y + 6.15 + i * lineH)
  const markup = `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.paper}" opacity="0.42" />
    <rect x="${x}" y="${y}" width="0.58" height="${h}" fill="${p.accent}" />
    ${legalColumnChrome(x, y, w, h, index, p.accent, lineYs)}
    ${legalHead(x + 8.0, y + 3.05, title, p, serif, Math.max(0.7, trackingLegal + 0.9))}
    ${lines
      .map(
        (line, i) =>
          `<text x="${x + 8.0}" y="${y + 6.15 + i * lineH}" fill="${p.fg}" font-family="Inter, Arial, sans-serif" font-weight="400" font-size="${legalMm}" letter-spacing="${trackingLegal}">${esc(line)}</text>`,
      )
      .join('')}
  `
  return { markup, height: h }
}

/** Marks bar — bottom strip with regulatory marks. */
export function marksBar(x: number, y: number, w: number, p: Palette, plan: CraftPlan): string {
  const ids = plan.grammar === 'label' ? plan.marks.labelStrip : plan.marks.strip
  return `
    <rect x="${x}" y="${y}" width="${w}" height="11.4" fill="${p.paper}" opacity="0.35" />
    <line x1="${x}" y1="${y}" x2="${x + w}" y2="${y}" stroke="${p.accent}" stroke-opacity="0.45" stroke-width="0.2" />
    ${renderMarkStrip(x + 2.2, y + 1.7, Math.max(8, w - 4.4), p.accent, ids, plan.marks.recipe, plan.allowPerfumeAssets)}
  `
}
