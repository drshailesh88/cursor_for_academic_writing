# Feature Specification: Connected Papers Discovery

**Feature Branch**: `003-connected-papers-discovery`
**Created**: 2026-01-03
**Updated**: 2026-01-03
**Status**: Complete Specification
**Vision**: The most powerful literature discovery and citation network visualization system that combines Connected Papers, ResearchRabbit, Litmaps, Citation Gecko, Inciteful, and Open Knowledge Maps into one unified platform

---

## Executive Summary

"Connected Papers Discovery" is a comprehensive AI-powered system for discovering, exploring, and visualizing relationships between research papers. Unlike existing tools that focus on single aspects of paper discovery, this system provides:

- **Multi-Algorithm Citation Networks** combining co-citation, bibliographic coupling, and semantic similarity (beyond Connected Papers)
- **AI-Powered Smart Recommendations** that learn from your reading patterns (beyond ResearchRabbit)
- **Interactive Knowledge Maps** with subject clustering and research landscape visualization (Open Knowledge Maps-inspired)
- **Temporal Research Evolution** showing how ideas develop over time (Litmaps-inspired)
- **Literature Connector** finding paths between any two papers (Inciteful-inspired)
- **Seed-Based Network Building** with Zotero/Mendeley integration (Citation Gecko-inspired)
- **Proactive Draft Analysis** suggesting papers as you write
- **Research Frontier Detection** identifying emerging topics and gaps

---

## Competitive Analysis & Feature Matrix

| Feature | Connected Papers | ResearchRabbit | Litmaps | Citation Gecko | Inciteful | Ours |
|---------|------------------|----------------|---------|----------------|-----------|------|
| Citation Graph | ✓ | Partial | ✓ | ✓ | ✓ | **✓ Enhanced** |
| Co-citation Analysis | ✓ | ✗ | ✓ | ✓ | ✓ | **✓ Multi-algo** |
| AI Recommendations | ✗ | ✓ | ✗ | ✗ | ✗ | **✓ Advanced** |
| Temporal View | ✗ | ✗ | ✓ | ✓ | ✗ | **✓ Enhanced** |
| Knowledge Maps | ✗ | ✗ | ✗ | ✗ | ✗ | **✓ New** |
| Literature Connector | ✗ | ✗ | ✗ | ✗ | ✓ | **✓ Enhanced** |
| Draft Analysis | ✗ | ✗ | ✗ | ✗ | ✗ | **✓ New** |
| Research Frontiers | ✗ | Partial | ✗ | ✗ | ✗ | **✓ New** |
| Zotero Integration | ✗ | ✓ | ✓ | ✓ | ✗ | **✓ Full** |
| Author Networks | ✗ | ✓ | ✗ | ✗ | ✓ | **✓ Enhanced** |
| Trend Detection | ✗ | ✓ | ✗ | ✗ | ✗ | **✓ Enhanced** |
| Multi-Source Search | ✗ | ✗ | ✗ | ✗ | ✗ | **✓ 6 databases** |

---

## Core Capabilities

### 1. Multi-Algorithm Citation Network Engine

#### 1.1 Citation Relationship Types
```
┌─────────────────────────────────────────────────────────────────┐
│ 🔗 Citation Network: "Deep Learning in Medical Imaging"         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  View: [All] [Cites] [Cited By] [Co-Citation] [Bibliographic]   │
│                                                                 │
│                      ┌─────────────┐                            │
│         ┌──────────→│ LeCun 2015  │←──────────┐                │
│         │            │ Deep Learning│           │                │
│         │            └──────┬──────┘           │                │
│    ┌────┴────┐              │             ┌────┴────┐          │
│    │Krizhevsky│              │             │ He 2016 │          │
│    │  2012   │              ▼             │ ResNet  │          │
│    └────┬────┘        ┌───────────┐       └────┬────┘          │
│         │             │Your Paper │            │                │
│         │             │  Seed     │            │                │
│         │             └─────┬─────┘            │                │
│         │     ┌─────────────┼─────────────┐    │                │
│         ▼     ▼             ▼             ▼    ▼                │
│    ┌─────────┐  ┌─────────┐   ┌─────────┐  ┌─────────┐        │
│    │Chen 2020│  │Wang 2021│   │Kim 2022 │  │Liu 2023 │        │
│    │  AUC:94%│  │ COVID-19│   │ Chest   │  │Multi-   │        │
│    └─────────┘  └─────────┘   └─────────┘  │ modal   │        │
│                                            └─────────┘        │
│                                                                 │
│ Legend: ●—● Co-citation  ●→● Cites  ●⋯● Bibliographic coupling │
│ Size = Citation count  Color = Year (darker = newer)           │
│                                                                 │
│ [🔍 Expand] [📊 Stats] [📥 Export] [➕ Add to Library]         │
└─────────────────────────────────────────────────────────────────┘
```

#### 1.2 Network Algorithms
| Algorithm | Description | Best For |
|-----------|-------------|----------|
| **Co-citation** | Papers frequently cited together | Finding methodological alternatives |
| **Bibliographic Coupling** | Papers sharing references | Finding parallel research |
| **Direct Citation** | Papers citing/cited by seed | Finding lineage |
| **Semantic Similarity** | Embedding-based similarity | Finding conceptually related |
| **Author Overlap** | Papers by same authors | Following researcher work |
| **Keyword Match** | Shared keywords/MeSH terms | Domain-specific discovery |

#### 1.3 Network Metrics
- **Centrality Score**: How central a paper is in the network
- **Bridge Score**: Papers connecting different clusters
- **Influence Score**: Weighted citation impact
- **Novelty Score**: How unique the paper's position is
- **Momentum Score**: Rate of citation growth

---

### 2. Interactive Knowledge Maps

