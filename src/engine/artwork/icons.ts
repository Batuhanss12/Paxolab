/** Print-safe packaging marks. Stroke-only ISO-class, 12×12 view. */

export function iconRecycle(x: number, y: number, s: number, color: string): string {
  return `<g transform="translate(${x} ${y}) scale(${s / 12})" fill="none" stroke="${color}" stroke-width="0.72" stroke-linejoin="miter">
    <path d="M6 1.7 3.35 6.05h1.55l1.1-1.85 1.1 1.85h1.55Z" />
    <path d="M10.55 4.35 7.15 9.95l.35-1.85 2.1-.05 1.1 1.85" />
    <path d="M1.45 4.35 4.85 9.95l-.35-1.85-2.1-.05-1.1 1.85" />
    <path d="M6.55 3.15 7.35 1.85M9.85 8.55l1.35.15M2.15 8.7 3.5 8.55" />
  </g>`
}

export function iconPao(x: number, y: number, s: number, color: string, months = '12M'): string {
  return `<g transform="translate(${x} ${y}) scale(${s / 12})" fill="none" stroke="${color}" stroke-width="0.7">
    <rect x="3.1" y="5.15" width="5.8" height="5.15" />
    <path d="M3.1 5.15C3.1 3.55 4.25 2.45 6 2.45h.15c.85 0 1.55.35 2 .95" />
    <path d="M8.15 2.2h2.15v1.7H8.55" />
    <text x="6" y="9.05" text-anchor="middle" fill="${color}" stroke="none" font-family="Inter, Arial, sans-serif" font-size="2.45" font-weight="600">${months}</text>
  </g>`
}

export function iconEmark(x: number, y: number, s: number, color: string): string {
  return `<g transform="translate(${x} ${y}) scale(${s / 12})" fill="none" stroke="${color}" stroke-width="0.82" stroke-linecap="square">
    <path d="M8.85 2.85H4.15v6.4h4.7" />
    <path d="M4.15 6.05h3.55" />
    <path d="M8.85 2.85v1.55" />
  </g>`
}

export function iconPap21(x: number, y: number, s: number, color: string): string {
  return `<g transform="translate(${x} ${y}) scale(${s / 12})" fill="none" stroke="${color}" stroke-width="0.7">
    <path d="M2.3 4.15 6 2.25 9.7 4.15v5.35L6 11.4 2.3 9.5Z" />
    <path d="M2.3 4.15 6 6.1l3.7-1.95M6 6.1v5.3" />
    <text x="6" y="8.55" text-anchor="middle" fill="${color}" stroke="none" font-family="Inter, Arial, sans-serif" font-size="1.85">21</text>
  </g>`
}

export function iconWeee(x: number, y: number, s: number, color: string): string {
  return `<g transform="translate(${x} ${y}) scale(${s / 12})" fill="none" stroke="${color}" stroke-width="0.7">
    <path d="M3.15 5.05h5.7l-.55 5.35H3.7Z" />
    <path d="M2.45 5.05h7.1M4.35 5.05V3.65h3.3v1.4" />
    <circle cx="4.05" cy="11.05" r="0.48" fill="${color}" stroke="none" />
    <circle cx="7.95" cy="11.05" r="0.48" fill="${color}" stroke="none" />
    <path d="M2.2 2.15 9.85 10.15M9.85 2.15 2.2 10.15" />
  </g>`
}

export function iconKeepDry(x: number, y: number, s: number, color: string): string {
  return `<g transform="translate(${x} ${y}) scale(${s / 12})" fill="none" stroke="${color}" stroke-width="0.72" stroke-linejoin="round">
    <path d="M1.7 5.35c2.1-2.35 6.5-2.35 8.6 0" />
    <path d="M6 2.2v3.15" />
    <path d="M3.2 8.15c0 0 .15 2.35 1.45 2.35S6 8.55 6 8.55" />
    <path d="M6.95 8.15c0 0 .15 2.35 1.45 2.35S9.7 8.55 9.7 8.55" />
  </g>`
}

