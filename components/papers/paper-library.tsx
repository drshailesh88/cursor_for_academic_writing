// Paper Library Panel
// Main interface for browsing and managing papers

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  FileText,
  Star,
  Upload,
  Filter,
  SortDesc,
  Grid,
  List,
  RefreshCw,
  Loader2,
  Library,
} from 'lucide-react';
import { usePaperLibrary } from './paper-library-context';
import { PaperUpload } from './paper-upload';
import { PaperCard, PaperGrid } from './paper-card';

interface PaperLibraryProps {
  userId: string;
}

export function PaperLibrary({ userId }: PaperLibraryProps) {
  const {
    papers,
    selectedPaper,
    isLoading,
    error,
    isLibraryOpen,
    closeLibrary,
    refreshPapers,
    selectPaper,
    deletePaper,
    toggleFavorite,
    openChat,
  } = usePaperLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites' | 'processing'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'year'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUpload, setShowUpload] = useState(false);

  // Filter and sort papers
  const filteredPapers = papers
    .filter((paper) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = paper.title.toLowerCase().includes(query);
        const matchesAuthor = paper.authors.some((a) =>
          a.name.toLowerCase().includes(query)
        );
        if (!matchesTitle && !matchesAuthor) return false;
      }

      // Category filter
      if (filter === 'favorites' && !paper.isFavorite) return false;
      if (filter === 'processing' && paper.processingStatus === 'ready') return false;

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'year':
          return (b.year || 0) - (a.year || 0);
        case 'date':
        default:
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      }
    });

  const handleUploadComplete = () => {
    refreshPapers();
  };

  if (!isLibraryOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute inset-4 bg-background rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Library className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Paper Library</h2>
                <p className="text-sm text-muted-foreground">
                  {papers.length} paper{papers.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUpload(!showUpload)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors
                  ${
                    showUpload
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-primary/10 text-primary hover:bg-primary/20'
                  }
                `}
              >
                <Upload className="w-4 h-4" />
                Upload
              </button>

              <button
                onClick={refreshPapers}
                disabled={isLoading}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={closeLibrary}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Upload Section */}
          <AnimatePresence>
            {showUpload && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-b border-border bg-muted/30"
              >
                <div className="p-6">
                  <PaperUpload
                    userId={userId}
                    onUploadComplete={handleUploadComplete}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toolbar */}
          <div className="flex items-center gap-4 px-6 py-3 border-b border-border bg-muted/30">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search papers..."
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filter === 'all'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('favorites')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filter === 'favorites'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                Favorites
              </button>
              <button
                onClick={() => setFilter('processing')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filter === 'processing'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Loader2 className="w-3.5 h-3.5" />
                Processing
              </button>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="date">Recent</option>
              <option value="title">Title</option>
              <option value="year">Year</option>
            </select>

            {/* View Mode */}
            <div className="flex items-center border border-border rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-l-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-r-lg transition-colors ${
                  viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {isLoading && papers.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredPapers.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-lg mb-2">No papers found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Upload PDFs to start building your library'}
                </p>
              </div>
            ) : (
              <PaperGrid
                papers={filteredPapers}
                onSelect={(paper) => selectPaper(paper.id)}
                onDelete={deletePaper}
                onFavorite={toggleFavorite}
                onChat={(paper) => openChat([paper.id])}
                compact={viewMode === 'list'}
                selectedId={selectedPaper?.id}
              />
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-border bg-muted/30 text-xs text-muted-foreground">
            <span className="font-medium">Tips:</span>{' '}
            Drag & drop PDFs to upload • Click a paper to view details • Use chat to ask questions across papers
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
