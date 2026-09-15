/**
 * FAZ 5 — behavioural outcome signals.
 * Does not learn rules. Patches the latest decision log for a design and hands the
 * event to the learning gate as an *observation* (candidate evidence only).
 */
import {
  decisionLogFor,
  outcomeOf,
  patchLatestLog,
  type DesignOutcome,
  type StructuredFeedback,
} from './DesignDecisionLog'
import { observeFeedback, observeOutcome } from './LearningEngine'

function maybeApprove(outcome: DesignOutcome, at: number): DesignOutcome {
  const approved = outcome.exported || outcome.downloaded || (outcome.stars ?? 0) >= 4
  if (!approved || outcome.timeToApprovalMs != null) return outcome
  return {
    ...outcome,
    finalized: true,
    approvedAt: at,
    timeToApprovalMs: Math.max(0, at - outcome.generatedAt),
  }
}

function patch(designId: string, update: (current: DesignOutcome) => DesignOutcome): void {
  const current = outcomeOf(designId) ?? decisionLogFor(designId)?.outcome
  if (!current) return
  patchLatestLog(designId, { outcome: update(current) })
  const log = decisionLogFor(designId)
  if (log) {
    try {
      observeOutcome(log)
    } catch {
      /* learning is an enhancement, never a dependency */
    }
  }
}

export function noteExport(designId: string): void {
  const at = Date.now()
  patch(designId, (current) => maybeApprove({ ...current, exported: true, downloaded: true }, at))
}

export function noteDownload(designId: string): void {
  const at = Date.now()
  patch(designId, (current) => maybeApprove({ ...current, downloaded: true }, at))
}

export function noteRating(designId: string, stars: number, tags: string[]): void {
  const at = Date.now()
  patch(designId, (current) => maybeApprove({ ...current, stars, tags }, at))
}

export function noteFeedback(designId: string, incoming: StructuredFeedback[]): void {
  if (!incoming.length) return
  const log = decisionLogFor(designId)
  if (!log) return
  patchLatestLog(designId, { feedback: [...log.feedback, ...incoming] })
  try {
    observeFeedback(log, incoming)
  } catch {
    /* best-effort */
  }
}

export function noteFinalized(designId: string): void {
  const at = Date.now()
  patch(designId, (current) => maybeApprove({ ...current, finalized: true }, at))
}
