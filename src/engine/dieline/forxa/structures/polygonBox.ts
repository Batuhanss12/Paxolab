/**
 * Forxa StructureEngine — Polygon Box (ECMA C / D ailesi)
 *
 * Düzgün n-kenarlı gövde (üçgen … sekizgen) — taban + n duvar,
 * "yıldız" (star) açılım. Her duvar tabana crease (katlama) ile
 * bağlıdır — gerçek, tek parça, üretilebilir bir net.
 *
 * closureType = 0 → C ailesi (dikdörtgen olmayan, BOYUNA YAPIŞTIRMALI):
 *   tek boyuna yapıştırma kulağı, duvar 0 ile önceki duvar arasındaki
 *   boş dilime konur. Her radyale kulak eklemek altıgende komşu duvarı
 *   keser — tek parça CUT kendini keser.
 * closureType = 1 → D ailesi (dikdörtgen olmayan, YAPIŞTIRMASIZ):
 *   her duvarın üst (dış) kenarına yapıştırmasız katlanır kenar payı
 *   (rim) eklenir — glue kullanılmaz.
 *
 * Örnek gerçek karşılıklar: üçgen prizma çikolata kutusu (n=3),
 * altıgen hediye kutusu (n=6), sekizgen mum kutusu (n=8) vb.
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
} from '../types';
import { SVGBuilder, polygonPath, bbox } from '../svgBuilder';
import { validateParameters, getDefaultParams, mergeParams } from '../validator';

function normalize(v: Point): Point {
  const len = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / len, y: v.y / len };
}

function outwardNormal(from: Point, to: Point): Point {
  // CCW çokgende, kenar yönü (ex,ey) olduğunda dışa dönük normal (ey,-ex)'tir.
  const dir = normalize({ x: to.x - from.x, y: to.y - from.y });
  return { x: dir.y, y: -dir.x };
}

function translatePts(pts: Point[], dx: number, dy: number): Point[] {
  return pts.map(p => ({ x: p.x + dx, y: p.y + dy }));
}

/** Perpendicular to `normal`, pointing toward `toward` (the empty wedge). */
function wedgeSide(normal: Point, toward: Point): Point {
  const left = { x: -normal.y, y: normal.x };
  if (left.x * toward.x + left.y * toward.y < 0) return { x: -left.x, y: -left.y };
  return left;
}

export class PolygonBox implements PackagingStructure {
  id = 'polygon-box';
  name = 'Polygon Box (Çokgen Gövde)';
  category = 'box' as const;
  description = 'Düzgün n-kenarlı gövde — taban + n duvar, yıldız açılım. Üçgenden sekizgene (ECMA C/D ailesi — dikdörtgen olmayan gövdeler)';
  icon = 'box';

  parameters: StructureParameter[] = [
    { key: 'sides', label: 'Kenar Sayısı (adet)', unit: 'mm', min: 3, max: 8, default: 6, step: 1, required: true, description: 'Taban çokgeninin kenar sayısı (3=üçgen … 8=sekizgen)' },
    { key: 'sideLength', label: 'Kenar Uzunluğu', unit: 'mm', min: 20, max: 250, default: 60, step: 1, required: true, description: 'Taban çokgeninin bir kenarı' },
    { key: 'height', label: 'Yükseklik', unit: 'mm', min: 20, max: 350, default: 120, step: 1, required: true, description: 'Duvar yüksekliği' },
    { key: 'closureType', label: 'Kapama Tipi (0/1)', unit: 'mm', min: 0, max: 1, default: 0, step: 1, required: false, description: '0 = yapıştırmalı köşe kulağı (ECMA-C), 1 = yapıştırmasız katlanır kenar (ECMA-D)' },
    { key: 'tabWidth', label: 'Kulak / Kenar Payı', unit: 'mm', min: 6, max: 40, default: 14, step: 1, required: false, description: 'Köşe yapıştırma kulağı ya da katlanır kenar payı genişliği' },
    { key: 'materialThickness', label: 'Malzeme', unit: 'mm', min: 0.2, max: 3, default: 0.35, step: 0.05, required: false, description: 'Karton kalınlığı' },
  ];

  getDefaultParameters(): Record<string, number> {
    return getDefaultParams(this.parameters);
  }

  validateParameters(params: Record<string, number>): ValidationResult {
    const base = validateParameters(params, this.parameters);
    if (!base.valid) return base;
    const warnings: string[] = [];
    const sides = Math.round(params.sides);
    if (sides < 3 || sides > 8) warnings.push(`Kenar sayısı (${sides}) 3–8 aralığı dışında — sınırlandırıldı`);
    if (params.tabWidth > params.sideLength * 0.7) {
      warnings.push('Kulak/kenar payı, kenar uzunluğunun %70’inden fazla — malzeme israfı olabilir');
    }
    return { valid: true, errors: base.errors, warnings: [...base.warnings, ...warnings] };
  }

