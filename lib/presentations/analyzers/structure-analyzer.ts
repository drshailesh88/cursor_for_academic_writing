/**
 * Presentation Structure Analyzer
 * Phase 7B: Analyzes document content and plans optimal slide structure
 */

import {
  PresentationStructure,
  SlideSection,
  SlideBlueprint,
  ContentExtraction,
  PresentationFormat,
  GenerationOptions,
  SlideType,
  LayoutType,
  SlidePriority,
} from '../types';

// ============================================================================
// FORMAT SPECIFICATIONS
// ============================================================================

interface FormatSpec {
  minSlides: number;
  maxSlides: number;
  duration: number; // minutes
  secondsPerSlide: number;
  includeSectionDividers: boolean;
  includeOutline: boolean;
}

const FORMAT_SPECS: Record<PresentationFormat, FormatSpec> = {
  conference: {
    minSlides: 10,
    maxSlides: 15,
    duration: 15,
    secondsPerSlide: 60,
    includeSectionDividers: false,
    includeOutline: true,
  },
  lecture: {
    minSlides: 30,
    maxSlides: 45,
    duration: 45,
    secondsPerSlide: 60,
    includeSectionDividers: true,
    includeOutline: true,
  },
  poster: {
    minSlides: 1,
    maxSlides: 1,
    duration: 0,
    secondsPerSlide: 0,
    includeSectionDividers: false,
    includeOutline: false,
  },
  pitch: {
    minSlides: 5,
    maxSlides: 10,
    duration: 5,
    secondsPerSlide: 30,
    includeSectionDividers: false,
    includeOutline: false,
  },
};

// ============================================================================
// SLIDE COUNT CALCULATION
// ============================================================================

/**
 * Calculate optimal number of slides based on format and content
 */
export function calculateSlideCount(
  wordCount: number,
  format: PresentationFormat,
  options: GenerationOptions
): number {
  const spec = FORMAT_SPECS[format];

  // If target slide count is specified, use it (within format limits)
  if (options.targetSlideCount) {
    return Math.max(
      spec.minSlides,
      Math.min(spec.maxSlides, options.targetSlideCount)
    );
  }

  // For poster, always 1 slide
  if (format === 'poster') {
    return 1;
  }

  // Calculate based on word count and format duration
  // Typical speaking rate: 120-150 words per minute
  const wordsPerMinute = 135;
  const contentMinutes = wordCount / wordsPerMinute;

  // Adjust for format duration
  const durationRatio = Math.min(spec.duration / contentMinutes, 1.5);

  // Base calculation: aim for spec.secondsPerSlide per slide
  let targetSlides = Math.ceil((spec.duration * 60) / spec.secondsPerSlide);

  // Adjust based on content density preferences
  if (options.emphasizeFindings) {
    // More slides for findings = less dense
    targetSlides = Math.ceil(targetSlides * 1.2);
  }

  if (options.includeMethodology) {
    // Add slides for methodology section
    targetSlides += 2;
  }

  if (options.generateVisualizations) {
    // Add slides for visualizations
    targetSlides += 2;
  }

  // Clamp to format limits
  return Math.max(spec.minSlides, Math.min(spec.maxSlides, targetSlides));
}

// ============================================================================
// CONTENT DENSITY ASSESSMENT
// ============================================================================

/**
 * Determine content density level based on words per slide
 */
export function assessContentDensity(
  wordCount: number,
  slideCount: number
): 'light' | 'medium' | 'dense' {
  const wordsPerSlide = wordCount / slideCount;

  // Density thresholds
  if (wordsPerSlide < 50) {
    return 'light';
  } else if (wordsPerSlide < 100) {
    return 'medium';
  } else {
    return 'dense';
  }
}

// ============================================================================
// SECTION PLANNING
// ============================================================================

/**
 * Plan sections based on document structure and target slide count
 */
