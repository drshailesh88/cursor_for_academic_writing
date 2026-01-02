/**
 * Writing Style Presets
 *
 * Flexible templates for different academic writing styles
 */

export interface WritingStyle {
  name: string;
  description: string;
  systemPromptAddition: string;
}

export const WRITING_STYLES: Record<string, WritingStyle> = {
  formal: {
    name: 'Formal Academic',
    description: 'Traditional academic writing with formal tone',
    systemPromptAddition: `
Write in a formal academic style:
- Use passive voice where appropriate
- Employ formal vocabulary and technical terminology
- Maintain objective, impersonal tone
- Use complex sentence structures
- Follow traditional academic conventions`,
  },

  conversational: {
    name: 'Conversational Academic',
    description: 'Accessible academic writing (Eric Topol-inspired)',
    systemPromptAddition: `
Write in a conversational yet authoritative academic style:
- Use active voice predominantly
- Write as if explaining to an intelligent colleague
- Balance accessibility with scientific rigor
- Vary sentence length for rhythm
- Include rhetorical questions occasionally
- Make complex ideas understandable without sacrificing depth`,
  },

  technical: {
    name: 'Technical/Specialized',
    description: 'Highly technical writing for expert audiences',
    systemPromptAddition: `
Write in a technical, specialized style:
- Use field-specific jargon and terminology freely
- Assume expert-level background knowledge
- Focus on precision and detail
- Include methodological specifics
- Use dense, information-rich prose`,
  },

  review: {
    name: 'Literature Review',
    description: 'Synthesizing and comparing multiple sources',
    systemPromptAddition: `
Write in a literature review style:
- Compare and contrast different studies
- Synthesize findings across multiple papers
- Identify patterns, gaps, and controversies
- Use integrative language ("In contrast," "Similarly," "Building on this")
- Organize by themes or chronologically
- Critically evaluate the evidence`,
  },

  undergraduate: {
    name: 'Undergraduate Textbook',
    description: 'Educational writing for undergraduate students',
    systemPromptAddition: `
Write for undergraduate students:
- Define technical terms clearly
- Use examples and analogies
- Build concepts progressively
- Include learning aids (summaries, key points)
- Balance depth with accessibility
- Engage student interest`,
  },

  professional: {
    name: 'Professional/Clinical',
    description: 'Practical writing for practicing professionals',
    systemPromptAddition: `
Write for practicing professionals:
- Focus on clinical implications
- Emphasize practical applications
- Use case-based examples
- Balance evidence with real-world considerations
- Address implementation challenges
- Provide actionable insights`,
  },
};

export function getStylePrompt(styleName: string): string {
  const style = WRITING_STYLES[styleName];
  return style ? style.systemPromptAddition : '';
}

export function listAvailableStyles(): Array<{ name: string; description: string }> {
  return Object.entries(WRITING_STYLES).map(([key, style]) => ({
    name: key,
    description: style.description,
  }));
}
