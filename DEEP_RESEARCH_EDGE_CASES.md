# Deep Research - Edge Case Handling Documentation

## Overview

This document describes all edge case handling implemented for the Deep Research feature in Phase 11. These improvements ensure robust, user-friendly research experiences across all scenarios.

---

## 1. Topic Too Broad

**Location:** `lib/research/deep-research/utils.ts` + `lib/research/deep-research/engine.ts`

**Implementation:**
- Detects overly broad topics (e.g., "medicine", "science", "cancer")
- Analyzes topic length and word count
- Checks against list of broad terms

**User Experience:**
```
Error: Topic too broad: Your topic is quite broad. Consider narrowing it to a specific aspect, disease, technique, or application.

Examples:
- medicine in cardiovascular disease
- medicine treatments for elderly patients
- Recent advances in medicine therapy
- medicine mechanisms in diabetes
```

**Function:** `isTopicTooBroad(topic: string)`

---

## 2. No Sources Found

**Location:** `lib/research/deep-research/utils.ts` + `lib/research/deep-research/engine.ts`

**Implementation:**
- Automatically generates alternative search terms using synonyms
- Tries alternative terms if initial search returns empty
- Maps common medical terms to synonyms (treatment → therapy, disease → condition, etc.)

**User Experience:**
```
Error: No sources found for "rare cardiovascular treatment".
Try these alternative search terms:
- rare cardiovascular
- rare cardiovascular therapy
- rare cardiovascular intervention
```

**Function:** `generateAlternativeSearchTerms(originalTopic: string)`

**Automatic Retry:**
- If a search node returns 0 results, automatically tries the first alternative
- Logs success if alternatives find sources
- Continues research without user intervention

---

## 3. Research Timeout

**Location:** `lib/research/deep-research/engine.ts`

**Implementation:**
- Configurable timeout based on research mode:
  - Quick: ~1-2 minutes
  - Standard: ~2-5 minutes
  - Deep: ~5-10 minutes
  - Exhaustive/Systematic: ~10 minutes (max)
- Returns partial results if timeout occurs
- Shows warning in UI

**User Experience:**
- Progress indicator shows "Completing with partial results..."
- Yellow warning banner appears: "Research is taking longer than expected. Partial results will be returned."
- User can continue with what was found

**Function:** `getTimeoutForMode(config: ResearchConfig)`

**Formula:** `baseTimeout (60s) + (depth × breadth × 5s per node), max 600s`

---

## 4. Conflicting Sources

**Location:** `lib/research/deep-research/synthesis.ts`

**Implementation:**
- Heuristic-based detection of contradictory findings
- Categorizes sources into:
  - Positive outcomes (effective, beneficial, improved)
  - Negative outcomes (ineffective, no benefit)
  - Mixed results (conflicting, inconsistent)
- Requires 2+ sources in each category to flag contradiction

**User Experience:**
```
Contradiction Detected:
Claim 1: 5 studies report positive outcomes
Claim 2: 3 studies report negative or no outcomes

Explanation: Contradictory findings detected. This may be due to differences in study design, population, dosage, or measurement methods. Further analysis of methodological differences is recommended.

Supporting Studies: [List of 5 positive studies]
Contradicting Studies: [List of 3 negative studies]
```

**Function:** `identifyContradictions(sources: SearchResult[])`

---

## 5. Rate Limiting

**Location:** `lib/research/arxiv.ts` + `lib/research/semantic-scholar.ts`

**Implementation:**

### arXiv
- Rate limit: 1 request/second
- Exponential backoff: 1s → 2s → 4s → 8s (max 10s)
- Handles 429 (rate limit) and 503 (service unavailable)
- Max 3 retries

### Semantic Scholar
- Rate limit: 100 requests/5 min (no API key), 1000 requests/5 min (with key)
- Exponential backoff: 2s → 4s → 8s → 16s (max 30s)
- Handles 429 and 503 errors
- Max 3 retries

