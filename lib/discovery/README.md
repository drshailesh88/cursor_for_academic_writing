# Discovery Module

Connected Papers-style literature discovery and analysis for the Academic Writing Platform.

## Overview

This module provides six core discovery engines that help researchers explore, analyze, and understand academic literature through network analysis, temporal patterns, and intelligent recommendations.

## Core Modules

### 1. Citation Network Engine (`network.ts`)

Build and analyze citation networks using multiple algorithms.

```typescript
import { buildNetwork, getCoCitations, getBibliographicCoupling } from '@/lib/discovery';

// Build a citation network from seed papers
const network = await buildNetwork(
  ['paper-id-1', 'paper-id-2'],
  {
    algorithms: ['co_citation', 'bibliographic_coupling', 'direct'],
    depth: 2,
    maxPapers: 50,
    minCitations: 5,
  }
);

// Find co-cited papers
const coCited = await getCoCitations('paper-id');

// Find bibliographically coupled papers
const coupled = await getBibliographicCoupling('paper-id');

// Calculate network metrics
const metrics = calculateNetworkMetrics(network);
```

**Features:**
- Direct citation networks
- Co-citation analysis
- Bibliographic coupling
- Semantic similarity
- Network metrics (density, centrality, clustering)
- Community detection

### 2. Knowledge Map Generator (`knowledge-map.ts`)

Create visual knowledge maps showing research landscape.

```typescript
import { generateMap, detectGaps, findMissingFromReview } from '@/lib/discovery';

// Generate knowledge map for a topic
const map = await generateMap('machine learning in healthcare', {
  clusterCount: 5,
  paperLimit: 100,
  timeRange: { start: 2020, end: 2024 },
});

// Detect research gaps
const gaps = detectGaps(map);

// Find missing citations in a draft
const missing = await findMissingFromReview(draftContent, existingCitations);
```

**Features:**
- Topic clustering
- AI-generated cluster labels
- Research gap detection
- Inter-cluster connections
- Draft citation analysis

### 3. Timeline Generator (`timeline.ts`)

Track temporal evolution of research topics.

```typescript
import { generateTimeline, identifyMilestones, detectTrends } from '@/lib/discovery';

// Generate research timeline
const timeline = await generateTimeline('deep learning', {
  startYear: 2010,
  endYear: 2024,
  groupBy: 'era',
  showMilestones: true,
});

// Identify milestone papers
const milestones = identifyMilestones(papers);

// Detect rising/declining trends
const trends = detectTrends(papers, config);
```

**Features:**
- Historical development tracking
- Milestone paper identification
- Trend detection (rising/declining topics)
- Era-based grouping
- Breakthrough detection

### 4. Literature Connector (`connector.ts`)

Find connections between papers and common ground.

```typescript
import { findPaths, findMultiPaperConnections, explainConnection } from '@/lib/discovery';

// Find paths between two papers
const connection = await findPaths('source-paper-id', 'target-paper-id', 3);

// Find common ground among multiple papers
const multiConnection = await findMultiPaperConnections([
  'paper-1', 'paper-2', 'paper-3'
]);

// Explain a connection path
const explanation = await explainConnection(connection.shortestPath);
```

**Features:**
- Citation path finding
- Shortest path algorithms
- Co-citation paths
- Bibliographic coupling paths
- Semantic similarity paths
- Multi-paper synthesis opportunities

### 5. Smart Recommendations (`recommendations.ts`)

Personalized paper recommendations with learning.

```typescript
import { generateRecommendations, getTrending, learnFromFeedback } from '@/lib/discovery';

// Generate all recommendation types
const recommendations = await generateRecommendations(
  userId,
  userPapers,
  learningHistory
);

// Get trending papers
const trending = await getTrending(userPapers, 'topic');

// Learn from user feedback
const updatedHistory = learnFromFeedback(paperId, accepted, existingHistory);
```

**Features:**
- Trending/hot papers
- Missing foundational works
- Recent publications
- Same-author papers
- Extension/citation tracking
- Learning from user feedback

