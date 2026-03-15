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
    id: 'ios-26',
    name: 'iOS and iPadOS 26',
    gradient: 'from-blue-400 to-indigo-600',
    componentCount: 175,
    folders: [
      {
        id: 'examples',
        name: 'Examples',
        thumbnailColor: '#f5f5f5',
        components: [
          { id: 'ex-welcome', name: 'Welcome Screen', thumbnailColor: '#e3f2fd' },
          { id: 'ex-onboarding', name: 'Onboarding Flow', thumbnailColor: '#e3f2fd' },
          { id: 'ex-settings', name: 'Settings Page', thumbnailColor: '#e3f2fd' },
          { id: 'ex-profile', name: 'Profile View', thumbnailColor: '#e3f2fd' },
        ],
      },
      {
        id: 'action-sheets',
        name: 'Action Sheets',
        thumbnailColor: '#f5f5f5',
        components: [
          { id: 'as-standard', name: 'Standard Action Sheet', thumbnailColor: '#e8eaf6' },
          { id: 'as-destructive', name: 'Destructive Action', thumbnailColor: '#ffebee' },
          { id: 'as-share', name: 'Share Sheet', thumbnailColor: '#e8eaf6' },
        ],
      },
      {
        id: 'activity-views',
        name: 'Activity Views',
        thumbnailColor: '#f5f5f5',
        components: [
          { id: 'av-share', name: 'Share Activity', thumbnailColor: '#e3f2fd' },
          { id: 'av-copy', name: 'Copy Activity', thumbnailColor: '#e3f2fd' },
          { id: 'av-airdrop', name: 'AirDrop', thumbnailColor: '#e3f2fd' },
          { id: 'av-message', name: 'Message Activity', thumbnailColor: '#e3f2fd' },
          { id: 'av-mail', name: 'Mail Activity', thumbnailColor: '#e3f2fd' },
        ],
      },
      {
        id: 'alerts',
        name: 'Alerts',
        thumbnailColor: '#f5f5f5',
        components: [
          { id: 'al-simple', name: 'Simple Alert', thumbnailColor: '#fff3e0' },
          { id: 'al-confirm', name: 'Confirmation Alert', thumbnailColor: '#fff3e0' },
          { id: 'al-text-input', name: 'Text Input Alert', thumbnailColor: '#fff3e0' },
        ],
      },
      {
        id: 'app-icons',
        name: 'App Icons',
        thumbnailColor: '#f5f5f5',
        components: [
          { id: 'ai-small', name: 'Small Icon (29pt)', thumbnailColor: '#f3e5f5' },
          { id: 'ai-medium', name: 'Medium Icon (40pt)', thumbnailColor: '#f3e5f5' },
          { id: 'ai-large', name: 'Large Icon (60pt)', thumbnailColor: '#f3e5f5' },
          { id: 'ai-appstore', name: 'App Store (1024pt)', thumbnailColor: '#f3e5f5' },
        ],
      },
      {
        id: 'buttons',
        name: 'Buttons',
        thumbnailColor: '#f5f5f5',
        components: [
          { id: 'btn-filled', name: 'Filled Button', thumbnailColor: '#e3f2fd' },
          { id: 'btn-tinted', name: 'Tinted Button', thumbnailColor: '#e3f2fd' },
          { id: 'btn-gray', name: 'Gray Button', thumbnailColor: '#e3f2fd' },
          { id: 'btn-plain', name: 'Plain Button', thumbnailColor: '#e3f2fd' },
          { id: 'btn-close', name: 'Close Button', thumbnailColor: '#e3f2fd' },
          { id: 'btn-toggle', name: 'Toggle Button', thumbnailColor: '#e3f2fd' },
        ],
      },
      {
        id: 'color-pickers',
        name: 'Color Pickers',
        thumbnailColor: '#f5f5f5',
        components: [
          { id: 'cp-grid', name: 'Grid Picker', thumbnailColor: '#fce4ec' },
          { id: 'cp-spectrum', name: 'Spectrum Picker', thumbnailColor: '#fce4ec' },
          { id: 'cp-sliders', name: 'Slider Picker', thumbnailColor: '#fce4ec' },
        ],
      },
      {
        id: 'contextual-menus',
        name: 'Contextual Menus',
        thumbnailColor: '#f5f5f5',
        components: [
          { id: 'cm-standard', name: 'Standard Menu', thumbnailColor: '#e8eaf6' },
          { id: 'cm-nested', name: 'Nested Menu', thumbnailColor: '#e8eaf6' },
          { id: 'cm-preview', name: 'Preview Menu', thumbnailColor: '#e8eaf6' },
          { id: 'cm-destructive', name: 'Destructive Item', thumbnailColor: '#ffebee' },
        ],
      },
      {
        id: 'keyboards',
        name: 'Keyboards',
        thumbnailColor: '#f5f5f5',
        components: [
          { id: 'kb-default', name: 'Default Keyboard', thumbnailColor: '#eceff1' },
          { id: 'kb-numeric', name: 'Numeric Pad', thumbnailColor: '#eceff1' },
          { id: 'kb-emoji', name: 'Emoji Keyboard', thumbnailColor: '#eceff1' },
        ],
      },
      {
        id: 'lists',
        name: 'Lists',
        thumbnailColor: '#f5f5f5',
        components: [
          { id: 'ls-plain', name: 'Plain List', thumbnailColor: '#e8eaf6' },
          { id: 'ls-inset', name: 'Inset Grouped', thumbnailColor: '#e8eaf6' },
          { id: 'ls-sidebar', name: 'Sidebar List', thumbnailColor: '#e8eaf6' },
          { id: 'ls-swipe', name: 'Swipe Actions', thumbnailColor: '#e8eaf6' },
        ],
      },
      {
        id: 'notifications',
        name: 'Notifications',
        thumbnailColor: '#f5f5f5',
        components: [
          { id: 'nt-banner', name: 'Banner', thumbnailColor: '#e3f2fd' },
          { id: 'nt-lockscreen', name: 'Lock Screen', thumbnailColor: '#e3f2fd' },
          { id: 'nt-grouped', name: 'Grouped Stack', thumbnailColor: '#e3f2fd' },
        ],
      },
    ],
  },
  {
    id: 'material-3',
    name: 'Material 3 Design Kit',
    gradient: 'from-purple-400 to-pink-500',
    componentCount: 357,
    folders: [
      {
        id: 'buttons',
        name: 'Buttons',
        thumbnailColor: '#e8eaf6',
        components: [
          { id: 'm3-btn-filled', name: 'Filled Button', thumbnailColor: '#e8eaf6' },
          { id: 'm3-btn-outlined', name: 'Outlined Button', thumbnailColor: '#e8eaf6' },
          { id: 'm3-btn-text', name: 'Text Button', thumbnailColor: '#e8eaf6' },
          { id: 'm3-btn-elevated', name: 'Elevated Button', thumbnailColor: '#e8eaf6' },
          { id: 'm3-btn-tonal', name: 'Tonal Button', thumbnailColor: '#e8eaf6' },
          { id: 'm3-btn-fab', name: 'FAB', thumbnailColor: '#e8eaf6' },
          { id: 'm3-btn-efab', name: 'Extended FAB', thumbnailColor: '#e8eaf6' },
          { id: 'm3-btn-icon', name: 'Icon Button', thumbnailColor: '#e8eaf6' },
        ],
      },
      {
        id: 'cards',
        name: 'Cards',
        thumbnailColor: '#e8eaf6',
        components: [
          { id: 'm3-card-filled', name: 'Filled Card', thumbnailColor: '#ede7f6' },
          { id: 'm3-card-elevated', name: 'Elevated Card', thumbnailColor: '#ede7f6' },
          { id: 'm3-card-outlined', name: 'Outlined Card', thumbnailColor: '#ede7f6' },
        ],
      },
      {
        id: 'chips',
        name: 'Chips',
        thumbnailColor: '#e8eaf6',
        components: [
          { id: 'm3-chip-assist', name: 'Assist Chip', thumbnailColor: '#f3e5f5' },
          { id: 'm3-chip-filter', name: 'Filter Chip', thumbnailColor: '#f3e5f5' },
          { id: 'm3-chip-input', name: 'Input Chip', thumbnailColor: '#f3e5f5' },
          { id: 'm3-chip-suggest', name: 'Suggestion Chip', thumbnailColor: '#f3e5f5' },
        ],
      },
      {
        id: 'dialogs',
        name: 'Dialogs',
        thumbnailColor: '#e8eaf6',
        components: [
          { id: 'm3-dlg-basic', name: 'Basic Dialog', thumbnailColor: '#fce4ec' },
          { id: 'm3-dlg-fullscreen', name: 'Full-screen Dialog', thumbnailColor: '#fce4ec' },
          { id: 'm3-dlg-datepicker', name: 'Date Picker Dialog', thumbnailColor: '#fce4ec' },
          { id: 'm3-dlg-timepicker', name: 'Time Picker Dialog', thumbnailColor: '#fce4ec' },
        ],
      },
      {
        id: 'navigation',
        name: 'Navigation',
        thumbnailColor: '#e8eaf6',
        components: [
          { id: 'm3-nav-bar', name: 'Navigation Bar', thumbnailColor: '#e3f2fd' },
          { id: 'm3-nav-rail', name: 'Navigation Rail', thumbnailColor: '#e3f2fd' },
          { id: 'm3-nav-drawer', name: 'Navigation Drawer', thumbnailColor: '#e3f2fd' },
          { id: 'm3-nav-tabs', name: 'Tabs', thumbnailColor: '#e3f2fd' },
          { id: 'm3-nav-bottom', name: 'Bottom Sheet', thumbnailColor: '#e3f2fd' },
        ],
      },
      {
        id: 'text-fields',
        name: 'Text Fields',
        thumbnailColor: '#e8eaf6',
        components: [
          { id: 'm3-tf-filled', name: 'Filled Text Field', thumbnailColor: '#ede7f6' },
          { id: 'm3-tf-outlined', name: 'Outlined Text Field', thumbnailColor: '#ede7f6' },
          { id: 'm3-tf-search', name: 'Search Bar', thumbnailColor: '#ede7f6' },
        ],
      },
    ],
  },
  {
    id: 'simple-ds',
    name: 'Simple Design System',
    gradient: 'from-emerald-400 to-teal-600',
    componentCount: 1844,
    folders: [
      {
        id: 'atoms',
        name: 'Atoms',
        thumbnailColor: '#f3e5f5',
        components: [
          { id: 'sds-badge', name: 'Badge', thumbnailColor: '#e8f5e9' },
          { id: 'sds-avatar', name: 'Avatar', thumbnailColor: '#e8f5e9' },
          { id: 'sds-icon', name: 'Icon', thumbnailColor: '#e8f5e9' },
          { id: 'sds-divider', name: 'Divider', thumbnailColor: '#e8f5e9' },
          { id: 'sds-tag', name: 'Tag', thumbnailColor: '#e8f5e9' },
          { id: 'sds-spinner', name: 'Spinner', thumbnailColor: '#e8f5e9' },
        ],
      },
      {
        id: 'molecules',
        name: 'Molecules',
        thumbnailColor: '#f3e5f5',
        components: [
          { id: 'sds-input', name: 'Input Group', thumbnailColor: '#e0f2f1' },
          { id: 'sds-select', name: 'Select', thumbnailColor: '#e0f2f1' },
          { id: 'sds-tooltip', name: 'Tooltip', thumbnailColor: '#e0f2f1' },
          { id: 'sds-dropdown', name: 'Dropdown', thumbnailColor: '#e0f2f1' },
          { id: 'sds-breadcrumb', name: 'Breadcrumb', thumbnailColor: '#e0f2f1' },
        ],
      },
      {
        id: 'organisms',
        name: 'Organisms',
        thumbnailColor: '#f3e5f5',
        components: [
          { id: 'sds-header', name: 'Header', thumbnailColor: '#e0f7fa' },
          { id: 'sds-footer', name: 'Footer', thumbnailColor: '#e0f7fa' },
          { id: 'sds-sidebar', name: 'Sidebar', thumbnailColor: '#e0f7fa' },
          { id: 'sds-table', name: 'Data Table', thumbnailColor: '#e0f7fa' },
          { id: 'sds-modal', name: 'Modal', thumbnailColor: '#e0f7fa' },
          { id: 'sds-accordion', name: 'Accordion', thumbnailColor: '#e0f7fa' },
          { id: 'sds-carousel', name: 'Carousel', thumbnailColor: '#e0f7fa' },
        ],
      },
      {
        id: 'templates',
        name: 'Templates',
        thumbnailColor: '#f3e5f5',
        components: [
          { id: 'sds-landing', name: 'Landing Page', thumbnailColor: '#f1f8e9' },
          { id: 'sds-dashboard', name: 'Dashboard', thumbnailColor: '#f1f8e9' },
          { id: 'sds-auth', name: 'Auth Page', thumbnailColor: '#f1f8e9' },
          { id: 'sds-pricing', name: 'Pricing Page', thumbnailColor: '#f1f8e9' },
        ],
      },
    ],
  },
];


