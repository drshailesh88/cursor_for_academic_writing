# Multi-Discipline Extension Specification

**Date:** January 2, 2026
**Document Type:** SDD (Specification-Driven Development)
**Inspiration:** [K-Dense AI Claude Scientific Skills](https://github.com/K-Dense-AI/claude-scientific-skills)
**Status:** Planning Phase

---

## Executive Summary

This document outlines the expansion of our Academic Writing Platform from a life-sciences-only tool to a **comprehensive platform serving all 15+ scientific disciplines**. Inspired by K-Dense AI's 138 scientific skills across multiple domains, we define the architecture, database integrations, discipline-specific features, and implementation roadmap.

---

## 1. Discipline Architecture

### 1.1 Core Discipline System

```typescript
// lib/disciplines/types.ts

export type DisciplineId =
  | 'life-sciences'
  | 'bioinformatics'
  | 'chemistry'
  | 'clinical-medicine'
  | 'physics'
  | 'astronomy'
  | 'computer-science'
  | 'engineering'
  | 'materials-science'
  | 'earth-sciences'
  | 'mathematics'
  | 'neuroscience'
  | 'social-sciences'
  | 'economics'
  | 'environmental-science';

export interface Discipline {
  id: DisciplineId;
  name: string;
  icon: string;
  color: string;
  description: string;

  // Research configuration
  databases: DatabaseConfig[];
  defaultCitationStyle: CitationStyleId;
  terminology: TerminologySet;

  // Writing configuration
  templates: TemplateId[];
  writingConventions: WritingConvention[];
  systemPrompt: string;

  // Tools & integrations
  tools: ToolConfig[];
  externalIntegrations: IntegrationConfig[];
}

export interface DatabaseConfig {
  id: string;
  name: string;
  priority: number; // Search order
  enabled: boolean;
  apiEndpoint: string;
  rateLimit: number; // requests per second
  fields: string[]; // Available search fields
}

export interface WritingConvention {
  id: string;
  description: string;
  examples: { correct: string; incorrect: string }[];
  autoCorrect?: boolean;
}
```

### 1.2 Discipline Registry

```typescript
// lib/disciplines/registry.ts

export const DISCIPLINES: Record<DisciplineId, Discipline> = {
  'life-sciences': {
    id: 'life-sciences',
    name: 'Life Sciences & Medicine',
    icon: '🧬',
    color: '#10b981', // Green
    description: 'Biology, medicine, biochemistry, and related fields',
    databases: [
      { id: 'pubmed', name: 'PubMed', priority: 1, enabled: true, ... },
      { id: 'pmc', name: 'PubMed Central', priority: 2, enabled: true, ... },
      { id: 'biorxiv', name: 'bioRxiv', priority: 3, enabled: true, ... },
      { id: 'medrxiv', name: 'medRxiv', priority: 4, enabled: true, ... },
    ],
    defaultCitationStyle: 'vancouver',
    templates: ['research-article', 'systematic-review', 'case-report', 'meta-analysis'],
    writingConventions: [
      { id: 'imrad', description: 'Use IMRaD structure', ... },
      { id: 'passive-methods', description: 'Passive voice acceptable in Methods', ... },
    ],
    ...
  },

  'bioinformatics': {
    id: 'bioinformatics',
    name: 'Bioinformatics & Computational Biology',
    icon: '🖥️',
    color: '#6366f1', // Indigo
    description: 'Genomics, proteomics, sequence analysis, systems biology',
    databases: [
      { id: 'pubmed', name: 'PubMed', priority: 1, ... },
      { id: 'biorxiv', name: 'bioRxiv', priority: 2, ... },
      { id: 'arxiv-q-bio', name: 'arXiv q-bio', priority: 3, ... },
    ],
    defaultCitationStyle: 'nature',
    templates: ['methods-paper', 'tool-paper', 'database-paper', 'benchmark-study'],
    tools: [
      { id: 'sequence-analysis', name: 'Sequence Analysis Helper', ... },
      { id: 'pathway-viz', name: 'Pathway Visualization', ... },
    ],
    ...
  },

  'chemistry': {
    id: 'chemistry',
    name: 'Chemistry & Chemical Engineering',
    icon: '⚗️',
    color: '#f59e0b', // Amber
    description: 'Organic, inorganic, physical, analytical chemistry',
    databases: [
      { id: 'pubmed', name: 'PubMed', priority: 1, ... },
      { id: 'chemrxiv', name: 'ChemRxiv', priority: 2, ... },
      { id: 'semantic-scholar', name: 'Semantic Scholar', priority: 3, ... },
    ],
    defaultCitationStyle: 'acs',
    templates: ['synthesis-report', 'analytical-method', 'mechanism-study'],
    tools: [
      { id: 'molecule-viewer', name: 'Molecule Structure Viewer', ... },
      { id: 'reaction-scheme', name: 'Reaction Scheme Generator', ... },
    ],
    ...
  },

  'physics': {
    id: 'physics',
    name: 'Physics',
    icon: '⚛️',
    color: '#3b82f6', // Blue
    description: 'Classical, quantum, particle, condensed matter physics',
    databases: [
      { id: 'arxiv-physics', name: 'arXiv Physics', priority: 1, ... },
      { id: 'arxiv-hep', name: 'arXiv HEP', priority: 2, ... },
      { id: 'arxiv-cond-mat', name: 'arXiv Cond-Mat', priority: 3, ... },
      { id: 'semantic-scholar', name: 'Semantic Scholar', priority: 4, ... },
    ],
    defaultCitationStyle: 'aps', // American Physical Society
    templates: ['letter', 'regular-article', 'review', 'conference-proceeding'],
    writingConventions: [
      { id: 'equation-style', description: 'Equations are numbered and referenced', ... },
      { id: 'figure-placement', description: 'Figures near first reference', ... },
    ],
    ...
  },

  'astronomy': {
    id: 'astronomy',
    name: 'Astronomy & Astrophysics',
    icon: '🔭',
    color: '#1e3a8a', // Dark blue
    description: 'Observational astronomy, cosmology, planetary science',
    databases: [
      { id: 'ads', name: 'NASA ADS', priority: 1, ... },
      { id: 'arxiv-astro-ph', name: 'arXiv astro-ph', priority: 2, ... },
    ],
    defaultCitationStyle: 'aas', // American Astronomical Society
    templates: ['observational-study', 'theoretical-model', 'instrument-paper'],
    ...
  },

  'computer-science': {
    id: 'computer-science',
    name: 'Computer Science',
    icon: '💻',
    color: '#8b5cf6', // Violet
    description: 'Algorithms, AI/ML, systems, theory',
    databases: [
      { id: 'arxiv-cs', name: 'arXiv CS', priority: 1, ... },
      { id: 'semantic-scholar', name: 'Semantic Scholar', priority: 2, ... },
      { id: 'acm-dl', name: 'ACM Digital Library', priority: 3, ... },
      { id: 'ieee', name: 'IEEE Xplore', priority: 4, ... },
    ],
    defaultCitationStyle: 'acm',
    templates: ['systems-paper', 'algorithm-paper', 'benchmark-paper', 'position-paper'],
    writingConventions: [
      { id: 'code-listings', description: 'Include algorithm pseudocode', ... },
      { id: 'complexity', description: 'State computational complexity', ... },
    ],
    ...
  },

  'engineering': {
    id: 'engineering',
    name: 'Engineering',
    icon: '⚙️',
    color: '#64748b', // Slate
    description: 'Mechanical, electrical, civil, aerospace engineering',
    databases: [
      { id: 'ieee', name: 'IEEE Xplore', priority: 1, ... },
      { id: 'semantic-scholar', name: 'Semantic Scholar', priority: 2, ... },
      { id: 'arxiv-eess', name: 'arXiv EESS', priority: 3, ... },
    ],
    defaultCitationStyle: 'ieee',
    templates: ['design-document', 'feasibility-study', 'technical-report'],
    ...
  },

  'materials-science': {
    id: 'materials-science',
    name: 'Materials Science',
    icon: '🔬',
    color: '#0891b2', // Cyan
    description: 'Nanomaterials, polymers, ceramics, metallurgy',
    databases: [
      { id: 'semantic-scholar', name: 'Semantic Scholar', priority: 1, ... },
      { id: 'arxiv-cond-mat', name: 'arXiv Cond-Mat', priority: 2, ... },
      { id: 'pubmed', name: 'PubMed', priority: 3, ... },
    ],
    defaultCitationStyle: 'elsevier-harvard',
    templates: ['synthesis-characterization', 'property-study', 'application-paper'],
    ...
  },

  'mathematics': {
    id: 'mathematics',
    name: 'Mathematics & Statistics',
    icon: '📐',
    color: '#dc2626', // Red
    description: 'Pure math, applied math, statistics, probability',
    databases: [
      { id: 'arxiv-math', name: 'arXiv Math', priority: 1, ... },
      { id: 'arxiv-stat', name: 'arXiv Stat', priority: 2, ... },
      { id: 'mathscinet', name: 'MathSciNet', priority: 3, ... },
    ],
    defaultCitationStyle: 'ams', // American Mathematical Society
    templates: ['theorem-paper', 'applied-methods', 'statistical-analysis'],
    writingConventions: [
      { id: 'theorem-style', description: 'Theorem-proof structure', ... },
      { id: 'notation', description: 'Consistent mathematical notation', ... },
    ],
    ...
  },

  'neuroscience': {
    id: 'neuroscience',
    name: 'Neuroscience',
    icon: '🧠',
    color: '#ec4899', // Pink
    description: 'Cognitive, computational, cellular neuroscience',
    databases: [
      { id: 'pubmed', name: 'PubMed', priority: 1, ... },
      { id: 'biorxiv', name: 'bioRxiv', priority: 2, ... },
      { id: 'arxiv-q-bio', name: 'arXiv q-bio.NC', priority: 3, ... },
    ],
    defaultCitationStyle: 'apa7',
    templates: ['experimental-study', 'computational-model', 'review-article'],
    ...
  },

  'earth-sciences': {
    id: 'earth-sciences',
    name: 'Earth & Environmental Sciences',
    icon: '🌍',
    color: '#16a34a', // Green
    description: 'Geology, climate science, oceanography, ecology',
    databases: [
      { id: 'semantic-scholar', name: 'Semantic Scholar', priority: 1, ... },
      { id: 'essoar', name: 'ESSOAr', priority: 2, ... },
      { id: 'crossref', name: 'CrossRef', priority: 3, ... },
    ],
    defaultCitationStyle: 'agu', // American Geophysical Union
    templates: ['field-study', 'modeling-paper', 'environmental-assessment'],
    ...
  },

  'social-sciences': {
    id: 'social-sciences',
    name: 'Social Sciences',
    icon: '👥',
    color: '#f97316', // Orange
    description: 'Psychology, sociology, anthropology, political science',
    databases: [
      { id: 'semantic-scholar', name: 'Semantic Scholar', priority: 1, ... },
      { id: 'ssrn', name: 'SSRN', priority: 2, ... },
      { id: 'psycinfo', name: 'PsycINFO', priority: 3, ... },
    ],
    defaultCitationStyle: 'apa7',
    templates: ['quantitative-study', 'qualitative-study', 'mixed-methods', 'theoretical-paper'],
    ...
  },

  'economics': {
    id: 'economics',
    name: 'Economics & Finance',
    icon: '📈',
    color: '#059669', // Emerald
    description: 'Microeconomics, macroeconomics, econometrics, finance',
    databases: [
      { id: 'ssrn', name: 'SSRN', priority: 1, ... },
      { id: 'repec', name: 'RePEc', priority: 2, ... },
      { id: 'nber', name: 'NBER', priority: 3, ... },
    ],
    defaultCitationStyle: 'chicago-author-date',
    templates: ['empirical-paper', 'theoretical-model', 'policy-brief', 'working-paper'],
    ...
  },

  'clinical-medicine': {
    id: 'clinical-medicine',
    name: 'Clinical Medicine & Healthcare',
    icon: '🏥',
    color: '#ef4444', // Red
    description: 'Clinical trials, patient care, medical education',
    databases: [
      { id: 'pubmed', name: 'PubMed', priority: 1, ... },
      { id: 'clinicaltrials', name: 'ClinicalTrials.gov', priority: 2, ... },
      { id: 'cochrane', name: 'Cochrane Library', priority: 3, ... },
    ],
    defaultCitationStyle: 'vancouver',
    templates: ['clinical-trial', 'cohort-study', 'case-series', 'clinical-guidelines'],
    tools: [
      { id: 'consort', name: 'CONSORT Checklist', ... },
      { id: 'prisma', name: 'PRISMA Flowchart', ... },
    ],
    ...
  },

  'environmental-science': {
    id: 'environmental-science',
    name: 'Environmental Science',
    icon: '🌱',
    color: '#84cc16', // Lime
    description: 'Conservation, pollution, sustainability, ecology',
    databases: [
      { id: 'semantic-scholar', name: 'Semantic Scholar', priority: 1, ... },
      { id: 'pubmed', name: 'PubMed', priority: 2, ... },
      { id: 'crossref', name: 'CrossRef', priority: 3, ... },
    ],
    defaultCitationStyle: 'elsevier-harvard',
    templates: ['impact-assessment', 'conservation-study', 'policy-analysis'],
    ...
  },
};
```

---

## 2. Database Integration Plan

### 2.1 Database Priority Matrix

| Database | Disciplines | API Type | Rate Limit | Priority |
|----------|-------------|----------|------------|----------|
| **PubMed** | Life Sci, Medicine, Neuro | REST | 10/s (with key) | P0 |
| **arXiv** | Physics, Math, CS, Bio | REST | 1/s | P0 |
| **Semantic Scholar** | All disciplines | REST | 100/5min | P0 |
| **CrossRef** | All disciplines | REST | 50/s | P0 |
| **bioRxiv/medRxiv** | Life Sci, Medicine | REST | 60/min | P1 |
| **NASA ADS** | Astronomy | REST | 5000/day | P1 |
| **ChemRxiv** | Chemistry | REST | Unknown | P1 |
| **IEEE Xplore** | Engineering, CS | REST (paid) | Varies | P2 |
| **ACM DL** | Computer Science | REST (paid) | Varies | P2 |
| **SSRN** | Social Sci, Econ | Limited | Unknown | P2 |
| **OpenAlex** | All disciplines | REST | 100K/day | P1 |

### 2.2 Unified Database Client Architecture

```typescript
// lib/research/databases/base.ts

export interface DatabaseClient {
  id: string;
  name: string;

  search(query: SearchQuery): Promise<SearchResult[]>;
  getArticle(id: string): Promise<Article | null>;
  getCitations(id: string): Promise<Citation[]>;
  getRelated(id: string): Promise<Article[]>;

  // Capabilities
  supportsFullText(): boolean;
  supportsCitationCount(): boolean;
  supportsOpenAccess(): boolean;
}

export interface SearchQuery {
  text: string;
  fields?: ('title' | 'abstract' | 'author' | 'keyword')[];
  dateRange?: { start: Date; end: Date };
  articleTypes?: string[];
  openAccessOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  id: string;
  source: string;
  title: string;
  authors: Author[];
  abstract?: string;
  year: number;
  doi?: string;
  url: string;
  openAccess: boolean;
  citationCount?: number;
  relevanceScore?: number;
}
```

### 2.3 Database Implementations

```typescript
// lib/research/databases/arxiv.ts

export class ArXivClient implements DatabaseClient {
  id = 'arxiv';
  name = 'arXiv';

  private categories: Record<DisciplineId, string[]> = {
    'physics': ['physics', 'hep-ph', 'hep-th', 'cond-mat', 'quant-ph'],
    'mathematics': ['math'],
    'computer-science': ['cs'],
    'bioinformatics': ['q-bio'],
    'astronomy': ['astro-ph'],
    'economics': ['econ'],
    'statistics': ['stat'],
  };

  async search(query: SearchQuery): Promise<SearchResult[]> {
    const url = new URL('http://export.arxiv.org/api/query');
    url.searchParams.set('search_query', this.buildQuery(query));
    url.searchParams.set('max_results', String(query.limit || 20));
    url.searchParams.set('sortBy', 'relevance');

    const response = await fetch(url.toString());
    const xml = await response.text();
    return this.parseAtomFeed(xml);
  }

  private buildQuery(query: SearchQuery): string {
    const parts: string[] = [];

    if (query.fields?.includes('title')) {
      parts.push(`ti:${query.text}`);
    }
    if (query.fields?.includes('abstract')) {
      parts.push(`abs:${query.text}`);
    }
    if (query.fields?.includes('author')) {
      parts.push(`au:${query.text}`);
    }

    return parts.length ? parts.join(' OR ') : `all:${query.text}`;
  }

  // ... parsing implementation
}

// lib/research/databases/semantic-scholar.ts

export class SemanticScholarClient implements DatabaseClient {
  id = 'semantic-scholar';
  name = 'Semantic Scholar';
  private apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY;

  async search(query: SearchQuery): Promise<SearchResult[]> {
    const url = new URL('https://api.semanticscholar.org/graph/v1/paper/search');
    url.searchParams.set('query', query.text);
    url.searchParams.set('limit', String(query.limit || 20));
    url.searchParams.set('fields', 'paperId,title,abstract,authors,year,citationCount,openAccessPdf');

    const response = await fetch(url.toString(), {
      headers: this.apiKey ? { 'x-api-key': this.apiKey } : {},
    });

    const data = await response.json();
    return data.data.map(this.transformResult);
  }

  async getRelated(id: string): Promise<Article[]> {
    // Semantic Scholar has native related papers API
    const url = `https://api.semanticscholar.org/graph/v1/paper/${id}/recommendations`;
    // ...
  }
}

