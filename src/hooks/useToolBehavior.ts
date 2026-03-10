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
  const drawingBrushWidths = useEditorStore((s) => s.drawingBrushWidths);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const canvas = fabricRef.current;
    const fabricModule = fabricModuleRef.current;
    if (!canvas || !isReady || !fabricModule) return;

    let isPanning = false; let lastPanX = 0; let lastPanY = 0;

    const toolToShape: Partial<Record<ToolType, ShapeType>> = {
      rectangle: 'rect', circle: 'circle', line: 'line', arrow: 'arrow', polygon: 'polygon', star: 'star',
    };

    const isMoveTool = activeTool === 'move';
    const isHandTool = activeTool === 'hand';
    const isDrawingTool = ['pen', 'brush', 'pencil'].includes(activeTool);
    const isPlacementTool = ['rectangle', 'circle', 'line', 'arrow', 'polygon', 'star', 'text', 'image', 'frame', 'section'].includes(activeTool);

    canvas.selection = isMoveTool;
    canvas.defaultCursor = isHandTool ? 'grab' : isPlacementTool ? 'crosshair' : 'default';
    canvas.isDrawingMode = false;

    canvas.getObjects().forEach((obj) => {
      if (isMoveTool) {
        const rec = obj as unknown as { data?: Record<string, unknown> };
        const elId = rec.data?.elementId as string | undefined;
        if (elId) {
          const el = useEditorStore.getState().getElement(elId);
          const locked = el?.locked ?? false;
          const consumerLocked = mode === 'dev' && el && !el.editable;
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
        store.expandCanvasToFitElements();
        store.setActiveTool('move'); return;
      }
      if (activeTool === 'frame') { store.addFrameElement(x, y); store.expandCanvasToFitElements(); store.setActiveTool('move'); return; }
      if (activeTool === 'section') { store.addSectionElement(y); store.expandCanvasToFitElements(); store.setActiveTool('move'); return; }
      if (activeTool === 'text') {
        const id = store.addTextElement();
        store.updateElement(id, { x, y });
        store.expandCanvasToFitElements();
        store.setActiveTool('move'); return;
      }
      if (activeTool === 'image') {
        pendingImagePosRef.current = { x, y };
        if (fileInputRef.current) { fileInputRef.current.value = ''; fileInputRef.current.click(); }
      }
    };

    const onPathCreated = (e: { path?: import('fabric').FabricObject }) => {
      const pathObj = e.path;
      if (!pathObj || !(pathObj instanceof fabricModule.Path)) return;
      const svgPath = pathObj.path?.map((seg) => seg.join(' ')).join(' ') ?? '';
      const bounds = pathObj.getBoundingRect();
      const store = useEditorStore.getState();
      const page = store.getCurrentPage();
      if (page) useHistoryStore.getState().pushState(page);

      store.addDrawingPath(
        svgPath,
        {
          x: bounds.left,
          y: bounds.top,
          width: bounds.width,
          height: bounds.height,
        },
        canvas.freeDrawingBrush?.width ?? drawingBrushWidths.pen,
        (canvas.freeDrawingBrush?.color as string | undefined) ?? '#000000',
      );
      store.expandCanvasToFitElements();

      canvas.remove(pathObj);
      canvas.requestRenderAll();
    };

    if (isHandTool) {
      canvas.on('mouse:down', onHandDown);
      canvas.on('mouse:move', onHandMove);
      canvas.on('mouse:up', onHandUp);
    } else if (isDrawingTool) {
      canvas.isDrawingMode = true;
      const brush = new fabricModule.PencilBrush(canvas);
      if (activeTool === 'pen') brush.width = drawingBrushWidths.pen;
      if (activeTool === 'brush') brush.width = drawingBrushWidths.brush;
      if (activeTool === 'pencil') brush.width = drawingBrushWidths.pencil;
      brush.color = '#000000';
      brush.strokeLineCap = 'round';
      brush.strokeLineJoin = 'round';
      canvas.freeDrawingBrush = brush;
      canvas.on('path:created', onPathCreated as (e: unknown) => void);
    } else if (isPlacementTool) {
      canvas.on('mouse:down', onPlacementDown as (e: unknown) => void);
    }

    return () => {
      canvas.off('mouse:down', onHandDown);
      canvas.off('mouse:move', onHandMove);
      canvas.off('mouse:up', onHandUp);
      canvas.off('mouse:down', onPlacementDown as (e: unknown) => void);
      canvas.off('path:created', onPathCreated as (e: unknown) => void);
      canvas.isDrawingMode = false;
      canvas.defaultCursor = 'default';
    };
  }, [activeTool, drawingBrushWidths, isReady, mode]);
}
