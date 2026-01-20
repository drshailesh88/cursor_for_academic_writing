# End-User Testing Session - Academic Writing Platform

## Session Directive
**Role**: End-user (researcher/academic) testing all features by writing real content
**Tools**: Vercel Agent Browser (`agent-browser`) + Ralph Loop (`/ralph-loop`)
**Goal**: Find and fix all broken features through actual usage

## Testing Personas & Manuscripts

### Persona 1: Dr. Sarah Chen - Biomedical Researcher
- **Project**: Systematic review on SGLT2 inhibitors in heart failure
- **Tests**: PubMed search, citation management, APA formatting
- **Discipline**: Clinical Medicine

### Persona 2: Prof. Alex Kumar - Computer Scientist
- **Project**: Survey paper on transformer architectures in NLP
- **Tests**: arXiv search, code snippets, IEEE formatting
- **Discipline**: Computer Science

### Persona 3: Dr. Maria Santos - Environmental Scientist
- **Project**: Climate change impact on marine ecosystems
- **Tests**: Cross-database search, figures, Vancouver style
- **Discipline**: Environmental Science

### Persona 4: Dr. James Wright - Economist
- **Project**: Analysis of monetary policy effects on inflation
- **Tests**: Data visualization, economic citations
- **Discipline**: Economics

---

## Feature Testing Checklist

### Core Editor Features
- [ ] Create new document from template
- [ ] Type and format text (bold, italic, headers)
- [ ] Insert tables
- [ ] Auto-save working
- [ ] Load existing document

### AI Chat Features
- [ ] Send message and receive response
- [ ] Model selection works (Claude, GPT-4, Gemini, GLM-4.7)
- [ ] Discipline-specific responses
- [ ] Insert AI response into editor
- [ ] Copy AI response

### Research Features
- [ ] PubMed search via chat
- [ ] arXiv search via chat
- [ ] Semantic Scholar search
- [ ] OpenAlex search
- [ ] Deep Research mode
- [ ] Research results display

### Citation Management
- [ ] Add citation from search results
- [ ] Citation dialog opens (Cmd+Shift+P)
- [ ] Insert inline citation
- [ ] Generate bibliography
- [ ] Multiple citation styles (APA, Vancouver, IEEE)

### Paper Library
- [ ] Upload PDF
- [ ] View paper list
- [ ] Search papers
- [ ] Paper details view

### Export Features
- [ ] Export to DOCX
- [ ] Export to PDF
- [ ] Proper formatting preserved

### Collaboration
- [ ] Share document
- [ ] Set permissions

### Presentations
- [ ] Generate slides from document
- [ ] Presentation mode

---

## Current Session Status

### Session Started: 2026-01-19
### Current Persona: (starting fresh)
### Issues Found: (to be populated)
### Issues Fixed: (to be populated)

---

## Browser Automation Commands

```bash
# Start session
agent-browser --session academic-test --headed open http://localhost:2550

# Take snapshot (see all elements)
agent-browser --session academic-test snapshot

# Click element
agent-browser --session academic-test click @refNumber

# Type text
agent-browser --session academic-test type @refNumber "text here"

# Screenshot
agent-browser --session academic-test screenshot ./screenshots/test.png

# Console logs
agent-browser --session academic-test console

# Scroll
agent-browser --session academic-test scroll down
```

---

## Issue Log

| ID | Feature | Issue Description | Status | Fix Applied |
|----|---------|-------------------|--------|-------------|
| 1  | Auth | Google OAuth popup blocked by browser automation (COOP policy) | KNOWN_LIMITATION | Manual sign-in required |
| 2  | Auth | Email/password auth shows "This sign-in method is not enabled" | TO_FIX | Need to enable in Supabase Console |
| 3  | Auth | Google blocks Playwright browser: "This browser or app may not be secure" | BLOCKING | Need to enable Email/Password auth |

---

## Session Notes

### 2026-01-19 Session 1
- Started browser automation session `academic-test`
- **BLOCKED**: Authentication requires manual Google sign-in (popup can't be automated)
- **FOUND**: Email/password auth is not enabled in Supabase Console
- **NEXT**: User needs to manually sign in via Google OAuth in the browser window
- Browser session: `agent-browser --session academic-test`
- Browser is headed and visible on screen

### Parallel Testing Plan (after auth)
Once authenticated, will launch async agents to test:
1. **Document Agent**: Create docs from templates, test editor
2. **AI Chat Agent**: Test all 4 models, discipline switching
3. **Research Agent**: PubMed, arXiv, Semantic Scholar searches
4. **Export Agent**: DOCX and PDF export functionality
5. **Papers Agent**: PDF upload, library management

