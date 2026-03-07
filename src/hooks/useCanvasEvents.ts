'use client';

/**
 * useCanvasEvents
 *
 * Registers all persistent Fabric.js canvas event listeners:
 *   - selection:created / updated / cleared  → sync to store
 *   - object:modified                        → sync element + frame children + auto-parent/unparent
 *   - object:moving                          → live sync during drag
 *   - text:editing:exited                    → sync text content
 *   - mouse:dblclick                         → enter frame/text editing
 *   - dimension overlay update listeners
 *   - Alt+drag duplicate
 *   - Right-click context menu
 */

import { useEffect, MutableRefObject, Dispatch, SetStateAction } from 'react';
import type * as fabricTypes from 'fabric';
import { useEditorStore } from '@/stores/editorStore';
import type { CanvasElement, FrameElement, Page } from '@/types/editor';

type FabricHelpers = {
  fabricObjectToElementUpdate: (obj: fabricTypes.FabricObject) => Partial<CanvasElement>;
};

function getElementId(obj: fabricTypes.FabricObject): string | undefined {
  const rec = obj as unknown as { data?: Record<string, unknown> };
  if (rec.data && typeof rec.data.elementId === 'string') return rec.data.elementId;
  return undefined;
}

interface SelectionInfo {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface ContextMenuState {
  x: number;
  y: number;
  elementId: string | null;
}

interface UseCanvasEventsOptions {
  fabricRef: MutableRefObject<fabricTypes.Canvas | null>;
  fabricModuleRef: MutableRefObject<typeof fabricTypes | null>;
  helpersRef: MutableRefObject<FabricHelpers | null>;
  isSyncingRef: MutableRefObject<boolean>;
  fabricUpdateRef: MutableRefObject<boolean>;
  updateOverlayRef: MutableRefObject<(() => void) | null>;
  isReady: boolean;
  selectElements: (ids: string[]) => void;
  clearSelection: () => void;
  updateElement: (id: string, update: Partial<CanvasElement>) => void;
  moveToFrame: (ids: string[], frameId: string) => void;
  moveOutOfFrame: (ids: string[]) => void;
  duplicateElements: (ids: string[], offset?: { x: number; y: number }) => void;
  pushState: (page: Page) => void;
  setSelectionInfo: Dispatch<SetStateAction<SelectionInfo | null>>;
  setContextMenu: Dispatch<SetStateAction<ContextMenuState | null>>;
}

export function useCanvasEvents({
  fabricRef,
  fabricModuleRef,
  helpersRef,
  isSyncingRef,
  fabricUpdateRef,
  updateOverlayRef,
  isReady,
  selectElements,
  clearSelection,
  updateElement,
  moveToFrame,
  moveOutOfFrame,
  duplicateElements,
  pushState,
  setSelectionInfo,
  setContextMenu,
}: UseCanvasEventsOptions) {
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !isReady) return;

    // ── Selection sync ──
    const onSelectionCreated = () => {
      if (isSyncingRef.current) return;
      const ids = canvas.getActiveObjects().map(getElementId).filter((id): id is string => !!id);
      selectElements(ids);
    };
    const onSelectionUpdated = () => {
      if (isSyncingRef.current) return;
      const ids = canvas.getActiveObjects().map(getElementId).filter((id): id is string => !!id);
      selectElements(ids);
    };
    const onSelectionCleared = () => {
      if (isSyncingRef.current) return;
      clearSelection();
    };

