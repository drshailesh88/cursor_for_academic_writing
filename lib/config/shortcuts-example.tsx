/**
 * EXAMPLE: How to integrate keyboard shortcuts in three-panel-layout.tsx
 *
 * This file shows the exact code changes needed to add keyboard shortcuts
 * for the new Research, Papers, and Discovery features.
 *
 * NOTE: This file is for reference only and is not meant to be compiled.
 * Copy the relevant code snippets into three-panel-layout.tsx.
 */

// @ts-nocheck

// ============================================================================
// STEP 1: Add imports at the top of three-panel-layout.tsx
// ============================================================================

// Change this line:
// import { KeyboardShortcuts, useKeyboardShortcuts } from '@/components/ui/keyboard-shortcuts';

// To this (rename the hook to avoid conflict):
import { KeyboardShortcuts, useKeyboardShortcuts as useKeyboardShortcutsModal } from '@/components/ui/keyboard-shortcuts';

// Add these new imports:
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import { FEATURE_SHORTCUTS } from '@/lib/config/shortcuts';
import { useResearch } from '@/components/research';
import { usePaperLibrary } from '@/components/papers';

// ============================================================================
// STEP 2: Add hook calls inside ThreePanelContent function
// ============================================================================

function ThreePanelContent() {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // Existing state...
  const [rightPanelView, setRightPanelView] = useState<FeatureTab>('chat');

  // Rename this line:
  // const { isOpen: shortcutsOpen, setIsOpen: setShortcutsOpen } = useKeyboardShortcuts();
  // To:
  const { isOpen: shortcutsOpen, setIsOpen: setShortcutsOpen } = useKeyboardShortcutsModal();

  // ADD: Get feature contexts
  const { enterResearchMode } = useResearch();
  const { openLibrary } = usePaperLibrary();

  // ... rest of existing hooks ...

  // ============================================================================
  // STEP 3: Add shortcut handler functions
  // ============================================================================

  // Tab switching handlers
  const handleSwitchTab = useCallback((tab: FeatureTab) => {
    if (!isMobile) {
      setRightPanelView(tab);
    }
  }, [isMobile]);

  // Feature opening handlers
  const handleOpenResearch = useCallback(() => {
    if (user) {
      enterResearchMode();
    }
  }, [user, enterResearchMode]);

  const handleOpenPapers = useCallback(() => {
    if (user) {
      openLibrary();
    }
  }, [user, openLibrary]);

  // ============================================================================
  // STEP 4: Register keyboard shortcuts
  // ============================================================================

  // REPLACE the existing presentation shortcut (lines ~205-219):
  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'G') {
  //       e.preventDefault();
  //       if (user && currentDocumentId) {
  //         setShowGenerationDialog(true);
  //       }
  //     }
  //   };
  //   window.addEventListener('keydown', handleKeyDown);
  //   return () => window.removeEventListener('keydown', handleKeyDown);
  // }, [user, currentDocumentId]);

  // WITH this new system:
  useKeyboardShortcuts({
    shortcuts: [
      // Tab navigation (Cmd+1, Cmd+2, Cmd+3, Cmd+4)
      {
        key: FEATURE_SHORTCUTS.switchToChat.key,
        modifiers: FEATURE_SHORTCUTS.switchToChat.modifiers,
        action: () => handleSwitchTab('chat'),
        description: FEATURE_SHORTCUTS.switchToChat.description,
        when: () => !isMobile,
      },
      {
        key: FEATURE_SHORTCUTS.switchToResearch.key,
        modifiers: FEATURE_SHORTCUTS.switchToResearch.modifiers,
        action: () => handleSwitchTab('research'),
        description: FEATURE_SHORTCUTS.switchToResearch.description,
        when: () => !isMobile,
      },
      {
        key: FEATURE_SHORTCUTS.switchToPapers.key,
        modifiers: FEATURE_SHORTCUTS.switchToPapers.modifiers,
        action: () => handleSwitchTab('papers'),
        description: FEATURE_SHORTCUTS.switchToPapers.description,
        when: () => !isMobile,
      },
      {
        key: FEATURE_SHORTCUTS.switchToDiscovery.key,
        modifiers: FEATURE_SHORTCUTS.switchToDiscovery.modifiers,
        action: () => handleSwitchTab('discovery'),
        description: FEATURE_SHORTCUTS.switchToDiscovery.description,
        when: () => !isMobile,
      },

      // Feature shortcuts (Cmd+Shift+R, Cmd+Shift+P)
      {
        key: FEATURE_SHORTCUTS.openResearch.key,
        modifiers: FEATURE_SHORTCUTS.openResearch.modifiers,
        action: handleOpenResearch,
        description: FEATURE_SHORTCUTS.openResearch.description,
        when: () => !!user,
      },
      {
        key: FEATURE_SHORTCUTS.openPapers.key,
        modifiers: FEATURE_SHORTCUTS.openPapers.modifiers,
        action: handleOpenPapers,
        description: FEATURE_SHORTCUTS.openPapers.description,
        when: () => !!user,
      },

      // Presentation shortcut (Cmd+Shift+G)
      {
        key: FEATURE_SHORTCUTS.generatePresentation.key,
        modifiers: FEATURE_SHORTCUTS.generatePresentation.modifiers,
        action: () => setShowGenerationDialog(true),
        description: FEATURE_SHORTCUTS.generatePresentation.description,
        when: () => !!(user && currentDocumentId),
      },
    ],
  });

  // ... rest of component ...
}

// ============================================================================
// COMPLETE LIST OF KEYBOARD SHORTCUTS
// ============================================================================

/*
  After integration, these shortcuts will work:

  TAB NAVIGATION:
  - Cmd/Ctrl + 1: Switch to Chat tab
  - Cmd/Ctrl + 2: Switch to Research tab
  - Cmd/Ctrl + 3: Switch to Papers tab
  - Cmd/Ctrl + 4: Switch to Discovery tab

  FEATURES:
  - Cmd/Ctrl + Shift + R: Open Deep Research panel
  - Cmd/Ctrl + Shift + P: Open Paper Library
  - Cmd/Ctrl + Shift + G: Generate Presentation

  GENERAL:
  - Cmd/Ctrl + /: Show keyboard shortcuts modal (already working)
  - Cmd/Ctrl + S: Save document (handled by editor)
  - Cmd/Ctrl + N: New document (TBD)

  EDITOR (handled by TipTap):
  - Cmd/Ctrl + B: Bold
  - Cmd/Ctrl + I: Italic
  - Cmd/Ctrl + U: Underline
  - Cmd/Ctrl + Z: Undo
  - Cmd/Ctrl + Shift + Z: Redo
*/

// ============================================================================
// TESTING CHECKLIST
// ============================================================================

/*
  After integration, test:

  ✓ Cmd+1/2/3/4 switches between tabs (desktop only)
  ✓ Cmd+Shift+R opens Research panel when signed in
  ✓ Cmd+Shift+P opens Paper Library when signed in
  ✓ Cmd+Shift+G opens Presentation Generator when document is loaded
  ✓ Shortcuts are disabled when typing in editor
  ✓ Shortcuts are disabled on mobile
  ✓ Cmd+/ still shows keyboard shortcuts modal
  ✓ All shortcuts shown in modal with correct platform symbols (⌘ on Mac, Ctrl on Windows)
*/

export {};
