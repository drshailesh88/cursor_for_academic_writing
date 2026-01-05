/**
 * Presentation Generator - PDF Export
 * Phase 7: Export presentations to PDF format
 */

// @ts-ignore - jspdf is available but types may not be loaded in this environment
import { jsPDF } from 'jspdf';
import type {
  Presentation,
  Slide,
  Theme,
  ChartConfig,
  BulletPoint,
  TableConfig,
} from '../types';
import { getTheme } from '../themes';

// ============================================================================
// EXPORT OPTIONS
// ============================================================================

export interface PdfExportOptions {
  includeNotes?: boolean;
  includeSlideNumbers?: boolean;
  notesOnSeparatePages?: boolean;
  pageSize?: 'letter' | 'a4';
  orientation?: 'landscape' | 'portrait';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SLIDE_ASPECT_RATIO = 16 / 9; // Standard presentation aspect ratio

// Page dimensions (landscape orientation)
const LETTER_WIDTH = 792; // 11 inches in points
const LETTER_HEIGHT = 612; // 8.5 inches in points
const A4_WIDTH = 842; // A4 width in points
const A4_HEIGHT = 595; // A4 height in points (landscape)

const MARGIN = 40;
const SLIDE_PADDING = 30;

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

/**
 * Export presentation to PDF format
 */
export async function exportToPdf(
  presentation: Presentation,
  options: PdfExportOptions = {}
): Promise<Blob> {
  if (typeof window === 'undefined') {
    throw new Error('PDF export must run in the browser');
  }

  const theme = getTheme(presentation.theme);
  const orientation = options.orientation || 'landscape';
  const pageSize = options.pageSize || 'letter';

  // Get page dimensions
  const { width, height } = getPageDimensions(pageSize, orientation);

  // Create PDF document
  const doc = new jsPDF({
    orientation,
    unit: 'pt',
    format: pageSize === 'a4' ? 'a4' : 'letter',
  });

  // Calculate slide dimensions (maintaining aspect ratio)
  const slideWidth = width - 2 * MARGIN;
  const slideHeight = orientation === 'landscape'
    ? slideWidth / SLIDE_ASPECT_RATIO
    : Math.min(slideWidth / SLIDE_ASPECT_RATIO, height - 2 * MARGIN);

  // Track if first page (to avoid adding page before first slide)
  let isFirstPage = true;

  // Render each slide
  for (let i = 0; i < presentation.slides.length; i++) {
    const slide = presentation.slides[i];

    if (!isFirstPage) {
      doc.addPage();
    }
    isFirstPage = false;

    // Render slide
    await renderSlideAsPdf(doc, slide, theme, {
      x: MARGIN,
      y: MARGIN,
      width: slideWidth,
      height: slideHeight,
      slideNumber: i + 1,
      totalSlides: presentation.slides.length,
      showSlideNumbers: options.includeSlideNumbers || presentation.settings.showSlideNumbers,
    });

    // Add speaker notes if requested
    if (options.includeNotes && slide.speakerNotes) {
      if (options.notesOnSeparatePages) {
        // Notes on separate page
        doc.addPage();
        renderNotesPage(doc, slide, i + 1, width, height);
      } else {
        // Notes below slide
        const notesY = MARGIN + slideHeight + 20;
        renderNotes(doc, slide.speakerNotes, MARGIN, notesY, slideWidth);
      }
    }
  }

  // Return as blob
  return doc.output('blob');
}

// ============================================================================
// SLIDE RENDERING
// ============================================================================

interface SlideRenderOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  slideNumber: number;
  totalSlides: number;
  showSlideNumbers: boolean;
}

