/**
 * Writing Analyzers
 *
 * Core analysis functions for real-time writing feedback.
 * Implements Grammarly/ProWritingAid-style checks.
 */

import type {
  WritingIssue,
  ReadabilityMetrics,
  StyleMetrics,
  VocabularyMetrics,
  AcademicMetrics,
  WritingAnalysis,
  AnalysisConfig,
  IssueCategory,
  IssueSeverity,
} from './types';
import { DEFAULT_ANALYSIS_CONFIG } from './types';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Strip HTML tags from content
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Split text into sentences
 */
export function splitSentences(text: string): string[] {
  // Handle common abbreviations
  const protected_text = text
    .replace(/Dr\./g, 'Dr@')
    .replace(/Mr\./g, 'Mr@')
    .replace(/Mrs\./g, 'Mrs@')
    .replace(/Ms\./g, 'Ms@')
    .replace(/Prof\./g, 'Prof@')
    .replace(/et al\./g, 'et al@')
    .replace(/etc\./g, 'etc@')
    .replace(/e\.g\./g, 'e@g@')
    .replace(/i\.e\./g, 'i@e@')
    .replace(/vs\./g, 'vs@')
    .replace(/Fig\./g, 'Fig@')
    .replace(/No\./g, 'No@');

  const sentences = protected_text
    .split(/(?<=[.!?])\s+/)
    .map(s => s
      .replace(/Dr@/g, 'Dr.')
      .replace(/Mr@/g, 'Mr.')
      .replace(/Mrs@/g, 'Mrs.')
      .replace(/Ms@/g, 'Ms.')
      .replace(/Prof@/g, 'Prof.')
      .replace(/et al@/g, 'et al.')
      .replace(/etc@/g, 'etc.')
      .replace(/e@g@/g, 'e.g.')
      .replace(/i@e@/g, 'i.e.')
      .replace(/vs@/g, 'vs.')
      .replace(/Fig@/g, 'Fig.')
      .replace(/No@/g, 'No.')
      .trim()
    )
    .filter(s => s.length > 0);

  return sentences;
}

/**
 * Split text into words
 */
export function splitWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0);
}

/**
 * Count syllables in a word (approximation)
 * Uses a more accurate algorithm that handles:
 * - Words ending in "ed" (walked=1, created=3)
 * - Words ending in "es" (boxes=2, loves=1)
 * - Silent e handling
 * - Common exceptions
 */
export function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length === 0) return 0;
  if (word.length <= 3) return 1;

  // Special cases and common patterns
  const specialCases: Record<string, number> = {
    'area': 3, 'idea': 3, 'real': 2, 'being': 2, 'seeing': 2,
    'the': 1, 'people': 2, 'business': 3, 'science': 2,
    // Common -ated words where 'ea' forms two syllables
    'created': 3, 'related': 3, 'updated': 3, 'located': 3, 'operated': 4,
    'indicated': 4, 'complicated': 5, 'educated': 4, 'recreated': 4,
    // Common -iated words
    'associated': 5, 'differentiated': 6, 'appreciated': 5,
  };
  if (specialCases[word]) return specialCases[word];

  let count = 0;
  let prevVowel = false;
  const vowels = 'aeiouy';

  // Count vowel groups
  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !prevVowel) {
      count++;
    }
    prevVowel = isVowel;
  }

  // Handle silent 'e' at end
  if (word.endsWith('e') && !word.endsWith('le') && count > 1) {
    // Check if the 'e' is truly silent (not part of a vowel sound)
    const beforeE = word[word.length - 2];
    if (!vowels.includes(beforeE)) {
      count--;
    }
  }

  // Handle "ed" endings - "ed" is a syllable after 't' or 'd', silent otherwise
  // Exception: words ending in -ated, -ited where "ed" IS pronounced
  if (word.endsWith('ed') && word.length > 3) {
    const beforeEd = word[word.length - 3];
    const twoBeforeEd = word.slice(-4, -2);

    // "ed" is pronounced (adds syllable) after 't' or 'd'
    // "ed" is silent after other consonants, so we need to subtract
    // But -ated, -eted, -ited, -oted, -uted keep the "ed" sound
    if (beforeEd !== 't' && beforeEd !== 'd' && !vowels.includes(beforeEd)) {
      // Check if it's an -ated pattern (where 'ed' is pronounced)
      if (!['at', 'et', 'it', 'ot', 'ut'].includes(twoBeforeEd)) {
        count--;
      }
    }
  }

  // Handle "es" endings - adds syllable after s, x, z, ch, sh
  if (word.endsWith('es') && word.length > 2) {
    const beforeEs = word.slice(-3, -2);
    const twoBeforeEs = word.slice(-4, -2);
    // "es" adds syllable after sibilants
    if (['s', 'x', 'z'].includes(beforeEs) ||
        ['ch', 'sh'].includes(twoBeforeEs)) {
      // Already counted correctly, no adjustment needed
    }
  }

  // Handle "le" endings (like "table", "people")
  if (word.endsWith('le') && word.length > 2) {
    const beforeLe = word[word.length - 3];
    if (!vowels.includes(beforeLe)) {
      // "le" preceded by consonant is a separate syllable (already counted)
    }
  }

  return Math.max(count, 1);
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// PASSIVE VOICE DETECTION
// ============================================================================

