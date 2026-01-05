# Deep Research API Routes

API endpoints for the Deep Research engine using `lib/research/deep-research/`.

## Endpoints

### 1. Main Research Endpoint
**`POST /api/research/route.ts`**

Initiates a deep research session and returns an SSE stream with real-time progress.

**Request:**
```typescript
{
  topic: string;
  mode?: 'quick' | 'standard' | 'deep' | 'exhaustive' | 'systematic';
  config?: Partial<ResearchConfig>;
  clarifications?: Array<{ question: string; answer: string }>;
}
```

**Response:** Server-Sent Events (SSE) stream

**Events:**
- `status` - Research stage updates
- `session_created` - Session initialized
- `perspectives_generated` - Expert perspectives created
- `tree_built` - Exploration tree constructed
- `progress` - Research progress updates
- `sources_deduplicated` - Deduplication complete
- `complete` - Research finished with full results
- `error` - Error occurred

**Example:**
```bash
curl -X POST http://localhost:2550/api/research \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "AI in medical diagnosis",
    "mode": "standard"
  }'
```

---

### 2. Clarification Endpoint
**`POST /api/research/clarify/route.ts`**

Generates clarifying questions to refine research scope.

**Request:**
```typescript
{
  topic: string;
}
```

**Response:**
```typescript
{
  questions: string[];
  suggestedAnswers?: string[];
  reasoning?: string;
  confidence: number;
}
```

**Example:**
```bash
curl -X POST http://localhost:2550/api/research/clarify \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "CRISPR gene editing"
  }'
```

**Response:**
```json
{
  "questions": [
    "Which application of CRISPR are you most interested in?",
    "What time period should the research cover?",
    "Are you focusing on therapeutic applications or research tools?"
  ],
  "suggestedAnswers": [
    "Therapeutic applications",
    "Last 5 years",
    "All types"
  ],
  "reasoning": "Topic could benefit from scope refinement",
  "confidence": 0.8
}
```

---

### 3. Stream Endpoint
**`GET /api/research/stream?sessionId=xxx`**

Streams real-time progress for an existing research session.

**Query Parameters:**
- `sessionId` (required) - Research session identifier

**Response:** Server-Sent Events (SSE) stream

**Events:**
- `status` - Session status updates
- `perspective_added` - New perspective discovered
- `branch_update` - Research branch progress
- `learning` - New insight discovered
- `source_found` - New paper found
- `synthesis` - Synthesis progress
- `complete` - Session complete
- `error` - Error occurred

**Example:**
```bash
curl http://localhost:2550/api/research/stream?sessionId=research-1234567890
```

**Event Stream:**
```
event: status
data: {"stage":"connected","sessionId":"research-1234567890","message":"Connected to research stream","progress":0}

event: perspective_added
data: {"id":"clinical","name":"Clinical Outcomes","description":"..."}

event: source_found
data: {"title":"Paper title","authors":["Author"],"year":2023}

event: complete
data: {"totalSources":25,"duration":45000}
```

---

## Implementation Details

### Technology Stack
- **Framework:** Next.js 14 App Router
- **Streaming:** Server-Sent Events (SSE)
- **Engine:** `lib/research/deep-research/`
- **Agents:** ClarifierAgent, PerspectiveAnalystAgent, etc.

### Key Features

1. **Real-time Streaming:** All endpoints use SSE for live updates
2. **Progress Tracking:** Detailed progress events at each stage
3. **Multi-perspective Research:** Automatically generates diverse viewpoints
4. **Parallel Execution:** Searches multiple databases simultaneously
5. **Deduplication:** Smart cross-database deduplication
6. **Error Handling:** Comprehensive error handling with try/catch
7. **Type Safety:** Full TypeScript support, no `any` types

### Research Workflow

```
1. POST /api/research
   ├─ Initialize session
   ├─ Generate perspectives
   ├─ Build exploration tree
   ├─ Execute parallel research
   ├─ Deduplicate sources
   └─ Return complete results

2. Optional: POST /api/research/clarify
   └─ Get clarifying questions before research

3. Optional: GET /api/research/stream?sessionId=xxx
   └─ Monitor ongoing research session
```

### Research Modes

| Mode | Depth | Breadth | Max Sources | Iterations | Use Case |
|------|-------|---------|-------------|------------|----------|
| `quick` | 1 | 2 | 10 | 1 | Quick overview |
| `standard` | 2 | 3 | 25 | 2 | Balanced research |
| `deep` | 3 | 4 | 50 | 3 | Thorough analysis |
| `exhaustive` | 4 | 5 | 100 | 4 | Comprehensive review |
| `systematic` | 5 | 6 | 200 | 5 | Systematic review |

### Rate Limiting Considerations

Production deployments should implement:
- Per-user request quotas
- IP-based rate limiting
- Session-based throttling
- API key authentication

Example locations for rate limiting:
- Before calling `ClarifierAgent` in `/api/research/clarify`
- At the start of `/api/research` POST handler
- In middleware for all research endpoints

### Error Handling

All endpoints include:
- Input validation (topic required, mode valid)
- Try/catch for async operations
- Proper HTTP status codes (400, 404, 500)
- Detailed error messages
- SSE error events for stream failures

### Integration Example

```typescript
// Client-side integration
const eventSource = new EventSource('/api/research', {
  method: 'POST',
  body: JSON.stringify({
    topic: 'AI in medical diagnosis',
    mode: 'standard'
  })
});

eventSource.addEventListener('status', (event) => {
  const data = JSON.parse(event.data);
  console.log(`Status: ${data.stage} - ${data.progress}%`);
});

eventSource.addEventListener('complete', (event) => {
  const data = JSON.parse(event.data);
  console.log(`Found ${data.sources.length} papers`);
  eventSource.close();
});

eventSource.addEventListener('error', (event) => {
  console.error('Stream error:', event);
  eventSource.close();
});
```

---

## Testing

### Manual Testing
```bash
# Start dev server
npm run dev

# Test clarification endpoint
curl -X POST http://localhost:2550/api/research/clarify \
  -H "Content-Type: application/json" \
  -d '{"topic":"machine learning in healthcare"}'

# Test main research endpoint
curl -X POST http://localhost:2550/api/research \
  -H "Content-Type: application/json" \
  -d '{"topic":"CRISPR gene editing","mode":"quick"}'

# Test stream endpoint (requires existing sessionId)
curl http://localhost:2550/api/research/stream?sessionId=research-123
```

### TypeScript Validation
```bash
# Type check
npx tsc --noEmit

# Build check
npm run build
```

---

## Related Files

- **Engine:** `/lib/research/deep-research/engine.ts`
- **Agents:** `/lib/research/deep-research/agents.ts`
- **Types:** `/lib/research/deep-research/types.ts`
- **Utilities:** `/lib/research/deep-research/utils.ts`
- **Index:** `/lib/research/deep-research/index.ts`

---

**Created:** January 5, 2026
**Author:** Agent A
**Status:** Production Ready
