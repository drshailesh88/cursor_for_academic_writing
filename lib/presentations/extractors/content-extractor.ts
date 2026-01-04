/**
 * Content Extraction System for Presentation Generator
 * Extracts structured data from academic documents for slide generation
 */

import {
  ContentExtraction,
  DocumentSection,
  KeyFinding,
  ExtractedCitation,
  DataPattern,
  ChartType,
} from '../types';

// ============================================================================
// REGEX PATTERNS
// ============================================================================

const PATTERNS = {
  percentage: /(\d+(?:\.\d+)?)\s*%/g,
  pValue: /p\s*[<>=]\s*0?\.?\d+/gi,
  sampleSize: /n\s*=\s*(\d+)/gi,
  confidenceInterval: /(\d+)%\s*CI/gi,
  effectSize: /(?:OR|RR|HR|d|r)\s*[=:]\s*(\d+\.?\d*)/gi,
  comparison: /(\d+(?:\.\d+)?)\s*(?:vs\.?|versus|compared to)\s*(\d+(?:\.\d+)?)/gi,
  increase: /(\d+(?:\.\d+)?)\s*%?\s*(?:increase|decrease|improvement|reduction|change)/gi,
};

// Match patterns like (Smith et al., 2023) or (Smith & Jones, 2024)
const CITATION_PATTERN = /\(([A-Z][a-z]+(?:\s+(?:et\s+al\.?|&\s+[A-Z][a-z]+))?),?\s*(\d{4})\)/g;

// Heading patterns for section detection
const HEADING_PATTERNS = {
  h1: /^#\s+(.+)$/gm,
  h2: /^##\s+(.+)$/gm,
  h3: /^###\s+(.+)$/gm,
  htmlH1: /<h1[^>]*>(.*?)<\/h1>/gi,
  htmlH2: /<h2[^>]*>(.*?)<\/h2>/gi,
  htmlH3: /<h3[^>]*>(.*?)<\/h3>/gi,
};

// Common academic section names
const SECTION_KEYWORDS = {
  abstract: ['abstract', 'summary', 'overview'],
  introduction: ['introduction', 'background'],
  methods: ['methods', 'methodology', 'materials', 'experimental'],
  results: ['results', 'findings'],
  discussion: ['discussion', 'interpretation'],
  conclusion: ['conclusion', 'conclusions', 'summary'],
};

