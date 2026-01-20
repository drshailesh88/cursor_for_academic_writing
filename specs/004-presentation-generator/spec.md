# Presentation Generator - Feature Specification

**Feature ID:** 004
**Feature Name:** AI-Powered Academic Presentation Generator
**Version:** 1.0
**Date:** 2026-01-04
**Status:** Specification Complete
**Priority:** P0 - Critical Feature

---

## Executive Summary

The Presentation Generator transforms the Academic Writing Platform from a writing tool into a complete academic content suite. Users can create publication-quality presentations directly from their academic documents, research synthesis, or custom prompts—all without leaving the app.

**Vision Statement:**
> "One click from research draft to presentation-ready slides. The last presentation tool academics will ever need."

**Competitive Target:** Gamma + Beautiful.ai + NotebookLM Slides + Kimi K2 + GenSpark

---

## Problem Statement

### Current Pain Points

1. **Context Switching:** Researchers must export content, switch to PowerPoint/Google Slides, manually structure content, and format slides—losing 2-4 hours per presentation
2. **Content Distillation:** Academic papers contain dense information; manually extracting key points is error-prone and time-consuming
3. **Visual Representation:** Converting statistics, methodologies, and findings into compelling visuals requires design expertise most academics lack
4. **Citation Integrity:** Existing presentation tools don't understand academic citations; references get lost or improperly formatted
5. **Iteration Friction:** After editing the source document, presentations must be manually updated

### Why This Feature Wins

| Competitor | Limitation | Our Advantage |
|------------|------------|---------------|
| Gamma | Generic content, no academic focus | Native academic content understanding |
| Beautiful.ai | No source document integration | Direct document-to-slides pipeline |
| NotebookLM | Read-only, export-only | Full editing + real-time sync |
| Kimi K2 | PDF input only | Live document + research integration |
| GenSpark | No citation handling | Full CSL citation support |
| All | Separate app | **Built-in, zero context switch** |

---

## User Stories

### Primary User Stories

```gherkin
Feature: Generate Presentation from Document

  As an academic researcher
  I want to generate a presentation from my research document
  So that I can present my findings without manual slide creation

  Scenario: One-Click Presentation Generation
    Given I have a research document with 3,000+ words
    When I click "Generate Presentation"
    And select "Conference Presentation (15 min)"
    Then the system generates 12-15 slides with:
      | Element | Source |
      | Title slide | Document title + author |
      | Outline | Auto-extracted sections |
      | Key findings | AI-identified claims |
      | Statistics | Extracted data visualizations |
      | Citations | Properly formatted references |
      | Conclusion | Synthesized summary |
    And slides are displayed in the editor panel
    And I can edit any slide immediately

  Scenario: Presentation from Selected Text
    Given I have selected a paragraph about methodology
    When I right-click and choose "Create Slide from Selection"
    Then the system creates a single slide with:
      - Appropriate heading
      - Bullet points or visual as appropriate
      - Related citations if present
    And the slide is added to my current presentation
```

### Secondary User Stories

```gherkin
Feature: Smart Data Visualization

  As a researcher presenting statistical findings
  I want my data automatically converted to appropriate charts
  So that my audience can understand complex results instantly

  Scenario: Statistical Data to Chart
    Given my document contains "The treatment group showed
           a 23% improvement (p<0.001, n=450)"
    When generating slides
    Then the system creates a bar chart showing:
      - Treatment vs Control comparison
      - 23% improvement highlighted
      - Statistical significance indicated
      - Sample size annotation

  Scenario: Process to Flowchart
    Given my document describes a methodology with sequential steps
    When generating slides
    Then the system creates a flowchart with:
      - Connected process nodes
      - Decision points where applicable
      - Color-coded phases
```

