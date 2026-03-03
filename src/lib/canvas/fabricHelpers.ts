import * as fabric from 'fabric';
import { CanvasElement, ImageElement, TextElement, ShapeElement, FrameElement, FillValue, isGradient, LinearGradient, RadialGradient, DropShadow } from '@/types/editor';

// ── Gradient Helpers ──

/**
 * Convert our FillValue to a Fabric-compatible fill.
 * Solid strings pass through; gradient objects become fabric.Gradient.
 */
export function toFabricFill(
  fill: FillValue,
  width: number,
  height: number,
): string | fabric.Gradient<'linear'> | fabric.Gradient<'radial'> {
  if (!isGradient(fill)) return fill as string;

  const colorStops = fill.stops
    .slice()
    .sort((a, b) => a.offset - b.offset)
    .map((s) => ({ offset: s.offset, color: s.color }));

  if (fill.type === 'linear') {
    const rad = ((fill as LinearGradient).angle * Math.PI) / 180;
    // Compute line endpoints relative to object center
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const halfW = width / 2;
    const halfH = height / 2;
    return new fabric.Gradient<'linear'>({
      type: 'linear',
      gradientUnits: 'pixels',
      coords: {
        x1: halfW - cos * halfW,
        y1: halfH - sin * halfH,
        x2: halfW + cos * halfW,
        y2: halfH + sin * halfH,
      },
      colorStops,
    });
  }

  // Radial
  const rg = fill as RadialGradient;
  const cx = rg.cx * width;
  const cy = rg.cy * height;
  const r = rg.r * Math.max(width, height);
  return new fabric.Gradient<'radial'>({
    type: 'radial',
    gradientUnits: 'pixels',
    coords: {
      x1: cx,
      y1: cy,
      r1: 0,
      x2: cx,
      y2: cy,
      r2: r,
    },
    colorStops,
  });
}

/** Build a fabric.Shadow from our DropShadow type */
function buildDropShadow(ds: DropShadow): fabric.Shadow {
  return new fabric.Shadow({
    color: ds.color,
    offsetX: ds.offsetX,
    offsetY: ds.offsetY,
    blur: ds.blur,
  });
}

export function elementToFabricObject(
  element: CanvasElement,
): fabric.FabricObject | null {
  switch (element.type) {
    case 'image':
      return null;
    case 'text':
      return createFabricText(element);
    case 'shape':
      return createFabricShape(element);
    case 'frame':
      return createFabricFrame(element);
    default:
      return null;
  }
}

function createFabricText(el: TextElement): fabric.Textbox {
  // Build shadow: textShadow takes priority, fallback to dropShadow
  let shadow: fabric.Shadow | undefined;
  if (el.textShadow?.enabled) {
    shadow = new fabric.Shadow({
      color: el.textShadow.color,
      offsetX: el.textShadow.offsetX,
      offsetY: el.textShadow.offsetY,
      blur: el.textShadow.blur,
    });
  } else if (el.dropShadow?.enabled) {
    shadow = buildDropShadow(el.dropShadow);
  }

  return new fabric.Textbox(el.content, {
    left: el.x,
    top: el.y,
    originX: 'left',
    originY: 'top',
    width: el.width,
    fontSize: el.fontSize,
    fontFamily: el.fontFamily,
    fontWeight: el.fontWeight,
    fontStyle: el.fontStyle ?? 'normal',
    fill: toFabricFill(el.color, el.width, el.height),
    textAlign: el.textAlign,
    lineHeight: el.lineHeight,
    charSpacing: (el.letterSpacing ?? 0) * 10,
    underline: el.textDecoration === 'underline',
    linethrough: el.textDecoration === 'line-through',
    shadow,
    stroke: el.textStroke?.enabled ? el.textStroke.color : undefined,
    strokeWidth: el.textStroke?.enabled ? el.textStroke.width : 0,
    paintFirst: 'stroke',
    textBackgroundColor: el.textBackground || undefined,
    angle: el.rotation,
    opacity: el.opacity,
    flipX: el.flipX ?? false,
    flipY: el.flipY ?? false,
    selectable: !el.locked,
    visible: el.visible,
    editable: true,
    data: { elementId: el.id, elementType: el.type },
  });
}

function createFabricShape(el: ShapeElement): fabric.FabricObject {
  const shadow = el.dropShadow?.enabled ? buildDropShadow(el.dropShadow) : undefined;
  const commonProps = {
    left: el.x,
    top: el.y,
    originX: 'left' as const,
    originY: 'top' as const,
    angle: el.rotation,
    opacity: el.opacity,
    flipX: el.flipX ?? false,
    flipY: el.flipY ?? false,
    shadow,
    selectable: !el.locked,
    visible: el.visible,
    data: { elementId: el.id, elementType: el.type },
  };

  switch (el.shape) {
    case 'rect':
      return new fabric.Rect({
        ...commonProps,
        width: el.width,
        height: el.height,
        fill: toFabricFill(el.fill, el.width, el.height),
        stroke: el.stroke,
        strokeWidth: el.strokeWidth,
        rx: el.borderRadius,
        ry: el.borderRadius,
      });
    case 'circle':
      return new fabric.Circle({
        ...commonProps,
        radius: Math.min(el.width, el.height) / 2,
        fill: toFabricFill(el.fill, el.width, el.height),
        stroke: el.stroke,
        strokeWidth: el.strokeWidth,
      });
    case 'line':
      return new fabric.Line([0, 0, el.width, 0], {
        ...commonProps,
        stroke: el.stroke,
        strokeWidth: el.strokeWidth,
      });
    default:
      return new fabric.Rect({
        ...commonProps,
        width: el.width,
        height: el.height,
        fill: toFabricFill(el.fill, el.width, el.height),
      });
  }
}

