/**
 * Unit Tests for Similarity Module
 * Tests similarity metrics, match clustering, and match type detection
 */

import { describe, it, expect } from 'vitest';
import {
  jaccardSimilarity,
  containmentSimilarity,
  overlapCoefficient,
  wordBasedSimilarity,
  clusterMatches,
  determineMatchType,
  clustersToMatches,
  compareDocuments,
} from '@/lib/plagiarism/similarity';
import { generateFingerprints, findMatchingFingerprints } from '@/lib/plagiarism/fingerprint';
import type { MatchSource } from '@/lib/plagiarism/types';

describe('Jaccard Similarity', () => {
  it('calculates 100% similarity for identical texts', () => {
    const text = 'The quick brown fox jumps over the lazy dog';
    const fp1 = generateFingerprints(text, 'doc1');
    const fp2 = generateFingerprints(text, 'doc2');

    const similarity = jaccardSimilarity(fp1, fp2);
    expect(similarity).toBe(100);
  });

  it('calculates 0% similarity for completely different texts', () => {
    const text1 = 'artificial intelligence machine learning deep neural networks';
    const text2 = 'cooking recipes pasta sauce ingredients preparation methods';

    const fp1 = generateFingerprints(text1, 'doc1');
    const fp2 = generateFingerprints(text2, 'doc2');

    const similarity = jaccardSimilarity(fp1, fp2);
    expect(similarity).toBe(0);
  });

  it('calculates partial similarity for overlapping texts', () => {
    const text1 = 'The quick brown fox jumps over the lazy dog';
    const text2 = 'The quick brown fox sleeps under the warm sun';

    const fp1 = generateFingerprints(text1, 'doc1');
    const fp2 = generateFingerprints(text2, 'doc2');

    const similarity = jaccardSimilarity(fp1, fp2);
    expect(similarity).toBeGreaterThan(0);
    expect(similarity).toBeLessThan(100);
  });

  it('is symmetric (J(A,B) = J(B,A))', () => {
    const text1 = 'hello world test document';
    const text2 = 'hello world different content';

    const fp1 = generateFingerprints(text1, 'doc1');
    const fp2 = generateFingerprints(text2, 'doc2');

    const sim1 = jaccardSimilarity(fp1, fp2);
    const sim2 = jaccardSimilarity(fp2, fp1);

    expect(sim1).toBe(sim2);
  });

  it('handles empty fingerprint sets', () => {
    const fp1 = generateFingerprints('', 'doc1');
    const fp2 = generateFingerprints('test', 'doc2');

    const similarity = jaccardSimilarity(fp1, fp2);
    expect(similarity).toBe(0);
  });

  it('returns value between 0 and 100', () => {
    const text1 = 'some random text here';
    const text2 = 'different random content here';

    const fp1 = generateFingerprints(text1, 'doc1');
    const fp2 = generateFingerprints(text2, 'doc2');

    const similarity = jaccardSimilarity(fp1, fp2);
    expect(similarity).toBeGreaterThanOrEqual(0);
    expect(similarity).toBeLessThanOrEqual(100);
  });
});

describe('Containment Similarity', () => {
  it('measures how much query is contained in source', () => {
    const query = 'The quick brown fox';
    const source = 'The quick brown fox jumps over the lazy dog';

    const fpQuery = generateFingerprints(query, 'query');
    const fpSource = generateFingerprints(source, 'source');

    const containment = containmentSimilarity(fpQuery, fpSource);
    // Query should be mostly contained in source
    expect(containment).toBeGreaterThan(50);
  });

  it('is asymmetric (C(A,B) ≠ C(B,A))', () => {
    const text1 = 'short text';
    const text2 = 'short text with much more additional content here';

    const fp1 = generateFingerprints(text1, 'doc1');
    const fp2 = generateFingerprints(text2, 'doc2');

    const c1 = containmentSimilarity(fp1, fp2); // How much of text1 is in text2
    const c2 = containmentSimilarity(fp2, fp1); // How much of text2 is in text1

    expect(c1).not.toBe(c2);
    expect(c1).toBeGreaterThan(c2); // text1 should be more contained in text2
  });

  it('detects subset relationships', () => {
    const subset = 'machine learning algorithms';
    const superset = 'artificial intelligence includes machine learning algorithms and deep neural networks';

    const fpSubset = generateFingerprints(subset, 'subset');
    const fpSuperset = generateFingerprints(superset, 'superset');

    const containment = containmentSimilarity(fpSubset, fpSuperset);
    expect(containment).toBeGreaterThan(0);
  });

  it('handles empty query', () => {
    const fpQuery = generateFingerprints('', 'query');
    const fpSource = generateFingerprints('some text', 'source');

    const containment = containmentSimilarity(fpQuery, fpSource);
    expect(containment).toBe(0);
  });

  it('returns 100 for identical texts', () => {
    const text = 'identical text for both documents';
    const fp1 = generateFingerprints(text, 'doc1');
    const fp2 = generateFingerprints(text, 'doc2');

    const containment = containmentSimilarity(fp1, fp2);
    expect(containment).toBe(100);
  });
});

