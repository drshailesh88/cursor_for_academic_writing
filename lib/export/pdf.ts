import { jsPDF } from 'jspdf';

type TextBlock = {
  text: string;
  style: 'heading1' | 'heading2' | 'heading3' | 'paragraph' | 'list' | 'table';
};

const PAGE_WIDTH = 595; // A4 width in points
const PAGE_HEIGHT = 842; // A4 height in points
const MARGIN = 40;

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

function getSpacing(style: TextBlock['style']) {
  switch (style) {
    case 'heading1':
      return 14;
    case 'heading2':
      return 12;
    case 'heading3':
      return 10;
    default:
      return 8;
  }
}

export function exportDocumentToPdf({
  title,
  content,
}: {
  title?: string;
  content: string;
}) {
  if (typeof window === 'undefined') {
    throw new Error('PDF export must run in the browser');
  }

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  doc.setFont('times', 'normal');

  let cursorY = 50;
  doc.setFontSize(18);
  doc.text(title || 'Academic Writing Document', MARGIN, cursorY);
  cursorY += 28;

  const blocks = parseHtmlToTextBlocks(content);

  blocks.forEach((block) => {
    const fontSize = getFontSize(block.style);
    doc.setFontSize(fontSize);
    doc.setFont('times', block.style.startsWith('heading') ? 'bold' : 'normal');

    const width = PAGE_WIDTH - MARGIN * 2;
    const lines: string[] = [];
    block.text.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      lines.push(...doc.splitTextToSize(trimmed, width));
    });

    lines.forEach((line) => {
      if (cursorY + fontSize + MARGIN > PAGE_HEIGHT) {
        doc.addPage();
        cursorY = MARGIN;
      }

      doc.text(line, MARGIN, cursorY);
      cursorY += fontSize + 2;
    });

    cursorY += getSpacing(block.style);
  });

  const fileName = `${sanitizeFileName(title)}.pdf`;
  doc.save(fileName);
}
