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
        d="M3 5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5Zm1 0v4h16V5H4ZM3 15a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4Zm1 0v4h16v-4H4Z"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
      <path
        fill="currentColor"
        d="M9.768 6.768a.5.5 0 0 1 .707.707l-2.12 2.121a.5.5 0 0 1-.708 0L5.525 7.475a.5.5 0 0 1 .708-.707l1.768 1.767z"
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
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={`${label} (${shortcut})`}
      className={`p-2 rounded-md transition-colors ${
        active
          ? 'bg-blue-500/20 text-blue-400'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
      onClick={onClick}
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
  onSelect,
}: {
  subTools: SubTool[];
  selectedTool: ToolType;
  activeTool: ToolType;
  onSelect: (tool: ToolType) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Currently visible tool in the group
  const current = subTools.find((t) => t.tool === selectedTool) ?? subTools[0];
  const isGroupActive = subTools.some((t) => t.tool === activeTool);

  // Close on outside click
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
      {/* Main tool button */}
      <button
        type="button"
        aria-label={current.label}
        aria-pressed={isGroupActive}
        title={`${current.label} (${current.shortcut})`}
        className={`p-2 rounded-l-md transition-colors ${
          isGroupActive
            ? 'bg-blue-500/20 text-blue-400'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
        onClick={() => onSelect(current.tool)}
      >
        {current.icon}
      </button>

      {/* Chevron dropdown trigger */}
      <button
        type="button"
        aria-label={`${current.label} tools`}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`pr-1 pl-0 py-2 rounded-r-md transition-colors ${
          isGroupActive
            ? 'text-blue-400'
            : 'text-gray-500 hover:text-gray-300'
        }`}
        onClick={() => setOpen(!open)}
      >
        <ChevronDownIcon />
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-[#2a2a3e] rounded-lg shadow-xl border border-[#3a3a4e] py-1 z-50 min-w-[160px]">
          {subTools.map((sub) => (
            <button
              key={sub.tool}
              type="button"
              className={`flex items-center gap-2.5 w-full px-3 py-2 text-xs transition-colors ${
                activeTool === sub.tool
                  ? 'bg-blue-500/15 text-blue-400'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
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

/* ═══════════════════════════════════════════
   Toolbelt — the full tool row
   ═══════════════════════════════════════════ */

export default function Toolbelt() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const selectedElementIds = useEditorStore((s) => s.selectedElementIds);
  const groupElements = useEditorStore((s) => s.groupElements);
  const ungroupElements = useEditorStore((s) => s.ungroupElements);
  const getElement = useEditorStore((s) => s.getElement);

  // Track which sub-tool was last selected in each group
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

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Ctrl+G / Cmd+G = group, Ctrl+Shift+G / Cmd+Shift+G = ungroup
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        if (e.shiftKey) {
          // Ungroup: if a single frame is selected, ungroup it
          const ids = useEditorStore.getState().selectedElementIds;
          if (ids.length === 1) {
            const el = getElement(ids[0]);
            if (el && el.type === 'frame') {
              ungroupElements(ids[0]);
            }
          }
        } else {
          // Group selected elements
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
          selectShapeTool('line');
          break;
        case 't':
          setActiveTool('text');
          break;
        case 'i':
          setActiveTool('image');
          break;
        case 'f':
          setActiveTool('frame');
          break;
        case 's':
          setActiveTool('section');
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectMoveTool, selectShapeTool, setActiveTool, groupElements, ungroupElements, getElement]);

  const moveSubTools: SubTool[] = [
    { tool: 'move', icon: <MoveIcon />, label: '이동', shortcut: 'V' },
    { tool: 'hand', icon: <HandIcon />, label: '손', shortcut: 'H' },
  ];

  const shapeSubTools: SubTool[] = [
    { tool: 'rectangle', icon: <RectangleIcon />, label: '사각형', shortcut: 'R' },
    { tool: 'circle', icon: <CircleIcon />, label: '원형', shortcut: 'O' },
    { tool: 'line', icon: <LineIcon />, label: '선', shortcut: 'L' },
  ];

  return (
    <div className="flex items-center gap-0.5">
      {/* Move / Hand group */}
      <ToolGroup
        subTools={moveSubTools}
        selectedTool={moveGroupTool}
        activeTool={activeTool}
        onSelect={selectMoveTool}
      />

      <div className="w-px h-5 bg-[#3a3a4e] mx-0.5" />

      {/* Shape group (Rectangle / Circle / Line) */}
      <ToolGroup
        subTools={shapeSubTools}
        selectedTool={shapeGroupTool}
        activeTool={activeTool}
        onSelect={selectShapeTool}
      />

      <div className="w-px h-5 bg-[#3a3a4e] mx-0.5" />

      {/* Text */}
      <ToolButton
        icon={<TextIcon />}
        label="텍스트"
        shortcut="T"
        active={activeTool === 'text'}
        onClick={() => setActiveTool('text')}
      />

      {/* Image */}
      <ToolButton
        icon={<ImageIcon />}
        label="이미지"
        shortcut="I"
        active={activeTool === 'image'}
        onClick={() => setActiveTool('image')}
      />

      <div className="w-px h-5 bg-[#3a3a4e] mx-0.5" />

      {/* Frame */}
      <ToolButton
        icon={<FrameToolIcon />}
        label="프레임"
        shortcut="F"
        active={activeTool === 'frame'}
        onClick={() => setActiveTool('frame')}
      />

      {/* Section */}
      <ToolButton
        icon={<SectionIcon />}
        label="섹션"
        shortcut="S"
        active={activeTool === 'section'}
        onClick={() => setActiveTool('section')}
      />
    </div>
  );
}
