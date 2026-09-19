/**
 * Craft scoring in the studio's own vocabulary.
 *
 * `scoreVisualCraft` was written for the kit painters and reads their markup: `data-pattern=`,
 * `data-hero="crest"`, `lockout-`, the names of the kit's fonts. The studio path paints most faces
 * and emits none of that, so — measured over the eighteen frozen faces before this module existed —
 * the score was answering questions the face never asked:
 *
 *   - **hero 28–92.** `data-art="hero"` appears on 7 of 18 faces. The other eleven — marble, noir,
 *     ink, diagonal, wave, atelier, crest, card — took the "hero required but missing" branch and
 *     scored 28, though a field-led archetype has no drawn subject *by design*. Nearly the whole
 *     spread of the total (57–76) came from this one kit-era assumption.
 *   - **typography 80–88, spread 8.** The display-font regex matched on every face, because the
 *     studio font stacks list `Garamond` and `Segoe UI` as *fallbacks*. Saturated by accident,
 *     so it ranked nothing.
 *   - **originality 60, spread 0.** A constant.
 *   - **geometry: coverage 0.01–0.05, dominant 0.01–0.02, font contrast 0–0.6.** The parser reads
 *     top-level elements, and a studio face is one wrapper `<g>` plus a `<style>`; the composition
 *     and hierarchy bonuses were computed over that.
 *
 * Meanwhile the studio carries a better source of truth than any regex: the ledger, which records
 * every placed box in millimetres with its kind and its type size, and the direction, which says
 * what was decided. So this module reads three things — the ledger for geometry, the markup for
 * *presence* (was the field, the frame, the subject actually painted), and the direction for
 * *intent* — and never a font name.
 *
 * Nothing here is a repair gate on its own. The F-8 floor still consults the weighted total, so
 * every dimension below is measured against the golden set in `measure-craft-distribution.ts`
 * and the floor test in `craftGate.test.ts` proves no frozen face is re-routed.
 */
import type { DesignBrief, DesignSpec, DielineModel } from '../../types'
import { COMPOSITION_AXES, fingerprintDistance, type Fingerprint } from '../studio/fingerprint'
import { dnaFor, type ArchetypeDna } from '../studio/referenceDna'
import { SIDE_LED_LOCKUPS, type PlacedBox, type StudioArchetype, type StudioPanelReport, type StudioReport } from '../studio/types'
import type { DesignPlan } from './DesignPlan'

export type StudioCraftSpec = Pick<DesignSpec, 'artwork' | 'copy'> & {
  studio?: StudioReport
  brief?: Pick<DesignBrief, 'colors'>
  dieline?: DielineModel
}

export type StudioCraftCtx = {
  face: string
  /** The side panels' markup, joined — where a carton role puts the lead element. */
  sides: string
  plan: DesignPlan
  copy: DesignSpec['copy']
  report: StudioReport
  archetype: StudioArchetype
  dna: ArchetypeDna
  panel: { w: number; h: number }
  /** The front panel's ledger report — collisions, overflow, and the placed boxes below. */
  front?: StudioPanelReport
  /** Every box the front's ledger placed, grounds excluded. */
  boxes: PlacedBox[]
  /** Text boxes with a measured size. */
  texts: PlacedBox[]
  colors: string
}

/** Lockups where the brand is the display line, so its size against the product is the hierarchy. */
const DISPLAY_LINE_LOCKUPS = new Set<string>(['stacked-center', 'band-split', 'rotated-brand', 'top-left-block', 'art-panel', 'flanked'])

/** Archetypes whose reason to exist is a drawn subject. Without it the face is not the design. */
const SUBJECT_LED = new Set<StudioArchetype>(['specimen-hero', 'line-scene'])
/** Archetypes led by a mark (the roundel) or by the type plate and its edge. */
const MARK_LED = new Set<StudioArchetype>(['crest-panel'])
const PLATE_LED = new Set<StudioArchetype>(['atelier-plate'])

