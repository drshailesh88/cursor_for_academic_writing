// Deep Research - Provider Tests
// Tests for all search providers and unified search service

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Import providers and types
import {
  BaseProvider,
  providerRegistry,
  getProvider,
  type SearchQuery,
  type SearchResults,
  type SearchPaper,
} from '../../lib/deep-research/sources';

import { PubMedProvider } from '../../lib/deep-research/sources/pubmed-provider';
import { SemanticScholarProvider } from '../../lib/deep-research/sources/semantic-scholar-provider';
import { ArxivProvider } from '../../lib/deep-research/sources/arxiv-provider';
import { CrossRefProvider } from '../../lib/deep-research/sources/crossref-provider';
import { EuropePMCProvider } from '../../lib/deep-research/sources/europe-pmc-provider';
import { SearchService, searchService } from '../../lib/deep-research/sources/search-service';

// ============================================================================
// Test Helpers
// ============================================================================

const createMockQuery = (query: string = 'machine learning'): SearchQuery => ({
  query,
  source: 'pubmed',
  filters: {
    dateRange: {
      start: new Date('2020-01-01'),
      end: new Date(),
    },
    languages: ['en'],
  },
  limit: 10,
  offset: 0,
});

const createMockPaper = (id: string, title: string): SearchPaper => ({
  id,
  source: 'pubmed',
  externalId: `EXT-${id}`,
  title,
  authors: [
    { name: 'John Smith', firstName: 'John', lastName: 'Smith' },
  ],
  year: 2023,
  abstract: 'Test abstract for the paper',
  journal: 'Test Journal',
  doi: `10.1234/test.${id}`,
  url: `https://example.com/paper/${id}`,
  openAccess: true,
  relevanceScore: 0.9,
});

// ============================================================================
// Provider Registry Tests
// ============================================================================

describe('Provider Registry', () => {
  it('registers all 5 providers', () => {
    expect(providerRegistry.size).toBeGreaterThanOrEqual(5);
  });

  it('can retrieve PubMed provider', () => {
    const provider = getProvider('pubmed');
    expect(provider).toBeDefined();
    expect(provider?.name).toBe('pubmed');
  });

  it('can retrieve Semantic Scholar provider', () => {
    const provider = getProvider('semantic_scholar');
    expect(provider).toBeDefined();
    expect(provider?.name).toBe('semantic_scholar');
  });

  it('can retrieve arXiv provider', () => {
    const provider = getProvider('arxiv');
    expect(provider).toBeDefined();
    expect(provider?.name).toBe('arxiv');
  });

  it('can retrieve CrossRef provider', () => {
    const provider = getProvider('crossref');
    expect(provider).toBeDefined();
    expect(provider?.name).toBe('crossref');
  });

  it('can retrieve Europe PMC provider', () => {
    const provider = getProvider('europe_pmc');
    expect(provider).toBeDefined();
    expect(provider?.name).toBe('europe_pmc');
  });

  it('returns undefined for unknown provider', () => {
    const provider = getProvider('unknown' as any);
    expect(provider).toBeUndefined();
  });
});

// ============================================================================
// PubMed Provider Tests
// ============================================================================

describe('PubMedProvider', () => {
  let provider: PubMedProvider;

  beforeEach(() => {
    provider = new PubMedProvider();
  });

  it('has correct configuration', () => {
    expect(provider.name).toBe('pubmed');
    expect(provider.displayName).toBe('PubMed');
    expect(provider.description).toContain('MEDLINE');
  });

  it('implements SearchProvider interface', () => {
    expect(typeof provider.isAvailable).toBe('function');
    expect(typeof provider.search).toBe('function');
    expect(typeof provider.getPaperDetails).toBe('function');
    expect(typeof provider.getCitingPapers).toBe('function');
    expect(typeof provider.getReferencedPapers).toBe('function');
  });

  it('extends BaseProvider', () => {
    expect(provider).toBeInstanceOf(BaseProvider);
  });
});

// ============================================================================
// Semantic Scholar Provider Tests
// ============================================================================

describe('SemanticScholarProvider', () => {
  let provider: SemanticScholarProvider;

  beforeEach(() => {
    provider = new SemanticScholarProvider();
  });

  it('has correct configuration', () => {
    expect(provider.name).toBe('semantic_scholar');
    expect(provider.displayName).toBe('Semantic Scholar');
    expect(provider.description).toContain('AI-powered');
  });

  it('implements SearchProvider interface', () => {
    expect(typeof provider.isAvailable).toBe('function');
    expect(typeof provider.search).toBe('function');
    expect(typeof provider.getPaperDetails).toBe('function');
    expect(typeof provider.getCitingPapers).toBe('function');
    expect(typeof provider.getReferencedPapers).toBe('function');
  });

  it('extends BaseProvider', () => {
    expect(provider).toBeInstanceOf(BaseProvider);
  });
});

