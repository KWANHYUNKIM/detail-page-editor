import * as fabric from 'fabric';
import { ExportOptions } from '@/types/editor';

export interface ContentBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

type ImageFormat = 'png' | 'jpeg';

function isImageFormat(format: string): format is ImageFormat {
  return format === 'png' || format === 'jpeg';
}

export function exportCanvasToDataURL(
  canvas: fabric.Canvas,
  options: ExportOptions,
  bounds?: ContentBounds,
): string {
  const format: ImageFormat = isImageFormat(options.format) ? options.format : 'png';
  return canvas.toDataURL({
    format,
    quality: options.quality,
    multiplier: options.multiplier,
    ...(bounds && {
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height,
    }),
  });
}

export function exportCanvasToSVG(
  canvas: fabric.Canvas,
  bounds?: ContentBounds,
): string {
  const raw = canvas.toSVG();
  if (!bounds) return raw;

  const vb = `${bounds.left} ${bounds.top} ${bounds.width} ${bounds.height}`;
  return raw
    .replace(/width="[^"]*"/, `width="${bounds.width}"`)
    .replace(/height="[^"]*"/, `height="${bounds.height}"`)
    .replace(/viewBox="[^"]*"/, `viewBox="${vb}"`);
}

export function downloadDataURL(dataURL: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportAndDownload(
  canvas: fabric.Canvas,
  filename: string,
  options: ExportOptions,
  bounds?: ContentBounds,
): void {
  if (options.format === 'svg') {
    const svg = exportCanvasToSVG(canvas, bounds);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    downloadBlob(blob, `${filename}.svg`);
    return;
  }

  if (options.format === 'pdf') {
    const dataURL = exportCanvasToDataURL(canvas, { ...options, format: 'png' }, bounds);
    downloadDataURL(dataURL, `${filename}.png`);
    return;
  }

  const dataURL = exportCanvasToDataURL(canvas, options, bounds);
  const ext = options.format === 'jpeg' ? 'jpg' : 'png';
  downloadDataURL(dataURL, `${filename}.${ext}`);
}