const FACE_PANELS = new Set(['front', 'label', 'trayFront'])

function frontOf(spec: StudioCraftSpec): { markup: string; panelId: string } | null {
  const id = spec.artwork.frontPanelId
  const layer = spec.artwork.layers.find((l) => l.panelId === id) ?? spec.artwork.layers.find((l) => FACE_PANELS.has(l.panelId))
  return layer ? { markup: layer.markup, panelId: layer.panelId } : null
}

/** The studio context for a spec, or undefined when the face was not painted by the studio. */
export function studioCraftCtx(spec: StudioCraftSpec, plan: DesignPlan): StudioCraftCtx | undefined {
  const front = frontOf(spec)
  if (!front || !spec.studio || !/data-art="studio"/.test(front.markup)) return undefined
  const report = spec.studio
  const archetype = report.direction.archetype
  const dna = dnaFor(archetype, report.direction.surface)
  const panelReport = report.panels.find((p) => p.panelId === front.panelId)
  const placed = panelReport?.placed ?? []
  const dielinePanel = spec.dieline?.panels.find((p) => p.id === front.panelId)
  const boxes = placed.filter((b) => b.kind !== 'ground')
  const extent = boxes.reduce((m, b) => ({ w: Math.max(m.w, b.x + b.w), h: Math.max(m.h, b.y + b.h) }), { w: 0, h: 0 })
  return {
    face: front.markup,
    sides: spec.artwork.layers.filter((l) => /data-role="side"/.test(l.markup) || /data-role-side=/.test(l.markup)).map((l) => l.markup).join(''),
    plan,
    copy: spec.copy,
    report,
    archetype,
    dna,
    panel: dielinePanel ? { w: dielinePanel.w, h: dielinePanel.h } : { w: Math.max(1, extent.w), h: Math.max(1, extent.h) },
    front: panelReport,
    boxes,
    texts: placed.filter((b) => b.kind === 'text' && (b.sizeMm ?? 0) > 0),
    colors: (spec.brief?.colors ?? '').trim(),
  }
}

function baseId(box: PlacedBox): string {
  return box.id.split('#')[0] ?? box.id
}

function area(b: PlacedBox): number {
  return Math.max(0, b.w) * Math.max(0, b.h)
}

/** Largest element or container box as a share of the panel — the thing the eye lands on. */
function focalRatio(ctx: StudioCraftCtx): number {
  const panelArea = Math.max(1, ctx.panel.w * ctx.panel.h)
  let max = 0
  for (const b of ctx.boxes) {
    if (b.kind !== 'element' && b.kind !== 'container') continue
    max = Math.max(max, area(b) / panelArea)
  }
  return max
}

function hasOwnField(ctx: StudioCraftCtx, markup = ctx.face): boolean {
  const m = markup.match(/data-bg="([a-z-]+)"/g) ?? []
  const families = m.map((s) => s.replace(/data-bg="|"/g, ''))
  return families.some((f) => (ctx.dna.backgrounds as readonly string[]).includes(f))
}

/**
 * The lead element, by archetype.
 *
 * A subject-led face needs its drawn subject, a crest needs its mark, a plate needs its edge, and
 * everything else is led by the field it was named after. "Hero" here means "the thing this
 * archetype is *for* was actually painted" — not "a kit hero graphic is present".
 */
/**
 * The markup the lead element is read from. A carton role moves the lead to a side: the art panel
 * and the flanks carry the field and the subject, the front is deliberately quiet. Reading the
 * front alone there would score the design for lacking the very thing it put next door.
 */
function leadMarkup(ctx: StudioCraftCtx): string {
  return SIDE_LED_LOCKUPS.includes(ctx.report.direction.lockup) ? `${ctx.face}${ctx.sides}` : ctx.face
}

