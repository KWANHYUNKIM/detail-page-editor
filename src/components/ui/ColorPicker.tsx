'use client';

import { useState, useRef, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

export default function ColorPicker({ color, onChange, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={popoverRef}>
      {label && <label className="block text-xs text-gray-500 mb-1">{label}</label>}
      <button
        type="button"
        className="flex items-center gap-2 rounded-md border border-gray-300 px-2 py-1.5 hover:border-gray-400 transition-colors w-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div
          className="h-5 w-5 rounded border border-gray-200 shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-mono uppercase truncate">{color}</span>
      </button>
      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-2 p-3 bg-white rounded-lg shadow-xl border border-gray-200">
          <HexColorPicker color={color} onChange={onChange} />
          <input
            type="text"
            value={color}
            onChange={(e) => {
              const val = e.target.value;
              if (/^#[0-9a-fA-F]{0,6}$/.test(val) || val === '' || val === '#') {
                onChange(val);
              }
            }}
            className="mt-2 w-full rounded border border-gray-300 px-2 py-1 text-xs font-mono text-center"
          />
        </div>
      )}
    </div>
  );
}
