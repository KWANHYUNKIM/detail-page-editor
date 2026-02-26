'use client';

import { useState } from 'react';
import { HiLockClosed, HiPaperAirplane } from 'react-icons/hi2';
import { useEditorStore } from '@/stores/editorStore';
import { buildDesignPrompt } from '@/lib/ai/promptBuilder';
import { parseAIResponse } from '@/lib/ai/responseParser';

export default function AIPromptBar() {
  const [prompt, setPrompt] = useState('');
  const project = useEditorStore((s) => s.project);
  const getCurrentPage = useEditorStore((s) => s.getCurrentPage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!project || !prompt.trim()) return;
    const page = getCurrentPage();
    if (!page) return;

    const builtPrompt = buildDesignPrompt(
      {
        canvasSize: { width: project.canvas.width, height: project.canvas.height },
        currentElements: page.elements,
        uploadedImages: [],
        userPrompt: prompt,
      },
      page,
    );

    void parseAIResponse;

    navigator.clipboard.writeText(builtPrompt).catch(() => {});
    setPrompt('');
  };

  return (
    <div className="h-12 bg-[#1e1e2e] border-t border-[#2a2a3e] flex items-center px-4 gap-3 shrink-0">
      <HiLockClosed className="w-4 h-4 text-gray-500 shrink-0" />
      <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="AI 디자인 생성 기능은 준비 중입니다"
          disabled
          className="flex-1 bg-[#2a2a3e] text-gray-500 text-sm px-3 py-1.5 rounded-lg border border-[#3a3a4e] outline-none cursor-not-allowed placeholder:text-gray-600"
        />
        <button
          type="submit"
          disabled
          className="p-1.5 rounded-lg bg-[#2a2a3e] text-gray-500 cursor-not-allowed"
        >
          <HiPaperAirplane className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
