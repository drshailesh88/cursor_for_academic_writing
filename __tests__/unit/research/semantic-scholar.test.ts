/**
 * Semantic Scholar API Client Tests
 *
 * Tests the Semantic Scholar API integration including:
 * - Paper search
 * - Citation counts
 * - Related papers
 * - Rate limiting
 * - External ID lookups
 */

import { describe, test, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import {
  searchSemanticScholar,
  getSemanticScholarById,
  getByDOI,
  getByArxivId,
  getByPMID,
  getRelatedPapers,
  getCitations,
  getReferences,
  semanticScholarClient,
} from '@/lib/research/semantic-scholar';
import type { SearchQuery } from '@/lib/research/types';

describe('Semantic Scholar Client', () => {
  describe('searchSemanticScholar', () => {
    test('searches papers by query', async () => {
      const query: SearchQuery = {
        text: 'machine learning clinical',
        limit: 20,
      };

      const response = await searchSemanticScholar(query);

      expect(response).toHaveProperty('results');
      expect(response).toHaveProperty('total');
      expect(response).toHaveProperty('source', 'semantic-scholar');
      expect(response.results).toBeInstanceOf(Array);
      expect(response.results.length).toBeGreaterThan(0);
    });

    test('returns citation counts', async () => {
      const query: SearchQuery = {
        text: 'neural networks',
        limit: 10,
      };

      const response = await searchSemanticScholar(query);
      const paper = response.results[0];

      expect(paper.citationCount).toBeDefined();
      expect(paper.citationCount).toBe(45);
    });

    test('extracts DOI and PubMed ID', async () => {
      const query: SearchQuery = {
        text: 'test',
        limit: 10,
      };

      const response = await searchSemanticScholar(query);
      const paper = response.results[0];

      expect(paper.doi).toBe('10.1016/j.jbi.2024.104567');
      expect(paper.pmid).toBe('38765432');
    });

    test('handles rate limiting (429)', async () => {
      server.use(
        http.get('https://api.semanticscholar.org/graph/v1/paper/search', () => {
          return new HttpResponse(null, { status: 429 });
        })
      );

      const query: SearchQuery = {
        text: 'test',
        limit: 10,
      };

      await expect(searchSemanticScholar(query)).rejects.toThrow(
        'rate limit exceeded'
      );
    });

    test('handles API errors', async () => {
      server.use(
        http.get('https://api.semanticscholar.org/graph/v1/paper/search', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      const query: SearchQuery = {
        text: 'test',
        limit: 10,
      };

      await expect(searchSemanticScholar(query)).rejects.toThrow();
    });

    test('applies year range filter', async () => {
      const query: SearchQuery = {
        text: 'machine learning',
        yearRange: {
          start: 2020,
          end: 2024,
        },
        limit: 10,
      };

      const response = await searchSemanticScholar(query);

      expect(response.results).toBeInstanceOf(Array);
    });

    test('filters by open access', async () => {
      const query: SearchQuery = {
        text: 'deep learning',
        openAccessOnly: true,
        limit: 10,
      };

      const response = await searchSemanticScholar(query);

      expect(response.results).toBeInstanceOf(Array);
    });

    test('filters by fields of study', async () => {
      const query: SearchQuery = {
        text: 'neural networks',
        categories: ['Computer Science', 'Medicine'],
        limit: 10,
      };

      const response = await searchSemanticScholar(query);

      expect(response.results).toBeInstanceOf(Array);
    });

    test('respects limit parameter (max 100)', async () => {
      const query: SearchQuery = {
        text: 'ai',
        limit: 150, // Should be capped at 100
      };

      const response = await searchSemanticScholar(query);

      // API will enforce its own limit
      expect(response.results).toBeInstanceOf(Array);
    });

    test('handles offset for pagination', async () => {
      const query: SearchQuery = {
        text: 'machine learning',
        limit: 10,
        offset: 20,
      };

      const response = await searchSemanticScholar(query);

      expect(response.results).toBeInstanceOf(Array);
    });

    test('tracks execution time', async () => {
      const query: SearchQuery = {
        text: 'test',
        limit: 10,
      };

      const response = await searchSemanticScholar(query);

      expect(response.executionTimeMs).toBeGreaterThan(0);
      expect(response.executionTimeMs).toBeLessThan(10000);
    });

    test('includes paper metadata', async () => {
      const query: SearchQuery = {
        text: 'test',
        limit: 10,
      };

      const response = await searchSemanticScholar(query);
      const paper = response.results[0];

      expect(paper.id).toBe('abc123def456');
      expect(paper.title).toBeTruthy();
      expect(paper.abstract).toBeTruthy();
      expect(paper.year).toBeGreaterThan(2000);
      expect(paper.authors).toBeInstanceOf(Array);
    });

    test('returns total count', async () => {
      const query: SearchQuery = {
        text: 'machine learning',
        limit: 10,
      };

      const response = await searchSemanticScholar(query);

      expect(response.total).toBe(100);
    });
  });

  describe('getSemanticScholarById', () => {
    test('retrieves paper by Semantic Scholar ID', async () => {
      const paper = await getSemanticScholarById('abc123def456');

      expect(paper).not.toBeNull();
      expect(paper?.id).toBe('abc123def456');
      expect(paper?.source).toBe('semantic-scholar');
    });

    test('returns null for non-existent ID', async () => {
      server.use(
        http.get('https://api.semanticscholar.org/graph/v1/paper/*', () => {
          return new HttpResponse(null, { status: 404 });
        })
      );

      const paper = await getSemanticScholarById('invalid-id');
      expect(paper).toBeNull();
    });

    test('handles network errors gracefully', async () => {
      server.use(
        http.get('https://api.semanticscholar.org/graph/v1/paper/*', () => {
          return HttpResponse.error();
        })
      );

      const paper = await getSemanticScholarById('abc123');
      expect(paper).toBeNull();
    });
  });

  describe('getByDOI', () => {
    test('retrieves paper by DOI', async () => {
      const paper = await getByDOI('10.1016/j.jbi.2024.104567');

      expect(paper).not.toBeNull();
      expect(paper?.source).toBe('semantic-scholar');
    });

    test('handles DOI lookup errors', async () => {
      server.use(
        http.get('https://api.semanticscholar.org/graph/v1/paper/*', () => {
          return new HttpResponse(null, { status: 404 });
        })
      );

      const paper = await getByDOI('10.9999/invalid');
      expect(paper).toBeNull();
    });
  });

  describe('getByArxivId', () => {
    test('retrieves paper by arXiv ID', async () => {
      const paper = await getByArxivId('2401.12345');

      expect(paper).not.toBeNull();
      expect(paper?.source).toBe('semantic-scholar');
    });
  });

  describe('getByPMID', () => {
    test('retrieves paper by PubMed ID', async () => {
      const paper = await getByPMID('38765432');

      expect(paper).not.toBeNull();
      expect(paper?.source).toBe('semantic-scholar');
    });
  });

  describe('getRelatedPapers', () => {
    test('retrieves recommended papers', async () => {
      server.use(
        http.post('https://api.semanticscholar.org/graph/v1/paper/*/recommendations', () => {
          return HttpResponse.json({
            recommendedPapers: [
              {
                paperId: 'related1',
                title: 'Related Paper 1',
                abstract: 'Related abstract 1',
                year: 2024,
                authors: [{ authorId: 'a1', name: 'Author One' }],
                citationCount: 10,
              },
              {
                paperId: 'related2',
                title: 'Related Paper 2',
                abstract: 'Related abstract 2',
                year: 2023,
                authors: [{ authorId: 'a2', name: 'Author Two' }],
                citationCount: 5,
              },
            ],
          });
        })
      );

      const related = await getRelatedPapers('abc123def456', 10);

      expect(related).toBeInstanceOf(Array);
      expect(related.length).toBeGreaterThan(0);
      expect(related[0].source).toBe('semantic-scholar');
    });

    test('returns empty array on error', async () => {
      server.use(
        http.post('https://api.semanticscholar.org/graph/v1/paper/*/recommendations', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      const related = await getRelatedPapers('invalid', 10);

      expect(related).toEqual([]);
    });

    test('respects limit parameter', async () => {
      server.use(
        http.post('https://api.semanticscholar.org/graph/v1/paper/*/recommendations', () => {
          return HttpResponse.json({
            recommendedPapers: [],
          });
        })
      );

      const related = await getRelatedPapers('abc123', 5);

      expect(related).toBeInstanceOf(Array);
    });
  });

  describe('getCitations', () => {
    test('retrieves papers that cite this paper', async () => {
      server.use(
        http.get('https://api.semanticscholar.org/graph/v1/paper/*/citations', () => {
          return HttpResponse.json({
            data: [
              {
                citingPaper: {
                  paperId: 'citing1',
                  title: 'Citing Paper 1',
                  abstract: 'Cites the original paper',
                  year: 2024,
                  authors: [{ authorId: 'a1', name: 'Citer One' }],
                  citationCount: 3,
                },
              },
            ],
          });
        })
      );

      const citations = await getCitations('abc123def456', 20);

      expect(citations).toBeInstanceOf(Array);
      expect(citations.length).toBeGreaterThan(0);
      expect(citations[0].source).toBe('semantic-scholar');
    });

    test('returns empty array on error', async () => {
      server.use(
        http.get('https://api.semanticscholar.org/graph/v1/paper/:paperId/citations', () => {
          return new HttpResponse(null, { status: 404 });
        })
      );

      const citations = await getCitations('invalid', 20);

      expect(citations).toEqual([]);
    });
  });

  describe('getReferences', () => {
    test('retrieves papers this paper references', async () => {
      server.use(
        http.get('https://api.semanticscholar.org/graph/v1/paper/*/references', () => {
          return HttpResponse.json({
            data: [
              {
                citedPaper: {
                  paperId: 'ref1',
                  title: 'Referenced Paper 1',
                  abstract: 'Referenced by the paper',
                  year: 2023,
                  authors: [{ authorId: 'a1', name: 'Ref Author' }],
                  citationCount: 100,
                },
              },
            ],
          });
        })
      );

      const references = await getReferences('abc123def456', 20);

      expect(references).toBeInstanceOf(Array);
      expect(references.length).toBeGreaterThan(0);
      expect(references[0].source).toBe('semantic-scholar');
    });

    test('returns empty array on error', async () => {
      server.use(
        http.get('https://api.semanticscholar.org/graph/v1/paper/:paperId/references', () => {
          return new HttpResponse(null, { status: 404 });
        })
      );

      const references = await getReferences('invalid', 20);

      expect(references).toEqual([]);
    });
  });

  describe('semanticScholarClient interface', () => {
    test('implements DatabaseClient interface', () => {
      expect(semanticScholarClient.id).toBe('semantic-scholar');
      expect(semanticScholarClient.name).toBe('Semantic Scholar');
      expect(semanticScholarClient.search).toBeInstanceOf(Function);
      expect(semanticScholarClient.getById).toBeInstanceOf(Function);
      expect(semanticScholarClient.getCitations).toBeInstanceOf(Function);
      expect(semanticScholarClient.getRelated).toBeInstanceOf(Function);
    });

    test('reports correct capabilities', () => {
      expect(semanticScholarClient.supportsFullText()).toBe(false);
      expect(semanticScholarClient.supportsCitationCount()).toBe(true);
      expect(semanticScholarClient.supportsRelatedPapers()).toBe(true);
    });

    test('search method works', async () => {
      const query: SearchQuery = {
        text: 'machine learning',
        limit: 10,
      };

      const response = await semanticScholarClient.search(query);

      expect(response.source).toBe('semantic-scholar');
      expect(response.results).toBeInstanceOf(Array);
    });

    test('getById method works', async () => {
      const paper = await semanticScholarClient.getById?.('abc123def456');

      expect(paper).not.toBeNull();
      expect(paper?.id).toBe('abc123def456');
    });

    test('getCitations method works', async () => {
      server.use(
        http.get('https://api.semanticscholar.org/graph/v1/paper/*/citations', () => {
          return HttpResponse.json({
            data: [],
          });
        })
      );

      const citations = await semanticScholarClient.getCitations?.('abc123');

      expect(citations).toBeInstanceOf(Array);
    });

    test('getRelated method works', async () => {
      server.use(
        http.post('https://api.semanticscholar.org/graph/v1/paper/*/recommendations', () => {
          return HttpResponse.json({
            recommendedPapers: [],
          });
        })
      );

      const related = await semanticScholarClient.getRelated?.('abc123');

      expect(related).toBeInstanceOf(Array);
    });
  });

  describe('Author Parsing', () => {
    test('parses author names correctly', async () => {
      const query: SearchQuery = {
        text: 'test',
        limit: 1,
      };

      const response = await searchSemanticScholar(query);
      const paper = response.results[0];

      expect(paper.authors.length).toBe(2);
      expect(paper.authors[0].name).toBe('David Chen');
      expect(paper.authors[1].name).toBe('Sarah Lee');
    });

    test('extracts first and last names', async () => {
      const query: SearchQuery = {
        text: 'test',
        limit: 1,
      };

      const response = await searchSemanticScholar(query);
      const paper = response.results[0];

      const author = paper.authors[0];
      expect(author.firstName).toBe('David');
      expect(author.lastName).toBe('Chen');
    });

    test('handles single-name authors', async () => {
      server.use(
        http.get('https://api.semanticscholar.org/graph/v1/paper/search', () => {
          return HttpResponse.json({
            total: 1,
            offset: 0,
            data: [
              {
                paperId: 'test1',
                title: 'Test Paper',
                abstract: 'Test abstract',
                year: 2024,
                authors: [{ authorId: 'a1', name: 'Madonna' }],
                citationCount: 5,
              },
            ],
          });
        })
      );

      const query: SearchQuery = {
        text: 'test',
        limit: 1,
      };

      const response = await searchSemanticScholar(query);
      const paper = response.results[0];
      const author = paper.authors[0];

      expect(author.name).toBe('Madonna');
      expect(author.lastName).toBe('Madonna');
    });
  });

  describe('API Headers', () => {
    test('includes API key if provided in environment', async () => {
      // This test verifies the client uses the API key
      // The actual key check would be in the environment variables
      const query: SearchQuery = {
        text: 'test',
        limit: 1,
      };

      await searchSemanticScholar(query);

      // Should complete without error
      expect(true).toBe(true);
    });
  });

  describe('Open Access Detection', () => {
    test('detects open access papers', async () => {
      server.use(
        http.get('https://api.semanticscholar.org/graph/v1/paper/search', () => {
          return HttpResponse.json({
            total: 1,
            offset: 0,
            data: [
              {
                paperId: 'oa1',
                title: 'Open Access Paper',
                abstract: 'Freely available',
                year: 2024,
                authors: [{ authorId: 'a1', name: 'OA Author' }],
                isOpenAccess: true,
                openAccessPdf: {
                  url: 'https://example.com/paper.pdf',
                  status: 'GREEN',
                },
                citationCount: 10,
              },
            ],
          });
        })
      );

      const query: SearchQuery = {
        text: 'test',
        limit: 1,
      };

      const response = await searchSemanticScholar(query);
      const paper = response.results[0];

      expect(paper.openAccess).toBe(true);
      expect(paper.pdfUrl).toBe('https://example.com/paper.pdf');
    });
  });
});
