import './shims/buffer-global'
import { Component, StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { primeLlmStatus } from './engine/llm/client'

/*
 * Ask the server once whether a model is configured.
 *
 * The answer used to be readable in the bundle — it was `VITE_FORMA_LLM_URL`, which is exactly the
 * problem: a `VITE_`-prefixed value is inlined at build time, so the endpoint and its key shipped
 * to every visitor. It lives on the server now, so the studio has to ask, and it asks once here
 * rather than on the first task. Deliberately not awaited: every LLM task already falls back to
 * the deterministic engine, so the page must not wait on this to render.
 */
void primeLlmStatus()

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'monospace', color: '#c9a86c', background: '#0a0a0a', minHeight: '100vh' }}>
          <h2 style={{ margin: '0 0 12px' }}>Runtime Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
