'use client';

/**
 * useGrayAreaMarquee — zero-parameter hook.
 *
 * Rubber-band selection when dragging from the gray area outside the Fabric canvas.
 * All refs from CanvasContext; store calls direct to useEditorStore.
 *
 * Returns:
 *   handleGrayAreaMouseDown — attach to scroll container’s onMouseDown
 *   marquee                  — current rect or null, render as fixed overlay
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import type * as fabricTypes from 'fabric';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { useEditorStore } from '@/stores/editorStore';

interface MarqueeRect { x: number; y: number; width: number; height: number; }

export function useGrayAreaMarquee() {
  const { fabricRef, fabricModuleRef, containerRef } = useCanvasContext();
  const activeTool = useEditorStore((s) => s.activeTool);
  const clearSelection = useEditorStore((s) => s.clearSelection);

  const startRef = useRef<{ x: number; y: number } | null>(null);
  const [marquee, setMarquee] = useState<MarqueeRect | null>(null);

  const handleGrayAreaMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (activeTool !== 'move' || e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'CANVAS') return;
      if (target.closest('button, input, select, [role="slider"]')) return;
      e.preventDefault();
      clearSelection();
      if (fabricRef.current) { fabricRef.current.discardActiveObject(); fabricRef.current.renderAll(); }
      startRef.current = { x: e.clientX, y: e.clientY };
    },
    [activeTool, clearSelection, fabricRef],
  );

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!startRef.current) return;
      const s = startRef.current;
      setMarquee({
        x: Math.min(s.x, e.clientX), y: Math.min(s.y, e.clientY),
        width: Math.abs(e.clientX - s.x), height: Math.abs(e.clientY - s.y),
      });
    };

    const handleUp = (e: MouseEvent) => {
      if (!startRef.current) return;
      const s = startRef.current;
      startRef.current = null;
      setMarquee(null);

      const sel = {
        left: Math.min(s.x, e.clientX), top: Math.min(s.y, e.clientY),
        right: Math.max(s.x, e.clientX), bottom: Math.max(s.y, e.clientY),
      };
      if (sel.right - sel.left < 5 && sel.bottom - sel.top < 5) return;

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
        if (!id || obj.selectable === false) continue;
        const el = useEditorStore.getState().getElement(id);
        if (!el || el.locked || !el.visible) continue;

        const oL = el.x * z + cr.left;
        const oT = el.y * z + cr.top;
        const oR = (el.x + el.width) * z + cr.left;
        const oB = (el.y + el.height) * z + cr.top;

        if (oL < sel.right && oR > sel.left && oT < sel.bottom && oB > sel.top) toSelect.push(obj);
      }

      if (toSelect.length === 1) { canvas.setActiveObject(toSelect[0]); canvas.renderAll(); }
      else if (toSelect.length > 1) {
        canvas.setActiveObject(new fm.ActiveSelection(toSelect, { canvas }));
        canvas.renderAll();
      }
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [fabricRef, fabricModuleRef, containerRef]);

  return { handleGrayAreaMouseDown, marquee };
}
