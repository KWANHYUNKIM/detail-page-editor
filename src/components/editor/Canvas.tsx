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
import type { ExportOptions } from '@/types/editor';
import { isGradient } from '@/types/editor';
import { uploadImage } from '@/lib/supabase/storage';
import { toFabricFill } from '@/lib/canvas/fabricHelpers';
import { initAligningGuidelines } from '@/lib/canvas/alignmentGuides';
import ContextMenu from '@/components/editor/ContextMenu';
import CanvasEdgeHandles from '@/components/editor/CanvasEdgeHandles';
import { CanvasProvider, type CanvasContextValue, type FabricHelpers, type FabricExporter } from '@/contexts/CanvasContext';

import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useCanvasEvents } from '@/hooks/useCanvasEvents';
import { useCanvasSync } from '@/hooks/useCanvasSync';
import { useToolBehavior } from '@/hooks/useToolBehavior';
import { useGrayAreaMarquee } from '@/hooks/useGrayAreaMarquee';

export interface CanvasHandle {
  exportCanvas: (filename: string, options: ExportOptions) => void;
  getDataURL: (options: ExportOptions) => string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CanvasHooks — lives INSIDE CanvasProvider so it can call useCanvasContext()
//
// Mounts all zero-param hooks and wires the gray-area mousedown handler into
// the parent's ref so the outer scroll container can attach it without
// prop-drilling or re-rendering.
// ─────────────────────────────────────────────────────────────────────────────

interface CanvasHooksProps {
  setSelectionInfo: React.Dispatch<React.SetStateAction<{
    left: number; top: number; width: number; height: number;
  } | null>>;
  setContextMenu: React.Dispatch<React.SetStateAction<{
    x: number; y: number; elementId: string | null;
  } | null>>;
  grayAreaHandlerRef: React.MutableRefObject<((e: React.MouseEvent) => void) | null>;
}

function CanvasHooks({ setSelectionInfo, setContextMenu, grayAreaHandlerRef }: CanvasHooksProps) {
  useKeyboardShortcuts();
  useCanvasEvents(setSelectionInfo, setContextMenu);
  useCanvasSync();
  useToolBehavior();

  const { handleGrayAreaMouseDown, marquee } = useGrayAreaMarquee();

  // Wire the latest gray-area handler into the parent ref (no re-render needed)
  useEffect(() => {
    grayAreaHandlerRef.current = handleGrayAreaMouseDown;
  }, [handleGrayAreaMouseDown, grayAreaHandlerRef]);

  return (
    <>
      {marquee && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: marquee.x,
            top: marquee.y,
            width: marquee.width,
            height: marquee.height,
            border: '1px dashed rgba(59, 130, 246, 0.8)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
          }}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EditorCanvas — creates all canvas refs, provides CanvasContext, renders layout
// ─────────────────────────────────────────────────────────────────────────────

const EditorCanvas = forwardRef<CanvasHandle>(function EditorCanvas(_, ref) {
  // ── Canvas refs (shared via CanvasContext) ──
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<fabricTypes.Canvas | null>(null);
  const helpersRef = useRef<FabricHelpers | null>(null);
  const exporterRef = useRef<FabricExporter | null>(null);
  const fabricUpdateRef = useRef(false);
  const isSyncingRef = useRef(false);
  const fabricModuleRef = useRef<typeof fabricTypes | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingImagePosRef = useRef<{ x: number; y: number } | null>(null);
  const updateOverlayRef = useRef<(() => void) | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [isReady, setIsReady] = useState(false);

  // ── Local UI state ──
  const [selectionInfo, setSelectionInfo] = useState<{
    left: number; top: number; width: number; height: number;
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number; elementId: string | null;
  } | null>(null);

  // Receives the gray-area handler from CanvasHooks (avoids prop-drilling)
  const grayAreaHandlerRef = useRef<((e: React.MouseEvent) => void) | null>(null);

  // ── Store (only what EditorCanvas itself uses) ──
  const projectId = useEditorStore((s) => s.project?.id);
  const pushState = useHistoryStore((s) => s.pushState);
  const addImageElement = useEditorStore((s) => s.addImageElement);
  const updateElement = useEditorStore((s) => s.updateElement);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);

  // ── Export clip-path helpers ──
  const applyExportClipPaths = useCallback(() => {
    const canvas = fabricRef.current;
    const fabricModule = fabricModuleRef.current;
    if (!canvas || !fabricModule) return;
    const p = useEditorStore.getState().getCurrentPage();
    if (!p) return;
    for (const obj of canvas.getObjects()) {
      const rec = obj as unknown as { data?: Record<string, unknown> };
      const elId = rec.data?.elementId as string | undefined;
      if (!elId) continue;
      const parentFrame = p.elements.find((pe) =>
        pe.type === 'frame' &&
        (pe as import('@/types/editor').FrameElement).clipContent &&
        (pe as import('@/types/editor').FrameElement).childOrder.includes(elId)
      ) as import('@/types/editor').FrameElement | undefined;
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
      if (obj.clipPath) obj.clipPath = undefined;
    }
    canvas.renderAll();
  }, []);

  const withExportViewport = useCallback(<T,>(fn: () => T): T => {
    const canvas = fabricRef.current;
    if (!canvas) throw new Error('Canvas not ready');
    const savedVP = [...canvas.viewportTransform] as typeof canvas.viewportTransform;
    canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
    try {
      return fn();
    } finally {
      canvas.viewportTransform = savedVP;
      canvas.requestRenderAll();
    }
  }, []);

  const getPageBounds = useCallback(() => {
    const project = useEditorStore.getState().project;
    if (!project) return undefined;
    return { left: 0, top: 0, width: project.canvas.width, height: project.canvas.height };
  }, []);

  useImperativeHandle(ref, () => ({
    exportCanvas: (filename, options) => {
      if (fabricRef.current && exporterRef.current) {
        const bounds = getPageBounds();
        withExportViewport(() => {
          applyExportClipPaths();
          exporterRef.current!.exportAndDownload(fabricRef.current!, filename, options, bounds);
          removeExportClipPaths();
        });
      }
    },
    getDataURL: (options) => {
      if (fabricRef.current && exporterRef.current) {
        const bounds = getPageBounds();
        return withExportViewport(() => {
          applyExportClipPaths();
          const result = exporterRef.current!.exportCanvasToDataURL(fabricRef.current!, options, bounds);
          removeExportClipPaths();
          return result;
        });
      }
      return '';
    },
  }));

  // ── Canvas initialization ──
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

      const initExtent = useEditorStore.getState().canvasExtent;
      const canvas = new fabricModule.Canvas(canvasEl, {
        width: initExtent.left + currentProject.canvas.width + initExtent.right,
        height: initExtent.top + currentProject.canvas.height + initExtent.bottom,
        backgroundColor: '#f0f0f0',
        selection: true,
        selectionColor: 'rgba(59, 130, 246, 0.1)',
        selectionBorderColor: 'rgba(59, 130, 246, 0.8)',
        selectionLineWidth: 1,
        selectionDashArray: [4, 4],
        fireRightClick: true,
        stopContextMenu: true,
      });

      if (disposed) { canvas.dispose(); return; }

      fabricRef.current = canvas;

      canvas.setViewportTransform([1, 0, 0, 1, initExtent.left, initExtent.top]);
      canvas.renderAll();

      disposeGuidelines = initAligningGuidelines(canvas, fabricModule, {
        width: currentProject.canvas.width,
        height: currentProject.canvas.height,
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
  }, [projectId]); // re-init only when project changes

  // ── Wheel zoom (native listener to block browser zoom) ──
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        const currentZoom = useEditorStore.getState().zoom;
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        useEditorStore.getState().setZoom(Math.round((currentZoom + delta) * 10) / 10);
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // ── Image file input handler ──
  const handleImageFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const pos = pendingImagePosRef.current ?? { x: 100, y: 100 };
      const currentPage = useEditorStore.getState().getCurrentPage();
      if (currentPage) pushState(currentPage);

      let src: string;
      try {
        src = await uploadImage(file);
      } catch {
        // Supabase Storage 실패 시 data URL fallback
        src = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      const id = addImageElement(src, file.name);
      updateElement(id, { x: pos.x, y: pos.y });
      pendingImagePosRef.current = null;
      setActiveTool('move');
    },
    [pushState, addImageElement, updateElement, setActiveTool],
  );

  // ── Gray-area mousedown — delegates to handler set by CanvasHooks ──
  const handleGrayAreaMouseDown = useCallback((e: React.MouseEvent) => {
    grayAreaHandlerRef.current?.(e);
  }, []);

  // ── Context value (all refs + isReady) ──
  const contextValue: CanvasContextValue = {
    fabricRef,
    fabricModuleRef,
    helpersRef,
    exporterRef,
    isSyncingRef,
    fabricUpdateRef,
    scrollContainerRef,
    containerRef,
    updateOverlayRef,
    fileInputRef,
    pendingImagePosRef,
    isReady,
  };

  return (
    <CanvasProvider value={contextValue}>
      {/*
       * CanvasHooks MUST be inside the provider — it calls useCanvasContext().
       * It renders the marquee overlay and wires the gray-area handler into
       * grayAreaHandlerRef so the scroll container below can use it.
       */}
      <CanvasHooks
        setSelectionInfo={setSelectionInfo}
        setContextMenu={setContextMenu}
        grayAreaHandlerRef={grayAreaHandlerRef}
      />

      <div
        ref={scrollContainerRef}
        className="absolute inset-0 overflow-auto bg-[#f0f0f0]"
        onMouseDown={handleGrayAreaMouseDown}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Hidden file input for the image placement tool */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageFileChange}
        />
        <div className="flex justify-center p-8" style={{ minHeight: '100%', minWidth: '100%' }}>
          <div className="relative shrink-0 self-start">
            <div ref={containerRef} />
            <CanvasEdgeHandles />
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
    </CanvasProvider>
  );
});

export default EditorCanvas;
