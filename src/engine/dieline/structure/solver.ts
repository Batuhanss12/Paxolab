import type { StructureId } from '../../../types'
import type { BoxDimensions, GrammarId, MaterialProfile, StructuralDims } from './types'

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

/**
 * 300 g/m² · 0.389 mm comes from the owner-supplied Die Cut Templates
 * drawing becf-11101.pdf (ECMA A60.20.00.03). Not an invented mill spec.
 */
export const MATERIAL_PROFILES: Record<string, MaterialProfile> = {
  'carton-300': {
    id: 'carton-300',
    label: '300 g/m² karton',
    gsm: 300,
    thicknessMm: 0.389,
    source: 'reference-drawing',
  },
  'engine-default-board': {
    id: 'engine-default-board',
    label: 'Forxa motor varsayılanı (kalınlık alanı)',
    thicknessMm: 0.3,
    source: 'engine-default',
  },
  unknown: {
    id: 'unknown',
    label: 'Kalınlık belirtilmedi — crease compensation yok',
    source: 'declared',
  },
}

export function resolveMaterial(id?: string, thicknessMm?: number, gsm?: number): MaterialProfile {
  if (id && MATERIAL_PROFILES[id]) {
    const base = MATERIAL_PROFILES[id]!
    return {
      ...base,
      thicknessMm: thicknessMm ?? base.thicknessMm,
      gsm: gsm ?? base.gsm,
    }
  }
  if (thicknessMm != null || gsm != null) {
    return {
      id: 'declared',
      label: 'Kullanıcı / şablon kalınlığı',
      thicknessMm,
      gsm,
      source: 'declared',
    }
  }
  return MATERIAL_PROFILES.unknown!
}

export function classifyGrammar(structureId: string): { grammar: GrammarId; ecmaCode?: string } {
  if (structureId === 'tuck-top-auto-bottom') return { grammar: 'tuck-top-auto-bottom', ecmaCode: 'A60.20.00.03' }
  if (structureId === 'rsc-carton') return { grammar: 'rsc' }
  if (structureId === 'tuck-end-box') return { grammar: 'straight-tuck-end' }
  if (structureId === 'reverse-tuck-end-box') return { grammar: 'reverse-tuck-end' }
  if (structureId === 'mailer-box') return { grammar: 'mailer' }
  if (structureId === 'sleeve') return { grammar: 'sleeve' }
  if (structureId === 'snap-lock-box') return { grammar: 'snap-lock' }
  if (structureId === 'polygon-box') return { grammar: 'polygon' }
  if (structureId === 'product-carrier-tray') return { grammar: 'carrier-tray' }
  if (structureId === 'tray-box' || structureId === 'simple-tray') return { grammar: 'tray' }
  if (structureId === 'pillow-box') return { grammar: 'pillow' }
  if (structureId === 'rigid-gift-box') return { grammar: 'rigid-gift' }
  if (structureId === 'flat-label' || structureId === 'wrap-label' || structureId === 'round-label' || structureId === 'oval-label') return { grammar: 'label' }
  // A tag and a card are flat printed pieces: the label grammar is exactly right for both.
  if (structureId === 'hang-tag' || structureId === 'insert-card') return { grammar: 'label' }
  return { grammar: 'unknown' }
}

export function boxFromMm(L: number, W: number, H: number): BoxDimensions {
  return { width: L, depth: W, height: H, units: 'mm' }
}

/**
 * W/D/H → flap / glue / tuck. Does not emit SVG.
 * A60 ratios traced from becf-11101.pdf at 100 × 50 × 150 mm.
 */
export function solveDimensions(
  grammar: GrammarId,
  dims: BoxDimensions,
  material: MaterialProfile,
): StructuralDims {
  const A = dims.width
  const B = dims.depth
  const C = dims.height
  const foldClearance = material.thicknessMm ?? 0
  const bleed = { amount: 3, unit: 'mm' as const }
  const safeInset = 3
  const base: StructuralDims = {
    panelWidth: A,
    panelHeight: C,
    flapDepth: 0,
    tuckLength: 0,
    dustFlapLength: 0,
    glueWidth: 0,
    foldClearance,
    slotWidth: 0,
    lockDepth: 0,
    cornerRadius: 0,
    tuckHead: 0,
    tuckInset: 0,
    bleed,
    safeInset,
  }

  if (grammar === 'tuck-top-auto-bottom') {
    return {
      ...base,
      glueWidth: clamp(A * 0.13, 10, 16),
      tuckLength: B,
      tuckHead: B * 0.28,
      tuckInset: B * 0.18,
      dustFlapLength: B * 0.64,
      lockDepth: B * 0.72,
      flapDepth: B * 0.72,
      cornerRadius: 0,
    }
  }

  if (grammar === 'rsc') {
    return {
      ...base,
      glueWidth: clamp(Math.max(20, B * 0.4), 18, 40),
      flapDepth: B / 2,
      slotWidth: 3,
      lockDepth: 0,
    }
  }

  if (grammar === 'straight-tuck-end' || grammar === 'reverse-tuck-end' || grammar === 'snap-lock') {
    return {
      ...base,
      glueWidth: clamp(A * 0.15, 8, 20),
      tuckLength: clamp(B * 0.8, 12, Math.min(B, C * 0.45)),
      dustFlapLength: clamp(B * 0.5, 8, B * 0.55),
      flapDepth: clamp(B * 0.5, 8, B * 0.55),
      lockDepth: grammar === 'snap-lock' ? clamp(B * 0.72, 16, B) : 0,
      cornerRadius: 2,
    }
  }

  if (grammar === 'mailer') {
    return {
      ...base,
      glueWidth: 0,
      tuckLength: clamp(B * 0.375, 10, 40),
      lockDepth: clamp(B * 0.375, 10, 40),
      flapDepth: B * 0.5,
      dustFlapLength: B * 0.5,
      cornerRadius: 2,
    }
  }

  if (grammar === 'sleeve') {
    return {
      ...base,
      glueWidth: clamp(A * 0.15, 8, 20),
      panelHeight: C || B,
    }
  }

  if (grammar === 'label') {
    return { ...base, panelWidth: A, panelHeight: C, bleed, safeInset }
  }

  return base
}

export function solvedEngineParams(solved: StructuralDims): Record<string, number> {
  const params: Record<string, number> = {
    glueTabWidth: solved.glueWidth,
    tuckLength: solved.tuckLength,
    dustFlapWidth: solved.dustFlapLength,
  }
  if (solved.foldClearance > 0) params.materialThickness = solved.foldClearance
  if (solved.lockDepth > 0) params.lidTuck = solved.lockDepth
  if (solved.flapDepth > 0) params.sideFlapWidth = solved.flapDepth
  if (solved.cornerRadius > 0) params.cornerRadius = solved.cornerRadius
  return params
}

export function isProductionGrammar(structureId: StructureId | string): boolean {
  return structureId === 'tuck-top-auto-bottom' || structureId === 'rsc-carton'
}
