/**
 * LLM integration layer — optional, falls back to local deterministic engine.
 * Enable by setting VITE_FORMA_LLM_URL (OpenAI-compatible endpoint).
 * Optional VITE_FORMA_LLM_KEY for Bearer auth.
 */
export { llmComplete, llmEnabled, parseLlmJson, type LlmMessage, type LlmOptions } from './client'
export { generateCopyWithLlm, type LlmCopy } from './copyLlm'
export { parseIntentWithLlm } from './parseIntentLlm'
