# FORMA Design Director (v3)

Additive layer. The **Director decides**; the **engine draws**. Painters were not rewritten.

```
USER BRIEF
    → extract / ask (unchanged)
    → DesignDirector.createPlan(brief, template, style, prev, cue)
    → DesignGraph (metadata tree)
    → applyPlanToSystem(resolveDesignSystem(…))   // pads, density, restrain flag
    → buildDieline + composeArtwork + MarkMatrix  // same hands
    → preflight
    → scoreDesign + critiquePlan (report-only)
    → SVG as today
```

## Who decides what

| Director (brain/) | Engine (existing) |
| --- | --- |
| Positioning, visual intent, hierarchy order | SVG lockup, type fit, small-caps |
| Negative space + decor density + restrain extras | Motif paths, frames, crest, clip |
| Typography *intent* (serif/sans, tracking) | Actual mm sizes from kits |
| Color *roles* + metallic restraint | `paletteFor` + StyleBar |
| Marks recipe key + front-clean | MarkMatrix + strip render |
| Dieline *behavior* (front hero, spine, back legal) | `buildDieline` + panel painters |
| Risks list | Preflight / gates |

StyleBar still picks one of six styles. The Director **refines inside** that style. It does not invent a seventh look.

## “Daha lüks yap”

Not more gold. Cue `luxury-tighten`:

- negative space ↑
- decor density → sparse
- skip perfume side ticks + corner diamonds
- lockup pad opens
- title scale +10% if untouched

First luxury generate keeps the current dense kit so craft does not drop.

## Files added

- `src/engine/brain/DesignPlan.ts`
- `src/engine/brain/DesignRules.ts`
- `src/engine/brain/DesignKnowledge.ts`
- `src/engine/brain/DesignGraph.ts`
- `src/engine/brain/DesignDirector.ts`
- `src/engine/brain/DesignScore.ts`
- `src/engine/brain/CritiqueEngine.ts`
- `src/engine/brain/applyPlan.ts`
- `src/engine/brain/index.ts`

## Thin wires (not a rewrite)

- `FormaLocalEngine.ts` — createPlan → applyPlanToSystem → existing compose
- `composeArtwork.ts` — `frontDecor` reads `system.director.restrainDecor` only
- `parseIntent.ts` — luxury tighten cue when already luxury
- `ProductionInfo` / `ConversationBrief` — existing chrome, plan `summaryTr`

## Out of scope (v4+)

- LLM as painter
- Auto-repair / SVG rewrite from critique
- Catalog, PDF/X, 3D milestone
