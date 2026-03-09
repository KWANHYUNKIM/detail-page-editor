import { create } from 'zustand';
import { Project } from '@/types/editor';
import {
  fetchProjects,
  createProject,
  saveProject as apiSaveProject,
  deleteProject as apiDeleteProject,
} from '@/lib/supabase/projects';

/** IDs of projects that exist in the database */
const persistedIds = new Set<string>();

interface ProjectListState {
  projects: Project[];
  /** true once initial load is complete */
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
    (async () => {
      try {
        const projects = await fetchProjects();
        projects.forEach((p) => persistedIds.add(p.id));
        set({ projects, isLoaded: true });
      } catch (err) {
        console.warn('[projectStore] Failed to load projects:', err);
        set({ isLoaded: true });
      }
    })();
  },

  saveProject: (project) => {
    // Optimistic UI update
    set((s) => {
      const idx = s.projects.findIndex((p) => p.id === project.id);
      const updated =
        idx >= 0
          ? s.projects.map((p, i) => (i === idx ? project : p))
          : [...s.projects, project];
      return { projects: updated };
    });

    // Persist to Supabase
    if (persistedIds.has(project.id)) {
      apiSaveProject(project).catch((err) =>
        console.warn('[projectStore] Failed to update project:', err),
      );
    } else {
      createProject(project)
        .then(() => persistedIds.add(project.id))
        .catch((err) =>
          console.warn('[projectStore] Failed to create project:', err),
        );
    }
  },

  deleteProject: (id) => {
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
    }));

    persistedIds.delete(id);
    apiDeleteProject(id).catch((err) =>
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
