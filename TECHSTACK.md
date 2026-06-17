# RunnersGarage — Tech Stack

> Finalized: 2026-06-17

---

## Frontend

| Tool | Version | Purpose |
|---|---|---|
| Next.js | 14 (App Router) | React framework, SSR, streaming support |
| TypeScript | 5.x | Type safety across the codebase |
| Tailwind CSS | 3.x | Utility-first styling |
| Shadcn UI | latest | Unstyled component primitives, fully customizable |
| TanStack Query | 5.x | Server state management, caching, loading states |
| Zustand | 4.x | Lightweight client state (chat streaming, UI state) |
| Supabase JS | 2.x | Auth client, session management |

---

## Backend

| Tool | Version | Purpose |
|---|---|---|
| NestJS | 10.x | Structured Node.js framework, decorator-based |
| TypeScript | 5.x | Type safety |
| Supabase JS (admin) | 2.x | Database queries, auth token verification |
| Zod | 3.x | Runtime validation of API inputs and AI outputs |
| Upstash Redis | latest | Caching and rate limiting (serverless Redis) |

---

## Database & Infrastructure

| Service | Purpose |
|---|---|
| Supabase PostgreSQL | Primary database |
| Supabase Auth | Authentication — email/password, OAuth (Google, Apple), magic links, session management |
| Supabase Storage | File storage — exported PDFs, profile images |
| Upstash Redis | Cache (shoe catalog, AI responses) + rate limiting (free tier enforcement) |
| Railway | Backend (NestJS) hosting |
| Vercel | Frontend (Next.js) hosting |

---

## AI Layer

| Tool | Purpose |
|---|---|
| Provider-agnostic abstraction | Unified interface over OpenAI / Anthropic / Gemini — provider TBD |
| Brave Search API | Web search tool for real-time race and product data |

---

## Tooling & Observability

| Tool | Purpose |
|---|---|
| Resend | Transactional email — welcome emails, plan delivery (3,000 free/month) |
| @react-pdf/renderer | Server-side PDF generation for training plan exports |
| PostHog | Product analytics — funnels, conversion, session recording (1M events free/month) |
| Sentry | Error tracking — both Next.js and NestJS |
| Zod | Shared validation schemas across frontend and backend |

---

## Repository Structure

```
runnersgarage/               ← monorepo root
├── frontend/                ← Next.js 14
├── backend/                 ← NestJS
├── packages/
│   └── types/               ← shared TypeScript types (API shapes, tool definitions, entities)
├── .env.example
├── .gitignore
├── package.json             ← npm workspace root
├── PLAN.md
└── TECHSTACK.md
```

---

## Auth Architecture

Supabase Auth handles the full auth lifecycle:

- Email/password signup and login
- OAuth providers (Google, Apple)
- Magic link login
- Password reset and email verification
- JWT issuance and session refresh

**Why Supabase Auth over alternatives:**
- Native integration with Supabase PostgreSQL — `auth.uid()` available directly in Row Level Security policies
- JWTs verified in NestJS guards with a single Supabase admin client call
- Login/signup UI is built with Shadcn — looks and feels like the product, not a third-party widget
- No extra service, no extra billing, no integration overhead

---

## Key Decisions & Rationale

| Decision | Choice | Rationale |
|---|---|---|
| Auth provider | Supabase Auth | Native Supabase integration, full UI control, no third-party widget |
| Separate auth service? | No | Supabase Auth covers all required flows at MVP scale |
| Background jobs | Deferred (async NestJS) | Not needed at MVP scale; add BullMQ + Redis queue in Phase 2 |
| PDF generation | @react-pdf/renderer | Server-side, no headless browser, lightweight |
| Caching | Upstash Redis | Serverless, pay-per-request, works with Railway backend |
| AI provider | TBD (abstraction layer built first) | Provider decided after abstraction interface is in place |
