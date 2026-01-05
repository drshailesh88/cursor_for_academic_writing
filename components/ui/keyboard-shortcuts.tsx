'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Keyboard } from 'lucide-react';
import { Button } from './button';
import { getAllShortcuts, formatKey } from '@/lib/config/shortcuts';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

// Convert config shortcuts to display format
function getShortcutsForDisplay(): Shortcut[] {
  const configShortcuts = getAllShortcuts();

  return configShortcuts.map(shortcut => {
    // Convert modifiers + key to display keys array
    const keys = [
      ...shortcut.modifiers.map(m => m.charAt(0).toUpperCase() + m.slice(1)),
      shortcut.key.toUpperCase()
    ];

    return {
      keys,
      description: shortcut.description,
      category: shortcut.category,
    };
  });
}

// Legacy shortcuts that aren't in config (editor-specific)
const EDITOR_SHORTCUTS: Shortcut[] = [
  { keys: ['Tab'], description: 'Indent list item', category: 'Editing' },
  { keys: ['Shift', 'Tab'], description: 'Outdent list item', category: 'Editing' },
  { keys: ['Cmd', 'A'], description: 'Select all', category: 'Editing' },
  { keys: ['Cmd', 'C'], description: 'Copy', category: 'Editing' },
  { keys: ['Cmd', 'V'], description: 'Paste', category: 'Editing' },
  { keys: ['Cmd', 'X'], description: 'Cut', category: 'Editing' },
];

// Combine all shortcuts
const SHORTCUTS: Shortcut[] = [
  ...getShortcutsForDisplay(),
  ...EDITOR_SHORTCUTS,
];

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  if (!isOpen) return null;

  const categories = [...new Set(SHORTCUTS.map((s) => s.category))];
  const isMac = typeof window !== 'undefined' && navigator.platform.includes('Mac');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                {category}
              </h3>
              <div className="space-y-2">
                {SHORTCUTS.filter((s) => s.category === category).map((shortcut, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, j) => (
                        <span key={j}>
                          <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border border-border">
                            {formatKey(key)}
                          </kbd>
                          {j < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground mx-1">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border text-center text-xs text-muted-foreground">
          Press <kbd className="px-1 py-0.5 bg-muted rounded border border-border mx-1">{isMac ? '⌘' : 'Ctrl'}</kbd>+<kbd className="px-1 py-0.5 bg-muted rounded border border-border mx-1">/</kbd> to toggle this dialog
        </div>
      </div>
    </div>
  );
}

// Hook to manage keyboard shortcuts modal
export function useKeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === '/') {
      event.preventDefault();
      setIsOpen((prev) => !prev);
    }
    if (event.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { isOpen, setIsOpen, toggle: () => setIsOpen((prev) => !prev) };
}
