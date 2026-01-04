// User Settings Types

export interface AISettings {
  defaultModel: string;
  temperature: number; // 0-1
  personalApiKeys: {
    openai?: string;
    anthropic?: string;
    google?: string;
  };
}

export interface WritingSettings {
  defaultDiscipline: string;
  defaultCitationStyle: string;
  autoSaveInterval: number; // seconds
}

export interface EditorSettings {
  fontSize: number; // 12-24
  lineSpacing: number; // 1, 1.5, 2
  theme: 'light' | 'dark' | 'system';
}

export interface ExportSettings {
  includeLineNumbers: boolean;
  doubleSpacing: boolean;
  watermarkText: string;
}

export interface UserSettings {
  ai: AISettings;
  writing: WritingSettings;
  editor: EditorSettings;
  export: ExportSettings;
}

// Default settings for new users
export const DEFAULT_SETTINGS: UserSettings = {
  ai: {
    defaultModel: 'anthropic',
    temperature: 0.7,
    personalApiKeys: {},
  },
  writing: {
    defaultDiscipline: 'life-sciences',
    defaultCitationStyle: 'apa',
    autoSaveInterval: 30,
  },
  editor: {
    fontSize: 16,
    lineSpacing: 1.5,
    theme: 'system',
  },
  export: {
    includeLineNumbers: false,
    doubleSpacing: true,
    watermarkText: '',
  },
};

// Available options for dropdowns
export const AI_MODELS = [
  { value: 'anthropic', label: 'Claude (Anthropic)' },
  { value: 'openai', label: 'GPT-4o (OpenAI)' },
  { value: 'google', label: 'Gemini (Google)' },
  { value: 'openrouter', label: 'Qwen (OpenRouter)' },
] as const;

export const DISCIPLINES = [
  { value: 'life-sciences', label: 'Life Sciences' },
  { value: 'bioinformatics', label: 'Bioinformatics' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'clinical-medicine', label: 'Clinical Medicine' },
  { value: 'physics', label: 'Physics' },
  { value: 'astronomy', label: 'Astronomy' },
  { value: 'computer-science', label: 'Computer Science' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'materials-science', label: 'Materials Science' },
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'neuroscience', label: 'Neuroscience' },
  { value: 'earth-sciences', label: 'Earth Sciences' },
  { value: 'social-sciences', label: 'Social Sciences' },
  { value: 'economics', label: 'Economics' },
  { value: 'environmental-science', label: 'Environmental Science' },
] as const;

export const CITATION_STYLES = [
  { value: 'apa', label: 'APA (American Psychological Association)' },
  { value: 'mla', label: 'MLA (Modern Language Association)' },
  { value: 'chicago', label: 'Chicago' },
  { value: 'vancouver', label: 'Vancouver' },
  { value: 'harvard', label: 'Harvard' },
  { value: 'ieee', label: 'IEEE' },
] as const;

export const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
] as const;

export const LINE_SPACING_OPTIONS = [
  { value: 1, label: 'Single' },
  { value: 1.5, label: '1.5' },
  { value: 2, label: 'Double' },
] as const;
