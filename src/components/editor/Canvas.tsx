'use client';

import {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useState,
  useCallback,
} from 'react';
import type * as fabricTypes from 'fabric';
import { useEditorStore } from '@/stores/editorStore';
import { useHistoryStore } from '@/stores/historyStore';
import type {
  CanvasElement,
  ImageElement,
  ExportOptions,
  ToolType,
  ShapeType,
  FrameElement,
} from '@/types/editor';
import { isGradient } from '@/types/editor';
import { ensureFontLoaded } from '@/lib/fonts/fontLoader';
import { toFabricFill } from '@/lib/canvas/fabricHelpers';
import { initAligningGuidelines } from '@/lib/canvas/alignmentGuides';
import ContextMenu from '@/components/editor/ContextMenu';

export interface CanvasHandle {
  exportCanvas: (filename: string, options: ExportOptions) => void;
  getDataURL: (options: ExportOptions) => string;
}

type FabricHelpers = {
  elementToFabricObject: (
    el: CanvasElement,
  ) => fabricTypes.FabricObject | null;
  createFabricImage: (
    el: ImageElement,
  ) => Promise<fabricTypes.FabricImage | null>;
  fabricObjectToElementUpdate: (
    obj: fabricTypes.FabricObject,
  ) => Partial<CanvasElement>;
};

type FabricExporter = {
  exportAndDownload: (
    canvas: fabricTypes.Canvas,
    filename: string,
    options: ExportOptions,
  ) => void;
  exportCanvasToDataURL: (
    canvas: fabricTypes.Canvas,
    options: ExportOptions,
  ) => string;
};

function getElementId(obj: fabricTypes.FabricObject): string | undefined {
  const rec = obj as unknown as { data?: Record<string, unknown> };
  if (rec.data && typeof rec.data.elementId === 'string') {
    return rec.data.elementId;
  }
  return undefined;
}

