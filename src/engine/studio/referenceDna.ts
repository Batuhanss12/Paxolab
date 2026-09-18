/**
 * Reference DNA — the TASARIM REF folder encoded as structured archetypes.
 *
 * Each archetype records what made the reference work (background family, type pairing, frame,
 * lockup, temperament) and where it fits (sector / style / aspect). The direction resolver scores
 * these; the painters read them. Adding a reference = adding a record here + a layout, never a prompt.
 */
import type { StyleType } from '../../types'
import type { SectorId } from '../designSystem/types'
import type {
  BackgroundFamily,
  BoxArchetype,
  FrameStyle,
  LabelArchetype,
  LockupStyle,
  OrnamentLevel,
  StudioArchetype,
  StudioSurface,
  Temperament,
  TypePairing,
} from './types'

export type ArchetypeDna = {
  id: StudioArchetype
  surface: StudioSurface
  /** Reference it was distilled from (for the process note). */
  reference: string
  backgrounds: BackgroundFamily[]
  /**
   * Preferences, first entry the default. These used to be single values, which made typography
   * and frame properties *of* the archetype rather than decisions about it: every marble face wore
   * the same pairing and the same brackets forever. Listing them lets the variation walk, a hint
   * from the brain or the art director, or a word from the customer choose — while variation 0
   * still takes the first entry, so the frozen faces do not move.
   */
  typePairings: TypePairing[]
  temperaments: Temperament[]
  frames: FrameStyle[]
  ornaments: OrnamentLevel[]
  /** The composition's skeleton. Not a preference list on purpose — a lockup is what the painter *is*. */
  lockup: LockupStyle
  /** 0–1 fit per sector; missing = 0.2. */
  sectors: Partial<Record<SectorId, number>>
  /** 0–1 fit per style; missing = 0.3. */
  styles: Partial<Record<StyleType, number>>
  /** Preferred face aspect (h / w). */
  aspect: 'portrait' | 'landscape' | 'any'
  /** Anatomy the layout paints, in reading order (for the process note + tests). */
  anatomy: string[]
  summaryTr: string
}

