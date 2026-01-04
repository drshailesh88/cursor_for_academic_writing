'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  GenerationConfig,
  GenerationOptions,
  PresentationFormat,
  ThemeId,
} from '@/lib/presentations/types';
import { Monitor, BookOpen, Rocket, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface GenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId?: string;
  documentTitle?: string;
  documentContent?: string;
  onGenerate: (config: GenerationConfig) => Promise<void>;
}

export function GenerationDialog({
  open,
  onOpenChange,
  documentId,
  documentTitle,
  documentContent,
  onGenerate,
}: GenerationDialogProps) {
  const [source, setSource] = useState<'document' | 'text' | 'topic'>(
    documentId ? 'document' : 'topic'
  );
  const [customTopic, setCustomTopic] = useState('');
  const [format, setFormat] = useState<PresentationFormat>('conference');
  const [theme, setTheme] = useState<ThemeId>('academic');
  const [options, setOptions] = useState<GenerationOptions>({
    includeMethodology: true,
    emphasizeFindings: true,
    includeAllCitations: false,
    generateVisualizations: true,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const formatOptions = [
    {
      value: 'conference' as const,
      icon: Monitor,
      label: 'Conference',
      slides: '10-15 slides',
      duration: '~15 minutes',
      description: 'Standard conference presentation format',
    },
    {
      value: 'lecture' as const,
      icon: BookOpen,
      label: 'Lecture',
      slides: '30-45 slides',
      duration: '~45 minutes',
      description: 'Comprehensive lecture format',
    },
    {
      value: 'pitch' as const,
      icon: Rocket,
      label: 'Pitch',
      slides: '5-10 slides',
      duration: '~5 minutes',
      description: 'Quick pitch or overview',
    },
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const config: GenerationConfig = {
        source,
        sourceId: source === 'document' ? documentId : undefined,
        sourceText: source === 'topic' ? customTopic : documentContent,
        format,
        theme,
        options,
      };
      await onGenerate(config);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to generate presentation:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const isValid = () => {
    if (source === 'document' && !documentId) return false;
    if (source === 'topic' && !customTopic.trim()) return false;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Presentation</DialogTitle>
          <DialogDescription>
            Configure your presentation settings and let AI create your slides.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Source Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Source</Label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setSource('document')}
                disabled={!documentId}
                className={cn(
                  'flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all',
                  source === 'document'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50',
                  !documentId && 'opacity-50 cursor-not-allowed'
                )}
              >
                <span className="text-sm font-medium">Current Document</span>
                {documentTitle && (
                  <span className="text-xs text-muted-foreground mt-1 text-center line-clamp-1">
                    {documentTitle}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSource('text')}
                className={cn(
                  'flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all',
                  source === 'text'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <span className="text-sm font-medium">Selected Text</span>
                <span className="text-xs text-muted-foreground mt-1">
                  From editor
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSource('topic')}
                className={cn(
                  'flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all',
                  source === 'topic'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <span className="text-sm font-medium">Custom Topic</span>
                <span className="text-xs text-muted-foreground mt-1">
                  Enter topic
                </span>
              </button>
            </div>

            {source === 'topic' && (
              <div className="mt-3">
                <Input
                  placeholder="Enter your presentation topic..."
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Format</Label>
            <div className="grid grid-cols-3 gap-4">
              {formatOptions.map((formatOption) => {
                const Icon = formatOption.icon;
                return (
                  <button
                    key={formatOption.value}
                    type="button"
                    onClick={() => setFormat(formatOption.value)}
                    className={cn(
                      'flex flex-col items-center p-6 rounded-lg border-2 transition-all hover:shadow-md',
                      format === formatOption.value
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <Icon className="h-8 w-8 mb-3 text-primary" />
                    <h3 className="font-semibold mb-1">
                      {formatOption.label}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-1">
                      {formatOption.slides}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatOption.duration}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Options Section */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Options</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="methodology"
                  checked={options.includeMethodology}
                  onCheckedChange={(checked) =>
                    setOptions({
                      ...options,
                      includeMethodology: checked === true,
                    })
                  }
                />
                <label
                  htmlFor="methodology"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Include methodology details
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="findings"
                  checked={options.emphasizeFindings}
                  onCheckedChange={(checked) =>
                    setOptions({
                      ...options,
                      emphasizeFindings: checked === true,
                    })
                  }
                />
                <label
                  htmlFor="findings"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Emphasize key findings
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="citations"
                  checked={options.includeAllCitations}
                  onCheckedChange={(checked) =>
                    setOptions({
                      ...options,
                      includeAllCitations: checked === true,
                    })
                  }
                />
                <label
                  htmlFor="citations"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Include all citations
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="visualizations"
                  checked={options.generateVisualizations}
                  onCheckedChange={(checked) =>
                    setOptions({
                      ...options,
                      generateVisualizations: checked === true,
                    })
                  }
                />
                <label
                  htmlFor="visualizations"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Generate data visualizations
                </label>
              </div>
            </div>
          </div>

          {/* Theme Selection */}
          <div className="space-y-3">
            <Label htmlFor="theme" className="text-base font-semibold">
              Theme
            </Label>
            <Select value={theme} onValueChange={(value) => setTheme(value as ThemeId)}>
              <SelectTrigger id="theme" className="w-full">
                <SelectValue placeholder="Select a theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="tech">Tech</SelectItem>
                <SelectItem value="humanities">Humanities</SelectItem>
                <SelectItem value="nature">Nature</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!isValid() || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Presentation'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
