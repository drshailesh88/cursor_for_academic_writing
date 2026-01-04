/**
 * Readability Metrics Tests
 *
 * Tests for readability calculation functions including:
 * - Flesch Reading Ease
 * - Flesch-Kincaid Grade Level
 * - Gunning Fog Index
 * - Word/sentence/syllable counting
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeReadability,
  splitSentences,
  splitWords,
  countSyllables,
  stripHtml,
} from '@/lib/writing-analysis/analyzers';
import { textSamples } from '@/__tests__/mocks/test-data';

describe('Readability Metrics', () => {
  describe('analyzeReadability', () => {
    it('calculates Flesch Reading Ease correctly', () => {
      const result = analyzeReadability(textSamples.simple);

      // Simple text should have high readability (80-100)
      expect(result.fleschReadingEase).toBeGreaterThan(70);
      expect(result.fleschReadingEase).toBeLessThanOrEqual(100);
    });

    it('calculates Flesch-Kincaid Grade Level', () => {
      const result = analyzeReadability(textSamples.simple);

      // Simple text should have low grade level
      expect(result.fleschGradeLevel).toBeLessThan(8);
      expect(result.fleschGradeLevel).toBeGreaterThanOrEqual(0);
    });

    it('calculates Gunning Fog Index', () => {
      const simpleResult = analyzeReadability(textSamples.simple);
      const complexResult = analyzeReadability(textSamples.complex);

      // Gunning Fog should be higher for complex text
      expect(complexResult.gunningFog).toBeGreaterThan(simpleResult.gunningFog);
    });

    it('identifies complex text as harder to read', () => {
      const simpleResult = analyzeReadability(textSamples.simple);
      const complexResult = analyzeReadability(textSamples.complex);

      // Complex text should have lower reading ease
      expect(complexResult.fleschReadingEase).toBeLessThan(simpleResult.fleschReadingEase);

      // Complex text should have higher grade level
      expect(complexResult.fleschGradeLevel).toBeGreaterThan(simpleResult.fleschGradeLevel);
    });

    it('calculates average metrics correctly', () => {
      const result = analyzeReadability(textSamples.simple);

      expect(result.avgSentenceLength).toBeGreaterThan(0);
      expect(result.avgWordLength).toBeGreaterThan(0);
      expect(result.avgSyllablesPerWord).toBeGreaterThan(0);

      // Sanity checks
      expect(result.avgSentenceLength).toBeLessThan(100);
      expect(result.avgWordLength).toBeLessThan(20);
      expect(result.avgSyllablesPerWord).toBeLessThan(10);
    });

    it('counts words, sentences, and paragraphs correctly', () => {
      const text = `
        This is the first sentence. This is the second sentence.

        This is a new paragraph. It has two sentences.
      `;
      const result = analyzeReadability(text);

      expect(result.totalSentences).toBe(4);
      expect(result.totalWords).toBeGreaterThan(10);
      expect(result.totalParagraphs).toBe(2);
    });

    it('counts complex words correctly', () => {
      const simpleResult = analyzeReadability(textSamples.simple);
      const complexResult = analyzeReadability(textSamples.complex);

      // Complex text should have more complex words (3+ syllables)
      expect(complexResult.complexWordCount).toBeGreaterThan(simpleResult.complexWordCount);
      expect(complexResult.complexWordPercentage).toBeGreaterThan(simpleResult.complexWordPercentage);
    });

    it('handles empty text', () => {
      const result = analyzeReadability('');

      expect(result.totalWords).toBe(0);
      expect(result.totalSentences).toBe(0);
      expect(result.fleschReadingEase).toBeGreaterThanOrEqual(0);
      expect(result.fleschReadingEase).toBeLessThanOrEqual(100);
    });

    it('handles single word', () => {
      const result = analyzeReadability('Hello');

      expect(result.totalWords).toBe(1);
      expect(result.totalSentences).toBe(1);
      expect(result.avgWordLength).toBeGreaterThan(0);
    });

    it('handles text with numbers', () => {
      const text = 'The study included 450 participants aged 18-65 years.';
      const result = analyzeReadability(text);

      expect(result.totalWords).toBeGreaterThan(0);
      expect(result.fleschReadingEase).toBeGreaterThan(0);
    });

    it('handles text with URLs', () => {
      const text = 'Visit https://example.com for more information.';
      const result = analyzeReadability(text);

      expect(result.totalWords).toBeGreaterThan(0);
    });

    it('handles text with citations', () => {
      const result = analyzeReadability(textSamples.withCitations);

      expect(result.totalWords).toBeGreaterThan(0);
      expect(result.totalSentences).toBeGreaterThan(0);
      expect(result.fleschReadingEase).toBeGreaterThanOrEqual(0);
    });

    it('strips HTML before analysis', () => {
      const htmlText = '<p>This is a <strong>paragraph</strong> with <em>HTML tags</em>.</p>';
      const plainText = 'This is a paragraph with HTML tags.';

      const htmlResult = analyzeReadability(htmlText);
      const plainResult = analyzeReadability(plainText);

      // Should produce similar results
      expect(htmlResult.totalWords).toBe(plainResult.totalWords);
    });

    it('rounds metrics to one decimal place', () => {
      const result = analyzeReadability(textSamples.simple);

      // Check that metrics are rounded
      expect(result.fleschReadingEase % 1).toBeLessThan(0.11);
      expect(result.fleschGradeLevel % 1).toBeLessThan(0.11);
      expect(result.avgSentenceLength % 1).toBeLessThan(0.11);
    });

    it('handles text with only whitespace', () => {
      const result = analyzeReadability('   \n\t\r\n   ');

      expect(result.totalWords).toBe(0);
      expect(result.totalSentences).toBe(0);
    });

    it('handles medical/scientific text', () => {
      const medicalText = `
        The pathophysiology of cardiovascular disease involves
        atherosclerosis and endothelial dysfunction. Hyperlipidemia
        and hypertension are major risk factors.
      `;
      const result = analyzeReadability(medicalText);

      // Medical text should be more complex
      expect(result.complexWordCount).toBeGreaterThan(0);
      expect(result.fleschGradeLevel).toBeGreaterThan(10);
    });
  });

  describe('splitSentences', () => {
    it('splits on periods, question marks, and exclamation marks', () => {
      const text = 'First sentence. Second sentence! Third sentence?';
      const sentences = splitSentences(text);

      expect(sentences).toHaveLength(3);
    });

    it('handles abbreviations correctly', () => {
      const text = 'Dr. Smith published a study. Prof. Jones reviewed it.';
      const sentences = splitSentences(text);

      expect(sentences).toHaveLength(2);
      expect(sentences[0]).toContain('Dr. Smith');
    });

    it('handles "et al." correctly', () => {
      const text = 'Smith et al. found significant results. This was important.';
      const sentences = splitSentences(text);

      expect(sentences).toHaveLength(2);
      expect(sentences[0]).toContain('et al.');
    });

    it('handles "e.g." and "i.e." correctly', () => {
      const text = 'Many diseases, e.g. diabetes, are preventable. Some factors, i.e. genetics, are not.';
      const sentences = splitSentences(text);

      expect(sentences).toHaveLength(2);
    });

    it('handles "vs." correctly', () => {
      const text = 'Treatment A vs. Treatment B showed differences. Results varied.';
      const sentences = splitSentences(text);

      expect(sentences).toHaveLength(2);
    });

    it('handles empty text', () => {
      const sentences = splitSentences('');
      expect(sentences).toHaveLength(0);
    });

    it('handles text with no sentence terminators', () => {
      const sentences = splitSentences('No period here');
      expect(sentences).toHaveLength(1);
    });
  });

  describe('splitWords', () => {
    it('splits text into words', () => {
      const words = splitWords('The quick brown fox');
      expect(words).toEqual(['the', 'quick', 'brown', 'fox']);
    });

    it('converts to lowercase', () => {
      const words = splitWords('HELLO World');
      expect(words).toEqual(['hello', 'world']);
    });

    it('handles hyphenated words', () => {
      const words = splitWords('peer-reviewed research');
      expect(words).toContain('peer-reviewed');
    });

    it('handles apostrophes', () => {
      const words = splitWords("don't can't won't");
      expect(words).toHaveLength(3);
    });

    it('removes punctuation', () => {
      const words = splitWords('Hello, world! How are you?');
      expect(words).toEqual(['hello', 'world', 'how', 'are', 'you']);
    });

    it('handles empty text', () => {
      const words = splitWords('');
      expect(words).toHaveLength(0);
    });

    it('filters out empty strings', () => {
      const words = splitWords('word1   word2    word3');
      expect(words).toEqual(['word1', 'word2', 'word3']);
    });
  });

  describe('countSyllables', () => {
    it('counts syllables in simple words', () => {
      expect(countSyllables('cat')).toBe(1);
      expect(countSyllables('hello')).toBe(2);
      expect(countSyllables('wonderful')).toBe(3);
    });

    it('counts syllables in medical terms', () => {
      expect(countSyllables('cardiovascular')).toBeGreaterThanOrEqual(4);
      expect(countSyllables('atherosclerosis')).toBeGreaterThanOrEqual(4);
    });

    it('handles words ending in "ed"', () => {
      expect(countSyllables('walked')).toBe(1);
      expect(countSyllables('created')).toBe(3);
    });

    it('handles words ending in "es"', () => {
      expect(countSyllables('boxes')).toBe(2);
    });

    it('handles words starting with "y"', () => {
      expect(countSyllables('yellow')).toBe(2);
    });

    it('returns at least 1 syllable', () => {
      expect(countSyllables('a')).toBe(1);
      expect(countSyllables('I')).toBe(1);
    });

    it('handles short words', () => {
      expect(countSyllables('it')).toBe(1);
      expect(countSyllables('the')).toBe(1);
    });

    it('handles uppercase', () => {
      expect(countSyllables('HELLO')).toBe(2);
    });

    it('removes non-alphabetic characters', () => {
      expect(countSyllables('hello123')).toBe(2);
    });
  });

  describe('stripHtml', () => {
    it('removes HTML tags', () => {
      const html = '<p>Hello <strong>world</strong></p>';
      expect(stripHtml(html)).toBe('Hello world');
    });

    it('handles nested tags', () => {
      const html = '<div><p>Nested <em>content</em></p></div>';
      expect(stripHtml(html)).toBe('Nested content');
    });

    it('converts HTML entities', () => {
      const html = '&lt;p&gt;Hello&nbsp;&amp;&nbsp;goodbye&lt;/p&gt;';
      const result = stripHtml(html);
      expect(result).toContain('<');
      expect(result).toContain('>');
      expect(result).toContain('&');
    });

    it('normalizes whitespace', () => {
      const html = '<p>Multiple    spaces\n\nand\tlines</p>';
      const result = stripHtml(html);
      expect(result).not.toMatch(/  +/);
    });

    it('handles empty text', () => {
      expect(stripHtml('')).toBe('');
    });

    it('handles text without HTML', () => {
      expect(stripHtml('Plain text')).toBe('Plain text');
    });
  });

  describe('Edge Cases', () => {
    it('handles very long text', () => {
      const longText = Array(1000).fill('This is a sentence.').join(' ');
      const result = analyzeReadability(longText);

      expect(result.totalSentences).toBe(1000);
      expect(result.fleschReadingEase).toBeGreaterThanOrEqual(0);
    });

    it('handles single character', () => {
      const result = analyzeReadability('I');

      expect(result.totalWords).toBe(1);
      expect(result.totalSentences).toBe(1);
    });

    it('handles only punctuation', () => {
      const result = analyzeReadability('!!!???...');

      expect(result.totalWords).toBe(0);
    });

    it('handles mixed languages (with English)', () => {
      const text = 'English text with some 中文 and العربية words.';
      const result = analyzeReadability(text);

      expect(result.totalWords).toBeGreaterThan(0);
    });

    it('handles scientific notation', () => {
      const text = 'The value was 1.23e-10 mol/L.';
      const result = analyzeReadability(text);

      expect(result.totalWords).toBeGreaterThan(0);
    });

    it('handles percentages and statistics', () => {
      const result = analyzeReadability(textSamples.withStats);

      expect(result.totalWords).toBeGreaterThan(0);
      expect(result.fleschReadingEase).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Metric Validation', () => {
    it('ensures metrics are within valid ranges', () => {
      const result = analyzeReadability(textSamples.simple);

      // Flesch Reading Ease: 0-100
      expect(result.fleschReadingEase).toBeGreaterThanOrEqual(0);
      expect(result.fleschReadingEase).toBeLessThanOrEqual(100);

      // Grade level: non-negative
      expect(result.fleschGradeLevel).toBeGreaterThanOrEqual(0);

      // Gunning Fog: non-negative
      expect(result.gunningFog).toBeGreaterThanOrEqual(0);

      // Percentages: 0-100
      expect(result.complexWordPercentage).toBeGreaterThanOrEqual(0);
      expect(result.complexWordPercentage).toBeLessThanOrEqual(100);
    });

    it('ensures counts are non-negative', () => {
      const result = analyzeReadability(textSamples.simple);

      expect(result.totalWords).toBeGreaterThanOrEqual(0);
      expect(result.totalSentences).toBeGreaterThanOrEqual(0);
      expect(result.totalParagraphs).toBeGreaterThanOrEqual(0);
      expect(result.totalSyllables).toBeGreaterThanOrEqual(0);
      expect(result.complexWordCount).toBeGreaterThanOrEqual(0);
    });

    it('ensures averages are reasonable', () => {
      const result = analyzeReadability(textSamples.simple);

      if (result.totalWords > 0) {
        expect(result.avgWordLength).toBeGreaterThan(0);
        expect(result.avgWordLength).toBeLessThan(50); // No word should be 50+ chars on average

        expect(result.avgSyllablesPerWord).toBeGreaterThan(0);
        expect(result.avgSyllablesPerWord).toBeLessThan(10); // Average syllables per word < 10
      }
    });
  });

  describe('Comparative Analysis', () => {
    it('correctly ranks texts by complexity', () => {
      const simple = analyzeReadability(textSamples.simple);
      const complex = analyzeReadability(textSamples.complex);

      // Simple should have higher reading ease
      expect(simple.fleschReadingEase).toBeGreaterThan(complex.fleschReadingEase);

      // Complex should have higher grade level
      expect(complex.fleschGradeLevel).toBeGreaterThan(simple.fleschGradeLevel);

      // Complex should have higher Gunning Fog
      expect(complex.gunningFog).toBeGreaterThan(simple.gunningFog);
    });

    it('detects difference between academic and casual text', () => {
      const academic = analyzeReadability(textSamples.complex);
      const casual = analyzeReadability(textSamples.humanTypical);

      // Academic text should have more complex words
      expect(academic.complexWordPercentage).toBeGreaterThan(casual.complexWordPercentage);
    });
  });
});
