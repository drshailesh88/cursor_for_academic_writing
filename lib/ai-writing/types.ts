/**
 * AI Writing Assistance Types
 *
 * Types for AI-powered writing tools including paraphrasing,
 * sentence improvement, academic tone conversion, and more.
 */

/**
 * AI writing action types
 */
export type AIWritingAction =
  | 'paraphrase'           // Rewrite while preserving meaning
  | 'simplify'             // Make simpler and clearer
  | 'expand'               // Add more detail and depth
  | 'shorten'              // Make more concise
  | 'formalize'            // Convert to formal/academic tone
  | 'improve-clarity'      // Improve clarity and flow
  | 'fix-grammar'          // Fix grammar and punctuation
  | 'active-voice'         // Convert passive to active voice
  | 'academic-tone'        // Apply academic writing style
  | 'continue'             // Continue writing from selection
  | 'summarize'            // Summarize the selected text
  | 'explain'              // Explain in simpler terms
  | 'counterargument'      // Generate counterarguments
  | 'add-citations'        // Suggest where citations needed
  | 'transition'           // Add transition sentence
  | 'conclusion';          // Generate conclusion for section

/**
 * AI writing action configuration
 */
export interface AIWritingActionConfig {
  id: AIWritingAction;
  label: string;
  description: string;
  icon: string;
  shortcut?: string;
  requiresSelection: boolean;
  category: 'rewrite' | 'style' | 'generate' | 'academic';
}

/**
 * Available AI writing actions
 */
export const AI_WRITING_ACTIONS: AIWritingActionConfig[] = [
  // Rewrite category
  {
    id: 'paraphrase',
    label: 'Paraphrase',
    description: 'Rewrite while preserving the original meaning',
    icon: 'RefreshCw',
    shortcut: 'Cmd+Shift+R',
    requiresSelection: true,
    category: 'rewrite',
  },
  {
    id: 'simplify',
    label: 'Simplify',
    description: 'Make the text simpler and easier to understand',
    icon: 'Minimize2',
    requiresSelection: true,
    category: 'rewrite',
  },
  {
    id: 'expand',
    label: 'Expand',
    description: 'Add more detail and depth to the text',
    icon: 'Maximize2',
    requiresSelection: true,
    category: 'rewrite',
  },
  {
    id: 'shorten',
    label: 'Shorten',
    description: 'Make the text more concise',
    icon: 'Scissors',
    requiresSelection: true,
    category: 'rewrite',
  },

  // Style category
  {
    id: 'formalize',
    label: 'Formalize',
    description: 'Convert to formal, professional tone',
    icon: 'Briefcase',
    requiresSelection: true,
    category: 'style',
  },
  {
    id: 'improve-clarity',
    label: 'Improve Clarity',
    description: 'Improve sentence flow and clarity',
    icon: 'Eye',
    requiresSelection: true,
    category: 'style',
  },
  {
    id: 'fix-grammar',
    label: 'Fix Grammar',
    description: 'Correct grammar and punctuation errors',
    icon: 'Check',
    requiresSelection: true,
    category: 'style',
  },
  {
    id: 'active-voice',
    label: 'Active Voice',
    description: 'Convert passive voice to active voice',
    icon: 'Zap',
    requiresSelection: true,
    category: 'style',
  },

  // Academic category
  {
    id: 'academic-tone',
    label: 'Academic Tone',
    description: 'Apply scholarly academic writing style',
    icon: 'GraduationCap',
    requiresSelection: true,
    category: 'academic',
  },
  {
    id: 'add-citations',
    label: 'Suggest Citations',
    description: 'Identify claims that need citations',
    icon: 'BookOpen',
    requiresSelection: true,
    category: 'academic',
  },
  {
    id: 'counterargument',
    label: 'Counterargument',
    description: 'Generate potential counterarguments',
    icon: 'Scale',
    requiresSelection: true,
    category: 'academic',
  },

  // Generate category
  {
    id: 'continue',
    label: 'Continue Writing',
    description: 'Continue the text naturally',
    icon: 'ArrowRight',
    requiresSelection: false,
    category: 'generate',
  },
  {
    id: 'summarize',
    label: 'Summarize',
    description: 'Create a brief summary',
    icon: 'AlignLeft',
    requiresSelection: true,
    category: 'generate',
  },
  {
    id: 'explain',
    label: 'Explain',
    description: 'Explain in simpler terms',
    icon: 'HelpCircle',
    requiresSelection: true,
    category: 'generate',
  },
  {
    id: 'transition',
    label: 'Add Transition',
    description: 'Generate a transition sentence',
    icon: 'ArrowLeftRight',
    requiresSelection: false,
    category: 'generate',
  },
  {
    id: 'conclusion',
    label: 'Write Conclusion',
    description: 'Generate a conclusion for this section',
    icon: 'Flag',
    requiresSelection: true,
    category: 'generate',
  },
];

/**
 * Request for AI writing assistance
 */
export interface AIWritingRequest {
  action: AIWritingAction;
  selectedText: string;
  context?: string; // Surrounding text for context
  documentTitle?: string;
  discipline?: string;
  customPrompt?: string;
}

/**
 * Response from AI writing assistance
 */
