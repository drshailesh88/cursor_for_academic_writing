// Keyboard Shortcuts Configuration
// Centralized configuration for all keyboard shortcuts in the application

export type ModifierKey = 'cmd' | 'ctrl' | 'shift' | 'alt';
export type PlatformKey = 'mac' | 'windows' | 'linux';

export interface ShortcutDefinition {
  key: string;
  modifiers: ModifierKey[];
  description: string;
  category: string;
  // Optional condition - when this function returns false, shortcut is disabled
  when?: () => boolean;
}

/**
 * Feature shortcuts for the Academic Writing Platform
 * These shortcuts integrate with Research, Papers, and Discovery features
 */
export const FEATURE_SHORTCUTS: Record<string, ShortcutDefinition> = {
  // Tab Navigation (Cmd/Ctrl + Number)
  switchToChat: {
    key: '1',
    modifiers: ['cmd'],
    description: 'Switch to Chat tab',
    category: 'Navigation',
  },
  switchToResearch: {
    key: '2',
    modifiers: ['cmd'],
    description: 'Switch to Research tab',
    category: 'Navigation',
  },
  switchToPapers: {
    key: '3',
    modifiers: ['cmd'],
    description: 'Switch to Papers tab',
    category: 'Navigation',
  },
  switchToDiscovery: {
    key: '4',
    modifiers: ['cmd'],
    description: 'Switch to Discovery tab',
    category: 'Navigation',
  },

  // Research shortcuts (Cmd/Ctrl + Shift + R)
  openResearch: {
    key: 'r',
    modifiers: ['cmd', 'shift'],
    description: 'Open Deep Research',
    category: 'Research',
  },

  // Papers shortcuts (Cmd/Ctrl + Shift + L for Library)
  openPapers: {
    key: 'l',
    modifiers: ['cmd', 'shift'],
    description: 'Open Paper Library',
    category: 'Papers',
  },
  uploadPaper: {
    key: 'u',
    modifiers: ['cmd', 'shift'],
    description: 'Upload Paper',
    category: 'Papers',
  },

  // Discovery/Citation Explorer shortcuts (Cmd/Ctrl + Shift + D)
  // Note: Discovery requires a selected paper to explore citations
  // This shortcut is handled differently in the UI

  // Presentation shortcuts (Cmd/Ctrl + Shift + S for Slides)
  generatePresentation: {
    key: 'g',
    modifiers: ['cmd', 'shift'],
    description: 'Generate Presentation',
    category: 'Presentations',
  },
  openPresentationMode: {
    key: 's',
    modifiers: ['cmd', 'shift'],
    description: 'Open Presentation Mode',
    category: 'Presentations',
  },

  // Presentation navigation (only active in presentation mode)
  previousSlide: {
    key: 'ArrowLeft',
    modifiers: [],
    description: 'Previous slide',
    category: 'Presentation Navigation',
  },
  nextSlide: {
    key: 'ArrowRight',
    modifiers: [],
    description: 'Next slide',
    category: 'Presentation Navigation',
  },
  nextSlideSpace: {
    key: ' ',
    modifiers: [],
    description: 'Next slide (Space)',
    category: 'Presentation Navigation',
  },
  firstSlide: {
    key: 'Home',
    modifiers: [],
    description: 'Jump to first slide',
    category: 'Presentation Navigation',
  },
  lastSlide: {
    key: 'End',
    modifiers: [],
    description: 'Jump to last slide',
    category: 'Presentation Navigation',
  },
  exitPresenter: {
    key: 'Escape',
    modifiers: [],
    description: 'Exit presenter view',
    category: 'Presentation Navigation',
  },
  fullscreenPresentation: {
    key: 'f',
    modifiers: [],
    description: 'Toggle fullscreen',
    category: 'Presentation Navigation',
  },
  toggleSpeakerNotes: {
    key: 'n',
    modifiers: [],
    description: 'Toggle speaker notes',
    category: 'Presentation Navigation',
  },

  // General shortcuts
  showShortcuts: {
    key: '/',
    modifiers: ['cmd'],
    description: 'Show Keyboard Shortcuts',
    category: 'General',
  },
  focusSearch: {
    key: 'k',
    modifiers: ['cmd'],
    description: 'Focus Search',
    category: 'General',
  },
  save: {
    key: 's',
    modifiers: ['cmd'],
    description: 'Save Document',
    category: 'Document',
  },
  newDocument: {
    key: 'n',
    modifiers: ['cmd'],
    description: 'New Document',
    category: 'Document',
  },

  // Editing shortcuts
  bold: {
    key: 'b',
    modifiers: ['cmd'],
    description: 'Bold',
    category: 'Formatting',
  },
  italic: {
    key: 'i',
    modifiers: ['cmd'],
    description: 'Italic',
    category: 'Formatting',
  },
  underline: {
    key: 'u',
    modifiers: ['cmd'],
    description: 'Underline',
    category: 'Formatting',
  },

  // History
  undo: {
    key: 'z',
    modifiers: ['cmd'],
    description: 'Undo',
    category: 'History',
  },
  redo: {
    key: 'z',
    modifiers: ['cmd', 'shift'],
    description: 'Redo',
    category: 'History',
  },
};

