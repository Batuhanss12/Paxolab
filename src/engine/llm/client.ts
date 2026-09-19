/**
 * Shared LLM client — talks to this app's server, never to a model provider.
 *
 * It used to `fetch` the provider endpoint directly, reading `import.meta.env.VITE_FORMA_LLM_URL`
 * and `VITE_FORMA_LLM_KEY`. Vite **inlines** every `VITE_`-prefixed value into the bundle at build
 * time, so the moment a key was configured it was published: readable in the served JavaScript by
 * anyone who opened dev tools, on an account the owner pays for. A self-hosted URL is no safer —
 * in the bundle it is an unauthenticated GPU with the address written on it.
 *
 * So the credentials moved to `server/llmProxy.ts`, in `process.env` with no `VITE_` prefix, and
 * this module posts to `/api/llm/complete` instead. Everything above it is unchanged: `null` still
 * means "the deterministic engine answers this one", which is what happens when nothing is
 * configured, when the user is signed out, when the model times out, or when it returns nonsense.
 */
import { apiRequest, getToken } from '../../api/client'

/**
 * One part of a multimodal message. Text-only callers keep passing a string; the vision tasks
 * pass parts, in the OpenAI-compatible shape every current endpoint accepts. Image URLs may be
 * `data:` URLs — that is how a rendered face travels without ever being uploaded anywhere.
 */
export type LlmContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; detail?: 'low' | 'high' | 'auto' } }

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | LlmContentPart[]
}

export interface LlmOptions {
  /** Force JSON object response format (OpenAI-compatible). */
  json?: boolean
  /** Abort timeout in ms (default 8000). The server caps this. */
  timeoutMs?: number
  /** Accepted for source compatibility; the server chooses the model it is configured for. */
  model?: string
}

/**
 * What the server reported at `/api/llm/status`, once known.
 *
 * `llmEnabled()` is called synchronously while choosing a provider, and the answer now lives on
 * the server, so it is probed once and cached. Until the probe lands the answer is "no", which is
 * the safe direction: the deterministic engine draws the design either way, and the only cost of
 * a false negative is that the very first task of a session is not model-written.
 */
let status: { enabled: boolean; model: string } | null = null
let probe: Promise<void> | null = null

export function primeLlmStatus(): Promise<void> {
  if (probe) return probe
  probe = apiRequest<{ enabled?: boolean; model?: string }>('/api/llm/status', { auth: false })
    .then((res) => {
      status = { enabled: !!res.enabled, model: res.model ?? '' }
    })
    .catch(() => {
      // No server, or it is not reachable. Heuristics answer; nothing is broken.
      status = { enabled: false, model: '' }
    })
  return probe
}

/** Test hook: set the cached status directly. Pass null to force a fresh probe. */
export function setLlmStatus(next: { enabled: boolean; model: string } | null): void {
  status = next
  probe = next ? Promise.resolve() : null
}

/** True when the server has an endpoint configured and somebody is signed in to use it. */
export function llmEnabled(): boolean {
  return !!status?.enabled && !!getToken()
}

/** Model name the server is configured for; '' when heuristics answer. */
export function llmModelName(): string {
  return status?.enabled ? status.model : ''
}

/** Run one task through the server proxy. Returns content, or null so the caller falls back. */
export async function llmComplete(messages: LlmMessage[], opts: LlmOptions = {}): Promise<string | null> {
  if (!status) await primeLlmStatus()
  if (!status?.enabled) return null
  // Unauthenticated calls would be refused by the proxy; not making them keeps a signed-out
  // session from producing a 401 for every task it runs.
  if (!getToken()) return null
  try {
    const res = await apiRequest<{ content?: string }>('/api/llm/complete', {
      body: { messages, json: opts.json, timeoutMs: opts.timeoutMs ?? 8000 },
    })
    return res.content ?? null
  } catch {
    return null
  }
}

/** Parse JSON content from LLM, returning null on parse failure. */
export function parseLlmJson<T>(content: string): T | null {
  try {
    return JSON.parse(content) as T
  } catch {
    return null
  }
}
