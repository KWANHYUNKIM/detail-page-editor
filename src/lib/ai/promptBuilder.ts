import { AIDesignRequest } from '@/types/editor';
import { extractElementsForAI } from '@/lib/canvas/serializer';
import { Page } from '@/types/editor';

export function buildDesignPrompt(
  request: AIDesignRequest,
  page: Page,
): string {
  const elementsForAI = extractElementsForAI(page);

  return `당신은 상세페이지 디자인 전문가입니다.

[캔버스 정보]
- 사이즈: ${request.canvasSize.width}×${request.canvasSize.height}
- 현재 요소 수: ${elementsForAI.length}개

[현재 캔버스 상태]
${JSON.stringify(elementsForAI, null, 2)}

[업로드된 이미지]
${request.uploadedImages.map((img) => `- ${img.name}`).join('\n')}

[사용자 요청]
"${request.userPrompt}"

${request.style ? `[스타일 지정]\n${request.style}\n` : ''}
아래 JSON 형식으로 캔버스 레이아웃을 생성해주세요.
각 요소는 다음 타입 중 하나여야 합니다: image, text, shape

응답 형식:
{
  "elements": [...],
  "backgroundColor": "#ffffff",
  "colorPalette": ["#hex1", "#hex2"],
  "suggestions": ["제안1", "제안2"]
}`;
}

export function buildModificationPrompt(
  userRequest: string,
  page: Page,
): string {
  const elementsForAI = extractElementsForAI(page);

  return `현재 캔버스 상태:
${JSON.stringify(elementsForAI, null, 2)}

수정 요청: "${userRequest}"

수정된 elements 배열만 JSON으로 응답해주세요.`;
}
