/**
 * BOX dieline cert — catalog inventory + pack-family contracts.
 * Labels are excluded by construction.
 */
import type { DimensionsMm, FormaTemplate, StructureId } from '../../../types'
import { FORMA_TEMPLATES } from '../../catalog/catalog'
import { FORXA_ROUTED } from '../forxaGenerate'

export type PackFamily =
  | 'native-tuck'
  | 'forxa-tuck-aux'
  | 'reverse-tuck'
  | 'mailer'
  | 'sleeve'
  | 'pillow'
  | 'snap-lock'
  | 'simple-tray'
  | 'glued-tray'
  | 'rigid-gift'
  | 'polygon'
  | 'carrier-tray'
  | 'tuck-top-auto-bottom'
  | 'rsc'

export type FamilyContract = {
  family: PackFamily
  glueRequired: boolean
  creaseRequired: boolean
  minPanels: number
  requiredAny: string[][]
  reflow: { anyOf: string[]; dim: 'L' | 'W' | 'H'; axis: 'w' | 'h' }[]
}

export type BoxTemplateRow = {
  templateId: string
  structureId: StructureId
  packType: 'box'
  packFamily: PackFamily
  library: 'core' | 'advanced'
  auxDevice?: string
  engineParams?: Record<string, number>
  defaultsMm: DimensionsMm
  entrypoints: {
    catalog: string
    facade: string
    builder: string
  }
  contract: FamilyContract
}

export type BoxBuilderRow = {
  structureId: string
  packType: 'box'
  route: 'native' | 'forxa'
  file: string
  catalogTemplateIds: string[]
}

const CATALOG = 'src/engine/catalog/formaTemplateCatalog.json'
const FACADE = 'src/engine/dieline/buildDieline.ts'

const BUILDER_FILE: Record<string, string> = {
  'tuck-end-box': 'src/engine/dieline/dielineStructures.ts (native) · src/engine/dieline/forxa/structures/tuckEndBox.ts (aux/Forxa)',
  'simple-tray': 'src/engine/dieline/dielineStructures.ts',
  'mailer-box': 'src/engine/dieline/forxa/structures/mailerBox.ts',
  sleeve: 'src/engine/dieline/forxa/structures/sleeve.ts',
  'pillow-box': 'src/engine/dieline/forxa/structures/pillowBox.ts',
  'snap-lock-box': 'src/engine/dieline/forxa/structures/snapLockBox.ts',
  'tray-box': 'src/engine/dieline/forxa/structures/trayBox.ts',
  'rigid-gift-box': 'src/engine/dieline/forxa/structures/rigidGiftBox.ts',
  'polygon-box': 'src/engine/dieline/forxa/structures/polygonBox.ts',
  'product-carrier-tray': 'src/engine/dieline/forxa/structures/productCarrierTray.ts',
  'reverse-tuck-end-box': 'src/engine/dieline/forxa/structures/reverseTuckEndBox.ts',
  'tuck-top-auto-bottom': 'src/engine/dieline/forxa/structures/tuckTopAutoBottom.ts',
  'rsc-carton': 'src/engine/dieline/forxa/structures/rscCarton.ts',
}

export function familyOf(template: FormaTemplate): PackFamily {
  const id = template.structureId
  if (id === 'tuck-end-box') return template.auxDevice ? 'forxa-tuck-aux' : 'native-tuck'
  if (id === 'reverse-tuck-end-box') return 'reverse-tuck'
  if (id === 'mailer-box') return 'mailer'
  if (id === 'sleeve') return 'sleeve'
  if (id === 'pillow-box') return 'pillow'
  if (id === 'snap-lock-box') return 'snap-lock'
  if (id === 'simple-tray') return 'simple-tray'
  if (id === 'tray-box') return 'glued-tray'
  if (id === 'rigid-gift-box') return 'rigid-gift'
  if (id === 'polygon-box') return 'polygon'
  if (id === 'product-carrier-tray') return 'carrier-tray'
  if (id === 'tuck-top-auto-bottom') return 'tuck-top-auto-bottom'
  if (id === 'rsc-carton') return 'rsc'
  throw new Error(`Unknown box structureId: ${id}`)
}

