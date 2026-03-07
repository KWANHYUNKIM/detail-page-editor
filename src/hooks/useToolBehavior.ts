'use client';

/**
 * useToolBehavior — zero-parameter hook.
 *
 * Configures Fabric canvas interaction mode based on activeTool.
 * All refs from CanvasContext; all store actions from useEditorStore.
 */

import { useEffect } from 'react';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { useEditorStore } from '@/stores/editorStore';
import { useHistoryStore } from '@/stores/historyStore';
import type { ToolType, ShapeType } from '@/types/editor';

export function useToolBehavior() {
  const {
    fabricRef, fabricModuleRef, isSyncingRef,
    fileInputRef, pendingImagePosRef, isReady,
  } = useCanvasContext();

  const activeTool = useEditorStore((s) => s.activeTool);
  const mode = useEditorStore((s) => s.mode);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const canvas = fabricRef.current;
    const fabricModule = fabricModuleRef.current;
    if (!canvas || !isReady || !fabricModule) return;

    let isPanning = false; let lastPanX = 0; let lastPanY = 0;

    const toolToShape: Partial<Record<ToolType, ShapeType>> = {
      rectangle: 'rect', circle: 'circle', line: 'line',
    };

    const isMoveTool = activeTool === 'move';
    const isHandTool = activeTool === 'hand';
    const isPlacementTool = ['rectangle', 'circle', 'line', 'text', 'image', 'frame', 'section'].includes(activeTool);

    canvas.selection = isMoveTool;
    canvas.defaultCursor = isHandTool ? 'grab' : isPlacementTool ? 'crosshair' : 'default';

    canvas.getObjects().forEach((obj) => {
      if (isMoveTool) {
        const rec = obj as unknown as { data?: Record<string, unknown> };
        const elId = rec.data?.elementId as string | undefined;
        if (elId) {
          const el = useEditorStore.getState().getElement(elId);
          const locked = el?.locked ?? false;
          const consumerLocked = mode === 'consumer' && el && !el.editable;
          obj.selectable = !locked && !consumerLocked;
          obj.evented = !locked && !consumerLocked;
        }
      } else {
        obj.selectable = false;
        obj.evented = isHandTool ? false : true;
      }
    });
    canvas.discardActiveObject();
    canvas.renderAll();

    // Hand tool pan
    const onHandDown = (e: { e: Event }) => {
      if (isSyncingRef.current) return;
      isPanning = true;
      const me = e.e as MouseEvent; lastPanX = me.clientX; lastPanY = me.clientY;
      canvas.defaultCursor = 'grabbing'; canvas.renderAll();
    };
    const onHandMove = (e: { e: Event }) => {
      if (!isPanning) return;
      const me = e.e as MouseEvent;
      const dx = me.clientX - lastPanX; const dy = me.clientY - lastPanY;
      lastPanX = me.clientX; lastPanY = me.clientY;
      canvas.relativePan(new fabricModule.Point(dx, dy));
    };
    const onHandUp = () => { isPanning = false; canvas.defaultCursor = 'grab'; canvas.renderAll(); };

    // Placement tool
    const onPlacementDown = (opt: { e: Event; scenePoint: import('fabric').Point; target?: import('fabric').FabricObject }) => {
      if (isSyncingRef.current || opt.target) return;
      const x = Math.round(opt.scenePoint.x);
      const y = Math.round(opt.scenePoint.y);
      const store = useEditorStore.getState();
      const page = store.getCurrentPage();
      if (page) useHistoryStore.getState().pushState(page);

      const shapeType = toolToShape[activeTool];
      if (shapeType) {
        const id = store.addShapeElement(shapeType);
        store.updateElement(id, { x, y });
        store.setActiveTool('move'); return;
      }
      if (activeTool === 'frame') { store.addFrameElement(x, y); store.setActiveTool('move'); return; }
      if (activeTool === 'section') { store.addSectionElement(y); store.setActiveTool('move'); return; }
      if (activeTool === 'text') {
        const id = store.addTextElement();
        store.updateElement(id, { x, y });
        store.setActiveTool('move'); return;
      }
      if (activeTool === 'image') {
        pendingImagePosRef.current = { x, y };
        if (fileInputRef.current) { fileInputRef.current.value = ''; fileInputRef.current.click(); }
      }
    };

    if (isHandTool) {
      canvas.on('mouse:down', onHandDown);
      canvas.on('mouse:move', onHandMove);
      canvas.on('mouse:up', onHandUp);
    } else if (isPlacementTool) {
      canvas.on('mouse:down', onPlacementDown as (e: unknown) => void);
    }

    return () => {
      canvas.off('mouse:down', onHandDown);
      canvas.off('mouse:move', onHandMove);
      canvas.off('mouse:up', onHandUp);
      canvas.off('mouse:down', onPlacementDown as (e: unknown) => void);
      canvas.defaultCursor = 'default';
    };
  }, [activeTool, isReady, mode]);
}
