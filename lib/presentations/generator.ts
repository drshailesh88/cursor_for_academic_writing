/**
 * Presentation Generator Orchestrator
 * Main entry point for generating academic presentations from documents
 */

import {
  GenerationConfig,
  GenerationOptions,
  PresentationFormat,
  PresentationStructure,
  Slide,
  SlideType,
  LayoutType,
  SlideContent,
  BulletPoint,
  ContentExtraction,
  DocumentSection,
  ExtractedCitation,
  VisualizationOpportunity,
  SlideBlueprint,
  SlideSection,
  FORMAT_SLIDE_TARGETS,
  ChartType,
  CitationReference,
  Presentation,
  DEFAULT_PRESENTATION_SETTINGS,
} from './types';

import { extractContent } from './extractors/content-extractor';
import { detectVisualizations } from './analyzers/visualization-detector';
import { Timestamp } from 'firebase/firestore';

// ============================================================================
// GENERATION METADATA
// ============================================================================

export interface GenerationMetadata {
  generationTime: number;
  sourceWordCount: number;
  slidesGenerated: number;
  visualizationsDetected: number;
  citationsFound: number;
  model?: string;
}

// For backwards compatibility
export interface GenerationResult {
  slides: Slide[];
  metadata: GenerationMetadata;
}

// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================

/**
 * Generate a complete presentation from a configuration
 *
 * @param config - Generation configuration including source, format, and options
 * @param sourceContent - Optional source content (overrides config.sourceText)
 * @returns Generated slides and metadata
 */
export async function generatePresentation(
  config: GenerationConfig,
  sourceContent?: string
): Promise<{ slides: Slide[]; metadata: GenerationMetadata }> {
  const startTime = Date.now();

  // Step 1: Extract content from source
  let sourceText = '';

  // Use provided sourceContent, or fall back to config
  if (sourceContent) {
    sourceText = sourceContent;
  } else if (config.source === 'text' && config.sourceText) {
    sourceText = config.sourceText;
  } else if (config.source === 'document' && config.sourceId) {
    // TODO: Fetch document from Firestore
    throw new Error('Document source not yet implemented');
  } else if (config.source === 'topic') {
    // TODO: Generate content from topic using AI
    throw new Error('Topic-based generation not yet implemented');
  }

  const extraction = await extractContent(sourceText, config.model);

  // Step 2: Detect visualization opportunities
  const allDataPatterns = extraction.sections.flatMap(s => s.dataPatterns);
  const visualizations = await detectVisualizations(sourceText, allDataPatterns);

  // Step 3: Plan slide structure based on format
  const structure = planSlideStructure(extraction, config.format, config.options);

  // Step 4: Generate slides
  const slides: Slide[] = [];
  let order = 0;

  // Title slide
  const titleSlide = generateTitleSlide(extraction);
  titleSlide.order = order++;
  slides.push(titleSlide);

  // Outline/Agenda slide (for longer presentations)
  const targets = FORMAT_SLIDE_TARGETS[config.format];
  if (targets.max > 10 && extraction.sections.length > 3) {
    const outlineSlide = generateOutlineSlide(extraction.sections);
    outlineSlide.order = order++;
    slides.push(outlineSlide);
  }

  // Generate content slides section by section
  for (let i = 0; i < extraction.sections.length; i++) {
    const section = extraction.sections[i];

    // Add section divider for lectures (except first section)
    if (config.format === 'lecture' && i > 0 && section.level === 1) {
      const divider = generateSectionDivider(section.heading, i + 1);
      divider.order = order++;
      slides.push(divider);
    }

    // Generate content slide(s) for this section
    const sectionSlides = generateSectionSlides(
      section,
      config.format,
      config.options
    );

    for (const slide of sectionSlides) {
      slide.order = order++;
      slides.push(slide);
    }

    // Add visualization slides if this section has data
    if (section.hasData && config.options.generateVisualizations) {
      const sectionVisualizations = visualizations.filter(v => {
        // Check if visualization position falls within this section's content
        return sourceText.indexOf(section.content) <= v.position.start &&
               v.position.end <= sourceText.indexOf(section.content) + section.content.length;
      });

      if (sectionVisualizations.length > 0) {
        // Take top 1-2 visualizations per section
        const topViz = sectionVisualizations.slice(0, config.format === 'lecture' ? 2 : 1);
        const dataSlides = generateDataSlides(topViz);

        for (const slide of dataSlides) {
          slide.order = order++;
          slides.push(slide);
        }
      }
    }
  }

  // Conclusion/Key Findings slide
  if (extraction.keyFindings.length > 0 && config.options.emphasizeFindings) {
    const conclusionSlide = generateConclusionSlide(extraction);
    conclusionSlide.order = order++;
    slides.push(conclusionSlide);
  }

  // References slide
  if (config.options.includeAllCitations && extraction.citations.length > 0) {
    const referencesSlide = generateReferencesSlide(extraction.citations);
    referencesSlide.order = order++;
    slides.push(referencesSlide);
  }

  // Q&A slide
  const qaSlide = generateQASlide();
  qaSlide.order = order++;
  slides.push(qaSlide);

  // Step 5: Optimize slide count to fit format targets
  const optimizedSlides = optimizeSlidesToTarget(
    slides,
    config.format,
    config.options.targetSlideCount
  );

  // Step 6: Generate metadata
  const metadata: GenerationMetadata = {
    generationTime: Date.now() - startTime,
    sourceWordCount: extraction.wordCount,
    slidesGenerated: optimizedSlides.length,
    visualizationsDetected: visualizations.length,
    citationsFound: extraction.citations.length,
    model: config.model,
  };

  return {
    slides: optimizedSlides,
    metadata,
  };
}

