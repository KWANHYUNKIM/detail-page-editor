'use client';

import { useState, useEffect, useRef } from 'react';
import { FONT_LIST, FONT_CATEGORIES, type FontCategory, type FontOption } from '@/constants/fonts';
import { ensureFontLoaded, isFontLoaded } from '@/lib/fonts/fontLoader';
import { HiChevronDown, HiMagnifyingGlass, HiCheck } from 'react-icons/hi2';

interface FontPickerProps {
  value: string;
  onChange: (fontFamily: string) => void;
}

export default function FontPicker({ value, onChange }: FontPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<FontCategory>('all');
  const [loadingFont, setLoadingFont] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Focus search on open
  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  // Filter fonts
  const filtered = FONT_LIST.filter((f) => {
    if (category !== 'all' && f.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      return f.label.toLowerCase().includes(q) || f.family.toLowerCase().includes(q);
    }
    return true;
  });

  // Current font label
  const currentFont = FONT_LIST.find((f) => f.family === value);
  const displayLabel = currentFont?.label ?? value.split(',')[0].trim();

  const handleSelect = async (font: FontOption) => {
    setLoadingFont(font.family);
    const loaded = await ensureFontLoaded(font.family);
    setLoadingFont(null);

    if (loaded) {
      onChange(font.family);
    } else {
      // Apply anyway — will use fallback but at least saves the preference
      onChange(font.family);
    }
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs text-gray-500 mb-1">폰트</label>

      {/* Trigger */}
      <button
        type="button"
        className="flex items-center justify-between w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:border-gray-400 transition-colors text-left"
        onClick={() => setOpen(!open)}
      >
        <span
          className="truncate"
          style={{ fontFamily: isFontLoaded(value) ? value : undefined }}
        >
          {displayLabel}
        </span>
        <HiChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
          style={{ width: '280px' }}
        >
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-50 rounded-md">
              <HiMagnifyingGlass className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                placeholder="폰트 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-0.5 px-2 py-1.5 border-b border-gray-100 overflow-x-auto hide-scrollbar">
            {FONT_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                className={`px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap transition-colors ${
                  category === cat.key
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
                onClick={() => setCategory(cat.key)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Font list */}
          <div className="max-h-[260px] overflow-y-auto">
            {filtered.length === 0 && (
              <div className="py-6 text-center text-xs text-gray-400">
                검색 결과가 없습니다
              </div>
            )}
            {filtered.map((font) => {
              const isSelected = font.family === value;
              const isLoading = loadingFont === font.family;
              const loaded = isFontLoaded(font.family);

              return (
                <button
                  key={font.family}
                  type="button"
                  className={`flex items-center gap-2 w-full px-3 py-2 text-left text-sm transition-colors ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelect(font)}
                  disabled={isLoading}
                >
                  {/* Font preview */}
                  <span
                    className="flex-1 truncate"
                    style={{ fontFamily: loaded ? font.family : undefined }}
                  >
                    {font.label}
                  </span>

                  {/* Category badge */}
                  <span className="text-[9px] text-gray-400 uppercase tracking-wider shrink-0">
                    {font.category}
                  </span>

                  {/* Status */}
                  {isLoading && (
                    <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  )}
                  {isSelected && !isLoading && (
                    <HiCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
