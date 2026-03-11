'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEditorStore } from '@/stores/editorStore';
import { useProjectStore } from '@/stores/projectStore';
import { CANVAS_PRESETS } from '@/constants/presets';
import { BUILT_IN_TEMPLATES, TEMPLATE_CATEGORIES } from '@/constants/templates';
import { createFigmaDesignProject } from '@/constants/figmaDesign';
import type { PresetKey, TemplateCategory, BuiltInTemplate, CanvasElement, ImageElement, TextElement, ShapeElement } from '@/types/editor';
import Modal from '@/components/ui/Modal';
import {
  HiMagnifyingGlass,
  HiPlus,
  HiFolder,
  HiPlusCircle,
  HiSparkles,
  HiArrowRight,
  HiChevronRight,
} from 'react-icons/hi2';

const CATEGORY_VISUALS: Record<
  Exclude<TemplateCategory, 'all'>,
  { gradient: string; icon: string }
> = {
  fashion: { gradient: 'from-gray-900 to-gray-600', icon: '👗' },
  beauty: { gradient: 'from-pink-400 to-rose-300', icon: '💄' },
  food: { gradient: 'from-orange-400 to-amber-300', icon: '🍽️' },
  electronics: { gradient: 'from-blue-600 to-cyan-400', icon: '🎧' },
  interior: { gradient: 'from-amber-600 to-yellow-400', icon: '🪑' },
  health: { gradient: 'from-green-500 to-emerald-300', icon: '🌿' },
  kids: { gradient: 'from-purple-400 to-pink-300', icon: '🧸' },
  promotion: { gradient: 'from-red-500 to-orange-400', icon: '🔥' },
};

function uid() {
  return crypto.randomUUID();
}

function makeInstagramPostElements(): {
  elements: CanvasElement[];
  backgroundColor: string;
} {
  const W = 1080;
  const H = 1080;
  const imgH = 650;
  const bottomY = imgH;
  const bottomH = H - imgH;

  const bgRect: ShapeElement = {
    id: uid(), type: 'shape', shape: 'rect',
    x: 0, y: 0, width: W, height: H, rotation: 0, opacity: 1,
    locked: true, visible: true, editable: false,
    fill: '#111111', stroke: 'transparent', strokeWidth: 0, borderRadius: 0,
  };

  const imgPlaceholder: ImageElement = {
    id: uid(), type: 'image',
    x: 0, y: 0, width: W, height: imgH, rotation: 0, opacity: 1,
    locked: false, visible: true, editable: true,
    editableProps: ['src'],
    placeholder: '여기에 사진을 드래그하거나 교체하세요',
    src: '', scaleMode: 'fill', crop: null,
    filters: { brightness: 0, contrast: 0, saturation: 0, blur: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0 },
    filterPreset: null,
    gradientOverlay: {
      enabled: true,
      gradient: { type: 'linear', angle: 180, stops: [{ color: 'rgba(0, 0, 0, 0)', offset: 0.5 }, { color: 'rgba(17, 17, 17, 1)', offset: 1 }] },
      opacity: 1,
    },
  };

  const darkOverlay: ShapeElement = {
    id: uid(), type: 'shape', shape: 'rect',
    x: 0, y: bottomY, width: W, height: bottomH, rotation: 0, opacity: 1,
    locked: true, visible: true, editable: false,
    fill: '#111111', stroke: 'transparent', strokeWidth: 0, borderRadius: 0,
  };

  const badge: TextElement = {
    id: uid(), type: 'text',
    x: 60, y: bottomY + 20, width: 200, height: 36, rotation: 0, opacity: 0.7,
    locked: false, visible: true, editable: true,
    editableProps: ['content', 'color'],
    content: '@username', fontFamily: 'Pretendard', fontSize: 18, fontWeight: 'bold', fontStyle: 'normal',
    color: '#aaaaaa', textAlign: 'left', lineHeight: 1.3, letterSpacing: 0.5, textDecoration: 'none',
    textShadow: { enabled: false, color: '#000', offsetX: 0, offsetY: 0, blur: 0 },
    textStroke: { enabled: false, color: '#000', width: 0 },
    textBackground: '',
  };

  const mainText: TextElement = {
    id: uid(), type: 'text',
    x: 60, y: bottomY + 65, width: W - 120, height: 300, rotation: 0, opacity: 1,
    locked: false, visible: true, editable: true,
    editableProps: ['content', 'fontFamily', 'fontSize', 'color'],
    content: '한 사람만 사랑하는\nMBTI 1위는 \'ISTJ\'\n해바라기 같은 사람',
    fontFamily: 'Pretendard', fontSize: 58, fontWeight: 'bold', fontStyle: 'normal',
    color: '#ffffff', textAlign: 'left', lineHeight: 1.25, letterSpacing: -1, textDecoration: 'none',
    textShadow: { enabled: false, color: '#000', offsetX: 0, offsetY: 0, blur: 0 },
    textStroke: { enabled: false, color: '#000', width: 0 },
    textBackground: '',
  };

  const subText: TextElement = {
    id: uid(), type: 'text',
    x: 60, y: H - 80, width: W - 120, height: 30, rotation: 0, opacity: 0.4,
    locked: false, visible: true, editable: true,
    editableProps: ['content'],
    content: '#MBTI #ISTJ #연애 #해바라기',
    fontFamily: 'Pretendard', fontSize: 16, fontWeight: 'normal', fontStyle: 'normal',
    color: '#ffffff', textAlign: 'left', lineHeight: 1.4, letterSpacing: 0, textDecoration: 'none',
    textShadow: { enabled: false, color: '#000', offsetX: 0, offsetY: 0, blur: 0 },
    textStroke: { enabled: false, color: '#000', width: 0 },
    textBackground: '',
  };

  return {
    elements: [bgRect, imgPlaceholder, darkOverlay, badge, mainText, subText],
    backgroundColor: '#111111',
  };
}

