'use client';

import Modal from '@/components/ui/Modal';

const shortcuts = [
  {
    category: '선택',
    items: [
      { keys: 'Tab', desc: '다음 요소 선택' },
      { keys: 'Shift + Tab', desc: '이전 요소 선택' },
      { keys: 'Esc', desc: '선택 해제' },
      { keys: '⌘ + A', desc: '전체 선택' },
    ],
  },
  {
    category: '편집',
    items: [
      { keys: 'Enter', desc: '텍스트 편집 / 프레임 진입' },
      { keys: 'Delete', desc: '선택한 요소 삭제' },
      { keys: '⌘ + D', desc: '요소 복제' },
      { keys: '⌘ + C', desc: '복사' },
      { keys: '⌘ + X', desc: '잘라내기' },
      { keys: '⌘ + V', desc: '붙여넣기' },
      { keys: '⌘ + Z', desc: '실행 취소' },
      { keys: '⌘ + Shift + Z', desc: '다시 실행' },
    ],
  },
  {
    category: '스타일',
    items: [
      { keys: '⌘ + Alt + C', desc: '스타일 복사' },
      { keys: '⌘ + Alt + V', desc: '스타일 붙여넣기' },
    ],
  },
  {
    category: '이동 & 정렬',
    items: [
      { keys: '← → ↑ ↓', desc: '1px 이동' },
      { keys: 'Shift + ← → ↑ ↓', desc: '10px 이동' },
      { keys: '⌘ + ]', desc: '앞으로 이동' },
      { keys: '⌘ + [', desc: '뒤로 이동' },
      { keys: '⌘ + Alt + ]', desc: '맨 앞으로' },
      { keys: '⌘ + Alt + [', desc: '맨 뒤로' },
    ],
  },
  {
    category: '보기',
    items: [
      { keys: '⌘ + 0', desc: '줌 초기화' },
      { keys: '⌘ + +', desc: '확대' },
      { keys: '⌘ + -', desc: '축소' },
      { keys: 'Ctrl + Scroll', desc: '줌 인/아웃' },
    ],
  },
];

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="키보드 단축키">
      <div className="w-[520px] max-h-[70vh] overflow-y-auto">
        <div className="space-y-5">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">{section.category}</h3>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <div key={item.keys} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50">
                    <span className="text-sm text-gray-700">{item.desc}</span>
                    <kbd className="px-2 py-0.5 text-xs font-mono bg-gray-100 border border-gray-300 rounded text-gray-600">{item.keys}</kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
