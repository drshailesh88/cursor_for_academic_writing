// Paper Processing Pipeline
// Main processing engine for extracting content from academic PDFs

import type {
  PaperSection,
  PaperFigure,
  PaperTable,
  PaperReference,
  PaperParagraph,
  PaperAuthor,
} from '@/lib/firebase/schema';
import { PDFProcessor } from './pdf-processor';
import type { ProcessedPaperResult, PDFProcessingOptions } from './types';

/**
 * Process a paper file through the complete pipeline
 * Main entry point for paper processing
 */
export async function processPaper(
  file: File | ArrayBuffer,
  fileName?: string,
  options?: Partial<PDFProcessingOptions>,
  onProgress?: (status: string, progress: number) => void
): Promise<ProcessedPaperResult> {
  // Convert File to ArrayBuffer if needed
  let buffer: ArrayBuffer;
  let name: string;

  if (file instanceof File) {
    name = file.name;
    buffer = await file.arrayBuffer();
  } else {
    buffer = file;
    name = fileName || 'document.pdf';
  }

  // Create processor instance with options
  const processor = new PDFProcessor(options);

  // Process the paper
  const result = await processor.processPaper(buffer, name, onProgress);

  return result;
}

/**
 * Extract text from PDF with OCR fallback
 * Uses pdf-parse as primary method, with OCR capability for scanned PDFs
 */
