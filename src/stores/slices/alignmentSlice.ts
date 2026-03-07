import type { CanvasElement, Project } from '@/types/editor';

export interface AlignmentSlice {
  alignElements: (
    ids: string[],
    direction: 'left' | 'right' | 'centerH' | 'top' | 'bottom' | 'centerV',
  ) => void;
  distributeElements: (ids: string[], axis: 'horizontal' | 'vertical') => void;
  nudgeElements: (ids: string[], dx: number, dy: number) => void;
}

type SetFn = (fn: ((s: any) => any) | Record<string, unknown>) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
type GetFn = () => any; // eslint-disable-line @typescript-eslint/no-explicit-any

export function createAlignmentSlice(set: SetFn, _get: GetFn): AlignmentSlice {
  return {
    alignElements: (ids, direction) => {
      set((s: { project: Project | null; currentPageIndex: number }) => {
        if (!s.project || ids.length === 0) return s;
        const pages = [...s.project.pages];
        const page = { ...pages[s.currentPageIndex] };
        const targets = page.elements.filter((el) => ids.includes(el.id));
        if (targets.length === 0) return s;

        const updates = new Map<string, Partial<CanvasElement>>();

        if (targets.length === 1) {
          const canvasW = s.project.canvas.width;
          const canvasH = s.project.canvas.height;
          const el = targets[0];
          switch (direction) {
            case 'left':    updates.set(el.id, { x: 0 }); break;
            case 'right':   updates.set(el.id, { x: canvasW - el.width }); break;
            case 'centerH': updates.set(el.id, { x: canvasW / 2 - el.width / 2 }); break;
            case 'top':     updates.set(el.id, { y: 0 }); break;
            case 'bottom':  updates.set(el.id, { y: canvasH - el.height }); break;
            case 'centerV': updates.set(el.id, { y: canvasH / 2 - el.height / 2 }); break;
          }
        } else {
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          for (const el of targets) {
            minX = Math.min(minX, el.x);
            minY = Math.min(minY, el.y);
            maxX = Math.max(maxX, el.x + el.width);
            maxY = Math.max(maxY, el.y + el.height);
          }
          for (const el of targets) {
            switch (direction) {
              case 'left':    updates.set(el.id, { x: minX }); break;
              case 'right':   updates.set(el.id, { x: maxX - el.width }); break;
              case 'centerH': updates.set(el.id, { x: (minX + maxX) / 2 - el.width / 2 }); break;
              case 'top':     updates.set(el.id, { y: minY }); break;
              case 'bottom':  updates.set(el.id, { y: maxY - el.height }); break;
              case 'centerV': updates.set(el.id, { y: (minY + maxY) / 2 - el.height / 2 }); break;
            }
          }
        }

        page.elements = page.elements.map((el) => {
          const u = updates.get(el.id);
          return u ? { ...el, ...u } as CanvasElement : el;
        });
        pages[s.currentPageIndex] = page;
        return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
      });
    },

    distributeElements: (ids, axis) => {
      set((s: { project: Project | null; currentPageIndex: number }) => {
        if (!s.project || ids.length < 3) return s;
        const pages = [...s.project.pages];
        const page = { ...pages[s.currentPageIndex] };
        const targets = page.elements.filter((el) => ids.includes(el.id));
        if (targets.length < 3) return s;

        if (axis === 'horizontal') {
          const sorted = [...targets].sort((a, b) => a.x - b.x);
          const first = sorted[0];
          const last = sorted[sorted.length - 1];
          const totalWidth = sorted.reduce((sum, el) => sum + el.width, 0);
          const totalSpace = (last.x + last.width) - first.x - totalWidth;
          const gap = totalSpace / (sorted.length - 1);
          let currentX = first.x + first.width + gap;
          const updates = new Map<string, number>();
          for (let i = 1; i < sorted.length - 1; i++) {
            updates.set(sorted[i].id, currentX);
            currentX += sorted[i].width + gap;
          }
          page.elements = page.elements.map((el) => {
            const newX = updates.get(el.id);
            return newX !== undefined ? { ...el, x: newX } as CanvasElement : el;
          });
        } else {
          const sorted = [...targets].sort((a, b) => a.y - b.y);
          const first = sorted[0];
          const last = sorted[sorted.length - 1];
          const totalHeight = sorted.reduce((sum, el) => sum + el.height, 0);
          const totalSpace = (last.y + last.height) - first.y - totalHeight;
          const gap = totalSpace / (sorted.length - 1);
          let currentY = first.y + first.height + gap;
          const updates = new Map<string, number>();
          for (let i = 1; i < sorted.length - 1; i++) {
            updates.set(sorted[i].id, currentY);
            currentY += sorted[i].height + gap;
          }
          page.elements = page.elements.map((el) => {
            const newY = updates.get(el.id);
            return newY !== undefined ? { ...el, y: newY } as CanvasElement : el;
          });
        }

        pages[s.currentPageIndex] = page;
        return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
      });
    },

    nudgeElements: (ids, dx, dy) => {
      set((s: { project: Project | null; currentPageIndex: number }) => {
        if (!s.project || ids.length === 0) return s;
        const pages = [...s.project.pages];
        const page = { ...pages[s.currentPageIndex] };
        const idSet = new Set(ids);
        page.elements = page.elements.map((el) => {
          if (!idSet.has(el.id)) return el;
          return { ...el, x: el.x + dx, y: el.y + dy } as CanvasElement;
        });
        pages[s.currentPageIndex] = page;
        return { project: { ...s.project, pages, updatedAt: new Date().toISOString() } };
      });
    },
  };
}
