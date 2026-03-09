export interface FontOption {
  family: string;
  label: string;
  category: 'sans' | 'serif' | 'display' | 'handwriting' | 'mono';
  /** Google Fonts family name (used for CSS2 API URL) — omit for system fonts */
  googleFamily?: string;
  /** External CDN stylesheet URL for fonts NOT on Google Fonts */
  cdnUrl?: string;
}

/* ─────────────────────────────────────────
   Google Fonts + CDN + 시스템 폰트 (85+개)
   카테고리별로 정렬
   ───────────────────────────────────────── */

export const FONT_LIST: FontOption[] = [
  // ━━━ 한국어 고딕 (Korean Sans-serif) ━━━
  { family: 'Noto Sans KR', label: 'Noto Sans KR', category: 'sans', googleFamily: 'Noto+Sans+KR' },
  { family: 'Pretendard', label: 'Pretendard', category: 'sans', cdnUrl: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css' },
  { family: 'Gothic A1', label: 'Gothic A1', category: 'sans', googleFamily: 'Gothic+A1' },
  { family: 'Nanum Gothic', label: '나눔고딕', category: 'sans', googleFamily: 'Nanum+Gothic' },
  { family: 'IBM Plex Sans KR', label: 'IBM Plex Sans KR', category: 'sans', googleFamily: 'IBM+Plex+Sans+KR' },
  { family: 'Spoqa Han Sans Neo', label: '스포카 한 산스', category: 'sans', cdnUrl: 'https://spoqa.github.io/spoqa-han-sans/css/SpoqaHanSansNeo.css' },
  { family: 'Gowun Dodum', label: '고운돋움', category: 'sans', googleFamily: 'Gowun+Dodum' },
  { family: 'Hahmlet', label: '함렛', category: 'sans', googleFamily: 'Hahmlet' },
  { family: 'Dongle', label: '동글', category: 'sans', googleFamily: 'Dongle' },
  { family: 'Jua', label: '주아', category: 'sans', googleFamily: 'Jua' },
  { family: 'Single Day', label: '싱글데이', category: 'sans', googleFamily: 'Single+Day' },
  { family: 'Sunflower', label: '해바라기', category: 'sans', googleFamily: 'Sunflower' },
  { family: 'Orbit', label: 'Orbit', category: 'sans', googleFamily: 'Orbit' },

  // ━━━ 영문 고딕 (International Sans-serif) ━━━
  { family: 'Montserrat', label: 'Montserrat', category: 'sans', googleFamily: 'Montserrat' },
  { family: 'Poppins', label: 'Poppins', category: 'sans', googleFamily: 'Poppins' },
  { family: 'Inter', label: 'Inter', category: 'sans', googleFamily: 'Inter' },
  { family: 'Roboto', label: 'Roboto', category: 'sans', googleFamily: 'Roboto' },
  { family: 'Open Sans', label: 'Open Sans', category: 'sans', googleFamily: 'Open+Sans' },
  { family: 'Lato', label: 'Lato', category: 'sans', googleFamily: 'Lato' },
  { family: 'Raleway', label: 'Raleway', category: 'sans', googleFamily: 'Raleway' },
  { family: 'DM Sans', label: 'DM Sans', category: 'sans', googleFamily: 'DM+Sans' },
  { family: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans', category: 'sans', googleFamily: 'Plus+Jakarta+Sans' },
  { family: 'Manrope', label: 'Manrope', category: 'sans', googleFamily: 'Manrope' },
  { family: 'Space Grotesk', label: 'Space Grotesk', category: 'sans', googleFamily: 'Space+Grotesk' },
  { family: 'Work Sans', label: 'Work Sans', category: 'sans', googleFamily: 'Work+Sans' },
  { family: 'Nunito', label: 'Nunito', category: 'sans', googleFamily: 'Nunito' },
  { family: 'Rubik', label: 'Rubik', category: 'sans', googleFamily: 'Rubik' },
  { family: 'Outfit', label: 'Outfit', category: 'sans', googleFamily: 'Outfit' },
  { family: 'Figtree', label: 'Figtree', category: 'sans', googleFamily: 'Figtree' },

  // ━━━ 한국어 명조 (Korean Serif) ━━━
  { family: 'Noto Serif KR', label: 'Noto Serif KR', category: 'serif', googleFamily: 'Noto+Serif+KR' },
  { family: 'Nanum Myeongjo', label: '나눔명조', category: 'serif', googleFamily: 'Nanum+Myeongjo' },
  { family: 'Gowun Batang', label: '고운바탕', category: 'serif', googleFamily: 'Gowun+Batang' },
  { family: 'Song Myung', label: '송명', category: 'serif', googleFamily: 'Song+Myung' },
  { family: 'Gamja Flower', label: '감자꽃', category: 'serif', googleFamily: 'Gamja+Flower' },

  // ━━━ 영문 명조 (International Serif) ━━━
  { family: 'Playfair Display', label: 'Playfair Display', category: 'serif', googleFamily: 'Playfair+Display' },
  { family: 'Merriweather', label: 'Merriweather', category: 'serif', googleFamily: 'Merriweather' },
  { family: 'Lora', label: 'Lora', category: 'serif', googleFamily: 'Lora' },
  { family: 'EB Garamond', label: 'EB Garamond', category: 'serif', googleFamily: 'EB+Garamond' },
  { family: 'Crimson Text', label: 'Crimson Text', category: 'serif', googleFamily: 'Crimson+Text' },
  { family: 'Cormorant Garamond', label: 'Cormorant Garamond', category: 'serif', googleFamily: 'Cormorant+Garamond' },
  { family: 'Libre Baskerville', label: 'Libre Baskerville', category: 'serif', googleFamily: 'Libre+Baskerville' },
  { family: 'Spectral', label: 'Spectral', category: 'serif', googleFamily: 'Spectral' },
  { family: 'Cinzel', label: 'Cinzel', category: 'serif', googleFamily: 'Cinzel' },

  // ━━━ 한국어 디스플레이 (Korean Display) ━━━
  { family: 'Black Han Sans', label: '블랙한산스', category: 'display', googleFamily: 'Black+Han+Sans' },
  { family: 'Do Hyeon', label: '도현체', category: 'display', googleFamily: 'Do+Hyeon' },
  { family: 'Gugi', label: '구기', category: 'display', googleFamily: 'Gugi' },
  { family: 'Black And White Picture', label: '흑백사진', category: 'display', googleFamily: 'Black+And+White+Picture' },
  { family: 'Dokdo', label: '독도', category: 'display', googleFamily: 'Dokdo' },
  { family: 'East Sea Dokdo', label: '동해독도', category: 'display', googleFamily: 'East+Sea+Dokdo' },
  { family: 'Kirang Haerang', label: '기랑해랑', category: 'display', googleFamily: 'Kirang+Haerang' },
  { family: 'Yeon Sung', label: '연성', category: 'display', googleFamily: 'Yeon+Sung' },
  { family: 'Poor Story', label: '푸어스토리', category: 'display', googleFamily: 'Poor+Story' },
  { family: 'Stylish', label: '스타일리시', category: 'display', googleFamily: 'Stylish' },
  { family: 'Hi Melody', label: '하이멜로디', category: 'display', googleFamily: 'Hi+Melody' },
  { family: 'Cute Font', label: '큐트', category: 'display', googleFamily: 'Cute+Font' },

  // ━━━ 영문 디스플레이 & 임팩트 (International Display & Impact) ━━━
  { family: 'Bebas Neue', label: 'Bebas Neue', category: 'display', googleFamily: 'Bebas+Neue' },
  { family: 'Oswald', label: 'Oswald', category: 'display', googleFamily: 'Oswald' },
  { family: 'Anton', label: 'Anton', category: 'display', googleFamily: 'Anton' },
  { family: 'Barlow Condensed', label: 'Barlow Condensed', category: 'display', googleFamily: 'Barlow+Condensed' },
  { family: 'Saira Condensed', label: 'Saira Condensed', category: 'display', googleFamily: 'Saira+Condensed' },
  { family: 'Fjalla One', label: 'Fjalla One', category: 'display', googleFamily: 'Fjalla+One' },
  { family: 'Abril Fatface', label: 'Abril Fatface', category: 'display', googleFamily: 'Abril+Fatface' },
  { family: 'Alfa Slab One', label: 'Alfa Slab One', category: 'display', googleFamily: 'Alfa+Slab+One' },
  { family: 'Righteous', label: 'Righteous', category: 'display', googleFamily: 'Righteous' },
  { family: 'Teko', label: 'Teko', category: 'display', googleFamily: 'Teko' },
  { family: 'Staatliches', label: 'Staatliches', category: 'display', googleFamily: 'Staatliches' },
  { family: 'Russo One', label: 'Russo One', category: 'display', googleFamily: 'Russo+One' },
  { family: 'Passion One', label: 'Passion One', category: 'display', googleFamily: 'Passion+One' },
  { family: 'Archivo Narrow', label: 'Archivo Narrow', category: 'display', googleFamily: 'Archivo+Narrow' },
  { family: 'Yanone Kaffeesatz', label: 'Yanone Kaffeesatz', category: 'display', googleFamily: 'Yanone+Kaffeesatz' },
  { family: 'Pathway Gothic One', label: 'Pathway Gothic One', category: 'display', googleFamily: 'Pathway+Gothic+One' },

  // ━━━ 손글씨 (Handwriting) ━━━
  { family: 'Gaegu', label: '개구', category: 'handwriting', googleFamily: 'Gaegu' },
  { family: 'Nanum Pen Script', label: '나눔펜스크립트', category: 'handwriting', googleFamily: 'Nanum+Pen+Script' },
  { family: 'Nanum Brush Script', label: '나눔붓스크립트', category: 'handwriting', googleFamily: 'Nanum+Brush+Script' },
  { family: 'Nanum Gothic Coding', label: '나눔고딕코딩', category: 'handwriting', googleFamily: 'Nanum+Gothic+Coding' },
  { family: 'Gasoek One', label: '가석원', category: 'handwriting', googleFamily: 'Gasoek+One' },
  { family: 'Grandiflora One', label: '그란디플로라', category: 'handwriting', googleFamily: 'Grandiflora+One' },

  // ━━━ 모노 (Monospace) ━━━
  { family: 'IBM Plex Mono', label: 'IBM Plex Mono', category: 'mono', googleFamily: 'IBM+Plex+Mono' },
  { family: 'Source Code Pro', label: 'Source Code Pro', category: 'mono', googleFamily: 'Source+Code+Pro' },
  { family: 'D2Coding', label: 'D2 Coding', category: 'mono', cdnUrl: 'https://cdn.jsdelivr.net/gh/wan2land/d2coding/d2coding-full.css' },

  // ━━━ 시스템 폰트 (항상 사용 가능) ━━━
  { family: 'Arial', label: 'Arial', category: 'sans' },
  { family: 'Georgia', label: 'Georgia', category: 'serif' },
  { family: 'Impact', label: 'Impact', category: 'display' },
  { family: 'Courier New', label: 'Courier New', category: 'mono' },
];

export const FONT_CATEGORIES = [
  { key: 'all' as const, label: '전체' },
  { key: 'sans' as const, label: '고딕' },
  { key: 'serif' as const, label: '명조' },
  { key: 'display' as const, label: '디스플레이' },
  { key: 'handwriting' as const, label: '손글씨' },
  { key: 'mono' as const, label: '모노' },
];

export type FontCategory = (typeof FONT_CATEGORIES)[number]['key'];

export const DEFAULT_FONT = FONT_LIST[0].family;
export const DEFAULT_FONT_SIZE = 24;
export const DEFAULT_TEXT_COLOR = '#000000';
export const FONT_SIZE_OPTIONS = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96, 128];

/**
 * Build Google Fonts CSS2 URL for all Google fonts in the list.
 * Uses display=swap for better performance.
 */
export function buildGoogleFontsURL(): string {
  const families = FONT_LIST
    .filter((f) => f.googleFamily)
    .map((f) => `family=${f.googleFamily}:wght@100;300;400;500;700;900`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

/**
 * Get all external CDN stylesheet URLs for non-Google fonts.
 */
export function getExternalFontCDNUrls(): string[] {
  return FONT_LIST
    .filter((f) => f.cdnUrl)
    .map((f) => f.cdnUrl!);
}
