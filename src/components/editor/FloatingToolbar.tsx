'use client';

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

/* ── Mode icons (Figma original SVGs, 20x20) ── */

function DrawIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M13.407 5.06c.61-.123 1.227-.079 1.657.343l.135.15c.277.361.316.79.208 1.204-.115.44-.397.887-.734 1.314-.68.86-1.74 1.829-2.748 2.76-1.031.952-2.01 1.867-2.606 2.662-.3.4-.466.724-.517.97-.044.21-.003.34.12.46l.065.052c.072.044.167.062.313.039.217-.034.505-.155.866-.378.72-.445 1.561-1.183 2.445-1.966.862-.763 1.768-1.571 2.57-2.076.4-.252.817-.457 1.221-.527.427-.074.87.002 1.223.346l.102.112c.22.271.296.593.266.918-.032.344-.183.684-.364.993-.363.617-.963 1.296-1.515 1.922-.574.651-1.1 1.251-1.403 1.767-.151.257-.218.449-.23.581-.01.106.012.163.072.22l.054.04c.074.038.214.062.474-.031.356-.128.853-.456 1.465-1.1a.5.5 0 0 1 .725.687c-.666.702-1.291 1.153-1.853 1.354-.535.192-1.08.173-1.485-.163l-.08-.071a1.23 1.23 0 0 1-.369-1.03c.033-.344.183-.684.364-.993.363-.617.964-1.297 1.516-1.923.574-.651 1.1-1.25 1.402-1.766.152-.258.22-.449.232-.581.007-.08-.004-.132-.035-.177l-.038-.045c-.07-.068-.162-.108-.353-.075-.213.037-.5.161-.858.388-.717.451-1.555 1.194-2.44 1.978-.862.764-1.774 1.57-2.584 2.07-.404.249-.826.45-1.237.514-.38.06-.767 0-1.095-.247l-.136-.118c-.402-.394-.502-.887-.399-1.38.097-.46.367-.923.696-1.363.663-.885 1.718-1.865 2.728-2.798 1.033-.954 2.023-1.862 2.642-2.645.31-.393.489-.71.55-.946.04-.152.028-.246-.017-.32l-.057-.069c-.082-.08-.284-.172-.76-.076-.468.094-1.091.352-1.863.803-1.537.898-3.552 2.496-5.893 4.786a.5.5 0 0 1-.699-.715c2.37-2.319 4.45-3.98 6.087-4.935.815-.476 1.55-.794 2.17-.92"
        clipRule="evenodd"
      />
    </svg>
  );
}

function DesignIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M12.11 13.956c-.44-1.121.618-2.23 1.738-1.885l.108.038 4.15 1.63.115.051c1.136.556 1.027 2.254-.218 2.637l-1.205.372-.37 1.205c-.397 1.29-2.196 1.356-2.689.102zm1.48-.916a.425.425 0 0 0-.55.55l1.63 4.15c.138.35.618.356.775.038l.027-.068.526-1.711 1.711-.527a.425.425 0 0 0 .031-.802zM16.5 6A1.5 1.5 0 0 1 18 7.5v1a1.5 1.5 0 0 1-1.5 1.5H10v6.5A1.5 1.5 0 0 1 8.5 18h-1A1.5 1.5 0 0 1 6 16.5v-9A1.5 1.5 0 0 1 7.5 6zM7 16.5a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5V15h-.5a.5.5 0 0 1 0-1H9v-1h-.5a.5.5 0 0 1 0-1H9v-2H7zM7.5 7a.5.5 0 0 0-.5.5V9h2V7zM10 9h2v-.5a.5.5 0 0 1 1 0V9h1v-.5a.5.5 0 0 1 1 0V9h1.5a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5H10z"
      />
    </svg>
  );
}

function DevIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M13.631 6.018a.5.5 0 0 1 .367.513l-.016.1-3 11-.036.095a.5.5 0 0 1-.93-.358l3-11 .037-.095a.5.5 0 0 1 .578-.255M8.224 8.582a.501.501 0 0 1 .693.693l-.064.079L6.206 12l2.647 2.646a.5.5 0 1 1-.707.707l-3-3a.5.5 0 0 1 0-.707l3-3zm6.922.064a.5.5 0 0 1 .707 0l3 3a.5.5 0 0 1 0 .707l-3 3-.078.065a.5.5 0 0 1-.694-.693l.065-.079L17.792 12l-2.646-2.646a.5.5 0 0 1 0-.707"
      />
    </svg>
  );
}

/* ── Divider ── */

function Divider() {
  return <div className="w-px h-6 bg-gray-200 shrink-0" />;
}

const MODES: { key: EditorMode; label: string; icon: React.ReactNode }[] = [
  { key: 'draw', label: 'Draw', icon: <DrawIcon /> },
  { key: 'design', label: 'Design', icon: <DesignIcon /> },
  { key: 'dev', label: 'Dev Mode', icon: <DevIcon /> },
];

function ModeSegmentedControl() {
  const mode = useEditorStore((s) => s.mode);
  const setMode = useEditorStore((s) => s.setMode);
  const activeIndex = MODES.findIndex((m) => m.key === mode);

  return (
    <div className="relative flex items-center bg-[#2c2c2c] rounded-lg p-0.5">
      <div
        className="absolute h-[calc(100%-4px)] rounded-md bg-[#0d99ff] transition-transform duration-200 ease-out"
        style={{
          width: `calc(100% / ${MODES.length} - 2px)`,
          transform: `translateX(calc(${activeIndex} * (100% + 2px) + 1px))`,
        }}
      />
      {MODES.map((m) => (
        <button
          key={m.key}
          type="button"
          onClick={() => setMode(m.key)}
          className={`relative z-10 flex items-center justify-center w-[30px] h-[30px] rounded-md transition-colors ${
            mode === m.key ? 'text-white' : 'text-[#ababab] hover:text-white'
          }`}
          title={m.label}
        >
          {m.icon}
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
        <Toolbelt />

        <Divider />

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

        <Divider />

        <ModeSegmentedControl />
      </div>
    </div>
  );
}