function makeCherryBlossomElements(): {
  elements: CanvasElement[];
  backgroundColor: string;
} {
  const W = 860;
  const SH = 480;
  const PAD = 60;
  const CW = W - PAD * 2;

  const noShadow = { enabled: false as const, color: '#000', offsetX: 0, offsetY: 0, blur: 0 };
  const noStroke = { enabled: false as const, color: '#000', width: 0 };
  const divider = (y: number, fill = '#ad1457'): ShapeElement => ({
    id: uid(), type: 'shape', shape: 'rect',
    x: PAD, y, width: CW, height: 1,
    rotation: 0, opacity: 0.15, locked: true, visible: true, editable: false,
    fill, stroke: 'transparent', strokeWidth: 0, borderRadius: 0,
  });

  const els: CanvasElement[] = [];

  // ── Section 1: Cover (0–479) ──

  els.push({
    id: uid(), type: 'shape', shape: 'rect',
    x: 0, y: 0, width: W, height: SH, rotation: 0, opacity: 1,
    locked: true, visible: true, editable: false,
    fill: { type: 'linear', angle: 160, stops: [
      { color: '#fce4ec', offset: 0 },
      { color: '#f8bbd0', offset: 0.5 },
      { color: '#f48fb1', offset: 1 },
    ]},
    stroke: 'transparent', strokeWidth: 0, borderRadius: 0,
  } as ShapeElement);

  els.push({
    id: uid(), type: 'image',
    x: 0, y: 0, width: W, height: SH, rotation: 0, opacity: 0.5,
    locked: false, visible: true, editable: true,
    editableProps: ['src'],
    placeholder: '벚꽃 사진을 넣어주세요',
    src: '', scaleMode: 'fill', crop: null,
    filters: { brightness: 0, contrast: 0, saturation: 0, blur: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0 },
    filterPreset: null,
    gradientOverlay: {
      enabled: true,
      gradient: { type: 'linear', angle: 180, stops: [
        { color: 'rgba(252,228,236,0)', offset: 0.3 },
        { color: 'rgba(248,187,208,0.9)', offset: 1 },
      ]},
      opacity: 1,
    },
  } as ImageElement);

  els.push({
    id: uid(), type: 'text',
    x: 0, y: 40, width: W, height: 160, rotation: 0, opacity: 0.1,
    locked: true, visible: true, editable: false,
    content: '2026', fontFamily: 'Pretendard', fontSize: 180, fontWeight: 'bold', fontStyle: 'normal',
    color: '#880e4f', textAlign: 'center', lineHeight: 1, letterSpacing: 15, textDecoration: 'none',
    textShadow: noShadow, textStroke: noStroke, textBackground: '',
  } as TextElement);

  els.push({
    id: uid(), type: 'text',
    x: PAD, y: 200, width: CW, height: 70, rotation: 0, opacity: 1,
    locked: false, visible: true, editable: true,
    editableProps: ['content', 'fontFamily'],
    content: '벚꽃 개화 시기', fontFamily: 'Pretendard', fontSize: 52, fontWeight: 'bold', fontStyle: 'normal',
    color: '#4a0e2e', textAlign: 'center', lineHeight: 1.2, letterSpacing: -1, textDecoration: 'none',
    textShadow: noShadow, textStroke: noStroke, textBackground: '',
  } as TextElement);

  els.push({
    id: uid(), type: 'text',
    x: PAD, y: 285, width: CW, height: 40, rotation: 0, opacity: 0.7,
    locked: false, visible: true, editable: true,
    editableProps: ['content'],
    content: '전국 지역별 개화 · 만개 예상일', fontFamily: 'Pretendard', fontSize: 20, fontWeight: 'normal', fontStyle: 'normal',
    color: '#6d2150', textAlign: 'center', lineHeight: 1.4, letterSpacing: 2, textDecoration: 'none',
    textShadow: noShadow, textStroke: noStroke, textBackground: '',
  } as TextElement);

  els.push({
    id: uid(), type: 'shape', shape: 'rect',
    x: (W - 60) / 2, y: 350, width: 60, height: 2, rotation: 0, opacity: 0.4,
    locked: true, visible: true, editable: false,
    fill: '#880e4f', stroke: 'transparent', strokeWidth: 0, borderRadius: 1,
  } as ShapeElement);

  els.push({
    id: uid(), type: 'text',
    x: 0, y: 380, width: W, height: 50, rotation: 0, opacity: 0.5,
    locked: true, visible: true, editable: false,
    content: '🌸  🌸  🌸', fontFamily: 'Pretendard', fontSize: 28, fontWeight: 'normal', fontStyle: 'normal',
    color: '#000', textAlign: 'center', lineHeight: 1, letterSpacing: 0, textDecoration: 'none',
    textShadow: noShadow, textStroke: noStroke, textBackground: '',
  } as TextElement);

  // ── Section 2: South (480–959) ──
  const s2 = SH;

  els.push({
    id: uid(), type: 'shape', shape: 'rect',
    x: 0, y: s2, width: W, height: SH, rotation: 0, opacity: 1,
    locked: true, visible: true, editable: false,
    fill: '#FFF5F7', stroke: 'transparent', strokeWidth: 0, borderRadius: 0,
  } as ShapeElement);

  els.push({
    id: uid(), type: 'text',
    x: PAD, y: s2 + 45, width: CW, height: 45, rotation: 0, opacity: 1,
    locked: false, visible: true, editable: true, editableProps: ['content'],
    content: '🌸  남부 지역', fontFamily: 'Pretendard', fontSize: 28, fontWeight: 'bold', fontStyle: 'normal',
    color: '#ad1457', textAlign: 'left', lineHeight: 1.2, letterSpacing: 0, textDecoration: 'none',
    textShadow: noShadow, textStroke: noStroke, textBackground: '',
  } as TextElement);

  els.push(divider(s2 + 100));

  els.push({
    id: uid(), type: 'text',
    x: PAD, y: s2 + 125, width: CW, height: 320, rotation: 0, opacity: 1,
    locked: false, visible: true, editable: true, editableProps: ['content'],
    content: '제주\n개화 3월 20일  ·  만개 3월 27일\n\n부산\n개화 3월 23일  ·  만개 3월 30일\n\n대구\n개화 3월 25일  ·  만개 4월 1일',
    fontFamily: 'Pretendard', fontSize: 20, fontWeight: 'normal', fontStyle: 'normal',
    color: '#333333', textAlign: 'left', lineHeight: 1.9, letterSpacing: 0.5, textDecoration: 'none',
    textShadow: noShadow, textStroke: noStroke, textBackground: '',
  } as TextElement);

  // ── Section 3: Central (960–1439) ──
  const s3 = SH * 2;

  els.push({
    id: uid(), type: 'shape', shape: 'rect',
    x: 0, y: s3, width: W, height: SH, rotation: 0, opacity: 1,
    locked: true, visible: true, editable: false,
    fill: '#FFFFFF', stroke: 'transparent', strokeWidth: 0, borderRadius: 0,
  } as ShapeElement);

  els.push({
    id: uid(), type: 'text',
    x: PAD, y: s3 + 45, width: CW, height: 45, rotation: 0, opacity: 1,
    locked: false, visible: true, editable: true, editableProps: ['content'],
    content: '🌸  중부 지역', fontFamily: 'Pretendard', fontSize: 28, fontWeight: 'bold', fontStyle: 'normal',
    color: '#ad1457', textAlign: 'left', lineHeight: 1.2, letterSpacing: 0, textDecoration: 'none',
    textShadow: noShadow, textStroke: noStroke, textBackground: '',
  } as TextElement);

  els.push(divider(s3 + 100));

  els.push({
    id: uid(), type: 'text',
    x: PAD, y: s3 + 125, width: CW, height: 320, rotation: 0, opacity: 1,
    locked: false, visible: true, editable: true, editableProps: ['content'],
    content: '광주\n개화 3월 25일  ·  만개 4월 1일\n\n대전\n개화 3월 28일  ·  만개 4월 4일\n\n서울\n개화 3월 30일  ·  만개 4월 6일',
    fontFamily: 'Pretendard', fontSize: 20, fontWeight: 'normal', fontStyle: 'normal',
    color: '#333333', textAlign: 'left', lineHeight: 1.9, letterSpacing: 0.5, textDecoration: 'none',
    textShadow: noShadow, textStroke: noStroke, textBackground: '',
  } as TextElement);

  // ── Section 4: Capital / Northern (1440–1919) ──
  const s4 = SH * 3;

  els.push({
    id: uid(), type: 'shape', shape: 'rect',
    x: 0, y: s4, width: W, height: SH, rotation: 0, opacity: 1,
    locked: true, visible: true, editable: false,
    fill: '#FFF5F7', stroke: 'transparent', strokeWidth: 0, borderRadius: 0,
  } as ShapeElement);

  els.push({
    id: uid(), type: 'text',
    x: PAD, y: s4 + 45, width: CW, height: 45, rotation: 0, opacity: 1,
    locked: false, visible: true, editable: true, editableProps: ['content'],
    content: '🌸  수도권 · 강원', fontFamily: 'Pretendard', fontSize: 28, fontWeight: 'bold', fontStyle: 'normal',
    color: '#ad1457', textAlign: 'left', lineHeight: 1.2, letterSpacing: 0, textDecoration: 'none',
    textShadow: noShadow, textStroke: noStroke, textBackground: '',
  } as TextElement);

  els.push(divider(s4 + 100));

  els.push({
    id: uid(), type: 'text',
    x: PAD, y: s4 + 125, width: CW, height: 200, rotation: 0, opacity: 1,
    locked: false, visible: true, editable: true, editableProps: ['content'],
    content: '인천\n개화 4월 2일  ·  만개 4월 9일\n\n춘천\n개화 4월 5일  ·  만개 4월 12일',
    fontFamily: 'Pretendard', fontSize: 20, fontWeight: 'normal', fontStyle: 'normal',
    color: '#333333', textAlign: 'left', lineHeight: 1.9, letterSpacing: 0.5, textDecoration: 'none',
    textShadow: noShadow, textStroke: noStroke, textBackground: '',
  } as TextElement);

  els.push({
    id: uid(), type: 'text',
    x: PAD, y: s4 + 350, width: CW, height: 80, rotation: 0, opacity: 0.6,
    locked: false, visible: true, editable: true, editableProps: ['content'],
    content: '📍 벚꽃 명소\n여의도 윤중로 · 석촌호수 · 경포호 · 진해 여좌천',
    fontFamily: 'Pretendard', fontSize: 16, fontWeight: 'normal', fontStyle: 'normal',
    color: '#555', textAlign: 'left', lineHeight: 1.7, letterSpacing: 0, textDecoration: 'none',
    textShadow: noShadow, textStroke: noStroke, textBackground: '',
  } as TextElement);

  // ── Section 5: Tips & Closing (1920–2399) ──
  const s5 = SH * 4;

  els.push({
    id: uid(), type: 'shape', shape: 'rect',
    x: 0, y: s5, width: W, height: SH, rotation: 0, opacity: 1,
    locked: true, visible: true, editable: false,
    fill: { type: 'linear', angle: 180, stops: [
      { color: '#f8bbd0', offset: 0 },
      { color: '#fce4ec', offset: 0.5 },
      { color: '#fff5f7', offset: 1 },
    ]},
    stroke: 'transparent', strokeWidth: 0, borderRadius: 0,
  } as ShapeElement);

  els.push({
    id: uid(), type: 'text',
    x: PAD, y: s5 + 50, width: CW, height: 45, rotation: 0, opacity: 1,
    locked: false, visible: true, editable: true, editableProps: ['content'],
    content: '🌸  벚꽃 나들이 TIP', fontFamily: 'Pretendard', fontSize: 28, fontWeight: 'bold', fontStyle: 'normal',
    color: '#880e4f', textAlign: 'center', lineHeight: 1.2, letterSpacing: 0, textDecoration: 'none',
    textShadow: noShadow, textStroke: noStroke, textBackground: '',
  } as TextElement);

  els.push(divider(s5 + 105, '#880e4f'));

  els.push({
    id: uid(), type: 'text',
    x: PAD, y: s5 + 135, width: CW, height: 240, rotation: 0, opacity: 1,
    locked: false, visible: true, editable: true, editableProps: ['content'],
    content: '개화 후 5~7일이 만개 절정\n\n비 오기 전날이 가장 아름다워요\n\n주말 인파를 피하려면 평일 오전 추천\n\n얇은 겉옷 · 돗자리 · 보온병 필수',
    fontFamily: 'Pretendard', fontSize: 18, fontWeight: 'normal', fontStyle: 'normal',
    color: '#4a0e2e', textAlign: 'center', lineHeight: 2.2, letterSpacing: 0.5, textDecoration: 'none',
    textShadow: noShadow, textStroke: noStroke, textBackground: '',
  } as TextElement);

  els.push({
    id: uid(), type: 'text',
    x: PAD, y: s5 + 420, width: CW, height: 30, rotation: 0, opacity: 0.4,
    locked: false, visible: true, editable: true, editableProps: ['content'],
    content: '@your_instagram  ·  2026 벚꽃 가이드',
    fontFamily: 'Pretendard', fontSize: 14, fontWeight: 'normal', fontStyle: 'normal',
    color: '#880e4f', textAlign: 'center', lineHeight: 1, letterSpacing: 1, textDecoration: 'none',
    textShadow: noShadow, textStroke: noStroke, textBackground: '',
  } as TextElement);

  return { elements: els, backgroundColor: '#FFF5F7' };
}

