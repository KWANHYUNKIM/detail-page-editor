import { useEffect, useRef, useState, useCallback } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useProjectStore } from '@/stores/projectStore';

const AUTO_SAVE_DELAY = 1500; // 1.5초 디바운스

export type SaveStatus = 'idle' | 'saving' | 'saved';

/**
 * Auto-saves the current editor project to IndexedDB whenever project state changes.
 * Uses a 1.5-second debounce to avoid excessive writes during rapid edits.
 *
 * Returns [saveStatus, manualSave] for UI display and manual trigger.
 */
export function useAutoSave(): [SaveStatus, () => void] {
  const project = useEditorStore((s) => s.project);
  const saveProject = useProjectStore((s) => s.saveProject);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');

  // Manual save (for the toolbar "저장" button)
  const manualSave = useCallback(() => {
    const currentProject = useEditorStore.getState().project;
    if (!currentProject) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    saveProject(currentProject);
    lastSavedRef.current = currentProject.updatedAt;
    setStatus('saved');
  }, [saveProject]);

  // Auto-save on project changes
  useEffect(() => {
    if (!project) return;

    // Use updatedAt as change indicator (set by editorStore on every mutation)
    const changeKey = project.updatedAt;

    // Skip if nothing changed since last save
    if (changeKey === lastSavedRef.current) return;

    // Clear previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setStatus('saving');

    timerRef.current = setTimeout(() => {
      saveProject(project);
      lastSavedRef.current = project.updatedAt;
      setStatus('saved');
      timerRef.current = null;
    }, AUTO_SAVE_DELAY);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [project, saveProject]);

  // Flush on unmount (page leave / navigation)
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
