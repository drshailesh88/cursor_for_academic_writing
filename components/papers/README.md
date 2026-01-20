# Papers State Management and Integration

This directory contains the complete papers feature implementation with state management, API integration, and UI components.

## Architecture

### Core Hook: `lib/hooks/use-papers.ts`
The main hook that manages all paper-related state and operations:

- **Paper Library**: Upload, fetch, select, and delete papers
- **Upload**: File upload with progress tracking
- **Chat**: Multi-paper conversations with streaming responses
- **Extraction**: AI-powered content extraction (findings, methods, limitations, citations)

### Context Provider: `lib/contexts/papers-context.tsx`
React Context wrapper that makes the `usePapers` hook available throughout your component tree.

### Integrated Panel: `components/papers/integrated-papers-panel.tsx`
Complete UI component that combines:
- Paper library with search and filtering
- Paper upload with drag & drop
- Paper viewer with sections
- Content extraction
- Multi-paper chat

## Usage

### Basic Setup

```tsx
import { PapersProvider } from '@/lib/contexts/papers-context';
import { IntegratedPapersPanel } from '@/components/papers/integrated-papers-panel';
import { useAuth } from '@/lib/supabase/auth';

function MyApp() {
  const { user } = useAuth();

  if (!user) return <div>Please sign in</div>;

  return (
    <PapersProvider userId={user.uid}>
      <IntegratedPapersPanel
        userId={user.uid}
        onInsertToDocument={(content, citation) => {
          // Handle inserting content into your editor
          console.log('Insert:', content);
          if (citation) {
            console.log('Citation:', citation);
          }
        }}
      />
    </PapersProvider>
  );
}
```

### Using the Hook Directly

```tsx
import { usePapersContext } from '@/lib/contexts/papers-context';

function MyComponent() {
  const {
    papers,
    selectedPaper,
    uploadPaper,
    selectPaper,
    sendChatMessage,
    extractContent,
  } = usePapersContext();

  const handleUpload = async (file: File) => {
    try {
      const paperId = await uploadPaper(file);
      console.log('Uploaded paper:', paperId);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleExtract = async () => {
    if (!selectedPaper) return;

    try {
      const findings = await extractContent('findings');
      console.log('Extracted findings:', findings);
    } catch (error) {
      console.error('Extraction failed:', error);
    }
  };

  return (
    <div>
      {/* Your UI */}
    </div>
  );
}
```

### Standalone Hook (without Context)

```tsx
import { usePapers } from '@/lib/hooks/use-papers';
import { useAuth } from '@/lib/supabase/auth';

function MyComponent() {
  const { user } = useAuth();
  const {
    papers,
    uploadPaper,
    selectPaper,
    sendChatMessage,
  } = usePapers({
    userId: user?.uid,
    autoRefresh: true,
    refreshInterval: 3000,
  });

  // Use the hook methods directly
}
```

## API Routes

The components integrate with these API endpoints:

- `POST /api/papers/upload` - Upload PDF files
- `GET /api/papers?userId={userId}` - List user's papers
- `GET /api/papers/{paperId}?content=true` - Get paper with content
- `DELETE /api/papers/{paperId}` - Delete a paper
- `POST /api/papers/chat` - Chat with papers (streaming)
- `POST /api/papers/extract` - Extract specific content

## Features

### 1. Paper Upload
- Drag & drop PDF files
- Progress tracking
- File validation (PDF only, 100MB max)
- Automatic processing in background

### 2. Paper Library
- Grid/list view modes
- Search by title or author
- Status indicators (ready, processing)
- Favorite papers

### 3. Paper Viewer
- Section-by-section navigation
- Copy sections to clipboard
- Extraction buttons for key content
- Metadata display

### 4. Multi-Paper Chat
- RAG-powered conversations
- Streaming responses
- Citation tracking
- Add/remove papers dynamically
- Suggested questions

### 5. Content Extraction
- Key findings
- Methodology
- Limitations
- Formatted citations
- One-click insert to document

## State Management

The `usePapers` hook manages:

```typescript
{
  // Paper library
  papers: Paper[]
  selectedPaper: Paper | null
  selectedPaperContent: PaperContent | null
  isLoading: boolean
  error: string | null

  // Upload
  isUploading: boolean
  uploadProgress: number
  uploadPaper: (file: File) => Promise<string>

  // Library operations
  refreshLibrary: () => Promise<void>
  selectPaper: (paperId: string) => Promise<void>
  deletePaper: (paperId: string) => Promise<void>

  // Chat
  chatMessages: Message[]
  isChatting: boolean
  activeChatPaperIds: string[]
  sendChatMessage: (question: string, model?: string) => Promise<void>
  clearChat: () => void
  setChatPapers: (paperIds: string[]) => void

  // Extraction
  isExtracting: boolean
  extractionResults: Array<{ type: string; content: string }>
  extractContent: (type, paperId?) => Promise<string>
  clearExtractions: () => void
}
```

## Auto-Refresh

Papers in processing status are automatically polled every 3 seconds (configurable) until they're ready. This ensures the UI updates when background processing completes.

## Error Handling

All operations include proper error handling with user-friendly error messages. Errors are stored in the `error` state and can be displayed in your UI.

## TypeScript Support

All components and hooks are fully typed with TypeScript for excellent IDE support and type safety.

## Example Integration with TipTap Editor

```tsx
import { Editor } from '@tiptap/react';
import { PapersProvider } from '@/lib/contexts/papers-context';
import { IntegratedPapersPanel } from '@/components/papers/integrated-papers-panel';

function DocumentEditor({ editor }: { editor: Editor }) {
  const handleInsertContent = (content: string, citation?: Citation) => {
    // Insert content at current cursor position
    editor.chain().focus().insertContent(content).run();

    // Optionally add citation to document
    if (citation) {
      // Add to citations list
      // Update document metadata
    }
  };

  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <EditorContent editor={editor} />
      </div>

      <div className="w-[400px]">
        <PapersProvider userId={user.uid}>
          <IntegratedPapersPanel
            userId={user.uid}
            onInsertToDocument={handleInsertContent}
          />
        </PapersProvider>
      </div>
    </div>
  );
}
```

## Testing

The components include loading states, error handling, and empty states for a complete user experience:

- Empty library state with upload prompt
- Loading indicators during operations
- Error messages with retry options
- Processing status indicators
- Upload progress visualization
- Streaming chat responses

## Performance

- Debounced search
- Optimized re-renders with proper memoization
- Efficient polling for processing papers
- Streaming responses for chat (no waiting for full response)
- Background processing doesn't block UI

## Accessibility

- Keyboard navigation support
- ARIA labels on interactive elements
- Focus management
- Screen reader friendly

## Next Steps

1. Add the `PapersProvider` to your app layout
2. Place `IntegratedPapersPanel` in a sidebar or panel
3. Connect the `onInsertToDocument` callback to your editor
4. Customize styling to match your app theme
5. Add any additional features specific to your use case
