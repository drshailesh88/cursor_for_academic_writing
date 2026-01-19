import { jsPDF } from 'jspdf';

type TextBlock = {
  text: string;
  style: 'heading1' | 'heading2' | 'heading3' | 'paragraph' | 'list' | 'table';
};

type HeadingInfo = {
  text: string;
  level: number;
  page: number;
};

export interface PdfExportOptions {
  title?: string;
  content: string;
  author?: string;
  includeLineNumbers?: boolean;
  doubleSpacing?: boolean;
  watermark?: string | null;
  includeTableOfContents?: boolean;
}

const PAGE_WIDTH = 595; // A4 width in points
const PAGE_HEIGHT = 842; // A4 height in points
const MARGIN = 72; // 1 inch academic margins
const HEADER_HEIGHT = 30;
const FOOTER_HEIGHT = 30;
const LINE_NUMBER_WIDTH = 30;

function sanitizeFileName(title?: string) {
  const safeTitle = (title || 'academic-document').trim() || 'academic-document';
  return safeTitle.replace(/[^a-zA-Z0-9-_ ]+/g, '').replace(/\s+/g, '-').toLowerCase();
}

function extractText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? '';
  }

  if (!(node instanceof Element)) {
    return '';
  }

  return Array.from(node.childNodes)
    .map(extractText)
    .join(' ')
    .replace(/\s+/g, ' ');
}

function parseHtmlToTextBlocks(content: string): TextBlock[] {
  if (typeof DOMParser === 'undefined') {
    throw new Error('PDF export requires a DOMParser');
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(content, 'text/html');
  const blocks: TextBlock[] = [];

  document.body.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        blocks.push({
          text,
          style: 'paragraph',
        });
      }
      return;
    }

    if (!(node instanceof Element)) {
      return;
    }

    const tag = node.tagName.toLowerCase();

    if (tag === 'h1') {
      blocks.push({ text: extractText(node), style: 'heading1' });
    } else if (tag === 'h2') {
      blocks.push({ text: extractText(node), style: 'heading2' });
    } else if (tag === 'h3') {
      blocks.push({ text: extractText(node), style: 'heading3' });
    } else if (tag === 'p' || tag === 'div') {
      const text = extractText(node).trim();
      if (text) {
        blocks.push({ text, style: 'paragraph' });
      }
    } else if (tag === 'ul' || tag === 'ol') {
      Array.from(node.querySelectorAll('li')).forEach((li) => {
        const text = extractText(li).trim();
        if (text) {
          blocks.push({
            text: `• ${text}`,
            style: 'list',
          });
        }
      });
    } else if (tag === 'table') {
      const rows: string[] = [];
      Array.from(node.querySelectorAll('tr')).forEach((row) => {
        const cells = Array.from(row.children)
          .map((cell) => extractText(cell))
          .map((cellText) => cellText.trim())
          .filter(Boolean);
        if (cells.length) {
          rows.push(cells.join(' | '));
        }
      });

      if (rows.length) {
        blocks.push({
          text: rows.join('\n'),
          style: 'table',
        });
      }
    } else {
      const text = extractText(node).trim();
      if (text) {
        blocks.push({ text, style: 'paragraph' });
      }
    }
  });

  return blocks;
}

function getFontSize(style: TextBlock['style']) {
  switch (style) {
    case 'heading1':
      return 18;
    case 'heading2':
      return 16;
    case 'heading3':
      return 14;
    case 'list':
      return 11;
    case 'table':
      return 10;
    default:
      return 12;
  }
}

function getSpacing(style: TextBlock['style'], doubleSpacing: boolean = false) {
  const baseSpacing = doubleSpacing ? 12 : 8;
  switch (style) {
    case 'heading1':
      return doubleSpacing ? 20 : 14;
    case 'heading2':
      return doubleSpacing ? 18 : 12;
    case 'heading3':
      return doubleSpacing ? 16 : 10;
    default:
      return baseSpacing;
  }
}

function addHeader(
  doc: jsPDF,
  author: string | undefined,
  title: string | undefined,
  pageNumber: number
) {
  if (pageNumber === 1) return; // Skip header on first page

  const fontSize = 10;
  doc.setFontSize(fontSize);
  doc.setFont('times', 'normal');

  // Author on left
  if (author) {
    doc.text(author, MARGIN, 40);
  }

  // Title on right
  if (title) {
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, PAGE_WIDTH - MARGIN - titleWidth, 40);
  }

  // Line below header
  doc.setLineWidth(0.5);
  doc.line(MARGIN, 45, PAGE_WIDTH - MARGIN, 45);
}

