/**
 * 몽고간장 송표 골드 상세페이지 — 레이어 분해 구성
 *
 * ┌─────────────────────────────────────────────────────┐
 * │  생각회로: JPG 1장 → 독립 레이어 7장으로 분해           │
 * │                                                     │
 * │  Layer 7. 텍스트 + 뱃지  → rect / circle / txt 직접  │
 * │  Layer 6. 송표골드 병    → 제품 이미지 (누끼 PNG)      │
 * │  Layer 5. 소품들         → 계란, 숟가락, 항아리        │
 * │  Layer 4. 음식 그릇      → 메인 그릇 + 반찬 그릇       │
 * │  Layer 3. 헝겊           → 체크 패턴 냅킨              │
 * │  Layer 2. 탁자           → 흰 원형 테이블 PNG          │
 * │  Layer 1. 배경색         → rect #C9B099 직접 생성      │
 * └─────────────────────────────────────────────────────┘
 *
 * z-order: 배열 뒤쪽 = 화면 위쪽 (Fabric.js canvas.add 순서)
 * 캔버스: 860px 고정 너비 (detail-page preset)
 */

import type {
  CanvasElement,
  TextElement,
  ShapeElement,
  ImageElement,
  FontWeight,
  TextAlign,
} from '@/types/editor';

// ─── 색상 팔레트 (스크린샷 픽셀 추출 기준) ──────────────────────────────────

const C = {
  heroBg:      '#C9B099',   // 배경 — 따뜻한 갈색 베이지 (스크린샷 주조색)
  darkBrown:   '#2C1A0A',   // 메인 타이틀 텍스트
  warmBrown:   '#7A6045',   // 보조 텍스트
  badgeBrown:  '#7A5C3A',   // 뱃지 원형 채우기 갈색
  badgeText:   '#FFFFFF',   // 뱃지 텍스트 흰색
  haccpTeal:   '#29B6C3',   // HACCP 하늘색 테두리
  haccpBlue:   '#1557A0',   // HACCP 텍스트 파란색
  haccpSmall:  '#333333',   // HACCP 작은 텍스트
  white:       '#FFFFFF',
};

const FONT = 'Pretendard, sans-serif';
const W = 860;

// ─── 팩토리 함수 ────────────────────────────────────────────────────────────

let _id = 0;
const nid = () => `mg-${String(_id++).padStart(3, '0')}`;

function t(
  x: number, y: number, w: number, h: number,
  content: string, fontSize: number, color: string,
  fontWeight: FontWeight = 'normal',
  textAlign: TextAlign = 'left',
  lineHeight = 1.35,
  letterSpacing = 0,
  name?: string,
): TextElement {
  return {
    id: nid(), type: 'text',
    x, y, width: w, height: h,
    content, fontFamily: FONT, fontSize, fontWeight,
    fontStyle: 'normal', color, textAlign, lineHeight, letterSpacing,
    textDecoration: 'none',
    textShadow: { enabled: false, color: 'rgba(0,0,0,0.4)', offsetX: 1, offsetY: 1, blur: 3 },
    textStroke: { enabled: false, color: '#000000', width: 1 },
    textBackground: '',
    rotation: 0, opacity: 1, locked: false, visible: true, editable: true,
    ...(name ? { name } : {}),
  };
}

function r(
  x: number, y: number, w: number, h: number,
  fill: string, stroke = 'transparent', strokeWidth = 0,
  borderRadius = 0, opacity = 1, name?: string,
): ShapeElement {
  return {
    id: nid(), type: 'shape', shape: 'rect',
    x, y, width: w, height: h,
    fill, stroke, strokeWidth, borderRadius,
    rotation: 0, opacity, locked: false, visible: true, editable: false,
    ...(name ? { name } : {}),
  };
}

