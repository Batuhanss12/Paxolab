/**
 * MatBixx StructureEngine — Auxiliary Devices (ECMA X ailesi)
 *
 * X grubu tek başına bir kutu değildir; ECMA tanımına göre A/B/C/D/F
 * gövdelerine EKLENEN kapama/askı/dökme/kulp özellikleridir. Bu modül
 * var olan bir DielineResult (host kutu) üzerine GERÇEK ek kesim /
 * perforaj / katlama geometrisi bindirir. Host'un dış sınırları
 * (bounds) değişmez — cihaz geometrisi her zaman seçilen panelin
 * içine, kenarlardan güvenli mesafede yerleştirilir.
 */

import type {
  DielineResult,
  Panel,
  Path,
  Point,
} from './types';
import { polygonPath, pathToD } from './svgBuilder';

export type AuxCategory =
  | 'tearZipper'
  | 'reclosable'
  | 'pourSpout'
  | 'embeddedClosure'
  | 'hanging'
  | 'displayPanel'
  | 'handle';

export interface AuxHostChoice {
  host: string;
  category: AuxCategory;
}

/** X cihaz numarasını (10–86, resmi ECMA X tablosu) gerçek bir host kutu + kategoriye eşler. */
export function classifyAuxDevice(deviceNum: number): AuxHostChoice {
  if (deviceNum >= 10 && deviceNum <= 14) return { host: 'tuck-end-box', category: 'tearZipper' };
  if (deviceNum >= 20 && deviceNum <= 38) return { host: 'tuck-end-box', category: 'reclosable' };
  if (deviceNum >= 40 && deviceNum <= 48) return { host: 'tuck-end-box', category: 'pourSpout' };
  if (deviceNum >= 50 && deviceNum <= 52) return { host: 'tuck-end-box', category: 'embeddedClosure' };
  if (deviceNum >= 60 && deviceNum <= 66) return { host: 'tuck-end-box', category: 'hanging' };
  if (deviceNum >= 70 && deviceNum <= 73) return { host: 'mailer-box', category: 'displayPanel' };
  if (deviceNum >= 80 && deviceNum <= 86) return { host: 'mailer-box', category: 'handle' };
  return { host: 'tuck-end-box', category: 'reclosable' };
}

const DEVICE_NAMES: Record<AuxCategory, string> = {
  tearZipper: 'Fermuar / yırtma şeridi',
  reclosable: 'Yeniden kapanır kilit',
  pourSpout: 'Dökme ağzı',
  embeddedClosure: 'Gömülü kapak',
  hanging: 'Askı deliği (Euroslot)',
  displayPanel: 'Entegre sergi paneli',
  handle: 'Taşıma kulpu',
};

const PREFER_FACES: Record<AuxCategory, string[]> = {
  hanging: ['top', 'front'],
  handle: ['front', 'back'],
  displayPanel: ['back', 'front'],
  pourSpout: ['top', 'bottom'],
  embeddedClosure: ['top'],
  reclosable: ['top'],
  tearZipper: ['front', 'back'],
};

function ovalPath(cx: number, cy: number, rx: number, ry: number, segments = 28): Path {
  const pts: Point[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) });
  }
  return pts;
}

