import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { DesignBrief, DielineModel, DimensionsMm, Panel } from '../../../types'
import { emptyBrief } from '../../fields'
import { FormaLocalEngine } from '../../FormaLocalEngine'
import { buildDieline } from '../buildDieline'
import { isGluePanel } from '../panelKind'
import { renderStructureDoc } from '../renderDielineSvg'
import { type BoxTemplateRow, type FamilyContract, buildInventory, listBoxTemplates, stressSets } from './boxContracts'

export type Severity = 'P0' | 'P1' | 'P2'

export type Finding = {
  severity: Severity
  code: string
  message: string
  sample?: string
}

export type SampleAudit = {
  name: string
  dims: DimensionsMm
  ok: boolean
  crashed: boolean
  crashMessage?: string
  findings: Finding[]
  panels: number
  cut: number
  crease: number
  glue: number
}

export type TemplateAudit = {
  templateId: string
  structureId: string
  packFamily: string
  samples: SampleAudit[]
  p0: Finding[]
  p1: Finding[]
  p2: Finding[]
  status: 'pass' | 'fail' | 'fixed' | 'deferred'
}

export type CertResult = {
  scope: string
  generatedAt: string
  inventoryCount: number
  templateCount: number
  sampleCount: number
  p0: number
  p1: number
  p2: number
  verdict: 'PASS' | 'FAIL'
  templates: TemplateAudit[]
  progressNote: string[]
  commands: string[]
}

function briefFor(templateId: string, dims: DimensionsMm): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'CERT',
    productName: 'Box',
    sector: 'kozmetik',
    subProduct: 'kutu',
    packagingMode: 'box',
    templateId,
    dimensionsMm: dims,
    styleType: 'minimal',
  }
}

function finite(n: number): boolean {
  return Number.isFinite(n)
}

function findAny(panels: Panel[], ids: string[]): Panel | undefined {
  return panels.find((p) => ids.includes(p.id))
}

function parseSvg(svg: string): Finding[] {
  const out: Finding[] = []
  if (!svg.includes('<svg') || !svg.includes('</svg>')) {
    out.push({ severity: 'P0', code: 'SVG_PARSE', message: 'SVG parse failed (no svg root)' })
    return out
  }
  const vb = /viewBox="0 0 ([0-9.eE+-]+) ([0-9.eE+-]+)"/.exec(svg)
  if (!vb) {
    out.push({ severity: 'P0', code: 'SVG_VIEWBOX', message: 'viewBox missing or not "0 0 W H"' })
    return out
  }
  const w = Number(vb[1])
  const h = Number(vb[2])
  if (!finite(w) || !finite(h) || w <= 0 || h <= 0) {
    out.push({ severity: 'P0', code: 'SVG_BOUNDS', message: `viewBox not sane: ${w}×${h}` })
  } else if (w * h < 4) {
    out.push({ severity: 'P0', code: 'SVG_AREA', message: `SVG area collapsed: ${w}×${h}` })
  }
  if (!/data-type="cut"/.test(svg)) {
    out.push({ severity: 'P0', code: 'SVG_CUT_LAYER', message: 'SVG has no data-type=cut path' })
  }
  return out
}