// lib/research/databases/openalex.ts

export class OpenAlexClient implements DatabaseClient {
  id = 'openalex';
  name = 'OpenAlex';

  // OpenAlex is free and comprehensive - 250M+ works
  async search(query: SearchQuery): Promise<SearchResult[]> {
    const url = new URL('https://api.openalex.org/works');
    url.searchParams.set('search', query.text);
    url.searchParams.set('per_page', String(query.limit || 20));

    if (query.openAccessOnly) {
      url.searchParams.set('filter', 'is_oa:true');
    }

    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': 'AcademicWritingPlatform/1.0 (mailto:contact@example.com)' },
    });

    const data = await response.json();
    return data.results.map(this.transformResult);
  }
}
```

---

## 3. Discipline-Specific Templates

### 3.1 Template Registry by Discipline

```typescript
// lib/templates/discipline-templates.ts

export const DISCIPLINE_TEMPLATES: Record<DisciplineId, DocumentTemplate[]> = {
  'physics': [
    {
      id: 'physics-letter',
      name: 'Physical Review Letter',
      description: 'Short communication for rapid publication',
      structure: `# [Title]

## Abstract
[4-5 sentence summary]

## Introduction
[Problem statement and motivation - 2-3 paragraphs]

## Methods/Theory
[Mathematical framework or experimental setup]

## Results
[Key findings with equations and figures]

## Discussion
[Interpretation and implications]

## Conclusion
[Brief summary - 1 paragraph]

## Acknowledgments

## References`,
      metadata: {
        wordLimit: 3500,
        figureLimit: 4,
        equationSupport: true,
      },
    },
    {
      id: 'physics-regular',
      name: 'Regular Article',
      description: 'Full-length research article',
      // ...
    },
  ],

  'computer-science': [
    {
      id: 'cs-systems',
      name: 'Systems Paper',
      description: 'Describes design and implementation of a system',
      structure: `# [System Name]: [Subtitle]

## Abstract

## 1. Introduction
### 1.1 Problem Statement
### 1.2 Contributions

## 2. Background
### 2.1 Related Work
### 2.2 Limitations of Existing Approaches

## 3. Design
### 3.1 System Overview
### 3.2 Key Components
### 3.3 Design Decisions

## 4. Implementation
### 4.1 Architecture
### 4.2 Algorithms
### 4.3 Optimizations

## 5. Evaluation
### 5.1 Experimental Setup
### 5.2 Benchmarks
### 5.3 Results
### 5.4 Comparison with Baselines

## 6. Discussion
### 6.1 Limitations
### 6.2 Future Work

## 7. Related Work

## 8. Conclusion

## Acknowledgments

## References`,
      metadata: {
        wordLimit: 12000,
        codeSupport: true,
        algorithmSupport: true,
      },
    },
    {
      id: 'cs-ml-paper',
      name: 'Machine Learning Paper',
      description: 'ML/AI research with experiments',
      structure: `# [Title]

## Abstract

## 1. Introduction

## 2. Related Work

## 3. Problem Formulation

## 4. Method
### 4.1 Model Architecture
### 4.2 Training Procedure
### 4.3 Loss Function

## 5. Experiments
### 5.1 Datasets
### 5.2 Baselines
### 5.3 Implementation Details
### 5.4 Main Results
### 5.5 Ablation Studies

## 6. Analysis
### 6.1 Qualitative Results
### 6.2 Failure Cases

## 7. Conclusion

## Broader Impact Statement

## References

## Appendix
### A. Additional Experiments
### B. Hyperparameters
### C. Proofs`,
    },
  ],

  'chemistry': [
    {
      id: 'chemistry-synthesis',
      name: 'Synthesis Report',
      description: 'Chemical synthesis and characterization',
      structure: `# Synthesis of [Compound Name]

## Abstract

## Introduction

## Results and Discussion
### Synthesis Strategy
### Reaction Optimization
### Characterization

## Conclusion

## Experimental Section
### General Information
### Synthesis of [Compound 1]
### Synthesis of [Compound 2]
### Characterization Data

## Supporting Information

## References`,
      metadata: {
        supportsChemicalStructures: true,
        supportsSpectra: true,
      },
    },
  ],

  'clinical-medicine': [
    {
      id: 'clinical-rct',
      name: 'Randomized Controlled Trial',
      description: 'CONSORT-compliant RCT report',
      structure: `# [Intervention] for [Condition]: A Randomized Controlled Trial

## Abstract
### Background
### Methods
### Results
### Conclusions
### Trial Registration

## Introduction

## Methods
### Trial Design
### Participants
### Interventions
### Outcomes
### Sample Size
### Randomization
### Blinding
### Statistical Methods

## Results
### Participant Flow
### Baseline Data
### Primary Outcome
### Secondary Outcomes
### Adverse Events

## Discussion
### Interpretation
### Generalizability
### Limitations

## Conclusion

## References`,
      metadata: {
        requiresCONSORT: true,
        requiresTrialRegistration: true,
        requiresEthicsApproval: true,
      },
    },
  ],

  // ... more disciplines
};
```

---

## 4. Discipline-Specific Writing Prompts

### 4.1 System Prompts by Discipline

```typescript
// lib/prompts/discipline-prompts.ts

