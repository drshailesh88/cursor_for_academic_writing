'use client';

import { useState } from 'react';
import { MessageSquare, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommentCard } from './comment-card';
import { useComments } from '@/lib/hooks/use-comments';
import type { CommentFilter } from '@/lib/collaboration/types';

interface CommentsSidebarProps {
  documentId?: string;
  onCommentClick?: (commentId: string, selectionStart: number, selectionEnd: number) => void;
  onAcceptSuggestion?: (commentId: string, suggestedText: string) => void;
  onRejectSuggestion?: (commentId: string) => void;
  currentUserId?: string;
}

export function CommentsSidebar({
  documentId,
  onCommentClick,
  onAcceptSuggestion,
  onRejectSuggestion,
  currentUserId,
}: CommentsSidebarProps) {
  const [filter, setFilter] = useState<CommentFilter>('all');

  const {
    comments,
    loading,
    commentCounts,
    resolveComment,
    unresolveComment,
    deleteComment,
    addReply,
  } = useComments({ documentId, filter });

  const handleAcceptSuggestion = (commentId: string) => {
    const comment = comments.find((c) => c.id === commentId);
    if (comment && comment.suggestedText && onAcceptSuggestion) {
      onAcceptSuggestion(commentId, comment.suggestedText);
      resolveComment(commentId);
    }
  };

  const handleRejectSuggestion = (commentId: string) => {
    if (onRejectSuggestion) {
      onRejectSuggestion(commentId);
    }
    resolveComment(commentId);
  };

  const handleCommentClick = (commentId: string) => {
    const comment = comments.find((c) => c.id === commentId);
    if (comment && onCommentClick) {
      onCommentClick(commentId, comment.selectionStart, comment.selectionEnd);
    }
  };

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Comments
          </h2>
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
            {commentCounts.total}
          </span>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={filter === 'all' ? 'default' : 'ghost'}
            onClick={() => setFilter('all')}
            className="text-xs flex-1"
          >
            All
            <span className="ml-1 opacity-70">({commentCounts.total})</span>
          </Button>
          <Button
            size="sm"
            variant={filter === 'open' ? 'default' : 'ghost'}
            onClick={() => setFilter('open')}
            className="text-xs flex-1"
          >
            Open
            <span className="ml-1 opacity-70">({commentCounts.open})</span>
          </Button>
          <Button
            size="sm"
            variant={filter === 'resolved' ? 'default' : 'ghost'}
            onClick={() => setFilter('resolved')}
            className="text-xs flex-1"
          >
            Resolved
            <span className="ml-1 opacity-70">({commentCounts.resolved})</span>
          </Button>
        </div>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">
              {filter === 'all' && 'No comments yet'}
              {filter === 'open' && 'No open comments'}
              {filter === 'resolved' && 'No resolved comments'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Select text in the editor to add a comment
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {comments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                onReply={addReply}
                onResolve={resolveComment}
                onUnresolve={unresolveComment}
                onDelete={deleteComment}
                onAcceptSuggestion={handleAcceptSuggestion}
                onRejectSuggestion={handleRejectSuggestion}
                onClick={() => handleCommentClick(comment.id)}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer with stats */}
      {commentCounts.total > 0 && (
        <div className="p-3 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{commentCounts.suggestions} suggestions</span>
            <span>
              {commentCounts.open} open · {commentCounts.resolved} resolved
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
