'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { HexColorPicker } from 'react-colorful';
import type {
  FillValue,
  GradientValue,
  LinearGradient,
  RadialGradient,
  GradientStop,
} from '@/types/editor';
import { isGradient, fillToCss } from '@/types/editor';

interface GradientPickerProps {
  value: FillValue;
  onChange: (value: FillValue) => void;
  label?: string;
}

type FillMode = 'solid' | 'linear' | 'radial';

function getFillMode(value: FillValue): FillMode {
  if (typeof value === 'string') return 'solid';
  return value.type === 'linear' ? 'linear' : 'radial';
}

function getSolidColor(value: FillValue): string {
  if (typeof value === 'string') return value || '#000000';
  return value.stops[0]?.color ?? '#000000';
}

function getStops(value: FillValue): GradientStop[] {
  if (isGradient(value)) return value.stops;
  return [
    { color: typeof value === 'string' ? value : '#000000', offset: 0 },
    { color: '#ffffff', offset: 1 },
  ];
}

/** Parse a color string (hex, rgba, etc.) into { hex, alpha } */
function parseAlpha(color: string): { hex: string; alpha: number } {
  // rgba(r, g, b, a)
  const rgbaMatch = color.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)$/);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]);
    const g = parseInt(rgbaMatch[2]);
    const b = parseInt(rgbaMatch[3]);
    const a = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    return { hex, alpha: a };
  }
  // #RRGGBBAA (8-digit hex)
  if (/^#[0-9a-fA-F]{8}$/.test(color)) {
    const hex = color.slice(0, 7);
    const alpha = parseInt(color.slice(7, 9), 16) / 255;
    return { hex, alpha: Math.round(alpha * 100) / 100 };
  }
  // #RRGGBB or shorter
  return { hex: color || '#000000', alpha: 1 };
}