function makeFontShowcaseElements(): {
  elements: CanvasElement[];
  backgroundColor: string;
} {
  const W = 1080;
  const H = 1080;
  const noShadow = { enabled: false as const, color: '#000', offsetX: 0, offsetY: 0, blur: 0 };
  const noStroke = { enabled: false as const, color: '#000', width: 0 };

  const els: CanvasElement[] = [];

  els.push({
    id: uid(), type: 'shape', shape: 'rect',
    x: 0, y: 0, width: W, height: H, rotation: 0, opacity: 1,
    locked: true, visible: true, editable: false,
    fill: { type: 'linear', angle: 135, stops: [
      { color: '#1a1a2e', offset: 0 },
      { color: '#16213e', offset: 0.5 },
      { color: '#0f3460', offset: 1 },
    ]},
    stroke: 'transparent', strokeWidth: 0, borderRadius: 0,
  } as ShapeElement);

  els.push({
    id: uid(), type: 'text',
    x: 60, y: 120, width: W - 120, height: 60, rotation: 0, opacity: 0.3,
    locked: false, visible: true, editable: true, editableProps: ['content'],
    content: 'FONT SHOWCASE',
    fontFamily: 'Pretendard', fontSize: 18, fontWeight: 'bold', fontStyle: 'normal',
    color: '#e2e8f0', textAlign: 'left', lineHeight: 1, letterSpacing: 8, textDecoration: 'none',
    textShadow: noShadow, textStroke: noStroke, textBackground: '',
  } as TextElement);

  els.push({
    id: uid(), type: 'shape', shape: 'rect',
    x: 60, y: 190, width: 40, height: 3, rotation: 0, opacity: 0.4,
    locked: true, visible: true, editable: false,
    fill: '#e2e8f0', stroke: 'transparent', strokeWidth: 0, borderRadius: 2,
  } as ShapeElement);

  els.push({
    id: uid(), type: 'text',
    x: 60, y: 280, width: W - 120, height: 400, rotation: 0, opacity: 1,
    locked: false, visible: true, editable: true,
    editableProps: ['content', 'fontFamily', 'fontSize', 'color'],
    content: '오늘의\n감성 폰트',
    fontFamily: 'Pretendard', fontSize: 120, fontWeight: 'bold', fontStyle: 'normal',
    color: '#ffffff', textAlign: 'left', lineHeight: 1.15, letterSpacing: -3, textDecoration: 'none',
    textShadow: noShadow, textStroke: noStroke, textBackground: '',
  } as TextElement);

  els.push({
    id: uid(), type: 'text',
    x: 60, y: 720, width: W - 120, height: 50, rotation: 0, opacity: 0.5,
    locked: false, visible: true, editable: true, editableProps: ['content'],
    content: 'Pretendard · Bold · 120px',
    fontFamily: 'Pretendard', fontSize: 20, fontWeight: 'normal', fontStyle: 'normal',
    color: '#94a3b8', textAlign: 'left', lineHeight: 1, letterSpacing: 2, textDecoration: 'none',
    textShadow: noShadow, textStroke: noStroke, textBackground: '',
  } as TextElement);

  els.push({
    id: uid(), type: 'shape', shape: 'rect',
    x: 60, y: 790, width: W - 120, height: 1, rotation: 0, opacity: 0.1,
    locked: true, visible: true, editable: false,
    fill: '#e2e8f0', stroke: 'transparent', strokeWidth: 0, borderRadius: 0,
  } as ShapeElement);

  els.push({
    id: uid(), type: 'text',
    x: 60, y: 830, width: W - 120, height: 120, rotation: 0, opacity: 0.4,
    locked: false, visible: true, editable: true, editableProps: ['content'],
    content: '다람쥐 헌 쳇바퀴에 타고파\nThe quick brown fox jumps\n0123456789 !@#$%',
    fontFamily: 'Pretendard', fontSize: 22, fontWeight: 'normal', fontStyle: 'normal',
    color: '#cbd5e1', textAlign: 'left', lineHeight: 1.8, letterSpacing: 1, textDecoration: 'none',
    textShadow: noShadow, textStroke: noStroke, textBackground: '',
  } as TextElement);

  els.push({
    id: uid(), type: 'text',
    x: W - 260, y: H - 60, width: 200, height: 30, rotation: 0, opacity: 0.3,
    locked: false, visible: true, editable: true, editableProps: ['content'],
    content: '@your_instagram',
    fontFamily: 'Pretendard', fontSize: 14, fontWeight: 'normal', fontStyle: 'normal',
    color: '#94a3b8', textAlign: 'right', lineHeight: 1, letterSpacing: 1, textDecoration: 'none',
    textShadow: noShadow, textStroke: noStroke, textBackground: '',
  } as TextElement);

  return { elements: els, backgroundColor: '#1a1a2e' };
}

