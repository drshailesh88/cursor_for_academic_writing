// Papers Panel - Compact sidebar version
// Provides quick access to paper library

'use client';

import { useState } from 'react';
import { Library, Upload, MessageSquare, Star, FileText, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePaperLibrary } from './paper-library-context';

interface PapersPanelCompactProps {
  userId: string;
  onInsertToEditor?: (content: string) => void;
}

export function PapersPanelCompact({
  userId,
  onInsertToEditor,
}: PapersPanelCompactProps) {
  const {
    papers,
    selectedPaper,
    isLoading,
    openLibrary,
    openChat,
    selectPaper,
    toggleFavorite,
  } = usePaperLibrary();

  const [searchQuery, setSearchQuery] = useState('');

  const favoritePapers = papers.filter((p) => p.isFavorite);
  const recentPapers = papers.slice(0, 5);

  const filteredPapers = searchQuery
    ? papers.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.authors.some((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : recentPapers;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Library className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold">Paper Library</h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {papers.length} paper{papers.length !== 1 ? 's' : ''}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Upload PDFs and chat with your papers
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search papers..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 space-y-2 border-b border-border">
          <Button
            onClick={openLibrary}
            variant="outline"
            className="w-full justify-start"
            size="sm"
          >
            <Library className="w-4 h-4 mr-2" />
            Open Full Library
          </Button>
          <Button
            onClick={() => openChat(papers.map((p) => p.id))}
            variant="outline"
            className="w-full justify-start"
            size="sm"
            disabled={papers.length === 0}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat with All Papers
          </Button>
        </div>

        {/* Paper List */}
        <div className="p-4 space-y-3">
          {/* Favorites */}
          {favoritePapers.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                Favorites
              </h4>
              {favoritePapers.slice(0, 3).map((paper) => (
                <button
                  key={paper.id}
                  onClick={() => selectPaper(paper.id)}
                  className="w-full text-left p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium line-clamp-2">
                        {paper.title}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {paper.authors[0]?.name}
                        {paper.authors.length > 1 && ` et al.`}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Recent/Searched Papers */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">
              {searchQuery ? 'Search Results' : 'Recent Papers'}
            </h4>
            {filteredPapers.length > 0 ? (
              filteredPapers.map((paper) => (
                <div
                  key={paper.id}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <button
                    onClick={() => selectPaper(paper.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium line-clamp-2">
                          {paper.title}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {paper.authors[0]?.name}
                          {paper.authors.length > 1 && ` et al.`}
                          {paper.year && ` (${paper.year})`}
                        </div>
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 mt-1">
                    <button
                      onClick={() => toggleFavorite(paper.id)}
                      className="p-1 hover:bg-background rounded"
                    >
                      <Star
                        className={`w-3 h-3 ${
                          paper.isFavorite ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => openChat([paper.id])}
                      className="p-1 hover:bg-background rounded"
                    >
                      <MessageSquare className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {searchQuery ? 'No papers found' : 'No papers uploaded yet'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border bg-muted/30">
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Quick tips:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Upload PDFs to build your library</li>
            <li>Chat with papers to ask questions</li>
            <li>Star favorites for quick access</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
