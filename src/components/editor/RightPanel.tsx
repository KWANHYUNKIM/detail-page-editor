'use client';

import { useState } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import type {
  TextElement,
  ShapeElement,
  ImageElement,
  FrameElement,
  FillValue,
} from '@/types/editor';
import GradientPicker from '@/components/ui/GradientPicker';
import FramePropertiesPanel from './FramePropertiesPanel';
import ImagePropertiesPanel from './ImagePropertiesPanel';
import TextPropertiesPanel from './TextPropertiesPanel';
import ShapePropertiesPanel from './ShapePropertiesPanel';

/* ── Reusable small components ── */

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type="number"
        value={value == null || isNaN(value) ? 0 : Math.round(value * 100) / 100}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(v);
        }}
        min={min}
        max={max}
        step={step}
        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 bg-white"
      />
    </div>
  );
}

function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = '',
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-gray-500">{label}</label>
        <span className="text-xs text-gray-400 font-mono tabular-nums">
          {value == null || isNaN(value) ? 0 : Math.round(value * 100) / 100}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value == null || isNaN(value) ? min : value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-blue-500 h-1.5"
      />
    </div>
  );
}

const F_IC = 'flex items-center justify-center';
const F_ICON_BTN = `${F_IC} w-7 h-7 rounded-sm hover:bg-[#e8e8e8] transition-colors`;
const F_SECTION_BORDER = 'border-b border-[#e5e5e5]';
const F_INPUT_BASE = 'w-full h-full bg-transparent text-[11px] text-gray-700 outline-none pr-1.5 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';
const F_LABEL_INPUT = 'flex-1 flex items-center h-7 rounded bg-transparent hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors';
const F_PLUS_PATH = 'M12 6a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 12 6';
const F_MINUS_PATH = 'M6 12a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 6 12';
const F_EYE_PATH = 'M6 12c0-.066.054-.358.313-.825a5.9 5.9 0 0 1 1.12-1.414C8.443 8.816 9.956 8 12 8s3.558.816 4.566 1.76c.508.477.88.98 1.121 1.415.258.467.313.76.313.825 0 .066-.055.358-.313.825-.24.435-.613.938-1.12 1.414C15.557 15.184 14.044 16 12 16s-3.558-.816-4.566-1.76a5.9 5.9 0 0 1-1.121-1.415C6.055 12.358 6 12.065 6 12m-1 0c0-1.25 2.333-5 7-5s7 3.75 7 5-2.333 5-7 5-7-3.75-7-5m8 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m1 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0';

