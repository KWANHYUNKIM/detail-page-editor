'use client';

import { useCallback, useRef } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import type { CanvasExtent } from '@/stores/slices/uiSlice';

type Side = 'top' | 'right' | 'bottom' | 'left';

const MIN_EXTENT = 500;
const HANDLE_THICKNESS = 6;

export default function CanvasEdgeHandles() {
  const canvasExtent = useEditorStore((s) => s.canvasExtent);
  const zoom = useEditorStore((s) => s.zoom);
  const setCanvasExtent = useEditorStore((s) => s.setCanvasExtent);
  const project = useEditorStore((s) => s.project);

  const draggingRef = useRef<{
    side: Side;
    startPos: number;
    startExtent: CanvasExtent;
  } | null>(null);

  const handlePointerDown = useCallback((side: Side, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    draggingRef.current = {
      side,
      startPos: side === 'left' || side === 'right' ? e.clientX : e.clientY,
      startExtent: { ...canvasExtent },
    };
  }, [canvasExtent]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const drag = draggingRef.current;
    if (!drag) return;

    const { side, startPos, startExtent } = drag;
    const isHorizontal = side === 'left' || side === 'right';
    const currentPos = isHorizontal ? e.clientX : e.clientY;
    const rawDelta = currentPos - startPos;
    const delta = Math.round(rawDelta / zoom);

    const update: Partial<CanvasExtent> = {};

    switch (side) {
      case 'left':
        update.left = Math.max(MIN_EXTENT, startExtent.left - delta);
        break;
      case 'right':
        update.right = Math.max(MIN_EXTENT, startExtent.right + delta);
        break;
      case 'top':
        update.top = Math.max(MIN_EXTENT, startExtent.top - delta);
        break;
      case 'bottom':
        update.bottom = Math.max(MIN_EXTENT, startExtent.bottom + delta);
        break;
    }

    setCanvasExtent(update);
  }, [zoom, setCanvasExtent]);

  const handlePointerUp = useCallback(() => {
    draggingRef.current = null;
  }, []);

  if (!project) return null;

  const totalW = (canvasExtent.left + project.canvas.width + canvasExtent.right) * zoom;
  const totalH = (canvasExtent.top + project.canvas.height + canvasExtent.bottom) * zoom;

  const commonProps = {
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerUp,
  };

  return (
    <>
      <div
        className="absolute z-20 group"
        style={{ top: 0, left: 0, width: totalW, height: HANDLE_THICKNESS, cursor: 'row-resize' }}
        onPointerDown={(e) => handlePointerDown('top', e)}
        {...commonProps}
        role="slider"
        aria-label="Resize canvas top edge"
        aria-orientation="vertical"
        tabIndex={0}
      >
        <div className="w-full h-full bg-transparent group-hover:bg-blue-400/30 transition-colors" />
      </div>

      <div
        className="absolute z-20 group"
        style={{ bottom: 0, left: 0, width: totalW, height: HANDLE_THICKNESS, cursor: 'row-resize' }}
        onPointerDown={(e) => handlePointerDown('bottom', e)}
        {...commonProps}
        role="slider"
        aria-label="Resize canvas bottom edge"
        aria-orientation="vertical"
        tabIndex={0}
      >
        <div className="w-full h-full bg-transparent group-hover:bg-blue-400/30 transition-colors" />
      </div>

      <div
        className="absolute z-20 group"
        style={{ top: 0, left: 0, width: HANDLE_THICKNESS, height: totalH, cursor: 'col-resize' }}
        onPointerDown={(e) => handlePointerDown('left', e)}
        {...commonProps}
        role="slider"
        aria-label="Resize canvas left edge"
        aria-orientation="horizontal"
        tabIndex={0}
      >
        <div className="w-full h-full bg-transparent group-hover:bg-blue-400/30 transition-colors" />
      </div>

      <div
        className="absolute z-20 group"
        style={{ top: 0, right: 0, width: HANDLE_THICKNESS, height: totalH, cursor: 'col-resize' }}
        onPointerDown={(e) => handlePointerDown('right', e)}
        {...commonProps}
        role="slider"
        aria-label="Resize canvas right edge"
        aria-orientation="horizontal"
        tabIndex={0}
      >
        <div className="w-full h-full bg-transparent group-hover:bg-blue-400/30 transition-colors" />
      </div>
    </>
  );
}