function addFooter(doc: jsPDF, pageNumber: number, totalPages: number) {
  const fontSize = 10;
  doc.setFontSize(fontSize);
  doc.setFont('times', 'normal');

  const footerText = `Page ${pageNumber} of ${totalPages}`;
  const textWidth = doc.getTextWidth(footerText);
  const centerX = PAGE_WIDTH / 2 - textWidth / 2;

  doc.text(footerText, centerX, PAGE_HEIGHT - 40);
}

function addWatermark(doc: jsPDF, watermarkText: string) {
  doc.saveGraphicsState();
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(60);
  doc.setFont('times', 'bold');

  const textWidth = doc.getTextWidth(watermarkText);
  const centerX = PAGE_WIDTH / 2;
  const centerY = PAGE_HEIGHT / 2;

  // Rotate and position watermark diagonally
  doc.text(watermarkText, centerX, centerY, {
    angle: 45,
    align: 'center',
  });

  doc.restoreGraphicsState();
}

function addLineNumber(
  doc: jsPDF,
  lineNumber: number,
  yPosition: number,
  includeLineNumbers: boolean
) {
  if (!includeLineNumbers || lineNumber % 5 !== 0) return;

  doc.saveGraphicsState();
  doc.setFontSize(8);
  doc.setFont('times', 'normal');
  doc.setTextColor(128, 128, 128);

  const lineNumText = lineNumber.toString();
  doc.text(lineNumText, MARGIN - LINE_NUMBER_WIDTH + 10, yPosition);

  doc.restoreGraphicsState();
}

function generateTableOfContents(headings: HeadingInfo[]): TextBlock[] {
  if (headings.length === 0) return [];

  const tocBlocks: TextBlock[] = [];

  // Add TOC title
  tocBlocks.push({
    text: 'Table of Contents',
    style: 'heading1',
  });

  // Add each heading with indentation based on level
  headings.forEach((heading) => {
    const indent = '  '.repeat(heading.level - 1);
    const dots = '.'.repeat(Math.max(1, 60 - heading.text.length - indent.length));
    const tocLine = `${indent}${heading.text} ${dots} ${heading.page}`;

    tocBlocks.push({
      text: tocLine,
      style: 'paragraph',
    });
  });

  // Add spacing after TOC
  tocBlocks.push({
    text: '',
    style: 'paragraph',
  });

  return tocBlocks;
}