function FPlusSvg({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d={F_PLUS_PATH} /></svg>;
}
function FMinusSvg({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d={F_MINUS_PATH} /></svg>;
}
function FEyeSvg({ visible, size = 16 }: { visible: boolean; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path fill={visible ? '#b3b3b3' : '#e5e5e5'} fillRule="evenodd" clipRule="evenodd" d={F_EYE_PATH} /></svg>;
}

function fillToHex(fill: FillValue): string {
  if (typeof fill === 'string') {
    if (fill.startsWith('#')) return fill.replace('#', '').toUpperCase().slice(0, 6);
    if (fill.startsWith('rgb')) {
      const m = fill.match(/\d+/g);
      if (m && m.length >= 3) return m.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('').toUpperCase();
    }
    return 'FFFFFF';
  }
  return 'Gradient';
}

function FColorChit({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <span className="inline-block rounded-sm border border-gray-300 shrink-0" style={{ width: size, height: size, backgroundColor: color }} />
  );
}

function CanvasSettingsPanel({
  project,
  setCanvasBackground,
  setCanvasSize,
}: {
  project: { canvas: { width: number; height: number; backgroundColor: FillValue } };
  setCanvasBackground: (color: FillValue) => void;
  setCanvasSize: (width: number, height: number) => void;
}) {
  const [bgVisible, setBgVisible] = useState(true);
  const [showInExports, setShowInExports] = useState(true);
  const [exports, setExports] = useState<{ id: string; scale: string; format: string }[]>([]);
  const [variablesOpen, setVariablesOpen] = useState(false);
  const [stylesOpen, setStylesOpen] = useState(false);

  const bgColor = project.canvas.backgroundColor;
  const hexStr = fillToHex(bgColor);
  const isGradientBg = typeof bgColor !== 'string';

  return (
    <div className="w-[280px] bg-white border-l border-gray-200 shrink-0 overflow-y-auto text-[11px]">
      <div className={`flex items-center h-8 px-2 ${F_SECTION_BORDER}`}>
        <span className="text-xs font-medium text-gray-700 px-1">Page</span>
      </div>

      <div className={`px-2 py-1 ${F_SECTION_BORDER}`}>
        <div className="flex gap-1">
          <label className={F_LABEL_INPUT}>
            <span className="pl-1.5 pr-1 text-gray-400 select-none cursor-ew-resize font-medium">W</span>
            <input
              type="number"
              value={Math.round(project.canvas.width)}
              min={100}
              onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 100) setCanvasSize(v, project.canvas.height); }}
              className={F_INPUT_BASE}
            />
          </label>
          <label className={F_LABEL_INPUT}>
            <span className="pl-1.5 pr-1 text-gray-400 select-none cursor-ew-resize font-medium">H</span>
            <input
              type="number"
              value={Math.round(project.canvas.height)}
              min={100}
              onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 100) setCanvasSize(project.canvas.width, v); }}
              className={F_INPUT_BASE}
            />
          </label>
        </div>
      </div>

      <div className={F_SECTION_BORDER}>
        <div className="flex items-center justify-between px-2 py-1.5">
          <h2 className="text-[11px] font-medium text-gray-800">Page background</h2>
        </div>

        <div className="group px-2 py-1 flex items-center gap-1.5 hover:bg-gray-50">
          <FColorChit color={typeof bgColor === 'string' ? bgColor : '#ccc'} />
          <span className="flex-1 text-[11px] text-gray-700 font-mono truncate">{hexStr}</span>
          <span className="text-gray-400 text-[10px]">100%</span>
          <button
            type="button"
            title="Toggle visibility"
            onClick={() => setBgVisible(!bgVisible)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <FEyeSvg visible={bgVisible} size={14} />
          </button>
        </div>

        <div className="px-2 pb-2 pt-1">
          <GradientPicker label="" value={bgColor} onChange={setCanvasBackground} />
        </div>

        <div className="px-2 py-1 pb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showInExports}
              onChange={(e) => setShowInExports(e.target.checked)}
              className="w-3 h-3 rounded border-gray-300 text-blue-500 focus:ring-blue-500 focus:ring-1 cursor-pointer"
            />
            <span className="text-gray-500 text-[10px]">Show in exports</span>
          </label>
        </div>
      </div>

      <div className={F_SECTION_BORDER}>
        <div className="flex items-center justify-between px-2 py-1.5">
          <h2 className="text-[11px] font-medium text-gray-800">Variables</h2>
          <button
            type="button"
            onClick={() => setVariablesOpen(!variablesOpen)}
            className={`${F_IC} w-5 h-5 rounded-sm hover:bg-[#e8e8e8] transition-colors text-gray-400`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M7 6.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0 4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m.5 3.5a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1zm-.5 4.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5" />
            </svg>
          </button>
        </div>
        {variablesOpen && (
          <div className="px-2 pb-2">
            <span className="text-[10px] text-gray-400">No variables defined</span>
          </div>
        )}
      </div>

      <div className={F_SECTION_BORDER}>
        <div className="flex items-center justify-between px-2 py-1.5">
          <h2 className="text-[11px] font-medium text-gray-800">Styles</h2>
          <button
            type="button"
            onClick={() => setStylesOpen(!stylesOpen)}
            className={`${F_IC} w-5 h-5 rounded-sm hover:bg-[#e8e8e8] transition-colors text-gray-400`}
          >
            <FPlusSvg />
          </button>
        </div>
        {stylesOpen && (
          <div className="px-2 pb-2 space-y-1">
            <div className="text-[10px] text-gray-400 font-medium">Color styles</div>
            <div className="text-[10px] text-gray-400 font-medium">Layout guide styles</div>
          </div>
        )}
      </div>

      <div className={F_SECTION_BORDER}>
        <div className="flex items-center justify-between px-2 py-1.5">
          <h2 className="text-[11px] font-medium text-gray-800">Export</h2>
          <button
            type="button"
            title="Add export"
            onClick={() => setExports([...exports, { id: crypto.randomUUID(), scale: '1x', format: 'png' }])}
            className={`${F_IC} w-5 h-5 rounded-sm hover:bg-[#e8e8e8] transition-colors text-gray-400`}
          >
            <FPlusSvg />
          </button>
        </div>
        {exports.map((ex, i) => (
          <div key={ex.id} className="group px-2 py-1 flex items-center gap-1">
            <span className="text-gray-400 cursor-grab shrink-0">
              <svg width="10" height="16" viewBox="0 0 16 32" fill="none"><path fill="currentColor" fillRule="evenodd" d="M5 12.5h6v1H5zm0 3h6v1H5zm0 3h6v1H5z" /></svg>
            </span>
            <select
              value={ex.scale}
              onChange={(e) => { const ne = [...exports]; ne[i] = { ...ex, scale: e.target.value }; setExports(ne); }}
              className="w-12 h-6 text-[10px] bg-transparent border border-gray-200 rounded outline-none cursor-pointer"
            >
              {['0.5x', '1x', '1.5x', '2x', '3x', '4x'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={ex.format}
              onChange={(e) => { const ne = [...exports]; ne[i] = { ...ex, format: e.target.value }; setExports(ne); }}
              className="flex-1 h-6 text-[10px] bg-transparent border border-gray-200 rounded outline-none cursor-pointer"
            >
              {['png', 'jpeg', 'svg', 'pdf'].map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
            </select>
            <button
              type="button"
              title="Remove"
              onClick={() => setExports(exports.filter((_, j) => j !== i))}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
            >
              <FMinusSvg size={14} />
            </button>
          </div>
        ))}
        {exports.length > 0 && (
          <div className="px-2 pb-2 pt-1">
            <button
              type="button"
              className="w-full py-1.5 text-[11px] font-medium text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Export Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Panel ── */

export default function RightPanel() {
  const project = useEditorStore((s) => s.project);
  const mode = useEditorStore((s) => s.mode);
  const selectedElementIds = useEditorStore((s) => s.selectedElementIds);
  const getSelectedElements = useEditorStore((s) => s.getSelectedElements);
  const updateElement = useEditorStore((s) => s.updateElement);
  const setCanvasBackground = useEditorStore((s) => s.setCanvasBackground);
  const setCanvasSize = useEditorStore((s) => s.setCanvasSize);
  const alignElements = useEditorStore((s) => s.alignElements);
  const distributeElements = useEditorStore((s) => s.distributeElements);
  const [aspectLocked, setAspectLocked] = useState(false);

  // Subscribe to selectedElementIds to trigger re-render on selection change
  // (getSelectedElements alone is a stable function ref that won't re-trigger)
  const selected = getSelectedElements();
  void selectedElementIds; // ensure subscription is active

  if (!project) return null;

  /* ── No selection: canvas settings (Figma style) ── */
  if (selected.length === 0) {
    return <CanvasSettingsPanel project={project} setCanvasBackground={setCanvasBackground} setCanvasSize={setCanvasSize} />;
  }

  /* ── Multi selection: alignment & distribution tools ── */
  if (selected.length > 1) {
    const ids = selected.map((el) => el.id);
    return (
      <div className="w-[280px] bg-white border-l border-gray-200 shrink-0 overflow-y-auto p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          {selected.length}개 요소 선택됨
        </h3>

        {/* Alignment */}
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-2">정렬</label>
          <div className="grid grid-cols-6 gap-1">
            <button type="button" title="왼쪽 정렬" onClick={() => alignElements(ids, 'left')}
              className="flex items-center justify-center p-2 rounded hover:bg-gray-100 border border-gray-200 text-gray-600">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1v12M4 3h7v3H4zM4 8h5v3H4z" stroke="currentColor" strokeWidth="1.2"/></svg>
            </button>
            <button type="button" title="가로 가운데 정렬" onClick={() => alignElements(ids, 'centerH')}
              className="flex items-center justify-center p-2 rounded hover:bg-gray-100 border border-gray-200 text-gray-600">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M3 3h8v3H3zM4 8h6v3H4z" stroke="currentColor" strokeWidth="1.2"/></svg>
            </button>
            <button type="button" title="오른쪽 정렬" onClick={() => alignElements(ids, 'right')}
              className="flex items-center justify-center p-2 rounded hover:bg-gray-100 border border-gray-200 text-gray-600">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M13 1v12M3 3h7v3H3zM5 8h5v3H5z" stroke="currentColor" strokeWidth="1.2"/></svg>
            </button>
            <button type="button" title="위쪽 정렬" onClick={() => alignElements(ids, 'top')}
              className="flex items-center justify-center p-2 rounded hover:bg-gray-100 border border-gray-200 text-gray-600">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1h12M3 4v7h3V4zM8 4v5h3V4z" stroke="currentColor" strokeWidth="1.2"/></svg>
            </button>
            <button type="button" title="세로 가운데 정렬" onClick={() => alignElements(ids, 'centerV')}
              className="flex items-center justify-center p-2 rounded hover:bg-gray-100 border border-gray-200 text-gray-600">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M3 3v8h3V3zM8 4v6h3V4z" stroke="currentColor" strokeWidth="1.2"/></svg>
            </button>
            <button type="button" title="아래쪽 정렬" onClick={() => alignElements(ids, 'bottom')}
              className="flex items-center justify-center p-2 rounded hover:bg-gray-100 border border-gray-200 text-gray-600">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 13h12M3 3v7h3V3zM8 5v5h3V5z" stroke="currentColor" strokeWidth="1.2"/></svg>
            </button>
          </div>
        </div>

        {/* Distribution (only when 3+ elements) */}
        {selected.length >= 3 && (
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-2">균등 분배</label>
            <div className="grid grid-cols-2 gap-1">
              <button type="button" onClick={() => distributeElements(ids, 'horizontal')}
                className="flex items-center justify-center gap-1.5 p-2 rounded hover:bg-gray-100 border border-gray-200 text-xs text-gray-600">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1v12M13 1v12M4 4h2v6H4zM8 4h2v6H8z" stroke="currentColor" strokeWidth="1.2"/></svg>
                가로 분배
              </button>
              <button type="button" onClick={() => distributeElements(ids, 'vertical')}
                className="flex items-center justify-center gap-1.5 p-2 rounded hover:bg-gray-100 border border-gray-200 text-xs text-gray-600">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1h12M1 13h12M4 4v2h6V4zM4 8v2h6V8z" stroke="currentColor" strokeWidth="1.2"/></svg>
                세로 분배
              </button>
            </div>
          </div>
        )}

        {/* Common opacity */}
        <div className="mb-4">
          <SliderInput
            label="불투명도"
            value={Math.round(selected.reduce((sum, e) => sum + e.opacity, 0) / selected.length * 100)}
            onChange={(v) => {
              const opacity = v / 100;
              ids.forEach((id) => updateElement(id, { opacity }));
            }}
            min={0}
            max={100}
            step={1}
            suffix="%"
          />
        </div>

        {/* Common fill */}
        <div className="mb-4">
          <GradientPicker
            label="채우기"
            value={(() => {
              const fills = selected.filter(e => 'fill' in e).map(e => (e as ShapeElement | FrameElement).fill);
              const first = fills[0];
              if (!first || fills.some(f => JSON.stringify(f) !== JSON.stringify(first))) return '#cccccc';
              return first;
            })()}
            onChange={(fill) => {
              ids.forEach(id => {
                const el = selected.find(e => e.id === id);
                if (el && 'fill' in el) updateElement(id, { fill });
              });
            }}
          />
        </div>

        {/* Common stroke */}
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1.5">선 (Stroke)</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-400 mb-0.5">색상</label>
              <input
                type="color"
                value={(() => {
                  const el = selected[0];
                  return 'stroke' in el ? (el as ShapeElement | FrameElement).stroke || '#000000' : '#000000';
                })()}
                onChange={(e) => ids.forEach(id => {
                  const el = selected.find(e => e.id === id);
                  if (el && 'stroke' in el) updateElement(id, { stroke: e.target.value });
                })}
                className="w-full h-8 rounded border border-gray-300 cursor-pointer"
              />
            </div>
            <NumberInput
              label="두께"
              value={Math.round(selected.filter(e => 'strokeWidth' in e).reduce((sum, e) => sum + (e as ShapeElement | FrameElement).strokeWidth, 0) / Math.max(selected.filter(e => 'strokeWidth' in e).length, 1))}
              onChange={(v) => ids.forEach(id => {
                const el = selected.find(e => e.id === id);
                if (el && 'strokeWidth' in el) updateElement(id, { strokeWidth: v });
              })}
              min={0}
              max={50}
              step={1}
            />
          </div>
        </div>

        {/* Common blend mode */}
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">블렌드 모드</label>
          <select
            value={(() => {
              const modes = selected.map(e => e.blendMode || 'normal');
              return modes.every(m => m === modes[0]) ? modes[0] : 'normal';
            })()}
            onChange={(e) => ids.forEach(id => updateElement(id, { blendMode: e.target.value }))}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md bg-white"
          >
            <option value="normal">Normal</option>
            <option value="multiply">Multiply</option>
            <option value="screen">Screen</option>
            <option value="overlay">Overlay</option>
            <option value="darken">Darken</option>
            <option value="lighten">Lighten</option>
            <option value="color-dodge">Color Dodge</option>
            <option value="color-burn">Color Burn</option>
            <option value="hard-light">Hard Light</option>
            <option value="soft-light">Soft Light</option>
            <option value="difference">Difference</option>
            <option value="exclusion">Exclusion</option>
          </select>
        </div>

        {/* Bounding box info */}
        <div className="pt-3 border-t border-gray-100">
          <label className="block text-xs text-gray-500 mb-2">선택 영역</label>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div>X: {Math.round(Math.min(...selected.map((e) => e.x)))}</div>
            <div>Y: {Math.round(Math.min(...selected.map((e) => e.y)))}</div>
            <div>W: {Math.round(Math.max(...selected.map((e) => e.x + e.width)) - Math.min(...selected.map((e) => e.x)))}</div>
            <div>H: {Math.round(Math.max(...selected.map((e) => e.y + e.height)) - Math.min(...selected.map((e) => e.y)))}</div>
          </div>
        </div>
      </div>
    );
  }

  const el = selected[0];

  /* ── Consumer mode: non-editable ── */
  if (mode === 'dev' && !el.editable) {
    return (
      <div className="w-[280px] bg-white border-l border-gray-200 shrink-0 overflow-y-auto p-4">
        <p className="text-sm text-gray-400 text-center py-8">
          이 요소는 편집할 수 없습니다
        </p>
      </div>
    );
  }

  const handleUpdate = (updates: Record<string, unknown>) => {
    updateElement(el.id, updates);
  };

  if (el.type === 'frame') {
    return <FramePropertiesPanel frame={el as FrameElement} handleUpdate={handleUpdate} alignElements={alignElements} distributeElements={distributeElements} aspectLocked={aspectLocked} setAspectLocked={setAspectLocked} />;
  }

  if (el.type === 'image') {
    return <ImagePropertiesPanel image={el as ImageElement} handleUpdate={handleUpdate} alignElements={alignElements} distributeElements={distributeElements} aspectLocked={aspectLocked} setAspectLocked={setAspectLocked} />;
  }

  if (el.type === 'text') {
    return <TextPropertiesPanel text={el as TextElement} handleUpdate={handleUpdate} alignElements={alignElements} distributeElements={distributeElements} aspectLocked={aspectLocked} setAspectLocked={setAspectLocked} />;
  }

  return <ShapePropertiesPanel shape={el as ShapeElement} handleUpdate={handleUpdate} alignElements={alignElements} distributeElements={distributeElements} aspectLocked={aspectLocked} setAspectLocked={setAspectLocked} />;
}