// Key finding indicators
const FINDING_INDICATORS = [
  'significantly',
  'demonstrated',
  'showed',
  'found',
  'revealed',
  'indicated',
  'suggested',
  'observed',
  'identified',
  'discovered',
  'concluded',
  'associated with',
  'correlated with',
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Strip HTML tags and clean text
 */
export function cleanContent(html: string): string {
  // Remove HTML tags
  let text = html.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');

  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Extract title from content (first H1 or first line)
 */
export function extractTitle(content: string): string {
  // Try markdown H1
  const mdH1Match = content.match(/^#\s+(.+)$/m);
  if (mdH1Match) {
    return mdH1Match[1].trim();
  }

  // Try HTML H1
  const htmlH1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (htmlH1Match) {
    return cleanContent(htmlH1Match[1]);
  }

  // Fall back to first non-empty line
  const cleanText = cleanContent(content);
  const firstLine = cleanText.split('\n')[0];
  return firstLine.substring(0, 200).trim(); // Max 200 chars
}

/**
 * Calculate estimated reading time (assuming 200 words per minute)
 */
export function calculateReadingTime(wordCount: number): number {
  const wordsPerMinute = 200;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Extract statistical patterns (percentages, p-values, sample sizes, etc.)
 */
export function extractDataPatterns(text: string): DataPattern[] {
  const patterns: DataPattern[] = [];

  // Extract percentages
  let match;
  const percentageRegex = new RegExp(PATTERNS.percentage);
  while ((match = percentageRegex.exec(text)) !== null) {
    const contextStart = Math.max(0, match.index - 50);
    const contextEnd = Math.min(text.length, match.index + match[0].length + 50);

    patterns.push({
      type: 'percentage',
      value: match[0],
      context: text.substring(contextStart, contextEnd).trim(),
      position: { start: match.index, end: match.index + match[0].length },
    });
  }

  // Extract p-values
  const pValueRegex = new RegExp(PATTERNS.pValue);
  while ((match = pValueRegex.exec(text)) !== null) {
    const contextStart = Math.max(0, match.index - 50);
    const contextEnd = Math.min(text.length, match.index + match[0].length + 50);

    patterns.push({
      type: 'pValue',
      value: match[0],
      context: text.substring(contextStart, contextEnd).trim(),
      position: { start: match.index, end: match.index + match[0].length },
    });
  }

  // Extract sample sizes
  const sampleSizeRegex = new RegExp(PATTERNS.sampleSize);
  while ((match = sampleSizeRegex.exec(text)) !== null) {
    const contextStart = Math.max(0, match.index - 50);
    const contextEnd = Math.min(text.length, match.index + match[0].length + 50);

    patterns.push({
      type: 'sampleSize',
      value: match[0],
      context: text.substring(contextStart, contextEnd).trim(),
      position: { start: match.index, end: match.index + match[0].length },
    });
  }

  // Extract effect sizes
  const effectSizeRegex = new RegExp(PATTERNS.effectSize);
  while ((match = effectSizeRegex.exec(text)) !== null) {
    const contextStart = Math.max(0, match.index - 50);
    const contextEnd = Math.min(text.length, match.index + match[0].length + 50);

    patterns.push({
      type: 'effectSize',
      value: match[0],
      context: text.substring(contextStart, contextEnd).trim(),
      position: { start: match.index, end: match.index + match[0].length },
    });
  }

  // Extract comparisons
  const comparisonRegex = new RegExp(PATTERNS.comparison);
  while ((match = comparisonRegex.exec(text)) !== null) {
    const contextStart = Math.max(0, match.index - 50);
    const contextEnd = Math.min(text.length, match.index + match[0].length + 50);

    patterns.push({
      type: 'comparison',
      value: match[0],
      context: text.substring(contextStart, contextEnd).trim(),
      position: { start: match.index, end: match.index + match[0].length },
    });
  }

  // Extract trends (increase/decrease)
  const trendRegex = new RegExp(PATTERNS.increase);
  while ((match = trendRegex.exec(text)) !== null) {
    const contextStart = Math.max(0, match.index - 50);
    const contextEnd = Math.min(text.length, match.index + match[0].length + 50);

    patterns.push({
      type: 'trend',
      value: match[0],
      context: text.substring(contextStart, contextEnd).trim(),
      position: { start: match.index, end: match.index + match[0].length },
    });
  }

  return patterns;
}

/**
 * Extract citations from text (Author, Year format)
 */
export function extractCitations(text: string): ExtractedCitation[] {
  const citations: ExtractedCitation[] = [];
  const seen = new Set<string>();

  const citationRegex = new RegExp(CITATION_PATTERN);
  let match;

  while ((match = citationRegex.exec(text)) !== null) {
    const authors = match[1];
    const year = parseInt(match[2], 10);
    const inTextFormat = match[0];

    // Create unique ID
    const id = `${authors.toLowerCase().replace(/\s+/g, '-')}-${year}`;

    // Skip duplicates
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);

    // Parse authors
    const authorList: string[] = [];
    if (authors.includes('et al')) {
      const firstAuthor = authors.replace(/\s*et\s+al\.?/, '').trim();
      authorList.push(firstAuthor);
    } else if (authors.includes('&')) {
      const parts = authors.split('&').map(a => a.trim());
      authorList.push(...parts);
    } else {
      authorList.push(authors);
    }

    citations.push({
      id,
      authors: authorList,
      year,
      title: '', // Will be populated by AI or external lookup
      inTextFormat,
    });
  }

  return citations;
}

/**
 * Parse document sections from content
 */
export function parseSections(content: string): DocumentSection[] {
  const sections: DocumentSection[] = [];
  const cleanText = cleanContent(content);

  // Extract all headings with positions
  interface HeadingInfo {
    text: string;
    level: 1 | 2 | 3;
    position: number;
  }

  const headings: HeadingInfo[] = [];

  // Markdown headings
  let match;
  const h1Regex = /^#\s+(.+)$/gm;
  while ((match = h1Regex.exec(content)) !== null) {
    headings.push({
      text: match[1].trim(),
      level: 1,
      position: match.index,
    });
  }

  const h2Regex = /^##\s+(.+)$/gm;
  while ((match = h2Regex.exec(content)) !== null) {
    headings.push({
      text: match[1].trim(),
      level: 2,
      position: match.index,
    });
  }

  const h3Regex = /^###\s+(.+)$/gm;
  while ((match = h3Regex.exec(content)) !== null) {
    headings.push({
      text: match[1].trim(),
      level: 3,
      position: match.index,
    });
  }

  // HTML headings
  const htmlH1Regex = /<h1[^>]*>(.*?)<\/h1>/gi;
  while ((match = htmlH1Regex.exec(content)) !== null) {
    headings.push({
      text: cleanContent(match[1]),
      level: 1,
      position: match.index,
    });
  }

  const htmlH2Regex = /<h2[^>]*>(.*?)<\/h2>/gi;
  while ((match = htmlH2Regex.exec(content)) !== null) {
    headings.push({
      text: cleanContent(match[1]),
      level: 2,
      position: match.index,
    });
  }

  const htmlH3Regex = /<h3[^>]*>(.*?)<\/h3>/gi;
  while ((match = htmlH3Regex.exec(content)) !== null) {
    headings.push({
      text: cleanContent(match[1]),
      level: 3,
      position: match.index,
    });
  }

  // Sort by position
  headings.sort((a, b) => a.position - b.position);

  // If no headings found, create a single section
  if (headings.length === 0) {
    const dataPatterns = extractDataPatterns(cleanText);
    const citations = extractCitations(cleanText);

    sections.push({
      heading: 'Content',
      level: 1,
      content: cleanText,
      bulletPoints: extractBulletPoints(cleanText),
      hasData: dataPatterns.length > 0,
      dataPatterns,
      citations,
    });

    return sections;
  }

  // Extract content for each section
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const nextHeading = headings[i + 1];

    const startPos = heading.position;
    const endPos = nextHeading ? nextHeading.position : content.length;

    const sectionContent = content.substring(startPos, endPos);
    const sectionCleanText = cleanContent(sectionContent);

    const dataPatterns = extractDataPatterns(sectionCleanText);
    const citations = extractCitations(sectionCleanText);

    sections.push({
      heading: heading.text,
      level: heading.level,
      content: sectionCleanText,
      bulletPoints: extractBulletPoints(sectionCleanText),
      hasData: dataPatterns.length > 0,
      dataPatterns,
      citations,
    });
  }

  return sections;
}

/**
 * Extract bullet points from text
 */
function extractBulletPoints(text: string): string[] {
  const bullets: string[] = [];

  // Markdown bullets
  const mdBulletRegex = /^[\s]*[-*+]\s+(.+)$/gm;
  let match;

  while ((match = mdBulletRegex.exec(text)) !== null) {
    bullets.push(match[1].trim());
  }

  // HTML lists
  const htmlLiRegex = /<li[^>]*>(.*?)<\/li>/gi;
  while ((match = htmlLiRegex.exec(text)) !== null) {
    bullets.push(cleanContent(match[1]));
  }

  return bullets;
}

/**
 * Identify key findings using heuristics
 */
export function identifyKeyFindings(sections: DocumentSection[]): KeyFinding[] {
  const findings: KeyFinding[] = [];

  for (const section of sections) {
    // Skip if no data patterns
    if (!section.hasData) {
      continue;
    }

    // Split content into sentences
    const sentences = section.content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20);

    for (const sentence of sentences) {
      let confidence = 0;

      // Check for finding indicators
      const hasIndicator = FINDING_INDICATORS.some(indicator =>
        sentence.toLowerCase().includes(indicator)
      );

      if (hasIndicator) {
        confidence += 0.3;
      }

      // Check for data patterns in sentence
      const sentencePatterns = extractDataPatterns(sentence);
      if (sentencePatterns.length > 0) {
        confidence += 0.4;
      }

      // Check for citations
      const sentenceCitations = extractCitations(sentence);
      if (sentenceCitations.length > 0) {
        confidence += 0.2;
      }

      // Check if in results or conclusions section
      const sectionName = section.heading.toLowerCase();
      if (
        SECTION_KEYWORDS.results.some(kw => sectionName.includes(kw)) ||
        SECTION_KEYWORDS.conclusion.some(kw => sectionName.includes(kw))
      ) {
        confidence += 0.1;
      }

      // Only include if confidence threshold met
      if (confidence >= 0.4) {
        const citationRefs = sentenceCitations.map(c => c.inTextFormat);

        // Determine visualization potential
        let visualizationPotential: ChartType | null = null;

        if (sentencePatterns.some(p => p.type === 'comparison')) {
          visualizationPotential = 'bar';
        } else if (sentencePatterns.some(p => p.type === 'percentage')) {
          visualizationPotential = 'pie';
        } else if (sentencePatterns.some(p => p.type === 'trend')) {
          visualizationPotential = 'line';
        }

        findings.push({
          text: sentence,
          confidence,
          supportingData: sentencePatterns.map(p => p.value).join(', '),
          citations: citationRefs,
          visualizationPotential,
        });
      }
    }
  }

  // Sort by confidence and return top findings
  return findings
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10); // Top 10 findings
}

