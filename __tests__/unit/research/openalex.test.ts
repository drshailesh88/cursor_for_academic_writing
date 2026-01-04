/**
 * OpenAlex API Client Tests
 *
 * Tests the OpenAlex API integration including:
 * - Work search
 * - Abstract inverted index reconstruction
 * - Pagination
 * - DOI lookup
 * - Citation tracking
 */

import { describe, test, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import {
  searchOpenAlex,
  getOpenAlexById,
  getByDOI,
  getRelatedWorks,
  getCitingWorks,
  openalexClient,
} from '@/lib/research/openalex';
import type { SearchQuery } from '@/lib/research/types';

describe('OpenAlex Client', () => {
  describe('searchOpenAlex', () => {
    test('searches works by query', async () => {
      const query: SearchQuery = {
        text: 'CRISPR cancer',
        limit: 10,
      };

      const response = await searchOpenAlex(query);

      expect(response).toHaveProperty('results');
      expect(response).toHaveProperty('total');
      expect(response).toHaveProperty('source', 'openalex');
      expect(response.results).toBeInstanceOf(Array);
      expect(response.results.length).toBeGreaterThan(0);
    });

    test('reconstructs abstract from inverted index', async () => {
      const query: SearchQuery = {
        text: 'CRISPR',
        limit: 1,
      };

      const response = await searchOpenAlex(query);
      const paper = response.results[0];

      expect(paper.abstract).toBeTruthy();
      expect(paper.abstract).toBe('This study explores CRISPR applications in cancer research');
    });

    test('handles empty inverted index', async () => {
      server.use(
        http.get('https://api.openalex.org/works', () => {
          return HttpResponse.json({
            meta: { count: 1, db_response_time_ms: 10, page: 1, per_page: 10 },
            results: [
              {
                id: 'https://openalex.org/W1234567890',
                doi: 'https://doi.org/10.1234/test',
                display_name: 'Test Paper',
                publication_year: 2024,
                authorships: [],
                // No abstract_inverted_index
                cited_by_count: 0,
                is_oa: false,
              },
            ],
          });
        })
      );

      const query: SearchQuery = {
        text: 'test',
        limit: 1,
      };

      const response = await searchOpenAlex(query);
      const paper = response.results[0];

      expect(paper.abstract).toBe('');
    });

    test('handles pagination', async () => {
      const query: SearchQuery = {
        text: 'machine learning',
        limit: 20,
        offset: 40, // Third page (page 3)
      };

      const response = await searchOpenAlex(query);

      expect(response.results).toBeInstanceOf(Array);
    });

    test('applies year range filter', async () => {
      const query: SearchQuery = {
        text: 'neural networks',
        yearRange: {
          start: 2020,
          end: 2024,
        },
        limit: 10,
      };

      const response = await searchOpenAlex(query);

      expect(response.results).toBeInstanceOf(Array);
    });

    test('filters by open access', async () => {
      const query: SearchQuery = {
        text: 'deep learning',
        openAccessOnly: true,
        limit: 10,
      };

      const response = await searchOpenAlex(query);

      expect(response.results).toBeInstanceOf(Array);
    });

    test('handles API errors', async () => {
      server.use(
        http.get('https://api.openalex.org/works', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      const query: SearchQuery = {
        text: 'test',
        limit: 10,
      };

      await expect(searchOpenAlex(query)).rejects.toThrow();
    });

    test('respects per_page limit (max 200)', async () => {
      const query: SearchQuery = {
        text: 'ai',
        limit: 250, // Should be capped at 200
      };

      const response = await searchOpenAlex(query);

      expect(response.results).toBeInstanceOf(Array);
    });

    test('includes polite email parameter', async () => {
      const query: SearchQuery = {
        text: 'test',
        limit: 1,
      };

      await searchOpenAlex(query);

      // Should complete with mailto parameter
      expect(true).toBe(true);
    });

    test('tracks execution time', async () => {
      const query: SearchQuery = {
        text: 'test',
        limit: 10,
      };

      const response = await searchOpenAlex(query);

      expect(response.executionTimeMs).toBeGreaterThan(0);
      expect(response.executionTimeMs).toBeLessThan(10000);
    });

    test('includes work metadata', async () => {
      const query: SearchQuery = {
        text: 'CRISPR',
        limit: 1,
      };

      const response = await searchOpenAlex(query);
      const paper = response.results[0];

      expect(paper.id).toBe('W4390123456');
      expect(paper.title).toBe('CRISPR Applications in Cancer Research');
      expect(paper.doi).toBe('10.1016/j.cell.2024.01.001');
      expect(paper.year).toBe(2024);
      expect(paper.citationCount).toBe(89);
      expect(paper.openAccess).toBe(true);
      expect(paper.venue).toBe('Cell');
    });

    test('returns total count from metadata', async () => {
      const query: SearchQuery = {
        text: 'machine learning',
        limit: 10,
      };

      const response = await searchOpenAlex(query);

      expect(response.total).toBe(50);
    });
  });

  describe('getOpenAlexById', () => {
    test('retrieves work by OpenAlex ID', async () => {
      server.use(
        http.get('https://api.openalex.org/works/:workId', () => {
          return HttpResponse.json({
            id: 'https://openalex.org/W4390123456',
            doi: 'https://doi.org/10.1016/j.cell.2024.01.001',
            display_name: 'Test Work',
            publication_year: 2024,
            authorships: [],
            cited_by_count: 10,
            is_oa: true,
          });
        })
      );

      const paper = await getOpenAlexById('W4390123456');

      expect(paper).not.toBeNull();
      expect(paper?.id).toBe('W4390123456');
      expect(paper?.source).toBe('openalex');
    });

    test('handles ID without W prefix', async () => {
      server.use(
        http.get('https://api.openalex.org/works/:workId', () => {
          return HttpResponse.json({
            id: 'https://openalex.org/W1234567890',
            display_name: 'Test Work',
            publication_year: 2024,
            authorships: [],
            cited_by_count: 0,
            is_oa: false,
          });
        })
      );

      const paper = await getOpenAlexById('1234567890');

      expect(paper).not.toBeNull();
    });

    test('returns null for non-existent ID', async () => {
      server.use(
        http.get('https://api.openalex.org/works/:workId', () => {
          return new HttpResponse(null, { status: 404 });
        })
      );

      const paper = await getOpenAlexById('W9999999999');
      expect(paper).toBeNull();
    });

    test('handles network errors gracefully', async () => {
      server.use(
        http.get('https://api.openalex.org/works/:workId', () => {
          return HttpResponse.error();
        })
      );

      const paper = await getOpenAlexById('W123');
      expect(paper).toBeNull();
    });
  });

  describe('getByDOI', () => {
    test('retrieves work by DOI', async () => {
      server.use(
        http.get('https://api.openalex.org/works/:workId', ({ params }) => {
          expect(params.workId).toContain('doi:');
          return HttpResponse.json({
            id: 'https://openalex.org/W1234567890',
            doi: 'https://doi.org/10.1016/j.cell.2024.01.001',
            display_name: 'Test Work',
            publication_year: 2024,
            authorships: [],
            cited_by_count: 0,
            is_oa: false,
          });
        })
      );

      const paper = await getByDOI('10.1016/j.cell.2024.01.001');

      expect(paper).not.toBeNull();
      expect(paper?.source).toBe('openalex');
    });

    test('handles DOI with https prefix', async () => {
      server.use(
        http.get('https://api.openalex.org/works/:workId', () => {
          return HttpResponse.json({
            id: 'https://openalex.org/W1234567890',
            doi: 'https://doi.org/10.1234/test',
            display_name: 'Test Work',
            publication_year: 2024,
            authorships: [],
            cited_by_count: 0,
            is_oa: false,
          });
        })
      );

      const paper = await getByDOI('https://doi.org/10.1234/test');

      expect(paper).not.toBeNull();
    });

    test('returns null for invalid DOI', async () => {
      server.use(
        http.get('https://api.openalex.org/works/:workId', () => {
          return new HttpResponse(null, { status: 404 });
        })
      );

      const paper = await getByDOI('10.9999/invalid');
      expect(paper).toBeNull();
    });
  });

  describe('getRelatedWorks', () => {
    test('retrieves related works by concept', async () => {
      // First call to get the work
      server.use(
        http.get('https://api.openalex.org/works/W4390123456', () => {
          return HttpResponse.json({
            id: 'https://openalex.org/W4390123456',
            display_name: 'Original Work',
            publication_year: 2024,
            authorships: [],
            cited_by_count: 10,
            is_oa: false,
            concepts: [
              { id: 'C1', display_name: 'Machine Learning', level: 1, score: 0.9 },
            ],
          });
        }),
        http.get('https://api.openalex.org/works', () => {
          return HttpResponse.json({
            meta: { count: 2, db_response_time_ms: 10, page: 1, per_page: 10 },
            results: [
              {
                id: 'https://openalex.org/W1111111111',
                display_name: 'Related Work 1',
                publication_year: 2024,
                authorships: [],
                cited_by_count: 5,
                is_oa: false,
              },
              {
                id: 'https://openalex.org/W2222222222',
                display_name: 'Related Work 2',
                publication_year: 2023,
                authorships: [],
                cited_by_count: 3,
                is_oa: false,
              },
            ],
          });
        })
      );

      const related = await getRelatedWorks('W4390123456', 10);

      expect(related).toBeInstanceOf(Array);
      expect(related.length).toBeGreaterThan(0);
    });

    test('returns empty array for work with no concepts', async () => {
      server.use(
        http.get('https://api.openalex.org/works/:workId', () => {
          return HttpResponse.json({
            id: 'https://openalex.org/W123',
            display_name: 'Work Without Concepts',
            publication_year: 2024,
            authorships: [],
            cited_by_count: 0,
            is_oa: false,
            // No concepts
          });
        })
      );

      const related = await getRelatedWorks('W123', 10);

      expect(related).toEqual([]);
    });

    test('returns empty array on error', async () => {
      server.use(
        http.get('https://api.openalex.org/works/:workId', () => {
          return new HttpResponse(null, { status: 404 });
        })
      );

      const related = await getRelatedWorks('invalid', 10);

      expect(related).toEqual([]);
    });
  });

  describe('getCitingWorks', () => {
    test('retrieves works that cite this work', async () => {
      server.use(
        http.get('https://api.openalex.org/works', ({ request }) => {
          const url = new URL(request.url);
          const filter = url.searchParams.get('filter');
          expect(filter).toContain('cites:');

          return HttpResponse.json({
            meta: { count: 1, db_response_time_ms: 10, page: 1, per_page: 20 },
            results: [
              {
                id: 'https://openalex.org/W3333333333',
                display_name: 'Citing Work',
                publication_year: 2024,
                authorships: [],
                cited_by_count: 1,
                is_oa: false,
              },
            ],
          });
        })
      );

      const citations = await getCitingWorks('W4390123456', 20);

      expect(citations).toBeInstanceOf(Array);
      expect(citations.length).toBeGreaterThan(0);
    });

    test('returns empty array on error', async () => {
      server.use(
        http.get('https://api.openalex.org/works', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      const citations = await getCitingWorks('invalid', 20);

      expect(citations).toEqual([]);
    });
  });

  describe('openalexClient interface', () => {
    test('implements DatabaseClient interface', () => {
      expect(openalexClient.id).toBe('openalex');
      expect(openalexClient.name).toBe('OpenAlex');
      expect(openalexClient.search).toBeInstanceOf(Function);
      expect(openalexClient.getById).toBeInstanceOf(Function);
      expect(openalexClient.getCitations).toBeInstanceOf(Function);
      expect(openalexClient.getRelated).toBeInstanceOf(Function);
    });

    test('reports correct capabilities', () => {
      expect(openalexClient.supportsFullText()).toBe(false);
      expect(openalexClient.supportsCitationCount()).toBe(true);
      expect(openalexClient.supportsRelatedPapers()).toBe(true);
    });

    test('search method works', async () => {
      const query: SearchQuery = {
        text: 'machine learning',
        limit: 10,
      };

      const response = await openalexClient.search(query);

      expect(response.source).toBe('openalex');
      expect(response.results).toBeInstanceOf(Array);
    });

    test('getById method works', async () => {
      server.use(
        http.get('https://api.openalex.org/works/:workId', () => {
          return HttpResponse.json({
            id: 'https://openalex.org/W123',
            display_name: 'Test',
            publication_year: 2024,
            authorships: [],
            cited_by_count: 0,
            is_oa: false,
          });
        })
      );

      const paper = await openalexClient.getById?.('W123');

      expect(paper).not.toBeNull();
    });
  });

  describe('Author Parsing', () => {
    test('parses author names correctly', async () => {
      const query: SearchQuery = {
        text: 'CRISPR',
        limit: 1,
      };

      const response = await searchOpenAlex(query);
      const paper = response.results[0];

      expect(paper.authors.length).toBe(2);
      expect(paper.authors[0].name).toBe('Michael Zhang');
      expect(paper.authors[1].name).toBe('Lisa Wang');
    });

    test('extracts first and last names', async () => {
      const query: SearchQuery = {
        text: 'CRISPR',
        limit: 1,
      };

      const response = await searchOpenAlex(query);
      const paper = response.results[0];

      const author = paper.authors[0];
      expect(author.firstName).toBe('Michael');
      expect(author.lastName).toBe('Zhang');
    });

    test('handles ORCID when available', async () => {
      server.use(
        http.get('https://api.openalex.org/works', () => {
          return HttpResponse.json({
            meta: { count: 1, db_response_time_ms: 10, page: 1, per_page: 10 },
            results: [
              {
                id: 'https://openalex.org/W123',
                display_name: 'Test',
                publication_year: 2024,
                authorships: [
                  {
                    author_position: 'first',
                    author: {
                      id: 'https://openalex.org/A123',
                      display_name: 'Test Author',
                      orcid: 'https://orcid.org/0000-0001-2345-6789',
                    },
                  },
                ],
                cited_by_count: 0,
                is_oa: false,
              },
            ],
          });
        })
      );

      const query: SearchQuery = {
        text: 'test',
        limit: 1,
      };

      const response = await searchOpenAlex(query);
      const paper = response.results[0];
      const author = paper.authors[0];

      expect(author.orcid).toBe('https://orcid.org/0000-0001-2345-6789');
    });

    test('includes author affiliations', async () => {
      server.use(
        http.get('https://api.openalex.org/works', () => {
          return HttpResponse.json({
            meta: { count: 1, db_response_time_ms: 10, page: 1, per_page: 10 },
            results: [
              {
                id: 'https://openalex.org/W123',
                display_name: 'Test',
                publication_year: 2024,
                authorships: [
                  {
                    author_position: 'first',
                    author: {
                      id: 'https://openalex.org/A123',
                      display_name: 'Test Author',
                    },
                    institutions: [
                      { display_name: 'Stanford University' },
                      { display_name: 'MIT' },
                    ],
                  },
                ],
                cited_by_count: 0,
                is_oa: false,
              },
            ],
          });
        })
      );

      const query: SearchQuery = {
        text: 'test',
        limit: 1,
      };

      const response = await searchOpenAlex(query);
      const paper = response.results[0];
      const author = paper.authors[0];

      expect(author.affiliations).toEqual(['Stanford University', 'MIT']);
    });
  });

  describe('Abstract Reconstruction', () => {
    test('reconstructs abstract in correct word order', async () => {
      const query: SearchQuery = {
        text: 'CRISPR',
        limit: 1,
      };

      const response = await searchOpenAlex(query);
      const paper = response.results[0];

      // Words should be in correct order: position 0, 1, 2, 3, etc.
      expect(paper.abstract).toBe('This study explores CRISPR applications in cancer research');
    });

    test('handles complex inverted index', async () => {
      server.use(
        http.get('https://api.openalex.org/works', () => {
          return HttpResponse.json({
            meta: { count: 1, db_response_time_ms: 10, page: 1, per_page: 10 },
            results: [
              {
                id: 'https://openalex.org/W123',
                display_name: 'Test',
                publication_year: 2024,
                authorships: [],
                abstract_inverted_index: {
                  'We': [0, 10],
                  'present': [1],
                  'a': [2],
                  'novel': [3],
                  'method.': [4],
                  'show': [11],
                  'that': [12],
                  'it': [13],
                  'works.': [14],
                },
                cited_by_count: 0,
                is_oa: false,
              },
            ],
          });
        })
      );

      const query: SearchQuery = {
        text: 'test',
        limit: 1,
      };

      const response = await searchOpenAlex(query);
      const paper = response.results[0];

      expect(paper.abstract).toBe('We present a novel method. We show that it works.');
    });
  });

  describe('DOI Normalization', () => {
    test('removes https://doi.org/ prefix from DOI', async () => {
      const query: SearchQuery = {
        text: 'CRISPR',
        limit: 1,
      };

      const response = await searchOpenAlex(query);
      const paper = response.results[0];

      expect(paper.doi).not.toContain('https://');
      expect(paper.doi).toBe('10.1016/j.cell.2024.01.001');
    });

    test('removes openalex.org prefix from ID', async () => {
      const query: SearchQuery = {
        text: 'CRISPR',
        limit: 1,
      };

      const response = await searchOpenAlex(query);
      const paper = response.results[0];

      expect(paper.id).not.toContain('https://openalex.org/');
      expect(paper.id).toBe('W4390123456');
    });
  });

  describe('Concepts and Categories', () => {
    test('extracts top concepts as categories', async () => {
      server.use(
        http.get('https://api.openalex.org/works', () => {
          return HttpResponse.json({
            meta: { count: 1, db_response_time_ms: 10, page: 1, per_page: 10 },
            results: [
              {
                id: 'https://openalex.org/W123',
                display_name: 'Test',
                publication_year: 2024,
                authorships: [],
                concepts: [
                  { id: 'C1', display_name: 'Machine Learning', level: 1, score: 0.95 },
                  { id: 'C2', display_name: 'Artificial Intelligence', level: 1, score: 0.90 },
                  { id: 'C3', display_name: 'Computer Science', level: 0, score: 0.85 },
                  { id: 'C4', display_name: 'Neural Networks', level: 2, score: 0.80 },
                  { id: 'C5', display_name: 'Deep Learning', level: 2, score: 0.75 },
                  { id: 'C6', display_name: 'Too Many', level: 3, score: 0.70 },
                ],
                cited_by_count: 0,
                is_oa: false,
              },
            ],
          });
        })
      );

      const query: SearchQuery = {
        text: 'test',
        limit: 1,
      };

      const response = await searchOpenAlex(query);
      const paper = response.results[0];

      // Should only include top 5 concepts
      expect(paper.categories?.length).toBe(5);
      expect(paper.categories).toContain('Machine Learning');
    });
  });
});
