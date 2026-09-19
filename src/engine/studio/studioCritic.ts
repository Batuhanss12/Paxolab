/**
 * D2 studio critic — ledger findings become existing C6 direction buttons.
 * Does not rewrite SVG, does not open kit repairPlan, does not pick a winner.
 */
import type { DirectionTalk } from './directionTalk'
import type { StudioCriticKind, StudioCriticOffer, Temperament } from './types'

const ALREADY_QUIET: ReadonlySet<Temperament> = new Set(['light-luxe', 'clean-clinical'])

export const APPLY_STUDIO_CRITIC =
  /önerini?\s*uygula|kritik(?:in|i)?(?:ni)?\s*(?:öner(?:isini)?\s*)?uygula|apply\s+critic/i

export function talkForCritic(kind: StudioCriticKind): DirectionTalk {
  if (kind === 'quieter') {
    return {
      kind: 'vary',
      vetoFamilies: [],
      quieter: true,
      note: 'Aileyi koruyorum; yönü daha sakin bir varyasyona alıyorum.',
    }
  }
  if (kind === 'vision') {
    // The offer's own utterance is the change; the talk only keeps the family and re-paints.
    return {
      kind: 'pin',
      vetoFamilies: [],
      note: 'Görsel kritiğin önerisini aynı ailede uyguluyorum.',
    }
  }
  return {
    kind: 'vary',
    vetoFamilies: [],
    note: 'Aileyi koruyorum; aynı yönün kontrollü varyasyonunu uyguluyorum.',
  }
}

/** Crowding → quieter (keep family). Overflow or already-quiet crowding → vary. Type-fit is preflight, not a C6 button. */
export function studioCriticActions(input: {
  collisions: string[]
  outOfBounds: string[]
  temperament: Temperament
}): StudioCriticOffer[] {
  const crowded = input.collisions.length > 0
  const overflow = input.outOfBounds.length > 0
  if (!crowded && !overflow) return []
  /*
   * `reason` is read aloud in chat, so it says what is wrong with the design rather than which
   * structure noticed. "Ledger çarpışma (3)" named an internal data structure and then a raw count
   * — the customer cannot see the ledger, and the number is only meaningful next to a total they
   * were never shown. What they *can* see is that things are touching.
   */
  if (crowded && !ALREADY_QUIET.has(input.temperament)) {
    return [
      {
        kind: 'quieter',
        utterance: 'daha sakin olsun',
        reason: 'ön yüzde öğeler birbirine değiyor',
      },
    ]
  }
  return [
    {
      kind: 'vary',
      utterance: 'farklılaştır',
      reason: crowded ? 'ön yüzde öğeler birbirine değiyor' : 'bazı öğeler güvenli alanın dışına taşıyor',
    },
  ]
}

export function studioCriticOffer(actions: StudioCriticOffer[]): string {
  if (!actions.length) return ''
  const action = actions[0]
  return `Fark ettim: ${action.reason}. “${action.utterance}” yazarsan düzeltirim.`
}
