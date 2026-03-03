import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import {
  CanvasElement,
  EditorMode,
  ImageElement,
  TextElement,
  ShapeElement,
  FrameElement,
  PresetKey,
  Page,
  Layer,
  Project,
  ShapeType,
  ToolType,
  FillValue,
} from '@/types/editor';
import { CANVAS_PRESETS, DEFAULT_BACKGROUND_COLOR } from '@/constants/presets';
import { DEFAULT_FONT, DEFAULT_FONT_SIZE, DEFAULT_TEXT_COLOR } from '@/constants/fonts';

// ━━━ Helpers ━━━

/** Derive flat layerOrder from layers (bottom → top, each layer's elements in order) */
function deriveLayerOrder(layers: Layer[]): string[] {
  return layers.flatMap((l) => l.elementIds);
}

/** Create a default layer */
function createDefaultLayer(name = '레이어 1'): Layer {
  return {
    id: uuid(),
    name,
    visible: true,
    locked: false,
    opacity: 1,
    elementIds: [],
  };
}

/** Create a default page with one layer */
function createDefaultPage(name = '페이지 1'): Page {
  const layer = createDefaultLayer();
  return { id: uuid(), name, elements: [], layers: [layer], layerOrder: [] };
}

/** Migrate a page that doesn't have layers (backward compat) */
function migratePageLayers(page: Page): Page {
  if (page.layers && page.layers.length > 0) return page;
  const layer: Layer = {
    id: uuid(),
    name: '레이어 1',
    visible: true,
    locked: false,
    opacity: 1,
    elementIds: [...(page.layerOrder ?? [])],
  };
  return { ...page, layers: [layer], layerOrder: page.layerOrder ?? [] };
}

/** Find which layer contains an element */
function findElementLayerIndex(layers: Layer[], elementId: string): number {
  return layers.findIndex((l) => l.elementIds.includes(elementId));
}

/** Add element to a specific layer and recompute layerOrder */
function addElementToLayer(page: Page, layerId: string, elementId: string): Page {
  const layers = page.layers.map((l) =>
    l.id === layerId ? { ...l, elementIds: [...l.elementIds, elementId] } : l
  );
  return { ...page, layers, layerOrder: deriveLayerOrder(layers) };
}

/** Remove element IDs from all layers and recompute layerOrder */
function removeElementsFromLayers(page: Page, ids: Set<string>): Page {
  const layers = page.layers.map((l) => ({
    ...l,
    elementIds: l.elementIds.filter((eid) => !ids.has(eid)),
  }));
  return { ...page, layers, layerOrder: deriveLayerOrder(layers) };
}

// ━━━ State Interface ━━━

interface EditorState {
  project: Project | null;
  currentPageIndex: number;
  selectedElementIds: string[];
  zoom: number;
  mode: EditorMode;
  clipboardElements: CanvasElement[];
  styleClipboard: Record<string, unknown> | null;
  showGrid: boolean;
  gridSize: number;
  aiEnabled: boolean;
  activeTool: ToolType;
  activeLayerId: string | null;
  editingFrameId: string | null;
  /** 현재 포커스된 섹션 ID (null이면 전체 보기) */
  focusedSectionId: string | null;

  initProject: (name: string, preset: PresetKey, mode?: EditorMode, templateData?: { elements: CanvasElement[]; backgroundColor?: string }) => void;
  loadProject: (project: Project) => void;
  setMode: (mode: EditorMode) => void;
  setZoom: (zoom: number) => void;
  selectElements: (ids: string[]) => void;
  clearSelection: () => void;
  setActiveTool: (tool: ToolType) => void;
  setEditingFrameId: (id: string | null) => void;
  setFocusedSectionId: (id: string | null) => void;

  addImageElement: (src: string, name?: string) => string;
  addTextElement: (content?: string) => string;
  addShapeElement: (shape: ShapeType) => string;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  removeElements: (ids: string[]) => void;
  duplicateElements: (ids: string[], offset?: { x: number; y: number }) => void;
  copyElements: () => void;
  cutElements: () => void;
  pasteElements: () => void;
  copyStyle: () => void;
  pasteStyle: () => void;

  // Frame / grouping
  addFrameElement: (x?: number, y?: number) => string;
  addSectionElement: (y?: number) => string;
  groupElements: (ids: string[]) => string | null;
  ungroupElements: (frameId: string) => void;
  moveToFrame: (elementIds: string[], frameId: string) => void;
  moveOutOfFrame: (elementIds: string[]) => void;
  getChildElements: (frameId: string) => CanvasElement[];
  getFlatRenderOrder: () => string[];

  // Element z-ordering within layer
  moveLayerUp: (id: string) => void;
  moveLayerDown: (id: string) => void;
  moveLayerToTop: (id: string) => void;
  moveLayerToBottom: (id: string) => void;

  // Alignment & distribution
  alignElements: (ids: string[], direction: 'left' | 'right' | 'centerH' | 'top' | 'bottom' | 'centerV') => void;
  distributeElements: (ids: string[], axis: 'horizontal' | 'vertical') => void;
  nudgeElements: (ids: string[], dx: number, dy: number) => void;

  toggleElementEditable: (id: string) => void;
  setElementPlaceholder: (id: string, placeholder: string) => void;

  setCanvasBackground: (color: FillValue) => void;
  setCanvasSize: (width: number, height: number) => void;
  toggleGrid: () => void;
  setGridSize: (size: number) => void;

  // Page management
  addPage: (name?: string) => void;
  deletePage: (pageId: string) => void;
  renamePage: (pageId: string, name: string) => void;
  setCurrentPageIndex: (index: number) => void;

  // Layer management
  addLayer: (name?: string) => string;
  removeLayer: (layerId: string) => void;
  renameLayer: (layerId: string, name: string) => void;
  toggleLayerVisibility: (layerId: string) => void;
  toggleLayerLock: (layerId: string) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  moveLayerGroupUp: (layerId: string) => void;
  moveLayerGroupDown: (layerId: string) => void;
  moveElementToLayer: (elementId: string, targetLayerId: string) => void;
  setActiveLayerId: (layerId: string) => void;
  getActiveLayer: () => Layer | null;

