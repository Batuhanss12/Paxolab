/**
 * Monstera hero — Split-leaf tropical silhouette.
 * Layered: leaf body → central vein → side curves → side lobe.
 * Used by: eco monstera variation.
 */

export function paintMonstera(cx: number, cy: number, r: number, accent: string): string {
  const s = r * 1.1
  return `
    <path d="M${cx} ${cy - s * 0.9} C${cx + s * 0.95} ${cy - s * 0.45} ${cx + s * 1.2} ${cy + s * 0.15} ${cx + s * 0.65} ${cy + s * 0.85}
      C${cx + s * 0.2} ${cy + s * 1.05} ${cx - s * 0.2} ${cy + s * 1.05} ${cx - s * 0.65} ${cy + s * 0.85}
      C${cx - s * 1.2} ${cy + s * 0.15} ${cx - s * 0.95} ${cy - s * 0.45} ${cx} ${cy - s * 0.9}" fill="${accent}" fill-opacity="0.1" stroke="${accent}" stroke-width="0.32" />
    <line x1="${cx}" y1="${cy - s * 0.75}" x2="${cx}" y2="${cy + s * 0.9}" stroke="${accent}" stroke-width="0.2" />
    <path d="M${cx} ${cy - s * 0.15} C${cx + s * 0.55} ${cy - s * 0.55} ${cx + s * 0.85} ${cy - s * 0.15} ${cx + s * 0.55} ${cy + s * 0.35}" fill="none" stroke="${accent}" stroke-opacity="0.55" stroke-width="0.18" />
    <path d="M${cx} ${cy + s * 0.15} C${cx - s * 0.55} ${cy - s * 0.25} ${cx - s * 0.85} ${cy + s * 0.05} ${cx - s * 0.55} ${cy + s * 0.55}" fill="none" stroke="${accent}" stroke-opacity="0.55" stroke-width="0.18" />
    <ellipse cx="${cx + s * 0.35}" cy="${cy - s * 0.1}" rx="${s * 0.22}" ry="${s * 0.35}" fill="none" stroke="${accent}" stroke-opacity="0.25" stroke-width="0.12" />
  `
}