export function exportDocumentToPdf(options: PdfExportOptions) {
  const {
    title,
    content,
    author,
    includeLineNumbers = false,
    doubleSpacing = false,
    watermark = null,
    includeTableOfContents = true,
  } = options;

  if (typeof window === 'undefined') {
    throw new Error('PDF export must run in the browser');
  }

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  doc.setFont('times', 'normal');

  // First pass: parse content and collect headings
  const contentBlocks = parseHtmlToTextBlocks(content);
  const headings: HeadingInfo[] = [];

  // Calculate effective margin (add line number space if needed)
  const effectiveLeftMargin = includeLineNumbers ? MARGIN + LINE_NUMBER_WIDTH : MARGIN;
  const contentWidth = PAGE_WIDTH - effectiveLeftMargin - MARGIN;

  // Track pages for TOC generation - we'll do a dry run first
  let currentPage = 1;
  let cursorY = MARGIN + HEADER_HEIGHT;
  let lineCounter = 1;

  // Add document title on first page
  doc.setFontSize(18);
  doc.setFont('times', 'bold');
  doc.text(title || 'Academic Writing Document', effectiveLeftMargin, cursorY);
  cursorY += 28;
  lineCounter++;

  // If author is provided, add it below title
  if (author) {
    doc.setFontSize(14);
    doc.setFont('times', 'normal');
    doc.text(`By ${author}`, effectiveLeftMargin, cursorY);
    cursorY += 20;
    lineCounter++;
  }

  cursorY += 20; // Extra spacing after title block

  // Collect headings for TOC
  contentBlocks.forEach((block) => {
    if (block.style === 'heading1' || block.style === 'heading2' || block.style === 'heading3') {
      const level = parseInt(block.style.replace('heading', ''));
      headings.push({
        text: block.text,
        level,
        page: currentPage,
      });
    }

    const fontSize = getFontSize(block.style);
    const lines: string[] = [];
    block.text.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      lines.push(...doc.splitTextToSize(trimmed, contentWidth));
    });

    const lineHeight = doubleSpacing ? fontSize * 2 : fontSize + 2;

    lines.forEach(() => {
      if (cursorY + lineHeight + FOOTER_HEIGHT > PAGE_HEIGHT - MARGIN) {
        currentPage++;
        cursorY = MARGIN + HEADER_HEIGHT;
        lineCounter = 1;
      }
      cursorY += lineHeight;
      lineCounter++;
    });

    cursorY += getSpacing(block.style, doubleSpacing);
  });

  const totalPages = currentPage;

  // Reset for actual rendering
  doc.deletePage(1);
  doc.addPage();
  currentPage = 1;
  cursorY = MARGIN + HEADER_HEIGHT;
  lineCounter = 1;

  // Add watermark to first page if specified
  if (watermark) {
    addWatermark(doc, watermark);
  }

  // Render document title
  doc.setFontSize(18);
  doc.setFont('times', 'bold');
  doc.text(title || 'Academic Writing Document', effectiveLeftMargin, cursorY);
  cursorY += 28;
  lineCounter++;

  if (author) {
    doc.setFontSize(14);
    doc.setFont('times', 'normal');
    doc.text(`By ${author}`, effectiveLeftMargin, cursorY);
    cursorY += 20;
    lineCounter++;
  }

  cursorY += 20;

  // Generate and render TOC if requested and headings exist
  if (includeTableOfContents && headings.length > 0) {
    const tocBlocks = generateTableOfContents(headings);

    tocBlocks.forEach((block) => {
      const fontSize = getFontSize(block.style);
      doc.setFontSize(fontSize);
      doc.setFont('times', block.style.startsWith('heading') ? 'bold' : 'normal');

      const lines: string[] = [];
      if (block.text) {
        block.text.split('\n').forEach((line) => {
          const trimmed = line.trim();
          if (!trimmed) {
            lines.push('');
            return;
          }
          lines.push(...doc.splitTextToSize(trimmed, contentWidth));
        });
      }

      const lineHeight = doubleSpacing ? fontSize * 2 : fontSize + 2;

      lines.forEach((line) => {
        if (cursorY + lineHeight + FOOTER_HEIGHT > PAGE_HEIGHT - MARGIN) {
          addFooter(doc, currentPage, totalPages);
          doc.addPage();
          currentPage++;
          cursorY = MARGIN + HEADER_HEIGHT;
          lineCounter = 1;
          addHeader(doc, author, title, currentPage);
          if (watermark) {
            addWatermark(doc, watermark);
          }
        }

        if (line) {
          addLineNumber(doc, lineCounter, cursorY, includeLineNumbers);
          doc.text(line, effectiveLeftMargin, cursorY);
        }
        cursorY += lineHeight;
        lineCounter++;
      });

      cursorY += getSpacing(block.style, doubleSpacing);
    });

    // Page break after TOC
    addFooter(doc, currentPage, totalPages);
    doc.addPage();
    currentPage++;
    cursorY = MARGIN + HEADER_HEIGHT;
    lineCounter = 1;
    addHeader(doc, author, title, currentPage);
    if (watermark) {
      addWatermark(doc, watermark);
    }
  }

  // Render content blocks
  contentBlocks.forEach((block) => {
    const fontSize = getFontSize(block.style);
    doc.setFontSize(fontSize);
    doc.setFont('times', block.style.startsWith('heading') ? 'bold' : 'normal');

    const lines: string[] = [];
    block.text.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        lines.push('');
        return;
      }
      lines.push(...doc.splitTextToSize(trimmed, contentWidth));
    });

    const lineHeight = doubleSpacing ? fontSize * 2 : fontSize + 2;

    lines.forEach((line) => {
      if (cursorY + lineHeight + FOOTER_HEIGHT > PAGE_HEIGHT - MARGIN) {
        addFooter(doc, currentPage, totalPages);
        doc.addPage();
        currentPage++;
        cursorY = MARGIN + HEADER_HEIGHT;
        lineCounter = 1;
        addHeader(doc, author, title, currentPage);
        if (watermark) {
          addWatermark(doc, watermark);
        }
      }

      if (line) {
        addLineNumber(doc, lineCounter, cursorY, includeLineNumbers);
        doc.text(line, effectiveLeftMargin, cursorY);
      }
      cursorY += lineHeight;
      lineCounter++;
    });

    cursorY += getSpacing(block.style, doubleSpacing);
  });

  // Add footer to last page
  addFooter(doc, currentPage, totalPages);

  const fileName = `${sanitizeFileName(title)}.pdf`;
  doc.save(fileName);
}

// Legacy function for backward compatibility
export function exportDocumentToPdfLegacy({
  title,
  content,
}: {
  title?: string;
  content: string;
}) {
  exportDocumentToPdf({ title, content });
}
