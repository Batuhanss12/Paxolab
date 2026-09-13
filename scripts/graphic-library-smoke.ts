/**
 * GraphicLibrary smoke — verify registry is populated + grammar returns valid picks.
 * Run: npx vite-node scripts/graphic-library-smoke.ts
 */
import { resolveGrammar, listGraphics, paintGraphic } from '../src/engine/graphicLibrary'
import type { PaintCtx } from '../src/engine/graphicLibrary'
import type { Panel, Palette } from '../src/types'

const panel: Panel = { id: 'front', x: 0, y: 0, w: 70, h: 140 }
const palette: Palette = { bg: '#111', fg: '#eee', accent: '#c9a96a', muted: '#888', paper: '#000' }
const ctx: PaintCtx = { panel, palette, opacity: 0.2, seed: 7 }

const patterns = listGraphics('pattern')
const motifs = listGraphics('motif')
const primitives = listGraphics('primitive')
const compositions = listGraphics('composition')
const heroes = listGraphics('hero')

console.log(`Registry: ${patterns.length} patterns, ${motifs.length} motifs, ${primitives.length} primitives, ${compositions.length} compositions, ${heroes.length} heroes`)

// Verify each category has the expected new graphics
const newPatterns = ['marble', 'organic-blob', 'luxury-line', 'botanical', 'technical']
const newMotifs = ['flower', 'star', 'monogram', 'sun', 'abstract']
const newPrimitives = ['bezier', 'spiral', 'blob', 'grid']
const newCompositions = ['diagonal', 'full-bleed', 'editorial', 'floating']
const sectorMotifs = ['foil-stripe', 'perfume-bottle', 'wheat-sheaf', 'honeycomb', 'circuit', 'chip']
const seasonalPatterns = ['snowflake', 'blossom']
const brandHeroes = ['luxury-monogram', 'eco-leaf-hero']

for (const id of newPatterns) {
  if (!patterns.find((p) => p.meta.id === id)) throw new Error(`Missing new pattern: ${id}`)
}
for (const id of newMotifs) {
  if (!motifs.find((m) => m.meta.id === id)) throw new Error(`Missing new motif: ${id}`)
}
for (const id of newPrimitives) {
  if (!primitives.find((p) => p.meta.id === id)) throw new Error(`Missing new primitive: ${id}`)
}
for (const id of newCompositions) {
  if (!compositions.find((c) => c.meta.id === id)) throw new Error(`Missing new composition: ${id}`)
}
for (const id of sectorMotifs) {
  if (!motifs.find((m) => m.meta.id === id)) throw new Error(`Missing sector motif: ${id}`)
}
for (const id of seasonalPatterns) {
  if (!patterns.find((p) => p.meta.id === id)) throw new Error(`Missing seasonal pattern: ${id}`)
}
for (const id of brandHeroes) {
  if (!heroes.find((h) => h.meta.id === id)) throw new Error(`Missing brand hero: ${id}`)
}

// Verify grammar returns valid picks for each style+sector combination
const styles = ['luxury', 'modern', 'minimal', 'eco', 'playful', 'classic']
const sectors = ['perfume', 'cream', 'food', 'electronics', 'cleaning']
const surfaces: ('box' | 'label')[] = ['box', 'label']

let totalPicks = 0
let heroPicks = 0
let patternPicks = 0
for (const style of styles) {
  for (const sector of sectors) {
    for (const surface of surfaces) {
      for (const variation of [0, 1, 2]) {
        const picks = resolveGrammar({ style: style as never, sector: sector as never, surface, variationIndex: variation, density: 'balanced' })
        totalPicks++
        if (picks.hero) heroPicks++
        if (picks.pattern) patternPicks++
        // Verify composition is never null
        if (!picks.composition) throw new Error(`Null composition for ${style}/${sector}/${surface}/v${variation}`)
        // Verify each pick can be painted without error
        const compSvg = paintGraphic('composition', picks.composition, ctx)
        if (!compSvg.includes('data-comp')) throw new Error(`Composition ${picks.composition} did not paint`)
      }
    }
  }
}

console.log(`Grammar: ${totalPicks} picks resolved, ${heroPicks} with hero, ${patternPicks} with pattern`)

// Verify a few specific grammar rules
const perfumeLuxuryV0 = resolveGrammar({ style: 'luxury', sector: 'perfume', surface: 'box', variationIndex: 0, density: 'balanced' })
if (perfumeLuxuryV0.composition !== 'centered') throw new Error(`Expected centered for luxury/perfume/v0, got ${perfumeLuxuryV0.composition}`)
if (perfumeLuxuryV0.hero !== 'crest') throw new Error(`Expected crest for luxury/perfume/v0, got ${perfumeLuxuryV0.hero}`)
if (perfumeLuxuryV0.pattern !== 'contour') throw new Error(`Expected contour for luxury/perfume/v0, got ${perfumeLuxuryV0.pattern}`)

