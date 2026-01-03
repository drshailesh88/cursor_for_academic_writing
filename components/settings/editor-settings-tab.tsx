'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { THEME_OPTIONS, LINE_SPACING_OPTIONS } from '@/lib/settings/types';
import { UserSettings } from '@/lib/settings/types';

interface EditorSettingsTabProps {
  settings: UserSettings['editor'];
  onUpdate: (updates: Partial<UserSettings['editor']>) => void;
}

export function EditorSettingsTab({
  settings,
  onUpdate,
}: EditorSettingsTabProps) {
  return (
    <div className="space-y-6">
      {/* Font Size */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="font-size">Font Size</Label>
          <span className="text-sm text-muted-foreground">
            {settings.fontSize}px
          </span>
        </div>
        <Slider
          id="font-size"
          min={12}
          max={24}
          step={1}
          value={[settings.fontSize]}
          onValueChange={(value: number[]) => onUpdate({ fontSize: value[0] })}
        />
        <p className="text-xs text-muted-foreground">
          Adjust the editor text size (12-24px)
        </p>
      </div>

      {/* Line Spacing */}
      <div className="space-y-2">
        <Label htmlFor="line-spacing">Line Spacing</Label>
        <Select
          value={settings.lineSpacing.toString()}
          onValueChange={(value: string) =>
            onUpdate({ lineSpacing: parseFloat(value) })
          }
        >
          <SelectTrigger id="line-spacing">
            <SelectValue placeholder="Select line spacing" />
          </SelectTrigger>
          <SelectContent>
            {LINE_SPACING_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Line spacing for the editor content
        </p>
      </div>

      {/* Theme */}
      <div className="space-y-2">
        <Label htmlFor="theme">Theme</Label>
        <Select
          value={settings.theme}
          onValueChange={(value: 'light' | 'dark' | 'system') =>
            onUpdate({ theme: value })
          }
        >
          <SelectTrigger id="theme">
            <SelectValue placeholder="Select theme" />
          </SelectTrigger>
          <SelectContent>
            {THEME_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Choose light, dark, or match system preferences
        </p>
      </div>
    </div>
  );
}
