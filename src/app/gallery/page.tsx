'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchPublicProjects, forkProject } from '@/lib/supabase/projects';
import { useAuth } from '@/hooks/useAuth';
import type { Project } from '@/types/editor';
import { fillToCss } from '@/types/editor';
import {
  HiSparkles,
  HiGlobeAlt,
  HiArrowLeft,
  HiDocumentDuplicate,
  HiDocument,
  HiClock,
  HiUser,
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

function PublicProjectCard({
  project,
  onFork,
  forking,
  isAuthenticated,
}: {
  project: Project;
  onFork: () => void;
  forking: boolean;
  isAuthenticated: boolean;
}) {
  const pageCount = project.pages.length;
  const elementCount = project.pages.reduce(
    (sum, p) => sum + p.elements.length,
    0,
  );

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 overflow-hidden">
      {/* Preview */}
      <div
        className="w-full aspect-[4/3] flex items-center justify-center"
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
            <HiGlobeAlt className="w-12 h-12 mx-auto text-gray-300" />
          </div>
        )}
      </div>

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

      {/* Fork button */}
      {isAuthenticated && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={onFork}
            disabled={forking}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm shadow-md text-gray-600 hover:text-[#7c3aed] hover:bg-purple-50 transition-colors text-xs font-medium disabled:opacity-50"
          >
            <HiDocumentDuplicate className="w-3.5 h-3.5" />
            {forking ? '복사 중...' : '내 프로젝트로 복사'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function GalleryPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [forkingId, setForkingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicProjects()
      .then(setProjects)
      .catch((err) => console.error('Failed to load gallery:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleFork = async (projectId: string) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/gallery`);
      return;
    }

    setForkingId(projectId);
    try {
      const newId = await forkProject(projectId);
      router.push(`/editor/${newId}`);
    } catch (err) {
      console.error('Failed to fork project:', err);
      alert('프로젝트 복사에 실패했습니다.');
    } finally {
      setForkingId(null);
    }
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
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#ec4899] flex items-center justify-center">
                <HiGlobeAlt className="w-3.5 h-3.5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-gray-900">공개 갤러리</h1>
            </div>
          </div>

          {!isAuthenticated && (
            <button
              onClick={() => router.push('/login')}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1e1e2e] text-white rounded-xl text-sm font-semibold hover:bg-[#2d2d44] transition-all"
            >
              <HiUser className="w-4 h-4" />
              로그인
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {loading && (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500 text-sm">갤러리를 불러오는 중...</p>
            </div>
          </div>
        )}

        {!loading && projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
              <HiGlobeAlt className="w-12 h-12 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              아직 공개된 프로젝트가 없어요
            </h2>
            <p className="text-gray-500 text-sm">
              프로젝트를 공개하면 여기에 표시됩니다
            </p>
          </div>
        )}

        {!loading && projects.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">
                총 {projects.length}개 공개 프로젝트
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {projects.map((project) => (
                <PublicProjectCard
                  key={project.id}
                  project={project}
                  onFork={() => handleFork(project.id)}
                  forking={forkingId === project.id}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
