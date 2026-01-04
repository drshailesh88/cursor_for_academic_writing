/**
 * AI Detection Tests
 *
 * Tests for AI-generated content detection including:
 * - Burstiness calculation (sentence variance)
 * - Predictability scoring
 * - Vocabulary analysis
 * - Pattern detection
 * - Overall classification
 */

import { describe, it, expect } from 'vitest';
import {
  detectAIContent,
  getDetectionSummary,
} from '@/lib/ai-detection/detector';
import { textSamples } from '@/__tests__/mocks/test-data';

describe('AI Content Detection', () => {
  describe('detectAIContent', () => {
    it('returns complete detection result', () => {
      const result = detectAIContent(textSamples.simple);

      expect(result).toHaveProperty('classification');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('humanProbability');
      expect(result).toHaveProperty('aiProbability');
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('sentenceAnalysis');
      expect(result).toHaveProperty('flaggedPhrases');
    });

    it('classifies text as human, mixed, or ai-generated', () => {
      const result = detectAIContent(textSamples.humanTypical);

      expect(['human', 'mixed', 'ai-generated']).toContain(result.classification);
    });

    it('provides confidence level', () => {
      const result = detectAIContent(textSamples.simple);

      expect(['high', 'medium', 'low']).toContain(result.confidence);
    });

    it('ensures probabilities sum to 100', () => {
      const result = detectAIContent(textSamples.simple);

      expect(result.humanProbability + result.aiProbability).toBe(100);
    });

    it('classifies obvious human text correctly', () => {
      const humanText = `
        I've been wrestling with this idea. What if we're totally wrong?
        The data surprised me - honestly, I expected the opposite.
        But that's science, right? Sometimes you get curveballs.
      `;
      const result = detectAIContent(humanText);

      // Should lean toward human classification
      expect(result.humanProbability).toBeGreaterThan(40);
    });

    it('classifies obvious AI text correctly', () => {
      const aiText = `
        In today's rapidly evolving landscape, it is important to note that
        this comprehensive analysis delves into the multifaceted aspects of
        this phenomenon. Furthermore, it is crucial to understand that various
        factors play a pivotal role in shaping these outcomes. In conclusion,
        this demonstrates the paramount importance of these considerations.
      `;
      const result = detectAIContent(aiText);

      // Should lean toward AI classification
      expect(result.aiProbability).toBeGreaterThan(40);
    });

    it('handles mixed content appropriately', () => {
      const mixedText = `
        Recent studies show interesting results. However, I'm skeptical.
        In today's world, it is important to note that further research is needed.
        But honestly? I think we're missing something.
      `;
      const result = detectAIContent(mixedText);

      expect(['human', 'mixed']).toContain(result.classification);
    });

    it('sets low confidence for very short text', () => {
      const shortText = 'This is a very short text.';
      const result = detectAIContent(shortText);

      expect(result.confidence).toBe('low');
    });

    it('provides higher confidence for longer text', () => {
      const longText = Array(50).fill(textSamples.humanTypical).join(' ');
      const result = detectAIContent(longText);

      expect(['high', 'medium']).toContain(result.confidence);
    });
  });

  describe('Burstiness Metrics', () => {
    it('calculates burstiness correctly', () => {
      const result = detectAIContent(textSamples.humanTypical);

      expect(result.metrics.burstiness.score).toBeGreaterThanOrEqual(0);
      expect(result.metrics.burstiness.score).toBeLessThanOrEqual(100);
      expect(result.metrics.burstiness.variance).toBeGreaterThanOrEqual(0);
    });

    it('human text has higher burstiness than AI', () => {
      const humanResult = detectAIContent(textSamples.humanTypical);
      const aiResult = detectAIContent(textSamples.aiTypical);

      // Human writing has more sentence length variation
      expect(humanResult.metrics.burstiness.score).toBeGreaterThan(aiResult.metrics.burstiness.score);
    });

    it('detects high variance in human writing', () => {
      const variedText = `
        Short. Medium length sentence here.
        This is a much longer sentence with more complexity and detail.
        Brief again.
      `;
      const result = detectAIContent(variedText);

      expect(result.metrics.burstiness.score).toBeGreaterThan(50);
      expect(result.metrics.burstiness.description).toContain('variance');
    });

    it('detects low variance in uniform text', () => {
      const uniformText = Array(10).fill('This is a sentence of uniform length.').join(' ');
      const result = detectAIContent(uniformText);

      expect(result.metrics.burstiness.score).toBeLessThan(60);
    });

    it('handles text with insufficient sentences', () => {
      const result = detectAIContent('One sentence.');

      expect(result.metrics.burstiness.description).toContain('Insufficient');
    });

    it('provides descriptive burstiness feedback', () => {
      const result = detectAIContent(textSamples.humanTypical);

      expect(result.metrics.burstiness.description).toBeDefined();
      expect(result.metrics.burstiness.description.length).toBeGreaterThan(0);
    });
  });

  describe('Predictability Detection', () => {
    it('detects AI-typical phrases', () => {
      const result = detectAIContent(textSamples.aiTypical);

      expect(result.metrics.predictability.commonPatterns).toBeGreaterThan(0);
      expect(result.metrics.predictability.score).toBeLessThan(80);
    });

    it('does not flag natural phrases as AI', () => {
      const naturalText = 'The study found significant results. Participants improved over time.';
      const result = detectAIContent(naturalText);

      expect(result.metrics.predictability.score).toBeGreaterThan(50);
    });

    it('detects "in today\'s world" pattern', () => {
      const text = "In today's world, technology is important.";
      const result = detectAIContent(text);

      expect(result.flaggedPhrases.length).toBeGreaterThan(0);
      expect(result.flaggedPhrases.some(p => p.phrase.toLowerCase().includes("today's world"))).toBe(true);
    });

    it('detects "it is important to note" pattern', () => {
      const text = 'It is important to note that results vary.';
      const result = detectAIContent(text);

      expect(result.flaggedPhrases.some(p => p.phrase.toLowerCase().includes('important to note'))).toBe(true);
    });

    it('detects excessive transitions (furthermore, moreover)', () => {
      const text = 'Furthermore, this is true. Moreover, that is also true. Additionally, consider this.';
      const result = detectAIContent(text);

      expect(result.metrics.predictability.commonPatterns).toBeGreaterThan(0);
    });

    it('rewards sentence beginning variety', () => {
      const variedText = `
        Research shows results. The data confirms this. However, limitations exist.
        Participants varied. Results were mixed. Further studies are needed.
      `;
      const repetitiveText = `
        The study shows results. The data confirms this. The analysis reveals patterns.
        The participants varied. The results were mixed. The conclusion is clear.
      `;

      const variedResult = detectAIContent(variedText);
      const repetitiveResult = detectAIContent(repetitiveText);

      expect(variedResult.metrics.predictability.score).toBeGreaterThan(repetitiveResult.metrics.predictability.score);
    });

    it('provides predictability description', () => {
      const result = detectAIContent(textSamples.aiTypical);

      expect(result.metrics.predictability.description).toBeDefined();
      expect(result.metrics.predictability.description.length).toBeGreaterThan(0);
    });
  });

  describe('Vocabulary Analysis', () => {
    it('calculates unique word ratio', () => {
      const result = detectAIContent(textSamples.simple);

      expect(result.metrics.vocabulary.uniqueRatio).toBeGreaterThan(0);
      expect(result.metrics.vocabulary.uniqueRatio).toBeLessThanOrEqual(1);
    });

    it('detects vocabulary diversity', () => {
      const diverseText = 'Innovative research demonstrates novel findings through rigorous methodology.';
      const repetitiveText = 'The study studied studies. The research researched research.';

      const diverseResult = detectAIContent(diverseText);
      const repetitiveResult = detectAIContent(repetitiveText);

      expect(diverseResult.metrics.vocabulary.score).toBeGreaterThan(repetitiveResult.metrics.vocabulary.score);
    });

    it('calculates repetition rate', () => {
      const result = detectAIContent(textSamples.simple);

      expect(result.metrics.vocabulary.repetitionRate).toBeGreaterThanOrEqual(0);
    });

    it('penalizes excessive word repetition', () => {
      const repetitiveText = Array(10).fill('important significant critical').join(' ');
      const result = detectAIContent(repetitiveText);

      expect(result.metrics.vocabulary.repetitionRate).toBeGreaterThan(0);
    });

    it('handles short text gracefully', () => {
      const result = detectAIContent('Short text here.');

      expect(result.metrics.vocabulary.description).toContain('Insufficient');
    });

    it('provides vocabulary description', () => {
      const result = detectAIContent(textSamples.humanTypical);

      expect(result.metrics.vocabulary.description).toBeDefined();
    });
  });

  describe('Pattern Detection', () => {
    it('detects structural patterns', () => {
      const patternText = `
        First, consider this point. Second, examine that point.
        Third, analyze the data. Finally, draw conclusions.
      `;
      const result = detectAIContent(patternText);

      expect(result.metrics.patterns.structuralPatterns).toBeGreaterThan(0);
    });

    it('detects "delve into" AI phrase', () => {
      const text = "Let's delve into this complex topic.";
      const result = detectAIContent(text);

      expect(result.flaggedPhrases.some(p => p.phrase.toLowerCase().includes('delve'))).toBe(true);
    });

    it('detects "plays a crucial role" pattern', () => {
      const text = 'This factor plays a crucial role in the outcome.';
      const result = detectAIContent(text);

      expect(result.flaggedPhrases.some(p => p.phrase.toLowerCase().includes('crucial role'))).toBe(true);
    });

    it('does not flag natural text as having AI patterns', () => {
      const naturalText = 'We examined the data carefully. Results showed improvement.';
      const result = detectAIContent(naturalText);

      expect(result.metrics.patterns.aiPhrasesFound).toBe(0);
    });

    it('counts total AI-typical patterns', () => {
      const result = detectAIContent(textSamples.aiTypical);

      const totalPatterns = result.metrics.patterns.aiPhrasesFound +
                           result.metrics.patterns.structuralPatterns;
      expect(totalPatterns).toBeGreaterThan(0);
    });

    it('scores based on pattern density', () => {
      const cleanResult = detectAIContent(textSamples.humanTypical);
      const patternResult = detectAIContent(textSamples.aiTypical);

      expect(cleanResult.metrics.patterns.score).toBeGreaterThan(patternResult.metrics.patterns.score);
    });
  });

  describe('Sentence-Level Analysis', () => {
    it('analyzes individual sentences', () => {
      const result = detectAIContent(textSamples.simple);

      expect(result.sentenceAnalysis.length).toBeGreaterThan(0);
      expect(result.sentenceAnalysis[0]).toHaveProperty('text');
      expect(result.sentenceAnalysis[0]).toHaveProperty('aiLikelihood');
      expect(result.sentenceAnalysis[0]).toHaveProperty('flags');
    });

    it('assigns AI likelihood to each sentence', () => {
      const result = detectAIContent(textSamples.aiTypical);

      result.sentenceAnalysis.forEach(sentence => {
        expect(sentence.aiLikelihood).toBeGreaterThanOrEqual(0);
        expect(sentence.aiLikelihood).toBeLessThanOrEqual(100);
      });
    });

    it('flags sentences with AI phrases', () => {
      const text = "In today's world, it is important to note that research is crucial.";
      const result = detectAIContent(text);

      expect(result.sentenceAnalysis[0].flags.length).toBeGreaterThan(0);
    });

    it('detects heavy hedging in sentences', () => {
      const hedgedText = 'It might possibly suggest that there could perhaps be significance.';
      const result = detectAIContent(hedgedText);

      const hasHedgingFlag = result.sentenceAnalysis[0].flags.some(f => f.includes('hedging'));
      expect(hasHedgingFlag).toBe(true);
    });

    it('includes sentence index', () => {
      const result = detectAIContent(textSamples.simple);

      result.sentenceAnalysis.forEach((sentence, idx) => {
        expect(sentence.index).toBe(idx);
      });
    });

    it('assigns higher likelihood to AI-typical sentences', () => {
      const text = `
        I love pizza. It is important to note that pizza is popular.
      `;
      const result = detectAIContent(text);

      // Second sentence is AI-typical
      expect(result.sentenceAnalysis[1].aiLikelihood).toBeGreaterThan(result.sentenceAnalysis[0].aiLikelihood);
    });
  });

  describe('Flagged Phrases', () => {
    it('flags AI-typical phrases', () => {
      const result = detectAIContent(textSamples.aiTypical);

      expect(result.flaggedPhrases.length).toBeGreaterThan(0);
    });

    it('includes phrase text and reason', () => {
      const text = "In conclusion, this is important.";
      const result = detectAIContent(text);

      if (result.flaggedPhrases.length > 0) {
        expect(result.flaggedPhrases[0]).toHaveProperty('phrase');
        expect(result.flaggedPhrases[0]).toHaveProperty('reason');
        expect(result.flaggedPhrases[0]).toHaveProperty('position');
      }
    });

    it('limits flagged phrases to 10', () => {
      const repetitiveText = Array(20).fill("In today's world, this is important.").join(' ');
      const result = detectAIContent(repetitiveText);

      expect(result.flaggedPhrases.length).toBeLessThanOrEqual(10);
    });

    it('does not flag natural text', () => {
      const naturalText = 'The study examined participants. Results showed improvement.';
      const result = detectAIContent(naturalText);

      expect(result.flaggedPhrases.length).toBe(0);
    });

    it('preserves original case in flagged phrases', () => {
      const text = "In Today's World, this matters.";
      const result = detectAIContent(text);

      if (result.flaggedPhrases.length > 0) {
        const flaggedText = result.flaggedPhrases[0].phrase;
        expect(flaggedText).toMatch(/[A-Z]/); // Should preserve some uppercase
      }
    });
  });

  describe('Classification Logic', () => {
    it('classifies high human probability (>70%) as human', () => {
      // Create text likely to score high on human metrics
      const humanText = `
        Wow! I'm shocked. The data? Totally unexpected.
        Short. Then a longer explanation follows. Back to brief.
      `;
      const result = detectAIContent(humanText);

      if (result.humanProbability >= 70) {
        expect(result.classification).toBe('human');
      }
    });

    it('classifies low human probability (<40%) as AI', () => {
      const aiText = `
        In today's rapidly evolving landscape, it is important to note that
        comprehensive analysis is crucial. Furthermore, various factors play
        a pivotal role. In conclusion, this demonstrates paramount importance.
      `;
      const result = detectAIContent(aiText);

      if (result.humanProbability < 40) {
        expect(result.classification).toBe('ai-generated');
      }
    });

    it('classifies middle range (40-70%) as mixed', () => {
      const mixedText = `
        The study found results. Furthermore, it is important to note
        that participants varied. However, I was surprised by the outcome.
      `;
      const result = detectAIContent(mixedText);

      if (result.humanProbability >= 40 && result.humanProbability < 70) {
        expect(result.classification).toBe('mixed');
      }
    });

    it('sets high confidence for extreme scores', () => {
      const extremeAIText = `
        In today's world, it is crucial to note that this comprehensive analysis
        delves into multifaceted aspects. Furthermore, various factors play
        pivotal roles. Moreover, it is evident that paramount importance exists.
        In conclusion, this demonstrates critical significance.
      `;
      const result = detectAIContent(extremeAIText);

      if (result.humanProbability <= 25 || result.humanProbability >= 85) {
        expect(result.confidence).toBe('high');
      }
    });

    it('uses weighted metrics for classification', () => {
      const result = detectAIContent(textSamples.humanTypical);

      // Verify all metrics contribute
      expect(result.metrics.burstiness.score).toBeDefined();
      expect(result.metrics.predictability.score).toBeDefined();
      expect(result.metrics.vocabulary.score).toBeDefined();
      expect(result.metrics.patterns.score).toBeDefined();
    });
  });

  describe('getDetectionSummary', () => {
    it('returns summary for human text', () => {
      const result = { ...detectAIContent(textSamples.humanTypical), classification: 'human' as const };
      const summary = getDetectionSummary(result);

      expect(summary).toContain('human');
      expect(summary.length).toBeGreaterThan(0);
    });

    it('returns summary for AI text', () => {
      const result = { ...detectAIContent(textSamples.aiTypical), classification: 'ai-generated' as const };
      const summary = getDetectionSummary(result);

      expect(summary).toContain('AI');
      expect(summary.length).toBeGreaterThan(0);
    });

    it('returns summary for mixed text', () => {
      const result = { ...detectAIContent(textSamples.simple), classification: 'mixed' as const };
      const summary = getDetectionSummary(result);

      expect(summary).toContain('mix');
      expect(summary.length).toBeGreaterThan(0);
    });

    it('includes confidence in summary', () => {
      const result = detectAIContent(textSamples.simple);
      const summary = getDetectionSummary(result);

      expect(summary).toMatch(/high|medium|low/);
    });

    it('includes probability percentage', () => {
      const result = detectAIContent(textSamples.simple);
      const summary = getDetectionSummary(result);

      expect(summary).toMatch(/\d+%/);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty text', () => {
      const result = detectAIContent('');

      expect(result.classification).toBeDefined();
      expect(result.confidence).toBe('low');
    });

    it('handles single sentence', () => {
      const result = detectAIContent('This is a single sentence.');

      expect(result.sentenceAnalysis).toHaveLength(1);
      expect(result.confidence).toBe('low');
    });

    it('handles very long text', () => {
      const longText = Array(100).fill(textSamples.simple).join(' ');
      const result = detectAIContent(longText);

      expect(result.sentenceAnalysis.length).toBeGreaterThan(10);
    });

    it('handles text with only AI phrases', () => {
      const allAI = `
        In today's world, it is important to note that, in conclusion,
        furthermore, moreover, it is crucial that plays a vital role.
      `;
      const result = detectAIContent(allAI);

      expect(result.flaggedPhrases.length).toBeGreaterThan(3);
    });

    it('handles text with numbers and symbols', () => {
      const text = 'The value was p < 0.001 (95% CI: 0.0005-0.002).';
      const result = detectAIContent(text);

      expect(result.classification).toBeDefined();
    });

    it('handles text with citations', () => {
      const result = detectAIContent(textSamples.withCitations);

      expect(result.classification).toBeDefined();
    });

    it('handles HTML content', () => {
      const html = '<p>In today\'s world, <strong>this is important</strong>.</p>';
      const result = detectAIContent(html);

      expect(result.classification).toBeDefined();
    });

    it('handles mixed case', () => {
      const text = 'IN TODAY\'S WORLD, this is important.';
      const result = detectAIContent(text);

      expect(result.flaggedPhrases.length).toBeGreaterThan(0);
    });

    it('handles text with special characters', () => {
      const text = "The café's résumé showed naïve coöperation.";
      const result = detectAIContent(text);

      expect(result.classification).toBeDefined();
    });

    it('handles text with line breaks', () => {
      const text = 'First line.\n\nSecond line.\n\nThird line.';
      const result = detectAIContent(text);

      expect(result.sentenceAnalysis.length).toBe(3);
    });
  });

  describe('Metric Validation', () => {
    it('ensures all scores are 0-100', () => {
      const result = detectAIContent(textSamples.simple);

      expect(result.metrics.burstiness.score).toBeGreaterThanOrEqual(0);
      expect(result.metrics.burstiness.score).toBeLessThanOrEqual(100);

      expect(result.metrics.predictability.score).toBeGreaterThanOrEqual(0);
      expect(result.metrics.predictability.score).toBeLessThanOrEqual(100);

      expect(result.metrics.vocabulary.score).toBeGreaterThanOrEqual(0);
      expect(result.metrics.vocabulary.score).toBeLessThanOrEqual(100);

      expect(result.metrics.patterns.score).toBeGreaterThanOrEqual(0);
      expect(result.metrics.patterns.score).toBeLessThanOrEqual(100);
    });

    it('ensures probabilities are 0-100', () => {
      const result = detectAIContent(textSamples.simple);

      expect(result.humanProbability).toBeGreaterThanOrEqual(0);
      expect(result.humanProbability).toBeLessThanOrEqual(100);

      expect(result.aiProbability).toBeGreaterThanOrEqual(0);
      expect(result.aiProbability).toBeLessThanOrEqual(100);
    });

    it('ensures sentence AI likelihoods are 0-100', () => {
      const result = detectAIContent(textSamples.simple);

      result.sentenceAnalysis.forEach(sentence => {
        expect(sentence.aiLikelihood).toBeGreaterThanOrEqual(0);
        expect(sentence.aiLikelihood).toBeLessThanOrEqual(100);
      });
    });

    it('ensures counts are non-negative', () => {
      const result = detectAIContent(textSamples.simple);

      expect(result.metrics.predictability.commonPatterns).toBeGreaterThanOrEqual(0);
      expect(result.metrics.patterns.aiPhrasesFound).toBeGreaterThanOrEqual(0);
      expect(result.metrics.patterns.structuralPatterns).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Comparative Analysis', () => {
    it('correctly distinguishes human from AI text', () => {
      const humanResult = detectAIContent(textSamples.humanTypical);
      const aiResult = detectAIContent(textSamples.aiTypical);

      expect(humanResult.humanProbability).toBeGreaterThan(aiResult.humanProbability);
    });

    it('detects higher burstiness in human text', () => {
      const humanResult = detectAIContent(textSamples.humanTypical);
      const aiResult = detectAIContent(textSamples.aiTypical);

      expect(humanResult.metrics.burstiness.score).toBeGreaterThan(aiResult.metrics.burstiness.score);
    });

    it('detects more patterns in AI text', () => {
      const humanResult = detectAIContent(textSamples.humanTypical);
      const aiResult = detectAIContent(textSamples.aiTypical);

      expect(aiResult.metrics.patterns.aiPhrasesFound).toBeGreaterThan(humanResult.metrics.patterns.aiPhrasesFound);
    });

    it('provides consistent results for similar text', () => {
      const result1 = detectAIContent(textSamples.simple);
      const result2 = detectAIContent(textSamples.simple);

      expect(result1.classification).toBe(result2.classification);
      expect(result1.humanProbability).toBe(result2.humanProbability);
    });
  });
});
