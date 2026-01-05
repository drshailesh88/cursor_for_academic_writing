# Connected Papers Discovery API Routes

All 6 API routes have been successfully implemented for the Connected Papers Discovery feature.

## Overview

These API routes expose the discovery engine functionality built in `lib/discovery/` via RESTful endpoints.

## API Routes

### 1. Citation Network (`/api/discovery/network`)

**Endpoint:** `POST /api/discovery/network`

**Purpose:** Build citation networks from seed papers using co-citation, bibliographic coupling, and direct citation algorithms.

**Request Body:**
```typescript
{
  seedPaperIds: string[];        // Array of paper IDs (required)
  depth?: number;                // Hops from seed (1-3, default: 2)
  maxPapers?: number;            // Max papers to include (10-200, default: 50)
  minCitations?: number;         // Minimum citation filter (default: 5)
  algorithms?: string[];         // ['co_citation', 'bibliographic_coupling', 'semantic', 'direct']
  yearRange?: {                  // Filter by publication year
    start: number;
    end: number;
  };
  onlyOpenAccess?: boolean;      // Only include OA papers
}
```

**Response:**
```typescript
{
  success: true,
  network: {
    id: string,
    seedPaperIds: string[],
    papers: NetworkPaper[],      // Positioned papers with metrics
    edges: NetworkEdge[],        // Connections between papers
    clusters: NetworkCluster[],  // Detected communities
    config: NetworkConfig,
    layout: NetworkLayout
  },
  metrics: {
    totalPapers: number,
    totalEdges: number,
    avgConnections: number,
    clusterCount: number
  },
  keyPapers: string[],          // Top 10 most connected papers
  message: string
}
```

---

### 2. Knowledge Map (`/api/discovery/map`)

**Endpoint:** `POST /api/discovery/map`

**Purpose:** Generate visual knowledge maps showing clusters of research topics and their relationships.

**Request Body:**
```typescript
{
  topic: string;                 // Research topic (required)
  clusterCount?: number;         // Target clusters (2-10, default: 5)
  paperLimit?: number;           // Max papers (20-500, default: 100)
  timeRange?: {                  // Filter by year
    start: number;
    end: number;
  };
  showLabels?: boolean;          // Show cluster labels (default: true)
  showConnections?: boolean;     // Show inter-cluster links (default: true)
}
```

**Response:**
```typescript
{
  success: true,
  map: {
    id: string,
    query: string,
    clusters: MapCluster[],      // Research topic clusters
    papers: MapPaper[],          // Papers positioned in clusters
    connections: ClusterConnection[],
    config: MapConfig
  },
  gaps: Array<{                  // Research gaps identified
    topic: string,
    adjacentClusters: string[],
    explanation: string
  }>,
  representativePapers: Array<{  // Key papers per cluster
    clusterId: string,
    clusterLabel: string,
    papers: string[]
  }>,
  summary: {
    totalClusters: number,
    totalPapers: number,
    totalConnections: number,
    gapsIdentified: number
  }
}
```

---

### 3. Recommendations (`/api/discovery/recommend`)

**Endpoint:** `POST /api/discovery/recommend`

**Purpose:** Generate personalized paper recommendations based on user's library.

**Request Body:**
```typescript
{
  paperIds: string[];            // User's papers (required, min 1)
  userId?: string;               // User ID for personalization
  limit?: number;                // Recommendations per category (1-50, default: 10)
  categories?: string[];         // Filter: ['trending', 'missing', 'recent', 'sameAuthors', 'extending']
}
```

**Response:**
```typescript
{
  success: true,
  recommendations: {
    hotNow: Recommendation[],           // Trending papers
    missingFromReview: Recommendation[], // Missing foundational work
    newThisWeek: Recommendation[],      // Recent publications
    sameAuthors: Recommendation[],      // By same authors
    extendingWork: Recommendation[]     // Papers citing user's work
  },
  summary: {
    basedOnPapers: number,
    totalRecommendations: number,
    byCategory: {
      trending: number,
      missing: number,
      recent: number,
      sameAuthors: number,
      extending: number
    }
  }
}
```

