'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { UserSettings } from '@/lib/settings/types';

interface ExportSettingsTabProps {
  settings: UserSettings['export'];
  onUpdate: (updates: Partial<UserSettings['export']>) => void;
}

export function ExportSettingsTab({
  settings,
  onUpdate,
}: ExportSettingsTabProps) {
  return (
    <div className="space-y-6">
      {/* Include Line Numbers */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="line-numbers"
          checked={settings.includeLineNumbers}
          onCheckedChange={(checked: boolean) =>
            onUpdate({ includeLineNumbers: checked })
          }
        />
        <div className="grid gap-1.5 leading-none">
          <Label
            htmlFor="line-numbers"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Include line numbers
          </Label>
          <p className="text-xs text-muted-foreground">
            Add line numbers to exported documents
          </p>
        </div>
      </div>

      {/* Double Spacing */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="double-spacing"
          checked={settings.doubleSpacing}
          onCheckedChange={(checked: boolean) =>
            onUpdate({ doubleSpacing: checked })
          }
        />
        <div className="grid gap-1.5 leading-none">
          <Label
            htmlFor="double-spacing"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Double spacing
          </Label>
          <p className="text-xs text-muted-foreground">
            Use double spacing in exported documents
          </p>
        </div>
      </div>

      {/* Watermark Text */}
      <div className="space-y-2">
        <Label htmlFor="watermark">Watermark Text</Label>
        <Input
          id="watermark"
          type="text"
          placeholder="DRAFT"
          value={settings.watermarkText}
          onChange={(e) => onUpdate({ watermarkText: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Optional watermark text for exported documents (leave empty for none)
        </p>
      </div>
    </div>
  );
}
