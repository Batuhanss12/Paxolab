import { afterEach, describe, expect, it } from 'vitest'
import { emptyBrief, mergeBrief } from '../fields'
import { extractBriefWithLlm, LLM_EXTRACT_CONFIDENCE } from '../nlu'
import { interpretFeedback, interpretFeedbackWithLlm } from './feedbackLlm'
import { activeModelConfig, getLlmProvider, setLlmProvider, type LLMProvider, type StructuredRequest } from './provider'

function fakeProvider(answer: (request: StructuredRequest) => unknown, calls: StructuredRequest[] = []): LLMProvider {
  return {
    enabled: () => true,
    config: () => ({ provider: 'fake', model: 'fake-1', promptVersion: 'test' }),
    async generateStructured<T>(request: StructuredRequest): Promise<T | null> {
      calls.push(request)
      return answer(request) as T | null
    },
  }
}

describe('LLM provider abstraction', () => {
  afterEach(() => setLlmProvider(null))

  it('answers null everywhere when no endpoint is configured (deterministic fallback)', async () => {
    expect(getLlmProvider().enabled()).toBe(false)
    expect(activeModelConfig()).toBeNull()
    expect(await extractBriefWithLlm('Luma için premium serum kutusu')).toBeNull()
    expect(await interpretFeedbackWithLlm('Çok boş')).toBeNull()
    const heuristic = await interpretFeedback('Çok boş')
    expect(heuristic.llmUsed).toBe(false)
    expect(heuristic.feedback).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'composition', target: 'density', direction: 'increase' })]),
    )
  })

  it('stamps LLM extraction as LLM_INFERRED and never lets it overwrite an explicit user value', async () => {
    const calls: StructuredRequest[] = []
    setLlmProvider(
      fakeProvider(
        (request) =>
          request.task === 'brief-extract' ? { brandName: 'Luma', productName: 'Luma', styleType: 'classic', colors: 'Krem' } : null,
        calls,
      ),
    )
    const patch = await extractBriefWithLlm('Luma serum')
    expect(calls[0]?.task).toBe('brief-extract')
    expect(patch?.brandName).toBe('Luma')
    expect(patch?.productName).toBeUndefined()
    expect(patch?.provenance?.brandName).toEqual({ source: 'LLM_INFERRED', confidence: LLM_EXTRACT_CONFIDENCE })

    const user = mergeBrief(emptyBrief(), {
      styleType: 'luxury',
      provenance: { styleType: { source: 'USER_EXPLICIT', confidence: 1 } },
    })
    const merged = mergeBrief(user, patch ?? {})
    expect(merged.styleType).toBe('luxury')
    expect(merged.provenance?.styleType?.source).toBe('USER_EXPLICIT')
    expect(merged.colors).toBe('Krem')
    expect(merged.provenance?.colors?.source).toBe('LLM_INFERRED')
    expect(activeModelConfig()).toEqual({ provider: 'fake', model: 'fake-1', promptVersion: 'test' })
  })

  it('merges LLM feedback rows into the heuristic classification and drops out-of-vocabulary rows', async () => {
    setLlmProvider(
      fakeProvider((request) =>
        request.task === 'feedback-interpret'
          ? {
              feedback: [
                { type: 'whitespace', target: 'air', direction: 'increase', strength: 'high' },
                { type: 'composition', target: 'density', direction: 'increase', strength: 'medium' },
                { type: 'geometry', target: 'x', direction: 'move 12mm' },
              ],
            }
          : null,
      ),
    )
    const result = await interpretFeedback('Çok boş')
    expect(result.llmUsed).toBe(true)
    expect(result.feedback.filter((row) => row.type === 'composition' && row.direction === 'increase')).toHaveLength(1)
    expect(result.feedback).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'whitespace', direction: 'increase', strength: 'high' })]))
    expect(result.feedback.some((row) => (row.type as string) === 'geometry')).toBe(false)
  })

  it('survives a broken provider', async () => {
    setLlmProvider(fakeProvider(() => 'not json at all'))
    expect(await extractBriefWithLlm('x')).toBeNull()
    const result = await interpretFeedback('Logo çok aşağıda')
    expect(result.feedback).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'hierarchy', direction: 'move_up' })]))
  })
})
