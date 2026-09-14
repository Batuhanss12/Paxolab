/**
 * Side-panel verbal role — manifesto / claim icons / benefit verbs.
 * Refs are bars, not lines to copy.
 */
import type { CopyLocale } from '../../types'
import type { DesignSystem } from '../designSystem/types'

export type SideFill = {
  kind: 'manifesto' | 'claims' | 'verbs'
  lines: string[]
  script?: string
}

export function sideFill(system: DesignSystem, locale: CopyLocale): SideFill | null {
  const { sector } = system
  const en = locale === 'en'
  if (sector === 'perfume') {
    return {
      kind: 'manifesto',
      lines: en
        ? ['A quiet trace.', 'Opens on skin.', 'Stays in the room.']
        : ['Sessiz bir iz.', 'Tenle açılır.', 'Odada kalır.'],
      script: en ? 'trace' : 'iz',
    }
  }
  if (sector === 'food' || sector === 'beverage') {
    return {
      kind: 'claims',
      lines: en ? ['LOCAL', 'PLAIN', 'TABLE'] : ['YEREL', 'SAF', 'SOFRA'],
    }
  }
  if (sector === 'cream' || sector === 'serum' || sector === 'baby' || sector === 'health') {
    return {
      kind: 'verbs',
      lines: en ? ['REPAIRS', 'SOFTENS', 'HOLDS'] : ['ONARIR', 'NEMLENDİRİR', 'KORUR'],
    }
  }
  return null
}