export async function extractText(
  buffer: ArrayBuffer,
  useOCR: boolean = false
): Promise<{ text: string; pageCount: number; metadata?: Record<string, any> }> {
  try {
    // Use PDFProcessor's internal extraction method
    const processor = new PDFProcessor({ ocrEnabled: useOCR });
    const result = await processor.processPaper(buffer, 'temp.pdf');

    return {
      text: result.fullText,
      pageCount: result.pageCount,
      metadata: {
        title: result.title,
        authors: result.authors,
        year: result.year,
        doi: result.doi,
      },
    };
  } catch (error) {
    console.error('Text extraction failed:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Identify sections in paper text
 * Detects standard academic sections: Abstract, Methods, Results, Discussion, etc.
 */
export function identifySections(text: string): PaperSection[] {
  const processor = new PDFProcessor();
  // Use the processor's internal method
  return (processor as any).identifySections(text);
}

/**
 * Create indexed paragraphs from sections
 * Each paragraph gets a unique ID and metadata for citation and search
 */
export function indexParagraphs(sections: PaperSection[]): PaperParagraph[] {
  const paragraphs: PaperParagraph[] = [];
  let order = 0;

  for (const section of sections) {
    // Handle subsections recursively
    const allSections = [section, ...(section.subsections || [])];

    for (const currentSection of allSections) {
      // Split content into paragraphs (double newline or significant spacing)
      const sectionParagraphs = currentSection.content
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter((p) => p.length > 50); // Filter out very short paragraphs

      for (const text of sectionParagraphs) {
        paragraphs.push({
          id: `para-${order}`,
          section: currentSection.type,
          subsection: currentSection !== section ? currentSection.title : undefined,
          text,
          order,
        });
        order++;
      }
    }
  }

  return paragraphs;
}

/**
 * Extract figures with captions from PDF
 * Identifies figure references and extracts associated captions
 */
export function extractFigures(
  text: string,
  rawFigures?: Array<{ pageNumber: number; caption?: string; imageData?: string }>
): PaperFigure[] {
  const figures: PaperFigure[] = [];

  // Pattern to match: "Figure 1:", "Fig. 1.", "Figure 1A:", etc.
  const figureRegex = /(?:Figure|Fig\.?)\s*(\d+[A-Z]?)[.:\s]*([^\n]+(?:\n(?!(?:Figure|Fig\.?)\s*\d)[^\n]+)*)/gi;
  let match;

  while ((match = figureRegex.exec(text)) !== null) {
    const figNumber = match[1];
    const caption = match[2].trim();

    // Try to match with raw figure data if available
    const rawFig = rawFigures?.find((f) => f.caption?.includes(figNumber));

    figures.push({
      id: `fig-${figNumber.toLowerCase()}`,
      figureNumber: figNumber,
      caption,
      imageUrl: rawFig?.imageData ? `data:image/png;base64,${rawFig.imageData}` : undefined,
      pageNumber: rawFig?.pageNumber,
    });
  }

  return figures;
}

/**
 * Extract tables as structured data from PDF
 * Identifies tables and attempts to parse them into structured format
 */
export function extractTables(
  text: string,
  rawTables?: Array<{ pageNumber: number; caption?: string; data: string[][] }>
): PaperTable[] {
  const tables: PaperTable[] = [];

  // Pattern to match: "Table 1:", "Table 1.", etc.
  const tableRegex = /(?:Table)\s*(\d+)[.:\s]*([^\n]+(?:\n(?!(?:Table)\s*\d)[^\n]+)*)/gi;
  let match;
  let tableIndex = 0;

  while ((match = tableRegex.exec(text)) !== null) {
    const tableNumber = match[1];
    const caption = match[2].trim();

    // Try to match with raw table data
    const rawTable = rawTables?.[tableIndex];

    tables.push({
      id: `table-${tableNumber}`,
      tableNumber,
      caption,
      headers: rawTable?.data?.[0] || [],
      rows: rawTable?.data?.slice(1) || [],
      pageNumber: rawTable?.pageNumber,
    });

    tableIndex++;
  }

  return tables;
}

/**
 * Parse reference list from paper
 * Extracts individual references with metadata (authors, title, DOI, etc.)
 */
export function parseReferences(text: string, sections?: PaperSection[]): PaperReference[] {
  const references: PaperReference[] = [];

  // Find the references section
  let referencesText = '';

  if (sections) {
    const referencesSection = sections.find((s) => s.type === 'references');
    if (referencesSection) {
      referencesText = referencesSection.content;
    }
  }

  // If no sections provided, try to find references in text
  if (!referencesText) {
    const refMatch = text.match(
      /(?:^|\n)\s*(?:references|bibliography|literature cited)\s*\n([\s\S]+?)(?:\n\s*(?:appendix|supplementary|$))/i
    );
    referencesText = refMatch?.[1] || '';
  }

  if (!referencesText) {
    return references;
  }

  // Try multiple parsing strategies

  // Strategy 1: Numbered references [1], (1), or 1.
  const numberedRegex = /(?:^|\n)\s*(?:\[(\d+)\]|\((\d+)\)|(\d+)\.)\s*([^\n]+(?:\n(?!\s*(?:\[\d+\]|\(\d+\)|\d+\.))[^\n]+)*)/g;
  let match;
  let refNum = 0;

  while ((match = numberedRegex.exec(referencesText)) !== null) {
    refNum = parseInt(match[1] || match[2] || match[3], 10) || refNum + 1;
    const fullText = match[4].trim();

    const reference = parseReferenceText(fullText, refNum);
    references.push(reference);
  }

  // Strategy 2: If no numbered refs found, try line-based (each line is a reference)
  if (references.length === 0) {
    const lines = referencesText.split('\n').filter((l) => l.trim().length > 30);

    lines.forEach((line, i) => {
      const reference = parseReferenceText(line.trim(), i + 1);
      references.push(reference);
    });
  }

  return references;
}

/**
 * Parse a single reference text into structured data
 */
function parseReferenceText(text: string, refNumber: number): PaperReference {
  // Extract DOI
  const doiMatch = text.match(/10\.\d{4,}\/[^\s,;.]+/);
  const doi = doiMatch ? doiMatch[0] : undefined;

  // Extract PMID
  const pmidMatch = text.match(/PMID:\s*(\d+)/i);
  const pmid = pmidMatch ? pmidMatch[1] : undefined;

  // Extract URL
  const urlMatch = text.match(/(https?:\/\/[^\s,;]+)/);
  const url = urlMatch ? urlMatch[1] : undefined;

  // Extract year
  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? parseInt(yearMatch[0], 10) : undefined;

  // Extract authors (very basic heuristic)
  const authors: string[] = [];

  // Look for author patterns: "LastName FM, LastName FM" or "LastName, F.M."
  const authorPattern = /([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+)?)\s*,?\s*([A-Z]\.?\s*[A-Z]?\.?)?/g;
  const matches = [...text.matchAll(authorPattern)].slice(0, 10); // Limit to first 10 potential authors

  for (const match of matches) {
    const name = match[0].trim();
    // Filter out obvious non-names (like journal names)
    if (name.length < 50 && !name.match(/^\d/) && !name.toLowerCase().includes('journal')) {
      authors.push(name);
    }
  }

  // Try to extract title (usually comes after authors, before journal)
  let title: string | undefined;
  const titleMatch = text.match(/\.\s+([A-Z][^.]+\.)/);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }

  return {
    id: `ref-${refNumber}`,
    referenceNumber: refNumber,
    text,
    authors: authors.length > 0 ? authors : undefined,
    title,
    year,
    doi,
    pmid,
    url,
  };
}

/**
 * Extract author information from paper text
 * Includes name parsing and affiliation detection
 */
export function extractAuthors(text: string, pdfAuthor?: string): PaperAuthor[] {
  const processor = new PDFProcessor();
  return (processor as any).extractAuthors(text, pdfAuthor);
}

/**
 * Extract abstract from paper text
 */
export function extractAbstract(text: string): string | undefined {
  const processor = new PDFProcessor();
  return (processor as any).extractAbstract(text);
}

/**
 * Extract keywords from paper text
 */
export function extractKeywords(text: string, pdfKeywords?: string): string[] | undefined {
  const processor = new PDFProcessor();
  return (processor as any).extractKeywords(text, pdfKeywords);
}

/**
 * Extract equations from paper (LaTeX format)
 */
export function extractEquations(text: string): string[] {
  const processor = new PDFProcessor();
  return (processor as any).extractEquations(text);
}

/**
 * Assess overall extraction quality
 */
export function assessExtractionQuality(
  text: string,
  sections: PaperSection[]
): 'high' | 'medium' | 'low' {
  const processor = new PDFProcessor();
  return (processor as any).assessQuality(text, sections);
}

/**
 * Batch process multiple papers
 */
export async function processPapers(
  files: File[],
  options?: Partial<PDFProcessingOptions>,
  onProgress?: (fileIndex: number, fileName: string, status: string, progress: number) => void
): Promise<ProcessedPaperResult[]> {
  const results: ProcessedPaperResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await processPaper(
      file,
      file.name,
      options,
      (status, progress) => {
        onProgress?.(i, file.name, status, progress);
      }
    );
    results.push(result);
  }

  return results;
}