### 6. Research Frontiers (`frontiers.ts`)

Detect emerging topics and research opportunities.

```typescript
import { detectFrontiers, calculateGrowthMetrics } from '@/lib/discovery';

// Detect frontiers in a domain
const frontiers = await detectFrontiers('artificial intelligence', 5);

// Calculate growth metrics
const growth = await calculateGrowthMetrics('transformers', 10);
```

**Features:**
- Emerging topic detection
- Growth rate calculation
- Research gap identification
- Opportunity detection
- Maturity analysis
- Trend momentum tracking

## Data Types

All types are defined in `types.ts`:

- `CitationNetwork` - Network structure with nodes, edges, clusters
- `KnowledgeMap` - Topic clusters with connections and gaps
- `ResearchTimeline` - Temporal evolution with milestones
- `LiteratureConnection` - Citation paths between papers
- `Recommendations` - Categorized paper recommendations
- `ResearchFrontier` - Emerging topics and opportunities

## Integration with Research APIs

The discovery module integrates with:

- **Semantic Scholar** - Citation data, recommendations, related papers
- **OpenAlex** - Comprehensive paper metadata, citations
- **PubMed** (future) - Biomedical literature

## Usage Examples

### Build a Citation Network

```typescript
const network = await buildNetwork(['pmid:12345', 'pmid:67890'], {
  depth: 2,
  maxPapers: 100,
  algorithms: ['co_citation', 'direct'],
});

console.log(`Network has ${network.papers.length} papers`);
console.log(`Density: ${network.metrics.density}`);
console.log(`Clusters: ${network.clusters.length}`);
```

### Find Missing Citations

```typescript
const gaps = await findMissingFromReview(
  documentContent,
  currentCitations
);

gaps.forEach(gap => {
  console.log(`${gap.severity}: ${gap.topic}`);
  console.log(`Suggested: ${gap.missingPapers.length} papers`);
});
```

### Track Research Evolution

```typescript
const timeline = await generateTimeline('CRISPR', {
  startYear: 2012,
  endYear: 2024,
});

timeline.milestones.forEach(m => {
  console.log(`${m.year}: ${m.label}`);
});
```

### Get Personalized Recommendations

```typescript
const recs = await generateRecommendations(userId, userLibrary);

console.log('Trending:', recs.hotNow.length);
console.log('Missing:', recs.missingFromReview.length);
console.log('Recent:', recs.newThisWeek.length);
```

## Performance Considerations

1. **API Rate Limits**
   - Semantic Scholar: 100 req/5min (no key), 1000 req/5min (with key)
   - OpenAlex: 100,000 req/day, 10 req/sec

2. **Caching**
   - Cache network results for reuse
   - Store processed timelines
   - Save recommendation results

3. **Batch Processing**
   - Limit concurrent API calls
   - Use Promise.all for parallel fetches
   - Implement request queuing

## Error Handling

All functions include try-catch blocks and return empty/default values on error:

```typescript
try {
  const network = await buildNetwork(seedIds);
} catch (error) {
  console.error('Network build failed:', error);
  // Returns partial network or empty structure
}
```

## Future Enhancements

- [ ] Advanced community detection (Louvain algorithm)
- [ ] Real-time collaboration features
- [ ] LLM-powered cluster labeling
- [ ] Interactive visualization support
- [ ] Export to popular formats (GraphML, GEXF)
- [ ] Integration with reference managers

## Testing

```bash
# Run discovery module tests
npm test -- lib/discovery

# Test specific module
npm test -- lib/discovery/network.test.ts
```

## Contributing

When adding new discovery features:

1. Add types to `types.ts`
2. Implement core logic in appropriate module
3. Export from `index.ts`
4. Add usage examples to README
5. Include error handling
6. Add tests

## License

Part of the Academic Writing Platform - See main LICENSE file.

---

**Last Updated:** January 5, 2026
**Module Version:** 1.0.0
