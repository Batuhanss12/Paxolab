/**
 * S6 studio golden — 18 face hashes, separate from the 29 kit catalog freeze.
 * Intentional painter/DNA changes update STUDIO_FACE_GOLDEN; kit fingerprints stay put.
 */
import { createHash } from 'node:crypto'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { emptyBrief } from '../fields'
import type { BackgroundFamily, StudioArchetype, StudioFamily } from './types'
import { STUDIO_GALLERY_JOBS, type StudioGalleryJob } from './studioGalleryJobs'

export type StudioFaceFreeze = {
  archetype: StudioArchetype
  background: BackgroundFamily
  family: StudioFamily
  hash: string
}

/**
 * Captured 17 Eyl 2026 (L1). Two deliberate changes landed together so the set only moved once:
 *   - text is measured with real font advances instead of the old estimator (which drifted
 *     −10%…+20%, worst on `script`; the negative side let lines overrun their box),
 *   - every computed type size is clamped to `STUDIO_TYPE_FLOOR_MM` (1.5 mm).
 * 16 of 18 hashes moved. Archetype / background / family are unchanged on all 18 — the DNA did
 * not shift, only the type did.
 *
 * L2 then moved the set twice more, DNA unchanged both times:
 *   - scenery silhouettes come from the product's species instead of always being conifers,
 *   - the studio face is painted from the brief's own colours. Until now `paletteFromBrief` only
 *     ran on the blank-canvas path, so a brief that said "siyah · beyaz" was never consulted and
 *     the face came back turquoise. The kit path still uses `paletteFor`, which is why the 29
 *     catalog fingerprints are untouched.
 *
 * Then the marble painter was rewritten and only the two marble faces moved (05-kahve-kutu,
 * 05-kahve-etiket). Zoomed to print size the old slab read as a gold road map: ~27 veins, all in
 * the accent colour, each one stroke wide with hard vertices where the path jumped. Veins are now
 * tapered fills on a drifting turn rate, mostly stone-coloured, with gold as a rare thread.
 * A two-face move is the shape a background-only change should have — if a painter rewrite moves
 * faces that do not use that background, something leaked and the diff is worth reading.
 *
 * L2-C moved all 18 at once, and this is the move to read carefully. The mood knob had gone dead —
 * with any colour in the brief, all six moods produced the same ground — so the colour layer was
 * rebuilt around one rule: the brief owns which hues exist, the mood owns what they do. Every face
 * is painted by that layer, so every hash moves.
 *
 * Archetype / background / family are unchanged on all 18. That is the number that matters: the
 * colour layer changed and did *not* leak into the skeleton. Had archetypes shifted too, it would
 * mean the mood had started deciding composition as well, and the layering would be back where it
 * started. The 29 kit fingerprints are untouched — the kit path still paints from `paletteFor`.
 *
 * L2-H is the largest move so far and the only one where the **DNA** was meant to shift: 13 of 18
 * archetypes changed, deliberately. The owner reported that clicking through the moods barely
 * changed anything, and measurement agreed — on 3 of 4 briefs all six moods returned the same
 * skeleton, the same background and the same layout. Two things were holding it: `hintPin` was
 * worth +2 against a scoring range of about 1, so a sector guess could not be outvoted; and the
 * engine stamps `studioFamily` onto every brief it returns, which pinned the composition for the
 * rest of the session after the first generation.
 *
 * The owner chose maximum range, so a sector guess is now a strong preference rather than a lock
 * and the mood walks the ranked archetypes. The cost is visible in this table: honey moved to
 * marble, electronics to noir-stack, baby care to marble. Those are defensible but they are no
 * longer the reference face the sector implies. If that trades away too much, the knob is the
 * `MOOD_WALK_OFFSET` table in `direction.ts` — all-zero restores the old behaviour exactly.
 *
 * L2-I moved 12 of 18 on a type change. The brand and the product name used to be clamped by two
 * hand-tuned ceilings that happened to land near each other: measured across ten briefs, eight came
 * back within 1.4× and five shared the identical pair 8.3 mm / 7.7 mm. Nothing had decided which
 * element leads, so nothing led. The second line is now derived from the brand's *drawn* size
 * (`secondaryMax`), which also covers the column layouts where the brand itself had to shrink.
 * Across 40 faces the top-two ratio went from about 1.31× to 1.75×, with no collisions and no
 * export failures.
 *
 * L2-J then moved 10 DNA entries, and this one is a correction rather than a trade.
 *
 * Chasing why baby care had landed on marble turned up the wrong story first: the fallback looked
 * guilty, but tracing the engine showed marble was the *ranking's* pick all along and `line-scene`
 * had only ever been reached because marble used to paint dirty. Fixing marble removed the
 * accident. The real cause was the mood walk taking whatever sat at its offset, however unrelated —
 * `playful` steps five places, and five places down a baby brief is stone veining.
 *
 * Windowing the walk by score cannot fix it. Measured: the scores are one clear leader then a large
 * drop, so a window wide enough to keep any range (4.2 archetypes per brief) still reaches marble,
 * and one tight enough to block marble collapses range to 1.3.
 *
 * The walk is now drawn from archetypes whose DNA *lists* this sector — `line-scene` scores 1 on
 * baby, `wave-panel` 0.3, while marble and ink-wash do not appear at all. Range measured 3.3
 * archetypes per brief with all six faces still distinct, and the moves read as corrections: baby
 * to botanical-card and card-on-art, cleaning to the FERAH wave-panel. A word the customer wrote
 * ("elektronik kutu ama mermer") still overrules the sector, because that is them telling us
 * something the table does not know.
 *
 * L2-K adds the first archetype whose subject is *drawn* rather than textured, `specimen-hero`,
 * and with it a ninth family. Five of eighteen moved.
 *
 * The number to read is not five, it is what moved and why. Adding a family reshuffles the mood
 * walk wholesale, because the walk takes whatever sits at its offset in a list that just grew — so
 * the churn is expected and the only useful question is whether each landing is better than what
 * it replaced. Measured: three improvements, two neutral, no regressions.
 *   - honey box left `marble-frame` for a drawn specimen, and honey label left `card-on-art` for
 *     `landscape-badge`, which is the Anadolu Bal reference face it should have had all along.
 *     Stone veining on a honey carton was the "luxury wallpaper" complaint in the first place.
 *   - baby label moved from wave bands to a drawn specimen.
 *   - the two health faces moved sideways (tech → ink, card → diagonal); neither is worse.
 *
 * Two DNA corrections were needed to get there, and both stand on their own merits rather than as
 * tuning. `marble-frame` scored cream at 0.5 on both surfaces — above the 0.3 recognition floor —
 * so a face cream was eligible for a stone slab; its reference is Elite Brew coffee, and cream is
 * now 0.25. And `specimen-hero` initially scored serum at 0.4 and took a clinical B5 serum, where
 * a botanical drawing reads as the wrong category entirely; serum is now 0.22. Without those two
 * the same change moved eight and nine faces and put marble on the cream box.
 *
 * `specimen-hero` takes 2 of 18 here, which is the share a thirteenth archetype should have.
 *
 * L2-L deepened the illustrator itself and moved exactly two hashes, both of them specimen faces,
 * with no DNA movement at all. That is the shape this change should have: the drawing got better,
 * nothing about which archetype wins changed. Three axes were added —
 *   - leaf anatomy per species (lanceolate / ovate / obovate / serrate / needle / succulent) with
 *     a midrib and gated side veins, because shape is what names a plant and the previous version
 *     varied only width ratio,
 *   - an `engraved` render mode, outline and hatching instead of filled masses, which is the older
 *     botanical-plate language premium packs lean on,
 *   - four arrangements (arch / sprig / wreath / crossed) chosen by seed, so pressing "variation"
 *     changes the picture rather than only its colours. Aloe and citrus stay pinned to one
 *     arrangement each, because a rosette is what an aloe is.
 *
 * L2-M widened the illustrator from nine species to sixteen and gave it flowers. DNA did not move;
 * three hashes did, and all three are the honey and baby faces, which is the change asking to be
 * read rather than waved through.
 *
 * Honey moved species, from `grain` to a new `blossom`. It had been sitting in the wheat rule
 * because both read as "golden food", but what a customer pictures on a honey jar is the flower
 * the bee worked. The routing change had to be carried into `speciesTree` too — the new species
 * all fell through to the default, so a lavender field would have grown conifers.
 *
 * What the flowers buy is the sector Paxolab prints most of. Every species so far was leaves plus
 * fruit, which is a crop vocabulary; cosmetics, baby care and perfume speak in blooms. There are
 * now five bloom kinds (daisy / spike / umbel / cup / cluster) and seven species that use them.
 * The rose was drawn twice: fanning petals from a point is how a daisy works and came back as a
 * gold lump, so a rose is now nested cupped bands around a curl, which is what makes one legible
 * at 15 mm.
 *
 * Two smaller things landed with it: a third tonal plane at half density, and leaves that shorten
 * toward the tip. Both are about the same defect — foliage that read as one flat slab.
 *
 * L2-N is the round that chased a reference the owner supplied — a black skincare carton with a
 * modelled camellia and gilded foliage. Four things closed most of the distance, and one did not.
 *
 * Closed: every leaf is now filled from a gradient running base-to-tip, dark where it joins the
 * stem and lifting only in the last fifth (one `objectBoundingBox` definition lights every leaf
 * along its own axis, whichever way it was rotated); a fold darkens the turned half of a leaf so
 * foliage stops lying flat; `corolla` draws a real flower — two overlapping rings of round-ended
 * petals around a drawn stamen boss, where the first attempt tapered them to points and came back
 * a star; and `spray` is the first asymmetric arrangement, foliage massed low on one side with a
 * single focal bloom opposite, which is the diagonal the reference is built on.
 *
 * Not closed, and worth stating: the reference's petals have soft edges and hand-painted tonal
 * variation. Vector fills have hard boundaries, and closing that would mean either a blur filter —
 * which rasterises at the RIP, the one thing the export gate exists to prevent — or an embedded
 * raster, which cannot wear the brief's colours. The drawing is a good deal closer than it was and
 * is still recognisably drawn rather than painted.
 *
 * L2-P moved two specimen hashes with no DNA movement. The arrangement and render mode of a drawn
 * subject now come from a *line* seed — brand, surface and variation, without the product name —
 * because a four-SKU range measured as four different compositions: a rosette, a crossed pair, a
 * wreath and a sprig, which on a shelf reads as four unrelated products. The subject still changes
 * per SKU; only what the range holds in common stopped changing with it.
 *
 * F-3 (2026-09-18) moved eleven hashes and one archetype, deliberately: the Design Brain now
 * reaches the studio direction. `createPlan` had always produced type authority, visual intent,
 * a decoration budget, negative space and a metallic role, and the studio path read none of it —
 * every archetype wore its first pairing, frame and ornament for every mood. `studioPlanBridge`
 * turns the plan into hints on exactly those three axes (never archetype, background or
 * temperament), placed first among the extras so knowledge and the customer still win. The hash
 * moves are that reading: luxury faces take the tracked serif and, where the archetype allows
 * it, the band-and-hairline plate edge; minimal and modern faces go `quiet` with no edge; playful
 * and rich-budget faces go `rich`. The one archetype move is the minimal health carton, ink-wash
 * → diagonal-tech, from the ranking's new 0.05 intent-fit term — its own label had already been
 * given diagonal-split, so the pair now agree. Each moved face was rendered and read
 * (`scripts/golden-sheet.ts`) before the table was rewritten.
 *
 * F-13 (2026-09-18) moved five rows, and this one is a deletion rather than a trade: the owner
 * judged the landscape mediocre and asked for it out of the system. The `landscape` family went
 * first — both archetypes, its meadow ground and its sector pins.
 *
 * The moonlit carton survived that pass on a naming argument, that the UI calls its family
 * "karanlık lüks" rather than "peyzaj". That argument does not hold: the painter drew mountain
 * ridges, pines and a moon reflected in a lake, which is a landscape whatever the menu calls it.
 * So the ground went too, and the archetype was renamed `dark-landscape` → `noir-stack` because
 * the old name would otherwise keep promising a scene to the director model and to whoever reads
 * this next. The family itself is untouched — black and gold on a deep gilded field, which is the
 * part the owner never objected to — and its DNA already listed a second ground, so nothing had to
 * be invented to replace the scene.
 *
 * Honey had been pinned straight to the meadow window since L2-K, so it moved twice over: the pin
 * now names the drawn specimen, and from there the mood walk lands the carton on marble and the
 * label on the botanical card. Baby's carton took the specimen the honey label vacated. Read the
 * table with the offer in mind — the customer is now shown four directions and picks one, so which
 * of them arrives selected matters less than it did when the first face was the only face.
 *
 * Update via `npx vite-node scripts/dump-studio-golden.ts`; `scripts/diff-studio-golden.ts`
 * prints only the rows that differ.
 */
