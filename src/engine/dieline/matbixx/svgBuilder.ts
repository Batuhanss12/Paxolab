/**
 * MatBixx StructureEngine — SVG Builder
 *
 * Tüm structure modülleri tarafından kullanılan ortak SVG builder.
 * Layer'lı SVG üretir (<g id="...">) — dieline-generator standardı.
 *
 * Koordinat: mm
 * Renk: LAYER_COLORS (types.ts)
 */

import type {
  Path,
  Point,
  DielinePaths,
  FoldLine,
  Panel,
} from './types';
import { LAYER_COLORS, SVG_LAYERS } from './types';

// ─── Path → SVG "d" Attribute ───────────────────────────────────

export function pathToD(path: Path): string {
  if (path.length === 0) return '';
  const [first, ...rest] = path;
  let d = `M ${first.x.toFixed(3)} ${first.y.toFixed(3)}`;
  for (const p of rest) {
    d += ` L ${p.x.toFixed(3)} ${p.y.toFixed(3)}`;
  }
  // Kapalı polyline ise Z ekle (ilk = son)
  if (path.length > 2 &&
      path[0].x === path[path.length - 1].x &&
      path[0].y === path[path.length - 1].y) {
    d += ' Z';
  }
  return d;
}

// ─── SVG Builder ────────────────────────────────────────────────

export interface SVGBuilderOptions {
  width: number;           // mm
  height: number;          // mm
  margin?: number;         // mm (default 10)
  showGrid?: boolean;
  gridSize?: number;       // mm (default 10)
  showDimensions?: boolean;
  showRegMarks?: boolean;
}

export class SVGBuilder {
  private paths: DielinePaths = { cut: [], crease: [], glue: [], perf: [] };
  private folds: FoldLine[] = [];
  private panels: Panel[] = [];
  private dimensions: Array<{ from: Point; to: Point; label: string; offset: number }> = [];
  private options: Required<SVGBuilderOptions>;

  constructor(options: SVGBuilderOptions) {
    this.options = {
      margin: 10,
      showGrid: true,
      gridSize: 10,
      showDimensions: true,
      showRegMarks: true,
      ...options,
    };
  }

  // ─── Path Ekleme ──────────────────────────────────────────────

  addCutPath(path: Path): this {
    this.paths.cut.push(path);
    return this;
  }

  addCreasePath(path: Path): this {
    this.paths.crease.push(path);
    return this;
  }

  addGluePath(path: Path): this {
    this.paths.glue.push(path);
    return this;
  }

  addPerfPath(path: Path): this {
    this.paths.perf.push(path);
    return this;
  }

  addFold(fold: FoldLine): this {
    this.folds.push(fold);
    return this;
  }

  addPanel(panel: Panel): this {
    this.panels.push(panel);
    return this;
  }

  addDimension(from: Point, to: Point, label: string, offset: number = 5): this {
    this.dimensions.push({ from, to, label, offset });
    return this;
  }

  // ─── Build ────────────────────────────────────────────────────

