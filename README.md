# Cursor for Academic Writing

An AI-powered academic writing platform with PubMed research integration, authentic prose generation, and professional document export.

## 🎯 Features

### Core Writing & Editing
- **Rich Text Editor:** TipTap-based academic editor with tables, formatting, auto-save
- **AI Writing Assistance:** 16 AI-powered actions (paraphrase, simplify, expand, etc.)
- **Writing Analysis:** Real-time readability, style, vocabulary analysis
- **Plagiarism Detection:** N-gram fingerprinting, similarity scoring, pattern detection
- **Track Changes:** Collaborative editing with insertion/deletion tracking
- **Templates:** 6 academic templates (Research Article, Systematic Review, etc.)

### Research & Discovery (NEW)
- **Deep Research Agent:** Multi-agent research system with 4 modes (Quick/Standard/Deep/Exhaustive)
  - 7 specialized agents (Clarifier, Planner, Researcher, Reviewer, Synthesizer, Writer, Orchestrator)
  - Multi-perspective exploration (STORM-inspired)
  - Tree-based iterative research
  - 85 passing tests

- **Chat with Papers:** Upload and analyze PDFs with AI
  - PDF text extraction and section detection
  - Grounded Q&A with section references
  - Key information extraction (findings, methods, limitations)
  - Research matrix for multi-paper comparison
  - 104 passing tests

- **Connected Papers Discovery:** Citation network and knowledge graph exploration
  - Citation network analysis with metrics
  - Knowledge map clustering
  - Smart paper recommendations
  - Literature path finding
  - Research timeline and frontier detection
  - 115 passing tests

### Citations & References
- **Paperpile-Style Citation Management:** 30+ reference types, CSL formatting
- **Cite-While-You-Write:** Cmd+Shift+P keyboard shortcut
- **10 Citation Styles:** APA, MLA, Chicago, Vancouver, Harvard, IEEE, AMA, Nature, Cell
- **BibTeX/RIS Import/Export**

### AI & Multi-LLM Support
- **14 AI Models:** Claude, GPT-4o, Gemini, Llama, Qwen, DeepSeek, and more
- **Multi-Database Research:** PubMed, arXiv, Semantic Scholar, OpenAlex
- **15 Scientific Disciplines:** Field-specific AI prompts and conventions

### Export & Presentation (NEW)
- **AI Presentation Generator:** Generate slides from documents
  - SVG-based charts and flowcharts
  - PPTX and PDF export
  - Presenter view with timer
  - 52 passing tests
- **Professional Export:** DOCX and PDF with formatting, page numbers, TOC

### Collaboration
- **Comments & Suggestions:** Real-time commenting system
- **Version History:** Auto-save versions with restore capability
- **Document Sharing:** Link and email-based sharing with permissions
- **Track Changes:** Accept/reject workflow

### Testing & Quality
- **1,822 Tests Passing:** 100% pass rate across all features
- **TypeScript Strict Mode:** No `any` types
- **Full Firebase Integration:** Auth, Firestore, Storage

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (for web app)
- API keys for at least one LLM provider (OpenAI, Anthropic, or Google)
- Firebase project (for web app persistence)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/drshailesh88/cursor_for_academic_writing.git
   cd cursor_for_academic_writing
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual API keys
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Run development server**
   ```bash
   npm run dev
   # Open http://localhost:2550
   ```

## 📚 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI:** shadcn/ui + Tailwind CSS
- **Editor:** Novel (TipTap)
- **Database:** Firebase Firestore
- **Auth:** Firebase Auth
- **AI:** Vercel AI SDK
- **Research:** PubMed MCP Server

## 🎨 Design Philosophy

- **Academic/Scholarly Theme:** Deep purples, warm grays, scholarly gold
- **Three-Panel Layout:** History (left) | Editor (center) | Chat (right)
- **Resizable & Persistent:** Panels remember your preferred sizes
- **Dark Mode:** Full support for day/night writing sessions

## 🔐 Security

- **Never commit** `.env.local` or any files containing API keys
- All secrets are in `.env.local` only
- Firebase security rules enforce user data isolation
- See `.gitignore` for protected files

## 📖 Documentation

- [Installation Guide](docs/installation.md) (coming soon)
- [User Guide](docs/user-guide.md) (coming soon)
- [API Documentation](docs/api.md) (coming soon)
- [Contributing](CONTRIBUTING.md) (coming soon)

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Inspired by [mila.gg](https://mila.gg) for UI layout patterns
- Built on [Novel](https://novel.sh) editor framework
- PubMed integration via [PubMed MCP Server](https://github.com/cyanheads/pubmed-mcp-server)

## 📧 Contact

Dr. Shailesh - [@drshailesh88](https://github.com/drshailesh88)

Project Link: https://github.com/drshailesh88/cursor_for_academic_writing
