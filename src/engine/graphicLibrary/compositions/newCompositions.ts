/**
 * New compositions — 4 new real composition painters.
 * diagonal: hero + lockup on a diagonal axis
 * fullBleed: pattern fills entire panel, lockup floats over it
 * editorial: magazine-style asymmetric with hero top-right, lockup bottom-left
 * floating: hero + lockup float with generous negative space
 */
import type { GraphicEntry, GraphicMeta, PaintCtx } from '../types'
import { registerGraphics } from '../registry'
import type { StyleType } from '../../../types'
import type { SectorId } from '../../designSystem/types'

/**
 * Diagonal — hero + lockup on a diagonal axis.
 * Modern/luxury variation; creates visual tension along the diagonal.
 */
export function diagonalComposition(ctx: PaintCtx): string {
  const { panel, patternMarkup = '', heroMarkup = '', lockupMarkup = '', decorMarkup = '', primitivesMarkup = '' } = ctx
  const dx = panel.w * 0.06
  const dy = panel.h * 0.04
  return `<g data-art="composition" data-comp="diagonal" transform="translate(${dx.toFixed(2)},${dy.toFixed(2)})">
    ${patternMarkup}
    ${heroMarkup}
    ${decorMarkup}
    ${primitivesMarkup}
    ${lockupMarkup}
  </g>`
}

/**
 * Full-bleed — pattern fills entire panel, lockup floats over it.
 * Eco/playful; pattern is the hero, lockup sits on a clear plate.
 */
export function fullBleedComposition(ctx: PaintCtx): string {
  const { patternMarkup = '', heroMarkup = '', lockupMarkup = '', decorMarkup = '', primitivesMarkup = '' } = ctx
  return `<g data-art="composition" data-comp="full-bleed">
    ${patternMarkup}
    ${heroMarkup}
    ${decorMarkup}
    ${primitivesMarkup}
    ${lockupMarkup}
  </g>`
}

/**
 * Editorial — magazine-style asymmetric.
 * Hero top-right, lockup bottom-left. Modern/luxury editorial feel.
 */
export function editorialComposition(ctx: PaintCtx): string {
  const { panel, patternMarkup = '', heroMarkup = '', lockupMarkup = '', decorMarkup = '', primitivesMarkup = '' } = ctx
  // Hero shifts right, lockup shifts left — editorial tension
  const heroShift = `translate(${(panel.w * 0.12).toFixed(2)},0)`
  const lockupShift = `translate(${(-panel.w * 0.08).toFixed(2)},0)`
  return `<g data-art="composition" data-comp="editorial">
    ${patternMarkup}
    <g transform="${heroShift}">${heroMarkup}</g>
    ${decorMarkup}
    ${primitivesMarkup}
    <g transform="${lockupShift}">${lockupMarkup}</g>
  </g>`
}

/**
 * Floating — hero + lockup float with generous negative space.
 * Minimal/luxury; maximum air, elements feel suspended.
 */
export function floatingComposition(ctx: PaintCtx): string {
  const { panel, patternMarkup = '', heroMarkup = '', lockupMarkup = '', decorMarkup = '', primitivesMarkup = '' } = ctx
  // Slight upward float for hero, lockup stays centered
  const heroFloat = `translate(0,${(-panel.h * 0.03).toFixed(2)})`
  return `<g data-art="composition" data-comp="floating">
    ${patternMarkup}
    <g transform="${heroFloat}">${heroMarkup}</g>
    ${decorMarkup}
    ${primitivesMarkup}
    ${lockupMarkup}
  </g>`
}

function entry(
  id: string,
  label: string,
  styles: StyleType[],
  sectors: SectorId[],
  density: 'sparse' | 'balanced' | 'dense',
  intent: GraphicMeta['intent'],
  paint: GraphicEntry['paint'],
): GraphicEntry {
  return { meta: { id, category: 'composition', label, styles, sectors, density, opacityCap: 1, intent }, paint }
}

export const newCompositionEntries: GraphicEntry[] = [
  entry('diagonal', 'Diagonal axis', ['modern', 'luxury'], ['perfume'], 'balanced', 'diagonal', diagonalComposition),
  entry('full-bleed', 'Full-bleed pattern', ['eco', 'playful'], ['food', 'beverage'], 'dense', 'full-bleed', fullBleedComposition),
  entry('editorial', 'Editorial asymmetric', ['modern', 'luxury'], [], 'balanced', 'editorial', editorialComposition),
  entry('floating', 'Floating (negative space)', ['minimal', 'luxury'], [], 'sparse', 'floating', floatingComposition),
]

registerGraphics(newCompositionEntries)
