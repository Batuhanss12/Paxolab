/**
 * Forxa StructureEngine — Mailer Box (Self-Erecting)
 *
 * Mailer box (öne katlanan kapaklı kutu) — tek parça, kendinden katlanır.
 * Üst kapak öne doğru açılır, tuck ile kapanır.
 *
 * Net Layout (yatay açılım):
 *
 *   ┌───────────────────────────────────────┐
 *   │         Front Panel (L x H)           │
 *   ├───────────────────────────────────────┤
 *   │         Bottom Panel (L x W)          │
 *   ├───────────────────────────────────────┤
 *   │         Back Panel (L x H)            │
 *   ├───────────────────────────────────────┤
 *   │         Lid Panel (L x H)             │
 *   ├───────────────────────────────────────┤
 *   │         Lid Tuck (L x T)              │
 *   └───────────────────────────────────────┘
 *
 * + Sol/Sağ yan flap'ler (W/2 genişliğinde)
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

export class MailerBox implements PackagingStructure {
  id = 'mailer-box';
  name = 'Mailer Box';
  category = 'box' as const;
  description = 'Öne katlanan kapaklı mailer kutu — tek parça, tuck ile kapanış';
  icon = 'box';

  parameters: StructureParameter[] = [
    { key: 'length', label: 'Boy (L)', unit: 'mm', min: 30, max: 600, default: 150, step: 1, required: true, description: 'Ön/arka/kapak panel genişliği' },
    { key: 'width', label: 'En (W)', unit: 'mm', min: 20, max: 400, default: 80, step: 1, required: true, description: 'Taban genişliği (yan flapler W/2)' },
    { key: 'height', label: 'Yükseklik (H)', unit: 'mm', min: 20, max: 500, default: 100, step: 1, required: true, description: 'Kutu yüksekliği' },
    { key: 'lidHeight', label: 'Kapak Yüksekliği', unit: 'mm', min: 10, max: 300, default: 80, step: 1, required: false, description: 'Kapak paneli yüksekliği' },
    { key: 'lidTuck', label: 'Kapak Tuck', unit: 'mm', min: 5, max: 100, default: 30, step: 1, required: false, description: 'Kapak tuck flap genişliği' },
    { key: 'sideFlapWidth', label: 'Yan Flap Genişliği', unit: 'mm', min: 10, max: 200, default: 40, step: 1, required: false, description: 'Yan flap (W/2 önerilir)' },
    { key: 'cornerRadius', label: 'Köşe Radyusu', unit: 'mm', min: 0, max: 20, default: 2, step: 0.5, required: false, description: 'Köşe yuvarlatma' },
    { key: 'materialThickness', label: 'Malzeme Kalınlığı', unit: 'mm', min: 0.1, max: 5, default: 0.4, step: 0.1, required: false, description: 'Kerf kompanzasyon için' },
  ];

  getDefaultParameters(): Record<string, number> {
    return getDefaultParams(this.parameters);
  }

  validateParameters(params: Record<string, number>): ValidationResult {
    const base = validateParameters(params, this.parameters);
    if (!base.valid) return base;

    const warnings: string[] = [];
    const { width, height, lidHeight, lidTuck, sideFlapWidth } = params;

    if (lidHeight > height * 1.5) {
      warnings.push(`Kapak yüksekliği (${lidHeight}mm) kutu yüksekliğinin 1.5 katından fazla`);
    }
    if (lidTuck > lidHeight * 0.6) {
      warnings.push(`Kapak tuck (${lidTuck}mm) kapak yüksekliğinin %60'ından fazla`);
    }
    if (sideFlapWidth < width * 0.4) {
      warnings.push(`Yan flap (${sideFlapWidth}mm) en genişliğinin %40'ından az — kutu sağlam olmayabilir`);
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
      sideFlapWidth: SF,
    } = params;
    const LH = params.lidHeight > H * 1.2 ? H : params.lidHeight;
    const LT = Math.min(params.lidTuck, Math.max(8, LH * 0.5));

    // ─── Net Layout (dikey açılım) ──────────────────────────────
    //
    //  Y ekseni (yukarıdan aşağıya):
    //    [Lid Tuck LT]      — kapak tuck (en üst)
    //    [Lid Panel LH]     — kapak
    //    [Back Panel H]     — arka yüz
    //    [Bottom Panel W]   — taban
    //    [Front Panel H]    — ön yüz (en alt)
    //
    //  X ekseni:
    //    [SideFlap SF] [Main L] [SideFlap SF]

    const totalWidth = SF + L + SF;
    const totalHeight = LT + LH + H + W + H;

    // X koordinatları
    const x0 = 0;
    const x1 = SF;          // side flap → main
    const x2 = SF + L;      // main → side flap
    const x3 = totalWidth;

    // Y koordinatları (yukarıdan aşağıya)
    const y0 = 0;                    // lid tuck top
    const y1 = LT;                   // lid tuck → lid panel
    const y2 = LT + LH;              // lid panel → back panel
    const y3 = LT + LH + H;          // back → bottom
    const y4 = LT + LH + H + W;      // bottom → front
    const y5 = totalHeight;          // front bottom

    // ─── CUT Paths (dış kontur) ─────────────────────────────────
    // Mailer box: yan flap'ler sadece front, bottom, back, lid panellerde
    // Lid tuck daraltılmış (L genişliğinde, yan flap yok)

    const outerContour: Point[] = [
      // Lid tuck sol üst
      { x: x1, y: y0 },
      // Lid tuck sağ üst
      { x: x2, y: y0 },
      // Lid panel sağ üst köşe — yan flap ile
      { x: x2, y: y1 },
      // Sağ yan flap (lid panel üzerinde)
      { x: x3, y: y1 },
      { x: x3, y: y2 },
      // Back panel sağ
      { x: x2, y: y2 },
      // Bottom panel sağ — yan flap
      { x: x2, y: y3 },
      { x: x3, y: y3 },
      { x: x3, y: y4 },
      // Front panel sağ
      { x: x2, y: y4 },
      // Front panel sağ alt köşe
      { x: x2, y: y5 },
      // Front panel sol alt köşe
      { x: x1, y: y5 },
      // Front panel sol
      { x: x1, y: y4 },
      // Bottom panel sol — yan flap
      { x: x1, y: y3 },
      { x: x0, y: y3 },
      { x: x0, y: y4 },
      // Back panel sol (yan flap bitti)
      { x: x1, y: y4 },
      // Back panel sol
      { x: x1, y: y2 },
      // Lid panel sol — yan flap
      { x: x0, y: y2 },
      { x: x0, y: y1 },
      // Lid panel sol (yan flap bitti)
      { x: x1, y: y1 },
      // Lid tuck sol başlangıç
      { x: x1, y: y0 },
    ];

    const cutPaths: Path[] = [polygonPath(outerContour)];

    // Lid tuck köşe yuvarlatma (basit — küçük kesim)
    // İleride bezier ile yapılacak

    // ─── CREASE Paths ───────────────────────────────────────────
    const creasePaths: Path[] = [];

    // Yatay crease'ler (panel araları — tam genişlikte yan flap dahil)
    creasePaths.push(linePath({ x: x1, y: y1 }, { x: x2, y: y1 })); // lid tuck → lid panel
    creasePaths.push(linePath({ x: x0, y: y2 }, { x: x3, y: y2 })); // lid → back (yan flap dahil)
    creasePaths.push(linePath({ x: x0, y: y3 }, { x: x3, y: y3 })); // back → bottom
    creasePaths.push(linePath({ x: x0, y: y4 }, { x: x3, y: y4 })); // bottom → front

    // Dikey crease'ler (yan flap katlama — sadece bottom panelde)
    creasePaths.push(linePath({ x: x1, y: y3 }, { x: x1, y: y4 })); // sol yan flap alt
    creasePaths.push(linePath({ x: x2, y: y3 }, { x: x2, y: y4 })); // sağ yan flap alt
    // Yan flap üst katlama (back panelde)
    creasePaths.push(linePath({ x: x1, y: y2 }, { x: x1, y: y3 })); // sol yan flap üst
    creasePaths.push(linePath({ x: x2, y: y2 }, { x: x2, y: y3 })); // sağ yan flap üst
    // Lid panel yan flap
    creasePaths.push(linePath({ x: x1, y: y1 }, { x: x1, y: y2 })); // sol lid yan
    creasePaths.push(linePath({ x: x2, y: y1 }, { x: x2, y: y2 })); // sağ lid yan

    // ─── GLUE Paths ─────────────────────────────────────────────
    // Mailer box'ta glue tab yok — yan flap'ler interlock ile
    // Ama opsiyonel glue bölgesi gösterilebilir (şimdilik boş)
    const gluePaths: Path[] = [];

    // ─── PERF Paths ─────────────────────────────────────────────
    const perfPaths: Path[] = [];

    // ─── FOLD Lines (3D için) ───────────────────────────────────
    const folds: FoldLine[] = [
      { from: { x: x1, y: y1 }, to: { x: x2, y: y1 }, angle: 90, type: 'valley' }, // lid tuck
      { from: { x: x0, y: y2 }, to: { x: x3, y: y2 }, angle: 90, type: 'valley' }, // lid → back
      { from: { x: x0, y: y3 }, to: { x: x3, y: y3 }, angle: 90, type: 'valley' }, // back → bottom
      { from: { x: x0, y: y4 }, to: { x: x3, y: y4 }, angle: 90, type: 'valley' }, // bottom → front
      { from: { x: x1, y: y3 }, to: { x: x1, y: y4 }, angle: 90, type: 'valley' }, // sol yan
      { from: { x: x2, y: y3 }, to: { x: x2, y: y4 }, angle: 90, type: 'valley' }, // sağ yan
    ];

    // ─── PANELS ─────────────────────────────────────────────────
    const panels: Panel[] = [
      { id: 'lid-tuck', name: 'Kapak Tuck', polygon: rect(x1, y0, L, LT), face: 'lid-tuck' },
      { id: 'lid', name: 'Kapak', polygon: rect(x1, y1, L, LH), face: 'lid' },
      { id: 'back', name: 'Arka Yüz', polygon: rect(x1, y2, L, H), face: 'back' },
      { id: 'bottom', name: 'Taban', polygon: rect(x1, y3, L, W), face: 'bottom' },
      { id: 'front', name: 'Ön Yüz', polygon: rect(x1, y4, L, H), face: 'front' },
      { id: 'side-flap-left', name: 'Sol Yan Flap', polygon: rect(x0, y3, SF, W), face: 'left' },
      { id: 'side-flap-right', name: 'Sağ Yan Flap', polygon: rect(x2, y3, SF, W), face: 'right' },
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

    builder.addDimension({ x: x1, y: y5 + 5 }, { x: x2, y: y5 + 5 }, `L=${L}`, 8);
    builder.addDimension({ x: x3 + 5, y: y3 }, { x: x3 + 5, y: y4 }, `W=${W}`, 10);
    builder.addDimension({ x: x0 - 5, y: y4 }, { x: x0 - 5, y: y5 }, `H=${H}`, -10);

    const svg = builder.build();

    // ─── Metadata ───────────────────────────────────────────────
    const allPaths = [...cutPaths, ...creasePaths];
    const bb = bbox(allPaths);
    const totalArea = bb.w * bb.h;
    const panelArea = (L * H * 2) + (L * W) + (L * LH) + (L * LT) + (SF * W * 2);
    const wastePercentage = ((totalArea - panelArea) / totalArea) * 100;

    const metadata: StructureMetadata = {
      totalArea,
      materialUsage: panelArea,
      wastePercentage: Math.max(0, wastePercentage),
      boundingBox: { width: totalWidth, height: totalHeight },
      recommendedMaterial: this.recommendMaterial(params),
      complexity: 'medium',
      industryCompliance: ['FEFCO-0427', 'ECMA-B20'],
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

export default MailerBox;