function makePhotoContentElements(): {
  elements: CanvasElement[];
  backgroundColor: string;
} {
  const W = 1080;
  const H = 1350;
  const noShadow = { enabled: false as const, color: '#000', offsetX: 0, offsetY: 0, blur: 0 };
  const noStroke = { enabled: false as const, color: '#000', width: 0 };

  const els: CanvasElement[] = [];

  els.push({
    id: uid(), type: 'shape', shape: 'rect',
    x: 0, y: 0, width: W, height: H, rotation: 0, opacity: 1,
    locked: true, visible: true, editable: false,
    fill: '#0a0a0a', stroke: 'transparent', strokeWidth: 0, borderRadius: 0,
  } as ShapeElement);

  els.push({
    id: uid(), type: 'image',
    x: 0, y: 0, width: W, height: 900, rotation: 0, opacity: 1,
    locked: false, visible: true, editable: true,
    editableProps: ['src'],
    placeholder: '사진을 넣어주세요',
    src: '', scaleMode: 'fill', crop: null,
    filters: { brightness: 0, contrast: 0, saturation: 0, blur: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0 },
    filterPreset: null,
    gradientOverlay: {
      enabled: true,
      gradient: { type: 'linear', angle: 180, stops: [
        { color: 'rgba(0,0,0,0)', offset: 0.4 },
        { color: 'rgba(10,10,10,1)', offset: 1 },
      ]},
      opacity: 1,
    },
  } as ImageElement);

  els.push({
    id: uid(), type: 'text',
    x: 60, y: 920, width: W - 120, height: 50, rotation: 0, opacity: 0.6,
    locked: false, visible: true, editable: true, editableProps: ['content', 'color'],
    content: 'PROMOTION',
    fontFamily: 'Pretendard', fontSize: 16, fontWeight: 'bold', fontStyle: 'normal',
    color: '#a78bfa', textAlign: 'left', lineHeight: 1, letterSpacing: 6, textDecoration: 'none',
    textShadow: noShadow, textStroke: noStroke, textBackground: '',
  } as TextElement);

  els.push({
    id: uid(), type: 'text',
    x: 60, y: 970, width: W - 120, height: 180, rotation: 0, opacity: 1,
    locked: false, visible: true, editable: true,
    editableProps: ['content', 'fontFamily', 'fontSize', 'color'],
    content: '지금 시작하는\n봄 시즌 특가',
    fontFamily: 'Pretendard', fontSize: 56, fontWeight: 'bold', fontStyle: 'normal',
    color: '#ffffff', textAlign: 'left', lineHeight: 1.25, letterSpacing: -1, textDecoration: 'none',
    textShadow: noShadow, textStroke: noStroke, textBackground: '',
  } as TextElement);

  els.push({
    id: uid(), type: 'text',
    x: 60, y: 1160, width: W - 120, height: 60, rotation: 0, opacity: 0.5,
    locked: false, visible: true, editable: true, editableProps: ['content'],
    content: '3.15 ~ 3.31  ·  전 상품 최대 40% OFF',
    fontFamily: 'Pretendard', fontSize: 18, fontWeight: 'normal', fontStyle: 'normal',
    color: '#d1d5db', textAlign: 'left', lineHeight: 1.4, letterSpacing: 0.5, textDecoration: 'none',
    textShadow: noShadow, textStroke: noStroke, textBackground: '',
  } as TextElement);

  els.push({
    id: uid(), type: 'shape', shape: 'rect',
    x: 60, y: 1240, width: 200, height: 48, rotation: 0, opacity: 1,
    locked: false, visible: true, editable: true,
    fill: '#a78bfa', stroke: 'transparent', strokeWidth: 0, borderRadius: 24,
  } as ShapeElement);

  els.push({
    id: uid(), type: 'text',
    x: 60, y: 1250, width: 200, height: 30, rotation: 0, opacity: 1,
    locked: false, visible: true, editable: true, editableProps: ['content'],
    content: '자세히 보기 →',
    fontFamily: 'Pretendard', fontSize: 16, fontWeight: 'bold', fontStyle: 'normal',
    color: '#ffffff', textAlign: 'center', lineHeight: 1, letterSpacing: 0, textDecoration: 'none',
    textShadow: noShadow, textStroke: noStroke, textBackground: '',
  } as TextElement);

  els.push({
    id: uid(), type: 'text',
    x: W - 260, y: H - 50, width: 200, height: 30, rotation: 0, opacity: 0.3,
    locked: false, visible: true, editable: true, editableProps: ['content'],
    content: '@your_instagram',
    fontFamily: 'Pretendard', fontSize: 14, fontWeight: 'normal', fontStyle: 'normal',
    color: '#9ca3af', textAlign: 'right', lineHeight: 1, letterSpacing: 1, textDecoration: 'none',
    textShadow: noShadow, textStroke: noStroke, textBackground: '',
  } as TextElement);

  return { elements: els, backgroundColor: '#0a0a0a' };
}

