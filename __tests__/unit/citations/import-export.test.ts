/**
 * Citation Import/Export Tests
 *
 * Tests BibTeX and RIS import/export functionality.
 * Critical for interoperability with Zotero, Mendeley, EndNote.
 */

import { describe, test, expect } from 'vitest';
import {
  parseBibtex,
  parseRis,
  parseReferences,
  referenceToBibtex,
  referenceToRis,
  exportToBibtex,
  exportToRis,
  exportToCsv,
  exportToJson,
} from '@/lib/citations/import-export';
import { bibtexSamples, risSamples, createTestReference } from '@/__tests__/mocks/test-data';
import type { Reference } from '@/lib/citations/types';

// ============================================================================
// BIBTEX IMPORT TESTS
// ============================================================================

describe('BibTeX Import', () => {
  describe('Basic parsing', () => {
    test('parses @article entry', () => {
      const result = parseBibtex(bibtexSamples.valid);

      expect(result.success.length).toBe(2); // Two entries in sample
      expect(result.errors.length).toBe(0);

      const article = result.success[0];
      expect(article.type).toBe('article-journal');
      expect(article.title).toContain('Artificial Intelligence');
      expect(article.authors.length).toBe(3);
      expect(article.authors[0].family).toBe('Smith');
      expect(article.authors[0].given).toBe('John');
    });

    test('parses @book entry', () => {
      const result = parseBibtex(bibtexSamples.valid);
      const book = result.success.find(r => r.type === 'book');

      expect(book).toBeDefined();
      expect(book?.title).toContain('Research Methods');
      expect(book?.publisher?.name).toBe('Springer');
      expect(book?.publisher?.location).toBe('New York');
    });

    test('parses @inproceedings entry', () => {
      const bibtex = `
@inproceedings{chen2024deep,
  author = {Chen, Wei and Liu, Xiaoming},
  title = {Deep Learning Applications},
  booktitle = {Proceedings of ICML 2024},
  year = {2024},
  pages = {123--135}
}`;
      const result = parseBibtex(bibtex);

      expect(result.success.length).toBe(1);
      const conf = result.success[0];
      expect(conf.type).toBe('paper-conference');
      expect(conf.conference?.name).toBe('Proceedings of ICML 2024');
    });
  });

  describe('Author parsing', () => {
    test('handles "Last, First" format', () => {
      const bibtex = '@article{test, author = {Smith, John}, year = {2024}}';
      const result = parseBibtex(bibtex);

      expect(result.success[0].authors[0].family).toBe('Smith');
      expect(result.success[0].authors[0].given).toBe('John');
    });

    test('handles "First Last" format', () => {
      const bibtex = '@article{test, author = {John Smith}, year = {2024}}';
      const result = parseBibtex(bibtex);

      expect(result.success[0].authors[0].family).toBe('Smith');
      expect(result.success[0].authors[0].given).toBe('John');
    });

    test('handles multiple authors with "and"', () => {
      const bibtex = '@article{test, author = {Smith, John and Jones, Mary and Williams, Bob}, year = {2024}}';
      const result = parseBibtex(bibtex);

      expect(result.success[0].authors.length).toBe(3);
      expect(result.success[0].authors[1].family).toBe('Jones');
      expect(result.success[0].authors[2].family).toBe('Williams');
    });

    test('handles single-word names', () => {
      const bibtex = '@article{test, author = {Aristotle}, year = {2024}}';
      const result = parseBibtex(bibtex);

      expect(result.success[0].authors[0].family).toBe('Aristotle');
      expect(result.success[0].authors[0].given).toBe('');
    });
  });

  describe('LaTeX escape sequences', () => {
    test('converts \\"{o} to ö', () => {
      const result = parseBibtex(bibtexSamples.withLatexEscapes);

      expect(result.success.length).toBe(1);
      const ref = result.success[0];

      // Check that LaTeX escapes were converted
      expect(ref.authors.some(a => a.family.includes('ü'))).toBe(true);
    });

    test('converts \\c{c} to ç', () => {
      const bibtex = '@article{test, author = {Fran{\\c{c}}ois}, year = {2024}}';
      const result = parseBibtex(bibtex);

      expect(result.success[0].authors[0].family).toContain('ç');
    });

    test('converts \\~ to tilde characters', () => {
      const bibtex = '@article{test, author = {Pe{\\~n}a}, year = {2024}}';
      const result = parseBibtex(bibtex);

      expect(result.success[0].authors[0].family).toContain('ñ');
    });

    test('converts \\o to ø', () => {
      const result = parseBibtex(bibtexSamples.withLatexEscapes);
      const ref = result.success[0];

      expect(ref.authors.some(a => a.family.includes('Østerberg'))).toBe(true);
    });

    test('converts acute accents', () => {
      const bibtex = "@article{test, author = {Jos{\\'e}}, year = {2024}}";
      const result = parseBibtex(bibtex);

      expect(result.success[0].authors[0].family).toContain('é');
    });

    test('handles nested braces', () => {
      const bibtex = '@article{test, title = {{The {Big} Problem}}, year = {2024}}';
      const result = parseBibtex(bibtex);

      expect(result.success[0].title).toContain('Big');
    });
  });

  describe('Field extraction', () => {
    test('extracts DOI', () => {
      const result = parseBibtex(bibtexSamples.valid);
      const article = result.success[0];

      expect(article.identifiers.doi).toBe('10.1038/s41591-024-01234-5');
    });

    test('extracts journal information', () => {
      const result = parseBibtex(bibtexSamples.valid);
      const article = result.success[0];

      expect(article.venue?.name).toBe('Nature Medicine');
      expect(article.venue?.volume).toBe('30');
      expect(article.venue?.issue).toBe('1');
      expect(article.venue?.pages).toBe('45--67');
    });

    test('extracts year and month', () => {
      const bibtex = '@article{test, author = {Smith}, year = {2024}, month = {mar}}';
      const result = parseBibtex(bibtex);

      expect(result.success[0].issued.year).toBe(2024);
      expect(result.success[0].issued.month).toBe(3);
    });

    test('handles numeric month', () => {
      const bibtex = '@article{test, author = {Smith}, year = {2024}, month = {6}}';
      const result = parseBibtex(bibtex);

      expect(result.success[0].issued.month).toBe(6);
    });

    test('extracts abstract', () => {
      const bibtex = '@article{test, author = {Smith}, year = {2024}, abstract = {This is an abstract}}';
      const result = parseBibtex(bibtex);

      expect(result.success[0].abstract).toBe('This is an abstract');
    });

    test('extracts keywords', () => {
      const bibtex = '@article{test, author = {Smith}, year = {2024}, keywords = {AI, medicine, diagnosis}}';
      const result = parseBibtex(bibtex);

      expect(result.success[0].keywords).toEqual(['AI', 'medicine', 'diagnosis']);
    });
  });

  describe('Error handling', () => {
    test('handles malformed BibTeX gracefully', () => {
      const result = parseBibtex(bibtexSamples.malformed);

      expect(result.totalProcessed).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('handles empty string', () => {
      const result = parseBibtex('');

      expect(result.success.length).toBe(0);
      expect(result.totalProcessed).toBe(0);
    });

    test('handles invalid entry type', () => {
      const bibtex = '@unknown{test, author = {Smith}, year = {2024}}';
      const result = parseBibtex(bibtex);

      // Should still parse, default to 'document' type
      expect(result.success.length).toBe(1);
      expect(result.success[0].type).toBe('document');
    });

    test('generates error entries for unparseable content', () => {
      const bibtex = '@article{broken\nauthor = Smith\n}';
      const result = parseBibtex(bibtex);

      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Type mapping', () => {
    test('maps @phdthesis to thesis type', () => {
      const bibtex = '@phdthesis{test, author = {Smith}, title = {Test}, school = {MIT}, year = {2024}}';
      const result = parseBibtex(bibtex);

      expect(result.success[0].type).toBe('thesis');
      expect(result.success[0].thesis?.type).toBe('phd');
    });

    test('maps @mastersthesis to thesis type', () => {
      const bibtex = '@mastersthesis{test, author = {Smith}, title = {Test}, school = {MIT}, year = {2024}}';
      const result = parseBibtex(bibtex);

      expect(result.success[0].type).toBe('thesis');
      expect(result.success[0].thesis?.type).toBe('masters');
    });

    test('maps @techreport to report type', () => {
      const bibtex = '@techreport{test, author = {Smith}, title = {Test}, year = {2024}}';
      const result = parseBibtex(bibtex);

      expect(result.success[0].type).toBe('report');
    });
  });

  describe('Citation key preservation', () => {
    test('preserves citation key', () => {
      const result = parseBibtex(bibtexSamples.valid);

      expect(result.success[0].citeKey).toBe('smith2024ai');
    });

    test('generates unique IDs for different entries', () => {
      const result = parseBibtex(bibtexSamples.valid);

      const ids = result.success.map(r => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});

// ============================================================================
// RIS IMPORT TESTS
// ============================================================================

describe('RIS Import', () => {
  describe('Basic parsing', () => {
    test('parses JOUR (journal) entry', () => {
      const result = parseRis(risSamples.valid);

      expect(result.success.length).toBe(1);
      expect(result.errors.length).toBe(0);

      const article = result.success[0];
      expect(article.type).toBe('article-journal');
      expect(article.title).toBe('AI in Healthcare');
      expect(article.authors.length).toBe(2);
    });

    test('parses BOOK entry', () => {
      const result = parseRis(risSamples.book);

      expect(result.success.length).toBe(1);
      const book = result.success[0];
      expect(book.type).toBe('book');
      expect(book.publisher?.name).toBe('Springer');
    });

    test('handles multiple records', () => {
      const combined = risSamples.valid + '\n\n' + risSamples.book;
      const result = parseRis(combined);

      expect(result.success.length).toBe(2);
    });
  });

  describe('RIS field mapping', () => {
    test('maps AU to authors', () => {
      const result = parseRis(risSamples.valid);
      const ref = result.success[0];

      expect(ref.authors[0].family).toBe('Smith');
      expect(ref.authors[0].given).toBe('John');
      expect(ref.authors[1].family).toBe('Jones');
    });

    test('maps TI to title', () => {
      const result = parseRis(risSamples.valid);
      expect(result.success[0].title).toBe('AI in Healthcare');
    });

    test('maps JO to journal name', () => {
      const result = parseRis(risSamples.valid);
      expect(result.success[0].venue?.name).toBe('Nature Medicine');
    });

    test('maps VL, IS to volume and issue', () => {
      const result = parseRis(risSamples.valid);
      expect(result.success[0].venue?.volume).toBe('30');
      expect(result.success[0].venue?.issue).toBe('1');
    });

    test('maps SP and EP to page range', () => {
      const result = parseRis(risSamples.valid);
      expect(result.success[0].venue?.pages).toBe('45-67');
    });

    test('maps DO to DOI', () => {
      const result = parseRis(risSamples.valid);
      expect(result.success[0].identifiers.doi).toBe('10.1038/s41591-024-01234-5');
    });

    test('handles PY (publication year)', () => {
      const result = parseRis(risSamples.valid);
      expect(result.success[0].issued.year).toBe(2024);
    });

    test('handles DA (date) with month and day', () => {
      const ris = `
TY  - JOUR
AU  - Smith, John
TI  - Test
PY  - 2024
DA  - 2024/03/15
ER  -`;
      const result = parseRis(ris);

      expect(result.success[0].issued.year).toBe(2024);
      expect(result.success[0].issued.month).toBe(3);
      expect(result.success[0].issued.day).toBe(15);
    });
  });

  describe('RIS type mapping', () => {
    const typeTests = [
      { ris: 'JOUR', expected: 'article-journal' },
      { ris: 'BOOK', expected: 'book' },
      { ris: 'CHAP', expected: 'chapter' },
      { ris: 'CONF', expected: 'paper-conference' },
      { ris: 'THES', expected: 'thesis' },
      { ris: 'RPRT', expected: 'report' },
      { ris: 'WEB', expected: 'webpage' },
      { ris: 'DATA', expected: 'dataset' },
    ];

    test.each(typeTests)('maps $ris to $expected', ({ ris, expected }) => {
      const risText = `TY  - ${ris}\nAU  - Smith\nTI  - Test\nPY  - 2024\nER  -`;
      const result = parseRis(risText);
      expect(result.success[0].type).toBe(expected);
    });
  });

  describe('Error handling', () => {
    test('handles empty string', () => {
      const result = parseRis('');
      expect(result.success.length).toBe(0);
    });

    test('handles malformed RIS', () => {
      const malformed = 'TY  - JOUR\nBroken line\nER  -';
      const result = parseRis(malformed);

      // Should still try to parse what it can
      expect(result.totalProcessed).toBeGreaterThan(0);
    });

    test('handles missing required fields', () => {
      const minimal = 'TY  - JOUR\nER  -';
      const result = parseRis(minimal);

      expect(result.success.length).toBe(1);
      expect(result.success[0].title).toBe('Untitled');
    });
  });
});

// ============================================================================
// BIBTEX EXPORT TESTS
// ============================================================================

describe('BibTeX Export', () => {
  test('exports valid BibTeX format', () => {
    const ref = createTestReference();
    const bibtex = referenceToBibtex(ref);

    expect(bibtex).toContain('@article{');
    expect(bibtex).toContain('author =');
    expect(bibtex).toContain('title =');
    expect(bibtex).toContain('year =');
    expect(bibtex).toContain('}');
  });

  test('formats authors correctly', () => {
    const ref = createTestReference({
      authors: [
        { family: 'Smith', given: 'John', sequence: 'first' },
        { family: 'Jones', given: 'Mary', sequence: 'additional' },
      ],
    });
    const bibtex = referenceToBibtex(ref);

    expect(bibtex).toContain('Smith, John and Jones, Mary');
  });

  test('includes journal information', () => {
    const ref = createTestReference();
    const bibtex = referenceToBibtex(ref);

    expect(bibtex).toContain('journal = {Nature Medicine}');
    expect(bibtex).toContain('volume = {30}');
    expect(bibtex).toContain('number = {3}');
    expect(bibtex).toContain('pages = {456-478}');
  });

  test('includes DOI', () => {
    const ref = createTestReference();
    const bibtex = referenceToBibtex(ref);

    expect(bibtex).toContain('doi = {10.1038/s41591-024-12345-6}');
  });

  test('uses cite key if provided', () => {
    const ref = createTestReference({ citeKey: 'smith2024ml' });
    const bibtex = referenceToBibtex(ref);

    expect(bibtex).toContain('@article{smith2024ml,');
  });

  test('generates cite key if not provided', () => {
    const ref = createTestReference({ citeKey: undefined });
    const bibtex = referenceToBibtex(ref);

    // Should have some cite key
    expect(bibtex).toMatch(/@article\{[\w]+,/);
  });

  test('exports multiple references', () => {
    const refs = [
      createTestReference(),
      createTestReference({ title: 'Second paper' }),
    ];
    const bibtex = exportToBibtex(refs);

    // Should have two @article entries
    const matches = bibtex.match(/@article\{/g);
    expect(matches?.length).toBe(2);
  });

  test('includes month when available', () => {
    const ref = createTestReference({
      issued: { year: 2024, month: 6 },
    });
    const bibtex = referenceToBibtex(ref);

    expect(bibtex).toContain('month = {jun}');
  });

  test('includes abstract when available', () => {
    const ref = createTestReference({
      abstract: 'This is a test abstract',
    });
    const bibtex = referenceToBibtex(ref);

    expect(bibtex).toContain('abstract = {This is a test abstract}');
  });

  test('includes keywords when available', () => {
    const ref = createTestReference({
      keywords: ['AI', 'medicine', 'diagnosis'],
    });
    const bibtex = referenceToBibtex(ref);

    expect(bibtex).toContain('keywords = {AI, medicine, diagnosis}');
  });

  test('maps book type correctly', () => {
    const ref = createTestReference({
      type: 'book',
      publisher: { name: 'Springer' },
    });
    const bibtex = referenceToBibtex(ref);

    expect(bibtex).toContain('@book{');
    expect(bibtex).toContain('publisher = {Springer}');
  });
});

// ============================================================================
// RIS EXPORT TESTS
// ============================================================================

describe('RIS Export', () => {
  test('exports valid RIS format', () => {
    const ref = createTestReference();
    const ris = referenceToRis(ref);

    expect(ris).toContain('TY  - JOUR');
    expect(ris).toContain('AU  -');
    expect(ris).toContain('TI  -');
    expect(ris).toContain('PY  -');
    expect(ris).toContain('ER  -');
  });

  test('formats authors correctly', () => {
    const ref = createTestReference({
      authors: [
        { family: 'Smith', given: 'John', sequence: 'first' },
        { family: 'Jones', given: 'Mary', sequence: 'additional' },
      ],
    });
    const ris = referenceToRis(ref);

    expect(ris).toContain('AU  - Smith, John');
    expect(ris).toContain('AU  - Jones, Mary');
  });

  test('includes journal information', () => {
    const ref = createTestReference();
    const ris = referenceToRis(ref);

    expect(ris).toContain('JO  - Nature Medicine');
    expect(ris).toContain('VL  - 30');
    expect(ris).toContain('IS  - 3');
    expect(ris).toContain('SP  - 456');
    expect(ris).toContain('EP  - 478');
  });

  test('includes DOI', () => {
    const ref = createTestReference();
    const ris = referenceToRis(ref);

    expect(ris).toContain('DO  - 10.1038/s41591-024-12345-6');
  });

  test('exports multiple references', () => {
    const refs = [
      createTestReference(),
      createTestReference({ title: 'Second paper' }),
    ];
    const ris = exportToRis(refs);

    // Should have two TY entries
    const matches = ris.match(/TY  -/g);
    expect(matches?.length).toBe(2);
  });

  test('maps book type to BOOK', () => {
    const ref = createTestReference({ type: 'book' });
    const ris = referenceToRis(ref);

    expect(ris).toContain('TY  - BOOK');
  });

  test('maps thesis type to THES', () => {
    const ref = createTestReference({ type: 'thesis' });
    const ris = referenceToRis(ref);

    expect(ris).toContain('TY  - THES');
  });
});

// ============================================================================
// CSV EXPORT TESTS
// ============================================================================

describe('CSV Export', () => {
  test('exports valid CSV with headers', () => {
    const ref = createTestReference();
    const csv = exportToCsv([ref]);

    const lines = csv.split('\n');
    expect(lines[0]).toContain('Type');
    expect(lines[0]).toContain('Title');
    expect(lines[0]).toContain('Authors');
    expect(lines[0]).toContain('Year');
  });

  test('escapes commas in fields', () => {
    const ref = createTestReference({
      title: 'A title, with commas, in it',
    });
    const csv = exportToCsv([ref]);

    expect(csv).toContain('"A title, with commas, in it"');
  });

  test('escapes quotes in fields', () => {
    const ref = createTestReference({
      title: 'A title with "quotes" in it',
    });
    const csv = exportToCsv([ref]);

    expect(csv).toContain('""quotes""');
  });

  test('formats multiple authors with semicolons', () => {
    const ref = createTestReference();
    const csv = exportToCsv([ref]);

    expect(csv).toContain(';');
  });
});

// ============================================================================
// JSON EXPORT TESTS
// ============================================================================

describe('JSON Export', () => {
  test('exports valid JSON', () => {
    const ref = createTestReference();
    const json = exportToJson([ref]);

    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(1);
  });

  test('preserves all fields', () => {
    const ref = createTestReference();
    const json = exportToJson([ref]);

    const parsed = JSON.parse(json);
    expect(parsed[0].title).toBe(ref.title);
    expect(parsed[0].authors.length).toBe(ref.authors.length);
    expect(parsed[0].identifiers.doi).toBe(ref.identifiers.doi);
  });

  test('formats with indentation', () => {
    const ref = createTestReference();
    const json = exportToJson([ref]);

    // Pretty-printed JSON should have newlines
    expect(json).toContain('\n');
  });
});

// ============================================================================
// AUTO-DETECT FORMAT TESTS
// ============================================================================

describe('Auto-detect format', () => {
  test('detects BibTeX format', () => {
    const result = parseReferences(bibtexSamples.valid);

    expect(result.success.length).toBeGreaterThan(0);
  });

  test('detects RIS format', () => {
    const result = parseReferences(risSamples.valid);

    expect(result.success.length).toBeGreaterThan(0);
  });

  test('detects JSON format', () => {
    const refs = [createTestReference()];
    const json = JSON.stringify(refs);

    const result = parseReferences(json);

    expect(result.success.length).toBe(1);
  });

  test('handles unknown format', () => {
    const result = parseReferences('This is just plain text, not a citation format');

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].error).toContain('Unknown format');
  });

  test('handles empty string', () => {
    const result = parseReferences('');

    expect(result.success.length).toBe(0);
  });
});

// ============================================================================
// ROUND-TRIP TESTS
// ============================================================================

describe('Round-trip conversion', () => {
  test('BibTeX export → import preserves data', () => {
    const original = createTestReference();
    const bibtex = referenceToBibtex(original);
    const result = parseBibtex(bibtex);

    expect(result.success.length).toBe(1);
    const imported = result.success[0];

    expect(imported.title).toBe(original.title);
    expect(imported.authors.length).toBe(original.authors.length);
    expect(imported.issued.year).toBe(original.issued.year);
  });

  test('RIS export → import preserves data', () => {
    const original = createTestReference();
    const ris = referenceToRis(original);
    const result = parseRis(ris);

    expect(result.success.length).toBe(1);
    const imported = result.success[0];

    expect(imported.title).toBe(original.title);
    expect(imported.authors.length).toBe(original.authors.length);
    expect(imported.issued.year).toBe(original.issued.year);
  });

  test('JSON export → import preserves all data', () => {
    const original = createTestReference();
    const json = exportToJson([original]);
    const imported = JSON.parse(json)[0] as Reference;

    expect(imported.title).toBe(original.title);
    expect(imported.identifiers.doi).toBe(original.identifiers.doi);
    expect(imported.venue?.name).toBe(original.venue?.name);
  });
});
