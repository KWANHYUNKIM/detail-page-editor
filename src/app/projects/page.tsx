'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/stores/projectStore';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/supabase/auth';
import { togglePublish } from '@/lib/supabase/projects';
import { type Project, fillToCss } from '@/types/editor';
import {
  HiSparkles,
  HiFolder,
  HiTrash,
  HiDocumentDuplicate,
  HiArrowLeft,
  HiPlusCircle,
  HiClock,
  HiDocument,
  HiGlobeAlt,
  HiLockClosed,
  HiArrowRightOnRectangle,
} from 'react-icons/hi2';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  if (diff < 60_000) return '방금 전';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}분 전`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}시간 전`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}일 전`;

  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function ProjectCard({
  project,
  onOpen,
  onDelete,
  onDuplicate,
  onTogglePublish,
}: {
  project: Project;
  onOpen: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onTogglePublish: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isPublic = project.isPublic ?? false;
  const pageCount = project.pages.length;
  const elementCount = project.pages.reduce(
    (sum, p) => sum + p.elements.length,
    0,
  );

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 overflow-hidden">
      {/* Public badge */}
      {isPublic && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/90 text-white text-xs font-medium backdrop-blur-sm">
          <HiGlobeAlt className="w-3 h-3" />
          공개
        </div>
      )}

      {/* Preview area */}
      <button
        type="button"
        onClick={onOpen}
        className="w-full aspect-[4/3] flex items-center justify-center cursor-pointer"
        style={{ background: fillToCss(project.canvas.backgroundColor) }}
      >
        {elementCount > 0 ? (
          <div className="text-center px-4">
            <HiDocument className="w-10 h-10 mx-auto text-gray-400/50" />
            <p className="mt-2 text-xs text-gray-400">
              {elementCount}개 요소 · {pageCount} 페이지
            </p>
          </div>
        ) : (
          <div className="text-center">
            <HiFolder className="w-12 h-12 mx-auto text-gray-300" />
            <p className="mt-2 text-xs text-gray-400">빈 프로젝트</p>
          </div>
        )}
      </button>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 truncate">
          {project.name}
        </h3>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <HiClock className="w-3 h-3" />
            {formatDate(project.updatedAt)}
          </span>
          <span>
            {project.canvas.width} x {project.canvas.height}
          </span>
        </div>
      </div>

      {/* Hover actions */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={onTogglePublish}
          className="p-1.5 rounded-lg bg-white/90 backdrop-blur-sm shadow-md text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
          title={isPublic ? '비공개로 전환' : '공개하기'}
        >
          {isPublic ? (
            <HiLockClosed className="w-4 h-4" />
          ) : (
            <HiGlobeAlt className="w-4 h-4" />
          )}
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          className="p-1.5 rounded-lg bg-white/90 backdrop-blur-sm shadow-md text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          title="복제"
        >
          <HiDocumentDuplicate className="w-4 h-4" />
        </button>
        {confirmDelete ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            onBlur={() => setConfirmDelete(false)}
            className="px-2.5 py-1 rounded-lg bg-red-500 text-white text-xs font-medium shadow-md hover:bg-red-600 transition-colors"
            autoFocus
          >
            삭제 확인
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete(true);
            }}
            className="p-1.5 rounded-lg bg-white/90 backdrop-blur-sm shadow-md text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="삭제"
          >
            <HiTrash className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const projects = useProjectStore((s) => s.projects);
  const isLoaded = useProjectStore((s) => s.isLoaded);
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const saveProject = useProjectStore((s) => s.saveProject);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const sorted = [...projects].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  const handleDuplicate = (project: Project) => {
    const id = crypto.randomUUID();
    const duplicated: Project = {
      ...structuredClone(project),
      id,
      name: `${project.name} (복사본)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveProject(duplicated);
  };

  const handleTogglePublish = async (project: Project) => {
    const isPublic = project.isPublic ?? false;
    try {
      await togglePublish(project.id, !isPublic);
      loadProjects(); // Reload to get updated state
    } catch (err) {
      console.error('Failed to toggle publish:', err);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
            >
              <HiArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">홈</span>
            </button>
            <div className="h-5 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1e1e2e] to-[#7c3aed] flex items-center justify-center">
                <HiSparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-gray-900">내 프로젝트</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/gallery')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
            >
              <HiGlobeAlt className="w-4 h-4" />
              갤러리
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1e1e2e] text-white rounded-xl text-sm font-semibold hover:bg-[#2d2d44] transition-all hover:shadow-lg hover:shadow-[#1e1e2e]/20"
            >
              <HiPlusCircle className="w-4 h-4" />
              새로 만들기
            </button>
            {user && (
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="로그아웃"
              >
                <HiArrowRightOnRectangle className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {!isLoaded && (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500 text-sm">프로젝트를 불러오는 중...</p>
            </div>
          </div>
        )}

        {isLoaded && sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
              <HiFolder className="w-12 h-12 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              아직 프로젝트가 없어요
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              템플릿을 선택하거나 새로 만들어 보세요
            </p>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-6 py-3 bg-[#1e1e2e] text-white rounded-xl text-sm font-semibold hover:bg-[#2d2d44] transition-all"
            >
              <HiPlusCircle className="w-4 h-4" />
              시작하기
            </button>
          </div>
        )}

        {isLoaded && sorted.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">
                총 {sorted.length}개 프로젝트
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {sorted.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onOpen={() => router.push(`/editor/${project.id}`)}
                  onDelete={() => deleteProject(project.id)}
                  onDuplicate={() => handleDuplicate(project)}
                  onTogglePublish={() => handleTogglePublish(project)}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
