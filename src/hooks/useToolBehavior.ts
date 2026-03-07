'use client';

/**
 * useToolBehavior
 *
 * Configures Fabric.js canvas interaction based on the active tool:
 *   - move: rubber-band selection enabled, objects selectable
 *   - hand: pan on mouse drag, no selection
 *   - rectangle / circle / line: click to place shape, then revert to move
 *   - frame / section: click to place, revert to move
 *   - text: click to place text element, revert to move
 *   - image: click triggers hidden file input, revert to move on file picked
 */

import { useEffect, MutableRefObject } from 'react';
import type * as fabricTypes from 'fabric';
import { useEditorStore } from '@/stores/editorStore';
import type { ToolType, ShapeType, CanvasElement } from '@/types/editor';

interface UseToolBehaviorOptions {
  fabricRef: MutableRefObject<fabricTypes.Canvas | null>;
  fabricModuleRef: MutableRefObject<typeof fabricTypes | null>;
  isSyncingRef: MutableRefObject<boolean>;
  fileInputRef: MutableRefObject<HTMLInputElement | null>;
  pendingImagePosRef: MutableRefObject<{ x: number; y: number } | null>;
  isReady: boolean;
  activeTool: ToolType;
  mode: string;
  pushState: (page: import('@/types/editor').Page) => void;
  addShapeElement: (shapeType: ShapeType) => string;
  addTextElement: () => string;
  addFrameElement: (x: number, y: number) => string;
  addSectionElement: (y: number) => string;
  updateElement: (id: string, update: Partial<CanvasElement>) => void;
  setActiveTool: (tool: ToolType) => void;
}

export function useToolBehavior({
  fabricRef,
  fabricModuleRef,
  isSyncingRef,
  fileInputRef,
  pendingImagePosRef,
  isReady,
  activeTool,
  mode,
  pushState,
  addShapeElement,
  addTextElement,
  addFrameElement,
  addSectionElement,
  updateElement,
  setActiveTool,
}: UseToolBehaviorOptions) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const canvas = fabricRef.current;
    const fabricModule = fabricModuleRef.current;
    if (!canvas || !isReady || !fabricModule) return;

    let isPanning = false;
    let lastPanX = 0;
    let lastPanY = 0;

    const toolToShape: Partial<Record<ToolType, ShapeType>> = {
      rectangle: 'rect',
      circle: 'circle',
      line: 'line',
    };

    const isMoveTool = activeTool === 'move';
    const isHandTool = activeTool === 'hand';
    const isPlacementTool = ['rectangle', 'circle', 'line', 'text', 'image', 'frame', 'section'].includes(activeTool);

    canvas.selection = isMoveTool;
    canvas.defaultCursor = isHandTool ? 'grab' : isPlacementTool ? 'crosshair' : 'default';

    // Toggle object selectability based on tool
    canvas.getObjects().forEach((obj) => {
      if (isMoveTool) {
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
        obj.evented = isHandTool ? false : true;
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

    // ── Placement tool handler ──
    const onPlacementDown = (opt: { e: Event; scenePoint: fabricTypes.Point; target?: fabricTypes.FabricObject }) => {
      if (isSyncingRef.current) return;
      if (opt.target) return; // Only place on empty canvas area

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
        void id;
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
      canvas.off('mouse:down', onHandDown);
      canvas.off('mouse:move', onHandMove);
      canvas.off('mouse:up', onHandUp);
      canvas.off('mouse:down', onPlacementDown as (e: unknown) => void);
      canvas.defaultCursor = 'default';
    };
  }, [activeTool, isReady, mode, pushState, addShapeElement, addTextElement, addFrameElement, updateElement, setActiveTool]);
}
