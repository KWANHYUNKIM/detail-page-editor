'use client';

import { useState, useRef } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useProjectStore } from '@/stores/projectStore';
import PagePanel from '@/components/panels/PagePanel';
import LayerPanel from '@/components/panels/LayerPanel';
import SectionPanel from '@/components/panels/SectionPanel';
import {
  HiPhoto,
  HiDocumentText,
  HiRectangleStack,
  HiPlusCircle,
  HiDocument,
} from 'react-icons/hi2';
import { HiCube, HiMinus } from 'react-icons/hi2';

type TabKey = 'file' | 'elements' | 'templates';

export default function LeftSidebar() {
  const [activeTab, setActiveTab] = useState<TabKey>('file');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [topHeight, setTopHeight] = useState(150);

  const handleDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = topHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientY - startY;
      const newHeight = Math.max(80, Math.min(startHeight + delta, 400));
      setTopHeight(newHeight);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const addImageElement = useEditorStore((s) => s.addImageElement);
  const addTextElement = useEditorStore((s) => s.addTextElement);
  const addShapeElement = useEditorStore((s) => s.addShapeElement);
  const loadProject = useEditorStore((s) => s.loadProject);
  const getTemplates = useProjectStore((s) => s.getTemplates);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataURL = reader.result as string;
      addImageElement(dataURL, file.name);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'file', label: '파일', icon: <HiDocument className="w-4 h-4" /> },
    { key: 'elements', label: '요소', icon: <HiPlusCircle className="w-4 h-4" /> },
    { key: 'templates', label: '템플릿', icon: <HiRectangleStack className="w-4 h-4" /> },
  ];

  const templates = getTemplates();

  return (
    <div className="w-[260px] bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {/* ━━━ File tab: Pages + Layers (Figma style) ━━━ */}
        {activeTab === 'file' && (
          <div className="flex flex-col h-full">
            {/* Top: Pages + Sections (controlled height) */}
            <div className="overflow-y-auto shrink-0" style={{ height: topHeight }}>
              <PagePanel />
              <SectionPanel />
            </div>

            {/* Resize handle */}
            <div
              className="h-1 cursor-row-resize shrink-0 group flex items-center justify-center hover:bg-[#0d99ff]/30 transition-colors"
              onMouseDown={handleDividerMouseDown}
              role="slider"
              aria-label="Resize handle"
              aria-orientation="vertical"
              tabIndex={0}
            >
              <div className="w-8 h-0.5 rounded-full bg-gray-300 group-hover:bg-[#0d99ff] transition-colors" />
            </div>

            {/* Bottom: Layers (fills remaining) */}
            <div className="flex-1 overflow-y-auto min-h-[100px]">
              <LayerPanel />
            </div>
          </div>
        )}

        {/* ━━━ Elements tab ━━━ */}
        {activeTab === 'elements' && (
          <div className="flex flex-col gap-2 p-3">
            <p className="text-xs text-gray-500 font-medium mb-1">요소 추가</p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            <button
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <HiPhoto className="w-5 h-5 text-purple-400" />
              이미지 업로드
            </button>

            <button
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition-colors"
              onClick={() => addTextElement()}
            >
              <HiDocumentText className="w-5 h-5 text-sky-400" />
              텍스트
            </button>

            <p className="text-xs text-gray-500 font-medium mt-3 mb-1">도형</p>

            <div className="grid grid-cols-2 gap-2">
              <button
                className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg bg-gray-100 text-gray-700 text-xs hover:bg-gray-200 transition-colors"
                onClick={() => addShapeElement('rect')}
              >
                <div className="w-8 h-6 rounded-sm border-2 border-amber-400" />
                사각형
              </button>

              <button
                className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg bg-gray-100 text-gray-700 text-xs hover:bg-gray-200 transition-colors"
                onClick={() => addShapeElement('circle')}
              >
                <div className="w-7 h-7 rounded-full border-2 border-emerald-400" />
                원형
              </button>

              <button
                className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg bg-gray-100 text-gray-700 text-xs hover:bg-gray-200 transition-colors"
                onClick={() => addShapeElement('line')}
              >
                <HiMinus className="w-8 h-8 text-rose-400" />
                선
              </button>

              <button
                className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg bg-gray-100 text-gray-700 text-xs hover:bg-gray-200 transition-colors"
                onClick={() => addShapeElement('rect')}
              >
                <HiCube className="w-6 h-6 text-indigo-400" />
                자유 도형
              </button>
            </div>
          </div>
        )}

        {/* ━━━ Templates tab ━━━ */}
        {activeTab === 'templates' && (
          <div className="flex flex-col gap-2 p-3">
            <p className="text-xs text-gray-500 font-medium mb-1">저장된 템플릿</p>
            {templates.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">
                저장된 템플릿이 없습니다
              </p>
            ) : (
              templates.map((template) => (
                <button
                  key={template.id}
                  className="flex flex-col items-start gap-1 w-full px-3 py-2.5 rounded-lg bg-gray-100 text-left hover:bg-gray-200 transition-colors"
                  onClick={() => loadProject(template)}
                >
                  <span className="text-sm text-gray-700 truncate w-full">
                    {template.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {template.canvas.width} × {template.canvas.height}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
