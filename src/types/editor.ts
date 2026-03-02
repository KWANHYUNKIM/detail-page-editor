export type PresetKey =
  | 'instagram-feed'
  | 'instagram-story'
  | 'instagram-reel'
  | 'blog-naver'
  | 'blog-tistory'
  | 'detail-page'
  | 'custom';

export interface CanvasPreset {
  key: PresetKey;
  label: string;
  width: number;
  height: number;
  description: string;
}

export type EditorMode = 'creator' | 'consumer';
export type ElementType = 'image' | 'text' | 'shape' | 'frame';
export type ShapeType = 'rect' | 'circle' | 'line' | 'arrow';
export type ToolType = 'move' | 'hand' | 'rectangle' | 'circle' | 'line' | 'text' | 'image' | 'frame' | 'section';
export type TextAlign = 'left' | 'center' | 'right';
export type FontWeight = 'normal' | 'bold';
export type FontStyle = 'normal' | 'italic';
export type TextDecoration = 'none' | 'underline' | 'line-through';

// ── Gradient Types ──

export interface GradientStop {
  color: string;
  offset: number; // 0–1
}

export interface LinearGradient {
  type: 'linear';
  angle: number; // degrees (0 = left→right, 90 = top→bottom)
  stops: GradientStop[];
}

export interface RadialGradient {
  type: 'radial';
  /** Center X ratio 0–1 (0.5 = center) */
  cx: number;
  /** Center Y ratio 0–1 (0.5 = center) */
  cy: number;
  /** Radius ratio 0–1 (1 = edge) */
  r: number;
  stops: GradientStop[];
}

export type GradientValue = LinearGradient | RadialGradient;

/**
 * FillValue: solid color string OR gradient object.
 * When serialized, a plain string = solid color for backward compat.
 */
export type FillValue = string | GradientValue;

/** Type guard: is this fill a gradient? */
export function isGradient(fill: FillValue): fill is GradientValue {
  return typeof fill === 'object' && fill !== null && 'type' in fill;
}

/** Convert FillValue to a CSS-compatible background string */
export function fillToCss(fill: FillValue): string {
  if (typeof fill === 'string') return fill;
  const stopsStr = fill.stops
    .slice()
    .sort((a, b) => a.offset - b.offset)
    .map((s) => `${s.color} ${Math.round(s.offset * 100)}%`)
    .join(', ');
  if (fill.type === 'linear') {
    return `linear-gradient(${fill.angle}deg, ${stopsStr})`;
  }
  const rg = fill as RadialGradient;
  const cx = Math.round(rg.cx * 100);
  const cy = Math.round(rg.cy * 100);
  return `radial-gradient(circle at ${cx}% ${cy}%, ${stopsStr})`;
}


export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  /** 크리에이터가 지정 — 소비자 모드에서 이 요소만 편집 허용 */
  editable: boolean;
  /** 소비자에게 보여줄 안내 (예: "상품 사진을 넣어주세요") */
  placeholder?: string;
  /** 소비자가 수정 가능한 속성 키 목록 (예: ['src', 'content']) */
  editableProps?: string[];
  /** 부모 프레임 ID (중첩 시) */
  parentId?: string;
}

export type ImageScaleMode = 'fill' | 'fit' | 'crop' | 'tile';

export interface ImageFilters {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  temperature: number;
  tint: number;
  highlights: number;
  shadows: number;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  originalName?: string;
  scaleMode: ImageScaleMode;
  crop: { x: number; y: number; w: number; h: number } | null;
  filters: ImageFilters;
  filterPreset: string | null;
  /** 이미지 위에 그라데이션 오버레이 */
  gradientOverlay?: {
    enabled: boolean;
    gradient: FillValue;
    opacity: number;
  };
}

export interface TextShadow {
  enabled: boolean;
  color: string;
  offsetX: number;
  offsetY: number;
  blur: number;
}

export interface TextStroke {
  enabled: boolean;
  color: string;
  width: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: FontWeight;
  fontStyle: FontStyle;
  color: FillValue;
  textAlign: TextAlign;
  lineHeight: number;
  letterSpacing: number;
  textDecoration: TextDecoration;
  textShadow: TextShadow;
  textStroke: TextStroke;
  textBackground: string;
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shape: ShapeType;
  fill: FillValue;
  stroke: string;
  strokeWidth: number;
  borderRadius: number;
}

export interface FrameElement extends BaseElement {
  type: 'frame';
  /** 프레임 배경색 */
  fill: FillValue;
  stroke: string;
  strokeWidth: number;
  borderRadius: number;
  /** 콘텐츠 클리핑 여부 */
  clipContent: boolean;
  /** 자식 요소 z-order (bottom → top) */
  childOrder: string[];
  /** 섹션 여부 — true이면 캔버스 전체 너비 섹션으로 동작 */
  isSection?: boolean;
}

export type CanvasElement = ImageElement | TextElement | ShapeElement | FrameElement;

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0–1
  elementIds: string[]; // z-order within this layer (bottom → top)
}

export interface Page {
  id: string;
  name: string;
  elements: CanvasElement[];
  layers: Layer[];
  /** Derived flat z-order from layers. Kept for backward compat. */
  layerOrder: string[];
}

export interface Project {
  id: string;
  name: string;
  mode: EditorMode;
  isTemplate: boolean;
  templateId?: string;
  preset: PresetKey;
  canvas: {
    width: number;
    height: number;
    backgroundColor: FillValue;
  };
  pages: Page[];
  createdAt: string;
  updatedAt: string;
}

export interface AIDesignRequest {
  canvasSize: { width: number; height: number };
  currentElements: CanvasElement[];
  uploadedImages: { name: string; src: string }[];
  userPrompt: string;
  style?: string;
}

export interface AIDesignResponse {
  elements: CanvasElement[];
  backgroundColor?: string;
  colorPalette?: string[];
  suggestions?: string[];
}

export type ExportFormat = 'png' | 'jpeg';

export interface ExportOptions {
  format: ExportFormat;
  quality: number;
  multiplier: number;
}

export type TemplateCategory =
  | 'all'
  | 'fashion'
  | 'beauty'
  | 'food'
  | 'electronics'
  | 'interior'
  | 'health'
  | 'kids'
  | 'promotion';

export interface BuiltInTemplate {
  id: string;
  name: string;
  category: TemplateCategory[];
  description: string;
  preset: PresetKey;
  thumbnailImage?: string;
  thumbnail: {
    background: string;
    accent: string;
    previewText?: string;
  };
  elements: CanvasElement[];
  backgroundColor?: string;
  tags: string[];
}
