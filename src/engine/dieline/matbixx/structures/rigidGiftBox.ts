/**
 * Two-piece rigid gift — base tray + slightly larger lid on one sheet.
 */

import type {
  PackagingStructure,
  StructureParameter,
  DielineResult,
  ValidationResult,
  Path,
  FoldLine,
  Panel,
  Point,
} from '../types';
import { SVGBuilder, rect, linePath, polygonPath, bbox } from '../svgBuilder';
import { validateParameters, getDefaultParams, mergeParams } from '../validator';

function trayNet(
  ox: number,
  oy: number,
  L: number,
  W: number,
  H: number,
): { cut: Path; creases: Path[]; folds: FoldLine[]; corners: Point[] } {
  const x0 = ox;
  const x1 = ox + H;
  const x2 = ox + H + L;
  const x3 = ox + H + L + H;
  const y0 = oy;
  const y1 = oy + H;
  const y2 = oy + H + W;
  const y3 = oy + H + W + H;
  const cut: Path = [
    { x: x1, y: y0 }, { x: x2, y: y0 },
    { x: x2, y: y1 }, { x: x3, y: y1 },
    { x: x3, y: y2 }, { x: x2, y: y2 },
    { x: x2, y: y3 }, { x: x1, y: y3 },
    { x: x1, y: y2 }, { x: x0, y: y2 },
    { x: x0, y: y1 }, { x: x1, y: y1 },
  ];
  const creases: Path[] = [
    linePath({ x: x1, y: y1 }, { x: x2, y: y1 }),
    linePath({ x: x1, y: y2 }, { x: x2, y: y2 }),
    linePath({ x: x1, y: y1 }, { x: x1, y: y2 }),
    linePath({ x: x2, y: y1 }, { x: x2, y: y2 }),
  ];
  const folds: FoldLine[] = [
    { from: { x: x1, y: y1 }, to: { x: x2, y: y1 }, angle: 90, type: 'valley' },
    { from: { x: x1, y: y2 }, to: { x: x2, y: y2 }, angle: 90, type: 'valley' },
    { from: { x: x1, y: y1 }, to: { x: x1, y: y2 }, angle: 90, type: 'valley' },
    { from: { x: x2, y: y1 }, to: { x: x2, y: y2 }, angle: 90, type: 'valley' },
  ];
  return { cut, creases, folds, corners: [{ x: x0, y: y0 }, { x: x3, y: y3 }] };
}

export class RigidGiftBox implements PackagingStructure {
  id = 'rigid-gift-box';
  name = 'Rigid Gift Box';
  category = 'box' as const;
  description = 'Sert hediye — taban tepsi + kapak, tek sacda iki net';
  icon = 'box';

  parameters: StructureParameter[] = [
    { key: 'length', label: 'Boy (L)', unit: 'mm', min: 50, max: 400, default: 160, step: 1, required: true, description: 'Taban iç boy' },
    { key: 'width', label: 'En (W)', unit: 'mm', min: 40, max: 300, default: 160, step: 1, required: true, description: 'Taban iç en' },
    { key: 'height', label: 'Yükseklik (H)', unit: 'mm', min: 20, max: 120, default: 60, step: 1, required: true, description: 'Taban duvar' },
    { key: 'lidHeight', label: 'Kapak Duvar', unit: 'mm', min: 10, max: 80, default: 22, step: 1, required: false, description: 'Kapak derinliği' },
    { key: 'lidOverhang', label: 'Kapak Payı', unit: 'mm', min: 1, max: 8, default: 2, step: 0.5, required: false, description: 'Kapak iç payı' },
    { key: 'gap', label: 'Net Aralığı', unit: 'mm', min: 6, max: 20, default: 10, step: 1, required: false, description: 'Taban-kapak boşluğu' },
    { key: 'materialThickness', label: 'Malzeme', unit: 'mm', min: 0.4, max: 4, default: 1.2, step: 0.1, required: false, description: 'Mukavva' },
  ];

  getDefaultParameters(): Record<string, number> {
    return getDefaultParams(this.parameters);
  }

  validateParameters(params: Record<string, number>): ValidationResult {
    const base = validateParameters(params, this.parameters);
    if (!base.valid) return base;
    const warnings: string[] = [];
    if (params.lidHeight > params.height * 0.7) {
      warnings.push('Kapak duvarı tabandan yüksek — teleskopik kapanış zorlanır');
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
    const lidH = Math.min(params.lidHeight, H * 0.55);
    const over = params.lidOverhang;
    const gap = params.gap;
    const lidL = L + over * 2;
    const lidW = W + over * 2;

    const base = trayNet(0, 0, L, W, H);
    const baseW = H + L + H;
    const lid = trayNet(baseW + gap, 0, lidL, lidW, lidH);
    const totalWidth = baseW + gap + lidH + lidL + lidH;
    const totalHeight = Math.max(H + W + H, lidH + lidW + lidH);

    const cutPaths: Path[] = [base.cut, lid.cut];
    const creasePaths: Path[] = [...base.creases, ...lid.creases];
    const gluePaths: Path[] = [
      polygonPath([
        { x: 0, y: H + 2 }, { x: H, y: H }, { x: H, y: H + W }, { x: 0, y: H + W - 2 },
      ]),
    ];
    const folds: FoldLine[] = [...base.folds, ...lid.folds];

    const panels: Panel[] = [
      { id: 'base-front', name: 'Taban Ön', polygon: rect(H, 0, L, H), face: 'front' },
      { id: 'base-left', name: 'Taban Sol', polygon: rect(0, H, H, W), face: 'left' },
      { id: 'base-bottom', name: 'Taban', polygon: rect(H, H, L, W), face: 'bottom' },
      { id: 'base-right', name: 'Taban Sağ', polygon: rect(H + L, H, H, W), face: 'right' },
      { id: 'base-back', name: 'Taban Arka', polygon: rect(H, H + W, L, H), face: 'back' },
      { id: 'lid-top', name: 'Kapak', polygon: rect(baseW + gap + lidH, lidH, lidL, lidW), face: 'top' },
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
        materialUsage: L * W + lidL * lidW + 2 * (L + W) * H + 2 * (lidL + lidW) * lidH,
        wastePercentage: 8,
        boundingBox: { width: totalWidth, height: totalHeight },
        recommendedMaterial: 'Sert mukavva (1.2–2.0 mm) + kaplama',
        complexity: 'medium',
        industryCompliance: ['rigid two-piece'],
      },
      warnings: validation.warnings,
      errors: [],
    };
  }
}

export default RigidGiftBox;
