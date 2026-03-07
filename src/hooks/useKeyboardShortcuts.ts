'use client';

import { useEffect, MutableRefObject } from 'react';
import type * as fabricTypes from 'fabric';
import { useEditorStore } from '@/stores/editorStore';
import { useHistoryStore } from '@/stores/historyStore';
import type { Page, Project } from '@/types/editor';
interface UseKeyboardShortcutsOptions {
  fabricRef: MutableRefObject<fabricTypes.Canvas | null>;
  pushState: (page: Page) => void;
  removeElements: (ids: string[]) => void;
  copyElements: () => void;
  cutElements: () => void;
  pasteElements: () => void;
  duplicateElements: (ids: string[], offset?: { x: number; y: number }) => void;
  loadProject: (project: Project) => void;
  selectElements: (ids: string[]) => void;
  clearSelection: () => void;
  nudgeElements: (ids: string[], dx: number, dy: number) => void;
  moveLayerUp: (id: string) => void;
  moveLayerDown: (id: string) => void;
  moveLayerToTop: (id: string) => void;
  moveLayerToBottom: (id: string) => void;
  setZoom: (zoom: number) => void;
}

export function useKeyboardShortcuts({
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
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const ids = useEditorStore.getState().selectedElementIds;
        if (ids.length > 0) {
          e.preventDefault();
          const currentPage = useEditorStore.getState().getCurrentPage();
          if (currentPage) pushState(currentPage);
          removeElements(ids);
        }
      }

      // Copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        const ids = useEditorStore.getState().selectedElementIds;
        if (ids.length > 0) {
          e.preventDefault();
          copyElements();
        }
      }

      // Cut
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        const ids = useEditorStore.getState().selectedElementIds;
        if (ids.length > 0) {
          e.preventDefault();
          const currentPage = useEditorStore.getState().getCurrentPage();
          if (currentPage) pushState(currentPage);
          cutElements();
        }
      }

      // Paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (useEditorStore.getState().clipboardElements.length > 0) {
          e.preventDefault();
          pasteElements();
        }
      }

      // Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        const ids = useEditorStore.getState().selectedElementIds;
        if (ids.length > 0) {
          e.preventDefault();
          const currentPage = useEditorStore.getState().getCurrentPage();
          if (currentPage) pushState(currentPage);
          duplicateElements(ids);
        }
      }

      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const page = useHistoryStore.getState().undo();
        const proj = useEditorStore.getState().project;
        const idx = useEditorStore.getState().currentPageIndex;
        if (page && proj) {
          loadProject({ ...proj, pages: proj.pages.map((p, i) => (i === idx ? page : p)) });
        }
      }

      // Redo
      if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        const page = useHistoryStore.getState().redo();
        const proj = useEditorStore.getState().project;
        const idx = useEditorStore.getState().currentPageIndex;
        if (page && proj) {
          loadProject({ ...proj, pages: proj.pages.map((p, i) => (i === idx ? page : p)) });
        }
      }

      // Select All
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        const pg = useEditorStore.getState().getCurrentPage();
        if (pg) {
          const allIds = pg.elements
            .filter((el) => el.visible && !el.locked)
            .map((el) => el.id);
          if (allIds.length > 0) {
            selectElements(allIds);
          }
        }
      }

      // Arrow keys: nudge selected elements (1px, 10px with Shift)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const ids = useEditorStore.getState().selectedElementIds;
        if (ids.length > 0) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          let dx = 0, dy = 0;
          switch (e.key) {
            case 'ArrowLeft':  dx = -step; break;
            case 'ArrowRight': dx = step; break;
            case 'ArrowUp':    dy = -step; break;
            case 'ArrowDown':  dy = step; break;
          }
          nudgeElements(ids, dx, dy);
        }
      }

      // ⌘] / ⌘[ : move element up/down in z-order
      // ⌘⌥] / ⌘⌥[ : move element to top/bottom
      if ((e.ctrlKey || e.metaKey) && (e.key === ']' || e.key === '[')) {
        const ids = useEditorStore.getState().selectedElementIds;
        if (ids.length === 1) {
          e.preventDefault();
          const id = ids[0];
          if (e.altKey) {
            e.key === ']' ? moveLayerToTop(id) : moveLayerToBottom(id);
          } else {
            e.key === ']' ? moveLayerUp(id) : moveLayerDown(id);
          }
        }
      }

      // Zoom: ⌘0 (fit), ⌘1 (100%), ⌘+ (zoom in), ⌘- (zoom out)
      if ((e.ctrlKey || e.metaKey) && (e.key === '0' || e.key === '1' || e.key === '=' || e.key === '+' || e.key === '-')) {
        e.preventDefault();
        const currentZoom = useEditorStore.getState().zoom;
        if (e.key === '0') setZoom(1);
        else if (e.key === '1') setZoom(1);
        else if (e.key === '=' || e.key === '+') setZoom(Math.min(currentZoom + 0.1, 5));
        else if (e.key === '-') setZoom(Math.max(currentZoom - 0.1, 0.1));
      }

      // Escape: deselect / exit frame editing
      if (e.key === 'Escape') {
        e.preventDefault();
        const state = useEditorStore.getState();
        if (state.editingFrameId) {
          state.setEditingFrameId(null);
        } else if (state.focusedSectionId) {
          state.setFocusedSectionId(null);
        } else {
          clearSelection();
        }
      }

      // Enter: start editing text element
      if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const ids = useEditorStore.getState().selectedElementIds;
        if (ids.length === 1) {
          const el = useEditorStore.getState().getElement(ids[0]);
          if (el?.type === 'text' && fabricRef.current) {
            e.preventDefault();
            const canvas = fabricRef.current;
            const textObj = canvas.getObjects().find((o) => {
              const rec = o as unknown as { data?: Record<string, unknown> };
              return rec.data?.elementId === ids[0];
            });
            if (textObj && 'enterEditing' in textObj) {
              (textObj as unknown as { enterEditing: () => void }).enterEditing();
              canvas.requestRenderAll();
            }
          } else if (el?.type === 'frame') {
            e.preventDefault();
            useEditorStore.getState().setEditingFrameId(ids[0]);
          }
        }
      }

      // Tab / Shift+Tab: cycle through elements
      if (e.key === 'Tab') {
        e.preventDefault();
        const pg = useEditorStore.getState().getCurrentPage();
        if (pg) {
          const selectableIds = pg.elements
            .filter((el) => el.visible && !el.locked)
            .map((el) => el.id);
          if (selectableIds.length > 0) {
            const currentIds = useEditorStore.getState().selectedElementIds;
            const currentIdx = currentIds.length === 1 ? selectableIds.indexOf(currentIds[0]) : -1;
            let nextIdx: number;
            if (e.shiftKey) {
              nextIdx = currentIdx <= 0 ? selectableIds.length - 1 : currentIdx - 1;
            } else {
              nextIdx = currentIdx >= selectableIds.length - 1 ? 0 : currentIdx + 1;
            }
            selectElements([selectableIds[nextIdx]]);
          }
        }
      }

      // Ctrl+Alt+C: copy style
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'c') {
        e.preventDefault();
        useEditorStore.getState().copyStyle();
      }

      // Ctrl+Alt+V: paste style
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'v') {
        e.preventDefault();
        useEditorStore.getState().pasteStyle();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
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
  ]);
}
