'use client';

import { useState } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { FrameElement, fillToCss } from '@/types/editor';
import {
  HiPlus,
  HiChevronDown,
  HiChevronRight,
  HiChevronUp,
  HiTrash,
  HiViewfinderCircle,
  HiArrowsPointingOut,
} from 'react-icons/hi2';

export default function SectionPanel() {
  const getCurrentPage = useEditorStore((s) => s.getCurrentPage);
  const selectedElementIds = useEditorStore((s) => s.selectedElementIds);
  const selectElements = useEditorStore((s) => s.selectElements);
  const addSectionElement = useEditorStore((s) => s.addSectionElement);
  const removeElements = useEditorStore((s) => s.removeElements);
  const updateElement = useEditorStore((s) => s.updateElement);
  const focusedSectionId = useEditorStore((s) => s.focusedSectionId);
  const setFocusedSectionId = useEditorStore((s) => s.setFocusedSectionId);

  const [collapsed, setCollapsed] = useState(false);

  const page = getCurrentPage();
  if (!page) return null;

  const sections = page.elements
    .filter(
      (el) => el.type === 'frame' && (el as FrameElement).isSection === true,
    )
    .sort((a, b) => a.y - b.y) as FrameElement[];

  const handleAddSection = () => {
    const lastSection = sections[sections.length - 1];
    const y = lastSection ? lastSection.y + lastSection.height : 0;
    addSectionElement(y);
  };

  const handleFocusSection = (sectionId: string) => {
    if (focusedSectionId === sectionId) {
      // 같은 섹션 다시 클릭 → 포커스 해제 (전체 보기)
      setFocusedSectionId(null);
    } else {
      setFocusedSectionId(sectionId);
      selectElements([sectionId]);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const current = sections[index];
    const above = sections[index - 1];

    const currentY = current.y;
    const aboveY = above.y;

    // Swap Y positions
    updateElement(current.id, { y: aboveY });
    updateElement(above.id, { y: aboveY + current.height });

    // Move children of current section
    const deltaC = aboveY - currentY;
    for (const childId of current.childOrder) {
      const child = page.elements.find((e) => e.id === childId);
      if (child) {
        updateElement(childId, { y: child.y + deltaC });
      }
    }

    // Move children of above section
    const deltaA = current.height;
    for (const childId of above.childOrder) {
      const child = page.elements.find((e) => e.id === childId);
      if (child) {
        updateElement(childId, { y: child.y + deltaA });
      }
    }
  };

  const handleMoveDown = (index: number) => {
    if (index >= sections.length - 1) return;
    const current = sections[index];
    const below = sections[index + 1];

    const currentY = current.y;
    const belowY = below.y;

    // Swap Y positions
    updateElement(current.id, { y: currentY + below.height });
    updateElement(below.id, { y: currentY });

    // Move children of current section
    const deltaC = below.height;
    for (const childId of current.childOrder) {
      const child = page.elements.find((e) => e.id === childId);
      if (child) {
        updateElement(childId, { y: child.y + deltaC });
      }
    }

    // Move children of below section
    for (const childId of below.childOrder) {
      const child = page.elements.find((e) => e.id === childId);
      if (child) {
        updateElement(childId, { y: child.y + (currentY - belowY) });
      }
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
          <span>Sections</span>
        </button>
        <div className="flex items-center gap-0.5 mr-2">
          {/* 전체 보기 버튼 */}
          {focusedSectionId && (
            <button
              className="p-1.5 text-blue-400 hover:text-blue-300 transition-colors"
              onClick={() => setFocusedSectionId(null)}
              title="전체 보기"
            >
              <HiArrowsPointingOut className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors"
            onClick={handleAddSection}
            title="새 섹션 추가"
          >
            <HiPlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Section List */}
      {!collapsed && (
        <div className="pb-1">
          {sections.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-3 px-3">
              섹션이 없습니다
            </p>
          ) : (
            <>
              {sections.map((section, index) => {
                const isFocused = focusedSectionId === section.id;
                const isSelected = selectedElementIds.includes(section.id);
                return (
                  <div
                    key={section.id}
                    className={`group flex items-center gap-2 px-3 py-1.5 mx-1 rounded cursor-pointer text-xs transition-all ${
                      isFocused
                        ? 'bg-blue-500/15 text-gray-900 ring-1 ring-blue-500/50'
                        : isSelected
                          ? 'bg-blue-500/10 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    onClick={() => handleFocusSection(section.id)}
                  >
                    {/* Focus indicator + Color swatch */}
                    <div className="relative shrink-0">
                      <div
                        className="w-5 h-5 rounded-sm border border-gray-300"
                        style={{
                          background: fillToCss(section.fill || '#ffffff'),
                        }}
                      />
                      {isFocused && (
                        <HiViewfinderCircle className="absolute -top-1 -right-1 w-3 h-3 text-blue-400" />
                      )}
                    </div>

                    {/* Label + height */}
                    <div className="flex-1 min-w-0">
                      <span className="truncate">섹션 {index + 1}</span>
                      <span className="ml-1.5 text-gray-500 text-[10px]">
                        {section.height}px
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-0.5 text-gray-400 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveUp(index);
                        }}
                        disabled={index === 0}
                        title="위로 이동"
                      >
                        <HiChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        className="p-0.5 text-gray-400 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveDown(index);
                        }}
                        disabled={index === sections.length - 1}
                        title="아래로 이동"
                      >
                        <HiChevronDown className="w-3 h-3" />
                      </button>
                      <button
                        className="p-0.5 text-gray-500 hover:text-red-400 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (focusedSectionId === section.id) {
                            setFocusedSectionId(null);
                          }
                          removeElements([section.id]);
                        }}
                        title="섹션 삭제"
                      >
                        <HiTrash className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* 전체 보기 바로가기 (포커스 중일 때만 표시) */}
              {focusedSectionId && (
                <button
                  className="flex items-center justify-center gap-1.5 w-full mt-1 px-3 py-1.5 text-[10px] text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                  onClick={() => setFocusedSectionId(null)}
                >
                  <HiArrowsPointingOut className="w-3 h-3" />
                  전체 보기로 돌아가기
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