async function renderSlideAsPdf(
  doc: jsPDF,
  slide: Slide,
  theme: Theme,
  options: SlideRenderOptions
): Promise<void> {
  const { x, y, width, height } = options;

  // Draw slide background
  doc.setFillColor(...hexToRgb(slide.backgroundColor || theme.colors.background));
  doc.rect(x, y, width, height, 'F');

  // Draw slide border
  doc.setDrawColor(...hexToRgb(theme.colors.border));
  doc.setLineWidth(1);
  doc.rect(x, y, width, height, 'S');

  // Calculate content area
  const contentX = x + SLIDE_PADDING;
  const contentY = y + SLIDE_PADDING;
  const contentWidth = width - 2 * SLIDE_PADDING;
  const contentHeight = height - 2 * SLIDE_PADDING;

  // Render content based on slide type
  switch (slide.type) {
    case 'title':
      renderTitleSlideContent(doc, slide, theme, contentX, contentY, contentWidth, contentHeight);
      break;
    case 'content':
      renderContentSlideContent(doc, slide, theme, contentX, contentY, contentWidth, contentHeight);
      break;
    case 'data-visualization':
      renderDataSlideContent(doc, slide, theme, contentX, contentY, contentWidth, contentHeight);
      break;
    case 'references':
      renderReferencesSlideContent(doc, slide, theme, contentX, contentY, contentWidth, contentHeight);
      break;
    case 'section-divider':
      renderSectionDividerContent(doc, slide, theme, contentX, contentY, contentWidth, contentHeight);
      break;
    case 'quote':
      renderQuoteSlideContent(doc, slide, theme, contentX, contentY, contentWidth, contentHeight);
      break;
    case 'two-column':
      renderTwoColumnSlideContent(doc, slide, theme, contentX, contentY, contentWidth, contentHeight);
      break;
    default:
      renderContentSlideContent(doc, slide, theme, contentX, contentY, contentWidth, contentHeight);
  }

  // Add slide number
  if (options.showSlideNumbers) {
    renderSlideNumber(doc, options.slideNumber, options.totalSlides, x, y, width, height, theme);
  }
}

// ============================================================================
// SLIDE TYPE RENDERERS
// ============================================================================

function renderTitleSlideContent(
  doc: jsPDF,
  slide: Slide,
  theme: Theme,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const { content } = slide;
  let currentY = y + height * 0.3;

  // Title
  if (content.title) {
    doc.setFontSize(36);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...hexToRgb(theme.colors.primary));
    const titleLines = doc.splitTextToSize(content.title, width);
    titleLines.forEach((line: string) => {
      doc.text(line, x + width / 2, currentY, { align: 'center' });
      currentY += 45;
    });
  }

  // Subtitle
  if (content.subtitle) {
    currentY += 10;
    doc.setFontSize(20);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...hexToRgb(theme.colors.text));
    const subtitleLines = doc.splitTextToSize(content.subtitle, width);
    subtitleLines.forEach((line: string) => {
      doc.text(line, x + width / 2, currentY, { align: 'center' });
      currentY += 25;
    });
  }

  // Author
  if (content.author) {
    currentY += 15;
    doc.setFontSize(16);
    doc.setTextColor(...hexToRgb(theme.colors.textMuted));
    doc.text(content.author, x + width / 2, currentY, { align: 'center' });
    currentY += 20;
  }

  // Institution
  if (content.institution) {
    doc.setFontSize(14);
    doc.text(content.institution, x + width / 2, currentY, { align: 'center' });
    currentY += 18;
  }

  // Date
  if (content.date) {
    doc.setFontSize(12);
    doc.text(content.date, x + width / 2, currentY, { align: 'center' });
  }
}

function renderContentSlideContent(
  doc: jsPDF,
  slide: Slide,
  theme: Theme,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const { content } = slide;
  let currentY = y;

  // Title
  if (content.title) {
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...hexToRgb(theme.colors.primary));
    const titleLines = doc.splitTextToSize(content.title, width);
    titleLines.forEach((line: string) => {
      doc.text(line, x, currentY);
      currentY += 30;
    });
    currentY += 10;
  }

  // Bullets
  if (content.bullets && content.bullets.length > 0) {
    renderBulletsPdf(doc, content.bullets, x, currentY, width, theme);
  }

  // Table
  if (content.table) {
    renderTablePdf(doc, content.table, x, currentY, width, theme);
  }
}

