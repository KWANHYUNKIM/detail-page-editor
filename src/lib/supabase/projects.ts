import type { Project } from '@/types/editor';
import type { DbProjectWithPages } from '@/types/database';
import { createClient } from './client';
import { toClientProject, toDbProject, toDbPage } from './converters';

const supabase = () => createClient();

// ── Read ───────────────────────────────────────────────────

/** 현재 유저의 모든 프로젝트 목록 (페이지 미포함) */
export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase()
    .from('projects')
    .select('*, pages(*)')
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return (data as DbProjectWithPages[]).map(toClientProject);
}

/** 단일 프로젝트 + 페이지 로드 */
export async function fetchProject(projectId: string): Promise<Project | null> {
  const { data, error } = await supabase()
    .from('projects')
    .select('*, pages(*)')
    .eq('id', projectId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw error;
  }

  return toClientProject(data as DbProjectWithPages);
}

/** 공개 프로젝트 갤러리 */
export async function fetchPublicProjects(): Promise<Project[]> {
  const { data, error } = await supabase()
    .from('projects')
    .select('*, pages(*)')
    .eq('is_public', true)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return (data as DbProjectWithPages[]).map(toClientProject);
}

// ── Create ─────────────────────────────────────────────────

/** 새 프로젝트 생성 (페이지 포함) */
export async function createProject(project: Project): Promise<void> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { projectRow, pageRows } = toDbProject(project, user.id);

  const { error: projectError } = await supabase()
    .from('projects')
    .insert(projectRow);

  if (projectError) throw projectError;

  if (pageRows.length > 0) {
    const { error: pagesError } = await supabase()
      .from('pages')
      .insert(pageRows);

    if (pagesError) throw pagesError;
  }
}

// ── Update ─────────────────────────────────────────────────

/** 프로젝트 메타데이터 + 모든 페이지 저장 (auto-save용) */
export async function saveProject(project: Project): Promise<void> {
  const { error: projectError } = await supabase()
    .from('projects')
    .update({
      name: project.name,
      mode: project.mode,
      preset: project.preset,
      canvas: project.canvas,
    })
    .eq('id', project.id);

  if (projectError) throw projectError;

  // 기존 페이지 목록 조회
  const { data: existingPages } = await supabase()
    .from('pages')
    .select('id')
    .eq('project_id', project.id);

  const existingIds = new Set((existingPages ?? []).map((p) => p.id));
  const currentIds = new Set(project.pages.map((p) => p.id));

  // 삭제된 페이지 제거
  const deletedIds = [...existingIds].filter((id) => !currentIds.has(id));
  if (deletedIds.length > 0) {
    await supabase()
      .from('pages')
      .delete()
      .in('id', deletedIds);
  }

  // 페이지 upsert
  const pageRows = project.pages.map((page, index) =>
    toDbPage(page, project.id, index),
  );

  if (pageRows.length > 0) {
    const { error: pagesError } = await supabase()
      .from('pages')
      .upsert(pageRows, { onConflict: 'id' });

    if (pagesError) throw pagesError;
  }
}

// ── Delete ─────────────────────────────────────────────────

/** 프로젝트 삭제 (CASCADE로 페이지도 함께 삭제) */
export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase()
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) throw error;
}

// ── Publish / Fork ─────────────────────────────────────────

/** 프로젝트 공개/비공개 토글 */
export async function togglePublish(projectId: string, isPublic: boolean): Promise<void> {
  const { error } = await supabase()
    .from('projects')
    .update({ is_public: isPublic })
    .eq('id', projectId);

  if (error) throw error;
}

/** 공개 프로젝트 Fork (서버 함수 호출) */
export async function forkProject(sourceProjectId: string): Promise<string> {
  const { data, error } = await supabase()
    .rpc('fork_project', { source_project_id: sourceProjectId });

  if (error) throw error;

  return data as string;
}
