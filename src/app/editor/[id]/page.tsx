'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useEditorStore } from '@/stores/editorStore';
import { useProjectStore } from '@/stores/projectStore';
import { useAutoSave } from '@/hooks/useAutoSave';
import EditorCanvas, { type CanvasHandle } from '@/components/editor/Canvas';
import Toolbar from '@/components/editor/Toolbar';
import LeftSidebar from '@/components/editor/LeftSidebar';
import RightPanel from '@/components/editor/RightPanel';
import AIPromptBar from '@/components/editor/AIPromptBar';
import ExportModal from '@/components/editor/ExportModal';

export default function EditorPage() {
  const params = useParams();
  const projectId = params.id as string;

  const canvasRef = useRef<CanvasHandle>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const project = useEditorStore((s) => s.project);
  const loadProject = useEditorStore((s) => s.loadProject);
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const isLoaded = useProjectStore((s) => s.isLoaded);
  const getProject = useProjectStore((s) => s.getProject);

  // Auto-save to IndexedDB on every change
  const [saveStatus] = useAutoSave();

  // Load projects from IndexedDB on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Once IndexedDB load is complete, load the specific project into editor
  useEffect(() => {
    if (!isLoaded) return;
    if (project?.id === projectId) return; // Already loaded
    const stored = getProject(projectId);
    if (stored) {
      loadProject(stored);
    }
  }, [isLoaded, projectId, getProject, loadProject, project?.id]);

  if (!project) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f0f0f0]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">프로젝트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col editor-page">
      <Toolbar onExport={() => setExportOpen(true)} saveStatus={saveStatus} />

      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <EditorCanvas ref={canvasRef} />
        <RightPanel />
      </div>

      <AIPromptBar />

      <ExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        canvasRef={canvasRef}
        projectName={project.name}
      />
    </div>
  );
}
