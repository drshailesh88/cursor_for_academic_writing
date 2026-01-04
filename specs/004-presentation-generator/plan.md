# Presentation Generator - Implementation Plan

**Feature ID:** 004
**Plan Version:** 1.0
**Date:** 2026-01-04
**Status:** Architecture Complete

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION GENERATOR SYSTEM                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         GENERATION LAYER                                 │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │   │
│  │  │ Content      │  │ Structure    │  │ Visualization│  │ Citation    │  │   │
│  │  │ Extractor    │  │ Analyzer     │  │ Detector     │  │ Processor   │  │   │
│  │  │ (AI)         │  │ (AI)         │  │ (AI + Rules) │  │ (CSL)       │  │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘  │   │
│  │         │                 │                 │                 │          │   │
│  │         └────────────────┬┴─────────────────┴─────────────────┘          │   │
│  │                          ▼                                               │   │
│  │              ┌───────────────────────┐                                   │   │
│  │              │   Slide Composer      │                                   │   │
│  │              │   (Orchestrator)      │                                   │   │
│  │              └───────────┬───────────┘                                   │   │
│  └──────────────────────────┼───────────────────────────────────────────────┘   │
│                             │                                                   │
│  ┌──────────────────────────▼───────────────────────────────────────────────┐   │
│  │                         RENDERING LAYER                                  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │   │
│  │  │ Chart        │  │ Flowchart    │  │ Table        │  │ Text        │  │   │
│  │  │ Renderer     │  │ Renderer     │  │ Renderer     │  │ Renderer    │  │   │
│  │  │ (Chart.js)   │  │ (Dagre/Flow) │  │ (Custom)     │  │ (Custom)    │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │   │
│  │                                                                          │   │
│  │  ┌────────────────────────────────────────────────────────────────────┐ │   │
│  │  │                     Theme Engine                                    │ │   │
│  │  │  Colors • Fonts • Spacing • Backgrounds • Animations               │ │   │
│  │  └────────────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                         EDITOR LAYER                                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │   │
│  │  │ Slide        │  │ Canvas       │  │ AI Assist    │  │ Speaker     │  │   │
│  │  │ Navigator    │  │ Editor       │  │ Panel        │  │ Notes       │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                         EXPORT LAYER                                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │   │
│  │  │ PPTX         │  │ PDF          │  │ HTML         │                   │   │
│  │  │ (pptxgenjs)  │  │ (jsPDF)      │  │ (Reveal.js)  │                   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                   │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                         PERSISTENCE LAYER                                │   │
│  │                    Firebase Firestore                                    │   │
│  │  /presentations/{presentationId}                                         │   │
│  │    ├── /slides/{slideId}                                                │   │
│  │    └── metadata, settings, theme                                        │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### 1. Generation Layer

#### 1.1 Content Extractor

**Purpose:** Extract and summarize document content for slide generation

```typescript
// lib/presentations/extractors/content-extractor.ts

interface ContentExtraction {
  title: string;
  authors: string[];
  abstract: string;
  sections: DocumentSection[];
  keyFindings: KeyFinding[];
  methodology: string;
  conclusions: string[];
  citations: ExtractedCitation[];
}

interface DocumentSection {
  heading: string;
  level: 1 | 2 | 3;
  content: string;
  bulletPoints: string[];
  hasData: boolean;
  dataPatterns: DataPattern[];
}

interface KeyFinding {
  text: string;
  confidence: number;
  supportingData?: string;
  citations: string[];
}

async function extractContent(
  document: Document,
  model: AIModel
): Promise<ContentExtraction> {
  // 1. Parse document structure from TipTap JSON
  // 2. Identify section boundaries
  // 3. Use AI to extract key findings
  // 4. Identify data patterns (statistics, numbers)
  // 5. Extract and link citations
}
```

#### 1.2 Structure Analyzer

**Purpose:** Determine optimal slide structure based on content