#### 2.1 Research Landscape Visualization
```
┌─────────────────────────────────────────────────────────────────┐
│ 🗺️ Knowledge Map: "AI in Radiology"                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │    ┌───────────┐              ┌───────────┐             │  │
│  │    │ Detection │              │ Segmentation│            │  │
│  │    │  (234)    │              │   (189)    │            │  │
│  │    └─────┬─────┘              └─────┬─────┘             │  │
│  │          │                          │                    │  │
│  │          │    ┌───────────┐        │                    │  │
│  │          └───→│Chest X-ray│←───────┘                    │  │
│  │               │   (456)   │                              │  │
│  │               └─────┬─────┘                              │  │
│  │    ┌────────────────┼────────────────┐                  │  │
│  │    ▼                ▼                ▼                  │  │
│  │ ┌──────┐      ┌──────────┐      ┌──────────┐           │  │
│  │ │ COVID│      │Pneumonia │      │Cardiomeg.│           │  │
│  │ │ (178)│      │  (145)   │      │   (89)   │           │  │
│  │ └──────┘      └──────────┘      └──────────┘           │  │
│  │                                                          │  │
│  │  ★ = Your papers   ● = Recommended   ○ = Explored       │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│ Clusters: [All] [Detection] [Segmentation] [Classification]    │
│ Zoom: [−] [○] [+]   Filter: [2020-2024 ▼] [Top 100 ▼]         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.2 Cluster Analysis
- **Automatic Topic Clustering**: AI identifies research themes
- **Cluster Labels**: Generated from paper titles/abstracts
- **Cluster Metrics**: Size, growth rate, key authors
- **Cluster Connections**: How topics relate to each other
- **Gap Detection**: Areas with few papers (research opportunities)

#### 2.3 Exploration Modes
| Mode | Description |
|------|-------------|
| **Bird's Eye** | High-level topic overview |
| **Neighborhood** | Papers around a seed paper |
| **Pathway** | Path between two topics |
| **Timeline** | Temporal evolution of topics |
| **Author View** | Grouped by research groups |

---

### 3. Temporal Research Evolution

#### 3.1 Timeline Visualization
```
┌─────────────────────────────────────────────────────────────────┐
│ 📅 Research Timeline: "Deep Learning in Medical Imaging"        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 2012 ─┬─────────────────────────────────────────────────────── │
│       │ ● AlexNet (Krizhevsky) - ImageNet breakthrough         │
│       │                                                         │
│ 2014 ─┼─────────────────────────────────────────────────────── │
│       │ ● VGGNet  ● GoogLeNet                                  │
│       │                                                         │
│ 2015 ─┼─────────────────────────────────────────────────────── │
│       │ ● ResNet (He) - Residual connections                   │
│       │ ● First medical imaging papers using CNNs              │
│       │                                                         │
│ 2017 ─┼─────────────────────────────────────────────────────── │
│       │ ● Attention mechanisms  ● U-Net for segmentation       │
│       │                                                         │
│ 2020 ─┼─────────────────────────────────────────────────────── │
│       │ ● COVID-19 detection explosion (178 papers)            │
│       │ ● Vision Transformers emerge                           │
│       │                                                         │
│ 2023 ─┼─────────────────────────────────────────────────────── │
│       │ ● Foundation models  ● Multi-modal learning            │
│       │ ★ Your seed paper                                      │
│       │                                                         │
│ 2024 ─┴─────────────────────────────────────────────────────── │
│       │ ● LLM integration  ● Explainable AI focus              │
│                                                                 │
│ Trend: [📈 Rising: Explainable AI] [📉 Declining: Basic CNN]   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.2 Temporal Analysis Features
- **Citation Accumulation**: How papers gain citations over time
- **Topic Evolution**: How research themes shift
- **Methodology Trends**: Evolution of methods used
- **Key Milestone Identification**: Breakthrough papers
- **Future Trajectory Prediction**: Where the field is heading

#### 3.3 Animation Features
- **Play Timeline**: Animated evolution of the field
- **Compare Eras**: Side-by-side period comparison
- **Snapshot Mode**: Freeze at any point in time
- **Growth Visualization**: Paper publication velocity

---

### 4. Literature Connector (Path Finder)

