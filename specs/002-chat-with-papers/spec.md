# Feature Specification: Understand Your Papers

**Feature Branch**: `002-understand-your-papers`
**Created**: 2026-01-03
**Updated**: 2026-01-03
**Status**: Complete Specification
**Vision**: The most powerful AI-powered research paper comprehension system that combines the best of ChatPDF, Elicit, SciSpace, NotebookLM, and Semantic Reader into one integrated platform

---

## Executive Summary

"Understand Your Papers" is a comprehensive AI-powered system for interacting with, analyzing, and extracting insights from research papers. Unlike existing tools that offer fragmented functionality, this system provides:

- **Deep PDF Processing** with figure/table extraction (beyond ChatPDF)
- **Multi-Paper Conversations** with cross-paper analysis (beyond ScienceOS)
- **Structured Data Extraction** with research matrices (Elicit-inspired)
- **Audio Explanations** and learning modes (NotebookLM-inspired)
- **Semantic Reading** with inline explanations (Semantic Reader-inspired)
- **30+ Pre-built Prompts** plus custom prompt library (Paperpal-inspired)
- **Citation-Aware Responses** with paragraph references (SciSpace-inspired)
- **Collaborative Annotations** for team research

---

## Competitive Analysis & Feature Matrix

| Feature | ChatPDF | Elicit | SciSpace | NotebookLM | Ours |
|---------|---------|--------|----------|------------|------|
| PDF Upload | ✓ | ✓ | ✓ | ✓ | ✓ |
| Multi-PDF Chat | ✓ | ✓ | ✓ | ✓ | ✓ |
| Figure/Table Extraction | ✗ | ✗ | Partial | ✗ | **✓ Full** |
| Audio Summaries | ✗ | ✗ | ✗ | ✓ | **✓ Enhanced** |
| Research Matrix | ✗ | ✓ | ✓ | ✗ | **✓ Enhanced** |
| Semantic Reader | ✗ | ✗ | ✗ | ✗ | **✓ New** |
| Citation Network | ✗ | Partial | ✓ | ✗ | **✓ Full** |
| Collaborative Notes | ✗ | ✗ | ✗ | ✗ | **✓ New** |
| Custom Prompt Library | ✗ | ✗ | ✗ | ✗ | **✓ New** |
| Evidence Grading | ✗ | ✗ | ✗ | ✗ | **✓ New** |
| Paper Comparison | Partial | ✗ | ✓ | ✗ | **✓ Enhanced** |
| Export to Document | ✗ | ✗ | ✗ | ✗ | **✓ Integrated** |

---

## Core Capabilities

### 1. Advanced PDF Processing Engine

#### 1.1 Text Extraction
- **Multi-layer extraction**: OCR for scanned documents, text layer for digital PDFs
- **Section identification**: Automatic detection of Abstract, Introduction, Methods, Results, Discussion, Conclusion, References
- **Paragraph-level indexing**: Every paragraph gets a unique ID for citation
- **Language detection**: Support for 20+ languages with translation

#### 1.2 Figure & Table Extraction
- **Figure extraction**: Extract all figures with captions
- **Table extraction**: Convert tables to structured data (CSV/JSON)
- **Chart interpretation**: AI-powered interpretation of graphs and charts
- **Equation parsing**: LaTeX rendering of mathematical equations
- **Supplementary materials**: Process supplementary PDFs

#### 1.3 Metadata Enrichment
- **Auto-extraction**: Title, authors, affiliations, journal, DOI, year
- **CrossRef/PubMed lookup**: Enrich with citation counts, impact factor
- **Author disambiguation**: Link to author profiles (ORCID, Google Scholar)
- **Reference parsing**: Extract and link all cited references

#### 1.4 Quality Assessment
- **Journal impact metrics**: Impact factor, H-index, quartile ranking
- **Study design detection**: RCT, meta-analysis, cohort, case study, etc.
- **Sample size extraction**: Automatic detection of study population
- **Conflict of interest detection**: Flag potential biases

---

### 2. Intelligent Chat Interface

#### 2.1 Single Paper Chat
```
┌─────────────────────────────────────────────────────────────────┐
│ 📄 Paper: "Deep Learning in Medical Imaging" (Chen et al., 2024)│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [You]: What methodology did they use?                           │
│                                                                 │
│ [AI]: The authors employed a convolutional neural network       │
│ (CNN) architecture based on ResNet-50, trained on 150,000       │
│ chest X-rays from three hospitals. [Methods, ¶3-5]              │
│                                                                 │
│ Key methodological details:                                     │
│ • Training data: 150,000 images (80/10/10 split)               │
│ • Architecture: Modified ResNet-50 with attention              │
│ • Validation: 5-fold cross-validation                          │
│ • Metrics: AUC, sensitivity, specificity [Methods, ¶7]         │
│                                                                 │
│ 📍 Click any reference to jump to the source paragraph          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ [💬 Ask about this paper...]                    [🎤] [📎]       │
│                                                                 │
│ Quick Actions: [Summarize] [Key Findings] [Limitations] [Methods]│
└─────────────────────────────────────────────────────────────────┘
```