export const LABEL_DNA: Record<LabelArchetype, ArchetypeDna> = {
  'card-on-art': {
    id: 'card-on-art',
    surface: 'label',
    reference: 'woo.originals — Restorative Shampoo / Care Cream',
    // `gradient-wash` is appended, never placed first: variation 0 is what the golden set captures,
    // so a new background joins the rotation without moving a single frozen face.
    backgrounds: ['botanical', 'wave', 'gradient-wash'],
    typePairings: ['script-accent/sans-heavy'],
    temperaments: ['vivid-mono'],
    frames: ['rounded-card'],
    ornaments: ['measured', 'quiet', 'rich'],
    lockup: 'top-right-pill',
    sectors: { cream: 1, serum: 0.25, baby: 0.25, cleaning: 0.2, health: 0.4, food: 0.3, beverage: 0.3, generic: 0.5 },
    styles: { playful: 1, modern: 0.9, eco: 0.7, minimal: 0.4, luxury: 0.3, classic: 0.2 },
    aspect: 'any',
    anatomy: ['tone-on-tone botanical', 'brand pill', 'legal column', 'title card', 'claim band', 'benefit line', 'pictogram row', 'net quantity'],
    summaryTr: 'Tek renk tonunda botanik zemin, beyaz başlık kartı, koyu iddia bandı, sol legal kolon.',
  },
  /**
   * The dark-luxe family's label. Added because that family had no label of its own: it shared
   * `ink-panel` with `ink`, and since the offer de-duplicates by family the customer could pick
   * "karanlık lüks" for a carton and never find it again on the bottle.
   */
  'noir-plate': {
    id: 'noir-plate',
    surface: 'label',
    reference: 'GUESS Sauvage carton, read onto a bottle label',
    backgrounds: ['arabesque', 'marble', 'gradient-wash'],
    typePairings: ['serif-display/sans-meta', 'spaced-serif/spaced-sans'],
    temperaments: ['dark-luxe'],
    frames: ['none', 'band-hairline'],
    ornaments: ['measured', 'rich', 'quiet'],
    lockup: 'stacked-center',
    /*
     * Tighter than its carton sibling on purpose. Written with the carton's numbers it took the
     * cream label off `card-on-art` and the electronics label off `diagonal-split` — a new
     * archetype should fill a gap, not annex its neighbours. It is the dark perfume language and
     * almost nothing else; `electronics` is absent rather than low, which floors it at 0.2.
     */
    sectors: { perfume: 1, beverage: 0.55, serum: 0.4, cream: 0.25, generic: 0.3 },
    styles: { luxury: 1, classic: 0.6, modern: 0.35, minimal: 0.3, eco: 0.1, playful: 0.1 },
    aspect: 'portrait',
    anatomy: ['deep gilded field', 'brand lockup', 'product name', 'category line', 'tagline', 'net quantity', 'edition line'],
    summaryTr: 'Siyah + altın; derin yaldızlı zemin, ortada dikey kilit, ayağın üstünde slogan.',
  },
  'marble-frame': {
    id: 'marble-frame',
    surface: 'label',
    reference: 'Elite Brew — Mocha Frappe / Cold Brew / Iced Espresso',
    backgrounds: ['marble'],
    typePairings: ['script-accent/sans-heavy', 'spaced-serif/spaced-sans'],
    temperaments: ['light-luxe', 'dark-luxe'],
    frames: ['corner-brackets'],
    ornaments: ['measured', 'rich', 'quiet'],
    lockup: 'stacked-center',
    sectors: { beverage: 1, food: 0.8, perfume: 0.6, cream: 0.25, serum: 0.25, generic: 0.6 },
    styles: { luxury: 1, classic: 0.8, modern: 0.6, minimal: 0.5, eco: 0.2, playful: 0.2 },
    aspect: 'portrait',
    anatomy: ['marble field', 'brand mark', 'corner brackets', 'brand lockup', 'script prefix', 'product name', 'net quantity'],
    summaryTr: 'Mermer doku, köşe parantezli marka kilidi, altta el yazısı ön ek + kalın ürün adı.',
  },
  'diagonal-split': {
    id: 'diagonal-split',
    surface: 'label',
    reference: 'Capelli Fellici — Purifying Shampoo / Brazilian Keratin',
    backgrounds: ['diagonal'],
    typePairings: ['sans-light/sans-heavy'],
    temperaments: ['dark-luxe', 'tech-dark'],
    frames: ['none'],
    ornaments: ['measured', 'quiet'],
    lockup: 'monogram-right',
    sectors: { cream: 1, serum: 0.8, electronics: 0.7, cleaning: 0.5, perfume: 0.5, health: 0.4, generic: 0.5 },
    styles: { luxury: 0.9, modern: 1, minimal: 0.6, classic: 0.4, playful: 0.2, eco: 0.1 },
    aspect: 'landscape',
    anatomy: ['diagonal metallic blocks', 'left title column', 'step chip', 'legal column', 'monogram', 'centered title', 'quality badge', 'net quantity'],
    summaryTr: 'Koyu zemin üstünde diyagonal metalik bloklar; solda ürün + legal kolon, sağda monogram ve merkez başlık.',
  },
  'line-scene': {
    id: 'line-scene',
    surface: 'label',
    reference: 'DNA Pharma — Sea Protection',
    backgrounds: ['line-scene'],
    typePairings: ['sans-light/sans-heavy', 'spaced-serif/spaced-sans'],
    temperaments: ['clean-clinical', 'vivid-mono'],
    frames: ['rounded-card'],
    ornaments: ['measured', 'quiet'],
    lockup: 'stacked-center',
    sectors: { health: 1, baby: 1, serum: 1, cream: 0.35, cleaning: 0.2, generic: 0.5 },
    styles: { minimal: 1, playful: 0.8, modern: 0.8, eco: 0.5, classic: 0.3, luxury: 0.2 },
    aspect: 'portrait',
    anatomy: ['brand mark', 'two-tone title', 'spaced subtitle', 'line-drawn scene', 'net quantity'],
    summaryTr: 'Beyaz zemin, iki tonlu başlık, alt yarıda tek renk çizgi illüstrasyon.',
  },
  'ink-panel': {
    id: 'ink-panel',
    surface: 'label',
    reference: 'Rebull Noir — Eau de Parfum',
    backgrounds: ['ink-wash'],
    typePairings: ['spaced-serif/spaced-sans', 'serif-display/sans-meta'],
    temperaments: ['light-luxe', 'dark-luxe'],
    frames: ['thin-double', 'band-hairline', 'fleuron-crown'],
    ornaments: ['measured', 'quiet', 'rich'],
    lockup: 'stacked-center',
    sectors: { perfume: 1, serum: 0.7, cream: 0.6, beverage: 0.5, generic: 0.5 },
    styles: { luxury: 1, classic: 0.7, minimal: 0.6, modern: 0.5, eco: 0.2, playful: 0.1 },
    aspect: 'portrait',
    anatomy: ['ink wash', 'metallic veins', 'thin frame', 'brand lockup', 'product name', 'category line', 'stacked tagline', 'net quantity'],
    summaryTr: 'Krem panel, köşeden yükselen mürekkep akışı ve metalik damarlar; aralıklı serif marka.',
  },
  'wave-panel': {
    id: 'wave-panel',
    surface: 'label',
    reference: 'FERAH / surface-care wave system',
    // Not `gradient-wash`: `paintWavePanelFace` hardcodes its own background, so listing one here
    // would change the reported direction without changing the painted face.
    backgrounds: ['wave'],
    typePairings: ['sans-light/sans-heavy'],
    temperaments: ['clean-clinical', 'vivid-mono', 'natural-warm'],
    frames: ['none'],
    ornaments: ['measured', 'quiet'],
    lockup: 'stacked-center',
    sectors: { cleaning: 1, cream: 0.35, baby: 0.3, generic: 0.4 },
    styles: { eco: 1, modern: 0.8, minimal: 0.8, playful: 0.4, luxury: 0.2, classic: 0.2 },
    aspect: 'any',
    anatomy: ['wave bands', 'brand lockup', 'category line', 'product stack', 'net quantity'],
    summaryTr: 'Yatay dalga bantları, istif sans marka, altta ürün ve net miktar.',
  },
  'specimen-hero': {
    id: 'specimen-hero',
    surface: 'label',
    // Not distilled from the TASARIM REF pack like its siblings: the repertoire had no archetype
    // where a *drawn subject* is the reason the face exists — every background was a texture.
    // The geometry was learned from public-domain botanical plates; none of them ships.
    reference: 'botanical specimen plates (public domain) — subject-led label',
    backgrounds: ['gradient-wash', 'paper', 'botanical'],
    typePairings: ['spaced-serif/spaced-sans', 'serif-display/sans-meta', 'script-accent/sans-heavy'],
    temperaments: ['light-luxe', 'natural-warm', 'clean-clinical', 'vivid-mono'],
    frames: ['thin-double', 'band-hairline', 'fleuron-crown', 'none'],
    ornaments: ['measured', 'quiet', 'rich'],
    lockup: 'stacked-center',
    sectors: { food: 0.9, beverage: 0.85, cream: 0.5, baby: 0.4, health: 0.3, serum: 0.22, generic: 0.45 },
    styles: { eco: 1, classic: 0.85, luxury: 0.6, minimal: 0.5, playful: 0.4, modern: 0.3 },
    aspect: 'portrait',
    anatomy: ['thin double frame', 'brand lockup', 'category line', 'drawn specimen', 'product stack', 'net quantity'],
    summaryTr: 'Ortada çizilmiş bitki/meyve, üstte aralıklı marka, altta ürün adı; ince çift çerçeve.',
  },
  /*
   * The two plates kept from the STİCKERR REF perfume set (Diako, Azzurra; Heeva's crown and
   * Raavi's bezel became frames). Neither is a texture: one is a plate of type in three tiers, the
   * other a roundel on flat geometry. The owner's rule holds on both — brand leads, product follows
   * `secondaryMax`; Dogwood & Fir's inversion was reviewed and dropped for exactly that reason.
   */
  'atelier-plate': {
    id: 'atelier-plate',
    surface: 'label',
    reference: 'Diako — Eau de Parfum (STİCKERR REF)',
    backgrounds: ['paper', 'gradient-wash'],
    typePairings: ['spaced-serif/spaced-sans', 'serif-display/sans-meta'],
    temperaments: ['light-luxe', 'dark-luxe', 'clean-clinical'],
    frames: ['band-hairline', 'thin-double', 'fleuron-crown'],
    ornaments: ['measured', 'quiet', 'rich'],
    lockup: 'stacked-center',
    /*
     * Perfume plates. Every other sector sits *below* the 0.3 recognition floor on purpose: the
     * mood walk is index-based, and a new family the sector recognises shifts every pick after it —
     * measured, 0.55 on cream and 0.3 on health moved seven of the eighteen frozen faces, none of
     * them perfume. Outside perfume these faces are reached by a word in the brief ("plaka",
     * "arma") or by the design brain's hint, not by the walk.
     */
    sectors: { perfume: 0.95, cream: 0.28, serum: 0.28, beverage: 0.28, health: 0.28, generic: 0.28 },
    styles: { luxury: 1, classic: 0.9, minimal: 0.7, modern: 0.4, eco: 0.2, playful: 0.05 },
    aspect: 'any',
    anatomy: ['band hairline frame', 'brand lockup', 'tier rules', 'product name', 'concentration line', 'attribution line', 'net quantity'],
    summaryTr: 'Üç katlı tip plakası: marka, ürün, imza satırı; bant + saç teli çerçeve.',
  },
  'crest-panel': {
    id: 'crest-panel',
    surface: 'label',
    reference: 'Azzurra — Eau de Parfum (STİCKERR REF)',
    backgrounds: ['arabesque', 'paper'],
    typePairings: ['serif-display/sans-meta', 'spaced-serif/spaced-sans'],
    temperaments: ['light-luxe', 'dark-luxe', 'vivid-mono'],
    frames: ['thin-double', 'band-hairline', 'none'],
    ornaments: ['measured', 'rich', 'quiet'],
    lockup: 'stacked-center',
    // Below the recognition floor outside perfume — see `atelier-plate`.
    sectors: { perfume: 0.9, cream: 0.28, beverage: 0.28, food: 0.28, generic: 0.28 },
    styles: { classic: 1, luxury: 0.95, playful: 0.3, modern: 0.3, minimal: 0.3, eco: 0.2 },
    aspect: 'any',
    anatomy: ['arabesque field', 'roundel', 'crest mark', 'brand lockup', 'product name', 'category line', 'net quantity'],
    summaryTr: 'Düz arabesk zemin üzerinde madalyon ve arma; altında marka ve ürün.',
  },
}

