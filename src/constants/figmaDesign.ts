/**
 * 피그마 디자인 자료모음 — 6페이지 슬라이드 데이터
 *
 * 원본: Figma "상세페이지 디자인 자료모음(공유)"
 * 캔버스: 960×640 per slide
 * 모든 요소는 개별 편집 가능 (낱개 관리)
 */

import { v4 as uuid } from 'uuid';
import type {
  Project,
  Page,
  Layer,
  CanvasElement,
  TextElement,
  ShapeElement,
  ImageElement,
  FontWeight,
  TextAlign,
} from '@/types/editor';

// ─── Constants ───────────────────────────────────────────────────────────────

const FONT = 'Pretendard, sans-serif';
const W = 960;
const H = 640;

// Color palette (consistent across slides)
const C = {
  navy: '#07021B',
  white: '#FFFFFF',
  gray100: '#F5F5F7',
  gray200: '#E8E8E8',
  gray400: '#999999',
  gray600: '#666666',
  gray800: '#333333',
  gray900: '#222222',
  accent: '#4A6FA5',
  accentLight: '#7B9FCC',
  purple: '#7F7494',
  purpleDark: '#5C4F70',
  blue100: '#BBDEFB',
  blue200: '#90CAF9',
  blue300: '#64B5F6',
  blue400: '#42A5F5',
  blue500: '#2196F3',
  blue600: '#1E88E5',
  blue700: '#1565C0',
  blue800: '#0D47A1',
  blue900: '#1A237E',
};

// ─── Element Factories ───────────────────────────────────────────────────────

function t(
  x: number, y: number, w: number, h: number,
  content: string, fontSize: number, color: string,
  fontWeight: FontWeight = 'normal', textAlign: TextAlign = 'left',
  lineHeight = 1.4, letterSpacing = 0, opacity = 1,
  name?: string,
): TextElement {
  return {
    id: uuid(), type: 'text',
    x, y, width: w, height: h,
    content, fontFamily: FONT, fontSize, fontWeight,
    fontStyle: 'normal', color, textAlign, lineHeight, letterSpacing,
    textDecoration: 'none',
    textShadow: { enabled: false, color: 'rgba(0,0,0,0.5)', offsetX: 2, offsetY: 2, blur: 4 },
    textStroke: { enabled: false, color: '#000000', width: 1 },
    textBackground: '',
    rotation: 0, opacity, locked: false, visible: true, editable: true,
    ...(name ? { name } : {}),
  };
}

function s(
  shape: 'rect' | 'circle' | 'line',
  x: number, y: number, w: number, h: number,
  fill: string, stroke = 'transparent', strokeWidth = 0,
  borderRadius = 0, opacity = 1, name?: string,
): ShapeElement {
  return {
    id: uuid(), type: 'shape', shape,
    x, y, width: w, height: h,
    fill, stroke, strokeWidth, borderRadius,
    rotation: 0, opacity, locked: false, visible: true, editable: false,
    ...(name ? { name } : {}),
  };
}

function img(
  x: number, y: number, w: number, h: number,
  src = '', placeholder = '', name?: string,
): ImageElement {
  return {
    id: uuid(), type: 'image',
    x, y, width: w, height: h,
    src, scaleMode: 'fill', crop: null,
    filters: { brightness: 0, contrast: 0, saturation: 0, blur: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0 },
    filterPreset: null,
    rotation: 0, opacity: 1, locked: false, visible: true, editable: true,
    placeholder,
    ...(name ? { name } : {}),
  };
}

function makePage(name: string, elements: CanvasElement[]): Page {
  const layer: Layer = {
    id: uuid(),
    name: '레이어 1',
    visible: true,
    locked: false,
    opacity: 1,
    elementIds: elements.map((e) => e.id),
  };
  return {
    id: uuid(),
    name,
    elements,
    layers: [layer],
    layerOrder: elements.map((e) => e.id),
  };
}

// ─── Page 1: 표지 (Cover) ────────────────────────────────────────────────────
// Background: #07021B — Figma 원본 기준 정확 추출

