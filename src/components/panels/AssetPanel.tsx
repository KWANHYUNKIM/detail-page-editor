'use client';

import { useState, useCallback } from 'react';
import { useEditorStore } from '@/stores/editorStore';

/* ── Mock Data ── */

interface FolderComponent {
  id: string;
  name: string;
  thumbnailColor: string;
}

interface LibraryFolder {
  id: string;
  name: string;
  thumbnailColor: string;
  components: FolderComponent[];
}

interface Library {
  id: string;
  name: string;
  gradient: string;
  componentCount: number;
  folders: LibraryFolder[];
}

const MOCK_LIBRARIES: Library[] = [
  {
    id: 'detail-page',
    name: '상세페이지 에셋',
    gradient: 'from-orange-400 to-rose-500',
    componentCount: 52,
    folders: [
      {
        id: 'dp-header',
        name: '헤더 / 배너',
        thumbnailColor: '#fff3e0',
        components: [
          { id: 'dp-hero', name: '히어로 배너', thumbnailColor: '#ffe0b2' },
          { id: 'dp-product-header', name: '상품 메인 헤더', thumbnailColor: '#ffccbc' },
          { id: 'dp-brand-header', name: '브랜드 소개 헤더', thumbnailColor: '#ffe0b2' },
          { id: 'dp-sale-banner', name: '세일 배너', thumbnailColor: '#ffcdd2' },
          { id: 'dp-event-banner', name: '이벤트 배너', thumbnailColor: '#f8bbd0' },
          { id: 'dp-seasonal', name: '시즌 배너', thumbnailColor: '#ffe0b2' },
        ],
      },
      {
        id: 'dp-product',
        name: '상품 소개',
        thumbnailColor: '#e3f2fd',
        components: [
          { id: 'dp-product-card', name: '상품 카드', thumbnailColor: '#bbdefb' },
          { id: 'dp-feature-list', name: '특장점 리스트', thumbnailColor: '#c8e6c9' },
          { id: 'dp-spec-table', name: '스펙 테이블', thumbnailColor: '#e3f2fd' },
          { id: 'dp-desc-block', name: '상세 설명 블록', thumbnailColor: '#e8eaf6' },
          { id: 'dp-ingredient', name: '성분/원재료 표기', thumbnailColor: '#e0f7fa' },
          { id: 'dp-size-guide', name: '사이즈 가이드', thumbnailColor: '#e3f2fd' },
          { id: 'dp-color-option', name: '컬러 옵션', thumbnailColor: '#f3e5f5' },
        ],
      },
      {
        id: 'dp-price',
        name: '가격 / 혜택',
        thumbnailColor: '#fce4ec',
        components: [
          { id: 'dp-price-tag', name: '가격 태그', thumbnailColor: '#ffcdd2' },
          { id: 'dp-discount', name: '할인 배지', thumbnailColor: '#ef9a9a' },
          { id: 'dp-free-ship', name: '무료배송 배너', thumbnailColor: '#c8e6c9' },
          { id: 'dp-benefits', name: '혜택 리스트', thumbnailColor: '#fff9c4' },
          { id: 'dp-coupon', name: '쿠폰 다운로드', thumbnailColor: '#ffecb3' },
          { id: 'dp-bundle', name: '묶음 할인', thumbnailColor: '#ffe0b2' },
        ],
      },
      {
        id: 'dp-cta',
        name: 'CTA / 버튼',
        thumbnailColor: '#e8eaf6',
        components: [
          { id: 'dp-buy-btn', name: '구매하기 버튼', thumbnailColor: '#c5cae9' },
          { id: 'dp-cart-btn', name: '장바구니 버튼', thumbnailColor: '#bbdefb' },
          { id: 'dp-inquiry-btn', name: '문의하기 버튼', thumbnailColor: '#b2dfdb' },
          { id: 'dp-share-btn', name: '공유하기 버튼', thumbnailColor: '#c8e6c9' },
          { id: 'dp-wishlist-btn', name: '찜하기 버튼', thumbnailColor: '#f8bbd0' },
        ],
      },
      {
        id: 'dp-review',
        name: '후기 / 리뷰',
        thumbnailColor: '#fff9c4',
        components: [
          { id: 'dp-review-card', name: '리뷰 카드', thumbnailColor: '#fff9c4' },
          { id: 'dp-star-rating', name: '별점 평가', thumbnailColor: '#ffecb3' },
          { id: 'dp-testimonial', name: '고객 후기', thumbnailColor: '#fff9c4' },
          { id: 'dp-before-after', name: '비포/애프터', thumbnailColor: '#e1bee7' },
          { id: 'dp-photo-review', name: '포토 리뷰', thumbnailColor: '#ffe0b2' },
        ],
      },
      {
        id: 'dp-image',
        name: '이미지 섹션',
        thumbnailColor: '#e0f2f1',
        components: [
          { id: 'dp-full-img', name: '풀폭 이미지', thumbnailColor: '#b2dfdb' },
          { id: 'dp-img-grid', name: '이미지 그리드', thumbnailColor: '#c8e6c9' },
          { id: 'dp-comparison', name: '비교 이미지', thumbnailColor: '#e0f2f1' },
          { id: 'dp-gallery', name: '갤러리', thumbnailColor: '#b2ebf2' },
          { id: 'dp-lifestyle', name: '라이프스타일 컷', thumbnailColor: '#e0f7fa' },
        ],
      },
      {
        id: 'dp-text',
        name: '텍스트 섹션',
        thumbnailColor: '#f5f5f5',
        components: [
          { id: 'dp-title', name: '타이틀 블록', thumbnailColor: '#e0e0e0' },
          { id: 'dp-body', name: '본문 텍스트', thumbnailColor: '#f5f5f5' },
          { id: 'dp-qna', name: 'Q&A 블록', thumbnailColor: '#e8eaf6' },
          { id: 'dp-notice', name: '안내 문구', thumbnailColor: '#fff9c4' },
          { id: 'dp-callout', name: '강조 문구', thumbnailColor: '#ffecb3' },
        ],
      },
      {
        id: 'dp-footer',
        name: '푸터 / 안내',
        thumbnailColor: '#eceff1',
        components: [
          { id: 'dp-delivery', name: '배송 안내', thumbnailColor: '#cfd8dc' },
          { id: 'dp-return', name: '반품/교환 안내', thumbnailColor: '#eceff1' },
          { id: 'dp-contact', name: '고객센터 안내', thumbnailColor: '#cfd8dc' },
          { id: 'dp-company', name: '회사 정보', thumbnailColor: '#eceff1' },
          { id: 'dp-legal', name: '법적 고지', thumbnailColor: '#e0e0e0' },
        ],
      },
      {
        id: 'dp-badge',
        name: '배지 / 아이콘',
        thumbnailColor: '#f3e5f5',
        components: [
          { id: 'dp-best', name: '베스트셀러 배지', thumbnailColor: '#ffcdd2' },
          { id: 'dp-new', name: 'NEW 배지', thumbnailColor: '#c8e6c9' },
          { id: 'dp-cert', name: '인증 마크', thumbnailColor: '#bbdefb' },
          { id: 'dp-award', name: '수상 배지', thumbnailColor: '#fff9c4' },
          { id: 'dp-md-pick', name: 'MD 추천', thumbnailColor: '#e1bee7' },
          { id: 'dp-limited', name: '한정판 배지', thumbnailColor: '#ffccbc' },
        ],
      },
      {
        id: 'dp-divider',
        name: '구분선 / 장식',
        thumbnailColor: '#e0e0e0',
        components: [
          { id: 'dp-line', name: '구분선', thumbnailColor: '#bdbdbd' },
          { id: 'dp-deco-line', name: '장식 라인', thumbnailColor: '#e0e0e0' },
          { id: 'dp-section-break', name: '섹션 구분', thumbnailColor: '#f5f5f5' },
          { id: 'dp-spacer', name: '여백', thumbnailColor: '#fafafa' },
        ],
      },
    ],
  },
  {
    id: 'instagram',
    name: '인스타그램 에셋',
    gradient: 'from-purple-500 via-pink-500 to-orange-400',
    componentCount: 38,
    folders: [
      {
        id: 'ig-feed',
        name: '피드 포스트',
        thumbnailColor: '#f3e5f5',
        components: [
          { id: 'ig-product-post', name: '상품 소개 포스트', thumbnailColor: '#e1bee7' },
          { id: 'ig-lifestyle', name: '라이프스타일 포스트', thumbnailColor: '#f3e5f5' },
          { id: 'ig-carousel', name: '캐러셀 슬라이드', thumbnailColor: '#e8eaf6' },
          { id: 'ig-quote', name: '명언/인용 포스트', thumbnailColor: '#ede7f6' },
          { id: 'ig-tip', name: '꿀팁 포스트', thumbnailColor: '#fff9c4' },
          { id: 'ig-comparison', name: '비교 포스트', thumbnailColor: '#e3f2fd' },
        ],
      },
      {
        id: 'ig-story',
        name: '스토리',
        thumbnailColor: '#fce4ec',
        components: [
          { id: 'ig-poll', name: '투표 스토리', thumbnailColor: '#f8bbd0' },
          { id: 'ig-question', name: '질문 스토리', thumbnailColor: '#e1bee7' },
          { id: 'ig-product-tag', name: '상품 태그 스토리', thumbnailColor: '#ffccbc' },
          { id: 'ig-countdown', name: '카운트다운 스토리', thumbnailColor: '#ffcdd2' },
          { id: 'ig-link', name: '링크 스토리', thumbnailColor: '#c5cae9' },
          { id: 'ig-swipeup', name: '스와이프업 스토리', thumbnailColor: '#b2dfdb' },
        ],
      },
      {
        id: 'ig-reel',
        name: '릴스 커버',
        thumbnailColor: '#e8eaf6',
        components: [
          { id: 'ig-reel-thumb', name: '릴스 썸네일', thumbnailColor: '#c5cae9' },
          { id: 'ig-reel-title', name: '릴스 타이틀 카드', thumbnailColor: '#e8eaf6' },
          { id: 'ig-reel-end', name: '릴스 엔딩 카드', thumbnailColor: '#d1c4e9' },
        ],
      },
      {
        id: 'ig-promo',
        name: '프로모션',
        thumbnailColor: '#ffecb3',
        components: [
          { id: 'ig-sale', name: '세일 공지', thumbnailColor: '#ffcdd2' },
          { id: 'ig-giveaway', name: '이벤트/경품', thumbnailColor: '#fff9c4' },
          { id: 'ig-new-arrival', name: '신상품 공지', thumbnailColor: '#c8e6c9' },
          { id: 'ig-flash', name: '타임세일', thumbnailColor: '#ef9a9a' },
          { id: 'ig-collab', name: '콜라보 공지', thumbnailColor: '#e1bee7' },
        ],
      },
      {
        id: 'ig-brand',
        name: '브랜드',
        thumbnailColor: '#e0f2f1',
        components: [
          { id: 'ig-logo', name: '로고 배치', thumbnailColor: '#b2dfdb' },
          { id: 'ig-color-block', name: '브랜드 컬러 블록', thumbnailColor: '#e0f2f1' },
          { id: 'ig-watermark', name: '워터마크', thumbnailColor: '#e0e0e0' },
          { id: 'ig-profile-card', name: '프로필 카드', thumbnailColor: '#e3f2fd' },
        ],
      },
      {
        id: 'ig-text',
        name: '텍스트/타이포',
        thumbnailColor: '#f5f5f5',
        components: [
          { id: 'ig-headline', name: '헤드라인', thumbnailColor: '#e0e0e0' },
          { id: 'ig-subtitle', name: '서브타이틀', thumbnailColor: '#f5f5f5' },
          { id: 'ig-caption', name: '캡션 텍스트', thumbnailColor: '#eeeeee' },
          { id: 'ig-hashtag', name: '해시태그 블록', thumbnailColor: '#e3f2fd' },
          { id: 'ig-cta-text', name: 'CTA 텍스트', thumbnailColor: '#ffecb3' },
        ],
      },
    ],
  },
  {
    id: 'basic-ds',
    name: '기본 디자인 요소',
    gradient: 'from-gray-400 to-slate-600',
    componentCount: 24,
    folders: [
      {
        id: 'basic-shape',
        name: '도형',
        thumbnailColor: '#e8eaf6',
        components: [
          { id: 'bs-rect', name: '사각형', thumbnailColor: '#c5cae9' },
          { id: 'bs-rounded', name: '둥근 사각형', thumbnailColor: '#c5cae9' },
          { id: 'bs-circle', name: '원형', thumbnailColor: '#bbdefb' },
          { id: 'bs-line-h', name: '가로선', thumbnailColor: '#cfd8dc' },
          { id: 'bs-line-v', name: '세로선', thumbnailColor: '#cfd8dc' },
        ],
      },
      {
        id: 'basic-container',
        name: '컨테이너',
        thumbnailColor: '#e0f2f1',
        components: [
          { id: 'bs-frame', name: '프레임', thumbnailColor: '#b2dfdb' },
          { id: 'bs-card', name: '카드 컨테이너', thumbnailColor: '#e0f2f1' },
          { id: 'bs-section', name: '섹션 블록', thumbnailColor: '#c8e6c9' },
          { id: 'bs-sidebar-block', name: '사이드 블록', thumbnailColor: '#b2dfdb' },
        ],
      },
      {
        id: 'basic-text',
        name: '텍스트',
        thumbnailColor: '#f5f5f5',
        components: [
          { id: 'bs-h1', name: '대제목 (H1)', thumbnailColor: '#e0e0e0' },
          { id: 'bs-h2', name: '소제목 (H2)', thumbnailColor: '#eeeeee' },
          { id: 'bs-body', name: '본문', thumbnailColor: '#f5f5f5' },
          { id: 'bs-caption', name: '캡션', thumbnailColor: '#fafafa' },
          { id: 'bs-label', name: '라벨', thumbnailColor: '#e0e0e0' },
        ],
      },
      {
        id: 'basic-button',
        name: '버튼',
        thumbnailColor: '#e3f2fd',
        components: [
          { id: 'bs-primary', name: '기본 버튼', thumbnailColor: '#bbdefb' },
          { id: 'bs-outlined', name: '아웃라인 버튼', thumbnailColor: '#e3f2fd' },
          { id: 'bs-pill', name: '알약형 버튼', thumbnailColor: '#c8e6c9' },
          { id: 'bs-icon-btn', name: '아이콘 버튼', thumbnailColor: '#e8eaf6' },
          { id: 'bs-link-btn', name: '링크 버튼', thumbnailColor: '#e3f2fd' },
        ],
      },
    ],
  },
];


