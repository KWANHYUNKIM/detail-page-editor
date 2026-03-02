'use client';

import { useEffect, useRef } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useHistoryStore } from '@/stores/historyStore';

interface ContextMenuProps {
  x: number;
  y: number;
  elementId: string | null;
  onClose: () => void;
}

interface MenuItem {
  label: string;
  shortcut?: string;
  action: () => void;
  disabled?: boolean;
  danger?: boolean;
}

type MenuEntry = MenuItem | 'separator';

export default function ContextMenu({ x, y, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedElementIds = useEditorStore((s) => s.selectedElementIds);
  const clipboardElements = useEditorStore((s) => s.clipboardElements);
  const getElement = useEditorStore((s) => s.getElement);
  const copyElements = useEditorStore((s) => s.copyElements);
  const cutElements = useEditorStore((s) => s.cutElements);
  const pasteElements = useEditorStore((s) => s.pasteElements);
  const duplicateElements = useEditorStore((s) => s.duplicateElements);
  const removeElements = useEditorStore((s) => s.removeElements);
  const moveLayerToTop = useEditorStore((s) => s.moveLayerToTop);
  const moveLayerUp = useEditorStore((s) => s.moveLayerUp);
  const moveLayerDown = useEditorStore((s) => s.moveLayerDown);
  const moveLayerToBottom = useEditorStore((s) => s.moveLayerToBottom);
  const groupElements = useEditorStore((s) => s.groupElements);
  const ungroupElements = useEditorStore((s) => s.ungroupElements);
  const updateElement = useEditorStore((s) => s.updateElement);
  const getCurrentPage = useEditorStore((s) => s.getCurrentPage);
  const pushState = useHistoryStore((s) => s.pushState);

  const hasSelection = selectedElementIds.length > 0;
  const hasClipboard = clipboardElements.length > 0;
  const singleSelected = selectedElementIds.length === 1;
  const multiSelected = selectedElementIds.length >= 2;

  const selectedElement = singleSelected ? getElement(selectedElementIds[0]) : null;
  const isFrame = selectedElement?.type === 'frame';
  const isLocked = selectedElement?.locked ?? false;

  const saveState = () => {
    const page = getCurrentPage();
    if (page) pushState(page);
  };

  /* ── Build menu items ── */
  const items: MenuEntry[] = [];

  if (hasSelection) {
    items.push(
      { label: '복사', shortcut: '⌘C', action: () => { copyElements(); onClose(); } },
      { label: '잘라내기', shortcut: '⌘X', action: () => { saveState(); cutElements(); onClose(); } },
    );
  }

  items.push(
    { label: '붙여넣기', shortcut: '⌘V', action: () => { pasteElements(); onClose(); }, disabled: !hasClipboard },
  );

  if (hasSelection) {
    items.push(
      { label: '복제', shortcut: '⌘D', action: () => { saveState(); duplicateElements(selectedElementIds); onClose(); } },
    );
  }

  items.push('separator');

  if (hasSelection) {
    items.push(
      { label: '삭제', shortcut: 'Del', action: () => { saveState(); removeElements(selectedElementIds); onClose(); }, danger: true },
      'separator',
    );
  }

  if (singleSelected) {
    items.push(
      { label: '맨 앞으로', action: () => { moveLayerToTop(selectedElementIds[0]); onClose(); } },
      { label: '앞으로', action: () => { moveLayerUp(selectedElementIds[0]); onClose(); } },
      { label: '뒤로', action: () => { moveLayerDown(selectedElementIds[0]); onClose(); } },
      { label: '맨 뒤로', action: () => { moveLayerToBottom(selectedElementIds[0]); onClose(); } },
      'separator',
    );
  }

  if (multiSelected) {
    items.push(
      { label: '그룹', shortcut: '⌘G', action: () => { saveState(); groupElements(selectedElementIds); onClose(); } },
    );
  }

  if (singleSelected && isFrame) {
    items.push(
      { label: '그룹 해제', shortcut: '⌘⇧G', action: () => { saveState(); ungroupElements(selectedElementIds[0]); onClose(); } },
    );
  }

  if (singleSelected) {
    if (items[items.length - 1] !== 'separator') items.push('separator');
    items.push(
      { label: isLocked ? '잠금 해제' : '잠금', action: () => { updateElement(selectedElementIds[0], { locked: !isLocked }); onClose(); } },
    );
  }

  // Remove trailing separators
  while (items.length > 0 && items[items.length - 1] === 'separator') {
    items.pop();
  }

  /* ── Close handlers ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const id = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => { clearTimeout(id); document.removeEventListener('mousedown', handler); };
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  /* ── Viewport-safe positioning ── */
  const menuWidth = 220;
  const estimatedHeight = items.reduce((h, item) => h + (item === 'separator' ? 9 : 30), 8);
  const adjustedX = Math.min(x, window.innerWidth - menuWidth - 8);
  const adjustedY = Math.min(y, window.innerHeight - estimatedHeight - 8);

  return (
    <div className="fixed inset-0 z-[9999]" onContextMenu={(e) => e.preventDefault()}>
      <div
        ref={menuRef}
        className="absolute bg-[#1e1e2e] rounded-lg shadow-2xl border border-[#3a3a4e] py-1 min-w-[200px]"
        style={{ left: adjustedX, top: adjustedY }}
      >
        {items.map((item, i) => {
          if (item === 'separator') {
            return <div key={`sep-${i}`} className="h-px bg-[#3a3a4e] my-1 mx-2" />;
          }
          return (
            <button
              key={`${item.label}-${i}`}
              type="button"
              disabled={item.disabled}
              className={`flex items-center justify-between w-full px-3 py-1.5 text-[13px] transition-colors ${
                item.disabled
                  ? 'text-gray-600 cursor-not-allowed'
                  : item.danger
                  ? 'text-red-400 hover:bg-red-500/10'
                  : 'text-gray-300 hover:bg-white/[0.06] hover:text-white'
              }`}
              onClick={item.disabled ? undefined : item.action}
            >
              <span>{item.label}</span>
              {item.shortcut && (
                <kbd className="text-[11px] text-gray-500 font-mono ml-6">{item.shortcut}</kbd>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
