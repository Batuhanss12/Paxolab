/**
 * Forxa StructureEngine — Tuck End Box
 *
 * Klasik straight tuck-end (ECMA A20): L×W kapak + tuck + dust.
 * Native FORMA 13 panelli net ile aynı açılım; aux cihazlar (Euroslot,
 * fermuar, dökme) bu host üzerine biner. Native perfume yolu değişmez.
 *
 *   [topTuck]
 *   [dust] [top L×W] [dust]
 *   [glue] [left W] [front L] [right W] [back L]
 *   [dust] [bottom L×W] [dust]
 *   [bottomTuck]
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
import { SVGBuilder, rect, linePath, polygonPath, bbox } from '../svgBuilder';
import { validateParameters, getDefaultParams, mergeParams } from '../validator';
import { creaseBetween, outlineUnion, rect as formaRect } from '../../dielineGeometry';
import type { Panel as FormaPanel } from '../../../../types';

export class TuckEndBox implements PackagingStructure {
  id = 'tuck-end-box';
  name = 'Tuck End Box';
  category = 'box' as const;
  description = 'Klasik tuck-end kutu — aynı yönde iki tuck flap, yapıştırma kulağı ve dust flap ile';
  icon = 'box';

  parameters: StructureParameter[] = [
    { key: 'length', label: 'Boy (L)', unit: 'mm', min: 20, max: 500, default: 100, step: 1, required: true, description: 'Ön/arka panel genişliği' },
    { key: 'width', label: 'En (W)', unit: 'mm', min: 10, max: 300, default: 60, step: 1, required: true, description: 'Yan panel genişliği' },
    { key: 'height', label: 'Yükseklik (H)', unit: 'mm', min: 10, max: 400, default: 150, step: 1, required: true, description: 'Kutu yüksekliği' },
    { key: 'glueTabWidth', label: 'Yapıştırma Kulağı', unit: 'mm', min: 5, max: 50, default: 15, step: 1, required: false, description: 'Glue tab genişliği' },
    { key: 'tuckLength', label: 'Tuck Uzunluğu', unit: 'mm', min: 5, max: 200, default: 40, step: 1, required: false, description: 'Tuck flap uzunluğu' },
    { key: 'dustFlapWidth', label: 'Dust Flap Genişliği', unit: 'mm', min: 5, max: 150, default: 30, step: 1, required: false, description: 'Yan kanat genişliği' },
    { key: 'cornerRadius', label: 'Köşe Radyusu', unit: 'mm', min: 0, max: 20, default: 2, step: 0.5, required: false, description: 'Köşe yuvarlatma' },
    { key: 'materialThickness', label: 'Malzeme Kalınlığı', unit: 'mm', min: 0.1, max: 5, default: 0.3, step: 0.1, required: false, description: 'Kerf kompanzasyon için' },
  ];

  getDefaultParameters(): Record<string, number> {
    return getDefaultParams(this.parameters);
  }

  validateParameters(params: Record<string, number>): ValidationResult {
    const base = validateParameters(params, this.parameters);
    if (!base.valid) return base;

    const warnings: string[] = [];

    // Geometrik kısıtlar
    const { length, width, height, tuckLength, dustFlapWidth, glueTabWidth } = params;

    if (tuckLength > height * 0.95) {
      warnings.push(`Tuck uzunluğu (${tuckLength}mm) yüksekliğin (%95)'inden fazla — kutu kapanmayabilir`);
    }
    if (dustFlapWidth > width * 0.6) {
      warnings.push(`Dust flap genişliği (${dustFlapWidth}mm) en genişliğinin %60'ından fazla — üst üste binebilir`);
    }
    if (glueTabWidth > length * 0.3) {
      warnings.push(`Glue tab genişliği (${glueTabWidth}mm) boyun %30'undan fazla — malzeme israfı`);
    }

    return { valid: true, errors: base.errors, warnings: [...base.warnings, ...warnings] };
  }

  generateDieline(userParams: Record<string, number>): DielineResult {
    const params = mergeParams(this.getDefaultParameters(), userParams);
    const validation = this.validateParameters(params);

    if (!validation.valid) {
      return {
        success: false,
        structureId: this.id,
        structureName: this.name,
        svg: '',
        paths: { cut: [], crease: [], glue: [], perf: [] },
        folds: [],
        panels: [],
        bounds: { width: 0, height: 0 },
        metadata: this.emptyMetadata(),
        warnings: validation.warnings,
        errors: validation.errors,
      };
    }

    const L = params.length;
    const W = params.width;
    const H = params.height;
    const G = Math.min(Math.max(params.glueTabWidth, 8), Math.min(22, Math.max(10, W * 0.42)));
    const T = Math.min(Math.max(params.tuckLength, 8), Math.max(12, Math.min(W * 0.85, H * 0.5)));
    const dust = Math.min(Math.max(params.dustFlapWidth, 6), Math.max(6, W * 0.45));

    const bodyY = T + W;
    const glue = formaRect('glue-tab', 'glue', 0, bodyY, G, H);
    const left = formaRect('left', 'body', G, bodyY, W, H);
    const front = formaRect('front', 'body', G + W, bodyY, L, H);
    const right = formaRect('right', 'body', G + W + L, bodyY, W, H);
    const back = formaRect('back', 'body', G + W + L + W, bodyY, L, H);
    const top = formaRect('top', 'flap', G + W, T, L, W);
    const topTuck = formaRect('top-tuck', 'tuck', G + W, 0, L, T);
    const bottom = formaRect('bottom', 'flap', G + W, bodyY + H, L, W);
    const bottomTuck = formaRect('bottom-tuck', 'tuck', G + W, bodyY + H + W, L, T);
    const dustLT = formaRect('dust-left-top', 'flap', G, bodyY - dust, W, dust);
    const dustRT = formaRect('dust-right-top', 'flap', G + W + L, bodyY - dust, W, dust);
    const dustLB = formaRect('dust-left-bottom', 'flap', G, bodyY + H, W, dust);
    const dustRB = formaRect('dust-right-bottom', 'flap', G + W + L, bodyY + H, W, dust);

    const laid: FormaPanel[] = [
      glue, left, front, right, back, top, topTuck, bottom, bottomTuck, dustLT, dustRT, dustLB, dustRB,
    ];
    const pairs: [FormaPanel, FormaPanel][] = [
      [glue, left], [left, front], [front, right], [right, back],
      [topTuck, top], [top, front], [front, bottom], [bottom, bottomTuck],
      [dustLT, left], [dustRT, right], [left, dustLB], [right, dustRB],
    ];
    const creaseSegs = pairs.map(([a, b]) => creaseBetween(a, b)).filter((x): x is [Point, Point] => !!x);
    const creasePaths: Path[] = creaseSegs.map(([a, b]) => linePath(a, b));
    const cutPaths: Path[] = [polygonPath(outlineUnion(laid))];
    const gluePaths: Path[] = [rect(glue.x, glue.y, glue.w, glue.h)];
    const perfPaths: Path[] = [];
    const folds: FoldLine[] = creaseSegs.map(([a, b]) => ({ from: a, to: b, angle: 90, type: 'valley' as const }));

    const faceOf = (id: string): string => {
      if (id === 'glue-tab') return 'glue';
      if (id === 'front') return 'front';
      if (id === 'back') return 'back';
      if (id === 'left') return 'left';
      if (id === 'right') return 'right';
      if (id === 'top') return 'top';
      if (id === 'bottom') return 'bottom';
      if (id.includes('tuck')) return 'lid-tuck';
      return 'dust';
    };
    const panels: Panel[] = laid.map((p) => ({
      id: p.id,
      name: p.id,
      polygon: rect(p.x, p.y, p.w, p.h),
      face: faceOf(p.id),
    }));

    const totalWidth = G + W + L + W + L;
    const totalHeight = T + W + H + W + T;

    const builder = new SVGBuilder({
      width: totalWidth,
      height: totalHeight,
      margin: 15,
      showGrid: true,
      gridSize: 10,
      showDimensions: true,
      showRegMarks: true,
    });

    for (const p of cutPaths) builder.addCutPath(p);
    for (const p of creasePaths) builder.addCreasePath(p);
    for (const p of gluePaths) builder.addGluePath(p);
    for (const p of perfPaths) builder.addPerfPath(p);
    for (const f of folds) builder.addFold(f);
    for (const panel of panels) builder.addPanel(panel);
    builder.addDimension({ x: G + W, y: totalHeight + 6 }, { x: G + W + L, y: totalHeight + 6 }, `L=${L}`, 8);
    builder.addDimension({ x: G, y: totalHeight + 6 }, { x: G + W, y: totalHeight + 6 }, `W=${W}`, 8);
    builder.addDimension({ x: -6, y: bodyY }, { x: -6, y: bodyY + H }, `H=${H}`, -10);

    const svg = builder.build();
    const bb = bbox([...cutPaths, ...creasePaths, ...gluePaths]);
    const panelArea = L * H * 2 + W * H * 2 + L * W * 2 + L * T * 2 + G * H + W * dust * 4;
    const totalArea = bb.w * bb.h;
    const wastePercentage = ((totalArea - panelArea) / totalArea) * 100;

    const metadata: StructureMetadata = {
      totalArea,
      materialUsage: panelArea,
      wastePercentage: Math.max(0, wastePercentage),
      boundingBox: { width: totalWidth, height: totalHeight },
      recommendedMaterial: this.recommendMaterial(params),
      complexity: 'simple',
      industryCompliance: ['ECMA-A20'],
    };

    return {
      success: true,
      structureId: this.id,
      structureName: this.name,
      svg,
      paths: { cut: cutPaths, crease: creasePaths, glue: gluePaths, perf: perfPaths },
      folds,
      panels,
      bounds: { width: totalWidth, height: totalHeight },
      metadata,
      warnings: validation.warnings,
      errors: [],
    };
  }

  // ─── Helper: Malzeme Önerisi ──────────────────────────────────

  private recommendMaterial(params: Record<string, number>): string {
    const { length, width, height, materialThickness } = params;
    const volume = length * width * height;

    if (volume > 5_000_000) return 'Oluklu Mukavva (Kraft 300g/m²)';
    if (volume > 1_000_000) return 'SCT Karton (300g/m²)';
    if (materialThickness > 0.5) return 'Oluklu Mukavva (B Flute)';
    return 'Karton (250-350g/m²)';
  }

  // ─── Helper: Boş Metadata ─────────────────────────────────────

  private emptyMetadata(): StructureMetadata {
    return {
      totalArea: 0,
      materialUsage: 0,
      wastePercentage: 0,
      boundingBox: { width: 0, height: 0 },
      recommendedMaterial: '',
      complexity: 'simple',
      industryCompliance: [],
    };
  }
}

export default TuckEndBox;
