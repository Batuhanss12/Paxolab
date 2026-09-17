import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { appReducer, createInitialAppState, prevForSurface, sameSurface, surfaceKind, type SurfaceView } from './appState'
import { Landing } from './components/Landing'
import { MockPayPage } from './components/MockPayPage'
import { Workspace } from './components/Workspace'
import { openingReply, runConversation, runConversationAsync } from './engine/conversation'
import { getEngine } from './engine/EnginePort'
import { emptyBrief, mergeBrief, uid } from './engine/fields'
import { styleLabel } from './engine/styles'
import { getTemplate } from './engine/catalog/catalog'
import { extractBriefWithLlm } from './engine/nlu'
import { generateCopyWithLlm, interpretFeedback, studioDirectionWithLlm } from './engine/llm'
import { analyzeReferenceImageRich, analysisToBriefPatch } from './engine/referenceAnalysis'
import { ApiError, loadAuth, type AuthUser } from './api/client'
import {
  commitReservation,
  refundReservation,
  reserveCredits,
} from './api/credits'
import {
  hydrateFromCloudAfterLogin,
  loadCloudProjectById,
  loadSession,
  saveSession,
  setCloudProjectId,
  syncSessionToCloud,
} from './projectStore'
import { getActiveProjectId, loadProject, saveProject } from './storage'
import { initDecisionLog, initDesignKnowledge, initDesignMemory, initLearning } from './engine/brain'
import { applyVetoToHints, familyTalk, hintsFromFamily } from './engine/studio/family'
import { temperamentTalk } from './engine/studio/temperament'
import type { StudioFamily, Temperament } from './engine/studio/types'
import { recommendBottleShape } from './engine/label/bottleShape'
import { recomposeCopy, type CopyField } from './engine/studio/recomposeCopy'
import type { Attachment, BottleShape, ChatMessage, DesignBrief, DesignSpec, DimensionsMm, StyleType, TabId } from './types'

const engine = getEngine()

function tabAfterStudioEdit(kind: DesignSpec['kind'], tab: TabId): TabId {
  if (tab !== 'konusma') return tab
  return kind === 'label' ? 'vektor' : 'dieline'
}

function liveOnSurface(design: DesignSpec | null, brief: DesignBrief): design is DesignSpec {
  return sameSurface(design, brief)
}

function restoredAppState() {
  return {
    ...createInitialAppState(),
    ...(loadSession() ?? {}),
    pending: [],
    allAttachments: [],
  }
}

function readFiles(list: FileList | null): Promise<Attachment[]> {
  if (!list) return Promise.resolve([])
  const files = [...list].filter((f) => f.type.startsWith('image/'))
  return Promise.all(
    files.map(
      (file) =>
        new Promise<Attachment>((resolve, reject) => {
          const reader = new FileReader()
          reader.onerror = () => reject(new Error('read'))
          reader.onload = () => {
            resolve({
              id: uid(),
              name: file.name,
              kind: /logo/i.test(file.name) ? 'logo' : 'referans',
              dataUrl: String(reader.result),
            })
          }
          reader.readAsDataURL(file)
        }),
    ),
  )
}

/** Panel deep-link: /?handoff=…&project=<id> targets one cloud project. */
function readDeepLinkProjectId(): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('project')
}

