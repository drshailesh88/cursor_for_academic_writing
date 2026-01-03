// Paper Processing Types

import type {
  PaperAuthor,
  PaperSection,
  PaperFigure,
  PaperTable,
  PaperReference,
  PaperParagraph,
  PaperSectionType,
} from '@/lib/firebase/schema';

/**
 * Options for PDF processing
 */
export interface PDFProcessingOptions {
  extractFigures?: boolean;
  extractTables?: boolean;
  extractReferences?: boolean;
  parseEquations?: boolean;
  ocrEnabled?: boolean;
  provider?: 'llamaparse' | 'pdfparse' | 'auto';
}

/**
 * Default processing options
 */
export const DEFAULT_PROCESSING_OPTIONS: PDFProcessingOptions = {
  extractFigures: true,
  extractTables: true,
  extractReferences: true,
  parseEquations: true,
  ocrEnabled: true,
  provider: 'auto',
};

/**
 * Raw extraction result from PDF processor
 */
export interface RawExtractionResult {
  text: string;
  pageCount: number;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
  figures?: Array<{
    pageNumber: number;
    caption?: string;
    imageData?: string; // Base64
  }>;
  tables?: Array<{
    pageNumber: number;
    caption?: string;
    data: string[][];
  }>;
}

/**
 * Processed paper result
 */
export interface ProcessedPaperResult {
  // Basic info
  fileName: string;
  fileSize: number;
  pageCount: number;

  // Extracted metadata
  title: string;
  authors: PaperAuthor[];
  year?: number;
  journal?: string;
  doi?: string;
  abstract?: string;
  keywords?: string[];

  // Structured content
  fullText: string;
  sections: PaperSection[];
  paragraphs: PaperParagraph[];

  // Extracted elements
  figures: PaperFigure[];
  tables: PaperTable[];
  references: PaperReference[];
  equations?: string[];

  // Quality metrics
  extractionQuality: 'high' | 'medium' | 'low';
  ocrRequired: boolean;
  processingTimeMs: number;
}

/**
 * Section detection patterns
 */
export const SECTION_PATTERNS: Record<PaperSectionType, RegExp[]> = {
  title: [],
  abstract: [/^abstract$/i, /^summary$/i],
  introduction: [/^introduction$/i, /^background$/i, /^\d+\.?\s*introduction$/i],
  background: [/^background$/i, /^related\s+work$/i, /^literature\s+review$/i],
  literature_review: [/^literature\s+review$/i, /^related\s+work$/i, /^prior\s+work$/i],
  methods: [
    /^methods?$/i,
    /^methodology$/i,
    /^materials?\s+(and|&)\s+methods?$/i,
    /^experimental$/i,
    /^\d+\.?\s*methods?$/i,
  ],
  results: [/^results?$/i, /^findings$/i, /^\d+\.?\s*results?$/i],
  discussion: [/^discussion$/i, /^\d+\.?\s*discussion$/i],
  conclusion: [
    /^conclusions?$/i,
    /^concluding\s+remarks$/i,
    /^summary\s+(and|&)\s+conclusions?$/i,
    /^\d+\.?\s*conclusions?$/i,
  ],
  acknowledgments: [/^acknowledgm?ents?$/i, /^funding$/i],
  references: [/^references?$/i, /^bibliography$/i, /^citations?$/i, /^literature\s+cited$/i],
  appendix: [/^appendix/i, /^supplementary/i, /^supporting\s+information$/i],
  supplementary: [/^supplementary/i, /^supporting\s+information$/i, /^additional\s+data$/i],
  unknown: [],
};

/**
 * Metadata enrichment source
 */
export type EnrichmentSource = 'crossref' | 'pubmed' | 'semantic_scholar' | 'openalex';

/**
 * Enrichment result
 */
export interface EnrichmentResult {
  source: EnrichmentSource;
  doi?: string;
  pmid?: string;
  title?: string;
  authors?: PaperAuthor[];
  year?: number;
  journal?: string;
  abstract?: string;
  citationCount?: number;
  openAccess?: boolean;
  keywords?: string[];
  references?: string[];
}

/**
 * Processing progress event
 */
export interface ProcessingProgressEvent {
  paperId: string;
  status: string;
  progress: number;
  message?: string;
}

/**
 * Chunking configuration for embeddings
 */
export interface ChunkingConfig {
  strategy: 'fixed' | 'semantic' | 'section';
  chunkSize: number;
  chunkOverlap: number;
  minChunkSize: number;
  maxChunkSize: number;
}

/**
 * Default chunking configuration
 */
export const DEFAULT_CHUNKING_CONFIG: ChunkingConfig = {
  strategy: 'section',
  chunkSize: 512,
  chunkOverlap: 100,
  minChunkSize: 100,
  maxChunkSize: 1000,
};

/**
 * Paper chunk for embedding
 */
export interface PaperChunk {
  id: string;
  paperId: string;
  text: string;
  section: string;
  subsection?: string;
  pageNumber?: number;
  chunkIndex: number;
  tokenCount: number;
  metadata: {
    authors?: string[];
    year?: number;
    journal?: string;
  };
}
