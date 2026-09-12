import type { EnginePort, GenerateInput } from './EnginePort'
import { FormaLocalEngine } from './FormaLocalEngine'
import type { DesignSpec } from '../types'

/** Dev-only stand-in. Same port, local engine under the hood — no external HTTP. */
export class FormaMockEngine implements EnginePort {
  private inner = new FormaLocalEngine()

  generate(input: GenerateInput): DesignSpec {
    return this.inner.generate(input)
  }
}