**Recommendation Object:**
```typescript
{
  paperId: string,
  score: number,              // 0-1 confidence score
  reason: string,             // Explanation
  type: 'hot' | 'missing' | 'new' | 'author' | 'extending' | 'trending',
  relatedPaperIds?: string[]  // Related papers from library
}
```

---

### 4. Literature Connector (`/api/discovery/connect`)

**Endpoint:** `POST /api/discovery/connect`

**Purpose:** Find connection paths between two papers through citations, co-citations, and semantic similarity.

**Request Body:**
```typescript
{
  sourcePaperId: string;         // Starting paper (required)
  targetPaperId: string;         // Target paper (required)
  maxDepth?: number;             // Max path length (1-5, default: 3)
}
```

**Response:**
```typescript
{
  success: true,
  connection: {
    sourcePaperId: string,
    targetPaperId: string,
    paths: Array<{              // All found paths
      id: string,
      papers: string[],         // Paper IDs in path order
      edges: PathEdge[],        // Connections between papers
      totalWeight: number,
      pathType: 'citation' | 'semantic' | 'author' | 'method',
      explanation: string,      // Human-readable explanation
      length: number
    }>,
    shortestPath: ConnectionPath,
    connectionStrength: number   // 0-1 based on path count/quality
  },
  intermediatePapers: string[],  // Bridge papers
  summary: {
    totalPaths: number,
    shortestPathLength: number,
    connectionTypes: string[],
    strongConnection: boolean
  }
}
```

---

### 5. Research Timeline (`/api/discovery/timeline`)

**Endpoint:** `POST /api/discovery/timeline`

**Purpose:** Generate temporal evolution analysis showing how a research topic developed over time.

**Request Body:**
```typescript
{
  topic: string;                 // Research topic (required)
  startYear?: number;            // Start year (1900-present, default: current-20)
  endYear?: number;              // End year (1900-present+1, default: current)
  groupBy?: 'year' | 'quarter' | 'era';  // Time grouping (default: 'era')
  showMilestones?: boolean;      // Include breakthrough papers (default: true)
  showTrends?: boolean;          // Include trend analysis (default: true)
}
```

**Response:**
```typescript
{
  success: true,
  timeline: {
    id: string,
    topic: string,
    periods: TimePeriod[],       // Time periods with paper counts
    milestones: Milestone[],     // Breakthrough/seminal papers
    papers: TimelinePaper[],     // Papers positioned on timeline
    trends: Trend[],             // Rising/declining topics
    config: TimelineConfig
  },
  evolution: Array<{             // Era-by-era summary
    period: string,
    years: string,
    paperCount: number,
    keyTopics: string[],
    description: string
  }>,
  breakthroughs: Array<{         // Milestone papers
    year: number,
    paperId: string,
    label: string,
    description: string
  }>,
  trendInsights: Array<{         // Topic trends
    topic: string,
    direction: 'rising' | 'stable' | 'declining',
    growthRate: number,
    period: string,
    paperCount: number
  }>,
  summary: {
    totalPapers: number,
    timeSpan: string,
    periods: number,
    milestones: number,
    risingTopics: number,
    decliningTopics: number
  }
}
```

---

### 6. Research Frontiers (`/api/discovery/frontiers`)

**Endpoint:** `POST /api/discovery/frontiers`

**Purpose:** Detect emerging topics, research gaps, and opportunities in a domain.

**Request Body:**
```typescript
{
  topic: string;                 // Research domain (required)
  yearRange?: number;            // Years back to analyze (1-20, default: 5)
  includeGrowthMetrics?: boolean; // Include detailed growth data (default: false)
}
```

**Response:**
```typescript
{
  success: true,
  frontiers: {
    domain: string,
    emergingTopics: {
      accelerating: EmergingTopic[],  // Rapidly growing topics
      emerging: EmergingTopic[],      // Growing topics
      all: EmergingTopic[]
    },
    gaps: {
      highImpact: ResearchOpportunity[], // High-impact gaps
      all: ResearchOpportunity[]
    },
    opportunities: ResearchOpportunity[],
    metrics: FrontierMetrics
  },
  predictions: Array<{           // Growth predictions
    topic: string,
    prediction: string,
    confidence: 'high' | 'medium' | 'low'
  }>,
  growthMetrics?: GrowthMetrics,  // If includeGrowthMetrics=true
  summary: {
    totalEmergingTopics: number,
    acceleratingTopics: number,
    gapsIdentified: number,
    highImpactGaps: number,
    opportunitiesFound: number,
    timeSpan: string,
    avgGrowthRate: number
  }
}
```

