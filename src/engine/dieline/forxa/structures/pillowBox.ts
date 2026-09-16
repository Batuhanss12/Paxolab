/**
 * Forxa StructureEngine — Pillow Box (Yastık Kutu)
 *
 * PAXOLAB parametrik pillow şablonundan uyarlandı.
 * Yastık kutu — kavisli üst/alt kapanma, glue tab, tek parça net.
 *
 * Net Layout (yatay açılım):
 *
 *   ┌──────────────────────────────────────────┐
 *   │   Curved Top Flap (kavisli üst kapanma)    │
 *   ├──────┬───────────────┬──────────────┬─────┤
 *   │ Glue │   Back Panel  │  Front Panel │ Glue│
 *   │ Tab  │               │              │ Tab │
 *   ├──────┴───────────────┴──────────────┴─────┤
 *   │   Curved Bottom Flap (kavisli alt kapanma) │
 *   └──────────────────────────────────────────┘
 *
 * Üst/alt flap'ler kavisli — pillow şekli.
 * 2 score line: üst panel sınırı, alt panel sınırı
 * 1 score line: back|front ortası
 *
 * Parametreler (Forxa keys):
 *   length — ön/arka panel genişliği ← brief L
 *   width  — panel yüksekliği ← brief H
 *   depth  — kutu derinliği / flap ← brief W
 *   glueTabWidth — yapıştırma kulağı genişliği (mm)
 *   curveRadius — kavisli flap radyusu (mm)
 */

import type {
  PackagingStructure,
  StructureParameter,
  DielineResult,
  ValidationResult,
  Point,
  Path,
  FoldLine,
  Panel,
  StructureMetadata,
} from '../types';
import { SVGBuilder } from '../svgBuilder';
import { validateParameters, getDefaultParams, mergeParams } from '../validator';

export class PillowBox implements PackagingStructure {
  id = 'pillow-box';
  name = 'Pillow Box (Yastık Kutu)';
  category = 'box' as const;
  description = 'Yastık kutu — kavisli üst/alt kapanma, glue tab, tek parça net';
  icon = 'box';

  parameters: StructureParameter[] = [
    { key: 'length', label: 'Boy (L)', unit: 'mm', min: 30, max: 300, default: 100, step: 1, required: true, description: 'Ön/arka panel genişliği' },
    { key: 'width', label: 'Yükseklik (H)', unit: 'mm', min: 20, max: 200, default: 80, step: 1, required: true, description: 'Panel yüksekliği' },
    { key: 'depth', label: 'Derinlik (D)', unit: 'mm', min: 10, max: 100, default: 40, step: 1, required: true, description: 'Kutu derinliği (flap yüksekliği)' },
    { key: 'glueTabWidth', label: 'Yapıştırma Kulağı', unit: 'mm', min: 5, max: 40, default: 15, step: 1, required: false, description: 'Glue tab genişliği' },
    { key: 'curveRadius', label: 'Kavis Radyusu', unit: 'mm', min: 5, max: 50, default: 20, step: 1, required: false, description: 'Kavisli flap radyusu' },
  ];

  getDefaultParameters(): Record<string, number> {
    return getDefaultParams(this.parameters);
  }

  validateParameters(params: Record<string, number>): ValidationResult {
    const base = validateParameters(params, this.parameters);
    if (!base.valid) return base;

    const warnings: string[] = [];
    const { width, depth, curveRadius } = params;

    if (curveRadius > depth * 0.8) {
      warnings.push(`Kavis radyusu (${curveRadius}mm) derinliğin %80'inden fazla — flap çok kavisli`);
    }
    if (depth > width * 0.7) {
      warnings.push(`Derinlik (${depth}mm) yüksekliğin %70'inden fazla — kutu çok şişkin`);
    }

    return { valid: true, errors: [], warnings };
  }

