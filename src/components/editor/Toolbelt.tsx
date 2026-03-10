'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import type { ToolType } from '@/types/editor';

/* ═══════════════════════════════════════════
   SVG Icons — Figma-accurate 24×24 viewBox
   ═══════════════════════════════════════════ */

function MoveIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        fill="currentColor"
        d="M4.586 4.586a2 2 0 0 1 2.005-.497l.14.05 13 5.107a2 2 0 0 1 1.267 1.779v.159a2 2 0 0 1-1.26 1.782l-.15.053-5.024 1.545-1.545 5.024a2 2 0 0 1-1.677 1.398l-.158.012a2 2 0 0 1-1.938-1.267l-5.107-13a2 2 0 0 1 .447-2.145m1.78.484a1 1 0 0 0-1.073.223l-.097.112a1 1 0 0 0-.127.96l5.108 13a1 1 0 0 0 .811.628l.158.006a1 1 0 0 0 .859-.558l.058-.147 1.7-5.53 5.531-1.701a1 1 0 0 0 .687-.76l.018-.157a1 1 0 0 0-.492-.9l-.142-.069z"
      />
    </svg>
  );
}

function HandIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        fill="currentColor"
        d="M12.5 3a.5.5 0 0 1 .5.5V11h2V6.5a.5.5 0 0 1 1 0V11h1.5V8.5a.5.5 0 0 1 1 0V14a5.5 5.5 0 0 1-5.5 5.5H13a5.5 5.5 0 0 1-5.15-3.57l-2.27-6.06a.79.79 0 0 1 .03-.65.75.75 0 0 1 .67-.39.72.72 0 0 1 .62.36L9 12.5V3.5a.5.5 0 0 1 1 0V11h2V3.5a.5.5 0 0 1 .5-.5Z"
      />
    </svg>
  );
}

function RectangleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M18 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1M6 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14m-8 7a8 8 0 1 1 16 0 8 8 0 0 1-16 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function LineIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        fill="currentColor"
        d="M5.146 18.854a.5.5 0 0 1 0-.708l13-13a.5.5 0 0 1 .708.708l-13 13a.5.5 0 0 1-.708 0z"
      />
    </svg>
  );
}

function TextIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        fill="currentColor"
        d="M19.5 4a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V5h-6.5v14H15a.5.5 0 0 1 0 1H9a.5.5 0 0 1 0-1h2.5V5H5v2.5a.5.5 0 0 1-1 0v-3a.5.5 0 0 1 .5-.5z"
      />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Zm2-1a1 1 0 0 0-1 1v8.586l3.293-3.293a1 1 0 0 1 1.414 0L13 14.586l1.293-1.293a1 1 0 0 1 1.414 0L19 16.586V6a1 1 0 0 0-1-1H6Zm13 12.414-3.293-3.293L14.414 15.414l-3.707-3.707L5 17.414V18a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.586ZM15.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function FrameToolIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M9 3a1 1 0 0 1 1 1v2h4V4a1 1 0 1 1 2 0v2h3a2 2 0 0 1 2 2v3a1 1 0 1 1-2 0V8h-3v3a1 1 0 1 1-2 0V8h-4v3a1 1 0 1 1-2 0V8H5v3a1 1 0 1 1-2 0V8a2 2 0 0 1 2-2h3V4a1 1 0 0 1 1-1ZM5 13a1 1 0 0 1 1 1v2h4v-2a1 1 0 1 1 2 0v2h4v-2a1 1 0 1 1 2 0v2h1a2 2 0 0 1-2 2h-3v2a1 1 0 1 1-2 0v-2h-4v2a1 1 0 1 1-2 0v-2H5a2 2 0 0 1-2-2v-1a1 1 0 0 1 1-1Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SectionIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M13 5h5a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8h7a1 1 0 0 0 1-1zm-1 0H6a1 1 0 0 0-1 1v3h7zm0-1h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6q0-.104.01-.204A2 2 0 0 1 6 4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PencilCreationIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M4.008 5.124a1 1 0 0 1 1.116-1.116l3.66.457-.124.992-2.636-.329L5 5l.128 1.024.33 2.636a1 1 0 0 0 .285.583l7.403 7.403 3.5-3.5-7.403-7.403a1 1 0 0 0-.583-.286l.124-.992a2 2 0 0 1 1.166.57l9.55 9.55a2 2 0 0 1 0 2.83L17.414 19.5a2 2 0 0 1-2.828 0l-9.55-9.55a2 2 0 0 1-.57-1.166zm13.346 8.73-3.5 3.5 1.439 1.439a1 1 0 0 0 1.414 0l2.086-2.086a1 1 0 0 0 0-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M12.5 3a8.5 8.5 0 0 1 0 17H7.09c-.89 0-1.39 0-1.767-.121l-.154-.06a2 2 0 0 1-.906-.828l-.082-.16c-.136-.297-.17-.657-.178-1.248L4 16.909V11.5A8.5 8.5 0 0 1 12.5 3m0 1A7.5 7.5 0 0 0 5 11.5v5.41c0 .523 0 .861.02 1.12.018.247.05.34.07.385a1 1 0 0 0 .495.494c.045.02.138.053.386.072.258.019.596.019 1.12.019H12.5a7.5 7.5 0 0 0 0-15"
      />
    </svg>
  );
}

function ActionsIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M9 13a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2zm7.5 0a.5.5 0 0 1 .5.5V16h2.5a.5.5 0 0 1 0 1H17v2.5a.5.5 0 0 1-1 0V17h-2.5a.5.5 0 0 1 0-1H16v-2.5a.5.5 0 0 1 .5-.5M6 14a1 1 0 0 0-1 1v3a1 1 0 0 0 .897.995L6 19h3a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1zm.87-10.275a1 1 0 0 1 1.337.068l3 3a1 1 0 0 1 0 1.414l-3 3a1 1 0 0 1-1.414 0l-3-3a1 1 0 0 1 0-1.414l3-3zM16.5 4a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7m-12 3.5 3 3 3-3-3-3zm12-2.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5"
      />
    </svg>
  );
}

function EyedropperIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M16.922 3.56a2.501 2.501 0 0 1 3.517 3.517l-.172.19-2.206 2.205a.33.33 0 0 0 0 .466h.001c.548.549.582 1.418.103 2.007l-.104.115a1.5 1.5 0 0 1-2.12 0l-.233-.233-6.94 6.94a2.5 2.5 0 0 1-2.12.705L5.56 20.56a1.5 1.5 0 0 1-2.12-2.121l1.086-1.09a2.5 2.5 0 0 1 .706-2.118l6.94-6.939-.232-.232a1.5 1.5 0 0 1 0-2.122l.114-.103a1.5 1.5 0 0 1 1.893 0l.114.103.052.042c.127.084.3.07.411-.042l2.208-2.207zM5.939 15.939a1.5 1.5 0 0 0-.405 1.37c.044.208.013.435-.137.585l-1.25 1.25v.002a.5.5 0 0 0 .706.706l1.251-1.251c.15-.15.377-.181.584-.137.48.102 1-.032 1.372-.404L15 11.12 12.88 9zm13.621-11.5a1.5 1.5 0 0 0-2.12 0l-2.21 2.206a1.327 1.327 0 0 1-1.877 0 .5.5 0 0 0-.707.707l3.994 3.994.005.005h.001a.5.5 0 0 0 .707-.707l-.004-.003a1.33 1.33 0 0 1 .004-1.877L19.56 6.56a1.5 1.5 0 0 0 0-2.122"
      />
    </svg>
  );
}

function PenToolIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M18.483 4.097a2.302 2.302 0 0 1 1.42 1.42c.187.546.065 1.093-.108 1.528-.17.427-.443.868-.746 1.292-.609.852-1.489 1.852-2.33 2.809l-.3.342c-.78.89-1.507 1.72-2.017 2.408-.258.348-.44.636-.539.857-.043.097-.06.158-.065.19a.497.497 0 0 0 .344.574c.03.01.093.023.2.014.248-.02.588-.115 1.026-.322.877-.415 1.95-1.145 3.22-2.253a.5.5 0 1 1 .646.763c-1.3 1.133-2.44 1.92-3.415 2.38-.488.232-.958.387-1.39.422-.434.035-.873-.052-1.207-.329a1.497 1.497 0 0 1-.536-1.488c.06-.303.22-.623.423-.91l.005-.007c.3-.42.714-.91 1.17-1.43l-.85-.85-5.11 5.11c-.357.358-.578.578-.832.758a4 4 0 0 1-.863.465c-.287.112-.593.184-1.003.3l-.084.024-1.635.467a.75.75 0 0 1-.924-.924l.467-1.636.024-.083c.116-.41.188-.716.3-1.003a4 4 0 0 1 .465-.863c.18-.254.4-.475.758-.832l5.11-5.11-.85-.85-.006.006c-.288.203-.608.363-.911.422a1.497 1.497 0 0 1-1.488-.536c-.277-.334-.364-.773-.329-1.207.035-.432.19-.902.422-1.39.46-.975 1.247-2.115 2.38-3.415a.5.5 0 1 1 .763.646c-1.108 1.27-1.838 2.343-2.253 3.22-.207.438-.302.778-.322 1.026-.01.107.003.17.014.2a.497.497 0 0 0 .574.344c.032-.005.093-.022.19-.065.221-.099.509-.281.857-.539.688-.51 1.518-1.237 2.408-2.017l.342-.3c.957-.841 1.957-1.721 2.809-2.33.424-.303.865-.576 1.292-.746.435-.173.982-.295 1.528-.108m.37.953a.878.878 0 0 0-.44-.027c-.2.04-.472.158-.862.314l-.027.011c-.365.148-.785.402-1.198.698-.83.593-1.814 1.458-2.77 2.298l-.342.3c-.337.296-.667.585-.975.855l3.262 3.262c.27-.308.559-.638.856-.975l.3-.342c.839-.956 1.704-1.94 2.297-2.77.296-.413.55-.833.698-1.198l.011-.027c.156-.39.274-.662.314-.862a.878.878 0 0 0-.027-.44l-.004-.012a1.298 1.298 0 0 0-.726-.726z"
      />
    </svg>
  );
}

function BrushToolIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M17.5 3a2.5 2.5 0 0 0-2.45 2.004c-.256.018-.505.074-.74.173l-.147.07-7.38 3.937a2.5 2.5 0 0 0-1.273 1.458l-.041.148-.876 3.504a2.5 2.5 0 0 0 .543 2.272l.117.125 1.056 1.056A2.5 2.5 0 0 0 8.5 18.5h.177l.168-.013a2.5 2.5 0 0 0 1.878-.93l.1-.132 2.41-3.614a2.5 2.5 0 0 0 .224-.436l.06-.175.804-2.813a2.5 2.5 0 0 0-.076-1.66l-.075-.163 2.297-1.226A2.502 2.502 0 0 0 17.5 3m-4.877 10.06-2.41 3.613a1.5 1.5 0 0 1-1.135.82l-.132.007H8.5a1.5 1.5 0 0 1-.957-.345l-.104-.092-1.056-1.057a1.5 1.5 0 0 1-.383-1.315l.023-.104.877-3.505a1.5 1.5 0 0 1 .688-.907l.1-.057 7.38-3.937a1.5 1.5 0 0 1 1.68.184l.104.099.283.283a1.5 1.5 0 0 1 .352 1.482l-.044.127-.804 2.813a1.5 1.5 0 0 1-.136.325z"
      />
    </svg>
  );
}

function HighlighterToolIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M16.293 3.293a1 1 0 0 1 1.414 0l3 3a1 1 0 0 1 0 1.414l-9 9A1 1 0 0 1 11 17H8a1 1 0 0 1-1-1v-3a1 1 0 0 1 .293-.707zM8 13.414V16h2.586L19.586 7 17 4.414zM4.5 19a.5.5 0 0 0 0 1h15a.5.5 0 0 0 0-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M9.646 11.146a.5.5 0 0 1 .708 0L12 12.793l1.646-1.647a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 0-.708"
        clipRule="evenodd"
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════
   Tool Button — single tool (no dropdown)
   ═══════════════════════════════════════════ */

function ToolButton({
  icon,
  label,
  shortcut,
  active,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      aria-disabled={disabled}
      title={`${label} (${shortcut})`}
      className={`p-2 rounded-md transition-colors ${
        disabled
          ? 'text-gray-300 cursor-not-allowed'
          : active
            ? 'bg-blue-500/20 text-blue-400'
            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
      }`}
      onClick={disabled ? undefined : onClick}
    >
      {icon}
    </button>
  );
}

/* ═══════════════════════════════════════════
   Tool Group — main tool + chevron dropdown
   ═══════════════════════════════════════════ */

interface SubTool {
  tool: ToolType;
  icon: React.ReactNode;
  label: string;
  shortcut: string;
}

