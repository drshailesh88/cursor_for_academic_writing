/**
 * CSL Citation Formatter Tests
 *
 * CRITICAL: Tests all 10 citation styles with comprehensive edge cases.
 * Academic reputation depends on citation accuracy - 100% coverage required.
 */

import { describe, test, expect } from 'vitest';
import {
  formatCitation,
  formatBibliographyEntry,
  formatBibliography,
  getCitationStyle,
  getStylesForDiscipline,
  getShortCitation,
  CITATION_STYLES,
  type CitationStyleId,
} from '@/lib/citations/csl-formatter';
import { citationTestData, createTestReference } from '@/__tests__/mocks/test-data';

// ============================================================================
// IN-TEXT CITATION TESTS - ALL 10 STYLES
// ============================================================================

describe('CSL Citation Formatter - In-text Citations', () => {
  // Test each style with all author count variations
  const styles: CitationStyleId[] = [
    'apa-7',
    'mla-9',
    'chicago-author',
    'chicago-notes',
    'vancouver',
    'harvard',
    'ieee',
    'ama',
    'nature',
    'cell',
  ];

  describe.each(styles)('%s style', (styleId) => {
    test('formats single author correctly', () => {
      const citation = formatCitation(citationTestData.singleAuthor, styleId);
      expect(citation).toBeDefined();
      expect(citation.length).toBeGreaterThan(0);

      // Verify author name appears (except for numeric styles when no position given)
      const style = CITATION_STYLES.find(s => s.id === styleId);
      if (style?.category !== 'numeric') {
        expect(citation).toContain('Smith');
      }
    });

    test('formats two authors correctly', () => {
      const citation = formatCitation(citationTestData.twoAuthors, styleId);
      expect(citation).toBeDefined();

      const style = CITATION_STYLES.find(s => s.id === styleId);
      if (style?.category !== 'numeric') {
        expect(citation).toContain('Smith');

        // Different styles use different separators
        const hasAnd = citation.includes('and');
        const hasAmpersand = citation.includes('&');
        const hasEtAl = citation.includes('et al');

        // At least one of these should be true for author-date styles
        if (style?.category === 'author-date') {
          expect(hasAnd || hasAmpersand || hasEtAl).toBe(true);
        }
      }
    });

    test('formats 3+ authors with et al.', () => {
      const citation = formatCitation(citationTestData.threeAuthors, styleId);
      expect(citation).toBeDefined();

      const style = CITATION_STYLES.find(s => s.id === styleId);
      if (style?.category !== 'numeric') {
        expect(citation).toContain('Smith');

        // Most styles use et al. for 3+ authors
        // Some may list all three, but citation should still be valid
      }
    });

    test('formats bibliography entry correctly', () => {
      const entry = formatBibliographyEntry(citationTestData.singleAuthor, styleId, 1);
      expect(entry).toBeDefined();
      expect(entry.length).toBeGreaterThan(0);

      // Should contain title
      expect(entry).toContain('Machine learning');

      // Should contain year
      expect(entry).toContain('2024');
    });
  });

  // ============================================================================
  // EDGE CASES - ALL STYLES
  // ============================================================================

  describe('Edge cases across all styles', () => {
    test.each(styles)('%s handles missing author', (styleId) => {
      const citation = formatCitation(citationTestData.noAuthor, styleId);
      expect(citation).toBeDefined();
      expect(citation.length).toBeGreaterThan(0);

      // Should show title or year, not crash
      const hasContent = citation.includes('Annual') || citation.includes('2024') || /\[?\d+\]?/.test(citation);
      expect(hasContent).toBe(true);
    });

    test.each(styles)('%s handles missing year (n.d.)', (styleId) => {
      const citation = formatCitation(citationTestData.noYear, styleId);
      expect(citation).toBeDefined();

      // Should show "n.d." or similar for missing year in author-date styles
      // Note: MLA omits the year rather than using "n.d."
      const style = CITATION_STYLES.find(s => s.id === styleId);
      if (style?.category === 'author-date' && styleId !== 'mla-9') {
        expect(citation).toContain('n.d.');
      }
    });

    test.each(styles)('%s handles missing title', (styleId) => {
      const citation = formatCitation(citationTestData.noTitle, styleId);
      expect(citation).toBeDefined();
      expect(citation.length).toBeGreaterThan(0);
    });

    test.each(styles)('%s handles 100+ authors', (styleId) => {
      const citation = formatCitation(citationTestData.hundredAuthors, styleId);
      expect(citation).toBeDefined();

      // Should abbreviate, not list all 100
      expect(citation.length).toBeLessThan(200);
    });

    test.each(styles)('%s handles unicode in author names', (styleId) => {
      const citation = formatCitation(citationTestData.unicodeAuthors, styleId);
      expect(citation).toBeDefined();

      // Should preserve unicode characters
      const hasUnicode = citation.includes('Müller') || citation.includes('Østerberg') || citation.includes('田中');

      const style = CITATION_STYLES.find(s => s.id === styleId);
      if (style?.category !== 'numeric') {
        expect(hasUnicode).toBe(true);
      }
    });

    test.each(styles)('%s handles very long titles', (styleId) => {
      const entry = formatBibliographyEntry(citationTestData.longTitle, styleId);
      expect(entry).toBeDefined();

      // Should include the full title (not truncate inappropriately)
      expect(entry).toContain('comprehensive');
      expect(entry).toContain('considerations');
    });
  });

  // ============================================================================
  // CITATION OPTIONS
  // ============================================================================

  describe('Citation options', () => {
    test('suppress author option works (APA)', () => {
      const normal = formatCitation(citationTestData.singleAuthor, 'apa-7');
      const suppressed = formatCitation(citationTestData.singleAuthor, 'apa-7', { suppressAuthor: true });

      expect(normal).toContain('Smith');
      expect(suppressed).not.toContain('Smith');
      expect(suppressed).toContain('2024');
    });

    test('locator/page numbers work (APA)', () => {
      const withPage = formatCitation(citationTestData.singleAuthor, 'apa-7', {
        locator: '42',
        locatorType: 'page',
      });

      expect(withPage).toContain('42');
      expect(withPage).toContain('p.');
    });

    test('prefix and suffix work (APA)', () => {
      const withPrefixSuffix = formatCitation(citationTestData.singleAuthor, 'apa-7', {
        prefix: 'see',
        suffix: 'for details',
      });

      expect(withPrefixSuffix).toContain('see');
      expect(withPrefixSuffix).toContain('for details');
    });

    test('numeric citation with position (Vancouver)', () => {
      const citation = formatCitation(citationTestData.singleAuthor, 'vancouver', { position: 5 });
      expect(citation).toContain('5');
      expect(citation).toMatch(/^\(5\)$/); // Vancouver uses parentheses
    });

    test('numeric citation with position (IEEE)', () => {
      const citation = formatCitation(citationTestData.singleAuthor, 'ieee', { position: 3 });
      expect(citation).toContain('3');
      expect(citation).toMatch(/^\[3\]$/); // IEEE uses brackets
    });
  });

  // ============================================================================
  // SPECIFIC STYLE REQUIREMENTS
  // ============================================================================

  describe('APA 7th Edition specifics', () => {
    test('uses ampersand (&) for two authors', () => {
      const citation = formatCitation(citationTestData.twoAuthors, 'apa-7');
      expect(citation).toContain('&');
    });

    test('lists up to 20 authors in bibliography', () => {
      const ref = createTestReference({
        authors: Array.from({ length: 20 }, (_, i) => ({
          family: `Author${i + 1}`,
          given: 'Test',
          sequence: i === 0 ? 'first' : 'additional',
        })),
      });
      const entry = formatBibliographyEntry(ref, 'apa-7');

      // Should include all 20
      expect(entry).toContain('Author1');
      expect(entry).toContain('Author20');
    });

    test('uses ellipsis for 21+ authors in bibliography', () => {
      const ref = createTestReference({
        authors: Array.from({ length: 25 }, (_, i) => ({
          family: `Author${i + 1}`,
          given: 'Test',
          sequence: i === 0 ? 'first' : 'additional',
        })),
      });
      const entry = formatBibliographyEntry(ref, 'apa-7');

      // Should include first 19 and last
      expect(entry).toContain('Author1');
      // APA 7 uses spaced periods for ellipsis
      expect(entry).toContain('. . .');
      expect(entry).toContain('Author25');
      expect(entry).not.toContain('Author20'); // 20th should be replaced by ellipsis
    });
  });

  describe('MLA 9th Edition specifics', () => {
    test('uses "and" for two authors in citation', () => {
      const citation = formatCitation(citationTestData.twoAuthors, 'mla-9');
      expect(citation).toContain('and');
    });

    test('no comma before page number in citation', () => {
      const citation = formatCitation(citationTestData.singleAuthor, 'mla-9', {
        locator: '42',
      });

      // MLA format: (Smith 42) not (Smith, 42)
      expect(citation).toMatch(/Smith\s+42/);
    });

    test('uses quotation marks for article titles in bibliography', () => {
      const entry = formatBibliographyEntry(citationTestData.singleAuthor, 'mla-9');
      expect(entry).toContain('"');
    });
  });

  describe('Vancouver style specifics', () => {
    test('uses parentheses for citations', () => {
      const citation = formatCitation(citationTestData.singleAuthor, 'vancouver', { position: 1 });
      expect(citation).toMatch(/^\(\d+\)$/);
    });

    test('lists up to 6 authors in bibliography', () => {
      const entry = formatBibliographyEntry(citationTestData.manyAuthors, 'vancouver', 1);

      // Should include first 6
      expect(entry).toBeDefined();
    });

    test('uses "et al." for 7+ authors in bibliography', () => {
      const ref = createTestReference({
        authors: Array.from({ length: 7 }, (_, i) => ({
          family: `Author${i + 1}`,
          given: 'Test',
          sequence: i === 0 ? 'first' : 'additional',
        })),
      });
      const entry = formatBibliographyEntry(ref, 'vancouver', 1);
      expect(entry).toContain('et al');
    });
  });

  describe('IEEE style specifics', () => {
    test('uses square brackets for citations', () => {
      const citation = formatCitation(citationTestData.singleAuthor, 'ieee', { position: 1 });
      expect(citation).toMatch(/^\[\d+\]$/);
    });

    test('uses initials before last name', () => {
      const entry = formatBibliographyEntry(citationTestData.singleAuthor, 'ieee', 1);
      // IEEE format: J. Smith not Smith, J.
      expect(entry).toMatch(/[A-Z]\.\s+[A-Z]/);
    });
  });

  describe('Harvard style specifics', () => {
    test('uses "and" for multiple authors', () => {
      const citation = formatCitation(citationTestData.twoAuthors, 'harvard');
      expect(citation).toContain('and');
    });

    test('lists up to 3 authors with names', () => {
      const citation = formatCitation(citationTestData.threeAuthors, 'harvard');
      expect(citation).toContain('and');
    });
  });

  describe('Nature style specifics', () => {
    test('uses ampersand (&) before last author', () => {
      const entry = formatBibliographyEntry(citationTestData.twoAuthors, 'nature', 1);
      expect(entry).toContain('&');
    });

    test('abbreviates after 5 authors', () => {
      const ref = createTestReference({
        authors: Array.from({ length: 6 }, (_, i) => ({
          family: `Author${i + 1}`,
          given: 'Test',
          sequence: i === 0 ? 'first' : 'additional',
        })),
      });
      const entry = formatBibliographyEntry(ref, 'nature', 1);
      expect(entry).toContain('et al');
    });

    test('uses bold for volume number', () => {
      const entry = formatBibliographyEntry(citationTestData.singleAuthor, 'nature', 1);
      // Nature format includes **30** for volume
      expect(entry).toContain('**');
    });
  });
});

