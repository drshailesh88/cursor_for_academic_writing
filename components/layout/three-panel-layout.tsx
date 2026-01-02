'use client';

import { useState, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Save, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatInterface } from '@/components/chat/chat-interface';
import { AcademicEditor } from '@/components/editor/academic-editor';
import { DocumentList } from '@/components/history/document-list';
import { ExportButtons } from '@/components/export/export-buttons';
import { AuthButton } from '@/components/auth/auth-button';
import { useDocument } from '@/lib/hooks/use-document';
import { useAuth } from '@/lib/firebase/auth';
import { formatDistanceToNow } from 'date-fns';

export function ThreePanelLayout() {
  const { user } = useAuth();
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | undefined>();

  const {
    document,
    content,
    setContent,
    loading,
    saving,
    lastSaved,
    createNew,
    updateTitle,
  } = useDocument({
    documentId: currentDocumentId,
    autoSaveInterval: 30000, // 30 seconds
  });

  // Create initial document when user signs in
  useEffect(() => {
    async function createInitialDoc() {
      if (user && !currentDocumentId) {
        try {
          const newDocId = await createNew('Untitled Document');
          setCurrentDocumentId(newDocId);
        } catch (error) {
          console.error('Failed to create initial document:', error);
        }
      }
    }

    createInitialDoc();
  }, [user, currentDocumentId, createNew]);

  const handleDocumentSelect = (documentId: string) => {
    setCurrentDocumentId(documentId);
  };

  const handleCreateNew = async () => {
    try {
      const newDocId = await createNew('Untitled Document');
      setCurrentDocumentId(newDocId);
    } catch (error) {
      console.error('Failed to create new document:', error);
      alert('Failed to create new document');
    }
  };

  return (
    <div className="h-screen w-screen bg-background flex flex-col">
      {/* Top bar with auth and save status */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-card">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Academic Writing</h1>
          {document && (
            <input
              type="text"
              value={document.title}
              onChange={(e) => updateTitle(e.target.value)}
              className="px-2 py-1 text-sm bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded"
              placeholder="Untitled Document"
            />
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Save status */}
          {user && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {saving ? (
                <>
                  <Save className="w-4 h-4 animate-pulse" />
                  <span>Saving...</span>
                </>
              ) : lastSaved ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>
                    Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}
                  </span>
                </>
              ) : null}
            </div>
          )}

            <div className="flex items-center gap-2">
              {user && (
                <ExportButtons title={document?.title} content={content} />
              )}
              <AuthButton />
            </div>
          </div>
        </div>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" autoSaveId="academic-writer-layout">
          {/* LEFT PANEL: History/Documents */}
          <Panel
            defaultSize={20}
            minSize={15}
            maxSize={35}
            collapsible={true}
            onCollapse={() => setIsHistoryCollapsed(true)}
            onExpand={() => setIsHistoryCollapsed(false)}
          >
            <div className="h-full relative bg-card border-r border-border">
              <div className="p-4 border-b border-border">
                <h2 className="text-lg font-semibold text-primary-700 dark:text-primary-300">
                  Documents
                </h2>
              </div>

              {user ? (
                <DocumentList
                  currentDocumentId={currentDocumentId}
                  onDocumentSelect={handleDocumentSelect}
                  onCreateNew={handleCreateNew}
                />
              ) : (
                <div className="p-4">
                  <p className="text-sm text-muted-foreground">
                    Sign in to see your documents
                  </p>
                </div>
              )}

              {/* Collapse button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
              >
                {isHistoryCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </Button>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-border hover:bg-primary-300 transition-colors" />

          {/* CENTER PANEL: Editor */}
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full bg-background flex flex-col">
              <div className="flex-1 overflow-hidden">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                  </div>
                ) : (
                  <AcademicEditor
                    content={content}
                    onChange={setContent}
                    placeholder="Start writing your academic paper... Use the AI chat on the right to search PubMed or generate content."
                  />
                )}
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-border hover:bg-primary-300 transition-colors" />

          {/* RIGHT PANEL: AI Chat */}
          <Panel
            defaultSize={30}
            minSize={20}
            maxSize={40}
            collapsible={true}
            onCollapse={() => setIsChatCollapsed(true)}
            onExpand={() => setIsChatCollapsed(false)}
          >
            <div className="h-full relative bg-card border-l border-border">
              <ChatInterface />

              {/* Collapse button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 left-2 z-10"
                onClick={() => setIsChatCollapsed(!isChatCollapsed)}
              >
                {isChatCollapsed ? (
                  <PanelRightOpen className="h-4 w-4" />
                ) : (
                  <PanelRightClose className="h-4 w-4" />
                )}
              </Button>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
