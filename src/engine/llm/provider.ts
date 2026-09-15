/**
 * LLM provider abstraction — the only door between Paxolab and a language model.
 *
 * The LLM is the language / reasoning layer: brief extraction, feedback interpretation,
 * complex critique, copy. It never owns SVG geometry, layout, or design rules.
 * Design Brain modules import types from here, never a vendor client.
 *
 * Default provider: OpenAI-compatible chat endpoint (VITE_FORMA_LLM_URL). When no
 * endpoint is configured the null provider answers `null` and callers fall back to
 * the deterministic heuristics. Tests swap providers with `setLlmProvider`.
 */
import { llmComplete, parseLlmJson } from './client'

export type LlmTask = 'brief-extract' | 'feedback-interpret' | 'critique' | 'copy' | 'intent' | 'studio-direct'

/** Recorded on every decision log so historic designs stay explainable. */
export type LlmModelConfig = {
  provider: string
  model: string
  /** Prompt-contract version; bump when a system prompt changes shape. */
  promptVersion: string
}

export type StructuredRequest = {
  task: LlmTask
  system: string
  user: string
  timeoutMs?: number
}

export interface LLMProvider {
  /** False for the null provider — callers must use deterministic fallbacks. */
  enabled(): boolean
  config(): LlmModelConfig
  /** JSON-only completion. Returns null on transport / parse failure; never throws. */
  generateStructured<T>(request: StructuredRequest): Promise<T | null>
}

export const PROMPT_VERSION = '2026-09-16'

const DEFAULT_MODEL = 'gpt-4o-mini'

function configuredModel(): string {
  const env = import.meta.env as Record<string, string | undefined>
  return env.VITE_FORMA_LLM_MODEL?.trim() || DEFAULT_MODEL
}

export class NullLlmProvider implements LLMProvider {
  enabled(): boolean {
    return false
  }
  config(): LlmModelConfig {
    return { provider: 'none', model: 'heuristics', promptVersion: PROMPT_VERSION }
  }
  async generateStructured<T>(): Promise<T | null> {
    return null
  }
}

export class OpenAiCompatibleProvider implements LLMProvider {
  private readonly model: string

  constructor(model = configuredModel()) {
    this.model = model
  }

  enabled(): boolean {
    return !!import.meta.env.VITE_FORMA_LLM_URL
  }

  config(): LlmModelConfig {
    return { provider: 'openai-compatible', model: this.model, promptVersion: PROMPT_VERSION }
  }

  async generateStructured<T>(request: StructuredRequest): Promise<T | null> {
    if (!this.enabled()) return null
    const content = await llmComplete(
      [
        { role: 'system', content: request.system },
        { role: 'user', content: request.user },
      ],
      { json: true, timeoutMs: request.timeoutMs ?? 8000, model: this.model },
    )
    if (!content) return null
    return parseLlmJson<T>(content)
  }
}

let active: LLMProvider | null = null

export function getLlmProvider(): LLMProvider {
  if (active) return active
  active = import.meta.env.VITE_FORMA_LLM_URL ? new OpenAiCompatibleProvider() : new NullLlmProvider()
  return active
}

/** Test / integration hook. Pass null to restore the environment default. */
export function setLlmProvider(provider: LLMProvider | null): void {
  active = provider
}

/** Model config to stamp on logs; null when heuristics answered. */
export function activeModelConfig(): LlmModelConfig | null {
  const provider = getLlmProvider()
  return provider.enabled() ? provider.config() : null
}