function getComponentBlueprint(comp: FolderComponent) {
  const n = comp.name;

  // Detail page - wide components (860px canvas)
  if (n.includes('배너') || n.includes('히어로')) {
    return { width: 760, height: 300, fill: comp.thumbnailColor, borderRadius: 0 };
  }
  if (n.includes('헤더')) {
    return { width: 760, height: 200, fill: comp.thumbnailColor, borderRadius: 0 };
  }
  if (n.includes('풀폭') || n.includes('라이프스타일 컷')) {
    return { width: 760, height: 400, fill: comp.thumbnailColor, borderRadius: 0 };
  }
  if (n.includes('섹션 구분') || n.includes('구분선') || n.includes('장식 라인')) {
    return { width: 760, height: 2, fill: '#e0e0e0', borderRadius: 0 };
  }
  if (n.includes('여백')) {
    return { width: 760, height: 60, fill: 'transparent', borderRadius: 0 };
  }
  if (n.includes('테이블') || n.includes('스펙') || n.includes('가이드')) {
    return { width: 700, height: 280, fill: comp.thumbnailColor, borderRadius: 8 };
  }
  if (n.includes('리스트') || n.includes('특장점') || n.includes('혜택')) {
    return { width: 700, height: 240, fill: comp.thumbnailColor, borderRadius: 8 };
  }
  if (n.includes('카드') && n.includes('상품')) {
    return { width: 340, height: 420, fill: comp.thumbnailColor, borderRadius: 12 };
  }
  if (n.includes('블록') && (n.includes('설명') || n.includes('본문') || n.includes('Q&A'))) {
    return { width: 700, height: 200, fill: comp.thumbnailColor, borderRadius: 8 };
  }
  if (n.includes('타이틀') || n.includes('대제목') || n.includes('헤드라인')) {
    return { width: 700, height: 60, fill: comp.thumbnailColor, borderRadius: 0 };
  }
  if (n.includes('소제목') || n.includes('서브타이틀')) {
    return { width: 500, height: 40, fill: comp.thumbnailColor, borderRadius: 0 };
  }
  if (n.includes('본문') || n.includes('텍스트') && !n.includes('CTA')) {
    return { width: 700, height: 100, fill: comp.thumbnailColor, borderRadius: 0 };
  }
  if (n.includes('안내') || n.includes('고지') || n.includes('정보')) {
    return { width: 700, height: 160, fill: comp.thumbnailColor, borderRadius: 8 };
  }
  if (n.includes('그리드') || n.includes('갤러리')) {
    return { width: 700, height: 350, fill: comp.thumbnailColor, borderRadius: 8 };
  }
  if (n.includes('비교')) {
    return { width: 700, height: 300, fill: comp.thumbnailColor, borderRadius: 8 };
  }
  if (n.includes('후기') || n.includes('리뷰') || n.includes('포토 리뷰')) {
    return { width: 340, height: 240, fill: comp.thumbnailColor, borderRadius: 12 };
  }
  if (n.includes('카드') || n.includes('컨테이너')) {
    return { width: 340, height: 200, fill: comp.thumbnailColor, borderRadius: 12 };
  }

  // Badges / icons
  if (n.includes('배지') || n.includes('마크') || n.includes('NEW') || n.includes('MD') || n.includes('한정판')) {
    return { width: 80, height: 80, fill: comp.thumbnailColor, borderRadius: 40 };
  }
  if (n.includes('가격') || n.includes('할인') || n.includes('쿠폰') || n.includes('묶음')) {
    return { width: 240, height: 80, fill: comp.thumbnailColor, borderRadius: 8 };
  }

  // Buttons
  if (n.includes('버튼') || n.includes('구매') || n.includes('장바구니') || n.includes('문의') || n.includes('공유') || n.includes('찜')) {
    return { width: 280, height: 52, fill: comp.thumbnailColor, borderRadius: 8 };
  }
  if (n.includes('알약형')) {
    return { width: 200, height: 44, fill: comp.thumbnailColor, borderRadius: 22 };
  }
  if (n.includes('아이콘 버튼')) {
    return { width: 48, height: 48, fill: comp.thumbnailColor, borderRadius: 24 };
  }

  // Instagram feed (1:1)
  if (n.includes('포스트') || n.includes('피드') || n.includes('공지') && !n.includes('스토리')) {
    return { width: 400, height: 400, fill: comp.thumbnailColor, borderRadius: 0 };
  }
  // Instagram story (9:16)
  if (n.includes('스토리')) {
    return { width: 270, height: 480, fill: comp.thumbnailColor, borderRadius: 12 };
  }
  // Instagram reel cover (9:16)
  if (n.includes('릴스')) {
    return { width: 270, height: 480, fill: comp.thumbnailColor, borderRadius: 12 };
  }
  // Instagram carousel
  if (n.includes('캐러셀') || n.includes('슬라이드')) {
    return { width: 400, height: 500, fill: comp.thumbnailColor, borderRadius: 0 };
  }

  // Basic shapes
  if (n.includes('사각형')) {
    return { width: 200, height: 150, fill: comp.thumbnailColor, borderRadius: n.includes('둥근') ? 16 : 0 };
  }
  if (n.includes('원형')) {
    return { width: 150, height: 150, fill: comp.thumbnailColor, borderRadius: 75 };
  }
  if (n.includes('가로선')) {
    return { width: 400, height: 2, fill: '#94a3b8', borderRadius: 0 };
  }
  if (n.includes('세로선')) {
    return { width: 2, height: 300, fill: '#94a3b8', borderRadius: 0 };
  }
  if (n.includes('프레임') || n.includes('섹션 블록')) {
    return { width: 400, height: 300, fill: comp.thumbnailColor, borderRadius: 0 };
  }
  if (n.includes('캡션') || n.includes('라벨') || n.includes('해시태그')) {
    return { width: 300, height: 30, fill: comp.thumbnailColor, borderRadius: 0 };
  }
  if (n.includes('워터마크') || n.includes('로고')) {
    return { width: 120, height: 120, fill: comp.thumbnailColor, borderRadius: 8 };
  }
  if (n.includes('프로필')) {
    return { width: 300, height: 100, fill: comp.thumbnailColor, borderRadius: 12 };
  }
  if (n.includes('CTA') || n.includes('강조')) {
    return { width: 400, height: 60, fill: comp.thumbnailColor, borderRadius: 8 };
  }

  return { width: 300, height: 200, fill: comp.thumbnailColor, borderRadius: 8 };
}

