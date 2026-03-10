export type PresetKey =
  | 'instagram-feed'
  | 'instagram-story'
  | 'instagram-reel'
  | 'blog-naver'
  | 'blog-tistory'
  | 'detail-page'
  | 'figma-slide'
  | 'custom';

export interface CanvasPreset {
  key: PresetKey;
  label: string;
  width: number;
  height: number;
  description: string;
}

export type EditorMode = 'draw' | 'design' | 'dev';
export type ElementType = 'image' | 'text' | 'shape' | 'frame';
export type ShapeType = 'rect' | 'circle' | 'line' | 'arrow' | 'path' | 'polygon' | 'star' | 'triangle';
export type ToolType = 'move' | 'hand' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'polygon' | 'star' | 'pen' | 'brush' | 'pencil' | 'text' | 'image' | 'frame' | 'section';
export type TextAlign = 'left' | 'center' | 'right';
export type FontWeight = 'normal' | 'bold';
export type FontStyle = 'normal' | 'italic';
export type TextDecoration = 'none' | 'underline' | 'line-through';

export interface DropShadow {
  enabled: boolean;
  color: string;
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
}

export interface InnerShadow {
  enabled: boolean;
  color: string;
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
}

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
  flipX?: boolean;
  flipY?: boolean;
  opacity: number;
  locked: boolean;
  visible: boolean;
  dropShadow?: DropShadow;
  innerShadow?: InnerShadow;
  layerBlur?: number;
  blendMode?: string;
  backgroundBlur?: number;
  /** 크리에이터가 지정 — 소비자 모드에서 이 요소만 편집 허용 */
  editable: boolean;
  /** 소비자에게 보여줄 안내 (예: "상품 사진을 넣어주세요") */
  placeholder?: string;
  /** 소비자가 수정 가능한 속성 키 목록 (예: ['src', 'content']) */
  editableProps?: string[];
  /** 부모 프레임 ID (중첩 시) */
  parentId?: string;
  /** 사용자 지정 레이어 이름 */
  name?: string;
  /** Individual corner radius */
  borderRadiusTopLeft?: number;
  borderRadiusTopRight?: number;
  borderRadiusBottomLeft?: number;
  borderRadiusBottomRight?: number;
  /** Stroke advanced */
  strokeAlign?: 'inside' | 'center' | 'outside';
  strokeDashArray?: number[];
  /** Export settings */
  exportSettings?: ExportSetting[];
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
  pathData?: string;
  brushWidth?: number;
  borderRadius: number;
}

export interface FrameElement extends BaseElement {
  type: 'frame';
  fill: FillValue;
  fills?: FillItem[];
  stroke: string;
  strokeWidth: number;
  strokes?: StrokeItem[];
  strokePosition?: StrokePosition;
  strokeJoin?: StrokeJoin;
  strokeEndCap?: StrokeEndCap;
  borderRadius: number;
  individualCorners?: IndividualCorners;
  individualStrokes?: IndividualStrokes;
  clipContent: boolean;
  childOrder: string[];
  isSection?: boolean;
  effects?: EffectItem[];
  exportSettings?: ExportSetting[];
  showFillInExports?: boolean;
  /** Auto Layout */
  layoutMode?: 'NONE' | 'VERTICAL' | 'HORIZONTAL' | 'GRID';
  layoutGap?: number;
  layoutPaddingTop?: number;
  layoutPaddingRight?: number;
  layoutPaddingBottom?: number;
  layoutPaddingLeft?: number;
  layoutAlignItems?: 'start' | 'center' | 'end' | 'stretch';
  layoutJustifyContent?: 'start' | 'center' | 'end' | 'space-between';
  layoutGridColumns?: number;
  layoutWrap?: boolean;
  /** Layout guides */
  layoutGuides?: LayoutGuide[];
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
  isPublic?: boolean;
  forkedFromId?: string;
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

export type ExportFormat = 'png' | 'jpeg' | 'svg' | 'pdf';

export type StrokePosition = 'inside' | 'center' | 'outside';
export type StrokeJoin = 'miter' | 'bevel' | 'round';
export type StrokeEndCap = 'none' | 'square' | 'round';

export interface IndividualCorners {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
}

export interface IndividualStrokes {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface FillItem {
  id: string;
  color: FillValue;
  opacity: number;
  visible: boolean;
}

export interface StrokeItem {
  id: string;
  color: string;
  width: number;
  opacity: number;
  visible: boolean;
  position: StrokePosition;
  join: StrokeJoin;
  endCap: StrokeEndCap;
}

export interface EffectItem {
  id: string;
  type: 'drop-shadow' | 'inner-shadow' | 'layer-blur' | 'background-blur';
  visible: boolean;
  color?: string;
  offsetX?: number;
  offsetY?: number;
  blur?: number;
  spread?: number;
}

export interface ExportSetting {
  id?: string;
  scale: string;
  format: ExportFormat;
  suffix?: string;
}

export interface LayoutGuide {
  id?: string;
  type: 'grid' | 'columns' | 'rows';
  count: number;
  gutterSize: number;
  margin: number;
  size?: number;
  color: string;
  visible: boolean;
}

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
