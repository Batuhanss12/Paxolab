/**
 * MatBixx StructureEngine — Sleeve (Kılıf)
 *
 * PAXOLAB parametrik sleeve şablonundan uyarlandı.
 * Kılıf — 4 panel + glue tab, üst/alt açık, katlama çizgileri ile.
 *
 * Net Layout (yatay açılım):
 *
 *   [GlueTab] [Left] [Front] [Right] [Back]
 *      W_g      W_d    W_w    W_d     W_w
 *
 * Üst/alt kapak yok — sleeve açık uçlu.
 * 4 score line: glue|left, left|front, front|right, right|back
 *
 * Parametreler:
 *   length (L)  — ön/arka panel genişliği (mm)
 *   width  (W)  — yan panel genişliği (mm) = derinlik
 *   height (H)  — sleeve yüksekliği (mm)
 *   glueTabWidth — yapıştırma kulağı genişliği (mm, default L*0.15)
 */

import type {
  PackagingStructure,
  StructureParameter,
  DielineResult,
  ValidationResult,
  Path,
  FoldLine,
  Panel,
  StructureMetadata,
} from '../types';
import { SVGBuilder } from '../svgBuilder';
import { validateParameters, getDefaultParams, mergeParams } from '../validator';

export class Sleeve implements PackagingStructure {
  id = 'sleeve';
  name = 'Sleeve (Kılıf)';
  category = 'box' as const;
  description = 'Kılıf kutu — 4 panel + glue tab, üst/alt açık, katlama çizgileri ile';
  icon = 'box';

  parameters: StructureParameter[] = [
    { key: 'length', label: 'Boy (L)', unit: 'mm', min: 20, max: 500, default: 100, step: 1, required: true, description: 'Ön/arka panel genişliği' },
    { key: 'width', label: 'En (W)', unit: 'mm', min: 10, max: 300, default: 60, step: 1, required: true, description: 'Yan panel genişliği (derinlik)' },
    { key: 'height', label: 'Yükseklik (H)', unit: 'mm', min: 10, max: 400, default: 150, step: 1, required: true, description: 'Sleeve yüksekliği' },
    { key: 'glueTabWidth', label: 'Yapıştırma Kulağı', unit: 'mm', min: 5, max: 50, default: 15, step: 1, required: false, description: 'Glue tab genişliği' },
  ];

  getDefaultParameters(): Record<string, number> {
    return getDefaultParams(this.parameters);
  }

  validateParameters(params: Record<string, number>): ValidationResult {
    const base = validateParameters(params, this.parameters);
    if (!base.valid) return base;

    const warnings: string[] = [];
    const { length, height, glueTabWidth } = params;

    if (glueTabWidth > length * 0.3) {
      warnings.push(`Glue tab (${glueTabWidth}mm) boyun %30'undan fazla — çok geniş`);
    }
    if (height < 20) {
      warnings.push(`Yükseklik (${height}mm) çok düşük — sleeve dar olabilir`);
    }

    return { valid: true, errors: [], warnings };
  }