export const DISCIPLINE_PROMPTS: Record<DisciplineId, string> = {
  'physics': `You are an expert physics writing assistant.

WRITING CONVENTIONS:
1. Use LaTeX notation for equations: $E = mc^2$
2. Number all equations that are referenced: Eq. (1), Eq. (2)
3. Use SI units consistently
4. Cite experimental uncertainties: $(3.14 \\pm 0.02)$ kg
5. Use past tense for completed work, present for established facts
6. Refer to figures as "Fig. 1" and tables as "Table I" (Roman numerals)

STRUCTURE EXPECTATIONS:
- Introduction: State the problem, prior work, and your contribution
- Theory/Methods: Mathematical framework with full derivations or references
- Results: Present data with proper error analysis
- Discussion: Compare with theory and prior experimental results

CITATION STYLE: Use numbered references [1], [2] for Physical Review style.`,

  'computer-science': `You are an expert computer science writing assistant.

WRITING CONVENTIONS:
1. Use algorithmic pseudocode for complex procedures
2. State computational complexity: O(n log n)
3. Define all acronyms on first use
4. Use present tense for describing algorithms and systems
5. Include code snippets in monospace when helpful
6. Be precise about experimental setup (hardware, software versions)

STRUCTURE EXPECTATIONS:
- Clear problem statement and contributions upfront
- Related work should position your contribution
- Evaluation must include baselines and statistical significance
- Reproducibility: describe all hyperparameters and random seeds

AVOID:
- Overclaiming ("revolutionary", "groundbreaking")
- Hiding negative results
- Vague descriptions of methods`,

  'clinical-medicine': `You are an expert medical writing assistant.

CRITICAL REQUIREMENTS:
1. Patient safety is paramount - never provide clinical advice
2. Use CONSORT guidelines for RCTs, PRISMA for reviews
3. Report all adverse events
4. State conflicts of interest
5. Include ethics approval and informed consent statements

WRITING CONVENTIONS:
- Use Vancouver citation style [1]
- Report statistics: "HR 0.75 (95% CI: 0.62-0.91, P=0.003)"
- Use PICO format for clinical questions
- Report NNT (number needed to treat) where applicable
- Use INN (generic) drug names

STRUCTURE:
- Structured abstract with Background, Methods, Results, Conclusions
- Methods must be reproducible
- CONSORT flow diagram for trials`,

  'chemistry': `You are an expert chemistry writing assistant.

WRITING CONVENTIONS:
1. Use IUPAC nomenclature for compounds
2. Report yields, melting points, and characterization data
3. Include spectroscopic data: ¹H NMR (400 MHz, CDCl₃): δ 7.26...
4. Draw reaction schemes with reagents and conditions
5. Use subscripts for chemical formulas: H₂O, CH₃CH₂OH

STRUCTURE:
- Results and Discussion often combined in organic chemistry
- Experimental section with full synthetic procedures
- Supporting Information for spectra and additional data

SAFETY:
- Note hazardous materials and procedures
- Include appropriate safety warnings`,

  // ... more disciplines
};
```

---

## 5. Discipline-Specific Tools

### 5.1 Tool Registry

```typescript
// lib/tools/discipline-tools.ts

