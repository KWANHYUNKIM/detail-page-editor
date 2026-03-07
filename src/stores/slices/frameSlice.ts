import { v4 as uuid } from 'uuid';
import type { CanvasElement, FrameElement, Page, Project } from '@/types/editor';
import {
  addElementToLayer,
  removeElementsFromLayers,
  findElementLayerIndex,
} from '@/stores/storeHelpers';

export interface FrameSlice {
  addFrameElement: (x?: number, y?: number) => string;
  addSectionElement: (y?: number) => string;
  groupElements: (ids: string[]) => string | null;
  ungroupElements: (frameId: string) => void;
  moveToFrame: (elementIds: string[], frameId: string) => void;
  moveOutOfFrame: (elementIds: string[]) => void;
  getChildElements: (frameId: string) => CanvasElement[];
  getFlatRenderOrder: () => string[];
}

type SetFn = (fn: ((s: any) => any) | Record<string, unknown>) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
type GetFn = () => any; // eslint-disable-line @typescript-eslint/no-explicit-any

export function createFrameSlice(set: SetFn, get: GetFn): FrameSlice {
  return {
    addFrameElement: (x = 100, y = 100) => {
      const id = uuid();
      const element: FrameElement = {
        id, type: 'frame', x, y,
        width: 300, height: 200,
        rotation: 0, opacity: 1,
        locked: false, visible: true, editable: false,
        fill: 'rgba(255,255,255,0)',
        stroke: '#94a3b8', strokeWidth: 1,
        borderRadius: 0, clipContent: true, childOrder: [],
      };
      set((s: { project: Project | null; currentPageIndex: number; activeLayerId: string | null }) => {
        if (!s.project) return s;
        const pages = [...s.project.pages];
        let page: Page = { ...pages[s.currentPageIndex] };
        page.elements = [...page.elements, element];
        const targetLayerId = s.activeLayerId ?? page.layers[page.layers.length - 1]?.id;
        if (targetLayerId) page = addElementToLayer(page, targetLayerId, id);
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
        id, type: 'frame', x: 0, y,
        width: canvasWidth, height: 400,
        rotation: 0, opacity: 1,
        locked: false, visible: true, editable: false,
        fill: '#ffffff', stroke: 'transparent', strokeWidth: 0,
        borderRadius: 0, clipContent: true, childOrder: [],
        isSection: true,
      };
      set((s: { project: Project | null; currentPageIndex: number; activeLayerId: string | null }) => {
        if (!s.project) return s;
        const pages = [...s.project.pages];
        let page: Page = { ...pages[s.currentPageIndex] };
        page.elements = [...page.elements, element];
        const targetLayerId = s.activeLayerId ?? page.layers[page.layers.length - 1]?.id;
        if (targetLayerId) page = addElementToLayer(page, targetLayerId, id);
        pages[s.currentPageIndex] = page;
        return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
      });
      return id;
    },

    groupElements: (ids) => {
      const state = get();
      if (!state.project || ids.length < 2) return null;
      const page: Page = state.project.pages[state.currentPageIndex];

      const toGroup = page.elements.filter((el: CanvasElement) => ids.includes(el.id));
      if (toGroup.length < 2) return null;

      const parentIdSet = new Set(
        toGroup.map((e: CanvasElement) => e.parentId).filter((pid: string | undefined): pid is string => !!pid)
      );
      const childrenWithoutParent = toGroup.filter((e: CanvasElement) => !e.parentId);
      const sharedParentId =
        parentIdSet.size === 1 && childrenWithoutParent.length === 0
          ? [...parentIdSet][0]
          : undefined;

      let orderedIds: string[];
      if (sharedParentId) {
        const parentFrame = page.elements.find((e: CanvasElement) => e.id === sharedParentId) as FrameElement | undefined;
        if (parentFrame) {
          const idSet = new Set(ids);
          orderedIds = parentFrame.childOrder.filter((cid) => idSet.has(cid));
        } else {
          orderedIds = [...ids];
        }
      } else {
        const flatOrder = get().getFlatRenderOrder();
        const idSet = new Set(ids);
        orderedIds = flatOrder.filter((fid: string) => idSet.has(fid));
        if (orderedIds.length < ids.length) {
          const found = new Set(orderedIds);
          for (const id of ids) { if (!found.has(id)) orderedIds.push(id); }
        }
      }

      const minX = Math.min(...toGroup.map((e: CanvasElement) => e.x));
      const minY = Math.min(...toGroup.map((e: CanvasElement) => e.y));
      const maxX = Math.max(...toGroup.map((e: CanvasElement) => e.x + e.width));
      const maxY = Math.max(...toGroup.map((e: CanvasElement) => e.y + e.height));
      const pad = 10;

      const frameId = uuid();
      const frame: FrameElement = {
        id: frameId, type: 'frame',
        x: minX - pad, y: minY - pad,
        width: maxX - minX + pad * 2, height: maxY - minY + pad * 2,
        rotation: 0, opacity: 1,
        locked: false, visible: true, editable: false,
        fill: 'rgba(255,255,255,0)', stroke: '#94a3b8', strokeWidth: 1,
        borderRadius: 0, clipContent: false,
        childOrder: orderedIds,
        ...(sharedParentId ? { parentId: sharedParentId } : {}),
      };

      set((s: { project: Project | null; currentPageIndex: number; activeLayerId: string | null }) => {
        if (!s.project) return s;
        const pages = [...s.project.pages];
        let pg: Page = { ...pages[s.currentPageIndex] };
        const idsSet = new Set(ids);

        pg.elements = [
          ...pg.elements.map((el) => {
            if (idsSet.has(el.id)) return { ...el, parentId: frameId } as CanvasElement;
            if (el.type === 'frame') {
              const f = el as FrameElement;
              const hadChildren = f.childOrder.some((cid) => idsSet.has(cid));
              if (hadChildren) {
                let newChildOrder = f.childOrder.filter((cid) => !idsSet.has(cid));
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

        pg = removeElementsFromLayers(pg, idsSet);
        if (!sharedParentId) {
          const targetLayerId = s.activeLayerId ?? pg.layers[pg.layers.length - 1]?.id;
          if (targetLayerId) pg = addElementToLayer(pg, targetLayerId, frameId);
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
      set((s: { project: Project | null; currentPageIndex: number }) => {
        if (!s.project) return s;
        const pages = [...s.project.pages];
        let page: Page = { ...pages[s.currentPageIndex] };
        const frame = page.elements.find((el) => el.id === frameId);
        if (!frame || frame.type !== 'frame') return s;
        const f = frame as FrameElement;
        const frameParentId = f.parentId;

        if (frameParentId) {
          const childIdSet = new Set(f.childOrder);
          page.elements = page.elements
            .filter((el) => el.id !== frameId)
            .map((el) => {
              if (childIdSet.has(el.id)) return { ...el, parentId: frameParentId } as CanvasElement;
              if (el.id === frameParentId && el.type === 'frame') {
                const parentFrame = el as FrameElement;
                const idx = parentFrame.childOrder.indexOf(frameId);
                const newChildOrder = [...parentFrame.childOrder];
                if (idx >= 0) newChildOrder.splice(idx, 1, ...f.childOrder);
                else newChildOrder.push(...f.childOrder);
                return { ...parentFrame, childOrder: newChildOrder } as CanvasElement;
              }
              return el;
            });
        } else {
          const frameLayerIdx = findElementLayerIndex(page.layers, frameId);
          const targetLayerId = frameLayerIdx >= 0 ? page.layers[frameLayerIdx].id : page.layers[0]?.id;
          page.elements = page.elements
            .filter((el) => el.id !== frameId)
            .map((el) => el.parentId === frameId ? ({ ...el, parentId: undefined } as CanvasElement) : el);

          const frameIdSet = new Set([frameId]);
          page = removeElementsFromLayers(page, frameIdSet);
          if (targetLayerId) {
            const layers = page.layers.map((l) => {
              if (l.id === targetLayerId) return { ...l, elementIds: [...l.elementIds, ...f.childOrder] };
              return l;
            });
            page.layers = layers;
            page.layerOrder = (function deriveLayerOrder(layers: { elementIds: string[] }[]) {
              return layers.flatMap((l) => l.elementIds);
            })(layers);
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
      set((s: { project: Project | null; currentPageIndex: number }) => {
        if (!s.project) return s;
        const pages = [...s.project.pages];
        let page: Page = { ...pages[s.currentPageIndex] };
        page.elements = page.elements.map((el) => {
          if (elementIds.includes(el.id)) return { ...el, parentId: frameId } as CanvasElement;
          if (el.id === frameId && el.type === 'frame') {
            const f = el as FrameElement;
            return { ...f, childOrder: [...f.childOrder, ...elementIds] } as CanvasElement;
          }
          return el;
        });
        const idsSet = new Set(elementIds);
        page = removeElementsFromLayers(page, idsSet);
        pages[s.currentPageIndex] = page;
        return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
      });
    },

    moveOutOfFrame: (elementIds) => {
      set((s: { project: Project | null; currentPageIndex: number }) => {
        if (!s.project) return s;
        const pages = [...s.project.pages];
        let page: Page = { ...pages[s.currentPageIndex] };

        const parentFrameIds = new Set<string>();
        page.elements.forEach((el) => {
          if (elementIds.includes(el.id) && el.parentId) parentFrameIds.add(el.parentId);
        });

        let targetLayerId = page.layers[page.layers.length - 1]?.id;
        for (const pfId of parentFrameIds) {
          const layerIdx = findElementLayerIndex(page.layers, pfId);
          if (layerIdx >= 0) { targetLayerId = page.layers[layerIdx].id; break; }
        }

        page.elements = page.elements.map((el) => {
          if (elementIds.includes(el.id)) return { ...el, parentId: undefined } as CanvasElement;
          if (el.type === 'frame') {
            const f = el as FrameElement;
            const newChildOrder = f.childOrder.filter((cid) => !elementIds.includes(cid));
            if (newChildOrder.length !== f.childOrder.length) return { ...f, childOrder: newChildOrder } as CanvasElement;
          }
          return el;
        });

        if (targetLayerId) {
          const layers = page.layers.map((l) => {
            if (l.id === targetLayerId) return { ...l, elementIds: [...l.elementIds, ...elementIds] };
            return l;
          });
          page.layers = layers;
          page.layerOrder = layers.flatMap((l) => l.elementIds);
        }

        pages[s.currentPageIndex] = page;
        return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
      });
    },

    getChildElements: (frameId) => {
      const page: Page | null = get().getCurrentPage();
      if (!page) return [];
      const frame = page.elements.find((el) => el.id === frameId);
      if (!frame || frame.type !== 'frame') return [];
      const f = frame as FrameElement;
      return f.childOrder
        .map((cid) => page.elements.find((el) => el.id === cid))
        .filter((el): el is CanvasElement => !!el);
    },

    getFlatRenderOrder: () => {
      const page: Page | null = get().getCurrentPage();
      if (!page) return [];
      const result: string[] = [];
      const addWithChildren = (ids: string[]) => {
        for (const id of ids) {
          result.push(id);
          const el = page.elements.find((e) => e.id === id);
          if (el && el.type === 'frame') addWithChildren((el as FrameElement).childOrder);
        }
      };
      addWithChildren(page.layerOrder);
      return result;
    },
  };
}