const perfumeLuxuryV1 = resolveGrammar({ style: 'luxury', sector: 'perfume', surface: 'box', variationIndex: 1, density: 'balanced' })
if (perfumeLuxuryV1.composition !== 'editorial') throw new Error(`Expected editorial for luxury/perfume/v1, got ${perfumeLuxuryV1.composition}`)
if (perfumeLuxuryV1.hero !== 'monogram') throw new Error(`Expected monogram for luxury/perfume/v1, got ${perfumeLuxuryV1.hero}`)
if (perfumeLuxuryV1.pattern !== 'marble') throw new Error(`Expected marble for luxury/perfume/v1, got ${perfumeLuxuryV1.pattern}`)

const minimalV0 = resolveGrammar({ style: 'minimal', sector: 'perfume', surface: 'box', variationIndex: 0, density: 'balanced' })
if (minimalV0.hero !== 'none') throw new Error(`Expected none hero for minimal, got ${minimalV0.hero}`)
if (minimalV0.pattern !== null) throw new Error(`Expected null pattern for minimal, got ${minimalV0.pattern}`)

const ecoFoodV1 = resolveGrammar({ style: 'eco', sector: 'food', surface: 'box', variationIndex: 1, density: 'balanced' })
if (ecoFoodV1.composition !== 'full-bleed') throw new Error(`Expected full-bleed for eco/food/v1, got ${ecoFoodV1.composition}`)
if (ecoFoodV1.pattern !== 'botanical') throw new Error(`Expected botanical for eco/food/v1, got ${ecoFoodV1.pattern}`)

// Verify new patterns actually paint SVG
const marbleSvg = paintGraphic('pattern', 'marble', ctx)
if (!marbleSvg.includes('data-pattern="marble"')) throw new Error('Marble pattern did not paint correctly')
const technicalSvg = paintGraphic('pattern', 'technical', ctx)
if (!technicalSvg.includes('data-pattern="technical"')) throw new Error('Technical pattern did not paint correctly')

// Verify new motifs paint
const flowerSvg = paintGraphic('motif', 'flower', ctx)
if (!flowerSvg.includes('data-motif="flower"')) throw new Error('Flower motif did not paint correctly')

// Verify new primitives paint
const spiralSvg = paintGraphic('primitive', 'spiral', ctx)
if (!spiralSvg.includes('data-prim="spiral"')) throw new Error('Spiral primitive did not paint correctly')

// Verify new compositions paint
const diagonalSvg = paintGraphic('composition', 'diagonal', ctx)
if (!diagonalSvg.includes('data-comp="diagonal"')) throw new Error('Diagonal composition did not paint correctly')

// Verify sector motifs paint
const foilSvg = paintGraphic('motif', 'foil-stripe', ctx)
if (!foilSvg.includes('data-motif="foil-stripe"')) throw new Error('Foil-stripe motif did not paint correctly')
const circuitSvg = paintGraphic('motif', 'circuit', ctx)
if (!circuitSvg.includes('data-motif="circuit"')) throw new Error('Circuit motif did not paint correctly')
const honeycombSvg = paintGraphic('motif', 'honeycomb', ctx)
if (!honeycombSvg.includes('data-motif="honeycomb"')) throw new Error('Honeycomb motif did not paint correctly')

// Verify seasonal patterns paint
const snowflakeSvg = paintGraphic('pattern', 'snowflake', ctx)
if (!snowflakeSvg.includes('data-pattern="snowflake"')) throw new Error('Snowflake pattern did not paint correctly')
const blossomSvg = paintGraphic('pattern', 'blossom', ctx)
if (!blossomSvg.includes('data-pattern="blossom"')) throw new Error('Blossom pattern did not paint correctly')

// Verify brand heroes paint
const monogramSvg = paintGraphic('hero', 'luxury-monogram', ctx)
if (!monogramSvg.includes('data-art="hero"')) throw new Error('Luxury-monogram hero did not paint correctly')
const ecoLeafSvg = paintGraphic('hero', 'eco-leaf-hero', ctx)
if (!ecoLeafSvg.includes('data-art="hero"')) throw new Error('Eco-leaf-hero did not paint correctly')

console.log('GraphicLibrary smoke passed')
console.log(`  new patterns: ${newPatterns.join(', ')}`)
console.log(`  new motifs: ${newMotifs.join(', ')}`)
console.log(`  new primitives: ${newPrimitives.join(', ')}`)
console.log(`  new compositions: ${newCompositions.join(', ')}`)
console.log(`  sector motifs: ${sectorMotifs.join(', ')}`)
console.log(`  seasonal patterns: ${seasonalPatterns.join(', ')}`)
console.log(`  brand heroes: ${brandHeroes.join(', ')}`)
console.log(`  grammar rules: ${totalPicks} combinations resolved`)
