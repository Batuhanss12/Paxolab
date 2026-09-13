import {
  iconEmark,
  iconFlammable,
  iconGlassFork,
  iconGreenDot,
  iconKeepAway,
  iconKeepDry,
  iconLeaflet,
  iconPao,
  iconPap21,
  iconRecycle,
  iconThisWayUp,
  iconWeee,
} from '../artwork/icons'
import { perfumeAssetMark } from './perfumeAssets'
import { opticalStrip } from './stripLayout'
import type { MarkId, MarkRecipe, PerfumeAssetId } from './types'

function synth(id: MarkId, x: number, y: number, s: number, color: string, paoMonths: string): string {
  if (id === 'pao') return iconPao(x, y, s, color, paoMonths)
  if (id === 'leaflet') return iconLeaflet(x, y, s, color)
  if (id === 'recycle') return iconRecycle(x, y, s, color)
  if (id === 'greendot') return iconGreenDot(x, y, s, color)
  if (id === 'pap21') return iconPap21(x, y, s, color)
  if (id === 'emark') return iconEmark(x, y, s, color)
  if (id === 'flammable') return iconFlammable(x, y, s, color)
  if (id === 'keepaway') return iconKeepAway(x, y, s, color)
  if (id === 'weee') return iconWeee(x, y, s, color)
  if (id === 'thiswayup') return iconThisWayUp(x, y, s, color)
  if (id === 'keepdry') return iconKeepDry(x, y, s, color)
  if (id === 'glassfork') return iconGlassFork(x, y, s, color)
  return ''
}

const RETIRED_SYNTH: MarkId[] = ['flammable', 'keepaway', 'pao', 'leaflet', 'pap21', 'greendot', 'emark']

export function renderMark(
  id: MarkId,
  x: number,
  y: number,
  s: number,
  color: string,
  recipe: MarkRecipe,
  allowPerfumeAssets: boolean,
): string {
  const asset = allowPerfumeAssets ? recipe.perfumeAssets[id] : undefined
  if (asset) return perfumeAssetMark(asset as PerfumeAssetId, x, y, s, color, recipe.paoMonths)
  if (RETIRED_SYNTH.includes(id)) return ''
  return synth(id, x, y, s, color, recipe.paoMonths)
}

export function renderMarkStrip(
  bandX: number,
  y: number,
  bandW: number,
  color: string,
  ids: MarkId[],
  recipe: MarkRecipe,
  allowPerfumeAssets: boolean,
  sizeHint?: number,
): string {
  const layout = opticalStrip(ids, bandW, recipe, sizeHint)
  return layout.ids
    .map((id, i) =>
      renderMark(id, bandX + layout.xs[i], y, layout.size, color, recipe, allowPerfumeAssets),
    )
    .join('')
}
