/**
 * Brand personality — what the customer told us about who they are, as five numbers.
 *
 * The creative-brain audit measured the one thing the ranking could not see: two briefs identical
 * except for the brand — a restrained boutique house for corporate buyers against a loud
 * mass-market label for eighteen-year-olds — landed on the same archetype in 107 of 108
 * sector/mood pairs, the same lockup in 107, and differed only in ornament, because price tier
 * and feeling reached the ornament level and nothing else. `scoreArchetype` read the sector, the
 * mood, the face aspect and the product words; it read nothing about the brand.
 *
 * This module turns the brief's own words into a vector the ranking can use. Five axes, each in
 * [−1, 1], each with a plain meaning a designer would recognise:
 *
 *   - `restraint`    quiet, refined, editorial ↔ loud, bold, maximal
 *   - `warmth`       clinical, cool, sterile ↔ warm, natural, handmade
 *   - `energy`       still, mature, serene ↔ lively, young, playful
 *   - `heritage`     contemporary, next-gen ↔ traditional, classic, timeless
 *   - `technicality` organic, botanical ↔ technical, scientific, engineered
 *
 * Two rules keep it honest. **Only explicit signals count**: feeling, audience, channel, price
 * tier, what to avoid, the story. The brand *name* is not read — a name is not a personality, and
 * guessing one from it is the kind of cleverness that misfiles a brand — and the mood is not read
 * either, because `styleFit` already scores it. **Nothing said, nothing scored**: a brief that gave
 * none of these is neutral, its strength is zero, and every term built on it is zero — which is
 * what keeps the eighteen frozen faces, whose briefs carry none of these fields, exactly where
 * they are. Every contribution records the field and the words it came from, so the "why" answer
 * can quote the customer back to themselves.
 */
import type { DesignBrief } from '../../types'
import type { LockupStyle, TypePairing } from './types'
import type { HeroStyle } from './species'

export const PERSONALITY_AXES = ['restraint', 'warmth', 'energy', 'heritage', 'technicality'] as const
export type PersonalityAxis = (typeof PERSONALITY_AXES)[number]
export type PersonalityVector = Record<PersonalityAxis, number>
export type PersonalityProfile = Partial<PersonalityVector>

export type PersonalityField = 'feeling' | 'audience' | 'channel' | 'priceTier' | 'avoidLike' | 'story'

export type PersonalityEvidence = {
  field: PersonalityField
  /** The words that matched, as the customer wrote them. */
  words: string[]
  delta: PersonalityProfile
}

export type BrandPersonality = {
  axes: PersonalityVector
  /** Mean absolute value over the five axes: 0 when the brief said nothing about itself. */
  strength: number
  evidence: PersonalityEvidence[]
}

const ZERO: PersonalityVector = { restraint: 0, warmth: 0, energy: 0, heritage: 0, technicality: 0 }

/**
 * Words and what they say. Turkish first, English beside it; matched case-insensitively against
 * the customer's own text. A word may speak to two axes — "klinik" is cold *and* technical.
 */