/* ── Inline SVGs ── */

function SearchIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-gray-400 shrink-0">
      <path
        fill="currentColor"
        d="M11.5 6a5.5 5.5 0 0 1 4.226 9.019l2.127 2.127a.5.5 0 1 1-.707.707l-2.127-2.127A5.5 5.5 0 1 1 11.5 6m0 1a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-gray-400">
      <path
        fill="currentColor"
        d="M8.5 18a.5.5 0 0 0 .5-.5v-1.55a2.5 2.5 0 0 0 0-4.9V6.5a.5.5 0 0 0-1 0v4.55a2.501 2.501 0 0 0 0 4.9v1.55a.5.5 0 0 0 .5.5m7 0a.5.5 0 0 0 .5-.5v-4.55a2.501 2.501 0 0 0 0-4.9V6.5a.5.5 0 0 0-1 0v1.55a2.5 2.5 0 0 0 0 4.9v4.55a.5.5 0 0 0 .5.5m0-6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m-7 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 16 16" className="text-gray-400 shrink-0">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M5.646 12.354a.5.5 0 0 1 0-.708L8.793 8.5 5.646 5.354a.5.5 0 0 1 .708-.708l3.5 3.5a.5.5 0 0 1 0 .708l-3.5 3.5a.5.5 0 0 1-.708 0"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CommunityBadgeIcon() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 16 16" className="text-gray-400">
      <path
        fill="currentColor"
        d="M12.01 5.694a.75.75 0 0 1 .991.71v4.287c0 .379-.215.724-.553.894l-4.723 2.362a.5.5 0 0 1-.448 0l-4.723-2.362a1 1 0 0 1-.555-.894V6.404c0-.522.518-.873.993-.71l.094.04L7.5 7.94l4.414-2.207zM3 10.691l4 2V8.808l-4-2zm5-1.882v3.881l4-1.999V6.81zM7.501 2a2 2 0 1 1-.002 4.002A2 2 0 0 1 7.501 2m0 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2"
      />
    </svg>
  );
}

