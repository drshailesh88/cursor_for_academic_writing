/**
 * Research Clarification API
 *
 * POST endpoint to generate clarifying questions for a research topic
 * Uses the ClarifierAgent to identify ambiguities and generate questions
 */

import { NextRequest, NextResponse } from 'next/server';
import { ClarifierAgent } from '@/lib/research/deep-research';

/**
 * Request body interface
 */
interface ClarifyRequest {
  topic: string;
}

/**
 * Response interface
 */
interface ClarifyResponse {
  questions: string[];
  suggestedAnswers?: string[];
  reasoning?: string;
  confidence: number;
}

/**
 * POST /api/research/clarify - Generate clarifying questions
 *
 * Analyzes the research topic and generates questions to help
 * refine the scope and focus of the research.
 *
 * @example
 * POST /api/research/clarify
 * {
 *   "topic": "AI in medical diagnosis"
 * }
 *
 * Returns:
 * {
 *   "questions": [
 *     "Which medical specialty are you most interested in?",
 *     "Are you focusing on diagnostic accuracy or clinical workflow?",
 *     "What time period should the research cover?"
 *   ],
 *   "suggestedAnswers": [
 *     "Radiology, pathology, or general diagnostics",
 *     "Diagnostic accuracy",
 *     "Last 5 years (2019-2024)"
 *   ],
 *   "reasoning": "Topic is sufficiently clear but could benefit from scope refinement",
 *   "confidence": 0.8
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ClarifyRequest = await request.json();
    const { topic } = body;

    // Validate required fields
    if (!topic || !topic.trim()) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Rate limiting consideration: In production, add rate limiting here
    // Example: Check if user has exceeded request quota
    // if (await isRateLimited(userId)) {
    //   return NextResponse.json(
    //     { error: 'Rate limit exceeded. Please try again later.' },
    //     { status: 429 }
    //   );
    // }

    // Initialize ClarifierAgent
    const clarifierAgent = new ClarifierAgent({
      temperature: 0.7,
      maxTokens: 2000,
    });

    // Generate clarifying questions
    const response = await clarifierAgent.identifyAmbiguities(topic.trim());

    // Prepare response
    const clarifyResponse: ClarifyResponse = {
      questions: response.data.questions,
      reasoning: response.reasoning,
      confidence: response.confidence,
    };

    // Generate suggested answers if questions exist
    if (response.data.questions.length > 0) {
      // In a full implementation, this would use another agent call
      // For now, provide generic suggestions
      clarifyResponse.suggestedAnswers = response.data.questions.map((q) => {
        // Basic heuristics for suggestions
        if (q.toLowerCase().includes('time period') || q.toLowerCase().includes('years')) {
          return 'Last 5 years';
        } else if (q.toLowerCase().includes('population') || q.toLowerCase().includes('demographic')) {
          return 'General population';
        } else if (q.toLowerCase().includes('type') || q.toLowerCase().includes('specific')) {
          return 'All types';
        }
        return 'Please specify';
      });
    }

    return NextResponse.json(clarifyResponse);

  } catch (error) {
    console.error('Clarification API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate clarifying questions';

    return NextResponse.json(
      { error: errorMessage },
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
