/**
 * Forxa StructureEngine — Tuck End Box
 *
 * Klasik tuck-end kutu (aynı yönde iki tuck flap).
 *
 * Net Layout (yatay açılım):
 *
 *   ┌────────┬────────┬────────┬────────┬───────┐
 *   │  Glue  │  Back  │ Bottom │ Front  │  ---  │
 *   │  Tab   │ Panel  │  Flap  │ Panel  │       │
 *   ├────────┼────────┼────────┼────────┼───────┤
 *   │        │  Top   │        │  Top   │       │
 *   │        │ Tuck   │        │ Tuck   │       │
 *   └────────┴────────┴────────┴────────┴───────┘
 *
 * Aslında standart tuck-end net (yatay):
 *
 *   [GlueTab] [Back] [BottomCrease] [Front] [TopCrease]
 *                  + dust flaps (yan kanatlar)
 *
 * Parametreler:
 *   length (L)  — ön/arka panel genişliği (mm)
 *   width  (W)  — yan panel genişliği (mm)
 *   height (H)  — kutu yüksekliği (mm)
 *   glueTabWidth — yapıştırma kulağı genişliği (mm, default L*0.15)
 *   tuckLength   — tuck flap uzunluğu (mm, default H*0.85)
 *   dustFlapWidth — dust flap genişliği (mm, default W/2)
 *   cornerRadius — köşe radyusu (mm, default 2)
 *   materialThickness — malzeme kalınlığı (mm, kerf için)
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

    const {
      length: L,
      width: W,
      height: H,
      glueTabWidth: G,
      tuckLength: T,
      dustFlapWidth: D,
      cornerRadius: R,
      materialThickness: M,
    } = params;

    // Kerf kompanzasyonu: malzeme kalınlığı kadar panel genişliğini ayarla
    // (karton kalınlığı kadar fold çizgisi içeri kayar)
    const kerf = M || 0.3; // default 0.3mm
    const Wk = W - kerf; // kompanze edilmiş yan panel genişliği
    const Lk = L; // ön/arka panel genişliği (kompanze edilmez)

    // ─── Net Layout (yatay) ─────────────────────────────────────
    //
    //  Yönelim: sol-üst origin (0,0), x sağa, y aşağı
    //
    //  Toplam genişlik = G + W + L + W + L + G (glue tab her iki uçta)
    //  Hayır — standart tuck-end: tek glue tab
    //
    //  Layout:
    //    [GlueTab G] [Back L] [Crease] [Front L] [Crease] [TopTuck T]
    //    + [DustFlap D] üstte ve altta (front/back panellerde)
    //
    //  Aslında klasik tuck-end net:
    //    Genişlik: G + W + L + W   (glue + side + back/front + side)
    //    Yükseklik: H + T (top tuck) + T (bottom tuck)
    //
    //  Daha basit ve doğru layout (tek sıra):
    //    X ekseni: [GlueTab] [Side1 W] [Back L] [Side2 W] [Front L]
    //    Y ekseni: [TopTuck T] [Body H] [BottomTuck T]
    //
    //  Dust flap'ler top/bottom tuck ile birlikte yan panellerde

    const totalWidth = G + W + L + W + L;
    const totalHeight = T + H + T;

    // ─── Koordinat Hesaplama ────────────────────────────────────
    const x0 = 0;
    const x1 = G;            // glue tab → side1 crease
    const x2 = G + W;        // side1 → back crease
    const x3 = G + W + L;    // back → side2 crease
    const x4 = G + W + L + W; // side2 → front crease
    const x5 = totalWidth;    // front sağ kenar

    const y0 = 0;             // top
    const y1 = T;             // top tuck → body crease
    const y2 = T + H;         // body → bottom tuck crease
    const y3 = totalHeight;   // bottom

    // ─── CUT Paths (dış kontur) ─────────────────────────────────
    // Dış kontur: glue tab → üst tuck (yan panellerde dust flap) → sağ → alt tuck → sol

    const cutPaths: Path[] = [];

    // Ana dış kontur — basit dikdörtgen + glue tab açısı
    // Glue tab: 5-10° açılı (profesyonel standart)
    const glueAngleOffset = G * 0.15; // glue tab köşe offset

    // Dust flap: yan panellerde üst/alt köşelerde açılı flap
    // Dust flap açısı: 15° (profesyonel standart)
    const dustFlapAngle = D * 0.25; // dust flap köşe offset

    // Köşe radyusu uygula (R > 0 ise)
    const cornerR = Math.min(R, T * 0.3, D * 0.3); // radyus sınırı

    // Dış kontur — dust flap'ler ile
    const outerContour: Point[] = [
      // Sol alt → sol üst (glue tab açılı)
      { x: x0, y: y3 },
      { x: x0, y: y1 + glueAngleOffset },
      { x: x0 + glueAngleOffset, y: y1 },
      { x: x1, y: y1 },
      // Üst: side1 dust flap (yukarı çık)
      { x: x1, y: y0 + dustFlapAngle },
      { x: x1 + dustFlapAngle, y: y0 },
      // Üst tuck (back panel üstü)
      { x: x2, y: y0 },
      // Side2 dust flap
      { x: x3 - dustFlapAngle, y: y0 },
      { x: x3, y: y0 + dustFlapAngle },
      // Sağ
      { x: x5, y: y0 + dustFlapAngle },
      { x: x5, y: y3 - dustFlapAngle },
      // Alt: side2 dust flap
      { x: x3, y: y3 - dustFlapAngle },
      { x: x3 - dustFlapAngle, y: y3 },
      // Alt tuck (back panel altı)
      { x: x2, y: y3 },
      // Side1 dust flap (alt)
      { x: x1 + dustFlapAngle, y: y3 },
      { x: x1, y: y3 - dustFlapAngle },
      { x: x1, y: y2 },
      // Sol alt (glue tab)
      { x: x0 + glueAngleOffset, y: y2 },
      { x: x0, y: y2 - glueAngleOffset },
    ];

    cutPaths.push(polygonPath(outerContour));
    // Dikey cut çizgileri (dust flap ayırımları) — yan panellerde
    for (const flapX of [x2, x3, x4]) {
      cutPaths.push(linePath({ x: flapX, y: y0 }, { x: flapX, y: y1 }));
      cutPaths.push(linePath({ x: flapX, y: y2 }, { x: flapX, y: y3 }));
    }

    // Tuck flap rounded uçları — köşe radyusu uygula
    if (cornerR > 0) {
      // Tuck flap köşelerine küçük yuvarlatma ekle (cut path olarak)
      for (const tuckY of [y0, y3]) {
        const dir = tuckY === y0 ? 1 : -1;
        cutPaths.push(polygonPath([
          { x: x2 + cornerR, y: tuckY },
          { x: x2, y: tuckY + dir * cornerR },
          { x: x2, y: tuckY },
        ]));
        cutPaths.push(polygonPath([
          { x: x2 + L - cornerR, y: tuckY },
          { x: x2 + L, y: tuckY + dir * cornerR },
          { x: x2 + L, y: tuckY },
        ]));
      }
    }

    // ─── CREASE Paths (katlama çizgileri) ───────────────────────
    const creasePaths: Path[] = [];

    // Dikey crease'ler (panel araları)
    creasePaths.push(linePath({ x: x1, y: y1 }, { x: x1, y: y2 })); // glue → side1
    creasePaths.push(linePath({ x: x2, y: y1 }, { x: x2, y: y2 })); // side1 → back
    creasePaths.push(linePath({ x: x3, y: y1 }, { x: x3, y: y2 })); // back → side2
    creasePaths.push(linePath({ x: x4, y: y1 }, { x: x4, y: y2 })); // side2 → front

    // Yatay crease'ler (top/bottom tuck)
    creasePaths.push(linePath({ x: x1, y: y1 }, { x: x5, y: y1 })); // top tuck crease
    creasePaths.push(linePath({ x: x1, y: y2 }, { x: x5, y: y2 })); // bottom tuck crease

    // Dust flap ayırımları CUT katmanında; gövde bağlantıları yatay crease çizgileridir.

    // ─── GLUE Paths (yapıştırma bölgesi) ────────────────────────
    const gluePaths: Path[] = [];
    // Glue tab bölgesi
    gluePaths.push(polygonPath([
      { x: x0, y: y1 + glueAngleOffset },
      { x: x0 + glueAngleOffset, y: y1 },
      { x: x1, y: y1 },
      { x: x1, y: y2 },
      { x: x0 + glueAngleOffset, y: y2 },
      { x: x0, y: y2 - glueAngleOffset },
    ]));

    // ─── PERF Paths (perforasyon — şu an boş) ───────────────────
    const perfPaths: Path[] = [];

    // ─── FOLD Lines (3D için) ───────────────────────────────────
    const folds: FoldLine[] = [
      { from: { x: x1, y: y1 }, to: { x: x1, y: y2 }, angle: 90, type: 'valley' },
      { from: { x: x2, y: y1 }, to: { x: x2, y: y2 }, angle: 90, type: 'valley' },
      { from: { x: x3, y: y1 }, to: { x: x3, y: y2 }, angle: 90, type: 'valley' },
      { from: { x: x4, y: y1 }, to: { x: x4, y: y2 }, angle: 90, type: 'valley' },
      { from: { x: x1, y: y1 }, to: { x: x5, y: y1 }, angle: 90, type: 'valley' },
      { from: { x: x1, y: y2 }, to: { x: x5, y: y2 }, angle: 90, type: 'valley' },
    ];

    // ─── PANELS (artwork mapping için) ──────────────────────────
    const panels: Panel[] = [
      { id: 'glue-tab', name: 'Yapıştırma Kulağı', polygon: gluePaths[0], face: 'glue' },
      { id: 'side-left', name: 'Sol Yan', polygon: rect(x1 + kerf / 2, y1, Wk, H), face: 'left' },
      { id: 'front', name: 'Ön Yüz', polygon: rect(x2, y1, Lk, H), face: 'front' },
      { id: 'side-right', name: 'Sağ Yan', polygon: rect(x3 + kerf / 2, y1, Wk, H), face: 'right' },
      { id: 'back', name: 'Arka Yüz', polygon: rect(x4, y1, Lk, H), face: 'back' },
      { id: 'top-tuck', name: 'Üst Tuck', polygon: rect(x2, y0, Lk, T), face: 'top' },
      { id: 'bottom-tuck', name: 'Alt Tuck', polygon: rect(x2, y2, Lk, T), face: 'bottom' },
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

    // Ölçüler
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
