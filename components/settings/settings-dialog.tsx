'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/lib/hooks/use-settings';
import { AISettingsTab } from './ai-settings-tab';
import { WritingSettingsTab } from './writing-settings-tab';
import { EditorSettingsTab } from './editor-settings-tab';
import { ExportSettingsTab } from './export-settings-tab';
import { Loader2 } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const {
    settings,
    loading,
    saving,
    updateAI,
    updateWriting,
    updateEditor,
    updateExport,
    reset,
  } = useSettings();

  const [activeTab, setActiveTab] = useState('ai');

  const handleReset = async () => {
    if (
      window.confirm(
        'Are you sure you want to reset all settings to defaults? This cannot be undone.'
      )
    ) {
      await reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your academic writing experience
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="ai">AI</TabsTrigger>
                <TabsTrigger value="writing">Writing</TabsTrigger>
                <TabsTrigger value="editor">Editor</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
              </TabsList>

              <TabsContent value="ai" className="space-y-4 py-4">
                <AISettingsTab settings={settings.ai} onUpdate={updateAI} />
              </TabsContent>

              <TabsContent value="writing" className="space-y-4 py-4">
                <WritingSettingsTab
                  settings={settings.writing}
                  onUpdate={updateWriting}
                />
              </TabsContent>

              <TabsContent value="editor" className="space-y-4 py-4">
                <EditorSettingsTab
                  settings={settings.editor}
                  onUpdate={updateEditor}
                />
              </TabsContent>

              <TabsContent value="export" className="space-y-4 py-4">
                <ExportSettingsTab
                  settings={settings.export}
                  onUpdate={updateExport}
                />
              </TabsContent>
            </Tabs>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={handleReset}>
                Reset to Defaults
              </Button>

              <div className="flex items-center gap-2">
                {saving && (
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </span>
                )}
                <Button onClick={() => onOpenChange(false)}>Close</Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