export function planSections(
  extraction: ContentExtraction,
  targetSlideCount: number
): SlideSection[] {
  const sections: SlideSection[] = [];

  // Always start with title slide
  sections.push({
    name: 'Introduction',
    slides: [
      {
        type: 'title',
        layout: 'centered',
        contentSource: 'title',
        suggestedTitle: extraction.title,
        estimatedTime: 30,
        priority: 'essential',
      },
    ],
  });

  // Calculate slides available for content (excluding title and Q&A)
  let availableSlides = targetSlideCount - 2;

  // Outline slide if we have enough slides
  if (availableSlides > 8) {
    sections[0].slides.push({
      type: 'content',
      layout: 'centered',
      contentSource: 'outline',
      suggestedTitle: 'Outline',
      estimatedTime: 45,
      priority: 'important',
    });
    availableSlides -= 1;
  }

  // Group document sections into presentation sections
  const documentSections = extraction.sections;

  // Categorize sections
  const backgroundSections = documentSections.filter(
    (s) => s.heading.toLowerCase().includes('introduction') ||
           s.heading.toLowerCase().includes('background') ||
           s.heading.toLowerCase().includes('literature')
  );

  const methodologySections = documentSections.filter(
    (s) => s.heading.toLowerCase().includes('method') ||
           s.heading.toLowerCase().includes('materials') ||
           s.heading.toLowerCase().includes('procedure')
  );

  const resultsSections = documentSections.filter(
    (s) => s.heading.toLowerCase().includes('result') ||
           s.heading.toLowerCase().includes('finding')
  );

  const discussionSections = documentSections.filter(
    (s) => s.heading.toLowerCase().includes('discussion') ||
           s.heading.toLowerCase().includes('conclusion') ||
           s.heading.toLowerCase().includes('implication')
  );

  // Allocate slides to sections based on importance
  const slideAllocations = {
    background: Math.max(1, Math.floor(availableSlides * 0.15)),
    methodology: Math.max(1, Math.floor(availableSlides * 0.20)),
    results: Math.max(2, Math.floor(availableSlides * 0.40)),
    discussion: Math.max(1, Math.floor(availableSlides * 0.25)),
  };

  // Background/Introduction section
  if (backgroundSections.length > 0) {
    const backgroundSlides: SlideBlueprint[] = [];

    for (let i = 0; i < Math.min(slideAllocations.background, backgroundSections.length); i++) {
      const section = backgroundSections[i];
      backgroundSlides.push({
        type: suggestSlideType(section.content, section.hasData, false),
        layout: suggestLayout(section.bulletPoints.length, false),
        contentSource: `section:${section.heading}`,
        suggestedTitle: section.heading,
        estimatedTime: 60,
        priority: 'important',
      });
    }

    if (backgroundSlides.length > 0) {
      sections.push({
        name: 'Background',
        slides: backgroundSlides,
      });
    }
  }

  // Methodology section
  if (methodologySections.length > 0) {
    const methodologySlides: SlideBlueprint[] = [];

    for (let i = 0; i < Math.min(slideAllocations.methodology, methodologySections.length); i++) {
      const section = methodologySections[i];
      methodologySlides.push({
        type: section.content.toLowerCase().includes('flow') ||
               section.content.toLowerCase().includes('step') ? 'process' : 'content',
        layout: suggestLayout(section.bulletPoints.length, section.hasData),
        contentSource: `section:${section.heading}`,
        suggestedTitle: section.heading,
        estimatedTime: 60,
        priority: 'important',
        visualizationType: section.content.toLowerCase().includes('flow') ? 'flowchart' : undefined,
      });
    }

    if (methodologySlides.length > 0) {
      sections.push({
        name: 'Methodology',
        slides: methodologySlides,
      });
    }
  }

  // Results/Findings section (highest priority)
  if (resultsSections.length > 0 || extraction.keyFindings.length > 0) {
    const resultsSlides: SlideBlueprint[] = [];

    // Add slides for key findings
    const findingsToInclude = Math.min(
      slideAllocations.results,
      extraction.keyFindings.length
    );

    for (let i = 0; i < findingsToInclude; i++) {
      const finding = extraction.keyFindings[i];
      resultsSlides.push({
        type: finding.visualizationPotential ? 'data-visualization' : 'content',
        layout: finding.visualizationPotential ? 'centered' : 'left-heavy',
        contentSource: `finding:${i}`,
        suggestedTitle: finding.text.split('.')[0],
        estimatedTime: 90,
        priority: 'essential',
        visualizationType: finding.visualizationPotential || undefined,
      });
    }

    // Add slides for result sections if space available
    const remainingSlides = slideAllocations.results - resultsSlides.length;
    for (let i = 0; i < Math.min(remainingSlides, resultsSections.length); i++) {
      const section = resultsSections[i];
      resultsSlides.push({
        type: suggestSlideType(section.content, section.hasData, true),
        layout: suggestLayout(section.bulletPoints.length, section.hasData),
        contentSource: `section:${section.heading}`,
        suggestedTitle: section.heading,
        estimatedTime: 75,
        priority: 'essential',
        visualizationType: section.hasData ? 'table' : undefined,
      });
    }

    if (resultsSlides.length > 0) {
      sections.push({
        name: 'Results',
        slides: resultsSlides,
      });
    }
  }

  // Discussion/Conclusions section
  if (discussionSections.length > 0 || extraction.conclusions.length > 0) {
    const discussionSlides: SlideBlueprint[] = [];

    // Add conclusions slide if we have conclusions
    if (extraction.conclusions.length > 0) {
      discussionSlides.push({
        type: 'content',
        layout: 'centered',
        contentSource: 'conclusions',
        suggestedTitle: 'Key Conclusions',
        estimatedTime: 60,
        priority: 'essential',
      });
    }

    // Add discussion section slides
    const remainingSlides = slideAllocations.discussion - discussionSlides.length;
    for (let i = 0; i < Math.min(remainingSlides, discussionSections.length); i++) {
      const section = discussionSections[i];
      discussionSlides.push({
        type: 'content',
        layout: suggestLayout(section.bulletPoints.length, false),
        contentSource: `section:${section.heading}`,
        suggestedTitle: section.heading,
        estimatedTime: 60,
        priority: 'important',
      });
    }

    if (discussionSlides.length > 0) {
      sections.push({
        name: 'Discussion',
        slides: discussionSlides,
      });
    }
  }

  // References slide if citations exist
  if (extraction.citations.length > 0) {
    sections.push({
      name: 'References',
      slides: [
        {
          type: 'references',
          layout: 'full',
          contentSource: 'citations',
          suggestedTitle: 'References',
          estimatedTime: 15,
          priority: 'important',
        },
      ],
    });
  }

  // Q&A slide
  sections.push({
    name: 'Closing',
    slides: [
      {
        type: 'qa',
        layout: 'centered',
        contentSource: 'qa',
        suggestedTitle: 'Questions?',
        estimatedTime: 30,
        priority: 'essential',
      },
    ],
  });

  return sections;
}