#### 2.2 Multi-Paper Chat (Up to 20 Papers)
```
┌─────────────────────────────────────────────────────────────────┐
│ 📚 Collection: "AI in Radiology Review" (8 papers)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [You]: Compare the accuracy metrics across all studies          │
│                                                                 │
│ [AI]: Here's a comparison of diagnostic accuracy across the     │
│ 8 studies in your collection:                                   │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────┐    │
│ │ Study          │ AUC   │ Sensitivity │ Specificity │ N  │    │
│ ├─────────────────────────────────────────────────────────┤    │
│ │ Chen 2024      │ 0.94  │ 89%         │ 92%         │ 15K│    │
│ │ Wang 2023      │ 0.91  │ 85%         │ 88%         │ 8K │    │
│ │ Smith 2024     │ 0.96  │ 92%         │ 94%         │ 22K│    │
│ │ [5 more...]    │       │             │             │    │    │
│ └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│ The highest performing model (Smith 2024) used a larger         │
│ dataset and ensemble approach. [Smith, Results ¶4]              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ Papers in chat: [Chen] [Wang] [Smith] [+5] [➕ Add Paper]       │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.3 Citation-Aware Responses
- Every AI response includes paragraph-level citations
- Click to jump to source in original PDF
- Confidence indicators for each claim
- "Show me the evidence" button for any statement

#### 2.4 Multi-Model Support
- Claude (Opus, Sonnet, Haiku)
- GPT-4o, GPT-4 Turbo
- Gemini Pro, Gemini Ultra
- Qwen 2.5
- User can switch models mid-conversation

---

### 3. Pre-Built Prompt Library (50+ Prompts)

#### 3.1 Understanding Prompts
| Prompt | Description |
|--------|-------------|
| "Explain Like I'm a Grad Student" | Accessible explanation with preserved technical accuracy |
| "Explain Like I'm an Expert" | Assume deep domain knowledge |
| "What's Novel Here?" | Identify unique contributions |
| "Devil's Advocate" | Challenge the paper's claims |
| "Methodology Critique" | Evaluate study design rigor |

#### 3.2 Extraction Prompts
| Prompt | Description |
|--------|-------------|
| "Extract All Statistics" | Pull every p-value, CI, effect size |
| "PICO Summary" | Population, Intervention, Comparison, Outcome |
| "Create Study Matrix" | Structured comparison table |
| "Extract Limitations" | All acknowledged and unacknowledged limitations |
| "Future Directions" | Research gaps identified |

#### 3.3 Writing Prompts
| Prompt | Description |
|--------|-------------|
| "Write Introduction Paragraph" | Draft intro citing this paper |
| "Create Citation Sentence" | Natural citation sentence for this paper |
| "Summarize for Methods Section" | Methods description for your paper |
| "Create Comparison Table" | LaTeX/Markdown table comparing studies |

#### 3.4 Custom Prompt Library
- Save your own prompts
- Share prompts with team
- Prompt templates with variables
- Prompt chains (multi-step workflows)

---

### 4. Semantic Reader Mode (Inspired by Semantic Scholar)

#### 4.1 Inline Explanations
```
┌─────────────────────────────────────────────────────────────────┐
│ 📖 Semantic Reader: Chen et al., 2024                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ "The model achieved an [AUC of 0.94]¹ on the held-out test     │
│ set, significantly outperforming the [radiologist baseline]²    │
│ (p < 0.001). We employed [transfer learning]³ from ImageNet    │
│ to address the limited training data challenge."                │
│                                                                 │
│ ┌─────────────────────────────────────┐                        │
│ │ ¹ AUC (Area Under Curve)            │ ← Hover explanation    │
│ │ A measure of classifier performance │                        │
│ │ ranging from 0.5 (random) to 1.0    │                        │
│ │ (perfect). 0.94 is considered       │                        │
│ │ excellent diagnostic accuracy.      │                        │
│ │ [📊 See related papers] [📖 Learn]  │                        │
│ └─────────────────────────────────────┘                        │
│                                                                 │
│ Terms: [All] [Technical Only] [Statistical Only]               │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.2 Citation Popups
- Hover over any citation to see:
  - Paper title and authors
  - Abstract preview
  - Citation context (why cited)
  - Link to add to library

#### 4.3 Figure Focus Mode
- Click any figure reference to see full figure
- AI-generated figure descriptions
- Zoom, pan, and annotate

#### 4.4 Reading Progress
- Track reading progress per paper
- Highlight important sections
- Create reading lists

