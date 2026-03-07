'use client';

/**
 * useCanvasSync
 *
 * Keeps the Fabric.js canvas in sync with the Zustand store.
 * Triggers whenever store data changes: elements, layer order, mode, bg color,
 * focused section, grid settings.
 *
 * Also handles:
 *   - Zoom/dimension changes
 *   - Section focus auto-zoom + scroll
 */

import { useEffect, MutableRefObject } from 'react';
import type * as fabricTypes from 'fabric';
import { useEditorStore } from '@/stores/editorStore';
import type { CanvasElement, FrameElement, ImageElement } from '@/types/editor';
import { isGradient } from '@/types/editor';
import { toFabricFill } from '@/lib/canvas/fabricHelpers';
import { ensureFontLoaded } from '@/lib/fonts/fontLoader';

type FabricHelpers = {
  elementToFabricObject: (el: CanvasElement) => fabricTypes.FabricObject | null;
  createFabricImage: (el: ImageElement) => Promise<fabricTypes.FabricImage | null>;
};

interface UseCanvasSyncOptions {
  fabricRef: MutableRefObject<fabricTypes.Canvas | null>;
  fabricModuleRef: MutableRefObject<typeof fabricTypes | null>;
  helpersRef: MutableRefObject<FabricHelpers | null>;
  isSyncingRef: MutableRefObject<boolean>;
  fabricUpdateRef: MutableRefObject<boolean>;
  scrollContainerRef: MutableRefObject<HTMLDivElement | null>;
  updateOverlayRef: MutableRefObject<(() => void) | null>;
  isReady: boolean;
  // store-derived values (triggers for re-run)
  elements: CanvasElement[] | undefined;
  layerOrder: string[] | undefined;
  mode: string;
  canvasBgColor: string | import('@/types/editor').FillValue | undefined;
  focusedSectionId: string | null;
  showGrid: boolean;
  gridSize: number;
  zoom: number;
  canvasWidth: number | undefined;
  canvasHeight: number | undefined;
  project: import('@/types/editor').Project | null;
  setZoom: (zoom: number) => void;
}

