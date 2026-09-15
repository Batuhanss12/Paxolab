import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  approveKnowledge,
  rejectKnowledge,
  rollbackKnowledge,
  runLearningCycle,
  whenDesignKnowledgeReady,
  whenLearningReady,
  type DesignKnowledgeRule,
} from '../engine/brain'
import { describeKnowledgeRule, learningSnapshot, type LearningSnapshot } from '../engine/brain/learningUi'

function emptySnap(): LearningSnapshot {
  return {
    version: 0,
    observations: 0,
    candidates: [],
    pendingHuman: [],
    pendingAuto: [],
    active: [],
    history: [],
    empty: true,
  }
}

function RuleRow({
  rule,
  actions,
}: {
  rule: DesignKnowledgeRule
  actions?: ReactNode
}) {
  return (
    <li className="learn-panel__rule">
      <p>{describeKnowledgeRule(rule)}</p>
      <small>
        {rule.state} · güven {rule.confidence.toFixed(2)} · n={rule.sampleCount}
      </small>
      {actions}
    </li>
  )
}

export function LearningPanel() {
  const [snap, setSnap] = useState<LearningSnapshot>(emptySnap)
  const [note, setNote] = useState('')

  const refresh = useCallback(() => {
    setSnap(learningSnapshot())
  }, [])

  useEffect(() => {
    let cancelled = false
    void Promise.all([whenDesignKnowledgeReady(), whenLearningReady()]).then(() => {
      if (!cancelled) refresh()
    })
    return () => {
      cancelled = true
    }
  }, [refresh])

  function runCycle() {
    const result = runLearningCycle({ approve: 'automated' })
    refresh()
    const globalLeft = learningSnapshot().pendingHuman.length
    setNote(
      `${result.validated.length} doğrulandı, ${result.activated.length} açıldı` +
        (globalLeft ? ` · ${globalLeft} global kural insan onayı bekliyor` : ''),
    )
  }

  function approve(id: string) {
    approveKnowledge(id, 'human')
    refresh()
    setNote('Global kural açıldı. Sonraki generate baseline’dan sapabilir.')
  }

  function reject(id: string) {
    rejectKnowledge(id)
    refresh()
    setNote('Kural reddedildi. Geçmiş duruyor.')
  }

  function rollback(version: number) {
    rollbackKnowledge(version, 'human')
    refresh()
    setNote(`Aktif küme v${version} anına alındı. Yeni sürüm yazıldı; geçmiş silinmedi.`)
  }

  const rollTargets = snap.history.filter((entry) => entry.version !== snap.version).slice(-6).reverse()

  return (
    <section className="learn-panel">
      <header className="learn-panel__head">
        <div>
          <p className="eyebrow">Öğrenme</p>
          <h2>Bilgi tabanı v{snap.version}</h2>
        </div>
        <button type="button" className="ghost-btn" onClick={runCycle}>
          Döngüyü çalıştır
        </button>
      </header>
      <p className="learn-panel__lead">
        {snap.empty
          ? 'Boş depo. Motor baseline kurallarıyla çalışıyor. Yıldız ve dışa aktarma gözlem üretir; döngü aday çıkarır. Global kural insan onayı olmadan açılmaz.'
          : 'Kullanıcı ve marka kuralları döngüde otomatik açılır. Global tasarım bilgisi yalnız insan onayı ile aktif olur. A/B ve RL yok.'}
      </p>
      <p className="learn-panel__meta">
        {snap.observations} gözlem · {snap.candidates.length} aday · {snap.active.length} aktif
      </p>

      {snap.pendingHuman.length > 0 && (
        <>
          <h3>İnsan onayı (global)</h3>
          <ul>
            {snap.pendingHuman.map((rule) => (
              <RuleRow
                key={rule.id}
                rule={rule}
                actions={
                  <div className="learn-panel__actions">
                    <button type="button" className="ghost-btn" onClick={() => approve(rule.id)}>
                      Onayla
                    </button>
                    <button type="button" className="ghost-btn" onClick={() => reject(rule.id)}>
                      Reddet
                    </button>
                  </div>
                }
              />
            ))}
          </ul>
        </>
      )}

      {snap.pendingAuto.length > 0 && (
        <>
          <h3>Doğrulandı (kullanıcı / marka)</h3>
          <ul>
            {snap.pendingAuto.map((rule) => (
              <RuleRow key={rule.id} rule={rule} />
            ))}
          </ul>
          <p className="learn-panel__hint">Döngüyü çalıştırınca bunlar otomatik açılır.</p>
        </>
      )}

      {snap.candidates.length > 0 && (
        <>
          <h3>Aday</h3>
          <ul>
            {snap.candidates.map((rule) => (
              <RuleRow key={rule.id} rule={rule} />
            ))}
          </ul>
        </>
      )}

      {snap.active.length > 0 && (
        <>
          <h3>Aktif</h3>
          <ul>
            {snap.active.map((rule) => (
              <RuleRow key={rule.id} rule={rule} />
            ))}
          </ul>
        </>
      )}

      {rollTargets.length > 0 && (
        <>
          <h3>Geri al</h3>
          <ul className="learn-panel__history">
            {rollTargets.map((entry) => (
              <li key={entry.version}>
                <span>
                  v{entry.version} · {entry.activeRuleIds.length} kural
                </span>
                <button type="button" className="ghost-btn" onClick={() => rollback(entry.version)}>
                  Bu sürüme dön
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {note && <p className="learn-panel__note">{note}</p>}
    </section>
  )
}
