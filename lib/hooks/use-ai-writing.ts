/**
 * AI Writing Assistant Hook
 *
 * Provides AI-powered writing assistance including paraphrasing,
 * simplification, expansion, and style improvements.
 */

'use client';

import { useState, useCallback } from 'react';
import { useCompletion } from 'ai/react';
import type { Editor } from '@tiptap/react';
import type { AIWritingAction, AIWritingActionConfig } from '@/lib/ai-writing/types';
import { AI_WRITING_ACTIONS, getActionConfig } from '@/lib/ai-writing/types';

interface UseAIWritingOptions {
  editor: Editor | null;
  discipline?: string;
  model?: string;
}

interface UseAIWritingReturn {
  // State
  isProcessing: boolean;
  error: string | null;
  lastResult: string | null;
  currentAction: AIWritingAction | null;

  // Actions
  executeAction: (action: AIWritingAction, text?: string) => Promise<string | null>;
  paraphrase: (text?: string) => Promise<string | null>;
  simplify: (text?: string) => Promise<string | null>;
  expand: (text?: string) => Promise<string | null>;
  shorten: (text?: string) => Promise<string | null>;
  formalize: (text?: string) => Promise<string | null>;
  improveClarity: (text?: string) => Promise<string | null>;
  fixGrammar: (text?: string) => Promise<string | null>;
  toActiveVoice: (text?: string) => Promise<string | null>;
  academicTone: (text?: string) => Promise<string | null>;
  continueWriting: () => Promise<string | null>;

  // Replace/Insert
  replaceSelection: (newText: string) => void;
  insertAfterSelection: (newText: string) => void;

  // Helpers
  getSelectedText: () => string;
  hasSelection: () => boolean;
  availableActions: AIWritingActionConfig[];

  // Cancel
  cancel: () => void;
}

/**
 * Hook for AI-powered writing assistance
 */
export function useAIWriting({
  editor,
  discipline,
  model = 'anthropic',
}: UseAIWritingOptions): UseAIWritingReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<AIWritingAction | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  /**
   * Get currently selected text from editor
   */
  const getSelectedText = useCallback((): string => {
    if (!editor) return '';
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to, ' ');
  }, [editor]);

  /**
   * Check if there's a selection
   */
  const hasSelection = useCallback((): boolean => {
    if (!editor) return false;
    const { from, to } = editor.state.selection;
    return from !== to;
  }, [editor]);

  /**
   * Get context around selection
   */
  const getContext = useCallback((): string => {
    if (!editor) return '';

    const { from, to } = editor.state.selection;
    const doc = editor.state.doc;

    // Get ~200 chars before and after selection
    const contextStart = Math.max(0, from - 200);
    const contextEnd = Math.min(doc.content.size, to + 200);

    const before = doc.textBetween(contextStart, from, ' ');
    const after = doc.textBetween(to, contextEnd, ' ');

    return `...${before}[SELECTED TEXT]${after}...`;
  }, [editor]);

  /**
   * Execute an AI writing action
   */
  const executeAction = useCallback(
    async (action: AIWritingAction, text?: string): Promise<string | null> => {
      const selectedText = text || getSelectedText();

      if (!selectedText && action !== 'continue') {
        setError('Please select some text first');
        return null;
      }

      setIsProcessing(true);
      setError(null);
      setCurrentAction(action);

      // Create abort controller
      const controller = new AbortController();
      setAbortController(controller);

      try {
        const response = await fetch('/api/ai-writing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            selectedText: selectedText || getSelectedText(),
            context: getContext(),
            discipline,
            model,
            stream: false,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Unknown error');
        }

        setLastResult(data.result);
        return data.result;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          setError('Cancelled');
          return null;
        }
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return null;
      } finally {
        setIsProcessing(false);
        setCurrentAction(null);
        setAbortController(null);
      }
    },
    [getSelectedText, getContext, discipline, model]
  );

  /**
   * Replace selected text with new text
   */
  const replaceSelection = useCallback(
    (newText: string) => {
      if (!editor) return;

      const { from, to } = editor.state.selection;
      editor
        .chain()
        .focus()
        .deleteRange({ from, to })
        .insertContentAt(from, newText)
        .run();
    },
    [editor]
  );

  /**
   * Insert text after selection
   */
  const insertAfterSelection = useCallback(
    (newText: string) => {
      if (!editor) return;

      const { to } = editor.state.selection;
      editor.chain().focus().insertContentAt(to, ' ' + newText).run();
    },
    [editor]
  );

  /**
   * Cancel current operation
   */
  const cancel = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsProcessing(false);
    setCurrentAction(null);
  }, [abortController]);

  // Convenience methods for common actions
  const paraphrase = useCallback(
    (text?: string) => executeAction('paraphrase', text),
    [executeAction]
  );

  const simplify = useCallback(
    (text?: string) => executeAction('simplify', text),
    [executeAction]
  );

  const expand = useCallback(
    (text?: string) => executeAction('expand', text),
    [executeAction]
  );

  const shorten = useCallback(
    (text?: string) => executeAction('shorten', text),
    [executeAction]
  );

  const formalize = useCallback(
    (text?: string) => executeAction('formalize', text),
    [executeAction]
  );

  const improveClarity = useCallback(
    (text?: string) => executeAction('improve-clarity', text),
    [executeAction]
  );

  const fixGrammar = useCallback(
    (text?: string) => executeAction('fix-grammar', text),
    [executeAction]
  );

  const toActiveVoice = useCallback(
    (text?: string) => executeAction('active-voice', text),
    [executeAction]
  );

  const academicTone = useCallback(
    (text?: string) => executeAction('academic-tone', text),
    [executeAction]
  );

  const continueWriting = useCallback(
    () => executeAction('continue'),
    [executeAction]
  );

  return {
    // State
    isProcessing,
    error,
    lastResult,
    currentAction,

    // Actions
    executeAction,
    paraphrase,
    simplify,
    expand,
    shorten,
    formalize,
    improveClarity,
    fixGrammar,
    toActiveVoice,
    academicTone,
    continueWriting,

    // Replace/Insert
    replaceSelection,
    insertAfterSelection,

    // Helpers
    getSelectedText,
    hasSelection,
    availableActions: AI_WRITING_ACTIONS,

    // Cancel
    cancel,
  };
}

export default useAIWriting;
