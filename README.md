# 🚀 MyAlgorithm - Tracker Platform

> Take control of your algorithm. Build your own feed in 60 seconds.

The open-source social feed platform where users create, customize, and share their own real-time data trackers - no longer letting social media algorithms decide what they see.

## ✨ Features

- 🎯 **Natural Language Creation** - Type "Track Korean beauty trends from TikTok" and watch the magic
- 🖼️ **Media-Rich Results** - Beautiful cards with images and videos, not just boring text
- 🔄 **Daily Updates** - Fresh content delivered automatically
- 🌐 **Multi-Source Integration** - Pull from TikTok, Instagram, Reddit, news sites, anywhere
- 🔗 **Social Sharing** - Share your trackers and follow others' algorithms
- ⚡ **Real-time Preview** - See results in 30 seconds while building

## 🎥 Demo

Create a tracker in plain English and get beautiful, media-rich results:

```
Input: "Track Korean beauty trends from TikTok and Instagram"
Output: Daily feed of trending K-beauty products with images, prices, and insights
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- API keys for services (see Environment Setup)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/patterns.git
cd patterns

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev

# Open http://localhost:3000
```

### Environment Setup

Create a `.env.local` file with your API keys:

```env
# Required APIs
FIRECRAWL_API_KEY=your_firecrawl_key
EXA_API_KEY=your_exa_key
OPENAI_API_KEY=your_openai_key

# Optional but recommended
JINA_API_KEY=your_jina_key
ANTHROPIC_API_KEY=your_anthropic_key
PERPLEXITY_API_KEY=your_perplexity_key

# Supabase (for data storage)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 📦 Project Structure

```
patterns/
├── src/                    # Source code
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   └── lib/              # Core libraries
├── docs/                  # Documentation
│   ├── PRD.md            # Product requirements
│   └── ARCHITECTURE.md   # Technical details
└── DEVELOPMENT_PLAN.md   # Development roadmap
```

## 🛠️ Tech Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Data Sources:** Firecrawl, Exa.ai, Jina.ai
- **AI:** OpenAI GPT-4
- **Database:** Supabase
- **Deployment:** Vercel

## 📚 Documentation

- [Development Plan](./DEVELOPMENT_PLAN.md) - Detailed development roadmap
- [Product Requirements](./docs/PRD.md) - Full PRD with user stories
- [Architecture](./docs/tracker-platform-analysis/technical-architecture-hybrid.md) - Technical architecture
- [API Documentation](./docs/API.md) - API endpoints and usage

## 🎯 Example Trackers

1. **Korean Beauty Trends** - K-beauty products from TikTok & Instagram
2. **AI Tools Launch** - New AI products from Product Hunt
3. **NYC Restaurant Openings** - New spots from Yelp & Instagram
4. **BookTok Recommendations** - Trending books from TikTok
5. **Tech Layoffs** - Industry news from Twitter & LinkedIn

## 🚦 Development Status

### Current Phase: MVP Development

- [x] Project setup and planning
- [x] Technical architecture design
- [x] PRD and documentation
- [ ] Core tracker engine
- [ ] Natural language builder
- [ ] Feed UI components
- [ ] Deployment setup

### MVP Launch Target: 2 Weeks

## 🤝 Contributing

This is currently a solo project in rapid development. Contributions will be welcome after MVP launch!

## 📝 License

MIT License - feel free to use this code for your own projects!

## 🙏 Acknowledgments

- Built with [Firecrawl](https://firecrawl.dev) for web scraping
- Powered by [Exa.ai](https://exa.ai) for semantic search
- Enhanced with [Jina.ai](https://jina.ai) for content processing
- UI components from [shadcn/ui](https://ui.shadcn.com)

## 💬 Contact

Questions? Ideas? Reach out!

---

**Remember:** The goal is to ship fast and create that "holy shit" moment when someone sees their first tracker results!

*Building the future of social feeds, one tracker at a time.* 🚀
