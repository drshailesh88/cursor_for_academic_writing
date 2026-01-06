# DocAssist Suite - Complete Engineering Overview

**Document Version:** 1.0
**Last Updated:** January 6, 2026
**Author:** Technical Documentation (AI-Assisted Development)
**Purpose:** Engineering Partnership Brief

---

## Executive Summary

DocAssist Suite is a collection of 5 AI-powered medical and healthcare applications built for clinicians, researchers, and healthcare professionals. The suite is designed with a "domain expert + AI" development model, where clinical domain expertise drives product decisions while AI assists with implementation.

### The Suite at a Glance

| App | Purpose | Stage | Architecture |
|-----|---------|-------|--------------|
| **Academic Writing** | AI-powered scholarly writing | 95% complete | Cloud (Vercel + Firebase) |
| **DocAssist EMR** | Electronic Medical Records | 80% complete | Local-first (SQLite) |
| **ECG Guru** | ECG interpretation training | 40% complete | Local-first |
| **Dora** | UpToDate alternative (clinical Q&A) | 50% complete | Cloud (RAG-based) |
| **Vaitin** | Appointment scheduling | 65% complete | Local-first |

---

## Table of Contents

1. [Vision & Strategy](#1-vision--strategy)
2. [Individual App Summaries](#2-individual-app-summaries)
3. [Infrastructure Strategy](#3-infrastructure-strategy)
4. [Cost Analysis & Projections](#4-cost-analysis--projections)
5. [Scaling Strategy](#5-scaling-strategy)
6. [Technical Decisions Explained](#6-technical-decisions-explained)
7. [Risk Assessment](#7-risk-assessment)
8. [Engineering Partnership Model](#8-engineering-partnership-model)

---

## 1. Vision & Strategy

### The Problem

Healthcare professionals spend excessive time on:
- **Documentation** - EMR data entry, notes, reports
- **Research** - Finding evidence, staying current
- **Education** - Learning, interpreting diagnostics
- **Administration** - Scheduling, coordination

### Our Solution

AI-augmented tools that respect clinical workflows while dramatically reducing cognitive load:

1. **Academic Writing Platform** - Write papers with AI research assistance
2. **DocAssist EMR** - Simplified, HIPAA-compliant patient records
3. **ECG Guru** - AI-assisted ECG learning and interpretation
4. **Dora** - Evidence-based clinical decision support
5. **Vaitin** - Intelligent appointment management

### Design Principles

1. **Domain-First** - Built by clinicians, for clinicians
2. **Privacy-Conscious** - Patient data stays local where possible
3. **AI-Augmented, Not AI-Replaced** - Assists decisions, doesn't make them
4. **Incrementally Adoptable** - Works standalone or integrated
5. **Cost-Efficient** - Sustainable pricing for individual practitioners

---

## 2. Individual App Summaries

### 2.1 Academic Writing Platform

**Status:** 95% Complete (Production-Ready)

**Purpose:** AI-powered academic writing for researchers and medical professionals

**Key Features:**
- Rich text editor with TipTap
- 14 LLM models (3 premium + 11 free via OpenRouter)
- Multi-database research (PubMed, arXiv, Semantic Scholar, OpenAlex)
- Citation management (10 CSL styles, BibTeX/RIS import)
- Writing analysis + AI detection + plagiarism detection
- Real-time collaboration (comments, versions, sharing)
- DOCX/PDF export with professional formatting

**Tech Stack:**
- Next.js 14 + TypeScript
- Firebase (Auth, Firestore, Storage)
- Vercel AI SDK
- TipTap Editor

**Current Metrics:**
- 168 TypeScript files
- 98 passing tests
- 50+ implemented features
- 0 TypeScript errors

**Detailed documentation:** See `docs/ENGINEERING_PARTNER_BRIEF.md`

---

### 2.2 DocAssist EMR

**Status:** 80% Complete (Most Mature)

**Purpose:** Simplified Electronic Medical Records for small practices

**Key Features:**
- Patient demographics and history
- Clinical notes with templates
- Medication management
- Lab results tracking
- Appointment scheduling integration
- Offline-first architecture

**Tech Stack:**
- Local-first (Electron or React Native)
- SQLite for data storage
- No cloud dependency for core functions
- Optional sync for backup

**Why Local-First:**
1. **HIPAA Simplicity** - No cloud = simpler compliance
2. **Zero Latency** - Instant access to patient data
3. **Offline Capable** - Works without internet
4. **Cost** - No per-user cloud costs

**Current Metrics:**
- 204 tests (most comprehensive)
- Spec-driven development complete
- Core CRUD operations functional

---

### 2.3 ECG Guru

**Status:** 40% Complete (Algorithms Done)

**Purpose:** AI-assisted ECG interpretation training and learning

**Key Features (Planned):**
- ECG image upload and analysis
- Measurement extraction (intervals, axis)
- Pattern recognition (arrhythmias, blocks, ischemia)
- Educational explanations
- Case library for practice

**Current State:**
- ECG algorithms implemented
- Pattern recognition logic complete
- **Missing:** Image → measurement pipeline
- **Missing:** User interface

**Next Steps:**
- Integrate image processing (OpenCV or cloud vision API)
- Build case library
- Create learning interface

---

### 2.4 Dora (UpToDate Alternative)

**Status:** 50% Complete (Engine Ready)

**Purpose:** AI-powered clinical decision support and evidence lookup

**Key Features (Planned):**
- Natural language clinical queries
- Evidence-based answers with citations
- Drug interaction checking
- Guideline summaries
- Differential diagnosis assistance

**Current State:**
- RAG engine built (same as Academic Writing)
- Hybrid retrieval (BM25 + dense embeddings)
- Reranking infrastructure
- **Missing:** Medical knowledge base content
- **Missing:** Clinical validation

**Critical Gap:**
The engine is ready but there's no curated medical content. Options:
1. License existing content (expensive)
2. Use open sources (PubMed, guidelines)
3. Partner with medical publishers

---

### 2.5 Vaitin

**Status:** 65% Complete

**Purpose:** Intelligent appointment scheduling for clinics

**Key Features:**
- Patient scheduling
- Provider availability management
- Appointment reminders
- Waitlist management
- Basic analytics

**Tech Stack:**
- Local-first architecture
- SQLite for scheduling data
- Optional cloud sync

**Current State:**
- Core scheduling logic complete
- UI components built
- Spec tracking outdated (implementation ahead of docs)

---

## 3. Infrastructure Strategy

### Current Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE DECISION TREE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    ┌─────────────────┐                          │
│                    │  Does app need  │                          │
│                    │  patient data?  │                          │
│                    └────────┬────────┘                          │
│                             │                                   │
│              ┌──────────────┴──────────────┐                    │
│              ↓                             ↓                    │
│       ┌──────────┐                  ┌──────────┐                │
│       │   YES    │                  │    NO    │                │
│       └────┬─────┘                  └────┬─────┘                │
│            │                             │                      │
│            ↓                             ↓                      │
│   ┌─────────────────┐          ┌─────────────────┐             │
│   │  LOCAL-FIRST    │          │     CLOUD       │             │
│   │  SQLite         │          │ Vercel+Firebase │             │
│   │  Zero cloud     │          │ Auto-scaling    │             │
│   └─────────────────┘          └─────────────────┘             │
│            │                             │                      │
│            ↓                             ↓                      │
│   EMR, ECG Guru, Vaitin       Academic Writing, Dora           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Why NOT AWS/GCP Now

| Concern | Why Vercel/Firebase is Better Now |
|---------|-----------------------------------|
| Setup time | 30 min vs 2-3 weeks |
| DevOps needed | None vs dedicated engineer |
| Cost at 1K users | $50/mo vs $100/mo + labor |
| Scaling | Automatic vs manual config |
| Learning curve | Hours vs months |

### When to Consider AWS/GCP

| Trigger | Implication |
|---------|-------------|
| 50K+ active users | Cost optimization becomes significant |
| HIPAA cloud requirement | Need specific compliance setup |
| Custom ML models | GPU infrastructure for training |
| Multi-region control | Specific data residency requirements |
| Enterprise SSO | SAML/advanced auth requirements |

### Migration Path

```
PHASE 1 (Now): Vercel + Firebase
├── All cloud apps deploy here
├── Automatic scaling, zero DevOps
└── Cost: $50-500/month for most scenarios

PHASE 2 (10K+ users): Hybrid
├── Keep Vercel for frontend/API
├── Add specific AWS services as needed:
│   ├── S3 for large file storage
│   ├── Lambda for long-running jobs
│   └── RDS if relational DB needed
└── Cost: $500-2K/month

PHASE 3 (50K+ users): Full Cloud
├── Consider AWS/GCP migration
├── ONLY if cost savings > DevOps cost
├── Evaluate: Vercel Enterprise vs raw AWS
└── Cost: $2K-10K/month + DevOps salary
```

---

## 4. Cost Analysis & Projections

### Infrastructure Costs by Scale

#### Academic Writing Platform (Cloud-Based)

| Users | Vercel | Firebase | LLM (Smart Routing) | Total |
|-------|--------|----------|---------------------|-------|
| 100 | $20 | $0 (free tier) | $50-150 | $70-170 |
| 1,000 | $20 | $50 | $500-1,500 | $570-1,570 |
| 10,000 | $50 | $200 | $2,000-5,000 | $2,250-5,250 |

#### EMR + Vaitin + ECG Guru (Local-First)

| Users | Infrastructure Cost | Notes |
|-------|---------------------|-------|
| 100 | ~$0 | Data on user devices |
| 1,000 | ~$0 | No cloud dependency |
| 10,000 | $50-200 | Optional sync/backup only |

#### Dora (Cloud + RAG)

| Users | Vercel | Firebase | LLM + Embeddings | Total |
|-------|--------|----------|------------------|-------|
| 100 | $20 | $25 | $100-300 | $145-345 |
| 1,000 | $20 | $100 | $500-1,500 | $620-1,620 |
| 10,000 | $100 | $500 | $2,000-5,000 | $2,600-5,600 |

### Total Suite Costs

| Scenario | Monthly Cost | Revenue Needed |
|----------|--------------|----------------|
| 1K users each app | $1,500-3,500 | $5K-10K |
| 10K users each app | $5,000-12,000 | $30K-50K |

### Revenue Model Options

**Per-App Pricing:**
| Plan | Academic Writing | EMR | Dora |
|------|------------------|-----|------|
| Free | 100K tokens | Read-only demo | 10 queries/day |
| Basic | $15/mo, 1M tokens | $29/mo | $19/mo |
| Pro | $39/mo, 5M tokens | $79/mo | $49/mo |
| BYOK | $10/mo, unlimited | N/A | $10/mo |

**Suite Bundle:**
- Full suite: $99/mo (vs $150+ individual)
- Practice plan: $199/mo (multi-user)
- Enterprise: Custom pricing

### Break-Even Analysis

```
Academic Writing Platform:
├── Fixed costs: ~$500/mo (Vercel + Firebase base)
├── Variable: ~$2/user/mo (LLM with smart routing)
├── Pricing: $15-39/mo
├── Break-even: ~50 paying users
└── Margin at 1K users: 70-80%

Local-First Apps (EMR, Vaitin, ECG):
├── Fixed costs: ~$100/mo (distribution, updates)
├── Variable: ~$0/user
├── Pricing: $29-79/mo
├── Break-even: ~5 paying users
└── Margin at 1K users: 95%+
```

---

## 5. Scaling Strategy

### Phase 1: Single Developer + AI (Current)

**Team:** 1 domain expert + AI assistance
**Capacity:** 0-1K users per app
**Focus:** Feature completion, validation

**Priorities:**
1. Complete core features
2. User testing with real workflows
3. Gather feedback
4. Iterate rapidly

### Phase 2: Small Team (1K-10K users)

**Team:** 1-3 engineers + domain expert
**New Roles:**
- Full-stack developer (code review, architecture)
- Part-time DevOps or managed services

**Infrastructure Changes:**
- Add monitoring (Sentry, LogRocket)
- Implement proper CI/CD
- Add staging environment
- Set up automated testing

### Phase 3: Growth (10K-50K users)

**Team:** 5-10 people
**New Roles:**
- Dedicated DevOps
- QA engineer
- Customer support
- Product manager

**Infrastructure Changes:**
- Consider AWS/GCP migration
- Multi-region deployment
- Advanced caching (Redis)
- CDN optimization
- Database optimization

### Phase 4: Scale (50K+ users)

**Team:** 15+ people
**New Functions:**
- Security team
- Data team
- Multiple product teams

**Infrastructure:**
- Full AWS/GCP setup
- Kubernetes for orchestration
- Data warehouse (analytics)
- Enterprise features (SSO, audit logs)

---

## 6. Technical Decisions Explained

### Why Firebase over Supabase?

| Factor | Firebase | Supabase |
|--------|----------|----------|
| Real-time | Native, excellent | Good, but PostgreSQL-based |
| Auth | Built-in, many providers | Good, but fewer options |
| Offline | First-class SDK support | Limited |
| Learning curve | Lower | Higher (SQL knowledge needed) |
| Scaling | Automatic | Manual configuration |

**Decision:** Firebase for rapid development and real-time features

### Why Local-First for EMR?

1. **HIPAA Simplicity** - Cloud PHI requires BAA, audit trails, encryption
2. **Latency** - Zero network latency for patient lookup
3. **Reliability** - Works during internet outages
4. **Cost** - No per-user cloud costs
5. **Privacy** - Patient data never leaves device

### Why Vercel over Self-Hosted?

| Factor | Vercel | Self-Hosted (AWS) |
|--------|--------|-------------------|
| Deploy time | 30 seconds | 30+ minutes |
| SSL/HTTPS | Automatic | Manual config |
| Scaling | Automatic | Manual or complex |
| Preview deploys | Built-in | DIY |
| Cost at low scale | $20/mo | $100+/mo |
| DevOps needed | None | Significant |

**Decision:** Vercel until hitting specific limits

### Why Multi-LLM Support?

1. **No vendor lock-in** - Switch if pricing changes
2. **Fallback** - If one provider is down, use another
3. **Cost optimization** - Use cheapest appropriate model
4. **User choice** - Power users can bring own keys

### Why OpenRouter for Free Models?

1. **Zero cost** for basic usage
2. **Same API** as OpenAI (easy integration)
3. **Multiple models** for different use cases
4. **Fallback** when premium keys unavailable

---

## 7. Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| API provider pricing change | Medium | High | Multi-provider support |
| Firebase scaling limits | Low | Medium | Migration path documented |
| Security vulnerability | Low | Critical | Regular audits, updates |
| Data loss | Low | Critical | Backups, version history |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| No product-market fit | Medium | Critical | User testing before scaling |
| Competition | High | Medium | Focus on niche (medical) |
| Regulatory changes | Low | High | Stay informed, adaptable |
| Key person dependency | High | High | Documentation, engineering partners |

### Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Single developer burnout | High | High | Engineering partnership |
| Tech debt accumulation | Medium | Medium | Code reviews, refactoring |
| Support overwhelm | Medium | Medium | Self-service docs, automation |

---

## 8. Engineering Partnership Model

### What We're Looking For

**Ideal Engineering Partner:**
- Experience with TypeScript/React/Next.js
- Familiarity with Firebase or similar
- Interest in healthcare/medical domain
- Comfortable with AI-assisted development
- Can commit 10-20 hours/week initially

### Partnership Structure Options

**Option A: Equity Partnership**
- Significant equity stake
- Part-time initially, full-time potential
- Shared decision-making
- Vesting schedule

**Option B: Contractor → Partner**
- Paid contract work initially
- Evaluate fit over 3-6 months
- Equity conversion option
- Lower initial risk for both sides

**Option C: Technical Advisory**
- 2-4 hours/week
- Code review, architecture guidance
- Small equity or advisory fee
- Path to deeper involvement

### What the Partner Gets

1. **Existing Codebase** - 5 apps, significant work done
2. **Clear Domain** - Medical/healthcare focus
3. **AI Acceleration** - AI-assisted development workflow
4. **Documentation** - Comprehensive technical docs
5. **Equity Upside** - Early stage = high potential

### What the Partner Provides

1. **Code Quality** - Reviews, best practices
2. **Architecture** - Scalability guidance
3. **Mentorship** - Help domain expert grow technically
4. **Stability** - Reduce key-person risk
5. **Credibility** - Technical validation for investors

### Transparency Commitment

Everything discussed in this document is available:
- Full codebase access
- All financial projections
- Honest assessment of what works/doesn't
- No hidden technical debt
- Clear roadmap and priorities

---

## Appendix A: Per-App Status Summary

| App | Code | Tests | Features | Docs | Ready |
|-----|------|-------|----------|------|-------|
| Academic Writing | 95% | 98 pass | 50+ | Excellent | Yes |
| DocAssist EMR | 80% | 204 pass | Core | Good | Mostly |
| ECG Guru | 40% | Limited | Algorithms | Basic | No |
| Dora | 50% | Shared | Engine | Basic | No |
| Vaitin | 65% | Limited | Core | Outdated | Mostly |

---

## Appendix B: Technology Comparison

### Our Stack vs Alternatives

| Component | Our Choice | Alternative | Why Ours |
|-----------|------------|-------------|----------|
| Framework | Next.js | Remix, SvelteKit | Best ecosystem |
| Database | Firebase | Supabase, MongoDB | Real-time, auth |
| Auth | Firebase Auth | Auth0, Clerk | Integrated |
| Editor | TipTap | Slate, ProseMirror | Extensions |
| AI SDK | Vercel AI | LangChain | Simpler, typed |
| Styling | Tailwind | CSS Modules | Speed |
| Deploy | Vercel | AWS, Netlify | Simplest |

---

## Appendix C: Questions for Engineering Partners

Please consider these before discussions:

1. **Interest Level** - Which app(s) interest you most?
2. **Time Commitment** - What's realistic for you?
3. **Compensation** - Equity, cash, or hybrid preference?
4. **Working Style** - Async heavy or sync meetings?
5. **Technical Focus** - Frontend, backend, or full-stack?
6. **Healthcare Interest** - Any medical/clinical background?
7. **AI Comfort** - Experience with AI-assisted development?
8. **Timeline** - When could you start contributing?

---

## Appendix D: Next Steps

### Immediate Priorities

1. **Academic Writing** - Deploy to production, get first users
2. **EMR** - Complete remaining features, pilot with clinic
3. **Find Engineering Partner** - This document as starting point
4. **User Validation** - Actually use apps for real work

### 30-Day Goals

- [ ] Academic Writing in production with 10 beta users
- [ ] EMR pilot with 1 practice
- [ ] 2-3 engineering partner conversations
- [ ] Cost tracking implemented

### 90-Day Goals

- [ ] 100 active users on Academic Writing
- [ ] Engineering partner onboarded
- [ ] EMR v1.0 release
- [ ] Dora content strategy defined

---

**This document represents the complete technical and business context for the DocAssist Suite.**

*All information is accurate as of January 6, 2026. The codebase is the source of truth for implementation details.*
