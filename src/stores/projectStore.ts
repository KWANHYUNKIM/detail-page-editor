import { create } from 'zustand';
import { Project } from '@/types/editor';
import {
  getAllProjects,
  getProject as idbGetProject,
  putProject,
  deleteProject as idbDeleteProject,
  migrateFromLocalStorage,
} from '@/lib/storage/indexedDB';

interface ProjectListState {
  projects: Project[];
  /** true once initial load (+ migration) is complete */
  isLoaded: boolean;

  loadProjects: () => void;
  saveProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  getProject: (id: string) => Project | undefined;
  getTemplates: () => Project[];
}

export const useProjectStore = create<ProjectListState>((set, get) => ({
  projects: [],
  isLoaded: false,

  loadProjects: () => {
    // Fire async — migrate localStorage first, then load from IndexedDB
    (async () => {
      try {
        await migrateFromLocalStorage<Project>();
        const projects = await getAllProjects<Project>();
        set({ projects, isLoaded: true });
      } catch (err) {
        console.warn('[projectStore] Failed to load projects:', err);
        set({ isLoaded: true });
      }
    })();
  },

  saveProject: (project) => {
    // Update Zustand state synchronously for immediate UI response
    set((s) => {
      const idx = s.projects.findIndex((p) => p.id === project.id);
      const updated =
        idx >= 0
          ? s.projects.map((p, i) => (i === idx ? project : p))
          : [...s.projects, project];
      return { projects: updated };
    });

    // Persist to IndexedDB async (fire-and-forget)
    putProject(project).catch((err) =>
      console.warn('[projectStore] Failed to save project:', err),
    );
  },

  deleteProject: (id) => {
    set((s) => {
      const updated = s.projects.filter((p) => p.id !== id);
      return { projects: updated };
    });

    idbDeleteProject(id).catch((err) =>
      console.warn('[projectStore] Failed to delete project:', err),
    );
  },

  getProject: (id) => {
    return get().projects.find((p) => p.id === id);
  },

  getTemplates: () => {
    return get().projects.filter((p) => p.isTemplate);
  },
}));