#### 4.1 Paper-to-Paper Pathfinding
```
┌─────────────────────────────────────────────────────────────────┐
│ 🔗 Literature Connector                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ From: [AlexNet (Krizhevsky 2012)        ▼]                     │
│ To:   [COVID-19 Detection (Wang 2020)   ▼]                     │
│                                                                 │
│ Found 3 paths (showing shortest):                               │
│                                                                 │
│ Path 1 (4 steps, strongest connection):                         │
│ ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│ │  AlexNet    │───→│  ResNet     │───→│ ChestX-ray8 │          │
│ │  2012       │    │  2015       │    │    2017     │          │
│ └─────────────┘    └─────────────┘    └─────────────┘          │
│                                              │                   │
│                          ┌─────────────┐     │                   │
│                          │ COVID Det.  │←────┘                   │
│                          │    2020     │                         │
│                          └─────────────┘                         │
│                                                                 │
│ Connection Type: [Direct Citation] [Co-citation] [Semantic]     │
│                                                                 │
│ Why this path?                                                  │
│ • AlexNet → ResNet: Foundational deep learning architecture     │
│ • ResNet → ChestX-ray8: First large-scale chest X-ray dataset  │
│ • ChestX-ray8 → COVID: Transfer learning baseline               │
│                                                                 │
│ [Show All Paths] [Export Path] [Add Intermediates to Library]   │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.2 Path Types
| Path Type | Description | Use Case |
|-----------|-------------|----------|
| **Citation Chain** | Direct citation links | Tracing intellectual lineage |
| **Concept Bridge** | Semantic similarity | Connecting different domains |
| **Author Network** | Through shared authors | Finding collaboration opportunities |
| **Method Transfer** | Shared methodology | Finding technique applications |
| **Dataset Chain** | Through shared datasets | Finding comparable studies |

#### 4.3 Multi-Paper Connections
- Connect multiple seed papers to find common ground
- Identify central papers linking disparate topics
- Find unexpected connections between fields
- Map interdisciplinary bridges

---

### 5. AI-Powered Smart Recommendations

#### 5.1 Recommendation Engine
```
┌─────────────────────────────────────────────────────────────────┐
│ 🤖 Smart Recommendations                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Based on: Your library (42 papers) + Current draft + Reading   │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ 🔥 Hot Right Now (trending in your area)                    ││
│ ├─────────────────────────────────────────────────────────────┤│
│ │ • "Foundation Models for Medical Imaging" (Chen 2024)      ││
│ │   Why: 156 citations in 3 months, extends 4 of your papers ││
│ │   [Add to Library] [Preview] [Show Network]                 ││
│ │                                                             ││
│ │ • "Vision-Language Models in Radiology" (Liu 2024)         ││
│ │   Why: Combines two topics from your library                ││
│ │   [Add to Library] [Preview] [Show Network]                 ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ 📚 Missing from Your Review (based on your draft)           ││
│ ├─────────────────────────────────────────────────────────────┤│
│ │ Your draft discusses "attention mechanisms" but doesn't     ││
│ │ cite these highly relevant papers:                          ││
│ │                                                             ││
│ │ • "Attention U-Net" (Oktay 2018) - 2,341 citations         ││
│ │ • "TransUNet" (Chen 2021) - 1,456 citations                ││
│ │ [Review All Gaps] [Add All to Library]                      ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ 🆕 New This Week (matching your interests)                  ││
│ ├─────────────────────────────────────────────────────────────┤│
│ │ • 12 new papers on "medical image segmentation"            ││
│ │ • 5 new papers citing your library papers                  ││
│ │ • 3 preprints in your tracked topics                       ││
│ │ [View All New Papers]                                       ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ Refresh: [Now] [Daily] [Weekly]   Filters: [Year ▼] [Type ▼]   │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.2 Recommendation Types
| Type | Algorithm | Refresh Rate |
|------|-----------|--------------|
| **Similar to Library** | Embedding similarity | Weekly |
| **Cited Together** | Co-citation analysis | Weekly |
| **Same Authors** | Author tracking | Real-time |
| **Extends Your Work** | Citation + semantic | Daily |
| **Missing Seminal** | Gap detection | On-demand |
| **Trending Now** | Citation velocity | Daily |
| **Newly Published** | Keyword matching | Real-time |

#### 5.3 Learning from Behavior
- Track which recommendations you accept
- Learn preferred topics, authors, journals
- Improve relevance score over time
- Personalize based on reading patterns

---

### 6. Proactive Draft Analysis

#### 6.1 Real-Time Writing Integration
```
┌─────────────────────────────────────────────────────────────────┐
│ ✍️ Draft Analysis                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Analyzing: "AI in Medical Imaging: A Review" (3,245 words)      │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ 📝 Your Draft Topics                    | 📚 Suggested Refs ││
│ ├─────────────────────────────────────────┼───────────────────┤│
│ │ Convolutional Neural Networks           | 12 papers         ││
│ │  └ Already cited: 8 | Missing key: 4    | [View]            ││
│ │                                         |                   ││
│ │ Transfer Learning                       | 8 papers          ││
│ │  └ Already cited: 3 | Missing key: 5    | [View]            ││
│ │                                         |                   ││
│ │ Data Augmentation                       | 6 papers          ││
│ │  └ Already cited: 0 | Missing key: 6    | ⚠️ [Add Refs]     ││
│ │                                         |                   ││
│ │ Explainable AI                          | 4 papers          ││
│ │  └ Not mentioned in draft               | 💡 [Suggest?]     ││
│ └─────────────────────────────────────────┴───────────────────┘│
│                                                                 │
│ Coverage Score: 72% (You're citing most key papers)             │
│                                                                 │
│ [Run Deep Analysis] [Export Citation Report] [Auto-Suggest]     │
└─────────────────────────────────────────────────────────────────┘
```

#### 6.2 Analysis Features
- **Topic Extraction**: Identify key topics in your draft
- **Citation Gap Detection**: Find uncited important papers
- **Coverage Score**: Percentage of key papers cited
- **Balance Check**: Are you over/under-citing certain areas?
- **Recency Check**: Are you citing recent work?
- **Self-Citation Alert**: Flag excessive self-citation

#### 6.3 Integration with Editor
- Highlight text → Get paper suggestions
- Auto-suggest citations as you type
- Inline paper previews
- One-click citation insertion

---

### 7. Research Frontier Detection

