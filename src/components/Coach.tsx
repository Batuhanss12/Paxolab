/**
 * The first-run walkthrough.
 *
 * The studio hands a customer their first design and then says nothing. Everything after that —
 * switching direction, changing the mood, editing the copy, reading the cut, exporting print-ready
 * files — lives behind a tab or a button they have no reason to press. The owner's note was exactly
 * this: "kullanıcı burdan sonra diğer aşamaları görmesi için eğitici bir yapı kurmak lazım, şuraya
 * tıkla bunu burdan yap gibi".
 *
 * So each step points at a real control, by a `data-coach` attribute rather than a class name, and
 * says what that control is for. Steps whose target is not on screen are skipped rather than
 * pointing at nothing. It runs once per browser and can be dismissed at any point.
 */
import { useCallback, useEffect, useLayoutEffect, useState } from 'react'

export type CoachStep = {
  /** `data-coach` value of the element this step points at. */
  target: string
  title: string
  body: string
}

const SEEN_KEY = 'grapxor.coach.v1'

export function coachSeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return true
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, '1')
  } catch {
    /* private mode — the tour simply runs again next time */
  }
}

function targetRect(target: string): DOMRect | null {
  const el = document.querySelector(`[data-coach="${target}"]`)
  if (!el) return null
  const rect = el.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0 ? rect : null
}

type CoachProps = {
  steps: CoachStep[]
  onDone: () => void
}

export function Coach({ steps, onDone }: CoachProps) {
  const [i, setI] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)

  const finish = useCallback(() => {
    markSeen()
    onDone()
  }, [onDone])

  // Walk forward past any step whose control is not on screen for this design.
  useLayoutEffect(() => {
    let step = i
    while (step < steps.length && !targetRect(steps[step]!.target)) step += 1
    if (step >= steps.length) {
      finish()
      return
    }
    if (step !== i) {
      setI(step)
      return
    }
    setRect(targetRect(steps[step]!.target))
  }, [i, steps, finish])

  useEffect(() => {
    const current = steps[i]
    if (!current) return
    function sync() {
      setRect(targetRect(current!.target))
    }
    window.addEventListener('resize', sync)
    window.addEventListener('scroll', sync, true)
    const timer = window.setInterval(sync, 400)
    return () => {
      window.removeEventListener('resize', sync)
      window.removeEventListener('scroll', sync, true)
      window.clearInterval(timer)
    }
  }, [i, steps])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') finish()
      if (e.key === 'ArrowRight' || e.key === 'Enter') setI((n) => n + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finish])

  const step = steps[i]
  if (!step || !rect) return null

  const pad = 8
  const ring = {
    top: rect.top - pad,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  }

  // The card goes below the control, or above it when there is no room underneath.
  const cardW = 300
  const below = ring.top + ring.height + 14
  const roomBelow = window.innerHeight - below
  const placeAbove = roomBelow < 190
  const top = placeAbove ? Math.max(12, ring.top - 190) : below
  const left = Math.min(Math.max(12, ring.left + ring.width / 2 - cardW / 2), window.innerWidth - cardW - 12)

  return (
    <div className="coach" role="dialog" aria-label="Tanıtım turu">
      <div className="coach__ring" style={{ top: ring.top, left: ring.left, width: ring.width, height: ring.height }} />
      <div className="coach__card" style={{ top, left, width: cardW }}>
        <p className="coach__count">
          {i + 1} / {steps.length}
        </p>
        <h3 className="coach__title">{step.title}</h3>
        <p className="coach__body">{step.body}</p>
        <div className="coach__actions">
          <button type="button" className="coach__skip" onClick={finish}>
            Turu kapat
          </button>
          <button type="button" className="coach__next" onClick={() => (i + 1 >= steps.length ? finish() : setI(i + 1))}>
            {i + 1 >= steps.length ? 'Bitti' : 'Sonraki'}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * The walkthrough, per surface.
 *
 * The copy canvas is not in the same place on both: a label edits its text on the 2D tab, a carton
 * on the dieline, because that is where all six panels are visible at once. A single shared list
 * silently dropped the text step for cartons — the auto-skip did its job and the customer lost the
 * one instruction they most needed. So the carton is told where its text lives instead.
 */
export function studioCoachSteps(kind: 'label' | 'box'): CoachStep[] {
  const directions: CoachStep = {
    target: 'directions',
    title: 'Tasarımı değiştir',
    body: 'Buradaki yönlerden birine tıkla, tasarım o dile göre yeniden çizilir. Aynı brief, başka bir tasarım.',
  }
  const style: CoachStep = {
    target: 'style',
    title: 'Ruh hali ve ton',
    body: 'Lüks, minimal, eko… Stil’den havayı, tondan paleti değiştir. İskelet aynı kalır, atmosfer değişir.',
  }
  const threeD: CoachStep = {
    target: 'tab-onizleme3d',
    title: 'Üç boyutlu önizleme',
    body: 'Ürünü kapalı hâliyle çevirerek bak. Rafta nasıl duracağını burada görürsün.',
  }
  const production: CoachStep = {
    target: 'tab-uretim',
    title: 'Baskıya hazır çıktı',
    body: 'Taşma payı, kesim marjı ve barkod kontrolleri burada. Onaylayınca üretim dosyasını indirirsin.',
  }

  if (kind === 'label') {
    return [
      directions,
      style,
      {
        target: 'copy',
        title: 'Metni düzenle',
        body: 'Marka, ürün, slogan ve miktarı doğrudan yaz. Tipografi ve hizalama kendini yeniden kurar.',
      },
      {
        target: 'tab-dieline',
        title: 'Etiket seti',
        body: 'Ön ve arka etiketi bir arada, kesim hattıyla birlikte görürsün.',
      },
      threeD,
      production,
    ]
  }

  return [
    directions,
    style,
    {
      target: 'tab-dieline',
      title: 'Kesim planı ve metin',
      body: 'Kutunun açılımı bıçak izleriyle burada. Yazı tuvalini açıp marka, ürün ve sloganı bu ekrandan düzenlersin.',
    },
    threeD,
    production,
  ]
}
