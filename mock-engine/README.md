# 🧠 UPSC Prelims 2026 — Mock Test Engine

Standalone question generation, test assembly, scoring & analytics engine for **Current IAS Prep**.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file and add your Gemini API key
cp .env.example .env
# Edit .env → add GEMINI_API_KEY

# Run a pilot generation (25 questions — History: Ancient India)
npm run generate:pilot

# Validate generated questions
npm run validate

# Interactively review questions
npm run review
```

## Project Structure

```
mock-engine/
├── src/
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts     # Question, Test, Analytics types
│   ├── data/            # Subject & sub-topic definitions
│   │   └── subjects.ts  # 8 subjects, 33 sub-topics
│   ├── generator/       # Question generation pipeline
│   │   ├── generate.ts  # AI-powered question generator (Gemini)
│   │   ├── validate.ts  # Post-generation quality checks
│   │   └── review.ts    # Interactive human review tool
│   ├── engine/          # Test engine (assembly, scoring)
│   │   └── assembler.ts # (coming soon)
│   ├── analyzer/        # Performance analytics
│   │   └── stats.ts     # (coming soon)
│   └── db/              # Database integration
│       └── (coming soon)
├── data/
│   ├── generated/       # Raw AI-generated questions
│   ├── approved/        # Human-reviewed approved questions
│   └── review/          # Questions needing review
├── tests/               # Unit tests
├── package.json
└── tsconfig.json
```

## Pipeline

```
Generate → Validate → Review → Approve → Assemble Tests → Deploy
```

## Scale

| Type | Tests | Questions/Test | Total |
|------|-------|---------------|-------|
| Full-Length | 10 | 100 | 1,000 |
| Subject-Wise | 40 | 100 | 4,000 |
| **Total** | **50** | — | **~5,000** |
