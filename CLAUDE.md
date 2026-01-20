# Claude Code Instructions

## 🚨 SESSION CONTINUITY PROTOCOL (READ FIRST!)

> **CRITICAL: If this is a new session, READ `handover.json` IMMEDIATELY before doing anything else.**
> This ensures you don't lose track of ongoing work like the character in Memento.

### How to Resume Work
```bash
# ALWAYS start every new session by:
1. Read handover.json - understand current state
2. Check "current_task" - what were we working on?
3. Check "next_steps" - what should happen next?
4. Check "issues" array - any open problems?
5. Check "validation_progress" - testing status
6. Update handover.json after EVERY major action
```

### State Files
- **`handover.json`** - Primary state persistence (JSON format)
- **`specs/TRACKING.md`** - Feature implementation tracking
- **`HANDOVER.md`** - Complete project documentation

### Update Protocol
After every significant action:
1. Update `handover.json` with current progress
2. Update `current_task` and `next_steps`
3. Log any issues found to `issues` array
4. Update `last_updated` timestamp
5. Take screenshots during browser testing

### Dev Server Constant
**ALWAYS use: `http://localhost:2550`** - This is the dev server URL for all testing.

---

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md

---

## 🛠️ MANDATORY Development Toolkits

> **CRITICAL: These toolkits MUST be used for ALL feature development in this project.**
> **Read this section FIRST before starting any new feature work.**

### Spec-Kit (Specification-Driven Development)
**Source:** https://github.com/github/spec-kit

Spec-Kit enables specification-driven development where specifications become executable. Use these slash commands for ALL feature development:

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/speckit.constitution` | Define project principles | Once per project, update as needed |
| `/speckit.specify` | Write requirements/user stories | Start of every new feature |
| `/speckit.clarify` | Address underspecified areas | When requirements are ambiguous |
| `/speckit.plan` | Create technical implementation strategy | After specification is approved |
| `/speckit.tasks` | Generate actionable task list | After plan is complete |
| `/speckit.implement` | Execute implementation | When ready to code |
| `/speckit.analyze` | Validate consistency across artifacts | After implementation |
| `/speckit.checklist` | Create quality validation checklist | Before marking feature complete |

**Workflow Order:** `specify` → `clarify` → `plan` → `tasks` → `implement` → `analyze` → `checklist`

### Ralph Wiggum (Iterative AI Development)
**Source:** https://github.com/anthropics/claude-code/tree/main/plugins/ralph-wiggum

Ralph Wiggum implements iterative AI development with continuous self-referential feedback loops. Use for complex implementations that benefit from autonomous refinement.

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/ralph-loop` | Start iterative development loop | Complex features with clear success criteria |
| `/cancel-ralph` | Stop active Ralph loop | When loop is complete or needs intervention |

**Best for:**
- Features with automated tests/linters for verification
- Multi-file refactoring
- Bug fixing with clear reproduction steps
- Implementation tasks with well-defined output criteria

**Not recommended for:**
- Tasks requiring human judgment
- UI/UX decisions
- One-shot simple operations

### Development Process (MUST FOLLOW)

```
1. NEW FEATURE REQUEST
   │
   ├─→ Create specs/{feature-name}/ directory
   │
   ├─→ Run /speckit.specify to create spec.md
   │
   ├─→ Run /speckit.clarify if requirements unclear
   │
   ├─→ Run /speckit.plan to create plan.md
   │
   ├─→ Run /speckit.tasks to create tasks.md
   │
   ├─→ For complex implementation:
   │   └─→ Use /ralph-loop with clear completion criteria
   │
   ├─→ Run /speckit.implement for straightforward tasks
   │
   ├─→ Run /speckit.analyze to validate consistency
   │
   └─→ Run /speckit.checklist for QA validation
```

### Feature Specification Structure

All features MUST have a directory in `specs/` with:
```
specs/{feature-id}-{feature-name}/
├── spec.md      # Requirements and user stories
├── plan.md      # Technical implementation strategy
└── tasks.md     # Actionable task list
```

**REMEMBER:** Always use these toolkits. They ensure consistent, high-quality development and prevent context loss across sessions.