```typescript
// lib/presentations/analyzers/structure-analyzer.ts

interface PresentationStructure {
  totalSlides: number;
  sections: SlideSection[];
  suggestedDuration: number; // minutes
  contentDensity: 'light' | 'medium' | 'dense';
}

interface SlideSection {
  name: string;
  slides: SlideBlueprint[];
  transitions: string[];
}

interface SlideBlueprint {
  type: SlideType;
  layout: LayoutType;
  contentSource: string; // Reference to document section
  estimatedTime: number; // seconds
  priority: 'essential' | 'important' | 'optional';
}

async function analyzeStructure(
  content: ContentExtraction,
  format: PresentationFormat,
  options: StructureOptions
): Promise<PresentationStructure> {
  // 1. Calculate content-to-slide ratio
  // 2. Determine section breakpoints
  // 3. Assign slide types based on content analysis
  // 4. Balance visual vs text slides
  // 5. Ensure narrative flow
}
```

#### 1.3 Visualization Detector

**Purpose:** Identify opportunities for data visualization

```typescript
// lib/presentations/analyzers/visualization-detector.ts

interface VisualizationOpportunity {
  sourceText: string;
  type: ChartType;
  confidence: number;
  extractedData: DataPoint[];
  suggestedLayout: VisualizationLayout;
}

type ChartType =
  | 'bar' | 'stacked-bar'
  | 'line' | 'multi-line'
  | 'pie' | 'donut'
  | 'scatter' | 'bubble'
  | 'box-plot'
  | 'comparison-table'
  | 'flowchart'
  | 'timeline';

// Pattern matching for statistical data
const PATTERNS = {
  percentage: /(\d+(?:\.\d+)?)\s*%/g,
  comparison: /(\d+)\s*(?:vs|versus|compared to)\s*(\d+)/gi,
  pValue: /p\s*[<>=]\s*(\d+\.?\d*)/gi,
  sampleSize: /n\s*=\s*(\d+)/gi,
  confidenceInterval: /(\d+)%\s*CI/gi,
  effectSize: /(?:OR|RR|HR|d)\s*[=:]\s*(\d+\.?\d*)/gi,
  increase: /(\d+(?:\.\d+)?)\s*%?\s*(?:increase|improvement|reduction)/gi,
};

async function detectVisualizations(
  content: ContentExtraction
): Promise<VisualizationOpportunity[]> {
  // 1. Scan for statistical patterns
  // 2. Use AI to interpret data context
  // 3. Suggest appropriate chart types
  // 4. Extract data points for rendering
}
```

#### 1.4 Slide Composer

**Purpose:** Orchestrate slide generation from analyzed content

```typescript
// lib/presentations/generator.ts

interface GenerationConfig {
  source: 'document' | 'text' | 'topic';
  sourceContent: string | Document;
  format: PresentationFormat;
  theme: ThemeId;
  options: {
    includeMethodology: boolean;
    emphasizeFindings: boolean;
    includeAllCitations: boolean;
    generateVisualizations: boolean;
    targetSlideCount?: number;
  };
  model: AIModel;
}

async function generatePresentation(
  config: GenerationConfig
): Promise<Presentation> {
  // 1. Extract content
  const content = await extractContent(config.sourceContent, config.model);

  // 2. Analyze structure
  const structure = await analyzeStructure(content, config.format, config.options);

  // 3. Detect visualization opportunities
  const visualizations = await detectVisualizations(content);

  // 4. Generate slides
  const slides = await composeSlides(content, structure, visualizations, config);

  // 5. Apply theme
  const themedSlides = applyTheme(slides, config.theme);

  // 6. Generate reference slide
  const referenceSlide = generateReferenceSlide(content.citations);

  return {
    id: generateId(),
    title: content.title,
    slides: [...themedSlides, referenceSlide],
    theme: config.theme,
    settings: defaultSettings(),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
}
```

---

### 2. Rendering Layer

#### 2.1 Chart Renderer

**Technology:** Chart.js with React wrapper

