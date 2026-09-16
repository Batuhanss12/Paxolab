/// <reference types="vite/client" />

declare module '*.svg?raw' {
  const src: string
  export default src
}

interface ImportMetaEnv {
  readonly VITE_ENGINE?: string
  readonly VITE_FORMA_LLM_KEY?: string
  readonly VITE_FORMA_LLM_URL?: string
  readonly VITE_SITE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