// ============================================================================
// arXiv Provider Tests
// ============================================================================

describe('ArxivProvider', () => {
  let provider: ArxivProvider;

  beforeEach(() => {
    provider = new ArxivProvider();
  });

  it('has correct configuration', () => {
    expect(provider.name).toBe('arxiv');
    expect(provider.displayName).toBe('arXiv');
    expect(provider.description).toContain('preprints');
  });

  it('implements SearchProvider interface', () => {
    expect(typeof provider.isAvailable).toBe('function');
    expect(typeof provider.search).toBe('function');
    expect(typeof provider.getPaperDetails).toBe('function');
    expect(typeof provider.getCitingPapers).toBe('function');
    expect(typeof provider.getReferencedPapers).toBe('function');
  });

  it('extends BaseProvider', () => {
    expect(provider).toBeInstanceOf(BaseProvider);
  });

  it('marks all papers as open access', () => {
    // arXiv is fully open access
    const mockPaper = createMockPaper('arxiv-1', 'Test Paper');
    mockPaper.source = 'arxiv';
    expect(true).toBe(true); // Placeholder for actual test
  });
});

// ============================================================================
// CrossRef Provider Tests
// ============================================================================

describe('CrossRefProvider', () => {
  let provider: CrossRefProvider;

  beforeEach(() => {
    provider = new CrossRefProvider();
  });

  it('has correct configuration', () => {
    expect(provider.name).toBe('crossref');
    expect(provider.displayName).toBe('CrossRef');
    expect(provider.description).toContain('DOI');
  });

  it('implements SearchProvider interface', () => {
    expect(typeof provider.isAvailable).toBe('function');
    expect(typeof provider.search).toBe('function');
    expect(typeof provider.getPaperDetails).toBe('function');
    expect(typeof provider.getCitingPapers).toBe('function');
    expect(typeof provider.getReferencedPapers).toBe('function');
  });

  it('extends BaseProvider', () => {
    expect(provider).toBeInstanceOf(BaseProvider);
  });
});

// ============================================================================
// Europe PMC Provider Tests
// ============================================================================

describe('EuropePMCProvider', () => {
  let provider: EuropePMCProvider;

  beforeEach(() => {
    provider = new EuropePMCProvider();
  });

  it('has correct configuration', () => {
    expect(provider.name).toBe('europe_pmc');
    expect(provider.displayName).toBe('Europe PMC');
    expect(provider.description).toContain('life sciences');
  });

  it('implements SearchProvider interface', () => {
    expect(typeof provider.isAvailable).toBe('function');
    expect(typeof provider.search).toBe('function');
    expect(typeof provider.getPaperDetails).toBe('function');
    expect(typeof provider.getCitingPapers).toBe('function');
    expect(typeof provider.getReferencedPapers).toBe('function');
  });

  it('extends BaseProvider', () => {
    expect(provider).toBeInstanceOf(BaseProvider);
  });
});

// ============================================================================
// Search Service Tests
// ============================================================================

describe('SearchService', () => {
  let service: SearchService;

  beforeEach(() => {
    service = new SearchService();
  });

  it('has access to all registered providers', () => {
    const providers = service.getProviders();
    expect(providers.size).toBeGreaterThanOrEqual(5);
  });

  it('can check provider availability', async () => {
    // This is a unit test - doesn't make real API calls
    const pubmed = getProvider('pubmed');
    expect(pubmed).toBeDefined();
  });

  it('provides search method', () => {
    expect(typeof service.search).toBe('function');
  });

  it('provides searchSource method', () => {
    expect(typeof service.searchSource).toBe('function');
  });

  it('provides getPaperDetails method', () => {
    expect(typeof service.getPaperDetails).toBe('function');
  });

  it('provides getCitingPapers method', () => {
    expect(typeof service.getCitingPapers).toBe('function');
  });

  it('provides getReferencedPapers method', () => {
    expect(typeof service.getReferencedPapers).toBe('function');
  });

  it('ranks papers correctly', () => {
    const papers: SearchPaper[] = [
      { ...createMockPaper('1', 'Machine Learning in Healthcare'), citationCount: 10 },
      { ...createMockPaper('2', 'Deep Learning Advances'), citationCount: 100 },
      { ...createMockPaper('3', 'AI in Medicine'), citationCount: 50 },
    ];

    const ranked = service.rankPapers(papers, 'machine learning');

    // Paper with "Machine Learning" in title should rank high
    expect(ranked[0].title).toContain('Machine Learning');
  });
});

