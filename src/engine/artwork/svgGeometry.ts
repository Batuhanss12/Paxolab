import type { Panel } from '../../types'

export function escapeSvg(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function panelClip(panel: Panel): string {
  return `url(#clip-${panel.id})`
}

export function panelClipDefinition(panel: Panel): string {
  const points = (panel.polygon?.length
    ? panel.polygon
    : [
        { x: panel.x, y: panel.y },
        { x: panel.x + panel.w, y: panel.y },
        { x: panel.x + panel.w, y: panel.y + panel.h },
        { x: panel.x, y: panel.y + panel.h },
      ]
  )
    .map((point) => `${point.x},${point.y}`)
    .join(' ')
  return `<clipPath id="clip-${panel.id}" clipPathUnits="userSpaceOnUse"><polygon points="${points}" /></clipPath>`
}

export function wrapSvgLines(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxChars && current) {
      lines.push(current)
      current = word
      if (lines.length >= maxLines) return lines
    } else {
      current = next
    }
  }
  if (current && lines.length < maxLines) lines.push(current)
  return lines
}

export function minMm(size: number, minimum: number): number {
  return Math.max(minimum, size)
}
