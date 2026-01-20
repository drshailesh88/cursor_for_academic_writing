/**
 * Citation Management Hook
 *
 * Provides citation functionality for the editor including:
 * - Insert citations at cursor
 * - Track citations in document
 * - Generate bibliography
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { useAuth } from '@/lib/supabase/auth';
import {
  getAllReferences,
  getReference,
  addReference,
} from '@/lib/citations/library';
import {
  Reference,
  DocumentCitation,
  formatAuthorCitation,
  searchResultToReference,
} from '@/lib/citations/types';
import {
  formatCitation,
  formatBibliography,
  CitationStyleId,
  CITATION_STYLES,
} from '@/lib/citations/csl-formatter';
import type { CitationOptions } from '@/components/citations/citation-dialog';

interface UseCitationsOptions {
  editor: Editor | null;
  documentId?: string;
  defaultStyle?: CitationStyleId;
}

interface CitationInsert {
  referenceId: string;
  options: CitationOptions;
  formattedText: string;
}

export function useCitations({ editor, documentId, defaultStyle = 'apa-7' }: UseCitationsOptions) {
  const { user } = useAuth();
  const [citations, setCitations] = useState<DocumentCitation[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(false);
  const [citationStyle, setCitationStyle] = useState<CitationStyleId>(defaultStyle);

  // Load user's references
  useEffect(() => {
    if (user) {
      setLoading(true);
      getAllReferences(user.uid)
        .then(refs => {
          setReferences(refs);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [user]);

  /**
   * Insert a citation at the cursor position
   */
  const insertCitation = useCallback(
    (reference: Reference, options: CitationOptions, formattedText: string) => {
      if (!editor) return;

      // Create citation mark/node
      // For now, insert as styled text with data attributes
      const citationHtml = `<span class="citation" data-reference-id="${reference.id}" data-suppress-author="${options.suppressAuthor || false}" data-locator="${options.locator || ''}" data-locator-type="${options.locatorType || 'page'}" data-prefix="${options.prefix || ''}" data-suffix="${options.suffix || ''}">${formattedText}</span>`;

      editor.chain().focus().insertContent(citationHtml).run();

      // Track citation in document
      const newCitation: DocumentCitation = {
        id: `cit_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        referenceId: reference.id,
        position: editor.state.selection.from,
        suppressAuthor: options.suppressAuthor,
        prefix: options.prefix,
        suffix: options.suffix,
        locator: options.locator,
        locatorType: options.locatorType,
        renderedText: formattedText,
      };

      setCitations(prev => [...prev, newCitation]);

      return newCitation;
    },
    [editor]
  );

  /**
   * Add reference from search result to library and insert citation
   */
  const addAndCiteFromSearch = useCallback(
    async (searchResult: {
      id: string;
      title: string;
      authors: { name: string; firstName?: string; lastName?: string }[];
      abstract?: string;
      year: number;
      doi?: string;
      pmid?: string;
      arxivId?: string;
      url?: string;
      pdfUrl?: string;
      citationCount?: number;
      venue?: string;
      source: string;
    }) => {
      if (!user || !editor) return null;

      try {
        // Convert to reference
        const reference = searchResultToReference(searchResult);

        // Add to library
        const refId = await addReference(user.uid, reference);

        // Get the full reference
        const fullRef = await getReference(user.uid, refId);
        if (!fullRef) throw new Error('Failed to retrieve added reference');

        // Update local state
        setReferences(prev => [fullRef, ...prev]);

        // Format and insert
        const formattedText = `(${formatAuthorCitation(fullRef.authors)}, ${fullRef.issued.year})`;
        insertCitation(fullRef, {}, formattedText);

        return fullRef;
      } catch (error) {
        console.error('Failed to add and cite:', error);
        return null;
      }
    },
    [user, editor, insertCitation]
  );

  /**
   * Get all unique references cited in document
   */
  const getCitedReferences = useCallback(() => {
    const citedIds = new Set(citations.map(c => c.referenceId));
    return references.filter(r => citedIds.has(r.id));
  }, [citations, references]);

  /**
   * Generate bibliography from cited references using CSL formatter
   */
  const generateBibliographyText = useCallback(
    (style?: CitationStyleId) => {
      const citedRefs = getCitedReferences();
      if (citedRefs.length === 0) return '';

      return formatBibliography(citedRefs, style || citationStyle);
    },
    [getCitedReferences, citationStyle]
  );

  /**
   * Format a single citation using current style
   */
  const formatCitationText = useCallback(
    (ref: Reference, options?: CitationOptions) => {
      return formatCitation(ref, citationStyle, {
        suppressAuthor: options?.suppressAuthor,
        prefix: options?.prefix,
        suffix: options?.suffix,
        locator: options?.locator,
        locatorType: options?.locatorType,
      });
    },
    [citationStyle]
  );

  /**
   * Insert bibliography at cursor
   */
  const insertBibliography = useCallback(
    (style?: CitationStyleId) => {
      if (!editor) return;

      const bibliographyText = generateBibliographyText(style);

      if (!bibliographyText) {
        return;
      }

      // Convert markdown-like bibliography to HTML
      const entries = bibliographyText
        .split('\n\n')
        .filter(e => e.trim())
        .map(entry => {
          // Convert *text* to <em>text</em> and **text** to <strong>text</strong>
          return entry
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>');
        });

      const html = `
        <h2>References</h2>
        <div class="bibliography">
          ${entries.map(entry => `<p class="bibliography-entry">${entry}</p>`).join('\n')}
        </div>
      `;

      editor.chain().focus().insertContent(html).run();
    },
    [editor, generateBibliographyText]
  );

  /**
   * Refresh all citations in document (re-render)
   */
  const refreshCitations = useCallback(() => {
    if (!editor) return;

    // Find all citation spans and update their text
    // This would need a proper TipTap extension for full functionality
    // For now, citations are static after insertion
  }, [editor]);

  /**
   * Parse existing citations from document content
   */
  const parseCitationsFromContent = useCallback(
    (content: string) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const citationSpans = doc.querySelectorAll('.citation');

      const parsed: DocumentCitation[] = [];

      citationSpans.forEach((span, index) => {
        const refId = span.getAttribute('data-reference-id');
        if (refId) {
          parsed.push({
            id: `cit_parsed_${index}`,
            referenceId: refId,
            position: index,
            suppressAuthor: span.getAttribute('data-suppress-author') === 'true',
            prefix: span.getAttribute('data-prefix') || undefined,
            suffix: span.getAttribute('data-suffix') || undefined,
            locator: span.getAttribute('data-locator') || undefined,
            locatorType: span.getAttribute('data-locator-type') as any || undefined,
            renderedText: span.textContent || '',
          });
        }
      });

      setCitations(parsed);
      return parsed;
    },
    []
  );

  return {
    // State
    citations,
    references,
    loading,
    citationStyle,
    availableStyles: CITATION_STYLES,

    // Actions
    insertCitation,
    addAndCiteFromSearch,
    getCitedReferences,
    generateBibliographyText,
    insertBibliography,
    refreshCitations,
    parseCitationsFromContent,
    setCitationStyle,
    formatCitationText,

    // Helpers
    citationCount: citations.length,
    uniqueReferenceCount: new Set(citations.map(c => c.referenceId)).size,
  };
}

export default useCitations;
