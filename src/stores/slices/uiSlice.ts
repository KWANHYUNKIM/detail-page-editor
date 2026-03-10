import type { EditorMode, ToolType, CanvasElement } from '@/types/editor';

export interface UiSlice {
  selectedElementIds: string[];
  zoom: number;
  mode: EditorMode;
  activeTool: ToolType;
  drawingBrushWidths: { pen: number; brush: number; pencil: number };
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
    setEditingFrameId: (id) => set({ editingFrameId: id }),
    setFocusedSectionId: (id) => set({ focusedSectionId: id }),
    toggleGrid: () => set((s: { showGrid: boolean }) => ({ showGrid: !s.showGrid })),
    setGridSize: (size) => set({ gridSize: Math.max(10, Math.min(200, size)) }),
    scrollToElement: (id) => set({ scrollToElementId: id }),
  };
}