#### 7.1 Emerging Topics Dashboard
```
┌─────────────────────────────────────────────────────────────────┐
│ 🚀 Research Frontiers: "Medical AI"                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ 🔥 Hottest Topics (fastest growing)                         ││
│ ├─────────────────────────────────────────────────────────────┤│
│ │                                                             ││
│ │ 1. Foundation Models          ████████████████ +340%       ││
│ │    Papers: 234 | Key: SAM, MedSAM | Since: 2023            ││
│ │                                                             ││
│ │ 2. Vision-Language Models     ███████████████ +280%        ││
│ │    Papers: 189 | Key: MedCLIP, PubMedCLIP | Since: 2022    ││
│ │                                                             ││
│ │ 3. Federated Learning         ██████████████ +210%         ││
│ │    Papers: 156 | Key: Privacy-preserving | Since: 2020     ││
│ │                                                             ││
│ │ 4. Self-Supervised Learning   █████████████ +180%          ││
│ │    Papers: 145 | Key: Contrastive | Since: 2020            ││
│ │                                                             ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ 💡 Research Gaps (opportunities)                            ││
│ ├─────────────────────────────────────────────────────────────┤│
│ │ • Few papers on "Pediatric radiology + Deep Learning"      ││
│ │ • Under-explored: "Explainability in segmentation"         ││
│ │ • Emerging: "LLM-powered radiology reports" (only 12 papers)│
│ │ [Explore Gaps] [Show Underserved Areas]                     ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ 📉 Declining Topics (saturated/outdated)                    ││
│ ├─────────────────────────────────────────────────────────────┤│
│ │ • Hand-crafted features (-45% YoY)                         ││
│ │ • Basic CNN architectures (-30% YoY)                       ││
│ │ • Small dataset studies (-25% YoY)                         ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ Time Range: [1 Year ▼]   Domain: [Medical AI ▼]   [Export]     │
└─────────────────────────────────────────────────────────────────┘
```

#### 7.2 Frontier Metrics
| Metric | Description |
|--------|-------------|
| **Growth Rate** | Year-over-year publication increase |
| **Citation Velocity** | Rate of citation accumulation |
| **Author Influx** | New researchers entering the topic |
| **Industry Interest** | Corporate affiliations in papers |
| **Funding Mentions** | Grant acknowledgments |
| **Preprint Activity** | arXiv/bioRxiv submissions |

#### 7.3 Alerts and Notifications
- New paper in your tracked topics
- Highly-cited paper emerges in your field
- Your papers get cited
- Research gap closing (competition alert)
- Major author publishes new work

---

### 8. Author and Institution Networks

#### 8.1 Author Collaboration Graph
```
┌─────────────────────────────────────────────────────────────────┐
│ 👥 Author Network: "Geoffrey Hinton"                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    ┌─────────────┐                              │
│         ┌────────→│  Y. LeCun   │←────────┐                    │
│         │          │  (NYU/Meta) │         │                    │
│         │          └─────────────┘         │                    │
│    ┌────┴────┐                        ┌────┴────┐              │
│    │ Y. Bengio│                        │ A. Ng   │              │
│    │(Montreal)│                        │(Stanford)│             │
│    └────┬────┘                        └────┬────┘              │
│         │         ┌─────────────┐          │                    │
│         └────────→│ G. Hinton   │←─────────┘                   │
│                   │  (Toronto)  │                               │
│                   │  324 papers │                               │
│                   │  h-index: 89│                               │
│                   └──────┬──────┘                               │
│          ┌───────────────┼───────────────┐                     │
│          ▼               ▼               ▼                     │
│    ┌─────────┐    ┌─────────┐    ┌─────────┐                  │
│    │ I. Sutsk│    │ A. Krizhv│   │ S. Ioffe│                  │
│    │  ever   │    │   evsky  │    │  (Google)│                  │
│    └─────────┘    └─────────┘    └─────────┘                   │
│                                                                 │
│ Legend: ● Co-author  — Advisor/Advisee  ⋯ Collaborated once    │
│ Size = h-index   Color = Institution                           │
│                                                                 │
│ [Show Papers Together] [Institution View] [Timeline View]       │
└─────────────────────────────────────────────────────────────────┘
```

#### 8.2 Author Metrics
- **h-index**: Impact measure
- **Collaboration Breadth**: Number of unique co-authors
- **Publication Velocity**: Papers per year
- **Topic Evolution**: How their research shifts
- **Citation Network**: Who cites them

#### 8.3 Institution Networks
- Map research groups worldwide
- Track institutional collaborations
- Identify competing groups
- Find potential collaborators

---

### 9. Reference Manager Integration

#### 9.1 Import/Export
```
┌─────────────────────────────────────────────────────────────────┐
│ 📚 Library Sync                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Connected Accounts:                                              │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ ✓ Zotero         │ Synced: 342 papers │ [Refresh] [Settings]││
│ │ ✓ Mendeley       │ Synced: 156 papers │ [Refresh] [Settings]││
│ │ ○ EndNote        │ Not connected      │ [Connect]           ││
│ │ ○ Papers         │ Not connected      │ [Connect]           ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ Import Options:                                                  │
│ • [📄 BibTeX file]  • [📄 RIS file]  • [📄 EndNote XML]        │
│ • [🔗 DOI list]     • [🔗 PMID list] • [🔗 URL list]           │
│                                                                 │
│ Export Options:                                                  │
│ • [📄 BibTeX]  • [📄 RIS]  • [📄 CSV]  • [📄 JSON]             │
│                                                                 │
│ Sync Settings:                                                   │
│ ☑ Auto-sync every hour                                          │
│ ☑ Import new papers to "Imported" collection                    │
│ ☐ Two-way sync (push additions back to Zotero)                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 9.2 Integration Features
- **Two-Way Sync**: Changes in either system are synced
- **Smart Deduplication**: Detect and merge duplicates
- **Folder/Collection Mapping**: Mirror folder structure
- **Annotation Sync**: Sync highlights and notes
- **Tag Harmonization**: Unified tagging system

---

### 10. Multi-Source Academic Search

#### 10.1 Unified Search Interface
```
┌─────────────────────────────────────────────────────────────────┐
│ 🔍 Academic Search                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [deep learning medical imaging chest x-ray          ] [🔍]     │
│                                                                 │
│ Sources: ☑ PubMed  ☑ arXiv  ☑ Semantic Scholar                 │
│          ☑ CrossRef  ☑ Europe PMC  ☐ CORE                      │
│                                                                 │
│ Filters:                                                         │
│ Year: [2020 ▼] to [2024 ▼]    Type: [All ▼]                    │
│ Open Access: [Any ▼]           Citations: [> 10 ▼]             │
│                                                                 │
│ Results: 1,234 papers (deduplicated from 1,567)                 │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ 1. Deep Learning for Chest X-Ray Analysis: A Comprehensive ││
│ │    Review (Chen et al., 2024)                               ││
│ │    📊 234 citations | 📅 Jan 2024 | 🔓 Open Access          ││
│ │    Sources: PubMed, Semantic Scholar                        ││
│ │    [Add to Library] [Show Network] [Preview]                ││
│ ├─────────────────────────────────────────────────────────────┤│
│ │ 2. Vision Transformers in Medical Imaging (Wang, 2023)      ││
│ │    📊 567 citations | 📅 Mar 2023 | 🔒 Subscription          ││
│ │    Sources: arXiv, Semantic Scholar                         ││
│ │    [Add to Library] [Show Network] [Preview]                ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ Sort: [Relevance ▼] [Citations ▼] [Date ▼] [Title ▼]           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 10.2 Supported Sources
| Source | Type | Coverage | Unique Value |
|--------|------|----------|--------------|
| **PubMed** | Biomedical | 35M+ papers | Medical focus |
| **arXiv** | Preprints | 2M+ papers | Latest research |
| **Semantic Scholar** | All fields | 200M+ papers | Citation graphs |
| **CrossRef** | All fields | 130M+ papers | DOI metadata |
| **Europe PMC** | Biomedical | 43M+ papers | EU research |
| **CORE** | Open access | 200M+ papers | Full text access |

