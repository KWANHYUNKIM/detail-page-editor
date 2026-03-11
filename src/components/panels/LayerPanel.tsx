'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import type { CanvasElement, FrameElement, ImageElement } from '@/types/editor';
import { fillToCss, isGradient } from '@/types/editor';
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

/* ── Layer Thumbnail (Figma-style) ── */

function collectDescendantImages(
  el: CanvasElement,
  allElements: CanvasElement[],
  limit: number,
): ImageElement[] {
  const results: ImageElement[] = [];
  const stack: CanvasElement[] = [el];
  while (stack.length > 0 && results.length < limit) {
    const current = stack.pop()!;
    if (current.type === 'image') {
      results.push(current as ImageElement);
    } else if (current.type === 'frame') {
      const frame = current as FrameElement;
      for (let i = frame.childOrder.length - 1; i >= 0; i--) {
        const child = allElements.find((e) => e.id === frame.childOrder[i]);
        if (child) stack.push(child);
      }
    }
  }
  return results;
}

const THUMB = 'w-9 h-9 rounded-md shrink-0 overflow-hidden';

function LayerThumbnail({
  el,
  allElements,
}: {
  el: CanvasElement;
  allElements: CanvasElement[];
}) {
  if (el.type === 'image') {
    return (
      <div className={`${THUMB} bg-gray-100`}>
        <img
          src={(el as ImageElement).src}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
          draggable={false}
        />
      </div>
    );
  }

  if (el.type === 'frame') {
    const frame = el as FrameElement;
    const images = collectDescendantImages(frame, allElements, 4);
    const fill = frame.fill || '#ffffff';
    const bg = isGradient(fill) ? fillToCss(fill) : fill;

    if (images.length === 0) {
      return (
        <div
          className={`${THUMB} border border-gray-200`}
          style={{ background: bg }}
        />
      );
    }

    if (images.length === 1) {
      return (
        <div className={`${THUMB} bg-gray-100`} style={{ background: bg }}>
          <img
            src={images[0].src}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            draggable={false}
          />
        </div>
      );
    }

    return (
      <div
        className={`${THUMB} grid gap-px`}
        style={{
          background: bg,
          gridTemplateColumns: images.length >= 2 ? '1fr 1fr' : '1fr',
          gridTemplateRows: images.length >= 3 ? '1fr 1fr' : '1fr',
        }}
      >
        {images.slice(0, 4).map((img) => (
          <img
            key={img.id}
            src={img.src}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            draggable={false}
          />
        ))}
      </div>
    );
  }

  if (el.type === 'text') {
    return (
      <div className={`${THUMB} bg-gray-50 border border-gray-200 flex items-center justify-center`}>
        <span className="text-[8px] leading-tight text-gray-400 px-0.5 truncate">Aa</span>
      </div>
    );
  }

  if (el.type === 'shape') {
    const shape = el as import('@/types/editor').ShapeElement;
    const shapeFill = shape.fill || '#d1d5db';
    const bg = isGradient(shapeFill) ? fillToCss(shapeFill) : shapeFill;
    return (
      <div
        className={`${THUMB} border border-gray-200`}
        style={{ background: bg }}
      />
    );
  }

  return null;
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
  allElements: CanvasElement[];
  depth: number;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelect: (e: React.MouseEvent) => void;
  onToggleVisible: () => void;
  onToggleLock: () => void;
  isEditing: boolean;
  onStartRename: () => void;
  onCommitRename: (newName: string) => void;
  onCancelRename: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

function LayerRow({
  el,
  allElements,
  depth,
  isSelected,
  isExpanded,
  onToggleExpand,
  onSelect,
  onToggleVisible,
  onToggleLock,
  isEditing,
  onStartRename,
  onCommitRename,
  onCancelRename,
  onContextMenu,
}: LayerRowProps) {
  const label = elementLabel(el);
  const isContainer = isContainerType(el.type);
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
      className={`group relative flex items-center h-11 px-1 cursor-pointer select-none transition-colors ${
        isSelected
          ? 'bg-blue-500/15 text-gray-900'
          : 'hover:bg-gray-100 text-gray-700'
      } ${!el.visible ? 'opacity-40' : ''}`}
      onClick={onSelect}
      onContextMenu={onContextMenu}
    >
      <span className="shrink-0" style={{ width: 4 + depth * 12 }} />

      {isContainer ? (
        <button
          className="flex items-center justify-center w-4 h-4 shrink-0 text-gray-400 hover:text-gray-900 transition-colors"
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

      <span className="ml-1 shrink-0">
        <LayerThumbnail el={el} allElements={allElements} />
      </span>
      {isEditing ? (
        <input
          ref={inputRef}
           className="flex-1 ml-2 bg-white text-gray-900 text-[11px] px-1 py-0 rounded border border-blue-500 outline-none w-full"
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
          className="flex-1 truncate ml-2 text-[12px] font-medium leading-none"
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


      {/* Row actions — hover only (Lock + Visibility) */}
      <div className="flex items-center gap-0.5 pr-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="flex items-center justify-center w-5 h-5 rounded hover:bg-gray-200 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock();
          }}
        >
          {el.locked ? (
            <HiLockClosed className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <HiLockOpen className="w-3.5 h-3.5 text-gray-400" />
          )}
        </button>

        <button
          className="flex items-center justify-center w-5 h-5 rounded hover:bg-gray-200 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisible();
          }}
        >
          {el.visible ? (
            <HiEye className="w-3.5 h-3.5 text-gray-400" />
          ) : (
            <HiEyeSlash className="w-3.5 h-3.5 text-gray-300" />
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
          <HiEyeSlash className="w-3.5 h-3.5 text-gray-300" />
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
  selectElements,
  updateElement,
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
  selectElements: (ids: string[]) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
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
              allElements={allElements}
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
                selectElements={selectElements}
                updateElement={updateElement}
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
  const selectedElementIds = useEditorStore((s) => s.selectedElementIds);
  const selectElements = useEditorStore((s) => s.selectElements);
  const updateElement = useEditorStore((s) => s.updateElement);
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
      <div className="flex items-center justify-center h-20 text-[11px] text-gray-400">
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
      <div className="flex items-center justify-between h-8 border-b border-gray-200">
        <button
          className="flex items-center gap-1 px-3 text-[11px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
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
            className="flex items-center justify-center w-5 h-5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-900 transition-colors"
            onClick={(e) => { e.stopPropagation(); setExpandedIds(new Set()); }}
            title="모든 레이어 접기"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M4 10l4-3 4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 13l4-3 4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span className="text-[10px] text-gray-400 tabular-nums">
            {elementCount}
          </span>
        </div>
      </div>

      {/* Search input */}
      {!collapsed && (
        <div className="px-2 py-1.5 border-b border-gray-200">
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-100 rounded text-[11px] text-gray-900">
            <HiMagnifyingGlass className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="레이어 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="flex items-center justify-center w-4 h-4 text-gray-400 hover:text-gray-900 transition-colors shrink-0"
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
                selectElements={selectAndScroll}
                updateElement={updateElement}
                toggleExpand={toggleExpand}
                editingId={editingId}
                setEditingId={setEditingId}
                onContextMenu={(pos) => setContextMenu(pos)}
              />
            ) : (
              <div className="flex items-center justify-center h-16 text-[10px] text-gray-400 italic">
                {searchQuery ? '검색 결과가 없습니다' : '요소가 없습니다'}
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-16 text-[10px] text-gray-400 italic">
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
