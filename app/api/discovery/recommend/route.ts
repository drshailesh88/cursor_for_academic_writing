import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateRecommendations } from '@/lib/discovery/recommendations';
import { getSemanticScholarById } from '@/lib/research/semantic-scholar';
import type { SearchResult } from '@/lib/research/types';

/**
 * POST /api/discovery/recommend
 *
 * Generate personalized paper recommendations
 *
 * Request body:
 * - paperIds: string[] - User's library/papers to base recommendations on
 * - userId?: string - User ID for personalization (optional)
 * - limit?: number - Number of recommendations per category (default: 10)
 * - categories?: string[] - Which recommendation types to include
 *   Options: 'trending', 'missing', 'recent', 'sameAuthors', 'extending'
 */

const requestSchema = z.object({
  paperIds: z.array(z.string()).min(1, 'At least one paper required'),
  userId: z.string().optional(),
  limit: z.number().min(1).max(50).optional().default(10),
  categories: z.array(z.enum(['trending', 'missing', 'recent', 'sameAuthors', 'extending'])).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { paperIds, userId, limit, categories } = validationResult.data;

    // Fetch user's papers
    const userPapers: SearchResult[] = [];
    for (const paperId of paperIds.slice(0, 20)) { // Limit to prevent overload
      try {
        const paper = await getSemanticScholarById(paperId);
        if (paper) userPapers.push(paper);
      } catch (error) {
        console.error(`Failed to fetch paper ${paperId}:`, error);
      }
    }

    if (userPapers.length === 0) {
      return NextResponse.json(
        { error: 'Could not fetch any of the provided papers' },
        { status: 400 }
      );
    }

    // Generate recommendations
    const recommendations = await generateRecommendations(
      userId || 'anonymous',
      userPapers,
      [] // No learning history for now
    );

    // Filter by categories if specified
    const filteredRecs = categories ? {
      hotNow: categories.includes('trending') ? recommendations.hotNow : [],
      missingFromReview: categories.includes('missing') ? recommendations.missingFromReview : [],
      newThisWeek: categories.includes('recent') ? recommendations.newThisWeek : [],
      sameAuthors: categories.includes('sameAuthors') ? recommendations.sameAuthors : [],
      extendingWork: categories.includes('extending') ? recommendations.extendingWork : [],
    } : {
      hotNow: recommendations.hotNow,
      missingFromReview: recommendations.missingFromReview,
      newThisWeek: recommendations.newThisWeek,
      sameAuthors: recommendations.sameAuthors,
      extendingWork: recommendations.extendingWork,
    };

    // Apply limit
    const limitedRecs = {
      hotNow: filteredRecs.hotNow.slice(0, limit),
      missingFromReview: filteredRecs.missingFromReview.slice(0, limit),
      newThisWeek: filteredRecs.newThisWeek.slice(0, limit),
      sameAuthors: filteredRecs.sameAuthors.slice(0, limit),
      extendingWork: filteredRecs.extendingWork.slice(0, limit),
    };

    const totalRecommendations =
      limitedRecs.hotNow.length +
      limitedRecs.missingFromReview.length +
      limitedRecs.newThisWeek.length +
      limitedRecs.sameAuthors.length +
      limitedRecs.extendingWork.length;

    return NextResponse.json({
      success: true,
      recommendations: limitedRecs,
      summary: {
        basedOnPapers: userPapers.length,
        totalRecommendations,
        byCategory: {
          trending: limitedRecs.hotNow.length,
          missing: limitedRecs.missingFromReview.length,
          recent: limitedRecs.newThisWeek.length,
          sameAuthors: limitedRecs.sameAuthors.length,
          extending: limitedRecs.extendingWork.length,
        },
      },
      message: `Generated ${totalRecommendations} recommendations based on ${userPapers.length} papers`,
    });
  } catch (error) {
    console.error('Recommendations API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate recommendations',
        message: 'An error occurred while generating recommendations. Please try again.',
      },
      { status: 500 }
    );
  }
}