**User Experience:**
- Automatic retry with logging: "arXiv rate limit or service unavailable, retrying (attempt 2/3)..."
- If all retries fail: "Semantic Scholar rate limit exceeded. Please try again in a few minutes."
- UI shows helpful tip: "Try reducing the number of databases or switching to a less intensive research mode."

**Code Pattern:**
```typescript
const fetchWithRetry = async (attempt = 0): Promise<Response> => {
  try {
    if (attempt > 0) {
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    const response = await fetch(url);
    if (response.status === 429 && attempt < 3) {
      return fetchWithRetry(attempt + 1);
    }
    return response;
  } catch (error) {
    if (isRetryableError(error) && attempt < 3) {
      return fetchWithRetry(attempt + 1);
    }
    throw error;
  }
};
```

---

## 6. Context Overflow

**Location:** `lib/research/deep-research/utils.ts`

**Implementation:**
- Detects when text exceeds token limits (default: 8000 tokens)
- Estimates tokens using 1 token ≈ 4 characters heuristic
- Truncates content intelligently at sentence boundaries
- Adds notice when content is truncated

**User Experience:**
```
[Content truncated to fit context limit]
```

**Functions:**
- `detectContextOverflow(text: string, maxTokens: number)`
- `truncateToTokenLimit(text: string, maxTokens: number)`

**Usage:**
```typescript
const check = detectContextOverflow(largeText, 8000);
if (check.overflows) {
  console.warn(check.suggestion);
  largeText = truncateToTokenLimit(largeText, 8000);
}
```

---

## 7. Enhanced Loading States

**Location:** `components/research/integrated-research-panel-enhanced.tsx`

**Implementation:**

### Stage-Specific Messages
- Planning: "Planning research strategy..."
- Perspective Generation: "Generating expert perspectives..."
- Research: "Searching databases..."
- Analysis: "Analyzing sources..."
- Synthesis: "Synthesizing findings..."
- Timeout: "Completing with partial results..."

### Real-Time Statistics
Displays in responsive grid:
- Perspectives generated
- Nodes explored
- Sources found

### Visual Indicators
- Animated pulsing search icon during research
- Progress bar with percentage
- Time estimates (where applicable)

### Cancel Functionality
- Always-visible cancel button
- Cleans up resources properly
- Shows cancellation message

---

## 8. Enhanced Error Handling

**Location:** `components/research/integrated-research-panel-enhanced.tsx`

**Implementation:**

### Contextual Error Messages
- Base error message from engine/API
- Specific tips based on error type:
  - **Rate Limit:** "Try reducing the number of databases or switching to a less intensive research mode."
  - **No Sources:** "Try broadening your search terms or adjusting the date range filter."
  - **Too Broad:** "Add specific disease, population, or methodology to your topic."

### Error Display
- Prominent error banner with icon
- Dismissible with clear button
- Preserves whitespace and line breaks
- Responsive layout (stacks on mobile)

### Error Recovery
- Allows user to modify settings and retry
- Preserves research configuration
- Suggests specific next steps

---

## 9. Responsive Design

**Location:** `components/research/integrated-research-panel-enhanced.tsx`

**Implementation:**

### Mobile Optimizations
- **Header:** Truncates long titles, shows shorter descriptions
- **Tabs:** Icon-only on mobile, text on desktop
- **Buttons:** Full-width on mobile, auto-width on desktop
- **Grid Layouts:** 2 columns on mobile, 4 on desktop
- **Spacing:** Reduced on mobile (4px vs 6px)

### Responsive Breakpoints
Uses Tailwind's `sm:` prefix (640px):
```tsx
className="flex flex-col sm:flex-row items-start sm:items-center"
```

### Touch-Friendly
- Larger tap targets (min 44x44px)
- Adequate spacing between interactive elements
- Scrollable containers for long content

---

## Additional Improvements

### 10. Time Estimation

**Location:** `lib/research/deep-research/utils.ts`

**Function:** `estimateTimeRemaining(nodesComplete, nodesTotal, elapsedMs)`

