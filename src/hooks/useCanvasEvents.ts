'use client';

/**
 * useCanvasEvents — zero-parameter hook.
 *
 * Registers persistent Fabric.js event listeners after canvas init.
 * All refs come from CanvasContext; all store calls go directly to useEditorStore.
 *
 * 1. Selection sync   (selection:created/updated/cleared → store)
 * 2. Mutation sync    (object:modified, object:moving, text:editing:exited → store)
 * 3. Interaction      (dblclick, alt+drag duplicate, right-click menu)
 * 4. Dimension badge  (overlay update on every transform event)
 */

import { useEffect, Dispatch, SetStateAction } from 'react';
import type * as fabricTypes from 'fabric';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { useEditorStore } from '@/stores/editorStore';
import { useHistoryStore } from '@/stores/historyStore';
import type { FrameElement } from '@/types/editor';

function getElementId(obj: fabricTypes.FabricObject): string | undefined {
  const rec = obj as unknown as { data?: Record<string, unknown> };
  if (rec.data && typeof rec.data.elementId === 'string') return rec.data.elementId;
  return undefined;
}

interface SelectionInfo { left: number; top: number; width: number; height: number; }
interface ContextMenuState { x: number; y: number; elementId: string | null; }

/**
 * Two UI-state setters are passed as arguments because they belong to Canvas.tsx’s
 * local render state (not the global store). Everything else comes from context/store.
 */