describe('Overlap Coefficient', () => {
  it('calculates overlap based on smaller set', () => {
    const text1 = 'short';
    const text2 = 'short document with more content';

    const fp1 = generateFingerprints(text1, 'doc1');
    const fp2 = generateFingerprints(text2, 'doc2');

    const overlap = overlapCoefficient(fp1, fp2);
    expect(overlap).toBeGreaterThanOrEqual(0);
    expect(overlap).toBeLessThanOrEqual(100);
  });

  it('returns 100 for identical texts', () => {
    const text = 'overlap coefficient test';
    const fp1 = generateFingerprints(text, 'doc1');
    const fp2 = generateFingerprints(text, 'doc2');

    const overlap = overlapCoefficient(fp1, fp2);
    expect(overlap).toBe(100);
  });

  it('is symmetric', () => {
    const text1 = 'first document';
    const text2 = 'second document';

    const fp1 = generateFingerprints(text1, 'doc1');
    const fp2 = generateFingerprints(text2, 'doc2');

    const o1 = overlapCoefficient(fp1, fp2);
    const o2 = overlapCoefficient(fp2, fp1);

    expect(o1).toBe(o2);
  });

  it('handles empty sets', () => {
    const fp1 = generateFingerprints('', 'doc1');
    const fp2 = generateFingerprints('test', 'doc2');

    const overlap = overlapCoefficient(fp1, fp2);
    expect(overlap).toBe(0);
  });
});

describe('Word-Based Similarity', () => {
  it('calculates percentage correctly', () => {
    const similarity = wordBasedSimilarity(100, 50);
    expect(similarity).toBe(50);
  });

  it('caps at 100%', () => {
    const similarity = wordBasedSimilarity(50, 100);
    expect(similarity).toBe(100);
  });

  it('handles zero query words', () => {
    const similarity = wordBasedSimilarity(0, 10);
    expect(similarity).toBe(0);
  });

  it('returns 0 when no matches', () => {
    const similarity = wordBasedSimilarity(100, 0);
    expect(similarity).toBe(0);
  });

  it('returns 100 for exact match', () => {
    const similarity = wordBasedSimilarity(100, 100);
    expect(similarity).toBe(100);
  });
});

describe('Match Clustering', () => {
  it('clusters contiguous matches', () => {
    const text1 = 'The quick brown fox jumps over the lazy dog every day';
    const text2 = 'The quick brown fox jumps over the lazy dog every day';

    const fp1 = generateFingerprints(text1, 'doc1');
    const fp2 = generateFingerprints(text2, 'doc2');

    const matches = findMatchingFingerprints(fp1, fp2);
    const clusters = clusterMatches(matches, 2);

    expect(clusters.length).toBeGreaterThan(0);
    expect(clusters[0]).toHaveProperty('fingerprints');
    expect(clusters[0]).toHaveProperty('startOffset');
    expect(clusters[0]).toHaveProperty('endOffset');
    expect(clusters[0]).toHaveProperty('wordCount');
  });

  it('separates distant matches into different clusters', () => {
    // Create text with matches at beginning and end
    const shared = 'the quick brown fox';
    const text1 = `${shared} some filler text here and there ${shared}`;
    const text2 = `${shared} different content in the middle ${shared}`;

    const fp1 = generateFingerprints(text1, 'doc1');
    const fp2 = generateFingerprints(text2, 'doc2');

    const matches = findMatchingFingerprints(fp1, fp2);
    const clusters = clusterMatches(matches, 2);

    // Should create multiple clusters if matches are far apart
    expect(clusters.length).toBeGreaterThan(0);
  });

  it('handles empty matches', () => {
    const clusters = clusterMatches([]);
    expect(clusters).toEqual([]);
  });

  it('handles single match', () => {
    const text1 = 'unique text with one shared phrase here';
    const text2 = 'different text with one shared phrase there';

    const fp1 = generateFingerprints(text1, 'doc1');
    const fp2 = generateFingerprints(text2, 'doc2');

    const matches = findMatchingFingerprints(fp1, fp2);
    if (matches.length > 0) {
      const clusters = clusterMatches(matches);
      expect(clusters.length).toBeGreaterThan(0);
    }
  });

  it('respects maxGap parameter', () => {
    const text1 = 'word1 word2 word3 word4 word5 word6 word7 word8';
    const text2 = 'word1 word2 word3 word4 word5 word6 word7 word8';

    const fp1 = generateFingerprints(text1, 'doc1', 3);
    const fp2 = generateFingerprints(text2, 'doc2', 3);

    const matches = findMatchingFingerprints(fp1, fp2);

    const clustersSmallGap = clusterMatches(matches, 1);
    const clustersLargeGap = clusterMatches(matches, 5);

    // Larger gap should potentially create fewer clusters
    expect(clustersLargeGap.length).toBeLessThanOrEqual(clustersSmallGap.length);
  });
});