```typescript
// lib/presentations/visualizations/chart-renderer.tsx

import { Chart } from 'chart.js/auto';
import { Bar, Line, Pie, Scatter } from 'react-chartjs-2';

interface ChartConfig {
  type: ChartType;
  data: {
    labels: string[];
    datasets: Dataset[];
  };
  options: ChartOptions;
  theme: ChartTheme;
}

// Academic-optimized chart defaults
const academicChartDefaults: ChartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        font: { family: 'Inter', size: 12 },
        usePointStyle: true,
      },
    },
    tooltip: {
      enabled: true,
      backgroundColor: 'rgba(0,0,0,0.8)',
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(0,0,0,0.05)' },
    },
    x: {
      grid: { display: false },
    },
  },
};

// Statistical annotation support
function addStatisticalAnnotations(
  chart: ChartConfig,
  stats: StatisticalAnnotation[]
): ChartConfig {
  // Add p-value indicators
  // Add confidence interval error bars
  // Add significance markers (* ** ***)
}
```

#### 2.2 Flowchart Renderer

**Technology:** React Flow with Dagre layout

```typescript
// lib/presentations/visualizations/flowchart-renderer.tsx

import ReactFlow, { Background, Controls } from 'reactflow';
import dagre from 'dagre';

interface FlowchartConfig {
  nodes: FlowNode[];
  edges: FlowEdge[];
  layout: 'TB' | 'LR'; // Top-Bottom or Left-Right
  theme: FlowchartTheme;
}

interface FlowNode {
  id: string;
  type: 'process' | 'decision' | 'terminal' | 'data';
  label: string;
  metadata?: {
    count?: number;  // e.g., "n=450"
    note?: string;
  };
}

// Auto-layout using Dagre
function layoutFlowchart(config: FlowchartConfig): LayoutedFlowchart {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: config.layout });
  g.setDefaultEdgeLabel(() => ({}));

  config.nodes.forEach(node => {
    g.setNode(node.id, { width: 180, height: 60 });
  });

  config.edges.forEach(edge => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  // Return positioned nodes
}

// PRISMA flowchart generator (common in academic papers)
function generatePRISMAFlow(data: PRISMAData): FlowchartConfig {
  return {
    nodes: [
      { id: 'identified', type: 'process', label: `Records identified\n(n=${data.identified})` },
      { id: 'screened', type: 'process', label: `Records screened\n(n=${data.screened})` },
      { id: 'excluded', type: 'process', label: `Records excluded\n(n=${data.excluded})` },
      { id: 'assessed', type: 'process', label: `Full-text assessed\n(n=${data.assessed})` },
      { id: 'included', type: 'terminal', label: `Studies included\n(n=${data.included})` },
    ],
    edges: [
      { source: 'identified', target: 'screened' },
      { source: 'screened', target: 'excluded' },
      { source: 'screened', target: 'assessed' },
      { source: 'assessed', target: 'included' },
    ],
    layout: 'TB',
  };
}
```

#### 2.3 Theme Engine

```typescript
// lib/presentations/themes.ts

interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  isDark: boolean;

  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    chart: string[];  // Color palette for charts
  };

  fonts: {
    heading: string;
    body: string;
    mono: string;
  };

  spacing: {
    slidePadding: number;
    elementGap: number;
    bulletIndent: number;
  };

  styles: {
    headingWeight: number;
    borderRadius: number;
    shadowIntensity: number;
  };
}

// Premium Academic Theme
export const academicTheme: Theme = {
  id: 'academic',
  name: 'Academic',
  description: 'Clean, professional theme for scholarly presentations',
  isDark: false,

  colors: {
    primary: '#6f5d96',      // Academic purple
    secondary: '#a18a76',    // Warm gray
    accent: '#d9a836',       // Scholarly gold
    background: '#ffffff',
    surface: '#f8f9fa',
    text: '#1a1a2e',
    textMuted: '#6b7280',
    border: '#e5e7eb',
    chart: ['#6f5d96', '#8b7bb0', '#a799c7', '#c3b8de', '#dfd8ef'],
  },

  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },

  spacing: {
    slidePadding: 48,
    elementGap: 24,
    bulletIndent: 32,
  },

  styles: {
    headingWeight: 600,
    borderRadius: 8,
    shadowIntensity: 0.08,
  },
};

// Dark Mode Theme
export const darkTheme: Theme = {
  id: 'dark',
  name: 'Dark',
  description: 'Elegant dark theme for low-light presentations',
  isDark: true,

  colors: {
    primary: '#9b8dc7',
    secondary: '#c4b5a4',
    accent: '#f0c14b',
    background: '#0f0f1a',
    surface: '#1a1a2e',
    text: '#f5f5f5',
    textMuted: '#9ca3af',
    border: '#2d2d44',
    chart: ['#9b8dc7', '#b5a8d8', '#cfc5e8', '#e9e2f8', '#f5f2fc'],
  },
  // ... other properties
};

// Modern Minimal Theme
export const minimalTheme: Theme = {
  id: 'minimal',
  name: 'Minimal',
  description: 'Clean, distraction-free design',
  isDark: false,

  colors: {
    primary: '#000000',
    secondary: '#666666',
    accent: '#0066cc',
    background: '#ffffff',
    surface: '#fafafa',
    text: '#111111',
    textMuted: '#888888',
    border: '#eeeeee',
    chart: ['#000000', '#333333', '#666666', '#999999', '#cccccc'],
  },
  // ... other properties
};
```

