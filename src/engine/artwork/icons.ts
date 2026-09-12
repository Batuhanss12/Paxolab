/** Print-safe packaging marks — PAO / recycle / ℮ / WEEE class. Stroke-only, 12×12. */

export function iconRecycle(x: number, y: number, s: number, color: string): string {
  return `<g transform="translate(${x} ${y}) scale(${s / 12})" fill="none" stroke="${color}" stroke-width="0.8" stroke-linejoin="round">
    <path d="M6 1.6 8.4 5.6H3.6Z" />
    <path d="M10.4 4.2 8.2 8.6l3.8.2Z" transform="rotate(120 6 6.2)" />
    <path d="M10.4 4.2 8.2 8.6l3.8.2Z" transform="rotate(240 6 6.2)" />
    <path d="M6 2.3v1.7M9.7 8.3l-1.5-.9M2.3 8.3l1.5-.9" />
  </g>`
}

export function iconPao(x: number, y: number, s: number, color: string, months = '12M'): string {
  return `<g transform="translate(${x} ${y}) scale(${s / 12})" fill="none" stroke="${color}" stroke-width="0.75">
    <path d="M3.2 5.4h5.6v5.2H3.2Z" />
    <path d="M3.2 5.4c0-1.5 1.2-2.6 2.8-2.6h.4c.6 0 1.1.2 1.5.6" />
    <path d="M7.8 2.4h2.2v1.8H8.4Z" />
    <text x="6" y="9.2" text-anchor="middle" fill="${color}" stroke="none" font-family="Inter, sans-serif" font-size="2.6" font-weight="600">${months}</text>
  </g>`
}

export function iconEmark(x: number, y: number, s: number, color: string): string {
  return `<g transform="translate(${x} ${y}) scale(${s / 12})" fill="none" stroke="${color}" stroke-width="0.85">
    <path d="M8.6 3.2H4.4v5.8h4.3" />
    <path d="M4.4 6.1h3.4" />
    <path d="M8.8 3.2v1.4" />
  </g>`
}

export function iconPap21(x: number, y: number, s: number, color: string): string {
  return `<g transform="translate(${x} ${y}) scale(${s / 12})" fill="none" stroke="${color}" stroke-width="0.75">
    <path d="M2.4 4.2 6 2.4 9.6 4.2v5.2L6 11.2 2.4 9.4Z" />
    <path d="M2.4 4.2 6 6l3.6-1.8M6 6v5.2" />
    <text x="6" y="8.4" text-anchor="middle" fill="${color}" stroke="none" font-family="Inter, sans-serif" font-size="1.8">21</text>
  </g>`
}

export function iconWeee(x: number, y: number, s: number, color: string): string {
  return `<g transform="translate(${x} ${y}) scale(${s / 12})" fill="none" stroke="${color}" stroke-width="0.75">
    <path d="M3 5.2h6l-.6 5.2H3.6Z" />
    <path d="M2.4 5.2h7.2M4.2 5.2V3.8h3.6v1.4" />
    <circle cx="3.8" cy="11" r="0.55" fill="${color}" stroke="none" />
    <circle cx="8.2" cy="11" r="0.55" fill="${color}" stroke="none" />
    <path d="M2.2 2.4 9.8 10.2M9.8 2.4 2.2 10.2" />
  </g>`
}

export function iconKeepDry(x: number, y: number, s: number, color: string): string {
  return `<g transform="translate(${x} ${y}) scale(${s / 12})" fill="none" stroke="${color}" stroke-width="0.8">
    <path d="M6 2.4c2.4 0 4.4 1.6 4.4 2.8H1.6C1.6 4 3.6 2.4 6 2.4Z" />
    <path d="M6 5.2v3.4" />
    <path d="M4.4 10.4c0-1.2.8-1.8 1.6-1.8s1.6.6 1.6 1.8" />
  </g>`
}

export function iconThisWayUp(x: number, y: number, s: number, color: string): string {
  return `<g transform="translate(${x} ${y}) scale(${s / 12})" fill="none" stroke="${color}" stroke-width="0.85">
    <path d="M3.4 6.2 6 2.8 8.6 6.2" />
    <path d="M6 2.8v6.6" />
    <path d="M2.6 10.6h6.8" />
  </g>`
}

export function iconGreenDot(x: number, y: number, s: number, color: string): string {
  return `<g transform="translate(${x} ${y}) scale(${s / 12})" fill="none" stroke="${color}" stroke-width="0.8">
    <circle cx="6" cy="6" r="4.5" />
    <circle cx="4.6" cy="6.1" r="1.5" />
    <circle cx="7.5" cy="6.1" r="1.5" />
  </g>`
}

export function iconStrip(
  x: number,
  y: number,
  color: string,
  kind: 'cosmetics' | 'food' | 'electronics' | 'generic' = 'generic',
  gap = 8.4,
): string {
  const pack =
    kind === 'electronics'
      ? [iconWeee, iconRecycle, iconThisWayUp, iconKeepDry]
      : kind === 'food'
        ? [iconEmark, iconRecycle, iconPap21, iconKeepDry]
        : [iconPao, iconRecycle, iconEmark, iconGreenDot]
  return pack
    .map((fn, i) => fn(x + i * gap, y, 7.4, color).replace('currentColor', color))
    .join('')
}
