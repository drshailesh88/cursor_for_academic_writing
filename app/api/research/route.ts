// Research API - Create and list research sessions
import { NextRequest, NextResponse } from 'next/server';
import { researchEngine, RESEARCH_MODE_CONFIGS } from '@/lib/deep-research/engine';
import {
  createResearchSession,
  getUserResearchSessions,
  toResearchSession,
} from '@/lib/firebase/research-sessions';
import type { ResearchMode, ResearchConfig } from '@/lib/deep-research/types';

interface CreateResearchRequest {
  topic: string;
  mode: ResearchMode;
  userId: string; // In production, get from auth
  configOverrides?: Partial<ResearchConfig>;
}

/**
 * POST /api/research - Create a new research session
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateResearchRequest = await request.json();
    const { topic, mode, userId, configOverrides } = body;

    // Validate required fields
    if (!topic || !topic.trim()) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    if (!mode || !RESEARCH_MODE_CONFIGS[mode]) {
      return NextResponse.json(
        { error: 'Invalid research mode' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      );
    }

    // Get config for mode
    const config: ResearchConfig = {
      ...RESEARCH_MODE_CONFIGS[mode],
      ...configOverrides,
    };

    // Create session in engine (for real-time execution)
    const sessionId = await researchEngine.createSession(
      userId,
      topic.trim(),
      mode,
      configOverrides
    );

    // Also persist to Firebase for durability
    await createResearchSession(userId, topic.trim(), mode, config);

    return NextResponse.json({
      sessionId,
      status: 'created',
      mode,
      topic: topic.trim(),
    });
  } catch (error) {
    console.error('Error creating research session:', error);
    return NextResponse.json(
      { error: 'Failed to create research session' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/research - List user's research sessions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      );
    }

    const sessions = await getUserResearchSessions(userId, limit);

    return NextResponse.json({
      sessions: sessions.map(toResearchSession),
    });
  } catch (error) {
    console.error('Error listing research sessions:', error);
    return NextResponse.json(
      { error: 'Failed to list research sessions' },
      { status: 500 }
    );
  }
}