function auditModel(row: BoxTemplateRow, sample: string, dims: DimensionsMm, model: DielineModel, svg: string): Finding[] {
  const findings: Finding[] = []
  const c: FamilyContract = row.contract

  findings.push(...parseSvg(svg))

  if (!finite(model.width) || !finite(model.height) || model.width <= 0 || model.height <= 0) {
    findings.push({ severity: 'P0', code: 'NET_BOUNDS', message: `net ${model.width}×${model.height}`, sample })
  }
  if (model.cut.length === 0) {
    findings.push({ severity: 'P0', code: 'CUT_MISSING', message: 'CUT empty', sample })
  }
  const rings = model.cut.filter((r) => r.length >= 3)
  if (model.cut.length > 0 && rings.length === 0) {
    findings.push({ severity: 'P0', code: 'CUT_INCOHERENT', message: 'CUT has no 3+ point ring', sample })
  }
  if (c.creaseRequired && model.crease.length === 0) {
    findings.push({ severity: 'P0', code: 'CREASE_MISSING', message: 'CREASE empty on foldable pack', sample })
  }
  const gluePanels = model.panels.filter((p) => isGluePanel(p) || model.glueIds.includes(p.id))
  if (c.glueRequired && gluePanels.length === 0) {
    findings.push({ severity: 'P0', code: 'GLUE_MISSING', message: 'GLUE required for this family but no glue panel/id', sample })
  }

  for (const p of model.panels) {
    if (!finite(p.x) || !finite(p.y) || !finite(p.w) || !finite(p.h) || p.w <= 0 || p.h <= 0) {
      findings.push({
        severity: 'P0',
        code: 'PANEL_COLLAPSE',
        message: `panel ${p.id} ${p.w}×${p.h} at ${p.x},${p.y}`,
        sample,
      })
    }
  }
  if (model.panels.length < c.minPanels) {
    findings.push({
      severity: 'P1',
      code: 'PANEL_COUNT',
      message: `panels ${model.panels.length} < min ${c.minPanels}`,
      sample,
    })
  }

  for (const group of c.requiredAny) {
    if (!findAny(model.panels, group)) {
      findings.push({
        severity: 'P0',
        code: 'PANEL_MISSING',
        message: `required panel missing (any of ${group.join('|')})`,
        sample,
      })
    }
  }

  if (!finite(model.dimensions.L) || !finite(model.dimensions.W) || !finite(model.dimensions.H)) {
    findings.push({ severity: 'P0', code: 'DIM_NAN', message: 'L/W/H not finite on model', sample })
  }
  if (model.dimensions.L <= 0 || model.dimensions.W <= 0 || model.dimensions.H <= 0) {
    findings.push({ severity: 'P0', code: 'DIM_INVERTED', message: `dims ${model.dimensions.L}×${model.dimensions.W}×${model.dimensions.H}`, sample })
  }
  if (Math.abs(model.dimensions.L - dims.L) > 0.01 || Math.abs(model.dimensions.W - dims.W) > 0.01 || Math.abs(model.dimensions.H - dims.H) > 0.01) {
    findings.push({
      severity: 'P0',
      code: 'DIM_MISMATCH',
      message: `requested ${dims.L}×${dims.W}×${dims.H} got ${model.dimensions.L}×${model.dimensions.W}×${model.dimensions.H}`,
      sample,
    })
  }

  for (const rule of c.reflow) {
    const panel = findAny(model.panels, rule.anyOf)
    if (!panel) continue
    const got = rule.axis === 'w' ? panel.w : panel.h
    const exp = dims[rule.dim]
    const tol = Math.max(2.5, exp * 0.12)
    if (got + 0.05 < exp - tol) {
      findings.push({
        severity: 'P0',
        code: 'REFLOW_COLLAPSE',
        message: `${panel.id}.${rule.axis}=${got.toFixed(2)} vs ${rule.dim}=${exp} (collapsed)`,
        sample,
      })
    } else if (Math.abs(got - exp) > tol) {
      findings.push({
        severity: 'P1',
        code: 'REFLOW_PROPORTION',
        message: `${panel.id}.${rule.axis}=${got.toFixed(2)} vs ${rule.dim}=${exp}`,
        sample,
      })
    }
  }

  for (const f of model.structural?.findings ?? []) {
    if (f.code === 'CUT_SELF_INTERSECTION' && f.severity === 'FATAL') {
      findings.push({ severity: 'P0', code: 'CUT_SELF_INTERSECTION', message: f.message, sample })
    } else if (f.severity === 'FATAL' && f.code !== 'CUT_OPEN') {
      findings.push({ severity: 'P0', code: f.code, message: f.message, sample })
    } else if (f.severity === 'ERROR') {
      findings.push({ severity: 'P1', code: f.code, message: f.message, sample })
    }
  }

  if (!model.consistent) {
    findings.push({
      severity: 'P0',
      code: 'INCONSISTENT',
      message: model.issues.join(' | ') || 'consistent=false',
      sample,
    })
  }

  if (gluePanels.some((p) => p.w > dims.L * 0.7 && p.h > dims.H * 0.7)) {
    findings.push({ severity: 'P1', code: 'GLUE_ABSURD', message: 'glue panel larger than 70% of L×H', sample })
  }

  if (row.packFamily === 'forxa-tuck-aux' && (!findAny(model.panels, ['top']) || !findAny(model.panels, ['bottom']))) {
    findings.push({
      severity: 'P0',
      code: 'FORXA_TUCK_NO_LID',
      message: 'Forxa aux tuck missing L×W lid',
      sample,
    })
  }

  return findings
}

