import type {
  AppPhase,
  Attachment,
  AwaitingKey,
  BottleShape,
  ChatMessage,
  DesignBrief,
  DesignSpec,
  TabId,
} from './types'
import { emptyConversationState, type ConversationState } from './engine/conversationState'
import { emptyBrief } from './engine/fields'
import type { StudioCriticOffer } from './engine/studio/types'

export type SurfaceView = 'box' | 'label'

export type AppState = {
  phase: AppPhase
  prompt: string
  pending: Attachment[]
  allAttachments: Attachment[]
  messages: ChatMessage[]
  brief: DesignBrief
  awaiting: AwaitingKey | null
  design: DesignSpec | null
  /** Kept when dual (kutu+etiket) so carton 3D/dieline is not overwritten by a label. */
  boxDesign: DesignSpec | null
  labelDesign: DesignSpec | null
  surfaceView: SurfaceView
  bottleShape: BottleShape | null
  designHistory: DesignSpec[]
  designFuture: DesignSpec[]
  typing: boolean
  generating: boolean
  inputsOpen: boolean
  tab: TabId
  showTemplates: boolean
  /**
   * Whether the four-design choice is on screen.
   *
   * It opens when a generation hands back an offer the customer has not answered, and closes the
   * moment they answer — by picking a direction or by keeping the one shown. It does not reopen on
   * every repaint: choosing a direction is itself a generation, and a chooser that came back after
   * each pick would be a loop rather than a decision.
   */
  directionChoiceOpen: boolean
  /** Asked / answered ledger — the chat never re-asks what the user already settled. */
  conversation: ConversationState
}

export type AppAction =
  | { type: 'reset' }
  | { type: 'hydrate'; state: Partial<AppState> }
  | { type: 'phase'; phase: AppPhase }
  | { type: 'prompt'; prompt: string }
  | { type: 'attachments.add'; attachments: Attachment[] }
  | { type: 'pending.remove'; id: string }
  | { type: 'pending.clear' }
  | { type: 'messages.add'; messages: ChatMessage[] }
  | { type: 'conversation'; brief: DesignBrief; awaiting: AwaitingKey | null; showTemplates: boolean; conversation?: ConversationState }
  | { type: 'brief'; brief: DesignBrief }
  | { type: 'awaiting'; awaiting: AwaitingKey | null }
  | { type: 'typing'; typing: boolean }
  | { type: 'generation.start' }
  | { type: 'generation.abort' }
  | { type: 'generation.finish'; design: DesignSpec; printReady: boolean }
  | { type: 'history.undo' }
  | { type: 'history.redo' }
  | { type: 'inputs.toggle' }
  | { type: 'tab'; tab: TabId }
  | { type: 'surfaceView'; surface: SurfaceView }
  | { type: 'bottleShape'; shape: BottleShape }
  | { type: 'design.live'; design: DesignSpec; commit?: boolean; historyFrom?: DesignSpec }
  /**
   * Critic offers that arrived after the design did — the vision pass is asynchronous. Applied only
   * while the same generation is still on screen (`generatedAt` guards it), and never to history.
   */
  | { type: 'design.critic'; generatedAt: number; critic: StudioCriticOffer[] }
  | { type: 'directionChoice'; open: boolean }

function slotDesign(design: DesignSpec, state: AppState): Pick<AppState, 'boxDesign' | 'labelDesign' | 'surfaceView'> {
  const isLabel = design.kind === 'label'
  return {
    boxDesign: isLabel ? state.boxDesign : design,
    labelDesign: isLabel ? design : state.labelDesign,
    surfaceView: isLabel ? 'label' : 'box',
  }
}

export function surfaceKind(brief: Pick<DesignBrief, 'packagingMode'> | null | undefined): SurfaceView {
  return brief?.packagingMode === 'label' ? 'label' : 'box'
}

/** DesignSpec.kind is packaging|label; UI/brief surface is box|label. */
export function designSurface(design: Pick<DesignSpec, 'kind'> | null | undefined): SurfaceView | null {
  if (!design) return null
  return design.kind === 'label' ? 'label' : 'box'
}

export function sameSurface(
  design: Pick<DesignSpec, 'kind'> | null | undefined,
  brief: Pick<DesignBrief, 'packagingMode'> | null | undefined,
): boolean {
  return designSurface(design) === surfaceKind(brief)
}

/** Previous revision for this surface only — never feed a carton into a label generate. */
export function prevForSurface(state: AppState, kind: SurfaceView): DesignSpec | null {
  if (designSurface(state.design) === kind) return state.design
  return kind === 'label' ? state.labelDesign : state.boxDesign
}

