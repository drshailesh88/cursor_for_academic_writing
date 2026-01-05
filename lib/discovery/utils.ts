/**
 * Discovery Module Utilities
 *
 * Shared utility functions for the discovery module
 */

import type { SearchResult } from '@/lib/research/types';
import type { DiscoveredPaper } from './types';

/**
 * Convert SearchResult to DiscoveredPaper
 */
export function toDiscoveredPaper(result: SearchResult): DiscoveredPaper {
  return {
    id: result.id,
    doi: result.doi,
    pmid: result.pmid,
    arxivId: result.arxivId,
    semanticScholarId: result.source === 'semantic-scholar' ? result.id : undefined,
    title: result.title,
    authors: result.authors.map((a) => ({
      name: a.name,
      affiliations: a.affiliations,
    })),
    year: result.year,
    journal: result.journal,
    venue: result.venue,
    abstract: result.abstract,
    citationCount: result.citationCount || 0,
    referenceCount: 0, // Not available in SearchResult
    sources: [result.source] as ('pubmed' | 'arxiv' | 'semanticscholar' | 'crossref' | 'europepmc' | 'core')[],
    openAccess: result.openAccess,
    pdfUrl: result.pdfUrl,
    inLibrary: false,
    read: false,
    starred: false,
  };
}

/**
 * Convert array of SearchResult to DiscoveredPaper
 */
export function toDiscoveredPapers(results: SearchResult[]): DiscoveredPaper[] {
  return results.map(toDiscoveredPaper);
}