---

## 🎯 Project Overview

**Academic Writing Platform** - AI-powered academic writing system with PubMed research integration, multi-LLM support, and professional document export capabilities.

**Current Status:** Firebase integration complete, export features pending
**Tech Stack:** Next.js 14, TypeScript, TipTap Editor, Firebase, Vercel AI SDK
**Port:** 2550

---

## 📚 Essential Documentation

Before making changes, review:
- `README.md` - Project overview and setup
- `HANDOVER.md` - Complete implementation status and architecture
- `FIREBASE_SETUP.md` - Firebase configuration guide

---

## 🏗️ Architecture Principles

### Core Philosophy
1. **Academic Excellence** - Authentic scholarly prose, not corporate marketing speak
2. **Citation Integrity** - Proper author-year citations, PubMed integration
3. **Multi-LLM Flexibility** - Support OpenAI, Anthropic, Google, OpenRouter, xAI
4. **Firebase-First** - Real-time sync, auto-save, user authentication
5. **Professional Export** - DOCX and PDF with proper formatting

### Key Patterns
- **Auto-save:** 30-second debounced saves to Firestore
- **Three-panel layout:** Document list | Editor | AI Chat
- **Client-side Firebase:** Real-time updates and auth
- **Server-side Admin SDK:** For future server operations

---

## 💻 Coding Standards

### TypeScript
- Strict mode enabled
- No `any` types - use proper type definitions
- Interfaces for props, types for data structures
- Import types from `@/lib/firebase/schema`

### File Naming
- Components: `kebab-case.tsx`
- Hooks: `use-kebab-case.ts`
- Utils: `kebab-case.ts`
- All lowercase, hyphen-separated

### Component Structure
```typescript
'use client'; // Only if uses hooks/state

// Imports: external → firebase → components → types
import { useState } from 'react';
import { useAuth } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/button';
import { Document } from '@/lib/firebase/schema';

interface ComponentProps {
  // Props with JSDoc if complex
}

export function ComponentName({ props }: ComponentProps) {
  // 1. Hooks first
  // 2. Effects
  // 3. Event handlers
  // 4. Early returns
  // 5. Main render
}
```

### Import Order
```typescript
// 1. React/Next
import { useState, useEffect } from 'react';

// 2. External libraries
import { Editor } from '@tiptap/react';

// 3. Firebase/lib
import { useAuth } from '@/lib/firebase/auth';

// 4. Components
import { Button } from '@/components/ui/button';

// 5. Types
import { Document } from '@/lib/firebase/schema';
```

---

## ✍️ Writing Style (Academic Prose)

### Tone: Eric Topol-inspired
- **Conversational yet authoritative** - Like a mentor explaining to a colleague
- **Data-driven but accessible** - Cite studies naturally: "A 2023 meta-analysis (Smith et al.) found..."
- **Cautiously optimistic** - "Early evidence suggests..." not "Revolutionary breakthrough!"
- **Nuanced** - Acknowledge limitations and conflicting data

### Avoid
- ❌ Marketing speak: "game-changing," "revolutionary," "breakthrough"
- ❌ Absolute claims: "proves," "definitively shows," "always"
- ❌ Passive voice overuse: "It was found that..." → "Researchers found..."
- ❌ Jargon without explanation

### Prefer
- ✅ Active voice: "The study demonstrated..."
- ✅ Precise language: "increased by 23%" not "greatly increased"
- ✅ Natural citations: "Recent work by Zhang and colleagues (2024) indicates..."
- ✅ Clear transitions: "However," "Moreover," "In contrast,"

### Example Transformation
**Before (Marketing):**
> This groundbreaking AI technology revolutionizes medical diagnosis with unprecedented accuracy!

**After (Academic):**
> Recent advances in deep learning architectures have shown promise in medical image classification. A 2024 study (Chen et al.) reported 94% diagnostic accuracy on chest X-rays, though validation across diverse populations remains necessary.

---

## 🔧 Common Tasks

