import { AIDesignResponse, CanvasElement } from '@/types/editor';
import { v4 as uuid } from 'uuid';

export function parseAIResponse(raw: string): AIDesignResponse | null {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.elements || !Array.isArray(parsed.elements)) return null;

    const elements: CanvasElement[] = parsed.elements.map(
      (el: Partial<CanvasElement>) => ({
        ...el,
        id: el.id || uuid(),
        locked: false,
        visible: true,
        editable: false,
      }),
    ) as CanvasElement[];

    return {
      elements,
      backgroundColor: parsed.backgroundColor,
      colorPalette: parsed.colorPalette,
      suggestions: parsed.suggestions,
    };
  } catch {
    return null;
  }
}

export function validateAIElements(elements: CanvasElement[]): boolean {
  return elements.every((el) => {
    if (!el.type || !el.id) return false;
    if (typeof el.x !== 'number' || typeof el.y !== 'number') return false;
    if (typeof el.width !== 'number' || typeof el.height !== 'number') return false;
    return true;
  });
}