```gherkin
Feature: Citation-Aware Presentations

  As an academic presenting published research
  I want my citations preserved and formatted correctly
  So that my presentation maintains scholarly integrity

  Scenario: Citation Preservation
    Given my document cites "(Smith et al., 2024)"
    When that citation appears in a generated slide
    Then the citation is:
      - Properly formatted for the selected style
      - Linked to the reference in my library
      - Included in the "References" slide at the end
```

```gherkin
Feature: Presentation Export

  As a presenter
  I want to export my presentation in multiple formats
  So that I can use it in any environment

  Scenario: Export Options
    When I click "Export Presentation"
    Then I see options for:
      | Format | Description |
      | PPTX | Microsoft PowerPoint (editable) |
      | PDF | Print-ready document |
      | HTML | Web-based slideshow |
      | Google Slides | Direct export to Google |
    And each export preserves:
      - All formatting
      - Embedded visualizations
      - Speaker notes
      - Animations (where supported)
```

---

## Functional Requirements

### FR-1: Presentation Generation Engine

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.1 | Generate presentations from full documents | P0 |
| FR-1.2 | Generate slides from selected text | P0 |
| FR-1.3 | Generate from research synthesis output | P0 |
| FR-1.4 | Generate from custom prompt/topic | P1 |
| FR-1.5 | Support multiple presentation formats (academic, poster, pitch) | P1 |
| FR-1.6 | Intelligent content distillation with AI | P0 |
| FR-1.7 | Preserve document structure (sections → slides) | P0 |

### FR-2: Slide Types & Templates

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-2.1 | Title slides with metadata | P0 |
| FR-2.2 | Content slides (bullet points) | P0 |
| FR-2.3 | Data visualization slides (charts, graphs) | P0 |
| FR-2.4 | Comparison slides (tables, matrices) | P0 |
| FR-2.5 | Process/flowchart slides | P1 |
| FR-2.6 | Image/figure slides with captions | P0 |
| FR-2.7 | Quote/highlight slides | P1 |
| FR-2.8 | Timeline slides | P2 |
| FR-2.9 | Section divider slides | P1 |
| FR-2.10 | References/bibliography slides | P0 |
| FR-2.11 | Q&A/Discussion slides | P1 |
| FR-2.12 | Appendix slides | P2 |

### FR-3: Data Visualization Engine

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-3.1 | Bar charts (vertical, horizontal, stacked) | P0 |
| FR-3.2 | Line charts (single, multi-series) | P0 |
| FR-3.3 | Pie/donut charts | P0 |
| FR-3.4 | Scatter plots with trend lines | P1 |
| FR-3.5 | Box plots for statistical distributions | P2 |
| FR-3.6 | Flowcharts with connectors | P1 |
| FR-3.7 | Organizational/hierarchy charts | P2 |
| FR-3.8 | Timeline visualizations | P2 |
| FR-3.9 | Comparison matrices | P1 |
| FR-3.10 | Venn diagrams | P2 |
| FR-3.11 | Data tables with highlighting | P0 |

### FR-4: Presentation Editor

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.1 | Slide thumbnail navigation (left panel) | P0 |
| FR-4.2 | Drag-and-drop slide reordering | P0 |
| FR-4.3 | Add/delete/duplicate slides | P0 |
| FR-4.4 | Edit text directly on slides | P0 |
| FR-4.5 | Edit/resize visualizations | P1 |
| FR-4.6 | Change slide layouts | P1 |
| FR-4.7 | Apply/change themes | P0 |
| FR-4.8 | Add speaker notes | P0 |
| FR-4.9 | Undo/redo support | P0 |
| FR-4.10 | Keyboard shortcuts | P1 |
| FR-4.11 | Full-screen preview mode | P0 |
| FR-4.12 | Presenter view with notes | P1 |

### FR-5: Theme System

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-5.1 | Academic theme (clean, professional) | P0 |
| FR-5.2 | Modern minimal theme | P0 |
| FR-5.3 | Dark mode theme | P0 |
| FR-5.4 | Conference poster theme | P1 |
| FR-5.5 | Discipline-specific themes (medical, tech, humanities) | P2 |
| FR-5.6 | Custom color palette support | P1 |
| FR-5.7 | Institution branding support | P2 |
| FR-5.8 | Font customization | P1 |

