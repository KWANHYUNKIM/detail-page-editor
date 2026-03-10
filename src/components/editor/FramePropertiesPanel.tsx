'use client';

import { useState } from 'react';
import type {
  FrameElement,
  FillItem,
  StrokeItem,
  EffectItem,
  ExportSetting,
  LayoutGuide,
  StrokePosition,
  StrokeJoin,
  StrokeEndCap,
  ExportFormat,
  FillValue,
} from '@/types/editor';
import { isGradient } from '@/types/editor';
import ColorPicker from '@/components/ui/ColorPicker';
import GradientPicker from '@/components/ui/GradientPicker';

const uid = () => crypto.randomUUID();

const IC = 'flex items-center justify-center';
const ICON_BTN = `${IC} w-7 h-7 rounded-sm hover:bg-[#e8e8e8] transition-colors`;
const SECTION_BORDER = 'border-b border-[#e5e5e5]';
const INPUT_BASE = 'w-full h-full bg-transparent text-[11px] text-gray-700 outline-none pr-1.5 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';
const LABEL_INPUT = 'flex-1 flex items-center h-7 rounded bg-transparent hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors';
const PLUS_PATH = 'M12 6a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 12 6';
const MINUS_PATH = 'M6 12a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 6 12';
const EYE_PATH = 'M6 12c0-.066.054-.358.313-.825a5.9 5.9 0 0 1 1.12-1.414C8.443 8.816 9.956 8 12 8s3.558.816 4.566 1.76c.508.477.88.98 1.121 1.415.258.467.313.76.313.825 0 .066-.055.358-.313.825-.24.435-.613.938-1.12 1.414C15.557 15.184 14.044 16 12 16s-3.558-.816-4.566-1.76a5.9 5.9 0 0 1-1.121-1.415C6.055 12.358 6 12.065 6 12m-1 0c0-1.25 2.333-5 7-5s7 3.75 7 5-2.333 5-7 5-7-3.75-7-5m8 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m1 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0';

