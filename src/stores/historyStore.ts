import { create } from 'zustand';
import { Page } from '@/types/editor';

const MAX_HISTORY = 50;

interface HistoryState {
  past: Page[];
  future: Page[];
  pushState: (page: Page) => void;
  undo: () => Page | null;
  redo: () => Page | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],

  pushState: (page) => {
    set((s) => ({
      past: [...s.past.slice(-MAX_HISTORY + 1), structuredClone(page)],
      future: [],
    }));
  },

  undo: () => {
    const { past } = get();
    if (past.length === 0) return null;
    const previous = past[past.length - 1];
    set((s) => ({
      past: s.past.slice(0, -1),
      future: [previous, ...s.future],
    }));
    return previous;
  },

  redo: () => {
    const { future } = get();
    if (future.length === 0) return null;
    const next = future[0];
    set((s) => ({
      past: [...s.past, next],
      future: s.future.slice(1),
    }));
    return next;
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
  clear: () => set({ past: [], future: [] }),
}));
