/**
 * Forxa StructureEngine — Reverse Tuck End Box
 *
 * Tuck-end kutunun varyasyonu — üst ve alt tuck flap'leri ters yönde.
 * Üst tuck önden, alt tuck arkadan kapanır (veya tam tersi).
 *
 * Net Layout (yatay açılım):
 *
 *   [GlueTab] [Back] [Side1] [Front] [Side2]
 *             ↑ alt tuck    ↑ üst tuck
 *             (arkadan)     (önden)
 *
 * Fark: Tuck flap'ler farklı panel üzerinde
 * - Üst tuck: Front panelin üstünde
 * - Alt tuck: Back panelin altında
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

export class ReverseTuckEndBox implements PackagingStructure {
  id = 'reverse-tuck-end-box';
  name = 'Reverse Tuck End Box';
  category = 'box' as const;
  description = 'Ters tuck-end kutu — üst ve alt tuck flap ters yönde, daha sıkı kapanış';
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
    const { length, width, height, tuckLength, dustFlapWidth, glueTabWidth } = params;

    if (tuckLength > height * 0.95) {
      warnings.push(`Tuck uzunluğu (${tuckLength}mm) yüksekliğin %95'inden fazla — kutu kapanmayabilir`);
    }
    if (dustFlapWidth > width * 0.6) {
      warnings.push(`Dust flap genişliği (${dustFlapWidth}mm) en genişliğinin %60'ından fazla`);
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

    const {
      length: L,
      width: W,
      height: H,
      glueTabWidth: G,
      tuckLength: T,
    } = params;

    // ─── Net Layout ─────────────────────────────────────────────
    // Reverse Tuck: üst tuck front panelin üstünde, alt tuck back panelin altında
    //
    //  X: [GlueTab G] [Back L] [Side1 W] [Front L] [Side2 W]
    //  Y: [TopTuck T] [Body H] [BottomTuck T]
    //
    //  Back panelin ALTINDA alt tuck (aşağı doğru)
    //  Front panelin ÜSTÜNDE üst tuck (yukarı doğru)
    //  Yan panellerde dust flap (üst ve alt)

    const totalWidth = G + L + W + L + W;
    const totalHeight = T + H + T;

    // X koordinatları
    const x0 = 0;
    const x1 = G;             // glue → back
    const x2 = G + L;         // back → side1
    const x3 = G + L + W;     // side1 → front
    const x4 = G + L + W + L; // front → side2
    const x5 = totalWidth;

    // Y koordinatları
    const y0 = 0;             // top
    const y1 = T;             // top tuck → body
    const y2 = T + H;         // body → bottom tuck
    const y3 = totalHeight;   // bottom

    // ─── CUT Paths (dış kontur) ─────────────────────────────────
    // Reverse tuck: back panelin altında tuck, front panelin üstünde tuck
    // Yan panellerde (side1, side2) dust flap hem üstte hem altta

    const glueAngleOffset = G * 0.15;

    const outerContour: Point[] = [
      // Sol alt (glue tab başlangıç)
      { x: x0, y: y3 },
      // Glue tab alt köşe (açılı)
      { x: x0, y: y2 - glueAngleOffset },
      { x: x0 + glueAngleOffset, y: y2 },
      // Back panel alt — alt tuck burada (aşağı uzanır)
      { x: x1, y: y2 },
      // Alt tuck (back panelin altında)
      { x: x1, y: y3 },
      { x: x2, y: y3 },
      // Side1 alt — dust flap
      { x: x2, y: y2 },
      // Side1 alt dust flap (aşağı)
      { x: x2, y: y3 },
      { x: x3, y: y3 },
      // Front panel alt (dust flap yok — düz)
      { x: x3, y: y2 },
      // Side2 alt — dust flap
      { x: x4, y: y2 },
      // Side2 alt dust flap (aşağı)
      { x: x4, y: y3 },
      { x: x5, y: y3 },
      // Sağ üst köşe
      { x: x5, y: y1 },
      // Side2 üst — dust flap
      { x: x4, y: y1 },
      // Side2 üst dust flap (yukarı)
      { x: x4, y: y0 },
      { x: x3, y: y0 },
      // Front panel üst — üst tuck (yukarı uzanır)
      { x: x3, y: y1 },
      { x: x2, y: y1 },
      // Side1 üst — dust flap
      { x: x2, y: y1 },
      // Side1 üst dust flap (yukarı)
      { x: x2, y: y0 },
      { x: x1, y: y0 },
      // Back panel üst (dust flap yok — düz)
      { x: x1, y: y1 },
      // Glue tab üst köşe (açılı)
      { x: x0 + glueAngleOffset, y: y1 },
      { x: x0, y: y1 + glueAngleOffset },
    ];

    const cutPaths: Path[] = [polygonPath(outerContour)];

    // ─── CREASE Paths ───────────────────────────────────────────
    const creasePaths: Path[] = [];

    // Dikey crease'ler (panel araları)
    creasePaths.push(linePath({ x: x1, y: y1 }, { x: x1, y: y2 })); // glue → back
    creasePaths.push(linePath({ x: x2, y: y1 }, { x: x2, y: y2 })); // back → side1
    creasePaths.push(linePath({ x: x3, y: y1 }, { x: x3, y: y2 })); // side1 → front
    creasePaths.push(linePath({ x: x4, y: y1 }, { x: x4, y: y2 })); // front → side2

    // Yatay crease'ler (top/bottom tuck — sadece ilgili panellerde)
    // Üst tuck: front panelin üstünde (x3 → x4)
    creasePaths.push(linePath({ x: x3, y: y1 }, { x: x4, y: y1 }));
    // Alt tuck: back panelin altında (x1 → x2)
    creasePaths.push(linePath({ x: x1, y: y2 }, { x: x2, y: y2 }));

    // Dust flap crease'leri (yan panellerde — üst ve alt)
    // Side1 üst dust flap
    creasePaths.push(linePath({ x: x2, y: y1 }, { x: x2, y: y0 }));
    creasePaths.push(linePath({ x: x3, y: y0 }, { x: x3, y: y1 }));
    // Side1 alt dust flap
    creasePaths.push(linePath({ x: x2, y: y2 }, { x: x2, y: y3 }));
    creasePaths.push(linePath({ x: x3, y: y3 }, { x: x3, y: y2 }));
    // Side2 üst dust flap
    creasePaths.push(linePath({ x: x4, y: y1 }, { x: x4, y: y0 }));
    creasePaths.push(linePath({ x: x5, y: y0 }, { x: x5, y: y1 }));
    // Side2 alt dust flap
    creasePaths.push(linePath({ x: x4, y: y2 }, { x: x4, y: y3 }));
    creasePaths.push(linePath({ x: x5, y: y3 }, { x: x5, y: y2 }));

    // ─── GLUE Paths ─────────────────────────────────────────────
    const gluePaths: Path[] = [];
    gluePaths.push(polygonPath([
      { x: x0, y: y1 + glueAngleOffset },
      { x: x0 + glueAngleOffset, y: y1 },
      { x: x1, y: y1 },
      { x: x1, y: y2 },
      { x: x0 + glueAngleOffset, y: y2 },
      { x: x0, y: y2 - glueAngleOffset },
    ]));

    // ─── PERF Paths ─────────────────────────────────────────────
    const perfPaths: Path[] = [];

    // ─── FOLD Lines (3D için) ───────────────────────────────────
    const folds: FoldLine[] = [
      { from: { x: x1, y: y1 }, to: { x: x1, y: y2 }, angle: 90, type: 'valley' },
      { from: { x: x2, y: y1 }, to: { x: x2, y: y2 }, angle: 90, type: 'valley' },
      { from: { x: x3, y: y1 }, to: { x: x3, y: y2 }, angle: 90, type: 'valley' },
      { from: { x: x4, y: y1 }, to: { x: x4, y: y2 }, angle: 90, type: 'valley' },
      { from: { x: x3, y: y1 }, to: { x: x4, y: y1 }, angle: 90, type: 'valley' },
      { from: { x: x1, y: y2 }, to: { x: x2, y: y2 }, angle: 90, type: 'valley' },
    ];

    // ─── PANELS ─────────────────────────────────────────────────
    const panels: Panel[] = [
      { id: 'glue-tab', name: 'Yapıştırma Kulağı', polygon: gluePaths[0], face: 'glue' },
      { id: 'back', name: 'Arka Yüz', polygon: rect(x1, y1, L, H), face: 'back' },
      { id: 'side-left', name: 'Sol Yan', polygon: rect(x2, y1, W, H), face: 'left' },
      { id: 'front', name: 'Ön Yüz', polygon: rect(x3, y1, L, H), face: 'front' },
      { id: 'side-right', name: 'Sağ Yan', polygon: rect(x4, y1, W, H), face: 'right' },
      { id: 'top-tuck', name: 'Üst Tuck (Ön)', polygon: rect(x3, y0, L, T), face: 'top' },
      { id: 'bottom-tuck', name: 'Alt Tuck (Arka)', polygon: rect(x1, y2, L, T), face: 'bottom' },
    ];

    // ─── SVG Build ──────────────────────────────────────────────
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

    builder.addDimension({ x: x1, y: y2 + 5 }, { x: x2, y: y2 + 5 }, `L=${L}`, 8);
    builder.addDimension({ x: x2, y: y2 + 5 }, { x: x3, y: y2 + 5 }, `W=${W}`, 8);
    builder.addDimension({ x: x0 - 5, y: y1 }, { x: x0 - 5, y: y2 }, `H=${H}`, -10);

    const svg = builder.build();

    // ─── Metadata ───────────────────────────────────────────────
    const allPaths = [...cutPaths, ...creasePaths, ...gluePaths];
    const bb = bbox(allPaths);
    const totalArea = bb.w * bb.h;
    const panelArea = (L * H * 2) + (W * H * 2) + (L * T * 2) + (G * H);
    const wastePercentage = ((totalArea - panelArea) / totalArea) * 100;

    const metadata: StructureMetadata = {
      totalArea,
      materialUsage: panelArea,
      wastePercentage: Math.max(0, wastePercentage),
      boundingBox: { width: totalWidth, height: totalHeight },
      recommendedMaterial: this.recommendMaterial(params),
      complexity: 'simple',
      industryCompliance: ['ECMA-A21'],
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

  private recommendMaterial(params: Record<string, number>): string {
    const { length, width, height, materialThickness } = params;
    const volume = length * width * height;
    if (volume > 5_000_000) return 'Oluklu Mukavva (Kraft 300g/m²)';
    if (volume > 1_000_000) return 'SCT Karton (300g/m²)';
    if (materialThickness > 0.5) return 'Oluklu Mukavva (B Flute)';
    return 'Karton (250-350g/m²)';
  }

  private emptyMetadata(): StructureMetadata {
    return {
      totalArea: 0, materialUsage: 0, wastePercentage: 0,
      boundingBox: { width: 0, height: 0 },
      recommendedMaterial: '', complexity: 'simple', industryCompliance: [],
    };
  }
}

export default ReverseTuckEndBox;