function ToolGroup({
  subTools,
  selectedTool,
  activeTool,
  disabled,
  onSelect,
}: {
  subTools: SubTool[];
  selectedTool: ToolType;
  activeTool: ToolType;
  disabled?: boolean;
  onSelect: (tool: ToolType) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = subTools.find((t) => t.tool === selectedTool) ?? subTools[0];
  const isGroupActive = subTools.some((t) => t.tool === activeTool);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative flex items-center" role="group" aria-label={current.label}>
      <button
        type="button"
        aria-label={current.label}
        aria-pressed={isGroupActive}
        aria-disabled={disabled}
        title={`${current.label} (${current.shortcut})`}
        className={`p-2 rounded-l-md transition-colors ${
          disabled
            ? 'text-gray-300 cursor-not-allowed'
            : isGroupActive
              ? 'bg-blue-500/20 text-blue-400'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
        }`}
        onClick={disabled ? undefined : () => onSelect(current.tool)}
      >
        {current.icon}
      </button>

      <button
        type="button"
        aria-label={`${current.label} tools`}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`pr-1 pl-0 py-2 rounded-r-md transition-colors ${
          disabled
            ? 'text-gray-300 cursor-not-allowed'
            : isGroupActive
              ? 'text-blue-400'
              : 'text-gray-400 hover:text-gray-600'
        }`}
        onClick={disabled ? undefined : () => setOpen(!open)}
      >
        <ChevronDownIcon />
      </button>

      {open && !disabled && (
        <div className="absolute bottom-full left-0 mb-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[160px]">
          {subTools.map((sub) => (
            <button
              key={sub.tool}
              type="button"
              className={`flex items-center gap-2.5 w-full px-3 py-2 text-xs transition-colors ${
                activeTool === sub.tool
                  ? 'bg-blue-500/15 text-blue-400'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              onClick={() => {
                onSelect(sub.tool);
                setOpen(false);
              }}
            >
              <span className="shrink-0">{sub.icon}</span>
              <span className="flex-1 text-left">{sub.label}</span>
              <kbd className="text-[10px] text-gray-500 font-mono">{sub.shortcut}</kbd>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ToolDivider() {
  return <div className="w-px h-6 bg-gray-200 mx-0.5 shrink-0" />;
}

/* ═══════════════════════════════════════════
   Drawing Tools Container (Draw mode only)
   ═══════════════════════════════════════════ */

function DrawingToolsContainer({
  activeTool,
  onSelect,
  brushWidths,
  onSetBrushWidth,
}: {
  activeTool: ToolType;
  onSelect: (tool: ToolType) => void;
  brushWidths: { pen: number; brush: number; pencil: number };
  onSetBrushWidth: (tool: 'pen' | 'brush' | 'pencil', width: number) => void;
}) {
  const [openTool, setOpenTool] = useState<'pen' | 'brush' | 'pencil' | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const drawingTools = [
    { tool: 'pen' as const, icon: <PenToolIcon />, label: 'Pen' },
    { tool: 'brush' as const, icon: <BrushToolIcon />, label: 'Brush' },
    { tool: 'pencil' as const, icon: <HighlighterToolIcon />, label: 'Pencil' },
  ];

  useEffect(() => {
    if (!openTool) return;
    const onClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setOpenTool(null);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [openTool]);

  const currentWidth = openTool ? brushWidths[openTool] : 0;

  return (
    <div ref={popupRef} className="relative flex items-center gap-0.5 bg-gray-50 rounded-lg px-1 py-0.5">
      {drawingTools.map((dt) => (
        <button
          key={dt.label}
          type="button"
          aria-label={dt.label}
          title={dt.label}
          className={`p-1.5 rounded-md transition-colors ${
            activeTool === dt.tool
              ? 'bg-blue-500/20 text-blue-400'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
          onClick={() => {
            if (activeTool === dt.tool) {
              setOpenTool((prev) => (prev === dt.tool ? null : dt.tool));
              return;
            }
            onSelect(dt.tool);
            setOpenTool(null);
          }}
        >
          {dt.icon}
        </button>
      ))}

      {openTool && (
        <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50 w-44">
          <p className="text-[11px] text-gray-600 mb-2">Stroke width</p>
          <input
            type="range"
            min={1}
            max={24}
            step={1}
            value={currentWidth}
            className="w-full"
            onChange={(e) => onSetBrushWidth(openTool, Number(e.target.value))}
          />
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={24}
              value={currentWidth}
              className="w-16 px-2 py-1 text-xs border border-gray-200 rounded-md"
              onChange={(e) => onSetBrushWidth(openTool, Number(e.target.value))}
            />
            <span className="text-[11px] text-gray-500">px</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Mode-specific Tool Rows
   ═══════════════════════════════════════════ */

const ROW_HEIGHT = 44;

interface ToolRowProps {
  activeTool: ToolType;
  moveGroupTool: ToolType;
  shapeGroupTool: ToolType;
  drawingBrushWidths: { pen: number; brush: number; pencil: number };
  onSelectMove: (tool: ToolType) => void;
  onSelectShape: (tool: ToolType) => void;
  onSetTool: (tool: ToolType) => void;
  onSetDrawingBrushWidth: (tool: 'pen' | 'brush' | 'pencil', width: number) => void;
}

const moveSubTools: SubTool[] = [
  { tool: 'move', icon: <MoveIcon />, label: 'Move', shortcut: 'V' },
  { tool: 'hand', icon: <HandIcon />, label: 'Hand', shortcut: 'H' },
];

const shapeSubTools: SubTool[] = [
  { tool: 'rectangle', icon: <RectangleIcon />, label: 'Rectangle', shortcut: 'R' },
  { tool: 'line', icon: <LineIcon />, label: 'Line', shortcut: 'L' },
  { tool: 'arrow', icon: <LineIcon />, label: 'Arrow', shortcut: 'Shift+L' },
  { tool: 'circle', icon: <CircleIcon />, label: 'Ellipse', shortcut: 'O' },
  { tool: 'polygon', icon: <RectangleIcon />, label: 'Polygon', shortcut: 'G' },
  { tool: 'star', icon: <CircleIcon />, label: 'Star', shortcut: 'Shift+S' },
  { tool: 'image', icon: <ImageIcon />, label: 'Image', shortcut: 'Ctrl+Shift+K' },
];

const sectionSubTools: SubTool[] = [
  { tool: 'section', icon: <SectionIcon />, label: 'Section', shortcut: 'S' },
  { tool: 'frame', icon: <FrameToolIcon />, label: 'Frame', shortcut: 'F' },
];

function DrawToolRow(props: ToolRowProps) {
  return (
    <div className="flex items-center gap-0.5" style={{ height: ROW_HEIGHT }}>
      <ToolGroup
        subTools={moveSubTools}
        selectedTool={props.moveGroupTool}
        activeTool={props.activeTool}
        onSelect={props.onSelectMove}
      />
      <ToolDivider />
      <DrawingToolsContainer
        activeTool={props.activeTool}
        onSelect={props.onSetTool}
        brushWidths={props.drawingBrushWidths}
        onSetBrushWidth={props.onSetDrawingBrushWidth}
      />
      <ToolDivider />
      <ToolGroup
        subTools={sectionSubTools}
        selectedTool="section"
        activeTool={props.activeTool}
        onSelect={props.onSetTool}
      />
      <ToolGroup
        subTools={shapeSubTools}
        selectedTool={props.shapeGroupTool}
        activeTool={props.activeTool}
        onSelect={props.onSelectShape}
      />
      <ToolButton
        icon={<TextIcon />}
        label="Text"
        shortcut="T"
        active={props.activeTool === 'text'}
        onClick={() => props.onSetTool('text')}
      />
      <ToolButton
        icon={<CommentIcon />}
        label="Comment"
        shortcut="C"
        active={false}
        onClick={() => {}}
      />
      <ToolButton
        icon={<ActionsIcon />}
        label="Actions"
        shortcut="Ctrl+K"
        active={false}
        onClick={() => {}}
      />
    </div>
  );
}

function DesignToolRow(props: ToolRowProps) {
  return (
    <div className="flex items-center gap-0.5" style={{ height: ROW_HEIGHT }}>
      <ToolGroup
        subTools={moveSubTools}
        selectedTool={props.moveGroupTool}
        activeTool={props.activeTool}
        onSelect={props.onSelectMove}
      />
      <ToolDivider />
      <ToolGroup
        subTools={sectionSubTools}
        selectedTool="section"
        activeTool={props.activeTool}
        onSelect={props.onSetTool}
      />
      <ToolGroup
        subTools={shapeSubTools}
        selectedTool={props.shapeGroupTool}
        activeTool={props.activeTool}
        onSelect={props.onSelectShape}
      />
      <ToolDivider />
      <ToolButton
        icon={<TextIcon />}
        label="Text"
        shortcut="T"
        active={props.activeTool === 'text'}
        onClick={() => props.onSetTool('text')}
      />
      <ToolButton
        icon={<ImageIcon />}
        label="Image"
        shortcut="I"
        active={props.activeTool === 'image'}
        onClick={() => props.onSetTool('image')}
      />
      <ToolDivider />
      <ToolButton
        icon={<CommentIcon />}
        label="Comment"
        shortcut="C"
        active={false}
        onClick={() => {}}
      />
      <ToolButton
        icon={<ActionsIcon />}
        label="Actions"
        shortcut="Ctrl+K"
        active={false}
        onClick={() => {}}
      />
    </div>
  );
}

function DevToolRow(props: ToolRowProps) {
  return (
    <div className="flex items-center gap-0.5" style={{ height: ROW_HEIGHT }}>
      <ToolButton
        icon={<MoveIcon />}
        label="Move"
        shortcut=""
        active={props.activeTool === 'move'}
        disabled
        onClick={() => {}}
      />
      <ToolButton
        icon={<EyedropperIcon />}
        label="Copy colors"
        shortcut="I"
        active={false}
        disabled
        onClick={() => {}}
      />
      <ToolButton
        icon={<CommentIcon />}
        label="Comment"
        shortcut="C"
        active={false}
        disabled
        onClick={() => {}}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════
   Toolbelt — mode-aware carousel
   ═══════════════════════════════════════════ */

const MODE_ORDER = ['dev', 'design', 'draw'] as const;

export default function Toolbelt() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const mode = useEditorStore((s) => s.mode);
  const selectedElementIds = useEditorStore((s) => s.selectedElementIds);
  const groupElements = useEditorStore((s) => s.groupElements);
  const ungroupElements = useEditorStore((s) => s.ungroupElements);
  const getElement = useEditorStore((s) => s.getElement);
  const drawingBrushWidths = useEditorStore((s) => s.drawingBrushWidths);
  const setDrawingBrushWidth = useEditorStore((s) => s.setDrawingBrushWidth);

  const [moveGroupTool, setMoveGroupTool] = useState<ToolType>('move');
  const [shapeGroupTool, setShapeGroupTool] = useState<ToolType>('rectangle');

  const selectMoveTool = useCallback(
    (tool: ToolType) => {
      setMoveGroupTool(tool);
      setActiveTool(tool);
    },
    [setActiveTool],
  );

  const selectShapeTool = useCallback(
    (tool: ToolType) => {
      setShapeGroupTool(tool);
      setActiveTool(tool);
    },
    [setActiveTool],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (mode === 'dev') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        if (e.shiftKey) {
          const ids = useEditorStore.getState().selectedElementIds;
          if (ids.length === 1) {
            const el = getElement(ids[0]);
            if (el && el.type === 'frame') {
              ungroupElements(ids[0]);
            }
          }
        } else {
          const ids = useEditorStore.getState().selectedElementIds;
          if (ids.length >= 2) {
            groupElements(ids);
          }
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'v':
          selectMoveTool('move');
          break;
        case 'h':
          selectMoveTool('hand');
          break;
        case 'r':
          selectShapeTool('rectangle');
          break;
        case 'o':
          selectShapeTool('circle');
          break;
        case 'l':
          selectShapeTool(e.shiftKey ? 'arrow' : 'line');
          break;
        case 'g':
          selectShapeTool('polygon');
          break;
        case 't':
          setActiveTool('text');
          break;
        case 'i':
          setActiveTool('image');
          break;
        case 'b':
          setActiveTool('brush');
          break;
        case 'p':
          setActiveTool(e.shiftKey ? 'pencil' : 'pen');
          break;
        case 'f':
          setActiveTool('frame');
          break;
        case 's':
          setActiveTool(e.shiftKey ? 'star' : 'section');
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mode, selectMoveTool, selectShapeTool, setActiveTool, groupElements, ungroupElements, getElement]);

  const rowProps: ToolRowProps = {
    activeTool,
    moveGroupTool,
    shapeGroupTool,
    drawingBrushWidths,
    onSelectMove: selectMoveTool,
    onSelectShape: selectShapeTool,
    onSetTool: setActiveTool,
    onSetDrawingBrushWidth: setDrawingBrushWidth,
  };

  const modeIndex = MODE_ORDER.indexOf(mode);
  const translateY = -(modeIndex * ROW_HEIGHT);

  return (
    <div
      className="overflow-hidden"
      style={{ height: ROW_HEIGHT }}
    >
      <div
        className="transition-transform duration-300 ease-out"
        style={{ transform: `translateY(${translateY}px)` }}
      >
        <DevToolRow {...rowProps} />
        <DesignToolRow {...rowProps} />
        <DrawToolRow {...rowProps} />
      </div>
    </div>
  );
}
