// Custom hook for document version history management
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  createVersion,
  getVersions,
  getVersion,
  deleteVersion as deleteVersionFromSupabase,
  restoreVersion as restoreVersionToSupabase,
  updateVersionLabel,
  getVersionStats,
} from '@/lib/collaboration/versions';
import type { DocumentVersion, CreateVersionOptions } from '@/lib/collaboration/types';
import { useAuth } from '@/lib/supabase/auth';
import { toast } from 'sonner';

interface UseVersionsOptions {
  documentId?: string;
  currentContent?: string;
  currentWordCount?: number;
  autoSaveInterval?: number; // milliseconds - default 5 minutes
  enabled?: boolean; // Whether to enable auto-versioning
}

export function useVersions(options: UseVersionsOptions = {}) {
  const { user } = useAuth();
  const {
    documentId,
    currentContent = '',
    currentWordCount = 0,
    autoSaveInterval = 5 * 60 * 1000, // 5 minutes
    enabled = true,
  } = options;

  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState({
    totalVersions: 0,
    manualVersions: 0,
    autoVersions: 0,
  });

  const lastContentRef = useRef(currentContent);
  const lastVersionTimeRef = useRef<number>(0);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Load versions when document changes
  useEffect(() => {
    async function loadVersions() {
      if (!documentId || !user || !enabled) {
        return;
      }

      try {
        setLoading(true);
        const [loadedVersions, versionStats] = await Promise.all([
          getVersions(documentId),
          getVersionStats(documentId),
        ]);

        setVersions(loadedVersions);
        setStats(versionStats);

        // Update last version time
        if (loadedVersions.length > 0) {
          lastVersionTimeRef.current = loadedVersions[0].createdAt;
        }
      } catch (err) {
        setError(err as Error);
        console.error('Error loading versions:', err);
      } finally {
        setLoading(false);
      }
    }

    loadVersions();
  }, [documentId, user, enabled]);

  // Create a new version
  const saveVersion = useCallback(
    async (options: CreateVersionOptions): Promise<string | null> => {
      if (!documentId || !user) {
        toast.error('Cannot save version: not authenticated');
        return null;
      }

      try {
        const versionId = await createVersion(
          documentId,
          currentContent,
          currentWordCount,
          user.uid,
          user.displayName || user.email || 'Unknown User',
          options
        );

        // Reload versions
        const [loadedVersions, versionStats] = await Promise.all([
          getVersions(documentId),
          getVersionStats(documentId),
        ]);

        setVersions(loadedVersions);
        setStats(versionStats);
        lastVersionTimeRef.current = Date.now();
        lastContentRef.current = currentContent;

        if (options.type === 'manual') {
          toast.success('Version saved successfully');
        }

        return versionId;
      } catch (err) {
        setError(err as Error);
        console.error('Error saving version:', err);
        toast.error('Failed to save version');
        return null;
      }
    },
    [documentId, user, currentContent, currentWordCount]
  );

  // Create manual version
  const createManualVersion = useCallback(
    async (label?: string, description?: string) => {
      return saveVersion({
        type: 'manual',
        label,
        description,
      });
    },
    [saveVersion]
  );

  // Create auto version
  const createAutoVersion = useCallback(async () => {
    return saveVersion({
      type: 'auto',
    });
  }, [saveVersion]);

  // Auto-save version effect
  useEffect(() => {
    if (!documentId || !user || !enabled) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Check if content has changed and enough time has passed
    const contentChanged = currentContent !== lastContentRef.current;
    const timeSinceLastVersion = Date.now() - lastVersionTimeRef.current;
    const shouldAutoSave = contentChanged && timeSinceLastVersion >= autoSaveInterval;

    if (shouldAutoSave && currentContent.trim().length > 0) {
      // Create auto version immediately if interval has passed
      createAutoVersion();
    } else if (contentChanged) {
      // Schedule auto version for later
      autoSaveTimeoutRef.current = setTimeout(() => {
        if (currentContent !== lastContentRef.current) {
          createAutoVersion();
        }
      }, autoSaveInterval);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [
    currentContent,
    documentId,
    user,
    enabled,
    autoSaveInterval,
    createAutoVersion,
  ]);

  // Restore a version
  const restoreVersion = useCallback(
    async (versionId: string): Promise<boolean> => {
      if (!documentId || !user) {
        toast.error('Cannot restore version: not authenticated');
        return false;
      }

      try {
        await restoreVersionToSupabase(
          documentId,
          versionId,
          user.uid,
          user.displayName || user.email || 'Unknown User'
        );

        // Reload versions to include the backup version created during restore
        const [loadedVersions, versionStats] = await Promise.all([
          getVersions(documentId),
          getVersionStats(documentId),
        ]);

        setVersions(loadedVersions);
        setStats(versionStats);

        toast.success('Version restored successfully');
        return true;
      } catch (err) {
        setError(err as Error);
        console.error('Error restoring version:', err);
        toast.error('Failed to restore version');
        return false;
      }
    },
    [documentId, user]
  );

  // Delete a version
  const deleteVersion = useCallback(
    async (versionId: string): Promise<boolean> => {
      if (!documentId) {
        toast.error('Cannot delete version: no document');
        return false;
      }

      try {
        await deleteVersionFromSupabase(documentId, versionId);

        // Remove from local state
        setVersions((prev) => prev.filter((v) => v.id !== versionId));
        setStats((prev) => ({
          ...prev,
          totalVersions: prev.totalVersions - 1,
        }));

        toast.success('Version deleted');
        return true;
      } catch (err) {
        setError(err as Error);
        console.error('Error deleting version:', err);
        toast.error('Failed to delete version');
        return false;
      }
    },
    [documentId]
  );

  // Update version label
  const updateLabel = useCallback(
    async (versionId: string, label: string): Promise<boolean> => {
      if (!documentId) {
        return false;
      }

      try {
        await updateVersionLabel(documentId, versionId, label);

        // Update local state
        setVersions((prev) =>
          prev.map((v) => (v.id === versionId ? { ...v, label } : v))
        );

        toast.success('Label updated');
        return true;
      } catch (err) {
        setError(err as Error);
        console.error('Error updating label:', err);
        toast.error('Failed to update label');
        return false;
      }
    },
    [documentId]
  );

  // Get a specific version
  const loadVersion = useCallback(
    async (versionId: string): Promise<DocumentVersion | null> => {
      if (!documentId) {
        return null;
      }

      try {
        return await getVersion(documentId, versionId);
      } catch (err) {
        setError(err as Error);
        console.error('Error loading version:', err);
        return null;
      }
    },
    [documentId]
  );

  // Refresh versions list
  const refreshVersions = useCallback(async () => {
    if (!documentId || !user) {
      return;
    }

    try {
      setLoading(true);
      const [loadedVersions, versionStats] = await Promise.all([
        getVersions(documentId),
        getVersionStats(documentId),
      ]);

      setVersions(loadedVersions);
      setStats(versionStats);
    } catch (err) {
      setError(err as Error);
      console.error('Error refreshing versions:', err);
    } finally {
      setLoading(false);
    }
  }, [documentId, user]);

  return {
    versions,
    loading,
    error,
    stats,
    createManualVersion,
    restoreVersion,
    deleteVersion,
    updateLabel,
    loadVersion,
    refreshVersions,
  };
}