// ============================================================================
// SLIDE STRUCTURE PLANNING
// ============================================================================

/**
 * Analyze document structure and plan slides based on format
 */
export function planSlideStructure(
  extraction: ContentExtraction,
  format: PresentationFormat,
  options: GenerationOptions
): PresentationStructure {
  const targets = FORMAT_SLIDE_TARGETS[format];
  const sections: SlideSection[] = [];

  // Introduction section
  const introBlueprints: SlideBlueprint[] = [
    {
      type: 'title',
      layout: 'centered',
      contentSource: 'title',
      suggestedTitle: extraction.title,
      estimatedTime: 30,
      priority: 'essential',
    },
  ];

  if (extraction.abstract) {
    introBlueprints.push({
      type: 'content',
      layout: 'full',
      contentSource: 'abstract',
      suggestedTitle: 'Overview',
      estimatedTime: format === 'conference' ? 60 : 90,
      priority: 'essential',
    });
  }

  sections.push({
    name: 'Introduction',
    slides: introBlueprints,
  });

  // Content sections
  for (const section of extraction.sections) {
    const blueprints: SlideBlueprint[] = [];

    blueprints.push({
      type: 'content',
      layout: 'full',
      contentSource: section.heading,
      suggestedTitle: section.heading,
      estimatedTime: section.content.length > 500 ? 120 : 60,
      priority: section.hasData ? 'essential' : 'important',
    });

    // Add visualization if section has data
    if (section.hasData && options.generateVisualizations) {
      blueprints.push({
        type: 'data-visualization',
        layout: 'full',
        contentSource: section.heading,
        suggestedTitle: `${section.heading} - Data`,
        estimatedTime: 90,
        priority: 'important',
        visualizationType: 'bar' as ChartType,
      });
    }

    sections.push({
      name: section.heading,
      slides: blueprints,
    });
  }

  // Conclusion section
  const conclusionBlueprints: SlideBlueprint[] = [];

  if (extraction.keyFindings.length > 0) {
    conclusionBlueprints.push({
      type: 'content',
      layout: 'full',
      contentSource: 'conclusions',
      suggestedTitle: 'Key Findings',
      estimatedTime: 90,
      priority: 'essential',
    });
  }

  if (options.includeAllCitations) {
    conclusionBlueprints.push({
      type: 'references',
      layout: 'full',
      contentSource: 'citations',
      suggestedTitle: 'References',
      estimatedTime: 30,
      priority: 'optional',
    });
  }

  conclusionBlueprints.push({
    type: 'qa',
    layout: 'centered',
    contentSource: 'qa',
    suggestedTitle: 'Questions?',
    estimatedTime: 30,
    priority: 'essential',
  });

  sections.push({
    name: 'Conclusion',
    slides: conclusionBlueprints,
  });

  // Calculate totals
  const totalSlides = sections.reduce((sum, s) => sum + s.slides.length, 0);
  const totalTime = sections.reduce(
    (sum, s) => sum + s.slides.reduce((t, slide) => t + slide.estimatedTime, 0),
    0
  );

  // Determine content density
  let contentDensity: 'light' | 'medium' | 'dense' = 'medium';
  if (totalSlides < targets.min) {
    contentDensity = 'light';
  } else if (totalSlides > targets.max) {
    contentDensity = 'dense';
  }

  return {
    totalSlides,
    sections,
    suggestedDuration: Math.round(totalTime / 60),
    contentDensity,
  };
}

