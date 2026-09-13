/**
 * Forxa StructureEngine — Core Type Definitions
 *
 * Bu dosya tüm structure modülleri tarafından paylaşılır.
 * Mevcut knifeLineEngine ve dieline-generator tipleriyle uyumlu.
 *
 * Koordinat: mm (milimetre) — tek standart
 * SVG: Layer'lı (<g id="...">)
 * Renk: Tek standart (CUT #FF0000, CREASE #0000FF, GLUE #00AA00)
 */

// ─── Temel Geometri ─────────────────────────────────────────────

export interface Point {
  x: number; // mm
  y: number; // mm
}

export type Path = Point[]; // closed polyline (ilk = son nokta)

// ─── Dieline Paths (dieline-generator ile uyumlu) ───────────────

export interface DielinePaths {
  cut: Path[];
  crease: Path[];
  glue: Path[];
  perf: Path[];
}

// ─── Fold Lines (3D için) ───────────────────────────────────────

export interface FoldLine {
  from: Point;
  to: Point;
  angle: number; // katlama açısı (derece) — 90 = tam katlama
  type: 'mountain' | 'valley';
}

// ─── Panel (Artwork Mapping için) ───────────────────────────────

export interface Panel {
  id: string;              // 'front', 'back', 'left', 'right', 'top', 'bottom'
  name: string;            // 'Ön Yüz'
  polygon: Point[];        // panel sınırları (closed)
  face: string;            // 3D'deki yüz adı
  bleedBounds?: { x: number; y: number; w: number; h: number };
  safeArea?: { x: number; y: number; w: number; h: number };
}

// ─── Parametre Tanımı ───────────────────────────────────────────

export interface StructureParameter {
  key: string;             // 'length'
  label: string;           // 'Boy (L)'
  unit: 'mm';
  min: number;
  max: number;
  default: number;
  step?: number;
  required: boolean;
  description?: string;
}

// ─── Variable Model (Die Cut Templates uyumlu) ──────────────────

export type VariableDataType = 'boolean' | 'value' | 'select' | 'material';

export interface VariableAllowedValue {
  value: string | number;
  label?: string;
}

export interface VariableDefaultValue {
  value?: string | number | boolean;
  material_id?: string;
}

export interface VariableOptionGroup {
  label: string;
  materials?: Array<{ id: string; label: string; thickness?: number }>;
}

export interface StructureVariable {
  name: string;                    // 'length', 'cross', 'dimension_texts'
  description?: string;            // 'Boy (L)'
  data_type: VariableDataType;     // 'boolean' | 'value' | 'select' | 'material'
  required: boolean;
  default_value?: VariableDefaultValue;
  allowed_values?: VariableAllowedValue[];
  option_groups?: VariableOptionGroup[];
  custom_value_name?: string;      // 'custom_material_value'
  image?: { url: string };         // değişken görsel önizleme
  unit?: 'mm' | 'in';
}

// ─── Symbol Marker (Corner Registration) ────────────────────────
//
// Die Cut Templates'in "symbol" layer'ı — dieline bbox köşelerinde
// crop region işaretleri. 3D mockup export ve artwork crop için kullanılır.

export interface SymbolMarker {
  x: number;
  y: number;
  type: 'cross' | 'circle' | 'square';
  size: number;           // mm — marker boyutu
}

export interface SymbolMarkerSet {
  markers: SymbolMarker[];
  bounds: { x: number; y: number; w: number; h: number }; // marker bbox = crop region
}

// ─── Structure Metadata ─────────────────────────────────────────

export interface StructureMetadata {
  totalArea: number;       // mm²
  materialUsage: number;   // mm²
  wastePercentage: number; // %
  boundingBox: { width: number; height: number }; // mm
  recommendedMaterial: string;
  complexity: 'simple' | 'medium' | 'complex' | 'expert';
  industryCompliance: string[]; // ['FEFCO-0201', 'ECMA-A60']
}

// ─── Dieline Result ─────────────────────────────────────────────

