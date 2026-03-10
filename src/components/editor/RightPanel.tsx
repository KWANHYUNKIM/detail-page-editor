'use client';

import { useRef, useState } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import type {
  TextElement,
  ShapeElement,
  ImageElement,
  ImageScaleMode,
  TextAlign,
  FontWeight,
  FontStyle,
  TextDecoration,
  FrameElement,
  FillValue,
  DropShadow,
  InnerShadow,
} from '@/types/editor';
import { FONT_SIZE_OPTIONS } from '@/constants/fonts';
import ColorPicker from '@/components/ui/ColorPicker';
import GradientPicker from '@/components/ui/GradientPicker';
import FontPicker from '@/components/ui/FontPicker';
import {
  HiBars3BottomLeft,
  HiBars3,
  HiBars3BottomRight,
  HiChevronDown,
  HiChevronRight,
  HiArrowPath,
  HiArrowUpTray,
  HiLockClosed,
  HiLockOpen,
} from 'react-icons/hi2';

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

function ToggleSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      className="flex items-center justify-between w-full group"
      onClick={() => onChange(!checked)}
    >
      <span className="text-xs font-medium text-gray-600 group-hover:text-gray-800 transition-colors">
        {label}
      </span>
      <div
        className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
          checked ? 'bg-blue-500' : 'bg-gray-300'
        }`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </div>
    </button>
  );
}

function SectionAccordion({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100">
      <button
        type="button"
        className="flex items-center justify-between w-full p-4 hover:bg-gray-50/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {open ? (
          <HiChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <HiChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {open && <div className="px-4 pb-4 -mt-1">{children}</div>}
    </div>
  );
}

/* ── Image upload button ── */

function ImageUploadButton({ onUpload }: { onUpload: (dataUrl: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onUpload(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };
  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
      >
        <HiArrowUpTray className="w-4 h-4" />
        이미지 교체
      </button>
    </>
  );
}

/* ── Pill button for style toggles ── */

function PillButton({
  active,
  onClick,
  children,
  className = '',
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`flex-1 flex items-center justify-center px-2 py-1.5 rounded-md border text-xs transition-colors ${
        active
          ? 'border-blue-500 bg-blue-50 text-blue-600'
          : 'border-gray-300 hover:border-gray-400 text-gray-600'
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
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

  /* ── No selection: canvas settings ── */
  if (selected.length === 0) {
    return (
      <div className="w-[280px] bg-white border-l border-gray-200 shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold mb-3">캔버스 설정</h3>
          <div className="grid grid-cols-2 gap-2">
            <NumberInput
              label="너비"
              value={project.canvas.width}
              onChange={(w) => setCanvasSize(w, project.canvas.height)}
              min={100}
            />
            <NumberInput
              label="높이"
              value={project.canvas.height}
              onChange={(h) => setCanvasSize(project.canvas.width, h)}
              min={100}
            />
          </div>
          <div className="mt-3">
            <GradientPicker
              label="배경 색상"
              value={project.canvas.backgroundColor}
              onChange={setCanvasBackground}
            />
          </div>
        </div>
      </div>
    );
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

  const isConsumerLimited = mode === 'dev' && el.editable;
  const editableProps = el.editableProps ?? [];

  const canEdit = (prop: string) => {
    if (!isConsumerLimited) return true;
    return editableProps.includes(prop);
  };

  const handleUpdate = (updates: Record<string, unknown>) => {
    updateElement(el.id, updates);
  };

  const textEl = el.type === 'text' ? (el as TextElement) : null;

  /* ━━━━━━━━━━ FRAME / SECTION — Figma-style panel ━━━━━━━━━━ */
  if (el.type === 'frame') {
    const frame = el as FrameElement;
    return (
      <div className="w-[280px] bg-white border-l border-gray-200 shrink-0 overflow-y-auto text-[11px]">
        {/* ── Header ── */}
        <div className="flex items-center h-8 px-2 border-b border-[#e5e5e5]">
          <span className="text-xs font-medium text-gray-700">{frame.isSection ? 'Section' : 'Frame'}</span>
        </div>

        {/* ── Alignment ── */}
        <div className="px-2 py-1.5 border-b border-[#e5e5e5]">
          <div className="flex gap-px">
            {/* Row 1: Horizontal alignment */}
            <div className="flex flex-1 gap-px">
              {([
                { dir: 'left' as const, title: 'Align left', paths: [{ d: 'M17.25 10a.75.75 0 0 0 .75-.75v-.5a.75.75 0 0 0-.75-.75h-8.5a.75.75 0 0 0-.75.75v.5c0 .414.336.75.75.75zm-4 5a.75.75 0 0 0 .75-.75v-.5a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 0-.75.75v.5c0 .414.336.75.75.75z' }, { d: 'M6 17.5a.5.5 0 0 1-1 0v-12a.5.5 0 0 1 1 0z', tertiary: true }] },
                { dir: 'centerH' as const, title: 'Align horizontal centers', paths: [{ d: 'M17.25 10a.75.75 0 0 0 .75-.75v-.5a.75.75 0 0 0-.75-.75h-9.5a.75.75 0 0 0-.75.75v.5c0 .414.336.75.75.75zm-2 5a.75.75 0 0 0 .75-.75v-.5a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v.5c0 .414.336.75.75.75z' }, { d: 'M13 17.5a.5.5 0 0 1-1 0V15h1zm0-4.5v-3h-1v3zm0-7.5V8h-1V5.5a.5.5 0 0 1 1 0', tertiary: true }] },
                { dir: 'right' as const, title: 'Align right', paths: [{ d: 'M6.75 10A.75.75 0 0 1 6 9.25v-.5A.75.75 0 0 1 6.75 8h8.5a.75.75 0 0 1 .75.75v.5a.75.75 0 0 1-.75.75zm4 5a.75.75 0 0 1-.75-.75v-.5a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v.5a.75.75 0 0 1-.75.75z' }, { d: 'M18 17.5a.5.5 0 0 0 1 0v-12a.5.5 0 0 0-1 0z', tertiary: true }] },
              ]).map(({ dir, title, paths }) => (
                <button key={dir} type="button" title={title} onClick={() => alignElements([el.id], dir)}
                  className="flex items-center justify-center w-7 h-7 rounded-sm hover:bg-[#e8e8e8] transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    {paths.map((p, i) => (
                      <path key={i} fill={p.tertiary ? '#cdcdcd' : '#b3b3b3'} fillRule="evenodd" clipRule="evenodd" d={p.d} />
                    ))}
                  </svg>
                </button>
              ))}
            </div>
            <div className="w-px bg-[#e5e5e5] mx-1" />
            {/* Row 2: Vertical alignment */}
            <div className="flex flex-1 gap-px">
              {([
                { dir: 'top' as const, title: 'Align top', paths: [{ d: 'M10 17.25a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1-.75-.75v-8.5A.75.75 0 0 1 8.75 8h.5a.75.75 0 0 1 .75.75zm5-4a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 .75.75z' }, { d: 'M17.5 6a.5.5 0 0 0 0-1h-12a.5.5 0 0 0 0 1z', tertiary: true }] },
                { dir: 'centerV' as const, title: 'Align vertical centers', paths: [{ d: 'M10 6.75A.75.75 0 0 0 9.25 6h-.5a.75.75 0 0 0-.75.75v9.5c0 .414.336.75.75.75h.5a.75.75 0 0 0 .75-.75zm5 2a.75.75 0 0 0-.75-.75h-.5a.75.75 0 0 0-.75.75v5.5c0 .414.336.75.75.75h.5a.75.75 0 0 0 .75-.75z' }, { d: 'M17.5 11a.5.5 0 0 1 0 1H15v-1zM13 11h-3v1h3zm-7.5 0H8v1H5.5a.5.5 0 0 1 0-1', tertiary: true }] },
                { dir: 'bottom' as const, title: 'Align bottom', paths: [{ d: 'M10 6.75A.75.75 0 0 0 9.25 6h-.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h.5a.75.75 0 0 0 .75-.75zm5 4a.75.75 0 0 0-.75-.75h-.5a.75.75 0 0 0-.75.75v4.5c0 .414.336.75.75.75h.5a.75.75 0 0 0 .75-.75z' }, { d: 'M17.5 18a.5.5 0 0 1 0 1h-12a.5.5 0 0 1 0-1z', tertiary: true }] },
              ]).map(({ dir, title, paths }) => (
                <button key={dir} type="button" title={title} onClick={() => alignElements([el.id], dir)}
                  className="flex items-center justify-center w-7 h-7 rounded-sm hover:bg-[#e8e8e8] transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    {paths.map((p, i) => (
                      <path key={i} fill={p.tertiary ? '#cdcdcd' : '#b3b3b3'} fillRule="evenodd" clipRule="evenodd" d={p.d} />
                    ))}
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Position (X / Y) ── */}
        <div className="px-2 py-1 border-b border-[#e5e5e5]">
          <div className="flex gap-1">
            {(['x', 'y'] as const).map((axis) => (
              <label key={axis} className="flex-1 flex items-center h-7 rounded bg-transparent hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
                <span className="pl-1.5 pr-1 text-gray-400 select-none cursor-ew-resize font-medium uppercase">{axis === 'x' ? 'X' : 'Y'}</span>
                <input
                  type="number"
                  value={Math.round(el[axis])}
                  onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) handleUpdate({ [axis]: v }); }}
                  className="w-full h-full bg-transparent text-[11px] text-gray-700 outline-none pr-1.5 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </label>
            ))}
          </div>
        </div>

        {/* ── Dimensions (W / H) + Aspect Lock ── */}
        <div className="px-2 py-1 border-b border-[#e5e5e5]">
          <div className="flex gap-1 items-center">
            <label className="flex-1 flex items-center h-7 rounded bg-transparent hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
              <span className="pl-1.5 pr-1 text-gray-400 select-none cursor-ew-resize font-medium">W</span>
              <input
                type="number"
                value={Math.round(el.width)}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (isNaN(v)) return;
                  if (aspectLocked && el.width > 0) {
                    const ratio = el.height / el.width;
                    handleUpdate({ width: v, height: Math.round(v * ratio) });
                  } else {
                    handleUpdate({ width: v });
                  }
                }}
                min={1}
                className="w-full h-full bg-transparent text-[11px] text-gray-700 outline-none pr-1.5 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </label>
            <button
              type="button"
              title="Lock aspect ratio"
              onClick={() => setAspectLocked(!aspectLocked)}
              className={`flex items-center justify-center w-5 h-5 rounded-sm transition-colors shrink-0 ${aspectLocked ? 'text-blue-500' : 'text-gray-300 hover:text-gray-500'}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M7.5 7h9a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5M6 7.5A1.5 1.5 0 0 1 7.5 6h9A1.5 1.5 0 0 1 18 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 16.5zM9.5 9a.5.5 0 0 0-.5.5v2a.5.5 0 0 0 1 0V10h1.5a.5.5 0 0 0 0-1zm5.5 3.5a.5.5 0 0 0-1 0V14h-1.5a.5.5 0 0 0 0 1h2a.5.5 0 0 0 .5-.5z" />
              </svg>
            </button>
            <label className="flex-1 flex items-center h-7 rounded bg-transparent hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
              <span className="pl-1.5 pr-1 text-gray-400 select-none cursor-ew-resize font-medium">H</span>
              <input
                type="number"
                value={Math.round(el.height)}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (isNaN(v)) return;
                  if (aspectLocked && el.height > 0) {
                    const ratio = el.width / el.height;
                    handleUpdate({ height: v, width: Math.round(v * ratio) });
                  } else {
                    handleUpdate({ height: v });
                  }
                }}
                min={1}
                className="w-full h-full bg-transparent text-[11px] text-gray-700 outline-none pr-1.5 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </label>
          </div>
        </div>

        {/* ── Rotation + Rotate90 / Flip H / Flip V ── */}
        <div className="px-2 py-1 border-b border-[#e5e5e5]">
          <div className="flex gap-1 items-center">
            <label className="flex-1 flex items-center h-7 rounded bg-transparent hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
              <span className="pl-1 pr-0.5 text-gray-400 shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M9 8.5a.5.5 0 0 0-1 0v7a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 0-1H13a4 4 0 0 0-4-4zM9 12v3h3a3 3 0 0 0-3-3" />
                </svg>
              </span>
              <input
                type="text"
                value={`${Math.round(el.rotation)}°`}
                onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) handleUpdate({ rotation: v }); }}
                className="w-full h-full bg-transparent text-[11px] text-gray-700 outline-none pr-1.5"
              />
            </label>
            <div className="flex gap-px shrink-0">
              <button type="button" title="Rotate 90 right" onClick={() => handleUpdate({ rotation: (el.rotation + 90) % 360 })}
                className="flex items-center justify-center w-7 h-7 rounded-sm hover:bg-[#e8e8e8] transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path fill="#b3b3b3" fillRule="evenodd" clipRule="evenodd" d="M10.233 6.474a2.5 2.5 0 0 1 3.535 0L15.293 8H14a.5.5 0 0 0 0 1h2.5a.5.5 0 0 0 .5-.5V6a.5.5 0 1 0-1 0v1.292l-1.525-1.525a3.5 3.5 0 0 0-4.95 0L7.147 8.146a.5.5 0 0 0 .707.707zm2.828 3.172a1.5 1.5 0 0 0-2.121 0l-3.293 3.293a1.5 1.5 0 0 0 0 2.121l3.293 3.293a1.5 1.5 0 0 0 2.12 0l3.294-3.293a1.5 1.5 0 0 0 0-2.121zm-1.414.707a.5.5 0 0 1 .707 0l3.293 3.293a.5.5 0 0 1 0 .707l-3.293 3.293a.5.5 0 0 1-.707 0l-3.293-3.293a.5.5 0 0 1 0-.707z" />
                </svg>
              </button>
              <button type="button" title="Flip horizontal"
                onClick={() => handleUpdate({ flipX: !(el.flipX ?? false) })}
                className={`flex items-center justify-center w-7 h-7 rounded-sm transition-colors ${(el.flipX ?? false) ? 'bg-blue-50' : 'hover:bg-[#e8e8e8]'}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path fill={(el.flipX ?? false) ? '#3b82f6' : '#b3b3b3'} fillRule="evenodd" clipRule="evenodd" d="M12.5 6.5a.5.5 0 0 0-1 0v11a.5.5 0 0 0 1 0zM6 9.104a.75.75 0 0 1 1.28-.53L10 11.292a1 1 0 0 1 0 1.414l-2.72 2.72a.75.75 0 0 1-1.28-.53zm1 .603v4.586L9.293 12zm11-.603a.75.75 0 0 0-1.28-.53L14 11.292a1 1 0 0 0 0 1.414l2.72 2.72a.75.75 0 0 0 1.28-.53zm-1 .603v4.586L14.707 12z" />
                </svg>
              </button>
              <button type="button" title="Flip vertical"
                onClick={() => handleUpdate({ flipY: !(el.flipY ?? false) })}
                className={`flex items-center justify-center w-7 h-7 rounded-sm transition-colors ${(el.flipY ?? false) ? 'bg-blue-50' : 'hover:bg-[#e8e8e8]'}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path fill={(el.flipY ?? false) ? '#3b82f6' : '#b3b3b3'} fillRule="evenodd" clipRule="evenodd" d="M17.5 12.5a.5.5 0 0 0 0-1h-11a.5.5 0 0 0 0 1zM14.896 18a.75.75 0 0 0 .53-1.28L12.708 14a1 1 0 0 0-1.414 0l-2.72 2.72a.75.75 0 0 0 .53 1.28zm-.603-1H9.707L12 14.707zm.603-11a.75.75 0 0 1 .53 1.28L12.708 10a1 1 0 0 1-1.414 0l-2.72-2.72A.75.75 0 0 1 9.103 6zm-.603 1H9.707L12 9.293z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── Clip content ── */}
        <div className="px-2 py-1.5 border-b border-[#e5e5e5]">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={frame.clipContent}
              onChange={(e) => handleUpdate({ clipContent: e.target.checked })}
              className="w-3.5 h-3.5 rounded border-gray-300 text-blue-500 focus:ring-blue-500 focus:ring-1 cursor-pointer"
            />
            <span className="text-gray-600">Clip content</span>
          </label>
        </div>

        {/* ── Appearance ── */}
        <div className="border-b border-[#e5e5e5]">
          <div className="px-2 pt-2 pb-0.5">
            <h2 className="text-[11px] font-medium text-gray-800">Appearance</h2>
          </div>

          {/* Opacity */}
          <div className="px-2 py-1">
            <div className="flex items-center gap-1">
              <span className="text-gray-400 shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M8 7h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1M6 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2zm9 1.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1M13.5 11a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0m-2 2a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0m-2 2a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0m1.5.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1m2-2a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1m.5 1.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0m2-4a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0m-.5 2.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1m.5 1.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0" />
                </svg>
              </span>
              <input
                type="text"
                value={`${Math.round(el.opacity * 100)}%`}
                onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) handleUpdate({ opacity: Math.min(1, Math.max(0, v / 100)) }); }}
                className="flex-1 h-7 bg-transparent text-[11px] text-gray-700 outline-none rounded hover:bg-gray-50 px-1.5 border border-transparent hover:border-gray-200 transition-colors"
              />
              <button type="button" title={el.visible ? 'Hide' : 'Show'}
                onClick={() => handleUpdate({ visible: !el.visible })}
                className="flex items-center justify-center w-6 h-6 rounded-sm hover:bg-[#e8e8e8] transition-colors shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path fill={el.visible ? '#b3b3b3' : '#e5e5e5'} fillRule="evenodd" clipRule="evenodd" d="M6 12c0-.066.054-.358.313-.825a5.9 5.9 0 0 1 1.12-1.414C8.443 8.816 9.956 8 12 8s3.558.816 4.566 1.76c.508.477.88.98 1.121 1.415.258.467.313.76.313.825 0 .066-.055.358-.313.825-.24.435-.613.938-1.12 1.414C15.557 15.184 14.044 16 12 16s-3.558-.816-4.566-1.76a5.9 5.9 0 0 1-1.121-1.415C6.055 12.358 6 12.065 6 12m-1 0c0-1.25 2.333-5 7-5s7 3.75 7 5-2.333 5-7 5-7-3.75-7-5m8 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m1 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0" />
                </svg>
              </button>
            </div>
            <div className="mt-1 px-0.5">
              <input
                type="range" min={0} max={100} step={1}
                value={Math.round(el.opacity * 100)}
                onChange={(e) => handleUpdate({ opacity: parseFloat(e.target.value) / 100 })}
                className="w-full h-1 accent-blue-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Corner Radius */}
          <div className="px-2 py-1">
            <div className="flex items-center gap-1">
              <span className="text-gray-400 shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M8.9 6h-.02c-.403 0-.735 0-1.006.022-.28.023-.54.072-.782.196a2 2 0 0 0-.874.874c-.124.243-.173.501-.196.782C6 8.144 6 8.477 6 8.88v.62a.5.5 0 0 0 1 0v-.6c0-.428 0-.72.019-.944.018-.22.05-.332.09-.41a1 1 0 0 1 .437-.437c.078-.04.19-.072.41-.09C8.18 7 8.472 7 8.9 7h.6a.5.5 0 0 0 0-1zm6.2 0h.02c.403 0 .735 0 1.006.022.281.023.54.072.782.196a2 2 0 0 1 .874.874c.124.243.173.501.196.782.022.27.022.603.022 1.005V9.5a.5.5 0 0 1-1 0v-.6c0-.428 0-.72-.019-.944-.018-.22-.05-.332-.09-.41a1 1 0 0 0-.437-.437c-.078-.04-.19-.072-.41-.09A13 13 0 0 0 15.1 7h-.6a.5.5 0 0 1 0-1zm.02 12h-.62a.5.5 0 0 1 0-1h.6c.428 0 .72 0 .944-.019.22-.018.332-.05.41-.09a1 1 0 0 0 .437-.437c.04-.078.072-.19.09-.41.019-.225.019-.516.019-.944v-.6a.5.5 0 0 1 1 0v.62c0 .403 0 .735-.022 1.006-.023.281-.072.54-.196.782a2 2 0 0 1-.874.874c-.243.124-.501.173-.782.196-.27.022-.603.022-1.005.022M8.9 18h-.02c-.403 0-.735 0-1.006-.022-.281-.023-.54-.072-.782-.196a2 2 0 0 1-.874-.874c-.124-.243-.173-.501-.196-.782A13 13 0 0 1 6 15.12v-.62a.5.5 0 0 1 1 0v.6c0 .428 0 .72.019.944.018.22.05.332.09.41a1 1 0 0 0 .437.437c.078.04.19.072.41.09.225.019.516.019.944.019h.6a.5.5 0 0 1 0 1z" />
                </svg>
              </span>
              <input
                type="number"
                value={frame.borderRadius}
                onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) handleUpdate({ borderRadius: Math.max(0, v) }); }}
                min={0}
                className="flex-1 h-7 bg-transparent text-[11px] text-gray-700 outline-none rounded hover:bg-gray-50 px-1.5 border border-transparent hover:border-gray-200 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
            <div className="mt-1 px-0.5">
              <input
                type="range" min={0} max={200} step={1}
                value={frame.borderRadius}
                onChange={(e) => handleUpdate({ borderRadius: parseFloat(e.target.value) })}
                className="w-full h-1 accent-blue-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Blend Mode */}
          <div className="px-2 py-1 pb-2">
            <div className="flex items-center gap-1">
              <span className="text-gray-400 shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M14.783 16.058C15.479 15.454 16 14.49 16 13c0-1.037-.597-2.328-1.493-3.631-.844-1.227-1.85-2.316-2.507-2.98-.658.664-1.662 1.753-2.507 2.98C8.597 10.673 8 11.964 8 13c0 1.491.521 2.454 1.217 3.058.72.623 1.721.943 2.783.943s2.063-.32 2.783-.944M12 18c2.5 0 5-1.5 5-5 0-2.712-3-6.023-4.353-7.378a.907.907 0 0 0-1.294 0C10 6.978 7 10.29 7 13.001c0 3.5 2.5 5 5 5" />
                </svg>
              </span>
              <select
                value={el.blendMode ?? 'normal'}
                onChange={(e) => handleUpdate({ blendMode: e.target.value })}
                className="flex-1 h-7 bg-transparent text-[11px] text-gray-700 outline-none rounded hover:bg-gray-50 px-1 border border-transparent hover:border-gray-200 transition-colors cursor-pointer"
              >
                <option value="normal">Pass through</option>
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
          </div>
        </div>

        {/* ── Fill ── */}
        <div className="border-b border-[#e5e5e5]">
          <div className="flex items-center justify-between px-2 py-1.5">
            <h2 className="text-[11px] font-medium text-gray-800">Fill</h2>
            <button type="button" title="Add fill"
              className="flex items-center justify-center w-5 h-5 rounded-sm hover:bg-[#e8e8e8] transition-colors text-gray-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M12 6a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 12 6" />
              </svg>
            </button>
          </div>
          <div className="px-2 pb-2">
            <GradientPicker
              label=""
              value={frame.fill || 'rgba(255,255,255,0)'}
              onChange={(c) => handleUpdate({ fill: c })}
            />
          </div>
        </div>

        {/* ── Stroke ── */}
        <div className="border-b border-[#e5e5e5]">
          <div className="flex items-center justify-between px-2 py-1.5">
            <h2 className="text-[11px] font-medium text-gray-800">Stroke</h2>
            <button type="button" title="Add stroke"
              className="flex items-center justify-center w-5 h-5 rounded-sm hover:bg-[#e8e8e8] transition-colors text-gray-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M12 6a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 12 6" />
              </svg>
            </button>
          </div>
          {(frame.strokeWidth > 0 || frame.stroke !== 'transparent') && (
            <div className="px-2 pb-2">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <ColorPicker label="" color={frame.stroke || '#000000'} onChange={(c) => handleUpdate({ stroke: c })} />
                </div>
                <div className="w-16">
                  <input
                    type="number"
                    value={frame.strokeWidth}
                    onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) handleUpdate({ strokeWidth: Math.max(0, v) }); }}
                    min={0} max={50}
                    className="w-full h-7 bg-transparent text-[11px] text-gray-700 outline-none rounded hover:bg-gray-50 px-1.5 border border-gray-200 transition-colors text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Effects ── */}
        <SectionAccordion title="Effects" defaultOpen={false}>
          <div className="space-y-4">
            <div>
              <ToggleSwitch label="Drop shadow" checked={el.dropShadow?.enabled ?? false}
                onChange={(v) => handleUpdate({ dropShadow: { ...(el.dropShadow ?? { color: 'rgba(0,0,0,0.25)', offsetX: 4, offsetY: 4, blur: 8, spread: 0 }), enabled: v } })} />
              {el.dropShadow?.enabled && (
                <div className="mt-2 ml-1 pl-3 border-l-2 border-gray-200 space-y-2">
                  <ColorPicker label="Color" color={el.dropShadow.color} onChange={(c) => handleUpdate({ dropShadow: { ...el.dropShadow!, color: c } })} />
                  <SliderInput label="X" value={el.dropShadow.offsetX} onChange={(v) => handleUpdate({ dropShadow: { ...el.dropShadow!, offsetX: v } })} min={-30} max={30} step={1} suffix="px" />
                  <SliderInput label="Y" value={el.dropShadow.offsetY} onChange={(v) => handleUpdate({ dropShadow: { ...el.dropShadow!, offsetY: v } })} min={-30} max={30} step={1} suffix="px" />
                  <SliderInput label="Blur" value={el.dropShadow.blur} onChange={(v) => handleUpdate({ dropShadow: { ...el.dropShadow!, blur: v } })} min={0} max={50} step={1} suffix="px" />
                  <SliderInput label="Spread" value={el.dropShadow.spread} onChange={(v) => handleUpdate({ dropShadow: { ...el.dropShadow!, spread: v } })} min={0} max={30} step={1} suffix="px" />
                </div>
              )}
            </div>
            <div>
              <ToggleSwitch label="Inner shadow" checked={el.innerShadow?.enabled ?? false}
                onChange={(v) => handleUpdate({ innerShadow: { ...(el.innerShadow ?? { color: 'rgba(0,0,0,0.25)', offsetX: 2, offsetY: 2, blur: 4, spread: 0 }), enabled: v } })} />
              {el.innerShadow?.enabled && (
                <div className="mt-2 ml-1 pl-3 border-l-2 border-indigo-200 space-y-2">
                  <ColorPicker label="Color" color={el.innerShadow.color} onChange={(c) => handleUpdate({ innerShadow: { ...el.innerShadow!, color: c } })} />
                  <SliderInput label="X" value={el.innerShadow.offsetX} onChange={(v) => handleUpdate({ innerShadow: { ...el.innerShadow!, offsetX: v } })} min={-30} max={30} step={1} suffix="px" />
                  <SliderInput label="Y" value={el.innerShadow.offsetY} onChange={(v) => handleUpdate({ innerShadow: { ...el.innerShadow!, offsetY: v } })} min={-30} max={30} step={1} suffix="px" />
                  <SliderInput label="Blur" value={el.innerShadow.blur} onChange={(v) => handleUpdate({ innerShadow: { ...el.innerShadow!, blur: v } })} min={0} max={50} step={1} suffix="px" />
                  <SliderInput label="Spread" value={el.innerShadow.spread} onChange={(v) => handleUpdate({ innerShadow: { ...el.innerShadow!, spread: v } })} min={0} max={30} step={1} suffix="px" />
                </div>
              )}
            </div>
            <SliderInput label="Layer blur" value={el.layerBlur ?? 0} onChange={(v) => handleUpdate({ layerBlur: v })} min={0} max={20} step={0.5} suffix="px" />
            <SliderInput label="Background blur" value={el.backgroundBlur ?? 0} onChange={(v) => handleUpdate({ backgroundBlur: v })} min={0} max={30} step={0.5} suffix="px" />
          </div>
        </SectionAccordion>

        {/* ── Export ── */}
        <div className="border-b border-[#e5e5e5]">
          <div className="flex items-center justify-between px-2 py-1.5">
            <h2 className="text-[11px] font-medium text-gray-800">Export</h2>
            <button type="button" title="Add export settings"
              className="flex items-center justify-center w-5 h-5 rounded-sm hover:bg-[#e8e8e8] transition-colors text-gray-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M12 6a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 12 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ━━━━━━━━━━ NON-FRAME ELEMENTS — original layout ━━━━━━━━━━ */

  return (
    <div className="w-[280px] bg-white border-l border-gray-200 shrink-0 overflow-y-auto">
      {/* ── 공통 속성 ── */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold mb-3">속성</h3>

        {/* Lock toggle */}
        <div className="mb-3">
          <button
            type="button"
            onClick={() => handleUpdate({ locked: !el.locked })}
            className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md border text-xs transition-colors ${
              el.locked ? 'border-red-400 bg-red-50 text-red-600' : 'border-gray-300 hover:border-gray-400 text-gray-600'
            }`}
          >
            {el.locked ? <HiLockClosed className="w-3.5 h-3.5" /> : <HiLockOpen className="w-3.5 h-3.5" />}
            {el.locked ? '잠금 해제' : '잠금'}
          </button>
        </div>

        {/* Alignment (align to canvas for single element) */}
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1.5">정렬</label>
          <div className="grid grid-cols-6 gap-1">
            <button type="button" title="왼쪽 정렬" onClick={() => alignElements([el.id], 'left')}
              className="flex items-center justify-center p-1.5 rounded hover:bg-gray-100 border border-gray-200 text-gray-500">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M1 1v12M4 3h7v3H4zM4 8h5v3H4z" stroke="currentColor" strokeWidth="1.2"/></svg>
            </button>
            <button type="button" title="가로 가운데" onClick={() => alignElements([el.id], 'centerH')}
              className="flex items-center justify-center p-1.5 rounded hover:bg-gray-100 border border-gray-200 text-gray-500">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M3 3h8v3H3zM4 8h6v3H4z" stroke="currentColor" strokeWidth="1.2"/></svg>
            </button>
            <button type="button" title="오른쪽 정렬" onClick={() => alignElements([el.id], 'right')}
              className="flex items-center justify-center p-1.5 rounded hover:bg-gray-100 border border-gray-200 text-gray-500">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M13 1v12M3 3h7v3H3zM5 8h5v3H5z" stroke="currentColor" strokeWidth="1.2"/></svg>
            </button>
            <button type="button" title="위쪽 정렬" onClick={() => alignElements([el.id], 'top')}
              className="flex items-center justify-center p-1.5 rounded hover:bg-gray-100 border border-gray-200 text-gray-500">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M1 1h12M3 4v7h3V4zM8 4v5h3V4z" stroke="currentColor" strokeWidth="1.2"/></svg>
            </button>
            <button type="button" title="세로 가운데" onClick={() => alignElements([el.id], 'centerV')}
              className="flex items-center justify-center p-1.5 rounded hover:bg-gray-100 border border-gray-200 text-gray-500">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M3 3v8h3V3zM8 4v6h3V4z" stroke="currentColor" strokeWidth="1.2"/></svg>
            </button>
            <button type="button" title="아래쪽 정렬" onClick={() => alignElements([el.id], 'bottom')}
              className="flex items-center justify-center p-1.5 rounded hover:bg-gray-100 border border-gray-200 text-gray-500">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M1 13h12M3 3v7h3V3zM8 5v5h3V5z" stroke="currentColor" strokeWidth="1.2"/></svg>
            </button>
          </div>
        </div>

        {canEdit('position') && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <NumberInput label="X" value={el.x} onChange={(v) => handleUpdate({ x: v })} />
            <NumberInput label="Y" value={el.y} onChange={(v) => handleUpdate({ y: v })} />
          </div>
        )}

        {canEdit('size') && (
          <div className="mb-3">
            <div className="grid grid-cols-[1fr_24px_1fr] gap-1 items-end">
              <NumberInput
                label="W"
                value={el.width}
                onChange={(v) => {
                  if (aspectLocked && el.width > 0) {
                    const ratio = el.height / el.width;
                    handleUpdate({ width: v, height: Math.round(v * ratio) });
                  } else {
                    handleUpdate({ width: v });
                  }
                }}
                min={1}
              />
              <button
                type="button"
                title="비율 잠금"
                onClick={() => setAspectLocked(!aspectLocked)}
                className={`flex items-center justify-center w-6 h-6 rounded transition-colors mb-0.5 ${
                  aspectLocked ? 'text-blue-500' : 'text-gray-300 hover:text-gray-500'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  {aspectLocked ? (
                    <path d="M3 6h8M3 8h8M1 7h2M11 7h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  ) : (
                    <path d="M3 6h8M3 8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
                  )}
                </svg>
              </button>
              <NumberInput
                label="H"
                value={el.height}
                onChange={(v) => {
                  if (aspectLocked && el.height > 0) {
                    const ratio = el.width / el.height;
                    handleUpdate({ height: v, width: Math.round(v * ratio) });
                  } else {
                    handleUpdate({ height: v });
                  }
                }}
                min={1}
              />
            </div>
          </div>
        )}

        {canEdit('rotation') && (
          <div className="mb-3">
            <NumberInput
              label="회전 (°)"
              value={el.rotation}
              onChange={(v) => handleUpdate({ rotation: v })}
              min={-360}
              max={360}
            />
          </div>
        )}

        {/* Flip buttons */}
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">반전</label>
          <div className="flex gap-1">
            <button
              type="button"
              title="가로 반전"
              onClick={() => handleUpdate({ flipX: !(el.flipX ?? false) })}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md border text-xs transition-colors ${
                (el.flipX ?? false) ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-300 hover:border-gray-400 text-gray-600'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12" stroke="currentColor" strokeWidth="1" strokeDasharray="2 1"/><path d="M5 4L2 7l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 4l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              가로
            </button>
            <button
              type="button"
              title="세로 반전"
              onClick={() => handleUpdate({ flipY: !(el.flipY ?? false) })}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md border text-xs transition-colors ${
                (el.flipY ?? false) ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-300 hover:border-gray-400 text-gray-600'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12" stroke="currentColor" strokeWidth="1" strokeDasharray="2 1"/><path d="M4 5L7 2l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 9l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              세로
            </button>
          </div>
        </div>

        {canEdit('opacity') && (
          <div className="mb-3">
            <SliderInput
              label="불투명도"
              value={el.opacity}
              onChange={(v) => handleUpdate({ opacity: v })}
              min={0}
              max={1}
              step={0.01}
              suffix={` (${Math.round(el.opacity * 100)}%)`}
            />
          </div>
        )}

        {/* Blend Mode */}
        {canEdit('blendMode') && (
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">블렌드 모드</label>
            <select
              value={el.blendMode ?? 'normal'}
              onChange={(e) => handleUpdate({ blendMode: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 bg-white"
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
              <option value="hue">Hue</option>
              <option value="saturation">Saturation</option>
              <option value="color">Color</option>
              <option value="luminosity">Luminosity</option>
            </select>
          </div>
        )}
      </div>

      {/* ━━━━━━━━━━ TEXT ELEMENT ━━━━━━━━━━ */}
      {textEl && (
        <>
          {/* ── 텍스트 기본 ── */}
          <SectionAccordion title="텍스트" defaultOpen>
            {canEdit('content') && (
              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">내용</label>
                <textarea
                  value={textEl.content}
                  onChange={(e) => handleUpdate({ content: e.target.value })}
                  rows={3}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            )}

            {canEdit('fontFamily') && (
              <div className="mb-3">
                <FontPicker
                  value={textEl.fontFamily}
                  onChange={(f) => handleUpdate({ fontFamily: f })}
                />
              </div>
            )}

            {canEdit('fontSize') && (
              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">글자 크기</label>
                <select
                  value={textEl.fontSize}
                  onChange={(e) => handleUpdate({ fontSize: parseInt(e.target.value) })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 bg-white"
                >
                  {FONT_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}px
                    </option>
                  ))}
                </select>
              </div>
            )}

            {canEdit('color') && (
              <div className="mb-3">
                <GradientPicker
                  label="글자 색상"
                  value={textEl.color}
                  onChange={(c) => handleUpdate({ color: c })}
                />
              </div>
            )}
          </SectionAccordion>

          {/* ── 스타일 (굵기·기울임·정렬·장식) ── */}
          <SectionAccordion title="스타일" defaultOpen>
            {/* 굵기 + 기울임 */}
            {(canEdit('fontWeight') || canEdit('fontStyle')) && (
              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">글꼴 스타일</label>
                <div className="flex gap-1">
                  {canEdit('fontWeight') &&
                    (['normal', 'bold'] as FontWeight[]).map((w) => (
                      <PillButton
                        key={w}
                        active={textEl.fontWeight === w}
                        onClick={() => handleUpdate({ fontWeight: w })}
                      >
                        {w === 'normal' ? '보통' : <span className="font-bold">굵게</span>}
                      </PillButton>
                    ))}
                  {canEdit('fontStyle') &&
                    (['normal', 'italic'] as FontStyle[]).map((s) => (
                      <PillButton
                        key={s}
                        active={textEl.fontStyle === s}
                        onClick={() => handleUpdate({ fontStyle: s })}
                      >
                        {s === 'normal' ? '보통' : <span className="italic">기울임</span>}
                      </PillButton>
                    ))}
                </div>
              </div>
            )}

            {/* 밑줄·취소선 */}
            {canEdit('textDecoration') && (
              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">텍스트 장식</label>
                <div className="flex gap-1">
                  {(
                    [
                      { value: 'none', label: '없음' },
                      { value: 'underline', label: '밑줄' },
                      { value: 'line-through', label: '취소선' },
                    ] as { value: TextDecoration; label: string }[]
                  ).map(({ value, label }) => (
                    <PillButton
                      key={value}
                      active={textEl.textDecoration === value}
                      onClick={() => handleUpdate({ textDecoration: value })}
                    >
                      {value === 'none' ? (
                        label
                      ) : value === 'underline' ? (
                        <span className="underline">{label}</span>
                      ) : (
                        <span className="line-through">{label}</span>
                      )}
                    </PillButton>
                  ))}
                </div>
              </div>
            )}

            {/* 정렬 */}
            {canEdit('textAlign') && (
              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">정렬</label>
                <div className="flex gap-1">
                  {([
                    { value: 'left', icon: <HiBars3BottomLeft className="w-4 h-4" /> },
                    { value: 'center', icon: <HiBars3 className="w-4 h-4" /> },
                    { value: 'right', icon: <HiBars3BottomRight className="w-4 h-4" /> },
                  ] as { value: TextAlign; icon: React.ReactNode }[]).map(({ value, icon }) => (
                    <PillButton
                      key={value}
                      active={textEl.textAlign === value}
                      onClick={() => handleUpdate({ textAlign: value })}
                    >
                      {icon}
                    </PillButton>
                  ))}
                </div>
              </div>
            )}

            {/* 자간 */}
            {canEdit('letterSpacing') && (
              <div className="mb-3">
                <SliderInput
                  label="자간"
                  value={textEl.letterSpacing}
                  onChange={(v) => handleUpdate({ letterSpacing: v })}
                  min={-20}
                  max={100}
                  step={1}
                  suffix="px"
                />
              </div>
            )}

            {/* 줄간격 */}
            {canEdit('lineHeight') && (
              <div className="mb-3">
                <SliderInput
                  label="줄 간격"
                  value={textEl.lineHeight}
                  onChange={(v) => handleUpdate({ lineHeight: v })}
                  min={0.5}
                  max={3}
                  step={0.1}
                />
              </div>
            )}
          </SectionAccordion>

          {/* ── 텍스트 효과 ── */}
          <SectionAccordion title="텍스트 효과" defaultOpen={false}>
            {/* --- 그림자 --- */}
            {canEdit('textShadow') && (
              <div className="mb-4">
                <ToggleSwitch
                  label="그림자"
                  checked={textEl.textShadow?.enabled ?? false}
                  onChange={(v) =>
                    handleUpdate({
                      textShadow: { ...(textEl.textShadow ?? { color: 'rgba(0,0,0,0.5)', offsetX: 2, offsetY: 2, blur: 4 }), enabled: v },
                    })
                  }
                />
                {textEl.textShadow?.enabled && (
                  <div className="mt-2.5 ml-1 pl-3 border-l-2 border-blue-200 space-y-2.5">
                    <ColorPicker
                      label="그림자 색상"
                      color={textEl.textShadow.color}
                      onChange={(c) =>
                        handleUpdate({ textShadow: { ...textEl.textShadow, color: c } })
                      }
                    />
                    <SliderInput
                      label="X 오프셋"
                      value={textEl.textShadow.offsetX}
                      onChange={(v) =>
                        handleUpdate({ textShadow: { ...textEl.textShadow, offsetX: v } })
                      }
                      min={-20}
                      max={20}
                      step={1}
                      suffix="px"
                    />
                    <SliderInput
                      label="Y 오프셋"
                      value={textEl.textShadow.offsetY}
                      onChange={(v) =>
                        handleUpdate({ textShadow: { ...textEl.textShadow, offsetY: v } })
                      }
                      min={-20}
                      max={20}
                      step={1}
                      suffix="px"
                    />
                    <SliderInput
                      label="흐림"
                      value={textEl.textShadow.blur}
                      onChange={(v) =>
                        handleUpdate({ textShadow: { ...textEl.textShadow, blur: v } })
                      }
                      min={0}
                      max={30}
                      step={1}
                      suffix="px"
                    />
                  </div>
                )}
              </div>
            )}

            {/* --- 외곽선(스트로크) --- */}
            {canEdit('textStroke') && (
              <div className="mb-4">
                <ToggleSwitch
                  label="외곽선"
                  checked={textEl.textStroke?.enabled ?? false}
                  onChange={(v) =>
                    handleUpdate({
                      textStroke: { ...(textEl.textStroke ?? { color: '#000000', width: 1 }), enabled: v },
                    })
                  }
                />
                {textEl.textStroke?.enabled && (
                  <div className="mt-2.5 ml-1 pl-3 border-l-2 border-purple-200 space-y-2.5">
                    <ColorPicker
                      label="외곽선 색상"
                      color={textEl.textStroke.color}
                      onChange={(c) =>
                        handleUpdate({ textStroke: { ...textEl.textStroke, color: c } })
                      }
                    />
                    <SliderInput
                      label="외곽선 두께"
                      value={textEl.textStroke.width}
                      onChange={(v) =>
                        handleUpdate({ textStroke: { ...textEl.textStroke, width: v } })
                      }
                      min={0}
                      max={10}
                      step={0.5}
                      suffix="px"
                    />
                  </div>
                )}
              </div>
            )}

            {/* --- 텍스트 배경 --- */}
            {canEdit('textBackground') && (
              <div className="mb-3">
                <ColorPicker
                  label="텍스트 배경색"
                  color={textEl.textBackground || '#ffffff'}
                  onChange={(c) => handleUpdate({ textBackground: c })}
                />
                {textEl.textBackground && (
                  <button
                    type="button"
                    className="mt-1.5 text-xs text-gray-400 hover:text-red-400 transition-colors"
                    onClick={() => handleUpdate({ textBackground: '' })}
                  >
                    배경색 제거
                  </button>
                )}
              </div>
            )}
          </SectionAccordion>
        </>
      )}

      {/* ━━━━━━━━━━ SHAPE ELEMENT ━━━━━━━━━━ */}
      {el.type === 'shape' && (
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold mb-3">도형</h3>

          {canEdit('fill') && (
            <div className="mb-3">
              <GradientPicker
                label="채우기"
                value={(el as ShapeElement).fill}
                onChange={(c) => handleUpdate({ fill: c })}
              />
            </div>
          )}

          {canEdit('stroke') && (
            <div className="mb-3">
              <ColorPicker
                label="테두리 색상"
                color={(el as ShapeElement).stroke}
                onChange={(c) => handleUpdate({ stroke: c })}
              />
            </div>
          )}

          {canEdit('strokeWidth') && (
            <div className="mb-3">
              <NumberInput
                label="테두리 두께"
                value={(el as ShapeElement).strokeWidth}
                onChange={(v) => handleUpdate({ strokeWidth: v })}
                min={0}
                max={50}
              />
            </div>
          )}

          {canEdit('borderRadius') && (el as ShapeElement).shape === 'rect' && (
            <div className="mb-3">
              <NumberInput
                label="모서리 둥글기"
                value={(el as ShapeElement).borderRadius}
                onChange={(v) => handleUpdate({ borderRadius: v })}
                min={0}
              />
            </div>
          )}
        </div>
      )}

      {/* ━━━━━━━━━━ IMAGE ELEMENT ━━━━━━━━━━ */}
      {el.type === 'image' && (() => {
        const imgEl = el as ImageElement;
        const filters = imgEl.filters ?? { brightness: 0, contrast: 0, saturation: 0, blur: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0 };
        return (
          <>
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">이미지</h3>
                <button
                  type="button"
                  onClick={() => handleUpdate({ rotation: (el.rotation + 90) % 360 })}
                  className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                  title="90° 회전"
                >
                  <HiArrowPath className="w-4 h-4" />
                </button>
              </div>

              {/* Scale mode */}
              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">이미지 맞춤</label>
                <select
                  value={imgEl.scaleMode ?? 'fill'}
                  onChange={(e) => handleUpdate({ scaleMode: e.target.value as ImageScaleMode })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="fill">채우기 (Fill)</option>
                  <option value="fit">맞추기 (Fit)</option>
                  <option value="crop">자르기 (Crop)</option>
                  <option value="tile">반복 (Tile)</option>
                </select>
              </div>

              {/* Image preview */}
              {imgEl.src && (
                <div className="mb-3 flex justify-center">
                  <div className="relative w-full max-w-[200px] aspect-square rounded-lg overflow-hidden border border-gray-200" style={{ backgroundImage: 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgZmlsbD0iI0ZGRkZGRiIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2Ii8+PHBhdGggZmlsbD0iI0YxRjFGMSIgZD0iTSAwIDggSCAxNiBWIDAgSCA4IFYgMTYgSCAwIi8+PC9zdmc+")' }}>
                    <img src={imgEl.src} alt="" className="w-full h-full object-contain" />
                  </div>
                </div>
              )}

              {/* Upload / Replace button */}
              <ImageUploadButton
                onUpload={(dataUrl) => handleUpdate({ src: dataUrl })}
              />
            </div>

            {/* Color Adjustments */}
            <SectionAccordion title="색상 보정" defaultOpen>
              <div className="space-y-3">
                <SliderInput label="노출 (Exposure)" value={filters.brightness} onChange={(v) => handleUpdate({ filters: { ...filters, brightness: v } })} min={-1} max={1} step={0.01} />
                <SliderInput label="대비 (Contrast)" value={filters.contrast} onChange={(v) => handleUpdate({ filters: { ...filters, contrast: v } })} min={-0.3} max={0.3} step={0.01} />
                <SliderInput label="채도 (Saturation)" value={filters.saturation} onChange={(v) => handleUpdate({ filters: { ...filters, saturation: v } })} min={-1} max={1} step={0.01} />
                <SliderInput label="색온도 (Temperature)" value={filters.temperature} onChange={(v) => handleUpdate({ filters: { ...filters, temperature: v } })} min={-1} max={1} step={0.01} />
                <SliderInput label="색조 (Tint)" value={filters.tint} onChange={(v) => handleUpdate({ filters: { ...filters, tint: v } })} min={-1} max={1} step={0.01} />
                <SliderInput label="하이라이트" value={filters.highlights} onChange={(v) => handleUpdate({ filters: { ...filters, highlights: v } })} min={-1} max={1} step={0.01} />
                <SliderInput label="그림자 (Shadows)" value={filters.shadows} onChange={(v) => handleUpdate({ filters: { ...filters, shadows: v } })} min={-1} max={1} step={0.01} />
              </div>
            </SectionAccordion>
            {/* Gradient Overlay */}
            <SectionAccordion title="그라데이션 오버레이" defaultOpen={false}>
              <div className="space-y-3">
                <ToggleSwitch
                  label="오버레이 사용"
                  checked={imgEl.gradientOverlay?.enabled ?? false}
                  onChange={(v) =>
                    handleUpdate({
                      gradientOverlay: {
                        ...(imgEl.gradientOverlay ?? {
                          gradient: {
                            type: 'linear' as const,
                            angle: 180,
                            stops: [
                              { color: 'rgba(0, 0, 0, 0)', offset: 0 },
                              { color: 'rgba(0, 0, 0, 0.7)', offset: 1 },
                            ],
                          },
                          opacity: 1,
                        }),
                        enabled: v,
                      },
                    })
                  }
                />
                {imgEl.gradientOverlay?.enabled && (
                  <div className="mt-2 space-y-3">
                    <GradientPicker
                      label="오버레이 색상"
                      value={imgEl.gradientOverlay.gradient}
                      onChange={(g: FillValue) =>
                        handleUpdate({
                          gradientOverlay: { ...imgEl.gradientOverlay!, gradient: g },
                        })
                      }
                    />
                    <SliderInput
                      label="오버레이 불투명도"
                      value={imgEl.gradientOverlay.opacity ?? 1}
                      onChange={(v) =>
                        handleUpdate({
                          gradientOverlay: { ...imgEl.gradientOverlay!, opacity: v },
                        })
                      }
                      min={0}
                      max={1}
                      step={0.01}
                      suffix={` (${Math.round((imgEl.gradientOverlay.opacity ?? 1) * 100)}%)`}
                    />
                  </div>
                )}
              </div>
            </SectionAccordion>
          </>
        );
      })()}

      {/* ━━━━━━━━━━ EFFECTS (all element types) ━━━━━━━━━━ */}
      <SectionAccordion title="효과" defaultOpen={false}>
        <div className="space-y-4">
          {/* Drop Shadow */}
          <div>
            <ToggleSwitch
              label="그림자"
              checked={el.dropShadow?.enabled ?? false}
              onChange={(v) =>
                handleUpdate({
                  dropShadow: {
                    ...(el.dropShadow ?? { color: 'rgba(0,0,0,0.25)', offsetX: 4, offsetY: 4, blur: 8, spread: 0 }),
                    enabled: v,
                  } as DropShadow,
                })
              }
            />
            {el.dropShadow?.enabled && (
              <div className="mt-2.5 ml-1 pl-3 border-l-2 border-gray-200 space-y-2.5">
                <ColorPicker
                  label="그림자 색상"
                  color={el.dropShadow.color}
                  onChange={(c) =>
                    handleUpdate({ dropShadow: { ...el.dropShadow!, color: c } })
                  }
                />
                <SliderInput
                  label="X 오프셋"
                  value={el.dropShadow.offsetX}
                  onChange={(v) =>
                    handleUpdate({ dropShadow: { ...el.dropShadow!, offsetX: v } })
                  }
                  min={-30}
                  max={30}
                  step={1}
                  suffix="px"
                />
                <SliderInput
                  label="Y 오프셋"
                  value={el.dropShadow.offsetY}
                  onChange={(v) =>
                    handleUpdate({ dropShadow: { ...el.dropShadow!, offsetY: v } })
                  }
                  min={-30}
                  max={30}
                  step={1}
                  suffix="px"
                />
                <SliderInput
                  label="흐림"
                  value={el.dropShadow.blur}
                  onChange={(v) =>
                    handleUpdate({ dropShadow: { ...el.dropShadow!, blur: v } })
                  }
                  min={0}
                  max={50}
                  step={1}
                  suffix="px"
                />
                <SliderInput
                  label="확산"
                  value={el.dropShadow.spread}
                  onChange={(v) =>
                    handleUpdate({ dropShadow: { ...el.dropShadow!, spread: v } })
                  }
                  min={0}
                  max={30}
                  step={1}
                  suffix="px"
                />
              </div>
            )}
          </div>

          {/* Inner Shadow */}
          <div>
            <ToggleSwitch
              label="내부 그림자"
              checked={el.innerShadow?.enabled ?? false}
              onChange={(v) =>
                handleUpdate({
                  innerShadow: {
                    ...(el.innerShadow ?? { color: 'rgba(0,0,0,0.25)', offsetX: 2, offsetY: 2, blur: 4, spread: 0 }),
                    enabled: v,
                  } as InnerShadow,
                })
              }
            />
            {el.innerShadow?.enabled && (
              <div className="mt-2.5 ml-1 pl-3 border-l-2 border-indigo-200 space-y-2.5">
                <ColorPicker
                  label="내부 그림자 색상"
                  color={el.innerShadow.color}
                  onChange={(c) =>
                    handleUpdate({ innerShadow: { ...el.innerShadow!, color: c } })
                  }
                />
                <SliderInput
                  label="X 오프셋"
                  value={el.innerShadow.offsetX}
                  onChange={(v) =>
                    handleUpdate({ innerShadow: { ...el.innerShadow!, offsetX: v } })
                  }
                  min={-30}
                  max={30}
                  step={1}
                  suffix="px"
                />
                <SliderInput
                  label="Y 오프셋"
                  value={el.innerShadow.offsetY}
                  onChange={(v) =>
                    handleUpdate({ innerShadow: { ...el.innerShadow!, offsetY: v } })
                  }
                  min={-30}
                  max={30}
                  step={1}
                  suffix="px"
                />
                <SliderInput
                  label="흐림"
                  value={el.innerShadow.blur}
                  onChange={(v) =>
                    handleUpdate({ innerShadow: { ...el.innerShadow!, blur: v } })
                  }
                  min={0}
                  max={50}
                  step={1}
                  suffix="px"
                />
                <SliderInput
                  label="확산"
                  value={el.innerShadow.spread}
                  onChange={(v) =>
                    handleUpdate({ innerShadow: { ...el.innerShadow!, spread: v } })
                  }
                  min={0}
                  max={30}
                  step={1}
                  suffix="px"
                />
              </div>
            )}
          </div>

          {/* Layer Blur */}
          <SliderInput
            label="블러"
            value={el.layerBlur ?? 0}
            onChange={(v) => handleUpdate({ layerBlur: v })}
            min={0}
            max={20}
            step={0.5}
            suffix="px"
          />

          {/* Background Blur (Frosted Glass) */}
          <SliderInput
            label="배경 흐림 (프로스트)"
            value={el.backgroundBlur ?? 0}
            onChange={(v) => handleUpdate({ backgroundBlur: v })}
            min={0}
            max={30}
            step={0.5}
            suffix="px"
          />
        </div>
      </SectionAccordion>
    </div>
  );
}