#### 10.3 Search Features
- **Semantic Search**: Natural language queries
- **Boolean Operators**: AND, OR, NOT
- **Field-Specific**: title:, author:, abstract:
- **Date Ranges**: Custom year filters
- **Citation Filters**: Minimum citation count
- **Deduplication**: Merge across sources

---

## User Interface Design

### Main Discovery View
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Connected Papers Discovery                                   [🔍] [⚙️] [👤] │
├────────────────────┬──────────────────────────────────────────┬─────────────┤
│                    │                                          │             │
│ 📚 My Collections  │ 🗺️ Citation Network                       │ 📋 Details  │
│                    │                                          │             │
│ ┌────────────────┐ │  ┌────────────────────────────────────┐ │ Paper:      │
│ │ Seed Papers    │ │  │                                    │ │ Chen 2024   │
│ │ ├─ Current (5) │ │  │     ○───●───○                      │ │             │
│ │ ├─ Review (12) │ │  │    /         \                     │ │ Citations:  │
│ │ └─ All (42)    │ │  │   ○     ★     ○                    │ │ 234         │
│ │                │ │  │    \   /|\   /                     │ │             │
│ │ 🔥 Recommended │ │  │     ○ ─●─ ○                        │ │ Published:  │
│ │ • Hot (8)      │ │  │      / | \                         │ │ Jan 2024    │
│ │ • Missing (5)  │ │  │     ○──●──○                        │ │             │
│ │ • New (12)     │ │  │                                    │ │ [📄 PDF]    │
│ │                │ │  │  ★ = Seed  ● = Related  ○ = Distant │ │ [➕ Add]    │
│ ├────────────────┤ │  │                                    │ │ [🔗 Cite]   │
│ │ Views          │ │  └────────────────────────────────────┘ │             │
│ │ [🗺️ Map]       │ │                                          │ Abstract:   │
│ │ [📅 Timeline]  │ │  Zoom: [−] [○] [+]  Layout: [Force ▼]   │ "This paper │
│ │ [👥 Authors]   │ │                                          │ presents..."│
│ │ [🔗 Connector] │ │  [🔍 Expand Selected] [📥 Export Graph]  │             │
│ └────────────────┘ │                                          │             │
│                    │                                          │             │
└────────────────────┴──────────────────────────────────────────┴─────────────┘
```

### Knowledge Map View
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🗺️ Knowledge Map: Medical AI                          [Export] [Share] [⚙️] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │                                                                         ││
│ │    ┌──────────────────┐                    ┌──────────────────┐        ││
│ │    │    DETECTION     │                    │   SEGMENTATION   │        ││
│ │    │     (2,341)      │                    │      (1,892)     │        ││
│ │    │                  │──────────────────→│                  │        ││
│ │    │  ○ ○ ● ○ ○      │                    │   ○ ● ○ ○ ○     │        ││
│ │    │   ○ ○ ○ ○       │                    │    ○ ○ ★ ○      │        ││
│ │    └────────┬─────────┘                    └────────┬─────────┘        ││
│ │             │                                       │                   ││
│ │             └───────────────┬───────────────────────┘                   ││
│ │                             ▼                                           ││
│ │                   ┌──────────────────┐                                  ││
│ │                   │   MULTI-TASK     │                                  ││
│ │                   │     (567)        │                                  ││
│ │                   │   ○ ● ○ ○       │                                  ││
│ │                   └──────────────────┘                                  ││
│ │                                                                         ││
│ │  ★ = Your Papers   ● = Key Papers   ○ = Related   Size = Paper Count   ││
│ │                                                                         ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ Clusters: [Show All] [Detection] [Segmentation] [Classification] [+3 more] │
│ Zoom: [Fit] [−] [+]   Depth: [1] [2] [●3] [4] [5]                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Technical Architecture

### Data Models

```typescript
// Core Paper Discovery Model
interface DiscoveredPaper {
  id: string;

  // Identity
  doi?: string;
  pmid?: string;
  arxivId?: string;
  semanticScholarId?: string;

  // Metadata
  title: string;
  authors: Author[];
  year: number;
  journal?: string;
  venue?: string;
  abstract?: string;

  // Metrics
  citationCount: number;
  influentialCitationCount?: number;
  referenceCount: number;

