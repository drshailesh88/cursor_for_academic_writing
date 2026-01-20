// Settings Hook
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../supabase/auth';
import {
  getUserSettings,
  updateUserSettings,
  resetToDefaults,
} from '../supabase/settings';
import { UserSettings, DEFAULT_SETTINGS } from '../settings/types';
import { useDebouncedCallback } from 'use-debounce';

export function useSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [saving, setSaving] = useState(false);

  // Load settings on mount or when user changes
  useEffect(() => {
    async function loadSettings() {
      if (!user) {
        setSettings(DEFAULT_SETTINGS);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userSettings = await getUserSettings(user.uid);
        setSettings(userSettings);
        setError(null);
      } catch (err) {
        console.error('Error loading settings:', err);
        setError(err as Error);
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [user]);

  // Debounced save to Supabase (500ms delay)
  const debouncedSave = useDebouncedCallback(
    async (userId: string, updatedSettings: Partial<UserSettings>) => {
      try {
        setSaving(true);
        await updateUserSettings(userId, updatedSettings);
        setSaving(false);
      } catch (err) {
        console.error('Error saving settings:', err);
        setError(err as Error);
        setSaving(false);
      }
    },
    500
  );

  // Update settings (optimistic update + debounced save)
  const updateSettings = useCallback(
    (updates: Partial<UserSettings>) => {
      if (!user) return;

      // Optimistic update
      setSettings((prev) => ({
        ai: { ...prev.ai, ...(updates.ai || {}) },
        writing: { ...prev.writing, ...(updates.writing || {}) },
        editor: { ...prev.editor, ...(updates.editor || {}) },
        export: { ...prev.export, ...(updates.export || {}) },
      }));

      // Debounced save to Supabase
      debouncedSave(user.uid, updates);
    },
    [user, debouncedSave]
  );

  // Update specific sections
  const updateAI = useCallback(
    (aiUpdates: Partial<UserSettings['ai']>) => {
      updateSettings({ ai: aiUpdates as UserSettings['ai'] });
    },
    [updateSettings]
  );

  const updateWriting = useCallback(
    (writingUpdates: Partial<UserSettings['writing']>) => {
      updateSettings({ writing: writingUpdates as UserSettings['writing'] });
    },
    [updateSettings]
  );

  const updateEditor = useCallback(
    (editorUpdates: Partial<UserSettings['editor']>) => {
      updateSettings({ editor: editorUpdates as UserSettings['editor'] });
    },
    [updateSettings]
  );

  const updateExport = useCallback(
    (exportUpdates: Partial<UserSettings['export']>) => {
      updateSettings({ export: exportUpdates as UserSettings['export'] });
    },
    [updateSettings]
  );

  // Reset to defaults
  const reset = useCallback(async () => {
    if (!user) return;

    try {
      setSaving(true);
      await resetToDefaults(user.uid);
      setSettings(DEFAULT_SETTINGS);
      setSaving(false);
    } catch (err) {
      console.error('Error resetting settings:', err);
      setError(err as Error);
      setSaving(false);
    }
  }, [user]);

  return {
    settings,
    loading,
    error,
    saving,
    updateSettings,
    updateAI,
    updateWriting,
    updateEditor,
    updateExport,
    reset,
  };
}
