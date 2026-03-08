'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import type { CanvasElement, FrameElement } from '@/types/editor';
import ContextMenu from '@/components/editor/ContextMenu';
import {
  HiEye,
  HiEyeSlash,
  HiLockClosed,
  HiLockOpen,
  HiChevronRight,
  HiChevronDown,
  HiMagnifyingGlass,
  HiXMark,
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

function AutoLayoutIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4 4h2v8H4zM3 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zm7 2h2v4h-2zM9 6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1z"
      />
    </svg>
  );
}

function InstanceIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.293 2.293a1 1 0 0 1 1.414 0l5 5a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414 0l-5-5a1 1 0 0 1 0-1.414zM3.707 8.707 3 8l.707-.707 3.586-3.586L8 3l.707.707 3.586 3.586L13 8l-.707.707-3.586 3.586L8 13l-.707-.707z"
      />
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
  if ((el as { name?: string }).name) return (el as { name?: string }).name!;
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

/* ── Layer Row (individual element) ── */

interface LayerRowProps {
  el: CanvasElement;
  depth: number;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelect: (e: React.MouseEvent) => void;
  onToggleVisible: () => void;
  onToggleLock: () => void;
  showEditToggle: boolean;
  onToggleEditable?: () => void;
  isEditing: boolean;
  onStartRename: () => void;
  onCommitRename: (newName: string) => void;
  onCancelRename: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
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
  isEditing,
  onStartRename,
  onCommitRename,
  onCancelRename,
  onContextMenu,
}: LayerRowProps) {
  const label = elementLabel(el);
  const isContainer = isContainerType(el.type);
  const shape = el.type === 'shape' ? (el as { shape?: string }).shape : undefined;
  const [editValue, setEditValue] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      cancelledRef.current = false;
      inputRef.current.focus();
      inputRef.current.select();
      setEditValue(label);
    }
  }, [isEditing, label]);

  return (
    <div
      className={`group relative flex items-center h-7 cursor-pointer select-none transition-colors ${
        isSelected
          ? 'bg-[#0d99ff]/20 text-white'
          : 'hover:bg-white/5 text-[#e8e8e8]'
      } ${!el.visible ? 'opacity-40' : ''}`}
      onClick={onSelect}
      onContextMenu={onContextMenu}
    >
      {/* Indent spacer */}
      <span className="shrink-0" style={{ width: 8 + depth * 12 }} />

      {/* Expand caret OR spacer */}
      {isContainer ? (
        <button
          className="flex items-center justify-center w-4 h-4 shrink-0 text-[#b3b3b3] hover:text-white transition-colors"
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
        <span className="w-4 shrink-0" />
      )}

      {/* Type icon */}
      <span className="flex items-center justify-center w-4 h-4 shrink-0 ml-0.5 text-[#b3b3b3]">
        {getTypeIcon(el.type, shape)}
      </span>

      {/* Element name */}
      {isEditing ? (
        <input
          ref={inputRef}
          className="flex-1 ml-1.5 bg-[#1a1a2e] text-white text-[11px] px-1 py-0 rounded border border-[#0d99ff] outline-none w-full"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onCommitRename(editValue);
            } else if (e.key === 'Escape') {
              cancelledRef.current = true;
              onCancelRename();
            }
          }}
          onBlur={() => {
            if (!cancelledRef.current) {
              onCommitRename(editValue);
            }
            cancelledRef.current = false;
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className="flex-1 truncate ml-1.5 text-[11px] font-medium leading-none"
          title={label}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onStartRename();
          }}
        >
          {label}
        </span>
      )}

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

/* ── Recursive Element Tree ── */