  // Discovery metadata
  sources: ('pubmed' | 'arxiv' | 'semanticscholar' | 'crossref' | 'europepmc' | 'core')[];
  openAccess: boolean;
  pdfUrl?: string;

  // Network metrics (computed)
  networkMetrics?: NetworkMetrics;

  // User state
  inLibrary: boolean;
  read: boolean;
  starred: boolean;
}

interface NetworkMetrics {
  centralityScore: number;    // 0-1
  bridgeScore: number;        // 0-1
  influenceScore: number;     // 0-1
  noveltyScore: number;       // 0-1
  momentumScore: number;      // Citation velocity
  clusterIds: string[];       // Which clusters it belongs to
}

// Citation Network
interface CitationNetwork {
  id: string;
  userId: string;
  name: string;

  seedPaperIds: string[];
  papers: NetworkPaper[];
  edges: NetworkEdge[];
  clusters: NetworkCluster[];

  config: NetworkConfig;
  layout: NetworkLayout;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface NetworkPaper {
  paperId: string;
  x: number;
  y: number;
  size: number;  // Based on citations
  color: string; // Based on year or cluster

  distanceFromSeed: number;
  connectionStrength: number;
}

interface NetworkEdge {
  source: string;
  target: string;
  type: 'cites' | 'cited_by' | 'co_citation' | 'bibliographic_coupling' | 'semantic';
  weight: number;
}

interface NetworkCluster {
  id: string;
  label: string;  // AI-generated
  keywords: string[];
  paperIds: string[];
  centerX: number;
  centerY: number;
  color: string;
}

interface NetworkConfig {
  algorithms: ('co_citation' | 'bibliographic_coupling' | 'semantic' | 'direct')[];
  depth: number;       // How many hops from seed
  maxPapers: number;   // Maximum papers to include
  minCitations: number;
  yearRange: { start: number; end: number };
  onlyOpenAccess: boolean;
}

interface NetworkLayout {
  type: 'force' | 'radial' | 'hierarchical' | 'timeline';
  parameters: Record<string, number>;
}

// Knowledge Map
interface KnowledgeMap {
  id: string;
  userId: string;
  name: string;
  query: string;

  clusters: MapCluster[];
  papers: MapPaper[];
  connections: ClusterConnection[];

  config: MapConfig;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface MapCluster {
  id: string;
  label: string;
  description: string;
  keywords: string[];
  paperCount: number;
  avgCitations: number;
  growth: number;  // YoY growth rate

  x: number;
  y: number;
  radius: number;
  color: string;
}

interface MapPaper {
  paperId: string;
  clusterId: string;
  x: number;
  y: number;
  isUserPaper: boolean;
  isKeyPaper: boolean;
}

interface ClusterConnection {
  sourceClusterId: string;
  targetClusterId: string;
  strength: number;
  type: 'citation_flow' | 'shared_keywords' | 'author_overlap';
}

interface MapConfig {
  clusterCount: number;  // Target number of clusters
  paperLimit: number;    // Max papers to display
  showLabels: boolean;
  showConnections: boolean;
  timeRange: { start: number; end: number };
}

// Research Timeline
interface ResearchTimeline {
  id: string;
  userId: string;
  topic: string;

  milestones: Milestone[];
  periods: TimePeriod[];
  papers: TimelinePaper[];
  trends: Trend[];

  config: TimelineConfig;

  createdAt: Timestamp;
}

interface Milestone {
  id: string;
  year: number;
  paperId?: string;
  label: string;
  description: string;
  type: 'breakthrough' | 'methodology' | 'dataset' | 'application';
}

interface TimePeriod {
  startYear: number;
  endYear: number;
  label: string;
  description: string;
  paperCount: number;
  keyTopics: string[];
}

interface TimelinePaper {
  paperId: string;
  year: number;
  x: number;  // Position on timeline
  importance: number;  // Size/prominence
  isSeminal: boolean;
}

interface Trend {
  topic: string;
  direction: 'rising' | 'stable' | 'declining';
  growthRate: number;
  startYear: number;
  papers: string[];
}

interface TimelineConfig {
  startYear: number;
  endYear: number;
  groupBy: 'year' | 'quarter' | 'era';
  showMilestones: boolean;
  showTrends: boolean;
}

// Literature Connector
interface LiteratureConnection {
  id: string;
  userId: string;

  sourcePaperId: string;
  targetPaperId: string;

  paths: ConnectionPath[];
  shortestPath: ConnectionPath;

  createdAt: Timestamp;
}

interface ConnectionPath {
  id: string;
  papers: string[];  // Paper IDs in order
  edges: PathEdge[];
  totalWeight: number;
  type: 'citation' | 'semantic' | 'author' | 'method';
}

interface PathEdge {
  source: string;
  target: string;
  type: 'cites' | 'cited_by' | 'co_citation' | 'semantic' | 'same_author';
  weight: number;
  explanation: string;
}

// Recommendations
interface Recommendations {
  userId: string;
  updatedAt: Timestamp;

  hotNow: Recommendation[];
  missingFromReview: Recommendation[];
  newThisWeek: Recommendation[];
  sameAuthors: Recommendation[];
  extendingWork: Recommendation[];
}

interface Recommendation {
  paperId: string;
  score: number;
  reason: string;
  type: 'hot' | 'missing' | 'new' | 'author' | 'extending' | 'trending';
  relatedPaperIds?: string[];  // Papers from library this relates to
}

// Draft Analysis
interface DraftAnalysis {
  id: string;
  userId: string;
  documentId: string;

  topics: ExtractedTopic[];
  citationGaps: CitationGap[];
  coverageScore: number;

  suggestions: DraftSuggestion[];