const LEXICON: { re: RegExp; delta: PersonalityProfile }[] = [
  { re: /\b(sakin|dingin|sessiz|huzur\w*|ağırbaşlı|calm|serene|quiet)\b/i, delta: { restraint: 0.6, energy: -0.3 } },
  { re: /\b(zarif|rafine|sade|minimal\w*|editorial|kontrollü|understated|elegant|refined)\b/i, delta: { restraint: 0.6 } },
  { re: /\b(gösterişli|şaşaalı|cesur|çarpıcı|iddialı|maksimal\w*|bold|loud|flashy|dramatic)\b/i, delta: { restraint: -0.7 } },
  { re: /\b(sıcak|samimi|sevecen|yumuşak|ev yapımı|el yapımı|artisan\w*|warm|cozy|handmade|friendly)\b/i, delta: { warmth: 0.6 } },
  { re: /\b(doğal|organik|bitkisel|botanik\w*|toprak|natural|organic|botanical|herbal|earthy)\b/i, delta: { warmth: 0.4, technicality: -0.5 } },
  { re: /\b(klinik|steril|soğuk|mesafeli|laboratuvar|clinical|sterile|cold)\b/i, delta: { warmth: -0.6, technicality: 0.5 } },
  { re: /\b(enerjik|canlı|dinamik|eğlenceli|neşeli|hareketli|oyuncu|energetic|lively|vibrant|playful|fun)\b/i, delta: { energy: 0.7 } },
  { re: /\b(genç|gençlik|z kuşağı|young|youthful)\b/i, delta: { energy: 0.5, heritage: -0.4 } },
  { re: /\b(olgun|durgun|ağır|mature|slow)\b/i, delta: { energy: -0.5 } },
  { re: /\b(geleneksel|miras|köklü|nostaljik|vintage|retro|zamansız|usta|atölye|heritage|traditional|timeless|classic)\b|\b1[89]\d\d\b/i, delta: { heritage: 0.7 } },
  { re: /\b(klasik)\b/i, delta: { heritage: 0.5, restraint: 0.2 } },
  { re: /\b(çağdaş|modern|yeni nesil|fütürist\w*|güncel|contemporary|futuristic|next[- ]gen|startup)\b/i, delta: { heritage: -0.6 } },
  { re: /\b(teknik|bilimsel|performans|mühendislik|formül\w*|dermatolog\w*|hassas|profesyonel|technical|scientific|engineered|precision|pro-grade)\b/i, delta: { technicality: 0.6 } },
  { re: /\b(lüks|luxury|premium)\b/i, delta: { restraint: 0.3, heritage: 0.2 } },
]

/** Who is buying, read from the audience line. */
const AUDIENCE: { re: RegExp; delta: PersonalityProfile }[] = [
  { re: /\b(1[3-9]|2[0-9])\s*[-–]\s*\d{1,2}\b|\b(genç\w*|öğrenci\w*|z kuşağı|gen ?z|teen\w*|students?)\b/i, delta: { energy: 0.6, heritage: -0.4 } },
  { re: /\b([4-6]\d\s*\+|[4-6]\d\s*yaş\s*üst\w*|olgun|yönetici\w*|kurumsal|executive\w*|corporate)\b/i, delta: { restraint: 0.4, heritage: 0.3, energy: -0.3 } },
  { re: /\b(anne\w*|bebek\w*|çocuk\w*|aile\w*|mother\w*|parents?|kids?|babies|baby)\b/i, delta: { warmth: 0.5, energy: 0.2 } },
  { re: /\b(uzman\w*|dermatolog\w*|hekim\w*|eczacı\w*|doktor\w*|klinik\w*|professionals?|clinics?|dermatologists?)\b/i, delta: { technicality: 0.5, restraint: 0.2 } },
]

/** Where it sells. */
const CHANNEL: { re: RegExp; delta: PersonalityProfile }[] = [
  { re: /\b(butik\w*|concept ?store|atölye\w*|galeri\w*|boutique\w*)\b/i, delta: { restraint: 0.4, heritage: 0.2 } },
  { re: /\b(online|e-?ticaret|instagram|sosyal medya|trendyol|amazon|web|dijital|social)\b/i, delta: { energy: 0.3, heritage: -0.3 } },
  { re: /\b(eczane\w*|klinik\w*|pharmac\w*|clinic\w*)\b/i, delta: { technicality: 0.4, restraint: 0.2 } },
  { re: /\b(market\w*|zincir\w*|süpermarket\w*|toptan|hipermarket\w*|supermarket\w*|retail chain)\b/i, delta: { restraint: -0.3, energy: 0.2 } },
  { re: /\b(gurme|şarküteri|delikatesen|delicatessen|gourmet|kafe|cafe|restoran\w*)\b/i, delta: { heritage: 0.3, warmth: 0.3 } },
]

