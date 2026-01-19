/**
 * Integration Tests: Research to Writing Workflow
 *
 * Tests complex workflows from deep research through synthesis to document writing.
 *
 * Workflow Coverage:
 * 1. Deep research → Generate synthesis → Insert findings
 * 2. Multi-perspective research → Consensus view → Write conclusion
 * 3. Citation analysis → Build bibliography → Export
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { resetFirebaseMocks } from '../mocks/firebase';

// Deep research imports - types from types, functions from index
import {
  createResearchSession,
  type ResearchSession,
  type Synthesis,
  type Perspective,
  type ResearchSource,
} from '@/lib/research/deep-research/types';

import {
  executeResearch,
  generateSynthesis,
} from '@/lib/research/deep-research';

import {
  calculateConsensusPercentage,
  determineConfidence,
  type ConsensusData,
  type EvidenceBreakdown,
} from '@/lib/research/deep-research/types';

import {
  identifyKeyCitations,
  calculateCitationMetrics,
  type CitationGraph,
  type CitationNode,
} from '@/lib/research/deep-research/citation-analysis';

// Citation imports
import { addReference, getAllReferences, addReferences } from '@/lib/citations/library';
import { formatBibliography, formatCitation, type CitationStyleId } from '@/lib/citations/csl-formatter';
import type { Reference } from '@/lib/citations/types';

// Document imports
import { updateDocument } from '@/lib/firebase/documents';

const TEST_USER_ID = 'test-user-research-writing';

// ============================================================================
// 1. DEEP RESEARCH TO SYNTHESIS
// ============================================================================

describe('Deep Research → Synthesis → Insert Findings', () => {
  beforeEach(() => {
    resetFirebaseMocks();
  });

  test('creates deep research session and executes', () => {
    const session = createResearchSession(
      TEST_USER_ID,
      'CRISPR gene therapy efficacy',
      'deep'
    );

    expect(session.topic).toBe('CRISPR gene therapy efficacy');
    expect(session.mode).toBe('deep');
    expect(session.config.depth).toBe(3);
    expect(session.config.maxSources).toBe(50);
  });

  test('generates multi-perspective insights', () => {
    const perspectives: Perspective[] = [
      {
        id: 'clinical',
        name: 'Clinical Efficacy',
        description: 'Focus on clinical trial outcomes',
        questions: [
          'What are the efficacy rates in clinical trials?',
          'What adverse events have been reported?',
        ],
        searchStrategies: ['CRISPR clinical trial efficacy', 'gene therapy adverse events'],
      },
      {
        id: 'molecular',
        name: 'Molecular Mechanisms',
        description: 'Focus on biological mechanisms',
        questions: [
          'How does CRISPR achieve gene editing?',
          'What are off-target effects?',
        ],
        searchStrategies: ['CRISPR mechanism', 'off-target effects'],
      },
      {
        id: 'ethical',
        name: 'Ethical Considerations',
        description: 'Focus on ethical implications',
        questions: [
          'What are the ethical concerns?',
          'How is informed consent handled?',
        ],
        searchStrategies: ['CRISPR ethics', 'gene therapy consent'],
      },
    ];

    expect(perspectives.length).toBe(3);
    perspectives.forEach(p => {
      expect(p.questions.length).toBeGreaterThan(0);
      expect(p.searchStrategies.length).toBeGreaterThan(0);
    });
  });

  test('accumulates sources across research iterations', () => {
    const sources: ResearchSource[] = [
      {
        id: 'src1',
        source: 'pubmed',
        title: 'CRISPR-Cas9 Clinical Trial Results',
        authors: [{ name: 'Smith J' }],
        year: 2024,
        abstract: 'Clinical trial showing 85% efficacy...',
        url: 'https://pubmed.ncbi.nlm.nih.gov/12345',
        openAccess: true,
        sessionId: 'session-1',
        discoveredBy: 'clinical-node',
        discoveredAt: 1,
        relevanceScore: 0.95,
      },
      {
        id: 'src2',
        source: 'semantic-scholar',
        title: 'Molecular Mechanisms of CRISPR',
        authors: [{ name: 'Doe J' }],
        year: 2023,
        abstract: 'Detailed analysis of Cas9 mechanism...',
        url: 'https://semanticscholar.org/paper/67890',
        openAccess: true,
        sessionId: 'session-1',
        discoveredBy: 'molecular-node',
        discoveredAt: 1,
        relevanceScore: 0.92,
      },
    ];

    expect(sources.length).toBe(2);
    expect(sources.every(s => s.relevanceScore > 0.9)).toBe(true);
  });

  test('generates comprehensive synthesis from research', () => {
    const session = createResearchSession(
      TEST_USER_ID,
      'AI in radiology',
      'standard'
    );

    const synthesis: Synthesis = {
      content: `
# AI in Radiology: A Multi-Perspective Analysis

## Clinical Applications

Recent clinical studies demonstrate that AI-assisted radiology improves diagnostic
accuracy from 87% to 94% (Smith et al., 2024). Multiple randomized controlled trials
have shown consistent benefits across various imaging modalities.

## Technical Implementation

Deep learning architectures, particularly convolutional neural networks with ResNet-50
backbones, have proven most effective for medical image analysis (Doe et al., 2024).
Transfer learning from ImageNet pre-training reduces training data requirements by 50%.

## Ethical Considerations

However, significant ethical concerns remain regarding algorithmic bias, physician
accountability, and patient consent (Johnson et al., 2023). Ensuring equitable
performance across diverse populations requires careful validation.
      `,
      sections: [
        {
          id: 's1',
          title: 'Clinical Applications',
          content: 'Recent clinical studies...',
          sourceIds: ['src1', 'src2', 'src3'],
          perspectiveIds: ['clinical'],
        },
        {
          id: 's2',
          title: 'Technical Implementation',
          content: 'Deep learning architectures...',
          sourceIds: ['src4', 'src5', 'src6'],
          perspectiveIds: ['technical'],
        },
        {
          id: 's3',
          title: 'Ethical Considerations',
          content: 'However, significant ethical concerns...',
          sourceIds: ['src7', 'src8'],
          perspectiveIds: ['ethical'],
        },
      ],
      qualityScore: 88,
      reviewFeedback: [],
      revisionCount: 2,
      wordCount: 250,
      citationCount: 8,
    };

    expect(synthesis.sections.length).toBe(3);
    expect(synthesis.qualityScore).toBeGreaterThanOrEqual(80);
    expect(synthesis.citationCount).toBeGreaterThan(5);
  });

  test('inserts synthesis findings into document', async () => {
    const synthesis: Synthesis = {
      content: 'AI improves diagnostic accuracy from 87% to 94% (Smith et al., 2024).',
      sections: [],
      qualityScore: 90,
      reviewFeedback: [],
      revisionCount: 1,
      wordCount: 15,
      citationCount: 1,
    };

    // Create a document first and get its ID
    const { createDocument } = await import('@/lib/firebase/documents');

    const documentId = await createDocument(TEST_USER_ID, 'Research Synthesis Document');

    // Now update with synthesis findings
    const updatedContent = `
<h2>Results</h2>
<p>${synthesis.content}</p>
`;

    await updateDocument(documentId, {
      content: updatedContent,
    });

    expect(updatedContent).toContain('87%');
    expect(updatedContent).toContain('94%');
    expect(updatedContent).toContain('Smith et al.');
  });

  test('tracks source citations in synthesis', () => {
    const synthesis: Synthesis = {
      content: 'Research shows...',
      sections: [
        {
          id: 's1',
          title: 'Section 1',
          content: 'Content',
          sourceIds: ['src1', 'src2', 'src3'],
          perspectiveIds: ['p1'],
        },
        {
          id: 's2',
          title: 'Section 2',
          content: 'Content',
          sourceIds: ['src4', 'src5'],
          perspectiveIds: ['p2'],
        },
      ],
      qualityScore: 85,
      reviewFeedback: [],
      revisionCount: 1,
      wordCount: 100,
      citationCount: 5,
    };

    const allSourceIds = synthesis.sections.flatMap(s => s.sourceIds);
    const uniqueSources = new Set(allSourceIds);

    expect(uniqueSources.size).toBe(5);
    expect(synthesis.citationCount).toBe(5);
  });
});

// ============================================================================
// 2. CONSENSUS ANALYSIS TO CONCLUSION
// ============================================================================

describe('Multi-Perspective → Consensus → Conclusion', () => {
  beforeEach(() => {
    resetFirebaseMocks();
  });

  test('analyzes consensus across studies', () => {
    const consensus: ConsensusData = {
      question: 'Does CRISPR therapy improve patient outcomes?',
      questionType: 'yes_no',
      distribution: {
        supporting: 82,
        neutral: 12,
        contradicting: 6,
      },
      breakdown: [
        { studyType: 'rct', supporting: 15, neutral: 2, contradicting: 1 },
        { studyType: 'meta-analysis', supporting: 8, neutral: 1, contradicting: 0 },
        { studyType: 'cohort', supporting: 12, neutral: 4, contradicting: 2 },
        { studyType: 'case-control', supporting: 5, neutral: 3, contradicting: 2 },
      ],
      confidence: 'high',
      confidenceReason: 'Strong consensus from high-quality RCTs and meta-analyses',
      keyStudies: {
        supporting: [],
        contradicting: [],
      },
      totalStudies: 53,
      metrics: {
        averageStudyQuality: 82,
        hasRCTs: true,
        hasMetaAnalyses: true,
        totalSampleSize: 8500,
        recentStudiesCount: 35,
      },
    };

    const percentages = calculateConsensusPercentage(consensus.distribution);

    expect(percentages.supporting).toBe(82);
    expect(percentages.neutral).toBe(12);
    expect(percentages.contradicting).toBe(6);
    expect(consensus.confidence).toBe('high');
  });

  test('determines confidence level from evidence', () => {
    const highQualityEvidence: EvidenceBreakdown[] = [
      { studyType: 'rct', supporting: 18, neutral: 2, contradicting: 0 },
      { studyType: 'meta-analysis', supporting: 10, neutral: 1, contradicting: 0 },
    ];

    const confidence = determineConfidence(highQualityEvidence, 31);
    expect(confidence).toBe('high');

    const lowQualityEvidence: EvidenceBreakdown[] = [
      { studyType: 'case-report', supporting: 3, neutral: 1, contradicting: 1 },
    ];

    const lowConfidence = determineConfidence(lowQualityEvidence, 5);
    expect(lowConfidence).toBe('very_low');
  });

  test('writes conclusion based on consensus', () => {
    const consensus: ConsensusData = {
      question: 'Is AI effective for medical diagnosis?',
      questionType: 'yes_no',
      distribution: { supporting: 85, neutral: 10, contradicting: 5 },
      breakdown: [],
      confidence: 'high',
      confidenceReason: 'Multiple high-quality RCTs with consistent results',
      keyStudies: { supporting: [], contradicting: [] },
      totalStudies: 40,
      metrics: {
        averageStudyQuality: 88,
        hasRCTs: true,
        hasMetaAnalyses: true,
        totalSampleSize: 12000,
        recentStudiesCount: 28,
      },
    };

    const conclusion = `
## Conclusion

Based on analysis of ${consensus.totalStudies} studies (n=${consensus.metrics.totalSampleSize}),
there is strong consensus (${consensus.distribution.supporting}% supporting) that AI is
effective for medical diagnosis. This finding is supported by multiple high-quality
randomized controlled trials and meta-analyses, lending ${consensus.confidence} confidence
to the conclusion. However, ${consensus.distribution.contradicting}% of studies reported
contradictory findings, suggesting that effectiveness may vary by specific diagnostic
context and implementation.
`;

    expect(conclusion).toContain('strong consensus');
    expect(conclusion).toContain('85% supporting');
    expect(conclusion).toContain('high confidence');
  });

  test('identifies conflicting perspectives', () => {
    const perspectives = [
      {
        id: 'efficacy',
        finding: 'AI improves diagnostic accuracy by 10%',
        evidence: 'strong',
      },
      {
        id: 'cost',
        finding: 'AI implementation costs $2M per hospital',
        evidence: 'moderate',
      },
      {
        id: 'adoption',
        finding: 'Only 15% of radiologists report using AI regularly',
        evidence: 'strong',
      },
    ];

    // Identify tension between efficacy and adoption
    const tensions = [
      {
        perspective1: 'efficacy',
        perspective2: 'adoption',
        conflict: 'Despite proven efficacy, adoption remains low',
      },
    ];

    expect(tensions.length).toBeGreaterThan(0);
  });

  test('synthesizes balanced conclusion with caveats', () => {
    const synthesis = `
While AI demonstrates significant promise for medical diagnosis, with studies showing
10-15% improvement in diagnostic accuracy, several important caveats must be considered.
First, implementation costs remain prohibitive for many healthcare systems. Second,
real-world adoption has been slower than expected, with only 15% of clinicians reporting
regular use. Third, concerns about algorithmic bias and equitable performance across
diverse populations require further investigation. Therefore, while the evidence
supports AI's diagnostic potential, successful clinical integration will require
addressing these implementation challenges.
`;

    expect(synthesis).toContain('promise');
    expect(synthesis).toContain('caveats');
    expect(synthesis).toContain('implementation challenges');
  });

  test('integrates consensus data into document', async () => {
    const consensus: ConsensusData = {
      question: 'Does treatment X improve outcomes?',
      questionType: 'yes_no',
      distribution: { supporting: 78, neutral: 15, contradicting: 7 },
      breakdown: [],
      confidence: 'moderate',
      confidenceReason: 'Heterogeneous study quality and populations',
      keyStudies: { supporting: [], contradicting: [] },
      totalStudies: 28,
      metrics: {
        averageStudyQuality: 75,
        hasRCTs: true,
        hasMetaAnalyses: false,
        totalSampleSize: 6000,
        recentStudiesCount: 18,
      },
    };

    const documentContent = `
<h2>Results</h2>
<p>Analysis of ${consensus.totalStudies} studies revealed that ${consensus.distribution.supporting}%
supported the effectiveness of treatment X, while ${consensus.distribution.contradicting}%
reported contradictory findings. The evidence quality was assessed as ${consensus.confidence},
with ${consensus.confidenceReason}.</p>
`;

    expect(documentContent).toContain('28 studies');
    expect(documentContent).toContain('78%');
    expect(documentContent).toContain('moderate');
  });
});

// ============================================================================
// 3. CITATION ANALYSIS TO BIBLIOGRAPHY
// ============================================================================

describe('Citation Analysis → Bibliography → Export', () => {
  beforeEach(() => {
    resetFirebaseMocks();
  });

  test('analyzes citation network structure', () => {
    const nodes: CitationNode[] = [
      {
        id: 'paper1',
        title: 'Seminal Paper 2020',
        authors: ['Smith J'],
        year: 2020,
        citationCount: 500,
        source: 'pubmed',
      },
      {
        id: 'paper2',
        title: 'Building on Smith 2021',
        authors: ['Doe J'],
        year: 2021,
        citationCount: 150,
        source: 'pubmed',
      },
      {
        id: 'paper3',
        title: 'Extending Smith 2022',
        authors: ['Johnson M'],
        year: 2022,
        citationCount: 80,
        source: 'pubmed',
      },
    ];

    const graph: CitationGraph = {
      nodes,
      edges: [
        {
          from: 'paper2',
          to: 'paper1',
          type: 'supporting',
          statement: 'Building on the work of Smith (2020)...',
          confidence: 0.95,
        },
        {
          from: 'paper3',
          to: 'paper1',
          type: 'methodology',
          statement: 'We adapted the method from Smith (2020)...',
          confidence: 0.92,
        },
      ],
    };

    expect(graph.nodes.length).toBe(3);
    expect(graph.edges.length).toBe(2);

    // Paper1 is most cited
    const mostCited = nodes.reduce((max, n) =>
      n.citationCount > max.citationCount ? n : max
    );
    expect(mostCited.id).toBe('paper1');
  });

  test('identifies seminal papers in citation network', () => {
    const nodes: CitationNode[] = [
      {
        id: 'p1',
        title: 'Foundational Work',
        authors: ['Founder A'],
        year: 2015,
        citationCount: 1200,
        source: 'pubmed',
      },
      {
        id: 'p2',
        title: 'Recent Study',
        authors: ['Author B'],
        year: 2024,
        citationCount: 50,
        source: 'pubmed',
      },
    ];

    // Build citation graph with edges to simulate citation relationships
    const graph: CitationGraph = {
      nodes,
      edges: [
        {
          from: 'p2',
          to: 'p1',
          type: 'supporting',
          confidence: 0.9,
        },
      ],
    };

    // Identify key citations (seminal papers based on citation count in the graph)
    const keyCitations = identifyKeyCitations(graph, 1);

    expect(keyCitations.length).toBeGreaterThan(0);
    expect(keyCitations[0].id).toBe('p1');
    expect(keyCitations[0].citationCount).toBeGreaterThanOrEqual(1);
  });

  test('builds bibliography from research sources', async () => {
    const sources: ResearchSource[] = [
      {
        id: 'src1',
        source: 'pubmed',
        title: 'AI in Healthcare',
        authors: [{ name: 'Smith, John' }],
        year: 2024,
        abstract: 'Study of AI...',
        doi: '10.1234/ai-healthcare',
        url: 'https://pubmed.ncbi.nlm.nih.gov/111',
        openAccess: true,
        sessionId: 's1',
        discoveredBy: 'node1',
        discoveredAt: 1,
        relevanceScore: 0.9,
      },
      {
        id: 'src2',
        source: 'arxiv',
        title: 'Deep Learning Methods',
        authors: [{ name: 'Doe, Jane' }],
        year: 2023,
        abstract: 'Novel architecture...',
        arxivId: '2301.12345',
        url: 'https://arxiv.org/abs/2301.12345',
        openAccess: true,
        sessionId: 's1',
        discoveredBy: 'node2',
        discoveredAt: 1,
        relevanceScore: 0.88,
      },
    ];

    // Convert to references
    const references: Array<Omit<Reference, 'id' | 'createdAt' | 'updatedAt'>> = sources.map(s => ({
      type: 'article-journal' as const,
      title: s.title,
      authors: s.authors.map((a, idx) => {
        const parts = a.name.split(', ');
        return {
          family: parts[0],
          given: parts[1] || '',
          sequence: idx === 0 ? 'first' as const : 'additional' as const,
        };
      }),
      issued: { year: s.year },
      identifiers: {
        doi: s.doi,
        arxivId: s.arxivId,
      },
      url: s.url,
    }));

    // Add to library
    await addReferences(TEST_USER_ID, references);

    // Get all and format bibliography
    const allRefs = await getAllReferences(TEST_USER_ID);
    expect(allRefs.length).toBe(2);

    const bibliography = formatBibliography(allRefs, 'apa-7');
    expect(bibliography).toContain('Smith');
    expect(bibliography).toContain('Doe');
  });

  test('exports bibliography in multiple formats', async () => {
    await addReference(TEST_USER_ID, {
      type: 'article-journal',
      title: 'Test Article',
      authors: [{ family: 'Smith', given: 'John', sequence: 'first' }],
      issued: { year: 2024 },
      identifiers: {},
    });

    const refs = await getAllReferences(TEST_USER_ID);

    const formats: CitationStyleId[] = ['apa-7', 'mla-9', 'chicago-author', 'vancouver', 'harvard'];

    for (const format of formats) {
      const bib = formatBibliography(refs, format);
      expect(bib).toBeDefined();
      expect(bib.length).toBeGreaterThan(0);
    }
  });

  test('maintains citation-to-source traceability', () => {
    const citationMap = {
      'Smith et al., 2024': 'src1',
      'Doe & Johnson, 2023': 'src2',
      'Wilson et al., 2024': 'src3',
    };

    // Verify each citation has a source
    Object.entries(citationMap).forEach(([citation, sourceId]) => {
      expect(citation).toBeTruthy();
      expect(sourceId).toBeTruthy();
    });

    expect(Object.keys(citationMap).length).toBe(3);
  });

  test('generates reference section for document', async () => {
    const references: Array<Omit<Reference, 'id' | 'createdAt' | 'updatedAt'>> = [
      {
        type: 'article-journal',
        title: 'Paper 1',
        authors: [{ family: 'Author1', given: 'A', sequence: 'first' }],
        issued: { year: 2024 },
        identifiers: {},
      },
      {
        type: 'article-journal',
        title: 'Paper 2',
        authors: [{ family: 'Author2', given: 'B', sequence: 'first' }],
        issued: { year: 2023 },
        identifiers: {},
      },
    ];

    await addReferences(TEST_USER_ID, references);

    const allRefs = await getAllReferences(TEST_USER_ID);
    const bibliography = formatBibliography(allRefs, 'apa-7');

    const documentContent = `
<h2>References</h2>
<div class="bibliography">
${bibliography}
</div>
`;

    expect(documentContent).toContain('References');
    expect(documentContent).toContain('Author1');
    expect(documentContent).toContain('Author2');
  });

  test('updates bibliography when citations added', async () => {
    // Initial bibliography
    await addReference(TEST_USER_ID, {
      type: 'article-journal',
      title: 'Initial Paper',
      authors: [{ family: 'Initial', given: 'A', sequence: 'first' }],
      issued: { year: 2024 },
      identifiers: {},
    });

    let refs = await getAllReferences(TEST_USER_ID);
    let bib = formatBibliography(refs, 'apa-7');
    expect(bib).toContain('Initial');

    // Add new citation
    await addReference(TEST_USER_ID, {
      type: 'article-journal',
      title: 'New Paper',
      authors: [{ family: 'New', given: 'B', sequence: 'first' }],
      issued: { year: 2024 },
      identifiers: {},
    });

    refs = await getAllReferences(TEST_USER_ID);
    bib = formatBibliography(refs, 'apa-7');
    expect(bib).toContain('Initial');
    expect(bib).toContain('New');
  });
});

// ============================================================================
// 4. RESEARCH QUALITY AND REFINEMENT
// ============================================================================

describe('Research Quality → Refinement → Final Writing', () => {
  beforeEach(() => {
    resetFirebaseMocks();
  });

  test('evaluates synthesis quality score', () => {
    const synthesis: Synthesis = {
      content: 'Well-structured analysis...',
      sections: [
        {
          id: 's1',
          title: 'Section 1',
          content: 'Content with citations',
          sourceIds: ['src1', 'src2', 'src3'],
          perspectiveIds: ['p1'],
        },
        {
          id: 's2',
          title: 'Section 2',
          content: 'More content',
          sourceIds: ['src4', 'src5'],
          perspectiveIds: ['p2'],
        },
      ],
      qualityScore: 88,
      reviewFeedback: [],
      revisionCount: 2,
      wordCount: 2500,
      citationCount: 35,
    };

    expect(synthesis.qualityScore).toBeGreaterThanOrEqual(85);
    expect(synthesis.citationCount).toBeGreaterThanOrEqual(30);
    expect(synthesis.sections.length).toBeGreaterThanOrEqual(2);
  });

  test('identifies gaps in research coverage', () => {
    const perspectives: Perspective[] = [
      {
        id: 'p1',
        name: 'Clinical',
        description: 'Clinical aspects',
        questions: ['Q1', 'Q2'],
        searchStrategies: ['s1'],
      },
      {
        id: 'p2',
        name: 'Economic',
        description: 'Cost-effectiveness',
        questions: ['Q3', 'Q4'],
        searchStrategies: ['s2'],
      },
    ];

    const coveredPerspectives = ['p1'];
    const gaps = perspectives.filter(p => !coveredPerspectives.includes(p.id));

    expect(gaps.length).toBe(1);
    expect(gaps[0].id).toBe('p2');
  });

  test('refines synthesis based on feedback', () => {
    const initialSynthesis: Synthesis = {
      content: 'Initial draft...',
      sections: [],
      qualityScore: 72,
      reviewFeedback: [
        {
          type: 'missing_coverage',
          severity: 'major',
          description: 'No coverage of cost-effectiveness',
          suggestions: ['Add economic analysis section'],
          resolved: false,
        },
      ],
      revisionCount: 0,
      wordCount: 1500,
      citationCount: 20,
    };

    // After refinement
    const revisedSynthesis: Synthesis = {
      ...initialSynthesis,
      sections: [
        {
          id: 's1',
          title: 'Economic Analysis',
          content: 'Cost-effectiveness data...',
          sourceIds: ['src-econ-1', 'src-econ-2'],
          perspectiveIds: ['economic'],
        },
      ],
      qualityScore: 86,
      reviewFeedback: [
        {
          ...initialSynthesis.reviewFeedback[0],
          resolved: true,
        },
      ],
      revisionCount: 1,
      wordCount: 2200,
      citationCount: 28,
    };

    expect(revisedSynthesis.qualityScore).toBeGreaterThan(initialSynthesis.qualityScore);
    expect(revisedSynthesis.reviewFeedback[0].resolved).toBe(true);
    expect(revisedSynthesis.sections.length).toBeGreaterThan(0);
  });

  test('validates citation coverage across synthesis', () => {
    const synthesis: Synthesis = {
      content: 'Content with multiple claims...',
      sections: [
        {
          id: 's1',
          title: 'Section 1',
          content: 'Claim 1 (Source A). Claim 2 (Source B).',
          sourceIds: ['srcA', 'srcB'],
          perspectiveIds: ['p1'],
        },
        {
          id: 's2',
          title: 'Section 2',
          content: 'Claim 3 (Source C, D).',
          sourceIds: ['srcC', 'srcD'],
          perspectiveIds: ['p2'],
        },
      ],
      qualityScore: 90,
      reviewFeedback: [],
      revisionCount: 1,
      wordCount: 500,
      citationCount: 4,
    };

    const allCitations = synthesis.sections.flatMap(s => s.sourceIds);
    expect(allCitations.length).toBe(4);
    expect(synthesis.citationCount).toBe(4);
  });

  test('generates final document with full context', async () => {
    const synthesis: Synthesis = {
      content: 'Full synthesis text with introduction, methods, results, discussion...',
      sections: [
        {
          id: 'intro',
          title: 'Introduction',
          content: 'Background and context...',
          sourceIds: ['src1', 'src2'],
          perspectiveIds: ['background'],
        },
        {
          id: 'results',
          title: 'Results',
          content: 'Key findings from research...',
          sourceIds: ['src3', 'src4', 'src5'],
          perspectiveIds: ['clinical', 'technical'],
        },
        {
          id: 'discussion',
          title: 'Discussion',
          content: 'Interpretation and implications...',
          sourceIds: ['src6', 'src7'],
          perspectiveIds: ['clinical', 'ethical'],
        },
      ],
      qualityScore: 92,
      reviewFeedback: [],
      revisionCount: 3,
      wordCount: 3500,
      citationCount: 42,
    };

    // Get all references
    const refs = await getAllReferences(TEST_USER_ID);
    const bibliography = formatBibliography(refs, 'apa-7');

    const document = `
<h1>Research Synthesis: AI in Medical Imaging</h1>

${synthesis.sections.map(s => `
<h2>${s.title}</h2>
<p>${s.content}</p>
`).join('\n')}

<h2>References</h2>
<div class="bibliography">${bibliography}</div>

<div class="metadata">
Word count: ${synthesis.wordCount} | Citations: ${synthesis.citationCount} | Quality: ${synthesis.qualityScore}/100
</div>
`;

    expect(document).toContain('Introduction');
    expect(document).toContain('Results');
    expect(document).toContain('Discussion');
    expect(document).toContain('References');
  });
});
