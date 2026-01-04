/**
 * AI Detection Module
 *
 * GPTZero-inspired AI content detection using heuristic analysis.
 * Analyzes text for patterns common in AI-generated content:
 * - Burstiness (sentence length variance)
 * - Vocabulary patterns
 * - Repetitive structures
 * - Common AI phrases
 */

import { splitSentences, splitWords, countSyllables } from '@/lib/writing-analysis/analyzers';

/**
 * AI detection result
 */
export interface AIDetectionResult {
  // Overall classification
  classification: 'human' | 'mixed' | 'ai-generated';
  confidence: 'high' | 'medium' | 'low';

  // Probability scores (0-100)
  humanProbability: number;
  aiProbability: number;

  // Individual metrics
  metrics: {
    burstiness: BurstinessScore;
    predictability: PredictabilityScore;
    vocabulary: VocabularyScore;
    patterns: PatternScore;
  };

  // Sentence-level analysis
  sentenceAnalysis: SentenceAnalysis[];

  // Flagged content
  flaggedPhrases: FlaggedPhrase[];
}

export interface BurstinessScore {
  score: number; // 0-100, higher = more human-like
  variance: number;
  description: string;
}

export interface PredictabilityScore {
  score: number; // 0-100, higher = more human-like (less predictable)
  commonPatterns: number;
  description: string;
}

export interface VocabularyScore {
  score: number; // 0-100
  uniqueRatio: number;
  repetitionRate: number;
  description: string;
}

export interface PatternScore {
  score: number; // 0-100
  aiPhrasesFound: number;
  structuralPatterns: number;
  description: string;
}

export interface SentenceAnalysis {
  text: string;
  index: number;
  aiLikelihood: number; // 0-100
  flags: string[];
}

export interface FlaggedPhrase {
  phrase: string;
  reason: string;
  position: number;
}

// Common AI-generated phrases and patterns
const AI_PHRASES = [
  // Opening patterns
  'in today\'s world',
  'in this day and age',
  'it is important to note',
  'it is worth noting',
  'it should be noted that',
  'in conclusion',
  'to summarize',
  'in summary',
  'overall',
  'all in all',

  // Filler patterns
  'as mentioned earlier',
  'as previously discussed',
  'as we can see',
  'it is clear that',
  'it is evident that',
  'it goes without saying',
  'needless to say',

  // Hedging (over-hedging is AI-like)
  'it could be argued that',
  'one might say that',
  'it is possible that',
  'there is a possibility that',

  // Transition overuse
  'furthermore',
  'moreover',
  'additionally',
  'in addition to this',
  'on the other hand',

  // Generic conclusions
  'plays a crucial role',
  'plays an important role',
  'is of paramount importance',
  'is essential for',
  'is vital for',

  // AI-specific patterns
  'delve into',
  'dive into',
  'unpack this',
  'let\'s explore',
  'let me explain',
  'i\'d be happy to',
  'certainly!',
  'absolutely!',
  'great question',
];

// Structural patterns typical of AI
const STRUCTURAL_PATTERNS = [
  /^(First|Second|Third|Fourth|Fifth|Finally),?\s/gm,
  /^(Firstly|Secondly|Thirdly|Lastly),?\s/gm,
  /^In (the first|the second|the third) place/gm,
  /^(To begin|To start|To conclude|To sum up)/gm,
  /^(Here are|Below are|The following are)/gm,
  /^(\d+\.\s){3,}/gm, // Numbered lists
];

/**
 * Calculate burstiness score (sentence length variance)
 * Human writing has more variation; AI tends to be uniform
 */