### FR-6: Export & Integration

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-6.1 | Export to PPTX (PowerPoint) | P0 |
| FR-6.2 | Export to PDF | P0 |
| FR-6.3 | Export to HTML slideshow | P1 |
| FR-6.4 | Export to Google Slides | P2 |
| FR-6.5 | Export to Keynote | P2 |
| FR-6.6 | Include speaker notes in exports | P0 |
| FR-6.7 | Preserve animations in PPTX | P1 |
| FR-6.8 | Save presentations to Supabase | P0 |
| FR-6.9 | Load/edit saved presentations | P0 |

### FR-7: AI Capabilities

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-7.1 | Content extraction and summarization | P0 |
| FR-7.2 | Key point identification | P0 |
| FR-7.3 | Data pattern recognition for visualization | P0 |
| FR-7.4 | Citation extraction and formatting | P0 |
| FR-7.5 | Automatic slide titling | P0 |
| FR-7.6 | Speaking time estimation | P1 |
| FR-7.7 | Content gap suggestions | P2 |
| FR-7.8 | Regenerate individual slides | P0 |
| FR-7.9 | Expand/condense content | P1 |
| FR-7.10 | Multi-language support | P2 |

---

## Non-Functional Requirements

### NFR-1: Performance

| Metric | Target |
|--------|--------|
| Presentation generation (10 slides) | < 15 seconds |
| Presentation generation (25 slides) | < 30 seconds |
| Slide render time | < 100ms |
| Export to PPTX | < 5 seconds |
| Export to PDF | < 3 seconds |
| Theme switching | < 500ms |

### NFR-2: Quality

| Metric | Target |
|--------|--------|
| Content accuracy (vs source) | > 95% |
| Citation preservation | 100% |
| Data visualization accuracy | 100% |
| Layout consistency | > 98% |
| Export fidelity (PPTX) | > 95% |

### NFR-3: Usability

| Metric | Target |
|--------|--------|
| Time to first presentation | < 30 seconds |
| Learning curve (basic use) | < 5 minutes |
| User satisfaction score | > 4.5/5 |
| Accessibility compliance | WCAG 2.1 AA |

### NFR-4: Design Quality

- **Premium Feel:** Every interaction should feel polished, smooth, and intentional
- **Apple-like Aesthetics:** Clean typography, generous whitespace, subtle animations
- **Consistency:** Matches existing app design language exactly
- **Delight:** Micro-interactions that surprise and delight users

---

## UI/UX Specifications

### Entry Points

1. **Top Bar Button:** New "Presentation" icon next to Export buttons
2. **Context Menu:** Right-click selected text → "Create Slide"
3. **Chat Interface:** "Generate presentation about [topic]"
4. **Keyboard Shortcut:** Cmd+Shift+G (Generate presentation)

### Main Interface: Presentation Mode

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Back to Editor    [Untitled Presentation]    Theme ▼   Preview   Export ▼ │
├─────────────┬───────────────────────────────────────────────────┬────────────┤
│             │                                                   │            │
│   SLIDES    │              SLIDE CANVAS                         │    AI      │
│             │                                                   │  ASSIST    │
│  ┌───────┐  │   ┌─────────────────────────────────────────┐    │            │
│  │ 1. ◼  │  │   │                                         │    │ Regenerate │
│  └───────┘  │   │          [SLIDE CONTENT]                │    │ this slide │
│  ┌───────┐  │   │                                         │    │            │
│  │ 2. ◼  │  │   │                                         │    │ Add more   │
│  └───────┘  │   │                                         │    │ detail     │
│  ┌───────┐  │   │                                         │    │            │
│  │ 3. ◼  │◀─│───│─── Currently selected                   │    │ Simplify   │
│  └───────┘  │   │                                         │    │            │
│  ┌───────┐  │   │                                         │    │ Change     │
│  │ 4. ◼  │  │   │                                         │    │ layout     │
│  └───────┘  │   │                                         │    │            │
│             │   └─────────────────────────────────────────┘    │ ─────────  │
│  + Add      │                                                   │            │
│    Slide    │   [Speaker Notes: Click to add notes...]         │ Chat with  │
│             │                                                   │ AI about   │
│             │                                                   │ this slide │
├─────────────┴───────────────────────────────────────────────────┴────────────┤
│  ◀ Slide 3 of 12    ●○○○○○○○○○○○    ▶         Duration: ~15 min             │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Generation Dialog