Calculates and formats remaining time:
- "Calculating..." (0% complete)
- "45 seconds" (< 1 minute)
- "3 minutes" (≥ 1 minute)

### 11. Retry Helper

**Location:** `lib/research/deep-research/utils.ts`

**Function:** `retryWithBackoff<T>(fn, options)`

Generic retry wrapper with:
- Configurable max retries (default: 3)
- Exponential backoff (default: 1s initial, 10s max)
- Optional retry callback for logging
- Checks if error is retryable (rate limit, network, timeout)

### 12. First-Time User Guidance

**Location:** `components/research/integrated-research-panel-enhanced.tsx`

**Implementation:**
- Blue info banner with specific example
- "Instead of 'cancer treatment', try 'immunotherapy for melanoma in elderly patients'"
- Always visible in new research tab
- Helps users formulate better queries

---

## Testing Scenarios

### To Test Topic Too Broad:
```
Try: "medicine"
Expected: Error with suggestions to narrow scope
```

### To Test No Sources:
```
Try: "asdfqwerty treatment protocols"
Expected: Attempts alternatives, shows helpful message
```

### To Test Timeout:
```
Try: Exhaustive mode with many databases
Expected: Returns partial results after ~10 minutes
```

### To Test Rate Limiting:
```
Try: Multiple rapid searches
Expected: Automatic retry with increasing delays
```

### To Test Conflicting Sources:
```
Try: Topic with known controversy (e.g., "homeopathy effectiveness")
Expected: Synthesis shows contradictions clearly
```

### To Test Responsive Design:
```
- Resize browser to mobile width (< 640px)
- Verify all elements stack properly
- Check touch targets are adequate
```

---

## Files Modified/Created

### Modified Files
1. `/lib/research/deep-research/utils.ts` - Added 9 new utility functions
2. `/lib/research/deep-research/engine.ts` - Added topic validation, timeout handling, alternative searches
3. `/lib/research/deep-research/synthesis.ts` - Enhanced contradiction detection
4. `/lib/research/arxiv.ts` - Added retry logic with exponential backoff
5. `/lib/research/semantic-scholar.ts` - Added retry logic with exponential backoff

### Created Files
6. `/components/research/integrated-research-panel-enhanced.tsx` - New enhanced panel with all improvements

---

## Summary of Edge Cases Handled

| # | Edge Case | Status | Location |
|---|-----------|--------|----------|
| 1 | Topic Too Broad | ✅ Complete | utils.ts, engine.ts |
| 2 | No Sources Found | ✅ Complete | utils.ts, engine.ts |
| 3 | Research Timeout | ✅ Complete | engine.ts |
| 4 | Conflicting Sources | ✅ Complete | synthesis.ts |
| 5 | Rate Limiting | ✅ Complete | arxiv.ts, semantic-scholar.ts |
| 6 | Context Overflow | ✅ Complete | utils.ts |
| 7 | Enhanced Loading States | ✅ Complete | integrated-research-panel-enhanced.tsx |
| 8 | Enhanced Error Handling | ✅ Complete | integrated-research-panel-enhanced.tsx |
| 9 | Responsive Design | ✅ Complete | integrated-research-panel-enhanced.tsx |

---

## Future Enhancements

### Potential Improvements
1. **Smart Retry Queue:** Queue failed requests instead of blocking
2. **LLM-Based Contradiction Detection:** Use actual LLM instead of heuristics
3. **User Feedback Loop:** Learn from which error suggestions users follow
4. **Progress Persistence:** Save progress to resume after timeout/error
5. **A/B Testing:** Test different error message wording
6. **Telemetry:** Track which edge cases occur most frequently

### Monitoring Recommendations
- Log frequency of each edge case
- Track user actions after errors (retry, modify, abandon)
- Monitor timeout rates by mode
- Measure effectiveness of alternative search suggestions

---

**Last Updated:** January 5, 2026
**Author:** Claude Code Agent
**Version:** 1.0.0
