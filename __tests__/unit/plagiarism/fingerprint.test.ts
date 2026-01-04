/**
 * Unit Tests for Fingerprinting Module
 * Tests text normalization, n-gram generation, hashing, and winnowing algorithms
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeText,
  splitIntoWords,
  getWordPositions,
  computeHash,
  computeNgramHash,
  generateNgrams,
  generateNgramHashes,
  winnow,
  generateFingerprints,
  findMatchingFingerprints,
} from '@/lib/plagiarism/fingerprint';

describe('Text Normalization', () => {
  describe('normalizeText', () => {
    it('normalizes text consistently', () => {
      const text = 'Hello, World! This is a TEST.';
      const result = normalizeText(text);
      expect(result).toBe('hello world this is a test');
    });

    it('handles punctuation variations', () => {
      const text1 = 'Hello, world!';
      const text2 = 'Hello world';
      const text3 = 'Hello... world???';

      const result1 = normalizeText(text1);
      const result2 = normalizeText(text2);
      const result3 = normalizeText(text3);

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
      expect(result1).toBe('hello world');
    });

    it('handles whitespace variations', () => {
      const text1 = 'Hello    world';
      const text2 = 'Hello\t\tworld';
      const text3 = 'Hello\n\nworld';

      const result1 = normalizeText(text1);
      const result2 = normalizeText(text2);
      const result3 = normalizeText(text3);

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
      expect(result1).toBe('hello world');
    });

    it('handles case variations', () => {
      const text1 = 'HELLO WORLD';
      const text2 = 'hello world';
      const text3 = 'HeLLo WoRLd';

      expect(normalizeText(text1)).toBe(normalizeText(text2));
      expect(normalizeText(text2)).toBe(normalizeText(text3));
      expect(normalizeText(text1)).toBe('hello world');
    });

    it('preserves contractions', () => {
      const text = "don't can't won't it's";
      const result = normalizeText(text);
      expect(result).toBe("don't can't won't it's");
    });

    it('removes standalone apostrophes', () => {
      const text = "hello ' world";
      const result = normalizeText(text);
      expect(result).toBe('hello world');
    });

    it('handles empty string', () => {
      expect(normalizeText('')).toBe('');
    });

    it('handles only punctuation', () => {
      expect(normalizeText('!!!')).toBe('');
    });
  });

  describe('splitIntoWords', () => {
    it('splits text into words correctly', () => {
      const text = 'Hello world this is a test';
      const words = splitIntoWords(text);
      expect(words).toEqual(['hello', 'world', 'this', 'is', 'a', 'test']);
    });

    it('filters empty strings', () => {
      const text = 'hello    world';
      const words = splitIntoWords(text);
      expect(words).toEqual(['hello', 'world']);
      expect(words).not.toContain('');
    });

    it('handles empty input', () => {
      expect(splitIntoWords('')).toEqual([]);
    });
  });

  describe('getWordPositions', () => {
    it('returns correct word positions', () => {
      const text = 'Hello world test';
      const positions = getWordPositions(text);

      expect(positions).toHaveLength(3);
      expect(positions[0]).toEqual({ word: 'hello', start: 0, end: 5 });
      expect(positions[1]).toEqual({ word: 'world', start: 6, end: 11 });
      expect(positions[2]).toEqual({ word: 'test', start: 12, end: 16 });
    });

    it('handles contractions', () => {
      const text = "don't worry";
      const positions = getWordPositions(text);

      expect(positions).toHaveLength(2);
      expect(positions[0].word).toBe('dont');
      expect(positions[1].word).toBe('worry');
    });

    it('handles empty text', () => {
      expect(getWordPositions('')).toEqual([]);
    });
  });
});

describe('Hash Functions', () => {
  describe('computeHash', () => {
    it('generates consistent hashes for same string', () => {
      const str = 'hello world';
      const hash1 = computeHash(str);
      const hash2 = computeHash(str);
      expect(hash1).toBe(hash2);
    });

    it('generates different hashes for different strings', () => {
      const hash1 = computeHash('hello');
      const hash2 = computeHash('world');
      expect(hash1).not.toBe(hash2);
    });

    it('returns a number', () => {
      const hash = computeHash('test');
      expect(typeof hash).toBe('number');
    });

    it('handles empty string', () => {
      const hash = computeHash('');
      expect(hash).toBe(0);
    });

    it('is case-sensitive', () => {
      const hash1 = computeHash('Hello');
      const hash2 = computeHash('hello');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('computeNgramHash', () => {
    it('computes hash for n-gram correctly', () => {
      const words = ['hello', 'world', 'test'];
      const hash = computeNgramHash(words);

      expect(typeof hash).toBe('number');
      expect(hash).toBeGreaterThan(0);
    });

    it('is consistent for same n-gram', () => {
      const words = ['hello', 'world', 'test'];
      const hash1 = computeNgramHash(words);
      const hash2 = computeNgramHash(words);
      expect(hash1).toBe(hash2);
    });

    it('is different for different n-grams', () => {
      const ngram1 = ['hello', 'world', 'test'];
      const ngram2 = ['hello', 'world', 'different'];
      const hash1 = computeNgramHash(ngram1);
      const hash2 = computeNgramHash(ngram2);
      expect(hash1).not.toBe(hash2);
    });

    it('is order-sensitive', () => {
      const ngram1 = ['hello', 'world'];
      const ngram2 = ['world', 'hello'];
      const hash1 = computeNgramHash(ngram1);
      const hash2 = computeNgramHash(ngram2);
      expect(hash1).not.toBe(hash2);
    });
  });
});

describe('N-gram Generation', () => {
  describe('generateNgrams', () => {
    it('generates n-grams correctly', () => {
      const text = 'The quick brown fox jumps';
      const ngrams = generateNgrams(text, 3);

      expect(ngrams).toHaveLength(3); // 5 words -> 3 trigrams
      expect(ngrams[0].words).toEqual(['the', 'quick', 'brown']);
      expect(ngrams[1].words).toEqual(['quick', 'brown', 'fox']);
      expect(ngrams[2].words).toEqual(['brown', 'fox', 'jumps']);
    });

    it('includes correct n-gram text', () => {
      const text = 'hello world test';
      const ngrams = generateNgrams(text, 2);

      expect(ngrams[0].ngram).toBe('hello world');
      expect(ngrams[1].ngram).toBe('world test');
    });

    it('tracks word offsets correctly', () => {
      const text = 'a b c d e';
      const ngrams = generateNgrams(text, 2);

      expect(ngrams[0].wordOffset).toBe(0);
      expect(ngrams[1].wordOffset).toBe(1);
      expect(ngrams[2].wordOffset).toBe(2);
      expect(ngrams[3].wordOffset).toBe(3);
    });

    it('adjusts n-gram size for text shorter than n', () => {
      const text = 'hello world';
      const ngrams = generateNgrams(text, 5);
      // Should use effectiveN=2 (min of 5 and 2 words)
      expect(ngrams).toHaveLength(1);
      expect(ngrams[0].words).toEqual(['hello', 'world']);
    });

    it('handles n=1 correctly', () => {
      const text = 'hello world';
      const ngrams = generateNgrams(text, 1);
      expect(ngrams).toHaveLength(2);
      expect(ngrams[0].words).toEqual(['hello']);
      expect(ngrams[1].words).toEqual(['world']);
    });

    it('uses default n-gram size of 5', () => {
      const text = 'one two three four five six';
      const ngrams = generateNgrams(text); // Should default to 5
      expect(ngrams).toHaveLength(2);
      expect(ngrams[0].words).toHaveLength(5);
    });
  });

  describe('generateNgramHashes', () => {
    it('generates hashes for all n-grams', () => {
      const text = 'The quick brown fox jumps';
      const hashes = generateNgramHashes(text, 3);

      expect(hashes).toHaveLength(3);
      hashes.forEach(h => {
        expect(h).toHaveProperty('hash');
        expect(h).toHaveProperty('ngram');
        expect(h).toHaveProperty('position');
        expect(h).toHaveProperty('wordOffset');
      });
    });

    it('generates consistent hashes', () => {
      const text = 'hello world test';
      const hashes1 = generateNgramHashes(text, 2);
      const hashes2 = generateNgramHashes(text, 2);

      expect(hashes1).toEqual(hashes2);
    });
  });
});

describe('Winnowing Algorithm', () => {
  describe('winnow', () => {
    it('selects consistent fingerprints', () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      const hashes = generateNgramHashes(text, 5);
      const fingerprints = winnow(hashes, 4);

      expect(fingerprints.length).toBeGreaterThan(0);
      expect(fingerprints.length).toBeLessThanOrEqual(hashes.length);
    });

    it('produces same fingerprints for identical text', () => {
      const text = 'This is a test of the winnowing algorithm';
      const hashes1 = generateNgramHashes(text, 5);
      const hashes2 = generateNgramHashes(text, 5);

      const fp1 = winnow(hashes1, 4);
      const fp2 = winnow(hashes2, 4);

      expect(fp1).toEqual(fp2);
    });

    it('produces overlapping fingerprints for similar text', () => {
      const text1 = 'The quick brown fox jumps over the lazy dog in the meadow';
      const text2 = 'The quick brown fox jumps over the lazy cat in the garden';

      const hashes1 = generateNgramHashes(text1, 5);
      const hashes2 = generateNgramHashes(text2, 5);

      const fp1 = winnow(hashes1, 4);
      const fp2 = winnow(hashes2, 4);

      const hashes1Set = new Set(fp1.map(f => f.hash));
      const hashes2Set = new Set(fp2.map(f => f.hash));

      let overlap = 0;
      for (const hash of hashes1Set) {
        if (hashes2Set.has(hash)) overlap++;
      }

      // Similar texts should have some overlap (both start with "the quick brown fox jumps over the lazy")
      expect(overlap).toBeGreaterThan(0);
    });

    it('produces different fingerprints for different text', () => {
      const text1 = 'The quick brown fox jumps over the lazy dog';
      const text2 = 'Completely different content with no similarities';

      const hashes1 = generateNgramHashes(text1, 5);
      const hashes2 = generateNgramHashes(text2, 5);

      const fp1 = winnow(hashes1, 4);
      const fp2 = winnow(hashes2, 4);

      const hashes1Set = new Set(fp1.map(f => f.hash));
      const hashes2Set = new Set(fp2.map(f => f.hash));

      let overlap = 0;
      for (const hash of hashes1Set) {
        if (hashes2Set.has(hash)) overlap++;
      }

      // Different texts should have minimal overlap (could be zero)
      expect(overlap).toBeLessThan(fp1.length);
    });

    it('handles empty input', () => {
      const fingerprints = winnow([]);
      expect(fingerprints).toEqual([]);
    });

    it('handles short document (shorter than window)', () => {
      const text = 'short text';
      const hashes = generateNgramHashes(text, 2);
      const fingerprints = winnow(hashes, 10);

      // Should return all hashes when document is shorter than window
      expect(fingerprints).toEqual(hashes);
    });

    it('returns fingerprints with correct properties', () => {
      const text = 'This is a test document for winnowing';
      const hashes = generateNgramHashes(text, 5);
      const fingerprints = winnow(hashes, 4);

      fingerprints.forEach(fp => {
        expect(fp).toHaveProperty('hash');
        expect(fp).toHaveProperty('position');
        expect(fp).toHaveProperty('ngram');
        expect(fp).toHaveProperty('wordOffset');
        expect(typeof fp.hash).toBe('number');
        expect(typeof fp.position).toBe('number');
        expect(typeof fp.ngram).toBe('string');
        expect(typeof fp.wordOffset).toBe('number');
      });
    });
  });
});

describe('Document Fingerprinting', () => {
  describe('generateFingerprints', () => {
    it('generates complete fingerprint set', () => {
      const text = 'This is a test document for generating fingerprints';
      const fpSet = generateFingerprints(text, 'doc1', 5, 4);

      expect(fpSet).toHaveProperty('documentId', 'doc1');
      expect(fpSet).toHaveProperty('fingerprints');
      expect(fpSet).toHaveProperty('ngramSize', 5);
      expect(fpSet).toHaveProperty('wordCount');
      expect(fpSet).toHaveProperty('generatedAt');
      expect(Array.isArray(fpSet.fingerprints)).toBe(true);
      expect(fpSet.fingerprints.length).toBeGreaterThan(0);
    });

    it('counts words correctly', () => {
      const text = 'one two three four five six seven eight nine ten';
      const fpSet = generateFingerprints(text, 'doc1');
      expect(fpSet.wordCount).toBe(10);
    });

    it('same text produces same fingerprints', () => {
      const text = 'This is a test of fingerprint consistency';
      const fp1 = generateFingerprints(text, 'doc1');
      const fp2 = generateFingerprints(text, 'doc2');

      // Should have same number of fingerprints
      expect(fp1.fingerprints.length).toBe(fp2.fingerprints.length);

      // Should have same hashes
      const hashes1 = fp1.fingerprints.map(f => f.hash).sort();
      const hashes2 = fp2.fingerprints.map(f => f.hash).sort();
      expect(hashes1).toEqual(hashes2);
    });

    it('includes timestamp', () => {
      const text = 'test document';
      const before = Date.now();
      const fpSet = generateFingerprints(text, 'doc1');
      const after = Date.now();

      expect(fpSet.generatedAt).toBeGreaterThanOrEqual(before);
      expect(fpSet.generatedAt).toBeLessThanOrEqual(after);
    });
  });

  describe('findMatchingFingerprints', () => {
    it('finds exact matches', () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      const fp1 = generateFingerprints(text, 'doc1');
      const fp2 = generateFingerprints(text, 'doc2');

      const matches = findMatchingFingerprints(fp1, fp2);
      expect(matches.length).toBeGreaterThan(0);
    });

    it('finds partial matches', () => {
      const text1 = 'The quick brown fox jumps over the lazy dog in the meadow';
      const text2 = 'The quick brown fox jumps over the fence in the garden';

      const fp1 = generateFingerprints(text1, 'doc1');
      const fp2 = generateFingerprints(text2, 'doc2');

      const matches = findMatchingFingerprints(fp1, fp2);
      // Should find matches for "the quick brown fox jumps over the"
      expect(matches.length).toBeGreaterThan(0);
    });

    it('returns empty for completely different texts', () => {
      const text1 = 'Artificial intelligence and machine learning';
      const text2 = 'Biology and chemistry research topics';

      const fp1 = generateFingerprints(text1, 'doc1');
      const fp2 = generateFingerprints(text2, 'doc2');

      const matches = findMatchingFingerprints(fp1, fp2);
      // Could be empty or minimal
      expect(matches.length).toBeLessThan(Math.min(fp1.fingerprints.length, fp2.fingerprints.length));
    });

    it('verifies text matches not just hash collisions', () => {
      const text1 = 'test document one';
      const text2 = 'test document two';

      const fp1 = generateFingerprints(text1, 'doc1', 3);
      const fp2 = generateFingerprints(text2, 'doc2', 3);

      const matches = findMatchingFingerprints(fp1, fp2);

      // Should match on 'test document' but not on differing words
      matches.forEach(match => {
        expect(match.doc1Fingerprint.ngram).toBe(match.doc2Fingerprint.ngram);
      });
    });

    it('handles empty fingerprint sets', () => {
      const fp1 = generateFingerprints('', 'doc1');
      const fp2 = generateFingerprints('test', 'doc2');

      const matches = findMatchingFingerprints(fp1, fp2);
      expect(matches).toEqual([]);
    });
  });
});

describe('Edge Cases and Robustness', () => {
  it('handles very short text', () => {
    const text = 'Hi';
    const fpSet = generateFingerprints(text, 'doc1');
    expect(fpSet.wordCount).toBe(1);
    // Should generate 1-gram since text is shorter than default n=5
    expect(fpSet.fingerprints.length).toBeGreaterThan(0);
    expect(fpSet.fingerprints[0].ngram).toBe('hi');
  });

  it('handles text exactly n-gram size', () => {
    const text = 'one two three four five';
    const fpSet = generateFingerprints(text, 'doc1', 5);
    expect(fpSet.wordCount).toBe(5);
    expect(fpSet.fingerprints.length).toBeGreaterThan(0);
  });

  it('handles very long text', () => {
    const words = Array(1000).fill('word').map((w, i) => `${w}${i}`);
    const text = words.join(' ');
    const fpSet = generateFingerprints(text, 'doc1');

    expect(fpSet.wordCount).toBe(1000);
    expect(fpSet.fingerprints.length).toBeGreaterThan(0);
    expect(fpSet.fingerprints.length).toBeLessThan(1000); // Winnowing should reduce count
  });

  it('handles special characters correctly', () => {
    const text = 'hello@world #test $money';
    const fpSet = generateFingerprints(text, 'doc1', 2);
    expect(fpSet.wordCount).toBeGreaterThan(0);
  });

  it('handles unicode text', () => {
    const text = 'こんにちは世界 hello world';
    const fpSet = generateFingerprints(text, 'doc1');
    expect(fpSet).toHaveProperty('fingerprints');
  });

  it('handles numbers in text', () => {
    const text = 'The year 2024 is when AI becomes 100% prevalent';
    const fpSet = generateFingerprints(text, 'doc1');
    expect(fpSet.wordCount).toBeGreaterThan(0);
  });
});