---

### 5. Audio Learning Mode (NotebookLM-Inspired)

#### 5.1 Audio Summaries
- Generate 5-15 minute audio summaries
- Multiple voice options
- Adjustable speed (0.5x - 2x)
- Download as MP3/M4A

#### 5.2 Podcast-Style Explanations
```
┌─────────────────────────────────────────────────────────────────┐
│ 🎧 Audio Learning: "Deep Learning in Medical Imaging"          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [▶] ━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 4:32 / 12:45      │
│                                                                 │
│ Generate:                                                       │
│ [Quick Summary (5 min)]  [Deep Dive (15 min)]  [Q&A Style]     │
│                                                                 │
│ Sections:                                                       │
│ ├─ 0:00 Introduction & Context                                 │
│ ├─ 2:15 Key Methodology                                        │
│ ├─ 5:30 Main Findings                                          │
│ ├─ 8:45 Limitations & Caveats                                  │
│ └─ 11:00 Implications & Future Work                            │
│                                                                 │
│ [📥 Download] [🔗 Share] [📝 Transcript]                       │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.3 Two-Host Discussion Mode
- Simulated conversation between two AI hosts
- One explains, one asks clarifying questions
- Socratic method for deeper understanding
- Custom discussion topics

#### 5.4 Interactive Q&A Mode
- AI asks you questions about the paper
- Tests comprehension
- Identifies knowledge gaps
- Spaced repetition for key concepts

---

### 6. Research Matrix (Elicit-Inspired)

#### 6.1 Automated Data Extraction
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📊 Research Matrix: AI in Medical Imaging Studies                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌───────────┬──────────┬─────────┬───────┬──────────┬─────────┬─────────┐ │
│ │ Paper     │ Design   │ N       │ AUC   │ Accuracy │ Dataset │ Task    │ │
│ ├───────────┼──────────┼─────────┼───────┼──────────┼─────────┼─────────┤ │
│ │ Chen 2024 │ Retro    │ 15,000  │ 0.94  │ 91%      │ Private │ Chest   │ │
│ │ Wang 2023 │ Prosp    │ 8,000   │ 0.91  │ 87%      │ MIMIC   │ Chest   │ │
│ │ Smith 2024│ Multi    │ 22,000  │ 0.96  │ 94%      │ Mixed   │ Chest   │ │
│ │ Lee 2024  │ Retro    │ 5,000   │ 0.89  │ 85%      │ Public  │ Brain   │ │
│ └───────────┴──────────┴─────────┴───────┴──────────┴─────────┴─────────┘ │
│                                                                             │
│ Columns: [+ Add Column] [Sample Size] [P-value] [Confidence Interval]      │
│ Actions: [📥 Export CSV] [📊 Visualize] [📝 Generate Summary]              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 6.2 Custom Columns
- Add any extraction column
- AI auto-fills from paper content
- Manual override with source citation
- Formula columns (calculated fields)

#### 6.3 Extraction Templates
| Template | Columns Included |
|----------|------------------|
| Clinical Trial | Design, N, Intervention, Control, Primary Outcome, Secondary Outcomes, Follow-up |
| Systematic Review | Databases, Date Range, Inclusion Criteria, Studies Included, Meta-analysis Method |
| Diagnostic Accuracy | Sensitivity, Specificity, PPV, NPV, AUC, Reference Standard |
| Machine Learning | Architecture, Training Data, Validation Method, Performance Metrics, Hardware |

#### 6.4 Matrix Operations
- Sort by any column
- Filter papers by criteria
- Group by category
- Statistical summary row
- Identify outliers and conflicts

---

### 7. Paper Comparison Engine

#### 7.1 Side-by-Side Comparison
```
┌────────────────────────────┬────────────────────────────┐
│ Chen et al., 2024          │ Smith et al., 2024         │
├────────────────────────────┼────────────────────────────┤
│ Methods                    │ Methods                    │
│ ───────────                │ ───────────                │
│ • ResNet-50 backbone       │ • EfficientNet-B7 backbone │
│ • Single-center data       │ • Multi-center data        │
│ • 150K images              │ • 220K images              │
│ • 5-fold CV                │ • External validation      │
│                            │                            │
│ [Different] Architecture   │ [Different] Architecture   │
│ [Different] Data source    │ [Different] Data source    │
│ [Similar] Validation       │ [Similar] Task             │
├────────────────────────────┴────────────────────────────┤
│ Key Differences:                                        │
│ • Smith uses larger, multi-center dataset (+47% data)   │
│ • Different backbone architecture (efficiency vs depth) │
│ • Smith includes external validation (stronger evidence)│
│                                                         │
│ [Generate Comparison Paragraph] [Add to Document]       │
└─────────────────────────────────────────────────────────┘
```

#### 7.2 Contradiction Detection
- Identify conflicting findings across papers
- Show evidence for each position
- Suggest possible explanations
- Link to reconciling papers

#### 7.3 Consensus Visualization
- For yes/no questions across papers
- Show percentage agreement
- Weight by study quality
- Display confidence intervals

#### 7.4 Trend Analysis
- How findings evolve over time
- Methodology improvements
- Performance benchmarks
- Emerging consensus

---

### 8. Annotation & Collaboration System

#### 8.1 Highlight Types
| Type | Color | Purpose |
|------|-------|---------|
| Key Finding | Yellow | Important results |
| Methodology | Blue | Methods to reference |
| Limitation | Orange | Caveats to note |
| Question | Red | Need to verify |
| Quote | Green | Direct citation candidate |
| Custom | Any | User-defined |

#### 8.2 Annotation Features
- Add notes to highlights
- Link highlights across papers
- Create annotation threads
- Export annotations as summary

#### 8.3 Collaborative Features
- Share papers with team members
- Real-time collaborative annotation
- Comment threads on highlights
- @mention team members
- Activity feed for shared papers

#### 8.4 Version History
- Track all annotation changes
- Compare versions
- Restore previous annotations
- Export annotation history

---

### 9. Evidence Grading System

#### 9.1 Automatic Quality Assessment
```
┌─────────────────────────────────────────────────────────────────┐
│ 📊 Evidence Quality: Chen et al., 2024                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Overall Grade: B+ (Strong Evidence with Limitations)            │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────┐    │
│ │ Criteria              │ Score │ Notes                   │    │
│ ├───────────────────────┼───────┼─────────────────────────┤    │
│ │ Study Design          │ 7/10  │ Retrospective, single   │    │
│ │ Sample Size           │ 9/10  │ Large (n=15,000)        │    │
│ │ Methodology Rigor     │ 8/10  │ Good validation         │    │
│ │ Statistical Analysis  │ 8/10  │ Appropriate methods     │    │
│ │ Generalizability      │ 5/10  │ Single institution      │    │
│ │ Bias Risk             │ 6/10  │ Selection bias possible │    │
│ │ Conflict of Interest  │ 9/10  │ No apparent conflicts   │    │
│ └───────────────────────┴───────┴─────────────────────────┘    │
│                                                                 │
│ Key Strengths:                                                  │
│ • Large sample size provides good statistical power             │
│ • Rigorous validation methodology                               │
│                                                                 │
│ Key Limitations:                                                │
│ • Single-center study limits generalizability                   │
│ • Retrospective design introduces potential biases              │
│                                                                 │
│ [📋 Full Assessment Report] [📥 Export]                        │
└─────────────────────────────────────────────────────────────────┘
```

#### 9.2 Evidence Hierarchy
- Level I: Systematic reviews, meta-analyses
- Level II: Randomized controlled trials
- Level III: Controlled studies without randomization
- Level IV: Case-control, cohort studies
- Level V: Case series, case reports
- Level VI: Expert opinion

#### 9.3 Risk of Bias Tools
- ROBINS-I for non-randomized studies
- RoB 2 for randomized trials
- QUADAS-2 for diagnostic accuracy
- GRADE assessment framework

---

### 10. Document Integration

#### 10.1 Insert to Document
- Insert citations with one click
- Insert summaries with proper citation
- Insert comparison tables
- Insert extracted data
- Maintain bibliography automatically

#### 10.2 Citation Formats
- Author-year (Harvard)
- Numbered (Vancouver)
- Footnote (Chicago)
- Custom format

#### 10.3 Export Options
- Selected highlights and notes
- Research matrix as table
- Bibliography (BibTeX, RIS, EndNote)
- Complete paper summary
- Audio summary

---

## User Interface Design

### Main Paper View
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Understand Your Papers                                    [🔍] [⚙️] [👤]    │
├────────────────────┬────────────────────────────────────┬───────────────────┤
│                    │                                    │                   │
│ 📚 My Library      │ 📄 Current Paper                   │ 💬 Paper Chat     │
│                    │                                    │                   │
│ ┌────────────────┐ │ ┌────────────────────────────────┐ │ ┌───────────────┐ │
│ │ Collections    │ │ │                                │ │ │               │ │
│ │ ├─ All (42)    │ │ │  Deep Learning in Medical     │ │ │ [AI]: This    │ │
│ │ ├─ AI Review   │ │ │  Imaging: A Systematic Review │ │ │ paper presents│ │
│ │ │   (8)        │ │ │                                │ │ │ a systematic  │ │
│ │ ├─ Methods     │ │ │  Chen, Wang, Liu et al.       │ │ │ review of...  │ │
│ │ │   (12)       │ │ │  Nature Medicine, 2024        │ │ │               │ │
│ │ └─ Unread (5)  │ │ │                                │ │ │ [Methods, ¶3] │ │
│ │                │ │ │  ⭐ 4.5 | 📊 B+ | 🔗 234 refs │ │ │               │ │
│ ├────────────────┤ │ │                                │ │ ├───────────────┤ │
│ │ Recent Papers  │ │ ├────────────────────────────────┤ │ │ Quick:        │ │
│ │                │ │ │ [📖 Read] [🎧 Audio] [📊 Data]│ │ │ [Summarize]   │ │
│ │ • Chen 2024    │ │ │ [💬 Chat] [📝 Notes] [⚖️ Compare]│ │ [Limitations] │ │
│ │ • Wang 2023    │ │ ├────────────────────────────────┤ │ │ [Methods]     │ │
│ │ • Smith 2024   │ │ │                                │ │ │ [Key Stats]   │ │
│ │ • Lee 2024     │ │ │ Abstract                       │ │ │               │ │
│ │                │ │ │ ─────────                      │ │ ├───────────────┤ │
│ ├────────────────┤ │ │ Background: Deep learning...   │ │ │               │ │
│ │ [➕ Upload]    │ │ │ [highlighted text shown]       │ │ │ [Ask...]      │ │
│ │ [📥 Import]    │ │ │                                │ │ │        [🎤]   │ │
│ └────────────────┘ │ └────────────────────────────────┘ │ └───────────────┘ │
│                    │                                    │                   │
└────────────────────┴────────────────────────────────────┴───────────────────┘
```