const EditorCanvas = forwardRef<CanvasHandle>(function EditorCanvas(_, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<fabricTypes.Canvas | null>(null);
  const helpersRef = useRef<FabricHelpers | null>(null);
  const exporterRef = useRef<FabricExporter | null>(null);
  const fabricUpdateRef = useRef(false);
  // Suppresses fabric selection events during programmatic canvas.clear()/add()
  const isSyncingRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const fabricModuleRef = useRef<typeof fabricTypes | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingImagePosRef = useRef<{ x: number; y: number } | null>(null);
  const updateOverlayRef = useRef<(() => void) | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const project = useEditorStore((s) => s.project);
  const mode = useEditorStore((s) => s.mode);
  const zoom = useEditorStore((s) => s.zoom);
  const selectedElementIds = useEditorStore((s) => s.selectedElementIds);
  const selectElements = useEditorStore((s) => s.selectElements);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const updateElement = useEditorStore((s) => s.updateElement);
  const getCurrentPage = useEditorStore((s) => s.getCurrentPage);
  const setZoom = useEditorStore((s) => s.setZoom);
  const pushState = useHistoryStore((s) => s.pushState);
  const activeTool = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const addShapeElement = useEditorStore((s) => s.addShapeElement);
  const addTextElement = useEditorStore((s) => s.addTextElement);
  const addImageElement = useEditorStore((s) => s.addImageElement);
  const addFrameElement = useEditorStore((s) => s.addFrameElement);
  const addSectionElement = useEditorStore((s) => s.addSectionElement);
  const getFlatRenderOrder = useEditorStore((s) => s.getFlatRenderOrder);
  const removeElements = useEditorStore((s) => s.removeElements);
  const moveToFrame = useEditorStore((s) => s.moveToFrame);
  const moveOutOfFrame = useEditorStore((s) => s.moveOutOfFrame);
  const editingFrameId = useEditorStore((s) => s.editingFrameId);
  const setEditingFrameId = useEditorStore((s) => s.setEditingFrameId);
  const copyElements = useEditorStore((s) => s.copyElements);
  const cutElements = useEditorStore((s) => s.cutElements);
  const pasteElements = useEditorStore((s) => s.pasteElements);
  const duplicateElements = useEditorStore((s) => s.duplicateElements);
  const loadProject = useEditorStore((s) => s.loadProject);
  const nudgeElements = useEditorStore((s) => s.nudgeElements);
  const moveLayerUp = useEditorStore((s) => s.moveLayerUp);
  const moveLayerDown = useEditorStore((s) => s.moveLayerDown);
  const moveLayerToTop = useEditorStore((s) => s.moveLayerToTop);
  const moveLayerToBottom = useEditorStore((s) => s.moveLayerToBottom);
  const currentPageIndex = useEditorStore((s) => s.currentPageIndex);
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);
  const focusedSectionId = useEditorStore((s) => s.focusedSectionId);
  const setFocusedSectionId = useEditorStore((s) => s.setFocusedSectionId);

  const page = getCurrentPage();
  const elements = page?.elements;
  const layerOrder = page?.layerOrder;
  const canvasBgColor = project?.canvas.backgroundColor;
  const canvasWidth = project?.canvas.width;
  const canvasHeight = project?.canvas.height;

  // Dimension overlay & context menu state
  const [selectionInfo, setSelectionInfo] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    elementId: string | null;
  } | null>(null);

  // ── Helper: apply/remove clipPaths for export only ──
  const applyExportClipPaths = useCallback(() => {
    const canvas = fabricRef.current;
    const fabricModule = fabricModuleRef.current;
    if (!canvas || !fabricModule) return;
    const page = useEditorStore.getState().getCurrentPage();
    if (!page) return;
    for (const obj of canvas.getObjects()) {
      const elId = getElementId(obj);
      if (!elId) continue;
      const parentFrame = page.elements.find((pe) =>
        pe.type === 'frame' &&
        (pe as FrameElement).clipContent &&
        (pe as FrameElement).childOrder.includes(elId)
      ) as FrameElement | undefined;
      if (parentFrame) {
        const clipRect = new fabricModule.Rect({
          left: parentFrame.x,
          top: parentFrame.y,
          width: parentFrame.width,
          height: parentFrame.height,
          rx: parentFrame.borderRadius || 0,
          ry: parentFrame.borderRadius || 0,
          absolutePositioned: true,
        });
        obj.clipPath = clipRect;
      }
    }
    canvas.renderAll();
  }, []);

  const removeExportClipPaths = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    for (const obj of canvas.getObjects()) {
      if (obj.clipPath) {
        obj.clipPath = undefined;
      }
    }
    canvas.renderAll();
  }, []);

  useImperativeHandle(ref, () => ({
    exportCanvas: (filename: string, options: ExportOptions) => {
      if (fabricRef.current && exporterRef.current) {
        applyExportClipPaths();
        exporterRef.current.exportAndDownload(
          fabricRef.current,
          filename,
          options,
        );
        removeExportClipPaths();
      }
    },
    getDataURL: (options: ExportOptions) => {
      if (fabricRef.current && exporterRef.current) {
        applyExportClipPaths();
        const result = exporterRef.current.exportCanvasToDataURL(
          fabricRef.current,
          options,
        );
        removeExportClipPaths();
        return result;
      }
      return '';
    },
  }));

  // eslint-disable-next-line react-hooks/exhaustive-deps — Zustand actions are stable refs; project?.id triggers re-init only on project switch
  useEffect(() => {
    const currentProject = useEditorStore.getState().project;
    if (!currentProject || !containerRef.current) return;

    let disposed = false;
    let disposeGuidelines: (() => void) | null = null;

    const init = async () => {
      const fabricModule = await import('fabric');
      fabricModuleRef.current = fabricModule;
      const helpers = await import('@/lib/canvas/fabricHelpers');
      const exporter = await import('@/lib/canvas/exporter');

      if (disposed || !containerRef.current) return;

      helpersRef.current = helpers;
      exporterRef.current = exporter;

      const canvasEl = document.createElement('canvas');
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(canvasEl);

      const canvas = new fabricModule.Canvas(canvasEl, {
        width: currentProject.canvas.width,
        height: currentProject.canvas.height,
        backgroundColor: '#ffffff',
        selection: true,
        fireRightClick: true,
        stopContextMenu: true,
      });

      if (disposed) {
        canvas.dispose();
        return;
      }

      fabricRef.current = canvas;

      // Apply initial background (supports gradient)
      const initBg = currentProject.canvas.backgroundColor;
      if (isGradient(initBg)) {
        canvas.backgroundColor = toFabricFill(initBg, currentProject.canvas.width, currentProject.canvas.height) as string;
      } else {
        canvas.backgroundColor = (initBg as string) || '#ffffff';
      }
      canvas.renderAll();

      // Alignment snap guide lines
      disposeGuidelines = initAligningGuidelines(canvas, fabricModule);

      canvas.on('selection:created', () => {
        if (isSyncingRef.current) return;
        const ids = canvas
          .getActiveObjects()
          .map(getElementId)
          .filter((id): id is string => !!id);
        selectElements(ids);
      });

      canvas.on('selection:updated', () => {
        if (isSyncingRef.current) return;
        const ids = canvas
          .getActiveObjects()
          .map(getElementId)
          .filter((id): id is string => !!id);
        selectElements(ids);
      });

      canvas.on('selection:cleared', () => {
        if (isSyncingRef.current) return;
        clearSelection();
      });

      canvas.on('object:modified', (e) => {
        const target = e.target;
        if (!target || !helpersRef.current) return;
        const elementId = getElementId(target);
        // Handle ActiveSelection (multi-select) — sync all children back to store
        if (!elementId) {
          if (!('getObjects' in target) || !fabricModuleRef.current) return;
          const objects = [...(target as fabricTypes.ActiveSelection).getObjects()];
          if (objects.length === 0) return;

          const currentPage = useEditorStore.getState().getCurrentPage();
          if (currentPage) pushState(currentPage);
          fabricUpdateRef.current = true;

          // Discard selection to get absolute coordinates
          isSyncingRef.current = true;
          canvas.discardActiveObject();
          isSyncingRef.current = false;

          // Read absolute positions and sync to store
          for (const obj of objects) {
            const childId = getElementId(obj);
            if (!childId || !helpersRef.current) continue;
            updateElement(childId, helpersRef.current.fabricObjectToElementUpdate(obj));
          }

          // Re-create selection
          isSyncingRef.current = true;
          const sel = new fabricModuleRef.current.ActiveSelection(objects, { canvas });
          canvas.setActiveObject(sel);
          isSyncingRef.current = false;
          canvas.requestRenderAll();
          return;
        }

        const currentPage = useEditorStore.getState().getCurrentPage();
        if (currentPage) pushState(currentPage);

        fabricUpdateRef.current = true;
        const update = helpersRef.current.fabricObjectToElementUpdate(target);
        updateElement(elementId, update);

        // If this is a frame, move all children by the same delta
        const el = useEditorStore.getState().getElement(elementId);
        if (el && el.type === 'frame') {
          const frame = el as FrameElement;
          const dx = (update.x ?? el.x) - el.x;
          const dy = (update.y ?? el.y) - el.y;
          if (dx !== 0 || dy !== 0) {
            for (const childId of frame.childOrder) {
              const child = useEditorStore.getState().getElement(childId);
              if (child) {
                updateElement(childId, { x: child.x + dx, y: child.y + dy });
              }
            }
          }
        }
        // Auto-parent: if a non-frame element is dropped inside a frame, add to frame
        if (el && el.type !== 'frame') {
          const allEls = useEditorStore.getState().getCurrentPage()?.elements ?? [];
          const cx = (update.x ?? el.x) + el.width / 2;
          const cy = (update.y ?? el.y) + el.height / 2;
          const alreadyInFrame = allEls.some(
            (fe) => fe.type === 'frame' && (fe as FrameElement).childOrder.includes(el.id)
          );
          if (!alreadyInFrame) {
            const targetFrame = allEls.find(
              (fe) =>
                fe.type === 'frame' &&
                cx >= fe.x && cx <= fe.x + fe.width &&
                cy >= fe.y && cy <= fe.y + fe.height
            );
            if (targetFrame) {
              useEditorStore.getState().moveToFrame([elementId], targetFrame.id);
            }
          }
        }
      });

      canvas.on('object:moving', (e) => {
        const target = e.target;
        if (!target || !helpersRef.current) return;
        const elementId = getElementId(target);
        // Handle ActiveSelection (multi-select) — sync all children positions during drag
        if (!elementId) {
          if (!('getObjects' in target)) return;
          fabricUpdateRef.current = true;
          const gLeft = target.left ?? 0;
          const gTop = target.top ?? 0;
          for (const obj of (target as fabricTypes.ActiveSelection).getObjects()) {
            const childId = getElementId(obj);
            if (!childId) continue;
            // Object left/top are relative to group center; group left/top is the center offset
            updateElement(childId, { x: gLeft + (obj.left ?? 0), y: gTop + (obj.top ?? 0) });
          }
          return;
        }

        fabricUpdateRef.current = true;
        const update = helpersRef.current.fabricObjectToElementUpdate(target);
        const el = useEditorStore.getState().getElement(elementId);

        // Move children with frame — update store AND canvas objects directly
        if (el && el.type === 'frame') {
          const frame = el as FrameElement;
          const dx = (update.x ?? el.x) - el.x;
          const dy = (update.y ?? el.y) - el.y;
          if (dx !== 0 || dy !== 0) {
            const childIdSet = new Set(frame.childOrder);
            // Update store positions
            for (const childId of frame.childOrder) {
              const child = useEditorStore.getState().getElement(childId);
              if (child) {
                updateElement(childId, { x: child.x + dx, y: child.y + dy });
              }
            }
            // Move Fabric objects on canvas directly (including gradient overlays)
            for (const canvasObj of canvas.getObjects()) {
              const objId = getElementId(canvasObj);
              if (!objId) continue;
              // Match child elements or their gradient overlays
              const baseId = objId.endsWith('__gradientOverlay') ? objId.replace('__gradientOverlay', '') : objId;
              if (childIdSet.has(baseId)) {
                canvasObj.left = (canvasObj.left ?? 0) + dx;
                canvasObj.top = (canvasObj.top ?? 0) + dy;
                // Update clipPath position to match new frame position
                if (canvasObj.clipPath) {
                  canvasObj.clipPath.left = (canvasObj.clipPath.left ?? 0) + dx;
                  canvasObj.clipPath.top = (canvasObj.clipPath.top ?? 0) + dy;
                }
                canvasObj.setCoords();
              }
            }
            canvas.requestRenderAll();
          }
        }

        updateElement(elementId, update);
      });

      // Inline text editing — sync content back to store on exit
      canvas.on('text:editing:exited', (e: { target: fabricTypes.FabricObject }) => {
        const target = e.target;
        if (!target || !helpersRef.current) return;
        const elementId = getElementId(target);
        if (!elementId) return;

        const currentPage = useEditorStore.getState().getCurrentPage();
        if (currentPage) pushState(currentPage);

        fabricUpdateRef.current = true;
        updateElement(
          elementId,
          helpersRef.current.fabricObjectToElementUpdate(target),
        );
      });

      // Double-click: enter frame editing mode, start text editing, or exit frame editing
      canvas.on('mouse:dblclick', (e) => {
        const target = e.target;
        if (!target) {
          // Click on empty area — exit frame editing
          useEditorStore.getState().setEditingFrameId(null);
          return;
        }
        const eid = getElementId(target);
        if (!eid) return;
        const clickedEl = useEditorStore.getState().getElement(eid);
        if (clickedEl && clickedEl.type === 'frame') {
          // Enter this frame
          useEditorStore.getState().setEditingFrameId(eid);
        } else if (clickedEl && clickedEl.type === 'text' && 'enterEditing' in target) {
          // Enter text inline editing
          (target as unknown as { enterEditing: () => void }).enterEditing();
          canvas.requestRenderAll();
        }
      });

      // ── Dimension overlay ──
      const updateDimensionOverlay = () => {
        if (isSyncingRef.current) return;
        const active = canvas.getActiveObject();
        if (!active) { setSelectionInfo(null); return; }
        const bound = active.getBoundingRect();
        const z = canvas.getZoom();
        const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
        setSelectionInfo({
          left: bound.left * z + vpt[4],
          top: (bound.top + bound.height) * z + vpt[5] + 8,
          width: Math.round((active.width ?? 0) * (active.scaleX ?? 1)),
          height: Math.round((active.height ?? 0) * (active.scaleY ?? 1)),
        });
      };
      updateOverlayRef.current = updateDimensionOverlay;

      canvas.on('selection:created', updateDimensionOverlay);
      canvas.on('selection:updated', updateDimensionOverlay);
      canvas.on('selection:cleared', () => setSelectionInfo(null));
      canvas.on('object:moving', updateDimensionOverlay);
      canvas.on('object:scaling', updateDimensionOverlay);
      canvas.on('object:rotating', updateDimensionOverlay);
      canvas.on('object:modified', updateDimensionOverlay);

      // ── Alt+drag duplicate ──
      let altDragDuplicated = false;
      canvas.on('mouse:down', (opt) => {
        const me = opt.e as MouseEvent;
        if (me.altKey && me.button === 0 && opt.target) {
          const state = useEditorStore.getState();
          const ids = state.selectedElementIds;
          if (ids.length > 0) {
            // Save state for undo, then duplicate at same position (offset 0,0)
            const currentPage = state.getCurrentPage();
            if (currentPage) pushState(currentPage);
            duplicateElements(ids, { x: 0, y: 0 });
            // duplicateElements selects the new copies; re-select originals so user drags them away
            selectElements(ids);
            altDragDuplicated = true;
          }
        } else {
          altDragDuplicated = false;
        }
      });

      // ── Right-click context menu ──
      canvas.on('mouse:down', (opt) => {
        const me = opt.e as MouseEvent;
        if (me.button === 2) {
          const targetId = opt.target ? getElementId(opt.target) : null;
          if (targetId) {
            const state = useEditorStore.getState();
            if (!state.selectedElementIds.includes(targetId)) {
              canvas.setActiveObject(opt.target!);
              canvas.renderAll();
              selectElements([targetId]);
            }
          }
          setContextMenu({ x: me.clientX, y: me.clientY, elementId: targetId ?? null });
        } else {
          setContextMenu(null);
        }
      });

      setIsReady(true);
    };

    init();

    return () => {
      disposed = true;
      disposeGuidelines?.();
      setIsReady(false);
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [project?.id]);

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

      if (!elements) {
        canvas.renderAll();
        isSyncingRef.current = false;
        return;
      }

      // Use flat render order to properly interleave frame children
      const flatOrder = useEditorStore.getState().getFlatRenderOrder();
      const sorted = flatOrder
        .map((id) => elements.find((e) => e.id === id))
        .filter((e): e is CanvasElement => !!e);

      for (const el of sorted) {
        if (!el.visible) continue;

        // Ensure font is loaded before rendering text on canvas
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

          // clipPath is NOT applied during editing so elements can be
          // freely moved beyond section/frame boundaries. Clipping is
          // applied only at export time via applyExportClipPaths().
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

      if (currentSelectedIds.length > 0) {
        const objects = canvas.getObjects();
        const toSelect = objects.filter((o) => {
          const id = getElementId(o);
          return id && currentSelectedIds.includes(id);
        });
        if (toSelect.length === 1) {
          canvas.setActiveObject(toSelect[0]);
        } else if (toSelect.length > 1 && fabricModuleRef.current) {
          const sel = new fabricModuleRef.current.ActiveSelection(toSelect, { canvas });
          canvas.setActiveObject(sel);
        }
      }

      canvas.renderAll();

      isSyncingRef.current = false;
    };

    syncCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, elements, layerOrder, mode, canvasBgColor, focusedSectionId]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !project) return;

    const w = project.canvas.width * zoom;
    const h = project.canvas.height * zoom;
    canvas.setDimensions({ width: w, height: h });
    canvas.setZoom(zoom);
    canvas.renderAll();
    // Update dimension overlay after zoom change
    updateOverlayRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, canvasWidth, canvasHeight]);

  // ━━━ Section focus: auto-zoom + scroll to focused section ━━━
  useEffect(() => {
    const canvas = fabricRef.current;
    const scrollEl = scrollContainerRef.current;
    if (!canvas || !project || !scrollEl || !isReady) return;

    if (!focusedSectionId) {
      // Reset to overview — fit entire canvas
      const viewW = scrollEl.clientWidth - 64; // subtract padding
      const viewH = scrollEl.clientHeight - 64;
      const fitZoom = Math.min(viewW / project.canvas.width, viewH / project.canvas.height, 1);
      const newZoom = Math.round(fitZoom * 10) / 10;
      setZoom(newZoom);
      // Reset scroll to top-center after zoom applies
      requestAnimationFrame(() => {
        scrollEl.scrollTop = 0;
        scrollEl.scrollLeft = Math.max(0, (scrollEl.scrollWidth - scrollEl.clientWidth) / 2);
      });
      return;
    }

    // Find the focused section element
    const page = useEditorStore.getState().getCurrentPage();
    if (!page) return;
    const section = page.elements.find(
      (el) => el.id === focusedSectionId && el.type === 'frame' && (el as FrameElement).isSection
    ) as FrameElement | undefined;
    if (!section) return;

    // Calculate zoom to fit section width in viewport
    const viewW = scrollEl.clientWidth - 64;
    const viewH = scrollEl.clientHeight - 64;
    const zoomX = viewW / section.width;
    const zoomY = viewH / section.height;
    const newZoom = Math.round(Math.min(zoomX, zoomY, 2) * 10) / 10;
    setZoom(newZoom);

    // Scroll to center the section after zoom applies
    requestAnimationFrame(() => {
      const sectionCenterY = (section.y + section.height / 2) * newZoom;
      const sectionCenterX = (section.x + section.width / 2) * newZoom;
      const padding = 32; // p-8 = 32px
      scrollEl.scrollTop = sectionCenterY + padding - scrollEl.clientHeight / 2;
      scrollEl.scrollLeft = Math.max(0, sectionCenterX + padding - scrollEl.clientWidth / 2);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedSectionId, isReady]);

  // ━━━ Tool behavior effect ━━━
  // Reacts to activeTool changes and sets up appropriate canvas interaction
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const canvas = fabricRef.current;
    const fabricModule = fabricModuleRef.current;
    if (!canvas || !isReady || !fabricModule) return;

    // ── State for hand tool panning ──
    let isPanning = false;
    let lastPanX = 0;
    let lastPanY = 0;

    // ── Helper: map tool name to ShapeType ──
    const toolToShape: Partial<Record<ToolType, ShapeType>> = {
      rectangle: 'rect',
      circle: 'circle',
      line: 'line',
    };

    // ── Configure canvas for current tool ──
    const isMoveTool = activeTool === 'move';
    const isHandTool = activeTool === 'hand';
    const isPlacementTool = ['rectangle', 'circle', 'line', 'text', 'image', 'frame', 'section'].includes(activeTool);

    // Selection mode
    canvas.selection = isMoveTool;
    canvas.defaultCursor = isHandTool ? 'grab' : isPlacementTool ? 'crosshair' : 'default';

    // Toggle object selectability based on tool
    canvas.getObjects().forEach((obj) => {
      if (isMoveTool) {
        // Restore selectability (respecting locked state)
        const rec = obj as unknown as { data?: Record<string, unknown> };
        const elId = rec.data?.elementId as string | undefined;
        if (elId) {
          const el = useEditorStore.getState().getElement(elId);
          const isLocked = el?.locked ?? false;
          const isConsumerRestricted = mode === 'consumer' && el && !el.editable;
          obj.selectable = !isLocked && !isConsumerRestricted;
          obj.evented = !isLocked && !isConsumerRestricted;
        }
      } else {
        obj.selectable = false;
        obj.evented = isHandTool ? false : true; // Keep evented for click-through detection on placement tools
      }
    });
    canvas.discardActiveObject();
    canvas.renderAll();

    // ── Hand tool handlers ──
    const onHandDown = (e: { e: Event }) => {
      if (isSyncingRef.current) return;
      isPanning = true;
      const me = e.e as MouseEvent;
      lastPanX = me.clientX;
      lastPanY = me.clientY;
      canvas.defaultCursor = 'grabbing';
      canvas.renderAll();
    };

    const onHandMove = (e: { e: Event }) => {
      if (!isPanning) return;
      const me = e.e as MouseEvent;
      const dx = me.clientX - lastPanX;
      const dy = me.clientY - lastPanY;
      lastPanX = me.clientX;
      lastPanY = me.clientY;
      canvas.relativePan(new fabricModule.Point(dx, dy));
    };

    const onHandUp = () => {
      isPanning = false;
      canvas.defaultCursor = 'grab';
      canvas.renderAll();
    };

    // ── Placement tool handler (shapes, text, image) ──
    const onPlacementDown = (opt: { e: Event; scenePoint: fabricTypes.Point; target?: fabricTypes.FabricObject }) => {
      if (isSyncingRef.current) return;
      // Only place on empty canvas area, not on existing objects
      if (opt.target) return;

      const x = Math.round(opt.scenePoint.x);
      const y = Math.round(opt.scenePoint.y);

      const currentPage = useEditorStore.getState().getCurrentPage();
      if (currentPage) pushState(currentPage);

      const shapeType = toolToShape[activeTool];
      if (shapeType) {
        const id = addShapeElement(shapeType);
        updateElement(id, { x, y });
        setActiveTool('move');
        return;
      }

      if (activeTool === 'frame') {
        const id = addFrameElement(x, y);
        void id; // auto-placed at (x,y)
        setActiveTool('move');
        return;
      }

      if (activeTool === 'section') {
        const id = addSectionElement(y);
        void id;
        setActiveTool('move');
        return;
      }

      if (activeTool === 'text') {
        const id = addTextElement();
        updateElement(id, { x, y });
        setActiveTool('move');
        return;
      }

      if (activeTool === 'image') {
        pendingImagePosRef.current = { x, y };
        // Trigger file picker
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
          fileInputRef.current.click();
        }
        return;
      }
    };

    // ── Register handlers ──
    if (isHandTool) {
      canvas.on('mouse:down', onHandDown);
      canvas.on('mouse:move', onHandMove);
      canvas.on('mouse:up', onHandUp);
    } else if (isPlacementTool) {
      canvas.on('mouse:down', onPlacementDown as (e: unknown) => void);
    }

    return () => {
      // Clean up tool-specific handlers
      canvas.off('mouse:down', onHandDown);
      canvas.off('mouse:move', onHandMove);
      canvas.off('mouse:up', onHandUp);
      canvas.off('mouse:down', onPlacementDown as (e: unknown) => void);
      // Restore defaults
      canvas.defaultCursor = 'default';
    };
  }, [activeTool, isReady, mode, pushState, addShapeElement, addTextElement, addFrameElement, updateElement, setActiveTool]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(Math.round((zoom + delta) * 10) / 10);
      }
    },
    [zoom, setZoom],
  );

  // ── Delete / Backspace key handler ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const ids = useEditorStore.getState().selectedElementIds;
        if (ids.length > 0) {
          e.preventDefault();
          const currentPage = useEditorStore.getState().getCurrentPage();
          if (currentPage) pushState(currentPage);
          removeElements(ids);
        }
      }

      // Copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        const ids = useEditorStore.getState().selectedElementIds;
        if (ids.length > 0) {
          e.preventDefault();
          copyElements();
        }
      }

      // Cut
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        const ids = useEditorStore.getState().selectedElementIds;
        if (ids.length > 0) {
          e.preventDefault();
          const currentPage = useEditorStore.getState().getCurrentPage();
          if (currentPage) pushState(currentPage);
          cutElements();
        }
      }

      // Paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (useEditorStore.getState().clipboardElements.length > 0) {
          e.preventDefault();
          pasteElements();
        }
      }

      // Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        const ids = useEditorStore.getState().selectedElementIds;
        if (ids.length > 0) {
          e.preventDefault();
          const currentPage = useEditorStore.getState().getCurrentPage();
          if (currentPage) pushState(currentPage);
          duplicateElements(ids);
        }
      }

      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const page = useHistoryStore.getState().undo();
        const proj = useEditorStore.getState().project;
        const idx = useEditorStore.getState().currentPageIndex;
        if (page && proj) {
          loadProject({ ...proj, pages: proj.pages.map((p, i) => (i === idx ? page : p)) });
        }
      }

      // Redo
      if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        const page = useHistoryStore.getState().redo();
        const proj = useEditorStore.getState().project;
        const idx = useEditorStore.getState().currentPageIndex;
        if (page && proj) {
          loadProject({ ...proj, pages: proj.pages.map((p, i) => (i === idx ? page : p)) });
        }
      }

      // Select All
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        const pg = useEditorStore.getState().getCurrentPage();
        if (pg) {
          const allIds = pg.elements
            .filter((el) => el.visible && !el.locked)
            .map((el) => el.id);
          if (allIds.length > 0) {
            selectElements(allIds);
          }
        }
      }

      // Arrow keys: nudge selected elements (1px, 10px with Shift)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const ids = useEditorStore.getState().selectedElementIds;
        if (ids.length > 0) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          let dx = 0, dy = 0;
          switch (e.key) {
            case 'ArrowLeft':  dx = -step; break;
            case 'ArrowRight': dx = step; break;
            case 'ArrowUp':    dy = -step; break;
            case 'ArrowDown':  dy = step; break;
          }
          nudgeElements(ids, dx, dy);
        }
      }

      // ⌘] / ⌘[ : move element up/down in z-order
      // ⌘⌥] / ⌘⌥[ : move element to top/bottom
      if ((e.ctrlKey || e.metaKey) && (e.key === ']' || e.key === '[')) {
        const ids = useEditorStore.getState().selectedElementIds;
        if (ids.length === 1) {
          e.preventDefault();
          const id = ids[0];
          if (e.altKey) {
            e.key === ']' ? moveLayerToTop(id) : moveLayerToBottom(id);
          } else {
            e.key === ']' ? moveLayerUp(id) : moveLayerDown(id);
          }
        }
      }

      // Zoom: ⌘0 (fit), ⌘1 (100%), ⌘+ (zoom in), ⌘- (zoom out)
      if ((e.ctrlKey || e.metaKey) && (e.key === '0' || e.key === '1' || e.key === '=' || e.key === '+' || e.key === '-')) {
        e.preventDefault();
        const currentZoom = useEditorStore.getState().zoom;
        if (e.key === '0') setZoom(1);
        else if (e.key === '1') setZoom(1);
        else if (e.key === '=' || e.key === '+') setZoom(Math.min(currentZoom + 0.1, 5));
        else if (e.key === '-') setZoom(Math.max(currentZoom - 0.1, 0.1));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pushState, removeElements, copyElements, cutElements, pasteElements, duplicateElements, loadProject, selectElements, nudgeElements, moveLayerUp, moveLayerDown, moveLayerToTop, moveLayerToBottom, setZoom]);

  // ── Image file input handler ──
  const handleImageFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const pos = pendingImagePosRef.current ?? { x: 100, y: 100 };

        const currentPage = useEditorStore.getState().getCurrentPage();
        if (currentPage) pushState(currentPage);

        const id = addImageElement(dataUrl, file.name);
        updateElement(id, { x: pos.x, y: pos.y });
        pendingImagePosRef.current = null;
        setActiveTool('move');
      };
      reader.readAsDataURL(file);
    },
    [pushState, addImageElement, updateElement, setActiveTool],
  );

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-auto bg-[#f0f0f0]"
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Hidden file input for image tool */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />
      <div className="flex justify-center p-8" style={{ minHeight: '100%' }}>
        <div className="relative shrink-0 self-start">
          <div ref={containerRef} className="shadow-lg" />
          {/* Dimension overlay badge */}
          {selectionInfo && (
            <div
              className="absolute pointer-events-none z-10"
              style={{ left: selectionInfo.left, top: selectionInfo.top }}
            >
              <div className="bg-blue-500 text-white text-[11px] px-1.5 py-0.5 rounded whitespace-nowrap font-mono shadow-sm">
                {selectionInfo.width} × {selectionInfo.height}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          elementId={contextMenu.elementId}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
});

export default EditorCanvas;