---

### 3. Editor Layer

#### 3.1 Presentation Mode Component

```typescript
// components/presentations/presentation-mode.tsx

'use client';

import { useState, useCallback } from 'react';
import { SlideNavigator } from './slide-navigator';
import { SlideCanvas } from './slide-canvas';
import { AIAssistPanel } from './ai-assist-panel';
import { SpeakerNotes } from './speaker-notes';
import { ThemeSelector } from './theme-selector';
import { ExportMenu } from './export-menu';

interface PresentationModeProps {
  presentation: Presentation;
  onUpdate: (presentation: Presentation) => void;
  onExit: () => void;
}

export function PresentationMode({
  presentation,
  onUpdate,
  onExit
}: PresentationModeProps) {
  const [selectedSlide, setSelectedSlide] = useState(0);
  const [isPreview, setIsPreview] = useState(false);

  const handleSlideUpdate = useCallback((slideIndex: number, slide: Slide) => {
    const updatedSlides = [...presentation.slides];
    updatedSlides[slideIndex] = slide;
    onUpdate({ ...presentation, slides: updatedSlides });
  }, [presentation, onUpdate]);

  const handleReorder = useCallback((startIndex: number, endIndex: number) => {
    const slides = [...presentation.slides];
    const [removed] = slides.splice(startIndex, 1);
    slides.splice(endIndex, 0, removed);
    onUpdate({ ...presentation, slides });
  }, [presentation, onUpdate]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <header className="h-14 border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button onClick={onExit} className="...">
            ← Back to Editor
          </button>
          <input
            value={presentation.title}
            onChange={(e) => onUpdate({ ...presentation, title: e.target.value })}
            className="text-lg font-medium bg-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <ThemeSelector
            value={presentation.theme}
            onChange={(theme) => onUpdate({ ...presentation, theme })}
          />
          <button onClick={() => setIsPreview(true)}>Preview</button>
          <ExportMenu presentation={presentation} />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left: Slide Navigator */}
        <SlideNavigator
          slides={presentation.slides}
          selectedIndex={selectedSlide}
          onSelect={setSelectedSlide}
          onReorder={handleReorder}
          onAdd={handleAddSlide}
          onDelete={handleDeleteSlide}
          onDuplicate={handleDuplicateSlide}
        />

        {/* Center: Slide Canvas */}
        <div className="flex-1 flex flex-col">
          <SlideCanvas
            slide={presentation.slides[selectedSlide]}
            theme={presentation.theme}
            onUpdate={(slide) => handleSlideUpdate(selectedSlide, slide)}
            editable={true}
          />

          {/* Speaker Notes */}
          <SpeakerNotes
            value={presentation.slides[selectedSlide].speakerNotes}
            onChange={(notes) => {
              const slide = { ...presentation.slides[selectedSlide], speakerNotes: notes };
              handleSlideUpdate(selectedSlide, slide);
            }}
          />
        </div>

        {/* Right: AI Assist */}
        <AIAssistPanel
          slide={presentation.slides[selectedSlide]}
          onRegenerate={handleRegenerateSlide}
          onExpand={handleExpandContent}
          onSimplify={handleSimplifyContent}
          onChangeLayout={handleChangeLayout}
        />
      </div>

      {/* Bottom: Navigation */}
      <footer className="h-12 border-t flex items-center justify-center gap-4">
        <button onClick={() => setSelectedSlide(s => Math.max(0, s - 1))}>◀</button>
        <span>Slide {selectedSlide + 1} of {presentation.slides.length}</span>
        <button onClick={() => setSelectedSlide(s => Math.min(presentation.slides.length - 1, s + 1))}>▶</button>
        <span className="ml-8 text-muted-foreground">
          Duration: ~{estimateDuration(presentation)} min
        </span>
      </footer>

      {/* Preview Modal */}
      {isPreview && (
        <PresenterView
          presentation={presentation}
          startSlide={selectedSlide}
          onExit={() => setIsPreview(false)}
        />
      )}
    </div>
  );
}
```

