/**
 * The facts that stop a design, as opposed to the points that grade it.
 *
 * Phase 1 began with a score floor: "let craft bite". Measuring 216 faces killed that idea — the
 * distribution sits between 71 and 78, so no floor separates a good face from a bad one, and the
 * face the owner rejected by eye scored 71. A floor would have shipped, blocked nothing, and
 * reported PASS.
 *
 * What does separate them is not a score at all. It is a small set of yes/no facts, each one a
 * promise the design made and then broke:
 *
 *   HIERARCHY_VIOLATION    the direction asked for a brand-first display line, the product is bigger
 *   DESIGN_CONTRACT_FRAME  the direction chose a frame and no painter drew it
 *   REQUIRED_INFO_MISSING  a food back without its nutrition declaration
 *
 * All three were already detected and thrown away as prose. Naming them is what makes them
 * enforceable — and enforceable in both directions: a blocker that fires on a face that is actually
 * fine is a bug in the detector, not a reason to block.
 *
 * Every one of these was measured to zero across 216 sweep faces, 324 job×family faces and the 18
 * frozen goldens before the gate was allowed to read them. The gate blocks nothing that exists
 * today; it exists so that the next regression cannot reach a customer.
 */

/*
 * `REQUIRED_INFO_MISSING` left the gate in Phase 1.5 and came back in Phase 2D, narrower.
 *
 * Phase 1 enforced it on the strength of 558 faces that all had room for a nutrition table. The
 * catalogue has shapes that do not — a complete declaration needs 18.2 mm against a 60 mm lid's
 * 12–16 mm legal band — so the engine draws none and warns through `ds-nutrition-fit`, a deliberate
 * answer decided in F-42. Enforcing it then blocked 8 legitimate designs, because nothing
 * distinguished "too small to carry one" from "the renderer stopped emitting".
 *
 * Now something does. `Ledger.skip` records a declined block with its reason, so `nutritionState`
 * reads four separate facts from the ledger rather than one absence from the markup. Only
 * `REQUIRED_BUT_NOT_RENDERED` — absent, with no reason recorded — closes the gate. A shape that
 * cannot carry the table still exports, and still tells the customer where to put it.
 */
export type DesignBlockerId = 'HIERARCHY_VIOLATION' | 'DESIGN_CONTRACT_FRAME' | 'REQUIRED_INFO_MISSING'

/** A broken promise, with the evidence a human needs to see why. */
export type DesignBlocker = {
  id: DesignBlockerId
  /** Turkish, customer-legible — this reaches the report, not just the log. */
  reason: string
}

/** Collector handed to the scorers that can raise one. Absent means "nobody is listening". */
export type BlockerSink = DesignBlocker[] | undefined

export function raise(sink: BlockerSink, id: DesignBlockerId, reason: string): void {
  if (!sink) return
  // A face reports each broken promise once, however many readings notice it.
  if (sink.some((b) => b.id === id)) return
  sink.push({ id, reason })
}