export function useCanvasSync({
  fabricRef,
  fabricModuleRef,
  helpersRef,
  isSyncingRef,
  fabricUpdateRef,
  scrollContainerRef,
  updateOverlayRef,
  isReady,
  elements,
  layerOrder,
  mode,
  canvasBgColor,
  focusedSectionId,
  showGrid,
  gridSize,
  zoom,
  canvasWidth,
  canvasHeight,
  project,
  setZoom,
}: UseCanvasSyncOptions) {
  // ── Canvas data sync: elements / layerOrder / mode / bg / focusedSection / grid ──
  // selectedElementIds intentionally EXCLUDED — avoids clear→selection:cleared→rerender loop
  useEffect(() => {
    if (!isReady || !fabricRef.current || !helpersRef.current) return;

    if (fabricUpdateRef.current) {
      fabricUpdateRef.current = false;
      return;
    }

    const canvas = fabricRef.current;
    const helpers = helpersRef.current;

    const syncCanvas = async () => {
      isSyncingRef.current = true;

      const currentSelectedIds = useEditorStore.getState().selectedElementIds;

      canvas.clear();

      // Apply background (solid or gradient)
      const bgFill = project?.canvas.backgroundColor ?? '#ffffff';
      if (isGradient(bgFill)) {
        canvas.backgroundColor = toFabricFill(bgFill, project!.canvas.width, project!.canvas.height) as string;
      } else {
        canvas.backgroundColor = bgFill;
      }

      // Read LATEST elements from store to avoid race conditions with async syncCanvas
      const latestPage = useEditorStore.getState().getCurrentPage();
      const latestElements = latestPage?.elements;
      if (!latestElements) {
        canvas.renderAll();
        isSyncingRef.current = false;
        return;
      }

      // Use flat render order to properly interleave frame children
      const flatOrder = useEditorStore.getState().getFlatRenderOrder();
      const sorted = flatOrder
        .map((id) => latestElements.find((e) => e.id === id))
        .filter((e): e is CanvasElement => !!e);

      for (const el of sorted) {
        if (!el.visible) continue;

        // Ensure font is loaded before rendering text
        if (el.type === 'text') {
          await ensureFontLoaded((el as import('@/types/editor').TextElement).fontFamily);
        }

        let obj: fabricTypes.FabricObject | null = null;

        if (el.type === 'image') {
          obj = await helpers.createFabricImage(el);
        } else {
          obj = helpers.elementToFabricObject(el);
        }

        if (obj) {
          if (mode === 'consumer' && !el.editable) {
            obj.selectable = false;
            obj.evented = false;
          }
          if (el.locked) {
            obj.selectable = false;
            obj.evented = false;
          }

          // Background detection: full-canvas shape at bottom of stack → non-interactive
          if (
            el.type === 'shape' && el === sorted[0] &&
            el.x <= 0 && el.y <= 0 &&
            el.width >= (canvasWidth ?? 960) && el.height >= (canvasHeight ?? 640)
          ) {
            obj.selectable = false;
            obj.evented = false;
          }

          // Frame editing mode: dim & disable elements outside the active frame
          const currentEditingFrameId = useEditorStore.getState().editingFrameId;
          if (currentEditingFrameId) {
            const activeFrame = sorted.find((pe) => pe.id === currentEditingFrameId) as FrameElement | undefined;
            const isActiveFrame = el.id === currentEditingFrameId;
            const isChildOfActiveFrame = activeFrame?.childOrder.includes(el.id);
            if (!isActiveFrame && !isChildOfActiveFrame) {
              obj.selectable = false;
              obj.evented = false;
              obj.opacity = (obj.opacity ?? 1) * 0.3;
            }
          }

          // Section focus mode: dim & disable elements outside the focused section
          const currentFocusedSectionId = useEditorStore.getState().focusedSectionId;
          if (currentFocusedSectionId) {
            const focusedSection = sorted.find((pe) => pe.id === currentFocusedSectionId) as FrameElement | undefined;
            const isFocusedSection = el.id === currentFocusedSectionId;
            const isChildOfFocusedSection = focusedSection?.childOrder.includes(el.id);
            if (!isFocusedSection && !isChildOfFocusedSection) {
              obj.selectable = false;
              obj.evented = false;
              obj.opacity = (obj.opacity ?? 1) * 0.15;
            }
          }

          // clipPath NOT applied during editing — only at export via applyExportClipPaths()
          canvas.add(obj);

          // Render gradient overlay for images
          if (el.type === 'image') {
            const imgEl = el as ImageElement;
            if (imgEl.gradientOverlay?.enabled && fabricModuleRef.current) {
              const overlayRect = new fabricModuleRef.current.Rect({
                left: el.x,
                top: el.y,
                width: obj.width! * (obj.scaleX ?? 1),
                height: obj.height! * (obj.scaleY ?? 1),
                angle: el.rotation,
                opacity: imgEl.gradientOverlay.opacity ?? 0.7,
                fill: toFabricFill(imgEl.gradientOverlay.gradient, el.width, el.height),
                selectable: false,
                evented: false,
                data: { elementId: `${el.id}__gradientOverlay`, isOverlay: true },
              });
              canvas.add(overlayRect);
            }
          }
        }
      }

      // Restore selection
      if (currentSelectedIds.length > 0) {
        const objects = canvas.getObjects();
        const toSelect = objects.filter((o) => {
          const id = (o as unknown as { data?: { elementId?: string } }).data?.elementId;
          return id && currentSelectedIds.includes(id);
        });
        if (toSelect.length === 1) {
          canvas.setActiveObject(toSelect[0]);
        } else if (toSelect.length > 1 && fabricModuleRef.current) {
          const sel = new fabricModuleRef.current.ActiveSelection(toSelect, { canvas });
          canvas.setActiveObject(sel);
        }
      }

      // Grid overlay
      const showGridNow = useEditorStore.getState().showGrid;
      const gridSizeNow = useEditorStore.getState().gridSize;
      if (showGridNow && fabricModuleRef.current && project) {
        const cw = project.canvas.width;
        const ch = project.canvas.height;
        for (let x = gridSizeNow; x < cw; x += gridSizeNow) {
          const line = new fabricModuleRef.current.Line([x, 0, x, ch], {
            stroke: 'rgba(0,0,0,0.08)',
            strokeWidth: 1,
            selectable: false,
            evented: false,
            data: { isGrid: true },
          });
          canvas.add(line);
        }
        for (let y = gridSizeNow; y < ch; y += gridSizeNow) {
          const line = new fabricModuleRef.current.Line([0, y, cw, y], {
            stroke: 'rgba(0,0,0,0.08)',
            strokeWidth: 1,
            selectable: false,
            evented: false,
            data: { isGrid: true },
          });
          canvas.add(line);
        }
      }

      canvas.renderAll();
      isSyncingRef.current = false;
    };

    syncCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, elements, layerOrder, mode, canvasBgColor, focusedSectionId, showGrid, gridSize]);

  // ── Zoom / canvas dimension sync ──
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !project) return;

    const w = project.canvas.width * zoom;
    const h = project.canvas.height * zoom;
    canvas.setDimensions({ width: w, height: h });
    canvas.setZoom(zoom);
    canvas.renderAll();
    updateOverlayRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, canvasWidth, canvasHeight]);

  // ── Section focus: auto-zoom + scroll to focused section ──
  useEffect(() => {
    const canvas = fabricRef.current;
    const scrollEl = scrollContainerRef.current;
    if (!canvas || !project || !scrollEl || !isReady) return;

    if (!focusedSectionId) {
      // Reset to overview — fit entire canvas
      const viewW = scrollEl.clientWidth - 64;
      const viewH = scrollEl.clientHeight - 64;
      const fitZoom = Math.min(viewW / project.canvas.width, viewH / project.canvas.height, 1);
      const newZoom = Math.round(fitZoom * 10) / 10;
      setZoom(newZoom);
      requestAnimationFrame(() => {
        scrollEl.scrollTop = 0;
        scrollEl.scrollLeft = Math.max(0, (scrollEl.scrollWidth - scrollEl.clientWidth) / 2);
      });
      return;
    }

    const page = useEditorStore.getState().getCurrentPage();
    if (!page) return;
    const section = page.elements.find(
      (el) => el.id === focusedSectionId && el.type === 'frame' && (el as FrameElement).isSection
    ) as FrameElement | undefined;
    if (!section) return;

    const viewW = scrollEl.clientWidth - 64;
    const viewH = scrollEl.clientHeight - 64;
    const zoomX = viewW / section.width;
    const zoomY = viewH / section.height;
    const newZoom = Math.round(Math.min(zoomX, zoomY, 2) * 10) / 10;
    setZoom(newZoom);

    requestAnimationFrame(() => {
      const sectionCenterY = (section.y + section.height / 2) * newZoom;
      const sectionCenterX = (section.x + section.width / 2) * newZoom;
      const padding = 32;
      scrollEl.scrollTop = sectionCenterY + padding - scrollEl.clientHeight / 2;
      scrollEl.scrollLeft = Math.max(0, sectionCenterX + padding - scrollEl.clientWidth / 2);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedSectionId, isReady]);
}