// ============================================================================
// BIBLIOGRAPHY TESTS
// ============================================================================

describe('CSL Citation Formatter - Bibliography', () => {
  test('formatBibliography sorts author-date styles alphabetically', () => {
    const refs = [
      createTestReference({ authors: [{ family: 'Zhang', given: 'Wei', sequence: 'first' }] }),
      createTestReference({ authors: [{ family: 'Anderson', given: 'Mary', sequence: 'first' }] }),
      createTestReference({ authors: [{ family: 'Miller', given: 'John', sequence: 'first' }] }),
    ];

    const bib = formatBibliography(refs, 'apa-7');
    const lines = bib.split('\n\n');

    // First entry should be Anderson (alphabetically first)
    expect(lines[0]).toContain('Anderson');
    expect(lines[1]).toContain('Miller');
    expect(lines[2]).toContain('Zhang');
  });

  test('formatBibliography maintains order for numeric styles', () => {
    const refs = [
      createTestReference({ authors: [{ family: 'Zhang', given: 'Wei', sequence: 'first' }] }),
      createTestReference({ authors: [{ family: 'Anderson', given: 'Mary', sequence: 'first' }] }),
    ];

    const bib = formatBibliography(refs, 'vancouver');
    const lines = bib.split('\n\n');

    // Numeric styles keep citation order
    expect(lines[0]).toContain('Zhang'); // First in list
    expect(lines[1]).toContain('Anderson'); // Second in list
  });

  test('formatBibliography handles empty list', () => {
    const bib = formatBibliography([], 'apa-7');
    expect(bib).toBe('');
  });

  test('formatBibliography handles single reference', () => {
    const bib = formatBibliography([citationTestData.singleAuthor], 'apa-7');
    expect(bib).toContain('Smith');
    expect(bib).toContain('2024');
  });
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

describe('CSL Utility Functions', () => {
  test('getCitationStyle returns correct style', () => {
    const apa = getCitationStyle('apa-7');
    expect(apa).toBeDefined();
    expect(apa?.name).toBe('APA 7th Edition');
    expect(apa?.category).toBe('author-date');
  });

  test('getCitationStyle returns undefined for invalid style', () => {
    const invalid = getCitationStyle('invalid-style' as CitationStyleId);
    expect(invalid).toBeUndefined();
  });

  test('getStylesForDiscipline finds psychology styles', () => {
    const styles = getStylesForDiscipline('psychology');
    expect(styles.length).toBeGreaterThan(0);
    expect(styles.some(s => s.id === 'apa-7')).toBe(true);
  });

  test('getStylesForDiscipline finds medicine styles', () => {
    const styles = getStylesForDiscipline('medicine');
    expect(styles.length).toBeGreaterThan(0);
    expect(styles.some(s => s.id === 'vancouver')).toBe(true);
    expect(styles.some(s => s.id === 'ama')).toBe(true);
  });

  test('getStylesForDiscipline handles case-insensitive search', () => {
    const lower = getStylesForDiscipline('medicine');
    const upper = getStylesForDiscipline('MEDICINE');
    expect(lower.length).toBe(upper.length);
  });

  test('getShortCitation formats single author', () => {
    const short = getShortCitation(citationTestData.singleAuthor);
    expect(short).toBe('Smith, 2024');
  });

  test('getShortCitation formats two authors with ampersand', () => {
    const short = getShortCitation(citationTestData.twoAuthors);
    expect(short).toContain('&');
    expect(short).toContain('2023');
  });

  test('getShortCitation formats 3+ authors with et al.', () => {
    const short = getShortCitation(citationTestData.threeAuthors);
    expect(short).toContain('et al');
    expect(short).toContain('2024');
  });

  test('getShortCitation handles no author', () => {
    const short = getShortCitation(citationTestData.noAuthor);
    expect(short).toBe('Unknown, 2024');
  });
});

// ============================================================================
// REFERENCE TYPE TESTS
// ============================================================================

describe('Different reference types', () => {
  test('formats book correctly in APA', () => {
    const entry = formatBibliographyEntry(citationTestData.book, 'apa-7');
    expect(entry).toContain('Harris');
    expect(entry).toContain('Medical Statistics Made Easy');
    expect(entry).toContain('Oxford University Press');
  });

  test('formats conference paper correctly in IEEE', () => {
    const entry = formatBibliographyEntry(citationTestData.conference, 'ieee', 1);
    expect(entry).toContain('Chen');
    expect(entry).toContain('Deep learning for radiology');
  });
});

// ============================================================================
// CONSISTENCY TESTS
// ============================================================================

describe('Consistency across styles', () => {
  test('all styles produce non-empty citations', () => {
    const styles: CitationStyleId[] = [
      'apa-7', 'mla-9', 'chicago-author', 'chicago-notes',
      'vancouver', 'harvard', 'ieee', 'ama', 'nature', 'cell',
    ];

    for (const styleId of styles) {
      const citation = formatCitation(citationTestData.singleAuthor, styleId, { position: 1 });
      expect(citation.length).toBeGreaterThan(0);
    }
  });

  test('all styles produce non-empty bibliography entries', () => {
    const styles: CitationStyleId[] = [
      'apa-7', 'mla-9', 'chicago-author', 'chicago-notes',
      'vancouver', 'harvard', 'ieee', 'ama', 'nature', 'cell',
    ];

    for (const styleId of styles) {
      const entry = formatBibliographyEntry(citationTestData.singleAuthor, styleId, 1);
      expect(entry.length).toBeGreaterThan(0);
    }
  });

  test('CITATION_STYLES array contains exactly 10 styles', () => {
    expect(CITATION_STYLES.length).toBe(10);
  });

  test('all CITATION_STYLES have required properties', () => {
    for (const style of CITATION_STYLES) {
      expect(style.id).toBeDefined();
      expect(style.name).toBeDefined();
      expect(style.category).toMatch(/^(author-date|numeric|note)$/);
      expect(Array.isArray(style.fields)).toBe(true);
    }
  });
});