export function contractOf(template: FormaTemplate): FamilyContract {
  const family = familyOf(template)
  const polygonGlue = family === 'polygon' && Math.round(template.engineParams?.closureType ?? 0) === 0
  const contracts: Record<PackFamily, FamilyContract> = {
    'native-tuck': {
      family,
      glueRequired: true,
      creaseRequired: true,
      minPanels: 13,
      requiredAny: [['front'], ['back'], ['left'], ['right'], ['top'], ['bottom'], ['glue']],
      reflow: [
        { anyOf: ['front'], dim: 'L', axis: 'w' },
        { anyOf: ['front'], dim: 'H', axis: 'h' },
        { anyOf: ['left'], dim: 'W', axis: 'w' },
        { anyOf: ['top'], dim: 'L', axis: 'w' },
        { anyOf: ['top'], dim: 'W', axis: 'h' },
      ],
    },
    'forxa-tuck-aux': {
      family,
      glueRequired: true,
      creaseRequired: true,
      minPanels: 13,
      requiredAny: [
        ['front'],
        ['back'],
        ['side-left', 'left'],
        ['side-right', 'right'],
        ['glue-tab', 'glue'],
        ['top'],
        ['bottom'],
        ['top-tuck'],
        ['bottom-tuck'],
        ['dust-left-top', 'leftDustTop'],
      ],
      reflow: [
        { anyOf: ['front'], dim: 'L', axis: 'w' },
        { anyOf: ['front'], dim: 'H', axis: 'h' },
        { anyOf: ['left', 'side-left'], dim: 'W', axis: 'w' },
        { anyOf: ['top'], dim: 'L', axis: 'w' },
        { anyOf: ['top'], dim: 'W', axis: 'h' },
      ],
    },
    'reverse-tuck': {
      family,
      glueRequired: true,
      creaseRequired: true,
      minPanels: 7,
      requiredAny: [['front'], ['back'], ['side-left'], ['side-right'], ['glue-tab'], ['top-tuck'], ['bottom-tuck']],
      reflow: [
        { anyOf: ['front'], dim: 'L', axis: 'w' },
        { anyOf: ['front'], dim: 'H', axis: 'h' },
        { anyOf: ['side-left'], dim: 'W', axis: 'w' },
      ],
    },
    mailer: {
      family,
      glueRequired: false,
      creaseRequired: true,
      minPanels: 7,
      requiredAny: [['front'], ['back'], ['lid'], ['bottom'], ['lid-tuck'], ['side-flap-left'], ['side-flap-right']],
      reflow: [
        { anyOf: ['front'], dim: 'L', axis: 'w' },
        { anyOf: ['front'], dim: 'H', axis: 'h' },
        { anyOf: ['bottom'], dim: 'W', axis: 'h' },
      ],
    },
    sleeve: {
      family,
      glueRequired: true,
      creaseRequired: true,
      minPanels: 5,
      requiredAny: [['front'], ['back'], ['left'], ['right'], ['glue']],
      reflow: [
        { anyOf: ['front'], dim: 'L', axis: 'w' },
        { anyOf: ['front'], dim: 'H', axis: 'h' },
        { anyOf: ['left'], dim: 'W', axis: 'w' },
      ],
    },
    pillow: {
      family,
      glueRequired: true,
      creaseRequired: true,
      minPanels: 3,
      requiredAny: [['front'], ['back'], ['glue']],
      reflow: [{ anyOf: ['front'], dim: 'L', axis: 'w' }],
    },
    'snap-lock': {
      family,
      glueRequired: true,
      creaseRequired: true,
      minPanels: 7,
      requiredAny: [['front'], ['back'], ['glue-tab'], ['top-tuck'], ['bottom-lock'], ['side-left'], ['side-right']],
      reflow: [
        { anyOf: ['front'], dim: 'L', axis: 'w' },
        { anyOf: ['front'], dim: 'H', axis: 'h' },
      ],
    },
    'simple-tray': {
      family,
      glueRequired: false,
      creaseRequired: true,
      minPanels: 5,
      requiredAny: [['trayFront'], ['trayBack'], ['trayLeft'], ['trayRight'], ['trayBottom']],
      reflow: [
        { anyOf: ['trayBottom'], dim: 'L', axis: 'w' },
        { anyOf: ['trayBottom'], dim: 'W', axis: 'h' },
        { anyOf: ['trayFront'], dim: 'H', axis: 'h' },
      ],
    },
    'glued-tray': {
      family,
      glueRequired: true,
      creaseRequired: true,
      minPanels: 7,
      requiredAny: [['front'], ['back'], ['left'], ['right'], ['bottom'], ['glue-left'], ['glue-right']],
      reflow: [
        { anyOf: ['bottom'], dim: 'L', axis: 'w' },
        { anyOf: ['bottom'], dim: 'W', axis: 'h' },
      ],
    },
    'rigid-gift': {
      family,
      glueRequired: false,
      creaseRequired: true,
      minPanels: 6,
      requiredAny: [['base-front'], ['base-back'], ['base-left'], ['base-right'], ['base-bottom'], ['lid-top']],
      reflow: [
        { anyOf: ['base-bottom'], dim: 'L', axis: 'w' },
        { anyOf: ['base-bottom'], dim: 'W', axis: 'h' },
      ],
    },
    polygon: {
      family,
      glueRequired: polygonGlue,
      creaseRequired: true,
      minPanels: 4,
      requiredAny: polygonGlue ? [['base'], ['wall-0'], ['glue-tab']] : [['base'], ['wall-0']],
      reflow: [
        { anyOf: ['wall-0'], dim: 'L', axis: 'w' },
        { anyOf: ['wall-0'], dim: 'H', axis: 'h' },
      ],
    },
    'carrier-tray': {
      family,
      glueRequired: true,
      creaseRequired: true,
      minPanels: 8,
      requiredAny: [['front'], ['back'], ['left'], ['right'], ['base'], ['cell-0'], ['glue-left'], ['glue-right']],
      reflow: [
        { anyOf: ['base'], dim: 'L', axis: 'w' },
        { anyOf: ['base'], dim: 'W', axis: 'h' },
      ],
    },
    'tuck-top-auto-bottom': {
      family,
      glueRequired: true,
      creaseRequired: true,
      minPanels: 12,
      requiredAny: [['front'], ['back'], ['side-left'], ['side-right'], ['glue-tab'], ['top-tuck'], ['auto-bottom-front']],
      reflow: [
        { anyOf: ['front'], dim: 'L', axis: 'w' },
        { anyOf: ['front'], dim: 'H', axis: 'h' },
        { anyOf: ['side-left'], dim: 'W', axis: 'w' },
      ],
    },
    rsc: {
      family,
      glueRequired: true,
      creaseRequired: true,
      minPanels: 13,
      requiredAny: [['front'], ['back'], ['side-left'], ['side-right'], ['glue-tab'], ['major-top-front'], ['minor-top-left']],
      reflow: [
        { anyOf: ['front'], dim: 'L', axis: 'w' },
        { anyOf: ['front'], dim: 'H', axis: 'h' },
        { anyOf: ['side-left'], dim: 'W', axis: 'w' },
      ],
    },
  }
  return contracts[family]
}

