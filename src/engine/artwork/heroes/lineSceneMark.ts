/**
 * Quiet monoline horizon — DNA-class air for minimal cosmetics / baby.
 * Vector only; no photo meadow.
 */
export function paintLineScene(cx: number, cy: number, r: number, color: string): string {
  const w = r * 2.8
  const left = cx - w / 2
  const right = cx + w / 2
  const horizon = cy + r * 0.22
  const sunR = r * 0.28
  const sunX = cx + r * 0.55
  const sunY = cy - r * 0.42
  const palmX = cx - r * 0.72
  return `<g data-art="hero-line-scene">
    <line x1="${left}" y1="${horizon}" x2="${right}" y2="${horizon}" stroke="${color}" stroke-width="0.22" stroke-opacity="0.55" />
    <path d="M${left + w * 0.08} ${horizon} C${left + w * 0.28} ${horizon - r * 0.18} ${left + w * 0.42} ${horizon + r * 0.08} ${cx} ${horizon}" fill="none" stroke="${color}" stroke-width="0.16" stroke-opacity="0.32" />
    <circle cx="${sunX}" cy="${sunY}" r="${sunR}" fill="none" stroke="${color}" stroke-width="0.2" stroke-opacity="0.5" />
    <path d="M${palmX} ${horizon} L${palmX} ${horizon - r * 0.85}" fill="none" stroke="${color}" stroke-width="0.18" stroke-opacity="0.45" />
    <path d="M${palmX} ${horizon - r * 0.55} C${palmX - r * 0.42} ${horizon - r * 0.72} ${palmX - r * 0.2} ${horizon - r * 0.95} ${palmX} ${horizon - r * 0.82}" fill="none" stroke="${color}" stroke-width="0.16" stroke-opacity="0.4" />
    <path d="M${palmX} ${horizon - r * 0.55} C${palmX + r * 0.38} ${horizon - r * 0.7} ${palmX + r * 0.18} ${horizon - r * 0.98} ${palmX} ${horizon - r * 0.8}" fill="none" stroke="${color}" stroke-width="0.16" stroke-opacity="0.4" />
  </g>`
}
