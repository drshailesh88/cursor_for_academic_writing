// Deep Research - Clarifier Agent
// Analyzes research topics and generates clarifying questions

import {
  BaseAgent,
  RegisterAgent,
  type AgentConfig,
  type AgentContext,
  type AgentResult,
} from './base-agent';
import type { Clarification } from '../types';

/**
 * Clarifier Agent Configuration
 */
const CLARIFIER_CONFIG: AgentConfig = {
  type: 'clarifier',
  name: 'Topic Clarifier',
  description: 'Analyzes research topics and generates clarifying questions to refine the scope',
  systemPrompt: `You are a Research Clarifier Agent. Your role is to analyze research topics and generate targeted clarifying questions.

Your responsibilities:
1. Analyze the research topic for ambiguity and scope
2. Identify key aspects that need clarification
3. Generate 3-5 specific, actionable clarifying questions
4. Suggest answer options when appropriate
5. Refine the topic based on user responses

Guidelines for questions:
- Be specific and avoid yes/no questions when possible
- Focus on scope, methodology, and outcome expectations
- Consider time periods, populations, and geographic scope
- Ask about inclusion/exclusion criteria
- Clarify the desired depth and breadth of research

Your output should help narrow down a broad topic into a focused, researchable question.`,
  temperature: 0.7,
  maxTokens: 2000,
};

/**
 * Generated clarifying question
 */
interface ClarifyingQuestion {
  id: string;
  question: string;
  category: 'scope' | 'methodology' | 'population' | 'timeframe' | 'outcome' | 'context';
  suggestedOptions?: string[];
  importance: 'critical' | 'important' | 'optional';
}

/**
 * Result from topic analysis
 */
interface TopicAnalysis {
  originalTopic: string;
  identifiedAmbiguities: string[];
  suggestedFocusAreas: string[];
  estimatedBreadth: 'narrow' | 'moderate' | 'broad' | 'very_broad';
}

/**
 * Result from clarifier execution
 */
interface ClarifierResult {
  analysis: TopicAnalysis;
  questions: ClarifyingQuestion[];
  refinedTopic?: string;
}

/**
 * Clarifier Agent
 *
 * Analyzes research topics to identify ambiguities and generates
 * clarifying questions to help refine the research scope.
 */
@RegisterAgent('clarifier')
export class ClarifierAgent extends BaseAgent {
  private questions: ClarifyingQuestion[] = [];
  private clarifications: Clarification[] = [];

  constructor(sessionId: string) {
    super(CLARIFIER_CONFIG, sessionId);
  }

  /**
   * Analyze topic for ambiguities
   */
  private analyzeTopic(topic: string): TopicAnalysis {
    const ambiguities: string[] = [];
    const focusAreas: string[] = [];

    // Check for common ambiguity patterns
    const lowercaseTopic = topic.toLowerCase();

    // Time period ambiguity
    if (!lowercaseTopic.match(/\b(recent|current|20\d{2}|last \d+ years?)\b/)) {
      ambiguities.push('Time period is not specified');
    }

    // Population/scope ambiguity
    if (!lowercaseTopic.match(/\b(in|among|for|with)\s+\w+/)) {
      ambiguities.push('Target population or context is unclear');
    }

    // Methodology ambiguity for research topics
    if (lowercaseTopic.includes('effect') || lowercaseTopic.includes('impact')) {
      ambiguities.push('Specific outcomes or metrics not defined');
    }

    // Geographic scope
    if (!lowercaseTopic.match(/\b(global|worldwide|in \w+|across)\b/)) {
      focusAreas.push('Geographic scope');
    }

    // Add focus areas based on topic content
    if (lowercaseTopic.includes('treatment') || lowercaseTopic.includes('therapy')) {
      focusAreas.push('Treatment modalities', 'Patient outcomes', 'Comparative effectiveness');
    }

    if (lowercaseTopic.includes('ai') || lowercaseTopic.includes('machine learning')) {
      focusAreas.push('Algorithm types', 'Training data', 'Performance metrics', 'Clinical validation');
    }

    if (lowercaseTopic.includes('diagnosis') || lowercaseTopic.includes('detection')) {
      focusAreas.push('Diagnostic accuracy', 'Screening vs confirmation', 'Gold standard comparison');
    }

    // Estimate breadth
    const wordCount = topic.split(/\s+/).length;
    let breadth: TopicAnalysis['estimatedBreadth'] = 'moderate';
    if (wordCount < 5) breadth = 'very_broad';
    else if (wordCount < 10) breadth = 'broad';
    else if (wordCount > 20) breadth = 'narrow';

    return {
      originalTopic: topic,
      identifiedAmbiguities: ambiguities,
      suggestedFocusAreas: focusAreas,
      estimatedBreadth: breadth,
    };
  }