export function iconThisWayUp(x: number, y: number, s: number, color: string): string {
  return `<g transform="translate(${x} ${y}) scale(${s / 12})" fill="none" stroke="${color}" stroke-width="0.8">
    <path d="M2.55 5.9 4.35 3.2 6.15 5.9" />
    <path d="M4.35 3.2v6.55" />
    <path d="M7.35 5.9 9.15 3.2 10.95 5.9" />
    <path d="M9.15 3.2v6.55" />
    <path d="M2.2 10.85h8.7" />
  </g>`
}

export function iconGreenDot(x: number, y: number, s: number, color: string): string {
  return `<g transform="translate(${x} ${y}) scale(${s / 12})" fill="none" stroke="${color}" stroke-width="0.78">
    <circle cx="6" cy="6" r="4.55" />
    <path d="M4.15 7.55c.85 1.15 2.55 1.45 3.7.55" />
    <path d="M7.85 4.45c-.85-1.15-2.55-1.45-3.7-.55" />
    <path d="M7.85 4.45 6.7 3.55M4.15 7.55l1.15 1" />
  </g>`
}

export function iconLeaflet(x: number, y: number, s: number, color: string): string {
  return `<g transform="translate(${x} ${y}) scale(${s / 12})" fill="none" stroke="${color}" stroke-width="0.7">
    <path d="M2.2 2.35h4.05v8.1H2.2Z" />
    <path d="M6.25 2.35h3.55v8.1H6.25" />
    <path d="M6.25 2.35v8.1" />
    <path d="M3.15 4.15h2.1M3.15 5.85h2.1M3.15 7.55h1.55" />
  </g>`
}

export function iconFlammable(x: number, y: number, s: number, color: string): string {
  return `<g transform="translate(${x} ${y}) scale(${s / 12})" fill="none" stroke="${color}" stroke-width="0.72">
    <path d="M6 1.35 10.65 6 6 10.65 1.35 6Z" />
    <path d="M6 8.35c1.15 0 1.85-.85 1.85-1.85 0-1.15-1.1-1.85-1.85-2.85-.75 1-1.85 1.7-1.85 2.85 0 1 .7 1.85 1.85 1.85Z" />
  </g>`
}

export function iconKeepAway(x: number, y: number, s: number, color: string): string {
  return `<g transform="translate(${x} ${y}) scale(${s / 12})" fill="none" stroke="${color}" stroke-width="0.7">
    <circle cx="6" cy="3.15" r="1.15" />
    <path d="M6 4.55v3.15M4.15 6.15h3.7M4.55 10.55 6 7.7 7.45 10.55" />
  </g>`
}

export function iconGlassFork(x: number, y: number, s: number, color: string): string {
  return `<g transform="translate(${x} ${y}) scale(${s / 12})" fill="none" stroke="${color}" stroke-width="0.7">
    <path d="M3.35 2.25v3.4c0 1.15.85 1.85 1.7 1.85h.15V10.7" />
    <path d="M2.55 2.25v2.35M4.15 2.25v2.35" />
    <path d="M7.15 2.4c1.55 0 2.55 1.15 2.55 2.55S8.7 7.5 7.15 7.5 4.6 6.35 4.6 4.95 5.6 2.4 7.15 2.4Z" />
    <path d="M7.15 7.5v3.2" />
  </g>`
}

/** Legacy kind strip — prefer renderMarkStrip from the marks matrix. */
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
        ? [iconEmark, iconRecycle, iconGlassFork, iconPap21]
        : kind === 'cosmetics'
          ? [iconPao, iconLeaflet, iconRecycle, iconFlammable]
          : [iconRecycle, iconEmark]
  return pack.map((fn, i) => fn(x + i * gap, y, 7.5, color)).join('')
}
