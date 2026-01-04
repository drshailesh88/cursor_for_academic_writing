/**
 * Presentation Generator - Theme System
 * Phase 7B: Complete Theme Definitions
 */

import { ThemeId, Theme } from './types';

// ============================================================================
// ACADEMIC THEME
// ============================================================================

export const academicTheme: Theme = {
  id: 'academic',
  name: 'Academic',
  description: 'Premium academic theme with scholarly colors and professional typography',
  isDark: false,
  colors: {
    primary: '#6f5d96', // Deep purple
    secondary: '#a18a76', // Warm gray
    accent: '#d9a836', // Scholarly gold
    background: '#ffffff',
    surface: '#f8f6f9',
    text: '#1a1625',
    textMuted: '#6b5d75',
    border: '#e0d8e8',
    chart: [
      '#6f5d96', // Primary purple
      '#d9a836', // Gold
      '#a18a76', // Warm gray
      '#9b8bb3', // Light purple
      '#c4a853', // Light gold
      '#b89f8d', // Light warm gray
    ],
    success: '#4a9d5f',
    warning: '#d9a836',
    error: '#c54545',
  },
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  spacing: {
    slidePadding: 48,
    elementGap: 24,
    bulletIndent: 32,
  },
  styles: {
    headingWeight: 600,
    borderRadius: 8,
    shadowIntensity: 0.08,
  },
};

// ============================================================================
// DARK THEME
// ============================================================================

export const darkTheme: Theme = {
  id: 'dark',
  name: 'Dark',
  description: 'Elegant dark theme for presentations in low-light environments',
  isDark: true,
  colors: {
    primary: '#a78bfa', // Soft purple
    secondary: '#60a5fa', // Soft blue
    accent: '#fbbf24', // Amber
    background: '#0f0f0f',
    surface: '#1a1a1a',
    text: '#f5f5f5',
    textMuted: '#a1a1aa',
    border: '#27272a',
    chart: [
      '#a78bfa', // Soft purple
      '#60a5fa', // Soft blue
      '#34d399', // Emerald
      '#fbbf24', // Amber
      '#fb7185', // Rose
      '#818cf8', // Indigo
    ],
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
  },
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  spacing: {
    slidePadding: 48,
    elementGap: 24,
    bulletIndent: 32,
  },
  styles: {
    headingWeight: 600,
    borderRadius: 8,
    shadowIntensity: 0.08,
  },
};

// ============================================================================
// MINIMAL THEME
// ============================================================================

export const minimalTheme: Theme = {
  id: 'minimal',
  name: 'Minimal',
  description: 'Clean, distraction-free black and white design',
  isDark: false,
  colors: {
    primary: '#000000',
    secondary: '#525252',
    accent: '#404040',
    background: '#ffffff',
    surface: '#fafafa',
    text: '#0a0a0a',
    textMuted: '#737373',
    border: '#e5e5e5',
    chart: [
      '#000000', // Black
      '#525252', // Dark gray
      '#737373', // Medium gray
      '#a3a3a3', // Light gray
      '#d4d4d4', // Very light gray
      '#404040', // Charcoal
    ],
    success: '#171717',
    warning: '#525252',
    error: '#262626',
  },
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  spacing: {
    slidePadding: 48,
    elementGap: 24,
    bulletIndent: 32,
  },
  styles: {
    headingWeight: 600,
    borderRadius: 8,
    shadowIntensity: 0.08,
  },
};

// ============================================================================
// THEME REGISTRY
// ============================================================================

/**
 * All available themes mapped by ID
 */
export const themes: Record<ThemeId, Theme> = {
  academic: academicTheme,
  dark: darkTheme,
  minimal: minimalTheme,
  // Placeholders for future themes
  medical: academicTheme, // TODO: Implement medical theme
  tech: darkTheme, // TODO: Implement tech theme
  humanities: academicTheme, // TODO: Implement humanities theme
  nature: minimalTheme, // TODO: Implement nature theme
};

/**
 * Get a theme by ID with fallback to academic theme
 */
export function getTheme(id: ThemeId): Theme {
  return themes[id] || academicTheme;
}

/**
 * List of all themes for UI selectors
 */
export const themeList: Array<{ id: ThemeId; name: string; description: string; isDark: boolean }> = [
  {
    id: 'academic',
    name: academicTheme.name,
    description: academicTheme.description,
    isDark: academicTheme.isDark,
  },
  {
    id: 'dark',
    name: darkTheme.name,
    description: darkTheme.description,
    isDark: darkTheme.isDark,
  },
  {
    id: 'minimal',
    name: minimalTheme.name,
    description: minimalTheme.description,
    isDark: minimalTheme.isDark,
  },
  // Future themes can be added here when implemented
  // {
  //   id: 'medical',
  //   name: 'Medical',
  //   description: 'Clinical theme for medical presentations',
  //   isDark: false,
  // },
  // {
  //   id: 'tech',
  //   name: 'Tech',
  //   description: 'Modern tech theme with vibrant colors',
  //   isDark: false,
  // },
  // {
  //   id: 'humanities',
  //   name: 'Humanities',
  //   description: 'Warm, classical theme for humanities',
  //   isDark: false,
  // },
  // {
  //   id: 'nature',
  //   name: 'Nature',
  //   description: 'Earth-toned theme inspired by nature',
  //   isDark: false,
  // },
];

// ============================================================================
// THEME UTILITIES
// ============================================================================

/**
 * Get chart color by index (cycles through available colors)
 */
export function getChartColor(theme: Theme, index: number): string {
  return theme.colors.chart[index % theme.colors.chart.length];
}

/**
 * Get all chart colors for a theme
 */
export function getChartColors(theme: Theme): string[] {
  return theme.colors.chart;
}

/**
 * Get theme CSS variables for use in components
 */
export function getThemeCSSVariables(theme: Theme): Record<string, string> {
  return {
    '--theme-primary': theme.colors.primary,
    '--theme-secondary': theme.colors.secondary,
    '--theme-accent': theme.colors.accent,
    '--theme-background': theme.colors.background,
    '--theme-surface': theme.colors.surface,
    '--theme-text': theme.colors.text,
    '--theme-text-muted': theme.colors.textMuted,
    '--theme-border': theme.colors.border,
    '--theme-success': theme.colors.success,
    '--theme-warning': theme.colors.warning,
    '--theme-error': theme.colors.error,
    '--theme-font-heading': theme.fonts.heading,
    '--theme-font-body': theme.fonts.body,
    '--theme-font-mono': theme.fonts.mono,
    '--theme-padding': `${theme.spacing.slidePadding}px`,
    '--theme-gap': `${theme.spacing.elementGap}px`,
    '--theme-bullet-indent': `${theme.spacing.bulletIndent}px`,
    '--theme-border-radius': `${theme.styles.borderRadius}px`,
  };
}

/**
 * Check if a theme ID is valid
 */
export function isValidThemeId(id: string): id is ThemeId {
  return id in themes;
}

/**
 * Get default theme (academic)
 */
export function getDefaultTheme(): Theme {
  return academicTheme;
}
