import { useEffect, useRef, useState, useCallback } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useProjectStore } from '@/stores/projectStore';

const AUTO_SAVE_DELAY = 2000; // 2초 디바운스 (네트워크 저장이므로 약간 더 길게)

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Auto-saves the current editor project to Supabase whenever project state changes.
 * Uses a 2-second debounce to avoid excessive API calls during rapid edits.
 *
 * Returns [saveStatus, manualSave] for UI display and manual trigger.
 */
export function useAutoSave(): [SaveStatus, () => void] {
  const project = useEditorStore((s) => s.project);
  const saveProject = useProjectStore((s) => s.saveProject);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');

  const manualSave = useCallback(() => {
    const currentProject = useEditorStore.getState().project;
    if (!currentProject) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setStatus('saving');
    try {
      saveProject(currentProject);
      lastSavedRef.current = currentProject.updatedAt;
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  }, [saveProject]);

  useEffect(() => {
    if (!project) return;

    const changeKey = project.updatedAt;
    if (changeKey === lastSavedRef.current) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setStatus('saving');

    timerRef.current = setTimeout(() => {
      try {
        saveProject(project);
        lastSavedRef.current = project.updatedAt;
        setStatus('saved');
      } catch {
        setStatus('error');
      }
      timerRef.current = null;
    }, AUTO_SAVE_DELAY);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [project, saveProject]);

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      const currentProject = useEditorStore.getState().project;
      if (currentProject) {
        useProjectStore.getState().saveProject(currentProject);
      }
    };
  }, []);

  return [status, manualSave];
}