  generateDieline(userParams: Record<string, number>): DielineResult {
    const params = mergeParams(this.getDefaultParameters(), userParams);
    const validation = this.validateParameters(params);
    if (!validation.valid) return this.fail(validation);

    const n = Math.max(3, Math.min(8, Math.round(params.sides)));
    const s = params.sideLength;
    const h = params.height;
    const closureType = Math.round(params.closureType) === 1 ? 1 : 0;
    const tabWidth = Math.max(4, params.tabWidth);

    // ─── Taban çokgeni (CCW, düzgün n-gen) ──────────────────────
    const verts: Point[] = [{ x: 0, y: 0 }];
    let heading = 0;
    const turn = (2 * Math.PI) / n;
    for (let i = 0; i < n; i++) {
      const prev = verts[i];
      verts.push({ x: prev.x + s * Math.cos(heading), y: prev.y + s * Math.sin(heading) });
      heading += turn;
    }
    verts[n] = { ...verts[0] }; // kapanış float hatasını sıfırla

    const outline: Point[] = [verts[0]];
    const creasePaths: Path[] = [];
    const gluePaths: Path[] = [];
    const panels: Panel[] = [
      { id: 'base', name: 'Taban', polygon: [...verts], face: 'bottom' },
    ];

    for (let i = 0; i < n; i++) {
      const P0 = verts[i];
      const P1 = verts[i + 1];
      const normal = outwardNormal(P0, P1);
      const far0 = { x: P0.x + normal.x * h, y: P0.y + normal.y * h };
      const far1 = { x: P1.x + normal.x * h, y: P1.y + normal.y * h };

      panels.push({
        id: `wall-${i}`,
        name: `Duvar ${i + 1}`,
        polygon: [P0, P1, far1, far0, P0],
        face: i === 0 ? 'front' : (i === Math.floor(n / 2) ? 'back' : 'side'),
      });

      creasePaths.push([P0, P1]); // taban ↔ duvar kırışı

      if (closureType === 0) {
        // ─── C ailesi: tek boyuna kulak (yıldız nette bir dilim) ──
        if (i === 0) {
          const prevNormal = outwardNormal(verts[n - 1], P0);
          const alpha = (2 * Math.PI) / n;
          const tabH = Math.min(tabWidth * 1.4, h * 0.55);
          const tw = Math.min(tabWidth, Math.max(2.5, tabH * Math.sin(alpha) * 0.62));
          const side = wedgeSide(normal, prevNormal);
          const pTabInner = { x: P0.x + normal.x * tabH, y: P0.y + normal.y * tabH };
          const pTabOuter = { x: pTabInner.x + side.x * tw, y: pTabInner.y + side.y * tw };
          outline.push(pTabOuter, pTabInner, far0, far1, P1);
          creasePaths.push([P0, pTabInner]);
          gluePaths.push([P0, pTabInner, pTabOuter, P0]);
        } else {
          outline.push(far0, far1, P1);
        }
      } else {
        // ─── D ailesi: yapıştırmasız katlanır kenar payı (üst kenarda) ──
        const rim = tabWidth;
        const farRim0 = { x: far0.x + normal.x * rim, y: far0.y + normal.y * rim };
        const farRim1 = { x: far1.x + normal.x * rim, y: far1.y + normal.y * rim };
        outline.push(far0, farRim0, farRim1, far1, P1);
        creasePaths.push([far0, far1]);
      }
    }

    // ─── Bbox'a göre pozitif alana taşı ─────────────────────────
    const rawBb = bbox([outline]);
    const dx = -rawBb.x;
    const dy = -rawBb.y;
    const outlineT = translatePts(outline, dx, dy);
    const creaseT = creasePaths.map(c => translatePts(c, dx, dy));
    const glueT = gluePaths.map(g => translatePts(g, dx, dy));
    const panelsT = panels.map(p => ({ ...p, polygon: translatePts(p.polygon, dx, dy) }));
    if (closureType === 0 && glueT[0]) {
      panelsT.push({ id: 'glue-tab', name: 'Yapıştırma kulağı', polygon: glueT[0], face: 'glue' });
    }

    const totalWidth = rawBb.w;
    const totalHeight = rawBb.h;

    const cutPaths: Path[] = [polygonPath(outlineT)];
    const folds: FoldLine[] = creaseT.map(c => ({ from: c[0], to: c[c.length - 1], angle: 90, type: 'valley' as const }));

    const builder = new SVGBuilder({
      width: totalWidth,
      height: totalHeight,
      margin: 15,
      showGrid: false,
      showDimensions: true,
      showRegMarks: true,
    });
    for (const p of cutPaths) builder.addCutPath(p);
    for (const p of creaseT) builder.addCreasePath(p);
    for (const p of glueT) builder.addGluePath(p);
    for (const f of folds) builder.addFold(f);
    for (const panel of panelsT) builder.addPanel(panel);
    builder.addDimension({ x: 0, y: totalHeight + 6 }, { x: s, y: totalHeight + 6 }, `kenar=${s}`, 6);

    const svg = builder.build();
    const bb = bbox([outlineT, ...creaseT, ...glueT]);
    const baseArea = this.polygonArea(verts);
    const wallArea = n * s * h;
    const panelArea = baseArea + wallArea;

    return {
      success: true,
      structureId: this.id,
      structureName: this.name,
      svg,
      paths: { cut: cutPaths, crease: creaseT, glue: glueT, perf: [] },
      folds,
      panels: panelsT,
      bounds: { width: totalWidth, height: totalHeight },
      metadata: {
        totalArea: bb.w * bb.h,
        materialUsage: panelArea,
        wastePercentage: Math.max(0, ((bb.w * bb.h - panelArea) / Math.max(1, bb.w * bb.h)) * 100),
        boundingBox: { width: totalWidth, height: totalHeight },
        recommendedMaterial: closureType === 0 ? 'Karton (300g/m², boyuna yapıştırma)' : 'Karton (300g/m², yapıştırmasız katlama)',
        complexity: n <= 4 ? 'simple' : 'medium',
        industryCompliance: [closureType === 0 ? 'ECMA-C (çokgen, yapıştırmalı)' : 'ECMA-D (çokgen, yapıştırmasız)'],
      },
      warnings: validation.warnings,
      errors: [],
    };
  }

  private polygonArea(verts: Point[]): number {
    let sum = 0;
    for (let i = 0; i < verts.length - 1; i++) {
      sum += verts[i].x * verts[i + 1].y - verts[i + 1].x * verts[i].y;
    }
    return Math.abs(sum) / 2;
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

export default PolygonBox;