export default function HomePage() {
  const router = useRouter();
  const templateRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>('detail-page');

  const initProject = useEditorStore((s) => s.initProject);
  const loadProject = useEditorStore((s) => s.loadProject);
  const saveProject = useProjectStore((s) => s.saveProject);

  const filteredTemplates = useMemo(() => {
    let result = BUILT_IN_TEMPLATES;

    if (activeCategory !== 'all') {
      result = result.filter((t) => t.category.includes(activeCategory));
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    return result;
  }, [activeCategory, search]);

  const handleUseTemplate = (template: BuiltInTemplate) => {
    initProject(template.name, template.preset, 'design', {
      elements: template.elements,
      backgroundColor: template.backgroundColor,
    });
    const project = useEditorStore.getState().project;
    if (project) {
      saveProject(project);
      router.push(`/editor/${project.id}`);
    }
  };

  const handleLoadFigmaDesign = () => {
    const project = createFigmaDesignProject();
    loadProject(project);
    saveProject(project);
    router.push(`/editor/${project.id}`);
  };

  const handleCreateBlank = () => {
    setCreateOpen(true);
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    initProject(newName.trim(), selectedPreset);
    const project = useEditorStore.getState().project;
    if (project) {
      saveProject(project);
      router.push(`/editor/${project.id}`);
    }
    setCreateOpen(false);
    setNewName('');
  };

  const handleCreateInstagramPost = () => {
    const { elements, backgroundColor } = makeInstagramPostElements();
    initProject('인스타 포스트', 'instagram-feed', 'design', {
      elements,
      backgroundColor,
    });
    const project = useEditorStore.getState().project;
    if (project) {
      saveProject(project);
      router.push(`/editor/${project.id}`);
    }
  };

  const handleCreateFontShowcase = () => {
    const { elements, backgroundColor } = makeFontShowcaseElements();
    initProject('폰트 쇼케이스', 'instagram-feed', 'design', {
      elements,
      backgroundColor,
    });
    const project = useEditorStore.getState().project;
    if (project) {
      saveProject(project);
      router.push(`/editor/${project.id}`);
    }
  };

  const handleCreatePhotoContent = () => {
    const { elements, backgroundColor } = makePhotoContentElements();
    initProject('사진 콘텐츠', 'custom', 'design', {
      elements,
      backgroundColor,
    });
    const project = useEditorStore.getState().project;
    if (project) {
      project.canvas.width = 1080;
      project.canvas.height = 1350;
      saveProject(project);
      router.push(`/editor/${project.id}`);
    }
  };

  const handleCreateCherryBlossom = () => {
    const { elements, backgroundColor } = makeCherryBlossomElements();
    initProject('2026 벚꽃 개화 시기', 'detail-page', 'design', {
      elements,
      backgroundColor,
    });
    const project = useEditorStore.getState().project;
    if (project) {
      saveProject(project);
      router.push(`/editor/${project.id}`);
    }
  };

  const scrollToTemplates = (cat: TemplateCategory) => {
    setActiveCategory(cat);
    templateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1e1e2e] to-[#7c3aed] flex items-center justify-center">
              <HiSparkles className="w-4 h-4 text-white" />
            </div>
            크리에이티브 스튜디오
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/projects')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <HiFolder className="w-4 h-4" />
              내 프로젝트
            </button>
            <button
              onClick={handleCreateBlank}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1e1e2e] text-white rounded-xl text-sm font-semibold hover:bg-[#2d2d44] transition-all hover:shadow-lg hover:shadow-[#1e1e2e]/20"
            >
              <HiPlusCircle className="w-4 h-4" />
              새로 만들기
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f0f1e] via-[#1a1a3e] to-[#2d1b69]">
        {/* Decorative orbs */}
        <div className="absolute top-10 left-[10%] w-72 h-72 rounded-full bg-purple-500/20 blur-3xl animate-float-slow" />
        <div className="absolute bottom-10 right-[15%] w-96 h-96 rounded-full bg-indigo-400/15 blur-3xl animate-float-medium" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-3xl animate-pulse-glow" />
        <div className="absolute top-20 right-[25%] w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500/30 to-orange-400/30 blur-xl animate-float-fast" />
        <div className="absolute bottom-32 left-[20%] w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400/30 to-blue-500/30 blur-xl animate-float-medium" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-24 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-8">
            <HiSparkles className="w-4 h-4 text-purple-300" />
            <span className="text-sm font-medium text-purple-200">
              상세페이지 · 폰트 · 사진 콘텐츠
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
            크리에이티브
            <br />
            <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent">
              스튜디오
            </span>
          </h1>

          <p className="mt-5 text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            상세페이지, 폰트 디자인, 사진 콘텐츠를 한곳에서.
            <br className="hidden md:block" />
            인스타그램 · 마케팅 · 홍보물을 누구나 쉽게 만들 수 있어요.
          </p>

          {/* 3 Creation Categories */}
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <button
              onClick={handleCreateBlank}
              className="group flex flex-col items-center gap-2.5 p-5 rounded-2xl bg-white/[0.07] border border-white/10 hover:bg-white/[0.14] hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-400/30 flex items-center justify-center group-hover:from-blue-500/50 group-hover:to-cyan-400/50 transition-all">
                <span className="text-2xl">📄</span>
              </div>
              <span className="text-sm font-semibold text-white">상세페이지</span>
              <span className="text-[11px] text-gray-400 leading-tight">쇼핑몰 · 브랜드</span>
            </button>
            <button
              onClick={() => scrollToTemplates('all')}
              className="group flex flex-col items-center gap-2.5 p-5 rounded-2xl bg-white/[0.07] border border-white/10 hover:bg-white/[0.14] hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-400/30 flex items-center justify-center group-hover:from-purple-500/50 group-hover:to-pink-400/50 transition-all">
                <span className="text-2xl">🔤</span>
              </div>
              <span className="text-sm font-semibold text-white">폰트 디자인</span>
              <span className="text-[11px] text-gray-400 leading-tight">타이포그래피 · 감성</span>
            </button>
            <button
              onClick={() => scrollToTemplates('all')}
              className="group flex flex-col items-center gap-2.5 p-5 rounded-2xl bg-white/[0.07] border border-white/10 hover:bg-white/[0.14] hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/30 to-rose-400/30 flex items-center justify-center group-hover:from-orange-500/50 group-hover:to-rose-400/50 transition-all">
                <span className="text-2xl">📸</span>
              </div>
              <span className="text-sm font-semibold text-white">사진 콘텐츠</span>
              <span className="text-[11px] text-gray-400 leading-tight">인스타 · 마케팅</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="mt-10 relative max-w-xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-orange-500/30 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative flex items-center">
                <HiMagnifyingGlass className="absolute left-5 w-5 h-5 text-gray-400 z-10" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="템플릿 검색..."
                  className="w-full pl-13 pr-5 py-4 rounded-2xl bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 shadow-xl shadow-black/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-10 flex items-center justify-center gap-8 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span>{BUILT_IN_TEMPLATES.length}개 무료 템플릿</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              <span>3가지 콘텐츠 타입</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Free Templates Section ── */}
      <section ref={templateRef} className="scroll-mt-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-20">
          {/* Section header */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                무료 템플릿
              </h2>
              <p className="mt-2 text-gray-500">
                {filteredTemplates.length}개의 무료 템플릿
              </p>
            </div>
          </div>

          {/* Category pills */}
          <div className="mb-8 -mx-6 px-6">
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2">
              {TEMPLATE_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    activeCategory === cat.key
                      ? 'bg-[#1e1e2e] text-white shadow-md shadow-gray-900/10'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Template grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {/* Blank template card */}
            <div>
              <button
                onClick={handleCreateBlank}
                className="aspect-[3/4] w-full rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#7c3aed] bg-gray-50 hover:bg-purple-50/50 flex flex-col items-center justify-center gap-3 transition-all duration-300 group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-gray-200 group-hover:bg-gradient-to-br group-hover:from-[#1e1e2e] group-hover:to-[#7c3aed] flex items-center justify-center transition-all duration-300">
                  <HiPlus className="w-7 h-7 text-gray-500 group-hover:text-white transition-colors duration-300" />
                </div>
                <span className="text-sm font-medium text-gray-500 group-hover:text-gray-800 transition-colors">
                  빈 프로젝트 만들기
                </span>
              </button>
            </div>

            {/* Figma Design Sample — Featured card */}
            <div className="group/card">
              <button
                onClick={handleLoadFigmaDesign}
                className="aspect-[3/4] w-full rounded-2xl overflow-hidden relative cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-gray-900/15"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#07021B] via-[#1a1040] to-[#2d1b69]" />
                <div className="absolute inset-0 p-5 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-semibold text-purple-300 tracking-wider">FIGMA SAMPLE</div>
                    <div className="mt-2 text-[11px] text-purple-400/60">960×640 · 6페이지</div>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg font-bold text-white leading-tight">상세페이지<br/>만들기</div>
                      <div className="mt-1 text-xs text-purple-300/70">리디드로우의 피그마 강의</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span className="text-[10px] text-gray-400">6페이지 디자인 자료</span>
                  </div>
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/40 transition-all duration-300 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold px-5 py-2.5 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 opacity-0 group-hover/card:opacity-100 translate-y-2 group-hover/card:translate-y-0 transition-all duration-300">
                    이 디자인 열기
                  </span>
                </div>
              </button>
              <p className="mt-3 text-sm font-medium text-gray-700 truncate">피그마 디자인 자료모음</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">온라인셀러를 위한 상세페이지 만들기 가이드</p>
            </div>

            {/* Instagram Post Quick-Create */}
            <div className="group/card">
              <button
                onClick={handleCreateInstagramPost}
                className="aspect-[3/4] w-full rounded-2xl overflow-hidden relative cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-pink-900/20"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045]" />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute inset-0 p-5 flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                      <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                      </svg>
                      <span className="text-[11px] font-semibold text-white">INSTAGRAM</span>
                    </div>
                    <div className="mt-2 text-[11px] text-white/60">1080×1080 · 피드 포스트</div>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg font-bold text-white leading-tight">인스타 포스트<br />바로 만들기</div>
                      <div className="mt-1.5 text-xs text-white/60">사진 + 텍스트 템플릿</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span className="text-[10px] text-white/70">클릭하면 바로 편집</span>
                  </div>
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/40 transition-all duration-300 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold px-5 py-2.5 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 opacity-0 group-hover/card:opacity-100 translate-y-2 group-hover/card:translate-y-0 transition-all duration-300">
                    인스타 포스트 만들기
                  </span>
                </div>
              </button>
              <p className="mt-3 text-sm font-medium text-gray-700 truncate">인스타그램 피드 포스트</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">사진 + 텍스트 마케팅 포스트 템플릿</p>
            </div>

            <div className="group/card">
              <button
                onClick={handleCreateCherryBlossom}
                className="aspect-[3/4] w-full rounded-2xl overflow-hidden relative cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-pink-400/20"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#fce4ec] via-[#f8bbd0] to-[#f48fb1]" />
                <div className="absolute inset-0 p-5 flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/40 backdrop-blur-sm">
                      <span className="text-sm">🌸</span>
                      <span className="text-[11px] font-semibold text-[#880e4f]">2026 벚꽃</span>
                    </div>
                    <div className="mt-2 text-[11px] text-[#ad1457]/60">860×2400 · 5섹션</div>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg font-bold text-[#4a0e2e] leading-tight">벚꽃 개화 시기<br />가이드</div>
                      <div className="mt-1.5 text-xs text-[#880e4f]/60">전국 지역별 개화·만개일</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#e91e63]" />
                    <span className="text-[10px] text-[#880e4f]/70">인스타 감성 콘텐츠</span>
                  </div>
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/30 transition-all duration-300 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold px-5 py-2.5 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 opacity-0 group-hover/card:opacity-100 translate-y-2 group-hover/card:translate-y-0 transition-all duration-300">
                    벚꽃 가이드 만들기
                  </span>
                </div>
              </button>
              <p className="mt-3 text-sm font-medium text-gray-700 truncate">2026 벚꽃 개화 시기</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">전국 지역별 개화·만개 예상일 5섹션 가이드</p>
            </div>

            <div className="group/card">
              <button
                onClick={handleCreateFontShowcase}
                className="aspect-[3/4] w-full rounded-2xl overflow-hidden relative cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-indigo-900/20"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]" />
                <div className="absolute inset-0 p-5 flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm">
                      <span className="text-sm">🔤</span>
                      <span className="text-[11px] font-semibold text-blue-300">FONT</span>
                    </div>
                    <div className="mt-2 text-[11px] text-blue-400/60">1080×1080 · 타이포그래피</div>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg font-bold text-white leading-tight">폰트 쇼케이스<br />만들기</div>
                      <div className="mt-1.5 text-xs text-blue-300/60">감성 타이포그래피 포스트</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span className="text-[10px] text-blue-300/70">폰트 소개 · 감성 글귀</span>
                  </div>
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/40 transition-all duration-300 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold px-5 py-2.5 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 opacity-0 group-hover/card:opacity-100 translate-y-2 group-hover/card:translate-y-0 transition-all duration-300">
                    폰트 포스트 만들기
                  </span>
                </div>
              </button>
              <p className="mt-3 text-sm font-medium text-gray-700 truncate">폰트 쇼케이스</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">감성 타이포그래피 인스타 포스트</p>
            </div>

            <div className="group/card">
              <button
                onClick={handleCreatePhotoContent}
                className="aspect-[3/4] w-full rounded-2xl overflow-hidden relative cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-purple-900/20"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2a] to-[#2d1b4e]" />
                <div className="absolute inset-0 p-5 flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm">
                      <span className="text-sm">📸</span>
                      <span className="text-[11px] font-semibold text-purple-300">PHOTO</span>
                    </div>
                    <div className="mt-2 text-[11px] text-purple-400/60">1080×1350 · 4:5 세로형</div>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg font-bold text-white leading-tight">사진 콘텐츠<br />만들기</div>
                      <div className="mt-1.5 text-xs text-purple-300/60">홍보 · 마케팅 포스트</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span className="text-[10px] text-purple-300/70">사진 + 텍스트 오버레이</span>
                  </div>
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/40 transition-all duration-300 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold px-5 py-2.5 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 opacity-0 group-hover/card:opacity-100 translate-y-2 group-hover/card:translate-y-0 transition-all duration-300">
                    사진 콘텐츠 만들기
                  </span>
                </div>
              </button>
              <p className="mt-3 text-sm font-medium text-gray-700 truncate">사진 홍보 콘텐츠</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">사진 + 텍스트 마케팅 · 프로모션 포스트</p>
            </div>

            {filteredTemplates.map((template) => (
              <div key={template.id} className="group/card">
                <div
                  className="aspect-[3/4] w-full rounded-2xl overflow-hidden relative cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-gray-900/15"
                  onClick={() => handleUseTemplate(template)}
                >
                  {template.thumbnailImage ? (
                    <img
                      src={template.thumbnailImage}
                      alt={template.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <div
                        className="absolute inset-0"
                        style={{ background: template.thumbnail.background }}
                      />
                      <div className="absolute inset-0 p-5 flex flex-col">
                        <div
                          className="h-1 w-2/3 rounded-full mt-3 opacity-40"
                          style={{ backgroundColor: template.thumbnail.accent }}
                        />
                        <div className="flex-1 flex items-center justify-center">
                          <div className="text-center">
                            {template.thumbnail.previewText && (
                              <span
                                className="text-lg md:text-xl font-bold opacity-80 tracking-wide"
                                style={{ color: template.thumbnail.accent }}
                              >
                                {template.thumbnail.previewText}
                              </span>
                            )}
                            <div
                              className="w-16 h-16 rounded-full mx-auto mt-3 opacity-20"
                              style={{ backgroundColor: template.thumbnail.accent }}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5 mb-3">
                          <div className="h-1 w-full rounded-full opacity-25" style={{ backgroundColor: template.thumbnail.accent }} />
                          <div className="h-1 w-4/5 rounded-full opacity-20" style={{ backgroundColor: template.thumbnail.accent }} />
                          <div className="h-1 w-3/5 rounded-full opacity-15" style={{ backgroundColor: template.thumbnail.accent }} />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/50 transition-all duration-300 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 opacity-0 group-hover/card:opacity-100 translate-y-2 group-hover/card:translate-y-0 transition-all duration-300">
                      <span className="text-white text-sm font-semibold px-5 py-2.5 bg-white/20 backdrop-blur-md rounded-xl border border-white/30">
                        이 템플릿 사용하기
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-sm font-medium text-gray-700 truncate group-hover/card:text-gray-900 transition-colors">
                  {template.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {template.description}
                </p>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {filteredTemplates.length === 0 && (
            <div className="text-center py-24">
              <div className="w-20 h-20 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-5">
                <HiMagnifyingGlass className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg font-medium">
                검색 결과가 없습니다
              </p>
              <p className="text-gray-400 text-sm mt-2">
                다른 키워드로 검색하거나 카테고리를 변경해보세요
              </p>
              <button
                onClick={() => {
                  setSearch('');
                  setActiveCategory('all');
                }}
                className="mt-6 px-5 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                전체 템플릿 보기
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Category Browse Section ── */}
      <section className="bg-[#fafafa] border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              카테고리별 둘러보기
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {TEMPLATE_CATEGORIES.filter((c) => c.key !== 'all').map((cat) => {
              const visual = CATEGORY_VISUALS[cat.key as Exclude<TemplateCategory, 'all'>];
              const count = BUILT_IN_TEMPLATES.filter((t) =>
                t.category.includes(cat.key)
              ).length;

              return (
                <button
                  key={cat.key}
                  onClick={() => scrollToTemplates(cat.key)}
                  className="group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:shadow-xl hover:shadow-gray-900/10 hover:-translate-y-1"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${visual.gradient} opacity-90 group-hover:opacity-100 transition-opacity`}
                  />
                  <div className="relative z-10">
                    <span className="text-3xl">{visual.icon}</span>
                    <h3 className="mt-3 text-lg font-bold text-white">
                      {cat.label}
                    </h3>
                    <p className="mt-1 text-sm text-white/70">
                      {count}개 템플릿
                    </p>
                    <HiChevronRight className="mt-3 w-5 h-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#1e1e2e] text-gray-400">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <HiSparkles className="w-3.5 h-3.5 text-white" />
                </div>
                크리에이티브 스튜디오
              </div>
              <p className="mt-2 text-sm text-gray-500">
                상세페이지 · 폰트 · 사진 콘텐츠를 한곳에서
              </p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <button className="hover:text-white transition-colors">이용약관</button>
              <button className="hover:text-white transition-colors">개인정보처리방침</button>
              <button className="hover:text-white transition-colors">고객센터</button>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-sm text-gray-600">
            © 2025 크리에이티브 스튜디오. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ── Create Modal ── */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="새 프로젝트"
      >
        <div className="flex flex-col gap-4 min-w-[440px]">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              프로젝트 이름
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="프로젝트 이름을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
              }}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              프리셋 선택
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CANVAS_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  className={`flex flex-col items-start p-3 rounded-lg border text-left transition-colors ${
                    selectedPreset === preset.key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPreset(preset.key)}
                >
                  <span className="text-sm font-medium">{preset.label}</span>
                  <span className="text-xs text-gray-400 mt-0.5">
                    {preset.width} × {preset.height} · {preset.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            className="w-full py-2.5 rounded-lg bg-[#1e1e2e] text-white font-medium hover:bg-[#2d2d44] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleCreate}
            disabled={!newName.trim()}
          >
            만들기
          </button>
        </div>
      </Modal>
    </div>
  );
}