export default function App() {
  const [state, dispatch] = useReducer(appReducer, undefined, restoredAppState)
  const {
    phase,
    prompt,
    pending,
    allAttachments,
    messages,
    brief,
    awaiting,
    design,
    boxDesign,
    labelDesign,
    surfaceView,
    bottleShape,
    designHistory,
    designFuture,
    typing,
    generating,
    inputsOpen,
    tab,
    showTemplates,
  } = state

  const briefRef = useRef(brief)
  const awaitingRef = useRef(awaiting)
  const designRef = useRef(design)
  const copyBaseRef = useRef<DesignSpec | null>(null)
  const attachRef = useRef(allAttachments)
  const startedRef = useRef(messages.length > 0)
  const stateRef = useRef(state)
  const [syncNote, setSyncNote] = useState<string | null>(null)
  const syncNoteTimer = useRef(0)
  const [creditsRefreshKey, setCreditsRefreshKey] = useState(0)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Initialize persistent design memory + load active project from IndexedDB.
  useEffect(() => {
    initDesignMemory()
    initDecisionLog()
    initDesignKnowledge()
    initLearning()
    const activeId = getActiveProjectId()
    if (!activeId) return
    void loadProject(activeId)
      .then((loaded) => {
        if (loaded) dispatch({ type: 'hydrate', state: loaded })
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveSession(state)
      void saveProject(state).catch(() => {})
    }, 250)
    return () => window.clearTimeout(timer)
  }, [state])

  useEffect(() => {
    if (!loadAuth()?.token) return
    const timer = window.setTimeout(() => {
      void syncSessionToCloud(state)
    }, 900)
    return () => window.clearTimeout(timer)
  }, [state])

  const flashNote = useCallback((note: string) => {
    setSyncNote(note)
    window.clearTimeout(syncNoteTimer.current)
    syncNoteTimer.current = window.setTimeout(() => setSyncNote(null), 5000)
  }, [])

  // Phase 8: refresh balance after iyzico / mock redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const billing = params.get('billing')
    if (billing === 'success' || billing === 'fail') {
      setCreditsRefreshKey((k) => k + 1)
      if (billing === 'success') {
        flashNote('Ödeme başarılı — kredi bakiyesi güncellendi.')
      } else {
        flashNote('Ödeme tamamlanamadı.')
      }
      params.delete('billing')
      const next = params.toString()
      const url = `${window.location.pathname}${next ? `?${next}` : ''}${window.location.hash}`
      window.history.replaceState({}, '', url)
    }
  }, [flashNote])

  const authUserIdRef = useRef<string | null>(loadAuth()?.user?.id ?? null)
  const deepLinkProjectRef = useRef<string | null>(readDeepLinkProjectId())

  const onLoadCloudProject = useCallback(
    async (projectId: string) => {
      const result = await loadCloudProjectById(projectId)
      if (result.kind === 'loaded') {
        dispatch({ type: 'hydrate', state: result.state })
        if (result.state.design) designRef.current = result.state.design
        if (result.state.brief) briefRef.current = result.state.brief
        if (result.state.awaiting !== undefined) awaitingRef.current = result.state.awaiting ?? null
        if (result.state.messages && result.state.messages.length > 0) startedRef.current = true
      }
      flashNote(result.note)
    },
    [flashNote],
  )

  const onAuthChange = useCallback(
    (user: AuthUser | null) => {
      // Deep-link wins over "latest project" hydration; consumed exactly once.
      const deepLinkProjectId = deepLinkProjectRef.current
      if (deepLinkProjectId && user) {
        deepLinkProjectRef.current = null
        authUserIdRef.current = user.id
        void onLoadCloudProject(deepLinkProjectId)
        return
      }
      const nextId = user?.id ?? null
      if (authUserIdRef.current === nextId) return
      const wasLoggedIn = !!authUserIdRef.current
      authUserIdRef.current = nextId
      if (!user) {
        setCloudProjectId(null)
        if (wasLoggedIn) flashNote('Misafir modu — yerel kayıt.')
        return
      }
      void hydrateFromCloudAfterLogin(stateRef.current).then((result) => {
        if (result.kind === 'loaded') {
          dispatch({ type: 'hydrate', state: result.state })
          if (result.state.design) designRef.current = result.state.design
          if (result.state.brief) briefRef.current = result.state.brief
          if (result.state.awaiting !== undefined) awaitingRef.current = result.state.awaiting ?? null
          if (result.state.messages && result.state.messages.length > 0) startedRef.current = true
        }
        flashNote(result.note)
      })
    },
    [flashNote, onLoadCloudProject],
  )

  const reset = useCallback(() => {
    dispatch({ type: 'reset' })
    attachRef.current = []
    const fresh = emptyBrief()
    briefRef.current = fresh
    awaitingRef.current = null
    designRef.current = null
    startedRef.current = false
  }, [])

  const attach = useCallback(async (files: FileList | null) => {
    const next = await readFiles(files)
    if (next.length === 0) return
    const hasLogo = attachRef.current.some((attachment) => attachment.kind === 'logo')
    const tagged = next.map((attachment, index) =>
      !hasLogo && index === 0 ? { ...attachment, kind: 'logo' as const } : attachment,
    )
    attachRef.current = [...attachRef.current, ...tagged]
    dispatch({ type: 'attachments.add', attachments: tagged })
    if (!briefRef.current.colors || !briefRef.current.styleType) {
      const analysis = await analyzeReferenceImageRich(tagged[0].dataUrl)
      if (analysis) {
        const patch = analysisToBriefPatch(analysis, briefRef.current)
        if (Object.keys(patch).length) {
          const nextBrief = { ...briefRef.current, ...patch }
          briefRef.current = nextBrief
          dispatch({ type: 'brief', brief: nextBrief })
        }
      }
    }
  }, [])

  const removePending = useCallback((id: string) => {
    dispatch({ type: 'pending.remove', id })
  }, [])

  const dimTimer = useRef<number>(0)

  const runGenerate = useCallback((
    nextBrief: DesignBrief,
    result?: Partial<Pick<ReturnType<typeof runConversation>, 'overridePatch' | 'copyPatch' | 'feedback'>> & {
      feedbackFromLlm?: boolean
    },
  ) => {
    dispatch({ type: 'generation.start' })
    const attemptId = uid()
    // Every press that produces a design is its own charge: exploring is the product, and a control
    // that costs nothing is a control the customer stops reading. The id is per *attempt*, not per
    // click, so a network retry of the same attempt still cannot double-charge.
    const wantedKind = surfaceKind(nextBrief)
    const prev = prevForSurface(stateRef.current, wantedKind)
    const hasPrev = !!prev
    const auth = loadAuth()

    const finishFail = (message: string) => {
      dispatch({ type: 'generation.abort' })
      dispatch({
        type: 'messages.add',
        messages: [{ id: uid(), role: 'assistant', content: message }],
      })
      flashNote(message)
    }

    void (async () => {
      let reservationId: string | null = null
      try {
        if (auth?.token) {
          const operation = hasPrev ? 'revise' : 'generate'
          try {
            const reserved = await reserveCredits({
              operation,
              clientRequestId: attemptId,
            })
            reservationId = reserved.reservationId
            setCreditsRefreshKey((k) => k + 1)
          } catch (err) {
            if (err instanceof ApiError && err.status === 402) {
              finishFail('Krediniz yetersiz')
              return
            }
            finishFail(err instanceof Error ? err.message : 'Kredi rezervasyonu başarısız.')
            return
          }
        }

        await new Promise((r) => window.setTimeout(r, 720))

        const logo = attachRef.current.find((a) => a.kind === 'logo') ?? attachRef.current[0]
        const surface = wantedKind
        const briefForEngine =
          surface === 'label' && !nextBrief.bottleShape
            ? { ...nextBrief, bottleShape: recommendBottleShape(nextBrief) }
            : nextBrief
        if (briefForEngine.bottleShape && briefForEngine.bottleShape !== stateRef.current.bottleShape) {
          dispatch({ type: 'bottleShape', shape: briefForEngine.bottleShape })
        }
        const [llmCopy, llmDirection] = await Promise.all([
          generateCopyWithLlm(briefForEngine).catch(() => null),
          studioDirectionWithLlm({
            brand: briefForEngine.brandName,
            product: briefForEngine.productName,
            sector: briefForEngine.sector,
            subProduct: briefForEngine.subProduct,
            style: briefForEngine.styleType,
            surface,
            colors: briefForEngine.colors,
            avoid: briefForEngine.avoidMotifs,
          }).catch(() => null),
        ])
        const vetoed = briefForEngine.avoidStudioFamilies ?? []
        const familyLocked = !!briefForEngine.studioFamily || !!result?.overridePatch?.direction?.archetype || vetoed.length > 0
        const next = engine.generate({
          brief: briefForEngine,
          prev,
          overridePatch: {
            blankCanvas: false,
            studio: true,
            ...result?.overridePatch,
            ...(llmDirection
              ? {
                  direction: applyVetoToHints(
                    (() => {
                      const userDir = result?.overridePatch?.direction
                      if (familyLocked) {
                        return { ...llmDirection, ...userDir, source: userDir?.source ?? 'family' }
                      }
                      const pinTemp = userDir?.source === 'user' && userDir.temperament
                      return {
                        ...userDir,
                        ...llmDirection,
                        ...(pinTemp ? { temperament: userDir.temperament } : {}),
                        source: pinTemp ? 'user' : 'llm',
                      }
                    })(),
                    vetoed,
                  ),
                }
              : {}),
          },
          copyPatch: result?.copyPatch,
          llmCopy,
          logoHref: logo?.dataUrl,
          feedback: result?.feedback,
          feedbackFromLlm: result?.feedbackFromLlm,
        })
        designRef.current = next
        briefRef.current = next.brief
        copyBaseRef.current = null
        dispatch({
          type: 'generation.finish',
          design: next,
          printReady: !!result?.overridePatch?.printReady,
        })

        if (reservationId) {
          try {
            await commitReservation(reservationId)
            setCreditsRefreshKey((k) => k + 1)
          } catch {
            /* ledger already debited on reserve; commit is best-effort note */
          }
        }
      } catch (err) {
        if (reservationId) {
          try {
            await refundReservation(reservationId, 'generation_failed')
            setCreditsRefreshKey((k) => k + 1)
          } catch {
            /* ignore refund errors */
          }
        }
        finishFail(err instanceof Error ? err.message : 'Üretim başarısız.')
      }
    })()
  }, [flashNote])

  const process = useCallback((text: string, files: Attachment[]) => {
    const user: ChatMessage = {
      id: uid(),
      role: 'user',
      content: text || (files.length ? 'Görsel ekledim.' : ''),
      attachments: files.length ? files : undefined,
    }
    const first = !startedRef.current
    startedRef.current = true
    dispatch({ type: 'messages.add', messages: [user] })
    dispatch({ type: 'typing', typing: true })

    const finish = (mergedBrief: DesignBrief) => {
      void (async () => {
        const result = await runConversationAsync({
          text: user.content,
          attachments: files,
          brief: mergedBrief,
          awaiting: awaitingRef.current,
          hasDesign: liveOnSurface(designRef.current, mergedBrief),
          state: stateRef.current.conversation,
          studioCritic: liveOnSurface(designRef.current, mergedBrief) ? designRef.current.studio?.critic : undefined,
          directionOffer: liveOnSurface(designRef.current, mergedBrief) ? designRef.current.studio?.offer : undefined,
        })

        briefRef.current = result.brief
        awaitingRef.current = result.awaiting
        dispatch({
          type: 'conversation',
          brief: result.brief,
          awaiting: result.awaiting,
          showTemplates: result.showTemplates,
          conversation: result.state,
        })

        const replies = [...result.replies]
        if (first && !result.shouldGenerate) {
          const open = openingReply(user.content)
          if (open && result.awaiting) replies[0] = `${open} ${result.replies[0] ?? ''}`.trim()
        }

        const publish = () => {
          dispatch({
            type: 'messages.add',
            messages: replies.map((content) => ({
              id: uid(),
              role: 'assistant' as const,
              content,
            })),
          })
          dispatch({ type: 'typing', typing: false })
        }

        if (result.shouldGenerate) {
          publish()
          if (designRef.current) {
            // Revision turn: LLM may enrich the heuristic classification; it never edits SVG.
            void interpretFeedback(user.content)
              .then((interpreted) =>
                runGenerate(result.brief, {
                  ...result,
                  feedback: interpreted.feedback.length ? interpreted.feedback : result.feedback,
                  feedbackFromLlm: interpreted.llmUsed,
                }),
              )
              .catch(() => runGenerate(result.brief, result))
            return
          }
          runGenerate(result.brief, result)
          return
        }
        publish()
      })()
    }

    window.setTimeout(() => {
      void extractBriefWithLlm(user.content)
        .then((llm) => {
          const merged = llm ? mergeBrief(briefRef.current, llm) : briefRef.current
          finish(merged)
        })
        .catch(() => finish(briefRef.current))
    }, 280)
  }, [runGenerate])

  const send = useCallback(
    (forced?: string) => {
      const text = (forced ?? prompt).trim()
      const files = pending
      if (!text && files.length === 0) return
      if (phase === 'landing') dispatch({ type: 'phase', phase: 'workspace' })
      dispatch({ type: 'prompt', prompt: '' })
      dispatch({ type: 'pending.clear' })
      process(text, files)
    },
    [pending, phase, process, prompt],
  )

  const onSelectTemplate = useCallback((templateId: string, dims: DimensionsMm) => {
    const tmpl = getTemplate(templateId)
    const next = {
      ...briefRef.current,
      templateId,
      dimensionsMm: dims,
      dimsDefaulted: true,
      packagingMode: briefRef.current.packagingMode || tmpl?.packagingMode || 'box',
    }
    briefRef.current = next
    dispatch({ type: 'brief', brief: next })
    dispatch({ type: 'awaiting', awaiting: 'templateId' })
  }, [])

  const onPickTemplate = useCallback(
    (templateId: string, dims: DimensionsMm) => {
      const tmpl = getTemplate(templateId)
      const next = {
        ...briefRef.current,
        templateId,
        dimensionsMm: dims,
        packagingMode: briefRef.current.packagingMode || tmpl?.packagingMode || 'box',
      }
      briefRef.current = next
      dispatch({ type: 'brief', brief: next })
      dispatch({ type: 'phase', phase: 'workspace' })
      const result = runConversation({
        text: 'başlat',
        attachments: [],
        brief: next,
        awaiting: 'templateId',
        hasDesign: false,
      })
      dispatch({
        type: 'messages.add',
        messages: [{ id: uid(), role: 'assistant', content: result.replies[0] || 'Çiziyorum.' }],
      })
      runGenerate(next, result)
    },
    [runGenerate],
  )

  const onDims = useCallback((dims: DimensionsMm) => {
    const next = { ...briefRef.current, dimensionsMm: dims }
    briefRef.current = next
    dispatch({ type: 'brief', brief: next })
    if (stateRef.current.showTemplates) return
    if (!liveOnSurface(designRef.current, next)) return
    window.clearTimeout(dimTimer.current)
    dimTimer.current = window.setTimeout(() => {
      runGenerate(briefRef.current)
    }, 420)
  }, [runGenerate])

  const onCopyChange = useCallback((field: CopyField, value: string) => {
    const prev = designRef.current
    if (!prev) return
    if (!copyBaseRef.current) copyBaseRef.current = prev
    const logo = attachRef.current.find((a) => a.kind === 'logo') ?? attachRef.current[0]
    const next = recomposeCopy(prev, { [field]: value }, { logoHref: logo?.dataUrl })
    designRef.current = next
    briefRef.current = next.brief
    dispatch({ type: 'design.live', design: next })
  }, [])

  const onCopyCommit = useCallback(() => {
    const current = designRef.current
    const from = copyBaseRef.current
    copyBaseRef.current = null
    if (!current || !from) return
    if (current.copy === from.copy) return
    dispatch({ type: 'design.live', design: current, commit: true, historyFrom: from })
  }, [])

  const onStyle = useCallback((style: StyleType) => {
    // Release the family the engine stamped on the last result. It is a record of what was painted,
    // not a choice — leaving it in place is what made the mood knob unable to move the composition
    // after the first generation. A direction the customer picked themselves still holds.
    const held = briefRef.current
    const next = {
      ...held,
      styleType: style,
      ...(held.studioFamilyLocked ? {} : { studioFamily: undefined }),
    }
    briefRef.current = next
    dispatch({ type: 'brief', brief: next })
    awaitingRef.current = awaitingRef.current === 'styleType' ? null : awaitingRef.current
    dispatch({ type: 'awaiting', awaiting: awaitingRef.current })
    if (stateRef.current.showTemplates) return
    if (!liveOnSurface(designRef.current, next)) return
    dispatch({
      type: 'messages.add',
      messages: [{ id: uid(), role: 'assistant', content: `${styleLabel(style)} hale çekiyorum — palet ve tipografi sıfırdan.` }],
    })
    runGenerate(next)
  }, [runGenerate])

  /**
   * Tone: the second colour dimension, on top of the mood.
   *
   * This knob was removed once, on the reasoning that the mood should own colour alone. That was
   * wrong twice over — it cut the reachable palettes from thirty-six to six, and it removed a
   * control the customer was using. Layer 2 owning colour does not mean layer 2 is one button.
   */
  const onTone = useCallback((temperament: Temperament) => {
    const current = designRef.current
    if (!liveOnSurface(current, briefRef.current)) return
    const next = { ...briefRef.current, studioTemperament: temperament, directionVariation: 0 }
    briefRef.current = next
    dispatch({ type: 'brief', brief: next })
    dispatch({
      type: 'messages.add',
      messages: [{ id: uid(), role: 'assistant', content: `${temperamentTalk(temperament)} tona çekiyorum — aynı iskelet, yeni palet.` }],
    })
    const stay = tabAfterStudioEdit(current.kind, stateRef.current.tab)
    if (stay !== stateRef.current.tab) dispatch({ type: 'tab', tab: stay })
    runGenerate(next, {
      overridePatch: { variationIndex: 0, direction: { temperament, source: 'user' } },
    })
  }, [runGenerate])

  const onDirectionPick = useCallback((family: StudioFamily, index: number) => {
    const current = designRef.current
    if (!liveOnSurface(current, briefRef.current)) return
    const hit = current.studio?.offer?.candidates.find((row) => row.index === index)
    if (!hit || hit.selected) return
    const next = {
      ...briefRef.current,
      studioFamily: family,
      studioFamilyLocked: true,
      studioTemperament: undefined,
      directionVariation: 0,
    }
    briefRef.current = next
    dispatch({ type: 'brief', brief: next })
    dispatch({
      type: 'messages.add',
      messages: [{ id: uid(), role: 'assistant', content: `${index}. yön: ${familyTalk(family)}.` }],
    })
    const stay = tabAfterStudioEdit(current.kind, stateRef.current.tab)
    if (stay !== stateRef.current.tab) dispatch({ type: 'tab', tab: stay })
    const surface = next.packagingMode === 'label' ? 'label' : 'box'
    runGenerate(next, {
      overridePatch: {
        variationIndex: 0,
        direction: { ...hintsFromFamily(family, surface), source: 'user' },
      },
    })
  }, [runGenerate])

  const onVary = useCallback(() => {
    const current = designRef.current
    if (!liveOnSurface(current, briefRef.current)) return
    const nextIndex = (current.designPlan?.variationIndex ?? 0) + 1
    const next = { ...briefRef.current, directionVariation: nextIndex }
    briefRef.current = next
    dispatch({ type: 'brief', brief: next })
    dispatch({
      type: 'messages.add',
      messages: [
        {
          id: uid(),
          role: 'assistant',
          content: 'Aynı brief, yeni bir kompozisyon deniyorum.',
        },
      ],
    })
    const stay = tabAfterStudioEdit(current.kind, stateRef.current.tab)
    if (stay !== stateRef.current.tab) dispatch({ type: 'tab', tab: stay })
    runGenerate(next, { overridePatch: { variationIndex: nextIndex } })
  }, [runGenerate])

  const onUndo = useCallback(() => {
    const previous = designHistory.at(-1)
    if (!previous) return
    designRef.current = previous
    briefRef.current = previous.brief
    dispatch({ type: 'history.undo' })
  }, [designHistory])

  const onRedo = useCallback(() => {
    const next = designFuture[0]
    if (!next) return
    designRef.current = next
    briefRef.current = next.brief
    dispatch({ type: 'history.redo' })
  }, [designFuture])

  const onSurfaceView = useCallback((surface: SurfaceView) => {
    const next = surface === 'label' ? stateRef.current.labelDesign : stateRef.current.boxDesign
    dispatch({ type: 'surfaceView', surface })
    if (next) {
      designRef.current = next
      briefRef.current = next.brief
      awaitingRef.current = null
    }
  }, [])

  const onStartLabel = useCallback(() => {
    if (stateRef.current.labelDesign) {
      onSurfaceView('label')
      return
    }
    if (stateRef.current.showTemplates && briefRef.current.packagingMode === 'label') return
    send('etiketi de üret')
  }, [onSurfaceView, send])

  const onBottleShape = useCallback((shape: BottleShape) => {
    briefRef.current = { ...briefRef.current, bottleShape: shape }
    dispatch({ type: 'bottleShape', shape })
  }, [])

  // Phase 8 mock payment page (no keys / tests)
  const mockPayMatch =
    typeof window !== 'undefined' &&
    window.location.pathname.replace(/\/$/, '') === '/billing/mock-pay'
  if (mockPayMatch) {
    const orderId = new URLSearchParams(window.location.search).get('orderId') ?? ''
    return (
      <div className="app">
        <MockPayPage
          orderId={orderId}
          onDone={() => setCreditsRefreshKey((k) => k + 1)}
        />
      </div>
    )
  }

  return (
    <div className="app">
      {phase === 'landing' ? (
        <Landing
          prompt={prompt}
          onPrompt={(value) => dispatch({ type: 'prompt', prompt: value })}
          attachments={pending}
          onAttach={attach}
          onRemoveAttach={removePending}
          onSend={send}
          onAuthChange={onAuthChange}
          creditsRefreshKey={creditsRefreshKey}
          onLoadProject={onLoadCloudProject}
        />
      ) : (
        <Workspace
          messages={messages}
          prompt={prompt}
          onPrompt={(value) => dispatch({ type: 'prompt', prompt: value })}
          attachments={pending}
          allAttachments={allAttachments}
          onAttach={attach}
          onRemoveAttach={removePending}
          onSend={() => send()}
          typing={typing}
          generating={generating}
          brief={brief}
          inputsOpen={inputsOpen}
          onToggleInputs={() => dispatch({ type: 'inputs.toggle' })}
          design={design}
          designHistory={designHistory}
          canRedo={designFuture.length > 0}
          onUndo={onUndo}
          onRedo={onRedo}
          showTemplates={showTemplates}
          onSelectTemplate={onSelectTemplate}
          onPickTemplate={onPickTemplate}
          onDims={onDims}
          onCopyChange={onCopyChange}
          onCopyCommit={onCopyCommit}
          onStyle={onStyle}
          onTone={onTone}
          onDirectionPick={onDirectionPick}
          onVary={onVary}
          tab={tab}
          onTab={(nextTab) => dispatch({ type: 'tab', tab: nextTab })}
          onReset={reset}
          onAuthChange={onAuthChange}
          syncNote={syncNote}
          creditsRefreshKey={creditsRefreshKey}
          onLoadProject={onLoadCloudProject}
          boxDesign={boxDesign}
          labelDesign={labelDesign}
          surfaceView={surfaceView}
          onSurfaceView={onSurfaceView}
          bottleShape={bottleShape}
          onBottleShape={onBottleShape}
          onStartLabel={onStartLabel}
        />
      )}
    </div>
  )
}