/**
 * Extract abstract from sections
 */
function extractAbstract(sections: DocumentSection[]): string {
  for (const section of sections) {
    const headingLower = section.heading.toLowerCase();
    if (SECTION_KEYWORDS.abstract.some(kw => headingLower.includes(kw))) {
      return section.content;
    }
  }

  // If no abstract section, use first section or first paragraph
  if (sections.length > 0) {
    const firstContent = sections[0].content;
    const firstParagraph = firstContent.split('\n\n')[0];
    return firstParagraph.substring(0, 500); // Max 500 chars
  }

  return '';
}

/**
 * Extract methodology section
 */
function extractMethodology(sections: DocumentSection[]): string {
  for (const section of sections) {
    const headingLower = section.heading.toLowerCase();
    if (SECTION_KEYWORDS.methods.some(kw => headingLower.includes(kw))) {
      return section.content;
    }
  }

  return '';
}

/**
 * Extract conclusions from sections
 */
function extractConclusions(sections: DocumentSection[]): string[] {
  const conclusions: string[] = [];

  for (const section of sections) {
    const headingLower = section.heading.toLowerCase();
    if (SECTION_KEYWORDS.conclusion.some(kw => headingLower.includes(kw))) {
      // Split into sentences and take key ones
      const sentences = section.content
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 30);

      conclusions.push(...sentences.slice(0, 5)); // Top 5 conclusion sentences
      break;
    }
  }

  return conclusions;
}