export interface AIWritingResponse {
  success: boolean;
  result?: string;
  alternatives?: string[]; // Multiple suggestions
  explanation?: string;
  error?: string;
}

/**
 * Get action config by ID
 */
export function getActionConfig(action: AIWritingAction): AIWritingActionConfig | undefined {
  return AI_WRITING_ACTIONS.find(a => a.id === action);
}

/**
 * Get actions by category
 */
export function getActionsByCategory(category: AIWritingActionConfig['category']): AIWritingActionConfig[] {
  return AI_WRITING_ACTIONS.filter(a => a.category === category);
}

/**
 * Build system prompt for AI writing action
 */
export function buildWritingPrompt(
  action: AIWritingAction,
  selectedText: string,
  context?: string,
  discipline?: string
): string {
  const disciplineContext = discipline
    ? `The text is from an academic paper in the field of ${discipline}. `
    : 'The text is from an academic paper. ';

  const contextClause = context
    ? `\n\nSurrounding context:\n${context}\n\n`
    : '';

  const prompts: Record<AIWritingAction, string> = {
    'paraphrase': `${disciplineContext}Paraphrase the following text while preserving its exact meaning. Use different words and sentence structures, but keep the same level of formality and academic rigor. Do not add new information or remove important details.${contextClause}

Text to paraphrase:
${selectedText}

Provide only the paraphrased text, without any explanation.`,

    'simplify': `${disciplineContext}Simplify the following text to make it easier to understand. Use shorter sentences, simpler vocabulary, and clearer structure. Maintain accuracy but improve accessibility.${contextClause}

Text to simplify:
${selectedText}

Provide only the simplified text, without any explanation.`,

    'expand': `${disciplineContext}Expand the following text by adding more detail, examples, or elaboration. Maintain the same tone and style while making the content more comprehensive and thorough.${contextClause}

Text to expand:
${selectedText}

Provide only the expanded text, without any explanation.`,

    'shorten': `${disciplineContext}Shorten the following text while preserving all essential information. Remove redundancy, wordiness, and unnecessary phrases. Keep the core message intact.${contextClause}

Text to shorten:
${selectedText}

Provide only the shortened text, without any explanation.`,

    'formalize': `Convert the following text to a more formal, professional tone. Use appropriate academic or business language while preserving the meaning.${contextClause}

Text to formalize:
${selectedText}

Provide only the formalized text, without any explanation.`,

    'improve-clarity': `${disciplineContext}Improve the clarity and flow of the following text. Fix awkward phrasing, improve sentence transitions, and ensure ideas flow logically. Keep the same meaning and tone.${contextClause}

Text to improve:
${selectedText}

Provide only the improved text, without any explanation.`,

    'fix-grammar': `Fix all grammar, spelling, and punctuation errors in the following text. Keep the original meaning and style intact. Only correct errors, do not rewrite content.${contextClause}

Text to correct:
${selectedText}

Provide only the corrected text, without any explanation.`,

    'active-voice': `${disciplineContext}Convert any passive voice constructions to active voice in the following text. Keep the meaning identical while making the writing more direct and engaging.${contextClause}

Text to convert:
${selectedText}

Provide only the converted text, without any explanation.`,

    'academic-tone': `Convert the following text to a scholarly academic writing style. Use formal language, hedging where appropriate (e.g., "may," "suggests"), precise terminology, and maintain objectivity. Avoid first person unless necessary.${contextClause}

Text to convert:
${selectedText}

Provide only the academic version, without any explanation.`,

    'continue': `${disciplineContext}Continue writing naturally from the following text. Match the existing tone, style, and level of detail. Generate approximately 2-3 sentences that logically extend the content.${contextClause}

Text to continue from:
${selectedText}

Provide only the continuation, without any preamble or explanation.`,

    'summarize': `${disciplineContext}Provide a concise summary of the following text. Capture the main points and key arguments in 2-3 sentences.${contextClause}

Text to summarize:
${selectedText}

Provide only the summary, without any preamble.`,

    'explain': `Explain the following text in simpler terms. Break down complex concepts, define technical terms, and make the content accessible to a general audience.${contextClause}

Text to explain:
${selectedText}

Provide a clear explanation.`,

    'counterargument': `${disciplineContext}Generate thoughtful counterarguments or alternative perspectives to the claims made in the following text. Consider what critics might say or what limitations exist.${contextClause}

Text to analyze:
${selectedText}

Provide 2-3 potential counterarguments or alternative viewpoints.`,

    'add-citations': `${disciplineContext}Analyze the following text and identify specific claims or statements that would benefit from citations. For each claim, briefly explain what type of source would be appropriate.${contextClause}

Text to analyze:
${selectedText}

List the claims that need citations and suggest appropriate source types.`,

    'transition': `${disciplineContext}Generate a transition sentence that would smoothly connect the following text to the next idea or paragraph. Match the existing academic tone.${contextClause}

Text needing transition:
${selectedText}

Provide only the transition sentence.`,

    'conclusion': `${disciplineContext}Write a conclusion paragraph for the section containing the following text. Summarize key points and provide a thoughtful closing statement.${contextClause}

Section content:
${selectedText}

Provide a conclusion paragraph.`,
  };

  return prompts[action];
}
