function hex(value: number): string {
  return Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0')
}

export function dominantColors(pixels: Uint8ClampedArray, limit = 3): string[] {
  const buckets = new Map<string, { count: number; r: number; g: number; b: number }>()
  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3]
    if (alpha < 160) continue
    const r = pixels[index]
    const g = pixels[index + 1]
    const b = pixels[index + 2]
    const light = (r + g + b) / 3
    if (light < 12 || light > 246) continue
    const key = `${r >> 5}:${g >> 5}:${b >> 5}`
    const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 }
    bucket.count += 1
    bucket.r += r
    bucket.g += g
    bucket.b += b
    buckets.set(key, bucket)
  }
  return [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, Math.max(1, limit))
    .map((bucket) => {
      const r = Math.round(bucket.r / bucket.count)
      const g = Math.round(bucket.g / bucket.count)
      const b = Math.round(bucket.b / bucket.count)
      return `#${hex(r)}${hex(g)}${hex(b)}`
    })
}

export function analyzeReferenceImage(dataUrl: string): Promise<string[]> {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 48
      canvas.height = 48
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) {
        resolve([])
        return
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      resolve(dominantColors(context.getImageData(0, 0, canvas.width, canvas.height).data))
    }
    image.onerror = () => resolve([])
    image.src = dataUrl
  })
}
