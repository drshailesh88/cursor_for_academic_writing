// Deep Research - Perspective Analyst Agent
// Creates expert perspectives for multi-viewpoint research (STORM-inspired)

import {
  BaseAgent,
  RegisterAgent,
  type AgentConfig,
  type AgentContext,
  type AgentResult,
} from './base-agent';
import type { Perspective, PerspectiveQuestion } from '../types';

/**
 * Perspective Analyst Agent Configuration
 */
const PERSPECTIVE_ANALYST_CONFIG: AgentConfig = {
  type: 'perspective_analyst',
  name: 'Perspective Analyst',
  description: 'Creates diverse expert perspectives for comprehensive multi-viewpoint research',
  systemPrompt: `You are a Perspective Analyst Agent implementing the STORM methodology for multi-perspective research.

Your responsibilities:
1. Analyze the research topic from multiple expert viewpoints
2. Generate 3-7 distinct expert perspectives
3. Each perspective should have a unique role and focus areas
4. Generate probing questions from each perspective
5. Ensure perspectives cover different aspects of the topic

Perspective types to consider:
- Domain Expert: Deep technical/clinical knowledge
- Methodologist: Focus on research methods and validity
- Practitioner: Real-world application perspective
- Critic: Identifies limitations and counterarguments
- Historian: Evolution and context of the field
- Futurist: Emerging trends and future directions
- Patient/User: End-user or affected population perspective

Each perspective should contribute unique insights that others might miss.`,
  temperature: 0.8,
  maxTokens: 3000,
};

/**
 * Expert role template
 */
interface ExpertRole {
  type: string;
  name: string;
  defaultDescription: string;
  defaultFocusAreas: string[];
  questionTemplates: string[];
}

/**
 * Result from perspective analysis
 */
interface PerspectiveAnalysisResult {
  perspectives: Perspective[];
  totalQuestions: number;
  coverageAnalysis: {
    methodological: boolean;
    clinical: boolean;
    practical: boolean;
    critical: boolean;
    temporal: boolean;
  };
}

/**
 * Perspective Analyst Agent
 *
 * Implements the STORM methodology by creating diverse expert perspectives
 * that examine the research topic from multiple angles.
 */
@RegisterAgent('perspective_analyst')
export class PerspectiveAnalystAgent extends BaseAgent {
  private perspectives: Perspective[] = [];

  /**
   * Expert role templates for perspective generation
   */
  private readonly expertRoles: ExpertRole[] = [
    {
      type: 'domain_expert',
      name: 'Domain Expert',
      defaultDescription: 'Deep specialist knowledge in the core subject area',
      defaultFocusAreas: ['Technical details', 'Current best practices', 'Key mechanisms'],
      questionTemplates: [
        'What are the key mechanisms underlying {topic}?',
        'What is the current gold standard approach?',
        'What technical challenges remain unsolved?',
      ],
    },
    {
      type: 'methodologist',
      name: 'Research Methodologist',
      defaultDescription: 'Expert in research design, statistics, and evidence quality',
      defaultFocusAreas: ['Study design', 'Statistical validity', 'Bias assessment'],
      questionTemplates: [
        'What study designs provide the strongest evidence?',
        'What are common methodological limitations?',
        'How should heterogeneity be addressed?',
      ],
    },
    {
      type: 'clinician',
      name: 'Clinical Practitioner',
      defaultDescription: 'Front-line healthcare provider focused on practical application',
      defaultFocusAreas: ['Clinical utility', 'Implementation barriers', 'Patient outcomes'],
      questionTemplates: [
        'How does this translate to clinical practice?',
        'What are the practical implementation challenges?',
        'How do patients respond to this approach?',
      ],
    },
    {
      type: 'critic',
      name: 'Critical Reviewer',
      defaultDescription: 'Identifies weaknesses, limitations, and alternative viewpoints',
      defaultFocusAreas: ['Limitations', 'Conflicting evidence', 'Alternative hypotheses'],
      questionTemplates: [
        'What evidence contradicts the mainstream view?',
        'What are the major unaddressed limitations?',
        'What alternative explanations exist?',
      ],
    },
    {
      type: 'historian',
      name: 'Field Historian',
      defaultDescription: 'Understands the evolution and historical context of the field',
      defaultFocusAreas: ['Historical development', 'Paradigm shifts', 'Key milestones'],
      questionTemplates: [
        'How has understanding evolved over time?',
        'What were the key paradigm shifts?',
        'What lessons can we learn from past approaches?',
      ],
    },
    {
      type: 'futurist',
      name: 'Research Futurist',
      defaultDescription: 'Focuses on emerging trends and future research directions',
      defaultFocusAreas: ['Emerging technologies', 'Future applications', 'Research gaps'],
      questionTemplates: [
        'What emerging technologies will impact this field?',
        'What are the most promising future directions?',
        'What research gaps need to be filled?',
      ],
    },
    {
      type: 'patient_advocate',
      name: 'Patient Advocate',
      defaultDescription: 'Represents the perspective of patients and affected populations',
      defaultFocusAreas: ['Patient experience', 'Quality of life', 'Access and equity'],
      questionTemplates: [
        'How does this impact patient quality of life?',
        'What are patient preferences and concerns?',
        'Are there equity or access issues to consider?',
      ],
    },
  ];