export interface DisciplineTool {
  id: string;
  name: string;
  description: string;
  disciplines: DisciplineId[];
  type: 'generator' | 'analyzer' | 'formatter' | 'validator';
  execute: (input: unknown) => Promise<unknown>;
}

export const DISCIPLINE_TOOLS: DisciplineTool[] = [
  // Chemistry Tools
  {
    id: 'reaction-scheme',
    name: 'Reaction Scheme Generator',
    description: 'Generate chemical reaction schemes from SMILES',
    disciplines: ['chemistry'],
    type: 'generator',
    // Uses RDKit via Python API or ChemDraw-like rendering
  },
  {
    id: 'nmr-table',
    name: 'NMR Data Table Formatter',
    description: 'Format NMR data into publication-ready tables',
    disciplines: ['chemistry'],
    type: 'formatter',
  },

  // Physics/Math Tools
  {
    id: 'equation-renderer',
    name: 'LaTeX Equation Renderer',
    description: 'Render LaTeX equations to SVG',
    disciplines: ['physics', 'mathematics', 'engineering'],
    type: 'generator',
  },
  {
    id: 'unit-converter',
    name: 'SI Unit Converter',
    description: 'Convert between unit systems',
    disciplines: ['physics', 'engineering'],
    type: 'formatter',
  },

  // Clinical Tools
  {
    id: 'consort-checker',
    name: 'CONSORT Checklist',
    description: 'Validate RCT report against CONSORT guidelines',
    disciplines: ['clinical-medicine'],
    type: 'validator',
  },
  {
    id: 'prisma-flowchart',
    name: 'PRISMA Flowchart Generator',
    description: 'Generate PRISMA flowcharts for systematic reviews',
    disciplines: ['clinical-medicine', 'life-sciences'],
    type: 'generator',
  },
  {
    id: 'statistics-reporter',
    name: 'Clinical Statistics Formatter',
    description: 'Format statistical results (CI, p-values, effect sizes)',
    disciplines: ['clinical-medicine', 'life-sciences'],
    type: 'formatter',
  },

  // Bioinformatics Tools
  {
    id: 'sequence-formatter',
    name: 'Sequence Formatter',
    description: 'Format DNA/protein sequences for publication',
    disciplines: ['bioinformatics', 'life-sciences'],
    type: 'formatter',
  },
  {
    id: 'pathway-diagram',
    name: 'Pathway Diagram Generator',
    description: 'Generate metabolic/signaling pathway diagrams',
    disciplines: ['bioinformatics', 'life-sciences'],
    type: 'generator',
  },

  // CS Tools
  {
    id: 'algorithm-pseudocode',
    name: 'Algorithm Formatter',
    description: 'Format algorithms in publication-ready pseudocode',
    disciplines: ['computer-science', 'mathematics'],
    type: 'formatter',
  },
  {
    id: 'complexity-analyzer',
    name: 'Complexity Analyzer',
    description: 'Analyze and format time/space complexity',
    disciplines: ['computer-science'],
    type: 'analyzer',
  },

  // General Academic Tools
  {
    id: 'citation-validator',
    name: 'Citation Validator',
    description: 'Validate citations against DOI/PMID databases',
    disciplines: ['all'],
    type: 'validator',
  },
  {
    id: 'figure-caption',
    name: 'Figure Caption Generator',
    description: 'Generate publication-ready figure captions',
    disciplines: ['all'],
    type: 'generator',
  },
];
```

---

## 6. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)
- [ ] Implement discipline registry and selection UI
- [ ] Add arXiv, Semantic Scholar, OpenAlex database clients
- [ ] Create discipline-specific system prompts
- [ ] Build 5+ templates per major discipline

### Phase 2: Database Expansion (Weeks 5-8)
- [ ] Add bioRxiv, medRxiv, ChemRxiv clients
- [ ] Implement NASA ADS for astronomy
- [ ] Add unified search with discipline-based ranking
- [ ] Implement citation deduplication across sources

### Phase 3: Tools & Features (Weeks 9-12)
- [ ] Build equation renderer (LaTeX → SVG)
- [ ] Implement CONSORT/PRISMA checklist validators
- [ ] Add citation style support (10+ styles)
- [ ] Create discipline-specific writing suggestions

### Phase 4: Polish & Integration (Weeks 13-16)
- [ ] User discipline preferences and history
- [ ] Cross-discipline paper discovery
- [ ] Export templates for major journals
- [ ] Performance optimization

---

## 7. UI/UX Design

### 7.1 Discipline Selector Component

```typescript
// components/discipline/discipline-selector.tsx

