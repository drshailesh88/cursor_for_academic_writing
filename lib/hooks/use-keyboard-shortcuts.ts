// Advanced Keyboard Shortcuts Hook
// Manages global keyboard shortcuts with conflict prevention and context awareness

'use client';

import { useEffect, useCallback, useRef } from 'react';
import type { ShortcutDefinition } from '@/lib/config/shortcuts';
import { matchesShortcut } from '@/lib/config/shortcuts';

export interface ShortcutConfig {
  key: string;
  modifiers: ('cmd' | 'ctrl' | 'shift' | 'alt')[];
  action: () => void;
  description: string;
  when?: () => boolean; // Condition to enable shortcut
  preventDefault?: boolean; // Prevent default browser behavior (default: true)
}

interface UseKeyboardShortcutsOptions {
  shortcuts: ShortcutConfig[];
  enabled?: boolean; // Global enable/disable (default: true)
  disableInInputs?: boolean; // Disable when focused on input/textarea/contenteditable (default: true)
}

/**
 * Hook to register and manage global keyboard shortcuts
 *
 * Features:
 * - Register multiple shortcuts at once
 * - Automatic cleanup on unmount
 * - Context-aware: disable when typing in inputs
 * - Support for modifier keys (Cmd/Ctrl, Shift, Alt)
 * - Prevent conflicts with editor shortcuts
 * - Conditional shortcuts with `when` function
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   shortcuts: [
 *     {
 *       key: 'r',
 *       modifiers: ['cmd', 'shift'],
 *       action: () => openResearch(),
 *       description: 'Open Research',
 *       when: () => !isResearchOpen,
 *     }
 *   ]
 * });
 * ```
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions) {
  const { shortcuts, enabled = true, disableInInputs = true } = options;
  const shortcutsRef = useRef(shortcuts);

  // Update ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if globally disabled
      if (!enabled) return;

      // Skip if focused on input element (unless disabled)
      if (disableInInputs && isInputElement(event.target as Element)) {
        return;
      }

      // Check each shortcut
      for (const shortcut of shortcutsRef.current) {
        // Check if shortcut is enabled via condition
        if (shortcut.when && !shortcut.when()) {
          continue;
        }

        // Convert shortcut to definition format for matching
        const definition: ShortcutDefinition = {
          key: shortcut.key,
          modifiers: shortcut.modifiers,
          description: shortcut.description,
          category: '',
        };

        // Check if event matches this shortcut
        if (matchesShortcut(event, definition)) {
          // Prevent default behavior unless explicitly disabled
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
            event.stopPropagation();
          }

          // Execute the action
          shortcut.action();
          break; // Only trigger first matching shortcut
        }
      }
    },
    [enabled, disableInInputs]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Check if the element is an input that should prevent shortcuts
 */
function isInputElement(element: Element | null): boolean {
  if (!element) return false;

  const tagName = element.tagName.toLowerCase();

  // Check if it's a standard input element
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }

  // Check if it's contenteditable
  if (
    element.getAttribute('contenteditable') === 'true' ||
    element.getAttribute('contenteditable') === ''
  ) {
    return true;
  }

  // Check if any parent is contenteditable
  let parent = element.parentElement;
  while (parent) {
    if (
      parent.getAttribute('contenteditable') === 'true' ||
      parent.getAttribute('contenteditable') === ''
    ) {
      return true;
    }
    parent = parent.parentElement;
  }

  return false;
}

/**
 * Hook to manage a single keyboard shortcut
 * Simpler version for single shortcut use cases
 *
 * @example
 * ```tsx
 * useKeyboardShortcut({
 *   key: 's',
 *   modifiers: ['cmd'],
 *   action: () => saveDocument(),
 *   description: 'Save document',
 * });
 * ```
 */
export function useKeyboardShortcut(config: ShortcutConfig) {
  useKeyboardShortcuts({
    shortcuts: [config],
  });
}

/**
 * Get a formatted string for displaying a shortcut
 *
 * @example
 * ```tsx
 * formatShortcutDisplay({ key: 'r', modifiers: ['cmd', 'shift'] })
 * // Returns: "⌘⇧R" on Mac, "Ctrl+Shift+R" on Windows
 * ```
 */
export function formatShortcutDisplay(config: Pick<ShortcutConfig, 'key' | 'modifiers'>): string {
  const isMac = typeof window !== 'undefined' && navigator.platform.includes('Mac');

  const modifierSymbols = config.modifiers.map(mod => {
    switch (mod) {
      case 'cmd':
        return isMac ? '⌘' : 'Ctrl';
      case 'ctrl':
        return isMac ? '⌃' : 'Ctrl';
      case 'shift':
        return isMac ? '⇧' : 'Shift';
      case 'alt':
        return isMac ? '⌥' : 'Alt';
      default:
        return mod;
    }
  });

  const keyDisplay = config.key.toUpperCase();

  if (isMac) {
    // On Mac, concatenate symbols without separator
    return [...modifierSymbols, keyDisplay].join('');
  } else {
    // On Windows/Linux, use + separator
    return [...modifierSymbols, keyDisplay].join('+');
  }
}
