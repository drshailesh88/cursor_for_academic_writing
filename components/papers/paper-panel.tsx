'use client';

import { useState } from 'react';
import { ArrowLeft, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaperLibrary } from './paper-library';
import { PaperUpload } from './paper-upload';
import { PaperSections } from './paper-sections';
import { PaperChat } from './paper-chat';
import { ExtractionButtons } from './extraction-buttons';
import type { Paper, PaperContent, PaperMetadata } from '@/lib/supabase/schema';

interface PaperPanelProps {
  userId: string;
  papers: PaperMetadata[];
  currentPaper: Paper | null;
  currentContent: PaperContent | null;
  isLoading: boolean;
  error: string | null;
  onOpenPaper: (paperId: string) => void;
  onClosePaper: () => void;
  onDeletePaper: (paperId: string) => void;
  onToggleFavorite?: (paperId: string) => void;
  onUploadPaper: (file: File) => Promise<void>;
  onInsertToEditor?: (content: string) => void;
}

export function PaperPanel({
  userId,
  papers,
  currentPaper,
  currentContent,
  isLoading,
  error,
  onOpenPaper,
  onClosePaper,
  onDeletePaper,
  onToggleFavorite,
  onUploadPaper,
  onInsertToEditor,
}: PaperPanelProps) {
  const [view, setView] = useState<'library' | 'upload' | 'paper'>('library');
  const [activeTab, setActiveTab] = useState<'sections' | 'chat' | 'extract'>('sections');

  const handleUploadClick = () => {
    setView('upload');
  };

  const handleUploadComplete = (paperId: string) => {
    setView('library');
  };

  const handleOpenPaper = (paperId: string) => {
    onOpenPaper(paperId);
    setView('paper');
  };

  const handleClosePaper = () => {
    onClosePaper();
    setView('library');
  };

  const handleCancelUpload = () => {
    setView('library');
  };

  // Library view
  if (view === 'library') {
    return (
      <PaperLibrary
        userId={userId}
      />
    );
  }

  // Upload view
  if (view === 'upload') {
    return (
      <PaperUpload
        userId={userId}
        onUploadComplete={handleUploadComplete}
      />
    );
  }

  // Paper view - Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Loading paper...</p>
      </div>
    );
  }

  // Paper view - Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error Loading Paper</h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button onClick={handleClosePaper}>Back to Library</Button>
      </div>
    );
  }

  // Paper view - No paper selected
  if (!currentPaper) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <FileText className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">No paper selected</p>
        <Button onClick={handleClosePaper} className="mt-4">
          Back to Library
        </Button>
      </div>
    );
  }

  // Paper view - Main content
  return (
    <div className="flex flex-col h-full">
      {/* Header with paper metadata */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClosePaper}
            className="flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm leading-tight line-clamp-2 mb-1">
              {currentPaper.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                {currentPaper.authors.length > 0
                  ? currentPaper.authors[0].name +
                    (currentPaper.authors.length > 1 ? ' et al.' : '')
                  : 'Unknown authors'}
              </span>
              {currentPaper.year && (
                <>
                  <span>•</span>
                  <span>{currentPaper.year}</span>
                </>
              )}
            </div>
            {currentPaper.journal && (
              <p className="text-xs text-muted-foreground italic mt-0.5">
                {currentPaper.journal}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b">
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="extract">Extract</TabsTrigger>
        </TabsList>

        <TabsContent value="sections" className="flex-1 mt-0">
          {currentContent && currentContent.sections.length > 0 ? (
            <PaperSections
              sections={currentContent.sections}
              onCopySection={onInsertToEditor}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                {currentPaper.processingStatus === 'ready'
                  ? 'No sections extracted'
                  : 'Processing paper...'}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="chat" className="flex-1 mt-0">
          <PaperChat
            userId={userId}
          />
        </TabsContent>

        <TabsContent value="extract" className="flex-1 mt-0">
          <ExtractionButtons
            paperId={currentPaper.id}
            paperTitle={currentPaper.title}
            onInsertToEditor={onInsertToEditor}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
