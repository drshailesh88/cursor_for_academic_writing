/**
 * Smart Recommendations Engine
 *
 * Generate personalized paper recommendations:
 * - Based on user's library
 * - Missing citations from drafts
 * - Trending papers
 * - Learning from user feedback
 */

import type { SearchResult } from '@/lib/research/types';
import type {
  Recommendations,
  Recommendation,
  CitationGap,
  LearningEvent,
  RecommendationBasis,
} from './types';
import {
  searchSemanticScholar,
  getSemanticScholarById,
  getRelatedPapers,
  getCitations,
} from '@/lib/research/semantic-scholar';
import { searchOpenAlex } from '@/lib/research/openalex';

/**
 * Generate all types of recommendations for a user
 */
export async function generateRecommendations(
  userId: string,
  userPapers: SearchResult[] = [],
  learningHistory: LearningEvent[] = []
): Promise<Recommendations> {
  const [trending, missing, recent, sameAuthor, extending] = await Promise.all([
    getTrending(userPapers),
    findMissingFromLibrary(userPapers),
    getRecentPapers(userPapers),
    findSameAuthors(userPapers),
    findExtendingWork(userPapers),
  ]);

  // Apply learning to boost relevant papers
  const learnedPreferences = extractPreferences(learningHistory);
  const all = [...trending, ...missing, ...recent, ...sameAuthor, ...extending];

  return {
    userId,
    updatedAt: new Date() as any,
    hotNow: applyLearning(trending, learnedPreferences).slice(0, 10),
    missingFromReview: applyLearning(missing, learnedPreferences).slice(0, 10),
    newThisWeek: applyLearning(recent, learnedPreferences).slice(0, 10),
    sameAuthors: applyLearning(sameAuthor, learnedPreferences).slice(0, 10),
    extendingWork: applyLearning(extending, learnedPreferences).slice(0, 10),
  };
}

/**
 * Find citations missing from a review draft
 */
export async function findMissingFromReview(
  draftContent: string,
  existingCitations: SearchResult[] = []
): Promise<CitationGap[]> {
  const gaps: CitationGap[] = [];

  // Extract topics mentioned in draft
  const topics = extractTopics(draftContent);

  for (const topic of topics) {
    // Check if topic is adequately cited
    const relevantCitations = existingCitations.filter((c) =>
      isRelevant(c, topic)
    );

    if (relevantCitations.length < 2) {
      // Insufficient coverage - search for papers
      const suggested = await searchTopicPapers(topic, 5);

      gaps.push({
        topic,
        missingPapers: suggested,
        severity: relevantCitations.length === 0 ? 'high' : 'medium',
        explanation: `Only ${relevantCitations.length} citation(s) for "${topic}". Consider adding foundational and recent work.`,
      });
    }
  }

  return gaps.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

/**
 * Get trending/hot papers in a topic
 */
export async function getTrending(
  userPapers: SearchResult[],
  topic?: string
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // Determine topic from user's papers if not provided
  const searchTopic = topic || inferMainTopic(userPapers);
  if (!searchTopic) return [];

  // Search for recent papers with high citation velocity
  const currentYear = new Date().getFullYear();

  try {
    const results = await searchSemanticScholar({
      text: searchTopic,
      limit: 50,
      yearRange: { start: currentYear - 2, end: currentYear },
    });

    // Calculate citation velocity
    const withVelocity = results.results.map((paper) => ({
      paper,
      velocity: (paper.citationCount || 0) / Math.max(1, currentYear - paper.year),
    }));

    // Sort by velocity
    withVelocity.sort((a, b) => b.velocity - a.velocity);

    // Top papers with high velocity are "hot"
    for (const { paper, velocity } of withVelocity.slice(0, 20)) {
      if (velocity > 5) {
        // At least 5 citations per year
        recommendations.push({
          paperId: paper.id,
          score: Math.min(velocity / 50, 1),
          reason: `Rapidly gaining citations (${Math.round(velocity)} cites/year)`,
          type: 'trending',
          relatedPaperIds: [],
        });
      }
    }
  } catch (error) {
    console.error('Error getting trending papers:', error);
  }

  return recommendations;
}

/**
 * Learn from user feedback to improve recommendations
 */
export function learnFromFeedback(
  paperId: string,
  accepted: boolean,
  existingHistory: LearningEvent[] = []
): LearningEvent[] {
  const event: LearningEvent = {
    type: accepted ? 'accepted_recommendation' : 'rejected_recommendation',
    paperId,
    timestamp: new Date() as any,
  };

  return [...existingHistory, event];
}

// ============================================================================
// Recommendation Generators
// ============================================================================

async function findMissingFromLibrary(
  userPapers: SearchResult[]
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  if (userPapers.length === 0) return [];

  // Find highly cited papers in the same domain
  const mainTopic = inferMainTopic(userPapers);
  if (!mainTopic) return [];

  try {
    const results = await searchSemanticScholar({
      text: mainTopic,
      limit: 50,
    });

    const userPaperIds = new Set(userPapers.map((p) => p.id));

    for (const paper of results.results) {
      // Skip if user already has it
      if (userPaperIds.has(paper.id)) continue;

      // Highly cited papers the user doesn't have
      if ((paper.citationCount || 0) > 100) {
        recommendations.push({
          paperId: paper.id,
          score: Math.min((paper.citationCount || 0) / 1000, 1),
          reason: `Highly cited foundational work (${paper.citationCount} citations)`,
          type: 'missing',
          relatedPaperIds: [],
        });
      }
    }
  } catch (error) {
    console.error('Error finding missing papers:', error);
  }

  return recommendations.slice(0, 20);
}

async function getRecentPapers(
  userPapers: SearchResult[]
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  if (userPapers.length === 0) return [];

  const mainTopic = inferMainTopic(userPapers);
  if (!mainTopic) return [];

  const currentYear = new Date().getFullYear();

  try {
    const results = await searchSemanticScholar({
      text: mainTopic,
      limit: 30,
      yearRange: { start: currentYear, end: currentYear },
    });

    for (const paper of results.results) {
      recommendations.push({
        paperId: paper.id,
        score: 0.7,
        reason: `Published in ${currentYear}`,
        type: 'new',
        relatedPaperIds: [],
      });
    }
  } catch (error) {
    console.error('Error getting recent papers:', error);
  }

  return recommendations;
}

async function findSameAuthors(
  userPapers: SearchResult[]
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  if (userPapers.length === 0) return [];

  // Extract author names from user's papers
  const authors = new Set<string>();
  userPapers.forEach((paper) => {
    paper.authors.forEach((author) => authors.add(author.name));
  });

  // Search for papers by these authors
  for (const author of Array.from(authors).slice(0, 5)) {
    try {
      const results = await searchSemanticScholar({
        text: `author:${author}`,
        limit: 10,
      });

      const userPaperIds = new Set(userPapers.map((p) => p.id));

      for (const paper of results.results) {
        if (!userPaperIds.has(paper.id)) {
          recommendations.push({
            paperId: paper.id,
            score: 0.6,
            reason: `By ${author}`,
            type: 'author',
            relatedPaperIds: [],
          });
        }
      }
    } catch (error) {
      console.error('Error searching author:', error);
    }
  }

  return recommendations.slice(0, 20);
}

async function findExtendingWork(
  userPapers: SearchResult[]
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  if (userPapers.length === 0) return [];

  // Find papers that cite user's papers (extending their work)
  for (const paper of userPapers.slice(0, 5)) {
    try {
      const citations = await getCitations(paper.id, 20);

      for (const citing of citations) {
        recommendations.push({
          paperId: citing.id,
          score: 0.8,
          reason: `Cites "${paper.title.substring(0, 30)}..."`,
          type: 'extending',
          relatedPaperIds: [paper.id],
        });
      }
    } catch (error) {
      console.error('Error getting citations:', error);
    }
  }

  return recommendations.slice(0, 20);
}

// ============================================================================
// Helper Functions
// ============================================================================

function extractTopics(text: string): string[] {
  // Simple topic extraction from text
  // In production, use NLP/LLM
  const sentences = text.split(/[.!?]+/);
  const topics = new Set<string>();

  for (const sentence of sentences) {
    // Extract capitalized phrases
    const matches = sentence.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g);
    if (matches) {
      matches.forEach((m) => {
        if (m.split(' ').length >= 2) {
          topics.add(m);
        }
      });
    }
  }

  return Array.from(topics).slice(0, 10);
}