#### 3.2 Slide Canvas

```typescript
// components/presentations/slide-canvas.tsx

interface SlideCanvasProps {
  slide: Slide;
  theme: Theme;
  onUpdate: (slide: Slide) => void;
  editable: boolean;
}

export function SlideCanvas({ slide, theme, onUpdate, editable }: SlideCanvasProps) {
  const SlideComponent = getSlideComponent(slide.type);

  return (
    <div
      className="flex-1 flex items-center justify-center p-8 bg-gray-100 dark:bg-gray-900"
    >
      <div
        className="relative bg-white shadow-xl"
        style={{
          width: '960px',
          height: '540px', // 16:9 aspect ratio
          transform: 'scale(var(--slide-scale, 1))',
        }}
      >
        <SlideComponent
          content={slide.content}
          theme={theme}
          editable={editable}
          onContentChange={(content) => onUpdate({ ...slide, content })}
        />
      </div>
    </div>
  );
}

// Slide type components
function getSlideComponent(type: SlideType) {
  switch (type) {
    case 'title': return TitleSlide;
    case 'content': return ContentSlide;
    case 'data-visualization': return DataVisualizationSlide;
    case 'comparison': return ComparisonSlide;
    case 'process': return ProcessSlide;
    case 'image': return ImageSlide;
    case 'quote': return QuoteSlide;
    case 'timeline': return TimelineSlide;
    case 'section-divider': return SectionDividerSlide;
    case 'references': return ReferencesSlide;
    case 'qa': return QASlide;
    default: return ContentSlide;
  }
}
```

---

### 4. Export Layer

#### 4.1 PPTX Export

**Technology:** pptxgenjs

