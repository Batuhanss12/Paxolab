import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { appReducer, createInitialAppState } from './appState'
import { Landing } from './components/Landing'
import { MockPayPage } from './components/BillingPanel'
import { Workspace } from './components/Workspace'
import { openingReply, runConversation, runConversationAsync } from './engine/conversation'
import { getEngine } from './engine/EnginePort'
import { emptyBrief, mergeBrief, uid } from './engine/fields'
import { styleLabel } from './engine/styles'
import { getTemplate } from './engine/catalog/catalog'
import { extractBriefWithLlm } from './engine/nlu'
import { generateCopyWithLlm } from './engine/llm'
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
import { initDesignMemory } from './engine/brain/DesignMemory'
import type { Attachment, ChatMessage, DesignBrief, DimensionsMm, StyleType } from './types'

const engine = getEngine()

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

  const onAuthChange = useCallback(
    (user: AuthUser | null) => {
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
    [flashNote],
  )

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
    result?: { overridePatch?: ReturnType<typeof runConversation>['overridePatch']; copyPatch?: ReturnType<typeof runConversation>['copyPatch'] },
  ) => {
    dispatch({ type: 'generation.start' })
    const attemptId = uid()
    const hasPrev = !!designRef.current
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
        // Pre-fetch LLM copy in parallel with the artificial delay.
        const llmCopy = await generateCopyWithLlm(nextBrief).catch(() => null)
        const next = engine.generate({
          brief: nextBrief,
          prev: designRef.current,
          overridePatch: { blankCanvas: false, ...result?.overridePatch },
          copyPatch: result?.copyPatch,
          llmCopy,
          logoHref: logo?.dataUrl,
        })
        designRef.current = next
        briefRef.current = next.brief
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
          hasDesign: !!designRef.current,
        })

        briefRef.current = result.brief
        awaitingRef.current = result.awaiting
        dispatch({
          type: 'conversation',
          brief: result.brief,
          awaiting: result.awaiting,
          showTemplates: result.showTemplates,
        })

        const replies = [...result.replies]
        if (first && !result.brief.brandName) {
          const open = openingReply(user.content)
          if (open && !result.shouldGenerate) replies[0] = open
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

  const onPickTemplate = useCallback(
    (templateId: string, dims: DimensionsMm) => {
      const tmpl = getTemplate(templateId)
      const next = {
        ...briefRef.current,
        templateId,
        dimensionsMm: dims,
        packagingMode: briefRef.current.packagingMode || tmpl?.packagingMode || 'box',
        sector: briefRef.current.sector || tmpl?.sectors[0] || '',
      }
      briefRef.current = next
      dispatch({ type: 'brief', brief: next })
      dispatch({ type: 'phase', phase: 'workspace' })
      const result = runConversation({
        text: 'şablon seçildi',
        attachments: [],
        brief: next,
        awaiting: 'templateId',
        hasDesign: false,
      })
      dispatch({
        type: 'messages.add',
        messages: [{ id: uid(), role: 'assistant', content: result.replies[0] || 'Motor çalışıyor.' }],
      })
      runGenerate(next, result)
    },
    [runGenerate],
  )

  const onDims = useCallback((dims: DimensionsMm) => {
    const next = { ...briefRef.current, dimensionsMm: dims }
    briefRef.current = next
    dispatch({ type: 'brief', brief: next })
    if (!designRef.current) return
    window.clearTimeout(dimTimer.current)
    dimTimer.current = window.setTimeout(() => {
      runGenerate(briefRef.current)
    }, 420)
  }, [runGenerate])

  const onStyle = useCallback((style: StyleType) => {
    const next = { ...briefRef.current, styleType: style }
    briefRef.current = next
    dispatch({ type: 'brief', brief: next })
    awaitingRef.current = awaitingRef.current === 'styleType' ? null : awaitingRef.current
    dispatch({ type: 'awaiting', awaiting: awaitingRef.current })
    if (!designRef.current) return
    dispatch({
      type: 'messages.add',
      messages: [{ id: uid(), role: 'assistant', content: `Ruh hali ${styleLabel(style)} — boş tuvalden yeniden kuruldu.` }],
    })
    runGenerate(next)
  }, [runGenerate])

  const onVary = useCallback(() => {
    if (!designRef.current) return
    const nextIndex = (designRef.current.designPlan?.variationIndex ?? 0) + 1
    dispatch({
      type: 'messages.add',
      messages: [
        {
          id: uid(),
          role: 'assistant',
          content: `Varyasyon seti ${nextIndex + 1} — aynı brief, yeni kahraman / pattern.`,
        },
      ],
    })
    dispatch({ type: 'tab', tab: 'vektor' })
    runGenerate(briefRef.current, { overridePatch: { variationIndex: nextIndex } })
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
          onPickTemplate={onPickTemplate}
          onDims={onDims}
          onStyle={onStyle}
          onVary={onVary}
          tab={tab}
          onTab={(nextTab) => dispatch({ type: 'tab', tab: nextTab })}
          onReset={reset}
          onAuthChange={onAuthChange}
          syncNote={syncNote}
          creditsRefreshKey={creditsRefreshKey}
          onLoadProject={onLoadCloudProject}
        />
      )}
    </div>
  )
}