  build(): string {
    const { width, height, margin, showGrid, gridSize, showDimensions, showRegMarks } = this.options;
    const totalW = width + margin * 2;
    const totalH = height + margin * 2;

    let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    svg += `<svg xmlns="http://www.w3.org/2000/svg" `;
    svg += `width="100%" height="100%" `;
    svg += `viewBox="0 0 ${totalW} ${totalH}" preserveAspectRatio="xMidYMid meet" version="1.1">\n`;

    // ─── Defs ───────────────────────────────────────────────────
    svg += `  <defs>\n`;
    if (showGrid) {
      svg += `    <pattern id="grid" width="${gridSize}" height="${gridSize}" patternUnits="userSpaceOnUse">\n`;
      svg += `      <path d="M ${gridSize} 0 L 0 0 0 ${gridSize}" fill="none" stroke="#f0f0f0" stroke-width="0.1"/>\n`;
      svg += `    </pattern>\n`;
    }
    svg += `  </defs>\n`;

    // ─── Grid ───────────────────────────────────────────────────
    if (showGrid) {
      svg += `  <rect width="${totalW}" height="${totalH}" fill="url(#grid)"/>\n`;
    }

    // ─── Translate to content origin ────────────────────────────
    svg += `  <g transform="translate(${margin} ${margin})">\n`;

    // ─── ARTWORK (boş, artwork mapping için) ────────────────────
    svg += `    <g id="${SVG_LAYERS.ARTWORK}"></g>\n`;

    // ─── BLEED (opsiyonel, structure eklerse) ───────────────────
    svg += `    <g id="${SVG_LAYERS.BLEED}" fill="none" stroke="${LAYER_COLORS.BLEED}" stroke-width="0.2" stroke-dasharray="2,2"></g>\n`;

    // ─── SAFETY ─────────────────────────────────────────────────
    svg += `    <g id="${SVG_LAYERS.SAFETY}" fill="none" stroke="${LAYER_COLORS.SAFETY}" stroke-width="0.2" stroke-dasharray="5,5"></g>\n`;

    // ─── CUT ────────────────────────────────────────────────────
    svg += `    <g id="${SVG_LAYERS.CUT}" fill="none" stroke="${LAYER_COLORS.CUT}" stroke-width="0.3">\n`;
    for (const p of this.paths.cut) {
      svg += `      <path d="${pathToD(p)}"/>\n`;
    }
    svg += `    </g>\n`;

    // ─── CREASE ─────────────────────────────────────────────────
    svg += `    <g id="${SVG_LAYERS.CREASE}" fill="none" stroke="${LAYER_COLORS.CREASE}" stroke-width="0.2" stroke-dasharray="4,2">\n`;
    for (const p of this.paths.crease) {
      svg += `      <path d="${pathToD(p)}"/>\n`;
    }
    svg += `    </g>\n`;

    // ─── GLUE ───────────────────────────────────────────────────
    svg += `    <g id="${SVG_LAYERS.GLUE}" fill="none" stroke="${LAYER_COLORS.GLUE}" stroke-width="0.2">\n`;
    for (const p of this.paths.glue) {
      svg += `      <path d="${pathToD(p)}"/>\n`;
    }
    svg += `    </g>\n`;

    // ─── PERF ───────────────────────────────────────────────────
    svg += `    <g id="${SVG_LAYERS.PERF}" fill="none" stroke="${LAYER_COLORS.PERF}" stroke-width="0.2" stroke-dasharray="1,1">\n`;
    for (const p of this.paths.perf) {
      svg += `      <path d="${pathToD(p)}"/>\n`;
    }
    svg += `    </g>\n`;

    // ─── ANNOTATIONS (ölçüler) ───────────────────────────────────
    if (showDimensions && this.dimensions.length > 0) {
      svg += `    <g id="${SVG_LAYERS.ANNOTATIONS}" fill="${LAYER_COLORS.DIMENSION}" font-family="Arial, sans-serif" font-size="3">\n`;
      for (const dim of this.dimensions) {
        svg += this.renderDimension(dim);
      }
      svg += `    </g>\n`;
    }

    // ─── REG MARKS ──────────────────────────────────────────────
    if (showRegMarks) {
      svg += `    <g id="${SVG_LAYERS.REG_MARKS}" stroke="#000" stroke-width="0.2">\n`;
      svg += this.renderRegMark(0, 0);
      svg += this.renderRegMark(width, 0);
      svg += this.renderRegMark(0, height);
      svg += this.renderRegMark(width, height);
      svg += `    </g>\n`;
    }

    svg += `  </g>\n`;
    svg += `</svg>`;
    return svg;
  }

  // ─── Helper: Ölçü Çizgisi ─────────────────────────────────────

  private renderDimension(dim: { from: Point; to: Point; label: string; offset: number }): string {
    const { from, to, label, offset } = dim;
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    const isHorizontal = Math.abs(to.x - from.x) > Math.abs(to.y - from.y);
    const textY = isHorizontal ? midY - offset : midY;
    const textX = isHorizontal ? midX : midX + offset + 5;

    let s = `      <line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${LAYER_COLORS.DIMENSION}" stroke-width="0.15"/>\n`;
    s += `      <text x="${textX}" y="${textY}" text-anchor="middle">${label}</text>\n`;
    return s;
  }

  // ─── Helper: Registration Mark ────────────────────────────────

  private renderRegMark(x: number, y: number): string {
    return `      <line x1="${x - 3}" y1="${y}" x2="${x + 3}" y2="${y}"/>\n      <line x1="${x}" y1="${y - 3}" x2="${x}" y2="${y + 3}"/>\n`;
  }

  // ─── Getter ───────────────────────────────────────────────────

  getPaths(): DielinePaths {
    return this.paths;
  }

  getFolds(): FoldLine[] {
    return this.folds;
  }

  getPanels(): Panel[] {
    return this.panels;
  }
}

// ─── Yardımcı Fonksiyonlar ──────────────────────────────────────

export function rect(x: number, y: number, w: number, h: number): Path {
  return [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
    { x, y },
  ];
}

export function linePath(from: Point, to: Point): Path {
  return [from, to];
}

export function translatePath(path: Path, dx: number, dy: number): Path {
  return path.map(p => ({ x: p.x + dx, y: p.y + dy }));
}

export function polygonPath(points: Point[]): Path {
  if (points.length === 0) return [];
  // Kapalı polyline — ilk noktayı sona ekle
  const first = points[0];
  const last = points[points.length - 1];
  if (first.x !== last.x || first.y !== last.y) {
    return [...points, first];
  }
  return points;
}

export function bbox(paths: Path[]): { x: number; y: number; w: number; h: number } {
  const pts = paths.flat();
  if (pts.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
  const xs = pts.map(p => p.x);
  const ys = pts.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