/* ── Main Component ── */

export default function AssetPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLibrary, setSelectedLibrary] = useState<Library | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<LibraryFolder | null>(null);

  const filteredLibraries = MOCK_LIBRARIES.filter((lib) =>
    lib.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFolders = selectedLibrary?.folders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredComponents = selectedFolder?.components.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addFrameElement = useEditorStore((s) => s.addFrameElement);
  const addTextElement = useEditorStore((s) => s.addTextElement);
  const updateElement = useEditorStore((s) => s.updateElement);
  const moveToFrame = useEditorStore((s) => s.moveToFrame);

  const handleAddComponent = useCallback((comp: FolderComponent, x = 100, y = 100) => {
    const bp = getComponentBlueprint(comp);
    const frameId = addFrameElement(x, y);
    updateElement(frameId, {
      width: bp.width,
      height: bp.height,
      fill: bp.fill,
      borderRadius: bp.borderRadius,
      stroke: 'transparent',
      strokeWidth: 0,
      name: comp.name,
    });
    const textId = addTextElement(comp.name);
    updateElement(textId, {
      x: x + 10,
      y: y + Math.round(bp.height / 2) - 10,
      width: bp.width - 20,
      height: 20,
      textAlign: 'center' as const,
      fontSize: 13,
      color: '#333333',
    });
    moveToFrame([textId], frameId);
  }, [addFrameElement, addTextElement, updateElement, moveToFrame]);

  const handleDragStart = useCallback((e: React.DragEvent, comp: FolderComponent) => {
    const bp = getComponentBlueprint(comp);
    const payload = JSON.stringify({ ...comp, blueprint: bp });
    e.dataTransfer.setData('application/asset-component', payload);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const currentSlide = selectedFolder ? 2 : selectedLibrary ? 1 : 0;

  const searchPlaceholder = selectedFolder
    ? `Search ${selectedFolder.name}`
    : selectedLibrary
      ? `Search ${selectedLibrary.name}`
      : 'Search all libraries';

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-gray-200">
        <div className="flex items-center gap-1.5 flex-1 bg-gray-100 rounded px-2 py-1">
          <SearchIcon />
          <input
            type="text"
            placeholder={searchPlaceholder}
            spellCheck={false}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-[11px] text-gray-700 placeholder-gray-400 outline-none"
          />
        </div>
        <button
          type="button"
          title="Libraries and settings"
          className="p-1 rounded hover:bg-gray-100 transition-colors"
        >
          <SettingsIcon />
        </button>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center px-2 py-1.5 border-b border-gray-100">
        <nav className="flex items-center gap-1 overflow-hidden text-[11px]">
          <button
            type="button"
            onClick={() => {
              setSelectedLibrary(null);
              setSelectedFolder(null);
              setSearchQuery('');
            }}
            className={`font-medium truncate transition-colors shrink-0 ${
              selectedLibrary
                ? 'text-blue-500 hover:text-blue-600 cursor-pointer'
                : 'text-gray-700 cursor-default'
            }`}
          >
            All libraries
          </button>
          {selectedLibrary && (
            <>
              <ChevronRightIcon />
              <button
                type="button"
                onClick={() => {
                  setSelectedFolder(null);
                  setSearchQuery('');
                }}
                className={`font-medium truncate transition-colors ${
                  selectedFolder
                    ? 'text-blue-500 hover:text-blue-600 cursor-pointer'
                    : 'text-gray-700 cursor-default'
                }`}
              >
                {selectedLibrary.name}
              </button>
            </>
          )}
          {selectedFolder && (
            <>
              <ChevronRightIcon />
              <span className="text-gray-700 font-medium truncate">
                {selectedFolder.name}
              </span>
            </>
          )}
        </nav>
      </div>

      {/* Slide Carousel */}
      <div className="flex-1 overflow-hidden relative">
        <div
          className="flex h-full transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {/* View 1: Library List */}
          <div className="w-full shrink-0 overflow-y-auto">
            <div className="flex flex-col gap-2 p-2">
              {filteredLibraries.map((lib) => (
                <button
                  key={lib.id}
                  type="button"
                  onClick={() => {
                    setSelectedLibrary(lib);
                    setSearchQuery('');
                  }}
                  className="group w-full rounded-lg border border-gray-200 overflow-hidden hover:shadow-sm hover:border-gray-300 transition-all text-left"
                >
                  {/* Cover */}
                  <div
                    className={`h-[100px] bg-gradient-to-br ${lib.gradient} relative`}
                  >
                    <div className="absolute inset-0 bg-black/5" />
                  </div>
                  {/* Footer */}
                  <div className="px-2.5 py-2">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-[11px] font-medium text-gray-800 truncate flex-1">
                        {lib.name}
                      </h3>
                      <CommunityBadgeIcon />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {lib.componentCount} components
                    </p>
                  </div>
                </button>
              ))}

              {/* Add more libraries button */}
              <button
                type="button"
                className="w-full py-2 text-[11px] font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors mt-1"
              >
                Add more libraries
              </button>
            </div>
          </div>

          {/* View 2: Folder List */}
          <div className="w-full shrink-0 overflow-y-auto">
            {selectedLibrary && (
              <div className="flex flex-col">
                {(filteredFolders ?? []).map((folder, idx) => (
                  <div key={folder.id}>
                    {idx > 0 && <div className="mx-2 border-t border-gray-100" />}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFolder(folder);
                        setSearchQuery('');
                      }}
                      className="flex items-center gap-2.5 w-full px-2 py-2.5 hover:bg-gray-50 transition-colors text-left"
                    >
                      {/* Thumbnail */}
                      <div
                        className="w-[48px] h-[48px] rounded-md border border-gray-200 shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: folder.thumbnailColor, padding: 5 }}
                      >
                        <div className="w-full h-full rounded bg-gray-300/50" />
                      </div>
                      {/* Name */}
                      <span className="flex-1 text-[11px] font-medium text-gray-700 truncate">
                        {folder.name}
                      </span>
                      <ChevronRightIcon />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* View 3: Component Grid */}
          <div className="w-full shrink-0 overflow-y-auto">
            {selectedFolder && (
              <div className="grid grid-cols-2 gap-2 p-2">
                {(filteredComponents ?? []).map((comp) => (
                  <button
                    key={comp.id}
                    type="button"
                    draggable
                    onDragStart={(e) => handleDragStart(e, comp)}
                    onClick={() => handleAddComponent(comp)}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors text-center group cursor-grab active:cursor-grabbing"
                  >
                    <div
                      className="w-[96px] h-[96px] rounded-md border border-gray-200 flex items-center justify-center shrink-0"
                      style={{ backgroundColor: comp.thumbnailColor }}
                    >
                      <div className="w-3/4 h-3/4 rounded bg-gray-300/40" />
                    </div>
                    <div className="flex items-center gap-1 w-full min-w-0">
                      <span className="text-[11px] text-gray-700 font-medium truncate flex-1">
                        {comp.name}
                      </span>
                      <ChevronRightIcon />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