    // ── object:modified ──
    const onObjectModified = (e: { target: fabricTypes.FabricObject }) => {
      const target = e.target;
      const helpers = helpersRef.current;
      if (!target || !helpers) return;
      const elementId = getElementId(target);

      // Multi-select (ActiveSelection)
      if (!elementId) {
        if (!('getObjects' in target) || !fabricModuleRef.current) return;
        const objects = [...(target as fabricTypes.ActiveSelection).getObjects()];
        if (objects.length === 0) return;

        const currentPage = useEditorStore.getState().getCurrentPage();
        if (currentPage) pushState(currentPage);
        fabricUpdateRef.current = true;

        isSyncingRef.current = true;
        canvas.discardActiveObject();
        isSyncingRef.current = false;

        for (const obj of objects) {
          const childId = getElementId(obj);
          if (!childId) continue;
          updateElement(childId, helpers.fabricObjectToElementUpdate(obj));
        }

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
      const update = helpers.fabricObjectToElementUpdate(target);
      updateElement(elementId, update);

      const el = useEditorStore.getState().getElement(elementId);

      // Move frame children by same delta
      if (el && el.type === 'frame') {
        const frame = el as FrameElement;
        const dx = (update.x ?? el.x) - el.x;
        const dy = (update.y ?? el.y) - el.y;
        if (dx !== 0 || dy !== 0) {
          for (const childId of frame.childOrder) {
            const child = useEditorStore.getState().getElement(childId);
            if (child) updateElement(childId, { x: child.x + dx, y: child.y + dy });
          }
        }
      }

      // Auto-parent / auto-unparent
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
          if (targetFrame) moveToFrame([elementId], targetFrame.id);
        } else {
          const parentFrame = allEls.find(
            (fe) => fe.type === 'frame' && (fe as FrameElement).childOrder.includes(el.id)
          ) as FrameElement | undefined;
          if (parentFrame) {
            const isOutside =
              cx < parentFrame.x || cx > parentFrame.x + parentFrame.width ||
              cy < parentFrame.y || cy > parentFrame.y + parentFrame.height;
            if (isOutside) moveOutOfFrame([elementId]);
          }
        }
      }
    };

    // ── object:moving ──
    const onObjectMoving = (e: { target: fabricTypes.FabricObject }) => {
      const target = e.target;
      const helpers = helpersRef.current;
      if (!target || !helpers) return;
      const elementId = getElementId(target);

      // Multi-select
      if (!elementId) {
        if (!('getObjects' in target)) return;
        fabricUpdateRef.current = true;
        const gLeft = target.left ?? 0;
        const gTop = target.top ?? 0;
        for (const obj of (target as fabricTypes.ActiveSelection).getObjects()) {
          const childId = getElementId(obj);
          if (!childId) continue;
          updateElement(childId, { x: gLeft + (obj.left ?? 0), y: gTop + (obj.top ?? 0) });
        }
        return;
      }

      fabricUpdateRef.current = true;
      const update = helpers.fabricObjectToElementUpdate(target);
      const el = useEditorStore.getState().getElement(elementId);

      // Move frame children live
      if (el && el.type === 'frame') {
        const frame = el as FrameElement;
        const dx = (update.x ?? el.x) - el.x;
        const dy = (update.y ?? el.y) - el.y;
        if (dx !== 0 || dy !== 0) {
          const childIdSet = new Set(frame.childOrder);
          for (const childId of frame.childOrder) {
            const child = useEditorStore.getState().getElement(childId);
            if (child) updateElement(childId, { x: child.x + dx, y: child.y + dy });
          }
          for (const canvasObj of canvas.getObjects()) {
            const objId = getElementId(canvasObj);
            if (!objId) continue;
            const baseId = objId.endsWith('__gradientOverlay') ? objId.replace('__gradientOverlay', '') : objId;
            if (childIdSet.has(baseId)) {
              canvasObj.left = (canvasObj.left ?? 0) + dx;
              canvasObj.top = (canvasObj.top ?? 0) + dy;
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
    };

    // ── text:editing:exited ──
    const onTextEditingExited = (e: { target: fabricTypes.FabricObject }) => {
      const target = e.target;
      const helpers = helpersRef.current;
      if (!target || !helpers) return;
      const elementId = getElementId(target);
      if (!elementId) return;

      const currentPage = useEditorStore.getState().getCurrentPage();
      if (currentPage) pushState(currentPage);
      fabricUpdateRef.current = true;
      updateElement(elementId, helpers.fabricObjectToElementUpdate(target));
    };

    // ── mouse:dblclick ──
    const onDblClick = (e: { target?: fabricTypes.FabricObject }) => {
      const target = e.target;
      if (!target) {
        useEditorStore.getState().setEditingFrameId(null);
        return;
      }
      const eid = getElementId(target);
      if (!eid) return;
      const clickedEl = useEditorStore.getState().getElement(eid);
      if (clickedEl && clickedEl.type === 'frame') {
        useEditorStore.getState().setEditingFrameId(eid);
      } else if (clickedEl && clickedEl.type === 'text' && 'enterEditing' in target) {
        (target as unknown as { enterEditing: () => void }).enterEditing();
        canvas.requestRenderAll();
      }
    };

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

    // ── Alt+drag duplicate ──
    const onMouseDownAlt = (opt: { e: Event; target?: fabricTypes.FabricObject }) => {
      const me = opt.e as MouseEvent;
      if (me.altKey && me.button === 0 && opt.target) {
        const state = useEditorStore.getState();
        const ids = state.selectedElementIds;
        if (ids.length > 0) {
          const currentPage = state.getCurrentPage();
          if (currentPage) pushState(currentPage);
          duplicateElements(ids, { x: 0, y: 0 });
          selectElements(ids);
        }
      }
    };

    // ── Right-click context menu ──
    const onMouseDownContext = (opt: { e: Event; target?: fabricTypes.FabricObject }) => {
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
    };

    canvas.on('selection:created', onSelectionCreated);
    canvas.on('selection:updated', onSelectionUpdated);
    canvas.on('selection:cleared', onSelectionCleared);
    canvas.on('object:modified', onObjectModified as (e: unknown) => void);
    canvas.on('object:moving', onObjectMoving as (e: unknown) => void);
    canvas.on('text:editing:exited', onTextEditingExited as (e: unknown) => void);
    canvas.on('mouse:dblclick', onDblClick as (e: unknown) => void);
    canvas.on('selection:created', updateDimensionOverlay);
    canvas.on('selection:updated', updateDimensionOverlay);
    canvas.on('selection:cleared', () => setSelectionInfo(null));
    canvas.on('object:moving', updateDimensionOverlay);
    canvas.on('object:scaling', updateDimensionOverlay);
    canvas.on('object:rotating', updateDimensionOverlay);
    canvas.on('object:modified', updateDimensionOverlay);
    canvas.on('mouse:down', onMouseDownAlt as (e: unknown) => void);
    canvas.on('mouse:down', onMouseDownContext as (e: unknown) => void);

    return () => {
      canvas.off('selection:created', onSelectionCreated);
      canvas.off('selection:updated', onSelectionUpdated);
      canvas.off('selection:cleared', onSelectionCleared);
      canvas.off('object:modified', onObjectModified as (e: unknown) => void);
      canvas.off('object:moving', onObjectMoving as (e: unknown) => void);
      canvas.off('text:editing:exited', onTextEditingExited as (e: unknown) => void);
      canvas.off('mouse:dblclick', onDblClick as (e: unknown) => void);
      canvas.off('mouse:down', onMouseDownAlt as (e: unknown) => void);
      canvas.off('mouse:down', onMouseDownContext as (e: unknown) => void);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);
}
