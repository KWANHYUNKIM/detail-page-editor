'use client';

import { useState } from 'react';
import type {
  TextElement,
  TextAlign,
  FontWeight,
  FontStyle,
  TextDecoration,
  FillValue,
  EffectItem,
  ExportSetting,
  ExportFormat,
} from '@/types/editor';
import { FONT_SIZE_OPTIONS } from '@/constants/fonts';
import ColorPicker from '@/components/ui/ColorPicker';
import GradientPicker from '@/components/ui/GradientPicker';
import FontPicker from '@/components/ui/FontPicker';

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

interface TextPropertiesPanelProps {
  text: TextElement;
  handleUpdate: (updates: Record<string, unknown>) => void;
  alignElements: (ids: string[], direction: 'left' | 'right' | 'top' | 'bottom' | 'centerH' | 'centerV') => void;
  distributeElements: (ids: string[], axis: 'horizontal' | 'vertical') => void;
  aspectLocked: boolean;
  setAspectLocked: (v: boolean) => void;
}

export default function TextPropertiesPanel({ text, handleUpdate, alignElements, distributeElements, aspectLocked, setAspectLocked }: TextPropertiesPanelProps) {
  const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false);
  const effects: EffectItem[] = (text as unknown as { effects?: EffectItem[] }).effects ?? [
    ...(text.dropShadow?.enabled ? [{ id: 'ds', type: 'drop-shadow' as const, visible: true, color: text.dropShadow.color, offsetX: text.dropShadow.offsetX, offsetY: text.dropShadow.offsetY, blur: text.dropShadow.blur, spread: text.dropShadow.spread }] : []),
    ...(text.innerShadow?.enabled ? [{ id: 'is', type: 'inner-shadow' as const, visible: true, color: text.innerShadow.color, offsetX: text.innerShadow.offsetX, offsetY: text.innerShadow.offsetY, blur: text.innerShadow.blur, spread: text.innerShadow.spread }] : []),
  ];
  const exports: ExportSetting[] = (text as unknown as { exportSettings?: ExportSetting[] }).exportSettings ?? [];

  const updateEffects = (newEffects: EffectItem[]) => {
    handleUpdate({ effects: newEffects });
  };
  const updateExports = (newExports: ExportSetting[]) => {
    handleUpdate({ exportSettings: newExports });
  };

  return (
    <div className="w-[280px] bg-white border-l border-gray-200 shrink-0 overflow-y-auto text-[11px]">
      {/* Header */}
      <div className={`flex items-center h-8 px-2 ${SECTION_BORDER}`}>
        <span className="text-xs font-medium text-gray-700 px-1">Text</span>
      </div>

      {/* Alignment */}
      <div className={`px-2 py-1.5 ${SECTION_BORDER}`}>
        <div className="flex gap-px items-center">
          <div className="flex flex-1 gap-px">
            {(['left', 'centerH', 'right'] as const).map(d => <AlignBtn key={d} dir={d} onClick={() => alignElements([text.id], d)} />)}
          </div>
          <div className="w-px bg-[#e5e5e5] mx-1 h-5" />
          <div className="flex flex-1 gap-px">
            {(['top', 'centerV', 'bottom'] as const).map(d => <AlignBtn key={d} dir={d} onClick={() => alignElements([text.id], d)} />)}
          </div>
          <div className="w-px bg-[#e5e5e5] mx-1 h-5" />
          <button type="button" title="Tidy up" onClick={() => distributeElements([text.id], 'horizontal')} className={ICON_BTN}>
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
              <input type="number" value={Math.round(text[axis])} onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) handleUpdate({ [axis]: v }); }} className={INPUT_BASE} />
            </label>
          ))}
        </div>
      </div>

      {/* Dimensions W/H + Aspect Lock */}
      <div className={`px-2 py-1 ${SECTION_BORDER}`}>
        <div className="flex gap-1 items-center">
          <label className={LABEL_INPUT}>
            <span className="pl-1.5 pr-1 text-gray-400 select-none cursor-ew-resize font-medium">W</span>
            <input type="number" value={Math.round(text.width)} min={1}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (isNaN(v)) return;
                if (aspectLocked && text.width > 0) {
                  handleUpdate({ width: v, height: Math.round(v * text.height / text.width) });
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
            <input type="number" value={Math.round(text.height)} min={1}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (isNaN(v)) return;
                if (aspectLocked && text.height > 0) {
                  handleUpdate({ height: v, width: Math.round(v * text.width / text.height) });
                } else handleUpdate({ height: v });
              }} className={INPUT_BASE} />
          </label>
        </div>
      </div>

      {/* Rotation + Flip */}
      <div className={`px-2 py-1 ${SECTION_BORDER}`}>
        <div className="flex gap-1 items-center">
          <label className={LABEL_INPUT}>
            <span className="pl-1 pr-0.5 text-gray-400 shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M9 8.5a.5.5 0 0 0-1 0v7a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 0-1H13a4 4 0 0 0-4-4zM9 12v3h3a3 3 0 0 0-3-3" />
              </svg>
            </span>
            <input type="text" value={`${Math.round(text.rotation)}°`}
              onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) handleUpdate({ rotation: v }); }}
              className="w-full h-full bg-transparent text-[11px] text-gray-700 outline-none pr-1.5" />
          </label>
          <div className="flex gap-px shrink-0">
            <button type="button" title="Rotate 90 right" onClick={() => handleUpdate({ rotation: (text.rotation + 90) % 360 })} className={ICON_BTN}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path fill="#b3b3b3" fillRule="evenodd" clipRule="evenodd" d="M10.233 6.474a2.5 2.5 0 0 1 3.535 0L15.293 8H14a.5.5 0 0 0 0 1h2.5a.5.5 0 0 0 .5-.5V6a.5.5 0 1 0-1 0v1.292l-1.525-1.525a3.5 3.5 0 0 0-4.95 0L7.147 8.146a.5.5 0 0 0 .707.707zm2.828 3.172a1.5 1.5 0 0 0-2.121 0l-3.293 3.293a1.5 1.5 0 0 0 0 2.121l3.293 3.293a1.5 1.5 0 0 0 2.12 0l3.294-3.293a1.5 1.5 0 0 0 0-2.121zm-1.414.707a.5.5 0 0 1 .707 0l3.293 3.293a.5.5 0 0 1 0 .707l-3.293 3.293a.5.5 0 0 1-.707 0l-3.293-3.293a.5.5 0 0 1 0-.707z" />
              </svg>
            </button>
            <button type="button" title="Flip horizontal" onClick={() => handleUpdate({ flipX: !(text.flipX ?? false) })}
              className={`${IC} w-7 h-7 rounded-sm transition-colors ${(text.flipX ?? false) ? 'bg-blue-50' : 'hover:bg-[#e8e8e8]'}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path fill={(text.flipX ?? false) ? '#3b82f6' : '#b3b3b3'} fillRule="evenodd" clipRule="evenodd" d="M12.5 6.5a.5.5 0 0 0-1 0v11a.5.5 0 0 0 1 0zM6 9.104a.75.75 0 0 1 1.28-.53L10 11.292a1 1 0 0 1 0 1.414l-2.72 2.72a.75.75 0 0 1-1.28-.53zm1 .603v4.586L9.293 12zm11-.603a.75.75 0 0 0-1.28-.53L14 11.292a1 1 0 0 0 0 1.414l2.72 2.72a.75.75 0 0 0 1.28-.53zm-1 .603v4.586L14.707 12z" />
              </svg>
            </button>
            <button type="button" title="Flip vertical" onClick={() => handleUpdate({ flipY: !(text.flipY ?? false) })}
              className={`${IC} w-7 h-7 rounded-sm transition-colors ${(text.flipY ?? false) ? 'bg-blue-50' : 'hover:bg-[#e8e8e8]'}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path fill={(text.flipY ?? false) ? '#3b82f6' : '#b3b3b3'} fillRule="evenodd" clipRule="evenodd" d="M17.5 12.5a.5.5 0 0 0 0-1h-11a.5.5 0 0 0 0 1zM14.896 18a.75.75 0 0 0 .53-1.28L12.708 14a1 1 0 0 0-1.414 0l-2.72 2.72a.75.75 0 0 0 .53 1.28zm-.603-1H9.707L12 14.707zm.603-11a.75.75 0 0 1 .53 1.28L12.708 10a1 1 0 0 1-1.414 0l-2.72-2.72A.75.75 0 0 1 9.103 6zm-.603 1H9.707L12 9.293z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Typography ═══ */}
      <div className={SECTION_BORDER}>
        <div className="px-2 pt-2 pb-0.5">
          <h2 className="text-[11px] font-medium text-gray-800">Typography</h2>
        </div>

        <div className="px-2 py-1">
          <FontPicker value={text.fontFamily} onChange={(f) => handleUpdate({ fontFamily: f })} />
        </div>

        <div className="px-2 py-1">
          <div className="flex gap-1 items-center">
            <div className="relative flex-1">
              <button type="button"
                onClick={() => setShowFontSizeDropdown(!showFontSizeDropdown)}
                className={`${LABEL_INPUT} w-full justify-between px-1.5`}>
                <span className="text-gray-700">{text.fontSize}px</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <path fill="currentColor" d="M9.646 11.146a.5.5 0 0 1 .708 0L12 12.793l1.646-1.647a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 0-.708" />
                </svg>
              </button>
              {showFontSizeDropdown && (
                <div className="absolute top-full left-0 mt-0.5 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1 max-h-40 overflow-y-auto">
                  {FONT_SIZE_OPTIONS.map(size => (
                    <button key={size} type="button"
                      onClick={() => { handleUpdate({ fontSize: size }); setShowFontSizeDropdown(false); }}
                      className={`w-full text-left px-2 py-1 text-[11px] hover:bg-blue-50 ${text.fontSize === size ? 'text-blue-600 bg-blue-50/50' : 'text-gray-700'}`}>
                      {size}px
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Weight: Bold toggle */}
            <button type="button" title="Bold"
              onClick={() => handleUpdate({ fontWeight: text.fontWeight === 'bold' ? 'normal' : 'bold' })}
              className={`${IC} w-7 h-7 rounded-sm transition-colors ${text.fontWeight === 'bold' ? 'bg-blue-50 text-blue-600' : 'hover:bg-[#e8e8e8] text-gray-500'}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path fill="currentColor" d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42M10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5" />
              </svg>
            </button>

            {/* Italic toggle */}
            <button type="button" title="Italic"
              onClick={() => handleUpdate({ fontStyle: text.fontStyle === 'italic' ? 'normal' : 'italic' })}
              className={`${IC} w-7 h-7 rounded-sm transition-colors ${text.fontStyle === 'italic' ? 'bg-blue-50 text-blue-600' : 'hover:bg-[#e8e8e8] text-gray-500'}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path fill="currentColor" d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-2 py-1">
          <div className="flex gap-px">
            {([
              { value: 'left' as TextAlign, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path fill="currentColor" d="M3 3h18v2H3zm0 4h12v2H3zm0 4h18v2H3zm0 4h12v2H3zm0 4h18v2H3z" /></svg> },
              { value: 'center' as TextAlign, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path fill="currentColor" d="M3 3h18v2H3zm3 4h12v2H6zm-3 4h18v2H3zm3 4h12v2H6zm-3 4h18v2H3z" /></svg> },
              { value: 'right' as TextAlign, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path fill="currentColor" d="M3 3h18v2H3zm6 4h12v2H9zm-6 4h18v2H3zm6 4h12v2H9zm-6 4h18v2H3z" /></svg> },
            ]).map(opt => (
              <button key={opt.value} type="button" title={opt.value}
                onClick={() => handleUpdate({ textAlign: opt.value })}
                className={`${IC} w-7 h-7 rounded-sm transition-colors ${text.textAlign === opt.value ? 'bg-blue-50 text-blue-600' : 'hover:bg-[#e8e8e8] text-gray-400'}`}>
                {opt.icon}
              </button>
            ))}
            <div className="w-px bg-[#e5e5e5] mx-1" />
            {([
              { value: 'none' as TextDecoration, label: 'None', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path fill="currentColor" d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6m-7 2v2h14v-2z" /></svg> },
              { value: 'underline' as TextDecoration, label: 'Underline', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path fill="currentColor" d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6m-7 2v2h14v-2z" /></svg> },
              { value: 'line-through' as TextDecoration, label: 'Strikethrough', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path fill="currentColor" d="M10 19h4v-3h-4zM5 4v3h5v3h4V7h5V4zM3 14h18v-2H3z" /></svg> },
            ]).map(opt => (
              <button key={opt.value} type="button" title={opt.label}
                onClick={() => handleUpdate({ textDecoration: opt.value })}
                className={`${IC} w-7 h-7 rounded-sm transition-colors ${text.textDecoration === opt.value ? 'bg-blue-50 text-blue-600' : 'hover:bg-[#e8e8e8] text-gray-400'}`}>
                {opt.icon}
              </button>
            ))}
          </div>
        </div>

        <div className="px-2 py-1 pb-2">
          <div className="flex gap-1">
            <label className={LABEL_INPUT} title="Line height">
              <span className="pl-1.5 pr-1 text-gray-400 shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path fill="currentColor" d="M9.17 15.5H5.83L5 18H3l3.5-10h2l3.5 10h-2zM6.33 13.5h2.34L7.5 10z" /><path fill="currentColor" d="M15 5l3 3h-2v8h2l-3 3-3-3h2V8h-2z" /></svg>
              </span>
              <input type="number" value={Math.round(text.lineHeight * 100) / 100} min={0.5} max={5} step={0.1}
                onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) handleUpdate({ lineHeight: v }); }}
                className={INPUT_BASE} />
            </label>
            <label className={LABEL_INPUT} title="Letter spacing">
              <span className="pl-1.5 pr-1 text-gray-400 shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path fill="currentColor" d="M2 4l4 4H4v8h2l-4 4-4-4h2V8H-2zm18 0l4 4h-2v8h2l-4 4-4-4h2V8h-2zm-8.5 2h2l3.5 10h-2l-.83-2.5h-3.34L10 16H8zM11.33 11.5h2.34L12.5 8z" /></svg>
              </span>
              <input type="number" value={Math.round(text.letterSpacing)} min={-20} max={100} step={1}
                onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) handleUpdate({ letterSpacing: v }); }}
                className={INPUT_BASE} />
            </label>
          </div>
        </div>
      </div>

      {/* ═══ Appearance ═══ */}
      <div className={SECTION_BORDER}>
        <div className="px-2 pt-2 pb-0.5">
          <h2 className="text-[11px] font-medium text-gray-800">Appearance</h2>
        </div>

        <div className="px-2 py-1">
          <div className="flex items-center gap-1">
            <span className="text-gray-400 shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M8 7h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1M6 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2zm9 1.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1M13.5 11a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0m-2 2a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0m-2 2a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0m1.5.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1m2-2a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1m.5 1.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0m2-4a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0m-.5 2.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1m.5 1.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0" />
              </svg>
            </span>
            <input type="text" value={`${Math.round(text.opacity * 100)}%`}
              onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) handleUpdate({ opacity: Math.min(1, Math.max(0, v / 100)) }); }}
              className="flex-1 h-7 bg-transparent text-[11px] text-gray-700 outline-none rounded hover:bg-gray-50 px-1.5 border border-transparent hover:border-gray-200 transition-colors" />
            <button type="button" title={text.visible ? 'Hide' : 'Show'} onClick={() => handleUpdate({ visible: !text.visible })}
              className={`${IC} w-6 h-6 rounded-sm hover:bg-[#e8e8e8] transition-colors shrink-0`}>
              <EyeSvg visible={text.visible} />
            </button>
          </div>
          <div className="mt-1 px-0.5">
            <input type="range" min={0} max={100} step={1} value={Math.round(text.opacity * 100)}
              onChange={(e) => handleUpdate({ opacity: parseFloat(e.target.value) / 100 })} className="w-full h-1 accent-blue-500 cursor-pointer" />
          </div>
        </div>

        <div className="px-2 py-1 pb-2">
          <div className="flex items-center gap-1">
            <span className="text-gray-400 shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M14.783 16.058C15.479 15.454 16 14.49 16 13c0-1.037-.597-2.328-1.493-3.631-.844-1.227-1.85-2.316-2.507-2.98-.658.664-1.662 1.753-2.507 2.98C8.597 10.673 8 11.964 8 13c0 1.491.521 2.454 1.217 3.058.72.623 1.721.943 2.783.943s2.063-.32 2.783-.944M12 18c2.5 0 5-1.5 5-5 0-2.712-3-6.023-4.353-7.378a.907.907 0 0 0-1.294 0C10 6.978 7 10.29 7 13.001c0 3.5 2.5 5 5 5" />
              </svg>
            </span>
            <select value={text.blendMode ?? 'normal'} onChange={(e) => handleUpdate({ blendMode: e.target.value })}
              className="flex-1 h-7 bg-transparent text-[11px] text-gray-700 outline-none rounded hover:bg-gray-50 px-1 border border-transparent hover:border-gray-200 transition-colors cursor-pointer">
              {['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion'].map(m => (
                <option key={m} value={m}>{m === 'normal' ? 'Pass through' : m.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ═══ Fill (Text Color) ═══ */}
      <div className={SECTION_BORDER}>
        <SectionHeader title="Fill" />
        <div className="px-2 pb-2">
          <GradientPicker label="" value={text.color} onChange={(c) => handleUpdate({ color: c })} />
        </div>
      </div>

      {/* ═══ Text Shadow ═══ */}
      <div className={SECTION_BORDER}>
        <div className="flex items-center justify-between px-2 py-1.5">
          <h2 className="text-[11px] font-medium text-gray-800">Text shadow</h2>
          <button type="button"
            onClick={() => {
              handleUpdate({
                textShadow: {
                  ...(text.textShadow ?? { color: 'rgba(0,0,0,0.5)', offsetX: 2, offsetY: 2, blur: 4 }),
                  enabled: !(text.textShadow?.enabled ?? false),
                },
              });
            }}
            className={`${IC} w-5 h-5 rounded-sm transition-colors ${text.textShadow?.enabled ? 'bg-blue-50 text-blue-500' : 'hover:bg-[#e8e8e8] text-gray-400'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d={text.textShadow?.enabled ? MINUS_PATH : PLUS_PATH} />
            </svg>
          </button>
        </div>
        {text.textShadow?.enabled && (
          <div className="px-2 pb-2">
            <div className="ml-1 pl-3 border-l-2 border-gray-200 space-y-1">
              <ColorPicker label="" color={text.textShadow.color} onChange={(c) => handleUpdate({ textShadow: { ...text.textShadow, color: c } })} />
              <div className="grid grid-cols-3 gap-1">
                {([['offsetX', 'X'], ['offsetY', 'Y'], ['blur', 'B']] as const).map(([k, l]) => (
                  <label key={k} className="flex items-center h-5 rounded bg-transparent hover:bg-gray-50 border border-gray-200">
                    <span className="pl-1 text-[9px] text-gray-400">{l}</span>
                    <input type="number" value={text.textShadow[k] ?? 0}
                      onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) handleUpdate({ textShadow: { ...text.textShadow, [k]: v } }); }}
                      className="w-full h-full bg-transparent text-[10px] text-gray-700 outline-none px-0.5 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ Text Stroke ═══ */}
      <div className={SECTION_BORDER}>
        <div className="flex items-center justify-between px-2 py-1.5">
          <h2 className="text-[11px] font-medium text-gray-800">Text stroke</h2>
          <button type="button"
            onClick={() => {
              handleUpdate({
                textStroke: {
                  ...(text.textStroke ?? { color: '#000000', width: 1 }),
                  enabled: !(text.textStroke?.enabled ?? false),
                },
              });
            }}
            className={`${IC} w-5 h-5 rounded-sm transition-colors ${text.textStroke?.enabled ? 'bg-blue-50 text-blue-500' : 'hover:bg-[#e8e8e8] text-gray-400'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d={text.textStroke?.enabled ? MINUS_PATH : PLUS_PATH} />
            </svg>
          </button>
        </div>
        {text.textStroke?.enabled && (
          <div className="px-2 pb-2">
            <div className="ml-1 pl-3 border-l-2 border-gray-200 space-y-1">
              <ColorPicker label="" color={text.textStroke.color} onChange={(c) => handleUpdate({ textStroke: { ...text.textStroke, color: c } })} />
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 w-10 shrink-0">Width</span>
                <input type="range" min={0} max={10} step={0.5} value={text.textStroke.width}
                  onChange={(e) => handleUpdate({ textStroke: { ...text.textStroke, width: parseFloat(e.target.value) } })}
                  className="flex-1 h-1 accent-blue-500 cursor-pointer" />
                <span className="text-[10px] text-gray-400 w-6 text-right font-mono tabular-nums">{text.textStroke.width}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ Text Background ═══ */}
      <div className={SECTION_BORDER}>
        <div className="flex items-center justify-between px-2 py-1.5">
          <h2 className="text-[11px] font-medium text-gray-800">Text background</h2>
          {text.textBackground ? (
            <button type="button" title="Remove background"
              onClick={() => handleUpdate({ textBackground: '' })}
              className={`${IC} w-5 h-5 rounded-sm hover:bg-[#e8e8e8] transition-colors text-gray-400 hover:text-red-500`}>
              <MinusSvg />
            </button>
          ) : (
            <button type="button" title="Add background"
              onClick={() => handleUpdate({ textBackground: '#FFFF00' })}
              className={`${IC} w-5 h-5 rounded-sm hover:bg-[#e8e8e8] transition-colors text-gray-400`}>
              <PlusSvg />
            </button>
          )}
        </div>
        {text.textBackground && (
          <div className="px-2 pb-2">
            <ColorPicker label="" color={text.textBackground} onChange={(c) => handleUpdate({ textBackground: c })} />
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
            {effects.filter(e => e.visible).map((eff) => {
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
              Export {text.name ?? 'Text'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