### Research Matrix View
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📊 Research Matrix: AI in Medical Imaging (8 papers)       [+ Add Paper]    │
├─────────────────────────────────────────────────────────────────────────────┤
│ Template: [Diagnostic Accuracy ▼]              [+ Add Column] [📥 Export]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────┬────────┬───────┬───────┬─────┬───────┬────────┬──────────────┐ │
│ │ Paper ▼ │ Design │ N     │ AUC   │ Sens│ Spec  │ Dataset│ Quality      │ │
│ ├─────────┼────────┼───────┼───────┼─────┼───────┼────────┼──────────────┤ │
│ │☑ Chen   │ Retro  │15,000 │ 0.94  │ 89% │ 92%   │ Private│ ⭐⭐⭐⭐      │ │
│ │☑ Wang   │ Prosp  │ 8,000 │ 0.91  │ 85% │ 88%   │ MIMIC  │ ⭐⭐⭐⭐⭐    │ │
│ │☑ Smith  │ Multi  │22,000 │ 0.96  │ 92% │ 94%   │ Mixed  │ ⭐⭐⭐⭐⭐    │ │
│ │☐ Lee    │ Retro  │ 5,000 │ 0.89  │ 85% │ 87%   │ Public │ ⭐⭐⭐        │ │
│ └─────────┴────────┴───────┴───────┴─────┴───────┴────────┴──────────────┘ │
│                                                                             │
│ Summary: Mean AUC = 0.925 (range: 0.89-0.96) | Total N = 50,000            │
│                                                                             │
│ [📊 Create Chart] [📝 Generate Narrative] [🔍 Find Conflicts]              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Technical Architecture