const PRICE: Record<NonNullable<DesignBrief['priceTier']>, PersonalityProfile> = {
  boutique: { restraint: 0.5, heritage: 0.2 },
  premium: { restraint: 0.3 },
  mid: {},
  mass: { restraint: -0.4, energy: 0.3 },
}

function scan(text: string, table: { re: RegExp; delta: PersonalityProfile }[], scale: number): { delta: PersonalityProfile; words: string[] } {
  const delta: PersonalityProfile = {}
  const words: string[] = []
  for (const row of table) {
    const m = row.re.exec(text)
    if (!m) continue
    words.push(m[0])
    for (const [axis, v] of Object.entries(row.delta) as [PersonalityAxis, number][]) delta[axis] = (delta[axis] ?? 0) + v * scale
  }
  return { delta, words }
}

function add(into: PersonalityVector, delta: PersonalityProfile): void {
  for (const [axis, v] of Object.entries(delta) as [PersonalityAxis, number][]) into[axis] += v
}

function negate(delta: PersonalityProfile): PersonalityProfile {
  const out: PersonalityProfile = {}
  for (const [axis, v] of Object.entries(delta) as [PersonalityAxis, number][]) out[axis] = -v
  return out
}

const clamp = (n: number) => Math.max(-1, Math.min(1, n))

export function brandPersonality(
  brief: Pick<DesignBrief, 'feeling' | 'audience' | 'channel' | 'priceTier' | 'avoidLike' | 'story'>,
): BrandPersonality {
  const axes: PersonalityVector = { ...ZERO }
  const evidence: PersonalityEvidence[] = []
  const take = (field: PersonalityField, text: string | undefined, table: typeof LEXICON, scale: number, flip = false) => {
    if (!text?.trim()) return
    const { delta, words } = scan(text, table, scale)
    if (!words.length) return
    const signed = flip ? negate(delta) : delta
    add(axes, signed)
    evidence.push({ field, words, delta: signed })
  }
  // The feeling is the customer describing the design they want; it is the strongest signal.
  take('feeling', brief.feeling, LEXICON, 1)
  // "X gibi olmasın" — the same words, the opposite direction.
  take('avoidLike', brief.avoidLike, LEXICON, 1, true)
  take('audience', brief.audience, AUDIENCE, 1)
  take('audience', brief.audience, LEXICON, 0.5)
  take('channel', brief.channel, CHANNEL, 1)
  take('story', brief.story, LEXICON, 0.4)
  if (brief.priceTier && PRICE[brief.priceTier] && Object.keys(PRICE[brief.priceTier]).length) {
    add(axes, PRICE[brief.priceTier])
    evidence.push({ field: 'priceTier', words: [brief.priceTier], delta: PRICE[brief.priceTier] })
  }
  for (const axis of PERSONALITY_AXES) axes[axis] = clamp(axes[axis])
  const strength = PERSONALITY_AXES.reduce((sum, axis) => sum + Math.abs(axes[axis]), 0) / PERSONALITY_AXES.length
  return { axes, strength, evidence }
}

/**
 * How well a profile answers a personality, in [−1, 1]. Zero for a neutral brief by construction:
 * the sum is normalised by the brief's own magnitude, so nothing said means nothing scored.
 */
export function personalityFit(p: BrandPersonality, profile: PersonalityProfile): number {
  let dot = 0
  let mag = 0
  for (const axis of PERSONALITY_AXES) {
    const b = p.axes[axis]
    if (b === 0) continue
    mag += Math.abs(b)
    dot += b * (profile[axis] ?? 0)
  }
  return mag > 0 ? dot / mag : 0
}

/** The entry of a preference list that answers the personality best; ties keep list order. */
export function bestByPersonality<T extends string>(list: readonly T[], table: Partial<Record<T, PersonalityProfile>>, p: BrandPersonality): T {
  let best = list[0]!
  let bestFit = -Infinity
  for (const item of list) {
    const fit = personalityFit(p, table[item] ?? {})
    if (fit > bestFit + 1e-9) {
      best = item
      bestFit = fit
    }
  }
  return best
}

