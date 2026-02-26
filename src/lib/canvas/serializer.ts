import { Project, Page, CanvasElement } from '@/types/editor';

export function serializeProject(project: Project): string {
  return JSON.stringify(project, null, 2);
}

export function deserializeProject(json: string): Project | null {
  try {
    const parsed = JSON.parse(json);
    if (parsed.id && parsed.pages && parsed.canvas) {
      return parsed as Project;
    }
    return null;
  } catch {
    return null;
  }
}

export function serializePage(page: Page): string {
  return JSON.stringify(page);
}

export function clonePage(page: Page): Page {
  return structuredClone(page);
}

export function extractElementsForAI(page: Page): CanvasElement[] {
  return page.elements.map((el) => {
    if (el.type === 'image') {
      return { ...el, src: '[IMAGE_DATA]' };
    }
    return el;
  });
}
