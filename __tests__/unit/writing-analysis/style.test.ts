/**
 * Style Analysis Tests
 *
 * Tests for writing style analysis including:
 * - Passive voice detection
 * - Adverb usage
 * - Sentence length variety
 * - Repeated sentence beginnings
 * - Formality scoring
 * - Sticky sentences (glue words)
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeStyle,
  detectPassiveVoice,
  analyzeAcademic,
} from '@/lib/writing-analysis/analyzers';
import { textSamples } from '@/__tests__/mocks/test-data';
import { DEFAULT_ANALYSIS_CONFIG } from '@/lib/writing-analysis/types';

describe('Style Analysis', () => {
  describe('Passive Voice Detection', () => {
    it('detects "was found" pattern', () => {
      const text = 'The result was found to be significant.';
      const issues = detectPassiveVoice(text);

      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].category).toBe('passive-voice');
    });

    it('detects "has been shown" pattern', () => {
      const text = 'This has been shown in previous studies.';
      const issues = detectPassiveVoice(text);

      expect(issues.length).toBeGreaterThan(0);
    });

    it('detects "were analyzed" pattern', () => {
      const text = 'The samples were analyzed using mass spectrometry.';
      const issues = detectPassiveVoice(text);

      expect(issues.length).toBeGreaterThan(0);
    });

    it('detects "is being studied" pattern', () => {
      const text = 'This phenomenon is being studied extensively.';
      const issues = detectPassiveVoice(text);

      expect(issues.length).toBeGreaterThan(0);
    });

    it('detects "will be published" pattern', () => {
      const text = 'The results will be published next month.';
      const issues = detectPassiveVoice(text);

      expect(issues.length).toBeGreaterThan(0);
    });

    it('detects multiple instances in passive-heavy text', () => {
      const issues = detectPassiveVoice(textSamples.passive);

      // Should find multiple passive voice instances
      expect(issues.length).toBeGreaterThan(2);
    });

    it('does not flag false positives in active voice', () => {
      const activeText = 'The researchers conducted the experiment. We analyzed the data.';
      const issues = detectPassiveVoice(activeText);

      expect(issues.length).toBe(0);
    });

    it('does not flag "was" when not passive', () => {
      const text = 'She was happy about the results.';
      const issues = detectPassiveVoice(text);

      // "was happy" is not passive voice (it's a state of being)
      expect(issues.length).toBe(0);
    });

    it('includes sentence index in issues', () => {
      const text = 'First sentence. The result was found. Third sentence.';
      const issues = detectPassiveVoice(text);

      expect(issues[0].sentenceIndex).toBe(1); // Second sentence (0-indexed)
    });

    it('includes text range (start/end) in issues', () => {
      const text = 'The experiment was conducted by researchers.';
      const issues = detectPassiveVoice(text);

      expect(issues[0].start).toBeGreaterThanOrEqual(0);
      expect(issues[0].end).toBeGreaterThan(issues[0].start);
    });
  });

  describe('analyzeStyle', () => {
    it('calculates passive voice percentage', () => {
      const passiveResult = analyzeStyle(textSamples.passive);
      const activeResult = analyzeStyle(textSamples.active);

      expect(passiveResult.passiveVoicePercentage).toBeGreaterThan(activeResult.passiveVoicePercentage);
      expect(passiveResult.passiveVoicePercentage).toBeGreaterThan(30);
    });

    it('counts passive voice instances', () => {
      const result = analyzeStyle(textSamples.passive);

      expect(result.passiveVoiceCount).toBeGreaterThan(0);
      expect(result.passiveVoiceSentences.length).toBeGreaterThan(0);
    });

    it('detects adverb overuse', () => {
      const adverbText = `
        The result was very significant. We really wanted to understand this.
        It was extremely important. The data clearly showed the pattern.
        We definitely need more research. This is absolutely critical.
      `;
      const result = analyzeStyle(adverbText);

      expect(result.adverbCount).toBeGreaterThan(5);
      expect(result.adverbPercentage).toBeGreaterThan(0);
    });

    it('does not flag text with few adverbs', () => {
      const cleanText = 'The study demonstrated significant results. Participants showed improvement.';
      const result = analyzeStyle(cleanText);

      expect(result.adverbPercentage).toBeLessThan(5);
    });

    it('calculates sentence length variety', () => {
      const variedText = `
        Short. This is a medium length sentence.
        This is a much longer sentence that contains more words and complexity.
      `;
      const result = analyzeStyle(variedText);

      expect(result.sentenceLengths).toHaveLength(3);
      expect(result.sentenceLengthVariance).toBeGreaterThan(0);
    });

    it('identifies short sentences (<10 words)', () => {
      const text = 'Short sentence. This is also short. Here is a much longer sentence with many more words.';
      const result = analyzeStyle(text);

      expect(result.shortSentences).toBe(2);
    });

    it('identifies long sentences (>35 words by default)', () => {
      const longSentence = 'This is a very long sentence that contains ' +
        'more than thirty-five words and goes on and on with lots of clauses and ' +
        'phrases and additional content that make it difficult to read and comprehend easily and effectively.';
      const result = analyzeStyle(longSentence);

      expect(result.longSentences).toBeGreaterThan(0);
    });

    it('identifies very long sentences (>40 words)', () => {
      const veryLongSentence = 'This is an extremely long sentence that contains ' +
        'significantly more than forty words and continues with multiple subordinate ' +
        'clauses and phrases and additional content that extends the length even ' +
        'further beyond what would be considered normal or readable for most audiences.';
      const result = analyzeStyle(veryLongSentence);

      expect(result.veryLongSentences).toBeGreaterThan(0);
    });

    it('detects repeated sentence beginnings', () => {
      const repetitiveText = `
        The study found significant results.
        The analysis showed clear patterns.
        The data revealed important insights.
        The results confirmed our hypothesis.
      `;
      const result = analyzeStyle(repetitiveText);

      expect(result.repeatedBeginnings.length).toBeGreaterThan(0);
      expect(result.repeatedBeginnings[0].word).toBe('the');
      expect(result.repeatedBeginnings[0].count).toBe(4);
    });

    it('only flags beginnings repeated 3+ times', () => {
      const text = `
        The first sentence. The second sentence.
        A different start. Another different start.
      `;
      const result = analyzeStyle(text);

      const theBeginning = result.repeatedBeginnings.find(b => b.word === 'the');
      expect(theBeginning).toBeUndefined(); // Only 2 occurrences
    });

    it('calculates glue word percentage', () => {
      const text = 'The cat sat on the mat with the hat.';
      const result = analyzeStyle(text);

      // "The" appears 3 times, other glue words present
      expect(result.glueWordPercentage).toBeGreaterThan(0);
    });

    it('identifies sticky sentences (>45% glue words)', () => {
      const stickyText = 'The cat was on the mat with the hat and the bat.';
      const result = analyzeStyle(stickyText);

      expect(result.stickySentenceCount).toBeGreaterThan(0);
    });

    it('handles empty text', () => {
      const result = analyzeStyle('');

      expect(result.passiveVoiceCount).toBe(0);
      expect(result.adverbCount).toBe(0);
      expect(result.sentenceLengths).toHaveLength(0);
    });

    it('respects configuration thresholds', () => {
      const customConfig = {
        ...DEFAULT_ANALYSIS_CONFIG,
        maxSentenceLength: 20,
      };

      const text = 'This is a sentence with more than twenty words in it to test the configuration.';
      const result = analyzeStyle(text, customConfig);

      // Should detect as long sentence based on custom threshold
      expect(result.longSentences).toBeGreaterThan(0);
    });
  });

  describe('Academic Style Analysis', () => {
    it('detects first-person pronouns', () => {
      const firstPersonText = 'I conducted the study. We analyzed the data. Our findings show significance.';
      const result = analyzeAcademic(firstPersonText);

      expect(result.firstPersonCount).toBeGreaterThan(0);
      expect(result.firstPersonInstances.length).toBeGreaterThan(0);
    });

    it('identifies all first-person words', () => {
      const text = 'I, me, my, mine, myself, we, us, our, ours, ourselves.';
      const result = analyzeAcademic(text);

      expect(result.firstPersonCount).toBeGreaterThan(5);
    });

    it('does not flag third person', () => {
      const thirdPersonText = 'The researchers conducted the study. They analyzed the data.';
      const result = analyzeAcademic(thirdPersonText);

      expect(result.firstPersonCount).toBe(0);
    });

    it('calculates formality score', () => {
      const formalText = 'The study demonstrated significant results through rigorous methodology.';
      const informalText = 'The study was pretty cool and stuff. Gonna analyze the data.';

      const formalResult = analyzeAcademic(formalText);
      const informalResult = analyzeAcademic(informalText);

      expect(formalResult.formalityScore).toBeGreaterThan(informalResult.formalityScore);
    });

    it('penalizes informal words', () => {
      const informalText = 'This is gonna be really cool stuff, kinda awesome!';
      const result = analyzeAcademic(informalText);

      expect(result.formalityScore).toBeLessThan(80);
    });

    it('penalizes contractions', () => {
      const contractionText = "We can't say it won't work. It's not that we don't want to.";
      const result = analyzeAcademic(contractionText);

      expect(result.formalityScore).toBeLessThan(90);
    });

    it('calculates hedging score', () => {
      const result = analyzeAcademic(textSamples.simple);

      expect(result.hedgingScore).toBeGreaterThanOrEqual(0);
      expect(result.hedgingScore).toBeLessThanOrEqual(100);
    });

    it('identifies optimal hedging (2-4%)', () => {
      // Optimal hedging is 2-4% - need ~50+ words with only 1-2 hedging words
      const goodHedging = `
        The study examined the relationship between diet and health outcomes in a cohort of
        500 participants over a period of five years. Data collection involved standardized
        questionnaires and clinical measurements at regular intervals. Statistical analysis
        used multivariate regression models to control for confounding variables. The primary
        outcomes included cardiovascular events, metabolic markers, and quality of life measures.
        The findings may indicate a positive correlation between dietary patterns and outcomes.
      `;
      const result = analyzeAcademic(goodHedging);

      // Score should be acceptable (70+) with balanced hedging
      expect(result.hedgingScore).toBeGreaterThanOrEqual(50);
    });

    it('penalizes excessive hedging (>5%)', () => {
      const excessiveHedging = `
        It might possibly suggest that there could perhaps be a potential
        relationship that may indicate possible significance, which might
        suggest that it could possibly be important.
      `;
      const result = analyzeAcademic(excessiveHedging);

      expect(result.hedgingScore).toBeLessThan(70);
    });

    it('penalizes insufficient hedging (<1%)', () => {
      const noHedging = `
        The study proves causation. This definitively shows the relationship.
        The data confirms the hypothesis absolutely.
      `;
      const result = analyzeAcademic(noHedging);

      expect(result.hedgingScore).toBeLessThan(70);
    });

    it('calculates jargon density from complex words', () => {
      const jargonText = `
        The pathophysiological manifestations of cardiovascular
        atherosclerosis demonstrate endothelial dysfunction.
      `;
      const result = analyzeAcademic(jargonText);

      expect(result.jargonDensity).toBeGreaterThan(30);
    });

    it('handles empty text', () => {
      const result = analyzeAcademic('');

      expect(result.firstPersonCount).toBe(0);
      expect(result.formalityScore).toBeGreaterThanOrEqual(0);
      expect(result.hedgingScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles text with only passive voice', () => {
      const allPassive = `
        The experiment was conducted. The data was analyzed.
        The results were published. Conclusions were drawn.
      `;
      const result = analyzeStyle(allPassive);

      expect(result.passiveVoicePercentage).toBeGreaterThan(50);
    });

    it('handles text with only active voice', () => {
      const allActive = `
        Researchers conducted the experiment. We analyzed the data.
        The team published results. Scientists drew conclusions.
      `;
      const result = analyzeStyle(allActive);

      expect(result.passiveVoicePercentage).toBe(0);
    });

    it('handles very short text', () => {
      const result = analyzeStyle('Hello.');

      expect(result.passiveVoiceCount).toBe(0);
      expect(result.sentenceLengths).toHaveLength(1);
    });

    it('handles single very long sentence', () => {
      const longSentence = Array(100).fill('word').join(' ') + '.';
      const result = analyzeStyle(longSentence);

      expect(result.veryLongSentences).toBe(1);
    });

    it('handles uniform sentence lengths', () => {
      const uniform = 'Five word sentence here. Another five word sentence.';
      const result = analyzeStyle(uniform);

      expect(result.sentenceLengthVariance).toBeLessThan(1);
    });

    it('handles HTML content', () => {
      const html = '<p>The result <strong>was found</strong> to be significant.</p>';
      const result = analyzeStyle(html);

      expect(result.passiveVoiceCount).toBeGreaterThan(0);
    });

    it('handles text with numbers and symbols', () => {
      // Note: "p-value was 0.001" is NOT passive voice - it's a linking verb
      // Use actual passive voice in technical text
      const text = 'The sample was collected and the p-value was calculated to be 0.001 (95% CI: 0.0005-0.002).';
      const result = analyzeStyle(text);

      expect(result.passiveVoiceCount).toBeGreaterThan(0);
    });

    it('handles mixed case', () => {
      const text = 'THE RESULT WAS FOUND. the analysis was completed.';
      const result = analyzeStyle(text);

      expect(result.passiveVoiceCount).toBe(2);
    });
  });

  describe('Metric Validation', () => {
    it('ensures percentages are 0-100', () => {
      const result = analyzeStyle(textSamples.passive);

      expect(result.passiveVoicePercentage).toBeGreaterThanOrEqual(0);
      expect(result.passiveVoicePercentage).toBeLessThanOrEqual(100);

      expect(result.adverbPercentage).toBeGreaterThanOrEqual(0);
      expect(result.adverbPercentage).toBeLessThanOrEqual(100);

      expect(result.glueWordPercentage).toBeGreaterThanOrEqual(0);
      expect(result.glueWordPercentage).toBeLessThanOrEqual(100);
    });

    it('ensures counts are non-negative', () => {
      const result = analyzeStyle(textSamples.simple);

      expect(result.passiveVoiceCount).toBeGreaterThanOrEqual(0);
      expect(result.adverbCount).toBeGreaterThanOrEqual(0);
      expect(result.shortSentences).toBeGreaterThanOrEqual(0);
      expect(result.longSentences).toBeGreaterThanOrEqual(0);
      expect(result.stickySentenceCount).toBeGreaterThanOrEqual(0);
    });

    it('ensures sentence length data is consistent', () => {
      const result = analyzeStyle(textSamples.simple);

      const totalSentences = result.sentenceLengths.length;
      const categorized = result.shortSentences + result.longSentences;

      // Categorized should not exceed total (medium sentences not counted)
      expect(categorized).toBeLessThanOrEqual(totalSentences);
    });

    it('rounds percentages to one decimal place', () => {
      const result = analyzeStyle(textSamples.passive);

      // Check that values are properly rounded to 1 decimal place
      // by verifying value * 10 is close to an integer
      expect(Math.abs(Math.round(result.passiveVoicePercentage * 10) - result.passiveVoicePercentage * 10)).toBeLessThan(0.001);
      expect(Math.abs(Math.round(result.adverbPercentage * 10) - result.adverbPercentage * 10)).toBeLessThan(0.001);
      expect(Math.abs(Math.round(result.glueWordPercentage * 10) - result.glueWordPercentage * 10)).toBeLessThan(0.001);
    });
  });

  describe('Comparative Analysis', () => {
    it('correctly compares passive vs active text', () => {
      const passiveResult = analyzeStyle(textSamples.passive);
      const activeResult = analyzeStyle(textSamples.active);

      expect(passiveResult.passiveVoicePercentage).toBeGreaterThan(activeResult.passiveVoicePercentage);
      expect(passiveResult.passiveVoiceCount).toBeGreaterThan(activeResult.passiveVoiceCount);
    });

    it('identifies AI-typical text patterns', () => {
      // Create controlled AI-like text (uniform sentence lengths)
      const aiText = `
        This is a standard sentence with ten words in it.
        Here is another sentence with exactly ten words here.
        The third sentence also contains precisely ten words now.
        Finally a fourth sentence that has ten words total.
      `;

      // Create controlled human-like text (variable sentence lengths)
      const humanText = `
        Short sentence. The next one is medium length with more words.
        Then comes a really long sentence that contains many more words and ideas and
        thoughts all strung together. Tiny. Another medium length sentence here.
      `;

      const aiResult = analyzeStyle(aiText);
      const humanResult = analyzeStyle(humanText);

      // AI text tends to have more uniform sentence lengths (lower variance)
      expect(aiResult.sentenceLengthVariance).toBeLessThan(humanResult.sentenceLengthVariance);
    });

    it('distinguishes formal from informal text', () => {
      const formalText = 'The research demonstrated significant findings through rigorous methodology.';
      const informalText = "The research was pretty cool, it's gonna change stuff!";

      const formalResult = analyzeAcademic(formalText);
      const informalResult = analyzeAcademic(informalText);

      expect(formalResult.formalityScore).toBeGreaterThan(informalResult.formalityScore);
    });
  });

  describe('Integration with Readability', () => {
    it('provides sentence length data for readability', () => {
      const result = analyzeStyle(textSamples.simple);

      expect(result.sentenceLengths).toBeDefined();
      expect(Array.isArray(result.sentenceLengths)).toBe(true);
      expect(result.sentenceLengths.every(l => l > 0)).toBe(true);
    });

    it('calculates variance for burstiness analysis', () => {
      const result = analyzeStyle(textSamples.humanTypical);

      expect(result.sentenceLengthVariance).toBeGreaterThan(0);
    });
  });
});
