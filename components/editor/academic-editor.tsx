'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useCallback, useState, useRef } from 'react';
import { BookOpen, List, ChevronDown, BarChart3, X } from 'lucide-react';
import { CitationDialog, useCitationDialog } from '@/components/citations/citation-dialog';
import type { CitationStyleId } from '@/lib/citations/csl-formatter';
import { useCitations } from '@/lib/hooks/use-citations';
import { useWritingAnalysis } from '@/lib/hooks/use-writing-analysis';
import { AnalysisPanel } from '@/components/writing-analysis/analysis-panel';
import { AIWritingToolbar } from '@/components/ai-writing/ai-writing-toolbar';
import type { Reference } from '@/lib/citations/types';
import type { CitationOptions } from '@/components/citations/citation-dialog';

interface AcademicEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  onSave?: () => void;
  placeholder?: string;
  onEditorReady?: (editor: Editor) => void;
}

export function AcademicEditor({
  content = '',
  onChange,
  onSave,
  placeholder = 'Start writing your academic paper...',
  onEditorReady,
}: AcademicEditorProps) {
  // Citation dialog state
  const { isOpen: citationDialogOpen, open: openCitationDialog, close: closeCitationDialog } = useCitationDialog();

  // Handle Cmd+S / Ctrl+S for manual save
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 's') {
      event.preventDefault();
      onSave?.();
    }
  }, [onSave]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary-600 underline cursor-pointer',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full my-4',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'border border-border',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-border px-4 py-2 min-w-[100px]',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-border px-4 py-2 bg-muted font-semibold',
        },
      }),
      CharacterCount,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[500px] p-8',
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  // Notify parent when editor is ready
  useEffect(() => {
    if (editor) {
      onEditorReady?.(editor);
    }
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Citations hook
  const {
    insertCitation,
    citationCount,
    uniqueReferenceCount,
    insertBibliography,
    citationStyle,
    setCitationStyle,
    availableStyles,
  } = useCitations({ editor });

  // Bibliography dropdown state
  const [showBibDropdown, setShowBibDropdown] = useState(false);
  const bibDropdownRef = useRef<HTMLDivElement>(null);

  // Writing analysis
  const [showAnalysis, setShowAnalysis] = useState(false);
  const {
    analysis,
    isAnalyzing,
    overallScore,
    refreshAnalysis,
  } = useWritingAnalysis({ editor, enabled: showAnalysis });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bibDropdownRef.current && !bibDropdownRef.current.contains(event.target as Node)) {
        setShowBibDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle citation insertion
  const handleCitationInsert = useCallback(
    (reference: Reference, options: CitationOptions, formatted: string) => {
      insertCitation(reference, options, formatted);
      closeCitationDialog();
    },
    [insertCitation, closeCitationDialog]
  );

  if (!editor) {
    return null;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 md:gap-2 p-2 bg-background border-b border-border">
        {/* Undo/Redo */}
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="px-2 py-1 text-sm rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
          title="Undo (Cmd+Z)"
        >
          ↩
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="px-2 py-1 text-sm rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
          title="Redo (Cmd+Shift+Z)"
        >
          ↪
        </button>

        <div className="w-px h-6 bg-border mx-1 hidden md:block" />

        {/* Headings */}
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-3 py-1 text-sm rounded ${
            editor.isActive('heading', { level: 1 })
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          }`}
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-3 py-1 text-sm rounded ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          }`}
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-3 py-1 text-sm rounded ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          }`}
        >
          H3
        </button>

        <div className="w-px h-6 bg-border mx-2" />

        {/* Text formatting */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1 text-sm rounded font-bold ${
            editor.isActive('bold')
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          }`}
        >
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1 text-sm rounded italic ${
            editor.isActive('italic')
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          }`}
        >
          I
        </button>

        <div className="w-px h-6 bg-border mx-2" />

        {/* Lists */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1 text-sm rounded ${
            editor.isActive('bulletList')
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          }`}
        >
          • List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1 text-sm rounded ${
            editor.isActive('orderedList')
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          }`}
        >
          1. List
        </button>

        <div className="w-px h-6 bg-border mx-2" />

        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-3 py-1 text-sm rounded ${
            editor.isActive('blockquote')
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          }`}
        >
          Quote
        </button>

        <div className="w-px h-6 bg-border mx-2" />

        {/* Citation button */}
        <button
          onClick={() => openCitationDialog()}
          className="px-3 py-1 text-sm rounded hover:bg-muted flex items-center gap-1"
          title="Insert citation (Cmd+Shift+P)"
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Cite</span>
          {citationCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-primary/20 text-primary">
              {citationCount}
            </span>
          )}
        </button>

        {/* Bibliography dropdown */}
        <div className="relative" ref={bibDropdownRef}>
          <button
            onClick={() => setShowBibDropdown(!showBibDropdown)}
            className="px-3 py-1 text-sm rounded hover:bg-muted flex items-center gap-1"
            title="Insert bibliography"
            disabled={uniqueReferenceCount === 0}
          >
            <List className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Bibliography</span>
            <ChevronDown className="h-3 w-3" />
          </button>

          {showBibDropdown && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-background border border-border rounded-lg shadow-lg z-20 py-1">
              <div className="px-3 py-1.5 text-xs text-muted-foreground border-b border-border">
                Citation Style
              </div>
              {availableStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => {
                    setCitationStyle(style.id);
                    setShowBibDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-muted flex items-center justify-between ${
                    citationStyle === style.id ? 'bg-primary/10 text-primary' : ''
                  }`}
                >
                  <span>{style.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {style.category.replace('-', ' ')}
                  </span>
                </button>
              ))}
              <div className="border-t border-border mt-1 pt-1">
                <button
                  onClick={() => {
                    insertBibliography();
                    setShowBibDropdown(false);
                  }}
                  disabled={uniqueReferenceCount === 0}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted text-primary font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Insert Bibliography ({uniqueReferenceCount} refs)
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-border mx-2" />

        {/* Table controls */}
        <button
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          className="px-3 py-1 text-sm rounded hover:bg-muted"
          title="Insert 3x3 table"
        >
          📊 Table
        </button>

        {editor.isActive('table') && (
          <>
            <button
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              className="px-3 py-1 text-sm rounded hover:bg-muted"
              title="Add column"
            >
              + Col
            </button>
            <button
              onClick={() => editor.chain().focus().addRowAfter().run()}
              className="px-3 py-1 text-sm rounded hover:bg-muted"
              title="Add row"
            >
              + Row
            </button>
            <button
              onClick={() => editor.chain().focus().deleteColumn().run()}
              className="px-3 py-1 text-sm rounded hover:bg-muted"
              title="Delete column"
            >
              - Col
            </button>
            <button
              onClick={() => editor.chain().focus().deleteRow().run()}
              className="px-3 py-1 text-sm rounded hover:bg-muted"
              title="Delete row"
            >
              - Row
            </button>
            <button
              onClick={() => editor.chain().focus().deleteTable().run()}
              className="px-3 py-1 text-sm rounded hover:bg-muted text-red-600"
              title="Delete table"
            >
              🗑️ Table
            </button>
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {editor.storage.characterCount?.words() || 0} words
          </span>

          {/* Analysis toggle button */}
          <button
            onClick={() => setShowAnalysis(!showAnalysis)}
            className={`px-3 py-1 text-sm rounded flex items-center gap-1.5 transition-colors ${
              showAnalysis
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
            title="Toggle writing analysis"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Analysis</span>
            {showAnalysis && overallScore > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-full ${
                overallScore >= 80 ? 'bg-green-500/20 text-green-200' :
                overallScore >= 60 ? 'bg-yellow-500/20 text-yellow-200' :
                'bg-red-500/20 text-red-200'
              }`}>
                {overallScore}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main content area with optional analysis panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor with AI toolbar */}
        <div className={`flex-1 flex flex-col overflow-hidden ${showAnalysis ? 'border-r border-border' : ''}`}>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <EditorContent editor={editor} />
          </div>

          {/* AI Writing Toolbar - appears when text is selected */}
          <AIWritingToolbar editor={editor} />
        </div>

        {/* Analysis Panel */}
        {showAnalysis && (
          <div className="w-72 flex-shrink-0 overflow-hidden bg-card border-l border-border">
            <AnalysisPanel
              analysis={analysis}
              isAnalyzing={isAnalyzing}
              onRefresh={refreshAnalysis}
              text={editor.getText()}
            />
          </div>
        )}
      </div>

      {/* Citation Dialog */}
      <CitationDialog
        isOpen={citationDialogOpen}
        onClose={closeCitationDialog}
        onInsert={handleCitationInsert}
      />
    </div>
  );
}
