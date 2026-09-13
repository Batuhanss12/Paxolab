import type { DesignBrief } from '../types'

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

// --- Rich analysis ---

export type CompositionLayout = 'centered' | 'grid' | 'asymmetric' | 'minimal' | 'dense'

export interface ReferenceAnalysis {
  /** Dominant hex colors (e.g. #b52929). */
  colors: string[]
  /** Average brightness 0–1. */
  brightness: number
  /** Contrast ratio 0–1 (high = stark, low = flat). */
  contrast: number
  /** Average saturation 0–1. */
  saturation: number
  /** Composition layout hint. */
  layout: CompositionLayout
  /** Visual density 0–1 (how much of the canvas is non-background). */
  density: number
  /** Sector hint based on color + density heuristics. */
  sectorHint: string
  /** Suggested style based on analysis. */
  styleHint: string
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
    }
    h /= 6
  }
  return [h, s, l]
}

/** Analyze a downscaled image buffer for composition, density, color, and sector hints. */
export function analyzePixels(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): ReferenceAnalysis {
  const colors = dominantColors(pixels, 4)
  let totalL = 0
  let totalS = 0
  let minL = 1
  let maxL = 0
  let nonBg = 0
  let totalPixels = 0
  // Quadrant density for layout detection
  const quadrants = [0, 0, 0, 0] // TL, TR, BL, BR
  const quadTotal = Math.max(1, Math.floor((width * height) / 4))
  for (let i = 0; i < pixels.length; i += 4) {
    const a = pixels[i + 3]
    if (a < 128) continue
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    const [, s, l] = rgbToHsl(r, g, b)
    totalL += l
    totalS += s
    minL = Math.min(minL, l)
    maxL = Math.max(maxL, l)
    totalPixels++
    // Non-background: differs from the most common color bucket
    if (l > 0.15 && l < 0.92) nonBg++
    // Quadrant
    const px = (i / 4) % width
    const py = Math.floor(i / 4 / width)
    const qi = (py < height / 2 ? 0 : 2) + (px < width / 2 ? 0 : 1)
    if (l > 0.15 && l < 0.92) quadrants[qi]++
  }
  const brightness = totalPixels ? totalL / totalPixels : 0.5
  const saturation = totalPixels ? totalS / totalPixels : 0
  const contrast = totalPixels ? Math.min(1, (maxL - minL) * 1.2) : 0
  const density = totalPixels ? nonBg / totalPixels : 0
  // Layout: check quadrant distribution
  const quadDensities = quadrants.map((q) => q / quadTotal)
  const quadVariance = quadDensities.reduce((sum, d) => sum + Math.abs(d - density) ** 2, 0) / 4
  let layout: CompositionLayout = 'centered'
  if (density < 0.15) layout = 'minimal'
  else if (density > 0.7) layout = 'dense'
  else if (quadVariance > 0.04) layout = 'asymmetric'
  else if (density > 0.3 && quadVariance < 0.015) layout = 'grid'
  // Sector hint: warm+low-sat = food, cool+high-sat = cosmetics, dark+low-sat = electronics
  let sectorHint = ''
  if (brightness > 0.7 && saturation < 0.25) sectorHint = 'minimal'
  else if (brightness < 0.3 && contrast > 0.5) sectorHint = 'electronics'
  else if (saturation > 0.4 && brightness > 0.5) sectorHint = 'cosmetics'
  else if (saturation > 0.3 && brightness < 0.5) sectorHint = 'food'
  else if (saturation < 0.2 && brightness > 0.4) sectorHint = 'eco'
  // Style hint
  let styleHint = ''
  if (layout === 'minimal' || density < 0.2) styleHint = 'minimal'
  else if (contrast > 0.6 && brightness < 0.4) styleHint = 'modern'
  else if (saturation > 0.35 && density > 0.4) styleHint = 'playful'
  else if (layout === 'grid' && saturation < 0.3) styleHint = 'modern'
  else if (density > 0.5 && contrast < 0.4) styleHint = 'classic'
  else if (brightness > 0.6 && saturation < 0.3) styleHint = 'luxury'
  return {
    colors,
    brightness,
    contrast,
    saturation,
    layout,
    density,
    sectorHint,
    styleHint,
  }
}

/** Build a brief patch from analysis — only fills empty fields, never overwrites. */
export function analysisToBriefPatch(
  analysis: ReferenceAnalysis,
  brief: DesignBrief,
): Partial<DesignBrief> {
  const patch: Partial<DesignBrief> = {}
  if (!brief.colors && analysis.colors.length) {
    patch.colors = analysis.colors.join(' · ')
  }
  if (!brief.styleType && analysis.styleHint) {
    patch.styleType = analysis.styleHint as DesignBrief['styleType']
  }
  return patch
}

export function analyzeReferenceImage(dataUrl: string): Promise<string[]> {
  return analyzeReferenceImageRich(dataUrl).then((a) => a?.colors ?? [])
}

/** Full reference analysis — colors + composition + density + hints. */
export function analyzeReferenceImageRich(dataUrl: string): Promise<ReferenceAnalysis | null> {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 64
      canvas.height = 64
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) {
        resolve(null)
        return
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      const data = context.getImageData(0, 0, canvas.width, canvas.height).data
      resolve(analyzePixels(data, canvas.width, canvas.height))
    }
    image.onerror = () => resolve(null)
    image.src = dataUrl
  })
}
