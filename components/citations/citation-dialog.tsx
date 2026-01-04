'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, ChevronDown, Book, FileText, GraduationCap, Globe, Beaker } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/firebase/auth';
import { searchReferences, getAllReferences } from '@/lib/citations/library';
import {
  Reference,
  ReferenceType,
  formatAuthorCitation,
} from '@/lib/citations/types';

/**
 * Citation insertion options
 */
export interface CitationOptions {
  suppressAuthor?: boolean;  // Show only year: (2024)
  prefix?: string;           // "see " in "(see Smith, 2024)"
  suffix?: string;           // ", p. 42" in "(Smith, 2024, p. 42)"
  locator?: string;          // Page number, etc.
  locatorType?: 'page' | 'chapter' | 'section' | 'paragraph' | 'figure' | 'table';
}

/**
 * Citation dialog props
 */
interface CitationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (reference: Reference, options: CitationOptions, formatted: string) => void;
  position?: { x: number; y: number };
}

/**
 * Format citation for preview
 */
function formatCitationPreview(ref: Reference, options: CitationOptions = {}): string {
  const author = formatAuthorCitation(ref.authors);
  const year = ref.issued.year;

  let citation = '';

  // Add prefix
  if (options.prefix) {
    citation += options.prefix;
  }

  // Author and year
  if (options.suppressAuthor) {
    citation += `(${year}`;
  } else {
    citation += `(${author}, ${year}`;
  }

  // Add locator
  if (options.locator) {
    const locatorLabel = options.locatorType === 'page' ? 'p.' :
      options.locatorType === 'chapter' ? 'ch.' :
      options.locatorType === 'section' ? 'sec.' :
      options.locatorType === 'figure' ? 'fig.' :
      options.locatorType === 'table' ? 'table' :
      options.locatorType === 'paragraph' ? 'para.' : '';
    citation += `, ${locatorLabel} ${options.locator}`;
  }

  // Add suffix
  if (options.suffix) {
    citation += options.suffix;
  }

  citation += ')';

  return citation;
}

/**
 * Get icon for reference type
 */
function getReferenceIcon(type: ReferenceType) {
  switch (type) {
    case 'article-journal':
    case 'article-magazine':
    case 'article-newspaper':
      return FileText;
    case 'book':
    case 'chapter':
      return Book;
    case 'thesis':
      return GraduationCap;
    case 'webpage':
    case 'post-weblog':
      return Globe;
    default:
      return Beaker;
  }
}

/**
 * Citation Dialog Component
 *
 * Triggered by Cmd+Shift+P to insert citations from library.
 */