  getCurrentPage: () => Page | null;
  getElement: (id: string) => CanvasElement | undefined;
  getSelectedElements: () => CanvasElement[];
}

// ━━━ Store ━━━

export const useEditorStore = create<EditorState>((set, get) => ({
  project: null,
  currentPageIndex: 0,
  selectedElementIds: [],
  zoom: 1,
  mode: 'creator',
  clipboardElements: [],
  aiEnabled: false,
  activeTool: 'move',
  activeLayerId: null,
  editingFrameId: null,
  focusedSectionId: null,
  styleClipboard: null,
  showGrid: false,
  gridSize: 50,
  initProject: (name, preset, mode = 'creator', templateData) => {
    const presetConfig = CANVAS_PRESETS.find((p) => p.key === preset) ?? CANVAS_PRESETS[0];

    let page: Page;
    if (templateData?.elements && templateData.elements.length > 0) {
      const idMap = new Map<string, string>();
      const newElements = templateData.elements.map((el) => {
        const newId = uuid();
        idMap.set(el.id, newId);
        return { ...el, id: newId } as CanvasElement;
      });
      const elementIds = templateData.elements.map((el) => idMap.get(el.id)!);
      const layer = createDefaultLayer();
      layer.elementIds = elementIds;
      page = {
        id: uuid(),
        name: '페이지 1',
        elements: newElements,
        layers: [layer],
        layerOrder: elementIds,
      };
    } else {
      page = createDefaultPage();
    }

    const project: Project = {
      id: uuid(),
      name,
      mode,
      isTemplate: false,
      preset,
      canvas: {
        width: presetConfig.width,
        height: (() => {
          if (templateData?.elements && templateData.elements.length > 0) {
            const maxY = Math.max(...templateData.elements.map((el) => el.y + el.height));
            return Math.max(presetConfig.height, maxY + 100);
          }
          return presetConfig.height;
        })(),
        backgroundColor: templateData?.backgroundColor ?? DEFAULT_BACKGROUND_COLOR,
      },
      pages: [page],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set({
      project,
      currentPageIndex: 0,
      selectedElementIds: [],
      mode,
      activeLayerId: page.layers[0]?.id ?? null,
    });
  },

  loadProject: (project) => {
    // Migrate pages that don't have layers
    const migratedPages = project.pages.map(migratePageLayers);
    const migratedProject = { ...project, pages: migratedPages };
    const firstPage = migratedPages[0];
    set({
      project: migratedProject,
      currentPageIndex: 0,
      selectedElementIds: [],
      mode: project.mode,
      activeLayerId: firstPage?.layers[0]?.id ?? null,
    });
  },

  setMode: (mode) => {
    set({ mode });
    if (get().project) {
      set((s) => ({
        project: s.project ? { ...s.project, mode } : null,
      }));
    }
  },

  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),

  selectElements: (ids) => set({ selectedElementIds: ids }),
  clearSelection: () => set({ selectedElementIds: [] }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setEditingFrameId: (id) => set({ editingFrameId: id }),
  setFocusedSectionId: (id) => set({ focusedSectionId: id }),

  // ━━━ Element Add Methods (add to active layer) ━━━

  addImageElement: (src, name) => {
    const id = uuid();
    const element: ImageElement = {
      id,
      type: 'image',
      x: 100,
      y: 100,
      width: 300,
      height: 300,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      editable: false,
      src,
      originalName: name,
      scaleMode: 'fill',
      crop: null,
      filters: { brightness: 0, contrast: 0, saturation: 0, blur: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0 },
      filterPreset: null,
    };
    set((s) => {
      if (!s.project) return s;
      const pages = [...s.project.pages];
      let page = { ...pages[s.currentPageIndex] };
      page.elements = [...page.elements, element];
      const targetLayerId = s.activeLayerId ?? page.layers[page.layers.length - 1]?.id;
      if (targetLayerId) {
        page = addElementToLayer(page, targetLayerId, id);
      }
      pages[s.currentPageIndex] = page;
      return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
    });
    return id;
  },

  addTextElement: (content = '텍스트를 입력하세요') => {
    const id = uuid();
    const element: TextElement = {
      id,
      type: 'text',
      x: 100,
      y: 100,
      width: 200,
      height: 40,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      editable: false,
      content,
      fontFamily: DEFAULT_FONT,
      fontSize: DEFAULT_FONT_SIZE,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: DEFAULT_TEXT_COLOR,
      textAlign: 'left',
      lineHeight: 1.4,
      letterSpacing: 0,
      textDecoration: 'none',
      textShadow: {
        enabled: false,
        color: 'rgba(0,0,0,0.5)',
        offsetX: 2,
        offsetY: 2,
        blur: 4,
      },
      textStroke: {
        enabled: false,
        color: '#000000',
        width: 1,
      },
      textBackground: '',
    };
    set((s) => {
      if (!s.project) return s;
      const pages = [...s.project.pages];
      let page = { ...pages[s.currentPageIndex] };
      page.elements = [...page.elements, element];
      const targetLayerId = s.activeLayerId ?? page.layers[page.layers.length - 1]?.id;
      if (targetLayerId) {
        page = addElementToLayer(page, targetLayerId, id);
      }
      pages[s.currentPageIndex] = page;
      return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
    });
    return id;
  },

  addShapeElement: (shape) => {
    const id = uuid();
    const element: ShapeElement = {
      id,
      type: 'shape',
      x: 100,
      y: 100,
      width: shape === 'line' ? 200 : 150,
      height: shape === 'line' ? 4 : 150,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      editable: false,
      shape,
      fill: shape === 'line' ? 'transparent' : '#e2e8f0',
      stroke: '#94a3b8',
      strokeWidth: shape === 'line' ? 2 : 0,
      borderRadius: shape === 'circle' ? 9999 : 0,
    };
    set((s) => {
      if (!s.project) return s;
      const pages = [...s.project.pages];
      let page = { ...pages[s.currentPageIndex] };
      page.elements = [...page.elements, element];
      const targetLayerId = s.activeLayerId ?? page.layers[page.layers.length - 1]?.id;
      if (targetLayerId) {
        page = addElementToLayer(page, targetLayerId, id);
      }
      pages[s.currentPageIndex] = page;
      return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
    });
    return id;
  },

  updateElement: (id, updates) => {
    set((s) => {
      if (!s.project) return s;
      const pages = [...s.project.pages];
      const page = { ...pages[s.currentPageIndex] };
      page.elements = page.elements.map((el) =>
        el.id === id ? ({ ...el, ...updates } as CanvasElement) : el
      );
      pages[s.currentPageIndex] = page;
      return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
    });
  },

  removeElements: (ids) => {
    set((s) => {
      if (!s.project) return s;
      const pages = [...s.project.pages];
      let page = { ...pages[s.currentPageIndex] };

      // Collect all IDs to remove (including children of frames)
      const allIds = new Set<string>(ids);
      const collectChildren = (parentIds: string[]) => {
        for (const pid of parentIds) {
          const el = page.elements.find((e) => e.id === pid);
          if (el && el.type === 'frame') {
            const frame = el as FrameElement;
            for (const childId of frame.childOrder) {
              allIds.add(childId);
            }
            collectChildren(frame.childOrder);
          }
        }
      };
      collectChildren(ids);

      // Also remove IDs from any parent frame's childOrder
      const updatedElements = page.elements
        .filter((el) => !allIds.has(el.id))
        .map((el) => {
          if (el.type === 'frame') {
            const frame = el as FrameElement;
            const newChildOrder = frame.childOrder.filter((cid) => !allIds.has(cid));
            if (newChildOrder.length !== frame.childOrder.length) {
              return { ...frame, childOrder: newChildOrder } as CanvasElement;
            }
          }
          return el;
        });

      page.elements = updatedElements;
      page = removeElementsFromLayers(page, allIds);
      pages[s.currentPageIndex] = page;
      return {
        project: { ...s.project, pages, updatedAt: new Date().toISOString() },
        selectedElementIds: [],
      };
    });
  },

  duplicateElements: (ids, offset) => {
    const state = get();
    if (!state.project) return;
    const page = state.project.pages[state.currentPageIndex];
    const toDuplicate = page.elements.filter((el) => ids.includes(el.id));
    const newIds: string[] = [];
    toDuplicate.forEach((el) => {
      const newId = uuid();
      newIds.push(newId);
      const ox = offset?.x ?? 20;
      const oy = offset?.y ?? 20;
      const clone = { ...el, id: newId, x: el.x + ox, y: el.y + oy };
      // Find which layer the original is in and add clone there
      const layerIdx = findElementLayerIndex(page.layers, el.id);
      const targetLayerId = layerIdx >= 0 ? page.layers[layerIdx].id : (state.activeLayerId ?? page.layers[page.layers.length - 1]?.id);
      set((s) => {
        if (!s.project) return s;
        const pages = [...s.project.pages];
        let pg = { ...pages[s.currentPageIndex] };
        pg.elements = [...pg.elements, clone as CanvasElement];
        if (targetLayerId) {
          pg = addElementToLayer(pg, targetLayerId, newId);
        }
        pages[s.currentPageIndex] = pg;
        return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
      });
    });
    set({ selectedElementIds: newIds });
  },

  copyElements: () => {
    const selected = get().getSelectedElements();
    if (selected.length > 0) {
      set({ clipboardElements: JSON.parse(JSON.stringify(selected)) });
    }
  },

  cutElements: () => {
    const selected = get().getSelectedElements();
    if (selected.length > 0) {
      set({ clipboardElements: JSON.parse(JSON.stringify(selected)) });
      get().removeElements(selected.map((el) => el.id));
    }
  },

  pasteElements: () => {
    const state = get();
    if (!state.project || state.clipboardElements.length === 0) return;

    const newElements: CanvasElement[] = state.clipboardElements.map((el) => {
      const newId = uuid();
      return { ...JSON.parse(JSON.stringify(el)), id: newId, x: el.x + 20, y: el.y + 20 } as CanvasElement;
    });
    const newIds = newElements.map((el) => el.id);

    set((s) => {
      if (!s.project) return s;
      const pages = [...s.project.pages];
      let pg = { ...pages[s.currentPageIndex] };

      pg.elements = [...pg.elements, ...newElements];

      const targetLayerId = s.activeLayerId ?? pg.layers[pg.layers.length - 1]?.id;
      if (targetLayerId) {
        for (const nid of newIds) {
          pg = addElementToLayer(pg, targetLayerId, nid);
        }
      }

      pages[s.currentPageIndex] = pg;
      return {
        project: { ...s.project, pages, updatedAt: new Date().toISOString() },
        selectedElementIds: newIds,
      };
    });
  },

  copyStyle: () => {
    const selected = get().getSelectedElements();
    if (selected.length !== 1) return;
    const el = selected[0];
    // Extract style properties (exclude position, size, content, id, type)
    const { id, type, x, y, width, height, rotation, locked, visible, editable, placeholder, editableProps, parentId, ...style } = el;
    // For text, also exclude content
    if ('content' in style) delete (style as Record<string, unknown>).content;
    if ('src' in style) delete (style as Record<string, unknown>).src;
    if ('originalName' in style) delete (style as Record<string, unknown>).originalName;
    if ('childOrder' in style) delete (style as Record<string, unknown>).childOrder;
    if ('isSection' in style) delete (style as Record<string, unknown>).isSection;
    set({ styleClipboard: JSON.parse(JSON.stringify(style)) });
  },

  pasteStyle: () => {
    const state = get();
    if (!state.styleClipboard) return;
    const selected = state.getSelectedElements();
    if (selected.length === 0) return;
    const style = state.styleClipboard;
    // Apply compatible style props (skip type-specific ones that don't match)
    for (const el of selected) {
      const applicable: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(style)) {
        // Skip type-specific properties if element type doesn't match
        if (['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'textAlign', 'lineHeight', 'letterSpacing', 'textDecoration', 'textShadow', 'textStroke', 'textBackground'].includes(key) && el.type !== 'text') continue;
        if (['shape', 'borderRadius'].includes(key) && el.type !== 'shape' && el.type !== 'frame') continue;
        if (['scaleMode', 'crop', 'filters', 'filterPreset', 'gradientOverlay'].includes(key) && el.type !== 'image') continue;
        if (['clipContent'].includes(key) && el.type !== 'frame') continue;
        applicable[key] = value;
      }
      state.updateElement(el.id, applicable as Partial<CanvasElement>);
    }
  },

  // ━━━ Element z-ordering within layer ━━━

  moveLayerUp: (id) => {
    set((s) => {
      if (!s.project) return s;
      const pages = [...s.project.pages];
      const page = { ...pages[s.currentPageIndex] };
      const layerIdx = findElementLayerIndex(page.layers, id);
      if (layerIdx < 0) return s;
      const layers = page.layers.map((l, i) => {
        if (i !== layerIdx) return l;
        const order = [...l.elementIds];
        const idx = order.indexOf(id);
        if (idx < order.length - 1) {
          [order[idx], order[idx + 1]] = [order[idx + 1], order[idx]];
        }
        return { ...l, elementIds: order };
      });
      page.layers = layers;
      page.layerOrder = deriveLayerOrder(layers);
      pages[s.currentPageIndex] = page;
      return { project: { ...s.project, pages } };
    });
  },

  moveLayerDown: (id) => {
    set((s) => {
      if (!s.project) return s;
      const pages = [...s.project.pages];
      const page = { ...pages[s.currentPageIndex] };
      const layerIdx = findElementLayerIndex(page.layers, id);
      if (layerIdx < 0) return s;
      const layers = page.layers.map((l, i) => {
        if (i !== layerIdx) return l;
        const order = [...l.elementIds];
        const idx = order.indexOf(id);
        if (idx > 0) {
          [order[idx], order[idx - 1]] = [order[idx - 1], order[idx]];
        }
        return { ...l, elementIds: order };
      });
      page.layers = layers;
      page.layerOrder = deriveLayerOrder(layers);
      pages[s.currentPageIndex] = page;
      return { project: { ...s.project, pages } };
    });
  },

  moveLayerToTop: (id) => {
    set((s) => {
      if (!s.project) return s;
      const pages = [...s.project.pages];
      const page = { ...pages[s.currentPageIndex] };
      const layerIdx = findElementLayerIndex(page.layers, id);
      if (layerIdx < 0) return s;
      const layers = page.layers.map((l, i) => {
        if (i !== layerIdx) return l;
        return { ...l, elementIds: [...l.elementIds.filter((eid) => eid !== id), id] };
      });
      page.layers = layers;
      page.layerOrder = deriveLayerOrder(layers);
      pages[s.currentPageIndex] = page;
      return { project: { ...s.project, pages } };
    });
  },

  moveLayerToBottom: (id) => {
    set((s) => {
      if (!s.project) return s;
      const pages = [...s.project.pages];
      const page = { ...pages[s.currentPageIndex] };
      const layerIdx = findElementLayerIndex(page.layers, id);
      if (layerIdx < 0) return s;
      const layers = page.layers.map((l, i) => {
        if (i !== layerIdx) return l;
        return { ...l, elementIds: [id, ...l.elementIds.filter((eid) => eid !== id)] };
      });
      page.layers = layers;
      page.layerOrder = deriveLayerOrder(layers);
      pages[s.currentPageIndex] = page;
      return { project: { ...s.project, pages } };
    });
  },

  toggleElementEditable: (id) => {
    const el = get().getElement(id);
    if (el) {
      get().updateElement(id, { editable: !el.editable });
    }
  },

  setElementPlaceholder: (id, placeholder) => {
    get().updateElement(id, { placeholder });
  },

  setCanvasBackground: (color) => {
    set((s) => {
      if (!s.project) return s;
      return {
        project: {
          ...s.project,
          canvas: { ...s.project.canvas, backgroundColor: color },
          updatedAt: new Date().toISOString(),
        },
      };
    });
  },

  setCanvasSize: (width, height) => {
    set((s) => {
      if (!s.project) return s;
      return {
        project: {
          ...s.project,
          canvas: { ...s.project.canvas, width, height },
          updatedAt: new Date().toISOString(),
        },
      };
    });
  },

  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  setGridSize: (size) => set({ gridSize: Math.max(10, Math.min(200, size)) }),

  // ━━━ Page management ━━━

  addPage: (name) => {
    set((s) => {
      if (!s.project) return s;
      const pageName = name ?? `페이지 ${s.project.pages.length + 1}`;
      const newPage = createDefaultPage(pageName);
      const pages = [...s.project.pages, newPage];
      return {
        project: { ...s.project, pages, updatedAt: new Date().toISOString() },
        currentPageIndex: pages.length - 1,
        selectedElementIds: [],
        activeLayerId: newPage.layers[0]?.id ?? null,
      };
    });
  },

  deletePage: (pageId) => {
    set((s) => {
      if (!s.project || s.project.pages.length <= 1) return s;
      const pages = s.project.pages.filter((p) => p.id !== pageId);
      const newIndex = Math.min(s.currentPageIndex, pages.length - 1);
      const newPage = pages[newIndex];
      return {
        project: { ...s.project, pages, updatedAt: new Date().toISOString() },
        currentPageIndex: newIndex,
        selectedElementIds: [],
        activeLayerId: newPage?.layers[0]?.id ?? null,
      };
    });
  },

  renamePage: (pageId, name) => {
    set((s) => {
      if (!s.project) return s;
      const pages = s.project.pages.map((p) =>
        p.id === pageId ? { ...p, name } : p
      );
      return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
    });
  },

  setCurrentPageIndex: (index) => {
    set((s) => {
      if (!s.project || index < 0 || index >= s.project.pages.length) return s;
      const page = s.project.pages[index];
      return {
        currentPageIndex: index,
        selectedElementIds: [],
        activeLayerId: page?.layers[0]?.id ?? null,
      };
    });
  },

  // ━━━ Layer management ━━━

  addLayer: (name) => {
    const id = uuid();
    set((s) => {
      if (!s.project) return s;
      const pages = [...s.project.pages];
      const page = { ...pages[s.currentPageIndex] };
      const layerName = name ?? `레이어 ${page.layers.length + 1}`;
      const newLayer: Layer = {
        id,
        name: layerName,
        visible: true,
        locked: false,
        opacity: 1,
        elementIds: [],
      };
      page.layers = [...page.layers, newLayer];
      // layerOrder doesn't change since new layer has no elements
      pages[s.currentPageIndex] = page;
      return {
        project: { ...s.project, pages, updatedAt: new Date().toISOString() },
        activeLayerId: id,
      };
    });
    return id;
  },

  removeLayer: (layerId) => {
    set((s) => {
      if (!s.project) return s;
      const pages = [...s.project.pages];
      const page = { ...pages[s.currentPageIndex] };

      // Cannot remove the last layer
      if (page.layers.length <= 1) return s;

      const removedLayer = page.layers.find((l) => l.id === layerId);
      if (!removedLayer) return s;

      // Move orphaned elements to the adjacent layer
      const removedIdx = page.layers.indexOf(removedLayer);
      const targetIdx = removedIdx > 0 ? removedIdx - 1 : 1;
      const targetLayer = page.layers[targetIdx];

      page.layers = page.layers
        .map((l) => {
          if (l.id === targetLayer.id) {
            return { ...l, elementIds: [...l.elementIds, ...removedLayer.elementIds] };
          }
          return l;
        })
        .filter((l) => l.id !== layerId);

      page.layerOrder = deriveLayerOrder(page.layers);
      pages[s.currentPageIndex] = page;

      const newActiveId = s.activeLayerId === layerId ? targetLayer.id : s.activeLayerId;
      return {
        project: { ...s.project, pages, updatedAt: new Date().toISOString() },
        activeLayerId: newActiveId,
      };
    });
  },

  renameLayer: (layerId, name) => {
    set((s) => {
      if (!s.project) return s;
      const pages = [...s.project.pages];
      const page = { ...pages[s.currentPageIndex] };
      page.layers = page.layers.map((l) =>
        l.id === layerId ? { ...l, name } : l
      );
      pages[s.currentPageIndex] = page;
      return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
    });
  },

  toggleLayerVisibility: (layerId) => {
    set((s) => {
      if (!s.project) return s;
      const pages = [...s.project.pages];
      const page = { ...pages[s.currentPageIndex] };
      page.layers = page.layers.map((l) =>
        l.id === layerId ? { ...l, visible: !l.visible } : l
      );
      pages[s.currentPageIndex] = page;
      return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
    });
  },

  toggleLayerLock: (layerId) => {
    set((s) => {
      if (!s.project) return s;
      const pages = [...s.project.pages];
      const page = { ...pages[s.currentPageIndex] };
      page.layers = page.layers.map((l) =>
        l.id === layerId ? { ...l, locked: !l.locked } : l
      );
      pages[s.currentPageIndex] = page;
      return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
    });
  },

  setLayerOpacity: (layerId, opacity) => {
    set((s) => {
      if (!s.project) return s;
      const pages = [...s.project.pages];
      const page = { ...pages[s.currentPageIndex] };
      page.layers = page.layers.map((l) =>
        l.id === layerId ? { ...l, opacity: Math.max(0, Math.min(1, opacity)) } : l
      );
      pages[s.currentPageIndex] = page;
      return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
    });
  },

  moveLayerGroupUp: (layerId) => {
    set((s) => {
      if (!s.project) return s;
      const pages = [...s.project.pages];
      const page = { ...pages[s.currentPageIndex] };
      const layers = [...page.layers];
      const idx = layers.findIndex((l) => l.id === layerId);
      if (idx < layers.length - 1) {
        [layers[idx], layers[idx + 1]] = [layers[idx + 1], layers[idx]];
      }
      page.layers = layers;
      page.layerOrder = deriveLayerOrder(layers);
      pages[s.currentPageIndex] = page;
      return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
    });
  },

  moveLayerGroupDown: (layerId) => {
    set((s) => {
      if (!s.project) return s;
      const pages = [...s.project.pages];
      const page = { ...pages[s.currentPageIndex] };
      const layers = [...page.layers];
      const idx = layers.findIndex((l) => l.id === layerId);
      if (idx > 0) {
        [layers[idx], layers[idx - 1]] = [layers[idx - 1], layers[idx]];
      }
      page.layers = layers;
      page.layerOrder = deriveLayerOrder(layers);
      pages[s.currentPageIndex] = page;
      return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
    });
  },

  moveElementToLayer: (elementId, targetLayerId) => {
    set((s) => {
      if (!s.project) return s;
      const pages = [...s.project.pages];
      const page = { ...pages[s.currentPageIndex] };

      // Remove from current layer, add to target
      const layers = page.layers.map((l) => {
        const filtered = l.elementIds.filter((eid) => eid !== elementId);
        if (l.id === targetLayerId) {
          return { ...l, elementIds: [...filtered, elementId] };
        }
        return { ...l, elementIds: filtered };
      });

      page.layers = layers;
      page.layerOrder = deriveLayerOrder(layers);
      pages[s.currentPageIndex] = page;
      return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
    });
  },

  setActiveLayerId: (layerId) => {
    set({ activeLayerId: layerId });
  },

  getActiveLayer: () => {
    const { project, currentPageIndex, activeLayerId } = get();
    if (!project) return null;
    const page = project.pages[currentPageIndex];
    if (!page) return null;
    if (activeLayerId) {
      return page.layers.find((l) => l.id === activeLayerId) ?? page.layers[page.layers.length - 1] ?? null;
    }
    return page.layers[page.layers.length - 1] ?? null;
  },

  getCurrentPage: () => {
    const { project, currentPageIndex } = get();
    return project?.pages[currentPageIndex] ?? null;
  },

  getElement: (id) => {
    const page = get().getCurrentPage();
    return page?.elements.find((el) => el.id === id);
  },

  getSelectedElements: () => {
    const page = get().getCurrentPage();
    const { selectedElementIds } = get();
    if (!page) return [];
    return page.elements.filter((el) => selectedElementIds.includes(el.id));
  },

  // ━━━ Frame / Grouping ━━━

  addFrameElement: (x = 100, y = 100) => {
    const id = uuid();
    const element: FrameElement = {
      id,
      type: 'frame',
      x,
      y,
      width: 300,
      height: 200,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      editable: false,
      fill: 'rgba(255,255,255,0)',
      stroke: '#94a3b8',
      strokeWidth: 1,
      borderRadius: 0,
      clipContent: true,
      childOrder: [],
    };
    set((s) => {
      if (!s.project) return s;
      const pages = [...s.project.pages];
      let page = { ...pages[s.currentPageIndex] };
      page.elements = [...page.elements, element];
      const targetLayerId = s.activeLayerId ?? page.layers[page.layers.length - 1]?.id;
      if (targetLayerId) {
        page = addElementToLayer(page, targetLayerId, id);
      }
      pages[s.currentPageIndex] = page;
      return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
    });
    return id;
  },

  addSectionElement: (y = 0) => {
    const id = uuid();
    const state = get();
    const canvasWidth = state.project?.canvas.width ?? 800;
    const element: FrameElement = {
      id,
      type: 'frame',
      x: 0,
      y,
      width: canvasWidth,
      height: 400,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      editable: false,
      fill: '#ffffff',
      stroke: 'transparent',
      strokeWidth: 0,
      borderRadius: 0,
      clipContent: true,
      childOrder: [],
      isSection: true,
    };
    set((s) => {
      if (!s.project) return s;
      const pages = [...s.project.pages];
      let page = { ...pages[s.currentPageIndex] };
      page.elements = [...page.elements, element];
      const targetLayerId = s.activeLayerId ?? page.layers[page.layers.length - 1]?.id;
      if (targetLayerId) {
        page = addElementToLayer(page, targetLayerId, id);
      }
      pages[s.currentPageIndex] = page;
      return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
    });
    return id;
  },

  groupElements: (ids) => {
    const state = get();
    if (!state.project || ids.length < 2) return null;
    const page = state.project.pages[state.currentPageIndex];

    const toGroup = page.elements.filter((el) => ids.includes(el.id));
    if (toGroup.length < 2) return null;

    // Determine parent context: check if all children share the same parent frame
    const parentIdSet = new Set(
      toGroup.map((e) => e.parentId).filter((pid): pid is string => !!pid)
    );
    const childrenWithoutParent = toGroup.filter((e) => !e.parentId);
    // Only use shared parent when ALL grouped elements come from the same parent
    const sharedParentId =
      parentIdSet.size === 1 && childrenWithoutParent.length === 0
        ? [...parentIdSet][0]
        : undefined;

    // Preserve z-order based on source context
    let orderedIds: string[];
    if (sharedParentId) {
      const parentFrame = page.elements.find((e) => e.id === sharedParentId) as FrameElement | undefined;
      if (parentFrame) {
        const idSet = new Set(ids);
        orderedIds = parentFrame.childOrder.filter((cid) => idSet.has(cid));
      } else {
        orderedIds = [...ids];
      }
    } else {
      // Fallback: preserve order from flat render order
      const flatOrder = get().getFlatRenderOrder();
      const idSet = new Set(ids);
      orderedIds = flatOrder.filter((fid) => idSet.has(fid));
      // Append any ids not found in flatOrder
      if (orderedIds.length < ids.length) {
        const found = new Set(orderedIds);
        for (const id of ids) {
          if (!found.has(id)) orderedIds.push(id);
        }
      }
    }

    const minX = Math.min(...toGroup.map((e) => e.x));
    const minY = Math.min(...toGroup.map((e) => e.y));
    const maxX = Math.max(...toGroup.map((e) => e.x + e.width));
    const maxY = Math.max(...toGroup.map((e) => e.y + e.height));
    const pad = 10;

    const frameId = uuid();
    const frame: FrameElement = {
      id: frameId,
      type: 'frame',
      x: minX - pad,
      y: minY - pad,
      width: maxX - minX + pad * 2,
      height: maxY - minY + pad * 2,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      editable: false,
      fill: 'rgba(255,255,255,0)',
      stroke: '#94a3b8',
      strokeWidth: 1,
      borderRadius: 0,
      clipContent: false,
      childOrder: orderedIds,
      ...(sharedParentId ? { parentId: sharedParentId } : {}),
    };

    set((s) => {
      if (!s.project) return s;
      const pages = [...s.project.pages];
      let pg = { ...pages[s.currentPageIndex] };

      const idsSet = new Set(ids);

      pg.elements = [
        ...pg.elements.map((el) => {
          // Set parentId on grouped children → point to new group frame
          if (idsSet.has(el.id)) {
            return { ...el, parentId: frameId } as CanvasElement;
          }
          // Remove grouped children from any parent frame's childOrder
          if (el.type === 'frame') {
            const f = el as FrameElement;
            const hadChildren = f.childOrder.some((cid) => idsSet.has(cid));
            if (hadChildren) {
              let newChildOrder = f.childOrder.filter((cid) => !idsSet.has(cid));
              // If this is the shared parent, insert group frame at the first grouped child's position
              if (sharedParentId === el.id) {
                const firstRemovedIdx = f.childOrder.findIndex((cid) => idsSet.has(cid));
                const insertIdx = Math.min(firstRemovedIdx, newChildOrder.length);
                newChildOrder = [
                  ...newChildOrder.slice(0, insertIdx),
                  frameId,
                  ...newChildOrder.slice(insertIdx),
                ];
              }
              return { ...f, childOrder: newChildOrder } as CanvasElement;
            }
          }
          return el;
        }),
        frame,
      ];

      // Remove children from layers (handles elements that were at layer level)
      pg = removeElementsFromLayers(pg, idsSet);

      // Add frame to active layer only if NOT nested inside another frame
      if (!sharedParentId) {
        const targetLayerId = s.activeLayerId ?? pg.layers[pg.layers.length - 1]?.id;
        if (targetLayerId) {
          pg = addElementToLayer(pg, targetLayerId, frameId);
        }
      }

      pages[s.currentPageIndex] = pg;
      return {
        project: { ...s.project, pages, updatedAt: new Date().toISOString() },
        selectedElementIds: [frameId],
      };
    });
    return frameId;
  },

  ungroupElements: (frameId) => {
    set((s) => {
      if (!s.project) return s;
      const pages = [...s.project.pages];
      let page = { ...pages[s.currentPageIndex] };
      const frame = page.elements.find((el) => el.id === frameId);
      if (!frame || frame.type !== 'frame') return s;
      const f = frame as FrameElement;
      const frameParentId = f.parentId;

      if (frameParentId) {
        // ── Nested group: return children to the parent frame ──
        const childIdSet = new Set(f.childOrder);
        page.elements = page.elements
          .filter((el) => el.id !== frameId)
          .map((el) => {
            // Children → restore parentId to the parent frame
            if (childIdSet.has(el.id)) {
              return { ...el, parentId: frameParentId } as CanvasElement;
            }
            // Parent frame → replace group frame with its children in childOrder
            if (el.id === frameParentId && el.type === 'frame') {
              const parentFrame = el as FrameElement;
              const idx = parentFrame.childOrder.indexOf(frameId);
              const newChildOrder = [...parentFrame.childOrder];
              if (idx >= 0) {
                newChildOrder.splice(idx, 1, ...f.childOrder);
              } else {
                newChildOrder.push(...f.childOrder);
              }
              return { ...parentFrame, childOrder: newChildOrder } as CanvasElement;
            }
            return el;
          });
      } else {
        // ── Top-level group: return children to the layer ──
        const frameLayerIdx = findElementLayerIndex(page.layers, frameId);
        const targetLayerId = frameLayerIdx >= 0 ? page.layers[frameLayerIdx].id : page.layers[0]?.id;

        page.elements = page.elements
          .filter((el) => el.id !== frameId)
          .map((el) =>
            el.parentId === frameId ? ({ ...el, parentId: undefined } as CanvasElement) : el
          );

        const frameIdSet = new Set([frameId]);
        page = removeElementsFromLayers(page, frameIdSet);

        if (targetLayerId) {
          const layers = page.layers.map((l) => {
            if (l.id === targetLayerId) {
              return { ...l, elementIds: [...l.elementIds, ...f.childOrder] };
            }
            return l;
          });
          page.layers = layers;
          page.layerOrder = deriveLayerOrder(layers);
        }
      }

      pages[s.currentPageIndex] = page;
      return {
        project: { ...s.project, pages, updatedAt: new Date().toISOString() },
        selectedElementIds: [...f.childOrder],
      };
    });
  },

  moveToFrame: (elementIds, frameId) => {
    set((s) => {
      if (!s.project) return s;
      const pages = [...s.project.pages];
      let page = { ...pages[s.currentPageIndex] };

      page.elements = page.elements.map((el) => {
        if (elementIds.includes(el.id)) {
          return { ...el, parentId: frameId } as CanvasElement;
        }
        if (el.id === frameId && el.type === 'frame') {
          const f = el as FrameElement;
          return { ...f, childOrder: [...f.childOrder, ...elementIds] } as CanvasElement;
        }
        return el;
      });

      // Remove from layers (they're now nested in a frame)
      const idsSet = new Set(elementIds);
      page = removeElementsFromLayers(page, idsSet);
      pages[s.currentPageIndex] = page;
      return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
    });
  },

  moveOutOfFrame: (elementIds) => {
    set((s) => {
      if (!s.project) return s;
      const pages = [...s.project.pages];
      let page = { ...pages[s.currentPageIndex] };

      // Find parent frames to determine which layer to add elements to
      const parentFrameIds = new Set<string>();
      page.elements.forEach((el) => {
        if (elementIds.includes(el.id) && el.parentId) {
          parentFrameIds.add(el.parentId);
        }
      });

      // Find the layer of the first parent frame
      let targetLayerId = page.layers[page.layers.length - 1]?.id;
      for (const pfId of parentFrameIds) {
        const layerIdx = findElementLayerIndex(page.layers, pfId);
        if (layerIdx >= 0) {
          targetLayerId = page.layers[layerIdx].id;
          break;
        }
      }

      // Remove from parent frames' childOrder and clear parentId
      page.elements = page.elements.map((el) => {
        if (elementIds.includes(el.id)) {
          return { ...el, parentId: undefined } as CanvasElement;
        }
        if (el.type === 'frame') {
          const f = el as FrameElement;
          const newChildOrder = f.childOrder.filter((cid) => !elementIds.includes(cid));
          if (newChildOrder.length !== f.childOrder.length) {
            return { ...f, childOrder: newChildOrder } as CanvasElement;
          }
        }
        return el;
      });

      // Add back to the appropriate layer
      if (targetLayerId) {
        const layers = page.layers.map((l) => {
          if (l.id === targetLayerId) {
            return { ...l, elementIds: [...l.elementIds, ...elementIds] };
          }
          return l;
        });
        page.layers = layers;
        page.layerOrder = deriveLayerOrder(layers);
      }

      pages[s.currentPageIndex] = page;
      return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
    });
  },

  // ━━━ Alignment, Distribution & Nudge ━━━

  alignElements: (ids, direction) => {
    set((s) => {
      if (!s.project || ids.length === 0) return s;
      const pages = [...s.project.pages];
      const page = { ...pages[s.currentPageIndex] };
      const targets = page.elements.filter((el) => ids.includes(el.id));
      if (targets.length === 0) return s;

      const updates = new Map<string, Partial<CanvasElement>>();

      if (targets.length === 1) {
        // Single element: align to canvas
        const canvasW = s.project.canvas.width;
        const canvasH = s.project.canvas.height;
        const el = targets[0];
        switch (direction) {
          case 'left':    updates.set(el.id, { x: 0 }); break;
          case 'right':   updates.set(el.id, { x: canvasW - el.width }); break;
          case 'centerH':  updates.set(el.id, { x: canvasW / 2 - el.width / 2 }); break;
          case 'top':     updates.set(el.id, { y: 0 }); break;
          case 'bottom':  updates.set(el.id, { y: canvasH - el.height }); break;
          case 'centerV':  updates.set(el.id, { y: canvasH / 2 - el.height / 2 }); break;
        }
      } else {
        // Multiple elements: align to bounding box of selection
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const el of targets) {
          minX = Math.min(minX, el.x);
          minY = Math.min(minY, el.y);
          maxX = Math.max(maxX, el.x + el.width);
          maxY = Math.max(maxY, el.y + el.height);
        }
        for (const el of targets) {
          switch (direction) {
            case 'left':    updates.set(el.id, { x: minX }); break;
            case 'right':   updates.set(el.id, { x: maxX - el.width }); break;
            case 'centerH':  updates.set(el.id, { x: (minX + maxX) / 2 - el.width / 2 }); break;
            case 'top':     updates.set(el.id, { y: minY }); break;
            case 'bottom':  updates.set(el.id, { y: maxY - el.height }); break;
            case 'centerV':  updates.set(el.id, { y: (minY + maxY) / 2 - el.height / 2 }); break;
          }
        }
      }

      page.elements = page.elements.map((el) => {
        const u = updates.get(el.id);
        return u ? { ...el, ...u } as CanvasElement : el;
      });
      pages[s.currentPageIndex] = page;
      return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
    });
  },

  distributeElements: (ids, axis) => {
    set((s) => {
      if (!s.project || ids.length < 3) return s;
      const pages = [...s.project.pages];
      const page = { ...pages[s.currentPageIndex] };
      const targets = page.elements.filter((el) => ids.includes(el.id));
      if (targets.length < 3) return s;

      if (axis === 'horizontal') {
        const sorted = [...targets].sort((a, b) => a.x - b.x);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const totalWidth = sorted.reduce((sum, el) => sum + el.width, 0);
        const totalSpace = (last.x + last.width) - first.x - totalWidth;
        const gap = totalSpace / (sorted.length - 1);
        let currentX = first.x + first.width + gap;
        const updates = new Map<string, number>();
        for (let i = 1; i < sorted.length - 1; i++) {
          updates.set(sorted[i].id, currentX);
          currentX += sorted[i].width + gap;
        }
        page.elements = page.elements.map((el) => {
          const newX = updates.get(el.id);
          return newX !== undefined ? { ...el, x: newX } as CanvasElement : el;
        });
      } else {
        const sorted = [...targets].sort((a, b) => a.y - b.y);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const totalHeight = sorted.reduce((sum, el) => sum + el.height, 0);
        const totalSpace = (last.y + last.height) - first.y - totalHeight;
        const gap = totalSpace / (sorted.length - 1);
        let currentY = first.y + first.height + gap;
        const updates = new Map<string, number>();
        for (let i = 1; i < sorted.length - 1; i++) {
          updates.set(sorted[i].id, currentY);
          currentY += sorted[i].height + gap;
        }
        page.elements = page.elements.map((el) => {
          const newY = updates.get(el.id);
          return newY !== undefined ? { ...el, y: newY } as CanvasElement : el;
        });
      }

      pages[s.currentPageIndex] = page;
      return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
    });
  },

  nudgeElements: (ids, dx, dy) => {
    set((s) => {
      if (!s.project || ids.length === 0) return s;
      const pages = [...s.project.pages];
      const page = { ...pages[s.currentPageIndex] };
      const idSet = new Set(ids);
      page.elements = page.elements.map((el) => {
        if (!idSet.has(el.id)) return el;
        return { ...el, x: el.x + dx, y: el.y + dy } as CanvasElement;
      });
      pages[s.currentPageIndex] = page;
      return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
    });
  },

  getChildElements: (frameId) => {
    const page = get().getCurrentPage();
    if (!page) return [];
    const frame = page.elements.find((el) => el.id === frameId);
    if (!frame || frame.type !== 'frame') return [];
    const f = frame as FrameElement;
    return f.childOrder
      .map((cid) => page.elements.find((el) => el.id === cid))
      .filter((el): el is CanvasElement => !!el);
  },

  getFlatRenderOrder: () => {
    const page = get().getCurrentPage();
    if (!page) return [];
    const result: string[] = [];
    const addWithChildren = (ids: string[]) => {
      for (const id of ids) {
        result.push(id);
        const el = page.elements.find((e) => e.id === id);
        if (el && el.type === 'frame') {
          addWithChildren((el as FrameElement).childOrder);
        }
      }
    };
    addWithChildren(page.layerOrder);
    return result;
  },
}));