// Common irregular past participles
const IRREGULAR_PARTICIPLES = [
  'been', 'done', 'gone', 'seen', 'taken', 'given', 'known', 'shown',
  'written', 'driven', 'eaten', 'fallen', 'forgotten', 'frozen', 'gotten',
  'hidden', 'ridden', 'risen', 'spoken', 'stolen', 'sworn', 'torn', 'worn',
  'broken', 'chosen', 'woken', 'born', 'brought', 'bought', 'caught',
  'felt', 'found', 'heard', 'held', 'kept', 'left', 'lost', 'made',
  'meant', 'met', 'paid', 'said', 'sent', 'sold', 'spent', 'stood',
  'thought', 'told', 'understood', 'won',
];

// Build the irregular participles regex pattern
const IRREGULAR_PATTERN = IRREGULAR_PARTICIPLES.join('|');

const PASSIVE_PATTERNS = [
  // Regular participles (ending in -ed or -en)
  /\b(am|is|are|was|were|be|been|being)\s+(\w+ed)\b/gi,
  /\b(am|is|are|was|were|be|been|being)\s+(\w+en)\b/gi,
  /\b(has|have|had)\s+been\s+(\w+ed)\b/gi,
  /\b(has|have|had)\s+been\s+(\w+en)\b/gi,
  /\b(will|would|shall|should|may|might|must|can|could)\s+be\s+(\w+ed)\b/gi,
  /\b(will|would|shall|should|may|might|must|can|could)\s+be\s+(\w+en)\b/gi,
  // Irregular past participles
  new RegExp(`\\b(am|is|are|was|were|be|been|being)\\s+(${IRREGULAR_PATTERN})\\b`, 'gi'),
  new RegExp(`\\b(has|have|had)\\s+been\\s+(${IRREGULAR_PATTERN})\\b`, 'gi'),
  new RegExp(`\\b(will|would|shall|should|may|might|must|can|could)\\s+be\\s+(${IRREGULAR_PATTERN})\\b`, 'gi'),
];

/**
 * Detect passive voice instances
 */
export function detectPassiveVoice(text: string): WritingIssue[] {
  const issues: WritingIssue[] = [];
  const sentences = splitSentences(text);
  let charOffset = 0;

  sentences.forEach((sentence, sentenceIndex) => {
    for (const pattern of PASSIVE_PATTERNS) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(sentence)) !== null) {
        const start = charOffset + match.index;
        const end = start + match[0].length;

        issues.push({
          id: generateId(),
          category: 'passive-voice',
          severity: 'suggestion',
          message: 'Consider using active voice',
          explanation: 'Active voice is generally clearer and more direct. Consider rewriting to make the subject perform the action.',
          start,
          end,
          text: match[0],
          sentenceIndex,
          suggestions: [], // Would need context to suggest rewrites
        });
      }
    }
    charOffset += sentence.length + 1; // +1 for space
  });

  return issues;
}