function buildCoverPage(): Page {
  const els: CanvasElement[] = [];

  // Full-canvas background (Figma: 표지 frame fill #07021B)
  els.push(s('rect', 0, 0, W, H, C.navy, 'transparent', 0, 0, 1, '배경'));

  // Decorative frame (Frame 25) — subtle accent shape
  els.push(s('rect', 680, 80, 200, 200, 'rgba(127,116,148,0.08)', 'transparent', 0, 16, 1, 'Frame 25'));

  // Figma logo placeholder
  els.push(img(208, 80, 48, 48, '', 'Figma 로고', 'figma_logo 1'));

  // "Figma" label
  els.push(t(208, 146, 58, 24, 'Figma', 20, C.white, 'bold', 'left', 1.2, 0, 1, 'Figma'));

  // "온라인셀러를 위한" subtitle
  els.push(t(208, 225, 283, 40, '온라인셀러를 위한', 28, C.white, 'bold', 'left', 1.3, 0, 1, '온라인셀러를 위한'));

  // "상세페이지 만들기" main title — Figma: 58.33px Bold Pretendard, letterSpacing -1%
  els.push(t(208, 296, 413, 70, '상세페이지 만들기', 58, C.white, 'bold', 'left', 1.1, -0.58, 1, '상세페이지 만들기'));

  // "리디드로우의 피그마 강의" — Figma: 30px Bold #7F7494, letterSpacing -2%
  els.push(t(209, 378, 292, 36, '리디드로우의 피그마 강의', 30, C.purple, 'bold', 'left', 1.2, -0.6, 1, '리디드로우의 피그마 강의'));

  // Bottom-right branding (Frame 1 — Figma auto layout)
  // Figma: logo 1 이미지 + "리디드로우 @rddraw" 단일 텍스트
  els.push(s('rect', 720, 568, 210, 52, 'rgba(127,116,148,0.12)', 'transparent', 0, 20, 1, 'Frame 1'));
  els.push(img(730, 574, 32, 32, '', '브랜드 로고', 'logo 1'));
  els.push(t(770, 575, 150, 38, '리디드로우\n@rddraw', 13, C.purple, 'bold', 'left', 1.6, 0, 0.9, '리디드로우 @rddraw'));

  return makePage('표지', els);
}

// ─── Page 2: 목차 (Table of Contents) ────────────────────────────────────────
// Frame "9" — 목차: 이미지/컬러/폰트 카테고리

function buildTocPage(): Page {
  const els: CanvasElement[] = [];

  // Section header
  els.push(t(80, 60, 200, 52, '목차', 44, C.gray900, 'bold', 'left', 1.1, 0, 1, '목차 타이틀'));
  els.push(s('rect', 80, 118, 48, 4, C.accent, 'transparent', 0, 2, 1, '타이틀 악센트'));
  els.push(t(80, 135, 400, 24, '상세페이지 디자인에 필요한 핵심 가이드', 15, C.gray400, 'normal', 'left', 1.4, 0, 1, '목차 설명'));

  // Item 01: 이미지
  els.push(t(80, 210, 80, 70, '01', 56, C.gray200, 'bold', 'left', 1, 0, 1, '01 번호'));
  els.push(t(170, 218, 300, 32, '이미지', 26, C.gray900, 'bold', 'left', 1.2, 0, 1, '이미지 제목'));
  els.push(t(170, 255, 450, 22, '상세페이지에 사용할 고품질 이미지 소스 찾기', 15, C.gray600, 'normal', 'left', 1.4, 0, 1, '이미지 설명'));
  els.push(s('line', 80, 300, 500, 0, 'transparent', C.gray200, 1, 0, 1, '구분선 1'));

  // Item 02: 컬러
  els.push(t(80, 330, 80, 70, '02', 56, C.gray200, 'bold', 'left', 1, 0, 1, '02 번호'));
  els.push(t(170, 338, 300, 32, '컬러', 26, C.gray900, 'bold', 'left', 1.2, 0, 1, '컬러 제목'));
  els.push(t(170, 375, 450, 22, '효과적인 색상 팔레트 구성 및 활용법', 15, C.gray600, 'normal', 'left', 1.4, 0, 1, '컬러 설명'));
  els.push(s('line', 80, 420, 500, 0, 'transparent', C.gray200, 1, 0, 1, '구분선 2'));

  // Item 03: 폰트
  els.push(t(80, 450, 80, 70, '03', 56, C.gray200, 'bold', 'left', 1, 0, 1, '03 번호'));
  els.push(t(170, 458, 300, 32, '폰트', 26, C.gray900, 'bold', 'left', 1.2, 0, 1, '폰트 제목'));
  els.push(t(170, 495, 450, 22, '가독성 높은 타이포그래피 선택 가이드', 15, C.gray600, 'normal', 'left', 1.4, 0, 1, '폰트 설명'));

  // Right-side decorative area
  els.push(s('rect', 660, 180, 220, 380, C.gray100, 'transparent', 0, 16, 1, '우측 장식'));
  els.push(t(690, 340, 160, 60, '💡', 48, C.gray900, 'normal', 'center', 1, 0, 0.3, '장식 아이콘'));
  els.push(t(670, 410, 200, 40, '핵심 가이드\n3가지', 16, C.gray600, 'normal', 'center', 1.5, 0, 0.6, '장식 텍스트'));

  // Page number
  els.push(t(880, 600, 40, 20, '02', 13, C.gray400, 'normal', 'right', 1, 0, 0.6, '페이지 번호'));

  return makePage('목차', els);
}