```typescript
// lib/presentations/export/pptx.ts

import PptxGenJS from 'pptxgenjs';

interface PptxExportOptions {
  includeNotes: boolean;
  includeAnimations: boolean;
}

export async function exportToPptx(
  presentation: Presentation,
  theme: Theme,
  options: PptxExportOptions
): Promise<Blob> {
  const pptx = new PptxGenJS();

  // Set presentation properties
  pptx.title = presentation.title;
  pptx.author = presentation.author || 'Academic Writing Platform';
  pptx.layout = 'LAYOUT_16x9';

  // Define master slides with theme
  pptx.defineSlideMaster({
    title: 'MASTER_SLIDE',
    background: { color: theme.colors.background },
    objects: [
      // Header, footer, page numbers
    ],
  });

  // Generate each slide
  for (const slide of presentation.slides) {
    const pptxSlide = pptx.addSlide();
    await renderSlideToPoX(pptxSlide, slide, theme, options);
  }

  // Generate blob
  const blob = await pptx.write({ outputType: 'blob' });
  return blob as Blob;
}

async function renderSlideToPptx(
  pptxSlide: PptxGenJS.Slide,
  slide: Slide,
  theme: Theme,
  options: PptxExportOptions
) {
  switch (slide.type) {
    case 'title':
      renderTitleSlide(pptxSlide, slide, theme);
      break;
    case 'content':
      renderContentSlide(pptxSlide, slide, theme);
      break;
    case 'data-visualization':
      await renderDataSlide(pptxSlide, slide, theme);
      break;
    // ... other slide types
  }

  // Add speaker notes
  if (options.includeNotes && slide.speakerNotes) {
    pptxSlide.addNotes(slide.speakerNotes);
  }
}

function renderTitleSlide(
  pptxSlide: PptxGenJS.Slide,
  slide: Slide,
  theme: Theme
) {
  const { title, subtitle, author, date, institution } = slide.content;

  // Main title
  pptxSlide.addText(title, {
    x: 0.5,
    y: 2.0,
    w: '90%',
    h: 1.5,
    fontSize: 44,
    fontFace: theme.fonts.heading,
    color: theme.colors.text,
    align: 'center',
    bold: true,
  });

  // Subtitle
  if (subtitle) {
    pptxSlide.addText(subtitle, {
      x: 0.5,
      y: 3.5,
      w: '90%',
      fontSize: 24,
      color: theme.colors.textMuted,
      align: 'center',
    });
  }

  // Author info
  if (author) {
    pptxSlide.addText(author, {
      x: 0.5,
      y: 4.5,
      w: '90%',
      fontSize: 18,
      color: theme.colors.text,
      align: 'center',
    });
  }
}

async function renderDataSlide(
  pptxSlide: PptxGenJS.Slide,
  slide: Slide,
  theme: Theme
) {
  const { title, chart } = slide.content;

  // Title
  pptxSlide.addText(title, {
    x: 0.5,
    y: 0.3,
    w: '90%',
    fontSize: 28,
    fontFace: theme.fonts.heading,
    bold: true,
  });

  // Convert chart to pptxgenjs format
  if (chart) {
    const chartData = convertChartData(chart, theme);
    pptxSlide.addChart(chartData.type, chartData.data, chartData.options);
  }
}
```

#### 4.2 PDF Export

```typescript
// lib/presentations/export/pdf.ts

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportToPdf(
  presentation: Presentation,
  theme: Theme
): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [960, 540],
  });

  for (let i = 0; i < presentation.slides.length; i++) {
    if (i > 0) pdf.addPage();

    // Render slide to canvas
    const slideElement = document.getElementById(`slide-${i}`);
    if (slideElement) {
      const canvas = await html2canvas(slideElement, {
        scale: 2,
        backgroundColor: theme.colors.background,
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 960, 540);
    }
  }

  return pdf.output('blob');
}
```

---

### 5. Persistence Layer

#### 5.1 Firebase Schema

```typescript
// lib/presentations/firebase-schema.ts

// Firestore collection structure:
// /users/{userId}/presentations/{presentationId}
// /users/{userId}/presentations/{presentationId}/slides/{slideId}

interface PresentationDoc {
  id: string;
  userId: string;
  documentId?: string;  // Source document reference
  title: string;
  theme: ThemeId;
  settings: PresentationSettings;
  slideOrder: string[];  // Array of slide IDs for ordering
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface SlideDoc {
  id: string;
  presentationId: string;
  type: SlideType;
  layout: LayoutType;
  content: SlideContent;  // Stored as JSON
  speakerNotes: string;
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Firebase operations
export async function createPresentation(
  userId: string,
  presentation: Omit<Presentation, 'id'>
): Promise<string> {
  const db = getFirestore();

  // Create presentation document
  const presRef = doc(collection(db, `users/${userId}/presentations`));
  const presData: PresentationDoc = {
    id: presRef.id,
    userId,
    title: presentation.title,
    theme: presentation.theme,
    settings: presentation.settings,
    slideOrder: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(presRef, presData);

  // Create slide documents
  const slideIds: string[] = [];
  for (let i = 0; i < presentation.slides.length; i++) {
    const slide = presentation.slides[i];
    const slideRef = doc(collection(db, `users/${userId}/presentations/${presRef.id}/slides`));

    await setDoc(slideRef, {
      id: slideRef.id,
      presentationId: presRef.id,
      type: slide.type,
      layout: slide.layout,
      content: slide.content,
      speakerNotes: slide.speakerNotes,
      order: i,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    slideIds.push(slideRef.id);
  }

  // Update slide order
  await updateDoc(presRef, { slideOrder: slideIds });

  return presRef.id;
}
```

