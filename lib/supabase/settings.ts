// User settings operations (Supabase-backed)
'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { UserSettings, DEFAULT_SETTINGS } from '../settings/types';

export async function getUserSettings(userId: string): Promise<UserSettings> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return DEFAULT_SETTINGS;
    }

    return {
      ai: {
        defaultModel: (data.default_model as string) || DEFAULT_SETTINGS.ai.defaultModel,
        temperature: (data.temperature as number) ?? DEFAULT_SETTINGS.ai.temperature,
        personalApiKeys: (data.personal_api_keys as Record<string, string>) || {},
      },
      writing: {
        defaultDiscipline:
          (data.default_discipline as string) || DEFAULT_SETTINGS.writing.defaultDiscipline,
        defaultCitationStyle:
          (data.default_citation_style as string) || DEFAULT_SETTINGS.writing.defaultCitationStyle,
        autoSaveInterval:
          (data.auto_save_interval as number) ?? DEFAULT_SETTINGS.writing.autoSaveInterval,
      },
      editor: {
        fontSize: (data.font_size as number) ?? DEFAULT_SETTINGS.editor.fontSize,
        lineSpacing: (data.line_spacing as number) ?? DEFAULT_SETTINGS.editor.lineSpacing,
        theme: (data.theme as 'light' | 'dark' | 'system') || DEFAULT_SETTINGS.editor.theme,
      },
      export: {
        includeLineNumbers:
          (data.include_line_numbers as boolean) ?? DEFAULT_SETTINGS.export.includeLineNumbers,
        doubleSpacing:
          (data.double_spacing as boolean) ?? DEFAULT_SETTINGS.export.doubleSpacing,
        watermarkText:
          (data.watermark_text as string) || DEFAULT_SETTINGS.export.watermarkText,
      },
    };
  } catch (error) {
    console.error('Error getting user settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function updateUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<void> {
  try {
    const payload: Record<string, unknown> = {};

    if (settings.ai) {
      if (settings.ai.defaultModel !== undefined) payload.default_model = settings.ai.defaultModel;
      if (settings.ai.temperature !== undefined) payload.temperature = settings.ai.temperature;
      if (settings.ai.personalApiKeys !== undefined) {
        payload.personal_api_keys = settings.ai.personalApiKeys;
      }
    }

    if (settings.writing) {
      if (settings.writing.defaultDiscipline !== undefined) {
        payload.default_discipline = settings.writing.defaultDiscipline;
      }
      if (settings.writing.defaultCitationStyle !== undefined) {
        payload.default_citation_style = settings.writing.defaultCitationStyle;
      }
      if (settings.writing.autoSaveInterval !== undefined) {
        payload.auto_save_interval = settings.writing.autoSaveInterval;
      }
    }

    if (settings.editor) {
      if (settings.editor.fontSize !== undefined) payload.font_size = settings.editor.fontSize;
      if (settings.editor.lineSpacing !== undefined) payload.line_spacing = settings.editor.lineSpacing;
      if (settings.editor.theme !== undefined) payload.theme = settings.editor.theme;
    }

    if (settings.export) {
      if (settings.export.includeLineNumbers !== undefined) {
        payload.include_line_numbers = settings.export.includeLineNumbers;
      }
      if (settings.export.doubleSpacing !== undefined) {
        payload.double_spacing = settings.export.doubleSpacing;
      }
      if (settings.export.watermarkText !== undefined) {
        payload.watermark_text = settings.export.watermarkText;
      }
    }

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('user_settings')
      .upsert({ id: userId, ...payload });

    if (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
}

export async function resetToDefaults(userId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from('user_settings').delete().eq('id', userId);

  if (error) {
    console.error('Error resetting settings:', error);
    throw error;
  }
}

export async function updateAISettings(
  userId: string,
  aiSettings: Partial<UserSettings['ai']>
): Promise<void> {
  const currentSettings = await getUserSettings(userId);
  return updateUserSettings(userId, {
    ai: { ...currentSettings.ai, ...aiSettings },
  });
}

export async function updateWritingSettings(
  userId: string,
  writingSettings: Partial<UserSettings['writing']>
): Promise<void> {
  const currentSettings = await getUserSettings(userId);
  return updateUserSettings(userId, {
    writing: { ...currentSettings.writing, ...writingSettings },
  });
}

export async function updateEditorSettings(
  userId: string,
  editorSettings: Partial<UserSettings['editor']>
): Promise<void> {
  const currentSettings = await getUserSettings(userId);
  return updateUserSettings(userId, {
    editor: { ...currentSettings.editor, ...editorSettings },
  });
}