// ============================================================================
// SLIDE TYPE SUGGESTION
// ============================================================================

/**
 * Determine best slide type based on content characteristics
 */
export function suggestSlideType(
  content: string,
  hasData: boolean,
  hasVisual: boolean
): SlideType {
  const lowerContent = content.toLowerCase();

  // Check for specific patterns
  if (hasVisual || lowerContent.includes('figure') || lowerContent.includes('chart')) {
    return 'data-visualization';
  }

  if (hasData && (lowerContent.includes('compar') || lowerContent.includes('versus'))) {
    return 'comparison';
  }

  if (lowerContent.includes('process') || lowerContent.includes('workflow') ||
      lowerContent.includes('step')) {
    return 'process';
  }

  if (lowerContent.includes('timeline') || lowerContent.includes('over time') ||
      lowerContent.includes('longitudinal')) {
    return 'timeline';
  }

  if (content.includes('"') && content.split('"').length > 2) {
    return 'quote';
  }

  // Check for two distinct topics (potential two-column)
  const paragraphs = content.split('\n\n');
  if (paragraphs.length === 2 && paragraphs[0].length > 100 && paragraphs[1].length > 100) {
    return 'two-column';
  }

  // Default to content slide
  return 'content';
}

// ============================================================================
// LAYOUT SUGGESTION
// ============================================================================

/**
 * Determine best layout based on content amount and visual presence
 */
