/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENGINE?: string
  readonly VITE_FORMA_LLM_KEY?: string
  readonly VITE_FORMA_LLM_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
