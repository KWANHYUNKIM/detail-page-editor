import type * as fabricTypes from 'fabric';

// ── Configuration ──
const SNAP_THRESHOLD = 5;
const GUIDE_COLOR = '#FF00FF';
const GUIDE_LINE_WIDTH = 0.5;
const GUIDE_DASH = [4, 4];
const GUIDE_EXTENSION = 10;

// ── Types ──
interface VerticalLine {
  x: number;
  y1: number;
  y2: number;
}
interface HorizontalLine {
  y: number;
  x1: number;
  x2: number;
}

// ── Helpers ──
function isInRange(v1: number, v2: number): boolean {
  return Math.abs(Math.round(v1) - Math.round(v2)) <= SNAP_THRESHOLD;
}

/**
 * Initialize alignment guide lines on a Fabric.js canvas.
 * Shows magenta snap guides when moving objects near other objects' edges or centers.
 *
 * Supports:
 *  - Center ↔ Center alignment
 *  - Edge ↔ Edge alignment (left/right, top/bottom)
 *  - Adjacent edge alignment (left ↔ right, top ↔ bottom)
 *
 * @returns Cleanup function to remove all event handlers.
 */
export function initAligningGuidelines(
  canvas: fabricTypes.Canvas,
  fabricModule: typeof fabricTypes,
  canvasBounds?: { width: number; height: number },
): () => void {
  let vpt: number[] = [1, 0, 0, 1, 0, 0];
  let zoom = 1;
  let verticalLines: VerticalLine[] = [];
  let horizontalLines: HorizontalLine[] = [];

  // ── Capture viewport state on drag start ──
  const onMouseDown = () => {
    vpt = canvas.viewportTransform ?? [1, 0, 0, 1, 0, 0];
    zoom = canvas.getZoom();
  };

  // ── Canvas edge snap targets ──
  const getCanvasSnapTargets = () => {
    if (!canvasBounds) return [];
    const cw = canvasBounds.width;
    const ch = canvasBounds.height;
    return [
      { centerX: cw / 2, centerY: ch / 2, left: 0, right: cw, top: 0, bottom: ch, width: cw, height: ch },
    ];
  };

  // ── Calculate snap and collect guide lines ──
  const onObjectMoving = (e: { target: fabricTypes.FabricObject }) => {
    const active = e.target;
    if (!active) return;

    verticalLines = [];
    horizontalLines = [];

    const objects = canvas.getObjects();
    const activeCenter = active.getCenterPoint();
    let aLeft = activeCenter.x;
    let aTop = activeCenter.y;
    const aBR = active.getBoundingRect();
    const aW = aBR.width / (vpt[0] || 1);
    const aH = aBR.height / (vpt[3] || 1);

    for (let i = objects.length; i--; ) {
      const obj = objects[i];
      if (obj === active) continue;

      const objCenter = obj.getCenterPoint();
      const oLeft = objCenter.x;
      const oTop = objCenter.y;
      const oBR = obj.getBoundingRect();
      const oW = oBR.width / (vpt[0] || 1);
      const oH = oBR.height / (vpt[3] || 1);

      // Extent helpers — guide lines span between the two objects
      const vExt = () => ({
        y1: Math.min(oTop - oH / 2, aTop - aH / 2) - GUIDE_EXTENSION,
        y2: Math.max(oTop + oH / 2, aTop + aH / 2) + GUIDE_EXTENSION,
      });
      const hExt = () => ({
        x1: Math.min(oLeft - oW / 2, aLeft - aW / 2) - GUIDE_EXTENSION,
        x2: Math.max(oLeft + oW / 2, aLeft + aW / 2) + GUIDE_EXTENSION,
      });

      // ── Vertical (X-axis) snap ──

      // Center ↔ Center
      if (isInRange(oLeft, aLeft)) {
        verticalLines.push({ x: oLeft, ...vExt() });
        active.setPositionByOrigin(
          new fabricModule.Point(oLeft, aTop),
          'center',
          'center',
        );
        aLeft = oLeft;
      }
      // Left ↔ Left
      else if (isInRange(oLeft - oW / 2, aLeft - aW / 2)) {
        const x = oLeft - oW / 2;
        verticalLines.push({ x, ...vExt() });
        active.setPositionByOrigin(
          new fabricModule.Point(x + aW / 2, aTop),
          'center',
          'center',
        );
        aLeft = x + aW / 2;
      }
      // Right ↔ Right
      else if (isInRange(oLeft + oW / 2, aLeft + aW / 2)) {
        const x = oLeft + oW / 2;
        verticalLines.push({ x, ...vExt() });
        active.setPositionByOrigin(
          new fabricModule.Point(x - aW / 2, aTop),
          'center',
          'center',
        );
        aLeft = x - aW / 2;
      }
      // Active-left ↔ Other-right
      else if (isInRange(oLeft + oW / 2, aLeft - aW / 2)) {
        const x = oLeft + oW / 2;
        verticalLines.push({ x, ...vExt() });
        active.setPositionByOrigin(
          new fabricModule.Point(x + aW / 2, aTop),
          'center',
          'center',
        );
        aLeft = x + aW / 2;
      }
      // Active-right ↔ Other-left
      else if (isInRange(oLeft - oW / 2, aLeft + aW / 2)) {
        const x = oLeft - oW / 2;
        verticalLines.push({ x, ...vExt() });
        active.setPositionByOrigin(
          new fabricModule.Point(x - aW / 2, aTop),
          'center',
          'center',
        );
        aLeft = x - aW / 2;
      }

      // ── Horizontal (Y-axis) snap ──

      // Center ↔ Center
      if (isInRange(oTop, aTop)) {
        horizontalLines.push({ y: oTop, ...hExt() });
        active.setPositionByOrigin(
          new fabricModule.Point(aLeft, oTop),
          'center',
          'center',
        );
        aTop = oTop;
      }
      // Top ↔ Top
      else if (isInRange(oTop - oH / 2, aTop - aH / 2)) {
        const y = oTop - oH / 2;
        horizontalLines.push({ y, ...hExt() });
        active.setPositionByOrigin(
          new fabricModule.Point(aLeft, y + aH / 2),
          'center',
          'center',
        );
        aTop = y + aH / 2;
      }
      // Bottom ↔ Bottom
      else if (isInRange(oTop + oH / 2, aTop + aH / 2)) {
        const y = oTop + oH / 2;
        horizontalLines.push({ y, ...hExt() });
        active.setPositionByOrigin(
          new fabricModule.Point(aLeft, y - aH / 2),
          'center',
          'center',
        );
        aTop = y - aH / 2;
      }
      // Active-top ↔ Other-bottom
      else if (isInRange(oTop + oH / 2, aTop - aH / 2)) {
        const y = oTop + oH / 2;
        horizontalLines.push({ y, ...hExt() });
        active.setPositionByOrigin(
          new fabricModule.Point(aLeft, y + aH / 2),
          'center',
          'center',
        );
        aTop = y + aH / 2;
      }
      // Active-bottom ↔ Other-top
      else if (isInRange(oTop - oH / 2, aTop + aH / 2)) {
        const y = oTop - oH / 2;
        horizontalLines.push({ y, ...hExt() });
        active.setPositionByOrigin(
          new fabricModule.Point(aLeft, y - aH / 2),
          'center',
          'center',
        );
        aTop = y - aH / 2;
      }
    }

    // ── Canvas edge / center snap ──
    const snapTargets = getCanvasSnapTargets();
    for (const ct of snapTargets) {
      const fullVExt = { y1: -GUIDE_EXTENSION, y2: ct.height + GUIDE_EXTENSION };
      const fullHExt = { x1: -GUIDE_EXTENSION, x2: ct.width + GUIDE_EXTENSION };

      // Snap to canvas left edge
      if (isInRange(0, aLeft - aW / 2)) {
        verticalLines.push({ x: 0, ...fullVExt });
        active.setPositionByOrigin(new fabricModule.Point(aW / 2, aTop), 'center', 'center');
        aLeft = aW / 2;
      }
      // Snap to canvas right edge
      else if (isInRange(ct.width, aLeft + aW / 2)) {
        verticalLines.push({ x: ct.width, ...fullVExt });
        active.setPositionByOrigin(new fabricModule.Point(ct.width - aW / 2, aTop), 'center', 'center');
        aLeft = ct.width - aW / 2;
      }
      // Snap to canvas center X
      else if (isInRange(ct.centerX, aLeft)) {
        verticalLines.push({ x: ct.centerX, ...fullVExt });
        active.setPositionByOrigin(new fabricModule.Point(ct.centerX, aTop), 'center', 'center');
        aLeft = ct.centerX;
      }

      // Snap to canvas top edge
      if (isInRange(0, aTop - aH / 2)) {
        horizontalLines.push({ y: 0, ...fullHExt });
        active.setPositionByOrigin(new fabricModule.Point(aLeft, aH / 2), 'center', 'center');
        aTop = aH / 2;
      }
      // Snap to canvas bottom edge
      else if (isInRange(ct.height, aTop + aH / 2)) {
        horizontalLines.push({ y: ct.height, ...fullHExt });
        active.setPositionByOrigin(new fabricModule.Point(aLeft, ct.height - aH / 2), 'center', 'center');
        aTop = ct.height - aH / 2;
      }
      // Snap to canvas center Y
      else if (isInRange(ct.centerY, aTop)) {
        horizontalLines.push({ y: ct.centerY, ...fullHExt });
        active.setPositionByOrigin(new fabricModule.Point(aLeft, ct.centerY), 'center', 'center');
        aTop = ct.centerY;
      }
    }
  };

  // ── Draw guide lines after each render ──
  const onAfterRender = (opt: { ctx: CanvasRenderingContext2D }) => {
    if (verticalLines.length === 0 && horizontalLines.length === 0) return;

    const ctx = opt.ctx;
    ctx.save();
    ctx.strokeStyle = GUIDE_COLOR;
    ctx.lineWidth = GUIDE_LINE_WIDTH;
    ctx.setLineDash(GUIDE_DASH);

    for (const line of verticalLines) {
      ctx.beginPath();
      const x = line.x * zoom + vpt[4] + 0.5;
      ctx.moveTo(x, line.y1 * zoom + vpt[5]);
      ctx.lineTo(x, line.y2 * zoom + vpt[5]);
      ctx.stroke();
    }

    for (const line of horizontalLines) {
      ctx.beginPath();
      const y = line.y * zoom + vpt[5] + 0.5;
      ctx.moveTo(line.x1 * zoom + vpt[4], y);
      ctx.lineTo(line.x2 * zoom + vpt[4], y);
      ctx.stroke();
    }

    ctx.restore();
  };

  // ── Clear guide lines on mouse release ──
  const onMouseUp = () => {
    if (verticalLines.length > 0 || horizontalLines.length > 0) {
      verticalLines = [];
      horizontalLines = [];
      canvas.requestRenderAll();
    }
  };

  // ── Register events ──
  canvas.on('mouse:down', onMouseDown);
  canvas.on('object:moving', onObjectMoving as (e: unknown) => void);
  canvas.on('after:render', onAfterRender as (opt: unknown) => void);
  canvas.on('mouse:up', onMouseUp);

  // ── Dispose ──
  return () => {
    canvas.off('mouse:down', onMouseDown);
    canvas.off('object:moving', onObjectMoving as (e: unknown) => void);
    canvas.off('after:render', onAfterRender as (opt: unknown) => void);
    canvas.off('mouse:up', onMouseUp);
  };
}
