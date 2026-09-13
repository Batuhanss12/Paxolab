# FORMA Graphic Art Direction (v3.5)

Additive layer on the v3 Design Director. **Art direction decides; the vector engine still draws.** No LLM SVG. One critique → repair → re-compose pass, then stop.

```
brief
  → DesignDirector.createPlan
  → ArtDirection + VisualConcept + CompositionGrammar
  → applyPlanToSystem          // pads / restrain only
  → composeArtwork(plan)       // existing painters + library adapters
  → preflight
  → scoreDesign + critiquePlan
  → RepairPlanner (plan deltas only) → one re-compose
  → final SVG
```

## Who decides what

| Brain | Engine (unchanged hands) |
| --- | --- |
| Hero family, one per front | `perfumeCrest` / `oliveWreath` / `metalPlaque` / library variants |
| Pattern family + opacity cap | `contourGoldField`, `geoLattice`, sides |
| Background treatment id | Existing fill + optional vignette |
| Density map + crop insets | Panel clip + lockout knockout |
| Critique scores | No SVG surgery |
| Repair deltas | Same `composeArtwork` again |

## Style × sector vocabulary

| Sector | Luxury default hero | Other heroes in set | Pattern | Background |
| --- | --- | --- | --- | --- |
| perfume | crest | seal | contour | dark-field |
| cream | oval | botanical | contour / grain | dark-field / kraft |
| food | harvest | — | contour / grain | dark-field / kraft |
| electronics | tech (plaque) | — | contour / lattice | dark-field / quiet-paper |

Style defaults (when sector does not override):

| Style | Hero | Pattern | Background | Negative space |
| --- | --- | --- | --- | --- |
| luxury | sector table | contour | dark-field | med (first generate stays dense kit) |
| modern | none / tech | lattice | quiet-paper (slate = palette) | med |
| minimal | none | none | quiet-paper | high |
| eco | botanical / harvest | grain | kraft | med |
| playful | emblem | capsule | quiet-paper | low but capped |
| classic | seal | ornament | dark-field | med |

## Hard craft rules

- One primary `data-art="hero"` on the front. Never three competing heroes.
- Luxury patterns skip the lockup hole (`lockout-*`). Glue panels stay `GLUE`.
- “Daha lüks yap” = `luxury-tighten`: air, sparse density, no gold spam.
- First luxury generate keeps the current dense kit (crest + contour + diamonds).
- Anti-repetition remembers the last 4 hero/pattern picks in-session and varies **inside** the allowed set. Tighten / arrive / open-air keep the previous hero.
- Perfume marks stay on perfume recipes. No invented GTIN.

## Critique scores → one repair

| Score | Fail | Repair |
| --- | --- | --- |
| lockupClearance | < 45 | pad / clearance flags |
| densityFront | < 50 (2+ heroes or primitives over cap) | sparse + restrain + drop extras |
| hierarchyStrength | < 50 | restate brand > product > volume |
| sectorBlind | < 40 | hint only (marks matrix unchanged) |
| repetitionPenalty | > 55 | next allowed hero |
| sideIntentionality | < 35 | mark side pattern intentional |

Luxury + dense still emits a MODIFY **hint**. It does **not** trigger repair (that would regress current craft).

`force-overload` is a smoke-only cue. It is not wired to StyleBar or chat.

## Files

Brain: `ArtDirection.ts`, `VisualConcept.ts`, `CompositionGrammar.ts`, `DesignMemory.ts`, `RepairPlanner.ts` + expanded `CritiqueEngine` / `DesignScore` / `DesignPlan`.

Artwork libraries: `heroGraphics.ts`, `illustrationPrimitives.ts`, `patternFamilies.ts`, `backgroundTreatments.ts`.

Thin wires: `composeArtwork.ts` reads the plan; `FormaLocalEngine.ts` runs at most one repair compose.
