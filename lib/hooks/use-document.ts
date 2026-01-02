// Custom hook for document management with auto-save
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getDocument,
  createDocument,
  saveDocumentContent,
  updateDocument,
} from '@/lib/firebase/documents';
import { Document } from '@/lib/firebase/schema';
import { useAuth } from '@/lib/firebase/auth';
import { toast } from 'sonner';

interface UseDocumentOptions {
  documentId?: string;
  autoSaveInterval?: number; // milliseconds
}

export function useDocument(options: UseDocumentOptions = {}) {
  const { user } = useAuth();
  const { documentId, autoSaveInterval = 30000 } = options; // 30 seconds default

  const [document, setDocument] = useState<Document | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const contentRef = useRef(content);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Update ref when content changes
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Load document
  useEffect(() => {
    async function loadDocument() {
      if (!documentId || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const doc = await getDocument(documentId);

        if (doc) {
          setDocument(doc);
          setContent(doc.content);
          setLastSaved(doc.updatedAt);
        } else {
          setError(new Error('Document not found'));
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    loadDocument();
  }, [documentId, user]);

  // Save function
  const save = useCallback(async () => {
    if (!documentId || !user || saving) return;

    try {
      setSaving(true);

      // Count words
      const text = contentRef.current.replace(/<[^>]*>/g, ' ');
      const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

      await saveDocumentContent(documentId, contentRef.current, wordCount);
      setLastSaved(new Date());
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Auto-save failed:', err);
    } finally {
      setSaving(false);
    }
  }, [documentId, user, saving]);

  // Auto-save effect
  useEffect(() => {
    if (!documentId || !user) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(() => {
      save();
    }, autoSaveInterval);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, documentId, user, autoSaveInterval, save]);

  // Create new document
  const createNew = useCallback(
    async (title: string = 'Untitled Document') => {
      if (!user) {
        throw new Error('User must be signed in to create documents');
      }

      try {
        setLoading(true);
        const newDocId = await createDocument(user.uid, title);
        const newDoc = await getDocument(newDocId);

        if (newDoc) {
          setDocument(newDoc);
          setContent(newDoc.content);
          setLastSaved(newDoc.updatedAt);
        }

        return newDocId;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Update document title
  const updateTitle = useCallback(
    async (newTitle: string) => {
      if (!documentId) return;

      try {
        await updateDocument(documentId, { title: newTitle });
        setDocument((prev) =>
          prev ? { ...prev, title: newTitle } : null
        );
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [documentId]
  );

  // Manual save with toast feedback
  const saveNow = useCallback(async () => {
    await save();
    toast.success('Document saved');
  }, [save]);

  return {
    document,
    content,
    setContent,
    loading,
    saving,
    lastSaved,
    error,
    createNew,
    updateTitle,
    saveNow,
  };
}
