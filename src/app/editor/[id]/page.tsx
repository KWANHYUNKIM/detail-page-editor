'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useEditorStore } from '@/stores/editorStore';
import { useProjectStore } from '@/stores/projectStore';
import { useAutoSave } from '@/hooks/useAutoSave';
import EditorCanvas, { type CanvasHandle } from '@/components/editor/Canvas';
import LeftSidebar from '@/components/editor/LeftSidebar';
import RightPanel from '@/components/editor/RightPanel';
import FloatingToolbar from '@/components/editor/FloatingToolbar';
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

  useAutoSave();

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!isLoaded) return;
    if (project?.id === projectId) return;
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
          <p className="text-gray-500 text-sm">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex editor-page">
      <LeftSidebar />

      <div className="flex-1 relative overflow-hidden">
        <EditorCanvas ref={canvasRef} />

        <div className="absolute top-3 left-3 z-40 pointer-events-none">
          <div className="pointer-events-auto bg-white/90 backdrop-blur-sm rounded-lg shadow-sm px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200/50">
            {project.name}
          </div>
        </div>

        <FloatingToolbar onExport={() => setExportOpen(true)} />
      </div>

      <RightPanel />

      <ExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        canvasRef={canvasRef}
        projectName={project.name}
      />
    </div>
  );
}
