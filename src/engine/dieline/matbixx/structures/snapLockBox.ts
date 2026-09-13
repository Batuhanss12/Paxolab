/**
 * Snap-lock / crash-lock bottom carton — top tuck, interlocking bottom.
 *
 *   X: [Glue G] [Left W] [Front L] [Right W] [Back L]
 *   Y: [Top tuck T] [Body H] [Lock BL]
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
import { SVGBuilder, rect, linePath, polygonPath, bbox } from '../svgBuilder';
import { validateParameters, getDefaultParams, mergeParams } from '../validator';

export class SnapLockBox implements PackagingStructure {
  id = 'snap-lock-box';
  name = 'Snap Lock Box';
  category = 'box' as const;
  description = 'Üst tuck, altta crash-lock / oto kilit taban';
  icon = 'box';

  parameters: StructureParameter[] = [
    { key: 'length', label: 'Boy (L)', unit: 'mm', min: 30, max: 400, default: 100, step: 1, required: true, description: 'Ön/arka panel genişliği' },
    { key: 'width', label: 'En (W)', unit: 'mm', min: 20, max: 250, default: 60, step: 1, required: true, description: 'Yan panel genişliği' },
    { key: 'height', label: 'Yükseklik (H)', unit: 'mm', min: 20, max: 400, default: 150, step: 1, required: true, description: 'Kutu yüksekliği' },
    { key: 'glueTabWidth', label: 'Yapıştırma Kulağı', unit: 'mm', min: 8, max: 40, default: 15, step: 1, required: false, description: 'Glue tab' },
    { key: 'tuckLength', label: 'Üst Tuck', unit: 'mm', min: 8, max: 80, default: 28, step: 1, required: false, description: 'Üst kapanış' },
    { key: 'lockLength', label: 'Kilit Flap', unit: 'mm', min: 12, max: 60, default: 28, step: 1, required: false, description: 'Crash-lock derinliği' },
    { key: 'materialThickness', label: 'Malzeme', unit: 'mm', min: 0.2, max: 3, default: 0.4, step: 0.1, required: false, description: 'Karton kalınlığı' },
  ];

  getDefaultParameters(): Record<string, number> {
    return getDefaultParams(this.parameters);
  }

  validateParameters(params: Record<string, number>): ValidationResult {
    const base = validateParameters(params, this.parameters);
    if (!base.valid) return base;
    const warnings: string[] = [];
    if (params.lockLength > params.width * 0.7) {
      warnings.push('Kilit flap en genişliğinin %70’inden fazla — kapanış sıkışabilir');
    }
    return { valid: true, errors: base.errors, warnings: [...base.warnings, ...warnings] };
  }

  generateDieline(userParams: Record<string, number>): DielineResult {
    const params = mergeParams(this.getDefaultParameters(), userParams);
    const validation = this.validateParameters(params);
    if (!validation.valid) {
      return this.fail(validation);
    }

    const L = params.length;
    const W = params.width;
    const H = params.height;
    const G = params.glueTabWidth;
    const T = Math.min(params.tuckLength, H * 0.35);
    const BL = Math.min(params.lockLength, W * 0.5, 40);

    const totalWidth = G + W + L + W + L;
    const totalHeight = T + H + BL;
    const x0 = 0;
    const x1 = G;
    const x2 = G + W;
    const x3 = G + W + L;
    const x4 = G + W + L + W;
    const x5 = totalWidth;
    const y0 = 0;
    const y1 = T;
    const y2 = T + H;
    const y3 = totalHeight;

    const cutPaths: Path[] = [
      [
        { x: x0, y: y1 + 4 }, { x: x0 + 3, y: y1 }, { x: x1, y: y1 },
        { x: x1, y: y0 + 6 }, { x: x2 + 4, y: y0 }, { x: x3 - 4, y: y0 }, { x: x4, y: y0 + 6 },
        { x: x4, y: y0 }, { x: x5, y: y0 }, { x: x5, y: y3 },
        { x: x4, y: y3 }, { x: x3 + 6, y: y3 }, { x: x3, y: y2 + BL * 0.45 },
        { x: x2, y: y2 + BL * 0.45 }, { x: x2 - 6, y: y3 }, { x: x1, y: y3 },
        { x: x1, y: y2 }, { x: x0 + 3, y: y2 }, { x: x0, y: y2 - 4 },
      ],
    ];

    const creasePaths: Path[] = [
      linePath({ x: x1, y: y1 }, { x: x1, y: y2 }),
      linePath({ x: x2, y: y1 }, { x: x2, y: y2 }),
      linePath({ x: x3, y: y1 }, { x: x3, y: y2 }),
      linePath({ x: x4, y: y1 }, { x: x4, y: y2 }),
      linePath({ x: x1, y: y1 }, { x: x5, y: y1 }),
      linePath({ x: x1, y: y2 }, { x: x5, y: y2 }),
    ];

    const gluePaths: Path[] = [
      polygonPath([
        { x: x0, y: y1 + 4 }, { x: x0 + 3, y: y1 }, { x: x1, y: y1 },
        { x: x1, y: y2 }, { x: x0 + 3, y: y2 }, { x: x0, y: y2 - 4 },
      ]),
    ];

    const folds: FoldLine[] = [
      { from: { x: x1, y: y1 }, to: { x: x1, y: y2 }, angle: 90, type: 'valley' },
      { from: { x: x2, y: y1 }, to: { x: x2, y: y2 }, angle: 90, type: 'valley' },
      { from: { x: x3, y: y1 }, to: { x: x3, y: y2 }, angle: 90, type: 'valley' },
      { from: { x: x4, y: y1 }, to: { x: x4, y: y2 }, angle: 90, type: 'valley' },
      { from: { x: x2, y: y1 }, to: { x: x3, y: y1 }, angle: 90, type: 'valley' },
      { from: { x: x2, y: y2 }, to: { x: x3, y: y2 }, angle: 90, type: 'mountain' },
    ];

    const panels: Panel[] = [
      { id: 'glue-tab', name: 'Yapıştırma Kulağı', polygon: gluePaths[0], face: 'glue' },
      { id: 'side-left', name: 'Sol Yan', polygon: rect(x1, y1, W, H), face: 'left' },
      { id: 'front', name: 'Ön Yüz', polygon: rect(x2, y1, L, H), face: 'front' },
      { id: 'side-right', name: 'Sağ Yan', polygon: rect(x3, y1, W, H), face: 'right' },
      { id: 'back', name: 'Arka Yüz', polygon: rect(x4, y1, L, H), face: 'back' },
      { id: 'top-tuck', name: 'Üst Tuck', polygon: rect(x2, y0, L, T), face: 'top' },
      { id: 'bottom-lock', name: 'Kilit Taban', polygon: rect(x2, y2, L, BL), face: 'bottom' },
    ];

    const builder = new SVGBuilder({
      width: totalWidth,
      height: totalHeight,
      margin: 15,
      showGrid: false,
      showDimensions: true,
      showRegMarks: true,
    });
    for (const p of cutPaths) builder.addCutPath(p);
    for (const p of creasePaths) builder.addCreasePath(p);
    for (const p of gluePaths) builder.addGluePath(p);
    for (const f of folds) builder.addFold(f);
    for (const panel of panels) builder.addPanel(panel);
    const svg = builder.build();
    const bb = bbox([...cutPaths, ...creasePaths, ...gluePaths]);

    return {
      success: true,
      structureId: this.id,
      structureName: this.name,
      svg,
      paths: { cut: cutPaths, crease: creasePaths, glue: gluePaths, perf: [] },
      folds,
      panels,
      bounds: { width: totalWidth, height: totalHeight },
      metadata: this.meta(bb.w * bb.h, L * H * 2 + W * H * 2, totalWidth, totalHeight, 'ECMA crash-lock'),
      warnings: validation.warnings,
      errors: [],
    };
  }

  private meta(totalArea: number, panelArea: number, w: number, h: number, compliance: string): StructureMetadata {
    return {
      totalArea,
      materialUsage: panelArea,
      wastePercentage: Math.max(0, ((totalArea - panelArea) / Math.max(1, totalArea)) * 100),
      boundingBox: { width: w, height: h },
      recommendedMaterial: 'Karton (300-350g/m²)',
      complexity: 'medium',
      industryCompliance: [compliance],
    };
  }

  private fail(validation: ValidationResult): DielineResult {
    return {
      success: false,
      structureId: this.id,
      structureName: this.name,
      svg: '',
      paths: { cut: [], crease: [], glue: [], perf: [] },
      folds: [],
      panels: [],
      bounds: { width: 0, height: 0 },
      metadata: {
        totalArea: 0, materialUsage: 0, wastePercentage: 0,
        boundingBox: { width: 0, height: 0 }, recommendedMaterial: '',
        complexity: 'simple', industryCompliance: [],
      },
      warnings: validation.warnings,
      errors: validation.errors,
    };
  }
}

export default SnapLockBox;
