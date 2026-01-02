# Cursor for Academic Writing

An AI-powered academic writing platform with PubMed research integration, authentic prose generation, and professional document export.

## 🎯 Features

- **Dual Interface:** Claude Code skill + Web application
- **Research Integration:** Direct PubMed search and citation management
- **Authentic Writing:** Eric Topol-style conversational academic prose
- **Vancouver Citations:** Proper medical citation formatting
- **Multi-LLM Support:** OpenAI, Anthropic, Google, OpenRouter, xAI
- **Professional Export:** DOCX and PDF with proper formatting

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