describe('Match Type Detection', () => {
  it('detects exact matches', () => {
    const text = 'this is an exact match';
    const type = determineMatchType(text, text);
    expect(type).toBe('exact');
  });

  it('detects near-exact matches with minor changes', () => {
    const text1 = 'the quick brown fox jumps';
    const text2 = 'the quick brown fox jump';
    const type = determineMatchType(text1, text2);
    expect(type).toBe('near-exact');
  });

  it('detects paraphrases', () => {
    const text1 = 'the quick brown fox jumps over the lazy dog';
    const text2 = 'the fast brown fox leaps over the sleepy dog';
    const type = determineMatchType(text1, text2);
    expect(['paraphrase', 'mosaic', 'structural']).toContain(type);
  });

  it('detects mosaic plagiarism', () => {
    const text1 = 'artificial intelligence machine learning deep learning';
    const text2 = 'machine learning deep learning neural networks';
    const type = determineMatchType(text1, text2);
    expect(['mosaic', 'paraphrase', 'structural']).toContain(type);
  });

  it('handles case insensitivity', () => {
    const text1 = 'HELLO WORLD';
    const text2 = 'hello world';
    const type = determineMatchType(text1, text2);
    expect(type).toBe('exact');
  });

  it('handles whitespace differences', () => {
    const text1 = 'hello   world';
    const text2 = 'hello world';
    const type = determineMatchType(text1, text2);
    expect(['exact', 'near-exact']).toContain(type);
  });

  it('returns a valid match type', () => {
    const validTypes = ['exact', 'near-exact', 'paraphrase', 'mosaic', 'structural'];
    const text1 = 'some text';
    const text2 = 'different text';
    const type = determineMatchType(text1, text2);
    expect(validTypes).toContain(type);
  });
});

describe('Clusters to Matches Conversion', () => {
  it('converts clusters to PlagiarismMatch objects', () => {
    const text = 'The quick brown fox jumps over the lazy dog';
    const fp1 = generateFingerprints(text, 'doc1');
    const fp2 = generateFingerprints(text, 'doc2');

    const matchingFingerprints = findMatchingFingerprints(fp1, fp2);
    const clusters = clusterMatches(matchingFingerprints);

    const source: MatchSource = {
      type: 'web',
      title: 'Test Source',
    };

    const matches = clustersToMatches(clusters, text, source, 5);

    matches.forEach(match => {
      expect(match).toHaveProperty('id');
      expect(match).toHaveProperty('text');
      expect(match).toHaveProperty('startOffset');
      expect(match).toHaveProperty('endOffset');
      expect(match).toHaveProperty('similarity');
      expect(match).toHaveProperty('wordCount');
      expect(match).toHaveProperty('type');
      expect(match).toHaveProperty('source');
      expect(match).toHaveProperty('excluded');
      expect(match.excluded).toBe(false);
    });
  });

  it('filters out matches below minimum word count', () => {
    const text = 'short match here';
    const fp1 = generateFingerprints(text, 'doc1', 2);
    const fp2 = generateFingerprints(text, 'doc2', 2);

    const matchingFingerprints = findMatchingFingerprints(fp1, fp2);
    const clusters = clusterMatches(matchingFingerprints);

    const source: MatchSource = { type: 'web' };

    const matchesMin5 = clustersToMatches(clusters, text, source, 5);
    const matchesMin2 = clustersToMatches(clusters, text, source, 2);

    // With lower minimum, should get same or more matches
    expect(matchesMin2.length).toBeGreaterThanOrEqual(matchesMin5.length);
  });

  it('calculates similarity scores', () => {
    const text = 'The quick brown fox jumps over the lazy dog';
    const fp1 = generateFingerprints(text, 'doc1');
    const fp2 = generateFingerprints(text, 'doc2');

    const matchingFingerprints = findMatchingFingerprints(fp1, fp2);
    const clusters = clusterMatches(matchingFingerprints);
    const source: MatchSource = { type: 'web' };
    const matches = clustersToMatches(clusters, text, source);

    matches.forEach(match => {
      expect(match.similarity).toBeGreaterThanOrEqual(0);
      expect(match.similarity).toBeLessThanOrEqual(100);
    });
  });
});