  /**
   * Generate clarifying questions based on analysis
   */
  private generateQuestions(analysis: TopicAnalysis): ClarifyingQuestion[] {
    const questions: ClarifyingQuestion[] = [];
    let questionId = 1;

    // Scope question (always ask)
    questions.push({
      id: `clarify-${questionId++}`,
      question: 'What specific aspect of this topic are you most interested in exploring?',
      category: 'scope',
      importance: 'critical',
      suggestedOptions: analysis.suggestedFocusAreas.length > 0
        ? analysis.suggestedFocusAreas
        : undefined,
    });

    // Timeframe question
    if (analysis.identifiedAmbiguities.some(a => a.includes('Time'))) {
      questions.push({
        id: `clarify-${questionId++}`,
        question: 'What time period should the research cover?',
        category: 'timeframe',
        importance: 'important',
        suggestedOptions: [
          'Last 5 years (2020-2025)',
          'Last 10 years (2015-2025)',
          'Last 20 years (2005-2025)',
          'All available literature',
        ],
      });
    }

    // Population question
    if (analysis.identifiedAmbiguities.some(a => a.includes('population'))) {
      questions.push({
        id: `clarify-${questionId++}`,
        question: 'Is there a specific population or context you want to focus on?',
        category: 'population',
        importance: 'important',
        suggestedOptions: [
          'General population',
          'Specific age group (please specify)',
          'Specific condition or disease',
          'Healthcare setting (hospital, primary care, etc.)',
        ],
      });
    }

    // Outcome question
    if (analysis.identifiedAmbiguities.some(a => a.includes('outcomes'))) {
      questions.push({
        id: `clarify-${questionId++}`,
        question: 'What outcomes or metrics are most important to you?',
        category: 'outcome',
        importance: 'critical',
      });
    }

    // Breadth question for very broad topics
    if (analysis.estimatedBreadth === 'very_broad' || analysis.estimatedBreadth === 'broad') {
      questions.push({
        id: `clarify-${questionId++}`,
        question: 'How comprehensive should this research be?',
        category: 'scope',
        importance: 'important',
        suggestedOptions: [
          'Quick overview of key findings',
          'Comprehensive literature review',
          'Systematic review with specific criteria',
          'Meta-analysis of quantitative studies',
        ],
      });
    }

    // Limit to 5 questions max
    return questions.slice(0, 5);
  }

  /**
   * Refine topic based on clarifications
   */
  private refineTopic(originalTopic: string, clarifications: Clarification[]): string {
    if (clarifications.length === 0) {
      return originalTopic;
    }

    // Build refined topic from clarifications
    const refinements: string[] = [];

    for (const clarification of clarifications) {
      if (clarification.answer && clarification.answer.trim()) {
        refinements.push(clarification.answer);
      }
    }

    if (refinements.length === 0) {
      return originalTopic;
    }

    // Construct refined topic
    const refinedTopic = `${originalTopic} - focusing on: ${refinements.join('; ')}`;
    return refinedTopic;
  }

  /**
   * Process user answers to clarifying questions
   */
  public processClarifications(answers: Array<{ questionId: string; answer: string }>): void {
    for (const { questionId, answer } of answers) {
      const question = this.questions.find(q => q.id === questionId);
      if (question) {
        this.clarifications.push({
          id: questionId,
          question: question.question,
          answer,
          suggestedOptions: question.suggestedOptions,
          answeredAt: new Date() as any,
        });
      }
    }
  }

  /**
   * Execute the clarifier agent
   */
  async execute(context: AgentContext): Promise<AgentResult<ClarifierResult>> {
    this.updateStatus('working', 'Analyzing research topic', 0);

    try {
      const topic = context.session.topic;

      // Add system and user messages
      this.addMessage('system', this.config.systemPrompt);
      this.addMessage('user', `Please analyze this research topic: "${topic}"`);

      // Analyze the topic
      this.updateStatus('working', 'Identifying ambiguities', 25);
      const analysis = this.analyzeTopic(topic);

      this.addMessage('assistant',
        `Topic analysis complete. Identified ${analysis.identifiedAmbiguities.length} ambiguities. ` +
        `Topic breadth: ${analysis.estimatedBreadth}.`
      );

      // Generate clarifying questions
      this.updateStatus('working', 'Generating clarifying questions', 50);
      this.questions = this.generateQuestions(analysis);

      this.addMessage('assistant',
        `Generated ${this.questions.length} clarifying questions to refine the research scope.`
      );

      // Check if we have clarifications from context
      const existingClarifications = context.session.clarifications || [];
      if (existingClarifications.length > 0) {
        this.clarifications = existingClarifications;
      }

      // Refine topic if we have answers
      this.updateStatus('working', 'Refining topic', 75);
      const refinedTopic = this.refineTopic(topic, this.clarifications);

      this.updateStatus('complete', 'Topic clarification complete', 100);

      const result: ClarifierResult = {
        analysis,
        questions: this.questions,
        refinedTopic: this.clarifications.length > 0 ? refinedTopic : undefined,
      };

      return {
        success: true,
        data: result,
        messages: this.messages,
        tokensUsed: 0,
      };
    } catch (error) {
      this.updateStatus('error', `Clarification failed: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        messages: this.messages,
        tokensUsed: 0,
      };
    }
  }

  /**
   * Get generated questions
   */
  getQuestions(): ClarifyingQuestion[] {
    return [...this.questions];
  }

  /**
   * Get processed clarifications
   */
  getClarifications(): Clarification[] {
    return [...this.clarifications];
  }

  /**
   * Check if clarification is complete
   */
  isClarificationComplete(): boolean {
    const criticalQuestions = this.questions.filter(q => q.importance === 'critical');
    const answeredCritical = criticalQuestions.filter(q =>
      this.clarifications.some(c => c.id === q.id && c.answer)
    );
    return answeredCritical.length === criticalQuestions.length;
  }
}
