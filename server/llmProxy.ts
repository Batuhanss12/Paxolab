/**
 * Server-side LLM proxy — the provider key never reaches a browser.
 *
 * The engine used to call the model endpoint straight from the page, reading
 * `import.meta.env.VITE_FORMA_LLM_KEY`. Vite *inlines* anything prefixed `VITE_` into the bundle
 * at build time, so configuring a key would have published it: every visitor could read it out of
 * the served JavaScript and spend the account it belongs to. The same is true of a self-hosted
 * endpoint — `VITE_FORMA_LLM_URL` in the bundle is an open, unauthenticated GPU for anyone who
 * opens dev tools.
 *
 * So the credentials live here, in `process.env` with no `VITE_` prefix, and the browser posts to
 * this route instead. Three properties this preserves:
 *
 *   - **Unconfigured is the normal case.** With no `FORMA_LLM_URL` the route reports disabled and
 *     the client falls back to the deterministic engine, exactly as today.
 *   - **It is not an open proxy.** The route requires a signed-in user; otherwise the key or the
 *     GPU behind it is free for the internet to use through us.
 *   - **It does not become a chat API.** Only the engine's own tasks go through it: the system
 *     prompt is bounded, the model is chosen here rather than by the caller, and the body is
 *     capped because vision tasks carry rendered faces as data URLs.
 */
import type { Context } from 'hono'

export type ProxyMessage = {
  role: 'system' | 'user' | 'assistant'
  content: unknown
}

export type LlmProxyRequest = {
  messages?: ProxyMessage[]
  json?: boolean
  timeoutMs?: number
}

/** Configured endpoint, or '' when the deterministic engine is meant to answer. */
export function llmUrl(): string {
  return (process.env.FORMA_LLM_URL ?? '').trim()
}

export function llmModel(): string {
  return (process.env.FORMA_LLM_MODEL ?? '').trim() || 'gpt-4o-mini'
}

function llmKey(): string {
  return (process.env.FORMA_LLM_KEY ?? '').trim()
}

/**
 * Body cap for a proxied call.
 *
 * A vision task sends a rendered face as a `data:` URL, which is roughly 4/3 the size of the PNG.
 * Two low-detail faces land near 1 MB; 4 MB leaves room without letting the route be used to push
 * arbitrary payloads at the provider on our account.
 */
export function llmMaxBodyBytes(): number {
  const raw = Number(process.env.FORMA_LLM_MAX_BODY_BYTES)
  return Number.isFinite(raw) && raw > 0 ? raw : 4 * 1024 * 1024
}

/** Hard ceiling on how long a single task may hold a connection. */
const MAX_TIMEOUT_MS = 20_000
const DEFAULT_TIMEOUT_MS = 8_000

export function resolveTimeout(requested: unknown): number {
  const n = Number(requested)
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_TIMEOUT_MS
  return Math.min(Math.round(n), MAX_TIMEOUT_MS)
}

/**
 * Messages are accepted only in the shape the engine's tasks produce.
 *
 * Without this the route would forward whatever it was handed, which turns a packaging tool into a
 * general-purpose model endpoint running on the owner's key. Roles are checked, the count is
 * bounded, and content is either a string or the OpenAI-compatible parts array the vision tasks
 * use — nothing else passes.
 */
export function validMessages(input: unknown): ProxyMessage[] | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > 8) return null
  const out: ProxyMessage[] = []
  for (const row of input) {
    if (!row || typeof row !== 'object') return null
    const { role, content } = row as ProxyMessage
    if (role !== 'system' && role !== 'user' && role !== 'assistant') return null
    if (typeof content === 'string') {
      if (!content.length) return null
    } else if (Array.isArray(content)) {
      for (const part of content) {
        if (!part || typeof part !== 'object') return null
        const kind = (part as { type?: unknown }).type
        if (kind !== 'text' && kind !== 'image_url') return null
      }
    } else {
      return null
    }
    out.push({ role, content })
  }
  return out
}

export type ProxyOutcome =
  | { ok: true; content: string }
  | { ok: false; status: 400 | 503 | 502; error: string }

/** Forward one task to the configured endpoint. Never throws; callers map the outcome to a response. */
export async function forwardToProvider(body: LlmProxyRequest): Promise<ProxyOutcome> {
  const url = llmUrl()
  if (!url) return { ok: false, status: 503, error: 'Model uç noktası tanımlı değil.' }
  const messages = validMessages(body.messages)
  if (!messages) return { ok: false, status: 400, error: 'Geçersiz istek.' }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const key = llmKey()
  if (key) headers.Authorization = `Bearer ${key}`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      signal: AbortSignal.timeout(resolveTimeout(body.timeoutMs)),
      body: JSON.stringify({
        model: llmModel(),
        ...(body.json ? { response_format: { type: 'json_object' } } : {}),
        messages,
      }),
    })
    if (!res.ok) return { ok: false, status: 502, error: 'Model yanıt vermedi.' }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    const content = data.choices?.[0]?.message?.content
    if (typeof content !== 'string' || !content) return { ok: false, status: 502, error: 'Model boş yanıt verdi.' }
    return { ok: true, content }
  } catch {
    // A timeout, a DNS failure, a model that is still loading. The client falls back either way.
    return { ok: false, status: 502, error: 'Model yanıt vermedi.' }
  }
}

/** `GET /api/llm/status` — lets the client decide whether to try at all. Exposes no secret. */
export function llmStatus(c: Context): Response {
  return c.json({ enabled: !!llmUrl(), model: llmUrl() ? llmModel() : '' })
}
