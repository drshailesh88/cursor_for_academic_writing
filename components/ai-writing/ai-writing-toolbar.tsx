'use client';

import { useState, useEffect, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import {
  RefreshCw,
  Minimize2,
  Maximize2,
  Scissors,
  Briefcase,
  Eye,
  Check,
  Zap,
  GraduationCap,
  ArrowRight,
  AlignLeft,
  Loader2,
  X,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useAIWriting } from '@/lib/hooks/use-ai-writing';
import type { AIWritingAction, AIWritingActionConfig } from '@/lib/ai-writing/types';
import { AI_WRITING_ACTIONS, getActionsByCategory } from '@/lib/ai-writing/types';

interface AIWritingToolbarProps {
  editor: Editor | null;
  discipline?: string;
}

// Icon mapping
const ICONS: Record<string, React.ElementType> = {
  RefreshCw,
  Minimize2,
  Maximize2,
  Scissors,
  Briefcase,
  Eye,
  Check,
  Zap,
  GraduationCap,
  ArrowRight,
  AlignLeft,
};

/**
 * Quick action button
 */
function ActionButton({
  action,
  onClick,
  isLoading,
  disabled,
}: {
  action: AIWritingActionConfig;
  onClick: () => void;
  isLoading: boolean;
  disabled: boolean;
}) {
  const Icon = ICONS[action.icon] || Sparkles;

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className="flex items-center gap-1.5 px-2 py-1 text-xs rounded hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title={action.description}
    >
      {isLoading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Icon className="h-3 w-3" />
      )}
      <span>{action.label}</span>
    </button>
  );
}

/**
 * AI Writing Toolbar - appears when text is selected
 */
export function AIWritingToolbar({ editor, discipline }: AIWritingToolbarProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [pendingResult, setPendingResult] = useState<string | null>(null);

  const {
    isProcessing,
    error,
    lastResult,
    currentAction,
    executeAction,
    replaceSelection,
    insertAfterSelection,
    hasSelection,
    cancel,
  } = useAIWriting({ editor, discipline });

  // Quick actions shown directly in toolbar
  const quickActions: AIWritingAction[] = [
    'paraphrase',
    'simplify',
    'fix-grammar',
    'academic-tone',
  ];

  // Handle action click
  const handleAction = useCallback(
    async (action: AIWritingAction) => {
      setShowDropdown(false);
      const result = await executeAction(action);
      if (result) {
        setPendingResult(result);
        setShowResult(true);
      }
    },
    [executeAction]
  );

  // Accept the result
  const handleAccept = useCallback(() => {
    if (pendingResult) {
      replaceSelection(pendingResult);
      setPendingResult(null);
      setShowResult(false);
    }
  }, [pendingResult, replaceSelection]);

  // Insert after (for continue/expand)
  const handleInsertAfter = useCallback(() => {
    if (pendingResult) {
      insertAfterSelection(pendingResult);
      setPendingResult(null);
      setShowResult(false);
    }
  }, [pendingResult, insertAfterSelection]);

  // Dismiss result
  const handleDismiss = useCallback(() => {
    setPendingResult(null);
    setShowResult(false);
  }, []);

  // Don't render if no selection
  if (!hasSelection() && !showResult) {
    return null;
  }

  // Show result panel
  if (showResult && pendingResult) {
    return (
      <div className="border-t border-border bg-card p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Suggestion
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleAccept}
              className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Replace
            </button>
            <button
              onClick={handleInsertAfter}
              className="px-2 py-1 text-xs bg-muted rounded hover:bg-muted/80"
            >
              Insert After
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 text-muted-foreground hover:text-foreground rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="text-sm bg-muted/50 rounded p-2 max-h-32 overflow-y-auto">
          {pendingResult}
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-border bg-card/80 backdrop-blur-sm">
      <div className="flex items-center gap-1 p-1.5 overflow-x-auto">
        {/* AI Icon */}
        <div className="flex items-center gap-1 px-2 text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          <span className="text-xs font-medium hidden sm:inline">AI</span>
        </div>

        <div className="w-px h-5 bg-border" />

        {/* Quick actions */}
        {quickActions.map((actionId) => {
          const action = AI_WRITING_ACTIONS.find((a) => a.id === actionId);
          if (!action) return null;
          return (
            <ActionButton
              key={action.id}
              action={action}
              onClick={() => handleAction(action.id)}
              isLoading={isProcessing && currentAction === action.id}
              disabled={isProcessing}
            />
          );
        })}

        <div className="w-px h-5 bg-border" />

        {/* More dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={isProcessing}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-muted transition-colors disabled:opacity-50"
          >
            More
            <ChevronDown className="h-3 w-3" />
          </button>

          {showDropdown && (
            <div className="absolute bottom-full left-0 mb-1 w-56 bg-background border border-border rounded-lg shadow-lg z-50 py-1 max-h-64 overflow-y-auto">
              {/* Rewrite category */}
              <div className="px-2 py-1 text-xs text-muted-foreground font-medium">
                Rewrite
              </div>
              {getActionsByCategory('rewrite').map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleAction(action.id)}
                  disabled={isProcessing}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted flex items-center gap-2 disabled:opacity-50"
                >
                  {(() => {
                    const Icon = ICONS[action.icon] || Sparkles;
                    return <Icon className="h-3.5 w-3.5 text-muted-foreground" />;
                  })()}
                  <span>{action.label}</span>
                </button>
              ))}

              {/* Style category */}
              <div className="px-2 py-1 text-xs text-muted-foreground font-medium mt-1 border-t border-border pt-2">
                Style
              </div>
              {getActionsByCategory('style').map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleAction(action.id)}
                  disabled={isProcessing}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted flex items-center gap-2 disabled:opacity-50"
                >
                  {(() => {
                    const Icon = ICONS[action.icon] || Sparkles;
                    return <Icon className="h-3.5 w-3.5 text-muted-foreground" />;
                  })()}
                  <span>{action.label}</span>
                </button>
              ))}

              {/* Academic category */}
              <div className="px-2 py-1 text-xs text-muted-foreground font-medium mt-1 border-t border-border pt-2">
                Academic
              </div>
              {getActionsByCategory('academic').map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleAction(action.id)}
                  disabled={isProcessing}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted flex items-center gap-2 disabled:opacity-50"
                >
                  {(() => {
                    const Icon = ICONS[action.icon] || Sparkles;
                    return <Icon className="h-3.5 w-3.5 text-muted-foreground" />;
                  })()}
                  <span>{action.label}</span>
                </button>
              ))}

              {/* Generate category */}
              <div className="px-2 py-1 text-xs text-muted-foreground font-medium mt-1 border-t border-border pt-2">
                Generate
              </div>
              {getActionsByCategory('generate').map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleAction(action.id)}
                  disabled={isProcessing}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted flex items-center gap-2 disabled:opacity-50"
                >
                  {(() => {
                    const Icon = ICONS[action.icon] || Sparkles;
                    return <Icon className="h-3.5 w-3.5 text-muted-foreground" />;
                  })()}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cancel button when processing */}
        {isProcessing && (
          <>
            <div className="w-px h-5 bg-border" />
            <button
              onClick={cancel}
              className="flex items-center gap-1 px-2 py-1 text-xs text-red-500 rounded hover:bg-red-500/10"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
          </>
        )}

        {/* Error display */}
        {error && (
          <span className="text-xs text-red-500 ml-2">{error}</span>
        )}
      </div>
    </div>
  );
}

export default AIWritingToolbar;