```
┌─────────────────────────────────────────────────────────────────┐
│                   Generate Presentation                     ✕   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Source:  ◉ Current Document  ○ Selected Text  ○ Custom Topic  │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Format:                                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Conference  │  │   Lecture   │  │   Poster    │            │
│  │  15 min     │  │   45 min    │  │   A0 size   │            │
│  │ 10-15 slides│  │ 30-40 slides│  │   1 slide   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Focus Areas (optional):                                        │
│  ☑ Include methodology details                                 │
│  ☑ Emphasize key findings                                      │
│  ☐ Include all citations                                       │
│  ☑ Generate data visualizations                                │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Theme:   Academic ▼                                            │
│                                                                 │
│                           ┌────────────────────┐                │
│                           │  Generate Slides   │                │
│                           └────────────────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Slide Types Visual Reference

#### Title Slide
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                                                             │
│          IMPACT OF AI ON CLINICAL DECISION MAKING          │
│          ───────────────────────────────────────           │
│                                                             │
│                   A Systematic Review                       │
│                                                             │
│                                                             │
│               Dr. Jane Smith, MD, PhD                       │
│             Department of Medicine                          │
│              Stanford University                            │
│                                                             │
│                  January 4, 2026                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Data Visualization Slide
```
┌─────────────────────────────────────────────────────────────┐
│  Treatment Outcomes by Group                                │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│       ████████████████████████  72%  Treatment              │
│       ████████████             49%  Control                 │
│                                                             │
│                    ┌─────────────────────┐                  │
│                    │ Δ = 23% (p<0.001)   │                  │
│                    │ n = 450 patients    │                  │
│                    └─────────────────────┘                  │
│                                                             │
│  Source: Chen et al., 2024                                  │
└─────────────────────────────────────────────────────────────┘
```

#### Process/Flowchart Slide
```
┌─────────────────────────────────────────────────────────────┐
│  Study Selection Process (PRISMA)                           │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│    ┌─────────────┐                                         │
│    │ Records     │                                         │
│    │ identified  │                                         │
│    │ (n=2,450)   │                                         │
│    └──────┬──────┘                                         │
│           ▼                                                 │
│    ┌─────────────┐      ┌─────────────┐                    │
│    │ Screened    │─────▶│ Excluded    │                    │
│    │ (n=2,450)   │      │ (n=2,100)   │                    │
│    └──────┬──────┘      └─────────────┘                    │
│           ▼                                                 │
│    ┌─────────────┐                                         │
│    │ Included    │                                         │
│    │ (n=45)      │                                         │
│    └─────────────┘                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Specifications

### Data Models

```typescript
// Presentation Schema
interface Presentation {
  id: string;
  userId: string;
  documentId?: string;  // Source document if generated from doc
  title: string;
  theme: ThemeId;
  slides: Slide[];
  settings: PresentationSettings;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Slide {
  id: string;
  type: SlideType;
  layout: LayoutType;
  content: SlideContent;
  speakerNotes: string;
  animations?: Animation[];
  order: number;
}

type SlideType =
  | 'title'
  | 'content'
  | 'data-visualization'
  | 'comparison'
  | 'process'
  | 'image'
  | 'quote'
  | 'timeline'
  | 'section-divider'
  | 'references'
  | 'qa';

interface SlideContent {
  title?: string;
  subtitle?: string;
  bullets?: BulletPoint[];
  chart?: ChartConfig;
  table?: TableConfig;
  flowchart?: FlowchartConfig;
  image?: ImageConfig;
  quote?: QuoteConfig;
  citations?: CitationReference[];
}

interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'box';
  data: ChartData;
  options: ChartOptions;
  source?: string;  // Citation for data source
}

interface Theme {
  id: ThemeId;
  name: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
  spacing: ThemeSpacing;
  slideBackground: string;
  isDark: boolean;
}
```