### Adding a New Feature
1. Check `HANDOVER.md` for existing architecture
2. Create feature branch if using git
3. Update types in `lib/firebase/schema.ts` if needed
4. Implement component in appropriate directory
5. Test with Firebase (sign in, save, load)
6. Update `HANDOVER.md` with changes

### Working with Firebase
- Client SDK: `lib/firebase/client.ts`
- Admin SDK: `lib/firebase/admin.ts`
- Auth: `lib/firebase/auth.ts`
- Documents: `lib/firebase/documents.ts`
- Schema: `lib/firebase/schema.ts`

### Testing Changes
```bash
npm run dev          # Start dev server on localhost:2550
npm run build        # Check for TypeScript errors
npm run type-check   # Type checking only
```

---

## 🔒 GIT WORKFLOW - COMPLETE HAND-HOLDING GUIDE

> **CRITICAL: Follow this EVERY time you make changes. This protects your work and prevents breaking things.**
> **Read this section carefully - it's your safety net!**

### 🎯 When to Use Git (Simple Rules)

**Use Git in these situations:**
1. ✅ Before starting any new feature or improvement
2. ✅ After completing a working feature (even if small)
3. ✅ Before trying something experimental that might break things
4. ✅ At the end of each coding session
5. ✅ When the app is working and you want to "lock in" that state

**DON'T use Git:**
- ❌ In the middle of writing code (wait until feature works)
- ❌ When things are broken (fix first, then commit)
- ❌ Multiple times per hour (batch related changes)

---

### 📖 Git Basics (No Prior Knowledge Required)

**What is Git?**
- Git = Time machine for your code
- It saves snapshots of your code at different points
- You can go back to any previous snapshot if something breaks

**Key Concepts:**
- **Repository (repo)** = Your project folder with Git enabled
- **Commit** = A saved snapshot of your code
- **Branch** = A separate timeline/version of your code
- **Main branch** = The "official" version of your code
- **Backup branch** = A safety copy you can always return to
- **Remote (origin)** = Your code stored on GitHub (cloud backup)
- **Push** = Upload your commits to GitHub
- **Pull** = Download commits from GitHub
- **Merge** = Combine changes from two branches

---

### 🛡️ SAFETY-FIRST WORKFLOW (Follow Every Time)

#### **STEP 1: Check Current Status (ALWAYS DO THIS FIRST)**

```bash
# See what files you changed
git status

# See what changes you made line-by-line
git diff

# See what branch you're on
git branch --show-current
```

**What to look for:**
- Red files = Changed but not saved to Git yet
- Green files = Saved to Git, ready to commit
- Branch name = Make sure you're on `main` or a feature branch

---

#### **STEP 2: Create a Safety Backup Branch**

**BEFORE making any changes, create a backup:**

```bash
# This creates a timestamped backup of your current state
git checkout -b backup/before-[feature-name]-$(date +%Y%m%d)

# Example: backup/before-new-export-feature-20260106
```

**Why?** If you mess up, you can always return to this backup.

**Commit the backup:**
```bash
git add -A
git commit -m "backup: Working state before [feature-name]"
git checkout main
```

---

#### **STEP 3: Create a Feature Branch (Work Here, Not on Main)**

```bash
# Create and switch to a new feature branch
git checkout -b feature/[short-description]

# Examples:
# git checkout -b feature/add-export-button
# git checkout -b feature/fix-chat-error
# git checkout -b feature/improve-styling
```

**Why?** Working on a branch keeps `main` safe. If you break something, `main` is still clean.

---

#### **STEP 4: Make Your Changes**

- Work on your feature
- Test thoroughly
- Make sure everything works BEFORE committing

---

#### **STEP 5: Save Your Work (Commit)**

```bash
# See what you changed
git status
git diff

# Add all changed files
git add -A

# Create a commit with a clear message
git commit -m "feat: [what you added]"

# OR for fixes:
git commit -m "fix: [what you fixed]"

# OR for improvements:
git commit -m "improve: [what you improved]"
```

**Good commit messages:**
- ✅ "feat: Add DOCX export button to toolbar"
- ✅ "fix: Resolve chat API error handling"
- ✅ "improve: Better error messages for missing API keys"

**Bad commit messages:**
- ❌ "changes"
- ❌ "update"
- ❌ "wip"

