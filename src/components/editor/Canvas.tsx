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
} from '@/types/editor';
import { isGradient } from '@/types/editor';
import { toFabricFill } from '@/lib/canvas/fabricHelpers';
import { initAligningGuidelines } from '@/lib/canvas/alignmentGuides';
import ContextMenu from '@/components/editor/ContextMenu';

import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useCanvasEvents } from '@/hooks/useCanvasEvents';
import { useCanvasSync } from '@/hooks/useCanvasSync';
import { useToolBehavior } from '@/hooks/useToolBehavior';
import { useGrayAreaMarquee } from '@/hooks/useGrayAreaMarquee';

export interface CanvasHandle {
  exportCanvas: (filename: string, options: ExportOptions) => void;
  getDataURL: (options: ExportOptions) => string;
}

type FabricHelpers = {
  elementToFabricObject: (el: CanvasElement) => fabricTypes.FabricObject | null;
  createFabricImage: (el: ImageElement) => Promise<fabricTypes.FabricImage | null>;
  fabricObjectToElementUpdate: (obj: fabricTypes.FabricObject) => Partial<CanvasElement>;
};

type FabricExporter = {
  exportAndDownload: (canvas: fabricTypes.Canvas, filename: string, options: ExportOptions) => void;
  exportCanvasToDataURL: (canvas: fabricTypes.Canvas, options: ExportOptions) => string;
};

const EditorCanvas = forwardRef<CanvasHandle>(function EditorCanvas(_, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<fabricTypes.Canvas | null>(null);
  const helpersRef = useRef<FabricHelpers | null>(null);
  const exporterRef = useRef<FabricExporter | null>(null);
  const fabricUpdateRef = useRef(false);
  const isSyncingRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const fabricModuleRef = useRef<typeof fabricTypes | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingImagePosRef = useRef<{ x: number; y: number } | null>(null);
  const updateOverlayRef = useRef<(() => void) | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ── Store subscriptions ──
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
  const removeElements = useEditorStore((s) => s.removeElements);
  const moveToFrame = useEditorStore((s) => s.moveToFrame);
  const moveOutOfFrame = useEditorStore((s) => s.moveOutOfFrame);
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
  const focusedSectionId = useEditorStore((s) => s.focusedSectionId);
  const setFocusedSectionId = useEditorStore((s) => s.setFocusedSectionId);
  const showGrid = useEditorStore((s) => s.showGrid);
  const gridSize = useEditorStore((s) => s.gridSize);

  const page = getCurrentPage();
  const elements = page?.elements;
  const layerOrder = page?.layerOrder;
  const canvasBgColor = project?.canvas.backgroundColor;
  const canvasWidth = project?.canvas.width;
  const canvasHeight = project?.canvas.height;

  // ── UI state ──
  const [selectionInfo, setSelectionInfo] = useState<{
    left: number; top: number; width: number; height: number;
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number; elementId: string | null;
  } | null>(null);

  // ── Export clip paths (for export only) ──
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

  useImperativeHandle(ref, () => ({
    exportCanvas: (filename, options) => {
      if (fabricRef.current && exporterRef.current) {
        applyExportClipPaths();
        exporterRef.current.exportAndDownload(fabricRef.current, filename, options);
        removeExportClipPaths();
      }
    },
    getDataURL: (options) => {
      if (fabricRef.current && exporterRef.current) {
        applyExportClipPaths();
        const result = exporterRef.current.exportCanvasToDataURL(fabricRef.current, options);
        removeExportClipPaths();
        return result;
      }
      return '';
    },
  }));

  // ── Canvas initialization ──
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        selectionColor: 'rgba(59, 130, 246, 0.1)',
        selectionBorderColor: 'rgba(59, 130, 246, 0.8)',
        selectionLineWidth: 1,
        selectionDashArray: [4, 4],
        fireRightClick: true,
        stopContextMenu: true,
      });

      if (disposed) { canvas.dispose(); return; }

      fabricRef.current = canvas;

      const initBg = currentProject.canvas.backgroundColor;
      if (isGradient(initBg)) {
        canvas.backgroundColor = toFabricFill(initBg, currentProject.canvas.width, currentProject.canvas.height) as string;
      } else {
        canvas.backgroundColor = (initBg as string) || '#ffffff';
      }
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
  }, [project?.id]);

  // ── Delegate to hooks ──

  useCanvasEvents({
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
  });

  useCanvasSync({
    fabricRef,
    fabricModuleRef,
    helpersRef,
    isSyncingRef,
    fabricUpdateRef,
    scrollContainerRef,
    updateOverlayRef,
    isReady,
    elements,
    layerOrder,
    mode,
    canvasBgColor,
    focusedSectionId,
    showGrid,
    gridSize,
    zoom,
    canvasWidth,
    canvasHeight,
    project,
    setZoom,
  });

  useToolBehavior({
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
  });

  useKeyboardShortcuts({
    fabricRef,
    pushState,
    removeElements,
    copyElements,
    cutElements,
    pasteElements,
    duplicateElements,
    loadProject,
    selectElements,
    clearSelection,
    nudgeElements,
    moveLayerUp,
    moveLayerDown,
    moveLayerToTop,
    moveLayerToBottom,
    setZoom,
  });

  const { handleGrayAreaMouseDown, marquee } = useGrayAreaMarquee({
    fabricRef,
    fabricModuleRef,
    containerRef,
    activeTool,
    clearSelection,
  });

  // ── Wheel zoom ──
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
      onMouseDown={handleGrayAreaMouseDown}
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
      {/* Gray area marquee selection overlay */}
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
    </div>
  );
});

export default EditorCanvas;
