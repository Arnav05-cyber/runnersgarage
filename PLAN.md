# RunnersGarage — Architecture & Product Plan

> Status: Pre-build planning document. Updated before any code is written.
> Last updated: 2026-06-17

---

## Table of Contents

1. [Product Vision & Positioning](#1-product-vision--positioning)
2. [Core Philosophy & Constraints](#2-core-philosophy--constraints)
3. [Feature Hierarchy & MVP Scope](#3-feature-hierarchy--mvp-scope)
4. [User Flows](#4-user-flows)
5. [System Architecture Overview](#5-system-architecture-overview)
6. [AI Architecture](#6-ai-architecture)
7. [Recommendation System Design](#7-recommendation-system-design)
8. [Conversation System Design](#8-conversation-system-design)
9. [Database Design & ERD](#9-database-design--erd)
10. [API Design](#10-api-design)
11. [Frontend Architecture](#11-frontend-architecture)
12. [Technology Stack](#12-technology-stack)
13. [Monetization Strategy](#13-monetization-strategy)
14. [Technical Risks & Mitigations](#14-technical-risks--mitigations)
15. [Competitive Advantages](#15-competitive-advantages)
16. [Scalability Considerations](#16-scalability-considerations)
17. [Open Questions & Decisions](#17-open-questions--decisions)

---

## 1. Product Vision & Positioning

### What RunnersGarage Is

An AI-powered platform that removes confusion from running. The "operating system for runners."

A runner can arrive with any running-related question and receive a personalized, contextual, high-quality answer — drawing on their profile, history, goals, budget, location, and experience level.

### What RunnersGarage Is NOT

- Not an ecommerce store
- Not a race listing database
- Not a running blog
- Not a Strava clone
- Not a catalog browser

### Core Value Proposition

| Problem | Solution |
|---|---|
| "What shoes should I buy?" returns 50 generic articles | AI that knows your foot type, budget, training goals, and terrain |
| Race discovery is fragmented across many sites | Single conversational interface that searches and filters for you |
| Training plans are one-size-fits-all | AI-generated plans based on your current fitness, goals, and schedule |
| Nutrition advice is generic | Personalized guidance based on your race distance, weight, and timing |
| Injury advice is fear-mongering | Context-aware recovery guidance that balances risk with your goals |

### Positioning Statement

> "The only running platform that knows YOU — not just running in general."

---

## 2. Core Philosophy & Constraints

### Product Constraints

1. **Personalization over breadth** — A recommendation for THIS runner is always more valuable than a general list.
2. **Conversation over navigation** — Users should not need to know where to go. They should ask.
3. **Trust over volume** — 300 accurately curated shoes beat 10,000 stale entries.
4. **Frictionless entry** — Anonymous users can get value immediately. Account signup is triggered by the desire to save, not to use.
5. **Garage as accumulation** — The platform grows more valuable the longer you use it. Saved items, history, and improved recommendations compound over time.

### The Catalog Principle

We do NOT maintain a massive catalog. We maintain:
- A **curated lightweight shoe catalog** (~300–500 actively sold shoes) with verified pricing, specs, and affiliate links
- A **race data layer** built on external API integrations (RunSignUp, Race Roster) with web search as fallback
- **AI reasoning** as the intelligence layer on top of this data

This is not "no data." It is "no maintenance burden." Tooling automates freshness checks. Humans curate, not populate.

---

## 3. Feature Hierarchy & MVP Scope

### MVP (Phase 1)

Scope: Two domains done exceptionally well.

**Domain 1: Shoe Recommendations**
- Conversational shoe finder (anonymous + authenticated)
- Profile-aware recommendations (experience, terrain, foot type, budget)
- Curated shoe catalog with affiliate purchase links
- Save shoes to My Garage
- Shoe comparisons ("Compare Asics Gel-Kayano vs Brooks Ghost")

**Domain 2: Training Plans**
- Conversational training plan generation
- Inputs: goal race, target date, current weekly mileage, days available per week
- Structured plan output (week-by-week, day-by-day)
- Save training plans to My Garage
- Export to PDF (and eventually Garmin/Strava)

**Infrastructure (required for MVP)**
- Chat interface (homepage)
- User authentication (Supabase Auth)
- User profile (lightweight, optional)
- My Garage (saved items dashboard)
- Conversation history
- Streaming AI responses

### Phase 2

- **Race Garage** — conversational race finder using RunSignUp/Race Roster APIs
- **Race planning** — countdown timers, registration reminders, race-day checklists
- Improved anonymous → authenticated conversion flows

### Phase 3

- **Nutrition Garage** — pre-race, during-race, and recovery nutrition plans
- **Recovery Garage** — injury triage, rehab plans, return-to-run protocols
- Garmin / Strava integration for profile auto-population
- Coach marketplace (human coaches using RunnersGarage for their athletes)

### Deferred (Post-Product-Market Fit)

- Mobile app
- Community features
- Social/sharing
- Brand partner placements
- API access for coaches

---

## 4. User Flows

### 4.1 Anonymous User Flow

```
[Homepage]
    |
    |-- Sees large chat interface
    |-- Sees 5 example prompts
    |-- Types a question
    |
[Chat Response]
    |
    |-- AI asks 1-2 clarifying questions within chat
    |    (e.g., "What's your weekly mileage?", "What's your budget?")
    |
    |-- AI returns personalized response
    |-- Response includes purchase links or structured plan
    |
    |-- User wants to SAVE the result
    |
[Save Trigger → Signup Wall]
    |
    |-- "Create a free account to save this recommendation"
    |-- Signup with email or Google
    |
[Authenticated → Item Saved → My Garage]
```

### 4.2 Authenticated User Flow

```
[Homepage / My Garage]
    |
    |-- Returns to previous conversation
    |-- OR starts new conversation
    |
[Chat with Profile Context]
    |
    |-- AI has access to:
    |    - Profile (experience, goals, mileage, injuries)
    |    - Saved items history
    |    - Previous conversations
    |
    |-- Recommendations are personalized to THIS user
    |
[Save → My Garage]
    |
    |-- Shoe saved under Shoe Garage
    |-- Training plan saved under Training Garage
    |-- Race saved under Race Garage
    |
[Return Visit]
    |
    |-- "You saved the Asics Gel-Kayano 31 last month. How are they working out?"
    |-- Recommendations improve over time
```

### 4.3 Profile Building Flow

Profile is NEVER a required onboarding step.

Profile data is collected in two ways:
1. **Within conversations** — AI asks contextual questions ("How many days per week can you train?") and saves answers to profile silently
2. **Explicit profile page** — Optional. User can view and edit what the AI knows about them.

```
[First chat message]
    |
    |-- AI detects missing profile data relevant to query
    |-- Asks 1 question inline ("What surface do you run on most?")
    |-- User answers → saved to profile
    |-- Follow-up questions in subsequent messages
    |
[Profile page] (optional, accessible from My Garage)
    |
    |-- Shows all collected profile data
    |-- User can correct or add details
    |-- "The more you share, the better your recommendations"
```

### 4.4 Shoe Recommendation Flow

```
User: "What shoes should I buy for my first marathon?"
    |
[Context Builder]
    |-- Fetches user profile (if authenticated)
    |-- Detects missing critical data
    |
[AI asks clarifying questions]
    |-- "What surface will you train on? Road, trail, or mixed?"
    |-- "What's your budget range?"
    |-- "Do you have any previous injuries or foot issues?"
    |
[Intent Resolved: Road shoe, marathon distance, beginner, $120–150]
    |
[Tool: shoe_search]
    |-- Queries curated catalog
    |-- Filters: road, marathon, beginner-friendly, $100–$160
    |-- Returns top 3–5 candidates with specs
    |
[AI Synthesis]
    |-- Picks top 3 with reasoning
    |-- Explains WHY each shoe fits this runner
    |-- Includes affiliate purchase links
    |-- Flags one as primary recommendation
    |
[User can]
    |-- Ask follow-up ("Compare top 2")
    |-- Save shoe to Shoe Garage
    |-- Click purchase link
```

### 4.5 Training Plan Flow

```
User: "Build me a 16-week marathon training plan"
    |
[Context Builder]
    |-- Checks profile for current mileage, experience, available days
    |
[AI asks if missing]
    |-- "What's your current weekly mileage?"
    |-- "How many days per week can you train?"
    |-- "What's your target finish time, or is this a first-time completion goal?"
    |
[AI Generates Plan]
    |-- Week-by-week structure
    |-- Daily workouts (easy run, tempo, long run, rest)
    |-- Taper weeks included
    |-- Cross-training suggestions
    |
[Structured Output]
    |-- Displayed as table in chat
    |-- "Save this plan to My Garage" button
    |
[Saved Plan in My Garage]
    |-- Viewable week by week
    |-- Future: exportable to PDF / Garmin / Strava
```

---

## 5. System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Next.js)                       │
│  Homepage Chat | My Garage | Shoe/Race/Training/etc.      │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS / SSE (streaming)
┌───────────────────────▼─────────────────────────────────┐
│                   API GATEWAY (NestJS)                    │
│  Auth Middleware | Rate Limiting | Session Management     │
└──────┬──────────────────────────────────┬───────────────┘
       │                                  │
┌──────▼──────────┐              ┌────────▼────────────┐
│  CHAT SERVICE   │              │   DATA SERVICES     │
│                 │              │                     │
│  Context Builder│              │  Shoe Service       │
│  Intent Router  │              │  Race Service       │
│  Tool Executor  │              │  Profile Service    │
│  Stream Handler │              │  Garage Service     │
└──────┬──────────┘              └────────┬────────────┘
       │                                  │
┌──────▼──────────┐              ┌────────▼────────────┐
│  AI PROVIDER    │              │  DATABASE           │
│  LAYER          │              │  (Supabase PG)      │
│                 │              │                     │
│  OpenAI         │              │  Users              │
│  Anthropic      │              │  Conversations      │
│  Gemini         │              │  Messages           │
│  (abstracted)   │              │  SavedItems         │
└──────┬──────────┘              │  ShoeCache          │
       │                         │  RaceCache          │
┌──────▼──────────┐              └─────────────────────┘
│  EXTERNAL APIs  │
│                 │
│  Brave/Perplexity (web search)
│  RunSignUp API  │
│  Race Roster    │
│  Affiliate APIs │
└─────────────────┘
```

### Service Boundaries

| Service | Responsibility |
|---|---|
| Chat Service | Orchestrates conversation: context, intent, tools, AI call, streaming |
| AI Provider Layer | Abstracts OpenAI / Anthropic / Gemini behind a unified interface |
| Shoe Service | Queries curated shoe catalog, applies filters |
| Race Service | Queries race APIs + web search, normalizes results |
| Profile Service | Reads/writes user profile, extracts profile data from conversations |
| Garage Service | CRUD for saved items, organized by domain |
| Auth Service | Handled by Supabase Auth, NestJS guard wraps it |

---

## 6. AI Architecture

### 6.1 Overview

The AI layer is not a single model call. It is an **orchestrated pipeline** with intent detection, context enrichment, tool use, and structured response extraction.

```
User Message
     │
     ▼
┌──────────────────────────────┐
│       CONTEXT BUILDER        │
│                              │
│  + User profile (if authed)  │
│  + Last N conversation turns │
│  + Current session context   │
│  + Domain hint (if in a      │
│    specific Garage)          │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│       INTENT CLASSIFIER      │
│                              │
│  Domain: shoes / race /      │
│    training / nutrition /    │
│    recovery / general        │
│                              │
│  Action: search / generate / │
│    compare / advise          │
│                              │
│  Missing context: what       │
│    profile data is needed?   │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│       TOOL ROUTER            │
│                              │
│  Selects tools based on      │
│  intent + available data     │
│                              │
│  Tools available:            │
│  - shoe_search               │
│  - race_search               │
│  - web_search                │
│  - profile_read              │
│  - training_plan_generate    │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│       AI MODEL CALL          │
│                              │
│  System prompt:              │
│  - Running domain expert     │
│  - User profile injected     │
│  - Tool results as context   │
│  - Response format hint      │
│                              │
│  Model selection:            │
│  - Simple query → Haiku      │
│  - Complex plan → Sonnet     │
│  - Tool-heavy → GPT-4o       │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│     RESPONSE PROCESSOR       │
│                              │
│  - Extract structured data   │
│    (shoes, plans, races)     │
│  - Attach save metadata      │
│  - Format for streaming      │
│  - Profile update extraction │
│    (did user reveal info?)   │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│       STREAM TO CLIENT       │
│                              │
│  SSE stream of AI tokens     │
│  + metadata event at end     │
│    (saveable items, profile  │
│    updates detected)         │
└──────────────────────────────┘
```

### 6.2 System Prompt Design

The system prompt is a **first-class product asset**, not a developer utility. It encodes:

1. **Role definition** — "You are an expert running coach and gear specialist..."
2. **User profile injection** — Templated section inserted per request
3. **Domain knowledge** — Shoe categories, training principles, injury triage logic
4. **Response format rules** — When to ask clarifying questions, when to give recommendations
5. **Trust and safety rules** — Never diagnose injuries definitively; always recommend professional advice for serious symptoms
6. **Affiliate disclosure** — When linking to products, note this may be an affiliate link

System prompt is version-controlled and treated like source code. Changes are tested before deployment.

### 6.3 Tool Definitions

#### `shoe_search`
```
Input:
  - use_case: "daily_trainer" | "marathon_racer" | "trail" | "tempo" | "recovery"
  - surface: "road" | "trail" | "track" | "treadmill"
  - experience: "beginner" | "intermediate" | "advanced"
  - budget_usd: { min: number, max: number }
  - drop_preference: "low" | "moderate" | "high" | "any"
  - foot_width: "narrow" | "standard" | "wide" | "any"
  - injury_notes: string[] (e.g., ["plantar fasciitis", "overpronation"])
  - max_results: number (default 5)

Output:
  - shoes[]: { id, name, brand, model, drop_mm, weight_g, price_usd, affiliate_url, key_features[], recommendation_reason }
```

#### `race_search`
```
Input:
  - location: { city?: string, state?: string, country?: string, lat?: number, lng?: number }
  - radius_km: number
  - distance_km: number | { min: number, max: number }
  - date_range: { from: string, to: string }
  - max_results: number (default 5)

Output:
  - races[]: { id, name, distance_km, date, location, registration_url, registration_status, price_usd }
```

#### `web_search`
```
Input:
  - query: string
  - context: string (what we're trying to find out)

Output:
  - results[]: { title, snippet, url, date }
```

#### `training_plan_generate`
```
Input:
  - goal_race_distance_km: number
  - target_date: string (ISO date)
  - current_weekly_km: number
  - available_days_per_week: number
  - experience_level: "beginner" | "intermediate" | "advanced"
  - goal_type: "completion" | "time_target"
  - target_time_minutes?: number
  - cross_training_available: boolean

Output:
  - plan: {
      total_weeks: number,
      peak_weekly_km: number,
      weeks[]: {
        week_number: number,
        total_km: number,
        phase: "base" | "build" | "peak" | "taper",
        days[]: {
          day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun",
          workout_type: "easy" | "tempo" | "intervals" | "long_run" | "rest" | "cross_training",
          distance_km?: number,
          duration_minutes?: number,
          description: string
        }
      }
    }
```

### 6.4 Model Routing Strategy

Not every query needs the most expensive model. Route by complexity:

| Query Type | Model | Reason |
|---|---|---|
| Simple factual ("what is a tempo run?") | Claude Haiku / GPT-4o Mini | Fast, cheap, sufficient |
| Shoe recommendation (tool use) | Claude Sonnet / GPT-4o | Tool use + synthesis |
| Full training plan generation | Claude Sonnet / GPT-4o | Complex reasoning, structured output |
| Injury triage | Claude Sonnet | Requires nuanced, safe reasoning |
| Race search (primarily tool use) | GPT-4o Mini with tools | Tool-heavy, low reasoning burden |

Cost target: average $0.002–$0.005 per conversation turn.

### 6.5 AI Provider Abstraction Layer

Single interface regardless of underlying model:

```typescript
interface AIProvider {
  chat(params: ChatParams): Promise<ChatResponse>
  stream(params: ChatParams): AsyncIterable<ChatChunk>
}

interface ChatParams {
  model: ModelTier  // 'fast' | 'standard' | 'reasoning'
  messages: Message[]
  tools?: ToolDefinition[]
  system?: string
  maxTokens?: number
}
```

Concrete implementations: `AnthropicProvider`, `OpenAIProvider`, `GeminiProvider`

This allows switching providers per route, per A/B test, or per cost optimization — without changing business logic.

### 6.6 Conversation Memory Strategy

**Within a session:** Full message history passed to model (last 20 turns, ~16k tokens budget)

**Across sessions (authenticated users):**
- Last 5 conversation summaries stored as compressed context
- User profile acts as long-term memory (extracted facts from conversations)
- Explicit saved items (shoes, plans, races) are retrievable by AI as context

**Across sessions (anonymous users):**
- Session cookie persists conversation for 7 days
- On signup, conversation history is migrated to the new account

**Profile auto-extraction:**
After each AI response, a lightweight extraction pass checks:
- Did the user reveal their weekly mileage?
- Did they mention an injury?
- Did they state a goal race?

If yes, silently update the profile. User sees this reflected on their profile page.

---

## 7. Recommendation System Design

### 7.1 Shoe Recommendation Logic

**Step 1: Requirement extraction**
AI extracts structured requirements from conversation context + profile.

**Step 2: Catalog query**
Filter curated shoe catalog by:
- Use case match (daily trainer vs racer vs trail)
- Surface match
- Price range
- Foot characteristics (width, drop preference)
- Injury compatibility (e.g., high drop for Achilles issues)

**Step 3: Ranking**
Rank filtered results by:
- Profile match score (how well does this shoe fit this specific runner)
- Popularity among similar runners (future: collaborative filtering)
- Freshness (newer model versions preferred)
- Affiliate availability

**Step 4: AI synthesis**
AI writes personalized reasoning for each recommendation:
- Why this shoe fits THIS runner specifically
- What to watch out for
- Comparison notes if multiple options presented

**Step 5: Purchase link assembly**
Affiliate links are assembled and attributed per-user for commission tracking.

### 7.2 Race Recommendation Logic

**Step 1: Extract search parameters**
- Distance preference
- Location / travel willingness
- Date range
- Budget (registration fee)

**Step 2: API queries**
Query RunSignUp + Race Roster APIs with structured parameters.

**Step 3: Fallback**
If API results are sparse, use web search ("marathons near Delhi October 2026") and parse results.

**Step 4: Freshness validation**
All race results must include:
- Registration status (open/closed/unknown)
- Last verified date
- Direct link to official registration page

**Step 5: AI presentation**
AI presents top 3–5 races with context:
- Elevation profile notes
- Course reputation (flat/scenic/difficult)
- Typical weather in that month
- Race size (large city marathon vs small local race)

### 7.3 Training Plan Logic

Training plans are fully AI-generated (no templates).

**Inputs (required):**
- Goal race distance
- Target date (determines available weeks)
- Current weekly mileage (determines starting point)
- Days available per week

**Inputs (optional but improve quality):**
- Target finish time
- Current longest run
- Recent injury history
- Cross-training options

**Plan structure follows standard training principles:**
- Base phase: aerobic foundation, gradual mileage increase
- Build phase: introduce quality workouts (tempo, intervals)
- Peak phase: highest mileage weeks
- Taper phase: reduce mileage before race
- 10% rule: weekly mileage increase capped at 10%
- 1 quality workout per 3–4 easy days ratio

**Output format:**
Structured JSON (stored in SavedItems.data) rendered as a weekly table in the UI.

---

## 8. Conversation System Design

### 8.1 Conversation Lifecycle

```
[Created]
    → Status: active
    → domain: detected from first message
    → title: auto-generated after first AI response (2–5 words)

[Active]
    → Messages appended in real-time
    → Profile updates extracted asynchronously
    → Saveable items flagged in metadata

[Archived]
    → User has not interacted in 30 days
    → Still visible in history, searchable

[Deleted]
    → User explicitly deletes
    → Soft delete (retain for 30 days, then hard delete)
```

### 8.2 Message Structure

Each message stored in DB:

```
{
  id: uuid,
  conversation_id: uuid,
  role: 'user' | 'assistant' | 'system',
  content: string,           // full text
  tool_calls: jsonb,         // what tools were called (if assistant)
  tool_results: jsonb,       // what tools returned (if assistant)
  saveable_items: jsonb,     // extracted items that can be saved
  profile_extractions: jsonb,// profile data extracted from this message
  model_used: string,        // which model generated this
  input_tokens: int,
  output_tokens: int,
  created_at: timestamp
}
```

### 8.3 Streaming Architecture

Client receives SSE stream from `/chat` endpoint.

Stream emits three types of events:

1. `token` — individual text token (rendered immediately)
2. `tool_use` — tool is being called (show loading indicator: "Searching shoes...")
3. `metadata` — end of response, includes saveable items, profile updates detected

```typescript
// Client-side event handling
eventSource.on('token', (data) => appendToChat(data.text))
eventSource.on('tool_use', (data) => showToolIndicator(data.tool, data.status))
eventSource.on('metadata', (data) => {
  hideToo lIndicator()
  if (data.saveableItems.length) showSavePrompt(data.saveableItems)
  if (data.profileUpdates.length) silentlyUpdateProfile(data.profileUpdates)
})
```

### 8.4 Anonymous Session Handling

Anonymous users get a session UUID stored in an HTTP-only cookie (7-day TTL).

- Conversations are associated with this session UUID (not a user ID)
- On signup: all sessions matching this UUID are migrated to the new user account
- After migration: session UUID cookie cleared, replaced by auth token

---

## 9. Database Design & ERD

### 9.1 Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                          AUTH (Supabase)                              │
│  auth.users { id, email, created_at, ... }                           │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ 1:1
                             │
┌────────────────────────────▼─────────────────────────────────────────┐
│                         user_profiles                                 │
│  id (PK)                                                             │
│  user_id (FK → auth.users.id, UNIQUE)                                │
│  username          VARCHAR(50)                                        │
│  display_name      VARCHAR(100)                                       │
│  experience_level  ENUM(beginner, intermediate, advanced)             │
│  primary_goal      ENUM(5k, 10k, half_marathon, marathon, ultra, fitness) │
│  weekly_mileage_km INT                                                │
│  longest_run_km    INT                                                │
│  age               INT                                                │
│  weight_kg         DECIMAL(5,2)                                       │
│  height_cm         INT                                                │
│  gender            ENUM(male, female, non_binary, prefer_not_to_say)  │
│  budget_preference ENUM(budget, mid_range, premium)                   │
│  preferred_surface ENUM(road, trail, track, treadmill, mixed)         │
│  shoe_size_us      DECIMAL(4,1)                                       │
│  shoe_width        ENUM(narrow, standard, wide, extra_wide)           │
│  injury_history    JSONB  -- [{ type, date, recovered: bool }]        │
│  training_days_per_week INT                                           │
│  target_race_date  DATE                                               │
│  target_race_distance_km DECIMAL(6,2)                                 │
│  created_at        TIMESTAMPTZ                                        │
│  updated_at        TIMESTAMPTZ                                        │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ 1:many
                             │
┌────────────────────────────▼─────────────────────────────────────────┐
│                          conversations                                │
│  id (PK)                                                             │
│  user_id           UUID (FK → auth.users.id, NULLABLE)               │
│  session_id        UUID (for anonymous users)                         │
│  domain            ENUM(general, shoes, races, training, nutrition, recovery) │
│  title             VARCHAR(200)  -- AI-generated                      │
│  status            ENUM(active, archived, deleted)                    │
│  message_count     INT DEFAULT 0                                      │
│  last_message_at   TIMESTAMPTZ                                        │
│  created_at        TIMESTAMPTZ                                        │
│  updated_at        TIMESTAMPTZ                                        │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ 1:many
                             │
┌────────────────────────────▼─────────────────────────────────────────┐
│                            messages                                   │
│  id (PK)                                                             │
│  conversation_id   UUID (FK → conversations.id, ON DELETE CASCADE)    │
│  role              ENUM(user, assistant, system)                      │
│  content           TEXT                                               │
│  tool_calls        JSONB  -- tools called by AI in this message       │
│  tool_results      JSONB  -- results returned to AI                   │
│  saveable_items    JSONB  -- items extracted for saving               │
│  profile_extractions JSONB -- profile data extracted from this turn   │
│  model_used        VARCHAR(100)                                       │
│  provider          ENUM(openai, anthropic, gemini)                    │
│  input_tokens      INT                                                │
│  output_tokens     INT                                                │
│  cost_usd          DECIMAL(10,6)                                      │
│  latency_ms        INT                                                │
│  created_at        TIMESTAMPTZ                                        │
└──────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────┐
│                          saved_items                                  │
│  id (PK)                                                             │
│  user_id           UUID (FK → auth.users.id, ON DELETE CASCADE)       │
│  item_type         ENUM(shoe, race, training_plan, nutrition_plan,    │
│                         recommendation)                               │
│  domain            ENUM(shoes, races, training, nutrition, recovery)  │
│  title             VARCHAR(200)                                       │
│  description       TEXT                                               │
│  data              JSONB  -- full item data (structure varies by type)│
│  thumbnail_url     TEXT                                               │
│  source_conversation_id UUID (FK → conversations.id, NULLABLE)        │
│  source_message_id UUID (FK → messages.id, NULLABLE)                 │
│  is_pinned         BOOLEAN DEFAULT FALSE                              │
│  tags              TEXT[]                                             │
│  created_at        TIMESTAMPTZ                                        │
│  updated_at        TIMESTAMPTZ                                        │
└──────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────┐
│                          shoe_catalog                                 │
│  id (PK)                                                             │
│  brand             VARCHAR(100)                                       │
│  model             VARCHAR(100)                                       │
│  version           VARCHAR(50)   -- "31", "v4", etc.                 │
│  full_name         VARCHAR(200)  -- "Asics Gel-Kayano 31"            │
│  use_case          ENUM(daily_trainer, marathon_racer, trail,         │
│                         tempo, recovery, beginner)                    │
│  surface           ENUM(road, trail, track, treadmill, multi)         │
│  drop_mm           INT                                                │
│  stack_height_mm   INT  -- at heel                                   │
│  weight_g          INT  -- per shoe                                  │
│  midsole_foam      VARCHAR(100)  -- "PWRRUN+", "ZoomX", etc.         │
│  upper_type        VARCHAR(100)                                       │
│  price_usd         DECIMAL(8,2)                                       │
│  currency          VARCHAR(3) DEFAULT 'USD'                           │
│  affiliate_url     TEXT                                               │
│  product_page_url  TEXT                                               │
│  image_url         TEXT                                               │
│  image_urls        TEXT[]  -- multiple angles                         │
│  key_features      TEXT[]  -- ["Max cushion", "Wide toe box", ...]   │
│  best_for          TEXT[]  -- ["Overpronators", "Long distance", ...] │
│  not_ideal_for     TEXT[]  -- ["Speed work", "Very narrow feet", ...] │
│  injury_compatible TEXT[]  -- ["Plantar fasciitis", "IT band", ...]   │
│  experience_level  ENUM(beginner, intermediate, advanced, all)        │
│  foot_width_range  ENUM(narrow, standard, wide, all)                  │
│  is_active         BOOLEAN DEFAULT TRUE                               │
│  last_verified_at  TIMESTAMPTZ                                        │
│  created_at        TIMESTAMPTZ                                        │
│  updated_at        TIMESTAMPTZ                                        │
└──────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────┐
│                          race_cache                                   │
│  id (PK)                                                             │
│  external_id       VARCHAR(100)  -- ID from source system            │
│  source            ENUM(runsignup, race_roster, manual, web_search)   │
│  name              VARCHAR(200)                                       │
│  organizer         VARCHAR(200)                                       │
│  description       TEXT                                               │
│  distance_km       DECIMAL(6,2)                                       │
│  distance_label    VARCHAR(50)   -- "Marathon", "10K", "50M"          │
│  event_date        DATE                                               │
│  event_end_date    DATE  -- for multi-day events                     │
│  city              VARCHAR(100)                                       │
│  state             VARCHAR(100)                                       │
│  country           VARCHAR(100)                                       │
│  lat               DECIMAL(9,6)                                       │
│  lng               DECIMAL(9,6)                                       │
│  registration_url  TEXT                                               │
│  registration_status ENUM(open, closed, waitlist, unknown)           │
│  registration_opens DATE                                              │
│  registration_closes DATE                                             │
│  price_usd         DECIMAL(8,2)  -- early bird or typical            │
│  course_type       ENUM(road, trail, track, mixed)                    │
│  elevation_gain_m  INT                                                │
│  is_certified      BOOLEAN                                            │
│  typical_participants INT                                             │
│  tags              TEXT[]  -- ["flat", "scenic", "boston qualifier"]  │
│  last_verified_at  TIMESTAMPTZ                                        │
│  created_at        TIMESTAMPTZ                                        │
│  updated_at        TIMESTAMPTZ                                        │
└──────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────┐
│                      ai_usage_logs                                    │
│  id (PK)                                                             │
│  message_id        UUID (FK → messages.id)                           │
│  conversation_id   UUID (FK → conversations.id)                       │
│  user_id           UUID (NULLABLE)                                    │
│  provider          ENUM(openai, anthropic, gemini)                    │
│  model             VARCHAR(100)                                       │
│  model_tier        ENUM(fast, standard, reasoning)                    │
│  input_tokens      INT                                                │
│  output_tokens     INT                                                │
│  cost_usd          DECIMAL(10,6)                                      │
│  latency_ms        INT                                                │
│  tools_called      TEXT[]                                             │
│  created_at        TIMESTAMPTZ                                        │
└──────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────┐
│                       affiliate_clicks                                │
│  id (PK)                                                             │
│  user_id           UUID (NULLABLE)                                    │
│  session_id        UUID (NULLABLE)                                    │
│  shoe_id           UUID (FK → shoe_catalog.id, NULLABLE)             │
│  saved_item_id     UUID (FK → saved_items.id, NULLABLE)              │
│  conversation_id   UUID (FK → conversations.id, NULLABLE)            │
│  clicked_url       TEXT                                               │
│  affiliate_tag     VARCHAR(100)                                       │
│  created_at        TIMESTAMPTZ                                        │
└──────────────────────────────────────────────────────────────────────┘
```

### 9.2 Key Design Decisions Explained

**`saved_items.data` is JSONB (not normalized)**
A saved shoe looks completely different from a saved training plan. Normalizing these would require 5+ tables with complex joins for a read-heavy, write-rarely pattern. JSONB gives flexibility to save any AI-generated output without schema changes.

**`conversations.user_id` is nullable**
Anonymous users have conversations too. `session_id` links them. On signup, `user_id` is backfilled.

**`messages` stores token counts and cost**
Cost visibility is non-negotiable from day one. You cannot manage AI spend without per-message tracking.

**`shoe_catalog` is separate from `saved_items`**
The catalog is curated reference data. Saved items are user-specific saved recommendations. A user saves a recommendation that references a catalog entry — they are not the same thing.

**`race_cache` has `last_verified_at`**
Race data goes stale. Any query to race data older than 24 hours should trigger a background refresh.

**`affiliate_clicks` is its own table**
Affiliate tracking needs to be auditable and independent of other data. Never mix revenue tracking into other tables.

### 9.3 Indexes

```sql
-- Performance-critical indexes
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_saved_items_user_id ON saved_items(user_id);
CREATE INDEX idx_saved_items_user_domain ON saved_items(user_id, domain);
CREATE INDEX idx_shoe_catalog_use_case ON shoe_catalog(use_case, surface, is_active);
CREATE INDEX idx_race_cache_location ON race_cache USING GIST(ll_to_earth(lat, lng));
CREATE INDEX idx_race_cache_date ON race_cache(event_date);
CREATE INDEX idx_ai_usage_logs_user_id ON ai_usage_logs(user_id, created_at);
CREATE INDEX idx_affiliate_clicks_user_id ON affiliate_clicks(user_id, created_at);
```

---

## 10. API Design

### 10.1 Base URL and Versioning

```
https://api.runnersgarage.com/v1/
```

All endpoints return:
```json
{
  "success": true,
  "data": { ... },
  "meta": { "requestId": "...", "timestamp": "..." }
}
```

Errors return:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": { ... }
  }
}
```

### 10.2 Auth Endpoints

```
POST /auth/signup
  Body: { email, password }
  Returns: { user, session }

POST /auth/login
  Body: { email, password }
  Returns: { user, session }

POST /auth/logout
  Auth: Required
  Returns: { success }

POST /auth/refresh
  Body: { refresh_token }
  Returns: { session }

GET  /auth/me
  Auth: Required
  Returns: { user }
```

### 10.3 Profile Endpoints

```
GET  /profile
  Auth: Required
  Returns: { profile }

PUT  /profile
  Auth: Required
  Body: Partial<UserProfile>
  Returns: { profile }

DELETE /profile
  Auth: Required
  Returns: { success }
  Note: Deletes profile data. Account requires separate deletion.
```

### 10.4 Chat Endpoints

```
POST /chat
  Auth: Optional (session_id in cookie for anonymous)
  Body: {
    message: string,
    conversation_id?: string,  // omit to start new conversation
    domain?: 'shoes' | 'races' | 'training' | 'nutrition' | 'recovery'
  }
  Returns: SSE stream
  Events:
    data: { type: 'token', text: '...' }
    data: { type: 'tool_use', tool: 'shoe_search', status: 'calling' }
    data: { type: 'tool_use', tool: 'shoe_search', status: 'complete' }
    data: { type: 'metadata', conversationId: '...', saveableItems: [...], profileUpdates: [...] }
    data: { type: 'done' }
    data: { type: 'error', message: '...' }
```

### 10.5 Conversation Endpoints

```
GET  /conversations
  Auth: Required
  Query: { page, limit, domain? }
  Returns: { conversations[], total, page }

GET  /conversations/:id
  Auth: Required
  Returns: { conversation, messages[] }

DELETE /conversations/:id
  Auth: Required
  Returns: { success }

POST /conversations/:id/title
  Auth: Required
  Body: { title: string }
  Returns: { conversation }
```

### 10.6 Garage (Saved Items) Endpoints

```
GET  /garage
  Auth: Required
  Query: { domain?, item_type?, page, limit }
  Returns: { items[], total, page }

GET  /garage/:id
  Auth: Required
  Returns: { item }

POST /garage
  Auth: Required
  Body: {
    item_type: 'shoe' | 'race' | 'training_plan' | 'nutrition_plan' | 'recommendation',
    domain: string,
    title: string,
    description?: string,
    data: object,
    source_conversation_id?: string,
    source_message_id?: string
  }
  Returns: { item }

PUT  /garage/:id
  Auth: Required
  Body: { title?, description?, tags?, is_pinned? }
  Returns: { item }

DELETE /garage/:id
  Auth: Required
  Returns: { success }
```

### 10.7 Shoe Endpoints

```
GET  /shoes
  Query: { use_case?, surface?, budget_min?, budget_max?, experience?, page, limit }
  Returns: { shoes[], total }

GET  /shoes/:id
  Returns: { shoe }

POST /shoes/:id/click
  Auth: Optional
  Body: { conversation_id? }
  Returns: { redirect_url }
  Note: Logs affiliate click, returns affiliate URL
```

### 10.8 Race Endpoints

```
GET  /races/search
  Query: {
    lat?, lng?, city?, state?, country?,
    radius_km?,
    distance_km?, distance_label?,
    date_from?, date_to?,
    page, limit
  }
  Returns: { races[], total }

GET  /races/:id
  Returns: { race }
```

### 10.9 Rate Limiting

| Endpoint | Anonymous | Authenticated (Free) | Authenticated (Pro) |
|---|---|---|---|
| POST /chat | 10/day | 20/month | Unlimited |
| GET /shoes | 100/day | 500/day | Unlimited |
| GET /races/search | 20/day | 100/day | Unlimited |
| GET /conversations | N/A | 200/day | Unlimited |

---

## 11. Frontend Architecture

### 11.1 Page Structure

```
/                        → Homepage (chat interface)
/chat/:conversationId    → Specific conversation
/garage                  → My Garage (all saved items)
/garage/shoes            → Shoe Garage
/garage/races            → Race Garage
/garage/training         → Training Garage
/garage/nutrition        → Nutrition Garage
/garage/recovery         → Recovery Garage
/profile                 → User profile view/edit
/auth/login              → Login
/auth/signup             → Signup
```

### 11.2 Component Hierarchy

```
Layout
├── Navbar
│   ├── Logo
│   ├── NavLinks (Garage, Profile)
│   └── AuthButtons
│
├── ChatInterface (homepage + /chat pages)
│   ├── ExamplePrompts (shown when no messages)
│   ├── MessageList
│   │   ├── UserMessage
│   │   └── AssistantMessage
│   │       ├── MessageText (streamed)
│   │       ├── ToolIndicator ("Searching shoes...")
│   │       ├── ShoeCard[] (structured recommendation)
│   │       ├── RaceCard[]
│   │       ├── TrainingPlanTable
│   │       └── SaveButton
│   └── ChatInput
│
├── GarageDashboard (/garage)
│   ├── GarageNav (domain tabs)
│   ├── SavedItemGrid
│   │   └── SavedItemCard
│   └── EmptyState
│
└── ProfilePage (/profile)
    ├── ProfileForm
    └── ProfileCompletionHint
```

### 11.3 State Management

- **Server state:** React Query (TanStack Query) for all API data
- **Client state:** Zustand for UI state (current conversation, streaming state)
- **Auth state:** Supabase Auth client-side hooks
- **Chat streaming:** Custom hook wrapping EventSource

### 11.4 Chat Streaming Hook (design)

```typescript
function useChat(conversationId?: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [activeTools, setActiveTools] = useState<string[]>([])
  const [saveableItems, setSaveableItems] = useState<SaveableItem[]>([])

  const sendMessage = async (content: string) => {
    // Optimistically add user message
    // Open SSE connection to /chat
    // Handle token events → append to last assistant message
    // Handle tool_use events → update activeTools
    // Handle metadata events → setSaveableItems, trigger profile updates
    // Handle done → setIsStreaming(false)
  }

  return { messages, isStreaming, activeTools, saveableItems, sendMessage }
}
```

---

## 12. Technology Stack

### Confirmed Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | Next.js 14 (App Router) | SSR, streaming support, React Server Components |
| UI Components | Shadcn UI + Tailwind CSS | Unstyled base components, full control |
| Backend | NestJS + TypeScript | Structured, scalable, decorator-based |
| Database | Supabase PostgreSQL | Auth built-in, real-time, good DX |
| Auth | Supabase Auth | Handles email + OAuth, JWT, session management |
| File Storage | Supabase Storage | Profile images, exported PDFs |
| AI (primary) | Anthropic Claude | Best reasoning, tool use, safety |
| AI (secondary) | OpenAI GPT-4o | Fallback, some tool-use tasks |
| Web Search | Brave Search API | Cheaper than Google, good quality |
| Streaming | Server-Sent Events (SSE) | Simpler than WebSockets for one-way streaming |

### Recommended Additions

| Tool | Purpose |
|---|---|
| Zod | Runtime validation of API inputs and AI outputs |
| BullMQ + Redis | Background job queue (race cache refresh, profile extraction) |
| Resend | Transactional email (welcome, plan exports) |
| PostHog | Product analytics, funnel tracking |
| Sentry | Error tracking |
| Upstash Redis | Rate limiting, short-term cache for AI responses |

### Infrastructure (deployment)

| Service | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Railway or Render (NestJS container) |
| Database | Supabase (managed) |
| Cache/Queue | Upstash Redis |
| CDN | Cloudflare |

---

## 13. Monetization Strategy

### Phase 1: Affiliate Revenue (launch)

- Shoe purchase links use affiliate tags (Running Warehouse, REI, Road Runner Sports, Amazon)
- Commission: 5–8% per sale
- Tracking via `affiliate_clicks` table + affiliate network dashboard
- Disclosure: small "affiliate link" label on purchase buttons (required legally)

**Revenue estimate:** 100 monthly active users × 2 shoe clicks/month × 5% conversion × $120 avg order × 6% commission = ~$72/month. Scales linearly with users.

### Phase 2: Freemium Subscription

**Free tier:**
- 20 AI conversations per month
- Save up to 10 items to Garage
- Basic profile (5 fields)

**Pro tier ($9/month or $79/year):**
- Unlimited conversations
- Unlimited saved items
- Full profile
- Training plan export (PDF + Garmin Connect + Strava)
- Conversation history searchable
- Priority response (faster model tier)
- Early access to new Garages

**Conversion goal:** 5–10% of active users convert to Pro.

### Phase 3: B2B (post-PMF)

- **Race organizer listings:** Featured placement in race recommendations ($50–200/month per race)
- **Brand partnerships:** Structured sponsorship with disclosure (not hidden recommendations)
- **Coach API access:** Running coaches pay to use the recommendation engine for their athletes ($30–50/month per coach seat)

### What to Avoid

- Advertising (ruins UX, signals product failure)
- Selling user data (trust collapse, especially in health-adjacent app)
- Gating basic features too aggressively (kills top-of-funnel)

---

## 14. Technical Risks & Mitigations

### Risk 1: AI Hallucination on Product Data

**Risk:** AI recommends a discontinued shoe, wrong price, or product that doesn't exist.
**Severity:** High — damages trust permanently
**Mitigation:**
- Shoe recommendations always grounded in curated catalog (no free-form product generation)
- Affiliate links verified weekly via automated checker
- "As of [date]" disclaimer on prices
- Race data always linked to original source ("Check registration status at [url]")

### Risk 2: AI Cost at Scale

**Risk:** Unlimited free tier + expensive models = unsustainable unit economics
**Severity:** High — existential for the business
**Mitigation:**
- Model routing: simple queries use Haiku/Mini (10x cheaper)
- Response caching: identical queries (same intent + similar profile) return cached response
- Rate limiting on free tier enforced server-side
- Cost monitoring per user — flag users over $0.50/month in AI cost

### Risk 3: Race Data Staleness

**Risk:** Recommending races with closed registration or wrong dates
**Severity:** High — direct user harm (wasted travel bookings)
**Mitigation:**
- `last_verified_at` on every race record
- Background job refreshes races older than 24h before serving
- Always surface registration URL and instruct user to verify on official site
- Never state "registration is open" — state "as of [date], registration was open"

### Risk 4: Cold Start Personalization Problem

**Risk:** New anonymous users get generic answers not better than ChatGPT
**Severity:** Medium — fails to differentiate from competition
**Mitigation:**
- Conversational onboarding: AI asks 2–3 clarifying questions in first message
- Example prompts on homepage are designed to elicit useful context ("What shoes should I buy for my first marathon?" already tells AI the user is a beginner targeting marathon)
- Even 2–3 profile data points dramatically improve recommendation quality

### Risk 5: Anonymous → Authenticated Conversion

**Risk:** Users get enough value anonymously and never sign up
**Severity:** Medium — limits monetization and retention
**Mitigation:**
- Save gate: saving any item requires an account (clear, non-hostile prompt)
- Conversation history: "Want to access this conversation on any device? Sign up free."
- Profile value pitch: "Your next recommendation will be even better — tell us a bit about yourself."

### Risk 6: Shoe Catalog Maintenance Burden

**Risk:** Even 300 shoes need price verification, affiliate link checks, discontinued detection
**Severity:** Medium — manageable with tooling
**Mitigation:**
- Internal admin with automated price staleness detection
- Weekly affiliate link health check (HTTP 200 check on all affiliate URLs)
- `is_active` flag allows soft-retirement without deletion

---

## 15. Competitive Advantages

### Durable Advantages (hard to copy)

1. **Running-specific model tuning** — A system prompt and evaluation framework built over months of real runner conversations. Competitors cannot replicate this without the same data.
2. **Garage as a running journal** — The longer a user uses the platform, the more their Garage becomes a personal running history. This is switching cost.
3. **Profile depth + memory** — ChatGPT does not remember that you trained for Boston, injured your IT band, and prefer trail shoes. RunnersGarage does.
4. **Recommendation feedback loops** — Over time: did the user buy the shoe? Did they save the plan? Did they return after getting the recommendation? This data improves ranking without any ML work initially.

### Short-term Advantages

- First mover in conversational running AI (window of 12–18 months before incumbents copy)
- Domain specificity makes responses visibly better than general AI for running questions
- Affiliate model aligns revenue with user success (we win when they buy the right shoe)

### Weaknesses to Monitor

- No native activity tracking (Strava, Garmin have the usage data)
- Race data quality dependent on external APIs
- AI quality is only as good as the system prompt + model — this needs continuous iteration

---

## 16. Scalability Considerations

### Database

- Supabase handles up to ~100k MAU without custom tuning
- Conversations + messages will be the largest tables — archive after 90 days of inactivity
- `ai_usage_logs` grows fast — partition by month, retain 12 months hot, cold storage beyond that

### AI Costs

At 10,000 MAU with 5 messages/month average:
- 50,000 messages/month
- Average 1,500 tokens/message (input + output)
- Mix of Haiku (70%) + Sonnet (30%)
- Estimated cost: ~$150–300/month at this scale

At 100,000 MAU: ~$1,500–3,000/month — still manageable with subscription revenue.

### Backend

- NestJS is stateless — horizontal scaling is straightforward
- SSE connections are lightweight but maintain open HTTP connections — monitor connection count
- BullMQ handles background jobs (race cache refresh, profile extraction) asynchronously

### Caching Strategy

| Data | Cache TTL | Cache Type |
|---|---|---|
| Shoe catalog | 1 hour | Redis |
| Race search results | 30 minutes | Redis |
| AI responses (identical queries) | 24 hours | Redis |
| User profile | 5 minutes | In-memory (NestJS) |
| Session data | Session lifetime | Redis |

---

## 17. Open Questions & Decisions

These need to be resolved before or during early development:

| # | Question | Options | Recommendation |
|---|---|---|---|
| 1 | Primary AI provider for MVP? | OpenAI GPT-4o vs Anthropic Claude | Start with Anthropic Claude Sonnet; better tool use and safety behavior |
| 2 | Web search provider? | Brave Search API vs Perplexity vs Serper | Brave Search API — cheapest, good quality, no AI markup |
| 3 | Race API integration for MVP? | RunSignUp vs Race Roster vs defer to Phase 2 | Defer race search to Phase 2; MVP is shoes + training only |
| 4 | Affiliate network for shoes? | Running Warehouse vs Amazon Associates vs direct | Running Warehouse first (highest commission, runner-specific), Amazon as fallback |
| 5 | Anonymous rate limit enforcement? | IP-based vs session-cookie-based | Session cookie — easier to implement, IP is unreliable behind NAT/VPN |
| 6 | Training plan export format for MVP? | PDF only vs Garmin Connect vs Strava | PDF only for MVP — simplest, sufficient |
| 7 | Monorepo vs separate repos? | Nx monorepo vs separate Next.js + NestJS repos | Nx monorepo — shared types between frontend and backend, one CI pipeline |
| 8 | Deployment platform for backend? | Railway vs Render vs Fly.io | Railway — simplest NestJS deployment, good DX |
| 9 | How to handle shoe catalog initially? | Manual CSV import vs admin UI | Manual CSV import first — build admin UI in Phase 2 |
| 10 | Free tier conversation limit? | 10/month vs 20/month vs unlimited with degraded model | 20 conversations/month with fast model; Pro gets standard model |

---

*End of RunnersGarage Architecture Plan*

*Next step: resolve Open Questions above, then begin implementation starting with project scaffolding.*