### Data Models

```typescript
// Core Paper Model
interface UploadedPaper {
  id: string;
  userId: string;

  // File info
  fileName: string;
  fileSize: number;
  fileUrl: string;  // Supabase Storage URL
  uploadedAt: Timestamp;

  // Extracted metadata
  metadata: PaperMetadata;

  // Processed content
  content: PaperContent;

  // Quality assessment
  quality: QualityAssessment;

  // User interactions
  readProgress: number;  // 0-100
  lastReadAt?: Timestamp;
  highlights: Highlight[];
  notes: Note[];

  // Organization
  collections: string[];
  tags: string[];
  starred: boolean;

  // Processing status
  status: 'uploading' | 'processing' | 'ready' | 'error';
  processingError?: string;
}

interface PaperMetadata {
  title: string;
  authors: Author[];
  journal?: string;
  year?: number;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  pmid?: string;
  arxivId?: string;
  abstract?: string;
  keywords: string[];
  language: string;

  // Enriched data (from external APIs)
  citationCount?: number;
  impactFactor?: number;
  journalQuartile?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  authorProfiles?: AuthorProfile[];
}

interface Author {
  name: string;
  firstName?: string;
  lastName?: string;
  affiliation?: string;
  orcid?: string;
  email?: string;
  isCorresponding: boolean;
}

interface PaperContent {
  // Full text
  fullText: string;
  wordCount: number;

  // Structured sections
  sections: Section[];

  // Extracted elements
  figures: Figure[];
  tables: ExtractedTable[];
  equations: Equation[];

  // References
  references: Reference[];

  // Paragraph index for citations
  paragraphs: IndexedParagraph[];
}

interface Section {
  id: string;
  type: 'abstract' | 'introduction' | 'methods' | 'results' | 'discussion' | 'conclusion' | 'references' | 'supplementary' | 'other';
  title: string;
  content: string;
  startPage: number;
  endPage: number;
  paragraphIds: string[];
}

interface IndexedParagraph {
  id: string;
  sectionId: string;
  content: string;
  pageNumber: number;
  embedding?: number[];  // For semantic search
}

interface Figure {
  id: string;
  label: string;  // "Figure 1"
  caption: string;
  imageUrl: string;
  pageNumber: number;
  aiDescription?: string;  // AI-generated description
}

interface ExtractedTable {
  id: string;
  label: string;  // "Table 1"
  caption: string;
  headers: string[];
  rows: string[][];
  pageNumber: number;
  csvData: string;
  jsonData: Record<string, unknown>[];
}

interface Reference {
  id: string;
  index: number;  // [1], [2], etc.
  rawText: string;
  parsed?: {
    authors: string[];
    title: string;
    journal?: string;
    year?: number;
    doi?: string;
    pmid?: string;
  };
  linkedPaper?: string;  // ID if paper is in library
}

// Quality Assessment
interface QualityAssessment {
  overallGrade: 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';
  overallScore: number;  // 0-100

  studyDesign: {
    type: string;
    evidenceLevel: 1 | 2 | 3 | 4 | 5 | 6;
    score: number;
  };

  criteria: QualityCriterion[];

  strengths: string[];
  limitations: string[];
  biasRisks: BiasRisk[];
}

interface QualityCriterion {
  name: string;
  score: number;
  maxScore: number;
  notes: string;
}

interface BiasRisk {
  type: string;
  level: 'low' | 'moderate' | 'high' | 'unclear';
  explanation: string;
}

// Chat Models
interface PaperChat {
  id: string;
  userId: string;
  paperIds: string[];  // Can be multi-paper chat
  title: string;

  messages: ChatMessage[];

  model: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;

  // For assistant messages
  citations?: MessageCitation[];
  confidence?: number;

  // For user messages
  promptTemplate?: string;

  createdAt: Timestamp;
}

interface MessageCitation {
  paperId: string;
  paragraphId: string;
  sectionType: string;
  quote: string;
  pageNumber: number;
}

// Annotation Models
interface Highlight {
  id: string;
  paperId: string;
  userId: string;

  type: 'key_finding' | 'methodology' | 'limitation' | 'question' | 'quote' | 'custom';
  color: string;

  // Position
  startParagraphId: string;
  endParagraphId: string;
  startOffset: number;
  endOffset: number;
  selectedText: string;
  pageNumber: number;

  // Notes
  notes: HighlightNote[];

  // Linking
  linkedHighlights: string[];  // Links to other highlights
  linkedPapers: string[];      // Links to other papers

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface HighlightNote {
  id: string;
  userId: string;
  content: string;
  createdAt: Timestamp;
}

// Research Matrix
interface ResearchMatrix {
  id: string;
  userId: string;
  title: string;
  description?: string;

  template: 'clinical_trial' | 'systematic_review' | 'diagnostic' | 'ml_study' | 'custom';

  paperIds: string[];

  columns: MatrixColumn[];
  rows: MatrixRow[];

  // Calculated summaries
  summaries: MatrixSummary[];

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface MatrixColumn {
  id: string;
  name: string;
  type: 'text' | 'number' | 'percentage' | 'boolean' | 'rating' | 'calculated';
  extractionPrompt?: string;  // AI prompt to extract this data
  formula?: string;  // For calculated columns
  width: number;
}

interface MatrixRow {
  paperId: string;
  values: Record<string, MatrixCell>;
}

interface MatrixCell {
  value: string | number | boolean;
  source?: {
    paragraphId: string;
    quote: string;
  };
  confidence: number;
  manualOverride: boolean;
}

// Audio Features
interface AudioSummary {
  id: string;
  paperId: string;
  userId: string;

  type: 'quick' | 'deep' | 'discussion' | 'qa';
  duration: number;  // seconds

  audioUrl: string;
  transcript: string;
  chapters: AudioChapter[];

  voiceSettings: {
    voice: string;
    speed: number;
  };

  createdAt: Timestamp;
}

interface AudioChapter {
  title: string;
  startTime: number;
  endTime: number;
  content: string;
}

// Collections
interface PaperCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  icon: string;

  paperIds: string[];

  sharedWith: CollaboratorAccess[];

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface CollaboratorAccess {
  userId: string;
  email: string;
  permission: 'view' | 'annotate' | 'edit' | 'admin';
  addedAt: Timestamp;
}
```

