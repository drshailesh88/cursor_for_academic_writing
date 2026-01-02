'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/firebase/auth';
import { getUserDocuments } from '@/lib/firebase/documents';
import { DocumentMetadata } from '@/lib/firebase/schema';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface DocumentListProps {
  currentDocumentId?: string;
  onDocumentSelect: (documentId: string) => void;
  onCreateNew: () => void;
}

export function DocumentList({
  currentDocumentId,
  onDocumentSelect,
  onCreateNew,
}: DocumentListProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDocuments() {
      if (!user) {
        setDocuments([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const docs = await getUserDocuments(user.uid);
        setDocuments(docs);
      } catch (error) {
        console.error('Failed to load documents:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDocuments();
  }, [user]);

  if (loading) {
    return (
      <div className="p-4 space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 bg-muted animate-pulse rounded"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <Button
          onClick={onCreateNew}
          className="w-full"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Document
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {documents.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            <p>No documents yet.</p>
            <p className="mt-1">Click "New Document" to start writing.</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => onDocumentSelect(doc.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  currentDocumentId === doc.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">
                      {doc.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs opacity-75 mt-1">
                      <span>{doc.wordCount} words</span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(doc.updatedAt, {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
