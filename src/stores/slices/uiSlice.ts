import type { EditorMode, ToolType, CanvasElement } from '@/types/editor';

export interface CanvasExtent {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface UiSlice {
  selectedElementIds: string[];
  zoom: number;
  mode: EditorMode;
  activeTool: ToolType;
  drawingBrushWidths: { pen: number; brush: number; pencil: number };
  canvasExtent: CanvasExtent;
  showGrid: boolean;
  gridSize: number;
  aiEnabled: boolean;
  editingFrameId: string | null;
  focusedSectionId: string | null;
  clipboardElements: CanvasElement[];
  styleClipboard: Record<string, unknown> | null;
  scrollToElementId: string | null;

  setMode: (mode: EditorMode) => void;
  setZoom: (zoom: number) => void;
  selectElements: (ids: string[]) => void;
  clearSelection: () => void;
  setActiveTool: (tool: ToolType) => void;
  setDrawingBrushWidth: (tool: 'pen' | 'brush' | 'pencil', width: number) => void;
  setCanvasExtent: (extent: Partial<CanvasExtent>) => void;
  expandCanvasToFitElements: () => void;
  setEditingFrameId: (id: string | null) => void;
  setFocusedSectionId: (id: string | null) => void;
  toggleGrid: () => void;
  setGridSize: (size: number) => void;
  scrollToElement: (id: string | null) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createUiSlice(set: (fn: any) => void, get: () => any): UiSlice {
  return {
    // ── Initial state ──
    selectedElementIds: [],
    zoom: 1,
    mode: 'design',
    activeTool: 'move',
    drawingBrushWidths: { pen: 2, brush: 8, pencil: 4 },
    canvasExtent: { top: 1000, right: 1000, bottom: 1000, left: 1000 },
    showGrid: false,
    gridSize: 50,
    aiEnabled: false,
    editingFrameId: null,
    focusedSectionId: null,
    clipboardElements: [],
    styleClipboard: null,
    scrollToElementId: null,

    // ── Actions ──
    setMode: (mode) => {
      set({ mode });
      if (get().project) {
        set((s: { project: { mode: EditorMode } | null }) => ({
          project: s.project ? { ...s.project, mode } : null,
        }));
      }
    },
    setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),
    selectElements: (ids) => set({ selectedElementIds: ids }),
    clearSelection: () => set({ selectedElementIds: [] }),
    setActiveTool: (tool) => set({ activeTool: tool }),
    setDrawingBrushWidth: (tool, width) => {
      const safeWidth = Math.max(1, Math.min(64, width));
      set((s: UiSlice) => ({
        drawingBrushWidths: {
          ...s.drawingBrushWidths,
          [tool]: safeWidth,
        },
      }));
    },
    setCanvasExtent: (extent) => {
      set((s: UiSlice) => ({
        canvasExtent: {
          top: Math.max(500, extent.top ?? s.canvasExtent.top),
          right: Math.max(500, extent.right ?? s.canvasExtent.right),
          bottom: Math.max(500, extent.bottom ?? s.canvasExtent.bottom),
          left: Math.max(500, extent.left ?? s.canvasExtent.left),
        },
      }));
    },
    expandCanvasToFitElements: () => {
      const state = get();
      const project = state.project;
      if (!project) return;
      const page = state.getCurrentPage();
      if (!page || page.elements.length === 0) return;

      const THRESHOLD = 300;
      const EXPAND_BY = 1000;
      const pageW = project.canvas.width;
      const pageH = project.canvas.height;
      const extent: CanvasExtent = { ...state.canvasExtent };

      let minX = 0;
      let minY = 0;
      let maxX = pageW;
      let maxY = pageH;

      for (const el of page.elements) {
        if (el.x < minX) minX = el.x;
        if (el.y < minY) minY = el.y;
        if (el.x + el.width > maxX) maxX = el.x + el.width;
        if (el.y + el.height > maxY) maxY = el.y + el.height;
      }

      let changed = false;

      if (-minX > extent.left - THRESHOLD) {
        extent.left = -minX + EXPAND_BY;
        changed = true;
      }
      if (-minY > extent.top - THRESHOLD) {
        extent.top = -minY + EXPAND_BY;
        changed = true;
      }
      if (maxX - pageW > extent.right - THRESHOLD) {
        extent.right = maxX - pageW + EXPAND_BY;
        changed = true;
      }
      if (maxY - pageH > extent.bottom - THRESHOLD) {
        extent.bottom = maxY - pageH + EXPAND_BY;
        changed = true;
      }

      if (changed) {
        set({ canvasExtent: extent });
      }
    },
    setEditingFrameId: (id) => set({ editingFrameId: id }),
    setFocusedSectionId: (id) => set({ focusedSectionId: id }),
    toggleGrid: () => set((s: { showGrid: boolean }) => ({ showGrid: !s.showGrid })),
    setGridSize: (size) => set({ gridSize: Math.max(10, Math.min(200, size)) }),
    scrollToElement: (id) => set({ scrollToElementId: id }),
  };
}
