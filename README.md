# CurrentPrep — UPSC CSE Preparation Platform

> **Where Aspirants Become Achievers** — AI-powered UPSC preparation with daily ePaper, mock tests, quizzes, and more.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com)
[![Tests](https://img.shields.io/badge/tests-53%20passing-brightgreen)](https://github.com)
[![License](https://img.shields.io/badge/license-private-blue)](LICENSE)

---

## 🚀 Features

### Free Tier
- **Daily Current Affairs Digest** — AI-curated, GS-mapped articles with prelims & mains pointers
- **UPSC Syllabus Hub** — Complete syllabus with PDF downloads
- **AI Quiz Practice** — 5 quizzes/day across all subjects
- **Bilingual Support** — English and Tamil
- **Community Forum** — Read-only access

### Pro Tier (₹299/month)
- **Daily ePaper** — Full newspaper-style explainers with source attribution
- **Unlimited AI Quizzes** — Generate quizzes on any topic
- **Daily Mock Tests** — Prelims (MCQ) & Mains (descriptive) practice
- **Custom Mock Builder** — Build full-length UPSC papers
- **PYQ Database** — 1995–2025 with analytics
- **AI Answer Evaluation** — Mains answer checking
- **Bookmarks & Study Lists** — Save and organize content
- **Full Forum Access** — Post and reply
- **Priority Support** — Direct email support

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + Custom CSS |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | NextAuth.js (JWT + Google OAuth) |
| **AI** | Google Gemini API |
| **Payments** | Razorpay |
| **Hosting** | Vercel |
| **Testing** | Vitest + React Testing Library |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # NextAuth.js handlers
│   │   ├── epaper/       # ePaper generation & retrieval
│   │   ├── payments/     # Razorpay integration
│   │   ├── quiz/         # AI quiz generation
│   │   └── admin/        # Admin panel APIs
│   ├── admin/            # Admin console pages
│   ├── current-affairs/  # Current affairs pages
│   ├── daily-epaper/     # ePaper viewer & archive
│   ├── daily-mock/       # Mock test pages
│   ├── pricing/          # Pricing & billing
│   ├── privacy-policy/   # Legal: privacy policy
│   ├── terms/            # Legal: terms of service
│   └── layout.tsx        # Root layout (SEO, JSON-LD)
├── components/           # Reusable UI components
├── config/               # App configuration (pricing, etc.)
├── contexts/             # React contexts (theme, language)
├── lib/                  # Core libraries
│   ├── db/               # Database access layer
│   ├── auth.ts           # NextAuth.js config
│   ├── permissions.ts    # Feature gating
│   ├── rate-limit.ts     # Rate limiting
│   └── supabase.ts       # Supabase client
├── i18n/                 # Internationalization strings
└── types/                # TypeScript type definitions
```

---

## 🛠️ Local Development

### Prerequisites
- Node.js 20+
- npm 10+
- Supabase project (free tier works)
- Gemini API key

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/currentprep.git
cd currentprep

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.local.example .env.local

# 4. Fill in environment variables (see below)

# 5. Start dev server
npm run dev
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXTAUTH_URL` | ✅ | App URL (http://localhost:3000 for dev) |
| `NEXTAUTH_SECRET` | ✅ | Random secret (openssl rand -base64 32) |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `CRON_SECRET` | ✅ | Secret for cron job auth |
| `GOOGLE_CLIENT_ID` | ❌ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ❌ | Google OAuth client secret |
| `SMTP_HOST` | ❌ | SMTP server for email |
| `SMTP_PORT` | ❌ | SMTP port |
| `SMTP_USER` | ❌ | SMTP username |
| `SMTP_PASS` | ❌ | SMTP password |
| `CONTACT_EMAIL_TO` | ❌ | Contact form recipient |
| `RAZORPAY_KEY_ID` | ❌ | Razorpay key (for payments) |
| `RAZORPAY_KEY_SECRET` | ❌ | Razorpay secret |
| `RAZORPAY_WEBHOOK_SECRET` | ❌ | Razorpay webhook secret |

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

**Test coverage:** 6 test suites, 53 tests covering:
- Rate limiting logic
- Auth configuration
- Registration API
- Contact form validation
- Environment config
- Middleware route protection

---

## 🚢 Deployment (Vercel)

1. Push to GitHub
2. Connect repo to Vercel
3. Add all environment variables in Vercel dashboard
4. Deploy

**CI/CD:** GitHub Actions runs tests → lint → build on every push and PR.

### Cron Jobs (Vercel)
| Endpoint | Schedule | Purpose |
|----------|----------|---------|
| `/api/epaper/generate` | 5:30 AM IST daily | Generate daily ePaper |
| `/api/current-affairs/update` | 6:00 AM IST daily | Update current affairs |

---

## 🔒 Security

- **Authentication:** NextAuth.js with JWT strategy, bcrypt password hashing
- **Database:** Supabase RLS (Row-Level Security) policies
- **API Protection:** Rate limiting on all sensitive endpoints
- **Input Validation:** Zod schemas + sanitize-html
- **Headers:** X-Frame-Options, X-Content-Type-Options, CSP
- **Payments:** Razorpay HMAC-SHA256 signature verification
- **Admin:** Role-based middleware protection

---

## ♿ Accessibility

- WCAG 2.1 AA color contrast compliance
- Skip-to-content link for keyboard navigation
- Focus-visible outlines on interactive elements
- ARIA labels on all icon buttons
- Semantic HTML structure
- Screen reader support

---

## 📄 License

This project is proprietary. All rights reserved.

---

## 📧 Contact

- **Email:** support@currentprep.in
- **Website:** [currentprep.vercel.app](https://currentprep.vercel.app)
