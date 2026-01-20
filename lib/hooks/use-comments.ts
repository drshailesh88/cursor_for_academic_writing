// React hook for managing comments and suggestions
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/supabase/auth';
import {
  addComment as addCommentToSupabase,
  getComments as getCommentsFromSupabase,
  updateComment as updateCommentInSupabase,
  deleteComment as deleteCommentFromSupabase,
  resolveComment as resolveCommentInSupabase,
  addReply as addReplyToSupabase,
  subscribeToComments,
} from '@/lib/collaboration/comments';
import type {
  Comment,
  CommentReply,
  CreateCommentData,
  UpdateCommentData,
  CommentFilter,
} from '@/lib/collaboration/types';
import { toast } from 'sonner';

interface UseCommentsOptions {
  documentId?: string;
  filter?: CommentFilter;
}

export function useComments(options: UseCommentsOptions = {}) {
  const { user } = useAuth();
  const { documentId, filter = 'all' } = options;

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!documentId) {
      setLoading(false);
      setComments([]);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToComments(documentId, (updatedComments) => {
      setComments(updatedComments);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [documentId]);

  // Filter comments based on filter option
  const filteredComments = useMemo(() => {
    if (filter === 'all') return comments;
    if (filter === 'open') return comments.filter((c) => !c.resolved);
    if (filter === 'resolved') return comments.filter((c) => c.resolved);
    return comments;
  }, [comments, filter]);

  // Sort comments by position in document
  const sortedComments = useMemo(() => {
    return [...filteredComments].sort((a, b) => a.selectionStart - b.selectionStart);
  }, [filteredComments]);

  // Add a new comment
  const addComment = useCallback(
    async (data: Omit<CreateCommentData, 'documentId' | 'userId' | 'userName' | 'userAvatar'>) => {
      if (!documentId || !user) {
        throw new Error('Document ID and user are required');
      }

      try {
        const commentData: CreateCommentData = {
          ...data,
          documentId,
          userId: user.uid,
          userName: user.displayName || 'Anonymous',
          userAvatar: user.photoURL || undefined,
        };

        const commentId = await addCommentToSupabase(commentData);
        toast.success(data.type === 'suggestion' ? 'Suggestion added' : 'Comment added');
        return commentId;
      } catch (err) {
        setError(err as Error);
        toast.error('Failed to add comment');
        throw err;
      }
    },
    [documentId, user]
  );

  // Update a comment
  const updateComment = useCallback(
    async (commentId: string, updates: UpdateCommentData) => {
      if (!documentId) {
        throw new Error('Document ID is required');
      }

      try {
        await updateCommentInSupabase(commentId, updates);
        toast.success('Comment updated');
      } catch (err) {
        setError(err as Error);
        toast.error('Failed to update comment');
        throw err;
      }
    },
    [documentId]
  );

  // Delete a comment
  const deleteComment = useCallback(
    async (commentId: string) => {
      if (!documentId) {
        throw new Error('Document ID is required');
      }

      try {
        await deleteCommentFromSupabase(commentId);
        toast.success('Comment deleted');
      } catch (err) {
        setError(err as Error);
        toast.error('Failed to delete comment');
        throw err;
      }
    },
    [documentId]
  );

  // Resolve a comment
  const resolveComment = useCallback(
    async (commentId: string) => {
      if (!documentId) {
        throw new Error('Document ID is required');
      }

      try {
        await resolveCommentInSupabase(commentId, true);
        toast.success('Comment resolved');
      } catch (err) {
        setError(err as Error);
        toast.error('Failed to resolve comment');
        throw err;
      }
    },
    [documentId]
  );

  // Unresolve a comment
  const unresolveComment = useCallback(
    async (commentId: string) => {
      if (!documentId) {
        throw new Error('Document ID is required');
      }

      try {
        await updateCommentInSupabase(commentId, { resolved: false });
        toast.success('Comment reopened');
      } catch (err) {
        setError(err as Error);
        toast.error('Failed to reopen comment');
        throw err;
      }
    },
    [documentId]
  );

  // Add a reply to a comment
  const addReply = useCallback(
    async (commentId: string, content: string) => {
      if (!documentId || !user) {
        throw new Error('Document ID and user are required');
      }

      try {
        const reply: Omit<CommentReply, 'id' | 'createdAt'> = {
          userId: user.uid,
          userName: user.displayName || 'Anonymous',
          userAvatar: user.photoURL || undefined,
          content,
        };

        await addReplyToSupabase(documentId, commentId, reply);
        toast.success('Reply added');
      } catch (err) {
        setError(err as Error);
        toast.error('Failed to add reply');
        throw err;
      }
    },
    [documentId, user]
  );

  // Get comment counts
  const commentCounts = useMemo(() => {
    return {
      total: comments.length,
      open: comments.filter((c) => !c.resolved).length,
      resolved: comments.filter((c) => c.resolved).length,
      suggestions: comments.filter((c) => c.type === 'suggestion').length,
    };
  }, [comments]);

  return {
    comments: sortedComments,
    loading,
    error,
    commentCounts,
    addComment,
    updateComment,
    deleteComment,
    resolveComment,
    unresolveComment,
    addReply,
  };
}