// ============================================================================
// SLIDE GENERATORS
// ============================================================================

/**
 * Generate a title slide
 */
export function generateTitleSlide(extraction: ContentExtraction): Slide {
  return {
    id: generateSlideId(),
    type: 'title',
    layout: 'centered',
    content: {
      title: extraction.title,
      subtitle: extraction.abstract.substring(0, 200),
      author: extraction.authors.join(', ') || 'Author',
      institution: '',
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    },
    speakerNotes: `Opening slide. Introduce yourself and the topic. Estimated time: 30 seconds.`,
    order: 0,
  };
}

/**
 * Generate outline/agenda slide
 */
function generateOutlineSlide(sections: DocumentSection[]): Slide {
  const bullets = sections
    .filter(s => s.level === 1)
    .slice(0, 8)
    .map(s => ({
      text: s.heading,
      level: 0 as 0 | 1 | 2,
    }));

  return {
    id: generateSlideId(),
    type: 'content',
    layout: 'full',
    content: {
      title: 'Outline',
      bullets,
    },
    speakerNotes: 'Provide overview of presentation structure.',
    order: 0,
  };
}

/**
 * Generate content slides from sections
 */
export function generateContentSlides(
  sections: DocumentSection[],
  maxSlides: number
): Slide[] {
  const slides: Slide[] = [];

  for (const section of sections.slice(0, maxSlides)) {
    let bullets: BulletPoint[] = [];

    // Use existing bullet points if available
    if (section.bulletPoints.length > 0) {
      bullets = section.bulletPoints.slice(0, 6).map(text => ({
        text,
        level: 0 as 0 | 1 | 2,
      }));
    } else {
      // Convert section content to bullets
      bullets = textToBullets(section.content);
    }

    const contentSlide: Slide = {
      id: generateSlideId(),
      type: 'content',
      layout: 'full',
      content: {
        title: section.heading,
        bullets,
      },
      speakerNotes: `Cover key points from ${section.heading}. ${
        section.hasData ? 'Highlight data findings.' : ''
      }`,
      order: 0,
    };

    slides.push(contentSlide);
  }

  return slides;
}

/**
 * Generate content slides from a single section (with split support)
 */