function renderDataSlideContent(
  doc: jsPDF,
  slide: Slide,
  theme: Theme,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const { content } = slide;
  let currentY = y;

  // Title
  if (content.title) {
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...hexToRgb(theme.colors.primary));
    doc.text(content.title, x, currentY);
    currentY += 40;
  }

  // Chart placeholder (actual chart rendering would require additional libraries)
  if (content.chart) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...hexToRgb(theme.colors.textMuted));
    doc.text('[Chart: ' + (content.chart.options.title || 'Data Visualization') + ']', x, currentY);
    currentY += 20;

    // Show chart data as text
    if (content.chart.data.labels && content.chart.data.datasets) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      content.chart.data.datasets.forEach((dataset, i) => {
        doc.text(`${dataset.label}:`, x, currentY);
        currentY += 15;
        content.chart!.data.labels.forEach((label, j) => {
          doc.text(`  ${label}: ${dataset.data[j]}`, x + 20, currentY);
          currentY += 12;
        });
        currentY += 8;
      });
    }

    // Source citation
    if (content.chart.source) {
      currentY += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...hexToRgb(theme.colors.textMuted));
      doc.text(`Source: ${content.chart.source}`, x, currentY);
    }
  }
}

function renderReferencesSlideContent(
  doc: jsPDF,
  slide: Slide,
  theme: Theme,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const { content } = slide;
  let currentY = y;

  // Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb(theme.colors.primary));
  doc.text(content.title || 'References', x, currentY);
  currentY += 40;

  // Citations
  if (content.citations && content.citations.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...hexToRgb(theme.colors.text));

    content.citations.forEach((citation) => {
      const citationLines = doc.splitTextToSize(citation.formatted, width - 20);
      citationLines.forEach((line: string, i: number) => {
        doc.text(line, i === 0 ? x : x + 15, currentY);
        currentY += 12;
      });
      currentY += 6;
    });
  }
}

function renderSectionDividerContent(
  doc: jsPDF,
  slide: Slide,
  theme: Theme,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const { content } = slide;
  const centerY = y + height / 2;

  // Section number
  if (content.sectionNumber) {
    doc.setFontSize(60);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...hexToRgb(theme.colors.accent));
    doc.text(`${content.sectionNumber}`, x + width / 2, centerY - 40, { align: 'center' });
  }

  // Title
  if (content.title) {
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...hexToRgb(theme.colors.primary));
    doc.text(content.title, x + width / 2, centerY + 20, { align: 'center' });
  }

  // Subtitle
  if (content.subtitle) {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...hexToRgb(theme.colors.textMuted));
    doc.text(content.subtitle, x + width / 2, centerY + 50, { align: 'center' });
  }
}

function renderQuoteSlideContent(
  doc: jsPDF,
  slide: Slide,
  theme: Theme,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const { content } = slide;
  if (!content.quote) return;

  const centerY = y + height / 2;

  // Quote text
  doc.setFontSize(20);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...hexToRgb(theme.colors.text));
  const quoteText = `"${content.quote.text}"`;
  const quoteLines = doc.splitTextToSize(quoteText, width * 0.8);
  let currentY = centerY - (quoteLines.length * 25) / 2;

  quoteLines.forEach((line: string) => {
    doc.text(line, x + width / 2, currentY, { align: 'center' });
    currentY += 25;
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
    currentY += 20;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...hexToRgb(theme.colors.textMuted));
    doc.text(attribution, x + width * 0.9, currentY, { align: 'right' });
  }
}

function renderTwoColumnSlideContent(
  doc: jsPDF,
  slide: Slide,
  theme: Theme,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const { content } = slide;
  let currentY = y;

  // Title
  if (content.title) {
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...hexToRgb(theme.colors.primary));
    doc.text(content.title, x, currentY);
    currentY += 40;
  }

  const columnWidth = (width - 30) / 2;

  // Left column
  if (content.leftContent && content.leftContent.length > 0) {
    renderBulletsPdf(doc, content.leftContent, x, currentY, columnWidth, theme);
  }

  // Right column
  if (content.rightContent && content.rightContent.length > 0) {
    renderBulletsPdf(doc, content.rightContent, x + columnWidth + 30, currentY, columnWidth, theme);
  }
}

// ============================================================================
// HELPER RENDERING FUNCTIONS
// ============================================================================

function renderBulletsPdf(
  doc: jsPDF,
  bullets: BulletPoint[],
  x: number,
  y: number,
  width: number,
  theme: Theme
): void {
  let currentY = y;

  bullets.forEach((bullet) => {
    const indent = bullet.level * 20;
    const bulletX = x + indent;
    const bulletWidth = width - indent;

    doc.setFontSize(16 - bullet.level * 2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...hexToRgb(theme.colors.text));

    // Bullet point
    if (bullet.level === 0) {
      doc.text('•', bulletX, currentY);
    } else {
      doc.text('◦', bulletX, currentY);
    }

    // Text
    const bulletLines = doc.splitTextToSize(bullet.text, bulletWidth - 20);
    bulletLines.forEach((line: string, i: number) => {
      doc.text(line, bulletX + 15, currentY);
      if (i < bulletLines.length - 1) {
        currentY += 18 - bullet.level * 2;
      }
    });

    currentY += 20 - bullet.level * 2;
  });
}

