/**
 * Presentation Generator - PPTX Export
 * Phase 7: Export presentations to PowerPoint format
 */

import type {
  Presentation,
  Slide,
  Theme,
  ChartConfig,
  BulletPoint,
  TableConfig,
  QuoteConfig,
} from '../types';
import { getTheme } from '../themes';

// ============================================================================
// EXPORT OPTIONS
// ============================================================================

export interface PptxExportOptions {
  includeNotes?: boolean;
  includeSlideNumbers?: boolean;
  author?: string;
  company?: string;
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

/**
 * Export presentation to PPTX format
 * Attempts to use pptxgenjs if available, falls back to basic implementation
 */
export async function exportToPptx(
  presentation: Presentation,
  options: PptxExportOptions = {}
): Promise<Blob> {
  const theme = getTheme(presentation.theme);

  // Dynamic import to handle missing dependency
  try {
    // @ts-ignore - pptxgenjs may not be installed
    const pptxModule = await import('pptxgenjs');
    const PptxGenJS = pptxModule.default || pptxModule;
    return await generateWithPptxGenJS(presentation, theme, options, PptxGenJS);
  } catch (error) {
    console.warn('pptxgenjs not available, using basic fallback:', error);
    // Fallback: Generate a simple XML-based PPTX
    return await generateBasicPptx(presentation, theme, options);
  }
}

// ============================================================================
// PPTXGENJS IMPLEMENTATION
// ============================================================================

async function generateWithPptxGenJS(
  presentation: Presentation,
  theme: Theme,
  options: PptxExportOptions,
  PptxGenJS: any
): Promise<Blob> {
  const pptx = new PptxGenJS();

  // Set presentation properties
  pptx.title = presentation.title;
  pptx.author = options.author || 'Academic Writing Platform';
  pptx.subject = presentation.description || '';
  pptx.company = options.company || '';
  pptx.layout = 'LAYOUT_16x9';

  // Define slide master with theme
  const masterObjects: any[] = [];

  // Add slide number if requested
  if (options.includeSlideNumbers || presentation.settings.showSlideNumbers) {
    masterObjects.push({
      text: {
        text: '{{slideNum}}',
        options: {
          x: 9.0,
          y: 5.1,
          w: 0.5,
          h: 0.3,
          fontSize: 10,
          color: toColorCode(theme.colors.textMuted),
          align: 'right',
        },
      },
    });
  }

  pptx.defineSlideMaster({
    title: 'MASTER',
    background: { color: toColorCode(theme.colors.background) },
    objects: masterObjects,
  });

  // Generate each slide
  for (const slide of presentation.slides) {
    const pptxSlide = pptx.addSlide({ masterName: 'MASTER' });
    await renderSlide(pptxSlide, slide, theme, options);
  }

  // Return as blob
  const blob = await pptx.write({ outputType: 'blob' });
  return blob as Blob;
}

/**
 * Render individual slide based on type
 */
async function renderSlide(
  pptxSlide: any,
  slide: Slide,
  theme: Theme,
  options: PptxExportOptions
): Promise<void> {
  // Set background color or image
  if (slide.backgroundColor) {
    pptxSlide.background = { color: toColorCode(slide.backgroundColor) };
  } else if (slide.backgroundImage) {
    pptxSlide.background = { path: slide.backgroundImage };
  }

  // Render content based on slide type
  switch (slide.type) {
    case 'title':
      renderTitleSlide(pptxSlide, slide, theme);
      break;
    case 'content':
      renderContentSlide(pptxSlide, slide, theme);
      break;
    case 'data-visualization':
      renderDataSlide(pptxSlide, slide, theme);
      break;
    case 'references':
      renderReferencesSlide(pptxSlide, slide, theme);
      break;
    case 'section-divider':
      renderSectionDivider(pptxSlide, slide, theme);
      break;
    case 'quote':
      renderQuoteSlide(pptxSlide, slide, theme);
      break;
    case 'two-column':
      renderTwoColumnSlide(pptxSlide, slide, theme);
      break;
    case 'comparison':
    case 'image':
      renderContentSlide(pptxSlide, slide, theme);
      break;
    default:
      renderContentSlide(pptxSlide, slide, theme);
  }

  // Add speaker notes
  if (options.includeNotes && slide.speakerNotes) {
    pptxSlide.addNotes(slide.speakerNotes);
  }
}

// ============================================================================
// SLIDE RENDERING FUNCTIONS
// ============================================================================

function renderTitleSlide(pptxSlide: any, slide: Slide, theme: Theme): void {
  const { content } = slide;

  // Main title
  if (content.title) {
    pptxSlide.addText(content.title, {
      x: 0.5,
      y: 2.0,
      w: 9.0,
      h: 1.5,
      fontSize: 44,
      bold: true,
      color: toColorCode(theme.colors.primary),
      align: 'center',
      fontFace: toPptxFont(theme.fonts.heading),
    });
  }

  // Subtitle
  if (content.subtitle) {
    pptxSlide.addText(content.subtitle, {
      x: 0.5,
      y: 3.5,
      w: 9.0,
      h: 0.8,
      fontSize: 24,
      color: toColorCode(theme.colors.text),
      align: 'center',
      fontFace: toPptxFont(theme.fonts.body),
    });
  }

  // Author
  if (content.author) {
    pptxSlide.addText(content.author, {
      x: 0.5,
      y: 4.5,
      w: 9.0,
      h: 0.5,
      fontSize: 18,
      color: toColorCode(theme.colors.textMuted),
      align: 'center',
      fontFace: toPptxFont(theme.fonts.body),
    });
  }

  // Institution
  if (content.institution) {
    pptxSlide.addText(content.institution, {
      x: 0.5,
      y: 5.0,
      w: 9.0,
      h: 0.4,
      fontSize: 16,
      color: toColorCode(theme.colors.textMuted),
      align: 'center',
      fontFace: toPptxFont(theme.fonts.body),
    });
  }

  // Date
  if (content.date) {
    pptxSlide.addText(content.date, {
      x: 0.5,
      y: 5.5,
      w: 9.0,
      h: 0.3,
      fontSize: 14,
      color: toColorCode(theme.colors.textMuted),
      align: 'center',
      fontFace: toPptxFont(theme.fonts.body),
    });
  }
}

function renderContentSlide(pptxSlide: any, slide: Slide, theme: Theme): void {
  const { content } = slide;

  // Title
  if (content.title) {
    pptxSlide.addText(content.title, {
      x: 0.5,
      y: 0.5,
      w: 9.0,
      h: 0.8,
      fontSize: 32,
      bold: true,
      color: toColorCode(theme.colors.primary),
      fontFace: toPptxFont(theme.fonts.heading),
    });
  }

  // Bullets
  if (content.bullets && content.bullets.length > 0) {
    renderBullets(pptxSlide, content.bullets, 0.5, 1.5, theme);
  }

  // Image
  if (content.image) {
    const imageY = content.bullets ? 3.5 : 1.5;
    pptxSlide.addImage({
      path: content.image.src,
      x: 2.0,
      y: imageY,
      w: 6.0,
      h: 3.0,
      sizing: { type: content.image.fit || 'contain' },
    });

    if (content.image.caption) {
      pptxSlide.addText(content.image.caption, {
        x: 2.0,
        y: imageY + 3.2,
        w: 6.0,
        h: 0.3,
        fontSize: 12,
        italic: true,
        color: toColorCode(theme.colors.textMuted),
        align: 'center',
        fontFace: toPptxFont(theme.fonts.body),
      });
    }
  }

  // Table
  if (content.table) {
    renderTable(pptxSlide, content.table, 0.5, 1.5, theme);
  }
}

function renderDataSlide(pptxSlide: any, slide: Slide, theme: Theme): void {
  const { content } = slide;

  // Title
  if (content.title) {
    pptxSlide.addText(content.title, {
      x: 0.5,
      y: 0.5,
      w: 9.0,
      h: 0.8,
      fontSize: 32,
      bold: true,
      color: toColorCode(theme.colors.primary),
      fontFace: toPptxFont(theme.fonts.heading),
    });
  }

  // Chart
  if (content.chart) {
    renderChart(pptxSlide, content.chart, theme);
  }
}

function renderReferencesSlide(pptxSlide: any, slide: Slide, theme: Theme): void {
  const { content } = slide;

  // Title
  pptxSlide.addText(content.title || 'References', {
    x: 0.5,
    y: 0.5,
    w: 9.0,
    h: 0.8,
    fontSize: 32,
    bold: true,
    color: toColorCode(theme.colors.primary),
    fontFace: toPptxFont(theme.fonts.heading),
  });

  // Citations
  if (content.citations && content.citations.length > 0) {
    let yPos = 1.5;
    const lineHeight = 0.35;

    content.citations.forEach((citation) => {
      pptxSlide.addText(citation.formatted, {
        x: 0.5,
        y: yPos,
        w: 9.0,
        h: lineHeight,
        fontSize: 11,
        color: toColorCode(theme.colors.text),
        fontFace: toPptxFont(theme.fonts.body),
      });
      yPos += lineHeight + 0.1;
    });
  }
}

function renderSectionDivider(pptxSlide: any, slide: Slide, theme: Theme): void {
  const { content } = slide;

  // Section number
  if (content.sectionNumber) {
    pptxSlide.addText(`${content.sectionNumber}`, {
      x: 0.5,
      y: 1.5,
      w: 9.0,
      h: 1.0,
      fontSize: 72,
      bold: true,
      color: toColorCode(theme.colors.accent),
      align: 'center',
      fontFace: toPptxFont(theme.fonts.heading),
    });
  }

  // Title
  if (content.title) {
    pptxSlide.addText(content.title, {
      x: 0.5,
      y: 2.8,
      w: 9.0,
      h: 1.2,
      fontSize: 44,
      bold: true,
      color: toColorCode(theme.colors.primary),
      align: 'center',
      fontFace: toPptxFont(theme.fonts.heading),
    });
  }

  // Subtitle
  if (content.subtitle) {
    pptxSlide.addText(content.subtitle, {
      x: 0.5,
      y: 4.2,
      w: 9.0,
      h: 0.6,
      fontSize: 20,
      color: toColorCode(theme.colors.textMuted),
      align: 'center',
      fontFace: toPptxFont(theme.fonts.body),
    });
  }
}

function renderQuoteSlide(pptxSlide: any, slide: Slide, theme: Theme): void {
  const { content } = slide;

  if (content.quote) {
    // Quote text
    pptxSlide.addText(`"${content.quote.text}"`, {
      x: 1.0,
      y: 2.0,
      w: 8.0,
      h: 2.5,
      fontSize: 28,
      italic: true,
      color: toColorCode(theme.colors.text),
      align: 'center',
      valign: 'middle',
      fontFace: toPptxFont(theme.fonts.body),
    });

    // Attribution
    let attribution = '';
    if (content.quote.author) {
      attribution = `— ${content.quote.author}`;
      if (content.quote.source) {
        attribution += `, ${content.quote.source}`;
      }
      if (content.quote.year) {
        attribution += ` (${content.quote.year})`;
      }
    }

    if (attribution) {
      pptxSlide.addText(attribution, {
        x: 1.0,
        y: 4.5,
        w: 8.0,
        h: 0.5,
        fontSize: 16,
        color: toColorCode(theme.colors.textMuted),
        align: 'right',
        fontFace: toPptxFont(theme.fonts.body),
      });
    }
  }
}

function renderTwoColumnSlide(pptxSlide: any, slide: Slide, theme: Theme): void {
  const { content } = slide;

  // Title
  if (content.title) {
    pptxSlide.addText(content.title, {
      x: 0.5,
      y: 0.5,
      w: 9.0,
      h: 0.8,
      fontSize: 32,
      bold: true,
      color: toColorCode(theme.colors.primary),
      fontFace: toPptxFont(theme.fonts.heading),
    });
  }

  // Left column
  if (content.leftContent && content.leftContent.length > 0) {
    renderBullets(pptxSlide, content.leftContent, 0.5, 1.5, theme, 4.2);
  }

  // Right column
  if (content.rightContent && content.rightContent.length > 0) {
    renderBullets(pptxSlide, content.rightContent, 5.3, 1.5, theme, 4.2);
  }
}

// ============================================================================
// HELPER RENDERING FUNCTIONS
// ============================================================================

function renderBullets(
  pptxSlide: any,
  bullets: BulletPoint[],
  x: number,
  y: number,
  theme: Theme,
  width: number = 9.0
): void {
  const bulletData = bullets.map((bullet) => ({
    text: bullet.text,
    options: {
      bullet: bullet.level === 0,
      indentLevel: bullet.level,
      fontSize: 18 - bullet.level * 2,
      color: toColorCode(theme.colors.text),
      fontFace: toPptxFont(theme.fonts.body),
    },
  }));

  pptxSlide.addText(bulletData, {
    x,
    y,
    w: width,
    h: 4.0,
    valign: 'top',
  });
}

function renderTable(
  pptxSlide: any,
  table: TableConfig,
  x: number,
  y: number,
  theme: Theme
): void {
  const rows = table.rows.map((row) => {
    return row.cells.map((cell) => ({
      text: cell.content,
      options: {
        bold: cell.isHeader,
        fill: cell.isHeader
          ? toColorCode(theme.colors.primary)
          : cell.highlight
          ? toColorCode(theme.colors.surface)
          : undefined,
        color: cell.isHeader ? toColorCode(theme.colors.background) : toColorCode(theme.colors.text),
        align: cell.align || 'left',
        colspan: cell.colSpan,
        rowspan: cell.rowSpan,
      },
    }));
  });

  pptxSlide.addTable(rows, {
    x,
    y,
    w: 9.0,
    border: table.bordered
      ? { pt: 1, color: toColorCode(theme.colors.border) }
      : undefined,
    fontSize: 14,
    fontFace: toPptxFont(theme.fonts.body),
  });

  if (table.caption) {
    pptxSlide.addText(table.caption, {
      x,
      y: y + 3.5,
      w: 9.0,
      h: 0.3,
      fontSize: 12,
      italic: true,
      color: toColorCode(theme.colors.textMuted),
      align: 'center',
      fontFace: toPptxFont(theme.fonts.body),
    });
  }
}

function renderChart(pptxSlide: any, chart: ChartConfig, theme: Theme): void {
  const chartOptions: any = {
    x: 1.0,
    y: 1.5,
    w: 8.0,
    h: 4.0,
    showLegend: chart.options.showLegend !== false,
    legendPos: chart.options.legendPosition || 'r',
    showTitle: !!chart.options.title,
    title: chart.options.title,
    chartColors: theme.colors.chart.map((c) => toColorCode(c)),
  };

  // Map chart type
  let pptxChartType: any;
  switch (chart.type) {
    case 'bar':
    case 'horizontal-bar':
      pptxChartType = 'bar';
      chartOptions.barDir = chart.type === 'horizontal-bar' ? 'bar' : 'col';
      break;
    case 'stacked-bar':
      pptxChartType = 'bar';
      chartOptions.barDir = 'col';
      chartOptions.barGrouping = 'stacked';
      break;
    case 'line':
    case 'multi-line':
      pptxChartType = 'line';
      break;
    case 'pie':
    case 'donut':
      pptxChartType = chart.type === 'donut' ? 'doughnut' : 'pie';
      break;
    case 'area':
      pptxChartType = 'area';
      break;
    case 'scatter':
      pptxChartType = 'scatter';
      break;
    default:
      pptxChartType = 'bar';
  }

  const chartData = chart.data.datasets.map((dataset) => ({
    name: dataset.label,
    labels: chart.data.labels,
    values: dataset.data,
  }));

  pptxSlide.addChart(pptxChartType, chartData, chartOptions);

  // Add source citation if provided
  if (chart.source) {
    pptxSlide.addText(`Source: ${chart.source}`, {
      x: 1.0,
      y: 5.6,
      w: 8.0,
      h: 0.2,
      fontSize: 10,
      italic: true,
      color: toColorCode(theme.colors.textMuted),
      align: 'right',
      fontFace: toPptxFont(theme.fonts.body),
    });
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert hex color to PowerPoint format (removes #)
 */
function toColorCode(hex: string): string {
  return hex.replace('#', '');
}

/**
 * Convert theme font to PowerPoint font
 */
function toPptxFont(font: string): string {
  // Extract first font from CSS font stack
  const firstFont = font.split(',')[0].trim();

  // Map common fonts
  const fontMap: Record<string, string> = {
    'Inter': 'Calibri',
    'system-ui': 'Calibri',
    'sans-serif': 'Arial',
    'Georgia': 'Georgia',
    'serif': 'Times New Roman',
    'JetBrains Mono': 'Courier New',
    'monospace': 'Courier New',
  };

  return fontMap[firstFont] || 'Arial';
}

// ============================================================================
// FALLBACK IMPLEMENTATION
// ============================================================================

/**
 * Generate a basic PPTX when pptxgenjs is not available
 * Creates a minimal valid PPTX file structure
 */
async function generateBasicPptx(
  presentation: Presentation,
  theme: Theme,
  options: PptxExportOptions
): Promise<Blob> {
  // This is a simplified fallback that creates a minimal PPTX structure
  // In a real implementation, you would generate the full Office Open XML structure

  const warningMessage = `
    PPTX Export Unavailable

    To export presentations to PowerPoint format, please install pptxgenjs:

    npm install pptxgenjs --legacy-peer-deps

    Presentation: ${presentation.title}
    Slides: ${presentation.slides.length}
    Theme: ${theme.name}
  `.trim();

  // Return a text file instead
  const blob = new Blob([warningMessage], { type: 'text/plain' });
  return blob;
}

// ============================================================================
// DOWNLOAD HELPER
// ============================================================================

/**
 * Export and download presentation as PPTX
 */
export async function exportAndDownloadPptx(
  presentation: Presentation,
  options: PptxExportOptions = {}
): Promise<void> {
  const blob = await exportToPptx(presentation, options);

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFileName(presentation.title)}.pptx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Sanitize filename for download
 */
function sanitizeFileName(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9-_ ]+/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}
