// PDF Processing Service
// Handles text extraction from academic papers

import type {
  PaperSection,
  PaperFigure,
  PaperTable,
  PaperReference,
  PaperParagraph,
  PaperSectionType,
  PaperAuthor,
} from '@/lib/supabase/schema';
import {
  type PDFProcessingOptions,
  type ProcessedPaperResult,
  type RawExtractionResult,
  type PDFProcessingError,
  type ProcessingWarning,
  DEFAULT_PROCESSING_OPTIONS,
  SECTION_PATTERNS,
} from './types';

/**
 * Custom error class for PDF processing
 */
export class PDFProcessingException extends Error {
  constructor(
    public readonly error: PDFProcessingError,
    message?: string
  ) {
    super(message || error.userMessage);
    this.name = 'PDFProcessingException';
  }
}

/**
 * PDF Processor Service
 *
 * Extracts text and structure from academic PDFs using multiple strategies.
 */
export class PDFProcessor {
  private options: PDFProcessingOptions;

  constructor(options: Partial<PDFProcessingOptions> = {}) {
    this.options = { ...DEFAULT_PROCESSING_OPTIONS, ...options };
  }

  /**
   * Process a PDF file and extract all content
   */
  async processPaper(
    fileBuffer: ArrayBuffer,
    fileName: string,
    onProgress?: (status: string, progress: number) => void
  ): Promise<ProcessedPaperResult> {
    const startTime = Date.now();
    const fileSize = fileBuffer.byteLength;
    const warnings: ProcessingWarning[] = [];

    onProgress?.('Starting extraction...', 0);

    // Edge Case 1: Check file size (50MB limit)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (fileSize > MAX_FILE_SIZE) {
      warnings.push({
        type: 'large_file',
        message: 'Large PDF file detected. Processing may be slow.',
        impact: 'medium',
      });
      onProgress?.('Processing large file...', 5);
    }

    // Step 1: Extract raw text
    onProgress?.('Extracting text...', 10);
    const rawResult = await this.extractText(fileBuffer);

    // Step 2: Detect if OCR is needed and check for scanned PDFs
    const textDensity = rawResult.text.length / Math.max(rawResult.pageCount, 1);
    const isScanned = this.isScannedPDF(rawResult.text, rawResult.pageCount);
    const ocrRequired = this.needsOCR(rawResult.text, rawResult.pageCount);

    if (isScanned) {
      warnings.push({
        type: 'low_text_density',
        message: `This appears to be a scanned PDF with low text density (${textDensity.toFixed(0)} chars/page). Text extraction may be incomplete.`,
        impact: 'high',
      });
    }

    if (ocrRequired && this.options.ocrEnabled) {
      onProgress?.('Performing OCR...', 20);
      // OCR would be performed here if enabled
      // For now, we work with what we have
    }

    // Step 3: Extract metadata from text
    onProgress?.('Extracting metadata...', 30);
    const metadata = this.extractMetadata(rawResult.text, rawResult.metadata);

    // Step 4: Identify sections
    onProgress?.('Identifying sections...', 40);
    const sections = this.identifySections(rawResult.text);

    // Step 5: Extract paragraphs
    onProgress?.('Indexing paragraphs...', 50);
    const paragraphs = this.extractParagraphs(sections);

    // Step 6: Extract figures
    let figures: PaperFigure[] = [];
    if (this.options.extractFigures) {
      onProgress?.('Extracting figures...', 60);
      figures = this.extractFigures(rawResult.text, rawResult.figures);
    }

    // Step 7: Extract tables
    let tables: PaperTable[] = [];
    if (this.options.extractTables) {
      onProgress?.('Extracting tables...', 70);
      tables = this.extractTables(rawResult.text, rawResult.tables);
    }

    // Step 8: Extract references
    let references: PaperReference[] = [];
    if (this.options.extractReferences) {
      onProgress?.('Parsing references...', 80);
      references = this.extractReferences(sections);
    }

    // Step 9: Extract equations
    let equations: string[] | undefined;
    if (this.options.parseEquations) {
      onProgress?.('Parsing equations...', 90);
      equations = this.extractEquations(rawResult.text);
    }

    // Check for missing metadata
    if (!metadata.abstract || metadata.authors.length === 0) {
      warnings.push({
        type: 'missing_metadata',
        message: 'Some metadata (abstract or authors) could not be extracted.',
        impact: 'low',
      });
    }