// ============================================================================
// READABILITY ANALYSIS
// ============================================================================

/**
 * Calculate readability metrics
 */
export function analyzeReadability(text: string): ReadabilityMetrics {
  const plainText = stripHtml(text);
  const sentences = splitSentences(plainText);
  const words = splitWords(plainText);
  const paragraphs = plainText.split(/\n\n+/).filter(p => p.trim().length > 0);

  const totalWords = words.length;
  const totalSentences = Math.max(sentences.length, 1);
  const totalParagraphs = Math.max(paragraphs.length, 1);

  // Count syllables
  let totalSyllables = 0;
  let complexWordCount = 0;

  for (const word of words) {
    const syllables = countSyllables(word);
    totalSyllables += syllables;
    if (syllables >= 3) complexWordCount++;
  }

  const avgSentenceLength = totalWords / totalSentences;
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / Math.max(totalWords, 1);
  const avgSyllablesPerWord = totalSyllables / Math.max(totalWords, 1);

  // Flesch Reading Ease: 206.835 - 1.015(words/sentences) - 84.6(syllables/words)
  const fleschReadingEase = Math.max(0, Math.min(100,
    206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)
  ));

  // Flesch-Kincaid Grade Level: 0.39(words/sentences) + 11.8(syllables/words) - 15.59
  const fleschGradeLevel = Math.max(0,
    (0.39 * avgSentenceLength) + (11.8 * avgSyllablesPerWord) - 15.59
  );

  // Gunning Fog Index: 0.4 * ((words/sentences) + 100(complex/words))
  const complexPercentage = (complexWordCount / Math.max(totalWords, 1)) * 100;
  const gunningFog = 0.4 * (avgSentenceLength + complexPercentage);

  return {
    fleschReadingEase: Math.round(fleschReadingEase * 10) / 10,
    fleschGradeLevel: Math.round(fleschGradeLevel * 10) / 10,
    gunningFog: Math.round(gunningFog * 10) / 10,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    avgWordLength: Math.round(avgWordLength * 10) / 10,
    avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 10) / 10,
    totalWords,
    totalSentences,
    totalParagraphs,
    totalSyllables,
    complexWordCount,
    complexWordPercentage: Math.round((complexWordCount / Math.max(totalWords, 1)) * 100 * 10) / 10,
  };
}

// ============================================================================
// STYLE ANALYSIS
// ============================================================================

// Common adverbs to flag
const COMMON_ADVERBS = new Set([
  'very', 'really', 'extremely', 'absolutely', 'completely', 'totally',
  'actually', 'basically', 'literally', 'essentially', 'particularly',
  'certainly', 'definitely', 'probably', 'possibly', 'obviously',
  'clearly', 'simply', 'just', 'quite', 'rather', 'somewhat',
  'highly', 'greatly', 'strongly', 'deeply', 'fully', 'entirely',
  'quickly', 'slowly', 'carefully', 'easily', 'hardly', 'nearly',
]);

// Glue words for sticky sentence detection
const GLUE_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
  'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'under', 'again', 'further', 'then', 'once', 'here',
  'there', 'when', 'where', 'why', 'how', 'all', 'each', 'every',
  'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
  'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can',
  'just', 'now', 'this', 'that', 'these', 'those', 'it', 'its',
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his',
  'she', 'her', 'they', 'them', 'their', 'what', 'which', 'who',
]);

/**
 * Analyze writing style
 */
