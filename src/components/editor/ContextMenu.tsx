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
  const styleClipboard = useEditorStore((s) => s.styleClipboard);
  const getElement = useEditorStore((s) => s.getElement);
  const getSelectedElements = useEditorStore((s) => s.getSelectedElements);
  const copyElements = useEditorStore((s) => s.copyElements);
  const cutElements = useEditorStore((s) => s.cutElements);
  const pasteElements = useEditorStore((s) => s.pasteElements);
  const duplicateElements = useEditorStore((s) => s.duplicateElements);
  const removeElements = useEditorStore((s) => s.removeElements);
  const copyStyle = useEditorStore((s) => s.copyStyle);
  const pasteStyle = useEditorStore((s) => s.pasteStyle);
  const moveLayerToTop = useEditorStore((s) => s.moveLayerToTop);
  const moveLayerUp = useEditorStore((s) => s.moveLayerUp);
  const moveLayerDown = useEditorStore((s) => s.moveLayerDown);
  const moveLayerToBottom = useEditorStore((s) => s.moveLayerToBottom);
  const groupElements = useEditorStore((s) => s.groupElements);
  const ungroupElements = useEditorStore((s) => s.ungroupElements);
  const updateElement = useEditorStore((s) => s.updateElement);
  const alignElements = useEditorStore((s) => s.alignElements);
  const distributeElements = useEditorStore((s) => s.distributeElements);
  const getCurrentPage = useEditorStore((s) => s.getCurrentPage);
  const pushState = useHistoryStore((s) => s.pushState);

  const hasSelection = selectedElementIds.length > 0;
  const hasClipboard = clipboardElements.length > 0;
  const singleSelected = selectedElementIds.length === 1;
  const multiSelected = selectedElementIds.length >= 2;

  const selectedElement = singleSelected ? getElement(selectedElementIds[0]) : null;
  const isFrame = selectedElement?.type === 'frame';
  const isLocked = selectedElement?.locked ?? false;
  const isHidden = selectedElement ? !selectedElement.visible : false;

  // Multi-select: check if ALL are locked / ALL are hidden
  const allSelected = hasSelection ? selectedElementIds.map((id) => getElement(id)).filter(Boolean) : [];
  const allLocked = allSelected.length > 0 && allSelected.every((el) => el!.locked);
  const allHidden = allSelected.length > 0 && allSelected.every((el) => !el!.visible);

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

  // Style copy/paste
  if (singleSelected) {
    items.push('separator');
    items.push(
      { label: '스타일 복사', shortcut: '⌥⌘C', action: () => { copyStyle(); onClose(); } },
    );
  }
  if (hasSelection) {
    items.push(
      { label: '스타일 붙여넣기', shortcut: '⌥⌘V', action: () => { pasteStyle(); onClose(); }, disabled: !styleClipboard },
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
      'separator',
      { label: '왼쪽 정렬', action: () => { saveState(); alignElements(selectedElementIds, 'left'); onClose(); } },
      { label: '가로 가운데 정렬', action: () => { saveState(); alignElements(selectedElementIds, 'centerH'); onClose(); } },
      { label: '오른쪽 정렬', action: () => { saveState(); alignElements(selectedElementIds, 'right'); onClose(); } },
      { label: '위쪽 정렬', action: () => { saveState(); alignElements(selectedElementIds, 'top'); onClose(); } },
      { label: '세로 가운데 정렬', action: () => { saveState(); alignElements(selectedElementIds, 'centerV'); onClose(); } },
      { label: '아래쪽 정렬', action: () => { saveState(); alignElements(selectedElementIds, 'bottom'); onClose(); } },
    );
  }

  if (multiSelected && selectedElementIds.length >= 3) {
    items.push(
      'separator',
      { label: '가로 균등 분배', action: () => { saveState(); distributeElements(selectedElementIds, 'horizontal'); onClose(); } },
      { label: '세로 균등 분배', action: () => { saveState(); distributeElements(selectedElementIds, 'vertical'); onClose(); } },
    );
  }

  if (multiSelected) {
    items.push(
      'separator',
      { label: '그룹', shortcut: '⌘G', action: () => { saveState(); groupElements(selectedElementIds); onClose(); } },
    );
  }

  if (singleSelected && isFrame) {
    items.push(
      { label: '그룹 해제', shortcut: '⌘⇧G', action: () => { saveState(); ungroupElements(selectedElementIds[0]); onClose(); } },
    );
  }

  // Lock / Unlock (single + multi)
  if (hasSelection) {
    if (items[items.length - 1] !== 'separator') items.push('separator');
    if (singleSelected) {
      items.push(
        { label: isLocked ? '잠금 해제' : '잠금', action: () => { updateElement(selectedElementIds[0], { locked: !isLocked }); onClose(); } },
      );
    } else {
      items.push(
        { label: allLocked ? '모두 잠금 해제' : '모두 잠금', action: () => { selectedElementIds.forEach((id) => updateElement(id, { locked: !allLocked })); onClose(); } },
      );
    }

    // Show / Hide
    if (singleSelected) {
      items.push(
        { label: isHidden ? '표시' : '숨기기', action: () => { updateElement(selectedElementIds[0], { visible: !selectedElement!.visible }); onClose(); } },
      );
    } else {
      items.push(
        { label: allHidden ? '모두 표시' : '모두 숨기기', action: () => { selectedElementIds.forEach((id) => { const el = getElement(id); if (el) updateElement(id, { visible: allHidden }); }); onClose(); } },
      );
    }
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