    // Check for poor structure
    if (sections.length < 3) {
      warnings.push({
        type: 'poor_structure',
        message: 'Document structure is unclear. Fewer than 3 sections identified.',
        impact: 'medium',
      });
    }

    onProgress?.('Complete', 100);

    const processingTimeMs = Date.now() - startTime;

    return {
      fileName,
      fileSize,
      pageCount: rawResult.pageCount,
      title: metadata.title,
      authors: metadata.authors,
      year: metadata.year,
      journal: metadata.journal,
      doi: metadata.doi,
      abstract: metadata.abstract,
      keywords: metadata.keywords,
      fullText: rawResult.text,
      sections,
      paragraphs,
      figures,
      tables,
      references,
      equations,
      extractionQuality: this.assessQuality(rawResult.text, sections),
      ocrRequired,
      isScanned,
      processingTimeMs,
      warnings: warnings.length > 0 ? warnings : undefined,
      textDensity,
    };
  }

  /**
   * Extract raw text from PDF using unpdf (serverless-compatible)
   */
  private async extractText(buffer: ArrayBuffer): Promise<RawExtractionResult> {
    try {
      // Dynamic import for server-side only
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { getDocumentProxy } = require('unpdf') as {
        getDocumentProxy: (data: Uint8Array) => Promise<{
          numPages: number;
          getPage: (num: number) => Promise<{
            getTextContent: () => Promise<{
              items: Array<{ str: string }>;
            }>;
          }>;
          getMetadata?: () => Promise<{
            info?: {
              Title?: string;
              Author?: string;
              Subject?: string;
              Keywords?: string;
              Creator?: string;
              Producer?: string;
            };
          }>;
        }>;
      };

      const uint8Array = new Uint8Array(buffer);
      const pdf = await getDocumentProxy(uint8Array);

      // Extract text from all pages
      const pages: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        pages.push(pageText);
      }

      // Try to get metadata
      let metadata: RawExtractionResult['metadata'] = {};
      try {
        if (pdf.getMetadata) {
          const meta = await pdf.getMetadata();
          metadata = {
            title: meta.info?.Title,
            author: meta.info?.Author,
            subject: meta.info?.Subject,
            keywords: meta.info?.Keywords,
            creator: meta.info?.Creator,
            producer: meta.info?.Producer,
          };
        }
      } catch {
        // Metadata extraction failed, continue without it
      }

      return {
        text: pages.join('\n\n').trim(),
        pageCount: pdf.numPages,
        metadata,
      };
    } catch (error) {
      console.error('PDF extraction failed:', error);

      // Detect specific error types
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';

      // Password protected PDF
      if (errorMessage.includes('password') || errorMessage.includes('encrypted')) {
        throw new PDFProcessingException({
          type: 'password_protected',
          message: 'PDF is password protected',
          userMessage: 'This PDF is password protected and cannot be processed.',
          suggestion: 'Please provide an unlocked version of this PDF.',
          recoverable: false,
        });
      }

      // Corrupted PDF
      if (
        errorMessage.includes('invalid') ||
        errorMessage.includes('corrupt') ||
        errorMessage.includes('damaged') ||
        errorMessage.includes('parse')
      ) {
        throw new PDFProcessingException({
          type: 'corrupted',
          message: 'PDF file appears to be corrupted',
          userMessage: 'This PDF file appears to be corrupted or damaged.',
          suggestion: 'Try re-downloading the PDF from the original source.',
          recoverable: false,
        });
      }

      // Generic extraction failure
      throw new PDFProcessingException({
        type: 'extraction_failed',
        message: 'Failed to extract text from PDF',
        userMessage: 'Unable to extract text from this PDF.',
        suggestion: 'This PDF may be in an unsupported format. Try converting it or using a different file.',
        recoverable: false,
      });
    }
  }

  /**
   * Check if OCR is needed based on text density
   */
  private needsOCR(text: string, pageCount: number): boolean {
    if (!text || pageCount === 0) return true;

    // Average characters per page for academic papers is ~3000-4000
    const charsPerPage = text.length / pageCount;
    return charsPerPage < 500; // Very low character count suggests scanned PDF
  }

  /**
   * Detect if PDF is scanned (image-based) with low extractable text
   */
  private isScannedPDF(text: string, pageCount: number): boolean {
    if (!text || pageCount === 0) return true;

    const MIN_CHARS_PER_PAGE = 100; // Threshold for scanned detection
    const charsPerPage = text.length / pageCount;

    // Very low text density suggests scanned document
    if (charsPerPage < MIN_CHARS_PER_PAGE) {
      return true;
    }

    // Check for garbled text (common in poor OCR or scanned docs)
    const garbledTextRatio = this.detectGarbledText(text);
    if (garbledTextRatio > 0.3) {
      // More than 30% garbled
      return true;
    }

    return false;
  }

  /**
   * Detect garbled or nonsensical text (common in scanned PDFs)
   */
  private detectGarbledText(text: string): number {
    if (!text || text.length === 0) return 1;

    // Sample first 1000 characters
    const sample = text.slice(0, 1000);
    let garbledCount = 0;
    let totalWords = 0;

    const words = sample.split(/\s+/).filter(Boolean);
    totalWords = words.length;

    for (const word of words) {
      // Check for excessive special characters
      const specialCharRatio = (word.match(/[^a-zA-Z0-9\s]/g) || []).length / word.length;
      if (specialCharRatio > 0.5) {
        garbledCount++;
      }

      // Check for random character sequences (no vowels)
      if (word.length > 5 && !/[aeiouAEIOU]/.test(word)) {
        garbledCount++;
      }
    }

    return totalWords > 0 ? garbledCount / totalWords : 0;
  }

  /**
   * Extract metadata from text and PDF metadata
   */
  private extractMetadata(
    text: string,
    pdfMetadata?: RawExtractionResult['metadata']
  ): {
    title: string;
    authors: PaperAuthor[];
    year?: number;
    journal?: string;
    doi?: string;
    abstract?: string;
    keywords?: string[];
  } {
    // Extract title (usually first line or from metadata)
    let title = pdfMetadata?.title || '';
    if (!title) {
      const firstLines = text.split('\n').slice(0, 5).filter(Boolean);
      title = firstLines[0]?.trim() || 'Untitled Paper';
    }

    // Extract authors
    const authors = this.extractAuthors(text, pdfMetadata?.author);

    // Extract year from text
    const yearMatch = text.match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? parseInt(yearMatch[0], 10) : undefined;

    // Extract DOI
    const doiMatch = text.match(/10\.\d{4,}\/[^\s]+/);
    const doi = doiMatch ? doiMatch[0].replace(/[.,;]$/, '') : undefined;

    // Extract abstract
    const abstract = this.extractAbstract(text);

    // Extract keywords
    const keywords = this.extractKeywords(text, pdfMetadata?.keywords);

    return {
      title: title.slice(0, 500), // Limit title length
      authors,
      year,
      doi,
      abstract,
      keywords,
    };
  }

  /**
   * Extract authors from text
   */
  private extractAuthors(text: string, pdfAuthor?: string): PaperAuthor[] {
    const authors: PaperAuthor[] = [];

    // Try PDF metadata first
    if (pdfAuthor) {
      const names = pdfAuthor.split(/[,;&]/).map((n) => n.trim()).filter(Boolean);
      names.forEach((name) => {
        const parts = name.split(' ').filter(Boolean);
        authors.push({
          name,
          firstName: parts[0],
          lastName: parts[parts.length - 1],
        });
      });
    }

    // If no authors from metadata, try to extract from text
    if (authors.length === 0) {
      // Look for author patterns (names followed by affiliations with superscripts)
      const authorSection = text.slice(0, 2000); // Authors usually in first part
      const lines = authorSection.split('\n');

      for (let i = 1; i < Math.min(10, lines.length); i++) {
        const line = lines[i]?.trim();
        if (!line) continue;

        // Skip if it looks like an abstract or section header
        if (/^(abstract|introduction|summary)/i.test(line)) break;

        // Simple heuristic: lines with multiple capitalized words might be authors
        const hasMultipleCaps = (line.match(/[A-Z][a-z]+/g) || []).length >= 2;
        const noNumbers = !/^\d/.test(line);
        const shortEnough = line.length < 200;

        if (hasMultipleCaps && noNumbers && shortEnough) {
          const potentialNames = line.split(/[,;&]/).map((n) => n.trim()).filter(Boolean);
          potentialNames.forEach((name) => {
            // Filter out obvious non-names
            if (name.length > 5 && name.length < 50 && /^[A-Z]/.test(name)) {
              const parts = name.split(' ').filter(Boolean);
              if (parts.length >= 2 && parts.length <= 5) {
                authors.push({
                  name,
                  firstName: parts[0],
                  lastName: parts[parts.length - 1],
                });
              }
            }
          });
          if (authors.length > 0) break;
        }
      }
    }

    return authors.slice(0, 20); // Limit to 20 authors
  }

  /**
   * Extract abstract from text
   */
  private extractAbstract(text: string): string | undefined {
    // Look for abstract section
    const abstractMatch = text.match(
      /(?:^|\n)\s*abstract\s*[:\n]([\s\S]+?)(?=\n\s*(?:introduction|keywords|background|1\.|$))/i
    );

    if (abstractMatch) {
      return abstractMatch[1].trim().slice(0, 3000);
    }

    // If no explicit abstract, try to use first paragraph
    const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 100);
    if (paragraphs.length > 1) {
      return paragraphs[1]?.trim().slice(0, 3000);
    }

    return undefined;
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string, pdfKeywords?: string): string[] | undefined {
    const keywords: string[] = [];

    // From PDF metadata
    if (pdfKeywords) {
      keywords.push(...pdfKeywords.split(/[,;]/).map((k) => k.trim()).filter(Boolean));
    }

    // Look for keywords section in text
    const keywordsMatch = text.match(
      /(?:^|\n)\s*keywords?\s*[:]\s*([\s\S]+?)(?=\n\s*(?:introduction|1\.|$))/i
    );

    if (keywordsMatch) {
      const found = keywordsMatch[1].split(/[,;]/).map((k) => k.trim()).filter(Boolean);
      keywords.push(...found);
    }

    return keywords.length > 0 ? [...new Set(keywords)].slice(0, 10) : undefined;
  }

  /**
   * Identify sections in the text
   */
  private identifySections(text: string): PaperSection[] {
    const sections: PaperSection[] = [];
    const lines = text.split('\n');

    let currentSection: PaperSection | null = null;
    let currentContent: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Check if this line is a section header
      const sectionType = this.detectSectionType(trimmedLine);

      if (sectionType && sectionType !== 'unknown') {
        // Save previous section
        if (currentSection) {
          currentSection.content = currentContent.join('\n').trim();
          sections.push(currentSection);
        }

        // Start new section
        currentSection = {
          type: sectionType,
          title: trimmedLine,
          content: '',
        };
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      } else {
        // Content before first section (usually title/authors)
        // We could create a 'title' section here
      }
    }

    // Add last section
    if (currentSection) {
      currentSection.content = currentContent.join('\n').trim();
      sections.push(currentSection);
    }

    // If no sections found, create one for the whole text
    if (sections.length === 0) {
      sections.push({
        type: 'unknown',
        title: 'Full Text',
        content: text,
      });
    }

    return sections;
  }

  /**
   * Detect section type from header text
   */
  private detectSectionType(headerText: string): PaperSectionType | null {
    const cleaned = headerText.replace(/^\d+\.?\s*/, '').trim();

    for (const [sectionType, patterns] of Object.entries(SECTION_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(cleaned)) {
          return sectionType as PaperSectionType;
        }
      }
    }

    // Check if it looks like a header (short, capitalized)
    if (cleaned.length > 2 && cleaned.length < 100 && /^[A-Z]/.test(cleaned)) {
      return 'unknown';
    }

    return null;
  }

  /**
   * Extract paragraphs from sections
   */
  private extractParagraphs(sections: PaperSection[]): PaperParagraph[] {
    const paragraphs: PaperParagraph[] = [];
    let order = 0;

    for (const section of sections) {
      // Split content into paragraphs
      const sectionParagraphs = section.content
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter((p) => p.length > 50);

      for (const text of sectionParagraphs) {
        paragraphs.push({
          id: `para-${order}`,
          section: section.type,
          text,
          order,
        });
        order++;
      }
    }

    return paragraphs;
  }

  /**
   * Extract figures from text
   */
  private extractFigures(
    text: string,
    rawFigures?: RawExtractionResult['figures']
  ): PaperFigure[] {
    const figures: PaperFigure[] = [];

    // Find figure captions in text
    const figureRegex = /(?:Figure|Fig\.?)\s*(\d+)[.:\s]*([^\n]+(?:\n(?!(?:Figure|Fig\.?)\s*\d)[^\n]+)*)/gi;
    let match;

    while ((match = figureRegex.exec(text)) !== null) {
      figures.push({
        id: `fig-${match[1]}`,
        figureNumber: match[1],
        caption: match[2].trim(),
      });
    }

    return figures;
  }

  /**
   * Extract tables from text
   */
  private extractTables(
    text: string,
    rawTables?: RawExtractionResult['tables']
  ): PaperTable[] {
    const tables: PaperTable[] = [];

    // Find table captions in text
    const tableRegex = /(?:Table)\s*(\d+)[.:\s]*([^\n]+(?:\n(?!(?:Table)\s*\d)[^\n]+)*)/gi;
    let match;

    while ((match = tableRegex.exec(text)) !== null) {
      tables.push({
        id: `table-${match[1]}`,
        tableNumber: match[1],
        caption: match[2].trim(),
        headers: [],
        rows: [],
      });
    }

    // If we have raw table data, use it
    if (rawTables) {
      rawTables.forEach((rt, i) => {
        if (tables[i]) {
          tables[i].headers = rt.data[0] || [];
          tables[i].rows = rt.data.slice(1);
        }
      });
    }

    return tables;
  }

  /**
   * Extract references from the references section
   */
  private extractReferences(sections: PaperSection[]): PaperReference[] {
    const references: PaperReference[] = [];

    const referencesSection = sections.find((s) => s.type === 'references');
    if (!referencesSection) return references;

    // Split by reference numbers or line breaks
    const refRegex = /(?:^|\n)\s*(?:\[(\d+)\]|\((\d+)\)|(\d+)\.)\s*([^\n]+(?:\n(?!\s*(?:\[\d+\]|\(\d+\)|\d+\.))[^\n]+)*)/g;
    let match;
    let refNum = 0;

    while ((match = refRegex.exec(referencesSection.content)) !== null) {
      refNum = parseInt(match[1] || match[2] || match[3], 10) || refNum + 1;
      const text = match[4].trim();

      // Try to extract DOI
      const doiMatch = text.match(/10\.\d{4,}\/[^\s]+/);

      references.push({
        id: `ref-${refNum}`,
        referenceNumber: refNum,
        text,
        doi: doiMatch ? doiMatch[0].replace(/[.,;]$/, '') : undefined,
      });
    }

    // If regex didn't work, try line-based splitting
    if (references.length === 0) {
      const lines = referencesSection.content.split('\n').filter((l) => l.trim().length > 20);
      lines.forEach((line, i) => {
        references.push({
          id: `ref-${i + 1}`,
          referenceNumber: i + 1,
          text: line.trim(),
        });
      });
    }

    return references;
  }

  /**
   * Extract LaTeX equations from text
   */
  private extractEquations(text: string): string[] {
    const equations: string[] = [];

    // Look for inline math: $...$ or \(...\)
    const inlineRegex = /\$([^$]+)\$|\\\(([^)]+)\\\)/g;
    let match;
    while ((match = inlineRegex.exec(text)) !== null) {
      equations.push(match[1] || match[2]);
    }

    // Look for display math: $$...$$ or \[...\]
    const displayRegex = /\$\$([^$]+)\$\$|\\\[([^\]]+)\\\]/g;
    while ((match = displayRegex.exec(text)) !== null) {
      equations.push(match[1] || match[2]);
    }

    return [...new Set(equations)]; // Remove duplicates
  }

  /**
   * Assess extraction quality
   */
  private assessQuality(
    text: string,
    sections: PaperSection[]
  ): 'high' | 'medium' | 'low' {
    // Check various quality indicators
    const hasAbstract = sections.some((s) => s.type === 'abstract');
    const hasIntro = sections.some((s) => s.type === 'introduction');
    const hasMethods = sections.some((s) => s.type === 'methods');
    const hasResults = sections.some((s) => s.type === 'results');
    const hasRefs = sections.some((s) => s.type === 'references');
    const hasReasonableLength = text.length > 5000;

    const sectionCount = [hasAbstract, hasIntro, hasMethods, hasResults, hasRefs].filter(
      Boolean
    ).length;

    if (sectionCount >= 4 && hasReasonableLength) {
      return 'high';
    } else if (sectionCount >= 2) {
      return 'medium';
    } else {
      return 'low';
    }
  }
}

// Singleton instance
export const pdfProcessor = new PDFProcessor();