**EmergingTopic Object:**
```typescript
{
  id: string,
  label: string,
  description: string,
  momentum: 'emerging' | 'accelerating' | 'plateau' | 'declining',
  growthRate: number,           // Percentage
  paperCount: number,
  keyAuthors: string[],
  relatedEstablished: string[]
}
```

**ResearchOpportunity Object:**
```typescript
{
  id: string,
  type: 'gap' | 'intersection' | 'application' | 'methodology',
  description: string,
  relatedTopics: string[],
  potentialImpact: 'low' | 'medium' | 'high' | 'transformative',
  difficulty: 'accessible' | 'moderate' | 'challenging'
}
```

---

## Error Handling

All endpoints return consistent error responses:

```typescript
{
  success: false,
  error: string,              // Error message
  message: string,            // User-friendly message
  details?: any               // Validation errors (if applicable)
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Invalid request (validation errors)
- `500` - Server error

---

## Implementation Details

### Technology Stack
- **Framework:** Next.js 14 App Router
- **Validation:** Zod schemas
- **Discovery Engine:** `/lib/discovery/*`
- **Data Sources:** Semantic Scholar, OpenAlex APIs

### Key Features
1. **Input Validation:** All endpoints use Zod schemas for type-safe validation
2. **Error Handling:** Comprehensive try-catch with meaningful error messages
3. **TypeScript:** Fully typed with no `any` types
4. **Performance:** Configurable limits to prevent API overload
5. **Response Format:** Consistent structure across all endpoints

### Testing

Test each endpoint using curl or a REST client:

```bash
# Network
curl -X POST http://localhost:2550/api/discovery/network \
  -H "Content-Type: application/json" \
  -d '{"seedPaperIds": ["paper-id-1", "paper-id-2"]}'

# Knowledge Map
curl -X POST http://localhost:2550/api/discovery/map \
  -H "Content-Type: application/json" \
  -d '{"topic": "machine learning protein folding"}'

# Recommendations
curl -X POST http://localhost:2550/api/discovery/recommend \
  -H "Content-Type: application/json" \
  -d '{"paperIds": ["paper-id-1"]}'

# Connect
curl -X POST http://localhost:2550/api/discovery/connect \
  -H "Content-Type: application/json" \
  -d '{"sourcePaperId": "id1", "targetPaperId": "id2"}'

# Timeline
curl -X POST http://localhost:2550/api/discovery/timeline \
  -H "Content-Type: application/json" \
  -d '{"topic": "CRISPR"}'

# Frontiers
curl -X POST http://localhost:2550/api/discovery/frontiers \
  -H "Content-Type: application/json" \
  -d '{"topic": "quantum computing"}'
```

---

## File Locations

```
app/api/discovery/
├── network/route.ts       (95 lines)
├── map/route.ts          (113 lines)
├── recommend/route.ts    (126 lines)
├── connect/route.ts      (108 lines)
├── timeline/route.ts     (114 lines)
└── frontiers/route.ts    (142 lines)

Total: 698 lines of code
```

---

## Next Steps

### Frontend Integration
Create React components to:
1. Visualize citation networks (graph visualization)
2. Display knowledge maps (cluster bubbles)
3. Show recommendations (card lists)
4. Render connection paths (path diagrams)
5. Display timelines (horizontal timeline)
6. Present frontiers (trend charts)

### Enhancements
- [ ] Add caching for expensive operations (Redis)
- [ ] Implement rate limiting
- [ ] Add authentication/authorization
- [ ] Support batch operations
- [ ] Add WebSocket support for real-time updates
- [ ] Implement pagination for large result sets
- [ ] Add export functionality (JSON, CSV)

---

**Status:** ✅ All 6 routes implemented and TypeScript compilation successful

**Last Updated:** January 5, 2026
