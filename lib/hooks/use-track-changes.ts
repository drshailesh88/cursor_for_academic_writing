// Custom hook for track changes management
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import {
  createTrackedChange,
  getTrackedChanges,
  acceptChange as acceptChangeInSupabase,
  rejectChange as rejectChangeInSupabase,
  acceptAllChanges,
  rejectAllChanges,
  subscribeToTrackedChanges,
} from '@/lib/collaboration/track-changes';
import type { TrackedChange, ChangeType } from '@/lib/collaboration/types';
import { useAuth } from '@/lib/supabase/auth';
import { toast } from 'sonner';

interface UseTrackChangesOptions {
  documentId?: string;
  editor: Editor | null;
  enabled?: boolean;
}

export function useTrackChanges(options: UseTrackChangesOptions) {
  const { user } = useAuth();
  const { documentId, editor, enabled = true } = options;

  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [showChanges, setShowChanges] = useState(true);
  const [changes, setChanges] = useState<TrackedChange[]>([]);
  const [loading, setLoading] = useState(false);

  const lastContentRef = useRef('');
  const isProcessingRef = useRef(false);

  // Load changes when document changes
  useEffect(() => {
    async function loadChanges() {
      if (!documentId || !user || !enabled) {
        return;
      }

      try {
        setLoading(true);
        const loadedChanges = await getTrackedChanges(documentId);
        setChanges(loadedChanges);
      } catch (err) {
        console.error('Error loading tracked changes:', err);
      } finally {
        setLoading(false);
      }
    }

    loadChanges();
  }, [documentId, user, enabled]);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!documentId || !enabled) {
      return;
    }

    const unsubscribe = subscribeToTrackedChanges(documentId, (updatedChanges) => {
      setChanges(updatedChanges);
    });

    return () => unsubscribe();
  }, [documentId, enabled]);

  // Track document changes when tracking is enabled
  useEffect(() => {
    if (!editor || !trackingEnabled || !documentId || !user) {
      return;
    }

    const handleUpdate = () => {
      if (isProcessingRef.current) {
        return;
      }

      const currentContent = editor.getHTML();
      if (lastContentRef.current === currentContent) {
        return;
      }

      // Store current content
      lastContentRef.current = currentContent;
    };

    editor.on('update', handleUpdate);

    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, trackingEnabled, documentId, user]);

  // Toggle tracking
  const toggleTracking = useCallback(() => {
    if (!editor) {
      return;
    }

    setTrackingEnabled((prev) => {
      const newState = !prev;
      if (newState) {
        lastContentRef.current = editor.getHTML();
        toast.success('Track changes enabled');
      } else {
        toast.info('Track changes disabled');
      }
      return newState;
    });
  }, [editor]);

  // Toggle showing changes
  const toggleShowChanges = useCallback(() => {
    setShowChanges((prev) => !prev);
  }, []);

  // Create a tracked change
  const createChange = useCallback(
    async (
      type: ChangeType,
      from: number,
      to: number,
      oldContent?: string,
      newContent?: string
    ): Promise<string | null> => {
      if (!documentId || !user) {
        toast.error('Cannot create change: not authenticated');
        return null;
      }

      try {
        const changeId = await createTrackedChange(
          documentId,
          type,
          from,
          to,
          user.uid,
          user.displayName || user.email || 'Unknown User',
          oldContent,
          newContent
        );

        return changeId;
      } catch (err) {
        console.error('Error creating tracked change:', err);
        toast.error('Failed to create tracked change');
        return null;
      }
    },
    [documentId, user]
  );

  // Accept a change
  const acceptChange = useCallback(
    async (changeId: string): Promise<void> => {
      if (!documentId || !user || !editor) {
        return;
      }

      try {
        isProcessingRef.current = true;

        const change = changes.find((c) => c.id === changeId);
        if (!change) {
          return;
        }

      // Accept the change in Supabase
      await acceptChangeInSupabase(documentId, changeId, user.uid);

        // Apply the change to the editor
        if (change.type === 'insertion' && change.newContent) {
          // The insertion is already in the document, just remove the mark
          editor.chain()
            .focus()
            .setTextSelection({ from: change.from, to: change.to })
            .unsetMark('trackInsertion')
            .run();
        } else if (change.type === 'deletion') {
          // Remove the deleted text permanently
          editor.chain()
            .focus()
            .setTextSelection({ from: change.from, to: change.to })
            .deleteSelection()
            .run();
        }

        toast.success('Change accepted');
      } catch (err) {
        console.error('Error accepting change:', err);
        toast.error('Failed to accept change');
      } finally {
        isProcessingRef.current = false;
      }
    },
    [documentId, user, editor, changes]
  );

  // Reject a change
  const rejectChange = useCallback(
    async (changeId: string): Promise<void> => {
      if (!documentId || !user || !editor) {
        return;
      }

      try {
        isProcessingRef.current = true;

        const change = changes.find((c) => c.id === changeId);
        if (!change) {
          return;
        }

      // Reject the change in Supabase
      await rejectChangeInSupabase(documentId, changeId, user.uid);

        // Revert the change in the editor
        if (change.type === 'insertion') {
          // Remove the inserted text
          editor.chain()
            .focus()
            .setTextSelection({ from: change.from, to: change.to })
            .deleteSelection()
            .run();
        } else if (change.type === 'deletion' && change.oldContent) {
          // Restore the deleted text
          editor.chain()
            .focus()
            .setTextSelection({ from: change.from, to: change.to })
            .deleteSelection()
            .insertContent(change.oldContent)
            .run();
        }

        toast.success('Change rejected');
      } catch (err) {
        console.error('Error rejecting change:', err);
        toast.error('Failed to reject change');
      } finally {
        isProcessingRef.current = false;
      }
    },
    [documentId, user, editor, changes]
  );

  // Accept all changes
  const acceptAll = useCallback(async (): Promise<void> => {
    if (!documentId || !user || !editor) {
      return;
    }

    try {
      isProcessingRef.current = true;
      await acceptAllChanges(documentId, user.uid);

      // Remove all track marks from the editor
      editor.chain()
        .focus()
        .unsetMark('trackInsertion')
        .unsetMark('trackDeletion')
        .run();

      toast.success('All changes accepted');
    } catch (err) {
      console.error('Error accepting all changes:', err);
      toast.error('Failed to accept all changes');
    } finally {
      isProcessingRef.current = false;
    }
  }, [documentId, user, editor]);

  // Reject all changes
  const rejectAll = useCallback(async (): Promise<void> => {
    if (!documentId || !user || !editor) {
      return;
    }

    try {
      isProcessingRef.current = true;

      // Process each change to revert it
      const pendingChanges = changes.filter((c) => c.status === 'pending');
      for (const change of pendingChanges) {
        await rejectChange(change.id);
      }

      toast.success('All changes rejected');
    } catch (err) {
      console.error('Error rejecting all changes:', err);
      toast.error('Failed to reject all changes');
    } finally {
      isProcessingRef.current = false;
    }
  }, [documentId, user, editor, changes, rejectChange]);

  // Get pending changes count
  const pendingCount = changes.filter((c) => c.status === 'pending').length;

  return {
    trackingEnabled,
    showChanges,
    changes,
    loading,
    pendingCount,
    toggleTracking,
    toggleShowChanges,
    createChange,
    acceptChange,
    rejectChange,
    acceptAll,
    rejectAll,
  };
}