/** Combine hex + alpha into rgba string, or return hex if fully opaque */
function toRgba(hex: string, alpha: number): string {
  if (alpha >= 1) return hex;
  // Ensure valid hex
  const h = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#000000';
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${Math.round(alpha * 100) / 100})`;
}

const DEFAULT_LINEAR: LinearGradient = {
  type: 'linear',
  angle: 90,
  stops: [
    { color: '#000000', offset: 0 },
    { color: '#ffffff', offset: 1 },
  ],
};

const DEFAULT_RADIAL: RadialGradient = {
  type: 'radial',
  cx: 0.5,
  cy: 0.5,
  r: 0.5,
  stops: [
    { color: '#000000', offset: 0 },
    { color: '#ffffff', offset: 1 },
  ],
};

// Use shared fillToCss from types

/* ─── Stop Editor Bar ─── */

function StopBar({
  stops,
  selectedIndex,
  onSelect,
  onMove,
  onAdd,
  gradient,
}: {
  stops: GradientStop[];
  selectedIndex: number;
  onSelect: (i: number) => void;
  onMove: (i: number, offset: number) => void;
  onAdd: (offset: number) => void;
  gradient: FillValue;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<number | null>(null);

  const getOffset = useCallback(
    (clientX: number) => {
      if (!barRef.current) return 0;
      const rect = barRef.current.getBoundingClientRect();
      return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    },
    [],
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (draggingRef.current === null) return;
      onMove(draggingRef.current, getOffset(e.clientX));
    };
    const onMouseUp = () => {
      draggingRef.current = null;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [getOffset, onMove]);

  return (
    <div className="mb-3">
      {/* Gradient preview bar */}
      <div
        ref={barRef}
        className="relative h-6 rounded-md border border-gray-200 cursor-crosshair"
        style={{ background: fillToCss(gradient) }}
        onClick={(e) => {
          // Click on empty area → add stop
          const target = e.target as HTMLElement;
          if (target === barRef.current) {
            onAdd(getOffset(e.clientX));
          }
        }}
      >
        {/* Stop handles */}
        {stops.map((stop, i) => (
          <div
            key={i}
            className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 cursor-grab active:cursor-grabbing shadow-sm ${
              i === selectedIndex
                ? 'border-blue-500 ring-2 ring-blue-200 z-10'
                : 'border-white z-0'
            }`}
            style={{
              left: `calc(${stop.offset * 100}% - 8px)`,
              backgroundColor: stop.color,
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              draggingRef.current = i;
              onSelect(i);
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(i);
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Main GradientPicker ─── */

export default function GradientPicker({ value, onChange, label }: GradientPickerProps) {
  const mode = getFillMode(value);
  const [selectedStopIdx, setSelectedStopIdx] = useState(0);
  const [isColorOpen, setIsColorOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close color picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsColorOpen(false);
      }
    };
    if (isColorOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isColorOpen]);

  const switchMode = (newMode: FillMode) => {
    if (newMode === mode) return;
    if (newMode === 'solid') {
      onChange(getSolidColor(value));
    } else if (newMode === 'linear') {
      const stops = isGradient(value) ? value.stops : getStops(value);
      const angle = isGradient(value) && value.type === 'linear' ? value.angle : DEFAULT_LINEAR.angle;
      onChange({ type: 'linear', angle, stops });
    } else {
      const stops = isGradient(value) ? value.stops : getStops(value);
      const prev = isGradient(value) && value.type === 'radial' ? value as RadialGradient : DEFAULT_RADIAL;
      onChange({ type: 'radial', cx: prev.cx, cy: prev.cy, r: prev.r, stops });
    }
    setSelectedStopIdx(0);
  };

  const updateStop = (index: number, update: Partial<GradientStop>) => {
    if (!isGradient(value)) return;
    const newStops = value.stops.map((s, i) => (i === index ? { ...s, ...update } : s));
    onChange({ ...value, stops: newStops } as GradientValue);
  };

  const addStop = (offset: number) => {
    if (!isGradient(value)) return;
    // Interpolate color from neighboring stops
    const sorted = [...value.stops].sort((a, b) => a.offset - b.offset);
    let color = '#888888';
    for (let i = 0; i < sorted.length - 1; i++) {
      if (offset >= sorted[i].offset && offset <= sorted[i + 1].offset) {
        color = sorted[i].color;
        break;
      }
    }
    const newStops = [...value.stops, { color, offset }];
    onChange({ ...value, stops: newStops } as GradientValue);
    setSelectedStopIdx(newStops.length - 1);
  };

  const removeStop = (index: number) => {
    if (!isGradient(value) || value.stops.length <= 2) return;
    const newStops = value.stops.filter((_, i) => i !== index);
    onChange({ ...value, stops: newStops } as GradientValue);
    setSelectedStopIdx(Math.min(selectedStopIdx, newStops.length - 1));
  };

  const rawColor = mode === 'solid'
    ? getSolidColor(value)
    : (isGradient(value) ? value.stops[selectedStopIdx]?.color ?? '#000000' : '#000000');
  const { hex: currentHex, alpha: currentAlpha } = parseAlpha(rawColor);
  const currentColor = currentHex;

  const handleColorChange = (hexColor: string) => {
    if (mode === 'solid') {
      onChange(hexColor);
    } else {
      // Preserve current alpha when changing hex
      updateStop(selectedStopIdx, { color: toRgba(hexColor, currentAlpha) });
    }
  };

  const handleAlphaChange = (newAlpha: number) => {
    if (mode === 'solid') return;
    updateStop(selectedStopIdx, { color: toRgba(currentHex, newAlpha) });
  };

  return (
    <div className="relative" ref={popoverRef}>
      {label && <label className="block text-xs text-gray-500 mb-1">{label}</label>}

      {/* Fill mode selector */}
      <div className="flex gap-0.5 mb-2 bg-gray-100 rounded-md p-0.5">
        {([
          { key: 'solid', label: '단색' },
          { key: 'linear', label: '선형' },
          { key: 'radial', label: '방사' },
        ] as { key: FillMode; label: string }[]).map(({ key, label: btnLabel }) => (
          <button
            key={key}
            type="button"
            className={`flex-1 text-xs py-1 rounded transition-colors ${
              mode === key
                ? 'bg-white text-gray-800 shadow-sm font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => switchMode(key)}
          >
            {btnLabel}
          </button>
        ))}
      </div>

      {/* Preview + trigger */}
      <button
        type="button"
        className="flex items-center gap-2 rounded-md border border-gray-300 px-2 py-1.5 hover:border-gray-400 transition-colors w-full"
        onClick={() => setIsColorOpen(!isColorOpen)}
      >
        <div
          className="h-5 w-5 rounded border border-gray-200 shrink-0"
          style={{
            background: mode === 'solid' ? getSolidColor(value) : fillToCss(value),
          }}
        />
        <span className="text-xs font-mono truncate">
          {mode === 'solid'
            ? getSolidColor(value).toUpperCase()
            : `${mode === 'linear' ? '↗' : '◎'} ${isGradient(value) ? value.stops.length : 2}색`}
        </span>
      </button>

      {/* Expanded editor */}
      {isColorOpen && (
        <div className="absolute z-50 top-full left-0 mt-2 p-3 bg-white rounded-lg shadow-xl border border-gray-200 w-[244px]">
          {/* Gradient stop bar (for gradient modes) */}
          {mode !== 'solid' && isGradient(value) && (
            <>
              <StopBar
                stops={value.stops}
                selectedIndex={selectedStopIdx}
                onSelect={setSelectedStopIdx}
                onMove={(i, offset) => updateStop(i, { offset })}
                onAdd={addStop}
                gradient={value}
              />

              {/* Stop info + remove */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-gray-400">
                  스톱 {selectedStopIdx + 1}/{value.stops.length}
                  {' · '}위치 {Math.round((value.stops[selectedStopIdx]?.offset ?? 0) * 100)}%
                </span>
                {value.stops.length > 2 && (
                  <button
                    type="button"
                    className="text-[10px] text-gray-400 hover:text-red-500 transition-colors"
                    onClick={() => removeStop(selectedStopIdx)}
                  >
                    스톱 삭제
                  </button>
                )}
              </div>
            </>
          )}

          {/* Color picker */}
          <HexColorPicker color={currentColor} onChange={handleColorChange} />
          <input
            type="text"
            value={currentColor}
            onChange={(e) => {
              const val = e.target.value;
              if (/^#[0-9a-fA-F]{0,6}$/.test(val) || val === '' || val === '#') {
                handleColorChange(val);
              }
            }}
            className="mt-2 w-full rounded border border-gray-300 px-2 py-1 text-xs font-mono text-center"
          />

          {/* Alpha slider (gradient mode only) */}
          {mode !== 'solid' && (
            <div className="mt-2.5 pt-2.5 border-t border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-gray-500">투명도</label>
                <span className="text-[10px] text-gray-400 font-mono">{Math.round(currentAlpha * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative h-3 rounded" style={{
                  background: `linear-gradient(to right, transparent, ${currentHex})`,
                  backgroundImage: `linear-gradient(to right, rgba(0,0,0,0), ${currentHex}), repeating-conic-gradient(#d4d4d4 0% 25%, white 0% 50%) 50% / 8px 8px`,
                }}>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={currentAlpha}
                    onChange={(e) => handleAlphaChange(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-sm pointer-events-none"
                    style={{
                      left: `calc(${currentAlpha * 100}% - 6px)`,
                      backgroundColor: toRgba(currentHex, currentAlpha),
                    }}
                  />
                </div>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={Math.round(currentAlpha * 100)}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    if (!isNaN(v)) handleAlphaChange(Math.max(0, Math.min(1, v / 100)));
                  }}
                  className="w-14 px-1.5 py-0.5 text-xs border border-gray-300 rounded text-center"
                />
              </div>
            </div>
          )}

          {/* Gradient-specific controls */}
          {mode === 'linear' && isGradient(value) && value.type === 'linear' && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-500">각도</label>
                <span className="text-xs text-gray-400 font-mono">{value.angle}°</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={value.angle}
                  onChange={(e) =>
                    onChange({ ...value, angle: parseInt(e.target.value) } as LinearGradient)
                  }
                  className="flex-1 accent-blue-500 h-1.5"
                />
                <input
                  type="number"
                  min={0}
                  max={360}
                  value={value.angle}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    if (!isNaN(v)) onChange({ ...value, angle: v } as LinearGradient);
                  }}
                  className="w-14 px-1.5 py-0.5 text-xs border border-gray-300 rounded text-center"
                />
              </div>
            </div>
          )}

          {mode === 'radial' && isGradient(value) && value.type === 'radial' && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
              {([
                { key: 'cx', label: '중심 X', min: 0, max: 1, step: 0.01 },
                { key: 'cy', label: '중심 Y', min: 0, max: 1, step: 0.01 },
                { key: 'r', label: '반지름', min: 0.01, max: 1, step: 0.01 },
              ] as { key: 'cx' | 'cy' | 'r'; label: string; min: number; max: number; step: number }[]).map(
                ({ key, label: sliderLabel, min, max, step }) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] text-gray-500">{sliderLabel}</label>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {Math.round(value[key] * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={value[key]}
                      onChange={(e) =>
                        onChange({ ...value, [key]: parseFloat(e.target.value) } as RadialGradient)
                      }
                      className="w-full accent-blue-500 h-1.5"
                    />
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
