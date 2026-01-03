# Academic Writing Platform Constitution

## Core Principles

### I. Academic Excellence First
Every feature must enhance authentic scholarly prose and research integrity. No marketing speak, no corporate jargon. Write like Eric Topol - conversational yet authoritative, data-driven but accessible, cautiously optimistic, and always nuanced.

### II. Citation Integrity
All research features must maintain proper author-year citations (Smith et al., 2023) and integrate with PubMed. Citations must be verifiable and traceable to their sources.

### III. Multi-LLM Flexibility
Support multiple AI providers (OpenAI, Anthropic, Google, OpenRouter, xAI). Users should be able to choose their preferred model for any AI-assisted task.

### IV. Firebase-First Architecture
- Client-side: Real-time sync, authentication, user operations
- Server-side: Batch operations, admin tasks, sensitive data
- Auto-save with debouncing (30-second intervals)
- User data isolation via security rules

### V. Professional Export Standards
Documents must export to DOCX and PDF with proper academic formatting - correct headings, citations, tables, and reference lists.

### VI. Simplicity Over Complexity
- Avoid over-engineering; only make changes directly requested
- Don't add features beyond what was asked
- Keep solutions focused and minimal
- Delete unused code completely

## Technology Constraints

### Required Stack
- **Framework**: Next.js 14 (App Router) with TypeScript (strict mode)
- **Editor**: TipTap with table support
- **Database**: Firebase Firestore + Auth
- **AI Integration**: Vercel AI SDK with streaming
- **Port**: 2550

### Code Standards
- No `any` types - use proper type definitions
- File naming: kebab-case.tsx for components
- Import order: React → External → Firebase → Components → Types
- All Firebase operations must include error handling

### Security Requirements
- Never commit `.env.local` or hardcode secrets
- Validate all user input before Firestore writes
- Use Firebase security rules for data isolation
- OWASP Top 10 vulnerability awareness

## Quality Gates

### Before Any Feature is Complete
1. TypeScript compiles without errors (`npx tsc --noEmit`)
2. Build succeeds (`npm run build`)
3. Firebase operations work with real authentication
4. Auto-save functions correctly
5. UI follows three-panel layout principles

### Writing Quality Standards
- Active voice preferred
- Precise language with specific data
- Natural citation integration
- Clear transitions between ideas
- No absolute claims or marketing hyperbole

## Governance

This constitution supersedes default behaviors. All AI agents working on this project must:
1. Read HANDOVER.md before making changes
2. Follow existing code patterns
3. Update HANDOVER.md after significant changes
4. Test with Firebase before considering work complete

**Version**: 1.0.0 | **Ratified**: 2026-01-03 | **Last Amended**: 2026-01-03