function calculateBurstiness(sentences: string[]): BurstinessScore {
  if (sentences.length < 3) {
    return {
      score: 50,
      variance: 0,
      description: 'Insufficient text for burstiness analysis',
    };
  }

  const lengths = sentences.map(s => splitWords(s).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of variation (CV) - higher = more varied = more human
  const cv = mean > 0 ? (stdDev / mean) * 100 : 0;

  // Score: CV of ~40-60% is typical for human writing
  // AI tends to have CV of ~20-30%
  let score: number;
  if (cv >= 40) {
    score = 90; // Very human-like variance
  } else if (cv >= 30) {
    score = 70; // Moderate variance
  } else if (cv >= 20) {
    score = 50; // Low variance, possibly AI
  } else {
    score = 30; // Very uniform, likely AI
  }

  const description = cv >= 35
    ? 'Natural variation in sentence length (human-like)'
    : cv >= 25
      ? 'Moderate sentence uniformity'
      : 'Very uniform sentence lengths (AI-like)';

  return { score, variance: Math.round(cv * 10) / 10, description };
}

/**
 * Calculate predictability score
 * Looks for common AI patterns and repetitive structures
 */
function calculatePredictability(text: string, sentences: string[]): PredictabilityScore {
  const lowerText = text.toLowerCase();

  // Count AI phrases
  let phraseCount = 0;
  for (const phrase of AI_PHRASES) {
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = lowerText.match(regex);
    if (matches) phraseCount += matches.length;
  }

  // Check structural patterns
  let structuralCount = 0;
  for (const pattern of STRUCTURAL_PATTERNS) {
    pattern.lastIndex = 0;
    const matches = text.match(pattern);
    if (matches) structuralCount += matches.length;
  }

  // Check sentence beginnings variety
  const beginnings = sentences.map(s => {
    const words = splitWords(s);
    return words.slice(0, 2).join(' ').toLowerCase();
  });
  const uniqueBeginnings = new Set(beginnings).size;
  const beginningVariety = sentences.length > 0 ? uniqueBeginnings / sentences.length : 1;

  const commonPatterns = phraseCount + structuralCount;

  // Score calculation
  const patternPenalty = Math.min(commonPatterns * 5, 40);
  const varietyBonus = beginningVariety * 30;
  const score = Math.max(0, Math.min(100, 70 - patternPenalty + varietyBonus));

  const description = score >= 70
    ? 'Unpredictable patterns (human-like)'
    : score >= 50
      ? 'Some predictable patterns detected'
      : 'Highly predictable patterns (AI-like)';

  return { score: Math.round(score), commonPatterns, description };
}

/**
 * Calculate vocabulary score
 */
function calculateVocabulary(words: string[]): VocabularyScore {
  if (words.length < 20) {
    return {
      score: 50,
      uniqueRatio: 0,
      repetitionRate: 0,
      description: 'Insufficient text for vocabulary analysis',
    };
  }

  const wordFreq: Record<string, number> = {};
  for (const word of words) {
    const lower = word.toLowerCase();
    if (lower.length > 2) {
      wordFreq[lower] = (wordFreq[lower] || 0) + 1;
    }
  }

  const uniqueWords = Object.keys(wordFreq).length;
  const uniqueRatio = uniqueWords / words.length;

  // Count highly repeated words (appearing 4+ times)
  const repeated = Object.values(wordFreq).filter(c => c >= 4).length;
  const repetitionRate = repeated / uniqueWords;

  // Human writing typically has uniqueRatio of 0.5-0.7
  // AI tends to be 0.4-0.55
  let score: number;
  if (uniqueRatio >= 0.6) {
    score = 85;
  } else if (uniqueRatio >= 0.5) {
    score = 70;
  } else if (uniqueRatio >= 0.4) {
    score = 50;
  } else {
    score = 35;
  }

  // Penalize high repetition
  score -= repetitionRate * 20;
  score = Math.max(0, Math.min(100, score));

  const description = score >= 70
    ? 'Rich vocabulary diversity (human-like)'
    : score >= 50
      ? 'Moderate vocabulary diversity'
      : 'Limited vocabulary diversity (AI-like)';

  return {
    score: Math.round(score),
    uniqueRatio: Math.round(uniqueRatio * 100) / 100,
    repetitionRate: Math.round(repetitionRate * 100) / 100,
    description,
  };
}

/**
 * Check for AI-specific patterns
 */
function calculatePatternScore(text: string): PatternScore {
  const lowerText = text.toLowerCase();

  // Find AI phrases
  let aiPhrasesFound = 0;
  for (const phrase of AI_PHRASES) {
    if (lowerText.includes(phrase)) {
      aiPhrasesFound++;
    }
  }

  // Find structural patterns
  let structuralPatterns = 0;
  for (const pattern of STRUCTURAL_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      structuralPatterns++;
    }
  }

  // Score calculation
  const totalPatterns = aiPhrasesFound + structuralPatterns;
  const score = Math.max(0, 100 - totalPatterns * 8);

  const description = totalPatterns === 0
    ? 'No AI-specific patterns detected'
    : totalPatterns <= 2
      ? 'Few AI-typical patterns'
      : totalPatterns <= 5
        ? 'Moderate AI patterns detected'
        : 'Many AI-typical patterns detected';

  return {
    score: Math.round(score),
    aiPhrasesFound,
    structuralPatterns,
    description,
  };
}