export function CitationDialog({
  isOpen,
  onClose,
  onInsert,
  position,
}: CitationDialogProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedRef, setSelectedRef] = useState<Reference | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<CitationOptions>({});

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load all references on open
  useEffect(() => {
    if (isOpen && user) {
      setLoading(true);
      getAllReferences(user.uid, 'added', 'desc')
        .then(refs => {
          setResults(refs.slice(0, 50)); // Show recent 50
          setLoading(false);
        })
        .catch(() => setLoading(false));

      // Focus input
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, user]);

  // Search on query change
  useEffect(() => {
    if (!user || !query.trim()) return;

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const searchResults = await searchReferences(user.uid, {
          query: query.trim(),
          limit: 20,
        });
        setResults(searchResults);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search error:', error);
      }
      setLoading(false);
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [query, user]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (showOptions) {
        setShowOptions(false);
        setSelectedRef(null);
      } else {
        onClose();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showOptions && selectedRef) {
        // Insert with options
        const formatted = formatCitationPreview(selectedRef, options);
        onInsert(selectedRef, options, formatted);
        handleClose();
      } else if (results[selectedIndex]) {
        // Select reference
        setSelectedRef(results[selectedIndex]);
        setShowOptions(true);
      }
    } else if (e.key === 'Tab' && results[selectedIndex]) {
      e.preventDefault();
      // Quick insert without options
      const ref = results[selectedIndex];
      const formatted = formatCitationPreview(ref);
      onInsert(ref, {}, formatted);
      handleClose();
    }
  }, [results, selectedIndex, showOptions, selectedRef, options, onInsert, onClose]);

  // Scroll selected into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.children[selectedIndex] as HTMLElement;
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleClose = () => {
    setQuery('');
    setResults([]);
    setSelectedIndex(0);
    setSelectedRef(null);
    setShowOptions(false);
    setOptions({});
    onClose();
  };

  const handleSelectReference = (ref: Reference) => {
    setSelectedRef(ref);
    setShowOptions(true);
  };

  const handleInsert = () => {
    if (selectedRef) {
      const formatted = formatCitationPreview(selectedRef, options);
      onInsert(selectedRef, options, formatted);
      handleClose();
    }
  };

  const handleQuickInsert = (ref: Reference) => {
    const formatted = formatCitationPreview(ref);
    onInsert(ref, {}, formatted);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div
        className="relative bg-card rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden border border-border"
        style={position ? { position: 'absolute', left: position.x, top: position.y } : undefined}
      >
        {/* Search Header */}
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search your library by author, title, or year..."
              className="w-full pl-10 pr-10 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              autoComplete="off"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>
              {loading ? 'Searching...' : `${results.length} references`}
            </span>
            <span className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">↑↓</kbd>
              <span>navigate</span>
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">Tab</kbd>
              <span>quick insert</span>
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">Enter</kbd>
              <span>options</span>
            </span>
          </div>
        </div>

        {/* Results or Options */}
        {showOptions && selectedRef ? (
          /* Citation Options Panel */
          <div className="p-4 space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{selectedRef.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatAuthorCitation(selectedRef.authors)}, {selectedRef.issued.year}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowOptions(false);
                  setSelectedRef(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Preview */}
            <div className="p-3 rounded-lg bg-primary/10 text-center">
              <span className="text-sm font-medium">
                {formatCitationPreview(selectedRef, options)}
              </span>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {/* Suppress Author */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.suppressAuthor || false}
                  onChange={(e) => setOptions({ ...options, suppressAuthor: e.target.checked })}
                  className="rounded border-input"
                />
                <span className="text-sm">Suppress author (narrative citation)</span>
              </label>

              {/* Page/Locator */}
              <div className="flex items-center gap-2">
                <select
                  value={options.locatorType || 'page'}
                  onChange={(e) => setOptions({ ...options, locatorType: e.target.value as any })}
                  className="px-2 py-1.5 rounded border border-input bg-background text-sm"
                >
                  <option value="page">Page</option>
                  <option value="chapter">Chapter</option>
                  <option value="section">Section</option>
                  <option value="paragraph">Paragraph</option>
                  <option value="figure">Figure</option>
                  <option value="table">Table</option>
                </select>
                <input
                  type="text"
                  value={options.locator || ''}
                  onChange={(e) => setOptions({ ...options, locator: e.target.value })}
                  placeholder="e.g., 42-45"
                  className="flex-1 px-2 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>

              {/* Prefix/Suffix */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Prefix</label>
                  <input
                    type="text"
                    value={options.prefix || ''}
                    onChange={(e) => setOptions({ ...options, prefix: e.target.value })}
                    placeholder="see "
                    className="w-full mt-1 px-2 py-1.5 rounded border border-input bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Suffix</label>
                  <input
                    type="text"
                    value={options.suffix || ''}
                    onChange={(e) => setOptions({ ...options, suffix: e.target.value })}
                    placeholder=", emphasis added"
                    className="w-full mt-1 px-2 py-1.5 rounded border border-input bg-background text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Insert Button */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowOptions(false);
                  setSelectedRef(null);
                }}
              >
                Back
              </Button>
              <Button size="sm" onClick={handleInsert}>
                Insert Citation
              </Button>
            </div>
          </div>
        ) : (
          /* Results List */
          <div
            ref={listRef}
            className="max-h-80 overflow-y-auto"
          >
            {results.length === 0 && !loading ? (
              <div className="p-8 text-center text-muted-foreground">
                <Book className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {query ? 'No references found' : 'Your library is empty'}
                </p>
                <p className="text-xs mt-1">
                  {query ? 'Try a different search term' : 'Import references to get started'}
                </p>
              </div>
            ) : (
              results.map((ref, index) => {
                const Icon = getReferenceIcon(ref.type);
                return (
                  <div
                    key={ref.id}
                    onClick={() => handleSelectReference(ref)}
                    onDoubleClick={() => handleQuickInsert(ref)}
                    className={`px-4 py-3 cursor-pointer border-b border-border/50 last:border-0 transition-colors ${
                      index === selectedIndex
                        ? 'bg-primary/10'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ref.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatAuthorCitation(ref.authors)}, {ref.issued.year}
                          {ref.venue?.name && ` • ${ref.venue.name}`}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-xs text-muted-foreground">
                        {formatCitationPreview(ref)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Hook to manage citation dialog
 */
export function useCitationDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | undefined>();

  const open = useCallback((pos?: { x: number; y: number }) => {
    setPosition(pos);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setPosition(undefined);
  }, []);

  // Global keyboard shortcut: Cmd+Shift+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { isOpen, open, close, position };
}

export default CitationDialog;