---

#### **STEP 6: Test That Everything Still Works**

```bash
# Start the dev server
npm run dev

# Check for TypeScript errors
npm run type-check

# Test in browser
# Go to http://localhost:2550 and test your feature
```

**If something is broken:** Fix it before proceeding!

---

#### **STEP 7: Merge Your Feature Branch into Main**

**Only do this if everything works!**

```bash
# Switch to main
git checkout main

# Merge your feature branch
git merge feature/[your-feature-name]

# If there are conflicts, DON'T PANIC:
# 1. Open the conflicting files in your editor
# 2. Look for <<<<<<< and >>>>>>>
# 3. Decide which version to keep
# 4. Remove the conflict markers
# 5. git add [fixed-files]
# 6. git commit -m "merge: Resolved conflicts in [files]"
```

---

#### **STEP 8: Push to GitHub (Cloud Backup)**

```bash
# Upload your changes to GitHub
git push origin main

# If it's your first push of a new branch:
git push -u origin main
```

**Why?** This backs up your code to the cloud. If your computer dies, your code is safe.

---

#### **STEP 9: Clean Up Old Branches (Optional)**

```bash
# Delete the feature branch (only after merging to main!)
git branch -d feature/[your-feature-name]

# Keep backup branches - never delete them!
```

---

### 🆘 EMERGENCY PROCEDURES

#### **"Oh no, I broke everything!"**

**Option 1: Undo your last commit (keep the changes)**
```bash
git reset --soft HEAD~1
# This undoes the commit but keeps your changes
# Fix the issues, then commit again
```

**Option 2: Abandon all changes and go back to last commit**
```bash
# WARNING: This deletes ALL changes since last commit!
git reset --hard HEAD

# If you want to go back to a specific commit:
git log --oneline  # Find the commit hash
git reset --hard [commit-hash]
```

**Option 3: Return to a backup branch**
```bash
# See all backup branches
git branch | grep backup

# Switch to a backup
git checkout backup/[name]

# Copy the backup to main
git checkout -b temp-recovery
git checkout main
git reset --hard temp-recovery
```

---

#### **"I committed to the wrong branch!"**

```bash
# 1. Copy the commit hash
git log --oneline -1  # Copy the hash (first 7 characters)

# 2. Switch to the correct branch
git checkout [correct-branch]

# 3. Apply the commit here
git cherry-pick [commit-hash]

# 4. Go back and remove it from wrong branch
git checkout [wrong-branch]
git reset --hard HEAD~1
```

---

#### **"I need to see what changed between versions"**

```bash
# Compare two commits
git diff [commit1-hash] [commit2-hash]

# Compare your current state to a commit
git diff [commit-hash]

# Compare two branches
git diff main..feature/my-feature
```

---

#### **"I want to see the history"**

```bash
# Simple one-line history
git log --oneline -10

# Visual branching history
git log --oneline --all --graph -20

# See commits from a specific person
git log --author="Shailesh"
```

---

### 📅 DAILY WORKFLOW CHECKLIST

**Start of day:**
```bash
☐ git status                    # See what's changed
☐ git pull origin main          # Get latest from GitHub
☐ npm run dev                   # Start dev server, test it works
☐ git checkout -b backup/today-$(date +%Y%m%d)  # Create daily backup
☐ git add -A && git commit -m "backup: Start of day $(date)"
☐ git checkout main
```

**When starting a new feature:**
```bash
☐ git status                                    # Check current state
☐ git checkout main                             # Start from main
☐ git checkout -b feature/[description]         # Create feature branch
☐ [Work on feature]
☐ npm run dev                                   # Test it works
```

**When feature is complete and working:**
```bash
☐ git status                                    # Review changes
☐ git add -A                                    # Stage all changes
☐ git commit -m "feat: [description]"           # Commit with message
☐ git checkout main                             # Switch to main
☐ git merge feature/[name]                      # Merge feature
☐ npm run dev                                   # Test merged code
☐ git push origin main                          # Backup to GitHub
☐ git branch -d feature/[name]                  # Delete feature branch
```

