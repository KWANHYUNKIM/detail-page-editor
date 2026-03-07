'use client';

/**
 * useGrayAreaMarquee
 *
 * Enables rubber-band selection when dragging from the gray area surrounding the canvas.
 * When the user drags from outside the Fabric.js canvas element (i.e., on the scroll
 * container background), a blue dashed marquee overlay is drawn and all elements whose
 * bounding boxes intersect the marquee are selected on mouse-up.
 *
 * Returns:
 *   - handleGrayAreaMouseDown: attach to the scroll container's onMouseDown
 *   - marquee: current marquee rect (or null) — render as a fixed overlay div
 */

import { useRef, useState, useCallback, useEffect, MutableRefObject } from 'react';
import type * as fabricTypes from 'fabric';
import { useEditorStore } from '@/stores/editorStore';
import type { ToolType } from '@/types/editor';

interface UseGrayAreaMarqueeOptions {
  fabricRef: MutableRefObject<fabricTypes.Canvas | null>;
  fabricModuleRef: MutableRefObject<typeof fabricTypes | null>;
  containerRef: MutableRefObject<HTMLDivElement | null>;
  activeTool: ToolType;
  clearSelection: () => void;
}

interface MarqueeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function useGrayAreaMarquee({
  fabricRef,
  fabricModuleRef,
  containerRef,
  activeTool,
  clearSelection,
}: UseGrayAreaMarqueeOptions) {
  const marqueeStartRef = useRef<{ x: number; y: number } | null>(null);
  const [marquee, setMarquee] = useState<MarqueeRect | null>(null);

  const handleGrayAreaMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (activeTool !== 'move' || e.button !== 0) return;
      const target = e.target as HTMLElement;
      // Let Fabric handle clicks on the canvas itself
      if (target.tagName === 'CANVAS') return;
      // Ignore UI controls
      if (target.closest('button, input, select, [role="slider"]')) return;

      e.preventDefault();
      clearSelection();
      if (fabricRef.current) {
        fabricRef.current.discardActiveObject();
        fabricRef.current.renderAll();
      }
      marqueeStartRef.current = { x: e.clientX, y: e.clientY };
    },
    [activeTool, clearSelection, fabricRef],
  );

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!marqueeStartRef.current) return;
      const s = marqueeStartRef.current;
      setMarquee({
        x: Math.min(s.x, e.clientX),
        y: Math.min(s.y, e.clientY),
        width: Math.abs(e.clientX - s.x),
        height: Math.abs(e.clientY - s.y),
      });
    };

    const handleUp = (e: MouseEvent) => {
      if (!marqueeStartRef.current) return;
      const s = marqueeStartRef.current;
      marqueeStartRef.current = null;
      setMarquee(null);

      const selRect = {
        left: Math.min(s.x, e.clientX),
        top: Math.min(s.y, e.clientY),
        right: Math.max(s.x, e.clientX),
        bottom: Math.max(s.y, e.clientY),
      };
      // Minimum 5px drag to count as selection
      if (selRect.right - selRect.left < 5 && selRect.bottom - selRect.top < 5) return;

      const canvas = fabricRef.current;
      const fm = fabricModuleRef.current;
      if (!canvas || !fm) return;

      const canvasEl = containerRef.current?.querySelector('canvas');
      if (!canvasEl) return;
      const cr = canvasEl.getBoundingClientRect();
      const z = canvas.getZoom();

      const toSelect: fabricTypes.FabricObject[] = [];
      for (const obj of canvas.getObjects()) {
        const rec = obj as unknown as { data?: Record<string, unknown> };
        const id = rec.data?.elementId as string | undefined;
        if (!id) continue;
        if (obj.selectable === false) continue;
        const el = useEditorStore.getState().getElement(id);
        if (!el || el.locked || !el.visible) continue;

        // Convert canvas element coords to screen coords
        const oL = el.x * z + cr.left;
        const oT = el.y * z + cr.top;
        const oR = (el.x + el.width) * z + cr.left;
        const oB = (el.y + el.height) * z + cr.top;

        if (oL < selRect.right && oR > selRect.left && oT < selRect.bottom && oB > selRect.top) {
          toSelect.push(obj);
        }
      }

      if (toSelect.length === 1) {
        canvas.setActiveObject(toSelect[0]);
        canvas.renderAll();
      } else if (toSelect.length > 1) {
        const sel = new fm.ActiveSelection(toSelect, { canvas });
        canvas.setActiveObject(sel);
        canvas.renderAll();
      }
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [fabricRef, fabricModuleRef, containerRef]);

  return { handleGrayAreaMouseDown, marquee };
}