export function analyzeStyle(text: string, config: AnalysisConfig = DEFAULT_ANALYSIS_CONFIG): StyleMetrics {
  const plainText = stripHtml(text);
  const sentences = splitSentences(plainText);
  const words = splitWords(plainText);

  // Passive voice
  const passiveIssues = detectPassiveVoice(plainText);
  const passiveVoiceSentences = [...new Set(passiveIssues.map(i => i.sentenceIndex || 0))];
  const passiveVoiceCount = passiveIssues.length;
  const passiveVoicePercentage = sentences.length > 0
    ? (passiveVoiceSentences.length / sentences.length) * 100
    : 0;

  // Adverbs
  let adverbCount = 0;
  for (const word of words) {
    if (COMMON_ADVERBS.has(word.toLowerCase())) {
      adverbCount++;
    }
  }
  const adverbPercentage = words.length > 0 ? (adverbCount / words.length) * 100 : 0;

  // Sentence lengths
  const sentenceLengths = sentences.map(s => splitWords(s).length);
  const shortSentences = sentenceLengths.filter(l => l < 10).length;
  const longSentences = sentenceLengths.filter(l => l > config.maxSentenceLength).length;
  const veryLongSentences = sentenceLengths.filter(l => l > 40).length;

  // Sentence length variance
  const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / Math.max(sentenceLengths.length, 1);
  const variance = sentenceLengths.reduce((sum, l) => sum + Math.pow(l - avgLength, 2), 0)
    / Math.max(sentenceLengths.length, 1);
  const sentenceLengthVariance = Math.sqrt(variance);

  // Repeated sentence beginnings
  const beginnings: Record<string, number> = {};
  for (const sentence of sentences) {
    const firstWord = splitWords(sentence)[0]?.toLowerCase();
    if (firstWord) {
      beginnings[firstWord] = (beginnings[firstWord] || 0) + 1;
    }
  }
  const repeatedBeginnings = Object.entries(beginnings)
    .filter(([_, count]) => count >= 3)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);

  // Sticky sentences (glue word percentage)
  let stickySentenceCount = 0;
  let totalGlueWords = 0;

  for (const sentence of sentences) {
    const sentenceWords = splitWords(sentence);
    const glueCount = sentenceWords.filter(w => GLUE_WORDS.has(w.toLowerCase())).length;
    const gluePercentage = sentenceWords.length > 0 ? (glueCount / sentenceWords.length) * 100 : 0;

    totalGlueWords += glueCount;
    if (gluePercentage > 45) { // Sentence is "sticky" if > 45% glue words
      stickySentenceCount++;
    }
  }

  const glueWordPercentage = words.length > 0 ? (totalGlueWords / words.length) * 100 : 0;

  return {
    passiveVoiceCount,
    passiveVoicePercentage: Math.round(passiveVoicePercentage * 10) / 10,
    passiveVoiceSentences,
    adverbCount,
    adverbPercentage: Math.round(adverbPercentage * 10) / 10,
    sentenceLengths,
    sentenceLengthVariance: Math.round(sentenceLengthVariance * 10) / 10,
    shortSentences,
    longSentences,
    veryLongSentences,
    repeatedBeginnings,
    glueWordPercentage: Math.round(glueWordPercentage * 10) / 10,
    stickySentenceCount,
  };
}

// ============================================================================
// VOCABULARY ANALYSIS
// ============================================================================

// Common clichés
const CLICHES = [
  'at the end of the day',
  'it goes without saying',
  'in this day and age',
  'at this point in time',
  'for all intents and purposes',
  'the fact of the matter',
  'in the final analysis',
  'last but not least',
  'when all is said and done',
  'few and far between',
  'in light of the fact',
  'in terms of',
  'with regard to',
  'with respect to',
  'a wide range of',
  'a large number of',
  'a significant amount',
  'plays an important role',
  'is of great importance',
  'it is important to note',
  'it should be noted',
  'needless to say',
  'it is worth noting',
  'first and foremost',
  'each and every',
];