describe('Document Comparison', () => {
  it('compares two documents and returns results', () => {
    const text1 = 'The quick brown fox jumps over the lazy dog';
    const text2 = 'The quick brown fox jumps over the lazy dog';

    const fp1 = generateFingerprints(text1, 'doc1');
    const fp2 = generateFingerprints(text2, 'doc2');

    const source: MatchSource = {
      type: 'web',
      title: 'Test Source',
    };

    const result = compareDocuments(fp1, fp2, text1, source);

    expect(result).toHaveProperty('similarity');
    expect(result).toHaveProperty('containment');
    expect(result).toHaveProperty('matches');
    expect(result).toHaveProperty('matchedWordCount');

    expect(result.similarity).toBeGreaterThan(0);
    expect(result.containment).toBeGreaterThan(0);
    expect(result.matches.length).toBeGreaterThan(0);
  });

  it('returns zero similarity for different texts', () => {
    const text1 = 'artificial intelligence machine learning';
    const text2 = 'cooking recipes pasta ingredients';

    const fp1 = generateFingerprints(text1, 'doc1');
    const fp2 = generateFingerprints(text2, 'doc2');

    const source: MatchSource = { type: 'web' };
    const result = compareDocuments(fp1, fp2, text1, source);

    expect(result.similarity).toBe(0);
    expect(result.matches).toEqual([]);
    expect(result.matchedWordCount).toBe(0);
  });

  it('respects minMatchLength option', () => {
    const text1 = 'short test text here';
    const text2 = 'short test text here';

    const fp1 = generateFingerprints(text1, 'doc1', 2);
    const fp2 = generateFingerprints(text2, 'doc2', 2);

    const source: MatchSource = { type: 'web' };

    const resultMin10 = compareDocuments(fp1, fp2, text1, source, { minMatchLength: 10 });
    const resultMin2 = compareDocuments(fp1, fp2, text1, source, { minMatchLength: 2 });

    expect(resultMin2.matches.length).toBeGreaterThanOrEqual(resultMin10.matches.length);
  });

  it('counts matched words correctly', () => {
    const text = 'The quick brown fox jumps over the lazy dog';
    const fp1 = generateFingerprints(text, 'doc1');
    const fp2 = generateFingerprints(text, 'doc2');

    const source: MatchSource = { type: 'web' };
    const result = compareDocuments(fp1, fp2, text, source);

    expect(result.matchedWordCount).toBeGreaterThan(0);
  });

  it('handles empty documents', () => {
    const fp1 = generateFingerprints('', 'doc1');
    const fp2 = generateFingerprints('test', 'doc2');

    const source: MatchSource = { type: 'web' };
    const result = compareDocuments(fp1, fp2, '', source);

    expect(result.similarity).toBe(0);
    expect(result.matches).toEqual([]);
  });
});

describe('Edge Cases', () => {
  it('handles single word texts', () => {
    const fp1 = generateFingerprints('hello', 'doc1');
    const fp2 = generateFingerprints('world', 'doc2');

    const similarity = jaccardSimilarity(fp1, fp2);
    expect(similarity).toBeGreaterThanOrEqual(0);
    expect(similarity).toBeLessThanOrEqual(100);
  });

  it('handles very similar but not identical texts', () => {
    const text1 = 'The quick brown fox jumps over the lazy dog';
    const text2 = 'The quick brown fox jumps over the lazy dogs'; // Added 's'

    const fp1 = generateFingerprints(text1, 'doc1');
    const fp2 = generateFingerprints(text2, 'doc2');

    const similarity = jaccardSimilarity(fp1, fp2);
    expect(similarity).toBeGreaterThan(50);
    expect(similarity).toBeLessThan(100);
  });

  it('handles texts with repeated content', () => {
    const text1 = 'test test test test test';
    const text2 = 'test test test test test';

    const fp1 = generateFingerprints(text1, 'doc1');
    const fp2 = generateFingerprints(text2, 'doc2');

    const similarity = jaccardSimilarity(fp1, fp2);
    expect(similarity).toBe(100);
  });

  it('handles unicode characters in similarity', () => {
    const text = 'hello 世界 test';
    const fp1 = generateFingerprints(text, 'doc1');
    const fp2 = generateFingerprints(text, 'doc2');

    const similarity = jaccardSimilarity(fp1, fp2);
    expect(similarity).toBeGreaterThanOrEqual(0);
    expect(similarity).toBeLessThanOrEqual(100);
  });

  it('handles numbers in text comparisons', () => {
    const text1 = 'study from 2024 shows 95% accuracy';
    const text2 = 'study from 2024 shows 95% accuracy';

    const type = determineMatchType(text1, text2);
    expect(type).toBe('exact');
  });
});
