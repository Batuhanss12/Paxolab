import type {
  AppPhase,
  Attachment,
  AwaitingKey,
  ChatMessage,
  DesignBrief,
  DesignSpec,
  TabId,
} from './types'
import { emptyBrief } from './engine/fields'

export type AppState = {
  phase: AppPhase
  prompt: string
  pending: Attachment[]
  allAttachments: Attachment[]
  messages: ChatMessage[]
  brief: DesignBrief
  awaiting: AwaitingKey | null
  design: DesignSpec | null
  designHistory: DesignSpec[]
  designFuture: DesignSpec[]
  typing: boolean
  generating: boolean
  inputsOpen: boolean
  tab: TabId
  showTemplates: boolean
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
  | { type: 'conversation'; brief: DesignBrief; awaiting: AwaitingKey | null; showTemplates: boolean }
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
    designHistory: [],
    designFuture: [],
    typing: false,
    generating: false,
    inputsOpen: true,
    tab: 'vektor',
    showTemplates: false,
  }
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'reset':
      return createInitialAppState()
    case 'hydrate':
      return { ...state, ...action.state, pending: [], allAttachments: [] }
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
    case 'generation.finish':
      return {
        ...state,
        brief: action.design.brief,
        design: action.design,
        designHistory: state.design ? [...state.designHistory, state.design].slice(-20) : state.designHistory,
        designFuture: [],
        showTemplates: false,
        generating: false,
        tab: action.printReady ? 'uretim' : state.tab === 'konusma' ? 'vektor' : state.tab,
      }
    case 'history.undo': {
      const previous = state.designHistory.at(-1)
      if (!previous || !state.design) return state
      return {
        ...state,
        brief: previous.brief,
        design: previous,
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
        designHistory: [...state.designHistory, state.design].slice(-20),
        designFuture: state.designFuture.slice(1),
      }
    }
    case 'inputs.toggle':
      return { ...state, inputsOpen: !state.inputsOpen }
    case 'tab':
      return { ...state, tab: action.tab }
  }
}