---

## Integration Points

### 1. Document to Presentation

```typescript
// Integration with existing document system

// In components/layout/three-panel-layout.tsx
// Add "Generate Presentation" button to top bar

<Button
  onClick={() => setShowGenerationDialog(true)}
  className="flex items-center gap-2"
>
  <Presentation className="w-4 h-4" />
  Presentation
</Button>

{showGenerationDialog && (
  <GenerationDialog
    document={currentDocument}
    onGenerate={handleGeneratePresentation}
    onClose={() => setShowGenerationDialog(false)}
  />
)}
```

### 2. Citation Integration

```typescript
// Use existing citation library for reference slides

import { useCitations } from '@/lib/hooks/use-citations';
import { formatCitation } from '@/lib/citations/csl-formatter';

function generateReferenceSlide(
  citations: ExtractedCitation[],
  style: CitationStyle
): Slide {
  const formattedCitations = citations.map(citation =>
    formatCitation(citation, style)
  );

  return {
    type: 'references',
    content: {
      title: 'References',
      citations: formattedCitations,
    },
    speakerNotes: '',
  };
}
```

### 3. Research Integration

```typescript
// Generate presentations from deep research results

async function generateFromResearch(
  researchResult: ResearchResult
): Promise<Presentation> {
  // Extract synthesized content
  // Include source papers as citations
  // Generate appropriate visualizations for findings
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// __tests__/presentations/generator.test.ts

describe('Presentation Generator', () => {
  it('extracts key findings from document', async () => {
    const doc = createMockDocument({ content: '...' });
    const extraction = await extractContent(doc, mockModel);

    expect(extraction.keyFindings).toHaveLength(3);
    expect(extraction.keyFindings[0].confidence).toBeGreaterThan(0.8);
  });

  it('detects statistical patterns for visualization', async () => {
    const text = 'Treatment showed 23% improvement (p<0.001, n=450)';
    const opportunities = await detectVisualizations({ content: text });

    expect(opportunities).toContainEqual(
      expect.objectContaining({
        type: 'bar',
        extractedData: expect.arrayContaining([
          expect.objectContaining({ value: 23 })
        ])
      })
    );
  });
});
```

### Integration Tests

```typescript
// __tests__/presentations/export.test.ts

describe('PPTX Export', () => {
  it('exports presentation with correct slide count', async () => {
    const presentation = createMockPresentation({ slideCount: 10 });
    const blob = await exportToPptx(presentation, academicTheme, {});

    // Verify blob is valid PPTX
    const zip = await JSZip.loadAsync(blob);
    const slideCount = Object.keys(zip.files).filter(
      name => name.startsWith('ppt/slides/slide')
    ).length;

    expect(slideCount).toBe(10);
  });
});
```

---

## Performance Optimizations

1. **Lazy Loading:** Only render visible slides in navigator
2. **Memoization:** Memoize chart rendering to prevent re-renders
3. **Web Workers:** Generate presentations in background thread
4. **Streaming:** Stream slide generation for progressive display
5. **Caching:** Cache rendered slides for quick navigation

---

## Security Considerations

1. **Content Sanitization:** Sanitize all user content before rendering
2. **Export Validation:** Validate exported files before download
3. **Firebase Rules:** Presentations inherit document permissions
4. **API Rate Limiting:** Limit AI generation requests per user

---

## Accessibility

1. **Keyboard Navigation:** Full keyboard support for slide editing
2. **Screen Reader:** ARIA labels for all interactive elements
3. **High Contrast:** High contrast theme option
4. **Motion Reduction:** Respect reduced motion preferences

---

**Document History:**
- v1.0 (2026-01-04): Initial architecture complete
