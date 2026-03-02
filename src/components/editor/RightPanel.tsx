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
        value={Math.round(value * 100) / 100}
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
          {Math.round(value * 100) / 100}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
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
  if (mode === 'consumer' && !el.editable) {
    return (
      <div className="w-[280px] bg-white border-l border-gray-200 shrink-0 overflow-y-auto p-4">
        <p className="text-sm text-gray-400 text-center py-8">
          이 요소는 편집할 수 없습니다
        </p>
      </div>
    );
  }

  const isConsumerLimited = mode === 'consumer' && el.editable;
  const editableProps = el.editableProps ?? [];

  const canEdit = (prop: string) => {
    if (!isConsumerLimited) return true;
    return editableProps.includes(prop);
  };

  const handleUpdate = (updates: Record<string, unknown>) => {
    updateElement(el.id, updates);
  };

  const textEl = el.type === 'text' ? (el as TextElement) : null;

  return (
    <div className="w-[280px] bg-white border-l border-gray-200 shrink-0 overflow-y-auto">
      {/* ── 공통 속성 ── */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold mb-3">속성</h3>

        {canEdit('position') && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <NumberInput label="X" value={el.x} onChange={(v) => handleUpdate({ x: v })} />
            <NumberInput label="Y" value={el.y} onChange={(v) => handleUpdate({ y: v })} />
          </div>
        )}

        {canEdit('size') && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <NumberInput
              label="너비"
              value={el.width}
              onChange={(v) => handleUpdate({ width: v })}
              min={1}
            />
            <NumberInput
              label="높이"
              value={el.height}
              onChange={(v) => handleUpdate({ height: v })}
              min={1}
            />
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

      {/* ━━━━━━━━━━ FRAME ELEMENT ━━━━━━━━━━ */}
      {el.type === 'frame' && (
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold mb-3">프레임</h3>

          {canEdit('fill') && (
            <div className="mb-3">
              <GradientPicker
                label="배경"
                value={(el as FrameElement).fill || 'rgba(255,255,255,0)'}
                onChange={(c) => handleUpdate({ fill: c })}
              />
            </div>
          )}

          {canEdit('stroke') && (
            <div className="mb-3">
              <ColorPicker
                label="테두리 색상"
                color={(el as FrameElement).stroke}
                onChange={(c) => handleUpdate({ stroke: c })}
              />
            </div>
          )}

          {canEdit('strokeWidth') && (
            <div className="mb-3">
              <NumberInput
                label="테두리 두께"
                value={(el as FrameElement).strokeWidth}
                onChange={(v) => handleUpdate({ strokeWidth: v })}
                min={0}
                max={50}
              />
            </div>
          )}

          {canEdit('borderRadius') && (
            <div className="mb-3">
              <NumberInput
                label="모서리 둥글기"
                value={(el as FrameElement).borderRadius}
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
    </div>
  );
}
