import * as fabric from 'fabric';
import { ExportOptions } from '@/types/editor';

export function exportCanvasToDataURL(
  canvas: fabric.Canvas,
  options: ExportOptions,
): string {
  return canvas.toDataURL({
    format: options.format,
    quality: options.quality,
    multiplier: options.multiplier,
  });
}

export function downloadDataURL(dataURL: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportAndDownload(
  canvas: fabric.Canvas,
  filename: string,
  options: ExportOptions,
): void {
  const dataURL = exportCanvasToDataURL(canvas, options);
  const ext = options.format === 'jpeg' ? 'jpg' : 'png';
  downloadDataURL(dataURL, `${filename}.${ext}`);
}
