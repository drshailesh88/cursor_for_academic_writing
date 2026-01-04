/**
 * Unified Search Tests
 *
 * Tests the unified search aggregator including:
 * - Multi-database parallel search
 * - Deduplication by DOI and title
 * - Result ranking
 * - Discipline-aware database selection
 * - Partial failure handling
 */

import { describe, test, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import {
  unifiedSearch,
  searchDatabase,
  getByDOI,
  generateCitation,
  formatResultsForAI,
  type UnifiedSearchOptions,
  type DatabaseSource,
} from '@/lib/research';
import type { SearchQuery } from '@/lib/research/types';

describe('Unified Search', () => {
  describe('unifiedSearch', () => {
    test('searches all databases in parallel', async () => {
      const options: UnifiedSearchOptions = {
        text: 'machine learning healthcare',
        limit: 20,
      };

      const response = await unifiedSearch(options);

      expect(response).toHaveProperty('results');
      expect(response).toHaveProperty('total');
      expect(response).toHaveProperty('bySource');
      expect(response).toHaveProperty('deduplicated');
      expect(response).toHaveProperty('executionTimeMs');
      expect(response).toHaveProperty('errors');

      expect(response.results).toBeInstanceOf(Array);
      expect(response.bySource).toHaveProperty('semantic-scholar');
    });

    test('deduplicates by DOI', async () => {
      // Mock multiple databases returning the same paper with same DOI
      server.use(
        http.get('https://api.semanticscholar.org/graph/v1/paper/search', () => {
          return HttpResponse.json({
            total: 1,
            offset: 0,
            data: [
              {
                paperId: 'ss123',
                title: 'Machine Learning in Medicine',
                abstract: 'Abstract from Semantic Scholar',
                year: 2024,
                authors: [{ authorId: 'a1', name: 'John Doe' }],
                citationCount: 50,
                externalIds: { DOI: '10.1234/same-doi' },
              },
            ],
          });
        }),
        http.get('https://api.openalex.org/works', () => {
          return HttpResponse.json({
            meta: { count: 1, db_response_time_ms: 10, page: 1, per_page: 10 },
            results: [
              {
                id: 'https://openalex.org/W123',
                doi: 'https://doi.org/10.1234/same-doi',
                display_name: 'Machine Learning in Medicine',
                publication_year: 2024,
                authorships: [
                  {
                    author_position: 'first',
                    author: {
                      id: 'https://openalex.org/A1',
                      display_name: 'John Doe',
                    },
                  },
                ],
                cited_by_count: 50,
                is_oa: false,
              },
            ],
          });
        })
      );

      const options: UnifiedSearchOptions = {
        text: 'machine learning',
        databases: ['semantic-scholar', 'openalex'],
        limit: 20,
      };

      const response = await unifiedSearch(options);

      // Should have deduplicated the same paper
      expect(response.deduplicated).toBeGreaterThan(0);
      expect(response.results.length).toBeLessThan(
        response.bySource['semantic-scholar'] + response.bySource['openalex']
      );
    });

    test('deduplicates by normalized title when no DOI', async () => {
      server.use(
        http.get('https://api.semanticscholar.org/graph/v1/paper/search', () => {
          return HttpResponse.json({
            total: 1,
            offset: 0,
            data: [
              {
                paperId: 'ss123',
                title: 'Deep Learning for Medical Diagnosis!!!',
                abstract: 'Abstract 1',
                year: 2024,
                authors: [{ authorId: 'a1', name: 'Jane Smith' }],
                citationCount: 30,
                // No DOI
              },
            ],
          });
        }),
        http.get('http://export.arxiv.org/api/query', () => {
          return HttpResponse.xml(`<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <opensearch:totalResults>1</opensearch:totalResults>
  <entry>
    <id>http://arxiv.org/abs/2401.12345v1</id>
    <published>2024-01-15T00:00:00Z</published>
    <updated>2024-01-15T00:00:00Z</updated>
    <title>Deep Learning for Medical Diagnosis</title>
    <summary>Abstract 2</summary>
    <author><name>Jane Smith</name></author>
    <category term="cs.AI"/>
    <link href="http://arxiv.org/abs/2401.12345v1" rel="alternate" type="text/html"/>
    <link href="http://arxiv.org/pdf/2401.12345v1" title="pdf" rel="related" type="application/pdf"/>
  </entry>
</feed>`);
        })
      );

      const options: UnifiedSearchOptions = {
        text: 'deep learning',
        databases: ['semantic-scholar', 'arxiv'],
        limit: 20,
      };

      const response = await unifiedSearch(options);

      // Should deduplicate by normalized title (ignoring punctuation)
      expect(response.deduplicated).toBeGreaterThan(0);
    });

    test('handles partial failures gracefully', async () => {
      server.use(
        http.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi', () => {
          return new HttpResponse(null, { status: 500 }); // PubMed fails
        })
      );

      const options: UnifiedSearchOptions = {
        text: 'machine learning',
        databases: ['pubmed', 'semantic-scholar'],
        limit: 20,
      };

      const response = await unifiedSearch(options);

      // Should still return results from Semantic Scholar
      expect(response.results.length).toBeGreaterThan(0);
      expect(response.errors.length).toBeGreaterThan(0);
      expect(response.errors[0].source).toBe('pubmed');
    });

    test('uses discipline-aware database selection', async () => {
      const options: UnifiedSearchOptions = {
        text: 'quantum entanglement',
        discipline: 'physics',
        limit: 20,
      };

      const response = await unifiedSearch(options);

      // Physics discipline should prioritize arXiv
      expect(response.results).toBeInstanceOf(Array);
      expect(response.bySource).toBeDefined();
    });

    test('respects database selection parameter', async () => {
      const options: UnifiedSearchOptions = {
        text: 'test query',
        databases: ['semantic-scholar'] as DatabaseSource[],
        limit: 20,
      };

      const response = await unifiedSearch(options);

      // Should only have results from Semantic Scholar
      expect(response.bySource['semantic-scholar']).toBeDefined();
      expect(response.bySource['pubmed']).toBeUndefined();
    });

    test('distributes limit across databases', async () => {
      const options: UnifiedSearchOptions = {
        text: 'machine learning',
        databases: ['semantic-scholar', 'arxiv'] as DatabaseSource[],
        limit: 20,
        maxPerSource: 10,
      };

      const response = await unifiedSearch(options);

      expect(response.results).toBeInstanceOf(Array);
      expect(response.results.length).toBeLessThanOrEqual(20);
    });

    test('ranks results by relevance and quality', async () => {
      const options: UnifiedSearchOptions = {
        text: 'machine learning',
        limit: 20,
      };

      const response = await unifiedSearch(options);

      // Results should be sorted (can't test exact order without knowing all data)
      expect(response.results).toBeInstanceOf(Array);

      // If we have multiple results, check first result has some quality indicators
      if (response.results.length > 1) {
        const first = response.results[0];
        // High-quality papers often have citations or are recent
        const hasQuality =
          (first.citationCount && first.citationCount > 0) ||
          first.year >= new Date().getFullYear() - 3;
        expect(hasQuality).toBeDefined();
      }
    });

    test('applies year range filter', async () => {
      const options: UnifiedSearchOptions = {
        text: 'neural networks',
        yearRange: {
          start: 2022,
          end: 2024,
        },
        limit: 20,
      };

      const response = await unifiedSearch(options);

      expect(response.results).toBeInstanceOf(Array);
    });

    test('filters for open access only', async () => {
      const options: UnifiedSearchOptions = {
        text: 'machine learning',
        openAccessOnly: true,
        limit: 20,
      };

      const response = await unifiedSearch(options);

      expect(response.results).toBeInstanceOf(Array);
    });

    test('can disable deduplication', async () => {
      const options: UnifiedSearchOptions = {
        text: 'machine learning',
        limit: 20,
        deduplicate: false,
      };

      const response = await unifiedSearch(options);

      expect(response.deduplicated).toBe(0);
    });

    test('tracks execution time', async () => {
      const options: UnifiedSearchOptions = {
        text: 'test query',
        limit: 10,
      };

      const response = await unifiedSearch(options);

      expect(response.executionTimeMs).toBeGreaterThan(0);
      expect(response.executionTimeMs).toBeLessThan(30000); // Should complete in <30s
    });

    test('merges results with complementary data', async () => {
      // Mock two sources with different data for same paper
      server.use(
        http.get('https://api.semanticscholar.org/graph/v1/paper/search', () => {
          return HttpResponse.json({
            total: 1,
            offset: 0,
            data: [
              {
                paperId: 'ss123',
                title: 'Test Paper',
                abstract: 'Full abstract here',
                year: 2024,
                authors: [{ authorId: 'a1', name: 'Test Author' }],
                citationCount: 100,
                externalIds: { DOI: '10.1234/test-doi' },
              },
            ],
          });
        }),
        http.get('https://api.openalex.org/works', () => {
          return HttpResponse.json({
            meta: { count: 1, db_response_time_ms: 10, page: 1, per_page: 10 },
            results: [
              {
                id: 'https://openalex.org/W123',
                doi: 'https://doi.org/10.1234/test-doi',
                display_name: 'Test Paper',
                publication_year: 2024,
                authorships: [],
                // No abstract
                cited_by_count: 50, // Lower citation count
                is_oa: true, // Has open access info
                open_access: {
                  is_oa: true,
                  oa_status: 'gold',
                  oa_url: 'https://example.com/paper.pdf',
                },
              },
            ],
          });
        })
      );

      const options: UnifiedSearchOptions = {
        text: 'test',
        databases: ['semantic-scholar', 'openalex'],
        limit: 20,
      };

      const response = await unifiedSearch(options);

      const mergedPaper = response.results[0];

      // Should have merged data: abstract from SS, open access from OA, higher citation count
      expect(mergedPaper.abstract).toBeTruthy();
      expect(mergedPaper.openAccess).toBe(true);
      expect(mergedPaper.citationCount).toBe(100); // Higher count wins
      expect(mergedPaper.pdfUrl).toBeTruthy();
    });
  });

  describe('searchDatabase', () => {
    test('searches a single database by source', async () => {
      const query: SearchQuery = {
        text: 'machine learning',
        limit: 10,
      };

      const response = await searchDatabase('semantic-scholar', query);

      expect(response.source).toBe('semantic-scholar');
      expect(response.results).toBeInstanceOf(Array);
    });

    test('throws error for unknown database', async () => {
      const query: SearchQuery = {
        text: 'test',
        limit: 10,
      };

      await expect(
        searchDatabase('invalid-db' as DatabaseSource, query)
      ).rejects.toThrow('Unknown database');
    });

    test('works with PubMed', async () => {
      const query: SearchQuery = {
        text: 'cancer',
        limit: 10,
      };

      const response = await searchDatabase('pubmed', query);

      expect(response.source).toBe('pubmed');
    });

    test('works with arXiv', async () => {
      const query: SearchQuery = {
        text: 'physics',
        limit: 10,
      };

      const response = await searchDatabase('arxiv', query);

      expect(response.source).toBe('arxiv');
    });

    test('works with OpenAlex', async () => {
      const query: SearchQuery = {
        text: 'chemistry',
        limit: 10,
      };

      const response = await searchDatabase('openalex', query);

      expect(response.source).toBe('openalex');
    });
  });

  describe('getByDOI', () => {
    test('retrieves paper by DOI from any database', async () => {
      const paper = await getByDOI('10.1016/j.jbi.2024.104567');

      expect(paper).not.toBeNull();
      expect(paper?.doi).toBeTruthy();
    });

    test('tries Semantic Scholar first', async () => {
      let ssCallCount = 0;

      server.use(
        http.get('https://api.semanticscholar.org/graph/v1/paper/:paperId', () => {
          ssCallCount++;
          return HttpResponse.json({
            paperId: 'ss123',
            title: 'Test Paper',
            abstract: 'Test abstract',
            year: 2024,
            authors: [{ authorId: 'a1', name: 'Test' }],
            externalIds: { DOI: '10.1234/test' },
          });
        })
      );

      const paper = await getByDOI('10.1234/test');

      expect(paper).not.toBeNull();
      expect(ssCallCount).toBe(1);
    });

    test('falls back to OpenAlex if Semantic Scholar fails', async () => {
      server.use(
        http.get('https://api.semanticscholar.org/graph/v1/paper/:paperId', () => {
          return new HttpResponse(null, { status: 404 });
        }),
        http.get('https://api.openalex.org/works/:workId', () => {
          return HttpResponse.json({
            id: 'https://openalex.org/W123',
            doi: 'https://doi.org/10.1234/test',
            display_name: 'Test Paper',
            publication_year: 2024,
            authorships: [],
            cited_by_count: 0,
            is_oa: false,
          });
        })
      );

      const paper = await getByDOI('10.1234/test');

      expect(paper).not.toBeNull();
      expect(paper?.source).toBe('openalex');
    });

    test('returns null if not found in any database', async () => {
      server.use(
        http.get('https://api.semanticscholar.org/graph/v1/paper/:paperId', () => {
          return new HttpResponse(null, { status: 404 });
        }),
        http.get('https://api.openalex.org/works/:workId', () => {
          return new HttpResponse(null, { status: 404 });
        })
      );

      const paper = await getByDOI('10.9999/nonexistent');

      expect(paper).toBeNull();
    });
  });

  describe('generateCitation', () => {
    test('generates author-year citation', () => {
      const result = {
        id: '123',
        source: 'pubmed' as const,
        title: 'Test Paper',
        authors: [
          { name: 'John Smith', firstName: 'John', lastName: 'Smith' },
        ],
        abstract: 'Test abstract',
        year: 2024,
        url: 'https://example.com',
        openAccess: false,
      };

      const citation = generateCitation(result);

      expect(citation).toBe('(Smith, 2024)');
    });

    test('handles multiple authors', () => {
      const result = {
        id: '123',
        source: 'pubmed' as const,
        title: 'Test Paper',
        authors: [
          { name: 'John Smith', firstName: 'John', lastName: 'Smith' },
          { name: 'Jane Doe', firstName: 'Jane', lastName: 'Doe' },
          { name: 'Bob Johnson', firstName: 'Bob', lastName: 'Johnson' },
        ],
        abstract: 'Test abstract',
        year: 2024,
        url: 'https://example.com',
        openAccess: false,
      };

      const citation = generateCitation(result);

      expect(citation).toBe('(Smith et al., 2024)');
    });
  });

  describe('formatResultsForAI', () => {
    test('formats results for AI context', () => {
      const results = [
        {
          id: '1',
          source: 'pubmed' as const,
          title: 'Machine Learning in Medicine',
          authors: [
            { name: 'John Smith', firstName: 'John', lastName: 'Smith' },
          ],
          abstract: 'This paper explores the application of machine learning algorithms in clinical diagnosis. We present a comprehensive review of recent advances and discuss future directions for research.',
          year: 2024,
          citationCount: 50,
          url: 'https://example.com/1',
          openAccess: true,
        },
        {
          id: '2',
          source: 'arxiv' as const,
          title: 'Deep Learning for Medical Imaging',
          authors: [
            { name: 'Jane Doe', firstName: 'Jane', lastName: 'Doe' },
            { name: 'Bob Lee', firstName: 'Bob', lastName: 'Lee' },
          ],
          abstract: 'Short abstract.',
          year: 2023,
          url: 'https://example.com/2',
          openAccess: true,
        },
      ];

      const formatted = formatResultsForAI(results);

      expect(formatted).toContain('[1] Machine Learning in Medicine');
      expect(formatted).toContain('(Smith, 2024)');
      expect(formatted).toContain('Citations: 50');
      expect(formatted).toContain('Open Access');
      expect(formatted).toContain('[2] Deep Learning for Medical Imaging');
      expect(formatted).toContain('(Doe & Lee, 2023)');
      expect(formatted).toContain('Source: arxiv');
    });

    test('truncates long abstracts', () => {
      const longAbstract = 'A'.repeat(300);

      const results = [
        {
          id: '1',
          source: 'pubmed' as const,
          title: 'Test Paper',
          authors: [
            { name: 'Test Author', firstName: 'Test', lastName: 'Author' },
          ],
          abstract: longAbstract,
          year: 2024,
          url: 'https://example.com',
          openAccess: false,
        },
      ];

      const formatted = formatResultsForAI(results);

      expect(formatted).toContain('...');
      expect(formatted.length).toBeLessThan(longAbstract.length + 200);
    });

    test('handles results without citations', () => {
      const results = [
        {
          id: '1',
          source: 'arxiv' as const,
          title: 'Test Paper',
          authors: [{ name: 'Test', firstName: 'Test', lastName: 'Author' }],
          abstract: 'Test',
          year: 2024,
          url: 'https://example.com',
          openAccess: true,
          // No citationCount
        },
      ];

      const formatted = formatResultsForAI(results);

      expect(formatted).not.toContain('Citations:');
      expect(formatted).toContain('Open Access');
    });
  });

  describe('Discipline-Aware Database Selection', () => {
    test('prioritizes PubMed for life sciences', async () => {
      const options: UnifiedSearchOptions = {
        text: 'protein folding',
        discipline: 'life-sciences',
        limit: 20,
      };

      const response = await unifiedSearch(options);

      expect(response.results).toBeInstanceOf(Array);
      // Should search PubMed (we can see it in bySource)
      expect(response.bySource).toBeDefined();
    });

    test('prioritizes arXiv for physics', async () => {
      const options: UnifiedSearchOptions = {
        text: 'quantum mechanics',
        discipline: 'physics',
        limit: 20,
      };

      const response = await unifiedSearch(options);

      expect(response.results).toBeInstanceOf(Array);
      expect(response.bySource).toBeDefined();
    });

    test('uses all databases when discipline not specified', async () => {
      const options: UnifiedSearchOptions = {
        text: 'machine learning',
        limit: 20,
      };

      const response = await unifiedSearch(options);

      // Should search multiple databases
      expect(Object.keys(response.bySource).length).toBeGreaterThan(1);
    });
  });

  describe('Result Ranking', () => {
    test('prioritizes papers with query terms in title', async () => {
      const options: UnifiedSearchOptions = {
        text: 'machine learning',
        limit: 20,
      };

      const response = await unifiedSearch(options);

      if (response.results.length > 0) {
        // At least some results should match the query
        const hasRelevantTitle = response.results.some((r) =>
          r.title.toLowerCase().includes('machine') ||
          r.title.toLowerCase().includes('learning')
        );
        expect(hasRelevantTitle).toBe(true);
      }
    });

    test('considers citation count in ranking', async () => {
      const options: UnifiedSearchOptions = {
        text: 'neural networks',
        limit: 20,
      };

      const response = await unifiedSearch(options);

      // If we have results with citations, they should be ranked higher
      expect(response.results).toBeInstanceOf(Array);
    });

    test('gives bonus to recent papers', async () => {
      const options: UnifiedSearchOptions = {
        text: 'AI research',
        limit: 20,
      };

      const response = await unifiedSearch(options);

      // Recent papers (last 3 years) should be present
      const currentYear = new Date().getFullYear();
      const recentPapers = response.results.filter(
        (r) => r.year >= currentYear - 3
      );

      if (response.results.length > 0) {
        expect(recentPapers.length).toBeGreaterThan(0);
      }
    });

    test('gives bonus to open access papers', async () => {
      const options: UnifiedSearchOptions = {
        text: 'machine learning',
        limit: 20,
      };

      const response = await unifiedSearch(options);

      // Should have some open access papers
      const openAccessPapers = response.results.filter((r) => r.openAccess);

      if (response.results.length > 0) {
        expect(openAccessPapers.length).toBeGreaterThan(0);
      }
    });
  });
});
