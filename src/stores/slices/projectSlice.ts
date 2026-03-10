import { v4 as uuid } from 'uuid';
import type {
  Project,
  Page,
  CanvasElement,
  EditorMode,
  PresetKey,
  FillValue,
} from '@/types/editor';
import { CANVAS_PRESETS, DEFAULT_BACKGROUND_COLOR } from '@/constants/presets';
import { createDefaultPage, migratePageLayers, createDefaultLayer } from '@/stores/storeHelpers';

export interface ProjectSlice {
  project: Project | null;
  currentPageIndex: number;

  initProject: (
    name: string,
    preset: PresetKey,
    mode?: EditorMode,
    templateData?: { elements: CanvasElement[]; backgroundColor?: string },
  ) => void;
  loadProject: (project: Project) => void;
  setCanvasBackground: (color: FillValue) => void;
  setCanvasSize: (width: number, height: number) => void;

  // Page management
  addPage: (name?: string) => void;
  deletePage: (pageId: string) => void;
  renamePage: (pageId: string, name: string) => void;
  setCurrentPageIndex: (index: number) => void;

  // Getters
  getCurrentPage: () => Page | null;
  getElement: (id: string) => CanvasElement | undefined;
  getSelectedElements: () => CanvasElement[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createProjectSlice(set: (fn: any) => void, get: () => any): ProjectSlice {
  return {
    project: null,
    currentPageIndex: 0,

    initProject: (name, preset, mode = 'design', templateData) => {
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

    setCanvasBackground: (color) => {
      set((s: { project: Project | null }) => {
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
      set((s: { project: Project | null }) => {
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

    addPage: (name) => {
      set((s: { project: Project | null; currentPageIndex: number }) => {
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
      set((s: { project: Project | null; currentPageIndex: number }) => {
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
      set((s: { project: Project | null }) => {
        if (!s.project) return s;
        const pages = s.project.pages.map((p) => (p.id === pageId ? { ...p, name } : p));
        return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
      });
    },

    setCurrentPageIndex: (index) => {
      set((s: { project: Project | null; currentPageIndex: number }) => {
        if (!s.project || index < 0 || index >= s.project.pages.length) return s;
        const page = s.project.pages[index];
        return {
          currentPageIndex: index,
          selectedElementIds: [],
          activeLayerId: page?.layers[0]?.id ?? null,
        };
      });
    },

    getCurrentPage: () => {
      const { project, currentPageIndex } = get();
      return project?.pages[currentPageIndex] ?? null;
    },

    getElement: (id) => {
      const page = get().getCurrentPage();
      return page?.elements.find((el: CanvasElement) => el.id === id);
    },

    getSelectedElements: () => {
      const page = get().getCurrentPage();
      const { selectedElementIds } = get();
      if (!page) return [];
      return page.elements.filter((el: CanvasElement) => selectedElementIds.includes(el.id));
    },
  };
}