function auditTemplate(row: BoxTemplateRow): TemplateAudit {
  const samples: SampleAudit[] = []
  const engine = new FormaLocalEngine()

  for (const set of stressSets(row.defaultsMm)) {
    const findings: Finding[] = []
    let crashed = false
    let crashMessage: string | undefined
    let model: DielineModel | undefined
    try {
      model = buildDieline(row.structureId, briefFor(row.templateId, set.dims))
      const svg = renderStructureDoc(model, row.templateId)
      findings.push(...auditModel(row, set.name, set.dims, model, svg))
    } catch (err) {
      crashed = true
      crashMessage = err instanceof Error ? err.message : String(err)
      findings.push({ severity: 'P0', code: 'CRASH', message: crashMessage, sample: set.name })
    }

    if (!crashed) {
      try {
        engine.generate({ brief: briefFor(row.templateId, set.dims) })
      } catch (err) {
        crashed = true
        crashMessage = err instanceof Error ? err.message : String(err)
        findings.push({ severity: 'P0', code: 'ENGINE_CRASH', message: crashMessage, sample: set.name })
      }
    }

    samples.push({
      name: set.name,
      dims: set.dims,
      ok: findings.filter((f) => f.severity === 'P0').length === 0,
      crashed,
      crashMessage,
      findings,
      panels: model?.panels.length ?? 0,
      cut: model?.cut.length ?? 0,
      crease: model?.crease.length ?? 0,
      glue: model?.glueIds.length ?? 0,
    })
  }

  const flat = samples.flatMap((s) => s.findings)
  const p0 = uniqueFindings(flat.filter((f) => f.severity === 'P0'))
  const p1 = uniqueFindings(flat.filter((f) => f.severity === 'P1'))
  const p2 = uniqueFindings(flat.filter((f) => f.severity === 'P2'))
  return {
    templateId: row.templateId,
    structureId: row.structureId,
    packFamily: row.packFamily,
    samples,
    p0,
    p1,
    p2,
    status: p0.length ? 'fail' : 'pass',
  }
}

function uniqueFindings(list: Finding[]): Finding[] {
  const seen = new Set<string>()
  const out: Finding[] = []
  for (const f of list) {
    const key = `${f.code}:${f.message}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(f)
  }
  return out
}

export function runBoxCert(opts?: { write?: boolean; outDir?: string; fixedIds?: string[] }): CertResult {
  const inventory = buildInventory()
  const catalog = listBoxTemplates()
  if (inventory.count !== catalog.length) {
    throw new Error(`Inventory/catalog split: inventory ${inventory.count} vs catalog boxes ${catalog.length}`)
  }

  const audits = inventory.templates.map(auditTemplate)
  const fixed = new Set(opts?.fixedIds ?? [])
  for (const a of audits) {
    if (a.status === 'fail' && fixed.has(a.templateId) && a.p0.length === 0) a.status = 'fixed'
    if (a.status === 'pass' && fixed.has(a.templateId)) a.status = 'fixed'
  }

  const p0 = audits.reduce((n, a) => n + a.p0.length, 0)
  const p1 = audits.reduce((n, a) => n + a.p1.length, 0)
  const p2 = audits.reduce((n, a) => n + a.p2.length, 0)
  const sampleCount = audits.reduce((n, a) => n + a.samples.length, 0)
  const generatedAt = new Date().toISOString()
  const result: CertResult = {
    scope: 'BOX dieline motor only',
    generatedAt,
    inventoryCount: inventory.count,
    templateCount: audits.length,
    sampleCount,
    p0,
    p1,
    p2,
    verdict: p0 === 0 ? 'PASS' : 'FAIL',
    templates: audits,
    progressNote: [],
    commands: [
      'npx --yes vite-node scripts/forma-box-cert.ts',
      'npx vitest run src/engine/dieline/formaBoxCert.test.ts',
      'npx vitest run',
    ],
  }

  if (opts?.write) writeBoxCertArtifacts(result, opts.outDir)
  return result
}

export function writeBoxCertArtifacts(result: CertResult, outDir?: string): string {
  const dir = outDir ?? join(process.cwd(), 'certs', 'box-motor')
  mkdirSync(dir, { recursive: true })
  writeInventory(dir, buildInventory())
  writeFileSync(join(dir, 'AUDIT_RAW.json'), JSON.stringify(result, null, 2), 'utf8')
  writeFileSync(join(dir, 'FORXA_BOX_MOTOR_CERTIFICATION.json'), JSON.stringify(summarize(result), null, 2), 'utf8')
  writeFileSync(join(dir, 'FORXA_BOX_MOTOR_CERTIFICATION.md'), renderCertMd(result, result.inventoryCount), 'utf8')
  return dir
}

function writeInventory(dir: string, inventory: ReturnType<typeof buildInventory>): void {
  writeFileSync(join(dir, 'TEMPLATES_INVENTORY.json'), JSON.stringify(inventory, null, 2), 'utf8')
  const lines = [
    '# BOX templates inventory',
    '',
    `Scope: BOX dieline motor only. Labels excluded (${inventory.excludedLabelCount}).`,
    '',
    `**N = ${inventory.count}**`,
    '',
    '| templateId | structureId | packFamily | library | default L×W×H | builder |',
    '|---|---|---|---|---|---|',
    ...inventory.templates.map(
      (t) =>
        `| ${t.templateId} | ${t.structureId} | ${t.packFamily} | ${t.library} | ${t.defaultsMm.L}×${t.defaultsMm.W}×${t.defaultsMm.H}${t.auxDevice ? ` +x${t.auxDevice}` : ''} | \`${t.entrypoints.builder}\` |`,
    ),
    '',
    '## Builders',
    '',
    '| structureId | route | file | catalog ids |',
    '|---|---|---|---|',
    ...inventory.builders.map((b) => `| ${b.structureId} | ${b.route} | \`${b.file}\` | ${b.catalogTemplateIds.join(', ')} |`),
    '',
    '## Excluded (not box)',
    '',
    ...inventory.excludedLabels.map((l) => `- ${l.id} (${l.structureId})`),
    '',
  ]
  writeFileSync(join(dir, 'TEMPLATES_INVENTORY.md'), lines.join('\n'), 'utf8')
}