/**
 * Analyze individual sentences
 */
function analyzeSentences(sentences: string[]): SentenceAnalysis[] {
  return sentences.map((sentence, index) => {
    const flags: string[] = [];
    let aiLikelihood = 30; // Base likelihood

    const lower = sentence.toLowerCase();
    const words = splitWords(sentence);

    // Check for AI phrases in sentence
    for (const phrase of AI_PHRASES) {
      if (lower.includes(phrase)) {
        flags.push(`Contains AI-typical phrase: "${phrase}"`);
        aiLikelihood += 15;
      }
    }

    // Check sentence length (very uniform lengths are AI-like)
    if (words.length >= 15 && words.length <= 25) {
      // This is a "sweet spot" for AI generation
      aiLikelihood += 5;
    }

    // Check for perfect structure (subject-verb-object)
    // This is a heuristic

    // Check for hedging
    const hedgingWords = ['may', 'might', 'could', 'possibly', 'perhaps'];
    const hedgeCount = hedgingWords.filter(h => lower.includes(h)).length;
    if (hedgeCount >= 2) {
      flags.push('Heavy hedging detected');
      aiLikelihood += 10;
    }

    aiLikelihood = Math.min(100, aiLikelihood);

    return {
      text: sentence,
      index,
      aiLikelihood: Math.round(aiLikelihood),
      flags,
    };
  });
}

/**
 * Find and flag AI-like phrases
 */
function findFlaggedPhrases(text: string): FlaggedPhrase[] {
  const flagged: FlaggedPhrase[] = [];
  const lowerText = text.toLowerCase();

  for (const phrase of AI_PHRASES) {
    let pos = lowerText.indexOf(phrase);
    while (pos !== -1) {
      flagged.push({
        phrase: text.substring(pos, pos + phrase.length),
        reason: 'Common AI-generated phrase',
        position: pos,
      });
      pos = lowerText.indexOf(phrase, pos + 1);
    }
  }

  return flagged.slice(0, 10); // Limit to 10 flagged phrases
}

/**
 * Main AI detection function
 */
export function detectAIContent(text: string): AIDetectionResult {
  // Basic text processing
  const sentences = splitSentences(text);
  const words = splitWords(text);

  // Calculate individual metrics
  const burstiness = calculateBurstiness(sentences);
  const predictability = calculatePredictability(text, sentences);
  const vocabulary = calculateVocabulary(words);
  const patterns = calculatePatternScore(text);

  // Sentence-level analysis
  const sentenceAnalysis = analyzeSentences(sentences);

  // Flagged phrases
  const flaggedPhrases = findFlaggedPhrases(text);

  // Calculate overall probabilities
  // Weight: Burstiness 25%, Predictability 30%, Vocabulary 20%, Patterns 25%
  const humanScore =
    burstiness.score * 0.25 +
    predictability.score * 0.30 +
    vocabulary.score * 0.20 +
    patterns.score * 0.25;

  const humanProbability = Math.round(humanScore);
  const aiProbability = 100 - humanProbability;

  // Classification
  let classification: 'human' | 'mixed' | 'ai-generated';
  let confidence: 'high' | 'medium' | 'low';

  if (humanProbability >= 70) {
    classification = 'human';
    confidence = humanProbability >= 85 ? 'high' : 'medium';
  } else if (humanProbability >= 40) {
    classification = 'mixed';
    confidence = 'medium';
  } else {
    classification = 'ai-generated';
    confidence = humanProbability <= 25 ? 'high' : 'medium';
  }

  // Low confidence if text is too short
  if (words.length < 100) {
    confidence = 'low';
  }

  return {
    classification,
    confidence,
    humanProbability,
    aiProbability,
    metrics: {
      burstiness,
      predictability,
      vocabulary,
      patterns,
    },
    sentenceAnalysis,
    flaggedPhrases,
  };
}

/**
 * Get detection result summary
 */
export function getDetectionSummary(result: AIDetectionResult): string {
  const { classification, confidence, humanProbability } = result;

  if (classification === 'human') {
    return `This text appears to be human-written (${humanProbability}% confidence: ${confidence})`;
  } else if (classification === 'mixed') {
    return `This text appears to be a mix of human and AI content (${confidence} confidence)`;
  } else {
    return `This text shows characteristics of AI-generated content (${result.aiProbability}% AI likelihood, ${confidence} confidence)`;
  }
}
