/**
 * MatBixx StructureEngine — Product Carrier Tray (ECMA E ailesi)
 *
 * Ürüne entegre taşıyıcı — taban + 4 duvar (tray-box mimarisi) +
 * rows×cols düzeninde dairesel ürün gözleri (die-cut delik).
 * Şişe/kavanoz taşıyıcı, grup ambalaj, ürün yuvalı insert tepsisi
 * gibi gerçek E-ailesi yapıların ortak paydası.
 */

import type {
  PackagingStructure,
  StructureParameter,
  DielineResult,
  ValidationResult,
  Path,
  Point,
  FoldLine,
  Panel,
} from '../types';
import { SVGBuilder, rect, linePath, polygonPath, bbox } from '../svgBuilder';
import { validateParameters, getDefaultParams, mergeParams } from '../validator';

function circlePath(cx: number, cy: number, r: number, segments = 24): Path {
  const pts: Point[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  return pts;
}

export class ProductCarrierTray implements PackagingStructure {
  id = 'product-carrier-tray';
  name = 'Product Carrier Tray (Ürün Taşıyıcı Tepsi)';
  category = 'box' as const;
  description = 'Taban + duvar + dairesel ürün gözleri — şişe/kavanoz taşıyıcı, grup ambalaj, insert tepsi (ECMA E ailesi)';
  icon = 'box';

  parameters: StructureParameter[] = [
    { key: 'length', label: 'Boy (L)', unit: 'mm', min: 40, max: 500, default: 160, step: 1, required: true, description: 'Taban boyu' },
    { key: 'width', label: 'En (W)', unit: 'mm', min: 30, max: 400, default: 110, step: 1, required: true, description: 'Taban eni' },
    { key: 'height', label: 'Duvar (H)', unit: 'mm', min: 10, max: 150, default: 45, step: 1, required: true, description: 'Duvar / göz yüksekliği' },
    { key: 'rows', label: 'Sıra (adet)', unit: 'mm', min: 1, max: 6, default: 2, step: 1, required: true, description: 'Ürün gözü sıra sayısı' },
    { key: 'cols', label: 'Sütun (adet)', unit: 'mm', min: 1, max: 6, default: 3, step: 1, required: true, description: 'Ürün gözü sütun sayısı' },
    { key: 'cellDiameter', label: 'Göz Çapı (üst sınır)', unit: 'mm', min: 10, max: 200, default: 60, step: 1, required: false, description: 'Ürün gözü çapı üst sınırı — hücreye otomatik sığdırılır' },
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
    if (params.height > Math.min(params.length, params.width) * 0.9) {
      warnings.push('Duvar yüksekliği tabana göre yüksek — tepsi derin görünür');
    }
    return { valid: true, errors: base.errors, warnings: [...base.warnings, ...warnings] };
  }

  generateDieline(userParams: Record<string, number>): DielineResult {
    const params = mergeParams(this.getDefaultParameters(), userParams);
    const validation = this.validateParameters(params);
    if (!validation.valid) return this.fail(validation);

    const L = params.length;
    const W = params.width;
    const H = params.height;
    const rows = Math.max(1, Math.min(6, Math.round(params.rows)));
    const cols = Math.max(1, Math.min(6, Math.round(params.cols)));
    const cellCap = params.cellDiameter / 2;

    const x0 = 0, x1 = H, x2 = H + L, x3 = H + L + H;
    const y0 = 0, y1 = H, y2 = H + W, y3 = H + W + H;
    const totalWidth = x3, totalHeight = y3;

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

    // ─── Ürün gözleri (dairesel kesim, rows×cols grid) ───────────
    const pitchX = L / cols;
    const pitchY = W / rows;
    const fitR = Math.min(pitchX, pitchY) * 0.5 * 0.82;
    const cellR = Math.max(6, Math.min(fitR, cellCap));
    const cellCenters: Point[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = x1 + pitchX * (c + 0.5);
        const cy = y1 + pitchY * (r + 0.5);
        cellCenters.push({ x: cx, y: cy });
        cutPaths.push(circlePath(cx, cy, cellR));
      }
    }

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
      { id: 'base', name: 'Taban (gözlü)', polygon: rect(x1, y1, L, W), face: 'bottom' },
      { id: 'right', name: 'Sağ Duvar', polygon: rect(x2, y1, H, W), face: 'right' },
      { id: 'back', name: 'Arka Duvar', polygon: rect(x1, y2, L, H), face: 'back' },
      { id: 'glue-left', name: 'Sol Yapıştırma', polygon: glueLeft, face: 'glue' },
      { id: 'glue-right', name: 'Sağ Yapıştırma', polygon: glueRight, face: 'glue' },
      ...cellCenters.map((c, idx) => ({
        id: `cell-${idx}`,
        name: `Ürün Gözü ${idx + 1}`,
        polygon: circlePath(c.x, c.y, cellR),
        face: 'cell',
      })),
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
    const cellArea = cellCenters.length * Math.PI * cellR * cellR;
    const panelArea = L * W - cellArea + 2 * L * H + 2 * W * H;

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
        materialUsage: Math.max(0, panelArea),
        wastePercentage: Math.max(0, ((bb.w * bb.h - panelArea) / Math.max(1, bb.w * bb.h)) * 100),
        boundingBox: { width: totalWidth, height: totalHeight },
        recommendedMaterial: 'Oluklu mukavva (B/E flute) veya karton 350g/m²',
        complexity: cellCenters.length > 4 ? 'medium' : 'simple',
        industryCompliance: ['ECMA-E (ürün entegre taşıyıcı)'],
      },
      warnings: validation.warnings,
      errors: [],
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

export default ProductCarrierTray;