export interface DielineResult {
  success: boolean;
  structureId: string;
  structureName: string;
  svg: string;              // Layer'lı SVG
  paths: DielinePaths;      // Vektör path'ler
  folds: FoldLine[];        // 3D folding için
  panels: Panel[];          // Artwork mapping için
  bounds: { width: number; height: number }; // mm
  metadata: StructureMetadata;
  warnings: string[];
  errors: string[];
  // ─── Die Cut Templates uyumlu eklemeler ───────────────────────
  symbolMarkers?: SymbolMarkerSet;     // Köşe işaretleri (crop region)
  variables?: StructureVariable[];     // Template değişkenleri
  designSides?: 'both' | 'outside' | 'inside'; // İç/dış tasarım modu
  mirroredSvg?: string;                // Inside (mirror) SVG
  dimensionTexts?: boolean;            // Ölçü etiketleri açık/kapalı
}

// ─── Validation ─────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ─── Packaging Structure Interface ──────────────────────────────

export interface PackagingStructure {
  id: string;               // 'tuck-end-box'
  name: string;             // 'Tuck End Box'
  category: StructureCategory;
  description: string;
  icon: string;             // UI için

  parameters: StructureParameter[];
  generateDieline(params: Record<string, number>): DielineResult;
  validateParameters(params: Record<string, number>): ValidationResult;
  getDefaultParameters(): Record<string, number>;
  // ─── Die Cut Templates uyumlu eklemeler ───────────────────────
  variables?: StructureVariable[];           // Template değişkenleri (boolean/value/select/material)
  supportsInsideDesign?: boolean;            // İç yüz tasarımı destekleniyor mu?
  supports3DMockup?: boolean;                // 3D mockup destekleniyor mu?
  generateMirroredDieline?(params: Record<string, number>): DielineResult; // Inside (mirror) dieline
}

// ─── Kategoriler ────────────────────────────────────────────────

export type StructureCategory = 'box' | 'pouch' | 'label' | 'tube' | 'specialty';

// ─── Standart Renkler (Tek Standard) ────────────────────────────

export const LAYER_COLORS = {
  CUT: '#FF0000',        // kırmızı — kesim
  CREASE: '#0000FF',     // mavi — katlama (kesikli)
  GLUE: '#00AA00',       // yeşil — yapıştırma
  PERF: '#FF00FF',       // magenta — perforasyon
  BLEED: '#FFA500',      // turuncu — taşma
  SAFETY: '#CCCCCC',     // gri — güvenlik
  GUIDE: '#999999',      // gri — rehber
  DIMENSION: '#666666',  // koyu gri — ölçü
} as const;

// ─── SVG Layer ID'leri (dieline-generator ile uyumlu) ───────────

export const SVG_LAYERS = {
  ARTWORK: 'ARTWORK',
  BACKGROUND: 'BACKGROUND',
  TEXT: 'TEXT',
  LOGOS: 'LOGOS',
  CUT: 'DIELINES_CUT',
  CREASE: 'DIELINES_CREASE',
  GLUE: 'DIELINES_GLUE',
  PERF: 'DIELINES_PERF',
  BLEED: 'BLEED',
  SAFETY: 'SAFETY',
  REG_MARKS: 'REG_MARKS',
  ANNOTATIONS: 'ANNOTATIONS',
  // ─── Die Cut Templates uyumlu layer'lar ──────────────────────
  SYMBOL: 'SYMBOL',           // Köşe işaretleri (crop region — 3D mockup için)
  DIMENSIONS: 'DIMENSIONS',   // Ölçü etiketleri (toggle)
  OUTSIDE: 'OUTSIDE',         // İki taraflı tasarım — dış yüz container
  INSIDE: 'INSIDE',           // İki taraflı tasarım — iç yüz container
} as const;

// ─── Birim Dönüşümü ─────────────────────────────────────────────

export const MM_PER_PT = 0.352777778;  // 1pt = 0.353mm
export const PT_PER_MM = 2.834645669;  // 1mm = 2.835pt

export function mmToPt(mm: number): number {
  return mm * PT_PER_MM;
}

export function ptToMm(pt: number): number {
  return pt / PT_PER_MM;
}