// ─── Page 3: 폰트가이드 (Font Guide) ─────────────────────────────────────────
// Frame "10" — Poppins, 구글폰트/dafont/1001fonts

function buildFontGuidePage(): Page {
  const els: CanvasElement[] = [];

  // Header
  els.push(t(80, 50, 300, 44, '폰트가이드', 36, C.gray900, 'bold', 'left', 1.1, 0, 1, '폰트가이드 타이틀'));
  els.push(s('rect', 80, 100, 48, 4, C.accent, 'transparent', 0, 2, 1, '타이틀 악센트'));

  // Featured font: Poppins showcase
  els.push(s('rect', 80, 135, 800, 200, C.gray100, 'transparent', 0, 12, 1, '폰트 쇼케이스 배경'));
  els.push(t(120, 155, 720, 60, 'Poppins', 52, C.gray900, 'bold', 'left', 1.1, -0.5, 1, 'Poppins 타이틀'));
  els.push(t(120, 225, 720, 30, 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm', 20, C.gray600, 'normal', 'left', 1.3, 0, 1, '영문 샘플'));
  els.push(t(120, 260, 720, 30, 'Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz', 20, C.gray600, 'normal', 'left', 1.3, 0, 1, '영문 샘플 2'));
  els.push(t(120, 295, 720, 24, '0 1 2 3 4 5 6 7 8 9  !@#$%^&*()', 16, C.gray400, 'normal', 'left', 1.3, 0, 1, '숫자 샘플'));

  // Font resource cards
  els.push(t(80, 365, 400, 28, '무료 폰트 리소스', 20, C.gray900, 'bold', 'left', 1.2, 0, 1, '리소스 섹션 타이틀'));

  // Card 1: 구글 폰트
  els.push(s('rect', 80, 405, 250, 120, C.white, C.gray200, 1, 12, 1, '구글폰트 카드'));
  els.push(t(100, 420, 210, 28, '구글 폰트', 18, C.gray900, 'bold', 'left', 1.2, 0, 1, '구글폰트 타이틀'));
  els.push(t(100, 452, 210, 20, 'Google Fonts', 14, C.accent, 'normal', 'left', 1.2, 0, 1, '구글폰트 영문'));
  els.push(t(100, 478, 210, 36, '무료 웹폰트 최대 컬렉션\n한글 폰트 다수 보유', 13, C.gray600, 'normal', 'left', 1.5, 0, 1, '구글폰트 설명'));

  // Card 2: dafont
  els.push(s('rect', 355, 405, 250, 120, C.white, C.gray200, 1, 12, 1, 'dafont 카드'));
  els.push(t(375, 420, 210, 28, 'DaFont', 18, C.gray900, 'bold', 'left', 1.2, 0, 1, 'dafont 타이틀'));
  els.push(t(375, 452, 210, 20, 'dafont.com', 14, C.accent, 'normal', 'left', 1.2, 0, 1, 'dafont URL'));
  els.push(t(375, 478, 210, 36, '다양한 영문 디스플레이 폰트\n카테고리별 분류 제공', 13, C.gray600, 'normal', 'left', 1.5, 0, 1, 'dafont 설명'));

  // Card 3: 1001fonts
  els.push(s('rect', 630, 405, 250, 120, C.white, C.gray200, 1, 12, 1, '1001fonts 카드'));
  els.push(t(650, 420, 210, 28, '1001 Fonts', 18, C.gray900, 'bold', 'left', 1.2, 0, 1, '1001fonts 타이틀'));
  els.push(t(650, 452, 210, 20, '1001fonts.com', 14, C.accent, 'normal', 'left', 1.2, 0, 1, '1001fonts URL'));
  els.push(t(650, 478, 210, 36, '무료 상업용 폰트 다수\n라이선스 확인 용이', 13, C.gray600, 'normal', 'left', 1.5, 0, 1, '1001fonts 설명'));

  // Tip box
  els.push(s('rect', 80, 545, 800, 55, 'rgba(74,111,165,0.08)', 'transparent', 0, 8, 1, '팁 배경'));
  els.push(t(100, 555, 760, 36, '💡 Tip: 상세페이지에는 2~3종의 폰트만 사용하세요. 본문은 Pretendard, 타이틀은 포인트 폰트를 추천합니다.', 13, C.accent, 'normal', 'left', 1.5, 0, 1, '폰트 팁'));

  // Page number
  els.push(t(880, 600, 40, 20, '03', 13, C.gray400, 'normal', 'right', 1, 0, 0.6, '페이지 번호'));

  return makePage('폰트가이드', els);
}

// ─── Page 4: 색상가이드 (Color Guide) ────────────────────────────────────────
// Frame "11" — 블루계열 예시, Plugin: Coolors

function buildColorGuidePage(): Page {
  const els: CanvasElement[] = [];

  // Header
  els.push(t(80, 50, 300, 44, '색상가이드', 36, C.gray900, 'bold', 'left', 1.1, 0, 1, '색상가이드 타이틀'));
  els.push(s('rect', 80, 100, 48, 4, C.accent, 'transparent', 0, 2, 1, '타이틀 악센트'));

  // Subtitle
  els.push(t(80, 120, 600, 24, '블루계열 색상 팔레트 예시', 16, C.gray600, 'normal', 'left', 1.4, 0, 1, '색상가이드 설명'));

  // Color swatches row — 5 blue shades
  const swatchW = 140;
  const swatchH = 160;
  const swatchGap = 20;
  const swatchStartX = 80;
  const swatchY = 170;
  const blues = [
    { color: C.blue900, hex: '#1A237E', label: 'Navy' },
    { color: C.blue700, hex: '#1565C0', label: 'Dark Blue' },
    { color: C.blue400, hex: '#42A5F5', label: 'Blue' },
    { color: C.blue200, hex: '#90CAF9', label: 'Light Blue' },
    { color: C.blue100, hex: '#BBDEFB', label: 'Pale Blue' },
  ];

  blues.forEach((b, i) => {
    const x = swatchStartX + i * (swatchW + swatchGap);
    els.push(s('rect', x, swatchY, swatchW, swatchH, b.color, 'transparent', 0, 12, 1, `색상 ${b.label}`));
    els.push(t(x, swatchY + swatchH + 10, swatchW, 20, b.hex, 14, C.gray800, 'bold', 'center', 1.2, 0, 1, `${b.label} hex`));
    els.push(t(x, swatchY + swatchH + 32, swatchW, 18, b.label, 12, C.gray400, 'normal', 'center', 1.2, 0, 1, `${b.label} 라벨`));
  });

  // Usage tips section
  els.push(t(80, 420, 400, 28, '색상 활용 가이드', 20, C.gray900, 'bold', 'left', 1.2, 0, 1, '활용 가이드 타이틀'));

  // Tip cards
  els.push(s('rect', 80, 460, 380, 70, C.gray100, 'transparent', 0, 10, 1, '주색상 팁 배경'));
  els.push(s('rect', 90, 470, 8, 50, C.blue700, 'transparent', 0, 4, 1, '주색상 악센트'));
  els.push(t(110, 470, 340, 22, '주 색상 (Primary)', 15, C.gray900, 'bold', 'left', 1.2, 0, 1, '주색상 라벨'));
  els.push(t(110, 495, 340, 28, 'CTA 버튼, 강조 영역에 사용', 13, C.gray600, 'normal', 'left', 1.5, 0, 1, '주색상 설명'));

  els.push(s('rect', 500, 460, 380, 70, C.gray100, 'transparent', 0, 10, 1, '보조색상 팁 배경'));
  els.push(s('rect', 510, 470, 8, 50, C.blue200, 'transparent', 0, 4, 1, '보조색상 악센트'));
  els.push(t(530, 470, 340, 22, '보조 색상 (Secondary)', 15, C.gray900, 'bold', 'left', 1.2, 0, 1, '보조색상 라벨'));
  els.push(t(530, 495, 340, 28, '배경, 구분선, 호버 상태에 사용', 13, C.gray600, 'normal', 'left', 1.5, 0, 1, '보조색상 설명'));

  // Plugin recommendation
  els.push(s('rect', 80, 555, 800, 50, 'rgba(74,111,165,0.08)', 'transparent', 0, 8, 1, '플러그인 추천 배경'));
  els.push(t(100, 563, 760, 30, '🎨 Plugin: Coolors — 색상 조합을 자동으로 생성해주는 도구. coolors.co에서 무료로 사용 가능합니다.', 13, C.accent, 'normal', 'left', 1.5, 0, 1, 'Coolors 추천'));

  // Page number
  els.push(t(880, 600, 40, 20, '04', 13, C.gray400, 'normal', 'right', 1, 0, 0.6, '페이지 번호'));

  return makePage('색상가이드', els);
}

// ─── Page 5: 추가가이드 1 (Extra Guide — Image Resources) ────────────────────
// Frame "8_1" — 이미지 소스 사이트 안내

function buildExtraGuide1Page(): Page {
  const els: CanvasElement[] = [];

  // Header
  els.push(t(80, 50, 300, 44, '추가가이드', 36, C.gray900, 'bold', 'left', 1.1, 0, 1, '추가가이드 타이틀'));
  els.push(s('rect', 80, 100, 48, 4, C.accent, 'transparent', 0, 2, 1, '타이틀 악센트'));
  els.push(t(80, 120, 600, 24, '무료 이미지 소스 사이트', 16, C.gray600, 'normal', 'left', 1.4, 0, 1, '추가가이드 설명'));

  // Resource cards — 3 across
  const cardW = 250;
  const cardH = 320;
  const cardGap = 25;
  const cardStartX = 80;
  const cardY = 170;
  const resources = [
    {
      name: 'Unsplash',
      url: 'unsplash.com',
      desc: '전 세계 사진작가들의\n고품질 무료 사진 컬렉션',
      features: '✓ 상업적 사용 가능\n✓ 출처 표기 불필요\n✓ 고해상도 다운로드',
      accent: '#111111',
    },
    {
      name: 'Pexels',
      url: 'pexels.com',
      desc: '무료 스톡 사진과\n영상을 한곳에서',
      features: '✓ 사진 + 영상 제공\n✓ 한국어 검색 지원\n✓ API 연동 가능',
      accent: '#05A081',
    },
    {
      name: 'Freepik',
      url: 'freepik.com',
      desc: '일러스트, 벡터, PSD,\n사진까지 올인원 리소스',
      features: '✓ 벡터/일러스트 풍부\n✓ PSD 템플릿 제공\n✓ 일부 프리미엄 제한',
      accent: '#0E60C9',
    },
  ];

  resources.forEach((r, i) => {
    const x = cardStartX + i * (cardW + cardGap);

    // Card background
    els.push(s('rect', x, cardY, cardW, cardH, C.white, C.gray200, 1, 12, 1, `${r.name} 카드`));

    // Top accent bar
    els.push(s('rect', x, cardY, cardW, 6, r.accent, 'transparent', 0, 0, 1, `${r.name} 악센트`));

    // Image placeholder area
    els.push(s('rect', x + 15, cardY + 20, cardW - 30, 80, C.gray100, 'transparent', 0, 8, 1, `${r.name} 이미지 영역`));
    els.push(t(x + 15, cardY + 45, cardW - 30, 30, '📷', 28, C.gray400, 'normal', 'center', 1, 0, 0.5, `${r.name} 아이콘`));

    // Name & URL
    els.push(t(x + 20, cardY + 115, cardW - 40, 28, r.name, 20, C.gray900, 'bold', 'left', 1.2, 0, 1, `${r.name} 이름`));
    els.push(t(x + 20, cardY + 145, cardW - 40, 20, r.url, 13, C.accent, 'normal', 'left', 1.2, 0, 1, `${r.name} URL`));

    // Description
    els.push(t(x + 20, cardY + 175, cardW - 40, 44, r.desc, 13, C.gray600, 'normal', 'left', 1.5, 0, 1, `${r.name} 설명`));

    // Features
    els.push(t(x + 20, cardY + 235, cardW - 40, 64, r.features, 12, C.gray400, 'normal', 'left', 1.6, 0, 1, `${r.name} 특징`));
  });

  // Bottom tip
  els.push(s('rect', 80, 520, 800, 50, 'rgba(74,111,165,0.08)', 'transparent', 0, 8, 1, '팁 배경'));
  els.push(t(100, 528, 760, 30, '💡 Tip: 상세페이지 이미지는 최소 1200px 이상 해상도를 권장합니다. 모바일에서도 선명하게 보입니다.', 13, C.accent, 'normal', 'left', 1.5, 0, 1, '이미지 팁'));

  // Page number
  els.push(t(880, 600, 40, 20, '05', 13, C.gray400, 'normal', 'right', 1, 0, 0.6, '페이지 번호'));

  return makePage('추가가이드 1', els);
}

// ─── Page 6: 추가가이드 2 (Extra Guide — Layout Tips) ────────────────────────
// Frame "8" — 레이아웃 및 디자인 팁

function buildExtraGuide2Page(): Page {
  const els: CanvasElement[] = [];

  // Header
  els.push(t(80, 50, 300, 44, '추가가이드', 36, C.gray900, 'bold', 'left', 1.1, 0, 1, '추가가이드 타이틀'));
  els.push(s('rect', 80, 100, 48, 4, C.accent, 'transparent', 0, 2, 1, '타이틀 악센트'));
  els.push(t(80, 120, 600, 24, '상세페이지 레이아웃 팁', 16, C.gray600, 'normal', 'left', 1.4, 0, 1, '추가가이드 설명'));

  // Tip 1: Width
  els.push(s('rect', 80, 175, 400, 140, C.gray100, 'transparent', 0, 12, 1, '팁1 배경'));
  els.push(s('rect', 80, 175, 6, 140, C.accent, 'transparent', 0, 0, 1, '팁1 악센트'));
  els.push(t(106, 190, 360, 28, '적정 가로 폭', 18, C.gray900, 'bold', 'left', 1.2, 0, 1, '팁1 타이틀'));
  els.push(t(106, 222, 360, 22, '860px', 28, C.accent, 'bold', 'left', 1.1, 0, 1, '팁1 수치'));
  els.push(t(106, 258, 360, 44, '모바일에서 보기 좋은 가로 너비입니다.\n네이버 스마트스토어 기준 권장 사이즈.', 13, C.gray600, 'normal', 'left', 1.6, 0, 1, '팁1 설명'));

  // Tip 2: Sections
  els.push(s('rect', 500, 175, 380, 140, C.gray100, 'transparent', 0, 12, 1, '팁2 배경'));
  els.push(s('rect', 500, 175, 6, 140, '#E8590C', 'transparent', 0, 0, 1, '팁2 악센트'));
  els.push(t(526, 190, 340, 28, '섹션 구분', 18, C.gray900, 'bold', 'left', 1.2, 0, 1, '팁2 타이틀'));
  els.push(t(526, 222, 340, 22, '7~10 섹션', 28, '#E8590C', 'bold', 'left', 1.1, 0, 1, '팁2 수치'));
  els.push(t(526, 258, 340, 44, '히어로 → 문제 제기 → 해결 → 특징 →\n리뷰 → CTA 순서로 구성하세요.', 13, C.gray600, 'normal', 'left', 1.6, 0, 1, '팁2 설명'));

  // Tip 3: Visual hierarchy
  els.push(s('rect', 80, 340, 400, 140, C.gray100, 'transparent', 0, 12, 1, '팁3 배경'));
  els.push(s('rect', 80, 340, 6, 140, '#7C3AED', 'transparent', 0, 0, 1, '팁3 악센트'));
  els.push(t(106, 355, 360, 28, '시각적 위계', 18, C.gray900, 'bold', 'left', 1.2, 0, 1, '팁3 타이틀'));
  els.push(t(106, 387, 360, 22, '3단계 텍스트', 28, '#7C3AED', 'bold', 'left', 1.1, 0, 1, '팁3 수치'));
  els.push(t(106, 423, 360, 44, '타이틀 (28~36px) → 소제목 (18~20px)\n→ 본문 (14~16px)으로 위계를 잡으세요.', 13, C.gray600, 'normal', 'left', 1.6, 0, 1, '팁3 설명'));

  // Tip 4: White space
  els.push(s('rect', 500, 340, 380, 140, C.gray100, 'transparent', 0, 12, 1, '팁4 배경'));
  els.push(s('rect', 500, 340, 6, 140, '#059669', 'transparent', 0, 0, 1, '팁4 악센트'));
  els.push(t(526, 355, 340, 28, '여백 활용', 18, C.gray900, 'bold', 'left', 1.2, 0, 1, '팁4 타이틀'));
  els.push(t(526, 387, 340, 22, '40~80px 마진', 28, '#059669', 'bold', 'left', 1.1, 0, 1, '팁4 수치'));
  els.push(t(526, 423, 340, 44, '충분한 여백은 콘텐츠의 가독성을\n높이고 고급스러운 느낌을 줍니다.', 13, C.gray600, 'normal', 'left', 1.6, 0, 1, '팁4 설명'));

  // Summary bar
  els.push(s('rect', 80, 510, 800, 60, C.navy, 'transparent', 0, 10, 1, '요약 바'));
  els.push(t(100, 525, 760, 30, '✨ 좋은 상세페이지 = 명확한 구조 + 적절한 여백 + 일관된 타이포그래피 + 고품질 이미지', 14, C.white, 'normal', 'left', 1.4, 0, 1, '요약 텍스트'));

  // Page number
  els.push(t(880, 600, 40, 20, '06', 13, C.gray400, 'normal', 'right', 1, 0, 0.6, '페이지 번호'));

  return makePage('추가가이드 2', els);
}

// ─── Project Factory ─────────────────────────────────────────────────────────

export function createFigmaDesignProject(): Project {
  const pages = [
    buildCoverPage(),
    buildTocPage(),
    buildFontGuidePage(),
    buildColorGuidePage(),
    buildExtraGuide1Page(),
    buildExtraGuide2Page(),
  ];

  return {
    id: uuid(),
    name: '상세페이지 디자인 자료모음',
    mode: 'design',
    isTemplate: false,
    preset: 'figma-slide',
    canvas: {
      width: W,
      height: H,
      backgroundColor: C.white,
    },
    pages,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
