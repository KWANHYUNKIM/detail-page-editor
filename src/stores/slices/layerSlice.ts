import { v4 as uuid } from 'uuid';
import type { Layer, Project, Page } from '@/types/editor';
import { deriveLayerOrder, findElementLayerIndex } from '@/stores/storeHelpers';

export interface LayerSlice {
  activeLayerId: string | null;

  // Layer CRUD
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

  // Element z-ordering within a layer
  moveLayerUp: (id: string) => void;
  moveLayerDown: (id: string) => void;
  moveLayerToTop: (id: string) => void;
  moveLayerToBottom: (id: string) => void;
}

type SetFn = (fn: ((s: any) => any) | Record<string, unknown>) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
type GetFn = () => any; // eslint-disable-line @typescript-eslint/no-explicit-any

export function createLayerSlice(set: SetFn, get: GetFn): LayerSlice {
  /** Helper for z-ordering within a layer */
  function swapInLayer(
    s: { project: Project | null; currentPageIndex: number },
    elementId: string,
    swapper: (order: string[]) => string[],
  ) {
    if (!s.project) return s;
    const pages = [...s.project.pages];
    const page: Page = { ...pages[s.currentPageIndex] };
    const layerIdx = findElementLayerIndex(page.layers, elementId);
    if (layerIdx < 0) return s;
    const layers = page.layers.map((l, i) => {
      if (i !== layerIdx) return l;
      return { ...l, elementIds: swapper([...l.elementIds]) };
    });
    page.layers = layers;
    page.layerOrder = deriveLayerOrder(layers);
    pages[s.currentPageIndex] = page;
    return { project: { ...s.project, pages } };
  }

  return {
    activeLayerId: null,

    addLayer: (name) => {
      const id = uuid();
      set((s: { project: Project | null; currentPageIndex: number }) => {
        if (!s.project) return s;
        const pages = [...s.project.pages];
        const page: Page = { ...pages[s.currentPageIndex] };
        const layerName = name ?? `레이어 ${page.layers.length + 1}`;
        const newLayer: Layer = { id, name: layerName, visible: true, locked: false, opacity: 1, elementIds: [] };
        page.layers = [...page.layers, newLayer];
        pages[s.currentPageIndex] = page;
        return {
          project: { ...s.project, pages, updatedAt: new Date().toISOString() },
          activeLayerId: id,
        };
      });
      return id;
    },

    removeLayer: (layerId) => {
      set((s: { project: Project | null; currentPageIndex: number; activeLayerId: string | null }) => {
        if (!s.project) return s;
        const pages = [...s.project.pages];
        const page: Page = { ...pages[s.currentPageIndex] };
        if (page.layers.length <= 1) return s;

        const removedLayer = page.layers.find((l) => l.id === layerId);
        if (!removedLayer) return s;
        const removedIdx = page.layers.indexOf(removedLayer);
        const targetIdx = removedIdx > 0 ? removedIdx - 1 : 1;
        const targetLayer = page.layers[targetIdx];

        page.layers = page.layers
          .map((l) => {
            if (l.id === targetLayer.id) return { ...l, elementIds: [...l.elementIds, ...removedLayer.elementIds] };
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
      set((s: { project: Project | null; currentPageIndex: number }) => {
        if (!s.project) return s;
        const pages = [...s.project.pages];
        const page: Page = { ...pages[s.currentPageIndex] };
        page.layers = page.layers.map((l) => (l.id === layerId ? { ...l, name } : l));
        pages[s.currentPageIndex] = page;
        return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
      });
    },

    toggleLayerVisibility: (layerId) => {
      set((s: { project: Project | null; currentPageIndex: number }) => {
        if (!s.project) return s;
        const pages = [...s.project.pages];
        const page: Page = { ...pages[s.currentPageIndex] };
        page.layers = page.layers.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l));
        pages[s.currentPageIndex] = page;
        return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
      });
    },

    toggleLayerLock: (layerId) => {
      set((s: { project: Project | null; currentPageIndex: number }) => {
        if (!s.project) return s;
        const pages = [...s.project.pages];
        const page: Page = { ...pages[s.currentPageIndex] };
        page.layers = page.layers.map((l) => (l.id === layerId ? { ...l, locked: !l.locked } : l));
        pages[s.currentPageIndex] = page;
        return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
      });
    },

    setLayerOpacity: (layerId, opacity) => {
      set((s: { project: Project | null; currentPageIndex: number }) => {
        if (!s.project) return s;
        const pages = [...s.project.pages];
        const page: Page = { ...pages[s.currentPageIndex] };
        page.layers = page.layers.map((l) =>
          l.id === layerId ? { ...l, opacity: Math.max(0, Math.min(1, opacity)) } : l
        );
        pages[s.currentPageIndex] = page;
        return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
      });
    },

    moveLayerGroupUp: (layerId) => {
      set((s: { project: Project | null; currentPageIndex: number }) => {
        if (!s.project) return s;
        const pages = [...s.project.pages];
        const page: Page = { ...pages[s.currentPageIndex] };
        const layers = [...page.layers];
        const idx = layers.findIndex((l) => l.id === layerId);
        if (idx < layers.length - 1) [layers[idx], layers[idx + 1]] = [layers[idx + 1], layers[idx]];
        page.layers = layers;
        page.layerOrder = deriveLayerOrder(layers);
        pages[s.currentPageIndex] = page;
        return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
      });
    },

    moveLayerGroupDown: (layerId) => {
      set((s: { project: Project | null; currentPageIndex: number }) => {
        if (!s.project) return s;
        const pages = [...s.project.pages];
        const page: Page = { ...pages[s.currentPageIndex] };
        const layers = [...page.layers];
        const idx = layers.findIndex((l) => l.id === layerId);
        if (idx > 0) [layers[idx], layers[idx - 1]] = [layers[idx - 1], layers[idx]];
        page.layers = layers;
        page.layerOrder = deriveLayerOrder(layers);
        pages[s.currentPageIndex] = page;
        return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
      });
    },

    moveElementToLayer: (elementId, targetLayerId) => {
      set((s: { project: Project | null; currentPageIndex: number }) => {
        if (!s.project) return s;
        const pages = [...s.project.pages];
        const page: Page = { ...pages[s.currentPageIndex] };
        const layers = page.layers.map((l) => {
          const filtered = l.elementIds.filter((eid) => eid !== elementId);
          if (l.id === targetLayerId) return { ...l, elementIds: [...filtered, elementId] };
          return { ...l, elementIds: filtered };
        });
        page.layers = layers;
        page.layerOrder = deriveLayerOrder(layers);
        pages[s.currentPageIndex] = page;
        return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
      });
    },

    setActiveLayerId: (layerId) => set({ activeLayerId: layerId }),

    getActiveLayer: () => {
      const { project, currentPageIndex, activeLayerId } = get();
      if (!project) return null;
      const page: Page | undefined = project.pages[currentPageIndex];
      if (!page) return null;
      if (activeLayerId) return page.layers.find((l: Layer) => l.id === activeLayerId) ?? page.layers[page.layers.length - 1] ?? null;
      return page.layers[page.layers.length - 1] ?? null;
    },

    moveLayerUp: (id) => {
      set((s: { project: Project | null; currentPageIndex: number }) =>
        swapInLayer(s, id, (order) => {
          const idx = order.indexOf(id);
          if (idx < order.length - 1) [order[idx], order[idx + 1]] = [order[idx + 1], order[idx]];
          return order;
        })
      );
    },

    moveLayerDown: (id) => {
      set((s: { project: Project | null; currentPageIndex: number }) =>
        swapInLayer(s, id, (order) => {
          const idx = order.indexOf(id);
          if (idx > 0) [order[idx], order[idx - 1]] = [order[idx - 1], order[idx]];
          return order;
        })
      );
    },

    moveLayerToTop: (id) => {
      set((s: { project: Project | null; currentPageIndex: number }) =>
        swapInLayer(s, id, (order) => [...order.filter((eid) => eid !== id), id])
      );
    },

    moveLayerToBottom: (id) => {
      set((s: { project: Project | null; currentPageIndex: number }) =>
        swapInLayer(s, id, (order) => [id, ...order.filter((eid) => eid !== id)])
      );
    },
  };
}
