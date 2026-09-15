# Kit ↔ VisualConcept alignment (Faz 2.8)

Single art-direction read path: **VisualConcept** (`id`, `languages`, `avoid`, `motifLexicon`, `decorationBudget`) is chosen **before** style costume defaults. `StyleType` only modulates density, air, and type scale inside that concept. It must not reopen avoided strategies (`heavy-frame`, `ornate-seal`, `dense-pattern`, `generic-corners`).

Lockup typography mathematics (`applyPlan` optical center, `typeSystem`) are unchanged — this table only selects the `LockupId` input.

## Concept → lockup

| Concept id | LockupId | Notes |
|---|---|---|
| `earthen-premium` | `harvest-seal` | Botanical companion on overlay; no food diamond frame |
| `grove-press` / `harvest-press` | `harvest-seal` | Same harvest grammar |
| `grove-kraft` / `harvest-kraft` / `kraft-botanical` / `botanical-night` | `stamp-center` | Eco/kraft, not a luxury seal |
| `nocturne-crest` / `heraldic-crest` | `centered-crest` | Crest is kit focal; motif takes ribbon/cartouche |
| `heraldic-cartouche` | `serif-cartouche` | Classic generic — cartouche is the grammar |
| `soft-oval` / `drop-concentrate` | `soft-oval` | Oval lockup **and** oval/ring motif language |
| `air-paper` | `air-rule` | Quiet hairline; no ornate seal/frame |
| `tech-glyph` | `tech-grid` | Linear/geometric; not L-corner pack |
| `signal-plaque` | `metal-plaque` | Luxury electronics plaque, still linear |
| `index-stripe` | `left-index` | Modern index |
| `capsule-field` | `badge-capsule` | Playful field; spend stays under budget |
| `restrained-foil` | `centered-crest` | Luxury fallback |

Label wrap/stack lockups are **not** remapped (label grammar wins).

## Frame / chrome / pattern

- `sectorFrame` skips food diamonds / luxury rings when `avoid` has `heavy-frame` or language is `quiet-line`. Electronics L-brackets skip on `linear` language or `generic-corners` (NOCTURNE still keeps perfume rings; it only forbids the L-corner pack).
- `goldBar` stays on luxury perfume / cream. It drops when the concept forbids both `heavy-frame` and `ornate-seal` (earthen, air-paper).
- ArtDirection `chrome` is forced `quiet` on air / quiet-line / heavy-frame avoid so `lockupWindow` cannot fight the motif winner.
- Kit pattern: `air-paper` set 0 is `none`. `avoid: dense-pattern` blocks `contour` / `ornament`; style may still pick a quiet substitute (`stripe`, `weave`) — it must not reopen dense costume fills.

## Overlay contract

If the kit already supplies a **crest** focal (`centered-crest` lockup or crest hero), motif search treats `crest` as a used lexicon token and skips a second hero-stamp on `hero-with-support`. Companions must use unused lexicon tokens (ribbon / cartouche). Soft-oval lockup is shared language, not a clone — oval/ring may still win on the overlay.

## Faz 2.8 kit proof (before → after)

| Face | Before | After |
|---|---|---|
| EARTHEN kit | `hero-with-support`, 2 atoms, spend 0.20; luxury food diamonds/gold-bar could fight the grove | `asymmetric-editorial`, 3 atoms (branch + corner + bottom), spend 0.35; no sector-frame, no gold-bar |
| NOCTURNE kit | Motif `crest-spot` + corner (second crest scream on top of kit crest) | Kit crest stays focal; motif winner `ribbon-corner` only |
| SOFT OVAL kit | Oval lockup + oval ring (already close); luxury rings possible | Lockup `soft-oval`, motif `soft-oval-ring`, chrome quiet, no sector-frame |
| AIR PAPER kit | `air-rule` + hairline | Same story; chrome quiet; no ornate seal/frame |
| TECH GLYPH / NOX kit | Linear `pattern16`, not L-pack | Held: `asymmetric-editorial`, no `l-bracket` / sector-frame |
| kit-09 CAPSULE | spend 0.37 / budget 0.48 | Held (no 4.40 relapse) |

Blank 2.5–2.7 winners were not rewritten.