**End of day:**
```bash
☐ git status                    # Make sure everything is committed
☐ git push origin main          # Final backup to GitHub
☐ npm run dev                   # Final test that everything works
```

---

### 🎓 LEARNING RESOURCES

**When you want to learn more:**
- Git basics: https://git-scm.com/book/en/v2/Getting-Started-What-is-Git%3F
- Visual Git guide: https://marklodato.github.io/visual-git-guide/index-en.html
- GitHub flow: https://guides.github.com/introduction/flow/

**Don't overwhelm yourself!** Follow the workflows above for now. Learn more as you need it.

---

### 🤖 ASKING CLAUDE FOR HELP

**Always tell me:**
1. "Show me git status" - I'll run it and explain what I see
2. "I want to start a new feature called [name]" - I'll guide you through creating a branch
3. "I'm done with this feature, help me commit and merge" - I'll walk you through it
4. "Something broke, help me go back" - I'll help you recover
5. "I don't understand [git concept]" - I'll explain it simply

**I will ALWAYS:**
- ✅ Create backup branches before making changes
- ✅ Explain every Git command before running it
- ✅ Test that everything works after changes
- ✅ Ask for your confirmation before destructive operations
- ✅ Provide step-by-step guidance

**I will NEVER:**
- ❌ Delete your code without your permission
- ❌ Force-push to overwrite history without warning
- ❌ Merge without testing first
- ❌ Commit broken code

---

### 🎯 GIT BEST PRACTICES FOR THIS PROJECT

**Branch naming:**
- `feature/[name]` - New features
- `fix/[name]` - Bug fixes
- `improve/[name]` - Improvements to existing features
- `backup/[name]-[date]` - Safety backups

**Commit frequency:**
- ✅ Commit when a feature/fix is complete and working
- ✅ Commit at end of coding session
- ❌ Don't commit every 5 minutes
- ❌ Don't commit broken code

**What to commit:**
- ✅ Source code files (.ts, .tsx, .css, etc.)
- ✅ Configuration files (tsconfig.json, package.json, etc.)
- ✅ Documentation (README.md, HANDOVER.md, etc.)
- ❌ NEVER commit .env.local (contains API keys!)
- ❌ NEVER commit node_modules/ (huge, regenerated from package.json)
- ❌ NEVER commit .next/ (build output, regenerated)

---

### 🔐 PROTECTIVE MEASURES (Already Set Up)

**These protect you automatically:**
1. `.gitignore` - Prevents committing sensitive files
2. `.env.local` - Never committed (contains API keys)
3. `node_modules/` - Never committed (huge dependency folder)
4. `.next/` - Never committed (build output)

**Check your .gitignore:**
```bash
cat .gitignore
# Should include: .env.local, node_modules, .next, etc.
```

---

**Last Updated:** January 6, 2026
**Your Git Safety Net:** I will guide you through EVERY step!

---

## 🚨 Critical Rules

### Security
- **NEVER commit `.env.local`** - Contains API keys
- **NEVER hardcode secrets** - Always use environment variables
- Validate user input before Firestore writes
- Use Firebase security rules (already configured)

### Performance
- Debounce auto-save (current: 30 seconds)
- Use React.memo for expensive components
- Lazy load components where appropriate
- Optimize Firestore queries (use indexes)

### Firebase Best Practices
- **Client-side:** Auth, real-time listeners, user operations
- **Server-side:** Batch operations, admin tasks, sensitive data
- Always include error handling for Firebase operations
- Use transactions for critical updates

---

## 📋 Current Priorities (as of Dec 2025)

### Completed ✅
- TipTap editor with table support
- Firebase auth (Google Sign-in)
- Document CRUD operations
- Auto-save (30-second interval)
- AI chat with 4 models
- PubMed integration
- Three-panel resizable layout

### In Progress ⏳
- DOCX export (`lib/export/docx.ts`)
- PDF export (`lib/export/pdf.ts`)

### Pending 📌
- Export button component
- Additional auth providers (email/password)
- Collaborative editing
- Citation manager UI
- Advanced formatting options

---

## 🔍 Debugging