export const STUDIO_FACE_GOLDEN: Record<string, StudioFaceFreeze> = {
  '01-parfum-kutu': { archetype: 'noir-stack', background: 'arabesque', family: 'dark-luxe', hash: '61c0bb2482085134' },
  '01-parfum-etiket': { archetype: 'ink-panel', background: 'ink-wash', family: 'ink', hash: 'd88bc982710677a3' },
  '02-krem-kutu': { archetype: 'ink-wash', background: 'ink-wash', family: 'ink', hash: 'b1af002b3571fd5c' },
  '02-krem-etiket': { archetype: 'ink-panel', background: 'ink-wash', family: 'ink', hash: 'f30201ed0bd8be65' },
  '03-serum-kutu': { archetype: 'diagonal-tech', background: 'diagonal', family: 'tech', hash: '0b32ffaf28c1c9a5' },
  '03-serum-etiket': { archetype: 'ink-panel', background: 'ink-wash', family: 'ink', hash: 'a68c9e7efa46a291' },
  '04-gida-bal-kutu': { archetype: 'marble-frame', background: 'marble', family: 'marble', hash: '3d8b6f43aadec400' },
  '04-gida-bal-etiket': { archetype: 'card-on-art', background: 'gradient-wash', family: 'botanical', hash: '8a4d2d1d1e860490' },
  '05-kahve-kutu': { archetype: 'marble-frame', background: 'marble', family: 'marble', hash: '93d9529b2bdd2bf9' },
  '05-kahve-etiket': { archetype: 'marble-frame', background: 'marble', family: 'marble', hash: '4dd1f88197eb435a' },
  '06-elektronik-kutu': { archetype: 'noir-stack', background: 'arabesque', family: 'dark-luxe', hash: '02aaa2ba34312f0e' },
  '06-elektronik-etiket': { archetype: 'diagonal-split', background: 'diagonal', family: 'tech', hash: '9a31d73212aaa9ef' },
  '07-bebek-kutu': { archetype: 'specimen-hero', background: 'gradient-wash', family: 'specimen', hash: '7a11c79f322d15f7' },
  '07-bebek-etiket': { archetype: 'specimen-hero', background: 'gradient-wash', family: 'specimen', hash: 'd6c2277a4753b427' },
  '08-saglik-kutu': { archetype: 'diagonal-tech', background: 'diagonal', family: 'tech', hash: '6f613d40ed8a6ceb' },
  '08-saglik-etiket': { archetype: 'diagonal-split', background: 'diagonal', family: 'tech', hash: '30fc49745441e3ad' },
  '09-temizlik-kutu': { archetype: 'wave-panel', background: 'wave', family: 'wave', hash: '750d3bdfa0020ce5' },
  '09-temizlik-etiket': { archetype: 'wave-panel', background: 'wave', family: 'wave', hash: 'e3954f43c7661494' },
}