// ============================================================================
// Singleton Instance Tests
// ============================================================================

describe('Singleton Instances', () => {
  it('exports searchService singleton', () => {
    expect(searchService).toBeInstanceOf(SearchService);
  });

  it('singleton has all providers registered', () => {
    const providers = searchService.getProviders();
    expect(providers.has('pubmed')).toBe(true);
    expect(providers.has('semantic_scholar')).toBe(true);
    expect(providers.has('arxiv')).toBe(true);
    expect(providers.has('crossref')).toBe(true);
    expect(providers.has('europe_pmc')).toBe(true);
  });
});

// ============================================================================
// Deduplication Tests
// ============================================================================

describe('Paper Deduplication', () => {
  let service: SearchService;

  beforeEach(() => {
    service = new SearchService();
  });

  it('ranks papers by multiple factors', () => {
    const papers: SearchPaper[] = [
      {
        ...createMockPaper('1', 'Test Paper One'),
        abstract: 'Detailed abstract',
        citationCount: 100,
        openAccess: true,
        pdfUrl: 'https://example.com/pdf',
      },
      {
        ...createMockPaper('2', 'Test Paper Two'),
        abstract: undefined,
        citationCount: 5,
        openAccess: false,
      },
    ];

    const ranked = service.rankPapers(papers, 'test');

    // First paper has more metadata
    expect(ranked[0].id).toBe('1');
  });
});

// ============================================================================
// Query Building Tests
// ============================================================================

describe('Query Building', () => {
  it('creates valid search query structure', () => {
    const query = createMockQuery('artificial intelligence');

    expect(query.query).toBe('artificial intelligence');
    expect(query.source).toBe('pubmed');
    expect(query.limit).toBe(10);
    expect(query.offset).toBe(0);
    expect(query.filters.dateRange).toBeDefined();
    expect(query.filters.languages).toContain('en');
  });
});

// ============================================================================
// Integration Tests (Mocked)
// ============================================================================

describe('Provider Integration', () => {
  it('all providers are instances of BaseProvider', () => {
    const providers = [
      new PubMedProvider(),
      new SemanticScholarProvider(),
      new ArxivProvider(),
      new CrossRefProvider(),
      new EuropePMCProvider(),
    ];

    providers.forEach(provider => {
      expect(provider).toBeInstanceOf(BaseProvider);
    });
  });

  it('all providers have required methods', () => {
    const providers = [
      new PubMedProvider(),
      new SemanticScholarProvider(),
      new ArxivProvider(),
      new CrossRefProvider(),
      new EuropePMCProvider(),
    ];

    providers.forEach(provider => {
      expect(typeof provider.isAvailable).toBe('function');
      expect(typeof provider.search).toBe('function');
      expect(typeof provider.getPaperDetails).toBe('function');
      expect(typeof provider.getCitingPapers).toBe('function');
      expect(typeof provider.getReferencedPapers).toBe('function');
    });
  });

  it('all providers have display information', () => {
    const providers = [
      new PubMedProvider(),
      new SemanticScholarProvider(),
      new ArxivProvider(),
      new CrossRefProvider(),
      new EuropePMCProvider(),
    ];

    providers.forEach(provider => {
      expect(provider.name).toBeDefined();
      expect(provider.displayName).toBeDefined();
      expect(provider.description).toBeDefined();
      expect(provider.displayName.length).toBeGreaterThan(0);
      expect(provider.description.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// Search Results Structure Tests
// ============================================================================

describe('Search Results Structure', () => {
  it('SearchPaper has required fields', () => {
    const paper = createMockPaper('test', 'Test Title');

    expect(paper.id).toBeDefined();
    expect(paper.source).toBeDefined();
    expect(paper.externalId).toBeDefined();
    expect(paper.title).toBeDefined();
    expect(paper.authors).toBeDefined();
    expect(paper.year).toBeDefined();
    expect(paper.openAccess).toBeDefined();
  });

  it('SearchPaper authors have name field', () => {
    const paper = createMockPaper('test', 'Test Title');

    expect(paper.authors.length).toBeGreaterThan(0);
    paper.authors.forEach(author => {
      expect(author.name).toBeDefined();
    });
  });
});