export const BOX_DNA: Record<BoxArchetype, ArchetypeDna> = {
  'noir-stack': {
    id: 'noir-stack',
    surface: 'box',
    reference: 'GUESS Sauvage — Eau de Parfum carton',
    /*
     * F-13: the moonlit scene that used to lead this list is gone. It filled the lower two-thirds
     * of the face, so dropping it left the carton empty below the lockup — `gradient-wash` was
     * tried first and read as a flat dark rectangle, `ink-wash` painted a gold mass off the foot
     * that looked like a hillside, which is the thing being removed. The black-on-black lattice
     * carries the field without drawing anything, and marble was already the second ground here.
     */
    backgrounds: ['arabesque', 'marble'],
    typePairings: ['serif-display/sans-meta', 'spaced-serif/spaced-sans'],
    temperaments: ['dark-luxe'],
    frames: ['none'],
    ornaments: ['measured', 'rich', 'quiet'],
    lockup: 'stacked-center',
    sectors: { perfume: 1, beverage: 0.7, serum: 0.6, cream: 0.5, electronics: 0.4, generic: 0.5 },
    styles: { luxury: 1, classic: 0.7, modern: 0.5, minimal: 0.4, eco: 0.1, playful: 0.1 },
    aspect: 'portrait',
    anatomy: ['brand lockup', 'product name', 'category line', 'deep gilded field', 'tagline', 'net quantity', 'marble spines', 'stacked manifesto', 'story back', 'pictograms + barcode'],
    summaryTr: 'Siyah + altın; ön yüzde derin yaldızlı zemin, ortada dikey kilit, yanlarda mermer ve dikey manifesto.',
  },
  'ink-wash': {
    id: 'ink-wash',
    surface: 'box',
    reference: 'Rebull Noir — Eau de Parfum carton',
    backgrounds: ['ink-wash'],
    typePairings: ['spaced-serif/spaced-sans', 'serif-display/sans-meta'],
    temperaments: ['light-luxe'],
    frames: ['thin-double', 'band-hairline'],
    ornaments: ['measured', 'quiet', 'rich'],
    lockup: 'stacked-center',
    sectors: { perfume: 1, serum: 0.8, cream: 0.7, beverage: 0.6, health: 0.4, generic: 0.5 },
    styles: { luxury: 1, classic: 0.8, minimal: 0.7, modern: 0.5, eco: 0.2, playful: 0.1 },
    aspect: 'portrait',
    anatomy: ['cream front', 'ink wash + veins', 'thin frame', 'brand lockup', 'product name', 'category line', 'stacked tagline', 'net quantity', 'navy spines', 'monogram', 'notes table back'],
    summaryTr: 'Krem ön yüz, köşeden gelen mürekkep ve altın damar; lacivert yanlar, monogram, arka nota tablosu.',
  },
  'marble-frame': {
    id: 'marble-frame',
    surface: 'box',
    reference: 'Elite Brew marble system on a carton',
    backgrounds: ['marble'],
    typePairings: ['script-accent/sans-heavy', 'spaced-serif/spaced-sans'],
    temperaments: ['light-luxe', 'dark-luxe'],
    frames: ['corner-brackets'],
    ornaments: ['measured', 'rich', 'quiet'],
    lockup: 'stacked-center',
    sectors: { beverage: 1, food: 0.7, perfume: 0.6, cream: 0.25, generic: 0.6 },
    styles: { luxury: 0.9, classic: 0.7, modern: 0.7, minimal: 0.5, eco: 0.2, playful: 0.3 },
    aspect: 'any',
    anatomy: ['marble field', 'corner brackets', 'brand mark', 'brand lockup', 'script prefix', 'product name', 'net quantity', 'marble spines', 'story back'],
    summaryTr: 'Mermer zemin, köşe parantezli kilit; altta el yazısı ön ek ve kalın ürün adı.',
  },
  'botanical-card': {
    id: 'botanical-card',
    surface: 'box',
    reference: 'woo.originals botanical system on a carton',
    backgrounds: ['botanical', 'wave', 'gradient-wash'],
    typePairings: ['script-accent/sans-heavy'],
    temperaments: ['vivid-mono'],
    frames: ['rounded-card'],
    ornaments: ['measured', 'quiet', 'rich'],
    lockup: 'top-right-pill',
    sectors: { cream: 1, serum: 0.25, baby: 0.25, cleaning: 0.2, health: 0.5, food: 0.4, generic: 0.5 },
    styles: { playful: 1, modern: 0.9, eco: 0.7, minimal: 0.4, luxury: 0.2, classic: 0.2 },
    aspect: 'any',
    anatomy: ['tone-on-tone botanical', 'brand pill', 'title card', 'claim band', 'benefit line', 'net quantity', 'benefit sides', 'legal back'],
    summaryTr: 'Canlı tek ton botanik zemin, beyaz başlık kartı, koyu iddia bandı; yanlarda fayda listesi, arkada tam legal düzen.',
  },
  'diagonal-tech': {
    id: 'diagonal-tech',
    surface: 'box',
    reference: 'Capelli Fellici diagonal system on a carton',
    backgrounds: ['diagonal', 'circuit'],
    typePairings: ['sans-light/sans-heavy'],
    temperaments: ['tech-dark', 'dark-luxe'],
    frames: ['none'],
    ornaments: ['measured', 'quiet'],
    lockup: 'left-column',
    sectors: { electronics: 1, cream: 0.7, cleaning: 0.6, serum: 0.5, health: 0.4, generic: 0.5 },
    styles: { modern: 1, minimal: 0.7, luxury: 0.6, classic: 0.2, playful: 0.3, eco: 0.1 },
    aspect: 'any',
    anatomy: ['diagonal blocks', 'left title column', 'spec chips', 'monogram', 'quality badge', 'net quantity', 'spec sides', 'spec back'],
    summaryTr: 'Antrasit zemin, diyagonal metalik bloklar; solda hafif + kalın başlık, spec çipleri.',
  },
  'line-scene': {
    id: 'line-scene',
    surface: 'box',
    reference: 'DNA Pharma — Sea Protection carton',
    // Only the one. `paper` was listed here and never drawn, and it cannot be: `paintLineSceneFace`
    // paints its scenery *after* the type because a line scene occupies only the lower span, so a
    // background that fills the whole panel erases the brand, the title and the caption. Measured
    // by rendering it — the carton came back blank with a net quantity on it.
    backgrounds: ['line-scene'],
    typePairings: ['sans-light/sans-heavy', 'spaced-serif/spaced-sans'],
    temperaments: ['clean-clinical', 'vivid-mono'],
    frames: ['none'],
    ornaments: ['measured', 'quiet'],
    lockup: 'stacked-center',
    sectors: { health: 1, baby: 1, serum: 1, cream: 0.35, generic: 0.4 },
    styles: { minimal: 1, modern: 0.8, playful: 0.6, eco: 0.4, luxury: 0.2, classic: 0.2 },
    aspect: 'portrait',
    anatomy: ['white field', 'brand mark', 'two-tone title', 'line-drawn scene', 'net quantity', 'legal back'],
    summaryTr: 'Beyaz klinik zemin, iki tonlu başlık, alt yarıda tek çizgi illüstrasyon.',
  },
  'wave-panel': {
    id: 'wave-panel',
    surface: 'box',
    reference: 'FERAH / surface-care wave system on a carton',
    backgrounds: ['wave'],
    typePairings: ['sans-light/sans-heavy'],
    temperaments: ['clean-clinical', 'vivid-mono', 'natural-warm'],
    frames: ['none'],
    ornaments: ['measured', 'quiet'],
    lockup: 'stacked-center',
    sectors: { cleaning: 1, cream: 0.3, baby: 0.25, generic: 0.4 },
    styles: { eco: 1, modern: 0.8, minimal: 0.7, playful: 0.4, luxury: 0.15, classic: 0.2 },
    aspect: 'any',
    anatomy: ['wave bands', 'brand lockup', 'category line', 'product stack', 'net quantity', 'spec sides', 'legal back'],
    summaryTr: 'Dalga bantlı zemin, istif sans marka; temizlik ve ev bakım.',
  },
  'specimen-hero': {
    id: 'specimen-hero',
    surface: 'box',
    reference: 'botanical specimen plates (public domain) — subject-led carton',
    backgrounds: ['gradient-wash', 'paper', 'botanical'],
    typePairings: ['spaced-serif/spaced-sans', 'serif-display/sans-meta', 'script-accent/sans-heavy'],
    temperaments: ['light-luxe', 'natural-warm', 'clean-clinical', 'vivid-mono'],
    frames: ['thin-double', 'band-hairline', 'fleuron-crown', 'none'],
    ornaments: ['measured', 'quiet', 'rich'],
    lockup: 'stacked-center',
    sectors: { food: 0.9, beverage: 0.85, cream: 0.5, baby: 0.4, health: 0.3, serum: 0.22, generic: 0.45 },
    styles: { eco: 1, classic: 0.85, luxury: 0.6, minimal: 0.5, playful: 0.4, modern: 0.3 },
    aspect: 'portrait',
    anatomy: ['thin double frame', 'brand lockup', 'category line', 'drawn specimen', 'product stack', 'net quantity', 'legal back'],
    summaryTr: 'Kartonun ortasında çizilmiş bitki/meyve, üstte marka, altta ürün; ince çift çerçeve.',
  },
  'atelier-plate': {
    id: 'atelier-plate',
    surface: 'box',
    reference: 'Diako — Eau de Parfum (STİCKERR REF), plate on a carton front',
    backgrounds: ['paper', 'gradient-wash'],
    typePairings: ['spaced-serif/spaced-sans', 'serif-display/sans-meta'],
    temperaments: ['light-luxe', 'dark-luxe', 'clean-clinical'],
    frames: ['band-hairline', 'thin-double', 'fleuron-crown'],
    ornaments: ['measured', 'quiet', 'rich'],
    lockup: 'stacked-center',
    // Below the recognition floor outside perfume — see the label row.
    sectors: { perfume: 0.9, cream: 0.28, serum: 0.28, beverage: 0.28, health: 0.28, generic: 0.28 },
    styles: { luxury: 1, classic: 0.9, minimal: 0.7, modern: 0.4, eco: 0.2, playful: 0.05 },
    aspect: 'portrait',
    anatomy: ['band hairline frame', 'brand lockup', 'tier rules', 'product name', 'concentration line', 'attribution line', 'net quantity', 'legal back'],
    summaryTr: 'Karton önünde üç katlı tip plakası; bant + saç teli çerçeve.',
  },
  'crest-panel': {
    id: 'crest-panel',
    surface: 'box',
    reference: 'Azzurra — Eau de Parfum (STİCKERR REF), roundel on a carton front',
    backgrounds: ['arabesque', 'paper'],
    typePairings: ['serif-display/sans-meta', 'spaced-serif/spaced-sans'],
    temperaments: ['light-luxe', 'dark-luxe', 'vivid-mono'],
    frames: ['thin-double', 'band-hairline', 'none'],
    ornaments: ['measured', 'rich', 'quiet'],
    lockup: 'stacked-center',
    // Below the recognition floor outside perfume — see the label row.
    sectors: { perfume: 0.85, cream: 0.28, beverage: 0.28, food: 0.28, generic: 0.28 },
    styles: { classic: 1, luxury: 0.95, playful: 0.3, modern: 0.3, minimal: 0.3, eco: 0.2 },
    aspect: 'portrait',
    anatomy: ['arabesque field', 'roundel', 'crest mark', 'brand lockup', 'product name', 'category line', 'net quantity', 'legal back'],
    summaryTr: 'Arabesk zeminli karton, ortada madalyon ve arma; altında marka ve ürün.',
  },
}

