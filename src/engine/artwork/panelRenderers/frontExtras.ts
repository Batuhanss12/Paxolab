/**
 * Front extras — badge + plain-volume placement.
 * Keep ingredient badges; move the volume band down on wrap/plain paths instead of omitting.
 */
import type { Panel } from '../../../types'
import type { DesignSystem } from '../../designSystem/types'
import { volumeBandTop } from '../../designSystem/volumeFormat'
import { fitIngredientBadges } from './foodElements'

export type FrontExtras = {
  badgeY: number
  volumeY: number
  showBadges: boolean
  bandTop: number
}

export function defaultPlainVolumeY(panel: Panel, labelFace: boolean): number {
  return panel.y + panel.h * (labelFace ? 0.78 : 0.82)
}

export function placeFrontExtras(
  panel: Panel,
  system: DesignSystem,
  layout: { taglineY: number; ax: number; anchor: 'middle' | 'start' },
  ingredientClaims: string,
  labelFace: boolean,
): FrontExtras {
  const { y, h } = panel
  const badgeH = 4.8
  const badgeY = layout.taglineY + (labelFace ? 5.8 : 7.4)
  const styledVolume = system.goldBar || (!labelFace && (system.style === 'playful' || system.style === 'eco' || system.style === 'modern'))
  let volumeY = styledVolume
    ? volumeBandTop(panel, system.goldBar, system.style, labelFace) + 1.6
    : defaultPlainVolumeY(panel, labelFace)
  const fitted = ingredientClaims.trim()
    ? fitIngredientBadges(ingredientClaims, layout.ax, layout.anchor, system.type.minMm, panel)
    : null

  if (fitted && !styledVolume) {
    const need = badgeY + badgeH + 2.2
    if (need > volumeY) {
      const maxVolY = y + h - (labelFace ? 3.4 : 4.2)
      if (need <= maxVolY) volumeY = need
    }
  }

  const bandTop = styledVolume
    ? volumeBandTop(panel, system.goldBar, system.style, labelFace)
    : volumeY - 1.2
  const showBadges = !!fitted && badgeY + badgeH + 1.2 <= (styledVolume ? bandTop : volumeY)
  return { badgeY, volumeY, showBadges, bandTop }
}
