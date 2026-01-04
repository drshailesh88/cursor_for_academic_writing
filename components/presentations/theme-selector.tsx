'use client';

import { useState, useRef, useEffect } from 'react';
import { ThemeId, Theme } from '@/lib/presentations/types';
import { themes, themeList, getTheme } from '@/lib/presentations/themes';
import { ChevronDown, Check, Palette } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ============================================================================
// PROPS INTERFACES
// ============================================================================

interface ThemeSelectorProps {
  value: ThemeId;
  onChange: (themeId: ThemeId) => void;
  size?: 'sm' | 'md' | 'lg';
  showPreview?: boolean;
  className?: string;
}

interface ThemeOptionProps {
  theme: Theme;
  isSelected: boolean;
  showPreview: boolean;
  onClick: () => void;
}

// ============================================================================
// THEME SELECTOR COMPONENT
// ============================================================================

export function ThemeSelector({
  value,
  onChange,
  size = 'md',
  showPreview = true,
  className
}: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentTheme = getTheme(value);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 border rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
          size === 'sm' && "px-2 py-1 text-sm",
          size === 'md' && "px-3 py-2",
          size === 'lg' && "px-4 py-3"
        )}
      >
        {/* Color dots preview */}
        <div className="flex gap-0.5">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: currentTheme.colors.primary }}
          />
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: currentTheme.colors.secondary }}
          />
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: currentTheme.colors.accent }}
          />
        </div>
        <span>{currentTheme.name}</span>
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-50 overflow-hidden">
          {themeList.map(theme => (
            <ThemeOption
              key={theme.id}
              theme={themes[theme.id]}
              isSelected={theme.id === value}
              showPreview={showPreview}
              onClick={() => {
                onChange(theme.id);
                setIsOpen(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// THEME OPTION SUB-COMPONENT
// ============================================================================

function ThemeOption({ theme, isSelected, showPreview, onClick }: ThemeOptionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
        isSelected && "bg-purple-50 dark:bg-purple-900/20"
      )}
    >
      {/* Mini slide preview */}
      {showPreview && (
        <div
          className="w-12 h-8 rounded border overflow-hidden flex-shrink-0"
          style={{ backgroundColor: theme.colors.background }}
        >
          {/* Mini title bar */}
          <div
            className="h-2 mx-1 mt-1 rounded-sm"
            style={{ backgroundColor: theme.colors.primary }}
          />
          {/* Mini content lines */}
          <div className="mx-1 mt-1 space-y-0.5">
            <div
              className="h-1 w-8 rounded-sm"
              style={{ backgroundColor: theme.colors.text, opacity: 0.3 }}
            />
            <div
              className="h-1 w-6 rounded-sm"
              style={{ backgroundColor: theme.colors.text, opacity: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Theme info */}
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{theme.name}</span>
          {theme.isDark && (
            <span className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">
              Dark
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">{theme.description}</p>
      </div>

      {/* Color swatches */}
      <div className="flex gap-1">
        <div
          className="w-4 h-4 rounded-full border border-gray-200"
          style={{ backgroundColor: theme.colors.primary }}
          title="Primary"
        />
        <div
          className="w-4 h-4 rounded-full border border-gray-200"
          style={{ backgroundColor: theme.colors.accent }}
          title="Accent"
        />
      </div>

      {/* Check mark */}
      {isSelected && (
        <Check className="w-4 h-4 text-purple-500" />
      )}
    </button>
  );
}

// ============================================================================
// THEME COLOR DOTS COMPONENT
// ============================================================================

export function ThemeColorDots({ themeId, size = 'md' }: { themeId: ThemeId; size?: 'sm' | 'md' }) {
  const theme = getTheme(themeId);
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';

  return (
    <div className="flex gap-0.5">
      <div className={cn(dotSize, "rounded-full")} style={{ backgroundColor: theme.colors.primary }} />
      <div className={cn(dotSize, "rounded-full")} style={{ backgroundColor: theme.colors.secondary }} />
      <div className={cn(dotSize, "rounded-full")} style={{ backgroundColor: theme.colors.accent }} />
    </div>
  );
}