export function dnaFor(archetype: StudioArchetype, surface: StudioSurface): ArchetypeDna {
  if (surface === 'label') {
    return LABEL_DNA[archetype as LabelArchetype] ?? LABEL_DNA['marble-frame']
  }
  return BOX_DNA[archetype as BoxArchetype] ?? BOX_DNA['noir-stack']
}

export function archetypesFor(surface: StudioSurface): ArchetypeDna[] {
  return surface === 'label' ? Object.values(LABEL_DNA) : Object.values(BOX_DNA)
}

export const ALL_ARCHETYPES: StudioArchetype[] = [
  ...(Object.keys(LABEL_DNA) as LabelArchetype[]),
  ...(Object.keys(BOX_DNA) as BoxArchetype[]).filter((id) => !(id in LABEL_DNA)),
]

/**
 * Keyed by the union rather than listed, so a new background cannot be painted, listed in a DNA
 * row and still be missing from the guard and the LLM prompt — which is exactly how `arabesque`
 * went absent: the painter, the DNA and the tests all knew it and this list did not.
 */
const BACKGROUND_KEYS: Record<BackgroundFamily, true> = {
  marble: true,
  botanical: true,
  diagonal: true,
  'ink-wash': true,
  'gradient-wash': true,
  'line-scene': true,
  paper: true,
  wave: true,
  circuit: true,
  arabesque: true,
}
export const ALL_BACKGROUNDS = Object.keys(BACKGROUND_KEYS) as BackgroundFamily[]