/** What each arrangement says about a brand. */
export const LOCKUP_PERSONALITY: Record<LockupStyle, PersonalityProfile> = {
  'stacked-center': { restraint: 0.3, heritage: 0.3 },
  'top-right-pill': { energy: 0.4, warmth: 0.3, heritage: -0.3 },
  'left-column': { technicality: 0.5, heritage: -0.4 },
  'monogram-right': { restraint: 0.2, technicality: 0.3 },
  'band-split': { warmth: 0.3, energy: 0.2, heritage: -0.1 },
  'rotated-brand': { energy: 0.4, heritage: -0.4, restraint: -0.2 },
  'top-left-block': { technicality: 0.4, energy: 0.3, heritage: -0.4 },
  'art-panel': { restraint: 0.5, warmth: 0.4 },
  flanked: { heritage: 0.5, restraint: 0.15, energy: -0.25 },
}

/** What each type pairing says. */
/**
 * How a drawn subject is rendered for this brand, where the brief said who the brand is (Phase 5).
 * A heritage brand gets the engraving, a warm and lively one the cut paper, a technical and
 * restrained one the silhouette; a brief that said nothing leaves the illustrator's own seed rule
 * in charge, which is what the frozen faces were painted with.
 */
export function subjectStyleFor(p: BrandPersonality): HeroStyle | undefined {
  if (p.strength < 0.25) return undefined
  const a = p.axes
  if (a.heritage >= 0.4 && a.energy <= 0.1) return 'engraved'
  if (a.warmth >= 0.3 && a.energy >= 0.2) return 'cut-paper'
  if (a.technicality >= 0.3 && a.restraint >= 0.2) return 'silhouette'
  return undefined
}

export const TYPE_PERSONALITY: Record<TypePairing, PersonalityProfile> = {
  'serif-display/sans-meta': { restraint: 0.3, heritage: 0.3 },
  'script-accent/sans-heavy': { warmth: 0.5, energy: 0.3, heritage: 0.1 },
  'sans-light/sans-heavy': { technicality: 0.5, heritage: -0.4, restraint: 0.1 },
  'spaced-serif/spaced-sans': { restraint: 0.6, heritage: 0.4, energy: -0.3 },
  // Phase 4 — read off the references each system was distilled from (`typeSystem.ts`).
  'condensed-serif/mono': { restraint: 0.3, heritage: 0.2, technicality: 0.3, energy: -0.1 },
  'condensed-grotesk/sans-light': { energy: 0.5, technicality: 0.4, heritage: -0.4, restraint: -0.1 },
  'rounded/sans': { warmth: 0.5, energy: 0.5, heritage: -0.2, restraint: -0.4 },
  'display-serif-oversized/sans-meta': { restraint: 0.4, heritage: 0.5, energy: -0.2, technicality: -0.2 },
  'heavy-grotesk-block/sans': { energy: 0.6, technicality: 0.3, restraint: -0.3, heritage: -0.5 },
  'light-geometric/wide': { restraint: 0.5, technicality: 0.3, warmth: 0.1, energy: -0.2 },
}

/** A short Turkish reading of the evidence, for the "why" answer. */
export function personalityTalk(p: BrandPersonality): string {
  const parts: string[] = []
  const byField = new Map<PersonalityField, string[]>()
  for (const row of p.evidence) byField.set(row.field, [...(byField.get(row.field) ?? []), ...row.words])
  const name: Record<PersonalityField, string> = {
    feeling: 'istediğin his',
    audience: 'hedef kitlen',
    channel: 'satış kanalın',
    priceTier: 'fiyat katmanın',
    avoidLike: 'istemediğin',
    story: 'hikâyen',
  }
  for (const [field, words] of byField) parts.push(`${name[field]} (${[...new Set(words)].slice(0, 3).join(', ')})`)
  return parts.join(', ')
}