function createFabricFrame(el: FrameElement): fabric.Rect {
  const isSection = el.isSection === true;
  const shadow = el.dropShadow?.enabled ? buildDropShadow(el.dropShadow) : undefined;
  return new fabric.Rect({
    left: el.x,
    top: el.y,
    originX: 'left',
    originY: 'top',
    width: el.width,
    height: el.height,
    fill: toFabricFill(el.fill || (isSection ? '#ffffff' : 'rgba(255,255,255,0)'), el.width, el.height),
    stroke: el.stroke || (isSection ? 'transparent' : '#94a3b8'),
    strokeWidth: el.strokeWidth ?? (isSection ? 0 : 1),
    ...(isSection ? {} : { strokeDashArray: [4, 4] }),
    rx: el.borderRadius,
    ry: el.borderRadius,
    angle: el.rotation,
    opacity: el.opacity,
    flipX: el.flipX ?? false,
    flipY: el.flipY ?? false,
    shadow,
    selectable: !el.locked,
    visible: el.visible,
    data: { elementId: el.id, elementType: isSection ? 'section' : 'frame' },
  });
}

export async function createFabricImage(
  el: ImageElement,
): Promise<fabric.FabricImage | null> {
  try {
    const img = await fabric.FabricImage.fromURL(el.src, {
      crossOrigin: 'anonymous',
    });
    const imgW = img.width ?? 1;
    const imgH = img.height ?? 1;

    // Scale based on scaleMode
    let scaleX = el.width / imgW;
    let scaleY = el.height / imgH;
    const mode = el.scaleMode ?? 'fill';

    if (mode === 'fit') {
      const s = Math.min(scaleX, scaleY);
      scaleX = s;
      scaleY = s;
    } else if (mode === 'crop') {
      const s = Math.max(scaleX, scaleY);
      scaleX = s;
      scaleY = s;
    }
    // 'fill' = stretch (default), 'tile' = treat as fill for now

    img.set({
      left: el.x,
      top: el.y,
      originX: 'left',
      originY: 'top',
      scaleX,
      scaleY,
      angle: el.rotation,
      opacity: el.opacity,
      flipX: el.flipX ?? false,
      flipY: el.flipY ?? false,
      selectable: !el.locked,
      visible: el.visible,
      data: { elementId: el.id, elementType: el.type },
    });

    // Apply drop shadow
    if (el.dropShadow?.enabled) {
      img.shadow = buildDropShadow(el.dropShadow);
    }

    // ── Apply image filters ──
    const f = el.filters;
    if (f) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fabricFilters: import('fabric').filters.BaseFilter<string, Record<string, any>>[] = [];

      if (f.brightness !== 0) {
        fabricFilters.push(new fabric.filters.Brightness({ brightness: f.brightness }));
      }
      if (f.contrast !== 0) {
        fabricFilters.push(new fabric.filters.Contrast({ contrast: f.contrast }));
      }
      if (f.saturation !== 0) {
        fabricFilters.push(new fabric.filters.Saturation({ saturation: f.saturation }));
      }
      if (f.blur && f.blur > 0) {
        fabricFilters.push(new fabric.filters.Blur({ blur: f.blur }));
      }
      // Temperature: warm (+) = orange tint, cool (-) = blue tint
      if (f.temperature && f.temperature !== 0) {
        const t = f.temperature;
        const color = t > 0 ? '#FF8C00' : '#0066CC';
        const alpha = Math.abs(t) * 0.15;
        fabricFilters.push(new fabric.filters.BlendColor({ color, mode: 'add', alpha }));
      }
      // Tint: positive = green, negative = magenta
      if (f.tint && f.tint !== 0) {
        const t = f.tint;
        const color = t > 0 ? '#00CC00' : '#CC00CC';
        const alpha = Math.abs(t) * 0.1;
        fabricFilters.push(new fabric.filters.BlendColor({ color, mode: 'add', alpha }));
      }
      // Highlights & Shadows via Gamma
      const h = f.highlights ?? 0;
      const s = f.shadows ?? 0;
      if (h !== 0 || s !== 0) {
        // Highlights affect midtones-to-white, shadows affect black-to-midtones
        const gH = 1 + h * 0.5;
        const gS = 1 - s * 0.5;
        const g = gH * gS;
        fabricFilters.push(new fabric.filters.Gamma({ gamma: [g, g, g] as [number, number, number] }));
      }

      if (fabricFilters.length > 0) {
        img.filters = fabricFilters;
        img.applyFilters();
      }
    }

    return img;
  } catch {
    return null;
  }
}

export function fabricObjectToElementUpdate(
  obj: fabric.FabricObject,
): Partial<CanvasElement> {
  const update: Partial<CanvasElement> = {
    x: obj.left ?? 0,
    y: obj.top ?? 0,
    rotation: obj.angle ?? 0,
    opacity: obj.opacity ?? 1,
    flipX: obj.flipX ?? false,
    flipY: obj.flipY ?? false,
  };

  if (obj.width && obj.scaleX) {
    update.width = obj.width * obj.scaleX;
  }
  if (obj.height && obj.scaleY) {
    update.height = obj.height * obj.scaleY;
  }

  // Sync text content after inline editing
  const rec = obj as unknown as { data?: Record<string, unknown> };
  if (rec.data?.elementType === 'text' && 'text' in obj) {
    (update as Partial<import('@/types/editor').TextElement>).content = (obj as fabric.Textbox).text;
  }

  return update;
}