### API Endpoints

```typescript
// Paper Upload & Processing
POST   /api/papers/upload              // Upload PDF
GET    /api/papers/:id                 // Get paper details
DELETE /api/papers/:id                 // Delete paper
POST   /api/papers/:id/reprocess       // Reprocess extraction

// Paper Chat
POST   /api/papers/chat                // Chat with paper(s)
GET    /api/papers/chat/:chatId        // Get chat history
POST   /api/papers/chat/:chatId/message // Send message

// Audio Features
POST   /api/papers/:id/audio/generate  // Generate audio summary
GET    /api/papers/:id/audio           // List audio summaries
GET    /api/papers/:id/audio/:audioId  // Get specific audio

// Research Matrix
POST   /api/matrix                     // Create new matrix
GET    /api/matrix/:id                 // Get matrix
PUT    /api/matrix/:id                 // Update matrix
POST   /api/matrix/:id/extract         // AI extract data for column
POST   /api/matrix/:id/export          // Export as CSV/Excel

// Annotations
POST   /api/papers/:id/highlights      // Create highlight
PUT    /api/papers/:id/highlights/:hId // Update highlight
DELETE /api/papers/:id/highlights/:hId // Delete highlight

// Collections
POST   /api/collections                // Create collection
GET    /api/collections                // List collections
PUT    /api/collections/:id            // Update collection
POST   /api/collections/:id/share      // Share collection

// Prompts
GET    /api/prompts/library            // Get prompt library
POST   /api/prompts/custom             // Save custom prompt
DELETE /api/prompts/custom/:id         // Delete custom prompt
```

