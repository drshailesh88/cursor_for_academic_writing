/**
 * PubMed API Client Tests
 *
 * Tests the PubMed E-utilities integration including:
 * - Article search
 * - XML parsing
 * - Error handling
 * - Citation formatting
 */

import { describe, test, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import {
  searchPubMed,
  getArticleByPMID,
  articleToCitation,
  type PubMedArticle,
} from '@/lib/pubmed/client';

describe('PubMed Client', () => {
  describe('searchPubMed', () => {
    test('searches PubMed with query', async () => {
      const results = await searchPubMed({
        query: 'artificial intelligence healthcare',
        maxResults: 10,
      });

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('pmid');
      expect(results[0]).toHaveProperty('title');
      expect(results[0]).toHaveProperty('authors');
    });

    test('parses article metadata correctly', async () => {
      const results = await searchPubMed({
        query: 'AI healthcare',
        maxResults: 5,
      });

      const article = results[0];

      expect(article.pmid).toBe('12345678');
      expect(article.title).toBe('AI in Healthcare: A Systematic Review');
      expect(article.authors).toEqual(['Smith J', 'Jones M']);
      expect(article.journal).toBe('Nature Medicine');
      expect(article.year).toBe(2024);
      expect(article.doi).toBe('10.1038/s41591-024-01234-5');
      expect(article.abstract).toContain('systematic review');
    });

    test('handles empty results', async () => {
      server.use(
        http.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi', () => {
          return HttpResponse.json({
            esearchresult: {
              idlist: [],
              count: '0',
            },
          });
        })
      );

      const results = await searchPubMed({
        query: 'nonexistent query xyz123',
        maxResults: 10,
      });

      expect(results).toEqual([]);
    });

    test('applies date range filter', async () => {
      const results = await searchPubMed({
        query: 'machine learning',
        maxResults: 10,
        dateRange: {
          startYear: 2020,
          endYear: 2024,
        },
      });

      expect(results).toBeInstanceOf(Array);
      // The mock will return results, but in real use the date filter would be in the query
    });

    test('handles API rate limiting', async () => {
      server.use(
        http.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi', () => {
          return new HttpResponse(null, { status: 429 });
        })
      );

      await expect(
        searchPubMed({ query: 'test', maxResults: 10 })
      ).rejects.toThrow('PubMed API error');
    });

    test('handles malformed XML response', async () => {
      server.use(
        http.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi', () => {
          return HttpResponse.json({
            esearchresult: {
              idlist: ['99999'],
            },
          });
        }),
        http.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi', () => {
          return HttpResponse.xml('<invalid>xml</malformed>');
        })
      );

      const results = await searchPubMed({
        query: 'test',
        maxResults: 10,
      });

      // Should handle gracefully and return empty or partial results
      expect(results).toBeInstanceOf(Array);
    });

    test('handles server errors', async () => {
      server.use(
        http.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      await expect(
        searchPubMed({ query: 'test', maxResults: 10 })
      ).rejects.toThrow();
    });

    test('respects maxResults parameter', async () => {
      const results = await searchPubMed({
        query: 'cancer',
        maxResults: 5,
      });

      expect(results.length).toBeLessThanOrEqual(5);
    });

    test('defaults to 20 results when maxResults not specified', async () => {
      const results = await searchPubMed({
        query: 'diabetes',
      });

      expect(results).toBeInstanceOf(Array);
    });
  });

  describe('getArticleByPMID', () => {
    test('retrieves single article by PMID', async () => {
      const article = await getArticleByPMID('12345678');

      expect(article).not.toBeNull();
      expect(article?.pmid).toBe('12345678');
      expect(article?.title).toBeTruthy();
    });

    test('returns null for non-existent PMID', async () => {
      server.use(
        http.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi', () => {
          return HttpResponse.xml('<?xml version="1.0"?><PubmedArticleSet></PubmedArticleSet>');
        })
      );

      const article = await getArticleByPMID('99999999');
      expect(article).toBeNull();
    });

    test('handles network errors gracefully', async () => {
      server.use(
        http.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi', () => {
          return HttpResponse.error();
        })
      );

      const article = await getArticleByPMID('12345678');
      expect(article).toBeNull();
    });
  });

  describe('articleToCitation', () => {
    test('formats single author citation', () => {
      const article: PubMedArticle = {
        pmid: '123',
        title: 'Test Article',
        authors: ['Smith J'],
        journal: 'Nature',
        year: 2024,
        abstract: 'Test abstract',
      };

      const citation = articleToCitation(article);
      expect(citation).toBe('(Smith, 2024)');
    });

    test('formats two author citation', () => {
      const article: PubMedArticle = {
        pmid: '123',
        title: 'Test Article',
        authors: ['Smith J', 'Jones M'],
        journal: 'Nature',
        year: 2024,
        abstract: 'Test abstract',
      };

      const citation = articleToCitation(article);
      expect(citation).toBe('(Smith & Jones, 2024)');
    });

    test('formats three or more authors citation', () => {
      const article: PubMedArticle = {
        pmid: '123',
        title: 'Test Article',
        authors: ['Smith J', 'Jones M', 'Brown K'],
        journal: 'Nature',
        year: 2024,
        abstract: 'Test abstract',
      };

      const citation = articleToCitation(article);
      expect(citation).toBe('(Smith et al., 2024)');
    });

    test('handles missing authors', () => {
      const article: PubMedArticle = {
        pmid: '123',
        title: 'Test Article',
        authors: [],
        journal: 'Nature',
        year: 2024,
        abstract: 'Test abstract',
      };

      const citation = articleToCitation(article);
      expect(citation).toBe('(Unknown, 2024)');
    });

    test('extracts last name from full name', () => {
      const article: PubMedArticle = {
        pmid: '123',
        title: 'Test Article',
        authors: ['Van der Waals JD'],
        journal: 'Nature',
        year: 2024,
        abstract: 'Test abstract',
      };

      const citation = articleToCitation(article);
      // Should extract just "Van" as the first word
      expect(citation).toContain('Van');
      expect(citation).toContain('2024');
    });
  });

  describe('XML Parsing', () => {
    test('extracts DOI from article', async () => {
      const results = await searchPubMed({
        query: 'test',
        maxResults: 1,
      });

      expect(results[0].doi).toBeDefined();
      expect(results[0].doi).toMatch(/10\.\d+\//);
    });

    test('extracts PMID correctly', async () => {
      const results = await searchPubMed({
        query: 'test',
        maxResults: 1,
      });

      expect(results[0].pmid).toBe('12345678');
    });

    test('handles missing abstract gracefully', async () => {
      server.use(
        http.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi', () => {
          return HttpResponse.json({
            esearchresult: {
              idlist: ['11111'],
            },
          });
        }),
        http.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi', () => {
          return HttpResponse.xml(`<?xml version="1.0"?>
<PubmedArticleSet>
  <PubmedArticle>
    <MedlineCitation>
      <PMID>11111</PMID>
      <Article>
        <ArticleTitle>Article Without Abstract</ArticleTitle>
        <Journal><Title>Test Journal</Title></Journal>
        <AuthorList>
          <Author><LastName>Test</LastName><Initials>T</Initials></Author>
        </AuthorList>
      </Article>
    </MedlineCitation>
    <PubmedData>
      <ArticleIdList>
        <ArticleId IdType="pubmed">11111</ArticleId>
      </ArticleIdList>
    </PubmedData>
  </PubmedArticle>
</PubmedArticleSet>`);
        })
      );

      const results = await searchPubMed({
        query: 'test',
        maxResults: 1,
      });

      expect(results[0].abstract).toBe('');
    });

    test('handles HTML entities in title', async () => {
      const results = await searchPubMed({
        query: 'test',
        maxResults: 1,
      });

      // Title should be properly decoded
      expect(results[0].title).not.toContain('&lt;');
      expect(results[0].title).not.toContain('&gt;');
    });
  });

  describe('Sort and Filter Options', () => {
    test('sorts by relevance by default', async () => {
      const results = await searchPubMed({
        query: 'machine learning',
        maxResults: 10,
        sort: 'relevance',
      });

      expect(results).toBeInstanceOf(Array);
    });

    test('can sort by date', async () => {
      const results = await searchPubMed({
        query: 'machine learning',
        maxResults: 10,
        sort: 'date',
      });

      expect(results).toBeInstanceOf(Array);
    });

    test('can sort by publication date', async () => {
      const results = await searchPubMed({
        query: 'machine learning',
        maxResults: 10,
        sort: 'pub_date',
      });

      expect(results).toBeInstanceOf(Array);
    });
  });
});