  generateDieline(params: Record<string, number>): DielineResult {
    const p = mergeParams(this.getDefaultParameters(), params);
    const { length: L, width: W, height: H, glueTabWidth: glueW } = p;

    // Layout: [GlueTab] [Left] [Front] [Right] [Back]
    //   GlueTab: 0 → glueW
    //   Left:    glueW → glueW + W
    //   Front:   glueW + W → glueW + W + L
    //   Right:   glueW + W + L → glueW + 2W + L
    //   Back:    glueW + 2W + L → glueW + 2W + 2L
    const x0 = 0;
    const x1 = glueW;
    const x2 = glueW + W;
    const x3 = glueW + W + L;
    const x4 = glueW + 2 * W + L;
    const x5 = glueW + 2 * W + 2 * L;
    const y0 = 0;
    const y1 = H;

    const totalW = x5;
    const totalH = H;

    // ─── Panels ──────────────────────────────────────────────
    const panels: Panel[] = [
      {
        id: 'glue',
        name: 'Glue Tab',
        face: 'glue',
        polygon: [
          { x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 },
        ],
      },
      {
        id: 'left',
        name: 'Left Panel',
        face: 'left',
        polygon: [
          { x: x1, y: y0 }, { x: x2, y: y0 }, { x: x2, y: y1 }, { x: x1, y: y1 },
        ],
      },
      {
        id: 'front',
        name: 'Front Panel',
        face: 'front',
        polygon: [
          { x: x2, y: y0 }, { x: x3, y: y0 }, { x: x3, y: y1 }, { x: x2, y: y1 },
        ],
      },
      {
        id: 'right',
        name: 'Right Panel',
        face: 'right',
        polygon: [
          { x: x3, y: y0 }, { x: x4, y: y0 }, { x: x4, y: y1 }, { x: x3, y: y1 },
        ],
      },
      {
        id: 'back',
        name: 'Back Panel',
        face: 'back',
        polygon: [
          { x: x4, y: y0 }, { x: x5, y: y0 }, { x: x5, y: y1 }, { x: x4, y: y1 },
        ],
      },
    ];

    // ─── Cut Lines (dış kontur) ───────────────────────────────
    const cut: Path[] = [
      // Dış dikdörtgen (glue tab dahil tüm dış kenar)
      [
        { x: x0, y: y0 }, { x: x5, y: y0 }, { x: x5, y: y1 }, { x: x0, y: y1 },
      ],
    ];

    // ─── Crease Lines (katlama) ──────────────────────────────
    const crease: Path[] = [
      // glue | left
      [{ x: x1, y: y0 }, { x: x1, y: y1 }],
      // left | front
      [{ x: x2, y: y0 }, { x: x2, y: y1 }],
      // front | right
      [{ x: x3, y: y0 }, { x: x3, y: y1 }],
      // right | back
      [{ x: x4, y: y0 }, { x: x4, y: y1 }],
    ];

    // ─── Glue Lines ──────────────────────────────────────────
    const glue: Path[] = [
      // Glue tab alanı (kesikli)
      [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }],
    ];

    // ─── Folds (3D için) ─────────────────────────────────────
    const folds: FoldLine[] = [
      { from: { x: x1, y: y0 }, to: { x: x1, y: y1 }, angle: 90, type: 'valley' },
      { from: { x: x2, y: y0 }, to: { x: x2, y: y1 }, angle: 90, type: 'valley' },
      { from: { x: x3, y: y0 }, to: { x: x3, y: y1 }, angle: 90, type: 'valley' },
      { from: { x: x4, y: y0 }, to: { x: x4, y: y1 }, angle: 90, type: 'valley' },
    ];

    // ─── SVG ─────────────────────────────────────────────────
    const builder = new SVGBuilder({
      width: totalW,
      height: totalH,
      margin: 10,
      showGrid: true,
      gridSize: 5,
      showDimensions: true,
      showRegMarks: true,
    });

    for (const p of cut) builder.addCutPath(p);
    for (const p of crease) builder.addCreasePath(p);
    for (const p of glue) builder.addGluePath(p);
    for (const f of folds) builder.addFold(f);
    for (const panel of panels) builder.addPanel(panel);

    builder.addDimension({ x: x0, y: y1 + 5 }, { x: x5, y: y1 + 5 }, `L=${L} W=${W}`, 8);
    builder.addDimension({ x: x5 + 5, y: y0 }, { x: x5 + 5, y: y1 }, `H=${H}`, 10);

    const svg = builder.build();

    // ─── Metadata ────────────────────────────────────────────
    const totalArea = totalW * totalH;
    const panelArea = (2 * L + 2 * W + glueW) * H;
    const materialUsage = panelArea;
    const wastePercentage = ((totalArea - panelArea) / totalArea) * 100;

    const metadata: StructureMetadata = {
      totalArea,
      materialUsage,
      wastePercentage: Math.max(0, wastePercentage),
      boundingBox: { width: totalW, height: totalH },
      recommendedMaterial: 'FoldingCarton',
      complexity: 'simple',
      industryCompliance: [],
    };

    return {
      success: true,
      structureId: this.id,
      structureName: this.name,
      svg,
      paths: { cut, crease, glue, perf: [] },
      folds,
      panels,
      bounds: { width: totalW, height: totalH },
      metadata,
      warnings: [],
      errors: [],
    };
  }
}
