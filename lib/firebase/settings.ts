// Firebase Settings Operations
'use client';

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getFirebaseDb } from './client';
import { COLLECTIONS } from './schema';
import { UserSettings, DEFAULT_SETTINGS } from '../settings/types';

/**
 * Get user settings from Firestore
 * Returns default settings if none exist
 */
export async function getUserSettings(userId: string): Promise<UserSettings> {
  try {
    const userRef = doc(getFirebaseDb(), COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();

      // Settings may be stored directly in user doc or in a settings field
      if (data.settings) {
        return { ...DEFAULT_SETTINGS, ...data.settings };
      }

      // Backwards compatibility: check for old preferences format
      if (data.preferences) {
        return {
          ...DEFAULT_SETTINGS,
          ai: {
            ...DEFAULT_SETTINGS.ai,
            defaultModel: data.preferences.defaultModel || DEFAULT_SETTINGS.ai.defaultModel,
          },
          writing: {
            ...DEFAULT_SETTINGS.writing,
            autoSaveInterval: data.preferences.autoSaveInterval || DEFAULT_SETTINGS.writing.autoSaveInterval,
          },
          editor: {
            ...DEFAULT_SETTINGS.editor,
            theme: data.preferences.theme || DEFAULT_SETTINGS.editor.theme,
          },
        };
      }
    }

    // No settings found, return defaults
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error getting user settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Update user settings in Firestore
 * Merges with existing settings
 */
export async function updateUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<void> {
  try {
    const userRef = doc(getFirebaseDb(), COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      // Merge with existing settings
      const currentSettings = await getUserSettings(userId);
      const updatedSettings: UserSettings = {
        ai: { ...currentSettings.ai, ...(settings.ai || {}) },
        writing: { ...currentSettings.writing, ...(settings.writing || {}) },
        editor: { ...currentSettings.editor, ...(settings.editor || {}) },
        export: { ...currentSettings.export, ...(settings.export || {}) },
      };

      await updateDoc(userRef, {
        settings: updatedSettings,
      });
    } else {
      // Create user doc with settings
      await setDoc(userRef, {
        uid: userId,
        settings: { ...DEFAULT_SETTINGS, ...settings },
      });
    }
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
}

/**
 * Reset user settings to defaults
 */
export async function resetToDefaults(userId: string): Promise<void> {
  try {
    const userRef = doc(getFirebaseDb(), COLLECTIONS.USERS, userId);

    await updateDoc(userRef, {
      settings: DEFAULT_SETTINGS,
    });
  } catch (error) {
    console.error('Error resetting settings to defaults:', error);
    throw error;
  }
}

/**
 * Update AI settings section
 * Merges with existing AI settings
 */
export async function updateAISettings(
  userId: string,
  aiSettings: Partial<UserSettings['ai']>
): Promise<void> {
  const currentSettings = await getUserSettings(userId);
  return updateUserSettings(userId, {
    ai: { ...currentSettings.ai, ...aiSettings },
  });
}

/**
 * Update writing settings section
 * Merges with existing writing settings
 */
export async function updateWritingSettings(
  userId: string,
  writingSettings: Partial<UserSettings['writing']>
): Promise<void> {
  const currentSettings = await getUserSettings(userId);
  return updateUserSettings(userId, {
    writing: { ...currentSettings.writing, ...writingSettings },
  });
}

/**
 * Update editor settings section
 * Merges with existing editor settings
 */
export async function updateEditorSettings(
  userId: string,
  editorSettings: Partial<UserSettings['editor']>
): Promise<void> {
  const currentSettings = await getUserSettings(userId);
  return updateUserSettings(userId, {
    editor: { ...currentSettings.editor, ...editorSettings },
  });
}

/**
 * Update export settings section
 * Merges with existing export settings
 */
export async function updateExportSettings(
  userId: string,
  exportSettings: Partial<UserSettings['export']>
): Promise<void> {
  const currentSettings = await getUserSettings(userId);
  return updateUserSettings(userId, {
    export: { ...currentSettings.export, ...exportSettings },
  });
}
