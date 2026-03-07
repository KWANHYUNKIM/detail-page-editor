'use client';

/**
 * useKeyboardShortcuts — zero-parameter hook.
 * Reads canvas refs from CanvasContext, store state/actions from useEditorStore.
 */

import { useEffect } from 'react';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { useEditorStore } from '@/stores/editorStore';
import { useHistoryStore } from '@/stores/historyStore';

export function useKeyboardShortcuts() {
  const { fabricRef } = useCanvasContext();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) return;

      const store = useEditorStore.getState();

      // Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (store.selectedElementIds.length > 0) {
          e.preventDefault();
          const page = store.getCurrentPage();
          if (page) useHistoryStore.getState().pushState(page);
          store.removeElements(store.selectedElementIds);
        }
      }

      // Copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !e.altKey) {
        if (store.selectedElementIds.length > 0) { e.preventDefault(); store.copyElements(); }
      }

      // Cut
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        if (store.selectedElementIds.length > 0) {
          e.preventDefault();
          const page = store.getCurrentPage();
          if (page) useHistoryStore.getState().pushState(page);
          store.cutElements();
        }
      }

      // Paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !e.altKey) {
        if (store.clipboardElements.length > 0) { e.preventDefault(); store.pasteElements(); }
      }

      // Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        if (store.selectedElementIds.length > 0) {
          e.preventDefault();
          const page = store.getCurrentPage();
          if (page) useHistoryStore.getState().pushState(page);
          store.duplicateElements(store.selectedElementIds);
        }
      }

      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const page = useHistoryStore.getState().undo();
        const proj = store.project;
        if (page && proj) {
          store.loadProject({ ...proj, pages: proj.pages.map((p, i) => (i === store.currentPageIndex ? page : p)) });
        }
      }

      // Redo
      if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        const page = useHistoryStore.getState().redo();
        const proj = store.project;
        if (page && proj) {
          store.loadProject({ ...proj, pages: proj.pages.map((p, i) => (i === store.currentPageIndex ? page : p)) });
        }
      }

      // Select All
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        const pg = store.getCurrentPage();
        if (pg) {
          const allIds = pg.elements.filter((el) => el.visible && !el.locked).map((el) => el.id);
          if (allIds.length > 0) store.selectElements(allIds);
        }
      }

      // Arrow nudge (1px; 10px with Shift)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (store.selectedElementIds.length > 0) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
          const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
          store.nudgeElements(store.selectedElementIds, dx, dy);
        }
      }

      // Z-order: ⌘] / ⌘[ (+ Alt for top/bottom)
      if ((e.ctrlKey || e.metaKey) && (e.key === ']' || e.key === '[')) {
        if (store.selectedElementIds.length === 1) {
          e.preventDefault();
          const id = store.selectedElementIds[0];
          if (e.altKey) { e.key === ']' ? store.moveLayerToTop(id) : store.moveLayerToBottom(id); }
          else { e.key === ']' ? store.moveLayerUp(id) : store.moveLayerDown(id); }
        }
      }

      // Zoom: ⌘0/1/+/-
      if ((e.ctrlKey || e.metaKey) && ['0', '1', '=', '+', '-'].includes(e.key)) {
        e.preventDefault();
        const z = store.zoom;
        if (e.key === '0' || e.key === '1') store.setZoom(1);
        else if (e.key === '=' || e.key === '+') store.setZoom(Math.min(z + 0.1, 5));
        else if (e.key === '-') store.setZoom(Math.max(z - 0.1, 0.1));
      }

      // Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        if (store.editingFrameId) store.setEditingFrameId(null);
        else if (store.focusedSectionId) store.setFocusedSectionId(null);
        else store.clearSelection();
      }

      // Enter: start text editing or enter frame
      if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        if (store.selectedElementIds.length === 1) {
          const el = store.getElement(store.selectedElementIds[0]);
          if (el?.type === 'text' && fabricRef.current) {
            e.preventDefault();
            const textObj = fabricRef.current.getObjects().find((o) => {
              const rec = o as unknown as { data?: Record<string, unknown> };
              return rec.data?.elementId === store.selectedElementIds[0];
            });
            if (textObj && 'enterEditing' in textObj) {
              (textObj as unknown as { enterEditing: () => void }).enterEditing();
              fabricRef.current.requestRenderAll();
            }
          } else if (el?.type === 'frame') {
            e.preventDefault();
            store.setEditingFrameId(store.selectedElementIds[0]);
          }
        }
      }

      // Tab / Shift+Tab: cycle selection
      if (e.key === 'Tab') {
        e.preventDefault();
        const pg = store.getCurrentPage();
        if (pg) {
          const ids = pg.elements.filter((el) => el.visible && !el.locked).map((el) => el.id);
          if (ids.length > 0) {
            const cur = store.selectedElementIds;
            const curIdx = cur.length === 1 ? ids.indexOf(cur[0]) : -1;
            const next = e.shiftKey
              ? (curIdx <= 0 ? ids.length - 1 : curIdx - 1)
              : (curIdx >= ids.length - 1 ? 0 : curIdx + 1);
            store.selectElements([ids[next]]);
          }
        }
      }

      // Style copy/paste: Cmd+Alt+C / Cmd+Alt+V
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'c') { e.preventDefault(); store.copyStyle(); }
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'v') { e.preventDefault(); store.pasteStyle(); }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [fabricRef]);
}
