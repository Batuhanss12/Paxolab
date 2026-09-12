/** Professional packaging marks — vector, not UI doodles. */

export function iconRecycle(x: number, y: number, s: number, color: string): string {
  return `<g transform="translate(${x} ${y}) scale(${s / 12})" fill="none" stroke="${color}" stroke-width="0.9">
    <path d="M4 8.2 6.2 4.2 8.8 8.2" />
    <path d="M8.8 8.2h3.4L10 3.6 6.2 4.2" />
    <path d="M3.2 9.6 1.4 6.2 4 8.2" />
    <circle cx="6" cy="7.2" r="5.1" />
  </g>`
}

export function iconKeepDry(x: number, y: number, s: number, color: string): string {
  return `<g transform="translate(${x} ${y}) scale(${s / 12})" fill="none" stroke="${color}" stroke-width="0.9">
    <rect x="1.4" y="3.2" width="9.2" height="7.2" rx="0.6" />
    <path d="M6 4.6v3.4M4.6 6.6 6 8.2l1.4-1.6" />
  </g>`
}

export function iconThisWayUp(x: number, y: number, s: number, color: string): string {
  return `<g transform="translate(${x} ${y}) scale(${s / 12})" fill="none" stroke="${color}" stroke-width="0.9">
    <path d="M6 2.4v7.4M3.6 5.2 6 2.6 8.4 5.2" />
    <path d="M2.2 10.4h7.6" />
  </g>`
}

export function iconFragile(x: number, y: number, s: number, color: string): string {
  return `<g transform="translate(${x} ${y}) scale(${s / 12})" fill="none" stroke="${color}" stroke-width="0.9">
    <path d="M4 2.6h4l1.4 3.4-3.4 5.2L2.6 6z" />
    <path d="M6 5.2v4" />
  </g>`
}

export function iconFsc(x: number, y: number, s: number, color: string): string {
  return `<g transform="translate(${x} ${y}) scale(${s / 12})" fill="none" stroke="${color}" stroke-width="0.85">
    <circle cx="6" cy="6" r="4.6" />
    <path d="M6 9.2V3.6M6 3.6c1.6 1.2 2.2 3 2.2 4.4S7.4 9 6 9.2c-1.4 0-2.4-.8-2.4-2.2S4.4 4.8 6 3.6" />
  </g>`
}

export function iconStrip(x: number, y: number, color: string, gap = 9): string {
  const marks = [iconRecycle, iconKeepDry, iconThisWayUp, iconFragile, iconFsc]
  return marks.map((fn, i) => fn(x + i * gap, y, 7.2, color)).join('')
}
