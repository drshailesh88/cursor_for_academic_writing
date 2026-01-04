/**
 * Mock for pptxgenjs library
 * Used in tests to avoid requiring the actual pptxgenjs package
 */
import { vi } from 'vitest';

// Shared mock slide instance that tests can access
export const mockPptxSlide = {
  addText: vi.fn(),
  addImage: vi.fn(),
  addTable: vi.fn(),
  addChart: vi.fn(),
  addNotes: vi.fn(),
  background: undefined as any,
};

// Shared mock instance that tests can access for assertions
export const mockPptxInstance = {
  title: '',
  author: '',
  subject: '',
  company: '',
  layout: '',
  defineSlideMaster: vi.fn(),
  addSlide: vi.fn(() => mockPptxSlide),
  write: vi.fn(async () => new Blob(['mock-pptx-content'], {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  })),
};

// Main mock class that uses the shared instance properties
export class MockPptxGenJS {
  get title() { return mockPptxInstance.title; }
  set title(value: string) { mockPptxInstance.title = value; }

  get author() { return mockPptxInstance.author; }
  set author(value: string) { mockPptxInstance.author = value; }

  get subject() { return mockPptxInstance.subject; }
  set subject(value: string) { mockPptxInstance.subject = value; }

  get company() { return mockPptxInstance.company; }
  set company(value: string) { mockPptxInstance.company = value; }

  get layout() { return mockPptxInstance.layout; }
  set layout(value: string) { mockPptxInstance.layout = value; }

  defineSlideMaster = mockPptxInstance.defineSlideMaster;
  addSlide = mockPptxInstance.addSlide;
  write = mockPptxInstance.write;
}

// Default export - must be the class itself
export default MockPptxGenJS;
