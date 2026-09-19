/**
 * Studio family key — one visual system shared by box and label.
 * Companion generate (“etiketi de üret”) pins the sibling archetype; it does not start a second motor.
 */
import type {
  BackgroundFamily,
  BoxArchetype,
  DirectionHints,
  LabelArchetype,
  StudioArchetype,
  StudioFamily,
  StudioSurface,
  StudioRepertoire,
} from './types'

export type FamilyPair = {
  box: BoxArchetype
  label: LabelArchetype
  background?: BackgroundFamily
}

export const STUDIO_FAMILIES: Record<StudioFamily, FamilyPair> = {
  marble: { box: 'marble-frame', label: 'marble-frame', background: 'marble' },
  botanical: { box: 'botanical-card', label: 'card-on-art', background: 'botanical' },
  'line-scene': { box: 'line-scene', label: 'line-scene', background: 'line-scene' },
  wave: { box: 'wave-panel', label: 'wave-panel', background: 'wave' },
  ink: { box: 'ink-wash', label: 'ink-panel', background: 'ink-wash' },
  'dark-luxe': { box: 'noir-stack', label: 'noir-plate' },
  tech: { box: 'diagonal-tech', label: 'diagonal-split', background: 'diagonal' },
  // The one family whose box and label are the same archetype: the composition is the subject
  // standing in the middle, and that reads the same on a carton front as on a jar wrap.
  specimen: { box: 'specimen-hero', label: 'specimen-hero', background: 'gradient-wash' },
  // Two more shared-archetype families, distilled from the STİCKERR REF perfume plates: a plate
  // of type in tiers (Diako) and a roundel on a flat geometric field (Azzurra) read the same on a
  // carton front as on a bottle label, so neither needs a box sibling.
  atelier: { box: 'atelier-plate', label: 'atelier-plate', background: 'paper' },
  crest: { box: 'crest-panel', label: 'crest-panel', background: 'arabesque' },
  /*
   * The reference repertoire (F-32). Each paints one front for both surfaces, the way `specimen`,
   * `atelier` and `crest` already do: these eight are arrangements of the whole face, and a face
   * is a face whether it is printed on a carton or wrapped round a jar.
   */
  arch: { box: 'arch-crown', label: 'arch-crown', background: 'paper' },
  collage: { box: 'collage-plate', label: 'collage-plate', background: 'paper' },
  silhouette: { box: 'silhouette-foot', label: 'silhouette-foot', background: 'paper' },
  ribbon: { box: 'ribbon-crest', label: 'ribbon-crest', background: 'arabesque' },
  grid: { box: 'grid-mono', label: 'grid-mono', background: 'paper' },
  pattern: { box: 'pattern-float', label: 'pattern-float', background: 'toile' },
  acid: { box: 'blob-acid', label: 'blob-acid', background: 'blob' },
  'inner-card': { box: 'inner-card', label: 'inner-card', background: 'paper' },
}

/**
 * The families of the second repertoire (F-32).
 *
 * A brief that pinned one of these is asking for that set, so the pool follows the pin even when
 * nothing set the flag — otherwise a pinned family that is not in the pool is dropped in silence
 * and the customer gets a design they did not choose.
 */
export const REFERENCE_FAMILIES: readonly StudioFamily[] = ['arch', 'collage', 'silhouette', 'ribbon', 'grid', 'pattern', 'acid', 'inner-card']

/** Which repertoire a family belongs to; undefined when the family is not one we know. */
export function familyRepertoire(family: StudioFamily | string | undefined | null): StudioRepertoire | undefined {
  if (!family || !isStudioFamily(family)) return undefined
  return REFERENCE_FAMILIES.includes(family) ? 'reference' : 'studio'
}

const ARCHETYPE_FAMILY: Partial<Record<StudioArchetype, StudioFamily>> = {
  'marble-frame': 'marble',
  'botanical-card': 'botanical',
  'card-on-art': 'botanical',
  'line-scene': 'line-scene',
  'wave-panel': 'wave',
  'ink-wash': 'ink',
  'ink-panel': 'ink',
  'noir-stack': 'dark-luxe',
  'noir-plate': 'dark-luxe',
  'diagonal-tech': 'tech',
  'diagonal-split': 'tech',
  'specimen-hero': 'specimen',
  'atelier-plate': 'atelier',
  'crest-panel': 'crest',
  'arch-crown': 'arch',
  'collage-plate': 'collage',
  'silhouette-foot': 'silhouette',
  'ribbon-crest': 'ribbon',
  'grid-mono': 'grid',
  'pattern-float': 'pattern',
  'blob-acid': 'acid',
  'inner-card': 'inner-card',
}

/**
 * Spoken family names — chat never dumps the internal key as if it were copy.
 *
 * `botanical` and `specimen` used to be "botanik" and "botanik çizim", which is one name and that
 * same name with a word after it. The owner read the strip and asked where their botanical had
 * gone while it was sitting two cards away: two systems that share a word do not read as two
 * choices. They are not variants of each other either — `botanical` is the woo.originals system, a
 * white title card on a tone-on-tone field with its own claim band and legal back, and `specimen`
 * is the drawn-subject illustrator. Each is now named after what it actually is.
 */
export const FAMILY_TALK: Record<StudioFamily, string> = {
  marble: 'mermer',
  botanical: 'botanik kart',
  'line-scene': 'çizgisel sahne',
  wave: 'dalga',
  ink: 'mürekkep',
  'dark-luxe': 'karanlık lüks',
  tech: 'teknik',
  specimen: 'illüstrasyon',
  atelier: 'atölye plakası',
  crest: 'arma',
  arch: 'kemer taç',
  collage: 'gravür kolaj',
  silhouette: 'düz silüet',
  ribbon: 'kurdele arma',
  grid: 'mono ızgara',
  pattern: 'desen zemin',
  acid: 'asit blob',
  'inner-card': 'iç sanat kartı',
}