### API Endpoints

```typescript
// Presentation Generation
POST /api/presentations/generate
Body: {
  sourceType: 'document' | 'text' | 'topic';
  sourceId?: string;      // Document ID
  sourceText?: string;    // Selected text or topic
  format: 'conference' | 'lecture' | 'poster';
  theme: ThemeId;
  options: GenerationOptions;
}
Response: { presentationId: string; slides: Slide[] }

// Slide Operations
POST /api/presentations/:id/slides
PUT /api/presentations/:id/slides/:slideId
DELETE /api/presentations/:id/slides/:slideId
POST /api/presentations/:id/slides/:slideId/regenerate

// Export
POST /api/presentations/:id/export
Body: { format: 'pptx' | 'pdf' | 'html' }
Response: { downloadUrl: string }

// AI Operations
POST /api/presentations/ai/extract-data
POST /api/presentations/ai/suggest-visualization
POST /api/presentations/ai/improve-slide
```

### File Structure

```
lib/
├── presentations/
│   ├── types.ts                 # TypeScript interfaces
│   ├── generator.ts             # AI presentation generation
│   ├── slides.ts                # Slide operations
│   ├── themes.ts                # Theme definitions
│   ├── visualizations/
│   │   ├── charts.ts            # Chart generation (Chart.js)
│   │   ├── flowcharts.ts        # Flowchart generation
│   │   ├── tables.ts            # Table generation
│   │   └── renderer.ts          # SVG/Canvas rendering
│   └── export/
│       ├── pptx.ts              # PowerPoint export (pptxgenjs)
│       ├── pdf.ts               # PDF export
│       └── html.ts              # HTML slideshow export

components/
├── presentations/
│   ├── presentation-mode.tsx     # Main presentation interface
│   ├── slide-canvas.tsx          # Slide editor canvas
│   ├── slide-thumbnail.tsx       # Thumbnail in sidebar
│   ├── slide-templates/
│   │   ├── title-slide.tsx
│   │   ├── content-slide.tsx
│   │   ├── data-slide.tsx
│   │   ├── process-slide.tsx
│   │   └── ...
│   ├── generation-dialog.tsx     # Generate presentation dialog
│   ├── theme-selector.tsx        # Theme picker
│   ├── ai-assist-panel.tsx       # Right panel AI tools
│   ├── speaker-notes.tsx         # Notes editor
│   └── presenter-view.tsx        # Full-screen presenter mode

app/
├── api/
│   └── presentations/
│       ├── route.ts              # CRUD operations
│       ├── generate/route.ts     # AI generation
│       └── export/route.ts       # Export handling
```

### Dependencies

```json
{
  "pptxgenjs": "^3.12.0",        // PowerPoint generation
  "chart.js": "^4.4.0",          // Chart rendering
  "react-chartjs-2": "^5.2.0",   // React Chart.js wrapper
  "dagre": "^0.8.5",             // Flowchart layout algorithm
  "react-flow": "^11.10.0",      // Flowchart rendering
  "html2canvas": "^1.4.1",       // Slide screenshot for export
  "framer-motion": "^11.0.0"     // Slide animations
}
```

---

## Competitive Analysis

### Feature Comparison Matrix

