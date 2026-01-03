# Malowanko

AI-powered coloring page generator for children. A web application that enables parents and caregivers to create personalized coloring pages using artificial intelligence based on text descriptions, tailored to the child's age and preferred art style.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

Malowanko solves common problems parents face when searching for coloring pages:

- **Personalization** - Generate unique coloring pages based on your child's interests
- **Age-appropriate content** - Choose from predefined styles matched to age groups (3-5, 6-8, 9-12 years)
- **No artistic skills required** - Simply describe what you want and AI creates the artwork
- **Safe content** - Automatic AI validation ensures all generated content is child-friendly
- **Print-ready** - Export to A4 PDF format for easy printing

### Key Features

- 🎨 **Coloring Page Generator** - Create line art from text prompts with style and age group selection
- 📚 **Personal Library** - Save and manage up to 100 generated coloring pages
- 🖨️ **Print Module** - Export to PDF in A4 format with portrait/landscape orientation
- 🌐 **Public Gallery** - Browse anonymous coloring pages created by other users
- 🔐 **Magic Link Auth** - Passwordless authentication via email

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.x | App Router, Server Components, Server Actions |
| React | 19.x | UI Components |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling |
| ShadCN UI | - | Component library |

### Backend

| Technology | Purpose |
|------------|---------|
| Supabase | PostgreSQL database, Storage, Row Level Security |
| Supabase Auth | Magic link authentication |
| OpenAI API | DALL-E 3 (image generation), GPT-4 (content validation, auto-tagging) |

### Infrastructure

- **Hosting**: Vercel
- **Package Manager**: pnpm

## Getting Started Locally

### Prerequisites

- Node.js 20+
- pnpm 9+
- Git
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/malowanko.git
cd malowanko
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

4. Configure the following environment variables in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. Start the development server:

```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `pnpm dev` | Start development server with hot reload |
| `build` | `pnpm build` | Create production build |
| `start` | `pnpm start` | Start production server |
| `lint` | `pnpm lint` | Run ESLint for code quality checks |

## Project Scope

### MVP Features

- ✅ Magic link authentication (email-based)
- ✅ Coloring page generator with 4 styles and 3 age groups
- ✅ Personal library with 100 coloring page limit
- ✅ Print and PDF export in A4 format
- ✅ Public gallery with search and filtering
- ✅ Daily generation limit (10 per day)
- ✅ All coloring pages are public and anonymous by default
- ✅ Responsive web interface (mobile and desktop)

### Out of Scope (Future Considerations)

- Social media login (Google, Facebook)
- Private coloring pages option
- Online coloring feature
- Native mobile apps (iOS, Android)
- Multi-language support
- Subscription and payment system
- Admin panel
- API for external integrations

## Project Status

🚧 **Early Development** - Phase 1

The project is being developed iteratively:

| Phase | Description | Duration |
|-------|-------------|----------|
| Phase 1 | Generator + Authorization | 4-6 weeks |
| Phase 2 | Library + Printing | 2-3 weeks |
| Phase 3 | Public Gallery | 2 weeks |

## License

MIT
