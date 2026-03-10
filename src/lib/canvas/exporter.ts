import * as fabric from 'fabric';
import { ExportOptions } from '@/types/editor';

type ImageFormat = 'png' | 'jpeg';

function isImageFormat(format: string): format is ImageFormat {
  return format === 'png' || format === 'jpeg';
}

export function exportCanvasToDataURL(
  canvas: fabric.Canvas,
  options: ExportOptions,
): string {
  const format: ImageFormat = isImageFormat(options.format) ? options.format : 'png';
  return canvas.toDataURL({
    format,
    quality: options.quality,
    multiplier: options.multiplier,
  });
}

export function exportCanvasToSVG(canvas: fabric.Canvas): string {
  return canvas.toSVG();
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
): void {
  if (options.format === 'svg') {
    const svg = exportCanvasToSVG(canvas);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    downloadBlob(blob, `${filename}.svg`);
    return;
  }

  if (options.format === 'pdf') {
    const dataURL = exportCanvasToDataURL(canvas, { ...options, format: 'png' });
    downloadDataURL(dataURL, `${filename}.png`);
    return;
  }

  const dataURL = exportCanvasToDataURL(canvas, options);
  const ext = options.format === 'jpeg' ? 'jpg' : 'png';
  downloadDataURL(dataURL, `${filename}.${ext}`);
}
