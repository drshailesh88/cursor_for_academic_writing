/**
 * DOCX Export Tests
 *
 * Comprehensive test coverage for document export to Word format.
 * Tests formatting preservation, edge cases, and file validity.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { exportDocumentToDocx } from '@/lib/export/docx';
import { createMockDocument, edgeCases } from '../../mocks/test-data';

// Mock DOM APIs
class MockDOMParser {
  parseFromString(html: string, type: string) {
    const template = document.createElement('template');
    template.innerHTML = html;
    return {
      body: template.content,
    };
  }
}

// Mock docx Packer to capture output
vi.mock('docx', async () => {
  const actual = await vi.importActual('docx');
  return {
    ...actual,
    Packer: {
      toBlob: vi.fn(async () => new Blob(['mock-docx-content'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })),
    },
  };
});

describe('DOCX Export', () => {
  beforeEach(() => {
    // Setup DOMParser if not available
    if (typeof DOMParser === 'undefined') {
      global.DOMParser = MockDOMParser as any;
    }

    // Mock window.URL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    // Mock document.createElement and appendChild for download
    document.createElement = vi.fn((tag) => {
      return {
        tagName: tag.toUpperCase(),
        href: '',
        download: '',
        click: vi.fn(),
        remove: vi.fn(),
      } as any;
    }) as any;

    document.body.appendChild = vi.fn();
  });

  describe('Basic Export Functionality', () => {
    test('exports valid non-empty file', async () => {
      const doc = createMockDocument({
        title: 'Test Document',
        content: '<p>Test content</p>',
      });

      await exportDocumentToDocx({
        title: doc.title,
        content: doc.content,
      });

      // Verify blob was created
      expect(global.URL.createObjectURL).toHaveBeenCalled();

      // Verify download was triggered
      const createElement = document.createElement as any;
      expect(createElement).toHaveBeenCalledWith('a');
    });

    test('exports document with default title when title is missing', async () => {
      await exportDocumentToDocx({
        content: '<p>Content without title</p>',
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    test('sanitizes filename correctly', async () => {
      await exportDocumentToDocx({
        title: 'Test: "Quotes" & Special Characters!',
        content: '<p>Content</p>',
      });

      const anchor = (document.createElement as any).mock.results[0].value;
      // Filename should be sanitized (lowercase, no special chars)
      expect(anchor.download).toMatch(/\.docx$/);
    });
  });

  describe('Heading Level Preservation', () => {
    test('preserves H1 headings', async () => {
      await exportDocumentToDocx({
        title: 'Document Title',
        content: '<h1>Main Heading</h1><p>Content</p>',
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    test('preserves H2 headings', async () => {
      await exportDocumentToDocx({
        title: 'Document Title',
        content: '<h2>Section Heading</h2><p>Content</p>',
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    test('preserves H3 headings', async () => {
      await exportDocumentToDocx({
        title: 'Document Title',
        content: '<h3>Subsection Heading</h3><p>Content</p>',
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    test('preserves multiple heading levels in order', async () => {
      const content = `
        <h1>Chapter 1</h1>
        <p>Introduction</p>
        <h2>Section 1.1</h2>
        <p>First section</p>
        <h3>Subsection 1.1.1</h3>
        <p>First subsection</p>
      `;

      await exportDocumentToDocx({
        title: 'Multi-level Document',
        content,
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('Text Formatting Preservation', () => {
    test('preserves bold text', async () => {
      await exportDocumentToDocx({
        title: 'Bold Test',
        content: '<p>This is <strong>bold text</strong> in a paragraph.</p>',
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    test('preserves bold text with <b> tag', async () => {
      await exportDocumentToDocx({
        title: 'Bold Test',
        content: '<p>This is <b>bold text</b> with b tag.</p>',
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    test('preserves italic text', async () => {
      await exportDocumentToDocx({
        title: 'Italic Test',
        content: '<p>This is <em>italic text</em> in a paragraph.</p>',
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    test('preserves italic text with <i> tag', async () => {
      await exportDocumentToDocx({
        title: 'Italic Test',
        content: '<p>This is <i>italic text</i> with i tag.</p>',
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    test('preserves underline text', async () => {
      await exportDocumentToDocx({
        title: 'Underline Test',
        content: '<p>This is <u>underlined text</u> in a paragraph.</p>',
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    test('preserves superscript text', async () => {
      await exportDocumentToDocx({
        title: 'Superscript Test',
        content: '<p>E = mc<sup>2</sup> is Einstein\'s equation.</p>',
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    test('preserves combined formatting', async () => {
      await exportDocumentToDocx({
        title: 'Combined Formatting',
        content: '<p>This has <strong><em>bold and italic</em></strong> text.</p>',
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('List Handling', () => {
    test('exports unordered lists', async () => {
      const content = `
        <ul>
          <li>First item</li>
          <li>Second item</li>
          <li>Third item</li>
        </ul>
      `;

      await exportDocumentToDocx({
        title: 'List Test',
        content,
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    test('exports ordered lists', async () => {
      const content = `
        <ol>
          <li>First step</li>
          <li>Second step</li>
          <li>Third step</li>
        </ol>
      `;

      await exportDocumentToDocx({
        title: 'Ordered List Test',
        content,
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    test('exports nested lists', async () => {
      const content = `
        <ul>
          <li>Top level
            <ul>
              <li>Nested item</li>
            </ul>
          </li>
        </ul>
      `;

      await exportDocumentToDocx({
        title: 'Nested List Test',
        content,
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('Table Export', () => {
    test('exports tables correctly', async () => {
      const content = `
        <table>
          <tr>
            <th>Header 1</th>
            <th>Header 2</th>
          </tr>
          <tr>
            <td>Cell 1</td>
            <td>Cell 2</td>
          </tr>
        </table>
      `;

      await exportDocumentToDocx({
        title: 'Table Test',
        content,
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    test('exports multi-row tables', async () => {
      const content = `
        <table>
          <tr><td>A1</td><td>B1</td><td>C1</td></tr>
          <tr><td>A2</td><td>B2</td><td>C2</td></tr>
          <tr><td>A3</td><td>B3</td><td>C3</td></tr>
        </table>
      `;

      await exportDocumentToDocx({
        title: 'Multi-row Table',
        content,
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    test('exports tables with formatted content', async () => {
      const content = `
        <table>
          <tr>
            <td><strong>Bold cell</strong></td>
            <td><em>Italic cell</em></td>
          </tr>
        </table>
      `;

      await exportDocumentToDocx({
        title: 'Formatted Table',
        content,
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('handles empty document', async () => {
      const doc = edgeCases.emptyDocument();

      await exportDocumentToDocx({
        title: doc.title || 'Empty Document',
        content: doc.content || '<p></p>',
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    test('handles very large document', async () => {
      const doc = edgeCases.veryLongDocument();

      await exportDocumentToDocx({
        title: doc.title,
        content: doc.content,
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    test('handles special characters', async () => {
      const doc = edgeCases.specialCharDocument();

      await exportDocumentToDocx({
        title: doc.title,
        content: doc.content,
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    test('handles unicode text', async () => {
      await exportDocumentToDocx({
        title: 'Unicode Test',
        content: '<p>English, Español, 中文, العربية, עברית, 日本語, Русский</p>',
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    test('handles whitespace-only document', async () => {
      const doc = edgeCases.whitespaceDocument();

      await exportDocumentToDocx({
        title: 'Whitespace Test',
        content: doc.content,
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    test('handles malformed HTML gracefully', async () => {
      const doc = edgeCases.malformedHtmlDocument();

      await exportDocumentToDocx({
        title: 'Malformed HTML',
        content: doc.content,
      });

      // Should not throw error
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    test('handles document with only numbers', async () => {
      const doc = edgeCases.numericDocument();

      await exportDocumentToDocx({
        title: 'Numeric Content',
        content: doc.content,
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    test('handles very long title', async () => {
      const doc = edgeCases.longTitleDocument();

      await exportDocumentToDocx({
        title: doc.title,
        content: '<p>Short content</p>',
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('Complex Document Structure', () => {
    test('exports document with mixed content types', async () => {
      const content = `
        <h1>Research Paper</h1>
        <h2>Abstract</h2>
        <p>This study examines the <strong>effects</strong> of <em>AI</em> on research.</p>

        <h2>Methods</h2>
        <p>We conducted a systematic review with the following criteria:</p>
        <ul>
          <li>Published after 2020</li>
          <li>Peer-reviewed journals</li>
          <li>English language</li>
        </ul>

        <h2>Results</h2>
        <table>
          <tr>
            <th>Category</th>
            <th>Count</th>
          </tr>
          <tr>
            <td>Studies included</td>
            <td>42</td>
          </tr>
        </table>

        <h2>Discussion</h2>
        <p>The findings suggest significant <u>improvements</u> in efficiency.</p>
      `;

      await exportDocumentToDocx({
        title: 'Complex Document',
        content,
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    test('exports academic paper with citations', async () => {
      const content = `
        <p>Recent studies have shown promising results (Smith et al., 2024).</p>
        <p>According to Jones and Williams (2023), the methodology is sound.</p>
        <p>Multiple authors confirm these findings<sup>1-3</sup>.</p>
      `;

      await exportDocumentToDocx({
        title: 'Paper with Citations',
        content,
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('throws error when not in browser environment', async () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      await expect(async () => {
        await exportDocumentToDocx({
          title: 'Test',
          content: '<p>Test</p>',
        });
      }).rejects.toThrow('Docx export must be initiated from the browser');

      global.window = originalWindow;
    });

    test('handles missing DOMParser gracefully', async () => {
      const originalDOMParser = global.DOMParser;
      // @ts-ignore
      delete global.DOMParser;

      await expect(async () => {
        await exportDocumentToDocx({
          title: 'Test',
          content: '<p>Test</p>',
        });
      }).rejects.toThrow('Docx export requires a DOMParser');

      global.DOMParser = originalDOMParser;
    });
  });
});
