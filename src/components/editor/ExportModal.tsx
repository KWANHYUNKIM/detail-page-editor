'use client';

import { useState, useEffect, useRef } from 'react';
import Modal from '@/components/ui/Modal';
import type { ExportFormat, ExportOptions } from '@/types/editor';
import type { CanvasHandle } from '@/components/editor/Canvas';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvasRef: React.RefObject<CanvasHandle | null>;
  projectName: string;
}

export default function ExportModal({
  isOpen,
  onClose,
  canvasRef,
  projectName,
}: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [quality, setQuality] = useState(0.92);
  const [multiplier, setMultiplier] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);

    previewTimeoutRef.current = setTimeout(() => {
      const options: ExportOptions = { format, quality, multiplier: 1 };
      const url = canvasRef.current?.getDataURL(options) ?? '';
      setPreviewUrl(url);
    }, 100);

    return () => {
      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    };
  }, [isOpen, format, quality, canvasRef]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const options: ExportOptions = { format, quality, multiplier };
    canvasRef.current.exportCanvas(projectName, options);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="내보내기">
      <div className="flex flex-col gap-5 min-w-[420px]">
        {previewUrl && (
          <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center">
            <img
              src={previewUrl}
              alt="미리보기"
              className="max-h-[200px] max-w-full object-contain shadow-sm rounded"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">형식</label>
          <div className="flex gap-2">
            {(['png', 'jpeg'] as ExportFormat[]).map((f) => (
              <button
                key={f}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  format === f
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-300 hover:border-gray-400 text-gray-600'
                }`}
                onClick={() => setFormat(f)}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {format === 'jpeg' && (
          <div>
            <label className="block text-sm font-medium mb-2">
              품질 ({Math.round(quality * 100)}%)
            </label>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.01}
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">배율</label>
          <div className="flex gap-2">
            {[1, 2, 3].map((m) => (
              <button
                key={m}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  multiplier === m
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-300 hover:border-gray-400 text-gray-600'
                }`}
                onClick={() => setMultiplier(m)}
              >
                {m}x
              </button>
            ))}
          </div>
        </div>

        <button
          className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          onClick={handleDownload}
        >
          다운로드
        </button>
      </div>
    </Modal>
  );
}