function ci(
  x: number, y: number, d: number,
  fill: string, stroke = 'transparent', strokeWidth = 0,
  opacity = 1, name?: string,
): ShapeElement {
  return {
    id: nid(), type: 'shape', shape: 'circle',
    x, y, width: d, height: d,
    fill, stroke, strokeWidth, borderRadius: 0,
    rotation: 0, opacity, locked: false, visible: true, editable: false,
    ...(name ? { name } : {}),
  };
}

function im(
  x: number, y: number, w: number, h: number,
  placeholder: string, name?: string,
): ImageElement {
  return {
    id: nid(), type: 'image',
    x, y, width: w, height: h,
    src: '', scaleMode: 'fill', crop: null,
    filters: { brightness: 0, contrast: 0, saturation: 0, blur: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0 },
    filterPreset: null,
    rotation: 0, opacity: 1, locked: false, visible: true, editable: true,
    placeholder,
    ...(name ? { name } : {}),
  };
}

// ─── 메인 빌더 ──────────────────────────────────────────────────────────────

export function buildMonggoDetailElements(): CanvasElement[] {
  _id = 0;
  const els: CanvasElement[] = [];

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 1 — 히어로 (y: 0 → 1080)
  //
  // 레이어 순서: 배열 앞 = 뒤에 깔림 / 배열 뒤 = 앞으로 나옴
  //
  //  1. 배경색 rect          ← 맨 아래
  //  2. 탁자 이미지
  //  3. 헝겊 이미지
  //  4. 항아리 + 반찬 그릇   ← 배경 소품
  //  5. 메인 음식 그릇
  //  6. 나무 숟가락 + 계란   ← 소품
  //  7. 로고 + 캐치프레이즈  ← 텍스트
  //  8. 송표골드 병          ← 가장 앞
  //  9. 뱃지 (원형 + HACCP)  ← 맨 위
  // ══════════════════════════════════════════════════════════════════════════

  // ──────────────────────────────────────────────────────────────────────────
  // Layer 1: 배경색 (직접 생성 — rect)
  // 갈색 베이지 단색. 사진 배경 주조색 #C9B099 기준.
  // → 색상 변경은 우측 패널에서 Fill 수정
  // ──────────────────────────────────────────────────────────────────────────
  els.push(r(0, 0, W, 1080, C.heroBg, 'transparent', 0, 0, 1, '🎨 배경색'));

  // ──────────────────────────────────────────────────────────────────────────
  // Layer 2: 탁자 (이미지 교체 필요)
  // 흰색 원형 테이블 상면. 하단에 가로 가득 배치.
  // 권장: 배경 제거(누끼) PNG — 흰 원형 탁자 위에서 내려다본 각도
  // 검색어: "white round table top PNG transparent overhead"
  // ──────────────────────────────────────────────────────────────────────────
  els.push(im(
    -80, 500, W + 160, 580,
    '흰 원형 탁자\n(PNG 배경제거 권장)\n검색: white round table top PNG',
    '🪑 탁자',
  ));

  // ──────────────────────────────────────────────────────────────────────────
  // Layer 3: 체크 헝겊 / 냅킨 (이미지 교체 필요)
  // 파란+흰 체크 패턴 린넨 천. 그릇 아래에 깔림.
  // 권장: PNG 투명 배경 or 자연스러운 천 사진
  // 검색어: "checkered linen napkin cloth PNG transparent"
  // ──────────────────────────────────────────────────────────────────────────
  els.push(im(
    150, 560, 490, 390,
    '체크 패턴 냅킨/헝겊\n(PNG 배경제거 권장)\n검색: checkered linen cloth PNG',
    '🧣 체크 헝겊',
  ));

  // ──────────────────────────────────────────────────────────────────────────
  // Layer 4a: 항아리 (이미지 교체 필요)
  // 갈색 뚜껑 도자기 항아리. 우측 상단.
  // 검색어: "brown ceramic jar pot PNG transparent"
  // ──────────────────────────────────────────────────────────────────────────
  els.push(im(
    588, 420, 136, 138,
    '갈색 도자기 항아리\n(PNG 배경제거 권장)\n검색: ceramic jar PNG',
    '🏺 항아리',
  ));

  // ──────────────────────────────────────────────────────────────────────────
  // Layer 4b: 반찬 그릇 (이미지 교체 필요)
  // 작은 흰 그릇에 노란 반찬(감자조림 등). 우측 중간.
  // 검색어: "small white bowl side dish Korean food PNG transparent"
  // ──────────────────────────────────────────────────────────────────────────
  els.push(im(
    555, 528, 210, 175,
    '반찬 그릇 이미지\n(PNG 배경제거 권장)\n검색: Korean side dish bowl PNG',
    '🥣 반찬 그릇',
  ));

  // ──────────────────────────────────────────────────────────────────────────
  // Layer 5: 메인 음식 그릇 (이미지 교체 필요)
  // 베이지 도자기 큰 그릇, 계란볶음밥. 화면 중앙 하단.
  // 검색어: "Korean rice bowl ceramic PNG transparent egg fried rice"
  // ──────────────────────────────────────────────────────────────────────────
  els.push(im(
    215, 500, 415, 405,
    '메인 음식 그릇\n(계란볶음밥 담긴 도자기 그릇)\n(PNG 배경제거 권장)\n검색: rice bowl ceramic PNG transparent',
    '🍚 메인 음식 그릇',
  ));

  // ──────────────────────────────────────────────────────────────────────────
  // Layer 6a: 나무 숟가락 (이미지 교체 필요)
  // 긴 나무 재질 숟가락. 그릇 오른쪽 비스듬히 배치.
  // 검색어: "wooden spoon PNG transparent"
  // ──────────────────────────────────────────────────────────────────────────
  els.push(im(
    445, 705, 285, 115,
    '나무 숟가락\n(PNG 배경제거 권장)\n검색: wooden spoon PNG transparent',
    '🥄 나무 숟가락',
  ));

  // ──────────────────────────────────────────────────────────────────────────
  // Layer 6b: 계란 (이미지 교체 필요)
  // 생 계란 1개. 제품 병 뒤에 살짝 보임.
  // 검색어: "raw egg PNG transparent"
  // ──────────────────────────────────────────────────────────────────────────
  els.push(im(
    196, 555, 100, 84,
    '생 계란\n(PNG 배경제거 권장)\n검색: raw egg PNG transparent',
    '🥚 계란',
  ));

  // ──────────────────────────────────────────────────────────────────────────
  // Layer 7a: 몽고식품 스탬프 로고 (이미지 교체 필요)
  // 빨간 원형 "SINCE 1905" 스탬프. 상단 중앙.
  // → 공식 사이트 또는 브랜드 에셋에서 PNG 이미지 가져오기
  // ──────────────────────────────────────────────────────────────────────────
  els.push(im(
    382, 16, 96, 52,
    '몽고식품 스탬프 로고\n(SINCE 1905 빨간 원형 마크)\nPNG 배경제거',
    '🔴 몽고식품 스탬프',
  ));

  // Layer 7b: "몽고식품" 한글 텍스트
  els.push(t(0, 72, W, 38, '몽고식품', 28, C.darkBrown, 'bold', 'center', 1.2, 1.5, '몽고식품'));

  // Layer 7c: "MONGGO FOODS INC." 영문
  els.push(t(0, 112, W, 22, 'MONGGO FOODS INC.', 12, C.warmBrown, 'normal', 'center', 1.2, 2.5, 'MONGGO FOODS INC.'));

  // Layer 7d: 캐치프레이즈 — "120년 장맛으로 / 모든 요리에 착!"
  // 우측 상단 배치. 왼쪽 제품 병과 시각적으로 균형.
  els.push(t(300, 175, 530, 56, '120년 장맛으로', 42, C.darkBrown, 'bold', 'center', 1.15, -0.3, '캐치프레이즈 1행'));
  els.push(t(300, 238, 530, 56, '모든 요리에 착!', 42, C.darkBrown, 'bold', 'center', 1.15, -0.3, '캐치프레이즈 2행'));

  // ──────────────────────────────────────────────────────────────────────────
  // Layer 8: 송표골드 제품 병 (이미지 교체 필요) — 가장 앞
  // 검정 유리병 + 노란 라벨. 화면 좌측에 크게.
  // 권장: 누끼(배경제거) PNG — 공식 제품 이미지
  // 검색어: "몽고간장 송표골드 제품이미지" or 공식 홈페이지
  // ──────────────────────────────────────────────────────────────────────────
  els.push(im(
    38, 148, 262, 595,
    '송표골드 제품 병\n(PNG 배경제거 권장)\n— 검정 병체 + 노란 라벨\n공식 이미지 또는 쿠팡 제품 이미지 사용',
    '🍶 송표골드 제품 병',
  ));

  // ══════════════════════════════════════════════════════════════════════════
  // Layer 9: 뱃지 영역 (y: 855 → 1080) — 직접 생성 (코드로 완성)
  //
  // 3개 갈색 원형 뱃지 + HACCP 인증 원형
  // 모두 circle shape + text 로 구성 — 이미지 불필요
  // ══════════════════════════════════════════════════════════════════════════

  const bY  = 858;   // 뱃지 원 시작 y
  const bD  = 162;   // 뱃지 지름
  // 4열 균등 배치: col 0~2 = 갈색 뱃지, col 3 = HACCP
  const bX = (i: number) => 16 + i * 212;

  // ── 뱃지 1: "120년 프리미엄 양조간장" ────────────────────────────────────
  els.push(ci(bX(0), bY, bD, C.badgeBrown, 'transparent', 0, 1, '뱃지1 원'));
  els.push(t(bX(0), bY + 24, bD, 110, '120년\n프리미엄\n양조간장',
    17, C.badgeText, 'bold', 'center', 1.55, 0, '뱃지1 텍스트'));

  // ── 뱃지 2: "완벽한 맛의 밸런스" ─────────────────────────────────────────
  els.push(ci(bX(1), bY, bD, C.badgeBrown, 'transparent', 0, 1, '뱃지2 원'));
  els.push(t(bX(1), bY + 35, bD, 88, '완벽한\n맛의 밸런스',
    17, C.badgeText, 'bold', 'center', 1.55, 0, '뱃지2 텍스트'));

  // ── 뱃지 3: "볶음요리에 딱!" ──────────────────────────────────────────────
  els.push(ci(bX(2), bY, bD, C.badgeBrown, 'transparent', 0, 1, '뱃지3 원'));
  els.push(t(bX(2), bY + 35, bD, 88, '볶음요리에\n딱!',
    17, C.badgeText, 'bold', 'center', 1.55, 0, '뱃지3 텍스트'));

  // ── HACCP 인증 마크 ────────────────────────────────────────────────────────
  // 흰 원 + 하늘색 테두리 + "식품안전관리인증" + "HACCP" + 구분선 + "식품의약품안전처"
  const hX = bX(3);
  const hD = 162;

  // 흰 원 + 하늘색 테두리
  els.push(ci(hX, bY, hD, C.white, C.haccpTeal, 4, 1, 'HACCP 원'));

  // "식품안전관리인증"
  els.push(t(hX, bY + 18, hD, 22, '식품안전관리인증',
    11, C.haccpSmall, 'bold', 'center', 1.2, 0, 'HACCP 상단'));

  // "HACCP" 굵은 파란색 대문자
  els.push(t(hX, bY + 43, hD, 50, 'HACCP',
    34, C.haccpBlue, 'bold', 'center', 1.0, 1, 'HACCP 텍스트'));

  // 하늘색 곡선 구분선 (rect로 근사)
  els.push(r(hX + 22, bY + 98, hD - 44, 5, C.haccpTeal, 'transparent', 0, 3, 1, 'HACCP 구분선'));

  // "식품의약품안전처"
  els.push(t(hX, bY + 108, hD, 20, '식품의약품안전처',
    10, C.haccpSmall, 'normal', 'center', 1.2, 0, 'HACCP 하단'));

  return els;
}