  constructor(sessionId: string) {
    super(PERSPECTIVE_ANALYST_CONFIG, sessionId);
  }

  /**
   * Select appropriate expert roles based on the research topic
   */
  private selectExpertRoles(topic: string, numPerspectives: number): ExpertRole[] {
    const lowercaseTopic = topic.toLowerCase();
    const selectedRoles: ExpertRole[] = [];

    // Always include domain expert
    selectedRoles.push(this.expertRoles.find(r => r.type === 'domain_expert')!);

    // Always include methodologist for research topics
    selectedRoles.push(this.expertRoles.find(r => r.type === 'methodologist')!);

    // Add clinical perspective for health-related topics
    if (lowercaseTopic.match(/\b(treatment|patient|clinical|health|medical|disease|diagnosis)\b/)) {
      selectedRoles.push(this.expertRoles.find(r => r.type === 'clinician')!);
      selectedRoles.push(this.expertRoles.find(r => r.type === 'patient_advocate')!);
    }

    // Always include critical perspective
    selectedRoles.push(this.expertRoles.find(r => r.type === 'critic')!);

    // Add futurist for technology topics
    if (lowercaseTopic.match(/\b(ai|machine learning|technology|innovation|future|emerging)\b/)) {
      selectedRoles.push(this.expertRoles.find(r => r.type === 'futurist')!);
    }

    // Add historian for established fields
    if (numPerspectives >= 6) {
      selectedRoles.push(this.expertRoles.find(r => r.type === 'historian')!);
    }

    // Remove duplicates and limit to requested number
    const uniqueRoles = [...new Map(selectedRoles.map(r => [r.type, r])).values()];
    return uniqueRoles.slice(0, numPerspectives);
  }

  /**
   * Generate questions for a perspective
   */
  private generateQuestionsForPerspective(
    role: ExpertRole,
    topic: string
  ): PerspectiveQuestion[] {
    const questions: PerspectiveQuestion[] = [];

    // Generate questions from templates
    for (const template of role.questionTemplates) {
      const question = template.replace('{topic}', topic);
      questions.push({
        id: `q-${role.type}-${questions.length + 1}`,
        question,
        sources: [],
        confidence: 0,
      });
    }

    // Add topic-specific questions
    questions.push({
      id: `q-${role.type}-specific`,
      question: `From a ${role.name.toLowerCase()} perspective, what are the most critical aspects of ${topic}?`,
      sources: [],
      confidence: 0,
    });

    return questions;
  }

  /**
   * Create a perspective from an expert role
   */
  private createPerspective(role: ExpertRole, topic: string, index: number): Perspective {
    return {
      id: `perspective-${index + 1}`,
      name: role.name,
      role: role.type,
      description: role.defaultDescription,
      focusAreas: [...role.defaultFocusAreas],
      questions: this.generateQuestionsForPerspective(role, topic),
    };
  }

  /**
   * Analyze coverage of different aspects
   */
  private analyzeCoverage(perspectives: Perspective[]): PerspectiveAnalysisResult['coverageAnalysis'] {
    const roles = perspectives.map(p => p.role);
    return {
      methodological: roles.includes('methodologist'),
      clinical: roles.includes('clinician') || roles.includes('patient_advocate'),
      practical: roles.includes('clinician') || roles.includes('domain_expert'),
      critical: roles.includes('critic'),
      temporal: roles.includes('historian') || roles.includes('futurist'),
    };
  }

