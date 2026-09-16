/**
 * Live copy canvas — repaint locked studio (or kit) faces without re-picking
 * direction, template, or palette. Layout still goes through the painters.
 */
import type { DesignSpec } from '../../types'
import { formaSampleEan, normalizeEan13 } from '../barcode'
import { applyPlanToSystem } from '../brain/applyPlan'
import { resolveDesignSystem } from '../designSystem/resolve'
import { composeArtwork } from '../artwork/composeArtwork'
import { artworkFromDocument, documentFromArtwork, validateDesignDocument } from '../document'
import { runPreflight } from '../production/preflight'
import { composeStudioArtwork } from './composeStudioArtwork'
import { isGenericCta, volumeLine } from './copyBank'
import { applyStudioPreflight } from './studioPreflight'
import type { DesignDirection } from './types'

export type CopyField =
  | 'brand'
  | 'product'
  | 'tagline'
  | 'volume'
  | 'ingredients'
  | 'warnings'
  | 'barcode'
  | 'manufacturer'
  | 'address'
  | 'cta'
  | 'usage'

export type CopyPatch = Partial<Pick<DesignSpec['copy'], CopyField>>

export const COPY_FIELD_LIMIT: Record<CopyField, number> = {
  brand: 42,
  product: 56,
  tagline: 96,
  volume: 28,
  ingredients: 480,
  warnings: 320,
  barcode: 14,
  manufacturer: 72,
  address: 96,
  cta: 56,
  usage: 240,
}

export function clampCopyPatch(patch: CopyPatch): CopyPatch {
  const out: CopyPatch = {}
  for (const key of Object.keys(patch) as CopyField[]) {
    const raw = patch[key]
    if (raw == null) continue
    out[key] = raw.slice(0, COPY_FIELD_LIMIT[key])
  }
  return out
}

function mergeCopy(spec: DesignSpec, patch: CopyPatch): DesignSpec['copy'] {
  const next = { ...spec.copy, ...clampCopyPatch(patch) }
  if (patch.barcode !== undefined) {
    const digits = next.barcode.replace(/\D/g, '').slice(0, 13)
    if (!digits) {
      next.barcode = spec.copy.barcode || formaSampleEan(`${next.brand}|${next.product}|${next.volume}`)
    } else if (digits.length >= 12) {
      next.barcode = normalizeEan13(digits)
    } else {
      next.barcode = digits
    }
  }
  return next
}

function lockedDirection(spec: DesignSpec, copy: DesignSpec['copy']): DesignDirection | null {
  const d = spec.studio?.direction
  if (!d) return null
  const locale = spec.copyLocale ?? spec.brief.copyLocale ?? 'tr'
  const claim = copy.cta.trim()
  const chips = claim && !isGenericCta(claim) ? [d.chips[0] ?? claim, claim] : d.chips
  return {
    ...d,
    taglineLine: copy.tagline.trim() || d.taglineLine,
    volumeLine: copy.volume.trim() ? volumeLine(copy.volume, locale) : d.volumeLine,
    chips,
  }
}

/** Sync brief fields that painters read so the next full generate stays consistent. */
function briefFromCopy(spec: DesignSpec, copy: DesignSpec['copy']): DesignSpec['brief'] {
  return {
    ...spec.brief,
    brandName: copy.brand,
    productName: copy.product,
    volume: copy.volume,
    barcode: copy.barcode,
    barcodeDefaulted: spec.brief.barcodeDefaulted && copy.barcode === spec.copy.barcode,
    manufacturerName: copy.manufacturer,
    manufacturerAddress: copy.address,
    copyOverrides: copy.tagline,
  }
}

export function recomposeCopy(
  spec: DesignSpec,
  patch: CopyPatch,
  opts: { logoHref?: string; bumpRevision?: boolean } = {},
): DesignSpec {
  const copy = mergeCopy(spec, patch)
  if (
    copy.brand === spec.copy.brand &&
    copy.product === spec.copy.product &&
    copy.tagline === spec.copy.tagline &&
    copy.volume === spec.copy.volume &&
    copy.ingredients === spec.copy.ingredients &&
    copy.warnings === spec.copy.warnings &&
    copy.barcode === spec.copy.barcode &&
    copy.manufacturer === spec.copy.manufacturer &&
    copy.address === spec.copy.address &&
    copy.cta === spec.copy.cta &&
    (copy.usage ?? '') === (spec.copy.usage ?? '')
  ) {
    return spec
  }
  const brief = briefFromCopy(spec, copy)
  const system = resolveDesignSystem(brief, spec.structureId, { blankCanvas: spec.overrides.blankCanvas })
  const planned = spec.designPlan ? applyPlanToSystem(system, spec.designPlan) : system
  const direction = lockedDirection(spec, copy)
  const identity = {
    logoHref: opts.logoHref,
    logoScale: spec.overrides.logoScale,
    titleScale: spec.overrides.titleScale,
  }

  let artwork = spec.artwork
  let studio = spec.studio
  if (direction) {
    const composed = composeStudioArtwork({
      brief,
      dieline: spec.dieline,
      copy,
      direction,
      system: planned,
      identity,
    })
    artwork = composed.artwork
    studio = spec.studio ? { ...composed.report, offer: spec.studio.offer } : composed.report
  } else {
    artwork = composeArtwork(
      brief,
      spec.dieline,
      copy,
      spec.palette,
      spec.overrides,
      opts.logoHref,
      planned,
      spec.designPlan,
    )
  }

  const draft = {
    brief,
    copy,
    dieline: spec.dieline,
    layout: spec.layout,
    overrides: spec.overrides,
    kind: spec.kind,
    structureId: spec.structureId,
    palette: spec.palette,
    artwork,
    designPlan: spec.designPlan,
  }
  const basePreflight = runPreflight(draft, planned)
  const preflight = studio ? applyStudioPreflight(basePreflight, studio) : basePreflight
  const generatedAt = Date.now()
  const document = documentFromArtwork(
    spec.id,
    `${copy.brand} · ${copy.product}`,
    spec.dieline,
    artwork,
    generatedAt,
  )
  const validation = validateDesignDocument(document)
  if (!validation.valid) return spec
  return {
    ...spec,
    brief,
    copy,
    artwork: artworkFromDocument(document),
    document,
    preflight,
    studio,
    generatedAt,
    revision: opts.bumpRevision ? spec.revision + 1 : spec.revision,
  }
}
