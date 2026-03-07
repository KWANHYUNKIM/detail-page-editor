import { v4 as uuid } from 'uuid';
import type { Layer, Page } from '@/types/editor';

// ─── Pure helper functions shared across store slices ───────────────────────

/** Derive flat layerOrder from layers (bottom → top, each layer's elements in order) */
export function deriveLayerOrder(layers: Layer[]): string[] {
  return layers.flatMap((l) => l.elementIds);
}

/** Create a default layer */
export function createDefaultLayer(name = '레이어 1'): Layer {
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
export function createDefaultPage(name = '페이지 1'): Page {
  const layer = createDefaultLayer();
  return { id: uuid(), name, elements: [], layers: [layer], layerOrder: [] };
}

/** Migrate a page that doesn't have layers (backward compat) */
export function migratePageLayers(page: Page): Page {
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
export function findElementLayerIndex(layers: Layer[], elementId: string): number {
  return layers.findIndex((l) => l.elementIds.includes(elementId));
}

/** Add element to a specific layer and recompute layerOrder */
export function addElementToLayer(page: Page, layerId: string, elementId: string): Page {
  const layers = page.layers.map((l) =>
    l.id === layerId ? { ...l, elementIds: [...l.elementIds, elementId] } : l
  );
  return { ...page, layers, layerOrder: deriveLayerOrder(layers) };
}

/** Remove element IDs from all layers and recompute layerOrder */
export function removeElementsFromLayers(page: Page, ids: Set<string>): Page {
  const layers = page.layers.map((l) => ({
    ...l,
    elementIds: l.elementIds.filter((eid) => !ids.has(eid)),
  }));
  return { ...page, layers, layerOrder: deriveLayerOrder(layers) };
}