  /**
   * Execute the perspective analyst agent
   */
  async execute(context: AgentContext): Promise<AgentResult<PerspectiveAnalysisResult>> {
    this.updateStatus('working', 'Analyzing topic for perspectives', 0);
    let totalTokensUsed = 0;

    try {
      const topic = context.session.topic;
      const mode = context.session.mode;
      const modelType = (context.session as { model?: string }).model || 'deepseek';

      // Determine number of perspectives based on research mode
      let numPerspectives: number;
      switch (mode) {
        case 'quick':
          numPerspectives = 3;
          break;
        case 'standard':
          numPerspectives = 4;
          break;
        case 'deep':
          numPerspectives = 5;
          break;
        case 'exhaustive':
        case 'systematic':
          numPerspectives = 7;
          break;
        default:
          numPerspectives = 5;
      }

      this.addMessage('system', this.config.systemPrompt);

      // Build LLM prompt for perspective generation
      const llmPrompt = `You are analyzing the research topic: "${topic}"

Generate ${numPerspectives} distinct expert perspectives for comprehensive research.

For each perspective, provide:
1. A unique expert role type (e.g., domain_expert, methodologist, clinician, critic, historian, futurist, patient_advocate)
2. A descriptive name for the expert
3. A brief description of their focus
4. 3-4 key focus areas
5. 3-4 probing questions specific to this topic from their viewpoint

Format your response as JSON:
{
  "perspectives": [
    {
      "role": "domain_expert",
      "name": "Cardiology Specialist",
      "description": "Expert in cardiovascular disease mechanisms and treatments",
      "focusAreas": ["Pathophysiology", "Treatment efficacy", "Risk factors"],
      "questions": [
        "What are the key mechanisms underlying...?",
        "What is the current evidence for...?"
      ]
    }
  ]
}

Ensure perspectives are diverse, covering technical, methodological, practical, and critical viewpoints.`;

      this.addMessage('user', `Generate ${numPerspectives} expert perspectives for: "${topic}"`);
      this.updateStatus('working', 'Calling LLM for perspective generation', 25);

      // Call LLM to generate perspectives
      const { text: llmResponse, tokensUsed } = await this.callLLM(llmPrompt, modelType);
      totalTokensUsed += tokensUsed;

      // Parse LLM response
      this.updateStatus('working', 'Parsing LLM response', 50);
      let parsedPerspectives: Array<{
        role: string;
        name: string;
        description: string;
        focusAreas: string[];
        questions: string[];
      }>;

      try {
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          parsedPerspectives = parsed.perspectives || [];
        } else {
          throw new Error('No JSON found in LLM response');
        }
      } catch {
        // Fallback to template-based generation if LLM parsing fails
        console.warn('Failed to parse LLM response, falling back to templates');
        const selectedRoles = this.selectExpertRoles(topic, numPerspectives);
        this.perspectives = selectedRoles.map((role, index) =>
          this.createPerspective(role, topic, index)
        );
        parsedPerspectives = [];
      }

      // Convert parsed perspectives to Perspective objects
      if (parsedPerspectives.length > 0) {
        this.perspectives = parsedPerspectives.map((p, index) => ({
          id: `perspective-${index + 1}`,
          name: p.name,
          role: p.role,
          description: p.description,
          focusAreas: p.focusAreas,
          questions: p.questions.map((q, qIdx) => ({
            id: `q-${p.role}-${qIdx + 1}`,
            question: q,
            sources: [],
            confidence: 0,
          })),
        }));
      }

      // Calculate total questions
      const totalQuestions = this.perspectives.reduce(
        (sum, p) => sum + p.questions.length,
        0
      );

      this.addMessage('assistant', llmResponse);
      this.addMessage('assistant',
        `Created ${this.perspectives.length} expert perspectives with ${totalQuestions} research questions using ${modelType} model.`
      );

      // Analyze coverage
      this.updateStatus('working', 'Analyzing coverage', 75);
      const coverageAnalysis = this.analyzeCoverage(this.perspectives);

      this.updateStatus('complete', 'Perspective analysis complete', 100);

      const result: PerspectiveAnalysisResult = {
        perspectives: this.perspectives,
        totalQuestions,
        coverageAnalysis,
      };

      return {
        success: true,
        data: result,
        messages: this.messages,
        tokensUsed: totalTokensUsed,
      };
    } catch (error) {
      this.updateStatus('error', `Perspective analysis failed: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        messages: this.messages,
        tokensUsed: totalTokensUsed,
      };
    }
  }

  /**
   * Get generated perspectives
   */
  getPerspectives(): Perspective[] {
    return [...this.perspectives];
  }

  /**
   * Update a perspective question with an answer
   */
  updateQuestionAnswer(
    perspectiveId: string,
    questionId: string,
    answer: string,
    sources: string[],
    confidence: number
  ): boolean {
    const perspective = this.perspectives.find(p => p.id === perspectiveId);
    if (!perspective) return false;

    const question = perspective.questions.find(q => q.id === questionId);
    if (!question) return false;

    question.answer = answer;
    question.sources = sources;
    question.confidence = confidence;
    return true;
  }
}