function generateSectionSlides(
  section: DocumentSection,
  format: PresentationFormat,
  options: GenerationOptions
): Slide[] {
  const slides: Slide[] = [];

  // Main content slide
  let bullets: BulletPoint[] = [];

  // Use existing bullet points if available
  if (section.bulletPoints.length > 0) {
    bullets = section.bulletPoints.slice(0, 6).map(text => ({
      text,
      level: 0 as 0 | 1 | 2,
    }));
  } else {
    // Convert section content to bullets
    bullets = textToBullets(section.content);
  }

  const contentSlide: Slide = {
    id: generateSlideId(),
    type: 'content',
    layout: 'full',
    content: {
      title: section.heading,
      bullets: bullets.slice(0, 6),
    },
    speakerNotes: `Cover key points from ${section.heading}. ${
      section.hasData ? 'Highlight data findings.' : ''
    }`,
    order: 0,
  };

  slides.push(contentSlide);

  // For lecture format, split long sections into multiple slides
  if (format === 'lecture' && bullets.length > 6) {
    const secondSlide: Slide = {
      id: generateSlideId(),
      type: 'content',
      layout: 'full',
      content: {
        title: `${section.heading} (cont.)`,
        bullets: bullets.slice(6, 12).map(b => ({ ...b })),
      },
      speakerNotes: `Continue discussing ${section.heading}.`,
      order: 0,
    };
    slides.push(secondSlide);
  }

  return slides;
}

/**
 * Generate data visualization slides
 */
export function generateDataSlides(
  opportunities: VisualizationOpportunity[]
): Slide[] {
  const slides: Slide[] = [];

  for (const opp of opportunities) {
    // Only generate slides for high-confidence opportunities
    if (opp.confidence < 0.5) {
      continue;
    }

    const slide: Slide = {
      id: generateSlideId(),
      type: 'data-visualization',
      layout: 'full',
      content: {
        title: extractTitleFromText(opp.sourceText),
      },
      speakerNotes: `Discuss data visualization. Source: ${opp.sourceText.substring(0, 100)}...`,
      order: 0,
    };

    // Add chart config if available
    if (opp.type !== 'flowchart' && opp.type !== 'table') {
      slide.content.chart = opp.suggestedConfig as any;
    } else if (opp.type === 'table') {
      slide.content.table = opp.suggestedConfig as any;
    } else if (opp.type === 'flowchart') {
      slide.content.flowchart = opp.suggestedConfig as any;
    }

    slides.push(slide);
  }

  return slides;
}

/**
 * Generate conclusion/key findings slide
 */
function generateConclusionSlide(extraction: ContentExtraction): Slide {
  const bullets: BulletPoint[] = [];

  // Add key findings
  for (const finding of extraction.keyFindings.slice(0, 5)) {
    bullets.push({
      text: finding.text,
      level: 0,
    });

    // Add supporting data as sub-bullet
    if (finding.supportingData) {
      bullets.push({
        text: `Data: ${finding.supportingData}`,
        level: 1,
      });
    }
  }

  // Add conclusion statements
  for (const conclusion of extraction.conclusions.slice(0, 3)) {
    bullets.push({
      text: conclusion,
      level: 0,
    });
  }

  return {
    id: generateSlideId(),
    type: 'content',
    layout: 'full',
    content: {
      title: 'Key Findings & Conclusions',
      bullets: bullets.slice(0, 8),
    },
    speakerNotes: 'Summarize main findings and conclusions. Emphasize clinical/practical implications.',
    order: 0,
  };
}

/**
 * Generate references slide
 */
export function generateReferencesSlide(
  citations: ExtractedCitation[]
): Slide {
  // Convert to CitationReference format
  const citationRefs: CitationReference[] = citations.slice(0, 10).map(c => ({
    id: c.id,
    authors: c.authors.join(', '),
    year: c.year,
    title: c.title || 'Title unavailable',
    journal: c.journal,
    formatted: formatCitation(c),
  }));

  return {
    id: generateSlideId(),
    type: 'references',
    layout: 'full',
    content: {
      title: 'References',
      citations: citationRefs,
    },
    speakerNotes: 'Key references cited in this presentation.',
    order: 0,
  };
}

/**
 * Generate section divider slide
 */
export function generateSectionDivider(
  sectionName: string,
  sectionNumber: number
): Slide {
  return {
    id: generateSlideId(),
    type: 'section-divider',
    layout: 'centered',
    content: {
      title: sectionName,
      sectionNumber,
    },
    speakerNotes: `Transition to ${sectionName} section.`,
    order: 0,
    backgroundColor: '#8b5cf6', // Academic purple
  };
}

/**
 * Generate Q&A slide
 */
