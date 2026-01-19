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
import { Input } from '@/components/ui/input';
import { AI_MODELS, TESTING_MODELS } from '@/lib/settings/types';
import { UserSettings } from '@/lib/settings/types';

interface AISettingsTabProps {
  settings: UserSettings['ai'];
  onUpdate: (updates: Partial<UserSettings['ai']>) => void;
}

export function AISettingsTab({ settings, onUpdate }: AISettingsTabProps) {
  return (
    <div className="space-y-6">
      {/* Default Model */}
      <div className="space-y-2">
        <Label htmlFor="default-model">Default AI Model</Label>
        <Select
          value={settings.defaultModel}
          onValueChange={(value: string) => onUpdate({ defaultModel: value })}
        >
          <SelectTrigger id="default-model">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {AI_MODELS.map((model) => (
              <SelectItem key={model.value} value={model.value}>
                {model.label}
              </SelectItem>
            ))}
            {TESTING_MODELS.map((model) => (
              <SelectItem key={model.value} value={model.value}>
                🧪 {model.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Choose the default AI model for writing assistance
        </p>
      </div>

      {/* Temperature */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="temperature">Temperature</Label>
          <span className="text-sm text-muted-foreground">
            {settings.temperature.toFixed(1)}
          </span>
        </div>
        <Slider
          id="temperature"
          min={0}
          max={1}
          step={0.1}
          value={[settings.temperature]}
          onValueChange={(value: number[]) => onUpdate({ temperature: value[0] })}
        />
        <p className="text-xs text-muted-foreground">
          Lower values (0.0-0.3) for precise, factual writing. Higher values
          (0.7-1.0) for creative, varied prose.
        </p>
      </div>

      {/* Personal API Keys */}
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Personal API Keys</h4>
          <p className="text-xs text-muted-foreground mb-4">
            Optional: Use your own API keys. Keys are stored securely and never
            shared.
          </p>
        </div>

        {/* OpenAI Key */}
        <div className="space-y-2">
          <Label htmlFor="openai-key">OpenAI API Key</Label>
          <Input
            id="openai-key"
            type="password"
            placeholder="sk-..."
            value={settings.personalApiKeys.openai || ''}
            onChange={(e) =>
              onUpdate({
                personalApiKeys: {
                  ...settings.personalApiKeys,
                  openai: e.target.value || undefined,
                },
              })
            }
          />
        </div>

        {/* Anthropic Key */}
        <div className="space-y-2">
          <Label htmlFor="anthropic-key">Anthropic API Key</Label>
          <Input
            id="anthropic-key"
            type="password"
            placeholder="sk-ant-..."
            value={settings.personalApiKeys.anthropic || ''}
            onChange={(e) =>
              onUpdate({
                personalApiKeys: {
                  ...settings.personalApiKeys,
                  anthropic: e.target.value || undefined,
                },
              })
            }
          />
        </div>

        {/* Google Key */}
        <div className="space-y-2">
          <Label htmlFor="google-key">Google API Key</Label>
          <Input
            id="google-key"
            type="password"
            placeholder="AIza..."
            value={settings.personalApiKeys.google || ''}
            onChange={(e) =>
              onUpdate({
                personalApiKeys: {
                  ...settings.personalApiKeys,
                  google: e.target.value || undefined,
                },
              })
            }
          />
        </div>

        {/* Z.AI GLM-4 Key (Testing) */}
        <div className="space-y-2">
          <Label htmlFor="zhipu-key">Z.AI API Key (GLM-4 Testing)</Label>
          <Input
            id="zhipu-key"
            type="password"
            placeholder="Enter your Z.AI API key..."
            value={settings.personalApiKeys.zhipu || ''}
            onChange={(e) =>
              onUpdate({
                personalApiKeys: {
                  ...settings.personalApiKeys,
                  zhipu: e.target.value || undefined,
                },
              })
            }
          />
          <p className="text-xs text-muted-foreground">
            Get your API key from <a href="https://open.bigmodel.cn/" target="_blank" rel="noopener noreferrer" className="text-primary underline">open.bigmodel.cn</a>
          </p>
        </div>
      </div>
    </div>
  );
}
