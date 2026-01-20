// Integrated Papers Panel
// Complete papers interface combining library, upload, viewer, chat, and extraction

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  Library,
  MessageSquare,
  FileText,
  ArrowLeft,
  Loader2,
  Star,
  Trash2,
  Search,
  Grid,
  List,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { usePapersContext } from '@/lib/contexts/papers-context';
import { PaperUpload } from './paper-upload';
import { PaperSections } from './paper-sections';
import { ExtractionButtons } from './extraction-buttons';
import { DeletePaperDialog } from './delete-paper-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Citation } from '@/lib/supabase/schema';

interface IntegratedPapersPanelProps {
  userId: string;
  onInsertToDocument: (content: string, citation?: Citation) => void;
}

type View = 'library' | 'paper' | 'chat';

export function IntegratedPapersPanel({
  userId,
  onInsertToDocument,
}: IntegratedPapersPanelProps) {
  const {
    papers,
    selectedPaper,
    selectedPaperContent,
    isLoading,
    error,
    uploadPaper,
    isUploading,
    uploadProgress,
    refreshLibrary,
    selectPaper,
    deletePaper,
    chatMessages,
    isChatting,
    activeChatPaperIds,
    sendChatMessage,
    clearChat,
    setChatPapers,
    extractContent,
    isExtracting,
    extractionResults,
  } = usePapersContext();

  const [currentView, setCurrentView] = useState<View>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUpload, setShowUpload] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Filter papers
  const filteredPapers = papers.filter((paper) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const matchesTitle = paper.title.toLowerCase().includes(query);
    const matchesAuthor = paper.authors.some((a) =>
      a.name.toLowerCase().includes(query)
    );
    return matchesTitle || matchesAuthor;
  });

  // Handle paper selection
  const handleSelectPaper = async (paperId: string) => {
    await selectPaper(paperId);
    setCurrentView('paper');
  };

  // Handle upload complete
  const handleUploadComplete = () => {
    refreshLibrary();
    setShowUpload(false);
  };

  // Handle send chat message
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatting) return;

    try {
      await sendChatMessage(chatInput.trim());
      setChatInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle extraction and insert
  const handleExtraction = async (
    type: 'findings' | 'methods' | 'limitations' | 'citation'
  ) => {
    if (!selectedPaper) return;

    try {
      const content = await extractContent(type, selectedPaper.id);

      // If citation, also pass citation object
      if (type === 'citation' && selectedPaper) {
        const citation: Citation = {
          id: selectedPaper.id,
          text: content,
          authors: selectedPaper.authors.map((a) => a.name),
          title: selectedPaper.title,
          journal: selectedPaper.journal,
          year: selectedPaper.year || new Date().getFullYear(),
          doi: selectedPaper.doi,
        };
        onInsertToDocument(content, citation);
      } else {
        onInsertToDocument(content);
      }
    } catch (error) {
      console.error('Extraction error:', error);
    }
  };

  // Initialize chat when opening chat view
  const handleOpenChat = (paperIds: string[]) => {
    setChatPapers(paperIds);
    setCurrentView('chat');
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Render library view
  const renderLibrary = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2">
            <Library className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <h2 className="font-semibold text-base sm:text-lg">Paper Library</h2>
          </div>
          <Button
            onClick={() => setShowUpload(!showUpload)}
            size="sm"
            variant={showUpload ? 'default' : 'outline'}
            className="text-xs sm:text-sm"
          >
            <Upload className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">Upload</span>
          </Button>
        </div>

        {/* Upload Section */}
        <AnimatePresence>
          {showUpload && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <PaperUpload
                userId={userId}
                onUploadComplete={handleUploadComplete}
                className="mb-4"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search papers..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Papers List */}
      <ScrollArea className="flex-1">
        <div className={`p-3 sm:p-4 ${viewMode === 'grid' ? 'grid grid-cols-1 gap-2 sm:gap-3' : 'space-y-2'}`}>
          {isLoading && papers.length === 0 ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary" />
            </div>
          ) : filteredPapers.length === 0 ? (
            <div className="text-center py-8 sm:py-12 px-4">
              <FileText className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
              <h3 className="font-medium text-sm sm:text-base mb-2">No papers found</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {searchQuery ? 'Try a different search' : 'Upload PDFs to get started'}
              </p>
            </div>
          ) : (
            filteredPapers.map((paper) => (
              <div
                key={paper.id}
                className="p-3 sm:p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors cursor-pointer active:scale-[0.98]"
                onClick={() => handleSelectPaper(paper.id)}
              >
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-xs sm:text-sm line-clamp-2 mb-1">
                      {paper.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-2">
                      {paper.authors.slice(0, 2).map((a) => a.name).join(', ')}
                      {paper.authors.length > 2 && ' et al.'}
                      {paper.year && ` (${paper.year})`}
                    </p>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs flex-wrap">
                      <span
                        className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs ${
                          paper.processingStatus === 'ready'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}
                      >
                        {paper.processingStatus === 'ready' ? 'Ready' : 'Processing'}
                      </span>
                      <span className="text-muted-foreground">
                        {formatFileSize(paper.fileSize)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="p-4 border-t border-border">
        <Button
          onClick={() => {
            const readyPapers = papers.filter((p) => p.processingStatus === 'ready');
            if (readyPapers.length > 0) {
              handleOpenChat(readyPapers.map((p) => p.id));
            }
          }}
          className="w-full"
          disabled={papers.filter((p) => p.processingStatus === 'ready').length === 0}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Chat with Papers
        </Button>
      </div>
    </div>
  );

  // Render paper detail view
  const renderPaperView = () => {
    if (!selectedPaper || !selectedPaperContent) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary" />
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView('library')}
              className="p-1 sm:p-2"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <h2 className="font-semibold text-xs sm:text-sm flex-1 line-clamp-1">
              {selectedPaper.title}
            </h2>
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground pl-8 sm:pl-10">
            {selectedPaper.authors.slice(0, 2).map((a) => a.name).join(', ')}
            {selectedPaper.authors.length > 2 && ' et al.'}
            {selectedPaper.year && ` • ${selectedPaper.year}`}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="sections" className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-2">
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="extract">Extract</TabsTrigger>
          </TabsList>

          <TabsContent value="sections" className="flex-1 mt-0">
            <PaperSections
              sections={selectedPaperContent.sections}
              onCopySection={onInsertToDocument}
            />
          </TabsContent>

          <TabsContent value="extract" className="flex-1 mt-0">
            <ExtractionButtons
              paperId={selectedPaper.id}
              paperTitle={selectedPaper.title}
              onInsertToEditor={onInsertToDocument}
            />
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border flex gap-2">
          <Button
            onClick={() => handleOpenChat([selectedPaper.id])}
            variant="outline"
            className="flex-1"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat
          </Button>
          <Button
            onClick={() => setShowDeleteDialog(true)}
            variant="outline"
            size="icon"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>
    );
  };

  // Render chat view
  const renderChatView = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView('library')}
            className="p-1 sm:p-2"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
          <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          <h2 className="font-semibold text-xs sm:text-sm">Paper Chat</h2>
        </div>
        <div className="text-[10px] sm:text-xs text-muted-foreground pl-8 sm:pl-10">
          {activeChatPaperIds.length} paper{activeChatPaperIds.length !== 1 ? 's' : ''} selected
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3 sm:p-4">
        {chatMessages.length === 0 ? (
          <div className="text-center py-8 sm:py-12 px-4">
            <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-primary" />
            <h3 className="font-medium text-sm sm:text-base mb-2">Ask about your papers</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
              I'll search through your papers and cite my sources
            </p>
            <div className="space-y-2 max-w-sm mx-auto">
              {[
                'What are the main findings?',
                'Compare the methodologies',
                'What limitations are discussed?',
              ].map((q) => (
                <Button
                  key={q}
                  variant="outline"
                  size="sm"
                  onClick={() => setChatInput(q)}
                  className="w-full text-left justify-start text-xs sm:text-sm"
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-xs sm:text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/30 text-[10px] sm:text-xs">
                      <p className="font-medium mb-1">Sources:</p>
                      {message.citations.map((citation, i) => (
                        <p key={i} className="text-muted-foreground">
                          [{i + 1}] {citation.paperTitle}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isChatting && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-3 sm:px-4 py-2 sm:py-3">
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask a question..."
            disabled={isChatting || activeChatPaperIds.length === 0}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!chatInput.trim() || isChatting || activeChatPaperIds.length === 0}
          >
            <Sparkles className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-background">
      {error && (
        <div className="m-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {currentView === 'library' && renderLibrary()}
      {currentView === 'paper' && renderPaperView()}
      {currentView === 'chat' && renderChatView()}

      {/* Delete Confirmation Dialog */}
      <DeletePaperDialog
        paper={selectedPaper}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirmDelete={async (paperId) => {
          await deletePaper(paperId);
          setCurrentView('library');
        }}
      />
    </div>
  );
}