export function suggestLayout(
  bulletCount: number,
  hasVisual: boolean
): LayoutType {
  // If has visual, use split or left-heavy
  if (hasVisual) {
    return bulletCount > 4 ? 'left-heavy' : 'split';
  }

  // For content-only slides
  if (bulletCount === 0) {
    return 'centered';
  }

  if (bulletCount <= 3) {
    return 'centered';
  }

  if (bulletCount <= 6) {
    return 'full';
  }

  // Many bullets, consider grid
  return 'grid';
}

// ============================================================================
// DURATION ESTIMATION
// ============================================================================

/**
 * Calculate estimated presentation duration in minutes
 */
export function estimateDuration(
  slideCount: number,
  format: PresentationFormat
): number {
  const spec = FORMAT_SPECS[format];

  if (format === 'poster') {
    return 0; // Posters are not time-based
  }

  // Use format's seconds per slide
  const totalSeconds = slideCount * spec.secondsPerSlide;
  const minutes = Math.round(totalSeconds / 60);

  return minutes;
}

// ============================================================================
// CONTENT PRIORITIZATION
// ============================================================================

/**
 * Prioritize content when slide count is limited
 */
export function prioritizeContent(
  sections: SlideSection[],
  maxSlides: number
): SlideSection[] {
  // Count current total slides
  const currentTotal = sections.reduce((sum, section) => sum + section.slides.length, 0);

  if (currentTotal <= maxSlides) {
    return sections; // No prioritization needed
  }

  // Calculate how many slides to remove
  const slidesToRemove = currentTotal - maxSlides;

  // Create priority-sorted list of all slides with their section index
  interface PrioritizedSlide {
    sectionIndex: number;
    slideIndex: number;
    slide: SlideBlueprint;
    priorityScore: number;
  }

  const priorityScores: Record<SlidePriority, number> = {
    essential: 3,
    important: 2,
    optional: 1,
  };

  const allSlides: PrioritizedSlide[] = [];
  sections.forEach((section, sectionIndex) => {
    section.slides.forEach((slide, slideIndex) => {
      allSlides.push({
        sectionIndex,
        slideIndex,
        slide,
        priorityScore: priorityScores[slide.priority],
      });
    });
  });

  // Sort by priority (lowest first, as we'll remove from the bottom)
  allSlides.sort((a, b) => a.priorityScore - b.priorityScore);

  // Mark slides for removal
  const slidesToKeep = new Set<string>();
  for (let i = slidesToRemove; i < allSlides.length; i++) {
    const key = `${allSlides[i].sectionIndex}-${allSlides[i].slideIndex}`;
    slidesToKeep.add(key);
  }

  // Rebuild sections with only kept slides
  const prioritizedSections: SlideSection[] = sections.map((section, sectionIndex) => {
    const keptSlides = section.slides.filter((_, slideIndex) => {
      const key = `${sectionIndex}-${slideIndex}`;
      return slidesToKeep.has(key);
    });

    return {
      ...section,
      slides: keptSlides,
    };
  }).filter(section => section.slides.length > 0); // Remove empty sections

  return prioritizedSections;
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Analyze document structure and create presentation plan
 */
export function analyzeStructure(
  extraction: ContentExtraction,
  format: PresentationFormat,
  options: GenerationOptions
): PresentationStructure {
  // Calculate optimal slide count
  const targetSlideCount = calculateSlideCount(
    extraction.wordCount,
    format,
    options
  );

  // Plan sections and slides
  let sections = planSections(extraction, targetSlideCount);

  // Get format specifications
  const spec = FORMAT_SPECS[format];

  // Apply prioritization if we're over the max
  sections = prioritizeContent(sections, spec.maxSlides);

  // Calculate actual total slides
  const totalSlides = sections.reduce((sum, section) => sum + section.slides.length, 0);

  // Assess content density
  const contentDensity = assessContentDensity(extraction.wordCount, totalSlides);

  // Estimate duration
  const suggestedDuration = estimateDuration(totalSlides, format);

  return {
    totalSlides,
    sections,
    suggestedDuration,
    contentDensity,
  };
}
