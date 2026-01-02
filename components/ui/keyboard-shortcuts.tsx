'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Keyboard } from 'lucide-react';
import { Button } from './button';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const SHORTCUTS: Shortcut[] = [
  // Document
  { keys: ['Cmd', 'S'], description: 'Save document', category: 'Document' },
  { keys: ['Cmd', 'N'], description: 'New document', category: 'Document' },

  // Text Formatting
  { keys: ['Cmd', 'B'], description: 'Bold', category: 'Formatting' },
  { keys: ['Cmd', 'I'], description: 'Italic', category: 'Formatting' },
  { keys: ['Cmd', 'U'], description: 'Underline', category: 'Formatting' },

  // History
  { keys: ['Cmd', 'Z'], description: 'Undo', category: 'History' },
  { keys: ['Cmd', 'Shift', 'Z'], description: 'Redo', category: 'History' },

  // Editing
  { keys: ['Cmd', 'A'], description: 'Select all', category: 'Editing' },
  { keys: ['Cmd', 'C'], description: 'Copy', category: 'Editing' },
  { keys: ['Cmd', 'V'], description: 'Paste', category: 'Editing' },
  { keys: ['Cmd', 'X'], description: 'Cut', category: 'Editing' },

  // Navigation
  { keys: ['Cmd', '/'], description: 'Show keyboard shortcuts', category: 'Navigation' },
  { keys: ['Tab'], description: 'Indent list item', category: 'Navigation' },
  { keys: ['Shift', 'Tab'], description: 'Outdent list item', category: 'Navigation' },
];

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  if (!isOpen) return null;

  const categories = [...new Set(SHORTCUTS.map((s) => s.category))];
  const isMac = typeof window !== 'undefined' && navigator.platform.includes('Mac');

  const formatKey = (key: string) => {
    if (key === 'Cmd') return isMac ? '⌘' : 'Ctrl';
    if (key === 'Shift') return isMac ? '⇧' : 'Shift';
    if (key === 'Alt') return isMac ? '⌥' : 'Alt';
    return key;
  };

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
