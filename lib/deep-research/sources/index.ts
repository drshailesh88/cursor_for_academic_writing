// Deep Research - Sources Module
// Exports all search providers and the unified search service

// Types
export type {
  SearchQuery,
  SearchResults,
  SearchPaper,
  SearchFilters,
  SearchProvider,
} from './types';

// Base provider
export {
  BaseProvider,
  providerRegistry,
  registerProvider,
  getProvider,
  getAvailableProviders,
  type ProviderConfig,
} from './base-provider';

// Individual providers
export { PubMedProvider, pubmedProvider } from './pubmed-provider';
export { SemanticScholarProvider, semanticScholarProvider } from './semantic-scholar-provider';
export { ArxivProvider, arxivProvider } from './arxiv-provider';
export { CrossRefProvider, crossrefProvider } from './crossref-provider';
export { EuropePMCProvider, europePMCProvider } from './europe-pmc-provider';

// Unified search service
export {
  SearchService,
  searchService,
  type UnifiedSearchConfig,
  type UnifiedSearchResults,
} from './search-service';