export function studioHero(ctx: StudioCraftCtx, notes: string[]): number {
  let hero: number
  const lead = leadMarkup(ctx)
  if (SUBJECT_LED.has(ctx.archetype)) {
    // The drawn subject itself (`data-hero`), or a field that is the subject (`data-art="hero"`).
    // Read off the marker alone, a specimen on a toile or a celestial field scored as if unpainted.
    if (/data-art="hero"|data-hero="/.test(lead)) hero = 84
    else {
      hero = 30
      notes.push('Özne çizilmedi — bu arketipin sebebi çizili özne')
    }
  } else if (MARK_LED.has(ctx.archetype)) {
    if (/data-art="brand-mark"|data-art="brand-logo"/.test(ctx.face)) hero = 80
    else {
      hero = 40
      notes.push('Madalyon / marka işareti yok')
    }
  } else if (PLATE_LED.has(ctx.archetype)) {
    if (/data-frame="/.test(ctx.face)) hero = 78
    else {
      hero = 44
      notes.push('Plaka kenarı çizilmedi')
    }
  } else if (hasOwnField(ctx, lead)) {
    hero = 80
  } else if (/data-bg="/.test(lead)) {
    hero = 66
    notes.push('Zemin arketipin kendi ailesinden değil')
  } else {
    hero = 40
    notes.push('Zemin yok — alan-öncülü arketip boş')
  }
  // A real focal beyond the field, in the band where it reads as one element and not the whole face.
  const focal = focalRatio(ctx)
  if (focal >= 0.06 && focal <= 0.55) hero += 6
  return Math.min(92, hero)
}

/** Area-weighted centre of mass and extents of the placed boxes, panel-relative. */
function massOf(ctx: StudioCraftCtx): { hx: number; vy: number; balance: number; vSpread: number; coverage: number; dominant: number } {
  const { w, h } = ctx.panel
  const panelArea = Math.max(1, w * h)
  let sum = 0
  let sx = 0
  let sy = 0
  let minY = Infinity
  let maxY = -Infinity
  let maxA = 0
  for (const b of ctx.boxes) {
    const a = area(b)
    sum += a
    sx += (b.x + b.w / 2) * a
    sy += (b.y + b.h / 2) * a
    minY = Math.min(minY, b.y)
    maxY = Math.max(maxY, b.y + b.h)
    maxA = Math.max(maxA, a)
  }
  if (!ctx.boxes.length || sum <= 0) return { hx: 0.5, vy: 0.5, balance: 0.5, vSpread: 0, coverage: 0, dominant: 0 }
  const hx = sx / sum / w
  const vy = sy / sum / h
  const balance = Math.max(0, 1 - (Math.abs(hx - 0.5) * 2 + Math.abs(vy - 0.5) * 2) / 2)
  return {
    hx,
    vy,
    balance,
    vSpread: Math.min(1, (maxY - minY) / h),
    coverage: Math.min(1, sum / panelArea),
    dominant: maxA / panelArea,
  }
}

export function studioComposition(ctx: StudioCraftCtx, notes: string[]): number {
  let score = 52
  const m = massOf(ctx)
  if (m.balance > 0.7) score += 6
  else if (m.balance > 0.5) score += 3
  if (m.vSpread > 0.55 && m.vSpread < 0.95) score += 4
  if (m.coverage > 0.12 && m.coverage < 0.6) score += 4
  if (m.dominant > 0.55) score -= 4
  /*
   * The arrangement that was decided is the one on the panel. A centred lockup should measure
   * centred; a column or a pill was asked for its asymmetry, so an off-centre mass is the design
   * working, not failing.
   */
  const lockup = ctx.report.direction.lockup
  const offCentre = Math.abs(m.hx - 0.5)
  if (lockup === 'stacked-center' ? offCentre <= 0.08 : offCentre > 0.06) score += 6
  const hits = (ctx.front?.collisions.length ?? 0) + (ctx.front?.outOfBounds.length ?? 0)
  if (hits) {
    score -= Math.min(18, hits * 6)
    notes.push(`Ön yüz ledger: ${hits} çarpışma/taşma`)
  }
  return score
}

/**
 * Brand over product is the owner's rule, and it is scored, not assumed: the ledger knows both
 * sizes in millimetres. A product set larger than its brand is the one hierarchy failure this
 * engine is never allowed to ship, so it costs more than everything else here adds.
 *
 * *How* the brand leads depends on the lockup. In a stacked lockup the brand is the display line
 * and size is the measure. In the pill, monogram and column lockups the brand leads as a *mark* —
 * measured on the frozen set, `diagonal-tech` carries a 4.5–8.4 mm monogram over a 2–3.4 mm brand
 * line and a 6–8 mm product title, `card-on-art` a 3.5 mm brand pill over a 9 mm title card. That
 * is the reference language the owner approved (Capelli, woo.originals), so on those lockups the
 * size rule does not apply; the mark does the leading.
 */
export function studioHierarchy(ctx: StudioCraftCtx, notes: string[]): number {
  let score = 55
  const brand = ctx.texts.find((b) => baseId(b) === 'brand')
  const product = ctx.texts.find((b) => baseId(b) === 'product')
  if (brand) score += 12
  else notes.push('Marka metni ledger’da yok')
  if (product) score += 10
  else if (!ctx.copy.product.trim()) score += 6
  const brandIsDisplayLine = DISPLAY_LINE_LOCKUPS.has(ctx.report.direction.lockup)
  if (brand && product && brand.sizeMm && product.sizeMm) {
    const ratio = brand.sizeMm / product.sizeMm
    if (!brandIsDisplayLine) {
      // The mark leads; a product title larger than the brand line is the design, not a fault.
      score += 4
    } else if (ratio >= 1.3) score += 8
    else if (ratio >= 1.1) score += 4
    else if (ratio < 1) {
      score -= 15
      notes.push('Ürün adı markadan büyük — hiyerarşi kuralı ihlali')
    }
  }
  const tiers = new Set(ctx.texts.map((b) => Math.round((b.sizeMm ?? 0) * 2) / 2)).size
  if (tiers > 0 && tiers <= 4) score += 4
  else if (tiers > 6) score -= 4
  if (ctx.texts.length > 12) score -= 4
  return score
}

const FAMILY_RE = /font-family="'([^']+)'/g

export function studioTypography(ctx: StudioCraftCtx, notes: string[]): number {
  let score = 54
  const families = new Set<string>()
  for (const m of ctx.face.matchAll(FAMILY_RE)) families.add(m[1]!)
  if (families.size >= 3) score += 12
  else if (families.size === 2) score += 8
  const weights = (ctx.face.match(/font-weight="(\d+)"/g) ?? []).map((m) => Number(m.match(/\d+/)?.[0] ?? 0))
  if (new Set(weights).size >= 2) {
    score += 6
    const contrast = Math.max(...weights) - Math.min(...weights)
    if (contrast >= 200) score += 4
    else if (contrast >= 100) score += 2
  }
  if (/letter-spacing="/.test(ctx.face)) score += 6
  const min = ctx.report.minTextMm
  if (min >= 1.5) score += 6
  else if (min > 0) {
    score -= 8
    notes.push(`En küçük metin ${min.toFixed(2)} mm — baskı tabanının altında`)
  }
  const sizes = ctx.texts.map((b) => b.sizeMm ?? 0).filter((s) => s > 0)
  if (sizes.length >= 2 && Math.max(...sizes) / Math.min(...sizes) >= 2.5) score += 6
  if (ctx.plan.typography.trackingIntent === 'wide' && ctx.plan.style === 'luxury') score += 4
  return score
}

export function studioDecoration(ctx: StudioCraftCtx, notes: string[]): number {
  let score = 50
  if (/data-bg="/.test(ctx.face)) score += 10
  const frame = ctx.report.direction.frame
  if (frame === 'none') score += 3
  else if (/data-frame="/.test(ctx.face)) score += 6
  else {
    score -= 6
    notes.push(`Çerçeve ${frame} seçildi, çizilmedi`)
  }
  const layers = (ctx.face.match(/(?:fill|stroke)-opacity="0\.(0[4-9]|1[0-2])"/g) ?? []).length
  if (layers >= 3) score += 6
  else if (layers >= 1) score += 3
  /*
   * Negative space is luxury, and minimal means it. `rich` on either is decoration arguing with
   * the mood the customer chose; `quiet` on a playful face is the opposite argument.
   */
  const ornament = ctx.report.direction.ornament
  const style = ctx.plan.style
  if ((style === 'luxury' || style === 'minimal') && ornament === 'rich') {
    score -= 8
    notes.push(`${style} + zengin süs — boşluk ilkesine aykırı`)
  } else if (style === 'minimal' && ornament === 'quiet') score += 6
  else if (style === 'luxury' && ornament === 'quiet') score += 4
  else if (style === 'playful' && ornament === 'quiet') score -= 3
  else score += 2
  const pieces = ctx.boxes.filter((b) => b.kind === 'element' || b.kind === 'container').length
  if (pieces >= 1 && pieces <= 5) score += 4
  else if (pieces > 8) {
    score -= 6
    notes.push(`${pieces} rozet/kart/işaret — kalabalık`)
  }
  return score
}

/**
 * How much of this face is *this brief's*. A face in the brand's own colours, carrying the
 * customer's own line, on axes the archetype did not default to, is further from the catalogue
 * than the same skeleton in sector colours with the bank's tagline.
 */
export function studioOriginality(ctx: StudioCraftCtx): number {
  let score = 48
  if (ctx.colors) score += 10
  const d = ctx.report.direction
  if (d.copySource === 'user') score += 10
  else if (d.copySource === 'brief') score += 6
  if (d.typePairing !== ctx.dna.typePairings[0]) score += 5
  if (d.frame !== ctx.dna.frames[0]) score += 4
  if (d.ornament !== ctx.dna.ornaments[0]) score += 3
  if (d.background !== ctx.dna.backgrounds[0]) score += 4
  if (d.variant !== 0) score += 5
  if ((ctx.face.match(/font-weight="(\d+)"/g) ?? []).length >= 2) score += 4
  return score
}

/** Where the eye lands, 0–100. Field-led faces are carried by their field; subject-led ones by the subject. */
export function studioFocal(ctx: StudioCraftCtx): number {
  const r = focalRatio(ctx)
  if (SUBJECT_LED.has(ctx.archetype) && !/data-art="hero"|data-hero="/.test(leadMarkup(ctx))) return 25
  if (r >= 0.06 && r <= 0.55) return 85
  if (r > 0.6) return 40
  if (r > 0) return 45
  return hasOwnField(ctx) ? 60 : 35
}

/** The archetype's own opinion of the sector it landed on, from its DNA. */
export function studioCategoryFit(ctx: StudioCraftCtx): number {
  return Math.round((ctx.dna.sectors[ctx.plan.sector] ?? 0.2) * 100)
}

/**
 * Mean composition distance from the painted candidate to the others it was offered beside,
 * as a share of the composition axes. Absent when there was no offer. This is the number the
 * Phase 0 instruments established at ~13 and Phase 3 is meant to move.
 */
export function studioDistinctiveness(report: StudioReport): number | undefined {
  const rows = report.offer?.candidates ?? []
  const selected = rows.find((r) => r.selected)?.fingerprint
  if (!selected) return undefined
  const others = rows.filter((r) => !r.selected && r.fingerprint).map((r) => r.fingerprint as Fingerprint)
  if (!others.length) return undefined
  const total = others.reduce((acc, f) => acc + fingerprintDistance(selected, f, COMPOSITION_AXES), 0)
  return Math.round((total / others.length / COMPOSITION_AXES.length) * 100)
}
