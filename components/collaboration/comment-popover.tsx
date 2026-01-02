'use client';

import { useState } from 'react';
import { MessageSquare, Lightbulb, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CommentPopoverProps {
  selectedText: string;
  onSubmit: (data: {
    content: string;
    type: 'comment' | 'suggestion';
    suggestedText?: string;
  }) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

export function CommentPopover({
  selectedText,
  onSubmit,
  onClose,
  position,
}: CommentPopoverProps) {
  const [commentText, setCommentText] = useState('');
  const [isSuggestion, setIsSuggestion] = useState(false);
  const [suggestedText, setSuggestedText] = useState('');

  const handleSubmit = () => {
    if (!commentText.trim()) return;

    onSubmit({
      content: commentText,
      type: isSuggestion ? 'suggestion' : 'comment',
      suggestedText: isSuggestion ? suggestedText : undefined,
    });

    // Reset form
    setCommentText('');
    setSuggestedText('');
    setIsSuggestion(false);
    onClose();
  };

  return (
    <div
      className="fixed z-50 w-80 bg-card border border-border rounded-lg shadow-lg p-4"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Add Comment
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Selected text preview */}
      <div className="bg-muted/50 p-2 rounded text-xs mb-3 border-l-2 border-primary max-h-20 overflow-y-auto">
        <span className="text-muted-foreground italic">&quot;{selectedText}&quot;</span>
      </div>

      {/* Toggle for suggestion mode */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setIsSuggestion(!isSuggestion)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors ${
            isSuggestion
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <Lightbulb className="h-3 w-3" />
          {isSuggestion ? 'Suggestion Mode' : 'Make Suggestion'}
        </button>
      </div>

      {/* Suggested text input (only for suggestions) */}
      {isSuggestion && (
        <div className="mb-3">
          <label className="text-xs text-muted-foreground mb-1 block">
            Suggested replacement:
          </label>
          <textarea
            value={suggestedText}
            onChange={(e) => setSuggestedText(e.target.value)}
            placeholder="Enter suggested text..."
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            rows={2}
          />
        </div>
      )}

      {/* Comment text input */}
      <div className="mb-3">
        <label className="text-xs text-muted-foreground mb-1 block">
          {isSuggestion ? 'Explanation (optional):' : 'Comment:'}
        </label>
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={
            isSuggestion
              ? 'Explain why you suggest this change...'
              : 'Write your comment...'
          }
          className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          rows={3}
          autoFocus
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={onClose}
          className="text-xs"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!commentText.trim() || (isSuggestion && !suggestedText.trim())}
          className="text-xs"
        >
          {isSuggestion ? 'Add Suggestion' : 'Add Comment'}
        </Button>
      </div>
    </div>
  );
}