  analyzedAt: Timestamp;
}

interface ExtractedTopic {
  topic: string;
  mentions: number;
  citedPaperIds: string[];
  suggestedPaperIds: string[];
  coverage: number;  // 0-1
}

interface CitationGap {
  topic: string;
  missingPapers: DiscoveredPaper[];
  severity: 'low' | 'medium' | 'high';
  explanation: string;
}

interface DraftSuggestion {
  type: 'add_citation' | 'add_topic' | 'update_citation' | 'balance';
  paperId?: string;
  topic?: string;
  explanation: string;
  priority: number;
}

// Research Frontiers
interface ResearchFrontier {
  topic: string;
  papers: string[];

  metrics: FrontierMetrics;
  keyPapers: string[];
  keyAuthors: Author[];

  updatedAt: Timestamp;
}

interface FrontierMetrics {
  paperCount: number;
  growthRate: number;  // YoY percentage
  citationVelocity: number;
  authorInflux: number;
  recentPapers: number;  // Last 6 months
  preprints: number;
}

// User Preferences
interface DiscoveryPreferences {
  userId: string;

  trackedTopics: string[];
  trackedAuthors: string[];
  trackedJournals: string[];

  preferredSources: string[];
  excludedSources: string[];

  alertSettings: AlertSettings;

  learningHistory: LearningEvent[];
}

interface AlertSettings {
  newPaperInTopic: boolean;
  paperCitesLibrary: boolean;
  authorPublishes: boolean;
  trendingInField: boolean;

  frequency: 'instant' | 'daily' | 'weekly';
  email: boolean;
  inApp: boolean;
}

interface LearningEvent {
  type: 'accepted_recommendation' | 'rejected_recommendation' | 'added_paper' | 'read_paper';
  paperId: string;
  topic?: string;
  timestamp: Timestamp;
}

// Reference Manager Sync
interface RefManagerSync {
  userId: string;
  provider: 'zotero' | 'mendeley' | 'endnote' | 'papers';

  connected: boolean;
  lastSync: Timestamp;
  syncedPaperCount: number;

