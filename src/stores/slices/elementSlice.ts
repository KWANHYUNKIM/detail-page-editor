import { v4 as uuid } from 'uuid';
import type {
  CanvasElement,
  ImageElement,
  TextElement,
  ShapeElement,
  ShapeType,
  Project,
  Page,
} from '@/types/editor';
import { DEFAULT_FONT, DEFAULT_FONT_SIZE, DEFAULT_TEXT_COLOR } from '@/constants/fonts';
import { addElementToLayer, findElementLayerIndex } from '@/stores/storeHelpers';

export interface ElementSlice {
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
  toggleElementEditable: (id: string) => void;
  setElementPlaceholder: (id: string, placeholder: string) => void;
}

type SetFn = (fn: ((s: any) => any) | Record<string, unknown>) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
type GetFn = () => any; // eslint-disable-line @typescript-eslint/no-explicit-any

export function createElementSlice(set: SetFn, get: GetFn): ElementSlice {
  // Helper: add element to page's active layer
  function addToPage(
    s: { project: Project | null; currentPageIndex: number; activeLayerId: string | null },
    element: CanvasElement,
  ) {
    if (!s.project) return s;
    const pages = [...s.project.pages];
    let page: Page = { ...pages[s.currentPageIndex] };
    page.elements = [...page.elements, element];
    const targetLayerId = s.activeLayerId ?? page.layers[page.layers.length - 1]?.id;
    if (targetLayerId) {
      page = addElementToLayer(page, targetLayerId, element.id);
    }
    pages[s.currentPageIndex] = page;
    return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
  }

  return {
    addImageElement: (src, name) => {
      const id = uuid();
      const element: ImageElement = {
        id,
        type: 'image',
        x: 100, y: 100,
        width: 300, height: 300,
        rotation: 0, opacity: 1,
        locked: false, visible: true, editable: false,
        src,
        originalName: name,
        scaleMode: 'fill',
        crop: null,
        filters: { brightness: 0, contrast: 0, saturation: 0, blur: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0 },
        filterPreset: null,
      };
      set((s: any) => addToPage(s, element)); // eslint-disable-line @typescript-eslint/no-explicit-any
      return id;
    },

    addTextElement: (content = '텍스트를 입력하세요') => {
      const id = uuid();
      const element: TextElement = {
        id,
        type: 'text',
        x: 100, y: 100,
        width: 200, height: 40,
        rotation: 0, opacity: 1,
        locked: false, visible: true, editable: false,
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
        textShadow: { enabled: false, color: 'rgba(0,0,0,0.5)', offsetX: 2, offsetY: 2, blur: 4 },
        textStroke: { enabled: false, color: '#000000', width: 1 },
        textBackground: '',
      };
      set((s: any) => addToPage(s, element)); // eslint-disable-line @typescript-eslint/no-explicit-any
      return id;
    },

    addShapeElement: (shape) => {
      const id = uuid();
      const element: ShapeElement = {
        id,
        type: 'shape',
        x: 100, y: 100,
        width: shape === 'line' ? 200 : 150,
        height: shape === 'line' ? 4 : 150,
        rotation: 0, opacity: 1,
        locked: false, visible: true, editable: false,
        shape,
        fill: shape === 'line' ? 'transparent' : '#e2e8f0',
        stroke: '#94a3b8',
        strokeWidth: shape === 'line' ? 2 : 0,
        borderRadius: shape === 'circle' ? 9999 : 0,
      };
      set((s: any) => addToPage(s, element)); // eslint-disable-line @typescript-eslint/no-explicit-any
      return id;
    },

    updateElement: (id, updates) => {
      set((s: { project: Project | null; currentPageIndex: number }) => {
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
      set((s: { project: Project | null; currentPageIndex: number }) => {
        if (!s.project) return s;
        const pages = [...s.project.pages];
        let page: Page = { ...pages[s.currentPageIndex] };

        const allIds = new Set<string>(ids);
        const collectChildren = (parentIds: string[]) => {
          for (const pid of parentIds) {
            const el = page.elements.find((e) => e.id === pid);
            if (el && el.type === 'frame') {
              const frame = el as import('@/types/editor').FrameElement;
              for (const childId of frame.childOrder) allIds.add(childId);
              collectChildren(frame.childOrder);
            }
          }
        };
        collectChildren(ids);

        const updatedElements = page.elements
          .filter((el) => !allIds.has(el.id))
          .map((el) => {
            if (el.type === 'frame') {
              const frame = el as import('@/types/editor').FrameElement;
              const newChildOrder = frame.childOrder.filter((cid) => !allIds.has(cid));
              if (newChildOrder.length !== frame.childOrder.length) {
                return { ...frame, childOrder: newChildOrder } as CanvasElement;
              }
            }
            return el;
          });

        const { removeElementsFromLayers } = require('@/stores/storeHelpers'); // dynamic to avoid circular in TS
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
      const page: Page = state.project.pages[state.currentPageIndex];
      const toDuplicate = page.elements.filter((el: CanvasElement) => ids.includes(el.id));
      const newIds: string[] = [];
      toDuplicate.forEach((el: CanvasElement) => {
        const newId = uuid();
        newIds.push(newId);
        const ox = offset?.x ?? 20;
        const oy = offset?.y ?? 20;
        const clone = { ...el, id: newId, x: el.x + ox, y: el.y + oy };
        const layerIdx = findElementLayerIndex(page.layers, el.id);
        const targetLayerId = layerIdx >= 0
          ? page.layers[layerIdx].id
          : (state.activeLayerId ?? page.layers[page.layers.length - 1]?.id);
        set((s: { project: Project | null; currentPageIndex: number }) => {
          if (!s.project) return s;
          const pages = [...s.project.pages];
          let pg: Page = { ...pages[s.currentPageIndex] };
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
        get().removeElements(selected.map((el: CanvasElement) => el.id));
      }
    },

    pasteElements: () => {
      const state = get();
      if (!state.project || state.clipboardElements.length === 0) return;
      const newElements: CanvasElement[] = state.clipboardElements.map((el: CanvasElement) => {
        const newId = uuid();
        return { ...JSON.parse(JSON.stringify(el)), id: newId, x: el.x + 20, y: el.y + 20 } as CanvasElement;
      });
      const newIds = newElements.map((el) => el.id);
      set((s: { project: Project | null; currentPageIndex: number; activeLayerId: string | null }) => {
        if (!s.project) return s;
        const pages = [...s.project.pages];
        let pg: Page = { ...pages[s.currentPageIndex] };
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, type, x, y, width, height, rotation, locked, visible, editable, placeholder, editableProps, parentId, ...style } = el;
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
      const selected: CanvasElement[] = state.getSelectedElements();
      if (selected.length === 0) return;
      const style = state.styleClipboard;
      for (const el of selected) {
        const applicable: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(style)) {
          if (['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'textAlign', 'lineHeight', 'letterSpacing', 'textDecoration', 'textShadow', 'textStroke', 'textBackground'].includes(key) && el.type !== 'text') continue;
          if (['shape', 'borderRadius'].includes(key) && el.type !== 'shape' && el.type !== 'frame') continue;
          if (['scaleMode', 'crop', 'filters', 'filterPreset', 'gradientOverlay'].includes(key) && el.type !== 'image') continue;
          if (['clipContent'].includes(key) && el.type !== 'frame') continue;
          applicable[key] = value;
        }
        state.updateElement(el.id, applicable as Partial<CanvasElement>);
      }
    },

    toggleElementEditable: (id) => {
      const el = get().getElement(id);
      if (el) get().updateElement(id, { editable: !el.editable });
    },

    setElementPlaceholder: (id, placeholder) => {
      get().updateElement(id, { placeholder });
    },
  };
}
