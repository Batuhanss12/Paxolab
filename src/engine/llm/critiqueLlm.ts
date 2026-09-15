/**
 * Optional LLM critique — reasoning over the deterministic critic's findings.
 * Output is the same DesignCritique schema; it never edits SVG and it is never
 * called for stroke widths, coordinates or collision checks (those are deterministic).
 */
import type { DesignCritique, CritiqueCategory, CritiqueSeverity } from '../brain/DesignCritic'
import type { DesignPlan } from '../brain/DesignPlan'
import { getLlmProvider } from './provider'

const CATEGORIES: CritiqueCategory[] = [
  'hierarchy',
  'composition',
  'density',
  'whitespace',
  'visual_language',
  'concept',
  'motif',
  'sector_fit',
  'brand_fit',
  'typography',
  'color',
  'technical',
]
const SEVERITIES: CritiqueSeverity[] = ['info', 'warn', 'error']

const SYSTEM_PROMPT = `You are a senior packaging art director reviewing a deterministic design plan for Paxolab.
Return JSON: { "critique": [ { "category", "target", "severity", "issue", "suggestedDirection" } ] }.
category must be one of: ${CATEGORIES.join(', ')}. severity: info | warn | error.
Reason only about brief fit, visual language coherence, hierarchy and sector conventions.
Never propose coordinates, stroke widths, colours as hex, or assets by file name. Max 4 findings.`

const GEOMETRY = /svg|viewBox|stroke-width|path\s|d="|#[0-9a-fA-F]{3,8}\b|\b\d+(\.\d+)?mm\b/i

type LlmCritiqueResponse = { critique?: Partial<DesignCritique>[] }

export async function critiqueWithLlm(input: {
  plan: Pick<DesignPlan, 'sector' | 'style' | 'positioning' | 'visualIntent' | 'visualLanguage' | 'visualConcept' | 'summaryTr'>
  brief: { positioning?: string; avoid?: string[]; character?: string }
  deterministic: DesignCritique[]
  /** Studio preflight ledger — evidence only; LLM still must not invent geometry. */
  studioLedger?: { collisions: string[]; outOfBounds: string[]; minTextMm: number }
}): Promise<DesignCritique[] | null> {
  const provider = getLlmProvider()
  if (!provider.enabled()) return null
  const user = [
    `Sector: ${input.plan.sector}; style: ${input.plan.style}; positioning: ${input.plan.positioning}; character: ${input.plan.visualIntent}`,
    `Visual language: ${input.plan.visualLanguage.join(', ')}; concept: ${input.plan.visualConcept.label ?? input.plan.visualConcept.id}`,
    `Brief avoid: ${(input.brief.avoid ?? []).join(', ') || '(none)'}`,
    `Deterministic findings: ${input.deterministic.map((c) => `${c.category}/${c.target}:${c.severity}`).join('; ') || '(none)'}`,
    input.studioLedger
      ? `Studio ledger (do not invent new coordinates): collisions ${input.studioLedger.collisions.join(', ') || '(none)'}; overflow ${input.studioLedger.outOfBounds.join(', ') || '(none)'}; minTextMm ${input.studioLedger.minTextMm}`
      : '',
  ]
    .filter(Boolean)
    .join('\n')
  const parsed = await provider.generateStructured<LlmCritiqueResponse>({
    task: 'critique',
    system: SYSTEM_PROMPT,
    user,
    timeoutMs: 8000,
  })
  if (!parsed) return null
  const out: DesignCritique[] = []
  for (const row of (parsed.critique ?? []).slice(0, 4)) {
    if (!row || !CATEGORIES.includes(row.category as CritiqueCategory)) continue
    const severity = SEVERITIES.includes(row.severity as CritiqueSeverity) ? (row.severity as CritiqueSeverity) : 'info'
    const issue = String(row.issue ?? '').slice(0, 240)
    const suggested = String(row.suggestedDirection ?? '').slice(0, 120)
    if (GEOMETRY.test(issue) || GEOMETRY.test(suggested)) continue
    out.push({
      category: row.category as CritiqueCategory,
      target: String(row.target ?? 'plan').slice(0, 40),
      severity,
      issue,
      suggestedDirection: suggested,
      evidence: { source: 'llm', topic: 'reasoning' },
    })
  }
  return out
}