function isRelevant(paper: SearchResult, topic: string): boolean {
  const searchText = `${paper.title} ${paper.abstract}`.toLowerCase();
  const topicWords = topic.toLowerCase().split(/\s+/);

  return topicWords.some((word) => searchText.includes(word));
}

async function searchTopicPapers(topic: string, limit: number): Promise<SearchResult[]> {
  try {
    const results = await searchSemanticScholar({
      text: topic,
      limit,
    });
    return results.results;
  } catch {
    return [];
  }
}

function inferMainTopic(papers: SearchResult[]): string | null {
  if (papers.length === 0) return null;

  // Count topic occurrences
  const topicCounts = new Map<string, number>();

  papers.forEach((paper) => {
    const topics = [...(paper.categories || []), ...(paper.keywords || [])];
    topics.forEach((topic) => {
      topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
    });
  });

  // Return most common topic
  const sorted = Array.from(topicCounts.entries()).sort((a, b) => b[1] - a[1]);

  return sorted.length > 0 ? sorted[0][0] : null;
}

interface UserPreferences {
  favoredTopics: Map<string, number>;
  favoredAuthors: Map<string, number>;
  favoredYears: Map<number, number>;
}

function extractPreferences(history: LearningEvent[]): UserPreferences {
  const preferences: UserPreferences = {
    favoredTopics: new Map(),
    favoredAuthors: new Map(),
    favoredYears: new Map(),
  };

  // Positive events increase preference
  const positiveEvents = history.filter(
    (e) => e.type === 'accepted_recommendation' || e.type === 'added_paper' || e.type === 'read_paper'
  );

  for (const event of positiveEvents) {
    if (event.topic) {
      preferences.favoredTopics.set(
        event.topic,
        (preferences.favoredTopics.get(event.topic) || 0) + 1
      );
    }
  }

  return preferences;
}

function applyLearning(
  recommendations: Recommendation[],
  preferences: UserPreferences
): Recommendation[] {
  // Boost scores based on learned preferences
  return recommendations.map((rec) => {
    let boost = 0;

    // Boost recommendations for favored topics (would need paper data)
    // For now, just return original recommendations

    return {
      ...rec,
      score: Math.min(rec.score + boost, 1),
    };
  }).sort((a, b) => b.score - a.score);
}