/**
 * Get all shortcuts as an array
 */
export function getAllShortcuts(): ShortcutDefinition[] {
  return Object.values(FEATURE_SHORTCUTS);
}

/**
 * Get shortcuts by category
 */
export function getShortcutsByCategory(category: string): ShortcutDefinition[] {
  return getAllShortcuts().filter(s => s.category === category);
}

/**
 * Get all unique categories
 */
export function getCategories(): string[] {
  const categories = new Set(getAllShortcuts().map(s => s.category));
  return Array.from(categories);
}

/**
 * Check if the current platform is Mac
 */
export function isMac(): boolean {
  if (typeof window === 'undefined') return false;
  return navigator.platform.includes('Mac');
}

/**
 * Format a key for display based on platform
 */
export function formatKey(key: string): string {
  const platform = isMac();

  switch (key.toLowerCase()) {
    case 'cmd':
      return platform ? '⌘' : 'Ctrl';
    case 'ctrl':
      return platform ? '⌃' : 'Ctrl';
    case 'shift':
      return platform ? '⇧' : 'Shift';
    case 'alt':
      return platform ? '⌥' : 'Alt';
    case 'enter':
      return platform ? '↵' : 'Enter';
    case 'backspace':
      return platform ? '⌫' : 'Backspace';
    case 'delete':
      return platform ? '⌦' : 'Delete';
    case 'escape':
      return 'Esc';
    case 'tab':
      return 'Tab';
    case 'arrowleft':
      return '←';
    case 'arrowright':
      return '→';
    case 'arrowup':
      return '↑';
    case 'arrowdown':
      return '↓';
    case 'home':
      return 'Home';
    case 'end':
      return 'End';
    case ' ':
      return 'Space';
    default:
      return key.toUpperCase();
  }
}

/**
 * Check if an event matches a shortcut definition
 */
export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: ShortcutDefinition
): boolean {
  const platform = isMac();

  // Check if key matches
  if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
    return false;
  }

  // Check modifiers
  const hasCmd = shortcut.modifiers.includes('cmd');
  const hasCtrl = shortcut.modifiers.includes('ctrl');
  const hasShift = shortcut.modifiers.includes('shift');
  const hasAlt = shortcut.modifiers.includes('alt');

  // On Mac, 'cmd' means metaKey; on others, it means ctrlKey
  const cmdPressed = platform ? event.metaKey : event.ctrlKey;
  const ctrlPressed = event.ctrlKey;
  const shiftPressed = event.shiftKey;
  const altPressed = event.altKey;

  // Check if all required modifiers are pressed
  if (hasCmd && !cmdPressed) return false;
  if (hasCtrl && !ctrlPressed) return false;
  if (hasShift && !shiftPressed) return false;
  if (hasAlt && !altPressed) return false;

  // Check that no extra modifiers are pressed (except for ctrl on Mac when cmd is required)
  const expectedModifierCount = shortcut.modifiers.length;
  let actualModifierCount = 0;
  if (event.metaKey) actualModifierCount++;
  if (event.ctrlKey && !(platform && hasCmd)) actualModifierCount++;
  if (event.shiftKey) actualModifierCount++;
  if (event.altKey) actualModifierCount++;

  return actualModifierCount === expectedModifierCount;
}