---

## User Scenarios & Testing

### User Story 1 - Upload and Deep Process Paper (Priority: P0)

A researcher uploads a PDF and receives comprehensive extraction including text, figures, tables, and metadata enrichment.

**Acceptance Scenarios**:

1. **Given** a user uploads a 20-page PDF, **When** processing completes, **Then** they see full text extracted with sections identified, figures extracted with AI captions, tables converted to data, and metadata enriched from CrossRef/PubMed

2. **Given** a scanned PDF with no text layer, **When** processing completes, **Then** OCR extracts text with >90% accuracy and user is warned about potential errors

3. **Given** a PDF with complex tables, **When** processing completes, **Then** tables are extracted as structured data and can be exported as CSV

---

### User Story 2 - Semantic Reading Mode (Priority: P0)

A researcher reads a paper with inline explanations for technical terms, clickable citations, and figure popups.

**Acceptance Scenarios**:

1. **Given** a paper in Semantic Reader mode, **When** user hovers over a technical term, **Then** an inline explanation popup appears with definition and related papers

2. **Given** a citation in the text, **When** user hovers over it, **Then** they see the cited paper's title, authors, abstract preview, and option to add to library

3. **Given** a figure reference (e.g., "Figure 3"), **When** user clicks it, **Then** the figure appears in a modal with AI-generated description

---

### User Story 3 - Multi-Paper Chat with Citations (Priority: P0)

A researcher chats with multiple papers simultaneously and receives answers with paragraph-level citations.

**Acceptance Scenarios**:

1. **Given** 5 papers in a chat, **When** user asks "Compare the methodologies", **Then** AI provides comparison table with citations to specific paragraphs in each paper

2. **Given** an AI response with citations, **When** user clicks a citation, **Then** they jump to that paragraph in the original paper

3. **Given** a factual question, **When** AI cannot find evidence in the papers, **Then** it says "I couldn't find this information in the provided papers" rather than hallucinating

---

### User Story 4 - Audio Learning Mode (Priority: P1)

A researcher generates audio summaries and podcast-style explanations for papers.

**Acceptance Scenarios**:

1. **Given** a paper, **When** user generates "Quick Summary", **Then** a 5-minute audio file is created covering key points

2. **Given** "Two-Host Discussion" mode, **When** audio is generated, **Then** two AI voices discuss the paper with one explaining and one asking clarifying questions

3. **Given** a generated audio, **When** user clicks a chapter, **Then** playback jumps to that section

---

### User Story 5 - Research Matrix Data Extraction (Priority: P1)

A researcher creates a comparison matrix across multiple papers with AI-assisted data extraction.

**Acceptance Scenarios**:

1. **Given** a matrix with 10 papers and 8 columns, **When** AI extraction runs, **Then** all cells are populated with values and source citations

2. **Given** an AI-extracted value, **When** user clicks "Show Source", **Then** they see the exact paragraph where the value was found

3. **Given** a completed matrix, **When** user exports to CSV, **Then** all data including sources is exported

---

### User Story 6 - Evidence Quality Grading (Priority: P1)

A researcher sees automatic quality assessment for each paper based on study design and methodology.

**Acceptance Scenarios**:

1. **Given** an uploaded RCT paper, **When** quality assessment completes, **Then** evidence level is marked as Level II with detailed scoring