export function listBoxTemplates(): FormaTemplate[] {
  return FORMA_TEMPLATES.filter((t) => t.packagingMode === 'box')
}

export function listExcludedLabels(): { id: string; structureId: StructureId }[] {
  return FORMA_TEMPLATES.filter((t) => t.packagingMode === 'label').map((t) => ({
    id: t.id,
    structureId: t.structureId,
  }))
}

export function buildInventory(): {
  scope: string
  count: number
  excludedLabelCount: number
  excludedLabels: { id: string; structureId: StructureId }[]
  templates: BoxTemplateRow[]
  builders: BoxBuilderRow[]
} {
  const templates = listBoxTemplates().map((t) => {
    const contract = contractOf(t)
    return {
      templateId: t.id,
      structureId: t.structureId,
      packType: 'box' as const,
      packFamily: contract.family,
      library: t.library === 'advanced' ? ('advanced' as const) : ('core' as const),
      auxDevice: t.auxDevice,
      engineParams: t.engineParams,
      defaultsMm: t.defaultsMm,
      entrypoints: {
        catalog: CATALOG,
        facade: FACADE,
        builder:
          contract.family === 'forxa-tuck-aux'
            ? 'src/engine/dieline/forxa/structures/tuckEndBox.ts'
            : contract.family === 'native-tuck'
              ? 'src/engine/dieline/dielineStructures.ts'
              : (BUILDER_FILE[t.structureId] ?? 'unknown'),
      },
      contract,
    }
  })

  const boxStructures = [...new Set(templates.map((t) => t.structureId))]
  const builders: BoxBuilderRow[] = boxStructures.map((structureId) => ({
    structureId,
    packType: 'box',
    route: structureId === 'tuck-end-box' || structureId === 'simple-tray' ? 'native' : FORXA_ROUTED.has(structureId) ? 'forxa' : 'native',
    file: BUILDER_FILE[structureId] ?? 'unknown',
    catalogTemplateIds: templates.filter((t) => t.structureId === structureId).map((t) => t.templateId),
  }))
  // Native tuck shares structureId with Forxa-aux; document both routes.
  const tuck = builders.find((b) => b.structureId === 'tuck-end-box')
  if (tuck) {
    tuck.route = 'native'
    tuck.catalogTemplateIds = templates.filter((t) => t.structureId === 'tuck-end-box' && t.packFamily === 'native-tuck').map((t) => t.templateId)
    builders.push({
      structureId: 'tuck-end-box',
      packType: 'box',
      route: 'forxa',
      file: 'src/engine/dieline/forxa/structures/tuckEndBox.ts',
      catalogTemplateIds: templates.filter((t) => t.packFamily === 'forxa-tuck-aux').map((t) => t.templateId),
    })
  }

  const excludedLabels = listExcludedLabels()
  return {
    scope: 'BOX dieline motor only',
    count: templates.length,
    excludedLabelCount: excludedLabels.length,
    excludedLabels,
    templates,
    builders,
  }
}

export function stressSets(d: DimensionsMm): { name: string; dims: DimensionsMm }[] {
  const r = (n: number) => Math.round(n)
  return [
    { name: 'default', dims: { ...d } },
    {
      name: 'compact',
      dims: { L: r(Math.max(36, d.L * 0.62)), W: r(Math.max(22, d.W * 0.62)), H: r(Math.max(28, d.H * 0.62)) },
    },
    {
      name: 'stress',
      dims: { L: r(d.L * 1.35), W: r(Math.max(28, d.W * 0.78)), H: r(d.H * 1.22) },
    },
  ]
}
