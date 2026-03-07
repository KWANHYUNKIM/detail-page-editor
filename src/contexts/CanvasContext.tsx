'use client';

/**
 * CanvasContext
 *
 * Provides all canvas-specific mutable refs and ready-state to descendant hooks.
 * By sharing refs through context rather than prop-drilling, every canvas hook
 * can be called with ZERO parameters — removing the structural coupling between
 * Canvas.tsx and each hook.
 *
 * Only Canvas.tsx creates and provides this context; all hooks consume it.
 */

import { createContext, useContext, MutableRefObject } from 'react';
import type * as fabricTypes from 'fabric';

export type FabricHelpers = {
  elementToFabricObject: (el: import('@/types/editor').CanvasElement) => fabricTypes.FabricObject | null;
  createFabricImage: (el: import('@/types/editor').ImageElement) => Promise<fabricTypes.FabricImage | null>;
  fabricObjectToElementUpdate: (obj: fabricTypes.FabricObject) => Partial<import('@/types/editor').CanvasElement>;
};

export type FabricExporter = {
  exportAndDownload: (canvas: fabricTypes.Canvas, filename: string, options: import('@/types/editor').ExportOptions) => void;
  exportCanvasToDataURL: (canvas: fabricTypes.Canvas, options: import('@/types/editor').ExportOptions) => string;
};

export interface CanvasContextValue {
  // Core Fabric.js canvas reference
  fabricRef: MutableRefObject<fabricTypes.Canvas | null>;
  // Lazily-loaded Fabric.js module (dynamic import)
  fabricModuleRef: MutableRefObject<typeof fabricTypes | null>;
  // Fabric canvas helper functions (elementToFabricObject, etc.)
  helpersRef: MutableRefObject<FabricHelpers | null>;
  // Export utilities
  exporterRef: MutableRefObject<FabricExporter | null>;
  // Suppresses selection events during programmatic canvas.clear()/add()
  isSyncingRef: MutableRefObject<boolean>;
  // Prevents redundant re-sync when Fabric fires a change we triggered ourselves
  fabricUpdateRef: MutableRefObject<boolean>;
  // Outer scroll container (for section focus auto-scroll)
  scrollContainerRef: MutableRefObject<HTMLDivElement | null>;
  // Inner container that holds the Fabric <canvas> element
  containerRef: MutableRefObject<HTMLDivElement | null>;
  // Callback to refresh the selection dimension badge overlay
  updateOverlayRef: MutableRefObject<(() => void) | null>;
  // Hidden <input type="file"> for the image placement tool
  fileInputRef: MutableRefObject<HTMLInputElement | null>;
  // Where the user clicked when triggering the image file picker
  pendingImagePosRef: MutableRefObject<{ x: number; y: number } | null>;
  // True once the Fabric canvas has been fully initialized
  isReady: boolean;
}

const CanvasContext = createContext<CanvasContextValue | null>(null);

export const CanvasProvider = CanvasContext.Provider;

/**
 * Use inside any hook that lives within the canvas subtree.
 * Throws if called outside of CanvasProvider so misconfiguration is caught early.
 */
export function useCanvasContext(): CanvasContextValue {
  const ctx = useContext(CanvasContext);
  if (!ctx) {
    throw new Error(
      'useCanvasContext() must be called inside <CanvasProvider>. ' +
      'Make sure the hook is used within the Editor canvas component tree.'
    );
  }
  return ctx;
}
