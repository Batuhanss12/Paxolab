/**
 * LLM integration layer — optional, falls back to local deterministic engine.
 * Enable by setting VITE_FORMA_LLM_URL (OpenAI-compatible endpoint).
 * Optional VITE_FORMA_LLM_KEY for Bearer auth, VITE_FORMA_LLM_MODEL for the model id.
 */
export { llmComplete, llmEnabled, parseLlmJson, type LlmMessage, type LlmOptions } from './client'
export {
  activeModelConfig,
  getLlmProvider,
  setLlmProvider,
  NullLlmProvider,
  OpenAiCompatibleProvider,
  PROMPT_VERSION,
  type LLMProvider,
  type LlmModelConfig,
  type LlmTask,
  type StructuredRequest,
} from './provider'
export { generateCopyWithLlm, type LlmCopy } from './copyLlm'
export { parseIntentWithLlm } from './parseIntentLlm'
export { interpretFeedback, interpretFeedbackWithLlm } from './feedbackLlm'
export { critiqueWithLlm } from './critiqueLlm'
export { studioDirectionWithLlm } from './studioDirectorLlm'