export function useCanvasEvents(
  setSelectionInfo: Dispatch<SetStateAction<SelectionInfo | null>>,
  setContextMenu: Dispatch<SetStateAction<ContextMenuState | null>>,
) {
  const {
    fabricRef, fabricModuleRef, helpersRef,
    isSyncingRef, fabricUpdateRef, updateOverlayRef, isReady,
  } = useCanvasContext();

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !isReady) return;

    // 1. Selection sync
    const onSelectionCreated = () => {
      if (isSyncingRef.current) return;
      const ids = canvas.getActiveObjects().map(getElementId).filter((id): id is string => !!id);
      useEditorStore.getState().selectElements(ids);
    };
    const onSelectionUpdated = onSelectionCreated;
    const onSelectionCleared = () => {
      if (isSyncingRef.current) return;
      useEditorStore.getState().clearSelection();
    };

    // 2a. object:modified
    const onObjectModified = (e: { target: fabricTypes.FabricObject }) => {
      const helpers = helpersRef.current;
      if (!e.target || !helpers) return;
      const store = useEditorStore.getState();
      const elementId = getElementId(e.target);

      if (!elementId) {
        // ActiveSelection
        if (!('getObjects' in e.target) || !fabricModuleRef.current) return;
        const objects = [...(e.target as fabricTypes.ActiveSelection).getObjects()];
        if (objects.length === 0) return;
        const page = store.getCurrentPage();
        if (page) useHistoryStore.getState().pushState(page);
        fabricUpdateRef.current = true;
        isSyncingRef.current = true; canvas.discardActiveObject(); isSyncingRef.current = false;
        for (const obj of objects) {
          const cid = getElementId(obj);
          if (cid) store.updateElement(cid, helpers.fabricObjectToElementUpdate(obj));
        }
        store.expandCanvasToFitElements();
        isSyncingRef.current = true;
        const sel = new fabricModuleRef.current.ActiveSelection(objects, { canvas });
        canvas.setActiveObject(sel);
        isSyncingRef.current = false;
        canvas.requestRenderAll();
        return;
      }

      const page = store.getCurrentPage();
      if (page) useHistoryStore.getState().pushState(page);
      fabricUpdateRef.current = true;
      const update = helpers.fabricObjectToElementUpdate(e.target);
      store.updateElement(elementId, update);

      // Auto-expand canvas if element approaches edge
      store.expandCanvasToFitElements();

      const el = store.getElement(elementId);

      // Propagate frame drag delta to children
      if (el?.type === 'frame') {
        const frame = el as FrameElement;
        const dx = (update.x ?? el.x) - el.x;
        const dy = (update.y ?? el.y) - el.y;
        if (dx !== 0 || dy !== 0) {
          for (const cid of frame.childOrder) {
            const child = store.getElement(cid);
            if (child) store.updateElement(cid, { x: child.x + dx, y: child.y + dy });
          }
        }
      }

      // Auto-parent / auto-unparent
      if (el && el.type !== 'frame') {
        const allEls = store.getCurrentPage()?.elements ?? [];
        const cx = (update.x ?? el.x) + el.width / 2;
        const cy = (update.y ?? el.y) + el.height / 2;
        const inFrame = allEls.some((fe) => fe.type === 'frame' && (fe as FrameElement).childOrder.includes(el.id));
        if (!inFrame) {
          const target = allEls.find((fe) =>
            fe.type === 'frame' && cx >= fe.x && cx <= fe.x + fe.width && cy >= fe.y && cy <= fe.y + fe.height
          );
          if (target) store.moveToFrame([elementId], target.id);
        } else {
          const parent = allEls.find((fe) =>
            fe.type === 'frame' && (fe as FrameElement).childOrder.includes(el.id)
          ) as FrameElement | undefined;
          if (parent) {
            const outside = cx < parent.x || cx > parent.x + parent.width || cy < parent.y || cy > parent.y + parent.height;
            if (outside) store.moveOutOfFrame([elementId]);
          }
        }
      }
    };

    // 2b. object:moving (live drag)
    const onObjectMoving = (e: { target: fabricTypes.FabricObject }) => {
      const helpers = helpersRef.current;
      if (!e.target || !helpers) return;
      const store = useEditorStore.getState();
      const elementId = getElementId(e.target);

      if (!elementId) {
        if (!('getObjects' in e.target)) return;
        fabricUpdateRef.current = true;
        const gLeft = e.target.left ?? 0; const gTop = e.target.top ?? 0;
        for (const obj of (e.target as fabricTypes.ActiveSelection).getObjects()) {
          const cid = getElementId(obj);
          if (cid) store.updateElement(cid, { x: gLeft + (obj.left ?? 0), y: gTop + (obj.top ?? 0) });
        }
        return;
      }

      fabricUpdateRef.current = true;
      const update = helpers.fabricObjectToElementUpdate(e.target);
      const el = store.getElement(elementId);

      if (el?.type === 'frame') {
        const frame = el as FrameElement;
        const dx = (update.x ?? el.x) - el.x;
        const dy = (update.y ?? el.y) - el.y;
        if (dx !== 0 || dy !== 0) {
          const childIdSet = new Set(frame.childOrder);
          for (const cid of frame.childOrder) {
            const child = store.getElement(cid);
            if (child) store.updateElement(cid, { x: child.x + dx, y: child.y + dy });
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
      store.updateElement(elementId, update);
    };

    // 2c. text:editing:exited
    const onTextEditingExited = (e: { target: fabricTypes.FabricObject }) => {
      const helpers = helpersRef.current;
      if (!e.target || !helpers) return;
      const elementId = getElementId(e.target);
      if (!elementId) return;
      const store = useEditorStore.getState();
      const page = store.getCurrentPage();
      if (page) useHistoryStore.getState().pushState(page);
      fabricUpdateRef.current = true;
      store.updateElement(elementId, helpers.fabricObjectToElementUpdate(e.target));
    };

    // 3a. Double-click: enter frame or start text inline edit
    const onDblClick = (e: { target?: fabricTypes.FabricObject }) => {
      const store = useEditorStore.getState();
      if (!e.target) { store.setEditingFrameId(null); return; }
      const eid = getElementId(e.target);
      if (!eid) return;
      const el = store.getElement(eid);
      if (el?.type === 'frame') {
        store.setEditingFrameId(eid);
      } else if (el?.type === 'text' && 'enterEditing' in e.target) {
        (e.target as unknown as { enterEditing: () => void }).enterEditing();
        canvas.requestRenderAll();
      }
    };

    // 3b. Alt+drag duplicate
    const onMouseDownAlt = (opt: { e: Event; target?: fabricTypes.FabricObject }) => {
      const me = opt.e as MouseEvent;
      if (me.altKey && me.button === 0 && opt.target) {
        const store = useEditorStore.getState();
        const ids = store.selectedElementIds;
        if (ids.length > 0) {
          const page = store.getCurrentPage();
          if (page) useHistoryStore.getState().pushState(page);
          store.duplicateElements(ids, { x: 0, y: 0 });
          store.selectElements(ids);
        }
      }
    };

    // 3c. Right-click context menu
    const onMouseDownContext = (opt: { e: Event; target?: fabricTypes.FabricObject }) => {
      const me = opt.e as MouseEvent;
      if (me.button === 2) {
        const targetId = opt.target ? getElementId(opt.target) : null;
        const store = useEditorStore.getState();
        if (targetId && !store.selectedElementIds.includes(targetId)) {
          canvas.setActiveObject(opt.target!); canvas.renderAll(); store.selectElements([targetId]);
        }
        setContextMenu({ x: me.clientX, y: me.clientY, elementId: targetId ?? null });
      } else { setContextMenu(null); }
    };

    // 4. Dimension badge overlay
    const updateOverlay = () => {
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
    updateOverlayRef.current = updateOverlay;

    canvas.on('selection:created', onSelectionCreated);
    canvas.on('selection:updated', onSelectionUpdated);
    canvas.on('selection:cleared', onSelectionCleared);
    canvas.on('object:modified', onObjectModified as (e: unknown) => void);
    canvas.on('object:moving', onObjectMoving as (e: unknown) => void);
    canvas.on('text:editing:exited', onTextEditingExited as (e: unknown) => void);
    canvas.on('mouse:dblclick', onDblClick as (e: unknown) => void);
    canvas.on('mouse:down', onMouseDownAlt as (e: unknown) => void);
    canvas.on('mouse:down', onMouseDownContext as (e: unknown) => void);
    canvas.on('selection:created', updateOverlay);
    canvas.on('selection:updated', updateOverlay);
    canvas.on('selection:cleared', () => setSelectionInfo(null));
    canvas.on('object:moving', updateOverlay);
    canvas.on('object:scaling', updateOverlay);
    canvas.on('object:rotating', updateOverlay);
    canvas.on('object:modified', updateOverlay);

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