function getComponentBlueprint(comp: FolderComponent) {
  const n = comp.name.toLowerCase();
  if (n.includes('button') || n.includes('chip') || n.includes('tag') || n.includes('badge')) {
    return { width: 160, height: 44, fill: comp.thumbnailColor, borderRadius: 8 };
  }
  if (n.includes('card') || n.includes('modal') || n.includes('dialog') || n.includes('alert') || n.includes('sheet')) {
    return { width: 280, height: 180, fill: comp.thumbnailColor, borderRadius: 12 };
  }
  if (n.includes('navigation') || n.includes('header') || n.includes('footer') || n.includes('keyboard') || n.includes('bar')) {
    return { width: 360, height: 56, fill: comp.thumbnailColor, borderRadius: 0 };
  }
  if (n.includes('list') || n.includes('table') || n.includes('accordion') || n.includes('menu')) {
    return { width: 300, height: 200, fill: comp.thumbnailColor, borderRadius: 8 };
  }
  if (n.includes('icon') || n.includes('avatar') || n.includes('spinner')) {
    return { width: 64, height: 64, fill: comp.thumbnailColor, borderRadius: 32 };
  }
  if (n.includes('page') || n.includes('screen') || n.includes('dashboard') || n.includes('landing')) {
    return { width: 360, height: 480, fill: comp.thumbnailColor, borderRadius: 0 };
  }
  if (n.includes('picker') || n.includes('select') || n.includes('dropdown')) {
    return { width: 240, height: 160, fill: comp.thumbnailColor, borderRadius: 8 };
  }
  return { width: 200, height: 120, fill: comp.thumbnailColor, borderRadius: 8 };
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
