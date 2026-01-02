'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  MessageSquare,
  MoreVertical,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Reply,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Comment } from '@/lib/collaboration/types';

interface CommentCardProps {
  comment: Comment;
  onReply: (commentId: string, content: string) => void;
  onResolve: (commentId: string) => void;
  onUnresolve: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onAcceptSuggestion?: (commentId: string) => void;
  onRejectSuggestion?: (commentId: string) => void;
  onClick?: () => void;
  currentUserId?: string;
}

export function CommentCard({
  comment,
  onReply,
  onResolve,
  onUnresolve,
  onDelete,
  onAcceptSuggestion,
  onRejectSuggestion,
  onClick,
  currentUserId,
}: CommentCardProps) {
  const [showReplies, setShowReplies] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const isOwner = currentUserId === comment.userId;

  const handleSubmitReply = () => {
    if (replyText.trim()) {
      onReply(comment.id, replyText);
      setReplyText('');
      setIsReplying(false);
    }
  };

  const handleAccept = () => {
    if (onAcceptSuggestion) {
      onAcceptSuggestion(comment.id);
    }
  };

  const handleReject = () => {
    if (onRejectSuggestion) {
      onRejectSuggestion(comment.id);
    }
  };

  // Get user initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={`p-3 border rounded-lg mb-3 transition-colors cursor-pointer ${
        comment.resolved
          ? 'bg-muted/50 border-muted'
          : 'bg-card border-border hover:border-primary'
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start gap-2 mb-2">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.userAvatar ? (
            <img
              src={comment.userAvatar}
              alt={comment.userName}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
              {getInitials(comment.userName)}
            </div>
          )}
        </div>

        {/* User info and timestamp */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{comment.userName}</span>
              {comment.type === 'suggestion' && (
                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  Suggestion
                </span>
              )}
              {comment.resolved && (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              )}
            </div>
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(!showActions);
                }}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
              {showActions && (
                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-md shadow-lg z-10 min-w-[120px]">
                  {!comment.resolved ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onResolve(comment.id);
                        setShowActions(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Resolve
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnresolve(comment.id);
                        setShowActions(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                    >
                      <AlertCircle className="h-4 w-4" />
                      Reopen
                    </button>
                  )}
                  {isOwner && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(comment.id);
                        setShowActions(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Selected text */}
      <div className="bg-muted/50 p-2 rounded text-sm mb-2 border-l-2 border-primary">
        <span className="text-muted-foreground italic">&quot;{comment.selectedText}&quot;</span>
      </div>

      {/* Comment content */}
      <p className="text-sm mb-2">{comment.content}</p>

      {/* Suggestion */}
      {comment.type === 'suggestion' && comment.suggestedText && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-sm mb-2 border border-blue-200 dark:border-blue-800">
          <div className="text-xs text-muted-foreground mb-1">Suggested text:</div>
          <div className="text-sm">{comment.suggestedText}</div>
          {!comment.resolved && (
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="default"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAccept();
                }}
                className="text-xs h-7"
              >
                <Check className="h-3 w-3 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReject();
                }}
                className="text-xs h-7"
              >
                <X className="h-3 w-3 mr-1" />
                Reject
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowReplies(!showReplies);
            }}
            className="flex items-center gap-1 text-xs text-muted-foreground mb-2 hover:text-foreground"
          >
            {showReplies ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
          </button>

          {showReplies && (
            <div className="space-y-2">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="pl-3 border-l-2 border-muted">
                  <div className="flex items-start gap-2">
                    {reply.userAvatar ? (
                      <img
                        src={reply.userAvatar}
                        alt={reply.userName}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                        {getInitials(reply.userName)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{reply.userName}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs mt-1">{reply.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reply input */}
      {!comment.resolved && (
        <div className="mt-3 border-t border-border pt-3">
          {isReplying ? (
            <div className="space-y-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                rows={2}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubmitReply();
                  }}
                  disabled={!replyText.trim()}
                  className="text-xs h-7"
                >
                  Reply
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsReplying(false);
                    setReplyText('');
                  }}
                  className="text-xs h-7"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setIsReplying(true);
              }}
              className="text-xs h-7"
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
