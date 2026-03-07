'use client';

/**
 * useCanvasSync — zero-parameter hook.
 *
 * Keeps the Fabric canvas in sync with the Zustand store.
 * All refs from CanvasContext; store subscriptions direct via useEditorStore.
 *
 * Responsibilities:
 *   1. Element render loop (re-renders canvas when elements/mode/bg/grid change)
 *   2. Zoom/dimension sync
 *   3. Section focus auto-zoom + scroll
 */

import { useEffect } from 'react';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { useEditorStore } from '@/stores/editorStore';
import type { CanvasElement, FrameElement, ImageElement } from '@/types/editor';
import { isGradient } from '@/types/editor';
import { toFabricFill } from '@/lib/canvas/fabricHelpers';
import { ensureFontLoaded } from '@/lib/fonts/fontLoader';

export function useCanvasSync() {
  const {
    fabricRef, fabricModuleRef, helpersRef,
    isSyncingRef, fabricUpdateRef, scrollContainerRef, updateOverlayRef, isReady,
  } = useCanvasContext();

  // Store subscriptions (triggers re-run of sync)
  const elements = useEditorStore((s) => s.getCurrentPage()?.elements);
  const layerOrder = useEditorStore((s) => s.getCurrentPage()?.layerOrder);
  const mode = useEditorStore((s) => s.mode);
  const canvasBgColor = useEditorStore((s) => s.project?.canvas.backgroundColor);
  const focusedSectionId = useEditorStore((s) => s.focusedSectionId);
  const showGrid = useEditorStore((s) => s.showGrid);
  const gridSize = useEditorStore((s) => s.gridSize);
  const zoom = useEditorStore((s) => s.zoom);
  const canvasWidth = useEditorStore((s) => s.project?.canvas.width);
  const canvasHeight = useEditorStore((s) => s.project?.canvas.height);
  const project = useEditorStore((s) => s.project);
  const setZoom = useEditorStore((s) => s.setZoom);

  // 1. Element render loop
  // selectedElementIds intentionally EXCLUDED — avoids clear→selection:cleared→rerender loop
  useEffect(() => {
    if (!isReady || !fabricRef.current || !helpersRef.current) return;
    if (fabricUpdateRef.current) { fabricUpdateRef.current = false; return; }

    const canvas = fabricRef.current;
    const helpers = helpersRef.current;

    const syncCanvas = async () => {
      isSyncingRef.current = true;
      const currentSelectedIds = useEditorStore.getState().selectedElementIds;

      canvas.clear();

      const bgFill = project?.canvas.backgroundColor ?? '#ffffff';
      if (isGradient(bgFill)) {
        canvas.backgroundColor = toFabricFill(bgFill, project!.canvas.width, project!.canvas.height) as string;
      } else {
        canvas.backgroundColor = bgFill;
      }

      const latestPage = useEditorStore.getState().getCurrentPage();
      const latestElements = latestPage?.elements;
      if (!latestElements) { canvas.renderAll(); isSyncingRef.current = false; return; }

      const flatOrder = useEditorStore.getState().getFlatRenderOrder();
      const sorted = flatOrder
        .map((id) => latestElements.find((e) => e.id === id))
        .filter((e): e is CanvasElement => !!e);

      for (const el of sorted) {
        if (!el.visible) continue;
        if (el.type === 'text') await ensureFontLoaded((el as import('@/types/editor').TextElement).fontFamily);

        let obj = el.type === 'image'
          ? await helpers.createFabricImage(el as ImageElement)
          : helpers.elementToFabricObject(el);

        if (!obj) continue;

        if (mode === 'consumer' && !el.editable) { obj.selectable = false; obj.evented = false; }
        if (el.locked) { obj.selectable = false; obj.evented = false; }

        // Background: full-canvas shape at index 0 → non-interactive
        if (el.type === 'shape' && el === sorted[0] &&
          el.x <= 0 && el.y <= 0 &&
          el.width >= (canvasWidth ?? 960) && el.height >= (canvasHeight ?? 640)) {
          obj.selectable = false; obj.evented = false;
        }

        // Frame editing mode: dim elements outside active frame
        const editingFrameId = useEditorStore.getState().editingFrameId;
        if (editingFrameId) {
          const activeFrame = sorted.find((pe) => pe.id === editingFrameId) as FrameElement | undefined;
          if (el.id !== editingFrameId && !activeFrame?.childOrder.includes(el.id)) {
            obj.selectable = false; obj.evented = false; obj.opacity = (obj.opacity ?? 1) * 0.3;
          }
        }

        // Section focus mode: dim elements outside focused section
        const focusedId = useEditorStore.getState().focusedSectionId;
        if (focusedId) {
          const focusedSection = sorted.find((pe) => pe.id === focusedId) as FrameElement | undefined;
          if (el.id !== focusedId && !focusedSection?.childOrder.includes(el.id)) {
            obj.selectable = false; obj.evented = false; obj.opacity = (obj.opacity ?? 1) * 0.15;
          }
        }

        canvas.add(obj);

        // Gradient overlay for images
        if (el.type === 'image' && fabricModuleRef.current) {
          const imgEl = el as ImageElement;
          if (imgEl.gradientOverlay?.enabled) {
            const overlayRect = new fabricModuleRef.current.Rect({
              left: el.x, top: el.y,
              width: obj.width! * (obj.scaleX ?? 1),
              height: obj.height! * (obj.scaleY ?? 1),
              angle: el.rotation,
              opacity: imgEl.gradientOverlay.opacity ?? 0.7,
              fill: toFabricFill(imgEl.gradientOverlay.gradient, el.width, el.height),
              selectable: false, evented: false,
              data: { elementId: `${el.id}__gradientOverlay`, isOverlay: true },
            });
            canvas.add(overlayRect);
          }
        }
      }

      // Restore selection
      if (currentSelectedIds.length > 0) {
        const objs = canvas.getObjects().filter((o) => {
          const id = (o as unknown as { data?: { elementId?: string } }).data?.elementId;
          return id && currentSelectedIds.includes(id);
        });
        if (objs.length === 1) canvas.setActiveObject(objs[0]);
        else if (objs.length > 1 && fabricModuleRef.current) {
          canvas.setActiveObject(new fabricModuleRef.current.ActiveSelection(objs, { canvas }));
        }
      }

      // Grid overlay
      if (showGrid && fabricModuleRef.current && project) {
        const { width: cw, height: ch } = project.canvas;
        for (let x = gridSize; x < cw; x += gridSize) {
          canvas.add(new fabricModuleRef.current.Line([x, 0, x, ch], {
            stroke: 'rgba(0,0,0,0.08)', strokeWidth: 1,
            selectable: false, evented: false, data: { isGrid: true },
          }));
        }
        for (let y = gridSize; y < ch; y += gridSize) {
          canvas.add(new fabricModuleRef.current.Line([0, y, cw, y], {
            stroke: 'rgba(0,0,0,0.08)', strokeWidth: 1,
            selectable: false, evented: false, data: { isGrid: true },
          }));
        }
      }

      canvas.renderAll();
      isSyncingRef.current = false;
    };

    syncCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, elements, layerOrder, mode, canvasBgColor, focusedSectionId, showGrid, gridSize]);

  // 2. Zoom / canvas dimension sync
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !project) return;
    canvas.setDimensions({ width: project.canvas.width * zoom, height: project.canvas.height * zoom });
    canvas.setZoom(zoom);
    canvas.renderAll();
    updateOverlayRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, canvasWidth, canvasHeight]);

  // 3. Section focus: auto-zoom + scroll
  useEffect(() => {
    const canvas = fabricRef.current;
    const scrollEl = scrollContainerRef.current;
    if (!canvas || !project || !scrollEl || !isReady) return;

    if (!focusedSectionId) {
      const viewW = scrollEl.clientWidth - 64;
      const viewH = scrollEl.clientHeight - 64;
      const newZoom = Math.round(Math.min(viewW / project.canvas.width, viewH / project.canvas.height, 1) * 10) / 10;
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
    const newZoom = Math.round(Math.min(viewW / section.width, viewH / section.height, 2) * 10) / 10;
    setZoom(newZoom);
    requestAnimationFrame(() => {
      const padding = 32;
      scrollEl.scrollTop = (section.y + section.height / 2) * newZoom + padding - scrollEl.clientHeight / 2;
      scrollEl.scrollLeft = Math.max(0, (section.x + section.width / 2) * newZoom + padding - scrollEl.clientWidth / 2);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedSectionId, isReady]);
}