function renderTablePdf(
  doc: jsPDF,
  table: TableConfig,
  x: number,
  y: number,
  width: number,
  theme: Theme
): void {
  let currentY = y;

  table.rows.forEach((row) => {
    const cellWidth = width / row.cells.length;
    let cellX = x;

    row.cells.forEach((cell) => {
      // Background for headers
      if (cell.isHeader) {
        doc.setFillColor(...hexToRgb(theme.colors.primary));
        doc.rect(cellX, currentY - 12, cellWidth, 18, 'F');
      }

      // Text
      doc.setFontSize(12);
      doc.setFont('helvetica', cell.isHeader ? 'bold' : 'normal');
      doc.setTextColor(
        ...(cell.isHeader
          ? hexToRgb(theme.colors.background)
          : hexToRgb(theme.colors.text))
      );

      const textAlign = cell.align === 'center' ? 'center' : cell.align === 'right' ? 'right' : 'left';
      const textX = textAlign === 'center'
        ? cellX + cellWidth / 2
        : textAlign === 'right'
        ? cellX + cellWidth - 5
        : cellX + 5;

      doc.text(cell.content, textX, currentY, { align: textAlign });

      // Border
      if (table.bordered) {
        doc.setDrawColor(...hexToRgb(theme.colors.border));
        doc.setLineWidth(0.5);
        doc.rect(cellX, currentY - 12, cellWidth, 18, 'S');
      }

      cellX += cellWidth * (cell.colSpan || 1);
    });

    currentY += 20;
  });

  // Caption
  if (table.caption) {
    currentY += 5;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...hexToRgb(theme.colors.textMuted));
    doc.text(table.caption, x + width / 2, currentY, { align: 'center' });
  }
}

function renderSlideNumber(
  doc: jsPDF,
  slideNumber: number,
  totalSlides: number,
  x: number,
  y: number,
  width: number,
  height: number,
  theme: Theme
): void {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...hexToRgb(theme.colors.textMuted));
  doc.text(`${slideNumber}`, x + width - 10, y + height - 10, { align: 'right' });
}

function renderNotes(
  doc: jsPDF,
  notes: string,
  x: number,
  y: number,
  width: number
): void {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);

  const notesLines = doc.splitTextToSize(`Speaker Notes: ${notes}`, width);
  let currentY = y;

  notesLines.forEach((line: string) => {
    doc.text(line, x, currentY);
    currentY += 12;
  });
}

function renderNotesPage(
  doc: jsPDF,
  slide: Slide,
  slideNumber: number,
  width: number,
  height: number
): void {
  const margin = 50;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(`Slide ${slideNumber} - Speaker Notes`, margin, margin);

  let currentY = margin + 30;

  if (slide.content.title) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(slide.content.title, margin, currentY);
    currentY += 25;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const notesLines = doc.splitTextToSize(slide.speakerNotes, width - 2 * margin);

  notesLines.forEach((line: string) => {
    doc.text(line, margin, currentY);
    currentY += 15;
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getPageDimensions(
  pageSize: 'letter' | 'a4',
  orientation: 'landscape' | 'portrait'
): { width: number; height: number } {
  if (pageSize === 'a4') {
    return orientation === 'landscape'
      ? { width: A4_WIDTH, height: A4_HEIGHT }
      : { width: A4_HEIGHT, height: A4_WIDTH };
  } else {
    return orientation === 'landscape'
      ? { width: LETTER_WIDTH, height: LETTER_HEIGHT }
      : { width: LETTER_HEIGHT, height: LETTER_WIDTH };
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

function sanitizeFileName(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9-_ ]+/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

// ============================================================================
// DOWNLOAD HELPER
// ============================================================================

/**
 * Export and download presentation as PDF
 */
export async function exportAndDownloadPdf(
  presentation: Presentation,
  options: PdfExportOptions = {}
): Promise<void> {
  const blob = await exportToPdf(presentation, options);

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFileName(presentation.title)}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
