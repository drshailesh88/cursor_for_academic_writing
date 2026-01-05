# Keyboard Shortcuts Integration Guide

## Overview
This guide shows how to integrate the new keyboard shortcuts system into the `three-panel-layout.tsx` component.

## Integration Steps

### 1. Import Required Hooks and Configs

Add these imports to `three-panel-layout.tsx`:

```typescript
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import { FEATURE_SHORTCUTS } from '@/lib/config/shortcuts';
import { useResearch } from '@/components/research';
import { usePaperLibrary } from '@/components/papers';
import { useCitationExplorer } from '@/components/research/citation-explorer';
```

### 2. Get Context Hooks

Inside the `ThreePanelContent` component, add these hooks:

```typescript
// Get feature contexts
const { enterResearchMode } = useResearch();
const { openLibrary } = usePaperLibrary();
// Citation explorer requires a paper to open, so we'll handle it differently
```

### 3. Define Shortcut Handlers

Add these handler functions inside `ThreePanelContent`:

```typescript
// Shortcut handlers
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

const handleSwitchToChat = useCallback(() => {
  if (!isMobile) {
    setRightPanelView('chat');
  }
}, [isMobile]);

const handleSwitchToComments = useCallback(() => {
  if (!isMobile) {
    setRightPanelView('comments');
  }
}, [isMobile]);
```

### 4. Register Shortcuts

Add the `useKeyboardShortcuts` hook call inside `ThreePanelContent`:

```typescript
// Register keyboard shortcuts
useKeyboardShortcuts({
  shortcuts: [
    {
      key: FEATURE_SHORTCUTS.openResearch.key,
      modifiers: FEATURE_SHORTCUTS.openResearch.modifiers,
      action: handleOpenResearch,
      description: FEATURE_SHORTCUTS.openResearch.description,
      when: () => !!user, // Only when user is signed in
    },
    {
      key: FEATURE_SHORTCUTS.openPapers.key,
      modifiers: FEATURE_SHORTCUTS.openPapers.modifiers,
      action: handleOpenPapers,
      description: FEATURE_SHORTCUTS.openPapers.description,
      when: () => !!user,
    },
    {
      key: FEATURE_SHORTCUTS.switchToChat.key,
      modifiers: FEATURE_SHORTCUTS.switchToChat.modifiers,
      action: handleSwitchToChat,
      description: FEATURE_SHORTCUTS.switchToChat.description,
      when: () => !isMobile,
    },
    {
      key: FEATURE_SHORTCUTS.switchToComments.key,
      modifiers: FEATURE_SHORTCUTS.switchToComments.modifiers,
      action: handleSwitchToComments,
      description: FEATURE_SHORTCUTS.switchToComments.description,
      when: () => !isMobile,
    },
  ],
});
```

### 5. Update Existing Presentation Shortcut

Replace the existing keyboard shortcut handling (lines 189-202) with the new system:

```typescript
// Remove this code:
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'G') {
      e.preventDefault();
      if (user && currentDocumentId) {
        setShowGenerationDialog(true);
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [user, currentDocumentId]);

// Replace with:
useKeyboardShortcuts({
  shortcuts: [
    {
      key: FEATURE_SHORTCUTS.generatePresentation.key,
      modifiers: FEATURE_SHORTCUTS.generatePresentation.modifiers,
      action: () => setShowGenerationDialog(true),
      description: FEATURE_SHORTCUTS.generatePresentation.description,
      when: () => !!(user && currentDocumentId),
    },
  ],
});
```

## Complete Example

Here's a complete example of how the shortcuts section should look in `ThreePanelContent`:

```typescript
function ThreePanelContent() {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // ... other state ...

  // Get feature contexts
  const { enterResearchMode } = useResearch();
  const { openLibrary } = usePaperLibrary();

  // ... other hooks ...

  // Shortcut handlers
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

  const handleSwitchToChat = useCallback(() => {
    if (!isMobile) {
      setRightPanelView('chat');
    }
  }, [isMobile]);

  const handleSwitchToComments = useCallback(() => {
    if (!isMobile) {
      setRightPanelView('comments');
    }
  }, [isMobile]);

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      // Feature shortcuts
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
      {
        key: FEATURE_SHORTCUTS.generatePresentation.key,
        modifiers: FEATURE_SHORTCUTS.generatePresentation.modifiers,
        action: () => setShowGenerationDialog(true),
        description: FEATURE_SHORTCUTS.generatePresentation.description,
        when: () => !!(user && currentDocumentId),
      },

      // Navigation shortcuts
      {
        key: FEATURE_SHORTCUTS.switchToChat.key,
        modifiers: FEATURE_SHORTCUTS.switchToChat.modifiers,
        action: handleSwitchToChat,
        description: FEATURE_SHORTCUTS.switchToChat.description,
        when: () => !isMobile,
      },
      {
        key: FEATURE_SHORTCUTS.switchToComments.key,
        modifiers: FEATURE_SHORTCUTS.switchToComments.modifiers,
        action: handleSwitchToComments,
        description: FEATURE_SHORTCUTS.switchToComments.description,
        when: () => !isMobile,
      },
    ],
  });

  // ... rest of component ...
}
```

## Testing

After integration, test the following shortcuts:

- **Cmd/Ctrl + Shift + R**: Opens Deep Research panel
- **Cmd/Ctrl + Shift + P**: Opens Paper Library
- **Cmd/Ctrl + Shift + G**: Opens Presentation Generator
- **Cmd/Ctrl + 1**: Switches to Chat tab
- **Cmd/Ctrl + 2**: Switches to Comments tab
- **Cmd/Ctrl + /**: Shows keyboard shortcuts modal (existing)

## Notes

- All shortcuts automatically handle Mac vs Windows/Linux differences
- Shortcuts are disabled when typing in inputs/textareas
- The `when` condition ensures shortcuts only work when appropriate
- The shortcuts modal automatically displays all registered shortcuts