export function createInitialAppState(): AppState {
  return {
    phase: 'landing',
    prompt: '',
    pending: [],
    allAttachments: [],
    messages: [],
    brief: emptyBrief(),
    awaiting: null,
    design: null,
    boxDesign: null,
    labelDesign: null,
    surfaceView: 'box',
    bottleShape: null,
    designHistory: [],
    designFuture: [],
    typing: false,
    generating: false,
    inputsOpen: true,
    tab: 'vektor',
    showTemplates: false,
    directionChoiceOpen: false,
    conversation: emptyConversationState(),
  }
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'reset':
      return createInitialAppState()
    case 'hydrate': {
      /*
       * `allAttachments` used to be blanked here and in `restoredAppState`, on both restore paths.
       * The design on screen kept the logo baked into it, so nothing looked wrong — but the *next*
       * generation looks the logo up in the attachment list, finds an empty one, and quietly paints
       * a design without it. The customer's logo disappeared on the first refresh and there was no
       * way to tell why. Only `pending` is cleared: that is the composer's tray, not a record.
       */
      const merged = { ...createInitialAppState(), ...state, ...action.state, pending: [] }
      if (!merged.design) return merged
      const isLabel = merged.design.kind === 'label'
      return {
        ...merged,
        // Both slots are persisted now, so a restored dual project keeps the surface that is *not*
        // on screen. The fallbacks below only fill a slot the store did not have.
        boxDesign: isLabel ? merged.boxDesign : merged.boxDesign ?? merged.design,
        labelDesign: isLabel ? merged.labelDesign ?? merged.design : merged.labelDesign,
        surfaceView: isLabel ? 'label' : merged.labelDesign && merged.surfaceView === 'label' ? 'label' : 'box',
      }
    }
    case 'phase':
      return { ...state, phase: action.phase }
    case 'prompt':
      return { ...state, prompt: action.prompt }
    case 'attachments.add':
      return {
        ...state,
        pending: [...state.pending, ...action.attachments],
        allAttachments: [...state.allAttachments, ...action.attachments],
      }
    case 'pending.remove':
      return { ...state, pending: state.pending.filter((attachment) => attachment.id !== action.id) }
    case 'pending.clear':
      return { ...state, pending: [] }
    case 'messages.add':
      return { ...state, messages: [...state.messages, ...action.messages] }
    case 'conversation':
      return {
        ...state,
        brief: action.brief,
        awaiting: action.awaiting,
        showTemplates: action.showTemplates,
        conversation: action.conversation ?? state.conversation,
      }
    case 'brief':
      return { ...state, brief: action.brief }
    case 'awaiting':
      return { ...state, awaiting: action.awaiting }
    case 'typing':
      return { ...state, typing: action.typing }
    case 'generation.start':
      return { ...state, generating: true }
    case 'generation.abort':
      return { ...state, generating: false }
    case 'generation.finish': {
      const sameKind = Boolean(state.design && state.design.kind === action.design.kind)
      return {
        ...state,
        brief: action.design.brief,
        design: action.design,
        ...slotDesign(action.design, state),
        designHistory: sameKind && state.design ? [...state.designHistory, state.design].slice(-20) : [],
        bottleShape:
          action.design.kind === 'label'
            ? state.bottleShape ?? action.design.brief.bottleShape ?? null
            : state.bottleShape,
        designFuture: [],
        showTemplates: false,
        generating: false,
        /*
         * Open the chooser when this generation carries an offer the customer has not answered.
         * `sameKind` is the test that matters: the first carton of a session gets the choice, a
         * repaint of that same carton does not — otherwise picking a direction would hand back
         * the chooser that sent you there.
         */
        directionChoiceOpen: !sameKind && (action.design.studio?.offer?.candidates.length ?? 0) > 1,
        tab: action.printReady ? 'uretim' : state.tab === 'konusma' ? 'vektor' : state.tab,
      }
    }
    case 'directionChoice':
      return { ...state, directionChoiceOpen: action.open }
    case 'history.undo': {
      const previous = state.designHistory.at(-1)
      if (!previous || !state.design) return state
      return {
        ...state,
        brief: previous.brief,
        design: previous,
        ...slotDesign(previous, state),
        designHistory: state.designHistory.slice(0, -1),
        designFuture: [state.design, ...state.designFuture].slice(0, 20),
      }
    }
    case 'history.redo': {
      const next = state.designFuture[0]
      if (!next || !state.design) return state
      return {
        ...state,
        brief: next.brief,
        design: next,
        ...slotDesign(next, state),
        designHistory: [...state.designHistory, state.design].slice(-20),
        designFuture: state.designFuture.slice(1),
      }
    }
    case 'inputs.toggle':
      return { ...state, inputsOpen: !state.inputsOpen }
    case 'tab':
      return { ...state, tab: action.tab }
    case 'surfaceView': {
      const next = action.surface === 'label' ? state.labelDesign : state.boxDesign
      if (!next) return { ...state, surfaceView: action.surface }
      return {
        ...state,
        surfaceView: action.surface,
        design: next,
        brief: next.brief,
        showTemplates: false,
        designHistory: [],
        designFuture: [],
      }
    }
    case 'bottleShape':
      return {
        ...state,
        bottleShape: action.shape,
        brief: { ...state.brief, bottleShape: action.shape },
      }
    case 'design.critic': {
      const design = state.design
      if (!design?.studio || design.generatedAt !== action.generatedAt || !action.critic.length) return state
      const seen = new Set(design.studio.critic.map((row) => `${row.kind}:${row.utterance}`))
      const fresh = action.critic.filter((row) => !seen.has(`${row.kind}:${row.utterance}`))
      if (!fresh.length) return state
      const next = { ...design, studio: { ...design.studio, critic: [...design.studio.critic, ...fresh] } }
      return { ...state, design: next, ...slotDesign(next, state) }
    }
    case 'design.live': {
      const history =
        action.commit && action.historyFrom
          ? [...state.designHistory, action.historyFrom].slice(-20)
          : state.designHistory
      return {
        ...state,
        brief: action.design.brief,
        design: action.design,
        ...slotDesign(action.design, state),
        designHistory: history,
        designFuture: action.commit ? [] : state.designFuture,
      }
    }
  }
}