function PlusSvg({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d={PLUS_PATH} /></svg>;
}
function MinusSvg({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d={MINUS_PATH} /></svg>;
}
function EyeSvg({ visible, size = 16 }: { visible: boolean; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path fill={visible ? '#b3b3b3' : '#e5e5e5'} fillRule="evenodd" clipRule="evenodd" d={EYE_PATH} /></svg>;
}

function SectionHeader({ title, onAdd }: { title: string; onAdd?: () => void }) {
  return (
    <div className="flex items-center justify-between px-2 py-1.5">
      <h2 className="text-[11px] font-medium text-gray-800">{title}</h2>
      {onAdd && (
        <button type="button" title={`Add ${title.toLowerCase()}`} onClick={onAdd}
          className={`${IC} w-5 h-5 rounded-sm hover:bg-[#e8e8e8] transition-colors text-gray-400`}>
          <PlusSvg />
        </button>
      )}
    </div>
  );
}

function RadioGroup<T extends string>({ options, value, onChange }: { options: { value: T; label: string; icon: React.ReactNode }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-px">
      {options.map((opt) => (
        <button key={opt.value} type="button" title={opt.label} onClick={() => onChange(opt.value)}
          className={`${IC} w-7 h-7 rounded-sm transition-colors ${value === opt.value ? 'bg-blue-50' : 'hover:bg-[#e8e8e8]'}`}>
          {opt.icon}
        </button>
      ))}
    </div>
  );
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

function ColorChit({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <span className="inline-block rounded-sm border border-gray-300 shrink-0" style={{ width: size, height: size, backgroundColor: color }} />
  );
}

const ALIGNMENT_ICONS = {
  left: [{ d: 'M17.25 10a.75.75 0 0 0 .75-.75v-.5a.75.75 0 0 0-.75-.75h-8.5a.75.75 0 0 0-.75.75v.5c0 .414.336.75.75.75zm-4 5a.75.75 0 0 0 .75-.75v-.5a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 0-.75.75v.5c0 .414.336.75.75.75z' }, { d: 'M6 17.5a.5.5 0 0 1-1 0v-12a.5.5 0 0 1 1 0z', t: true }],
  centerH: [{ d: 'M17.25 10a.75.75 0 0 0 .75-.75v-.5a.75.75 0 0 0-.75-.75h-9.5a.75.75 0 0 0-.75.75v.5c0 .414.336.75.75.75zm-2 5a.75.75 0 0 0 .75-.75v-.5a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v.5c0 .414.336.75.75.75z' }, { d: 'M13 17.5a.5.5 0 0 1-1 0V15h1zm0-4.5v-3h-1v3zm0-7.5V8h-1V5.5a.5.5 0 0 1 1 0', t: true }],
  right: [{ d: 'M6.75 10A.75.75 0 0 1 6 9.25v-.5A.75.75 0 0 1 6.75 8h8.5a.75.75 0 0 1 .75.75v.5a.75.75 0 0 1-.75.75zm4 5a.75.75 0 0 1-.75-.75v-.5a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v.5a.75.75 0 0 1-.75.75z' }, { d: 'M18 17.5a.5.5 0 0 0 1 0v-12a.5.5 0 0 0-1 0z', t: true }],
  top: [{ d: 'M10 17.25a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1-.75-.75v-8.5A.75.75 0 0 1 8.75 8h.5a.75.75 0 0 1 .75.75zm5-4a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 .75.75z' }, { d: 'M17.5 6a.5.5 0 0 0 0-1h-12a.5.5 0 0 0 0 1z', t: true }],
  centerV: [{ d: 'M10 6.75A.75.75 0 0 0 9.25 6h-.5a.75.75 0 0 0-.75.75v9.5c0 .414.336.75.75.75h.5a.75.75 0 0 0 .75-.75zm5 2a.75.75 0 0 0-.75-.75h-.5a.75.75 0 0 0-.75.75v5.5c0 .414.336.75.75.75h.5a.75.75 0 0 0 .75-.75z' }, { d: 'M17.5 11a.5.5 0 0 1 0 1H15v-1zM13 11h-3v1h3zm-7.5 0H8v1H5.5a.5.5 0 0 1 0-1', t: true }],
  bottom: [{ d: 'M10 6.75A.75.75 0 0 0 9.25 6h-.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h.5a.75.75 0 0 0 .75-.75zm5 4a.75.75 0 0 0-.75-.75h-.5a.75.75 0 0 0-.75.75v4.5c0 .414.336.75.75.75h.5a.75.75 0 0 0 .75-.75z' }, { d: 'M17.5 18a.5.5 0 0 1 0 1h-12a.5.5 0 0 1 0-1z', t: true }],
} as const;

function AlignBtn({ dir, onClick }: { dir: keyof typeof ALIGNMENT_ICONS; onClick: () => void }) {
  const paths = ALIGNMENT_ICONS[dir];
  return (
    <button type="button" title={dir} onClick={onClick} className={ICON_BTN}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        {paths.map((p, i) => <path key={i} fill={'t' in p ? '#cdcdcd' : '#b3b3b3'} fillRule="evenodd" clipRule="evenodd" d={p.d} />)}
      </svg>
    </button>
  );
}

const DISTRIBUTE_H_PATH = 'M9 12.25c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-.5a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75z';
const DISTRIBUTE_H_PATH2 = 'M19 6.5a.5.5 0 0 0-.5-.5h-12a.5.5 0 0 0 0 1h12a.5.5 0 0 0 .5-.5m0 11a.5.5 0 0 0-.5-.5h-12a.5.5 0 0 0 0 1h12a.5.5 0 0 0 .5-.5';

interface FramePropertiesPanelProps {
  frame: FrameElement;
  handleUpdate: (updates: Record<string, unknown>) => void;
  alignElements: (ids: string[], direction: 'left' | 'right' | 'top' | 'bottom' | 'centerH' | 'centerV') => void;
  distributeElements: (ids: string[], axis: 'horizontal' | 'vertical') => void;
  aspectLocked: boolean;
  setAspectLocked: (v: boolean) => void;
}

export default function FramePropertiesPanel({ frame, handleUpdate, alignElements, distributeElements, aspectLocked, setAspectLocked }: FramePropertiesPanelProps) {
  const [showIndividualCorners, setShowIndividualCorners] = useState(false);
  const [presetOpen, setPresetOpen] = useState(false);

  const fills: FillItem[] = frame.fills ?? [{ id: 'default', color: frame.fill || '#FFFFFF', opacity: 1, visible: true }];
  const strokes: StrokeItem[] = frame.strokes ?? (frame.strokeWidth > 0 || frame.stroke !== 'transparent' ? [{ id: 'default', color: frame.stroke || '#000000', width: frame.strokeWidth, opacity: 1, visible: true, position: frame.strokePosition ?? 'inside', join: frame.strokeJoin ?? 'miter', endCap: frame.strokeEndCap ?? 'none' }] : []);
  const effects: EffectItem[] = frame.effects ?? [
    ...(frame.dropShadow?.enabled ? [{ id: 'ds', type: 'drop-shadow' as const, visible: true, color: frame.dropShadow.color, offsetX: frame.dropShadow.offsetX, offsetY: frame.dropShadow.offsetY, blur: frame.dropShadow.blur, spread: frame.dropShadow.spread }] : []),
    ...(frame.innerShadow?.enabled ? [{ id: 'is', type: 'inner-shadow' as const, visible: true, color: frame.innerShadow.color, offsetX: frame.innerShadow.offsetX, offsetY: frame.innerShadow.offsetY, blur: frame.innerShadow.blur, spread: frame.innerShadow.spread }] : []),
  ];
  const exports: ExportSetting[] = frame.exportSettings ?? [];
  const guides: LayoutGuide[] = frame.layoutGuides ?? [];

  const updateFills = (newFills: FillItem[]) => {
    handleUpdate({ fills: newFills, fill: newFills[0]?.color ?? '#FFFFFF' });
  };
  const updateStrokes = (newStrokes: StrokeItem[]) => {
    const first = newStrokes[0];
    handleUpdate({
      strokes: newStrokes,
      stroke: first?.color ?? 'transparent',
      strokeWidth: first?.width ?? 0,
      strokePosition: first?.position ?? 'inside',
      strokeJoin: first?.join ?? 'miter',
      strokeEndCap: first?.endCap ?? 'none',
    });
  };
  const updateEffects = (newEffects: EffectItem[]) => {
    handleUpdate({ effects: newEffects });
  };
  const updateExports = (newExports: ExportSetting[]) => {
    handleUpdate({ exportSettings: newExports });
  };
  const updateGuides = (newGuides: LayoutGuide[]) => {
    handleUpdate({ layoutGuides: newGuides });
  };

  const corners = frame.individualCorners ?? { topLeft: frame.borderRadius, topRight: frame.borderRadius, bottomRight: frame.borderRadius, bottomLeft: frame.borderRadius };

  return (
    <div className="w-[280px] bg-white border-l border-gray-200 shrink-0 overflow-y-auto text-[11px]">
      {/* Header + Frame Presets */}
      <div className={`flex items-center h-8 px-2 ${SECTION_BORDER}`}>
        <div className="relative">
          <button type="button" onClick={() => setPresetOpen(!presetOpen)}
            className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded px-1 py-0.5">
            <span>{frame.isSection ? 'Section' : 'Frame'}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M9.646 11.146a.5.5 0 0 1 .708 0L12 12.793l1.646-1.647a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 0-.708" />
            </svg>
          </button>
          {presetOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
              {[{ label: 'iPhone 16', w: 393, h: 852 }, { label: 'iPhone 16 Pro Max', w: 440, h: 956 }, { label: 'Desktop (1440)', w: 1440, h: 900 }, { label: 'MacBook Pro 16"', w: 1728, h: 1117 }, { label: 'iPad Pro 12.9"', w: 1024, h: 1366 }].map(p => (
                <button key={p.label} type="button" onClick={() => { handleUpdate({ width: p.w, height: p.h }); setPresetOpen(false); }}
                  className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-blue-50 text-gray-700 flex justify-between">
                  <span>{p.label}</span>
                  <span className="text-gray-400">{p.w} x {p.h}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alignment */}
      <div className={`px-2 py-1.5 ${SECTION_BORDER}`}>
        <div className="flex gap-px items-center">
          <div className="flex flex-1 gap-px">
            {(['left', 'centerH', 'right'] as const).map(d => <AlignBtn key={d} dir={d} onClick={() => alignElements([frame.id], d)} />)}
          </div>
          <div className="w-px bg-[#e5e5e5] mx-1 h-5" />
          <div className="flex flex-1 gap-px">
            {(['top', 'centerV', 'bottom'] as const).map(d => <AlignBtn key={d} dir={d} onClick={() => alignElements([frame.id], d)} />)}
          </div>
          <div className="w-px bg-[#e5e5e5] mx-1 h-5" />
          <button type="button" title="Tidy up" onClick={() => distributeElements([frame.id], 'horizontal')} className={ICON_BTN}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path fill="#b3b3b3" d={DISTRIBUTE_H_PATH} />
              <path fill="#cdcdcd" fillRule="evenodd" clipRule="evenodd" d={DISTRIBUTE_H_PATH2} />
            </svg>
          </button>
        </div>
      </div>

      {/* Position X/Y */}
      <div className={`px-2 py-1 ${SECTION_BORDER}`}>
        <div className="flex gap-1">
          {(['x', 'y'] as const).map(axis => (
            <label key={axis} className={LABEL_INPUT}>
              <span className="pl-1.5 pr-1 text-gray-400 select-none cursor-ew-resize font-medium uppercase">{axis}</span>
              <input type="number" value={Math.round(frame[axis])} onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) handleUpdate({ [axis]: v }); }} className={INPUT_BASE} />
            </label>
          ))}
        </div>
      </div>

      {/* Dimensions W/H + Aspect Lock */}
      <div className={`px-2 py-1 ${SECTION_BORDER}`}>
        <div className="flex gap-1 items-center">
          <label className={LABEL_INPUT}>
            <span className="pl-1.5 pr-1 text-gray-400 select-none cursor-ew-resize font-medium">W</span>
            <input type="number" value={Math.round(frame.width)} min={1}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (isNaN(v)) return;
                if (aspectLocked && frame.width > 0) {
                  handleUpdate({ width: v, height: Math.round(v * frame.height / frame.width) });
                } else handleUpdate({ width: v });
              }} className={INPUT_BASE} />
          </label>
          <button type="button" title="Lock aspect ratio" onClick={() => setAspectLocked(!aspectLocked)}
            className={`${IC} w-5 h-5 rounded-sm transition-colors shrink-0 ${aspectLocked ? 'text-blue-500' : 'text-gray-300 hover:text-gray-500'}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M7.5 7h9a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5M6 7.5A1.5 1.5 0 0 1 7.5 6h9A1.5 1.5 0 0 1 18 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 16.5zM9.5 9a.5.5 0 0 0-.5.5v2a.5.5 0 0 0 1 0V10h1.5a.5.5 0 0 0 0-1zm5.5 3.5a.5.5 0 0 0-1 0V14h-1.5a.5.5 0 0 0 0 1h2a.5.5 0 0 0 .5-.5z" />
            </svg>
          </button>
          <label className={LABEL_INPUT}>
            <span className="pl-1.5 pr-1 text-gray-400 select-none cursor-ew-resize font-medium">H</span>
            <input type="number" value={Math.round(frame.height)} min={1}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (isNaN(v)) return;
                if (aspectLocked && frame.height > 0) {
                  handleUpdate({ height: v, width: Math.round(v * frame.width / frame.height) });
                } else handleUpdate({ height: v });
              }} className={INPUT_BASE} />
          </label>
        </div>
      </div>

      {/* Rotation + Rotate90 / Flip H / Flip V */}
      <div className={`px-2 py-1 ${SECTION_BORDER}`}>
        <div className="flex gap-1 items-center">
          <label className={LABEL_INPUT}>
            <span className="pl-1 pr-0.5 text-gray-400 shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M9 8.5a.5.5 0 0 0-1 0v7a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 0-1H13a4 4 0 0 0-4-4zM9 12v3h3a3 3 0 0 0-3-3" />
              </svg>
            </span>
            <input type="text" value={`${Math.round(frame.rotation)}°`}
              onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) handleUpdate({ rotation: v }); }}
              className="w-full h-full bg-transparent text-[11px] text-gray-700 outline-none pr-1.5" />
          </label>
          <div className="flex gap-px shrink-0">
            <button type="button" title="Rotate 90 right" onClick={() => handleUpdate({ rotation: (frame.rotation + 90) % 360 })} className={ICON_BTN}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path fill="#b3b3b3" fillRule="evenodd" clipRule="evenodd" d="M10.233 6.474a2.5 2.5 0 0 1 3.535 0L15.293 8H14a.5.5 0 0 0 0 1h2.5a.5.5 0 0 0 .5-.5V6a.5.5 0 1 0-1 0v1.292l-1.525-1.525a3.5 3.5 0 0 0-4.95 0L7.147 8.146a.5.5 0 0 0 .707.707zm2.828 3.172a1.5 1.5 0 0 0-2.121 0l-3.293 3.293a1.5 1.5 0 0 0 0 2.121l3.293 3.293a1.5 1.5 0 0 0 2.12 0l3.294-3.293a1.5 1.5 0 0 0 0-2.121zm-1.414.707a.5.5 0 0 1 .707 0l3.293 3.293a.5.5 0 0 1 0 .707l-3.293 3.293a.5.5 0 0 1-.707 0l-3.293-3.293a.5.5 0 0 1 0-.707z" />
              </svg>
            </button>
            <button type="button" title="Flip horizontal" onClick={() => handleUpdate({ flipX: !(frame.flipX ?? false) })}
              className={`${IC} w-7 h-7 rounded-sm transition-colors ${(frame.flipX ?? false) ? 'bg-blue-50' : 'hover:bg-[#e8e8e8]'}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path fill={(frame.flipX ?? false) ? '#3b82f6' : '#b3b3b3'} fillRule="evenodd" clipRule="evenodd" d="M12.5 6.5a.5.5 0 0 0-1 0v11a.5.5 0 0 0 1 0zM6 9.104a.75.75 0 0 1 1.28-.53L10 11.292a1 1 0 0 1 0 1.414l-2.72 2.72a.75.75 0 0 1-1.28-.53zm1 .603v4.586L9.293 12zm11-.603a.75.75 0 0 0-1.28-.53L14 11.292a1 1 0 0 0 0 1.414l2.72 2.72a.75.75 0 0 0 1.28-.53zm-1 .603v4.586L14.707 12z" />
              </svg>
            </button>
            <button type="button" title="Flip vertical" onClick={() => handleUpdate({ flipY: !(frame.flipY ?? false) })}
              className={`${IC} w-7 h-7 rounded-sm transition-colors ${(frame.flipY ?? false) ? 'bg-blue-50' : 'hover:bg-[#e8e8e8]'}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path fill={(frame.flipY ?? false) ? '#3b82f6' : '#b3b3b3'} fillRule="evenodd" clipRule="evenodd" d="M17.5 12.5a.5.5 0 0 0 0-1h-11a.5.5 0 0 0 0 1zM14.896 18a.75.75 0 0 0 .53-1.28L12.708 14a1 1 0 0 0-1.414 0l-2.72 2.72a.75.75 0 0 0 .53 1.28zm-.603-1H9.707L12 14.707zm.603-11a.75.75 0 0 1 .53 1.28L12.708 10a1 1 0 0 1-1.414 0l-2.72-2.72A.75.75 0 0 1 9.103 6zm-.603 1H9.707L12 9.293z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Clip content */}
      <div className={`px-2 py-1.5 ${SECTION_BORDER}`}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={frame.clipContent} onChange={(e) => handleUpdate({ clipContent: e.target.checked })}
            className="w-3.5 h-3.5 rounded border-gray-300 text-blue-500 focus:ring-blue-500 focus:ring-1 cursor-pointer" />
          <span className="text-gray-600">Clip content</span>
        </label>
      </div>

      {/* ═══ Appearance ═══ */}
      <div className={SECTION_BORDER}>
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
            <input type="text" value={`${Math.round(frame.opacity * 100)}%`}
              onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) handleUpdate({ opacity: Math.min(1, Math.max(0, v / 100)) }); }}
              className="flex-1 h-7 bg-transparent text-[11px] text-gray-700 outline-none rounded hover:bg-gray-50 px-1.5 border border-transparent hover:border-gray-200 transition-colors" />
            <button type="button" title={frame.visible ? 'Hide' : 'Show'} onClick={() => handleUpdate({ visible: !frame.visible })}
              className={`${IC} w-6 h-6 rounded-sm hover:bg-[#e8e8e8] transition-colors shrink-0`}>
              <EyeSvg visible={frame.visible} />
            </button>
          </div>
          <div className="mt-1 px-0.5">
            <input type="range" min={0} max={100} step={1} value={Math.round(frame.opacity * 100)}
              onChange={(e) => handleUpdate({ opacity: parseFloat(e.target.value) / 100 })} className="w-full h-1 accent-blue-500 cursor-pointer" />
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
            {!showIndividualCorners ? (
              <input type="number" value={frame.borderRadius} min={0}
                onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) handleUpdate({ borderRadius: Math.max(0, v), individualCorners: undefined }); }}
                className="flex-1 h-7 bg-transparent text-[11px] text-gray-700 outline-none rounded hover:bg-gray-50 px-1.5 border border-transparent hover:border-gray-200 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
            ) : (
              <div className="flex-1 grid grid-cols-4 gap-0.5">
                {(['topLeft', 'topRight', 'bottomRight', 'bottomLeft'] as const).map(c => (
                  <input key={c} type="number" value={corners[c]} min={0} title={c}
                    onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) handleUpdate({ individualCorners: { ...corners, [c]: Math.max(0, v) } }); }}
                    className="w-full h-6 bg-transparent text-[10px] text-gray-700 outline-none rounded hover:bg-gray-50 px-1 border border-gray-200 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                ))}
              </div>
            )}
            <button type="button" title="Individual corners" onClick={() => setShowIndividualCorners(!showIndividualCorners)}
              className={`${IC} w-6 h-6 rounded-sm transition-colors shrink-0 ${showIndividualCorners ? 'bg-blue-50 text-blue-500' : 'hover:bg-[#e8e8e8] text-gray-400'}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M8.9 6h-.02c-.403 0-.735 0-1.006.022-.28.023-.54.072-.782.196a2 2 0 0 0-.874.874c-.124.243-.173.501-.196.782C6 8.144 6 8.477 6 8.88v.62a.5.5 0 0 0 1 0v-.6c0-.428 0-.72.019-.944.018-.22.05-.332.09-.41a1 1 0 0 1 .437-.437c.078-.04.19-.072.41-.09C8.18 7 8.472 7 8.9 7h.6a.5.5 0 0 0 0-1zm6.2 0h.02c.403 0 .735 0 1.006.022.281.023.54.072.782.196a2 2 0 0 1 .874.874c.124.243.173.501.196.782.022.27.022.603.022 1.005V9.5a.5.5 0 0 1-1 0v-.6c0-.428 0-.72-.019-.944-.018-.22-.05-.332-.09-.41a1 1 0 0 0-.437-.437c-.078-.04-.19-.072-.41-.09A13 13 0 0 0 15.1 7h-.6a.5.5 0 0 1 0-1zm.02 12h-.62a.5.5 0 0 1 0-1h.6c.428 0 .72 0 .944-.019.22-.018.332-.05.41-.09a1 1 0 0 0 .437-.437c.04-.078.072-.19.09-.41.019-.225.019-.516.019-.944v-.6a.5.5 0 0 1 1 0v.62c0 .403 0 .735-.022 1.006-.023.281-.072.54-.196.782a2 2 0 0 1-.874.874c-.243.124-.501.173-.782.196-.27.022-.603.022-1.005.022M8.9 18h-.02c-.403 0-.735 0-1.006-.022-.281-.023-.54-.072-.782-.196a2 2 0 0 1-.874-.874c-.124-.243-.173-.501-.196-.782A13 13 0 0 1 6 15.12v-.62a.5.5 0 0 1 1 0v.6c0 .428 0 .72.019.944.018.22.05.332.09.41a1 1 0 0 0 .437.437c.078.04.19.072.41.09.225.019.516.019.944.019h.6a.5.5 0 0 1 0 1z" />
              </svg>
            </button>
          </div>
          {!showIndividualCorners && (
            <div className="mt-1 px-0.5">
              <input type="range" min={0} max={200} step={1} value={frame.borderRadius}
                onChange={(e) => handleUpdate({ borderRadius: parseFloat(e.target.value) })} className="w-full h-1 accent-blue-500 cursor-pointer" />
            </div>
          )}
        </div>

        {/* Blend Mode */}
        <div className="px-2 py-1 pb-2">
          <div className="flex items-center gap-1">
            <span className="text-gray-400 shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M14.783 16.058C15.479 15.454 16 14.49 16 13c0-1.037-.597-2.328-1.493-3.631-.844-1.227-1.85-2.316-2.507-2.98-.658.664-1.662 1.753-2.507 2.98C8.597 10.673 8 11.964 8 13c0 1.491.521 2.454 1.217 3.058.72.623 1.721.943 2.783.943s2.063-.32 2.783-.944M12 18c2.5 0 5-1.5 5-5 0-2.712-3-6.023-4.353-7.378a.907.907 0 0 0-1.294 0C10 6.978 7 10.29 7 13.001c0 3.5 2.5 5 5 5" />
              </svg>
            </span>
            <select value={frame.blendMode ?? 'normal'} onChange={(e) => handleUpdate({ blendMode: e.target.value })}
              className="flex-1 h-7 bg-transparent text-[11px] text-gray-700 outline-none rounded hover:bg-gray-50 px-1 border border-transparent hover:border-gray-200 transition-colors cursor-pointer">
              {['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion'].map(m => (
                <option key={m} value={m}>{m === 'normal' ? 'Pass through' : m.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ═══ Fill ═══ */}
      <div className={SECTION_BORDER}>
        <SectionHeader title="Fill" onAdd={() => updateFills([...fills, { id: uid(), color: '#FFFFFF', opacity: 1, visible: true }])} />
        {fills.map((f, i) => (
          <div key={f.id} className="group px-2 py-1 flex items-center gap-1.5 hover:bg-gray-50">
            <ColorChit color={typeof f.color === 'string' ? f.color : '#ccc'} />
            <button type="button" className="flex-1 text-left text-[11px] text-gray-700 truncate"
              onClick={() => {}}>
              <span className="font-mono">{fillToHex(f.color)}</span>
              <span className="text-gray-400 ml-1">{Math.round(f.opacity * 100)}%</span>
            </button>
            <button type="button" title="Toggle visibility" onClick={() => { const nf = [...fills]; nf[i] = { ...f, visible: !f.visible }; updateFills(nf); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity">
              <EyeSvg visible={f.visible} size={14} />
            </button>
            <button type="button" title="Remove" onClick={() => updateFills(fills.filter((_, j) => j !== i))}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500">
              <MinusSvg size={14} />
            </button>
          </div>
        ))}
        {fills.length > 0 && (
          <div className="px-2 pb-2 pt-1">
            <GradientPicker label="" value={fills[0].color || '#FFFFFF'}
              onChange={(c) => { const nf = [...fills]; nf[0] = { ...nf[0], color: c }; updateFills(nf); }} />
          </div>
        )}
        <div className="px-2 py-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={frame.showFillInExports ?? true}
              onChange={(e) => handleUpdate({ showFillInExports: e.target.checked })}
              className="w-3 h-3 rounded border-gray-300 text-blue-500 focus:ring-blue-500 focus:ring-1 cursor-pointer" />
            <span className="text-gray-500 text-[10px]">Show in exports</span>
          </label>
        </div>
      </div>

      {/* ═══ Stroke ═══ */}
      <div className={SECTION_BORDER}>
        <SectionHeader title="Stroke" onAdd={() => updateStrokes([...strokes, { id: uid(), color: '#000000', width: 1, opacity: 1, visible: true, position: 'inside', join: 'miter', endCap: 'none' }])} />
        {strokes.map((s, i) => (
          <div key={s.id} className="group px-2 py-1 flex items-center gap-1.5 hover:bg-gray-50">
            <ColorChit color={s.color} />
            <span className="flex-1 text-[11px] text-gray-700 font-mono truncate">{s.color.replace('#', '').toUpperCase()}</span>
            <span className="text-gray-400 text-[10px]">{Math.round(s.opacity * 100)}%</span>
            <button type="button" title="Toggle visibility" onClick={() => { const ns = [...strokes]; ns[i] = { ...s, visible: !s.visible }; updateStrokes(ns); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity">
              <EyeSvg visible={s.visible} size={14} />
            </button>
            <button type="button" title="Remove" onClick={() => updateStrokes(strokes.filter((_, j) => j !== i))}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500">
              <MinusSvg size={14} />
            </button>
          </div>
        ))}
        {strokes.length > 0 && (
          <div className="px-2 pb-1">
            <div className="flex gap-2 items-end mb-2">
              <div className="flex-1">
                <ColorPicker label="" color={strokes[0].color || '#000000'}
                  onChange={(c) => { const ns = [...strokes]; ns[0] = { ...ns[0], color: c }; updateStrokes(ns); }} />
              </div>
            </div>

            {/* Weight + slider */}
            <div className="flex items-center gap-1 mb-1">
              <span className="text-gray-400 shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M6 6.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5M7 10v1h10v-1zm-.25-1a.75.75 0 0 0-.75.75v1.5c0 .414.336.75.75.75h10.5a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 0-.75-.75zM7 17v-2h10v2zm-1-2.25a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-.75.75H6.75a.75.75 0 0 1-.75-.75z" />
                </svg>
              </span>
              <input type="number" value={strokes[0].width} min={0} max={200}
                onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) { const ns = [...strokes]; ns[0] = { ...ns[0], width: Math.max(0, v) }; updateStrokes(ns); } }}
                className="w-14 h-6 bg-transparent text-[11px] text-gray-700 outline-none rounded hover:bg-gray-50 px-1.5 border border-gray-200 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
              <input type="range" min={0} max={200} step={1} value={strokes[0].width}
                onChange={(e) => { const ns = [...strokes]; ns[0] = { ...ns[0], width: parseFloat(e.target.value) }; updateStrokes(ns); }}
                className="flex-1 h-1 accent-blue-500 cursor-pointer" />
            </div>

            {/* Position: Inside / Center / Outside */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-gray-400 text-[10px] w-12 shrink-0">Position</span>
              <RadioGroup<StrokePosition>
                value={strokes[0].position}
                onChange={(v) => { const ns = [...strokes]; ns[0] = { ...ns[0], position: v }; updateStrokes(ns); }}
                options={[
                  { value: 'outside', label: 'Outside', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M6.5 6a.5.5 0 0 1 .5.5v4a6.5 6.5 0 0 0 6.5 6.5h4a.5.5 0 0 1 0 1h-4A7.5 7.5 0 0 1 6 10.5v-4a.5.5 0 0 1 .5-.5" /><path fill="currentColor" opacity="0.4" d="M12.5 9a.5.5 0 0 1 .5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 1 0 1h-1a1.5 1.5 0 0 1-1.5-1.5v-1a.5.5 0 0 1 .5-.5m5 2a.5.5 0 0 1 0 1h-1a.5.5 0 0 1 0-1zm-5-5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1a.5.5 0 0 1 .5-.5" /></svg> },
                  { value: 'center', label: 'Center', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M6.5 6a.5.5 0 0 1 .5.5v4a6.5 6.5 0 0 0 6.5 6.5h4a.5.5 0 0 1 0 1h-4A7.5 7.5 0 0 1 6 10.5v-4a.5.5 0 0 1 .5-.5" /><path fill="currentColor" d="M12.5 6a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4a1.5 1.5 0 0 1-1.5-1.5v-4a.5.5 0 0 1 .5-.5" /></svg> },
                  { value: 'inside', label: 'Inside', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path fill="currentColor" d="M12.5 6a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4a1.5 1.5 0 0 1-1.5-1.5v-4a.5.5 0 0 1 .5-.5" /><path fill="currentColor" opacity="0.4" fillRule="evenodd" clipRule="evenodd" d="M6.5 6a.5.5 0 0 1 .5.5v.75a.5.5 0 0 1-1 0V6.5a.5.5 0 0 1 .5-.5" /></svg> },
                ]}
              />
            </div>

            {/* Join: Miter / Bevel / Round */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-gray-400 text-[10px] w-12 shrink-0">Join</span>
              <RadioGroup<StrokeJoin>
                value={strokes[0].join}
                onChange={(v) => { const ns = [...strokes]; ns[0] = { ...ns[0], join: v }; updateStrokes(ns); }}
                options={[
                  { value: 'miter', label: 'Miter', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M6.5 6a.5.5 0 0 0 0 1H17v10.5a.5.5 0 0 0 1 0v-11a.5.5 0 0 0-.5-.5z" /></svg> },
                  { value: 'bevel', label: 'Bevel', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M6.5 6a.5.5 0 0 0 0 1h5.793L17 11.707V17.5a.5.5 0 0 0 1 0v-6a.5.5 0 0 0-.146-.354l-5-5A.5.5 0 0 0 12.5 6z" /></svg> },
                  { value: 'round', label: 'Round', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M6.5 6a.5.5 0 0 0 0 1h5a5.5 5.5 0 0 1 5.5 5.5v5a.5.5 0 0 0 1 0v-5A6.5 6.5 0 0 0 11.5 6z" /></svg> },
                ]}
              />
            </div>

            {/* End points */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-[10px] w-12 shrink-0">Ends</span>
              <RadioGroup<StrokeEndCap>
                value={strokes[0].endCap}
                onChange={(v) => { const ns = [...strokes]; ns[0] = { ...ns[0], endCap: v }; updateStrokes(ns); }}
                options={[
                  { value: 'none', label: 'None', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path fill="currentColor" d="m5.5 7-.1.01a.5.5 0 0 0-.4.49v9a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 0-1H6V8h12.5a.5.5 0 0 0 0-1z" /></svg> },
                  { value: 'square', label: 'Square', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M18.5 7a.5.5 0 0 1 0 1H6v8h12.5a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5z" /></svg> },
                  { value: 'round', label: 'Round', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path fill="currentColor" d="M10 7a5 5 0 0 0 0 10h8.5a.5.5 0 0 0 0-1H10a4 4 0 0 1 0-8h8.5a.5.5 0 0 0 0-1z" /></svg> },
                ]}
              />
            </div>
          </div>
        )}
      </div>

      {/* ═══ Effects ═══ */}
      <div className={SECTION_BORDER}>
        <SectionHeader title="Effects" onAdd={() => updateEffects([...effects, { id: uid(), type: 'drop-shadow', visible: true, color: 'rgba(0,0,0,0.25)', offsetX: 0, offsetY: 4, blur: 4, spread: 0 }])} />
        {effects.map((eff, i) => {
          const label = eff.type === 'drop-shadow' ? 'Drop shadow' : eff.type === 'inner-shadow' ? 'Inner shadow' : eff.type === 'layer-blur' ? 'Layer blur' : 'Background blur';
          const vals = eff.type === 'drop-shadow' || eff.type === 'inner-shadow'
            ? `X ${eff.offsetX ?? 0} · Y ${eff.offsetY ?? 0} · B ${eff.blur ?? 0} · S ${eff.spread ?? 0}`
            : `${eff.blur ?? 0}px`;
          return (
            <div key={eff.id} className="group px-2 py-1.5 flex items-center gap-1.5 hover:bg-gray-50">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path fill="#b3b3b3" d="M16.204 6.01A2 2 0 0 1 18 8v8l-.01.204a2 2 0 0 1-1.786 1.785L16 18H8l-.204-.01a2 2 0 0 1-1.785-1.786L6 16V8a2 2 0 0 1 1.796-1.99L8 6h8zM8 7a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1z" />
                <path fill="#cdcdcd" d="M18 19a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2z" />
              </svg>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-gray-700 truncate">{label}</div>
                <div className="text-[10px] text-gray-400 truncate">{vals}</div>
              </div>
              <button type="button" title="Toggle visibility" onClick={() => { const ne = [...effects]; ne[i] = { ...eff, visible: !eff.visible }; updateEffects(ne); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity">
                <EyeSvg visible={eff.visible} size={14} />
              </button>
              <button type="button" title="Remove" onClick={() => updateEffects(effects.filter((_, j) => j !== i))}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500">
                <MinusSvg size={14} />
              </button>
            </div>
          );
        })}
        {effects.length > 0 && effects.some(e => (e.type === 'drop-shadow' || e.type === 'inner-shadow') && e.visible) && (
          <div className="px-2 pb-2">
            {effects.filter(e => e.visible).map((eff, i) => {
              if (eff.type !== 'drop-shadow' && eff.type !== 'inner-shadow') return null;
              const updateEff = (upd: Partial<EffectItem>) => {
                const ne = [...effects];
                const idx = effects.indexOf(eff);
                ne[idx] = { ...eff, ...upd };
                updateEffects(ne);
              };
              return (
                <div key={eff.id} className="mt-1 ml-1 pl-3 border-l-2 border-gray-200 space-y-1">
                  <div className="flex gap-1">
                    <ColorPicker label="" color={eff.color ?? '#000000'} onChange={(c) => updateEff({ color: c })} />
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {([['offsetX', 'X'], ['offsetY', 'Y'], ['blur', 'B'], ['spread', 'S']] as const).map(([k, l]) => (
                      <label key={k} className="flex items-center h-5 rounded bg-transparent hover:bg-gray-50 border border-gray-200">
                        <span className="pl-1 text-[9px] text-gray-400">{l}</span>
                        <input type="number" value={eff[k] ?? 0}
                          onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) updateEff({ [k]: v }); }}
                          className="w-full h-full bg-transparent text-[10px] text-gray-700 outline-none px-0.5 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ Layout Guide ═══ */}
      <div className={SECTION_BORDER}>
        <SectionHeader title="Layout guide" onAdd={() => updateGuides([...guides, { id: uid(), type: 'grid', size: 10, color: 'rgba(255,0,0,0.1)', visible: true }])} />
        {guides.map((g, i) => (
          <div key={g.id} className="group px-2 py-1 flex items-center gap-1.5 hover:bg-gray-50">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
              <path fill="#b3b3b3" fillRule="evenodd" clipRule="evenodd" d="M8 6.5a.5.5 0 0 0-1 0V7h-.5a.5.5 0 0 0 0 1H7v3.5h-.5a.5.5 0 0 0 0 1H7V16h-.5a.5.5 0 0 0 0 1H7v.5a.5.5 0 0 0 1 0V17h3.5v.5a.5.5 0 0 0 1 0V17H16v.5a.5.5 0 0 0 1 0V17h.5a.5.5 0 0 0 0-1H17v-3.5h.5a.5.5 0 0 0 0-1H17V8h.5a.5.5 0 0 0 0-1H17v-.5a.5.5 0 0 0-1 0V7h-3.5v-.5a.5.5 0 0 0-1 0V7H8zm8 9.5v-3.5h-3.5V16zm-4.5 0v-3.5H8V16zM8 11.5V8h3.5v3.5zm4.5 0V8H16v3.5z" />
            </svg>
            <div className="flex-1">
              <span className="text-[11px] text-gray-700 capitalize">{g.type}</span>
              <span className="text-gray-400 ml-1 text-[10px]">{g.size}px</span>
            </div>
            <input type="number" value={g.size} min={1} max={200}
              onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) { const ng = [...guides]; ng[i] = { ...g, size: v }; updateGuides(ng); } }}
              className="w-10 h-5 text-[10px] text-center border border-gray-200 rounded bg-transparent outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
            <button type="button" onClick={() => { const ng = [...guides]; ng[i] = { ...g, visible: !g.visible }; updateGuides(ng); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity">
              <EyeSvg visible={g.visible} size={14} />
            </button>
            <button type="button" title="Remove" onClick={() => updateGuides(guides.filter((_, j) => j !== i))}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500">
              <MinusSvg size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* ═══ Export ═══ */}
      <div className={SECTION_BORDER}>
        <SectionHeader title="Export" onAdd={() => updateExports([...exports, { id: uid(), scale: '1x', format: 'png' }])} />
        {exports.map((ex, i) => (
          <div key={ex.id} className="group px-2 py-1 flex items-center gap-1">
            <span className="text-gray-400 cursor-grab shrink-0">
              <svg width="10" height="16" viewBox="0 0 16 32" fill="none"><path fill="currentColor" fillRule="evenodd" d="M5 12.5h6v1H5zm0 3h6v1H5zm0 3h6v1H5z" /></svg>
            </span>
            <select value={ex.scale} onChange={(e) => { const ne = [...exports]; ne[i] = { ...ex, scale: e.target.value }; updateExports(ne); }}
              className="w-12 h-6 text-[10px] bg-transparent border border-gray-200 rounded outline-none cursor-pointer">
              {['0.5x', '1x', '1.5x', '2x', '3x', '4x'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={ex.format} onChange={(e) => { const ne = [...exports]; ne[i] = { ...ex, format: e.target.value as ExportFormat }; updateExports(ne); }}
              className="flex-1 h-6 text-[10px] bg-transparent border border-gray-200 rounded outline-none cursor-pointer">
              {(['png', 'jpeg', 'svg', 'pdf'] as const).map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
            </select>
            <button type="button" title="Remove" onClick={() => updateExports(exports.filter((_, j) => j !== i))}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500">
              <MinusSvg size={14} />
            </button>
          </div>
        ))}
        {exports.length > 0 && (
          <div className="px-2 pb-2 pt-1">
            <button type="button"
              className="w-full py-1.5 text-[11px] font-medium text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              Export {frame.name ?? (frame.isSection ? 'Section' : 'Frame')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
