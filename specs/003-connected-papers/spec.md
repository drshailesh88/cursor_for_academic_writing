# Feature Specification: Connected Papers Discovery

**Feature Branch**: `003-connected-papers`
**Created**: 2026-01-03
**Status**: Draft
**Input**: User description: "Research Rabbit-inspired feature - discover related papers based on draft content and references, suggest connected papers and show how they relate to the topic being written"

## User Scenarios & Testing

### User Story 1 - Get Paper Recommendations from Draft Content (Priority: P1)

A researcher is writing a manuscript about AI in radiology. As they write, the system analyzes their content and references, then suggests related papers they might want to cite. The suggestions appear in a sidebar panel.

**Why this priority**: This is the core value - proactive discovery of relevant literature based on what the user is actively writing.

**Independent Test**: Can be fully tested by writing content with a clear topic and receiving relevant paper suggestions. Delivers immediate value by surfacing papers the researcher might have missed.

**Acceptance Scenarios**:

1. **Given** a document with at least 100 words of content, **When** user clicks "Find Related Papers", **Then** the system displays a list of 5-10 relevant papers with titles and relevance scores
2. **Given** a document with existing citations, **When** recommendations are generated, **Then** papers that cite or are cited by the existing references are prioritized
3. **Given** the recommendations panel, **When** user hovers over a paper, **Then** they see a brief explanation of why this paper is relevant to their draft

---

### User Story 2 - Explore Paper Connections (Priority: P2)

A researcher sees a recommended paper and wants to understand how it connects to other work in the field. They can explore a visual map showing citation relationships.

**Why this priority**: Connection exploration enhances research depth but requires the core recommendation engine to be in place first.

**Independent Test**: Can be tested by selecting a paper and viewing its connections to other papers in the network.

**Acceptance Scenarios**:

1. **Given** a recommended paper, **When** user clicks "Show Connections", **Then** the system displays papers that cite it and papers it cites
2. **Given** the connection view, **When** user clicks on a connected paper, **Then** they can view its abstract and add it to their reference list
3. **Given** multiple levels of connections, **When** user explores depth, **Then** they can see 2-3 degrees of citation relationships

---

### User Story 3 - Auto-suggest While Writing (Priority: P2)

A researcher is actively writing and wants real-time suggestions. As they type new paragraphs or add citations, the recommendations update automatically.

**Why this priority**: Real-time suggestions are more convenient but the manual "Find Related Papers" serves the same purpose.

**Independent Test**: Can be tested by adding new content and observing that recommendations refresh without manual action.

**Acceptance Scenarios**:

1. **Given** auto-suggest is enabled, **When** user adds a new paragraph, **Then** recommendations update within 10 seconds
2. **Given** auto-suggest is enabled, **When** user adds a new citation, **Then** the system finds papers related to the newly cited work
3. **Given** a user who prefers manual control, **When** they disable auto-suggest, **Then** recommendations only update on explicit request

---

### User Story 4 - Add Recommended Paper to Document (Priority: P1)

A researcher finds a useful recommended paper and wants to add it to their manuscript. They can insert the citation directly and optionally add a summary.

**Why this priority**: The ability to act on recommendations is essential - discovery without action is incomplete.

**Independent Test**: Can be tested by clicking "Add to Document" on a recommended paper and seeing it appear in the manuscript.

**Acceptance Scenarios**:

1. **Given** a recommended paper, **When** user clicks "Add Citation", **Then** the paper is added to their reference list in author-year format
2. **Given** a recommended paper, **When** user clicks "Insert with Summary", **Then** a brief summary with citation is inserted at cursor position
3. **Given** an added paper, **When** user views their references, **Then** the new paper appears with complete bibliographic details

---

### Edge Cases

- What happens when the document is too short for meaningful analysis? Display message suggesting minimum content (100 words) for recommendations
- What happens when the topic is very niche with few papers? Display available results and suggest broadening search terms
- What happens when the document has no citations? Base recommendations purely on content analysis
- What happens when PubMed is unavailable? Show cached recommendations or graceful degradation message
- What happens when the user writes in multiple languages? Attempt to detect language and search in appropriate databases

## Requirements

### Functional Requirements

- **FR-001**: System MUST analyze document content to extract key concepts and topics
- **FR-002**: System MUST search PubMed for papers related to extracted topics
- **FR-003**: System MUST analyze existing citations in the document to find connected papers
- **FR-004**: System MUST rank recommendations by relevance to the current document
- **FR-005**: System MUST display relevance explanations for each recommended paper
- **FR-006**: System MUST show citation relationships (cites/cited by) for recommended papers
- **FR-007**: System MUST allow users to add recommended papers as citations
- **FR-008**: System MUST insert proper author-year citations when papers are added
- **FR-009**: System MUST support both manual and automatic recommendation updates
- **FR-010**: System MUST cache recommendations to reduce redundant searches
- **FR-011**: System MUST filter out papers already cited in the document

### Key Entities

- **PaperRecommendation**: A suggested paper with title, authors, year, abstract, and relevance score
- **RelevanceExplanation**: Why a paper is relevant to the current document (topic match, citation connection)
- **CitationNetwork**: Relationships between papers (cites, cited by, same author, same topic)

## Success Criteria

### Measurable Outcomes

- **SC-001**: Recommendations are generated within 10 seconds of request
- **SC-002**: 80% of recommended papers are rated as "relevant" by users
- **SC-003**: Users add at least 1 recommended paper per 10 writing sessions on average
- **SC-004**: Relevance explanations are rated as "helpful" by 75% of users
- **SC-005**: Auto-suggest updates complete within 10 seconds of content change
- **SC-006**: Citation network displays within 3 seconds for any selected paper

## Assumptions

- Document content is in English or can be analyzed for English keywords
- PubMed is the primary source for academic paper recommendations
- Users are authenticated and have an active document open
- Firebase is configured to store recommendation history and preferences
- Existing PubMed integration is available and functional
