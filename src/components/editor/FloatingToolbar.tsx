'use client';

import { useState } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useHistoryStore } from '@/stores/historyStore';
import type { EditorMode } from '@/types/editor';
import Toolbelt from '@/components/editor/Toolbelt';
import {
  HiArrowUturnLeft,
  HiArrowUturnRight,
  HiMagnifyingGlassPlus,
  HiMagnifyingGlassMinus,
  HiArrowDownTray,
  HiSquares2X2,
} from 'react-icons/hi2';

/* ── Mode icons (inline SVG, 16x16) ── */

function DrawIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M11.5 2.5a1.5 1.5 0 0 1 2.12 2.12l-7.78 7.78-2.83.71.71-2.83 7.78-7.78z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DesignIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="9" y="2" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="2" y="9" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="9" y="9" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function DevIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M5.5 4.5 2.5 8l3 3.5M10.5 4.5l3 3.5-3 3.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Divider ── */

function Divider() {
  return <div className="w-px h-6 bg-gray-200 shrink-0" />;
}

/* ── Mode Segmented Control ── */

const MODES: { key: EditorMode; label: string; icon: React.ReactNode }[] = [
  { key: 'draw', label: 'Draw', icon: <DrawIcon /> },
  { key: 'design', label: 'Design', icon: <DesignIcon /> },
  { key: 'dev', label: 'Dev', icon: <DevIcon /> },
];

function ModeToggle() {
  const mode = useEditorStore((s) => s.mode);
  const setMode = useEditorStore((s) => s.setMode);

  return (
    <div className="flex items-center gap-0.5 bg-gray-100 rounded-xl p-1">
      {MODES.map((m) => (
        <button
          key={m.key}
          type="button"
          onClick={() => setMode(m.key)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            mode === m.key
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {m.icon}
          {m.label}
        </button>
      ))}
    </div>
  );
}

/* ── Floating Toolbar ── */

interface FloatingToolbarProps {
  onExport: () => void;
}

export default function FloatingToolbar({ onExport }: FloatingToolbarProps) {
  const project = useEditorStore((s) => s.project);
  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);
  const showGrid = useEditorStore((s) => s.showGrid);
  const toggleGrid = useEditorStore((s) => s.toggleGrid);
  const currentPageIndex = useEditorStore((s) => s.currentPageIndex);
  const loadProject = useEditorStore((s) => s.loadProject);

  const canUndo = useHistoryStore((s) => s.canUndo);
  const canRedo = useHistoryStore((s) => s.canRedo);
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);

  const handleUndo = () => {
    const page = undo();
    if (page && project) {
      const updatedProject = {
        ...project,
        pages: project.pages.map((p, i) => (i === currentPageIndex ? page : p)),
      };
      loadProject(updatedProject);
    }
  };

  const handleRedo = () => {
    const page = redo();
    if (page && project) {
      const updatedProject = {
        ...project,
        pages: project.pages.map((p, i) => (i === currentPageIndex ? page : p)),
      };
      loadProject(updatedProject);
    }
  };

  if (!project) return null;

  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 transform-gpu"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 bg-white rounded-2xl shadow-lg ring-1 ring-black/5 px-3 py-2">
        {/* Mode Toggle */}
        <ModeToggle />

        <Divider />

        {/* Toolbelt */}
        <Toolbelt />

        <Divider />

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={handleUndo}
            disabled={!canUndo()}
            title="Undo (Ctrl+Z)"
          >
            <HiArrowUturnLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={handleRedo}
            disabled={!canRedo()}
            title="Redo (Ctrl+Shift+Z)"
          >
            <HiArrowUturnRight className="w-4 h-4" />
          </button>
        </div>

        <Divider />

        {/* Zoom Controls */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
            onClick={() => setZoom(zoom - 0.1)}
            title="Zoom Out"
          >
            <HiMagnifyingGlassMinus className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-600 w-10 text-center font-mono tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
            onClick={() => setZoom(zoom + 0.1)}
            title="Zoom In"
          >
            <HiMagnifyingGlassPlus className="w-4 h-4" />
          </button>
        </div>

        <Divider />

        {/* Quick Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={`p-1.5 rounded-lg transition-colors ${
              showGrid
                ? 'bg-blue-500/20 text-blue-500'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900'
            }`}
            onClick={toggleGrid}
            title="Toggle Grid"
          >
            <HiSquares2X2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            onClick={onExport}
          >
            <HiArrowDownTray className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
