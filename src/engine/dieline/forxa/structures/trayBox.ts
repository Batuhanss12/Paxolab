/**
 * Open-top tray — base + four walls + glue tabs.
 *
 *        [front wall L × H]
 * [left H×W] [base L×W] [right H×W]
 *        [back wall L × H]
 */

import type {
  PackagingStructure,
  StructureParameter,
  DielineResult,
  ValidationResult,
  Path,
  FoldLine,
  Panel,
} from '../types';
import { SVGBuilder, rect, linePath, polygonPath, bbox } from '../svgBuilder';
import { validateParameters, getDefaultParams, mergeParams } from '../validator';

export class TrayBox implements PackagingStructure {
  id = 'tray-box';
  name = 'Tray Box';
  category = 'box' as const;
  description = 'Açık tepsi — taban + dört duvar, yapıştırma kulakları';
  icon = 'box';

  parameters: StructureParameter[] = [
    { key: 'length', label: 'Boy (L)', unit: 'mm', min: 40, max: 400, default: 80, step: 1, required: true, description: 'Taban boyu' },
    { key: 'width', label: 'En (W)', unit: 'mm', min: 30, max: 300, default: 50, step: 1, required: true, description: 'Taban eni' },
    { key: 'height', label: 'Duvar (H)', unit: 'mm', min: 10, max: 120, default: 40, step: 1, required: true, description: 'Duvar yüksekliği' },
    { key: 'glueTabWidth', label: 'Yapıştırma', unit: 'mm', min: 6, max: 25, default: 12, step: 1, required: false, description: 'Köşe kulağı' },
    { key: 'materialThickness', label: 'Malzeme', unit: 'mm', min: 0.2, max: 3, default: 0.4, step: 0.1, required: false, description: 'Karton kalınlığı' },
  ];

  getDefaultParameters(): Record<string, number> {
    return getDefaultParams(this.parameters);
  }

  validateParameters(params: Record<string, number>): ValidationResult {
    const base = validateParameters(params, this.parameters);
    if (!base.valid) return base;
    const warnings: string[] = [];
    if (params.height > Math.min(params.length, params.width) * 0.8) {
      warnings.push('Duvar yüksekliği tabana göre yüksek — tepsi derin görünür');
    }
    return { valid: true, errors: base.errors, warnings: [...base.warnings, ...warnings] };
  }

  generateDieline(userParams: Record<string, number>): DielineResult {
    const params = mergeParams(this.getDefaultParameters(), userParams);
    const validation = this.validateParameters(params);
    if (!validation.valid) {
      return {
        success: false, structureId: this.id, structureName: this.name, svg: '',
        paths: { cut: [], crease: [], glue: [], perf: [] }, folds: [], panels: [],
        bounds: { width: 0, height: 0 },
        metadata: { totalArea: 0, materialUsage: 0, wastePercentage: 0, boundingBox: { width: 0, height: 0 }, recommendedMaterial: '', complexity: 'simple', industryCompliance: [] },
        warnings: validation.warnings, errors: validation.errors,
      };
    }

    const L = params.length;
    const W = params.width;
    const H = params.height;
    const x0 = 0;
    const x1 = H;
    const x2 = H + L;
    const x3 = H + L + H;
    const y0 = 0;
    const y1 = H;
    const y2 = H + W;
    const y3 = H + W + H;
    const totalWidth = x3;
    const totalHeight = y3;

    const cutPaths: Path[] = [
      [
        { x: x1, y: y0 }, { x: x2, y: y0 },
        { x: x2, y: y1 }, { x: x3, y: y1 },
        { x: x3, y: y2 }, { x: x2, y: y2 },
        { x: x2, y: y3 }, { x: x1, y: y3 },
        { x: x1, y: y2 }, { x: x0, y: y2 },
        { x: x0, y: y1 }, { x: x1, y: y1 },
      ],
    ];

    const creasePaths: Path[] = [
      linePath({ x: x1, y: y1 }, { x: x2, y: y1 }),
      linePath({ x: x1, y: y2 }, { x: x2, y: y2 }),
      linePath({ x: x1, y: y1 }, { x: x1, y: y2 }),
      linePath({ x: x2, y: y1 }, { x: x2, y: y2 }),
    ];

    const glueLeft: Path = polygonPath([
      { x: x0, y: y1 + 2 }, { x: x1, y: y1 }, { x: x1, y: y2 }, { x: x0, y: y2 - 2 },
    ]);
    const glueRight: Path = polygonPath([
      { x: x2, y: y1 }, { x: x3, y: y1 + 2 }, { x: x3, y: y2 - 2 }, { x: x2, y: y2 },
    ]);
    const gluePaths: Path[] = [glueLeft, glueRight];

    const folds: FoldLine[] = [
      { from: { x: x1, y: y1 }, to: { x: x2, y: y1 }, angle: 90, type: 'valley' },
      { from: { x: x1, y: y2 }, to: { x: x2, y: y2 }, angle: 90, type: 'valley' },
      { from: { x: x1, y: y1 }, to: { x: x1, y: y2 }, angle: 90, type: 'valley' },
      { from: { x: x2, y: y1 }, to: { x: x2, y: y2 }, angle: 90, type: 'valley' },
    ];

    const panels: Panel[] = [
      { id: 'front', name: 'Ön Duvar', polygon: rect(x1, y0, L, H), face: 'front' },
      { id: 'left', name: 'Sol Duvar', polygon: rect(x0, y1, H, W), face: 'left' },
      { id: 'bottom', name: 'Taban', polygon: rect(x1, y1, L, W), face: 'bottom' },
      { id: 'right', name: 'Sağ Duvar', polygon: rect(x2, y1, H, W), face: 'right' },
      { id: 'back', name: 'Arka Duvar', polygon: rect(x1, y2, L, H), face: 'back' },
      { id: 'glue-left', name: 'Sol Yapıştırma', polygon: glueLeft, face: 'glue' },
      { id: 'glue-right', name: 'Sağ Yapıştırma', polygon: glueRight, face: 'glue' },
    ];

    const builder = new SVGBuilder({
      width: totalWidth, height: totalHeight, margin: 15,
      showGrid: false, showDimensions: true, showRegMarks: true,
    });
    for (const p of cutPaths) builder.addCutPath(p);
    for (const p of creasePaths) builder.addCreasePath(p);
    for (const p of gluePaths) builder.addGluePath(p);
    for (const f of folds) builder.addFold(f);
    for (const panel of panels) builder.addPanel(panel);
    const svg = builder.build();
    const bb = bbox([...cutPaths, ...creasePaths, ...gluePaths]);
    const panelArea = L * W + 2 * L * H + 2 * W * H;

    return {
      success: true,
      structureId: this.id,
      structureName: this.name,
      svg,
      paths: { cut: cutPaths, crease: creasePaths, glue: gluePaths, perf: [] },
      folds,
      panels,
      bounds: { width: totalWidth, height: totalHeight },
      metadata: {
        totalArea: bb.w * bb.h,
        materialUsage: panelArea,
        wastePercentage: Math.max(0, ((bb.w * bb.h - panelArea) / Math.max(1, bb.w * bb.h)) * 100),
        boundingBox: { width: totalWidth, height: totalHeight },
        recommendedMaterial: 'Karton (300g/m²)',
        complexity: 'simple',
        industryCompliance: ['FEFCO-style tray'],
      },
      warnings: validation.warnings,
      errors: [],
    };
  }
}

export default TrayBox;