2. **Given** a paper with methodology limitations, **When** assessment completes, **Then** specific biases are identified with explanations

3. **Given** multiple papers in a matrix, **When** sorted by quality, **Then** papers are ordered by evidence grade

---

### User Story 7 - Collaborative Annotations (Priority: P2)

A research team shares papers and collaboratively annotates them in real-time.

**Acceptance Scenarios**:

1. **Given** a shared collection, **When** one user adds a highlight, **Then** other team members see it in real-time

2. **Given** a highlight with notes, **When** team member adds a reply, **Then** a threaded discussion appears on that highlight

3. **Given** a paper with team annotations, **When** user exports, **Then** all annotations from all team members are included

---

### User Story 8 - Document Integration (Priority: P1)

A researcher inserts paper content into their manuscript with proper citations.

**Acceptance Scenarios**:

1. **Given** a research matrix, **When** user clicks "Insert Table", **Then** a formatted comparison table is added to the document with citations

2. **Given** a paper summary, **When** user clicks "Insert with Citation", **Then** the summary is added with proper author-year citation

3. **Given** inserted content, **When** user views references, **Then** all cited papers appear in the bibliography

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| PDF is password-protected | Display error asking for unprotected version |
| PDF is corrupted | Validate before processing, show clear error |
| PDF is too large (>100MB) | Display size limit, suggest compression |
| PDF is image-only (scanned) | Apply OCR, warn about accuracy |
| Language is not English | Detect language, offer translation, note limitations |
| PDF has complex multi-column layout | Intelligent layout detection, manual section correction option |
| Tables span multiple pages | Merge continued tables automatically |
| Figures are low quality | Enhance if possible, warn about quality |
| References cannot be parsed | Show raw text, allow manual correction |
| Paper is already in library | Detect duplicates, offer to merge annotations |
| Chat response contradicts paper | Include confidence score, show source for verification |
| Audio generation fails | Retry with fallback voice, offer text transcript |

---

## Success Criteria

| Metric | Target |
|--------|--------|
| PDF processing time (20 pages) | < 60 seconds |
| Text extraction accuracy | > 98% for digital PDFs |
| OCR accuracy | > 90% for scanned PDFs |
| Section identification accuracy | > 95% |
| Table extraction accuracy | > 90% |
| Chat response time | < 5 seconds |
| Citation accuracy (no hallucinations) | > 99% |
| Audio generation time | < 2 minutes per 10 min audio |
| User satisfaction with summaries | > 4.5/5 |
| Research matrix extraction accuracy | > 85% |
| Time saved on literature review | > 60% |

---

## Assumptions

- Users upload papers they have legal access to
- Supabase Storage is configured for file uploads
- TTS API is available for audio generation
- Users are authenticated
- Multi-model API access is configured

---

## Dependencies

- **PDF.js**: Client-side PDF rendering
- **pdf-parse** or **pdf2json**: Server-side text extraction
- **Tesseract.js**: OCR for scanned documents
- **OpenAI/Anthropic/Google**: LLM for chat and extraction
- **ElevenLabs or Google TTS**: Audio generation
- **CrossRef API**: DOI lookup and metadata enrichment
- **PubMed API**: PMID lookup and abstract retrieval
- **Supabase Storage**: PDF file storage
- **Supabase Postgres**: Paper metadata and chat storage

---

## Implementation Priority

### Phase 1 - Core Upload & Chat (Week 1-2)
- PDF upload and text extraction
- Section identification
- Basic single-paper chat with citations
- Paper library management

### Phase 2 - Enhanced Extraction (Week 3-4)
- Figure and table extraction
- Metadata enrichment from CrossRef/PubMed
- Multi-paper chat
- Pre-built prompt library

### Phase 3 - Semantic Reader (Week 5-6)
- Inline term explanations
- Citation popups
- Figure focus mode
- Reading progress tracking

### Phase 4 - Research Matrix (Week 7-8)
- Matrix creation with templates
- AI-assisted data extraction
- Export functionality
- Comparison features

### Phase 5 - Audio & Quality (Week 9-10)
- Audio summary generation
- Two-host discussion mode
- Quality assessment grading
- Evidence hierarchy display

### Phase 6 - Collaboration (Week 11-12)
- Real-time annotation sync
- Collection sharing
- Comment threads
- Activity feed

---

## Differentiators from Competition

| vs Competition | Our Advantage |
|----------------|---------------|
| vs ChatPDF | Figure/table extraction, multi-paper chat, research matrix |
| vs Elicit | Semantic reader, audio mode, real-time collaboration |
| vs SciSpace | Evidence grading, custom prompts, two-host discussions |
| vs NotebookLM | Academic-focused, citation-aware, integrated with writing |
| vs Scholarcy | Deeper analysis, multi-paper comparison, export to document |
| vs All | Fully integrated with academic writing workflow |