export const ALL_FRAMES: FrameStyle[] = ['none', 'thin-double', 'corner-brackets', 'rounded-card', 'band-hairline', 'fleuron-crown', 'bezel']
export const ALL_ORNAMENTS: OrnamentLevel[] = ['quiet', 'measured', 'rich']

export const ALL_TEMPERAMENTS: Temperament[] = ['dark-luxe', 'light-luxe', 'vivid-mono', 'natural-warm', 'clean-clinical', 'tech-dark']

export const ALL_TYPE_PAIRINGS: TypePairing[] = [
  'serif-display/sans-meta',
  'script-accent/sans-heavy',
  'sans-light/sans-heavy',
  'spaced-serif/spaced-sans',
]

export function isArchetype(value: unknown, surface?: StudioSurface): value is StudioArchetype {
  if (typeof value !== 'string') return false
  if (surface === 'label') return value in LABEL_DNA
  if (surface === 'box') return value in BOX_DNA
  return value in LABEL_DNA || value in BOX_DNA
}

export function isBackground(value: unknown): value is BackgroundFamily {
  return typeof value === 'string' && (ALL_BACKGROUNDS as string[]).includes(value)
}

export function isTemperament(value: unknown): value is Temperament {
  return typeof value === 'string' && (ALL_TEMPERAMENTS as string[]).includes(value)
}

export function isTypePairing(value: unknown): value is TypePairing {
  return typeof value === 'string' && (ALL_TYPE_PAIRINGS as string[]).includes(value)
}

export function isFrame(value: unknown): value is FrameStyle {
  return typeof value === 'string' && (ALL_FRAMES as string[]).includes(value)
}

export function isOrnament(value: unknown): value is OrnamentLevel {
  return typeof value === 'string' && (ALL_ORNAMENTS as string[]).includes(value)
}
