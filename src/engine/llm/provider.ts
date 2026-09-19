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
 *
 * Since F-7 a request may carry images. The three `vision-*` tasks send a rendered face (or a
 * customer's reference) alongside the text; the provider turns them into multimodal content
 * parts. Text-only tasks are unchanged — `images` is simply absent.
 */
import { llmComplete, llmEnabled, llmModelName, parseLlmJson, type LlmContentPart } from './client'

export type LlmTask =
  | 'brief-extract'
  | 'feedback-interpret'
  | 'critique'
  | 'copy'
  | 'intent'
  | 'studio-direct'
  | 'vision-critique'
  | 'vision-reference'
  | 'vision-compare'

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
  /** Image URLs (`data:` or https) shown with the user text. Only the vision tasks set this. */
  images?: string[]
}

export interface LLMProvider {
  /** False for the null provider — callers must use deterministic fallbacks. */
  enabled(): boolean
  config(): LlmModelConfig
  /** JSON-only completion. Returns null on transport / parse failure; never throws. */
  generateStructured<T>(request: StructuredRequest): Promise<T | null>
}

// F-4 widened the studio-direct contract; F-7 added the vision tasks.
export const PROMPT_VERSION = '2026-09-18'

const DEFAULT_MODEL = 'gpt-4o-mini'

/**
 * The model name is reported by the server, which is the only side that knows it.
 *
 * It used to come from `VITE_FORMA_LLM_MODEL` in the bundle, alongside the URL and key. Those are
 * gone; this value is only ever stamped on a decision log, so before the status probe lands the
 * default stands in and nothing downstream changes.
 */
function configuredModel(): string {
  return llmModelName() || DEFAULT_MODEL
}

/** The user turn as the endpoint expects it: a string, or text + image parts when images travel. */
export function userContent(request: StructuredRequest): string | LlmContentPart[] {
  const images = (request.images ?? []).filter((url) => typeof url === 'string' && url.length > 0)
  if (!images.length) return request.user
  return [
    { type: 'text', text: request.user },
    // `low` detail: a label face is read for hierarchy and balance, not for a stroke width.
    ...images.map((url) => ({ type: 'image_url' as const, image_url: { url, detail: 'low' as const } })),
  ]
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
  private readonly model: string | null

  constructor(model?: string) {
    // Resolved per call when not pinned: the status probe may land after this is constructed.
    this.model = model ?? null
  }

  enabled(): boolean {
    return llmEnabled()
  }

  config(): LlmModelConfig {
    return { provider: 'openai-compatible', model: this.model ?? configuredModel(), promptVersion: PROMPT_VERSION }
  }

  async generateStructured<T>(request: StructuredRequest): Promise<T | null> {
    if (!this.enabled()) return null
    const content = await llmComplete(
      [
        { role: 'system', content: request.system },
        { role: 'user', content: userContent(request) },
      ],
      { json: true, timeoutMs: request.timeoutMs ?? 8000, model: this.model ?? undefined },
    )
    if (!content) return null
    return parseLlmJson<T>(content)
  }
}

let active: LLMProvider | null = null

/**
 * Whether a model is reachable is now the server's answer, and it arrives asynchronously.
 *
 * This used to branch on `import.meta.env.VITE_FORMA_LLM_URL` and pick `NullLlmProvider` forever
 * when it was unset. With the URL on the server there is nothing to read at construction time, so
 * the compatible provider is always the one returned and `enabled()` carries the question — it
 * reports false until the status probe lands and whenever nobody is signed in, and every caller
 * already treats a disabled provider and a null answer the same way.
 */
export function getLlmProvider(): LLMProvider {
  if (active) return active
  active = new OpenAiCompatibleProvider()
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