function summarize(result: CertResult) {
  return {
    scope: result.scope,
    generatedAt: result.generatedAt,
    verdict: result.verdict,
    counts: {
      templates: result.templateCount,
      samples: result.sampleCount,
      p0: result.p0,
      p1: result.p1,
      p2: result.p2,
      pass: result.templates.filter((t) => t.status === 'pass').length,
      fail: result.templates.filter((t) => t.status === 'fail').length,
      fixed: result.templates.filter((t) => t.status === 'fixed').length,
      deferred: result.templates.filter((t) => t.status === 'deferred').length,
    },
    templates: result.templates.map((t) => ({
      templateId: t.templateId,
      structureId: t.structureId,
      status: t.status,
      p0: t.p0,
      p1: t.p1,
      p2: t.p2,
    })),
    openP0: result.templates.filter((t) => t.p0.length).map((t) => ({ templateId: t.templateId, p0: t.p0 })),
    commands: result.commands,
    progressNote: result.progressNote,
  }
}

function renderCertMd(result: CertResult, n: number): string {
  const open = result.templates.filter((t) => t.p0.length)
  const rows = result.templates.map(
    (t) =>
      `| ${t.templateId} | ${t.structureId} | ${t.status} | ${t.p0.length} | ${t.p1.length} | ${t.p2.length} |`,
  )
  return [
    '# FORXA — BOX DIELINE MOTOR CERTIFICATION',
    '',
    `Scope: **BOX dieline motor only**. N = ${n} catalog box templates × 3 L/W/H sets = ${result.sampleCount} samples.`,
    '',
    `Generated: ${result.generatedAt}`,
    '',
    `## VERDICT: ${result.verdict}`,
    '',
    `- P0: ${result.p0}`,
    `- P1: ${result.p1}`,
    `- P2: ${result.p2}`,
    `- pass / fail / fixed / deferred: ${result.templates.filter((t) => t.status === 'pass').length} / ${result.templates.filter((t) => t.status === 'fail').length} / ${result.templates.filter((t) => t.status === 'fixed').length} / ${result.templates.filter((t) => t.status === 'deferred').length}`,
    '',
    'PASS iff zero open P0 and `forma-box-cert` exits 0.',
    '',
    '## Templates',
    '',
    '| templateId | structureId | status | P0 | P1 | P2 |',
    '|---|---|---|---|---|---|',
    ...rows,
    '',
    open.length
      ? ['## Open P0', '', ...open.flatMap((t) => [`### ${t.templateId}`, ...t.p0.map((f) => `- \`${f.code}\` ${f.message}${f.sample ? ` (${f.sample})` : ''}`), ''])].join('\n')
      : '## Open P0\n\nNone.',
    '',
    '## Progress note',
    '',
    ...(result.progressNote.length ? result.progressNote.map((l) => `- ${l}`) : ['- See run output / git diff for this pass.']),
    '',
    '## Re-run',
    '',
    ...result.commands.map((c) => `- \`${c}\``),
    '',
  ].join('\n')
}

export function applyProgress(result: CertResult, notes: string[]): CertResult {
  result.progressNote = notes
  return result
}
