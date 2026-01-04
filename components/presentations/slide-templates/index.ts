import { SlideType, SlideContent, Theme } from '@/lib/presentations/types';

// Export all slide components
export { TitleSlide } from './title-slide';
export { ContentSlide } from './content-slide';
export { DataSlide } from './data-slide';
export { TwoColumnSlide } from './two-column-slide';
export { SectionDividerSlide } from './section-divider-slide';
export { ReferencesSlide } from './references-slide';

// Common props interface for all slides
export interface SlideProps {
  content: SlideContent;
  theme: Theme;
  editable?: boolean;
  onContentChange?: (content: SlideContent) => void;
}

// Slide component mapping
import { TitleSlide } from './title-slide';
import { ContentSlide } from './content-slide';
import { DataSlide } from './data-slide';
import { TwoColumnSlide } from './two-column-slide';
import { SectionDividerSlide } from './section-divider-slide';
import { ReferencesSlide } from './references-slide';

/**
 * Get the appropriate slide component for a given slide type
 * @param type - The type of slide to render
 * @returns React component for rendering the slide
 */
export function getSlideComponent(type: SlideType): React.ComponentType<SlideProps> {
  const slideComponents: Record<string, React.ComponentType<SlideProps>> = {
    title: TitleSlide,
    content: ContentSlide,
    'data-visualization': DataSlide,
    'two-column': TwoColumnSlide,
    'section-divider': SectionDividerSlide,
    references: ReferencesSlide,
    // Default fallback for unsupported types
    comparison: TwoColumnSlide,
    process: ContentSlide,
    image: ContentSlide,
    quote: ContentSlide,
    timeline: ContentSlide,
    qa: ContentSlide,
  };

  return slideComponents[type] || ContentSlide;
}

/**
 * Check if a slide type is supported with a dedicated component
 * @param type - The slide type to check
 * @returns true if the type has a dedicated component
 */
export function isSlideTypeSupported(type: SlideType): boolean {
  const supportedTypes: SlideType[] = [
    'title',
    'content',
    'data-visualization',
    'two-column',
    'section-divider',
    'references',
  ];

  return supportedTypes.includes(type);
}
