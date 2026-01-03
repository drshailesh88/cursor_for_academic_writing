'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DISCIPLINES, CITATION_STYLES } from '@/lib/settings/types';
import { UserSettings } from '@/lib/settings/types';

interface WritingSettingsTabProps {
  settings: UserSettings['writing'];
  onUpdate: (updates: Partial<UserSettings['writing']>) => void;
}

export function WritingSettingsTab({
  settings,
  onUpdate,
}: WritingSettingsTabProps) {
  return (
    <div className="space-y-6">
      {/* Default Discipline */}
      <div className="space-y-2">
        <Label htmlFor="default-discipline">Default Academic Discipline</Label>
        <Select
          value={settings.defaultDiscipline}
          onValueChange={(value: string) => onUpdate({ defaultDiscipline: value })}
        >
          <SelectTrigger id="default-discipline">
            <SelectValue placeholder="Select a discipline" />
          </SelectTrigger>
          <SelectContent>
            {DISCIPLINES.map((discipline) => (
              <SelectItem key={discipline.value} value={discipline.value}>
                {discipline.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          AI writing assistance will be tailored to this discipline
        </p>
      </div>

      {/* Citation Style */}
      <div className="space-y-2">
        <Label htmlFor="citation-style">Default Citation Style</Label>
        <Select
          value={settings.defaultCitationStyle}
          onValueChange={(value: string) => onUpdate({ defaultCitationStyle: value })}
        >
          <SelectTrigger id="citation-style">
            <SelectValue placeholder="Select a citation style" />
          </SelectTrigger>
          <SelectContent>
            {CITATION_STYLES.map((style) => (
              <SelectItem key={style.value} value={style.value}>
                {style.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Citations will be formatted in this style by default
        </p>
      </div>

      {/* Auto-save Interval */}
      <div className="space-y-2">
        <Label htmlFor="autosave-interval">Auto-save Interval (seconds)</Label>
        <Input
          id="autosave-interval"
          type="number"
          min={10}
          max={300}
          value={settings.autoSaveInterval}
          onChange={(e) =>
            onUpdate({
              autoSaveInterval: parseInt(e.target.value, 10) || 30,
            })
          }
        />
        <p className="text-xs text-muted-foreground">
          Documents automatically save after this many seconds of inactivity
          (10-300 seconds)
        </p>
      </div>
    </div>
  );
}