function generateQASlide(): Slide {
  return {
    id: generateSlideId(),
    type: 'qa',
    layout: 'centered',
    content: {
      title: 'Questions?',
      subtitle: 'Thank you for your attention',
    },
    speakerNotes: 'Open floor for questions and discussion.',
    order: 0,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert text to bullet points
 */
export function textToBullets(text: string): BulletPoint[] {
  const bullets: BulletPoint[] = [];

  // Split into sentences
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 200);

  // Take top 6 sentences as bullets
  for (const sentence of sentences.slice(0, 6)) {
    bullets.push({
      text: sentence.charAt(0).toUpperCase() + sentence.slice(1),
      level: 0,
    });
  }

  // If too few bullets, split first sentence into multiple points
  if (bullets.length < 3 && text.length > 200) {
    const phrases = text.split(/[,;]/).map(p => p.trim()).filter(p => p.length > 15);

    for (const phrase of phrases.slice(0, 5)) {
      bullets.push({
        text: phrase.charAt(0).toUpperCase() + phrase.slice(1),
        level: 0,
      });
    }
  }

  return bullets.slice(0, 6); // Max 6 bullets per slide
}

/**
 * Generate unique slide ID
 */
export function generateSlideId(): string {
  return `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract a concise title from text (first clause or sentence)
 */
function extractTitleFromText(text: string): string {
  // Try to find first sentence or clause
  const match = text.match(/^[^.!?,;]+/);
  if (match) {
    const title = match[0].trim();
    return title.length > 60 ? title.substring(0, 60) + '...' : title;
  }
  return 'Data Visualization';
}

/**
 * Format a citation in academic style
 */
function formatCitation(citation: ExtractedCitation): string {
  const authors = citation.authors.length > 3
    ? `${citation.authors[0]} et al.`
    : citation.authors.join(', ');

  const title = citation.title || 'Title unavailable';
  const journal = citation.journal ? ` ${citation.journal}.` : '';
  const doi = citation.doi ? ` DOI: ${citation.doi}` : '';

  return `${authors} (${citation.year}). ${title}.${journal}${doi}`;
}

/**
 * Optimize slides to fit target count for format
 */
function optimizeSlidesToTarget(
  slides: Slide[],
  format: PresentationFormat,
  targetCount?: number
): Slide[] {
  const targets = FORMAT_SLIDE_TARGETS[format];
  const target = targetCount || targets.max;

  // If within range, return as-is
  if (slides.length >= targets.min && slides.length <= targets.max) {
    return slides;
  }

  // If too many slides, prioritize and remove optional ones
  if (slides.length > target) {
    // Keep essential slides (title, qa, key content)
    const essential = slides.filter(s =>
      s.type === 'title' ||
      s.type === 'qa' ||
      s.type === 'section-divider' ||
      (s.type === 'content' && s.content.title?.toLowerCase().includes('finding'))
    );

    const optional = slides.filter(s => !essential.includes(s));

    // Add optional slides until we reach target
    const toAdd = Math.max(0, target - essential.length);
    const optimized = [...essential, ...optional.slice(0, toAdd)];

    // Re-sort by original order
    return optimized.sort((a, b) => a.order - b.order).map((s, i) => ({
      ...s,
      order: i,
    }));
  }

  // If too few slides, add more detail slides (split content)
  // For now, just return what we have
  return slides;
}

// ============================================================================
// PRESENTATION CREATION HELPER
// ============================================================================

/**
 * Create a complete Presentation object from generation result
 */
export function createPresentationFromGeneration(
  userId: string,
  result: GenerationResult,
  config: GenerationConfig,
  title?: string,
  documentId?: string
): Omit<Presentation, 'id'> {
  const now = Timestamp.now();

  return {
    userId,
    documentId,
    title: title || result.slides[0]?.content.title || 'Untitled Presentation',
    theme: config.theme,
    slides: result.slides,
    settings: DEFAULT_PRESENTATION_SETTINGS,
    createdAt: now,
    updatedAt: now,
  };
}
