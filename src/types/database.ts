import type { CanvasElement, EditorMode, FillValue, Layer, PresetKey } from './editor';

// ── Database Row Types ─────────────────────────────────────

export interface DbProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbProject {
  id: string;
  owner_id: string;
  name: string;
  mode: EditorMode;
  is_template: boolean;
  template_id: string | null;
  preset: PresetKey;
  canvas: {
    width: number;
    height: number;
    backgroundColor: FillValue;
  };
  is_public: boolean;
  forked_from_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPage {
  id: string;
  project_id: string;
  name: string;
  sort_order: number;
  elements: CanvasElement[];
  layers: Layer[];
  layer_order: string[];
  created_at: string;
  updated_at: string;
}

// ── Joined Types ───────────────────────────────────────────

export interface DbProjectWithPages extends DbProject {
  pages: DbPage[];
}

// ── Insert/Update Types ────────────────────────────────────

export type DbProjectInsert = Omit<DbProject, 'id' | 'created_at' | 'updated_at'>;
export type DbProjectUpdate = Partial<Omit<DbProject, 'id' | 'owner_id' | 'created_at' | 'updated_at'>>;

export type DbPageInsert = Omit<DbPage, 'id' | 'created_at' | 'updated_at'>;
export type DbPageUpdate = Partial<Omit<DbPage, 'id' | 'project_id' | 'created_at' | 'updated_at'>>;