interface DisciplineSelectorProps {
  selected: DisciplineId;
  onSelect: (discipline: DisciplineId) => void;
}

// Design:
// - Grid of discipline cards with icons
// - Each card shows: icon, name, paper count, database badges
// - "Recommended" tag based on user history
// - Search/filter for disciplines
```

### 7.2 Discipline-Aware Search

```typescript
// components/research/unified-search.tsx

// Features:
// - Auto-selects databases based on discipline
// - Shows database badges on results
// - Filters by open access, year, article type
// - "Related papers" using semantic similarity
// - Citation count and recency indicators
```

---

## 8. Success Metrics

| Metric | Baseline | Target (6 months) |
|--------|----------|-------------------|
| Disciplines supported | 1 | 15+ |
| Databases integrated | 1 | 8+ |
| Templates available | 6 | 50+ |
| Citation styles | 1 | 25+ |
| User discipline coverage | Life Sci only | 80% of STEM |
| Cross-discipline searches | 0% | 30% of searches |

---

## 9. References & Inspiration

- [K-Dense AI Claude Scientific Skills](https://github.com/K-Dense-AI/claude-scientific-skills) - 138 skills across 15+ domains
- [OpenAlex API](https://docs.openalex.org/) - Free, comprehensive academic database
- [Semantic Scholar API](https://api.semanticscholar.org/) - AI-powered paper discovery
- [arXiv API](https://arxiv.org/help/api) - Physics, Math, CS preprints
- [CrossRef API](https://api.crossref.org/) - DOI metadata and citations

---

**Document Status:** Draft
**Last Updated:** January 2, 2026
**Next Steps:** Begin Phase 1 implementation
