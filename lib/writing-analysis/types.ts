/**
 * Writing Analysis Types
 *
 * Type definitions for real-time writing analysis features
 * inspired by Grammarly and ProWritingAid.
 */

/**
 * Issue severity levels
 */
export type IssueSeverity = 'error' | 'warning' | 'suggestion' | 'info';

/**
 * Issue categories matching ProWritingAid's report structure
 */
export type IssueCategory =
  | 'grammar'
  | 'spelling'
  | 'punctuation'
  | 'style'
  | 'clarity'
  | 'readability'
  | 'passive-voice'
  | 'adverb-overuse'
  | 'repeated-words'
  | 'sentence-length'
  | 'sticky-sentences'
  | 'cliches'
  | 'hedging'
  | 'wordiness'
  | 'transitions'
  | 'academic';

/**
 * A single writing issue found in the text
 */
export interface WritingIssue {
  id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  message: string;
  explanation?: string;

  // Location in text
  start: number;
  end: number;
  text: string;

  // Suggestions
  suggestions?: string[];

  // For sentence-level issues
  sentenceIndex?: number;
}

/**
 * Readability metrics
 */
export interface ReadabilityMetrics {
  // Flesch Reading Ease (0-100, higher = easier)
  fleschReadingEase: number;
  fleschGradeLevel: number;

  // Gunning Fog Index (years of education needed)
  gunningFog: number;

  // Average metrics
  avgSentenceLength: number;
  avgWordLength: number;
  avgSyllablesPerWord: number;

  // Counts
  totalWords: number;
  totalSentences: number;
  totalParagraphs: number;
  totalSyllables: number;

  // Complex words (3+ syllables)
  complexWordCount: number;
  complexWordPercentage: number;
}

/**
 * Style metrics
 */
export interface StyleMetrics {
  // Passive voice
  passiveVoiceCount: number;
  passiveVoicePercentage: number;
  passiveVoiceSentences: number[];

  // Adverbs
  adverbCount: number;
  adverbPercentage: number;

  // Sentence variety
  sentenceLengths: number[];
  sentenceLengthVariance: number;
  shortSentences: number;  // < 10 words
  longSentences: number;   // > 30 words
  veryLongSentences: number; // > 40 words

  // Repeated sentence beginnings
  repeatedBeginnings: { word: string; count: number }[];

  // Glue words (sticky sentences)
  glueWordPercentage: number;
  stickySentenceCount: number;
}

/**
 * Vocabulary metrics
 */
export interface VocabularyMetrics {
  // Unique words
  uniqueWords: number;
  vocabularyRichness: number; // unique / total

  // Repeated words
  repeatedWords: { word: string; count: number; positions: number[] }[];

  // Overused words
  overusedWords: { word: string; count: number; threshold: number }[];

  // Clichés found
  cliches: { phrase: string; position: number }[];

  // Hedging words (academic)
  hedgingWords: { word: string; count: number }[];

  // Filler words
  fillerWords: { word: string; count: number }[];
}

/**
 * Academic-specific metrics
 */
export interface AcademicMetrics {
  // First person usage
  firstPersonCount: number;
  firstPersonInstances: { word: string; position: number }[];

  // Citation indicators (paragraphs that might need citations)
  uncitedClaims: number[];

  // Hedging balance
  hedgingScore: number; // 0-100, too little or too much hedging

  // Formality score
  formalityScore: number; // 0-100

  // Jargon density
  jargonDensity: number;
}

/**
 * Complete analysis result
 */
export interface WritingAnalysis {
  // Timestamp
  analyzedAt: number;

  // Issues found
  issues: WritingIssue[];

  // Metrics
  readability: ReadabilityMetrics;
  style: StyleMetrics;
  vocabulary: VocabularyMetrics;
  academic: AcademicMetrics;

  // Overall scores (0-100)
  scores: {
    overall: number;
    grammar: number;
    clarity: number;
    engagement: number;
    delivery: number;
  };
}

/**
 * Analysis configuration
 */
export interface AnalysisConfig {
  // Which checks to run
  enableGrammar: boolean;
  enableStyle: boolean;
  enableReadability: boolean;
  enableVocabulary: boolean;
  enableAcademic: boolean;

  // Thresholds
  maxSentenceLength: number;
  maxParagraphLength: number;
  passiveVoiceThreshold: number; // percentage
  adverbThreshold: number; // percentage
  repeatedWordDistance: number; // words apart

  // Academic mode
  academicMode: boolean;
  allowFirstPerson: boolean;

  // Target audience
  targetGradeLevel: number; // Flesch grade level target
}

/**
 * Default analysis configuration
 */
export const DEFAULT_ANALYSIS_CONFIG: AnalysisConfig = {
  enableGrammar: true,
  enableStyle: true,
  enableReadability: true,
  enableVocabulary: true,
  enableAcademic: true,

  maxSentenceLength: 35,
  maxParagraphLength: 150,
  passiveVoiceThreshold: 15,
  adverbThreshold: 5,
  repeatedWordDistance: 100,

  academicMode: true,
  allowFirstPerson: false,

  targetGradeLevel: 12,
};

/**
 * Readability level descriptions
 */
export const READABILITY_LEVELS: { min: number; max: number; level: string; description: string }[] = [
  { min: 90, max: 100, level: 'Very Easy', description: '5th grade - easily understood by an average 11-year-old' },
  { min: 80, max: 89, level: 'Easy', description: '6th grade - conversational English' },
  { min: 70, max: 79, level: 'Fairly Easy', description: '7th grade - fairly easy to read' },
  { min: 60, max: 69, level: 'Standard', description: '8th-9th grade - plain English' },
  { min: 50, max: 59, level: 'Fairly Difficult', description: '10th-12th grade - fairly difficult' },
  { min: 30, max: 49, level: 'Difficult', description: 'College level - difficult to read' },
  { min: 0, max: 29, level: 'Very Difficult', description: 'College graduate - very difficult' },
];

/**
 * Get readability level from Flesch score
 */
export function getReadabilityLevel(score: number): { level: string; description: string } {
  const level = READABILITY_LEVELS.find(l => score >= l.min && score <= l.max);
  return level || { level: 'Unknown', description: 'Unable to determine readability' };
}

/**
 * Score rating descriptions
 */
export function getScoreRating(score: number): { rating: string; color: string } {
  if (score >= 90) return { rating: 'Excellent', color: 'text-green-600' };
  if (score >= 80) return { rating: 'Good', color: 'text-green-500' };
  if (score >= 70) return { rating: 'Fair', color: 'text-yellow-500' };
  if (score >= 60) return { rating: 'Needs Work', color: 'text-orange-500' };
  return { rating: 'Poor', color: 'text-red-500' };
}
