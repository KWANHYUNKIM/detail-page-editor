import { CanvasPreset } from '@/types/editor';

export const CANVAS_PRESETS: CanvasPreset[] = [
  { key: 'instagram-feed', label: '인스타 피드', width: 1080, height: 1080, description: '1:1 정사각형' },
  { key: 'instagram-story', label: '인스타 스토리', width: 1080, height: 1920, description: '9:16 세로형' },
  { key: 'instagram-reel', label: '릴스 커버', width: 1080, height: 1920, description: '9:16 세로형' },
  { key: 'blog-naver', label: '네이버 블로그', width: 860, height: 1200, description: '860px 고정 너비' },
  { key: 'blog-tistory', label: '티스토리', width: 900, height: 1200, description: '자유 너비' },
  { key: 'detail-page', label: '상세페이지', width: 860, height: 2400, description: '스크롤형 상세' },
  { key: 'figma-slide', label: '피그마 슬라이드', width: 960, height: 640, description: '960×640 프레젠테이션' },
  { key: 'custom', label: '커스텀', width: 800, height: 600, description: '직접 입력' },
];

export const DEFAULT_BACKGROUND_COLOR = '#ffffff';

export const ZOOM_LIMITS = { min: 0.1, max: 5, step: 0.1 };

export const GRID_SIZE = 10;
