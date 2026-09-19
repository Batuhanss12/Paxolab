/**
 * SVG → PNG data URL, in the browser.
 *
 * The vision tasks need a bitmap: the OpenAI-compatible image input accepts PNG / JPEG / WebP,
 * not SVG. The SPA has a canvas, so the face is drawn there and read back — nothing leaves the
 * machine except the data URL the provider sends. On a server or in tests there is no document,
 * and this answers null so the callers stay silent rather than throwing.
 *
 * Width is bounded: a 512 px face is enough to judge hierarchy and balance, and it keeps the
 * request small. Height follows the SVG's own aspect.
 */
/**
 * The face markup as XML will accept it.
 *
 * Inline in the page the studio face is HTML, and HTML forgives a bare `&`. Handed to the browser
 * as an `image/svg+xml` blob it is XML, and XML does not: the studio front's font import —
 * `@import url('…?family=Cormorant+Garamond…&family=Great+Vibes…')` — made every studio face fail
 * to decode, `onerror` fired, and the catch below turned that into "no preview". The delivery ZIP
 * shipped without its PNG for every studio design and nothing said so, because a missing picture
 * was deliberately never allowed to block the print files. Measured in the browser pane: the raw
 * front fails, the same markup with `&amp;` decodes.
 *
 * Escaping here rather than in the painter keeps the face markup — and the eighteen frozen
 * hashes — exactly as they are; the inline preview never needed the escape. Entities that are
 * already correct are left alone.
 */
export function xmlSafeSvg(svg: string): string {
  return svg.replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;')
}

export async function rasteriseSvg(svg: string, widthPx = 512): Promise<string | null> {
  if (typeof document === 'undefined' || typeof Image === 'undefined') return null
  try {
    const blob = new Blob([xmlSafeSvg(svg)], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('svg decode'))
        img.src = url
      })
      const aspect = image.naturalWidth > 0 ? image.naturalHeight / image.naturalWidth : 1.4
      const canvas = document.createElement('canvas')
      canvas.width = widthPx
      canvas.height = Math.max(1, Math.round(widthPx * aspect))
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
      return canvas.toDataURL('image/png')
    } finally {
      URL.revokeObjectURL(url)
    }
  } catch {
    return null
  }
}