| Feature | Gamma | Beautiful.ai | NotebookLM | Kimi K2 | GenSpark | **OURS** |
|---------|:-----:|:------------:|:----------:|:-------:|:--------:|:--------:|
| AI Generation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Source Document Integration | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| Live Document Sync | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Academic Citation Support | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Research Integration | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| Data Visualization | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Statistical Chart Types | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| PPTX Export | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| In-App Editing | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Multi-LLM Support | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Discipline-Aware | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Zero Context Switch | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

### Our Unique Advantages

1. **Zero Context Switching:** Generate presentations without leaving the writing environment
2. **Citation Integrity:** First presentation tool that preserves academic citations properly
3. **Research-Aware:** Leverages PubMed, arXiv, Semantic Scholar data already in the app
4. **Discipline-Specific:** Themes and conventions for different academic fields
5. **Live Sync:** Update source document → presentation reflects changes
6. **Statistical Literacy:** Proper visualization of p-values, confidence intervals, etc.

---

## Success Metrics

### Launch Metrics (First 30 days)

| Metric | Target |
|--------|--------|
| Presentations generated | 1,000+ |
| Users who generate > 1 presentation | 60% |
| Average slides per presentation | 12+ |
| Export completion rate | 85% |
| User satisfaction (in-app survey) | > 4.0/5 |

### Quality Metrics (Ongoing)

| Metric | Target |
|--------|--------|
| Content accuracy score | > 95% |
| Citation preservation rate | 100% |
| Time saved vs manual creation | > 70% |
| Return usage rate (30 day) | > 50% |

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| AI generates inaccurate content | High | Medium | Source linking, regeneration options, human review prompts |
| PPTX export compatibility issues | Medium | Medium | Extensive testing with PowerPoint versions, fallback PDF |
| Performance issues with large presentations | Medium | Low | Lazy loading, pagination, background processing |
| Chart data misinterpretation | High | Medium | Explicit data annotation UI, verification step |
| Theme rendering inconsistency | Medium | Medium | Fixed template system, cross-browser testing |

---

## Implementation Phases

### Phase 7A: Core Engine (Week 1-2)
- Presentation data models and Supabase schema
- Basic AI generation pipeline
- Slide type components (title, content, data)
- Theme system foundation

### Phase 7B: Visualization (Week 2-3)
- Chart.js integration
- Statistical chart types
- Flowchart engine
- Table rendering

### Phase 7C: Editor (Week 3-4)
- Slide canvas component
- Thumbnail navigation
- Drag-and-drop reordering
- Inline editing

### Phase 7D: Export & Polish (Week 4-5)
- PPTX export (pptxgenjs)
- PDF export
- Speaker notes
- Presenter view
- Final polish and animations

---

## Acceptance Criteria

### Minimum Viable Feature (MVF)

- [ ] Generate 10-15 slide presentation from document in < 30 seconds
- [ ] Support title, content, and data visualization slides
- [ ] Academic theme with professional typography
- [ ] Edit slide text directly
- [ ] Reorder slides via drag-and-drop
- [ ] Export to PPTX with preserved formatting
- [ ] Export to PDF
- [ ] Citations appear on reference slide

### Full Feature

All MVF plus:
- [ ] 5+ themes including dark mode
- [ ] Flowchart and process slides
- [ ] Comparison/table slides
- [ ] Speaker notes
- [ ] Presenter view
- [ ] AI assist panel (regenerate, expand, simplify)
- [ ] Custom topic generation
- [ ] HTML slideshow export

---

## Appendix

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+Shift+G | Generate presentation from document |
| Cmd+N | New slide |
| Cmd+D | Duplicate slide |
| Delete | Delete selected slide |
| ↑/↓ | Navigate slides |
| Space | Preview mode |
| Esc | Exit preview |
| Cmd+S | Save presentation |

### Supported Citation Styles in Presentations

- APA 7th Edition
- MLA 9th Edition
- Chicago (Author-Date)
- Vancouver
- IEEE
- Harvard

---

**Document History:**
- v1.0 (2026-01-04): Initial specification complete