### Common Issues
1. **Firebase errors on load**
   - Check `.env.local` has all Firebase variables
   - Verify Firebase project is active
   - Check console for specific error

2. **Auto-save not working**
   - Check `useDocument` hook is properly initialized
   - Verify user is authenticated
   - Check Firestore permissions

3. **AI chat not responding**
   - Verify API key in `.env.local`
   - Check `/api/chat/route.ts` for errors
   - Ensure model is available

### Useful Commands
```bash
# Check Firebase connection
npm run dev | grep -i firebase

# Type check without building
npx tsc --noEmit

# View logs
tail -f .next/trace
```

---

## 🎨 UI/UX Guidelines

### Theme
- **Colors:** Deep purple (academic), warm gray (text), scholarly gold (accents)
- **Typography:** Inter for UI, Georgia/serif for editor content
- **Spacing:** Consistent 8px grid
- **Dark mode:** Full support required

### Components
- Use shadcn/ui components as base
- Custom academic theme overrides in `app/globals.css`
- Resizable panels via `react-resizable-panels`
- Icons from `lucide-react`

### Accessibility
- Semantic HTML
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus visible states

---

## 🤝 Working with Other LLMs

This project supports work with multiple AI assistants:
- **Claude** (you!) - Main development and writing
- **Gemini** - Alternative development, research queries
- **Codex/Copilot** - Code completion and suggestions
- **ChatGPT** - Research and content generation

**See also:**
- `GEMINI.md` for Gemini-specific instructions
- `AGENTS.md` for universal AI agent guidelines

---

## 📝 Notes

- Always read existing code before modifying
- Prefer editing over creating new files
- Keep solutions simple and focused
- Don't over-engineer or add unnecessary features
- Document significant architectural decisions
- Update `HANDOVER.md` after major changes

---

---

## 🧪 BROWSER AUTOMATION TESTING PROTOCOL

### Tool: Vercel Agent Browser CLI
The project uses Vercel Agent Browser CLI for browser automation testing.

### CLI Commands Reference
```bash
agent-browser open <url>              # Open browser session, returns session_id
agent-browser snapshot <session_id>   # Take page snapshot with element refs
agent-browser click <session_id> <ref> # Click element by reference
agent-browser type <session_id> <ref> <text> # Type into form field
agent-browser screenshot <session_id> <path>  # Save screenshot
agent-browser scroll <session_id> <direction> <amount>
agent-browser close <session_id>      # Close session
```

### Testing Workflow
1. **Site Mapping** - Navigate to all pages, take snapshots, catalog elements
2. **Functional Testing** - Click all buttons, fill all forms, verify API responses
3. **Regression Testing** - Re-test after fixes to ensure no breaks
4. **Edge Cases** - Test invalid inputs, responsive views, error states

### Screenshot Naming Convention
```
screenshots/[category]_[action]_[result].png
# Examples:
screenshots/auth_login_success.png
screenshots/chat_message_sent.png
screenshots/export_docx_download.png
```

### Validation Categories
- Authentication (Google Sign-in, auth guard)
- Document CRUD (create, read, update, delete)
- Editor Features (formatting, tables, shortcuts)
- AI Chat (model selection, messages, research tools)
- Research Tools (PubMed, arXiv, Semantic Scholar, OpenAlex)
- Citations (insert, bibliography, styles)
- Writing Analysis (readability, style, AI detection)
- Export (DOCX, PDF)
- Collaboration (comments, versions, sharing, track changes)
- Presentations (generate, edit, export)

---

## 🔄 RALPH LOOP PROTOCOL

For iterative fixing, use the Ralph Loop methodology:

```bash
/ralph-loop "Fix all issues found during validation:
1. Read handover.json for current issues
2. Prioritize by severity (critical → edge cases)
3. Use TDD: write test → implement fix → verify
4. Run browser validation after each fix
5. Update handover.json with progress
6. Continue until all issues resolved
Output <promise>DONE</promise> when complete."
--completion-promise "DONE" --max-iterations 50
```

---

**Last Updated:** January 19, 2026
**Project Location:** `/Users/shaileshsingh/cursor for academic writing`
**Maintained by:** Dr. Shailesh