function ElementTree({
  elementIds,
  allElements,
  depth,
  selectedElementIds,
  expandedIds,
  mode,
  selectElements,
  updateElement,
  toggleElementEditable,
  toggleExpand,
  editingId,
  setEditingId,
  onContextMenu,
}: {
  elementIds: string[];
  allElements: CanvasElement[];
  depth: number;
  selectedElementIds: string[];
  expandedIds: Set<string>;
  mode: string;
  selectElements: (ids: string[]) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  toggleElementEditable: (id: string) => void;
  toggleExpand: (id: string) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  onContextMenu: (pos: { x: number; y: number; elementId: string }) => void;
}) {
  // Reverse so topmost element (last in array) renders first — like Figma
  const reversed = [...elementIds].reverse();

  return (
    <>
      {reversed.map((id) => {
        const el = allElements.find((e) => e.id === id);
        if (!el) return null;

        const isSelected = selectedElementIds.includes(el.id);
        const isExpanded = expandedIds.has(el.id);
        const isFrame = el.type === 'frame';

        return (
          <div key={el.id}>
            <LayerRow
              el={el}
              depth={depth}
              isSelected={isSelected}
              isExpanded={isExpanded}
              onToggleExpand={() => toggleExpand(el.id)}
              onSelect={(e) => {
                if (e.metaKey || e.ctrlKey) {
                  // Toggle: add/remove from selection
                  const isAlreadySelected = selectedElementIds.includes(el.id);
                  if (isAlreadySelected) {
                    selectElements(selectedElementIds.filter((sid) => sid !== el.id));
                  } else {
                    selectElements([...selectedElementIds, el.id]);
                  }
                } else if (e.shiftKey && selectedElementIds.length > 0) {
                  // Range select: from last selected to clicked
                  const flatIds = reversed;
                  const lastSelectedIdx = flatIds.findIndex((fid) => selectedElementIds.includes(fid));
                  const clickedIdx = flatIds.indexOf(el.id);
                  if (lastSelectedIdx >= 0 && clickedIdx >= 0) {
                    const start = Math.min(lastSelectedIdx, clickedIdx);
                    const end = Math.max(lastSelectedIdx, clickedIdx);
                    const rangeIds = flatIds.slice(start, end + 1);
                    const merged = new Set([...selectedElementIds, ...rangeIds]);
                    selectElements([...merged]);
                  } else {
                    selectElements([el.id]);
                  }
                } else {
                  selectElements([el.id]);
                }
              }}
              onToggleVisible={() => updateElement(el.id, { visible: !el.visible })}
              onToggleLock={() => updateElement(el.id, { locked: !el.locked })}
              showEditToggle={mode === 'creator'}
              onToggleEditable={() => toggleElementEditable(el.id)}
              isEditing={editingId === el.id}
              onStartRename={() => setEditingId(el.id)}
              onCommitRename={(newName: string) => { updateElement(el.id, { name: newName } as Partial<CanvasElement>); setEditingId(null); }}
              onCancelRename={() => setEditingId(null)}
              onContextMenu={(e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                if (!selectedElementIds.includes(el.id)) {
                  selectElements([el.id]);
                }
                onContextMenu({ x: e.clientX, y: e.clientY, elementId: el.id });
              }}
            />

            {/* Children of expanded frame */}
            {isFrame && isExpanded && (
              <ElementTree
                elementIds={(el as FrameElement).childOrder}
                allElements={allElements}
                depth={depth + 1}
                selectedElementIds={selectedElementIds}
                expandedIds={expandedIds}
                mode={mode}
                selectElements={selectElements}
                updateElement={updateElement}
                toggleElementEditable={toggleElementEditable}
                toggleExpand={toggleExpand}
                editingId={editingId}
                setEditingId={setEditingId}
                onContextMenu={onContextMenu}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

/* ── LayerPanel (Figma-style flat element tree) ── */

export default function LayerPanel() {
  const project = useEditorStore((s) => s.project);
  const mode = useEditorStore((s) => s.mode);
  const selectedElementIds = useEditorStore((s) => s.selectedElementIds);
  const selectElements = useEditorStore((s) => s.selectElements);
  const updateElement = useEditorStore((s) => s.updateElement);
  const toggleElementEditable = useEditorStore((s) => s.toggleElementEditable);
  const getCurrentPage = useEditorStore((s) => s.getCurrentPage);
  const scrollToElement = useEditorStore((s) => s.scrollToElement);

  const [collapsed, setCollapsed] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementId: string } | null>(null);

  // Select elements AND scroll canvas to the first selected element
  const selectAndScroll = useCallback((ids: string[]) => {
    selectElements(ids);
    if (ids.length > 0) scrollToElement(ids[0]);
  }, [selectElements, scrollToElement]);

  const page = getCurrentPage();

  if (!page || !project) {
    return (
      <div className="flex items-center justify-center h-20 text-[11px] text-[#6e6e6e]">
        페이지가 없습니다
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Exclude children that have a parentId — they appear inside their parent frame's subtree
  const topLevelLayerOrder = page.layerOrder.filter((id) => {
    const el = page.elements.find((e) => e.id === id);
    return el && !el.parentId;
  });
  const elementCount = topLevelLayerOrder.length;

  // Filter layers based on search query
  const filteredLayerOrder = searchQuery.trim() === '' ? topLevelLayerOrder : topLevelLayerOrder.filter((id) => {
    const el = page.elements.find((e) => e.id === id);
    if (!el) return false;
    const label = elementLabel(el);
    return label.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
        <div className="flex items-center gap-1 mr-3">
          <button
            className="flex items-center justify-center w-5 h-5 rounded hover:bg-white/10 text-[#6e6e6e] hover:text-white transition-colors"
            onClick={(e) => { e.stopPropagation(); setExpandedIds(new Set()); }}
            title="모든 레이어 접기"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M4 10l4-3 4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 13l4-3 4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span className="text-[10px] text-[#6e6e6e] tabular-nums">
            {elementCount}
          </span>
        </div>
      </div>

      {/* Search input */}
      {!collapsed && (
        <div className="px-2 py-1.5 border-b border-[#3a3a3a]">
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-[#2a2a3e] rounded text-[11px] text-white">
            <HiMagnifyingGlass className="w-3.5 h-3.5 text-[#b3b3b3] shrink-0" />
            <input
              type="text"
              placeholder="레이어 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-white placeholder-[#6e6e6e]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="flex items-center justify-center w-4 h-4 text-[#b3b3b3] hover:text-white transition-colors shrink-0"
              >
                <HiXMark className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Flat element tree — all elements in z-order */}
      {!collapsed && (
        <div className="flex flex-col py-0.5">
          {elementCount > 0 ? (
            filteredLayerOrder.length > 0 ? (
              <ElementTree
                elementIds={filteredLayerOrder}
                allElements={page.elements}
                depth={0}
                selectedElementIds={selectedElementIds}
                expandedIds={expandedIds}
                mode={mode}
                selectElements={selectAndScroll}
                updateElement={updateElement}
                toggleElementEditable={toggleElementEditable}
                toggleExpand={toggleExpand}
                editingId={editingId}
                setEditingId={setEditingId}
                onContextMenu={(pos) => setContextMenu(pos)}
              />
            ) : (
              <div className="flex items-center justify-center h-16 text-[10px] text-[#4e4e4e] italic">
                {searchQuery ? '검색 결과가 없습니다' : '요소가 없습니다'}
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-16 text-[10px] text-[#4e4e4e] italic">
              요소가 없습니다
            </div>
          )}
        </div>
      )}


      {/* Layer context menu */}
      {contextMenu !== null && (
        <ContextMenu
          x={contextMenu!.x}
          y={contextMenu!.y}
          elementId={contextMenu!.elementId}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
