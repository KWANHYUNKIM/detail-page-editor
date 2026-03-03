'use client';

import { useState } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useHistoryStore } from '@/stores/historyStore';
import Toolbelt from '@/components/editor/Toolbelt';
import type { SaveStatus } from '@/hooks/useAutoSave';
import {
  HiArrowUturnLeft,
  HiArrowUturnRight,
  HiMagnifyingGlassPlus,
  HiMagnifyingGlassMinus,
  HiArrowDownTray,
  HiPencilSquare,
  HiEye,
  HiCheck,
  HiCloud,
  HiXMark,
  HiViewfinderCircle,
  HiSquares2X2,
} from 'react-icons/hi2';

interface ToolbarProps {
  onExport: () => void;
  saveStatus: SaveStatus;
}

export default function Toolbar({ onExport, saveStatus }: ToolbarProps) {
  const project = useEditorStore((s) => s.project);
  const zoom = useEditorStore((s) => s.zoom);
  const mode = useEditorStore((s) => s.mode);
  const setZoom = useEditorStore((s) => s.setZoom);
  const setMode = useEditorStore((s) => s.setMode);
  const loadProject = useEditorStore((s) => s.loadProject);
  const currentPageIndex = useEditorStore((s) => s.currentPageIndex);
  const canUndo = useHistoryStore((s) => s.canUndo);
  const focusedSectionId = useEditorStore((s) => s.focusedSectionId);
  const setFocusedSectionId = useEditorStore((s) => s.setFocusedSectionId);
  const showGrid = useEditorStore((s) => s.showGrid);
  const toggleGrid = useEditorStore((s) => s.toggleGrid);
  const getCurrentPage = useEditorStore((s) => s.getCurrentPage);
  const canRedo = useHistoryStore((s) => s.canRedo);
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(project?.name ?? '');

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

  // handleSave removed — auto-save handles persistence

  const handleNameSave = () => {
    setEditingName(false);
    if (project && nameValue.trim()) {
      loadProject({ ...project, name: nameValue.trim() });
    }
  };

  if (!project) return null;

  return (
    <div className="h-12 bg-[#1e1e2e] border-b border-[#2a2a3e] flex items-center px-4 gap-2 shrink-0">
      <div className="flex items-center gap-2 mr-4">
        {editingName ? (
          <input
            type="text"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNameSave();
            }}
            className="bg-[#2a2a3e] text-white text-sm px-2 py-1 rounded border border-blue-500 outline-none w-48"
            autoFocus
          />
        ) : (
          <button
            className="text-white text-sm font-medium hover:text-blue-400 transition-colors truncate max-w-[200px]"
            onClick={() => {
              setNameValue(project.name);
              setEditingName(true);
            }}
          >
            {project.name}
          </button>
        )}
      </div>

      <div className="h-5 w-px bg-[#3a3a4e]" />

      {/* ━━━ Figma-style Toolbelt ━━━ */}
      <Toolbelt />

      <div className="h-5 w-px bg-[#3a3a4e]" />
      <div className="flex items-center gap-1">
        <button
          className="p-1.5 rounded hover:bg-[#2a2a3e] text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          onClick={handleUndo}
          disabled={!canUndo()}
          title="실행 취소"
        >
          <HiArrowUturnLeft className="w-4 h-4" />
        </button>
        <button
          className="p-1.5 rounded hover:bg-[#2a2a3e] text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          onClick={handleRedo}
          disabled={!canRedo()}
          title="다시 실행"
        >
          <HiArrowUturnRight className="w-4 h-4" />
        </button>
      </div>

      <div className="h-5 w-px bg-[#3a3a4e]" />

      <div className="flex items-center gap-1">
        <button
          className="p-1.5 rounded hover:bg-[#2a2a3e] text-gray-400 hover:text-white transition-colors"
          onClick={() => setZoom(zoom - 0.1)}
          title="축소"
        >
          <HiMagnifyingGlassMinus className="w-4 h-4" />
        </button>
        <span className="text-xs text-gray-300 w-12 text-center font-mono">
          {Math.round(zoom * 100)}%
        </span>
        <button
          className="p-1.5 rounded hover:bg-[#2a2a3e] text-gray-400 hover:text-white transition-colors"
          onClick={() => setZoom(zoom + 0.1)}
          title="확대"
        >
          <HiMagnifyingGlassPlus className="w-4 h-4" />
        </button>
      </div>

      {/* Grid toggle */}
      <button
        className={`p-1.5 rounded transition-colors ${showGrid ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:bg-[#2a2a3e] hover:text-white'}`}
        onClick={toggleGrid}
        title="그리드 표시"
      >
        <HiSquares2X2 className="w-4 h-4" />
      </button>

      {/* Focused section indicator */}
      {focusedSectionId && (() => {
        const page = getCurrentPage();
        const sections = page?.elements
          .filter((el) => el.type === 'frame' && (el as import('@/types/editor').FrameElement).isSection)
          .sort((a, b) => a.y - b.y) ?? [];
        const idx = sections.findIndex((s) => s.id === focusedSectionId);
        return (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/15 rounded-md">
            <HiViewfinderCircle className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs text-blue-300 font-medium">섹션 {idx + 1}</span>
            <button
              className="p-0.5 text-blue-400 hover:text-blue-200 transition-colors"
              onClick={() => setFocusedSectionId(null)}
              title="전체 보기"
            >
              <HiXMark className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })()}

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <button
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === 'creator'
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-green-500/20 text-green-400'
          }`}
          onClick={() => setMode(mode === 'creator' ? 'consumer' : 'creator')}
        >
          {mode === 'creator' ? (
            <>
              <HiPencilSquare className="w-3.5 h-3.5" />
              크리에이터
            </>
          ) : (
            <>
              <HiEye className="w-3.5 h-3.5" />
              소비자
            </>
          )}
        </button>
      </div>

      <div className="h-5 w-px bg-[#3a3a4e]" />

      {/* Auto-save status indicator */}
      <div className="flex items-center gap-1.5 px-2 py-1 text-xs">
        {saveStatus === 'saving' && (
          <>
            <HiCloud className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
            <span className="text-yellow-400">저장 중...</span>
          </>
        )}
        {saveStatus === 'saved' && (
          <>
            <HiCheck className="w-3.5 h-3.5 text-green-400" />
            <span className="text-green-400">저장됨</span>
          </>
        )}
        {saveStatus === 'idle' && (
          <>
            <HiCloud className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-gray-500">자동 저장</span>
          </>
        )}
      </div>

      <button
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        onClick={onExport}
      >
        <HiArrowDownTray className="w-4 h-4" />
        내보내기
      </button>
    </div>
  );
}