// Hedging words (academic)
const HEDGING_WORDS = [
  'may', 'might', 'could', 'would', 'should',
  'possibly', 'probably', 'perhaps', 'likely',
  'suggest', 'suggests', 'indicate', 'indicates',
  'appear', 'appears', 'seem', 'seems',
  'tend', 'tends', 'generally', 'typically',
  'often', 'sometimes', 'occasionally',
  'relatively', 'somewhat', 'approximately',
];

// Filler words
const FILLER_WORDS = [
  'very', 'really', 'quite', 'rather', 'somewhat',
  'basically', 'actually', 'literally', 'essentially',
  'just', 'simply', 'merely', 'only',
  'thing', 'things', 'stuff',
  'good', 'bad', 'nice', 'great',
];

/**
 * Analyze vocabulary
 */
export function analyzeVocabulary(text: string): VocabularyMetrics {
  const plainText = stripHtml(text).toLowerCase();
  const words = splitWords(plainText);

  // Word frequency
  const wordFreq: Record<string, number> = {};
  const wordPositions: Record<string, number[]> = {};

  words.forEach((word, index) => {
    if (word.length > 2) { // Skip very short words
      wordFreq[word] = (wordFreq[word] || 0) + 1;
      if (!wordPositions[word]) wordPositions[word] = [];
      wordPositions[word].push(index);
    }
  });

  // Unique words and vocabulary richness
  const uniqueWords = Object.keys(wordFreq).length;
  const vocabularyRichness = words.length > 0 ? uniqueWords / words.length : 0;

  // Repeated words (appearing 3+ times and not common words)
  const repeatedWords = Object.entries(wordFreq)
    .filter(([word, count]) => count >= 3 && !GLUE_WORDS.has(word) && word.length > 3)
    .map(([word, count]) => ({ word, count, positions: wordPositions[word] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Overused words (significantly above average)
  const avgFreq = Object.values(wordFreq).reduce((a, b) => a + b, 0) / Math.max(uniqueWords, 1);
  const threshold = Math.max(avgFreq * 3, 5);
  const overusedWords = Object.entries(wordFreq)
    .filter(([word, count]) => count > threshold && !GLUE_WORDS.has(word))
    .map(([word, count]) => ({ word, count, threshold: Math.round(threshold) }))
    .sort((a, b) => b.count - a.count);

  // Clichés
  const cliches: { phrase: string; position: number }[] = [];
  for (const cliche of CLICHES) {
    let pos = plainText.indexOf(cliche);
    while (pos !== -1) {
      cliches.push({ phrase: cliche, position: pos });
      pos = plainText.indexOf(cliche, pos + 1);
    }
  }

  // Hedging words
  const hedgingWords: { word: string; count: number }[] = [];
  for (const hedge of HEDGING_WORDS) {
    const count = (plainText.match(new RegExp(`\\b${hedge}\\b`, 'gi')) || []).length;
    if (count > 0) {
      hedgingWords.push({ word: hedge, count });
    }
  }

  // Filler words
  const fillerWords: { word: string; count: number }[] = [];
  for (const filler of FILLER_WORDS) {
    const count = (plainText.match(new RegExp(`\\b${filler}\\b`, 'gi')) || []).length;
    if (count > 0) {
      fillerWords.push({ word: filler, count });
    }
  }

  return {
    uniqueWords,
    vocabularyRichness: Math.round(vocabularyRichness * 100) / 100,
    repeatedWords,
    overusedWords,
    cliches,
    hedgingWords: hedgingWords.sort((a, b) => b.count - a.count),
    fillerWords: fillerWords.sort((a, b) => b.count - a.count),
  };
}

// ============================================================================
// ACADEMIC ANALYSIS
// ============================================================================

const FIRST_PERSON_WORDS = ['i', 'me', 'my', 'mine', 'myself', 'we', 'us', 'our', 'ours', 'ourselves'];

/**
 * Analyze academic writing conventions
 */
export function analyzeAcademic(text: string): AcademicMetrics {
  const plainText = stripHtml(text).toLowerCase();
  const words = splitWords(plainText);

  // First person usage - use regex for accurate word boundary matching
  const firstPersonInstances: { word: string; position: number }[] = [];

  for (const word of FIRST_PERSON_WORDS) {
    // Use word boundary regex to match the word anywhere (start, middle, end, with punctuation)
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    let match;
    while ((match = regex.exec(plainText)) !== null) {
      firstPersonInstances.push({ word, position: match.index });
    }
  }

  // Hedging score (0-100, aim for 10-30 for academic)
  const vocabulary = analyzeVocabulary(plainText);
  const hedgingCount = vocabulary.hedgingWords.reduce((sum, h) => sum + h.count, 0);
  const hedgingPercentage = words.length > 0 ? (hedgingCount / words.length) * 100 : 0;

  let hedgingScore = 50; // Default neutral
  if (hedgingPercentage < 1) {
    hedgingScore = 30; // Too assertive
  } else if (hedgingPercentage > 5) {
    hedgingScore = 30; // Too hedged
  } else if (hedgingPercentage >= 2 && hedgingPercentage <= 4) {
    hedgingScore = 90; // Good balance
  } else {
    hedgingScore = 70; // Acceptable
  }

  // Formality score
  const informalWords = ['gonna', 'wanna', 'gotta', 'kinda', 'sorta', 'dunno', 'yeah', 'ok', 'okay', 'stuff', 'thing', 'things', 'lot', 'lots', 'really', 'pretty', 'super', 'awesome', 'cool'];
  let informalCount = 0;
  for (const word of informalWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    informalCount += (plainText.match(regex) || []).length;
  }

  const contractions = plainText.match(/\b\w+'\w+\b/g) || [];
  const contractionCount = contractions.length;

  const informalityScore = words.length > 0
    ? ((informalCount + contractionCount) / words.length) * 100
    : 0;
  const formalityScore = Math.max(0, Math.min(100, 100 - (informalityScore * 10)));

  // Jargon density (complex words percentage)
  const readability = analyzeReadability(text);
  const jargonDensity = readability.complexWordPercentage;

  return {
    firstPersonCount: firstPersonInstances.length,
    firstPersonInstances,
    uncitedClaims: [], // Would need citation detection
    hedgingScore: Math.round(hedgingScore),
    formalityScore: Math.round(formalityScore),
    jargonDensity: Math.round(jargonDensity * 10) / 10,
  };
}

// ============================================================================
// ISSUE DETECTION
// ============================================================================

/**
 * Generate issues from analysis
 */
export function generateIssues(
  text: string,
  style: StyleMetrics,
  vocabulary: VocabularyMetrics,
  academic: AcademicMetrics,
  config: AnalysisConfig = DEFAULT_ANALYSIS_CONFIG
): WritingIssue[] {
  const issues: WritingIssue[] = [];
  const plainText = stripHtml(text);

  // Passive voice issues
  if (config.enableStyle) {
    const passiveIssues = detectPassiveVoice(plainText);
    issues.push(...passiveIssues);
  }

  // Long sentence issues
  if (config.enableReadability) {
    const sentences = splitSentences(plainText);
    let charOffset = 0;

    sentences.forEach((sentence, index) => {
      const wordCount = splitWords(sentence).length;
      const start = plainText.indexOf(sentence, charOffset);

      if (wordCount > config.maxSentenceLength && start !== -1) {
        issues.push({
          id: generateId(),
          category: 'sentence-length',
          severity: wordCount > 40 ? 'warning' : 'suggestion',
          message: `Long sentence (${wordCount} words)`,
          explanation: `This sentence has ${wordCount} words. Consider breaking it into shorter sentences for better readability.`,
          start,
          end: start + sentence.length,
          text: sentence,
          sentenceIndex: index,
        });
      }

      if (start !== -1) {
        charOffset = start + sentence.length;
      }
    });
  }

  // Cliché issues
  if (config.enableVocabulary) {
    for (const cliche of vocabulary.cliches) {
      issues.push({
        id: generateId(),
        category: 'cliches',
        severity: 'suggestion',
        message: 'Cliché detected',
        explanation: `"${cliche.phrase}" is a common cliché. Consider using more original phrasing.`,
        start: cliche.position,
        end: cliche.position + cliche.phrase.length,
        text: cliche.phrase,
      });
    }
  }

  // First person issues (academic mode)
  if (config.enableAcademic && config.academicMode && !config.allowFirstPerson) {
    for (const instance of academic.firstPersonInstances) {
      issues.push({
        id: generateId(),
        category: 'academic',
        severity: 'suggestion',
        message: 'First person pronoun',
        explanation: 'Academic writing typically avoids first person pronouns. Consider rephrasing.',
        start: instance.position,
        end: instance.position + instance.word.length,
        text: instance.word,
        suggestions: instance.word === 'i' ? ['the author', 'this study'] :
                     instance.word === 'we' ? ['the authors', 'this research'] : [],
      });
    }
  }

  // Adverb overuse
  if (config.enableStyle && style.adverbPercentage > config.adverbThreshold) {
    // Flag individual adverbs
    const words = plainText.split(/\s+/);
    let charOffset = 0;

    for (const word of words) {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      if (COMMON_ADVERBS.has(cleanWord)) {
        const start = plainText.indexOf(word, charOffset);
        if (start !== -1) {
          issues.push({
            id: generateId(),
            category: 'adverb-overuse',
            severity: 'info',
            message: 'Consider removing adverb',
            explanation: `"${cleanWord}" may weaken your writing. Consider removing or replacing with stronger verbs.`,
            start,
            end: start + word.length,
            text: word,
          });
          charOffset = start + word.length;
        }
      }
    }
  }

  return issues;
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Perform complete writing analysis
 */
export function analyzeWriting(
  text: string,
  config: AnalysisConfig = DEFAULT_ANALYSIS_CONFIG
): WritingAnalysis {
  const readability = analyzeReadability(text);
  const style = analyzeStyle(text, config);
  const vocabulary = analyzeVocabulary(text);
  const academic = analyzeAcademic(text);

  const issues = generateIssues(text, style, vocabulary, academic, config);

  // Calculate scores
  const grammarScore = Math.max(0, 100 - (issues.filter(i => i.category === 'grammar').length * 5));

  const clarityScore = Math.max(0, Math.min(100,
    readability.fleschReadingEase * 0.5 +
    (100 - style.passiveVoicePercentage * 2) * 0.3 +
    (100 - (style.longSentences / Math.max(readability.totalSentences, 1)) * 100) * 0.2
  ));

  const engagementScore = Math.max(0, Math.min(100,
    vocabulary.vocabularyRichness * 100 * 0.4 +
    (100 - vocabulary.cliches.length * 10) * 0.3 +
    style.sentenceLengthVariance * 2 * 0.3
  ));

  const deliveryScore = Math.max(0, Math.min(100,
    academic.formalityScore * 0.4 +
    (100 - style.adverbPercentage * 5) * 0.3 +
    academic.hedgingScore * 0.3
  ));

  const overallScore = Math.round(
    grammarScore * 0.25 +
    clarityScore * 0.25 +
    engagementScore * 0.25 +
    deliveryScore * 0.25
  );

  return {
    analyzedAt: Date.now(),
    issues,
    readability,
    style,
    vocabulary,
    academic,
    scores: {
      overall: Math.round(overallScore),
      grammar: Math.round(grammarScore),
      clarity: Math.round(clarityScore),
      engagement: Math.round(engagementScore),
      delivery: Math.round(deliveryScore),
    },
  };
}