function panelBounds(panel: Panel): { x: number; y: number; w: number; h: number } {
  const xs = panel.polygon.map(p => p.x);
  const ys = panel.polygon.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function panelArea(panel: Panel): number {
  const b = panelBounds(panel);
  return b.w * b.h;
}

function pickPanel(panels: Panel[], preferFaces: string[]): Panel | null {
  if (panels.length === 0) return null;
  for (const face of preferFaces) {
    const found = panels.find(p => p.face === face && panelArea(p) > 25);
    if (found) return found;
  }
  return [...panels].sort((a, b) => panelArea(b) - panelArea(a))[0];
}

/**
 * Verilen kategori için gerçek ek geometri üretir ve var olan
 * DielineResult'a (host kutu) bindirir. Host'un bounds'u değişmez.
 */
export function applyAuxiliaryDevice(
  base: DielineResult,
  category: AuxCategory,
  deviceCode: string | number,
): DielineResult {
  if (!base.success) return base;

  const panel = pickPanel(base.panels, PREFER_FACES[category] || ['front']);
  if (!panel) return base;
  const bb = panelBounds(panel);
  const cx = bb.x + bb.w / 2;
  const cy = bb.y + bb.h / 2;

  const extraCut: Path[] = [];
  const extraPerf: Path[] = [];
  const extraCrease: Path[] = [];

  switch (category) {
    case 'hanging': {
      const rx = Math.max(2, Math.min(bb.w * 0.16, 6));
      const ry = Math.max(1.5, Math.min(bb.h * 0.1, 4));
      const holeCy = bb.y + Math.min(bb.h * 0.22, ry + 4);
      extraCut.push(ovalPath(cx, holeCy, rx, ry));
      break;
    }
    case 'handle': {
      const rx = Math.max(6, Math.min(bb.w * 0.22, 20));
      const ry = Math.max(3, Math.min(bb.h * 0.07, 6));
      const holeCy = bb.y + Math.min(bb.h * 0.18, ry + 6);
      extraCut.push(ovalPath(cx, holeCy, rx, ry));
      extraCrease.push(ovalPath(cx, holeCy, rx * 1.35, ry * 1.4));
      break;
    }
    case 'pourSpout': {
      const r = Math.max(4, Math.min(bb.w, bb.h) * 0.12);
      const px = bb.x + bb.w * 0.72;
      const py = bb.y + bb.h * 0.28;
      extraPerf.push(ovalPath(px, py, r, r));
      extraCrease.push([{ x: px - r, y: py }, { x: px + r, y: py }]);
      break;
    }
    case 'embeddedClosure': {
      const r = Math.max(4, Math.min(bb.w, bb.h) * 0.1);
      extraPerf.push(ovalPath(cx, cy, r, r));
      break;
    }
    case 'reclosable': {
      const w = Math.min(bb.w * 0.3, 20);
      const th = Math.min(bb.h * 0.16, 7);
      const sx = cx - w / 2;
      const sy = bb.y + bb.h * 0.58;
      extraCut.push([{ x: sx, y: sy }, { x: sx + w, y: sy }]);
      extraCut.push(polygonPath([
        { x: cx - w * 0.3, y: sy + th }, { x: cx + w * 0.3, y: sy + th }, { x: cx, y: sy + th * 1.7 },
      ]));
      break;
    }
    case 'tearZipper': {
      const ly = bb.y + bb.h * 0.38;
      extraPerf.push([{ x: bb.x + 2, y: ly }, { x: bb.x + bb.w - 2, y: ly }]);
      extraCut.push(polygonPath([
        { x: bb.x, y: ly - 2.5 }, { x: bb.x + 7, y: ly - 2.5 }, { x: bb.x + 7, y: ly + 2.5 }, { x: bb.x, y: ly + 2.5 },
      ]));
      break;
    }
    case 'displayPanel': {
      const ly = bb.y + bb.h * 0.14;
      extraCrease.push([{ x: bb.x + 3, y: ly }, { x: bb.x + bb.w - 3, y: ly }]);
      extraCut.push(polygonPath([{ x: bb.x + 3, y: ly }, { x: bb.x + 9, y: ly - 4 }, { x: bb.x + 9, y: ly }]));
      extraCut.push(polygonPath([{ x: bb.x + bb.w - 9, y: ly }, { x: bb.x + bb.w - 3, y: ly }, { x: bb.x + bb.w - 9, y: ly - 4 }]));
      break;
    }
    default:
      break;
  }

  const asD = (paths: Path[]) => paths.map(p => `      <path d="${pathToD(p)}"/>`).join('\n');
  let svg = base.svg;
  if (extraCut.length) svg = svg.replace('</svg>', `  <g id="DIELINES_CUT_X" fill="none" stroke="#FF0000" stroke-width="0.3">\n${asD(extraCut)}\n  </g>\n</svg>`);
  if (extraPerf.length) svg = svg.replace('</svg>', `  <g id="DIELINES_PERF_X" fill="none" stroke="#FF00FF" stroke-width="0.25" stroke-dasharray="1,1">\n${asD(extraPerf)}\n  </g>\n</svg>`);
  if (extraCrease.length) svg = svg.replace('</svg>', `  <g id="DIELINES_CREASE_X" fill="none" stroke="#0000FF" stroke-width="0.2" stroke-dasharray="3,2">\n${asD(extraCrease)}\n  </g>\n</svg>`);

  return {
    ...base,
    svg,
    paths: {
      cut: [...base.paths.cut, ...extraCut],
      crease: [...base.paths.crease, ...extraCrease],
      glue: base.paths.glue,
      perf: [...base.paths.perf, ...extraPerf],
    },
    warnings: [...base.warnings, `X${deviceCode}: ${DEVICE_NAMES[category]} — host '${base.structureId}' üzerine bindirildi`],
  };
}

export function auxDeviceName(category: AuxCategory): string {
  return DEVICE_NAMES[category];
}
