import type {
  BuiltInTemplate,
  TemplateCategory,
  CanvasElement,
  ImageElement,
  TextElement,
  ShapeElement,
  FrameElement,
  FontWeight,
  TextAlign,
} from '@/types/editor';

import { buildMonggoDetailElements } from './monggoDesign';
export const TEMPLATE_CATEGORIES: { key: TemplateCategory; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'fashion', label: '패션' },
  { key: 'beauty', label: '뷰티' },
  { key: 'food', label: '식품' },
  { key: 'electronics', label: '가전' },
  { key: 'interior', label: '인테리어' },
  { key: 'health', label: '건강' },
  { key: 'kids', label: '키즈' },
  { key: 'promotion', label: '프로모션' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const FONT = 'Pretendard, sans-serif';

function makeId(tplIdx: number) {
  let n = 0;
  return () => `t${String(tplIdx).padStart(2, '0')}-${String(n++).padStart(2, '0')}`;
}

function shape(
  id: string,
  s: 'rect' | 'circle' | 'line',
  x: number, y: number, w: number, h: number,
  fill: string, stroke = 'transparent', strokeWidth = 0, borderRadius = 0,
  opacity = 1, locked = true,
): ShapeElement {
  return {
    id, type: 'shape', shape: s,
    x, y, width: w, height: h,
    fill, stroke, strokeWidth, borderRadius,
    rotation: 0, opacity, locked, visible: true, editable: false,
  };
}

function text(
  id: string,
  x: number, y: number, w: number, h: number,
  content: string, fontSize: number, color: string,
  fontWeight: FontWeight = 'normal', textAlign: TextAlign = 'left',
  lineHeight = 1.4, opacity = 1,
): TextElement {
  return {
    id, type: 'text',
    x, y, width: w, height: h,
    content, fontFamily: FONT, fontSize, fontWeight, color, textAlign, lineHeight,
    fontStyle: 'normal',
    letterSpacing: 0,
    textDecoration: 'none',
    textShadow: { enabled: false, color: 'rgba(0,0,0,0.5)', offsetX: 2, offsetY: 2, blur: 4 },
    textStroke: { enabled: false, color: '#000000', width: 1 },
    textBackground: '',
    rotation: 0, opacity, locked: false, visible: true, editable: true,
  };
}

function image(
  id: string,
  x: number, y: number, w: number, h: number,
  src: string,
  placeholder = '상품 사진을 넣어주세요',
  opacity = 1,
): ImageElement {
  return {
    id, type: 'image',
    x, y, width: w, height: h,
    src, scaleMode: 'fill', crop: null,
    filters: { brightness: 0, contrast: 0, saturation: 0, blur: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0 },
    filterPreset: null,
    rotation: 0, opacity, locked: false, visible: true, editable: true,
    placeholder,
  };
}

// ─── Theme & Content ─────────────────────────────────────────────────────────

interface TplTheme {
  heroBg: string; heroText: string; accent: string;
  bodyBg: string; bodyText: string;
  ctaBg: string; ctaText: string; btnBg: string;
}

interface TplContent {
  productName: string; tagline: string;
  hookQuestion: string;
  painPoint: string;
  insight: string;
  brandStory: string;
  features: { title: string; desc: string }[];
  detailTitle: string; detailBody: string;
  reviews: { stars: number; text: string }[];
  ctaTitle: string; ctaSub: string;
}

// ─── Premium Template Builder ────────────────────────────────────────────────

function buildPremiumElements(
  idx: number,
  slug: string,
  theme: TplTheme,
  content: TplContent,
): CanvasElement[] {
  const id = makeId(idx);
  const els: CanvasElement[] = [];

  // ━━━ SECTION 1: HERO (0 → 950) ━━━
  els.push(shape(id(), 'rect', 0, 0, 860, 950, theme.heroBg));
  els.push(image(id(), 0, 0, 860, 950, `/templates/${slug}.jpg`, '분위기 있는 공간 사진을 넣어주세요'));
  els.push(shape(id(), 'rect', 0, 0, 860, 950, 'rgba(0,0,0,0.35)'));
  els.push(text(id(), 0, 180, 860, 30, content.tagline, 17, '#ffffff', 'normal', 'center', 1.4, 0.8));
  els.push(text(id(), 40, 260, 780, 200, content.productName, 48, '#ffffff', 'bold', 'center'));
  els.push(text(id(), 0, 700, 860, 60, '당신의 일상에\n특별함을 더하세요.', 17, '#ffffff', 'normal', 'center', 1.6, 0.7));

  // ━━━ SECTION 2: QUESTION (950 → 1350) ━━━
  els.push(shape(id(), 'rect', 0, 950, 860, 400, '#ffffff'));
  els.push(text(id(), 0, 1060, 860, 120, content.hookQuestion, 34, theme.bodyText, 'bold', 'center', 1.5));

  // ━━━ SECTION 3: LIFESTYLE + PAIN POINT (1350 → 2280) ━━━
  els.push(shape(id(), 'rect', 0, 1350, 860, 930, '#ffffff'));
  els.push(image(id(), 50, 1390, 760, 380, `/templates/${slug}.jpg`, '라이프스타일 이미지를 넣어주세요'));
  els.push(text(id(), 0, 1820, 860, 35, content.painPoint, 18, '#888888', 'normal', 'center'));
  els.push(text(id(), 0, 1862, 860, 40, '해답은 이미 있습니다.', 24, theme.bodyText, 'bold', 'center'));
  // Decorative dots
  els.push(shape(id(), 'circle', 426, 1940, 8, 8, '#cccccc'));
  els.push(shape(id(), 'circle', 426, 1962, 8, 8, '#cccccc'));
  els.push(shape(id(), 'circle', 426, 1984, 8, 8, '#cccccc'));
  els.push(text(id(), 0, 2040, 860, 65, content.insight, 18, '#555555', 'normal', 'center', 1.6));

  // ━━━ DIVIDER ━━━
  els.push(shape(id(), 'line', 80, 2270, 700, 0, 'transparent', '#e0e0e0', 1));

  // ━━━ SECTION 4: PRODUCT INTRO (2290 → 3450) ━━━
  els.push(shape(id(), 'rect', 0, 2290, 860, 1160, theme.heroBg));
  els.push(text(id(), 0, 2400, 860, 30, '특별한 가치를 전하는', 17, theme.heroText, 'normal', 'center', 1.4, 0.7));
  els.push(text(id(), 0, 2470, 860, 70, content.productName, 46, theme.heroText, 'bold', 'center'));
  els.push(text(id(), 0, 2580, 860, 55, content.tagline, 16, theme.heroText, 'normal', 'center', 1.7, 0.6));
  els.push(image(id(), 180, 2720, 500, 560, `/templates/${slug}.jpg`, '제품 대표 사진을 넣어주세요'));

  // ━━━ SECTION 5: BRAND STORY (3450 → 4280) ━━━
  els.push(shape(id(), 'rect', 0, 3450, 860, 830, '#f7f7f7'));
  els.push(shape(id(), 'rect', 60, 3510, 740, 280, '#ffffff', 'transparent', 0, 12));
  els.push(text(id(), 100, 3540, 660, 220, content.brandStory, 16, '#444444', 'normal', 'left', 1.8));
  // Feature bullets (first 3)
  const bulletFeats = content.features.slice(0, 3);
  bulletFeats.forEach((f, i) => {
    const by = 3860 + i * 50;
    els.push(shape(id(), 'rect', 85, by, 4, 28, theme.heroBg));
    els.push(text(id(), 105, by, 650, 28, f.title, 16, '#333333', 'bold'));
  });

  // ━━━ SECTION 6: FEATURES / LINEUP (4280 → 5350) ━━━
  els.push(shape(id(), 'rect', 0, 4280, 860, 1070, '#ffffff'));
  els.push(text(id(), 0, 4330, 860, 50, '어떤 제품이 당신에게 맞을까요?', 28, '#222222', 'bold', 'center'));
  els.push(text(id(), 0, 4390, 860, 30, '주요 특징을 확인해보세요', 15, '#888888', 'normal', 'center'));
  // 2×2 grid
  const cardColors = ['#faf5f0', '#f0ece4', '#f0e8e4', '#eae8e5'];
  const gridFeats = content.features.slice(0, 4);
  gridFeats.forEach((f, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = col === 0 ? 55 : 450;
    const cy = 4460 + row * 380;
    els.push(shape(id(), 'rect', cx, cy, 355, 350, cardColors[i] || '#f5f5f5', 'transparent', 0, 16));
    els.push(image(id(), cx + 20, cy + 20, 315, 190, `/templates/${slug}.jpg`, '제품 이미지'));
    els.push(text(id(), cx + 20, cy + 230, 315, 28, f.title, 18, '#333333', 'bold', 'center'));
    els.push(text(id(), cx + 20, cy + 265, 315, 50, f.desc, 13, '#888888', 'normal', 'center', 1.5));
  });

  // ━━━ SECTION 7: DETAILS (5350 → 5980) ━━━
  els.push(shape(id(), 'rect', 0, 5350, 860, 630, '#f9f6f2'));
  els.push(text(id(), 0, 5400, 860, 40, content.detailTitle, 28, '#222222', 'bold', 'center'));
  els.push(text(id(), 0, 5448, 860, 25, '꼭 확인해주세요', 15, '#888888', 'normal', 'center'));
  els.push(text(id(), 100, 5510, 660, 400, content.detailBody, 15, '#444444', 'normal', 'left', 1.8));

  // ━━━ SECTION 8: REVIEWS (5980 → 6650) ━━━
  els.push(shape(id(), 'rect', 0, 5980, 860, 670, '#ffffff'));
  els.push(text(id(), 0, 6030, 860, 40, '실제 구매 후기', 28, '#222222', 'bold', 'center'));
  els.push(text(id(), 0, 6078, 860, 25, '고객님들의 생생한 리뷰', 15, '#888888', 'normal', 'center'));
  content.reviews.slice(0, 3).forEach((r, i) => {
    const ry = 6140 + i * 160;
    els.push(shape(id(), 'rect', 60, ry, 740, 120, '#f9f9f9', 'transparent', 0, 12));
    const starStr = '★'.repeat(r.stars) + '☆'.repeat(5 - r.stars);
    els.push(text(id(), 85, ry + 15, 80, 20, starStr, 14, '#f0c040'));
    els.push(text(id(), 85, ry + 40, 690, 60, r.text, 14, '#555555', 'normal', 'left', 1.6));
  });

  // ━━━ SECTION 9: CTA (6650 → 7150) ━━━
  els.push(shape(id(), 'rect', 0, 6650, 860, 500, theme.ctaBg));
  els.push(shape(id(), 'circle', 380, 6680, 100, 100, 'rgba(255,255,255,0.05)'));
  els.push(shape(id(), 'circle', 680, 6800, 60, 60, 'rgba(255,255,255,0.03)'));
  els.push(text(id(), 0, 6790, 860, 50, content.ctaTitle, 36, theme.ctaText, 'bold', 'center'));
  els.push(text(id(), 0, 6860, 860, 30, content.ctaSub, 16, theme.ctaText, 'normal', 'center', 1.4, 0.7));
  els.push(shape(id(), 'rect', 280, 6940, 300, 56, theme.btnBg, 'transparent', 0, 28));
  els.push(text(id(), 280, 6950, 300, 36, '지금 구매하기', 18, theme.ctaBg, 'bold', 'center'));

  // ━━━ SECTION 10: FOOTER INFO (7150 → 7550) ━━━
  els.push(shape(id(), 'rect', 0, 7150, 860, 400, '#f5f5f5'));
  els.push(text(id(), 0, 7195, 860, 30, '배송 및 교환/반품 안내', 20, '#333333', 'bold', 'center'));
  els.push(shape(id(), 'line', 350, 7235, 160, 0, 'transparent', '#dddddd', 1));
  els.push(text(id(), 100, 7270, 660, 250, '배송비: 무료 (도서산간 지역 추가 3,000원)\n배송기간: 결제 완료 후 1~3일 이내 출고\n\n교환/반품: 수령 후 7일 이내 가능\n단, 사용 흔적이 있는 경우 교환/반품 불가\n\n고객센터: 1588-0000 (평일 10:00~18:00)', 14, '#666666', 'normal', 'center', 1.8));

  return els;
}

// ─── 16 Templates ────────────────────────────────────────────────────────────

const T01 = buildPremiumElements(1, '01-fruit-preserve',
  { heroBg: '#f6d365', heroText: '#5c3a0a', accent: '#e8590c', bodyBg: '#fff8e8', bodyText: '#3d2b1f', ctaBg: '#e8590c', ctaText: '#ffffff', btnBg: '#ffffff' },
  { productName: '프리미엄 과일 수제청', tagline: '엄선된 유기농 과일로 정성껏 만든 수제청',
    hookQuestion: '당신의 음료,\n정말 건강한가요?',
    painPoint: '매일 마시는 음료, 설탕과 첨가물이 걱정되시나요?',
    insight: '자연 그대로의 과일을 담은 수제청으로\n건강한 음료 습관을 시작하세요.',
    brandStory: '저희는 10년간 유기농 과일만을 고집해왔습니다.\n전남 담양의 농장에서 직접 재배한 과일을\n하나하나 손질하여 전통 방식으로 정성껏 담습니다.\n\n설탕 대신 올리고당, 방부제 대신 정성을 넣어\n가족 모두가 안심하고 즐길 수 있는 수제청을 만듭니다.',
    features: [
      { title: '100% 유기농 과일 사용', desc: '국내산 유기농 인증 과일만을 엄선하여 신선하게 담았습니다.' },
      { title: '무첨가 수제 공법', desc: '설탕, 방부제 없이 전통 방식으로 정성껏 만듭니다.' },
      { title: '다양한 과일 블렌딩', desc: '계절 과일의 자연스러운 조합으로 깊은 풍미를 완성합니다.' },
      { title: '간편한 활용법', desc: '탄산수, 요거트, 차 등 다양한 음료에 간편하게 활용 가능합니다.' },
    ],
    reviews: [
      { stars: 5, text: '"딸기청으로 에이드 만들어 먹으니 카페 안 가도 될 정도예요.\n과일 알갱이가 씹히는 게 진짜 수제 느낌!"' },
      { stars: 5, text: '"아이들 간식으로 요거트에 넣어주는데 설탕 없이도\n충분히 달아서 마음 놓고 먹일 수 있어요."' },
      { stars: 4, text: '"선물용으로 3세트 샀는데 포장이 예쁘고\n받는 분마다 맛있다고 재구매 문의가 와요."' },
    ],
    detailTitle: '제품 상세 정보',
    detailBody: '용량: 500ml | 원재료: 국내산 유기농 과일, 올리고당\n보관방법: 직사광선을 피해 서늘한 곳에 보관 (개봉 후 냉장보관)\n유통기한: 제조일로부터 6개월',
    ctaTitle: '자연의 맛을 담은 수제청', ctaSub: '지금 주문하면 무료 배송 혜택!' });

const T02 = buildPremiumElements(2, '02-sweet-potato',
  { heroBg: '#3c1810', heroText: '#ffffff', accent: '#daa520', bodyBg: '#f5ebe0', bodyText: '#3d2b1f', ctaBg: '#3c1810', ctaText: '#ffffff', btnBg: '#daa520' },
  { productName: '해남 꿀 호박고구마', tagline: '달콤하고 촉촉한 해남 직송 프리미엄 고구마',
    hookQuestion: '고구마,\n아무거나 드시고 계신가요?',
    painPoint: '퍽퍽하고 맛없는 고구마에 실망한 적 있으신가요?',
    insight: '30브릭스 이상의 자연 당도를 자랑하는\n해남 꿀 호박고구마를 만나보세요.',
    brandStory: '전남 해남의 황토밭에서 3대째 고구마를 재배하고 있습니다.\n최적의 토양과 해풍이 만들어내는 자연의 단맛,\n수확 후 45일간의 저온 숙성으로 당도를 극대화합니다.\n\n산지에서 당일 수확, 당일 발송으로\n가장 신선한 고구마를 식탁에 전합니다.',
    features: [
      { title: '해남 직송 프리미엄', desc: '전남 해남에서 직접 재배하고 산지에서 바로 배송합니다.' },
      { title: '꿀처럼 달콤한 당도', desc: '숙성 과정을 거쳐 당도 30브릭스 이상의 깊은 단맛을 냅니다.' },
      { title: '촉촉한 식감 보장', desc: '수분 함량이 높아 에어프라이어, 오븐 등 어떤 조리법에도 완벽합니다.' },
      { title: '엄격한 선별 과정', desc: '크기·외관·당도 3단계 선별로 최상품만 출하합니다.' },
    ],
    reviews: [
      { stars: 5, text: '"에어프라이어에 구웠더니 꿀이 흘러나와요.\n이 가격에 이 당도는 진짜 대박입니다."' },
      { stars: 5, text: '"아이 간식으로 매주 시키는데 한 번도 실망한 적 없어요.\n크기도 균일하고 하나같이 달아요."' },
      { stars: 5, text: '"부모님 댁에 보내드렸는데 너무 맛있다고\n다음에 또 보내달라고 하셨어요."' },
    ],
    detailTitle: '상품 상세',
    detailBody: '품종: 꿀 호박고구마 | 원산지: 전남 해남\n중량: 3kg, 5kg, 10kg 선택 가능\n등급: 특상품 (개당 200~350g)',
    ctaTitle: '산지직송 꿀고구마', ctaSub: '3kg 이상 주문 시 무료배송' });

const T03 = buildPremiumElements(3, '03-bakery',
  { heroBg: '#ffecd2', heroText: '#5a3e28', accent: '#c2703e', bodyBg: '#fff5ec', bodyText: '#5a3e28', ctaBg: '#c2703e', ctaText: '#ffffff', btnBg: '#ffffff' },
  { productName: '매일 굽는 수제 베이커리', tagline: '매일 아침, 갓 구운 빵의 따뜻한 향기',
    hookQuestion: '오늘 아침,\n어떤 빵을 드셨나요?',
    painPoint: '공장에서 만든 빵의 맛에 지치셨나요?',
    insight: '새벽 5시부터 시작하는 정성 가득 베이킹으로\n매일 가장 신선한 빵을 전합니다.',
    brandStory: '파리에서 10년간 수련한 셰프가 직접 운영하는\n소규모 아르티장 베이커리입니다.\n48시간 저온 숙성 천연 발효종만을 사용하며,\n\n프랑스산 최상급 밀가루와 무염 버터로\n매일 소량만 정성껏 구워냅니다.',
    features: [
      { title: '매일 새벽 직접 구운 빵', desc: '오전 5시부터 시작하는 베이킹으로 가장 신선한 빵을 제공합니다.' },
      { title: '프랑스산 밀가루 사용', desc: '최상급 프랑스산 밀가루로 풍미 깊은 맛을 완성합니다.' },
      { title: '100% 천연 발효종', desc: '48시간 저온 숙성 천연 발효종으로 건강한 빵을 만듭니다.' },
      { title: '당일 배송 시스템', desc: '오전 주문 시 당일 갓 구운 빵을 바로 배송합니다.' },
    ],
    reviews: [
      { stars: 5, text: '"사워도우 식감이 파리에서 먹던 것과 똑같아요.\n겉은 바삭하고 속은 쫀득한 게 완벽합니다."' },
      { stars: 5, text: '"크루아상이 결이 살아있어요. 버터 향이 진하고\n식감이 가벼워서 매주 정기 주문하고 있어요."' },
      { stars: 4, text: '"바게트가 정말 맛있는데 당일 안에 먹어야 해서\n그 점만 아쉬워요. 그만큼 신선하다는 뜻이겠죠."' },
    ],
    detailTitle: '베이커리 소개',
    detailBody: '대표 메뉴: 사워도우, 크루아상, 바게트, 치아바타\n원재료: 프랑스산 밀가루, 천연 발효종, 무염 버터, 해염',
    ctaTitle: '갓 구운 빵의 행복', ctaSub: '오늘 주문하면 내일 아침 도착!' });

const T04 = buildPremiumElements(4, '04-handmade-soap',
  { heroBg: '#d4a574', heroText: '#ffffff', accent: '#8b6914', bodyBg: '#f0ebe3', bodyText: '#4a3728', ctaBg: '#8b6914', ctaText: '#ffffff', btnBg: '#ffffff' },
  { productName: '천연 핸드메이드 수제 비누', tagline: '자연 그대로의 성분으로 만든 순한 비누',
    hookQuestion: '당신의 피부,\n무엇으로 씻고 계신가요?',
    painPoint: '화학 성분 가득한 세정제가 피부를 힘들게 하고 있진 않나요?',
    insight: '100% 천연 식물성 오일과 40일 숙성 공법으로\n피부가 편안해지는 비누를 만듭니다.',
    brandStory: '피부가 예민한 아이를 위해 시작한 수제 비누 공방입니다.\n올리브, 코코넛, 시어버터 등 천연 오일만을 사용하며,\n40일 이상의 저온 숙성 과정을 거쳐 완성합니다.\n\n무향료, 무색소, 무방부제 원칙을 철저히 지키며\n가족 모두가 안심하고 사용할 수 있는 비누를 만듭니다.',
    features: [
      { title: '100% 천연 식물성 오일', desc: '올리브, 코코넛, 팜 오일만을 사용한 저자극 비누입니다.' },
      { title: '저온 숙성 공법 (CP법)', desc: '40일 이상 저온 숙성으로 피부에 순한 비누를 완성합니다.' },
      { title: '무향료·무색소·무방부제', desc: '피부에 부담되는 화학 성분을 일절 넣지 않았습니다.' },
      { title: '개별 수제 포장', desc: '하나하나 정성껏 포장하여 선물용으로도 완벽합니다.' },
    ],
    reviews: [
      { stars: 5, text: '"아토피 있는 아이한테 써봤는데 하나도 안 자극적이에요.\n거품도 부드럽고 세정력도 좋아요."' },
      { stars: 5, text: '"향이 은은하고 자연스러워요. 쓸수록 피부가\n촉촉해지는 느낌이라 온 가족이 같이 써요."' },
      { stars: 4, text: '"선물용으로 샀는데 포장이 정말 예뻐요.\n받는 분마다 비누 어디서 샀냐고 물어보세요."' },
    ],
    detailTitle: '제품 성분 안내',
    detailBody: '주요 성분: 올리브 오일, 코코넛 오일, 시어버터, 천연 에센셜 오일\n중량: 100g ± 5g (수제품 특성상 소량 차이 있음)\nPH 농도: 8~9 (약알칼리성)',
    ctaTitle: '피부가 편안한 비누', ctaSub: '3개 이상 구매 시 10% 할인' });

const T05 = buildPremiumElements(5, '05-perfume',
  { heroBg: '#2c1654', heroText: '#ffffff', accent: '#e8b4d8', bodyBg: '#f8eef6', bodyText: '#2c1654', ctaBg: '#7b4397', ctaText: '#ffffff', btnBg: '#e8b4d8' },
  { productName: '시그니처 프리미엄 향수', tagline: '당신만의 특별한 향기, 하루를 완성하다',
    hookQuestion: '당신을 기억하게 만드는\n향기가 있나요?',
    painPoint: '남들과 같은 향수, 나만의 개성이 없다고 느끼셨나요?',
    insight: '프랑스 그라스 원료와 20년 경력 조향사의\n시그니처 블렌딩으로 나만의 향을 완성하세요.',
    brandStory: '향수의 수도 프랑스 그라스에서 공수한 최상급 천연 원료로\n20년 경력의 프렌치 조향사가 직접 블렌딩합니다.\n\n대중적인 향이 아닌, 소수만을 위한\n시그니처 향을 추구합니다.\nEDP 농도 20%로 아침부터 저녁까지 은은하게 지속됩니다.',
    features: [
      { title: '프랑스 그라스 원료', desc: '향수의 수도 그라스에서 공수한 최상급 천연 원료입니다.' },
      { title: '8시간 이상 지속력', desc: 'EDP 농도 20%로 아침부터 저녁까지 은은한 잔향이 남습니다.' },
      { title: '조향사 시그니처 블렌딩', desc: '20년 경력 프렌치 조향사의 섬세한 노트 배합입니다.' },
      { title: '고급 패키징', desc: '프리미엄 유리병과 감성 박스로 선물용에도 완벽합니다.' },
    ],
    reviews: [
      { stars: 5, text: '"향이 정말 고급스러워요. 뿌리고 나가면 주변에서\n무슨 향수냐고 꼭 물어봐요. 재구매 확정!"' },
      { stars: 5, text: '"지속력이 놀라워요. 아침에 뿌리면 퇴근할 때까지\n은은하게 남아있어서 덧뿌릴 필요가 없어요."' },
      { stars: 4, text: '"패키징이 너무 예뻐서 선물용으로 딱이에요.\n받는 분이 향수 자체보다 박스에 먼저 감탄하셨어요."' },
    ],
    detailTitle: '향 노트 안내',
    detailBody: '탑 노트: 베르가못, 핑크 페퍼\n미들 노트: 장미, 자스민, 피오니\n베이스 노트: 화이트 머스크, 앰버, 시더우드\n용량: 50ml / 100ml',
    ctaTitle: '나만의 시그니처 향', ctaSub: '선물 포장 무료 · 미니어처 증정' });

const T06 = buildPremiumElements(6, '06-womens-bag',
  { heroBg: '#1a1a1a', heroText: '#ffffff', accent: '#d4af37', bodyBg: '#f5f5f5', bodyText: '#222222', ctaBg: '#1a1a1a', ctaText: '#ffffff', btnBg: '#d4af37' },
  { productName: '이탈리안 레더 토트백', tagline: '장인의 손끝에서 완성된 프리미엄 가죽 가방',
    hookQuestion: '매일 드는 가방,\n당신의 가치를 담고 있나요?',
    painPoint: '합성 가죽의 싸구려 느낌에 질리셨나요?',
    insight: '이탈리아 토스카나 풀그레인 레더로\n시간이 지날수록 깊어지는 가치를 경험하세요.',
    brandStory: '이탈리아 토스카나의 소규모 공방에서\n3대째 이어온 가죽 장인이 직접 제작합니다.\n\n최상급 풀그레인 카우하이드 레더만을 사용하며,\n불필요한 장식을 배제한 미니멀 디자인으로\n시간이 지날수록 깊어지는 가죽 본연의 아름다움을 담았습니다.',
    features: [
      { title: '이탈리아 풀그레인 레더', desc: '토스카나 지역 최상급 풀그레인 가죽을 사용했습니다.' },
      { title: '미니멀 디자인', desc: '불필요한 장식을 배제한 세련된 미니멀 실루엣입니다.' },
      { title: '넉넉한 수납력', desc: '노트북 13인치까지 수납 가능한 실용적인 내부 구조입니다.' },
      { title: '무료 이니셜 각인', desc: '나만의 이니셜을 각인하여 세상에 하나뿐인 가방을 만드세요.' },
    ],
    reviews: [
      { stars: 5, text: '"가죽 질감이 사진보다 실물이 훨씬 좋아요.\n쓸수록 윤기가 나고 에이징이 예쁘게 돼요."' },
      { stars: 5, text: '"노트북, 파우치, 텀블러까지 다 들어가요.\n수납력이 좋은데 외관은 날씬해서 완벽해요."' },
      { stars: 5, text: '"이니셜 각인 서비스가 너무 좋아요.\n남편 생일 선물로 줬는데 정말 감동받았어요."' },
    ],
    detailTitle: '제품 사양',
    detailBody: '소재: 이탈리아산 풀그레인 카우하이드 레더\n크기: W34 × H28 × D13 cm\n무게: 약 680g',
    ctaTitle: '장인의 가죽 토트백', ctaSub: '무료 이니셜 각인 서비스' });

const T07 = buildPremiumElements(7, '07-fashion-fit',
  { heroBg: '#e6e6e6', heroText: '#222222', accent: '#ff6b35', bodyBg: '#fafafa', bodyText: '#333333', ctaBg: '#ff6b35', ctaText: '#ffffff', btnBg: '#ffffff' },
  { productName: '맞춤 수선 서비스 안내', tagline: '나만의 핏, 전문 테일러가 완성합니다',
    hookQuestion: '마음에 드는 옷,\n핏이 안 맞아 포기하셨나요?',
    painPoint: '기성복은 내 체형에 딱 맞지 않아 아쉬운 적 많으시죠?',
    insight: '20년 경력의 수선 장인이 밀리미터 단위로\n당신만의 완벽한 핏을 완성합니다.',
    brandStory: '30년 전통의 맞춤 수선 전문점입니다.\n체형 분석부터 원하는 핏까지,\n전문 테일러가 1:1로 상담하고 작업합니다.\n\n일반 수선 3일, 급행 수선 당일 완료가 가능하며\n만족하지 못하시면 재수선을 무료로 제공합니다.',
    features: [
      { title: '1:1 맞춤 상담', desc: '체형 분석부터 원하는 핏까지, 전문 테일러가 직접 상담합니다.' },
      { title: '정교한 수선 기술', desc: '20년 경력의 수선 장인이 밀리미터 단위로 조정합니다.' },
      { title: '빠른 수선 완료', desc: '일반 수선 3일, 급행 수선 당일 완료가 가능합니다.' },
      { title: '무료 재수선 보장', desc: '수선 결과에 만족하지 못하시면 무료로 재수선해드립니다.' },
    ],
    reviews: [
      { stars: 5, text: '"온라인으로 산 코트 기장이 안 맞았는데 여기서 수선하니\n맞춤복 같아졌어요. 가격도 합리적이에요."' },
      { stars: 5, text: '"바지 허리를 줄여달라고 했는데 핏이 완전 달라졌어요.\n역시 전문가한테 맡겨야 한다는 걸 느꼈어요."' },
      { stars: 4, text: '"급행 수선으로 당일에 받았어요. 급한 행사 전에\n정말 유용했습니다. 다음에도 꼭 이용할게요."' },
    ],
    detailTitle: '수선 서비스 안내',
    detailBody: '기장 수선: 바지, 원피스, 코트 등 모든 기장 조절\n허리 수선: 바지, 치마 허리 줄이기 / 늘리기\n어깨·소매 수선: 재킷, 셔츠의 어깨 폭 및 소매 길이 조절',
    ctaTitle: '나에게 맞는 옷 만들기', ctaSub: '첫 수선 20% 할인 쿠폰 지급' });

const T08 = buildPremiumElements(8, '08-robot-cleaner',
  { heroBg: '#0c1445', heroText: '#ffffff', accent: '#00d2ff', bodyBg: '#e8f0fe', bodyText: '#1a1a2e', ctaBg: '#0c1445', ctaText: '#ffffff', btnBg: '#00d2ff' },
  { productName: 'AI 스마트 로봇청소기', tagline: 'AI가 알아서 청소하는 스마트한 일상',
    hookQuestion: '청소,\n아직 직접 하고 계신가요?',
    painPoint: '매일 반복되는 청소에 소중한 시간을 빼앗기고 있진 않나요?',
    insight: 'LiDAR 3D 스캔과 6000Pa 흡입력의\nAI 로봇청소기가 당신의 시간을 돌려드립니다.',
    brandStory: '첨단 AI 기술과 로보틱스를 결합하여\n가정용 청소의 새로운 기준을 만들어갑니다.\n\nLiDAR 센서 기반 3D 공간 매핑으로 최적 경로를 계획하고,\n6000Pa 강력 흡입과 자동 물걸레·열풍 건조까지\n원스톱으로 해결하는 올인원 청소 솔루션입니다.',
    features: [
      { title: 'AI 공간 인식 매핑', desc: 'LiDAR 센서 3D 스캔하여 최적의 경로를 계획합니다.' },
      { title: '6000Pa 강력 흡입력', desc: '미세 먼지까지 깔끔하게 흡입하는 업계 최고 수준의 흡입력입니다.' },
      { title: '자동 물걸레 + 건조', desc: '걸레 자동 세척, 60℃ 열풍 건조까지 한번에 해결합니다.' },
      { title: '앱 원격 제어', desc: '스마트폰 앱으로 어디서든 청소 시작·예약·구역 설정이 가능합니다.' },
    ],
    reviews: [
      { stars: 5, text: '"출근하면서 앱으로 켜놓으면 퇴근할 때 집이 깨끗해요.\n매핑 기능이 정말 똑똑합니다."' },
      { stars: 5, text: '"물걸레 자동 세척이 진짜 편해요. 예전 로봇청소기는\n걸레 갈아주는 게 귀찮았는데 이건 완전 자동이에요."' },
      { stars: 4, text: '"소음이 확실히 적어요. 아기 낮잠 시간에 돌려도\n깨지 않아서 육아하는 집에 강추합니다."' },
    ],
    detailTitle: '제품 사양',
    detailBody: '모델명: AI-CLEAN PRO X1\n흡입력: 6,000Pa (5단계 조절)\n배터리: 5200mAh (최대 180분 사용)\n소음: 45dB 이하 (저소음 모드)',
    ctaTitle: 'AI가 청소하는 시대', ctaSub: '사전 예약 시 20% 얼리버드 할인' });

const T09 = buildPremiumElements(9, '09-kitchen-pot',
  { heroBg: '#c9d6ff', heroText: '#1a1a1a', accent: '#3b5998', bodyBg: '#eef2ff', bodyText: '#333333', ctaBg: '#3b5998', ctaText: '#ffffff', btnBg: '#ffffff' },
  { productName: '프리미엄 스테인리스 냄비 세트', tagline: '셰프의 주방을 완성하는 프리미엄 쿡웨어',
    hookQuestion: '요리의 맛,\n냄비가 결정한다는 걸 아시나요?',
    painPoint: '코팅이 벗겨지는 냄비, 건강이 걱정되시지 않으세요?',
    insight: '18/10 스테인리스 스틸과 5중 바닥 구조로\n안전하고 맛있는 요리를 완성하세요.',
    brandStory: '독일 공법을 적용한 프리미엄 스테인리스 쿡웨어입니다.\n크롬 18%, 니켈 10%의 최상급 소재로\n내구성과 안전성을 동시에 확보했습니다.\n\n알루미늄 코어 5중 바닥으로 열전도율이 뛰어나\n어떤 요리도 균일하게 익혀줍니다.',
    features: [
      { title: '18/10 스테인리스 스틸', desc: '크롬 18%, 니켈 10%의 최상급 스테인리스를 사용했습니다.' },
      { title: '5중 바닥 구조', desc: '알루미늄 코어 5중 바닥으로 열전도율이 뛰어납니다.' },
      { title: '인덕션 호환', desc: '가스레인지, 인덕션, 오븐까지 모든 열원에 사용 가능합니다.' },
      { title: '식기세척기 사용 가능', desc: '편리한 세척을 위해 식기세척기 사용이 가능합니다.' },
    ],
    reviews: [
      { stars: 5, text: '"열전도가 정말 균일해요. 스테이크 구울 때\n눌어붙지 않고 완벽하게 시어링 됩니다."' },
      { stars: 5, text: '"코팅 냄비 쓰다가 바꿨는데 세상이 달라졌어요.\n무거운 게 단점이라면 단점인데 요리가 확실히 맛있어져요."' },
      { stars: 4, text: '"인덕션에서도 잘 되고 오븐에도 넣을 수 있어서\n활용도가 높아요. 세트 구성도 실용적입니다."' },
    ],
    detailTitle: '세트 구성',
    detailBody: '편수냄비 16cm | 양수냄비 20cm | 양수냄비 24cm\n프라이팬 26cm | 유리 뚜껑 3종 | 실리콘 손잡이 커버',
    ctaTitle: '주방의 품격을 높이다', ctaSub: '세트 구매 시 실리콘 조리도구 증정' });

const T10 = buildPremiumElements(10, '10-sofa',
  { heroBg: '#5c4033', heroText: '#ffffff', accent: '#f5e6d3', bodyBg: '#f2ede6', bodyText: '#3d2b1f', ctaBg: '#5c4033', ctaText: '#ffffff', btnBg: '#f5e6d3' },
  { productName: '모던 패브릭 소파', tagline: '편안함과 스타일을 동시에, 리빙의 중심',
    hookQuestion: '집에서 가장 오래 머무는 곳,\n정말 편안한가요?',
    painPoint: '오래 앉으면 무너지는 소파, 불편하지 않으세요?',
    insight: '고밀도 45T 폼과 생활방수 패브릭으로\n오래 앉아도 편안한 소파를 만나보세요.',
    brandStory: '가구 장인 3대가 이어온 소파 전문 브랜드입니다.\n고밀도 폴리우레탄 폼과 원목 프레임을 사용하여\n오래 써도 변형 없는 내구성을 자랑합니다.\n\n생활방수 원단으로 관리가 편리하며,\n모듈형 설계로 공간에 맞게 자유롭게 배치할 수 있습니다.',
    features: [
      { title: '고밀도 폴리우레탄 폼', desc: '오래 앉아도 무너지지 않는 고밀도 45T 폼을 사용했습니다.' },
      { title: '생활방수 패브릭', desc: '물과 오염에 강한 생활방수 원단으로 관리가 편리합니다.' },
      { title: '모듈형 설계', desc: '공간에 맞게 자유롭게 배치할 수 있는 모듈형 구조입니다.' },
      { title: '무료 설치 서비스', desc: '전문 기사가 원하는 위치에 직접 배송·설치해드립니다.' },
    ],
    reviews: [
      { stars: 5, text: '"3개월째 매일 눕는데 쿠션이 하나도 안 꺼져요.\n고밀도 폼이라 그런지 복원력이 대단해요."' },
      { stars: 5, text: '"아이가 주스를 쏟았는데 생활방수라 바로 닦이더라고요.\n아이 있는 집에 이 원단 강추합니다."' },
      { stars: 5, text: '"모듈형이라 이사할 때 배치를 바꿨는데\n완전 다른 소파 같아요. 활용도가 너무 높아요."' },
    ],
    detailTitle: '제품 상세',
    detailBody: '크기: W250 × D95 × H85 cm (3인용 카우치형)\n시트 높이: 42cm | 시트 깊이: 55cm\n프레임: 원목 + 합판 복합 프레임',
    ctaTitle: '리빙을 완성하는 소파', ctaSub: '무료 배송 · 무료 설치 · 30일 반품 보장' });

const T11 = buildPremiumElements(11, '11-interior-rug',
  { heroBg: '#1e1e2e', heroText: '#ffffff', accent: '#ffd700', bodyBg: '#f5f5ed', bodyText: '#1e1e2e', ctaBg: '#1e1e2e', ctaText: '#ffffff', btnBg: '#ffd700' },
  { productName: '미니멀 핸드메이드 러그', tagline: '장인이 한 올 한 올 직접 짠 프리미엄 러그',
    hookQuestion: '당신의 공간,\n발 아래부터 바꿔보셨나요?',
    painPoint: '차가운 바닥, 밋밋한 인테리어가 아쉬우셨나요?',
    insight: '뉴질랜드 양모와 핸드 터프팅 공법으로\n공간에 따뜻한 감성을 더해보세요.',
    brandStory: '뉴질랜드에서 직수입한 최상급 양모로\n장인이 한 올 한 올 직접 터프팅하여 만듭니다.\n\n기계 생산이 아닌 수작업으로 제작하기에\n하나하나가 고유한 질감과 따뜻함을 가집니다.\n천연 라텍스 논슬립 뒷면으로 안전합니다.',
    features: [
      { title: '100% 뉴질랜드 양모', desc: '부드럽고 내구성 높은 최상급 뉴질랜드산 양모입니다.' },
      { title: '핸드 터프팅 공법', desc: '기계가 아닌 장인의 손으로 직접 터프팅하여 제작합니다.' },
      { title: '라텍스 논슬립 뒷면', desc: '천연 라텍스 코팅으로 바닥에서 미끄러지지 않습니다.' },
      { title: '커스텀 사이즈 주문', desc: '원하는 크기로 맞춤 제작이 가능합니다.' },
    ],
    reviews: [
      { stars: 5, text: '"양모 촉감이 정말 부드러워요. 겨울에 맨발로\n밟아도 따뜻하고 여름에도 쾌적해요."' },
      { stars: 5, text: '"거실에 깔았더니 분위기가 확 달라졌어요.\n미니멀한 디자인이 모던 인테리어에 딱이에요."' },
      { stars: 4, text: '"커스텀 사이즈로 주문했는데 크기가 딱 맞아요.\n제작 기간이 2주 정도 걸리는 건 감안해야 해요."' },
    ],
    detailTitle: '제품 사양',
    detailBody: '크기: 200 × 300 cm (커스텀 사이즈 주문 제작 가능)\n두께: 약 15mm\n소재: 뉴질랜드 양모 100% (뒷면: 천연 라텍스)',
    ctaTitle: '공간에 온기를 더하다', ctaSub: '커스텀 사이즈 주문 제작 가능' });

const T12 = buildPremiumElements(12, '12-aroma-oil',
  { heroBg: '#56ab2f', heroText: '#ffffff', accent: '#2d5016', bodyBg: '#edf5e4', bodyText: '#2d4a1f', ctaBg: '#2d5016', ctaText: '#ffffff', btnBg: '#56ab2f' },
  { productName: '내추럴 아로마 에센셜 오일', tagline: '자연에서 추출한 순수한 힐링 에너지',
    hookQuestion: '하루의 끝,\n어떻게 쉬고 계신가요?',
    painPoint: '쌓인 스트레스와 피로, 제대로 풀리지 않으셨나요?',
    insight: 'USDA 유기농 인증 순수 에센셜 오일로\n자연의 치유력을 경험해보세요.',
    brandStory: '자연에서 추출한 100% 순수 에센셜 오일만을 취급합니다.\n합성 향료를 일절 사용하지 않으며,\nUSDA 유기농 인증을 받은 원료만을 엄선합니다.\n\n아로마테라피스트가 인정하는 최고 등급의 순도로\n일상 속 진정한 힐링을 경험할 수 있습니다.',
    features: [
      { title: '100% 순수 에센셜 오일', desc: '합성 향료 없이 식물에서 직접 증류한 순수 오일입니다.' },
      { title: 'USDA 유기농 인증', desc: '미국 농무부 유기농 인증을 받은 원료만을 사용합니다.' },
      { title: '테라피 등급 품질', desc: '아로마테라피스트가 인정하는 최고 등급의 순도입니다.' },
      { title: '다양한 활용법', desc: '디퓨저, 입욕, 마사지 등 다양하게 활용할 수 있습니다.' },
    ],
    reviews: [
      { stars: 5, text: '"라벤더 오일 디퓨저에 넣고 자니까 수면의 질이\n확실히 좋아졌어요. 합성 향과는 차원이 달라요."' },
      { stars: 5, text: '"유칼립투스 오일로 스팀 흡입하니까 코막힘이\n바로 뚫려요. 환절기 필수템이에요."' },
      { stars: 4, text: '"3종 세트로 샀는데 각각 용도가 달라서\n상황에 맞게 골라 쓸 수 있어 좋아요."' },
    ],
    detailTitle: '사용 가이드',
    detailBody: '디퓨저: 물 150ml에 3~5방울 첨가\n입욕: 욕조에 5~8방울 (캐리어 오일과 희석 권장)\n마사지: 캐리어 오일 10ml에 2~3방울 블렌딩',
    ctaTitle: '자연의 치유력', ctaSub: '3종 세트 구매 시 파우치 증정' });

const T13 = buildPremiumElements(13, '13-macaron',
  { heroBg: '#fbc2eb', heroText: '#5c2d3e', accent: '#ff6f91', bodyBg: '#ffeef4', bodyText: '#5c2d3e', ctaBg: '#ff6f91', ctaText: '#ffffff', btnBg: '#ffffff' },
  { productName: '프렌치 수제 마카롱', tagline: '파리의 달콤함을 담은 컬러풀 마카롱',
    hookQuestion: '특별한 날,\n어떤 선물을 준비하시나요?',
    painPoint: '흔한 디저트 선물, 특별함이 없다고 느끼셨나요?',
    insight: '파리 르노트르 출신 파티시에의 정통 레시피로\n보는 것만으로도 행복한 마카롱을 만나보세요.',
    brandStory: '파리 르노트르에서 수련한 파티시에가\n정통 프렌치 레시피로 직접 만듭니다.\n\n비트, 녹차, 백련초 등 천연 색소만 사용하여\n아름다운 컬러를 완성하며,\n하루 100세트 한정으로 가장 신선하게 제공합니다.',
    features: [
      { title: '프랑스 정통 레시피', desc: '파리 르노트르 출신 파티시에의 정통 프렌치 레시피입니다.' },
      { title: '천연 색소만 사용', desc: '비트, 녹차, 백련초 등 천연 색소로 아름다운 컬러를 냅니다.' },
      { title: '매일 소량 한정 생산', desc: '하루 100세트 한정으로 가장 신선한 마카롱을 제공합니다.' },
      { title: '프리미엄 선물 포장', desc: '감성 박스와 리본으로 특별한 선물이 됩니다.' },
    ],
    reviews: [
      { stars: 5, text: '"꼬끄가 바삭하면서 속은 쫀득해요. 다른 마카롱이랑\n식감이 확실히 달라요. 진짜 프렌치 마카롱!"' },
      { stars: 5, text: '"선물용으로 샀는데 박스가 너무 예뻐서\n받는 분이 열기 전부터 감탄하셨어요."' },
      { stars: 5, text: '"천연 색소라 색이 은은하고 예뻐요.\n아이 간식으로도 안심하고 줄 수 있어요."' },
    ],
    detailTitle: '구성 안내',
    detailBody: '12개입 세트: 바닐라, 초콜릿, 딸기, 녹차, 얼그레이, 라즈베리\n24개입 세트: 12종 × 2개',
    ctaTitle: '달콤한 선물, 마카롱', ctaSub: '선물 포장 무료 · 메시지 카드 포함' });

const T14 = buildPremiumElements(14, '14-fashion-size',
  { heroBg: '#fdfcfb', heroText: '#111111', accent: '#333333', bodyBg: '#f9f8f6', bodyText: '#333333', ctaBg: '#333333', ctaText: '#ffffff', btnBg: '#ffffff' },
  { productName: '의류 사이즈 가이드', tagline: '정확한 사이즈 선택을 위한 가이드',
    hookQuestion: '온라인 쇼핑,\n사이즈 때문에 망설이셨나요?',
    painPoint: '사이즈가 안 맞아 교환·반품하느라 시간 낭비하셨나요?',
    insight: '실측 사이즈와 체형별 맞춤 추천으로\n처음부터 딱 맞는 옷을 고르세요.',
    brandStory: '온라인 쇼핑에서 가장 큰 불편함인\n사이즈 문제를 해결하기 위해 만들었습니다.\n\n모든 상품의 실측 사이즈를 정확히 제공하고,\n키와 체중 기반의 체형별 맞춤 추천 시스템으로\n교환·반품 없는 만족스러운 쇼핑을 도와드립니다.',
    features: [
      { title: '정확한 실측 사이즈', desc: '모든 상품은 실제 측정한 실측 사이즈를 제공합니다.' },
      { title: '체형별 추천 사이즈', desc: '키, 체중 기반의 체형별 맞춤 사이즈를 추천합니다.' },
      { title: '교환·반품 안내', desc: '사이즈가 맞지 않을 경우 무료 교환이 가능합니다.' },
      { title: '1:1 사이즈 상담', desc: '전문 상담원이 1:1로 사이즈를 안내해드립니다.' },
    ],
    reviews: [
      { stars: 5, text: '"사이즈 가이드 보고 주문했더니 딱 맞아요.\n온라인 쇼핑하면서 교환 한 번도 안 했어요."' },
      { stars: 5, text: '"체형별 추천이 정확해요. 제가 평소 M인데\n여기선 L 추천해줬는데 진짜 L이 딱이었어요."' },
      { stars: 4, text: '"1:1 채팅 상담으로 사이즈 물어봤는데\n답변이 빠르고 정확해서 좋았어요."' },
    ],
    detailTitle: '사이즈 측정 방법',
    detailBody: '가슴둘레: 겨드랑이 아래를 수평으로 한 바퀴 측정\n허리둘레: 배꼽 위 가장 가는 부분을 수평으로 측정\n엉덩이둘레: 엉덩이의 가장 넓은 부분을 수평으로 측정',
    ctaTitle: '나에게 맞는 사이즈 찾기', ctaSub: '사이즈 문의는 1:1 채팅으로' });

const T15 = buildPremiumElements(15, '15-winter-sale',
  { heroBg: '#1a1a1a', heroText: '#ffffff', accent: '#f1c40f', bodyBg: '#f5f5f5', bodyText: '#222222', ctaBg: '#c0392b', ctaText: '#ffffff', btnBg: '#f1c40f' },
  { productName: '겨울 특별 할인 기획전', tagline: '최대 70% 할인! 놓치면 후회할 겨울 특가',
    hookQuestion: '겨울 준비,\n아직 안 하셨나요?',
    painPoint: '비싼 겨울 아이템, 정가 주고 사기엔 부담스럽지 않나요?',
    insight: '최대 70% 파격 할인과 매일 타임딜로\n알뜰하게 겨울을 준비하세요.',
    brandStory: '매 시즌 최고의 가성비를 제공하는\n시즌 기획전을 운영합니다.\n\n인기 브랜드의 겨울 아이템을 최대 70%까지 할인하며,\n매일 오전 10시 한정 수량 특가 타임딜과\n전 상품 무료배송, 적립금 2배 혜택을 드립니다.',
    features: [
      { title: '최대 70% 파격 할인', desc: '겨울 시즌 한정, 인기 상품을 최대 70%까지 할인합니다.' },
      { title: '매일 새로운 타임딜', desc: '매일 오전 10시, 한정 수량 특가 상품이 공개됩니다.' },
      { title: '무료배송 + 적립금 2배', desc: '기획전 기간 전 상품 무료배송, 적립금 2배 지급합니다.' },
      { title: '구매 사은품 증정', desc: '5만원 이상 구매 시 겨울 소품을 사은품으로 드립니다.' },
    ],
    reviews: [
      { stars: 5, text: '"작년에도 여기서 패딩 샀는데 올해도 할인폭이 커서\n또 질렀어요. 백화점 가격의 반값이에요!"' },
      { stars: 5, text: '"타임딜로 캐시미어 머플러 득템했어요.\n정가 12만원짜리를 3만원대에 샀어요."' },
      { stars: 4, text: '"인기 상품은 금방 품절되니까 알림 설정하고\n10시 정각에 들어가셔야 해요."' },
    ],
    detailTitle: '기획전 일정',
    detailBody: '기간: 2025.12.01 ~ 2025.12.31 (31일간)\n대상: 아우터, 니트, 머플러, 장갑, 부츠 등 겨울 아이템 전체',
    ctaTitle: '겨울 특가, 지금 시작!', ctaSub: '한정 수량 소진 시 종료' });

const T16 = buildPremiumElements(16, '16-winter-activity',
  { heroBg: '#ff512f', heroText: '#ffffff', accent: '#ffffff', bodyBg: '#fff0ea', bodyText: '#333333', ctaBg: '#ff512f', ctaText: '#ffffff', btnBg: '#ffffff' },
  { productName: '겨울 아웃도어 기획전', tagline: '스키부터 캠핑까지, 겨울 액티비티의 모든 것',
    hookQuestion: '이번 겨울,\n어떤 모험을 계획하고 있나요?',
    painPoint: '겨울 아웃도어 장비, 여기저기 찾아다니기 번거로우셨나요?',
    insight: '스키, 보드, 캠핑 장비부터 방한 의류까지\n겨울 액티비티의 모든 것을 한자리에서 만나세요.',
    brandStory: '겨울을 가장 즐겁게 보내는 방법을 아는 브랜드입니다.\n스키·보드 장비부터 동계 캠핑 용품,\n기능성 방한 의류까지 엄선된 아이템만 모았습니다.\n\n각 분야 전문가가 직접 테스트한 제품만 선별하여\n안전하고 즐거운 겨울 아웃도어를 약속합니다.',
    features: [
      { title: '스키·보드 장비 특가', desc: '시즌 인기 스키·보드 장비를 최대 50% 할인합니다.' },
      { title: '겨울 캠핑 필수템', desc: '동계 텐트, 난로, 침낭 등 캠핑 장비를 한자리에 모았습니다.' },
      { title: '방한 의류 컬렉션', desc: '고어텍스, 다운재킷 등 기능성 방한 의류를 특가로 제공합니다.' },
      { title: '전문가 추천 세트', desc: '각 액티비티별 전문가가 추천하는 세트 상품을 만나보세요.' },
    ],
    reviews: [
      { stars: 5, text: '"보드 장비 세트로 샀는데 가격도 좋고 품질도 좋아요.\n매장에서 살 때보다 30% 이상 저렴했어요."' },
      { stars: 5, text: '"동계 캠핑 처음인데 여기 추천 세트 사니까\n필요한 건 다 있어서 편했어요."' },
      { stars: 4, text: '"고어텍스 재킷 질이 좋아요. 스키장에서\n하루종일 타도 안쪽이 전혀 안 젖었어요."' },
    ],
    detailTitle: '기획전 구성',
    detailBody: '스키/보드: 보드, 바인딩, 부츠, 고글, 헬멧, 장갑\n캠핑: 동계 텐트, 침낭(-20℃), 버너, 랜턴, 보온병',
    ctaTitle: '겨울을 즐기는 방법', ctaSub: '지금 바로 겨울 준비 시작!' });

// ─── Premium Long-form Sales Template ─────────────────────────────────────────

function buildPremiumDiffuserPage(idx: number): CanvasElement[] {
  const id = makeId(idx);
  const els: CanvasElement[] = [];

  // ━━━ SECTION 1: HERO (0 → 950) ━━━
  els.push(shape(id(), 'rect', 0, 0, 860, 950, '#1a1a1a'));
  els.push(image(id(), 0, 0, 860, 950, '', '분위기 있는 공간 사진을 넣어주세요'));
  els.push(shape(id(), 'rect', 0, 0, 860, 950, 'rgba(0,0,0,0.35)'));
  els.push(text(id(), 0, 180, 860, 30, '오늘의 기분을 완성하는 한 가지', 17, '#ffffff', 'normal', 'center', 1.4, 0.8));
  els.push(text(id(), 40, 260, 780, 200, '공간에 향이 머물면,\n감정도 머무릅니다.', 48, '#ffffff', 'bold', 'center'));
  els.push(text(id(), 0, 700, 860, 60, '하루의 끝,\n당신의 쉼에 향을 더하세요.', 17, '#ffffff', 'normal', 'center', 1.6, 0.7));

  // ━━━ SECTION 2: QUESTION (950 → 1350) ━━━
  els.push(shape(id(), 'rect', 0, 950, 860, 400, '#ffffff'));
  els.push(text(id(), 0, 1060, 860, 120, '당신의 공간,\n지금 어떤 향이 나나요?', 34, '#222222', 'bold', 'center', 1.5));

  // ━━━ SECTION 3: LIFESTYLE + PAIN POINT (1350 → 2280) ━━━
  els.push(shape(id(), 'rect', 0, 1350, 860, 930, '#ffffff'));
  els.push(image(id(), 50, 1390, 760, 380, '', '라이프스타일 이미지를 넣어주세요'));
  els.push(text(id(), 0, 1820, 860, 35, '집에 있어도 편안하지 않은 이유,', 18, '#888888', 'normal', 'center'));
  els.push(text(id(), 0, 1862, 860, 40, '향이 없기 때문입니다.', 24, '#333333', 'bold', 'center'));
  // Decorative dots
  els.push(shape(id(), 'circle', 426, 1940, 8, 8, '#cccccc'));
  els.push(shape(id(), 'circle', 426, 1962, 8, 8, '#cccccc'));
  els.push(shape(id(), 'circle', 426, 1984, 8, 8, '#cccccc'));
  els.push(text(id(), 0, 2040, 860, 65, '공간의 온도, 조도,\n그리고 \'향\'이 당신의 기분을 만듭니다.', 18, '#555555', 'normal', 'center', 1.6));

  // ━━━ DIVIDER ━━━
  els.push(shape(id(), 'line', 80, 2270, 700, 0, 'transparent', '#e0e0e0', 1));

  // ━━━ SECTION 4: PRODUCT INTRO (2290 → 3450) ━━━
  els.push(shape(id(), 'rect', 0, 2290, 860, 1160, '#2a2a2a'));
  els.push(text(id(), 0, 2400, 860, 30, '감정의 결을 바꾸는 향기', 17, '#ffffff', 'normal', 'center', 1.4, 0.7));
  els.push(text(id(), 0, 2470, 860, 70, '플르부아 디퓨저', 46, '#ffffff', 'bold', 'center'));
  els.push(text(id(), 0, 2580, 860, 55, '향으로 기분을 설계하는\n라이프스타일 뷰티 브랜드, 플르부아', 16, '#ffffff', 'normal', 'center', 1.7, 0.6));
  els.push(image(id(), 180, 2720, 500, 560, '', '제품 대표 사진을 넣어주세요'));

  // ━━━ SECTION 5: BRAND STORY (3450 → 4280) ━━━
  els.push(shape(id(), 'rect', 0, 3450, 860, 830, '#f7f7f7'));
  // Brand description card
  els.push(shape(id(), 'rect', 60, 3510, 740, 280, '#ffffff', 'transparent', 0, 12));
  els.push(text(id(), 100, 3540, 660, 220, '플르부아(PLEUVOIR)는 프랑스어로 \'비가 오다\'를\n뜻하는 단어로, 일상의 흐름 속에 감정을 머금은\n향기를 전하는 라이프스타일 뷰티 브랜드 입니다.\n\n우리는 단순한 방향제가 아닌,\n분위기와 감정을 만드는 향기를 디자인합니다.', 16, '#444444', 'normal', 'left', 1.8));
  // Feature bullets
  els.push(shape(id(), 'rect', 85, 3860, 4, 28, '#2a2a2a'));
  els.push(text(id(), 105, 3860, 650, 28, '200mL 대용량 감성 디퓨저', 16, '#333333', 'bold'));
  els.push(shape(id(), 'rect', 85, 3910, 4, 28, '#2a2a2a'));
  els.push(text(id(), 105, 3910, 650, 28, '플로럴 머스크 / 모닝소일 / 로즈우드 / 히노끼 레더', 16, '#333333', 'bold'));
  els.push(shape(id(), 'rect', 85, 3960, 4, 28, '#2a2a2a'));
  els.push(text(id(), 105, 3960, 650, 28, '세련된 미니멀 패키징으로 인테리어 효과', 16, '#333333', 'bold'));

  // ━━━ SECTION 6: SCENT LINEUP (4280 → 5350) ━━━
  els.push(shape(id(), 'rect', 0, 4280, 860, 1070, '#ffffff'));
  els.push(text(id(), 0, 4330, 860, 50, '어떤 향이 당신의 하루를 바꿀까요?', 28, '#222222', 'bold', 'center'));
  els.push(text(id(), 0, 4390, 860, 30, '4가지 시그니처 향으로 매일 다른 감정을 디자인하세요', 15, '#888888', 'normal', 'center'));
  // Row 1
  els.push(shape(id(), 'rect', 55, 4460, 355, 350, '#faf5f0', 'transparent', 0, 16));
  els.push(image(id(), 75, 4480, 315, 190, '', '향 이미지'));
  els.push(text(id(), 75, 4690, 315, 28, 'FLORAL MUSK', 18, '#333333', 'bold', 'center'));
  els.push(text(id(), 75, 4725, 315, 50, '튜베로즈, 아이리스, 피오니의\n은은한 꽃향 속 따뜻한 머스크', 13, '#888888', 'normal', 'center', 1.5));
  els.push(shape(id(), 'rect', 450, 4460, 355, 350, '#f0ece4', 'transparent', 0, 16));
  els.push(image(id(), 470, 4480, 315, 190, '', '향 이미지'));
  els.push(text(id(), 470, 4690, 315, 28, 'MORNING SOIL', 18, '#333333', 'bold', 'center'));
  els.push(text(id(), 470, 4725, 315, 50, '축축한 흙내음과 이끼의\n자연 속 아침 산책 향기', 13, '#888888', 'normal', 'center', 1.5));
  // Row 2
  els.push(shape(id(), 'rect', 55, 4840, 355, 350, '#f0e8e4', 'transparent', 0, 16));
  els.push(image(id(), 75, 4860, 315, 190, '', '향 이미지'));
  els.push(text(id(), 75, 5070, 315, 28, 'ROSEWOOD', 18, '#333333', 'bold', 'center'));
  els.push(text(id(), 75, 5105, 315, 50, '로즈우드의 부드러운 나무결과\n은은한 스파이시 플로럴', 13, '#888888', 'normal', 'center', 1.5));
  els.push(shape(id(), 'rect', 450, 4840, 355, 350, '#eae8e5', 'transparent', 0, 16));
  els.push(image(id(), 470, 4860, 315, 190, '', '향 이미지'));
  els.push(text(id(), 470, 5070, 315, 28, 'HINOKI LEATHER', 18, '#333333', 'bold', 'center'));
  els.push(text(id(), 470, 5105, 315, 50, '편백나무와 빈티지 레더의\n깊고 고요한 명상 향기', 13, '#888888', 'normal', 'center', 1.5));

  // ━━━ SECTION 7: HOW TO USE (5350 → 5980) ━━━
  els.push(shape(id(), 'rect', 0, 5350, 860, 630, '#f9f6f2'));
  els.push(text(id(), 0, 5400, 860, 40, 'How to Use', 28, '#222222', 'bold', 'center'));
  els.push(text(id(), 0, 5448, 860, 25, '간단한 3단계로 공간에 향기를 채우세요', 15, '#888888', 'normal', 'center'));
  // Step 1
  els.push(shape(id(), 'circle', 130, 5520, 50, 50, '#2a2a2a'));
  els.push(text(id(), 130, 5530, 50, 30, '1', 20, '#ffffff', 'bold', 'center'));
  els.push(text(id(), 200, 5520, 530, 28, '리드스틱을 디퓨저 용기에 꽂아주세요', 16, '#333333', 'bold'));
  els.push(text(id(), 200, 5552, 530, 24, '처음에는 3~4개만 꽂는 것을 추천합니다', 14, '#888888'));
  // Step 2
  els.push(shape(id(), 'circle', 130, 5610, 50, 50, '#2a2a2a'));
  els.push(text(id(), 130, 5620, 50, 30, '2', 20, '#ffffff', 'bold', 'center'));
  els.push(text(id(), 200, 5610, 530, 28, '30분~1시간 후 스틱을 뒤집어 주세요', 16, '#333333', 'bold'));
  els.push(text(id(), 200, 5642, 530, 24, '오일이 스틱에 충분히 스며든 후 뒤집으면 향이 퍼집니다', 14, '#888888'));
  // Step 3
  els.push(shape(id(), 'circle', 130, 5700, 50, 50, '#2a2a2a'));
  els.push(text(id(), 130, 5710, 50, 30, '3', 20, '#ffffff', 'bold', 'center'));
  els.push(text(id(), 200, 5700, 530, 28, '원하는 향의 강도에 따라 스틱 수를 조절하세요', 16, '#333333', 'bold'));
  els.push(text(id(), 200, 5732, 530, 24, '스틱이 많을수록 향이 강해집니다 (최대 8개)', 14, '#888888'));

  // ━━━ SECTION 8: REVIEWS (5980 → 6650) ━━━
  els.push(shape(id(), 'rect', 0, 5980, 860, 670, '#ffffff'));
  els.push(text(id(), 0, 6030, 860, 40, '실제 구매 후기', 28, '#222222', 'bold', 'center'));
  els.push(text(id(), 0, 6078, 860, 25, '4.9 / 5.0  ·  2,847개의 리뷰', 15, '#888888', 'normal', 'center'));
  // Review 1
  els.push(shape(id(), 'rect', 60, 6140, 740, 120, '#f9f9f9', 'transparent', 0, 12));
  els.push(text(id(), 85, 6155, 80, 20, '★★★★★', 14, '#f0c040'));
  els.push(text(id(), 85, 6180, 690, 60, '"집에 오면 은은하게 퍼지는 플로럴 머스크 향에 하루의 피로가\n녹는 느낌이에요. 진짜 호텔 느낌!"', 14, '#555555', 'normal', 'left', 1.6));
  // Review 2
  els.push(shape(id(), 'rect', 60, 6280, 740, 120, '#f9f9f9', 'transparent', 0, 12));
  els.push(text(id(), 85, 6295, 80, 20, '★★★★★', 14, '#f0c040'));
  els.push(text(id(), 85, 6320, 690, 60, '"선물용으로 구매했는데 패키징도 고급스럽고, 향도 부담스럽지\n않아서 받는 분이 정말 좋아하셨어요."', 14, '#555555', 'normal', 'left', 1.6));
  // Review 3
  els.push(shape(id(), 'rect', 60, 6420, 740, 120, '#f9f9f9', 'transparent', 0, 12));
  els.push(text(id(), 85, 6435, 80, 20, '★★★★☆', 14, '#f0c040'));
  els.push(text(id(), 85, 6460, 690, 60, '"200ml라서 오래 쓸 수 있어요. 히노끼 레더 향이 서재에\n딱이에요. 집중할 때 정말 좋습니다."', 14, '#555555', 'normal', 'left', 1.6));

  // ━━━ SECTION 9: CTA (6650 → 7150) ━━━
  els.push(shape(id(), 'rect', 0, 6650, 860, 500, '#1a1a1a'));
  els.push(shape(id(), 'circle', 380, 6680, 100, 100, 'rgba(255,255,255,0.05)'));
  els.push(shape(id(), 'circle', 680, 6800, 60, 60, 'rgba(255,255,255,0.03)'));
  els.push(text(id(), 0, 6790, 860, 50, '일상에 향기를 더하다', 36, '#ffffff', 'bold', 'center'));
  els.push(text(id(), 0, 6860, 860, 30, '지금 주문하면 무료 배송 + 미니어처 증정', 16, '#ffffff', 'normal', 'center', 1.4, 0.7));
  els.push(shape(id(), 'rect', 280, 6940, 300, 56, '#ffffff', 'transparent', 0, 28));
  els.push(text(id(), 280, 6950, 300, 36, '지금 구매하기', 18, '#1a1a1a', 'bold', 'center'));

  // ━━━ SECTION 10: FOOTER INFO (7150 → 7550) ━━━
  els.push(shape(id(), 'rect', 0, 7150, 860, 400, '#f5f5f5'));
  els.push(text(id(), 0, 7195, 860, 30, '배송 및 교환/반품 안내', 20, '#333333', 'bold', 'center'));
  els.push(shape(id(), 'line', 350, 7235, 160, 0, 'transparent', '#dddddd', 1));
  els.push(text(id(), 100, 7270, 660, 250, '배송비: 무료 (도서산간 지역 추가 3,000원)\n배송기간: 결제 완료 후 1~3일 이내 출고\n\n교환/반품: 수령 후 7일 이내 가능\n단, 사용 흔적이 있는 경우 교환/반품 불가\n\n고객센터: 1588-0000 (평일 10:00~18:00)\n이메일: support@pleuvoir.kr', 14, '#666666', 'normal', 'center', 1.8));

  return els;
}

const T17 = buildPremiumDiffuserPage(17);

// ─── Monster Energy Product Info Page ────────────────────────────────────────

function buildMonsterEnergyPage(idx: number): CanvasElement[] {
  const id = makeId(idx);
  const els: CanvasElement[] = [];

  // ━━━ FULL PAGE BACKGROUND ━━━
  els.push(shape(id(), 'rect', 0, 0, 860, 1280, '#ffffff'));

  // ━━━ SECTION 1: TITLE (0 → 70) ━━━
  els.push(text(id(), 30, 20, 800, 40, '몬스터 에너지 파피용 355ml x 24캔', 22, '#222222', 'bold', 'left'));

  // ━━━ SECTION 2: PRODUCT IMAGE + NUTRITION TABLE (70 → 560) ━━━

  // Product image placeholder (left)
  els.push(shape(id(), 'rect', 30, 75, 270, 432, '#f0f0f0', '#cccccc', 1, 8));
  els.push(text(id(), 30, 260, 270, 30, '[ 이미지 삽입 ]', 16, '#999999', 'bold', 'center'));
  els.push(text(id(), 30, 295, 270, 20, '제품 사진을 넣어주세요', 11, '#bbbbbb', 'normal', 'center'));

  // Nutrition header (right)
  els.push(text(id(), 330, 75, 80, 24, '영양정보', 15, '#222222', 'bold', 'left'));
  els.push(text(id(), 420, 78, 410, 20, '총 내용량(355 ml)  154 kcal', 12, '#666666', 'normal', 'left'));

  // Table top border
  els.push(shape(id(), 'line', 330, 105, 500, 0, 'transparent', '#333333', 2));

  // Column header
  els.push(text(id(), 700, 110, 130, 18, '%영양소기준치', 11, '#888888', 'normal', 'right'));

  // Table header separator
  els.push(shape(id(), 'line', 330, 130, 500, 0, 'transparent', '#333333', 1));

  // Nutrition data rows
  const rows: [string, string, string][] = [
    ['나트륨', '150mg', '8%'],
    ['탄수화물', '37g', '11%'],
    ['당류', '36g', '36%'],
    ['지방', '0g', '0%'],
    ['트랜스지방', '0g', ''],
    ['포화지방', '0g', '0%'],
    ['콜레스테롤', '0mg', '0%'],
    ['단백질', '1.4g', '3%'],
    ['비타민 B2', '2.6mg', '186%'],
    ['나이아신(비타민 B3)', '30mgNE', '200%'],
    ['비타민 B6', '3.0mg', '200%'],
    ['비타민 B12', '9.0\u03BCg', '375%'],
  ];

  rows.forEach(([name, amount, pct], i) => {
    const ry = 135 + i * 34;
    els.push(text(id(), 330, ry, 260, 30, name, 13, '#444444', 'normal', 'left'));
    els.push(text(id(), 600, ry, 100, 30, amount, 13, '#222222', 'normal', 'right'));
    if (pct) {
      els.push(text(id(), 720, ry, 110, 30, pct, 13, '#222222', 'normal', 'right'));
    }
    els.push(shape(id(), 'line', 330, ry + 30, 500, 0, 'transparent', '#e5e7eb', 1));
  });

  // ━━━ SECTION 3: INGREDIENTS (570 → 730) ━━━
  els.push(text(id(), 30, 575, 800, 120,
    '정제수, 설탕, 포도당, 사과농축액, 이산화탄소, 타우린, 구연산, 향료, 구연산삼나트륨, 복숭아농축액, 인삼추출물, 배농축액, 파인애플농축액, 소브산칼륨(보존료), 망고퓨레, 바나나퓨린, 차추출물(녹차), 덱스트린, 카페인(향미증진제), L-니코틴산아미드, 수크랄로스(감미료), L-카르니틴, 이노시톨, 과라나추출분말, B-카로틴(착색료), 비타민B6 염산염, 비타민B2, 비타민B12',
    13, '#444444', 'normal', 'left', 1.7));

  // "복숭아 함유" badge
  els.push(shape(id(), 'rect', 30, 710, 80, 26, '#FFF0E0', 'transparent', 0, 4));
  els.push(text(id(), 30, 712, 80, 22, '복숭아 함유', 11, '#E87C3A', 'bold', 'center'));

  // ━━━ SECTION 4: MANUFACTURER INFO (750 → 830) ━━━
  els.push(shape(id(), 'line', 30, 755, 800, 0, 'transparent', '#e5e7eb', 1));

  els.push(text(id(), 30, 770, 60, 22, '제조원', 13, '#222222', 'bold', 'left'));
  els.push(text(id(), 100, 770, 730, 22, '해태에이치티비(주) P5: 충남 천안시 동남구 청당산업길 250', 13, '#444444', 'normal', 'left'));

  els.push(text(id(), 30, 800, 60, 22, '판매원', 13, '#222222', 'bold', 'left'));
  els.push(text(id(), 100, 800, 730, 22, '코카-콜라음료(주) 경남 양산시 총렬로 269(유산동)', 13, '#444444', 'normal', 'left'));

  // ━━━ SECTION 5: CONSUMER SAFETY NOTICE (840 → 1250) ━━━
  els.push(shape(id(), 'line', 30, 840, 800, 0, 'transparent', '#e5e7eb', 1));

  els.push(text(id(), 30, 860, 800, 25, '소비자안전을 위한 주의사항', 14, '#222222', 'bold', 'left'));

  els.push(text(id(), 30, 895, 800, 330,
    '\u00B7 용기가 변형, 팽창, 손상되었거나 내용물이 변질되었을 경우 음용하지 마십시오.\n\u00B7 제품교환: 고객상담실 (080-024-5999) 및 각 구입처\n\u00B7 직사광선을 피해 서늘한 곳에 얼지 않게 보관하시고 개봉 후에는 냉장보관 및 빨리 드세요.\n\u00B7 제조의 파손될 수 있으니 차내 등 고온의 밀폐공간에 두지 마세요.\n\u00B7 본 제품은 공정거래위원회 고시한 소비자분쟁해결기준에 따라 교환 또는 보상을 받을 수 있습니다.\n\u00B7 부정, 불량식품신고는 국번없이 1399\n\u00B7 이 제품은 우유, 대두, 토마토, 메밀, 땅콩, 밀, 아황산류를 사용한 제품과 같은 제조시설에서 제조하고 있습니다.\n\u00B7 과량 섭취 하지 마시기 바라며 어린이, 임산부, 모유수유 중인 분 혹은 카페인에 민감하신 분은 섭취에 주의하여 주시기 바랍니다.',
    12, '#666666', 'normal', 'left', 1.8));
  return els;
}

const T20 = buildMonggoDetailElements();

// ─── Interior Lighting Detail Page ────────────────────────────────────────────

function buildInteriorLightingPage(idx: number): CanvasElement[] {
  const id = makeId(idx);
  const els: CanvasElement[] = [];

  const DARK = '#1a1a1a';
  const WARM_GOLD = '#c9a96e';
  const WARM_BG = '#f8f6f2';
  const LIGHT_BG = '#f5f3ef';
  const BODY = '#333333';
  const SUB = '#888888';

  function sect(
    sId: string, y: number, h: number, fill: string, sName: string,
  ): FrameElement {
    return {
      id: sId, type: 'frame', x: 0, y, width: 860, height: h,
      rotation: 0, opacity: 1, locked: false, visible: true, editable: false,
      fill, stroke: 'transparent', strokeWidth: 0,
      borderRadius: 0, clipContent: true, childOrder: [],
      isSection: true, name: sName,
    };
  }

  function pushSection(frame: FrameElement, children: CanvasElement[]) {
    frame.childOrder = children.map((c) => c.id);
    for (const c of children) { c.parentId = frame.id; }
    els.push(frame, ...children);
  }

  // ━━━ 1. 히어로 (0 → 900) ━━━
  const s1 = sect(id(), 0, 900, DARK, '히어로');
  pushSection(s1, [
    image(id(), 0, 0, 860, 900, '', '펜던트 조명 인테리어 사진을 넣어주세요'),
    shape(id(), 'rect', 0, 0, 860, 900, 'rgba(0,0,0,0.45)'),
    text(id(), 0, 200, 860, 20, 'I N T E R I O R   D E S I G N', 14, WARM_GOLD, 'normal', 'center', 1.2),
    shape(id(), 'line', 360, 235, 140, 0, 'transparent', WARM_GOLD, 1),
    text(id(), 40, 280, 780, 120, '조명이 바꾸는\n공간의 온도', 46, '#ffffff', 'bold', 'center', 1.4),
    text(id(), 0, 650, 860, 50, '빛 하나로 달라지는\n당신의 공간을 경험하세요.', 16, '#ffffff', 'normal', 'center', 1.6, 0.7),
  ]);

  // ━━━ 2. 제품 정보 (900 → 1500) ━━━
  const s2 = sect(id(), 900, 600, WARM_BG, '제품 정보');
  pushSection(s2, [
    text(id(), 0, 950, 860, 20, 'OSRAM PENDANT LIGHT', 13, WARM_GOLD, 'normal', 'center', 1.2),
    text(id(), 0, 990, 860, 50, '팬던트 오스람 조명', 36, BODY, 'bold', 'center'),
    shape(id(), 'line', 400, 1055, 60, 0, 'transparent', WARM_GOLD, 2),
    text(id(), 0, 1075, 860, 30, 'LED 30W / 45W', 18, SUB, 'normal', 'center'),
    text(id(), 100, 1120, 660, 60, '독일 오스람 기술력이 만들어낸 프리미엄 펜던트 조명.\n절제된 디자인 속에 담긴 최고의 조명 품질을 경험하세요.', 15, '#555555', 'normal', 'center', 1.7),
    image(id(), 180, 1210, 500, 260, '', '제품 사진을 넣어주세요'),
  ]);

  // ━━━ 3. 스타일 체크리스트 (1500 → 2200) ━━━
  const s3 = sect(id(), 1500, 700, LIGHT_BG, '스타일 체크리스트');
  const s3Children: CanvasElement[] = [
    text(id(), 0, 1540, 860, 20, 'STYLE CHECK', 13, WARM_GOLD, 'normal', 'center', 1.2),
    text(id(), 0, 1575, 860, 40, '디자인 포인트', 28, BODY, 'bold', 'center'),
    text(id(), 0, 1625, 860, 25, '하나하나 꼼꼼히 체크한 프리미엄 품질', 14, SUB, 'normal', 'center'),
  ];
  const checkItems = [
    '고급 알루미늄 + 유리 소재',
    '에너지 효율 A++ 등급',
    '3단계 밝기 조절 (30% / 60% / 100%)',
    '무선 리모컨 제어 지원',
    '전문 설치 서비스 포함',
    '5년 품질 보증',
  ];
  checkItems.forEach((item, i) => {
    const cy = 1680 + i * 56;
    s3Children.push(shape(id(), 'rect', 230, cy, 24, 24, 'transparent', BODY, 2, 4));
    s3Children.push(text(id(), 234, cy + 2, 16, 20, '\u2713', 14, BODY, 'bold', 'center'));
    s3Children.push(text(id(), 268, cy, 360, 24, item, 16, BODY, 'normal'));
  });
  s3Children.push(image(id(), 80, 2030, 700, 140, '', '인테리어 무드 이미지를 넣어주세요'));
  pushSection(s3, s3Children);

  // ━━━ 4. 특징 01 — 모던 미니멀 디자인 (2200 → 2900) ━━━
  const s4 = sect(id(), 2200, 700, '#ffffff', '특징 01');
  pushSection(s4, [
    text(id(), 60, 2240, 200, 80, '01', 72, '#e8e4df', 'bold'),
    text(id(), 60, 2320, 200, 20, 'Style Check', 13, WARM_GOLD, 'normal'),
    text(id(), 60, 2355, 380, 40, '모던 미니멀 디자인', 26, BODY, 'bold'),
    text(id(), 60, 2410, 380, 80, '군더더기 없는 깨끗한 라인과\n절제된 형태가 어떤 공간에도\n자연스럽게 어울립니다.', 15, '#555555', 'normal', 'left', 1.7),
    image(id(), 470, 2240, 340, 350, '', '조명 디자인 이미지'),
  ]);

  // ━━━ 5. 특징 02 — 에너지 절약 LED (2900 → 3600) ━━━
  const s5 = sect(id(), 2900, 700, WARM_BG, '특징 02');
  pushSection(s5, [
    image(id(), 50, 2940, 340, 350, '', '에너지 절약 이미지'),
    text(id(), 600, 2940, 200, 80, '02', 72, '#e8e4df', 'bold'),
    text(id(), 420, 3020, 380, 20, 'Style Check', 13, WARM_GOLD, 'normal'),
    text(id(), 420, 3055, 380, 40, '에너지 절약 LED', 26, BODY, 'bold'),
    text(id(), 420, 3110, 380, 80, '독일 오스람 LED 기술로\n전기료는 줄이고 밝기는 높이고,\n최대 50,000시간 수명을 보장합니다.', 15, '#555555', 'normal', 'left', 1.7),
  ]);

  // ━━━ 6. 특징 03 — 스마트 밝기 조절 (3600 → 4300) ━━━
  const s6 = sect(id(), 3600, 700, '#ffffff', '특징 03');
  pushSection(s6, [
    text(id(), 60, 3640, 200, 80, '03', 72, '#e8e4df', 'bold'),
    text(id(), 60, 3720, 200, 20, 'Style Check', 13, WARM_GOLD, 'normal'),
    text(id(), 60, 3755, 380, 40, '스마트 밝기 조절', 26, BODY, 'bold'),
    text(id(), 60, 3810, 380, 80, '무선 리모컨으로 3단계 밝기 조절.\n독서를 위한 은은한 불빛부터\n작업을 위한 환한 조명까지.', 15, '#555555', 'normal', 'left', 1.7),
    image(id(), 470, 3640, 340, 350, '', '밝기 조절 이미지'),
  ]);

  // ━━━ 7. 특징 04 — 간편 설치 시스템 (4300 → 5000) ━━━
  const s7 = sect(id(), 4300, 700, WARM_BG, '특징 04');
  pushSection(s7, [
    image(id(), 50, 4340, 340, 350, '', '설치 이미지'),
    text(id(), 600, 4340, 200, 80, '04', 72, '#e8e4df', 'bold'),
    text(id(), 420, 4420, 380, 20, 'Style Check', 13, WARM_GOLD, 'normal'),
    text(id(), 420, 4455, 380, 40, '간편 설치 시스템', 26, BODY, 'bold'),
    text(id(), 420, 4510, 380, 80, '전문 기사가 방문하여\n안전하게 설치해드립니다.\n추가 비용 없이 무료 설치.', 15, '#555555', 'normal', 'left', 1.7),
  ]);

  // ━━━ 8. 제품 사양 (5000 → 5600) ━━━
  const s8 = sect(id(), 5000, 600, '#ffffff', '제품 사양');
  const s8Children: CanvasElement[] = [
    text(id(), 0, 5040, 860, 20, 'SPECIFICATION', 13, WARM_GOLD, 'normal', 'center', 1.2),
    text(id(), 0, 5075, 860, 40, '제품 사양', 28, BODY, 'bold', 'center'),
    shape(id(), 'line', 100, 5135, 660, 0, 'transparent', '#e0e0e0', 1),
  ];
  const specs: [string, string][] = [
    ['제품명', '팬던트 오스람 조명'],
    ['소재', '알루미늄 + 유리'],
    ['전구', 'LED 30W / 45W'],
    ['색온도', '3000K (웜화이트) / 4000K (자연광)'],
    ['크기', 'Φ400 × H300mm'],
    ['설치', '천장 매립형'],
  ];
  specs.forEach(([label, value], i) => {
    const sy = 5155 + i * 55;
    s8Children.push(text(id(), 160, sy, 160, 30, label, 15, SUB, 'normal', 'right'));
    s8Children.push(shape(id(), 'rect', 340, sy + 5, 1, 20, '#dddddd'));
    s8Children.push(text(id(), 365, sy, 340, 30, value, 15, BODY, 'normal'));
    if (i < specs.length - 1) {
      s8Children.push(shape(id(), 'line', 160, sy + 45, 505, 0, 'transparent', '#f0f0f0', 1));
    }
  });
  pushSection(s8, s8Children);

  // ━━━ 9. CTA (5600 → 6100) ━━━
  const s9 = sect(id(), 5600, 500, DARK, 'CTA');
  pushSection(s9, [
    shape(id(), 'circle', 100, 5650, 120, 120, 'rgba(201,169,110,0.06)'),
    shape(id(), 'circle', 650, 5780, 80, 80, 'rgba(201,169,110,0.04)'),
    text(id(), 0, 5760, 860, 50, '공간을 빛으로 디자인하다', 36, '#ffffff', 'bold', 'center'),
    text(id(), 0, 5830, 860, 30, '지금 주문하면 무료 설치 + 리모컨 증정', 16, '#ffffff', 'normal', 'center', 1.4, 0.7),
    shape(id(), 'rect', 280, 5910, 300, 56, WARM_GOLD, 'transparent', 0, 28),
    text(id(), 280, 5920, 300, 36, '지금 구매하기', 18, DARK, 'bold', 'center'),
  ]);

  // ━━━ 10. 배송 안내 (6100 → 6500) ━━━
  const s10 = sect(id(), 6100, 400, '#f5f5f5', '배송 안내');
  pushSection(s10, [
    text(id(), 0, 6145, 860, 30, '배송 및 교환/반품 안내', 20, BODY, 'bold', 'center'),
    shape(id(), 'line', 350, 6185, 160, 0, 'transparent', '#dddddd', 1),
    text(id(), 100, 6220, 660, 250, '배송비: 무료 (도서산간 지역 추가 5,000원)\n배송기간: 결제 완료 후 3~5일 이내 출고 (설치 일정 별도 협의)\n\n교환/반품: 수령 후 7일 이내 가능\n단, 설치 완료 후에는 교환/반품 불가\n\n고객센터: 1588-0000 (평일 10:00~18:00)\n이메일: support@interior-light.kr', 14, '#666666', 'normal', 'center', 1.8),
  ]);

  return els;
}

const T18 = buildMonsterEnergyPage(18);

// ─── Pringles Sweet Onion Product Page ───────────────────────────────────────

function buildPringlesPage(idx: number): CanvasElement[] {
  const id = makeId(idx);
  const els: CanvasElement[] = [];

  // ━━━ FULL PAGE BACKGROUND ━━━
  els.push(shape(id(), 'rect', 0, 0, 860, 1380, '#382B73'));

  // ━━━ SECTION 1: LOGO (0 → 140) ━━━
  els.push(shape(id(), 'circle', 380, 25, 100, 100, '#ffffff'));
  els.push(text(id(), 380, 50, 100, 50, 'P', 36, '#382B73', 'bold', 'center'));

  // ━━━ SECTION 2: TITLE (150 → 380) ━━━
  els.push({ ...text(id(), 0, 155, 860, 65, 'SWEET', 56, '#E8C840', 'bold', 'center'), fontFamily: 'Bebas Neue, sans-serif' });
  els.push({ ...text(id(), 0, 225, 860, 65, 'ONION', 56, '#E8C840', 'bold', 'center'), fontFamily: 'Bebas Neue, sans-serif' });
  els.push({ ...text(id(), 0, 310, 860, 55, '스윗 어니언', 46, '#ffffff', 'bold', 'center'), fontFamily: 'Black Han Sans, sans-serif' });

  // ━━━ SECTION 3: DESCRIPTION (390 → 580) ━━━
  els.push({ ...text(id(), 80, 395, 700, 180,
    '양파 맛집 프링글스가 자신있게 선보이는 신제품 스윗 어니언!\n신선한 양파를 볶을 때 느껴지는 달콤한 풍미와\n팬에서 노릇하게 구운 양파의 짭조름함이 완벽하게 어우러져\n한입 먹으면 멈출 수 없을 거예요!',
    15, '#d8d0f0', 'normal', 'center', 1.9), fontFamily: 'Noto Sans KR, sans-serif' });

  // ━━━ SECTION 4: PRODUCT PHOTO AREA (600 → 1380) ━━━
  els.push(shape(id(), 'rect', 0, 600, 860, 780, '#3D8B4F'));
  els.push(shape(id(), 'rect', 130, 700, 600, 520, '#4A9C5C', '#5AAD6C', 1, 12));
  els.push(text(id(), 130, 920, 600, 30, '[ 이미지 삽입 ]', 18, '#a8d5b0', 'bold', 'center'));
  els.push(text(id(), 130, 955, 600, 20, '제품 사진을 넣어주세요', 12, '#7ab88a', 'normal', 'center'));

  return els;
}

const T19 = buildPringlesPage(19);
const T21 = buildInteriorLightingPage(21);
// ─── Exported template list ──────────────────────────────────────────────────

export const BUILT_IN_TEMPLATES: BuiltInTemplate[] = [
  {
    id: 'template-001', name: '모던 과일 수제청 상세페이지', category: ['food'],
    description: '노란색과 갈색의 모던한 과일 수제청 제품 상세페이지', preset: 'detail-page',
    thumbnail: { background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', accent: '#e8590c', previewText: '수제청' },
    elements: T01, backgroundColor: '#fffdf5', tags: ['과일', '수제청', '음료', '식품', '따뜻한'],
  },
  {
    id: 'template-002', name: '호박고구마 상세페이지', category: ['food'],
    description: '갈색 단순 호박고구마 식품 상세페이지', preset: 'detail-page',
    thumbnail: { background: 'linear-gradient(135deg, #3c1810 0%, #8b4513 50%, #d4a574 100%)', accent: '#daa520', previewText: '고구마' },
    elements: T02, backgroundColor: '#faf5ef', tags: ['고구마', '호박', '식품', '농산물', '자연'],
  },
  {
    id: 'template-003', name: '수제 베이커리 상세페이지', category: ['food'],
    description: '갈색 베이지색 사랑스러운 베이커리 빵집 상세페이지', preset: 'detail-page',
    thumbnail: { background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', accent: '#c2703e', previewText: '베이커리' },
    elements: T03, backgroundColor: '#fffaf5', tags: ['베이커리', '빵', '디저트', '수제', '카페'],
  },
  {
    id: 'template-004', name: '핸드메이드 수제 비누 상세페이지', category: ['beauty'],
    description: '브라운 모던한 핸드메이드 수제 비누 쇼핑몰 상세페이지', preset: 'detail-page',
    thumbnail: { background: 'linear-gradient(135deg, #d4a574 0%, #8b6914 100%)', accent: '#c9a87c', previewText: '수제 비누' },
    elements: T04, backgroundColor: '#faf6f0', tags: ['비누', '핸드메이드', '수제', '뷰티', '내추럴'],
  },
  {
    id: 'template-005', name: '프리미엄 여성 향수 상세페이지', category: ['beauty'],
    description: '어두운 갈색 파스텔 핑크 아이보리색 여성 향수 상세페이지', preset: 'detail-page',
    thumbnail: { background: 'linear-gradient(135deg, #2c1654 0%, #7b4397 50%, #dc98c9 100%)', accent: '#e8b4d8', previewText: '향수' },
    elements: T05, backgroundColor: '#fdf5fc', tags: ['향수', '럭셔리', '프리미엄', '뷰티', '선물'],
  },
  {
    id: 'template-006', name: '여성 가방 상세페이지', category: ['fashion'],
    description: '갈색 베이지색 아이보리색 여성 가방 상세페이지', preset: 'detail-page',
    thumbnail: { background: 'linear-gradient(135deg, #1a1a1a 0%, #434343 100%)', accent: '#f5f5f5', previewText: '여성 가방' },
    elements: T06, backgroundColor: '#fafafa', tags: ['여성', '가방', '패션', '모던', '심플'],
  },
  {
    id: 'template-007', name: '의류 맞춤수선 안내 상세페이지', category: ['fashion'],
    description: '베이지 미니멀리스트 의류 패션 맞춤수선 안내 상세페이지', preset: 'detail-page',
    thumbnail: { background: 'linear-gradient(135deg, #e6e6e6 0%, #999999 50%, #333333 100%)', accent: '#ff6b35', previewText: '맞춤수선' },
    elements: T07, backgroundColor: '#ffffff', tags: ['의류', '패션', '수선', '맞춤', '안내'],
  },
  {
    id: 'template-008', name: '로봇청소기 상세페이지', category: ['electronics'],
    description: '회갈색 모던한 로봇청소기 제품 상세페이지', preset: 'detail-page',
    thumbnail: { background: 'linear-gradient(135deg, #0c1445 0%, #1a3a8a 50%, #4facfe 100%)', accent: '#00d2ff', previewText: '로봇청소기' },
    elements: T08, backgroundColor: '#f0f4ff', tags: ['로봇청소기', '가전', '청소', '스마트', '테크'],
  },
  {
    id: 'template-009', name: '스테인리스 주방용품 상세페이지', category: ['electronics'],
    description: '갈색 및 은색 단순 주방용품 가전용품 스테인리스 냄비 상세페이지', preset: 'detail-page',
    thumbnail: { background: 'linear-gradient(135deg, #c9d6ff 0%, #e2e2e2 100%)', accent: '#3b5998', previewText: '주방용품' },
    elements: T09, backgroundColor: '#f8faff', tags: ['주방', '냄비', '가전', '스테인리스', '쿡웨어'],
  },
  {
    id: 'template-010', name: '모던 소파 제품 상세페이지', category: ['interior'],
    description: '베이지 색상 모던한 소파 제품 상세페이지', preset: 'detail-page',
    thumbnail: { background: 'linear-gradient(135deg, #d4a574 0%, #8b6914 50%, #5c4033 100%)', accent: '#f5e6d3', previewText: '소파' },
    elements: T10, backgroundColor: '#faf8f5', tags: ['소파', '가구', '인테리어', '모던', '리빙'],
  },
  {
    id: 'template-011', name: '미니멀 인테리어 러그 상세페이지', category: ['interior'],
    description: '흰색 및 베이지색 모던 미니멀리스트 인테리어 거실 러그 상세페이지', preset: 'detail-page',
    thumbnail: { background: 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 50%, #ffd700 100%)', accent: '#ffecb3', previewText: '러그' },
    elements: T11, backgroundColor: '#fafaf5', tags: ['러그', '인테리어', '미니멀', '거실', '카펫'],
  },
  {
    id: 'template-012', name: '아로마오일 상세페이지', category: ['health'],
    description: '옅은 초록색 파스텔그린 올리브그린 아로마오일 상세페이지', preset: 'detail-page',
    thumbnail: { background: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)', accent: '#2d5016', previewText: '아로마오일' },
    elements: T12, backgroundColor: '#f5faf0', tags: ['아로마', '오일', '건강', '자연', '힐링'],
  },
  {
    id: 'template-013', name: '마카롱 디저트 상세페이지', category: ['food', 'kids'],
    description: '파스텔 핑크 아이보리 마카롱 사진 제품 상세페이지', preset: 'detail-page',
    thumbnail: { background: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 50%, #c3fbd8 100%)', accent: '#ff6f91', previewText: '마카롱' },
    elements: T13, backgroundColor: '#fff5f9', tags: ['마카롱', '디저트', '파스텔', '카페', '선물'],
  },
  {
    id: 'template-014', name: '의류 사이즈 기준표 상세페이지', category: ['fashion'],
    description: '화이트 깔끔한 쇼핑몰 의류 사이즈 기준표 상세페이지', preset: 'detail-page',
    thumbnail: { background: 'linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%)', accent: '#333333', previewText: '사이즈 기준표' },
    elements: T14, backgroundColor: '#ffffff', tags: ['의류', '사이즈', '기준표', '쇼핑몰', '패션'],
  },
  {
    id: 'template-015', name: '겨울 할인 기획전 상세페이지', category: ['promotion'],
    description: '연베이지 갈색 깔끔한 겨울 할인 기획전 상세페이지', preset: 'detail-page',
    thumbnail: { background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #c0392b 100%)', accent: '#f1c40f', previewText: '겨울 할인' },
    elements: T15, backgroundColor: '#fafafa', tags: ['겨울', '할인', '기획전', '프로모션', '세일'],
  },
  {
    id: 'template-016', name: '겨울 액티비티 기획전 상세페이지', category: ['promotion'],
    description: '하늘색 검정색 깔끔한 겨울 액티비티 제품설명 상세페이지', preset: 'detail-page',
    thumbnail: { background: 'linear-gradient(135deg, #ff512f 0%, #f09819 100%)', accent: '#ffffff', previewText: '겨울 액티비티' },
    elements: T16, backgroundColor: '#fff8f5', tags: ['겨울', '액티비티', '스키', '여행', '이벤트'],
  },
  {
    id: 'template-017', name: '프리미엄 감성 디퓨저 상세페이지', category: ['beauty', 'interior'],
    description: '감성 스토리텔링형 프리미엄 디퓨저/향초 판매용 롱폼 상세페이지 (~7500px)', preset: 'detail-page',
    thumbnail: { background: 'linear-gradient(180deg, #1a1a1a 0%, #2a2a2a 45%, #f7f7f7 55%, #ffffff 100%)', accent: '#d4a574', previewText: '프리미엄 디퓨저' },
    elements: T17, backgroundColor: '#ffffff', tags: ['디퓨저', '향초', '향수', '프리미엄', '감성', '롱폼', '스토리텔링', '인테리어', '뷰티'],
  },
  {
    id: 'template-018', name: '몬스터 에너지 파피용 상세페이지', category: ['food'],
    description: '몬스터 에너지 파피용 355ml x 24캔 제품 상세 정보 페이지',
    preset: 'detail-page',
    thumbnailImage: '/templates/17-monster-energy.png',
    thumbnail: { background: 'linear-gradient(135deg, #1a1a1a 0%, #e87c3a 50%, #ffd700 100%)', accent: '#00ff00', previewText: '몬스터 에너지' },
    elements: T18, backgroundColor: '#ffffff',
    tags: ['에너지', '음료', '몬스터', '식품', '영양정보', '코카콜라'],
  },
  {
    id: 'template-019', name: '프링글스 스윗 어니언 상세페이지', category: ['food'],
    description: '보라색 초록색 프링글스 스윗 어니언 신제품 프로모션 상세페이지',
    preset: 'detail-page',
    thumbnail: { background: 'linear-gradient(135deg, #382B73 0%, #4A3890 50%, #3D8B4F 100%)', accent: '#E8C840', previewText: '프링글스' },
    elements: T19, backgroundColor: '#382B73',
    tags: ['프링글스', '스낵', '스윗어니언', '양파', '식품', '신제품'],
  },
  {
    id: 'template-020', name: '몽고간장 송표 프라임 상세페이지', category: ['food'],
    description: '따뜻한 베이지 크림색 간장 양조식품 브랜드 상세페이지 — 히어로/제품소개/특징/요리추천/라인업/Q&A 구성', preset: 'detail-page',
    thumbnail: { background: 'linear-gradient(135deg, #F5EDE0 0%, #D4922A 50%, #3D2B1A 100%)', accent: '#D4922A', previewText: '몽고간장' },
    elements: T20, backgroundColor: '#FAFAF6', tags: ['간장', '양조', '식품', '전통', '몽고간장', '송표', '브랜드'],
  },
  {
    id: 'template-021', name: '인테리어 조명 상세페이지', category: ['interior'],
    description: '모던 미니멀 인테리어 팬던트 조명 제품 상세페이지 (체크리스트 + 4섹션 피처)', preset: 'detail-page',
    thumbnail: { background: 'linear-gradient(135deg, #1a1a1a 0%, #333333 50%, #c9a96e 100%)', accent: '#c9a96e', previewText: '조명' },
    elements: T21, backgroundColor: '#f8f6f2', tags: ['조명', '인테리어', '펜던트', '조명기구', '모던', '미니멀', '오스람'],
  },
];