  generateDieline(params: Record<string, number>): DielineResult {
    const p = mergeParams(this.getDefaultParameters(), params);
    const { length: L, width: W, depth: D, glueTabWidth: glueW, curveRadius: R } = p;

    // Layout:
    //   Y: 0 → D (üst flap)
    //   Y: D → D + W (panel alanı)
    //   Y: D + W → 2D + W (alt flap)
    //
    //   X: 0 → glueW (glue tab sol)
    //   X: glueW → glueW + L (back panel)
    //   X: glueW + L → glueW + 2L (front panel)
    //   X: glueW + 2L → glueW + 2L + glueW (glue tab sağ — opsiyonel, biz tek glue kullanıyorz)

    const x0 = 0;
    const x1 = glueW;
    const x2 = glueW + L;
    const x3 = glueW + 2 * L;
    const y0 = 0;
    const y1 = D;
    const y2 = D + W;
    const y3 = 2 * D + W;

    const totalW = x3;
    const totalH = y3;

    // ─── Kavisli flap noktaları üret ──────────────────────────
    // Üst flap: y0'dan y1'e, kavisli
    const topFlapPoints: Point[] = this.generateCurvedFlap(x1, y0, x2, y0, y1, R, 'top');
    // Alt flap: y2'den y3'e, kavisli
    const bottomFlapPoints: Point[] = this.generateCurvedFlap(x1, y2, x2, y2, y3, R, 'bottom');

    // ─── Panels ──────────────────────────────────────────────
    const panels: Panel[] = [
      {
        id: 'glue',
        name: 'Glue Tab',
        face: 'glue',
        polygon: [
          { x: x0, y: y1 }, { x: x1, y: y1 }, { x: x1, y: y2 }, { x: x0, y: y2 },
        ],
      },
      {
        id: 'back',
        name: 'Back Panel',
        face: 'back',
        polygon: [
          { x: x1, y: y1 }, { x: x2, y: y1 }, { x: x2, y: y2 }, { x: x1, y: y2 },
        ],
      },
      {
        id: 'front',
        name: 'Front Panel',
        face: 'front',
        polygon: [
          { x: x2, y: y1 }, { x: x3, y: y1 }, { x: x3, y: y2 }, { x: x2, y: y2 },
        ],
      },
    ];

    // ─── Cut Lines (dış kontur — kavisli flap'ler dahil) ──────
    const cut: Path[] = [
      // Sol glue tab üst köşe → üst flap kavis → sağ üst köşe
      // → sağ alt köşe → alt flap kavis → sol alt köşe → glue tab
      [
        { x: x0, y: y1 },        // glue tab sol üst
        ...topFlapPoints,         // üst kavisli flap
        { x: x3, y: y1 },        // front panel sağ üst
        { x: x3, y: y2 },        // front panel sağ alt
        ...bottomFlapPoints,      // alt kavisli flap (ters sırada)
        { x: x0, y: y2 },        // glue tab sol alt
      ],
    ];

    // ─── Crease Lines (katlama) ──────────────────────────────
    const crease: Path[] = [
      // Üst flap sınırı (panel üst kenarı)
      [{ x: x1, y: y1 }, { x: x3, y: y1 }],
      // Alt flap sınırı (panel alt kenarı)
      [{ x: x1, y: y2 }, { x: x3, y: y2 }],
      // Back | Front ortası
      [{ x: x2, y: y1 }, { x: x2, y: y2 }],
      // Glue | Back
      [{ x: x1, y: y1 }, { x: x1, y: y2 }],
    ];

    // ─── Glue Lines ──────────────────────────────────────────
    const glue: Path[] = [
      [{ x: x0, y: y1 }, { x: x1, y: y1 }, { x: x1, y: y2 }, { x: x0, y: y2 }],
    ];

    // ─── Folds (3D için) ─────────────────────────────────────
    const folds: FoldLine[] = [
      { from: { x: x1, y: y1 }, to: { x: x3, y: y1 }, angle: 90, type: 'valley' },
      { from: { x: x1, y: y2 }, to: { x: x3, y: y2 }, angle: 90, type: 'valley' },
      { from: { x: x2, y: y1 }, to: { x: x2, y: y2 }, angle: 90, type: 'valley' },
      { from: { x: x1, y: y1 }, to: { x: x1, y: y2 }, angle: 90, type: 'valley' },
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

    builder.addDimension({ x: x0, y: y3 + 5 }, { x: x3, y: y3 + 5 }, `L=${L}`, 8);
    builder.addDimension({ x: x3 + 5, y: y1 }, { x: x3 + 5, y: y2 }, `W=${W}`, 10);

    const svg = builder.build();

    // ─── Metadata ────────────────────────────────────────────
    const totalArea = totalW * totalH;
    const panelArea = (2 * L + glueW) * W;
    const materialUsage = panelArea;
    const wastePercentage = ((totalArea - panelArea) / totalArea) * 100;

    const metadata: StructureMetadata = {
      totalArea,
      materialUsage,
      wastePercentage: Math.max(0, wastePercentage),
      boundingBox: { width: totalW, height: totalH },
      recommendedMaterial: 'FoldingCarton',
      complexity: 'medium',
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

  /**
   * Kavisli flap noktaları üret (pillow şekli).
   * Üst flap: merkez yukarı kavisli, alt flap: merkez aşağı kavisli.
   */
  private generateCurvedFlap(
    xStart: number, yStart: number, xEnd: number, _yEnd: number,
    flapHeight: number, radius: number, position: 'top' | 'bottom',
  ): Point[] {
    const points: Point[] = [];
    const segments = 16;
    const direction = position === 'top' ? -1 : 1;
    const curveDepth = Math.min(radius, flapHeight * 0.6);

    // Kavis: merkezde en derin, kenarlarda sıfır
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = xStart + (xEnd - xStart) * t;
      // Sinüs kavis — merkezde direction * curveDepth
      const curveOffset = Math.sin(t * Math.PI) * curveDepth * direction;
      const y = yStart + curveOffset;
      points.push({ x, y });
    }

    return points;
  }
}
