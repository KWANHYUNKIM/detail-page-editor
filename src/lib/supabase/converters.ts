import type { Project, Page } from '@/types/editor';
import type { DbProject, DbPage, DbProjectWithPages } from '@/types/database';

/**
 * DB rows (project + pages) → client-side Project object
 */
export function toClientProject(dbProject: DbProjectWithPages): Project {
  const pages: Page[] = dbProject.pages
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((p) => ({
      id: p.id,
      name: p.name,
      elements: p.elements,
      layers: p.layers,
      layerOrder: p.layer_order,
    }));

  return {
    id: dbProject.id,
    name: dbProject.name,
    mode: dbProject.mode,
    isTemplate: dbProject.is_template,
    templateId: dbProject.template_id ?? undefined,
    preset: dbProject.preset,
    canvas: dbProject.canvas,
    pages,
    isPublic: dbProject.is_public,
    forkedFromId: dbProject.forked_from_id ?? undefined,
    createdAt: dbProject.created_at,
    updatedAt: dbProject.updated_at,
  };
}

/**
 * Client-side Project → DB insert data (project row + page rows)
 */
export function toDbProject(project: Project, ownerId: string) {
  const projectRow = {
    id: project.id,
    owner_id: ownerId,
    name: project.name,
    mode: project.mode,
    is_template: project.isTemplate,
    template_id: project.templateId ?? null,
    preset: project.preset,
    canvas: project.canvas,
    is_public: false,
    forked_from_id: null,
  };

  const pageRows = project.pages.map((page, index) => ({
    id: page.id,
    project_id: project.id,
    name: page.name,
    sort_order: index,
    elements: page.elements,
    layers: page.layers,
    layer_order: page.layerOrder,
  }));

  return { projectRow, pageRows };
}

/**
 * Convert a single page for upsert
 */
export function toDbPage(page: Page, projectId: string, sortOrder: number) {
  return {
    id: page.id,
    project_id: projectId,
    name: page.name,
    sort_order: sortOrder,
    elements: page.elements,
    layers: page.layers,
    layer_order: page.layerOrder,
  };
}