export function familyTalk(family: StudioFamily | string | undefined | null): string {
  if (family && isStudioFamily(family)) return FAMILY_TALK[family]
  return 'bu yön'
}

export function isStudioFamily(value: unknown): value is StudioFamily {
  return typeof value === 'string' && value in STUDIO_FAMILIES
}

export function familyOf(archetype: StudioArchetype, fallback?: StudioFamily): StudioFamily | undefined {
  if (fallback && isStudioFamily(fallback)) {
    const pair = STUDIO_FAMILIES[fallback]
    if (pair.box === archetype || pair.label === archetype) return fallback
  }
  return ARCHETYPE_FAMILY[archetype]
}

export function archetypeForFamily(family: StudioFamily, surface: StudioSurface): StudioArchetype {
  return STUDIO_FAMILIES[family][surface]
}

/** Pin the sibling archetype for this surface. Last-merge wins in resolveDirection. */
export function hintsFromFamily(family: unknown, surface: StudioSurface): DirectionHints | null {
  if (!isStudioFamily(family)) return null
  const pair = STUDIO_FAMILIES[family]
  return {
    archetype: pair[surface],
    ...(pair.background ? { background: pair.background } : {}),
    source: 'family',
    pinSource: 'family',
    rationale: ['Aynı görsel aile — kutu ve etiket aynı DNA.'],
  }
}

export function archetypesOfFamilies(families: readonly StudioFamily[]): StudioArchetype[] {
  const out: StudioArchetype[] = []
  for (const family of families) {
    if (!isStudioFamily(family)) continue
    const pair = STUDIO_FAMILIES[family]
    out.push(pair.box, pair.label)
  }
  return [...new Set(out)]
}

/** User veto → closed-vocabulary avoid lists. Empty input is a no-op. */
export function hintsFromVeto(families: readonly StudioFamily[] | undefined): DirectionHints | null {
  if (!families?.length) return null
  const known = families.filter(isStudioFamily)
  if (!known.length) return null
  const backgrounds = known
    .map((family) => STUDIO_FAMILIES[family].background)
    .filter((row): row is BackgroundFamily => !!row)
  return {
    avoidArchetypes: archetypesOfFamilies(known),
    avoidBackgrounds: [...new Set(backgrounds)],
    source: 'user',
    rationale: [`Kullanıcı veto: ${known.join(', ')}.`],
  }
}

const FAMILY_ALIASES: [RegExp, StudioFamily][] = [
  [/\bmarble\b|mermer/i, 'marble'],
  // "botanik çizim" is the illustrator, "botanik kart" the card system. The two-word forms are
  // matched before the bare word so the older habit still lands where the customer means.
  [/botanik\s*[çc]izim|ill[üu]strasyon|\bspecimen\b|[çc]izili\s*[öo]zne/i, 'specimen'],
  [/\bbotanical\b|botanik|\byaprak\b/i, 'botanical'],
  [/line[\s-]?scene|klinik|çizgisel|line[\s-]?art/i, 'line-scene'],
  [/\bwave\b|\bdalga\b/i, 'wave'],
  [/\bink\b|mürekkep/i, 'ink'],
  [/dark[\s-]?luxe|koyu\s*lüks/i, 'dark-luxe'],
  [/\btech\b|teknik|diyagonal|diagonal|antrasit/i, 'tech'],
  [/at[öo]lye|atelier|\bplaka\b|\bplate\b/i, 'atelier'],
  [/\barma\b|\bcrest\b|arabesk|arabesque|roundel|madalyon/i, 'crest'],
]

/**
 * A family the customer asked for by name with an imperative close — "botanik olsun", "arma ekle",
 * "atölye plakası gibi olsun".
 *
 * The verb has to sit within two words of the family name. A sentence-final verb alone is not
 * enough: "mermer tezgah için kutu yap" names marble and ends in an imperative, and reading that
 * as "make it marble" is exactly the mistake a wider pattern makes — measured, an `(ekle|olsun|
 * yap|çiz)$` alternative matched three of four ordinary first briefs.
 */
export function familyCommandIn(text: string): StudioFamily | null {
  for (const [re, family] of FAMILY_ALIASES) {
    const m = re.exec(text)
    if (!m) continue
    const after = text.slice(m.index + m[0].length)
    if (/^(?:\s+\S+){0,2}\s*\b(ekle|olsun|yap|çiz|geç|dene)\b/i.test(after)) return family
  }
  return null
}

/** Closed family dictionary — several aliases per family, not a single hardcoded phrase. */
export function familiesFromUtterance(text: string): StudioFamily[] {
  const t = text.toLocaleLowerCase('tr')
  const out: StudioFamily[] = []
  for (const [re, family] of FAMILY_ALIASES) {
    if (re.test(t) && !out.includes(family)) out.push(family)
  }
  return out
}

export function applyVetoToHints(hints: DirectionHints, vetoed: readonly StudioFamily[] | undefined): DirectionHints {
  if (!vetoed?.length) return hints
  const avoid = archetypesOfFamilies(vetoed.filter(isStudioFamily))
  const next: DirectionHints = {
    ...hints,
    avoidArchetypes: [...new Set([...(hints.avoidArchetypes ?? []), ...avoid])],
  }
  if (next.archetype && avoid.includes(next.archetype)) {
    const { archetype: _drop, ...rest } = next
    return rest
  }
  return next
}