export function hashStudioFace(markup: string): string {
  return createHash('sha256').update(markup).digest('hex').slice(0, 16)
}

export function generateStudioFace(job: StudioGalleryJob) {
  resetArtMemory()
  const spec = new FormaLocalEngine().generate({
    brief: {
      ...emptyBrief(),
      brandName: job.brand,
      productName: job.product,
      sector: job.sector,
      subProduct: job.subProduct,
      packagingMode: job.packagingMode,
      templateId: job.templateId,
      styleType: job.styleType,
      colors: job.colors,
      volume: job.volume,
      dimensionsMm: job.dimensionsMm,
    },
    overridePatch: { studio: true, premium: job.styleType === 'luxury', variationIndex: 0 },
  })
  const layer = spec.artwork.layers.find((row) => row.panelId === spec.artwork.frontPanelId)?.markup ?? ''
  return {
    slug: job.slug,
    studio: Boolean(spec.studio),
    archetype: spec.studio?.direction.archetype,
    background: spec.studio?.direction.background,
    family: spec.brief.studioFamily,
    hash: hashStudioFace(layer),
    markup: layer,
  }
}

export function dumpStudioGolden(jobs = STUDIO_GALLERY_JOBS): Record<string, StudioFaceFreeze> {
  const out: Record<string, StudioFaceFreeze> = {}
  for (const job of jobs) {
    const face = generateStudioFace(job)
    if (!face.archetype || !face.background || !face.family) {
      throw new Error(`studio golden missing direction: ${job.slug}`)
    }
    out[job.slug] = {
      archetype: face.archetype,
      background: face.background,
      family: face.family,
      hash: face.hash,
    }
  }
  return out
}