  settings: {
    autoSync: boolean;
    syncInterval: number;  // minutes
    twoWaySync: boolean;
    defaultCollection: string;
  };
}
```

### API Endpoints

```typescript
// Citation Networks
POST   /api/discovery/network              // Create network from seeds
GET    /api/discovery/network/:id          // Get network
PUT    /api/discovery/network/:id/expand   // Expand network
GET    /api/discovery/network/:id/export   // Export as JSON/GraphML

// Knowledge Maps
POST   /api/discovery/map                  // Create knowledge map
GET    /api/discovery/map/:id              // Get map
PUT    /api/discovery/map/:id/config       // Update map config

// Timeline
POST   /api/discovery/timeline             // Create timeline
GET    /api/discovery/timeline/:id         // Get timeline
GET    /api/discovery/timeline/:id/milestones // Get milestones

// Literature Connector
POST   /api/discovery/connect              // Find paths between papers
GET    /api/discovery/connect/:id          // Get connection details

// Recommendations
GET    /api/discovery/recommendations      // Get all recommendations
POST   /api/discovery/recommendations/refresh // Refresh recommendations
POST   /api/discovery/recommendations/feedback // Accept/reject

// Draft Analysis
POST   /api/discovery/analyze-draft        // Analyze current draft
GET    /api/discovery/analysis/:id         // Get analysis results

// Frontiers
GET    /api/discovery/frontiers            // Get research frontiers
GET    /api/discovery/frontiers/:topic     // Get specific frontier
GET    /api/discovery/gaps                 // Get research gaps

// Search
POST   /api/discovery/search               // Multi-source search
GET    /api/discovery/search/sources       // Available sources

// Reference Manager
POST   /api/discovery/sync/:provider/connect    // Connect provider
POST   /api/discovery/sync/:provider/sync       // Trigger sync
GET    /api/discovery/sync/:provider/status     // Sync status
DELETE /api/discovery/sync/:provider/disconnect // Disconnect

// Alerts
GET    /api/discovery/alerts               // Get user alerts
PUT    /api/discovery/alerts/settings      // Update alert settings
POST   /api/discovery/alerts/topics        // Add tracked topic
DELETE /api/discovery/alerts/topics/:id    // Remove tracked topic
```

---

## User Scenarios & Testing

### User Story 1 - Build Citation Network from Seed Paper (Priority: P0)

A researcher has a key paper and wants to explore related literature through citation relationships.

**Acceptance Scenarios**:

1. **Given** a seed paper DOI, **When** user creates a network, **Then** they see 50+ related papers visualized as an interactive graph with co-citation and bibliographic coupling relationships

2. **Given** a citation network, **When** user hovers over a node, **Then** they see paper title, authors, citation count, and connection strength to seed

3. **Given** a network, **When** user clicks "Expand", **Then** the network grows to include 2nd-degree connections with smooth animation

---

### User Story 2 - Explore Knowledge Map (Priority: P0)

A researcher wants to understand the landscape of a research topic and identify major themes.

**Acceptance Scenarios**:

1. **Given** a topic query, **When** knowledge map is generated, **Then** user sees 5-10 distinct clusters with AI-generated labels representing research themes

2. **Given** a knowledge map, **When** user clicks a cluster, **Then** they see the top 20 papers in that cluster with abstracts

3. **Given** a map, **When** user's library papers are plotted, **Then** they're highlighted with a star and their position shows research coverage

---

### User Story 3 - Find Path Between Papers (Priority: P1)

A researcher wants to understand how two seemingly unrelated papers connect through the literature.

**Acceptance Scenarios**:

1. **Given** two paper IDs, **When** user requests connection, **Then** system finds 1-5 shortest paths through citation/semantic links

2. **Given** a path, **When** user views it, **Then** each step shows explanation of why the papers are connected

3. **Given** path intermediates, **When** user clicks "Add All", **Then** all papers on the path are added to library

---

### User Story 4 - Receive Smart Recommendations (Priority: P0)

A researcher wants to discover papers relevant to their work without explicit searching.

**Acceptance Scenarios**:

1. **Given** a library with 20+ papers, **When** recommendations refresh, **Then** user sees 10+ relevant papers with explanations

2. **Given** their current draft, **When** user clicks "Missing from Review", **Then** they see highly-cited papers on their topics they haven't cited

3. **Given** a recommendation, **When** user clicks "Not Relevant", **Then** future recommendations learn from this feedback

---

### User Story 5 - Analyze Draft for Citation Gaps (Priority: P1)

A researcher wants to ensure their manuscript cites all important related work.

**Acceptance Scenarios**:

1. **Given** a 3000-word draft, **When** analysis runs, **Then** user sees extracted topics with coverage scores

2. **Given** an under-cited topic, **When** user clicks "View Suggestions", **Then** they see 5-10 highly-cited papers to consider

3. **Given** a suggestion, **When** user clicks "Add Citation", **Then** the paper is added to library and inserted into draft

---

### User Story 6 - Track Research Frontiers (Priority: P1)

A researcher wants to stay updated on emerging trends and find research opportunities.

**Acceptance Scenarios**:

1. **Given** a research domain, **When** user views frontiers, **Then** they see top 5 fastest-growing topics with growth metrics

2. **Given** frontier topics, **When** user subscribes, **Then** they receive alerts when new important papers are published

3. **Given** research gaps, **When** user views them, **Then** they see underexplored intersections representing opportunities

---

### User Story 7 - Sync with Reference Manager (Priority: P1)

A researcher wants to use their existing Zotero library as the basis for discovery.

**Acceptance Scenarios**:

1. **Given** Zotero credentials, **When** user connects, **Then** their library syncs within 2 minutes

2. **Given** a synced library, **When** user adds a paper in discovery, **Then** it appears in Zotero within the sync interval

3. **Given** collection structure, **When** imported, **Then** folders are mirrored as collections in our system

---

### User Story 8 - View Temporal Evolution (Priority: P2)

A researcher wants to understand how a research field has evolved over time.

**Acceptance Scenarios**:

1. **Given** a topic, **When** timeline is generated, **Then** user sees papers plotted on a timeline with breakthrough moments highlighted

2. **Given** a timeline, **When** user plays animation, **Then** papers appear chronologically showing field evolution

3. **Given** trend lines, **When** displayed, **Then** user sees which subtopics are rising or declining

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Seed paper has no citations | Use semantic similarity instead, explain limitation |
| Paper not in any database | Search all sources, suggest manual entry if not found |
| Citation data is incomplete | Show available data, flag potential gaps |
| Too many papers match query | Provide smart filters, show top 100 by relevance |
| Network is too dense to visualize | Cluster and show representative papers |
| Two papers have no path | Show this explicitly, suggest semantic connections |
| API rate limits exceeded | Queue requests, show progress indicator |
| Reference manager connection fails | Retry with exponential backoff, cache locally |
| Draft too short for analysis | Require minimum 500 words, suggest adding content |
| User has no library papers | Suggest seed papers, use topic-based recommendations |

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Network generation time | < 10 seconds for 100 papers |
| Knowledge map generation | < 20 seconds |
| Path finding time | < 5 seconds |
| Recommendation relevance (user rating) | > 80% rated relevant |
| Citation gap detection accuracy | > 90% |
| Reference manager sync time | < 2 minutes for 500 papers |
| User engagement with recommendations | > 30% clicked |
| Papers added via discovery | > 50% of library growth |

---

## Assumptions

- Users have access to at least one academic database
- Papers have DOIs or PMIDs for identification
- Citation data is available from Semantic Scholar API
- Users are authenticated
- Supabase is configured for storage

---

## Dependencies

- **Semantic Scholar API**: Citation graphs, paper metadata
- **PubMed API**: Biomedical papers
- **arXiv API**: Preprints
- **CrossRef API**: DOI resolution
- **OpenAlex API**: Alternative citation data
- **D3.js** or **vis-network**: Graph visualization
- **Supabase Postgres**: Data storage
- **Zotero API**: Reference manager integration
- **Mendeley API**: Reference manager integration

---

## Implementation Priority

### Phase 1 - Core Networks (Week 1-2)
- Citation network generation
- Basic graph visualization
- Paper search across sources
- Add to library functionality

### Phase 2 - Smart Discovery (Week 3-4)
- Recommendation engine
- Draft analysis
- Citation gap detection
- Learning from user behavior

### Phase 3 - Knowledge Maps (Week 5-6)
- Topic clustering
- Knowledge map visualization
- Cluster exploration
- Research landscape overview

### Phase 4 - Literature Connector (Week 7-8)
- Path finding algorithm
- Path visualization
- Connection explanations
- Multi-paper connections

### Phase 5 - Temporal Features (Week 9-10)
- Timeline generation
- Trend detection
- Research frontiers
- Evolution animation

### Phase 6 - Integrations (Week 11-12)
- Zotero sync
- Mendeley sync
- Alert system
- Export functionality

---

## Differentiators from Competition

| vs Competition | Our Advantage |
|----------------|---------------|
| vs Connected Papers | Multi-algorithm networks, knowledge maps, temporal view |
| vs ResearchRabbit | Deep draft integration, research frontiers, gap detection |
| vs Litmaps | Knowledge maps, literature connector, multi-source search |
| vs Citation Gecko | AI recommendations, draft analysis, author networks |
| vs Inciteful | Knowledge maps, temporal evolution, proactive suggestions |
| vs All | Fully integrated with writing workflow, learns from behavior |
