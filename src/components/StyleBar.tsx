import { useMemo } from 'react'
import type { DesignBrief, DesignSpec, DimensionsMm, StyleType } from '../types'
import { studioFaceLabel } from '../engine/studio/faceCaption'
import { STYLE_OPTIONS } from '../engine/styles'
import { TEMPERAMENT_OPTIONS } from '../engine/studio/temperament'
import { moodPreview, tonePreview } from '../engine/studio/direction'
import { creditsUrl } from '../api/urls'
import type { Temperament } from '../engine/studio/types'

type StyleBarProps = {
  brief: DesignBrief
  design: DesignSpec | null
  onStyle: (style: StyleType) => void
  onTone?: (temperament: Temperament) => void
  /** Balance and prices. Absent while signed out, when nothing is metered. */
  credits?: { balance: number | null; costs: { generate: number; revise: number; download: number } | null }
  onDims: (dims: DimensionsMm) => void
  onVary?: () => void
  className?: string
  variant?: 'rail'
}

export function StyleBar({ brief, design, onStyle, onTone, credits, onDims, onVary, className, variant }: StyleBarProps) {
  /*
   * Every control here spends a credit, so every control says so and stops offering itself when the
   * wallet cannot cover it. Before this, an empty wallet still showed six live mood chips: pressing
   * one produced a promise, a silent refusal, and an unchanged design.
   */
  const price = credits?.costs?.revise ?? null
  const balance = credits?.balance ?? null
  const affordable = price == null || balance == null || balance >= price
  const priceTag = price == null ? '' : ` · ${price} kr`
  const blockedHint = affordable ? undefined : `Krediniz yetersiz — bu değişiklik ${price} kr, bakiyeniz ${balance} kr.`
  const studio = Boolean(design?.studio)
  const activeStyle = brief.styleType || design?.brief.styleType || 'luxury'
  const activeTone = brief.studioTemperament || design?.studio?.direction.temperament || 'dark-luxe'
  // Swatches come from the customer's *own* brief, not from a fixed sample, so the row shows where
  // each mood actually goes before a credit is spent on finding out.
  const swatches = useMemo(
    () => new Map(STYLE_OPTIONS.map((opt) => [opt.id, moodPreview(brief, opt.id)])),
    [brief],
  )
  // Tone is the second dimension: six moods alone give six palettes, six tones against them give
  // thirty-six. Its swatches are previewed the same way, against the customer's own colours.
  const toneSwatches = useMemo(
    () => new Map(TEMPERAMENT_OPTIONS.map((opt) => [opt.id, tonePreview(brief, activeStyle, opt.id)])),
    [brief, activeStyle],
  )
  const dims =
    brief.dimensionsMm.L || brief.dimensionsMm.H
      ? brief.dimensionsMm
      : design
        ? { L: design.layout.widthMm, W: design.layout.depthMm, H: design.layout.heightMm }
        : { L: 0, W: 0, H: 0 }
  const showDims = !!design
  const showW = (brief.packagingMode || design?.kind) !== 'label' && design?.kind !== 'label'

  function setNum(key: keyof DimensionsMm, value: string) {
    onDims({ ...dims, [key]: Number(value) || 0 })
  }

  const rootClass = ['style-bar', variant === 'rail' ? 'style-bar--rail' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={rootClass} aria-label="Ruh hali">
      <p className="style-bar__kicker">
        Ruh hali
        {price != null && <span className="style-bar__price">{price} kr</span>}
      </p>
      <div className="style-chips" role="listbox" aria-label="Ruh hali">
        {STYLE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="option"
            aria-selected={activeStyle === opt.id}
            title={blockedHint ?? `${opt.hint}${priceTag}`}
            disabled={!affordable}
            className={`style-chip ${activeStyle === opt.id ? 'is-active' : ''}`}
            onClick={() => onStyle(opt.id)}
          >
            <span className="style-chip__pair" aria-hidden="true">
              <span className="style-chip__swatch" style={{ background: swatches.get(opt.id)?.ground ?? opt.swatch }} />
              <span className="style-chip__swatch style-chip__swatch--accent" style={{ background: swatches.get(opt.id)?.accent ?? opt.swatch }} />
            </span>
            <span className="style-chip__name">{opt.label}</span>
          </button>
        ))}
      </div>
      {studio && onTone ? (
        <>
          <p className="style-bar__kicker">
            Ton
            {price != null && <span className="style-bar__price">{price} kr</span>}
          </p>
          <div className="style-chips" role="listbox" aria-label="Ton">
            {TEMPERAMENT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={activeTone === opt.id}
                title={blockedHint ?? `${opt.hint}${priceTag}`}
                disabled={!affordable}
                className={`style-chip ${activeTone === opt.id ? 'is-active' : ''}`}
                onClick={() => onTone(opt.id)}
              >
                <span className="style-chip__pair" aria-hidden="true">
                  <span className="style-chip__swatch" style={{ background: toneSwatches.get(opt.id)?.ground ?? opt.swatch }} />
                  <span className="style-chip__swatch style-chip__swatch--accent" style={{ background: toneSwatches.get(opt.id)?.accent ?? opt.swatch }} />
                </span>
                <span className="style-chip__name">{opt.label}</span>
              </button>
            ))}
          </div>
        </>
      ) : null}
      {showDims && (
        <div className="style-bar__dims">
          <span className="style-bar__dims-label">Ölçü</span>
          <label>
            L
            <input type="number" min={10} value={dims.L || ''} onChange={(e) => setNum('L', e.target.value)} />
          </label>
          {showW && (
            <label>
              W
              <input type="number" min={8} value={dims.W || ''} onChange={(e) => setNum('W', e.target.value)} />
            </label>
          )}
          <label>
            H
            <input type="number" min={10} value={dims.H || ''} onChange={(e) => setNum('H', e.target.value)} />
          </label>
          <span className="style-bar__dims-unit">mm</span>
        </div>
      )}
      {!affordable && (
        <p className="style-bar__blocked">
          Krediniz yetersiz. <a href={creditsUrl()}>Kredi yükleyin</a> — bu kontroller o zaman açılır.
        </p>
      )}
      {design && onVary && (
        <button type="button" className="style-bar__vary" onClick={onVary} disabled={!affordable} title={blockedHint}>
          {`Yeni kompozisyon${priceTag}`}
          <span className="style-bar__vary-set">
            {design.studio ? studioFaceLabel(design) : `Set ${(design.designPlan?.variationIndex ?? 0) + 1}/6`}
          </span>
        </button>
      )}
    </section>
  )
}
