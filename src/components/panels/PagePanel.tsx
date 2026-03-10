'use client';

import { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { HiPlus, HiChevronDown, HiChevronRight, HiTrash } from 'react-icons/hi2';

export default function PagePanel() {
  const project = useEditorStore((s) => s.project);
  const currentPageIndex = useEditorStore((s) => s.currentPageIndex);
  const setCurrentPageIndex = useEditorStore((s) => s.setCurrentPageIndex);
  const addPage = useEditorStore((s) => s.addPage);
  const deletePage = useEditorStore((s) => s.deletePage);
  const renamePage = useEditorStore((s) => s.renamePage);

  const [collapsed, setCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  if (!project) return null;

  const handleDoubleClick = (pageId: string, currentName: string) => {
    setEditingId(pageId);
    setEditValue(currentName);
  };

  const commitRename = () => {
    if (editingId && editValue.trim()) {
      renamePage(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitRename();
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  return (
    <div className="border-b border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <HiChevronRight className="w-3.5 h-3.5" />
          ) : (
            <HiChevronDown className="w-3.5 h-3.5" />
          )}
          <span>Pages</span>
        </button>
        <button
          className="p-1.5 mr-2 text-gray-400 hover:text-gray-900 transition-colors"
          onClick={() => addPage()}
          title="새 페이지 추가"
        >
          <HiPlus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Page List */}
      {!collapsed && (
        <div className="pb-1">
          {project.pages.map((page, index) => {
            const isActive = index === currentPageIndex;
            const isEditing = editingId === page.id;

            return (
              <div
                key={page.id}
                className={`group flex items-center gap-1 px-3 py-1.5 mx-1 rounded cursor-pointer text-xs transition-colors ${
                  isActive
                    ? 'bg-blue-500/15 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                onClick={() => setCurrentPageIndex(index)}
                onDoubleClick={() => handleDoubleClick(page.id, page.name)}
              >
                {isEditing ? (
                  <input
                    ref={inputRef}
                    className="flex-1 bg-white text-gray-900 text-xs px-1.5 py-0.5 rounded border border-blue-500 outline-none"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={handleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="flex-1 truncate">{page.name}</span>
                )}

                {/* Delete button — only show if more than 1 page */}
                {project.pages.length > 1 && !isEditing && (
                  <button
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-500 hover:text-red-400 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePage(page.id);
                    }}
                    title="페이지 삭제"
                  >
                    <HiTrash className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
