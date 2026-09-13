/**
 * Shared LLM client — OpenAI-compatible chat completions endpoint.
 * Reads VITE_FORMA_LLM_URL (and optional VITE_FORMA_LLM_KEY).
 * Returns null when no endpoint is configured or the request fails,
 * so callers can fall back to the local deterministic engine.
 */
export interface LlmMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LlmOptions {
  /** Force JSON object response format (OpenAI-compatible). */
  json?: boolean
  /** Abort timeout in ms (default 8000). */
  timeoutMs?: number
  /** Override model name (default gpt-4o-mini). */
  model?: string
}

/** True when an LLM endpoint is configured. */
export function llmEnabled(): boolean {
  return !!import.meta.env.VITE_FORMA_LLM_URL
}

/** Call the configured LLM endpoint. Returns content string or null on failure. */
export async function llmComplete(messages: LlmMessage[], opts: LlmOptions = {}): Promise<string | null> {
  const url = import.meta.env.VITE_FORMA_LLM_URL
  if (!url) return null
  const key = import.meta.env.VITE_FORMA_LLM_KEY
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (key) headers.Authorization = `Bearer ${key}`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      credentials: 'same-origin',
      signal: AbortSignal.timeout(opts.timeoutMs ?? 8000),
      body: JSON.stringify({
        model: opts.model ?? 'gpt-4o-mini',
        ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
        messages,
      }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    return data.choices?.[0]?.message?.content ?? null
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