/**
 * Extract authors from content
 */
function extractAuthors(content: string): string[] {
  const authors: string[] = [];

  // Look for author patterns in first 1000 characters
  const header = content.substring(0, 1000);

  // Common patterns:
  // "By John Smith and Jane Doe"
  // "Authors: Smith, J., Doe, J."
  const byPattern = /(?:by|authors?:)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:and|,)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)*)/i;
  const match = header.match(byPattern);

  if (match) {
    const authorText = match[1];
    const authorList = authorText
      .split(/\s+and\s+|,\s*/)
      .map(a => a.trim())
      .filter(a => a.length > 0);

    authors.push(...authorList);
  }

  return authors;
}

// ============================================================================
// MAIN EXTRACTION FUNCTION
// ============================================================================

/**
 * Extract structured content from document for presentation generation
 *
 * @param content - Document content (plain text or HTML)
 * @param model - AI model to use for enhanced extraction (optional)
 * @returns ContentExtraction object with parsed document data
 */
export async function extractContent(
  content: string,
  model?: string
): Promise<ContentExtraction> {
  // Clean and prepare content
  const cleanText = cleanContent(content);

  // Extract basic metadata
  const title = extractTitle(content);
  const authors = extractAuthors(content);

  // Parse sections
  const sections = parseSections(content);

  // Extract abstract, methodology, conclusions
  const abstract = extractAbstract(sections);
  const methodology = extractMethodology(sections);
  const conclusions = extractConclusions(sections);

  // Identify key findings
  const keyFindings = identifyKeyFindings(sections);

  // Extract all citations
  const allCitations = extractCitations(cleanText);

  // Calculate word count and reading time
  const wordCount = cleanText.split(/\s+/).filter(w => w.length > 0).length;
  const estimatedReadingTime = calculateReadingTime(wordCount);

  // If model is provided, could enhance extraction with AI
  // This is a placeholder for future AI-enhanced extraction
  if (model) {
    // TODO: Use AI model to:
    // - Better identify key findings
    // - Extract more nuanced insights
    // - Suggest visualization opportunities
    // - Improve citation extraction
    console.log(`AI-enhanced extraction with model: ${model}`);
  }

  return {
    title,
    authors,
    abstract,
    sections,
    keyFindings,
    methodology,
    conclusions,
    citations: allCitations,
    wordCount,
    estimatedReadingTime,
  };
}
