'use client';

import { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import type { CanvasElement, FrameElement, Layer } from '@/types/editor';
import {
  HiEye,
  HiEyeSlash,
  HiLockClosed,
  HiLockOpen,
  HiChevronRight,
  HiChevronDown,
  HiPlus,
  HiTrash,
  HiArrowUp,
  HiArrowDown,
} from 'react-icons/hi2';

/* ── Type Icons (16x16, Figma style) ── */

function FrameIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.5 3a.5.5 0 0 1 .5.5V5h4V3.5a.5.5 0 0 1 1 0V5h1.5a.5.5 0 0 1 0 1H11v4h1.5a.5.5 0 0 1 0 1H11v1.5a.5.5 0 0 1-1 0V11H6v1.5a.5.5 0 0 1-1 0V11H3.5a.5.5 0 0 1 0-1H5V6H3.5a.5.5 0 0 1 0-1H5V3.5a.5.5 0 0 1 .5-.5ZM10 10V6H6v4h4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ImageIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 12.5v-9Zm1.5-.5a.5.5 0 0 0-.5.5v6.06l2.22-2.22a.75.75 0 0 1 1.06 0L9 10.06l1.72-1.72a.75.75 0 0 1 1.06 0L13 9.56V3.5a.5.5 0 0 0-.5-.5h-9ZM13 11.44l-1.72-1.72L9.56 11.44l.72.72a.75.75 0 0 1 0 1.06l-.22.22.22.06h2.22a.5.5 0 0 0 .5-.5v-1.56ZM3 12.5a.5.5 0 0 0 .5.5h5.13L6.28 10.65 3 13.94v-1.44Zm3-6a1 1 0 1 1 2 0 1 1 0 0 1-2 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

function TextIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 3.5A.5.5 0 0 1 3.5 3h9a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0V4H8.5v8H10a.5.5 0 0 1 0 1H6a.5.5 0 0 1 0-1h1.5V4H4v1.5a.5.5 0 0 1-1 0v-2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function RectIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2.5" y="2.5" width="11" height="11" rx="1" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function CircleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function LineIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="2.5" y1="13.5" x2="13.5" y2="2.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function getTypeIcon(type: string, shape?: string) {
  const cls = 'w-4 h-4';
  switch (type) {
    case 'image':
      return <ImageIcon className={cls} />;
    case 'text':
      return <TextIcon className={cls} />;
    case 'frame':
      return <FrameIcon className={cls} />;
    case 'shape':
      switch (shape) {
        case 'circle':
          return <CircleIcon className={cls} />;
        case 'line':
        case 'arrow':
          return <LineIcon className={cls} />;
        default:
          return <RectIcon className={cls} />;
      }
    default:
      return <FrameIcon className={cls} />;
  }
}

/* ── Label helpers ── */

function elementLabel(el: {
  type: string;
  id: string;
  originalName?: string;
  content?: string;
  shape?: string;
}): string {
  switch (el.type) {
    case 'image':
      return (el as { originalName?: string }).originalName || '이미지';
    case 'text': {
      const content = (el as { content?: string }).content || '';
      return content.length > 20 ? content.slice(0, 20) + '…' : content || '텍스트';
    }
    case 'shape':
      return `도형 (${(el as { shape?: string }).shape || 'rect'})`;
    case 'frame':
      return 'Frame';
    default:
      return el.id.slice(0, 6);
  }
}

/* ── Container check ── */

function isContainerType(type: string): boolean {
  return type === 'frame';
}

/* ── Layer Row ── */

interface LayerRowProps {
  el: CanvasElement;
  depth: number;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
  onToggleVisible: () => void;
  onToggleLock: () => void;
  showEditToggle: boolean;
  onToggleEditable?: () => void;
  dimmed?: boolean;
}

function LayerRow({
  el,
  depth,
  isSelected,
  isExpanded,
  onToggleExpand,
  onSelect,
  onToggleVisible,
  onToggleLock,
  showEditToggle,
  onToggleEditable,
  dimmed,
}: LayerRowProps) {
  const label = elementLabel(el);
  const isContainer = isContainerType(el.type);
  const shape = el.type === 'shape' ? (el as { shape?: string }).shape : undefined;

  return (
    <div
      className={`group relative flex items-center h-7 cursor-pointer select-none transition-colors ${
        isSelected
          ? 'bg-[#0d99ff]/20 text-white'
          : 'hover:bg-white/5 text-[#e8e8e8]'
      } ${dimmed ? 'opacity-40' : ''}`}
      onClick={onSelect}
    >
      {/* Indent spacer */}
      <span className="shrink-0" style={{ width: 12 + depth * 12 }} />

      {/* Expand caret OR spacer */}
      {isContainer ? (
        <button
          className="flex items-center justify-center w-4 h-4 ml-1 shrink-0 text-[#b3b3b3] hover:text-white transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
        >
          {isExpanded ? (
            <HiChevronDown className="w-3 h-3" />
          ) : (
            <HiChevronRight className="w-3 h-3" />
          )}
        </button>
      ) : (
        <span className="w-4 ml-1 shrink-0" />
      )}

      {/* Type icon */}
      <span className="flex items-center justify-center w-4 h-4 shrink-0 ml-0.5 text-[#b3b3b3]">
        {getTypeIcon(el.type, shape)}
      </span>

      {/* Layer name */}
      <span
        className="flex-1 truncate ml-1.5 text-[11px] font-medium leading-none"
        title={label}
      >
        {label}
      </span>

      {/* Creator mode editable badge */}
      {showEditToggle && (
        <button
          className={`shrink-0 mr-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
            el.editable
              ? 'bg-green-500/20 text-green-400'
              : 'bg-[#2a2a3e] text-[#6e6e6e]'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleEditable?.();
          }}
        >
          편집
        </button>
      )}

      {/* Row actions — hover only (Lock + Visibility) */}
      <div className="flex items-center gap-0.5 pr-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="flex items-center justify-center w-5 h-5 rounded hover:bg-white/10 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock();
          }}
        >
          {el.locked ? (
            <HiLockClosed className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <HiLockOpen className="w-3.5 h-3.5 text-[#b3b3b3]" />
          )}
        </button>

        <button
          className="flex items-center justify-center w-5 h-5 rounded hover:bg-white/10 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisible();
          }}
        >
          {el.visible ? (
            <HiEye className="w-3.5 h-3.5 text-[#b3b3b3]" />
          ) : (
            <HiEyeSlash className="w-3.5 h-3.5 text-[#6e6e6e]" />
          )}
        </button>
      </div>

      {/* Persistent lock indicator */}
      {el.locked && (
        <span className="absolute right-2 flex items-center justify-center w-5 h-5 group-hover:hidden">
          <HiLockClosed className="w-3.5 h-3.5 text-amber-400" />
        </span>
      )}

      {/* Persistent hidden indicator */}
      {!el.visible && !el.locked && (
        <span className="absolute right-2 flex items-center justify-center w-5 h-5 group-hover:hidden">
          <HiEyeSlash className="w-3.5 h-3.5 text-[#6e6e6e]" />
        </span>
      )}
    </div>
  );
}

/* ── Recursive Layer Tree (elements within a layer) ── */

function ElementTree({
  elementIds,
  allElements,
  depth,
  selectedElementIds,
  expandedLayers,
  mode,
  layerVisible,
  selectElements,
  updateElement,
  toggleElementEditable,
  toggleLayerExpand,
}: {
  elementIds: string[];
  allElements: CanvasElement[];
  depth: number;
  selectedElementIds: string[];
  expandedLayers: Set<string>;
  mode: string;
  layerVisible: boolean;
  selectElements: (ids: string[]) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  toggleElementEditable: (id: string) => void;
  toggleLayerExpand: (id: string) => void;
}) {
  const reversed = [...elementIds].reverse();

  return (
    <>
      {reversed.map((id) => {
        const el = allElements.find((e) => e.id === id);
        if (!el) return null;

        const isSelected = selectedElementIds.includes(el.id);
        const isExpanded = expandedLayers.has(el.id);
        const isFrame = el.type === 'frame';

        return (
          <div key={el.id}>
            <LayerRow
              el={el}
              depth={depth}
              isSelected={isSelected}
              isExpanded={isExpanded}
              onToggleExpand={() => toggleLayerExpand(el.id)}
              onSelect={() => selectElements([el.id])}
              onToggleVisible={() => updateElement(el.id, { visible: !el.visible })}
              onToggleLock={() => updateElement(el.id, { locked: !el.locked })}
              showEditToggle={mode === 'creator'}
              onToggleEditable={() => toggleElementEditable(el.id)}
              dimmed={!layerVisible}
            />

            {/* Children of expanded frame */}
            {isFrame && isExpanded && (
              <ElementTree
                elementIds={(el as FrameElement).childOrder}
                allElements={allElements}
                depth={depth + 1}
                selectedElementIds={selectedElementIds}
                expandedLayers={expandedLayers}
                mode={mode}
                layerVisible={layerVisible}
                selectElements={selectElements}
                updateElement={updateElement}
                toggleElementEditable={toggleElementEditable}
                toggleLayerExpand={toggleLayerExpand}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

/* ── Layer Group Header ── */

interface LayerGroupHeaderProps {
  layer: Layer;
  isActive: boolean;
  isExpanded: boolean;
  isEditing: boolean;
  editValue: string;
  layerCount: number;
  onSelect: () => void;
  onToggleExpand: () => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onStartRename: () => void;
  onEditChange: (value: string) => void;
  onEditCommit: () => void;
  onEditCancel: () => void;
}

function LayerGroupHeader({
  layer,
  isActive,
  isExpanded,
  isEditing,
  editValue,
  layerCount,
  onSelect,
  onToggleExpand,
  onToggleVisibility,
  onToggleLock,
  onMoveUp,
  onMoveDown,
  onDelete,
  onStartRename,
  onEditChange,
  onEditCommit,
  onEditCancel,
}: LayerGroupHeaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <div
      className={`group flex items-center h-8 cursor-pointer select-none transition-colors border-b border-[#2a2a3e] ${
        isActive
          ? 'bg-[#2a2a4e] text-white'
          : 'bg-[#1a1a2e] hover:bg-[#222238] text-[#c8c8c8]'
      }`}
      onClick={onSelect}
    >
      {/* Expand caret */}
      <button
        className="flex items-center justify-center w-5 h-5 ml-1 shrink-0 text-[#b3b3b3] hover:text-white transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          onToggleExpand();
        }}
      >
        {isExpanded ? (
          <HiChevronDown className="w-3 h-3" />
        ) : (
          <HiChevronRight className="w-3 h-3" />
        )}
      </button>

      {/* Layer name (or edit input) */}
      {isEditing ? (
        <input
          ref={inputRef}
          className="flex-1 bg-[#1a1a2e] text-white text-[11px] px-1.5 py-0.5 rounded border border-blue-500 outline-none mx-1"
          value={editValue}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={onEditCommit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onEditCommit();
            if (e.key === 'Escape') onEditCancel();
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className="flex-1 truncate ml-1 text-[11px] font-semibold leading-none"
          onDoubleClick={(e) => {
            e.stopPropagation();
            onStartRename();
          }}
          title={layer.name}
        >
          {layer.name}
        </span>
      )}

      {/* Element count */}
      <span className="text-[9px] text-[#6e6e6e] mr-1 tabular-nums">
        {layer.elementIds.length}
      </span>

      {/* Hover actions */}
      <div className="flex items-center gap-0.5 pr-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="flex items-center justify-center w-4 h-4 rounded hover:bg-white/10 transition-colors"
          onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
          title="레이어 위로"
        >
          <HiArrowUp className="w-2.5 h-2.5 text-[#b3b3b3]" />
        </button>
        <button
          className="flex items-center justify-center w-4 h-4 rounded hover:bg-white/10 transition-colors"
          onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
          title="레이어 아래로"
        >
          <HiArrowDown className="w-2.5 h-2.5 text-[#b3b3b3]" />
        </button>
        <button
          className="flex items-center justify-center w-4 h-4 rounded hover:bg-white/10 transition-colors"
          onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
          title={layer.locked ? '잠금 해제' : '잠금'}
        >
          {layer.locked ? (
            <HiLockClosed className="w-3 h-3 text-amber-400" />
          ) : (
            <HiLockOpen className="w-3 h-3 text-[#b3b3b3]" />
          )}
        </button>
        <button
          className="flex items-center justify-center w-4 h-4 rounded hover:bg-white/10 transition-colors"
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
          title={layer.visible ? '숨기기' : '보이기'}
        >
          {layer.visible ? (
            <HiEye className="w-3 h-3 text-[#b3b3b3]" />
          ) : (
            <HiEyeSlash className="w-3 h-3 text-[#6e6e6e]" />
          )}
        </button>
        {layerCount > 1 && (
          <button
            className="flex items-center justify-center w-4 h-4 rounded hover:bg-white/10 transition-colors"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="레이어 삭제"
          >
            <HiTrash className="w-3 h-3 text-[#b3b3b3] hover:text-red-400" />
          </button>
        )}
      </div>

      {/* Persistent indicators when not hovering */}
      {layer.locked && (
        <span className="absolute right-2 flex items-center justify-center w-5 h-5 group-hover:hidden">
          <HiLockClosed className="w-3 h-3 text-amber-400" />
        </span>
      )}
      {!layer.visible && !layer.locked && (
        <span className="absolute right-2 flex items-center justify-center w-5 h-5 group-hover:hidden">
          <HiEyeSlash className="w-3 h-3 text-[#6e6e6e]" />
        </span>
      )}
    </div>
  );
}

/* ── LayerPanel ── */

export default function LayerPanel() {
  const project = useEditorStore((s) => s.project);
  const mode = useEditorStore((s) => s.mode);
  const activeLayerId = useEditorStore((s) => s.activeLayerId);
  const selectedElementIds = useEditorStore((s) => s.selectedElementIds);
  const selectElements = useEditorStore((s) => s.selectElements);
  const updateElement = useEditorStore((s) => s.updateElement);
  const toggleElementEditable = useEditorStore((s) => s.toggleElementEditable);
  const getCurrentPage = useEditorStore((s) => s.getCurrentPage);
  const setActiveLayerId = useEditorStore((s) => s.setActiveLayerId);
  const addLayer = useEditorStore((s) => s.addLayer);
  const removeLayer = useEditorStore((s) => s.removeLayer);
  const renameLayer = useEditorStore((s) => s.renameLayer);
  const toggleLayerVisibility = useEditorStore((s) => s.toggleLayerVisibility);
  const toggleLayerLock = useEditorStore((s) => s.toggleLayerLock);
  const moveLayerGroupUp = useEditorStore((s) => s.moveLayerGroupUp);
  const moveLayerGroupDown = useEditorStore((s) => s.moveLayerGroupDown);

  const [collapsed, setCollapsed] = useState(false);
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());
  const [expandedLayerGroups, setExpandedLayerGroups] = useState<Set<string>>(new Set(['__all__']));
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const page = getCurrentPage();
  if (!page || !project) {
    return (
      <div className="flex items-center justify-center h-20 text-[11px] text-[#6e6e6e]">
        레이어가 없습니다
      </div>
    );
  }

  const toggleLayerExpand = (id: string) => {
    setExpandedLayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleLayerGroupExpand = (layerId: string) => {
    setExpandedLayerGroups((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) next.delete(layerId);
      else next.add(layerId);
      return next;
    });
  };

  const handleStartRename = (layer: Layer) => {
    setEditingLayerId(layer.id);
    setEditValue(layer.name);
  };

  const handleCommitRename = () => {
    if (editingLayerId && editValue.trim()) {
      renameLayer(editingLayerId, editValue.trim());
    }
    setEditingLayerId(null);
  };

  // Layers displayed top to bottom (reversed from data model which is bottom→top)
  const reversedLayers = [...page.layers].reverse();

  // Initialize expanded state for new layers
  const allLayerIds = page.layers.map((l) => l.id);
  const needsInit = allLayerIds.some((id) => !expandedLayerGroups.has(id) && !expandedLayerGroups.has('__all__'));
  if (expandedLayerGroups.has('__all__') && !needsInit) {
    // First render — expand all layers
    const initialExpanded = new Set(allLayerIds);
    if (expandedLayerGroups.size === 1) {
      setExpandedLayerGroups(initialExpanded);
    }
  }

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between h-8 border-b border-[#3a3a3a]">
        <button
          className="flex items-center gap-1 px-3 text-[11px] font-medium text-[#b3b3b3] hover:text-white transition-colors"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <HiChevronRight className="w-3 h-3" />
          ) : (
            <HiChevronDown className="w-3 h-3" />
          )}
          <span>Layers</span>
        </button>
        <div className="flex items-center gap-1 mr-2">
          <span className="text-[10px] text-[#6e6e6e] tabular-nums mr-1">
            {page.layers.length}
          </span>
          <button
            className="flex items-center justify-center w-5 h-5 rounded hover:bg-white/10 text-[#b3b3b3] hover:text-white transition-colors"
            onClick={() => addLayer()}
            title="새 레이어 추가"
          >
            <HiPlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Layer groups + elements */}
      {!collapsed && (
        <div className="flex flex-col">
          {reversedLayers.map((layer) => {
            const isActive = activeLayerId === layer.id;
            const isGroupExpanded = expandedLayerGroups.has(layer.id);

            return (
              <div key={layer.id} className="relative">
                <LayerGroupHeader
                  layer={layer}
                  isActive={isActive}
                  isExpanded={isGroupExpanded}
                  isEditing={editingLayerId === layer.id}
                  editValue={editValue}
                  layerCount={page.layers.length}
                  onSelect={() => setActiveLayerId(layer.id)}
                  onToggleExpand={() => toggleLayerGroupExpand(layer.id)}
                  onToggleVisibility={() => toggleLayerVisibility(layer.id)}
                  onToggleLock={() => toggleLayerLock(layer.id)}
                  onMoveUp={() => moveLayerGroupUp(layer.id)}
                  onMoveDown={() => moveLayerGroupDown(layer.id)}
                  onDelete={() => removeLayer(layer.id)}
                  onStartRename={() => handleStartRename(layer)}
                  onEditChange={setEditValue}
                  onEditCommit={handleCommitRename}
                  onEditCancel={() => setEditingLayerId(null)}
                />

                {/* Elements within this layer */}
                {isGroupExpanded && (
                  <div className={layer.locked ? 'pointer-events-none' : ''}>
                    <ElementTree
                      elementIds={layer.elementIds}
                      allElements={page.elements}
                      depth={1}
                      selectedElementIds={selectedElementIds}
                      expandedLayers={expandedLayers}
                      mode={mode}
                      layerVisible={layer.visible}
                      selectElements={selectElements}
                      updateElement={updateElement}
                      toggleElementEditable={toggleElementEditable}
                      toggleLayerExpand={toggleLayerExpand}
                    />
                    {layer.elementIds.length === 0 && (
                      <div className="flex items-center justify-center h-8 text-[10px] text-[#4e4e4e] italic">
                        비어있음
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {page.layers.length === 0 && (
            <div className="flex items-center justify-center h-20 text-[11px] text-[#6e6e6e]">
              레이어를 추가해주세요
            </div>
          )}
        </div>
      )}
    </div>
  );
}
