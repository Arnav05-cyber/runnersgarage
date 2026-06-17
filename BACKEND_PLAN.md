# RunnersGarage — Backend Build Plan

> Framework: NestJS + TypeScript
> Database: Supabase PostgreSQL
> Auth: Supabase Auth
> Hosting: Railway
> Last updated: 2026-06-17

This document is a complete, stage-by-stage guide to building the RunnersGarage backend.
Each stage is self-contained and ends with a working, testable slice of the system.
You can pick up from any stage — prerequisites tell you exactly what must exist first.

---

## Table of Contents

- [Stage 1 — Project Initialization & Structure](#stage-1--project-initialization--structure)
- [Stage 2 — Database Foundation](#stage-2--database-foundation)
- [Stage 3 — Auth Integration](#stage-3--auth-integration)
- [Stage 4 — User Profile Module](#stage-4--user-profile-module)
- [Stage 5 — AI Provider Abstraction Layer](#stage-5--ai-provider-abstraction-layer)
- [Stage 6 — Shoe Catalog Module](#stage-6--shoe-catalog-module)
- [Stage 7 — Conversation & Message Core](#stage-7--conversation--message-core)
- [Stage 8 — Chat AI Orchestration](#stage-8--chat-ai-orchestration)
- [Stage 9 — Garage Module (Saved Items)](#stage-9--garage-module-saved-items)
- [Stage 10 — Rate Limiting & Caching](#stage-10--rate-limiting--caching)
- [Stage 11 — Training Plan PDF Export](#stage-11--training-plan-pdf-export)
- [Stage 12 — Observability & Production Hardening](#stage-12--observability--production-hardening)

---

## Stage 1 — Project Initialization & Structure

### Goal
Stand up a working NestJS project with the correct folder structure, strict TypeScript config, environment variable handling, global validation, CORS, and a health check endpoint. Everything subsequent builds on this foundation.

### Prerequisites
- Node.js 20+ installed
- npm 10+ installed
- NestJS CLI installed globally (`npm install -g @nestjs/cli`)

### Packages to Install

```bash
# Core
npm install @nestjs/config @nestjs/common @nestjs/core @nestjs/platform-express

# Validation
npm install zod @anatine/zod-nestjs @anatine/zod-mock

# Security
npm install helmet

# Dev
npm install -D @types/node typescript ts-node
```

### Folder Structure to Create

```
backend/
├── src/
│   ├── main.ts                        ← bootstrap, global config
│   ├── app.module.ts                  ← root module
│   ├── app.controller.ts              ← health check
│   │
│   ├── auth/                          ← Stage 3
│   ├── profile/                       ← Stage 4
│   ├── ai/                            ← Stage 5
│   ├── shoes/                         ← Stage 6
│   ├── chat/                          ← Stage 7 & 8
│   ├── garage/                        ← Stage 9
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   └── current-user.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts
│   │   └── pipes/
│   │       └── zod-validation.pipe.ts
│   │
│   ├── config/
│   │   └── configuration.ts           ← typed env config
│   │
│   └── database/
│       ├── database.module.ts
│       └── database.service.ts        ← Supabase client wrapper
│
├── .env                               ← local only, never committed
├── .env.example                       ← committed, no secrets
├── package.json
└── tsconfig.json
```

### Implementation Details

**`src/main.ts`**
- Bootstrap NestJS app with `NestFactory.create(AppModule)`
- Enable CORS with explicit origin (frontend URL from env)
- Use `helmet()` for security headers
- Apply global `ZodValidationPipe` for all incoming request bodies
- Apply global `HttpExceptionFilter` for consistent error shape
- Listen on `PORT` from environment (Railway injects this)
- Log startup message with port

**`src/config/configuration.ts`**
- Export a typed config function loaded by `@nestjs/config`
- All environment variables are accessed through this — never `process.env` directly in services
- Variables required:
  ```
  PORT
  NODE_ENV
  FRONTEND_URL
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  SUPABASE_ANON_KEY
  UPSTASH_REDIS_URL
  UPSTASH_REDIS_TOKEN
  BRAVE_SEARCH_API_KEY
  ANTHROPIC_API_KEY         (optional at this stage)
  OPENAI_API_KEY            (optional at this stage)
  SENTRY_DSN                (optional at this stage)
  ```

**`src/database/database.service.ts`**
- Injects `ConfigService`
- Creates two Supabase clients:
  - `adminClient`: uses `SUPABASE_SERVICE_ROLE_KEY` — bypasses RLS, used server-side only
  - `anonClient`: uses `SUPABASE_ANON_KEY` — respects RLS
- Both clients exported as getters
- Module exported globally so all services can inject it

**`src/common/filters/http-exception.filter.ts`**
- Catches all `HttpException` instances
- Returns consistent JSON:
  ```json
  {
    "success": false,
    "error": {
      "code": "NOT_FOUND",
      "message": "Resource not found",
      "statusCode": 404
    },
    "meta": { "timestamp": "...", "path": "..." }
  }
  ```

**`src/common/pipes/zod-validation.pipe.ts`**
- Custom pipe wrapping Zod `safeParse`
- If validation fails, throws `BadRequestException` with field-level errors
- Used globally in `main.ts`

**`src/app.controller.ts`**
- Single `GET /health` endpoint
- Returns `{ status: 'ok', timestamp: '...', version: '...' }`
- No auth required

**`.env.example`**
```
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=
BRAVE_SEARCH_API_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
SENTRY_DSN=
```

**`tsconfig.json`**
- `strict: true`
- `strictNullChecks: true`
- `noImplicitAny: true`
- `esModuleInterop: true`
- `experimentalDecorators: true`
- `emitDecoratorMetadata: true`
- Path alias: `@/*` → `src/*`

### Completion Criteria
- `npm run start:dev` starts without errors
- `GET /health` returns `200 { status: 'ok' }`
- TypeScript compiles with zero errors
- `.env.example` committed, `.env` in `.gitignore`

---

## Stage 2 — Database Foundation

### Goal
Create all database tables, relationships, indexes, and Row Level Security policies in Supabase. This is the single source of truth for the entire schema. All subsequent stages read/write against this schema.

### Prerequisites
- Stage 1 complete
- Supabase project created
- Supabase CLI installed (`npm install -g supabase`)

### Packages to Install

```bash
# No additional npm packages — SQL migrations run via Supabase CLI or dashboard
```

### Migration Files to Create

Run migrations in order. Each file is a `.sql` file applied via Supabase dashboard or CLI.

---

#### Migration 001 — User Profiles

```sql
CREATE TABLE user_profiles (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username                VARCHAR(50) UNIQUE,
  display_name            VARCHAR(100),
  experience_level        TEXT CHECK (experience_level IN ('beginner','intermediate','advanced')),
  primary_goal            TEXT CHECK (primary_goal IN ('5k','10k','half_marathon','marathon','ultra','fitness')),
  weekly_mileage_km       INTEGER,
  longest_run_km          INTEGER,
  age                     INTEGER,
  weight_kg               DECIMAL(5,2),
  height_cm               INTEGER,
  gender                  TEXT CHECK (gender IN ('male','female','non_binary','prefer_not_to_say')),
  budget_preference       TEXT CHECK (budget_preference IN ('budget','mid_range','premium')),
  preferred_surface       TEXT CHECK (preferred_surface IN ('road','trail','track','treadmill','mixed')),
  shoe_size_us            DECIMAL(4,1),
  shoe_width              TEXT CHECK (shoe_width IN ('narrow','standard','wide','extra_wide')),
  injury_history          JSONB DEFAULT '[]',
  training_days_per_week  INTEGER,
  target_race_date        DATE,
  target_race_distance_km DECIMAL(6,2),
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
  ON user_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

#### Migration 002 — Conversations

```sql
CREATE TABLE conversations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id       UUID,
  domain           TEXT NOT NULL DEFAULT 'general'
                   CHECK (domain IN ('general','shoes','races','training','nutrition','recovery')),
  title            VARCHAR(200),
  status           TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','archived','deleted')),
  message_count    INTEGER NOT NULL DEFAULT 0,
  last_message_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),

  -- At least one of user_id or session_id must be present
  CONSTRAINT must_have_identity CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_conversations_status ON conversations(status);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own conversations"
  ON conversations FOR ALL
  USING (auth.uid() = user_id);

-- Anonymous conversations: backend uses service role key, bypasses RLS
-- Session-based access controlled at application layer

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

#### Migration 003 — Messages

```sql
CREATE TABLE messages (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id      UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role                 TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content              TEXT NOT NULL,
  tool_calls           JSONB,
  tool_results         JSONB,
  saveable_items       JSONB DEFAULT '[]',
  profile_extractions  JSONB DEFAULT '{}',
  model_used           VARCHAR(100),
  provider             TEXT CHECK (provider IN ('openai','anthropic','gemini')),
  input_tokens         INTEGER,
  output_tokens        INTEGER,
  cost_usd             DECIMAL(10,6),
  latency_ms           INTEGER,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(conversation_id, created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Messages are accessed via conversations — join enforces ownership
CREATE POLICY "Users can access messages in own conversations"
  ON messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND c.user_id = auth.uid()
    )
  );
```

---

#### Migration 004 — Saved Items

```sql
CREATE TABLE saved_items (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type              TEXT NOT NULL
                         CHECK (item_type IN ('shoe','race','training_plan','nutrition_plan','recommendation')),
  domain                 TEXT NOT NULL
                         CHECK (domain IN ('shoes','races','training','nutrition','recovery')),
  title                  VARCHAR(200) NOT NULL,
  description            TEXT,
  data                   JSONB NOT NULL,
  thumbnail_url          TEXT,
  source_conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  source_message_id      UUID REFERENCES messages(id) ON DELETE SET NULL,
  is_pinned              BOOLEAN NOT NULL DEFAULT FALSE,
  tags                   TEXT[] DEFAULT '{}',
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_saved_items_user_id ON saved_items(user_id);
CREATE INDEX idx_saved_items_user_domain ON saved_items(user_id, domain);
CREATE INDEX idx_saved_items_user_type ON saved_items(user_id, item_type);

ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved items"
  ON saved_items FOR ALL
  USING (auth.uid() = user_id);

CREATE TRIGGER update_saved_items_updated_at
  BEFORE UPDATE ON saved_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

#### Migration 005 — Shoe Catalog

```sql
CREATE TABLE shoe_catalog (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand            VARCHAR(100) NOT NULL,
  model            VARCHAR(100) NOT NULL,
  version          VARCHAR(50),
  full_name        VARCHAR(200) NOT NULL,
  use_case         TEXT NOT NULL
                   CHECK (use_case IN ('daily_trainer','marathon_racer','trail','tempo','recovery','beginner')),
  surface          TEXT NOT NULL
                   CHECK (surface IN ('road','trail','track','treadmill','multi')),
  drop_mm          INTEGER,
  stack_height_mm  INTEGER,
  weight_g         INTEGER,
  midsole_foam     VARCHAR(100),
  upper_type       VARCHAR(100),
  price_usd        DECIMAL(8,2),
  currency         VARCHAR(3) NOT NULL DEFAULT 'USD',
  affiliate_url    TEXT,
  product_page_url TEXT,
  image_url        TEXT,
  image_urls       TEXT[] DEFAULT '{}',
  key_features     TEXT[] DEFAULT '{}',
  best_for         TEXT[] DEFAULT '{}',
  not_ideal_for    TEXT[] DEFAULT '{}',
  injury_compatible TEXT[] DEFAULT '{}',
  experience_level TEXT NOT NULL DEFAULT 'all'
                   CHECK (experience_level IN ('beginner','intermediate','advanced','all')),
  foot_width_range TEXT NOT NULL DEFAULT 'all'
                   CHECK (foot_width_range IN ('narrow','standard','wide','all')),
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shoe_catalog_use_case ON shoe_catalog(use_case, surface) WHERE is_active = TRUE;
CREATE INDEX idx_shoe_catalog_price ON shoe_catalog(price_usd) WHERE is_active = TRUE;
CREATE INDEX idx_shoe_catalog_brand ON shoe_catalog(brand) WHERE is_active = TRUE;

-- Shoe catalog is public read, admin-only write (no RLS needed for reads)
ALTER TABLE shoe_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shoe catalog is publicly readable"
  ON shoe_catalog FOR SELECT
  USING (is_active = TRUE);

CREATE TRIGGER update_shoe_catalog_updated_at
  BEFORE UPDATE ON shoe_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

#### Migration 006 — Race Cache

```sql
CREATE TABLE race_cache (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id           VARCHAR(100),
  source                TEXT NOT NULL
                        CHECK (source IN ('runsignup','race_roster','manual','web_search')),
  name                  VARCHAR(200) NOT NULL,
  organizer             VARCHAR(200),
  description           TEXT,
  distance_km           DECIMAL(6,2),
  distance_label        VARCHAR(50),
  event_date            DATE,
  event_end_date        DATE,
  city                  VARCHAR(100),
  state                 VARCHAR(100),
  country               VARCHAR(100),
  lat                   DECIMAL(9,6),
  lng                   DECIMAL(9,6),
  registration_url      TEXT,
  registration_status   TEXT DEFAULT 'unknown'
                        CHECK (registration_status IN ('open','closed','waitlist','unknown')),
  registration_opens    DATE,
  registration_closes   DATE,
  price_usd             DECIMAL(8,2),
  course_type           TEXT CHECK (course_type IN ('road','trail','track','mixed')),
  elevation_gain_m      INTEGER,
  is_certified          BOOLEAN,
  typical_participants  INTEGER,
  tags                  TEXT[] DEFAULT '{}',
  last_verified_at      TIMESTAMPTZ DEFAULT NOW(),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(external_id, source)
);

CREATE INDEX idx_race_cache_date ON race_cache(event_date);
CREATE INDEX idx_race_cache_country ON race_cache(country);
CREATE INDEX idx_race_cache_distance ON race_cache(distance_km);

ALTER TABLE race_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Race cache is publicly readable"
  ON race_cache FOR SELECT
  USING (TRUE);
```

---

#### Migration 007 — AI Usage Logs

```sql
CREATE TABLE ai_usage_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id      UUID REFERENCES messages(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  user_id         UUID,
  provider        TEXT NOT NULL CHECK (provider IN ('openai','anthropic','gemini')),
  model           VARCHAR(100) NOT NULL,
  model_tier      TEXT NOT NULL CHECK (model_tier IN ('fast','standard','reasoning')),
  input_tokens    INTEGER NOT NULL,
  output_tokens   INTEGER NOT NULL,
  cost_usd        DECIMAL(10,6) NOT NULL,
  latency_ms      INTEGER,
  tools_called    TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_logs_user_id ON ai_usage_logs(user_id, created_at);
CREATE INDEX idx_ai_usage_logs_created_at ON ai_usage_logs(created_at);

-- No RLS — only backend service role writes here
```

---

#### Migration 008 — Affiliate Clicks

```sql
CREATE TABLE affiliate_clicks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID,
  session_id      UUID,
  shoe_id         UUID REFERENCES shoe_catalog(id) ON DELETE SET NULL,
  saved_item_id   UUID REFERENCES saved_items(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  clicked_url     TEXT NOT NULL,
  affiliate_tag   VARCHAR(100),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_affiliate_clicks_user_id ON affiliate_clicks(user_id, created_at);
CREATE INDEX idx_affiliate_clicks_shoe_id ON affiliate_clicks(shoe_id);
CREATE INDEX idx_affiliate_clicks_created_at ON affiliate_clicks(created_at);

-- No RLS — only backend service role writes here
```

---

### Completion Criteria
- All 8 migrations applied in Supabase without errors
- Tables visible in Supabase dashboard with correct columns and types
- RLS policies enabled on all tables
- `DatabaseService` in NestJS can connect and run a test query (`SELECT 1`)

---

## Stage 3 — Auth Integration

### Goal
Integrate Supabase Auth into NestJS. Any endpoint can verify who the caller is. Two guards:
- `JwtAuthGuard` — rejects unauthenticated requests
- `OptionalJwtAuthGuard` — allows both authenticated and anonymous requests, attaches user if present

### Prerequisites
- Stage 1 complete
- Stage 2 complete
- Supabase project running

### Packages to Install

```bash
npm install @supabase/supabase-js
npm install -D @types/express
```

### Files to Create

```
src/auth/
├── auth.module.ts
├── auth.service.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   └── optional-jwt-auth.guard.ts
└── types/
    └── auth.types.ts
```

### Implementation Details

**`src/auth/types/auth.types.ts`**
```typescript
export interface AuthUser {
  id: string           // Supabase user UUID
  email: string
  role: 'authenticated' | 'anon'
}

export interface RequestWithUser extends Request {
  user?: AuthUser
  sessionId?: string   // for anonymous users (from cookie)
}
```

**`src/auth/auth.service.ts`**
- Injects `DatabaseService`
- `verifyToken(token: string): Promise<AuthUser | null>`
  - Calls `supabaseAdmin.auth.getUser(token)`
  - Returns structured `AuthUser` or null on failure
- `getSessionId(request: Request): string`
  - Reads `rg-session-id` cookie from request
  - If not present, generates new UUID and sets cookie

**`src/auth/guards/jwt-auth.guard.ts`**
- Implements `CanActivate`
- Extracts Bearer token from `Authorization` header
- Calls `authService.verifyToken(token)`
- Attaches `AuthUser` to `request.user`
- Throws `UnauthorizedException` if token missing or invalid
- Decorator: `@UseGuards(JwtAuthGuard)`

**`src/auth/guards/optional-jwt-auth.guard.ts`**
- Same logic as `JwtAuthGuard` but never throws
- If no token or invalid token: continues with `request.user = undefined`
- Also extracts and attaches `sessionId` from cookie for anonymous users
- Used on chat endpoint and public endpoints

**`src/common/decorators/current-user.decorator.ts`**
```typescript
// Usage: @CurrentUser() user: AuthUser | undefined
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);
```

### Testing This Stage
- Create a test route `GET /auth/me` protected by `JwtAuthGuard`
- Get a JWT from Supabase (sign up via Supabase dashboard or test client)
- Call the endpoint with `Authorization: Bearer <token>`
- Should return `{ id, email }`
- Call without token — should return `401`
- Call optional-guarded route without token — should return `200`

### Completion Criteria
- `JwtAuthGuard` correctly rejects invalid/missing tokens
- `OptionalJwtAuthGuard` allows both authenticated and anonymous through
- `@CurrentUser()` decorator returns `AuthUser` on authenticated requests
- Anonymous requests get a `sessionId` attached

---

## Stage 4 — User Profile Module

### Goal
Allow authenticated users to read, create, and update their profile. Profile is automatically created on first read if it doesn't exist (upsert pattern). This is the data that personalizes all AI recommendations.

### Prerequisites
- Stage 3 complete (auth guards working)
- `user_profiles` table exists (Migration 001)

### Packages to Install

```bash
# No new packages required
```

### Files to Create

```
src/profile/
├── profile.module.ts
├── profile.controller.ts
├── profile.service.ts
├── dto/
│   ├── update-profile.dto.ts     ← Zod schema + inferred type
│   └── profile-response.dto.ts   ← shape returned to client
```

### Implementation Details

**`src/profile/dto/update-profile.dto.ts`**
- Zod schema for profile update (all fields optional)
- Validates enums (experience_level, primary_goal, etc.)
- Validates numeric ranges (age: 1–120, weight_kg: 20–500, etc.)
- Exported as both Zod schema and inferred TypeScript type

**`src/profile/profile.service.ts`**
- `getOrCreate(userId: string): Promise<UserProfile>`
  - SELECT from `user_profiles` where `user_id = userId`
  - If not found, INSERT with `user_id` only (all other fields null)
  - Returns the profile
- `update(userId: string, dto: UpdateProfileDto): Promise<UserProfile>`
  - UPDATE `user_profiles` set fields from dto where `user_id = userId`
  - Returns updated profile
- `delete(userId: string): Promise<void>`
  - DELETE profile data but not the auth.users record
  - Sets all profile fields to null except user_id
- `updateFromExtractions(userId: string, extractions: Partial<UserProfile>): Promise<void>`
  - Called by chat system when AI extracts profile info from conversation
  - Only updates non-null fields (never overwrites existing data with null)

**`src/profile/profile.controller.ts`**

```
GET  /profile
  Guard: JwtAuthGuard
  Returns: UserProfile (creates if not exists)

PUT  /profile
  Guard: JwtAuthGuard
  Body: UpdateProfileDto (all fields optional)
  Returns: updated UserProfile

DELETE /profile
  Guard: JwtAuthGuard
  Returns: { success: true }
  Clears profile fields, keeps user_id row
```

### Profile Response Shape

```typescript
{
  id: string
  userId: string
  username: string | null
  displayName: string | null
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | null
  primaryGoal: string | null
  weeklyMileageKm: number | null
  longestRunKm: number | null
  age: number | null
  weightKg: number | null
  heightCm: number | null
  gender: string | null
  budgetPreference: string | null
  preferredSurface: string | null
  shoeSizeUs: number | null
  shoeWidth: string | null
  injuryHistory: InjuryRecord[]
  trainingDaysPerWeek: number | null
  targetRaceDate: string | null
  targetRaceDistanceKm: number | null
  createdAt: string
  updatedAt: string
}
```

### Completion Criteria
- `GET /profile` returns empty profile for new user, profile data for returning user
- `PUT /profile` updates fields correctly, ignores unknown fields
- `DELETE /profile` nullifies all profile data
- Validation rejects out-of-range values (age 999, etc.)
- Non-authenticated requests to all three endpoints return `401`

---

## Stage 5 — AI Provider Abstraction Layer

### Goal
Build the AI provider interface and implementations. No route or endpoint is created here — this is a pure service/utility module that the chat system (Stage 8) depends on. The abstraction means you can swap Claude for GPT-4o, or run both, by changing one config value.

Also define all tool schemas here. The tools are the "hands" of the AI — they allow the model to search shoes, generate training plans, and search the web.

### Prerequisites
- Stage 1 complete
- At least one AI provider API key in `.env`

### Packages to Install

```bash
# Anthropic
npm install @anthropic-ai/sdk

# OpenAI
npm install openai

# Web search
npm install node-fetch
```

### Files to Create

```
src/ai/
├── ai.module.ts
├── ai.service.ts                    ← main facade, injected everywhere
│
├── interfaces/
│   ├── ai-provider.interface.ts     ← the contract all providers must implement
│   └── tool.interface.ts            ← tool definition contract
│
├── providers/
│   ├── anthropic.provider.ts
│   └── openai.provider.ts
│
├── tools/
│   ├── tool-registry.ts             ← registers and executes tools by name
│   ├── shoe-search.tool.ts
│   ├── training-plan.tool.ts
│   └── web-search.tool.ts
│
└── types/
    ├── message.types.ts             ← shared message types
    ├── tool.types.ts                ← tool input/output types
    └── model-tier.enum.ts
```

### Implementation Details

**`src/ai/interfaces/ai-provider.interface.ts`**
```typescript
export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string | ContentBlock[]
}

export interface ChatParams {
  modelTier: ModelTier           // 'fast' | 'standard' | 'reasoning'
  messages: AIMessage[]
  system?: string
  tools?: ToolDefinition[]
  maxTokens?: number
  temperature?: number
}

export interface ChatResponse {
  content: string
  toolCalls?: ToolCall[]
  inputTokens: number
  outputTokens: number
  model: string
  provider: ProviderName
}

export interface AIProvider {
  chat(params: ChatParams): Promise<ChatResponse>
  stream(params: ChatParams): AsyncIterable<StreamChunk>
  getModelName(tier: ModelTier): string
  estimateCost(inputTokens: number, outputTokens: number, tier: ModelTier): number
}
```

**`src/ai/types/model-tier.enum.ts`**
```typescript
export enum ModelTier {
  FAST = 'fast',           // Claude Haiku / GPT-4o Mini — simple queries, cheap
  STANDARD = 'standard',   // Claude Sonnet / GPT-4o — recommendations, plans
  REASONING = 'reasoning'  // Claude Opus / o1 — complex multi-step reasoning
}
```

**`src/ai/providers/anthropic.provider.ts`**
- Implements `AIProvider`
- Model mapping:
  - `fast` → `claude-haiku-4-5-20251001`
  - `standard` → `claude-sonnet-4-6`
  - `reasoning` → `claude-opus-4-8`
- `chat()`: calls `client.messages.create()` with mapped model
- `stream()`: calls `client.messages.stream()`, yields `StreamChunk` objects
- `estimateCost()`: uses Anthropic token pricing per model
- Converts tool definitions to Anthropic format

**`src/ai/providers/openai.provider.ts`**
- Implements `AIProvider`
- Model mapping:
  - `fast` → `gpt-4o-mini`
  - `standard` → `gpt-4o`
  - `reasoning` → `o1`
- Same interface, converts tool definitions to OpenAI format

**`src/ai/ai.service.ts`**
- Injects `ConfigService`
- On init: creates provider based on `AI_PROVIDER` env var (`anthropic` | `openai`)
- Exposes the same `AIProvider` interface — callers never know which provider
- Also exposes: `chat()`, `stream()`, `estimateCost()`

---

**Tool Definitions:**

**`src/ai/tools/shoe-search.tool.ts`**
```typescript
// Input schema (Zod)
const ShoeSearchInput = z.object({
  use_case: z.enum(['daily_trainer','marathon_racer','trail','tempo','recovery','beginner']),
  surface: z.enum(['road','trail','track','treadmill','multi']).optional(),
  experience: z.enum(['beginner','intermediate','advanced']).optional(),
  budget_usd: z.object({ min: z.number(), max: z.number() }).optional(),
  drop_preference: z.enum(['low','moderate','high','any']).optional(),
  foot_width: z.enum(['narrow','standard','wide','any']).optional(),
  injury_notes: z.array(z.string()).optional(),
  max_results: z.number().default(5)
})

// Tool definition (sent to AI model)
export const shoeSearchToolDefinition: ToolDefinition = {
  name: 'shoe_search',
  description: 'Search the curated shoe catalog to find running shoes matching specific requirements',
  inputSchema: ShoeSearchInput
}

// Execution function
export async function executeShoeSearch(
  input: ShoeSearchInput,
  shoesService: ShoesService
): Promise<ShoeSearchResult[]>
```

**`src/ai/tools/training-plan.tool.ts`**
```typescript
const TrainingPlanInput = z.object({
  goal_race_distance_km: z.number(),
  target_date: z.string(),           // ISO date
  current_weekly_km: z.number(),
  available_days_per_week: z.number().min(3).max(7),
  experience_level: z.enum(['beginner','intermediate','advanced']),
  goal_type: z.enum(['completion','time_target']),
  target_time_minutes: z.number().optional(),
  cross_training_available: z.boolean().default(false)
})

// Returns structured plan matching the type defined in PLAN.md Section 6.3
```

**`src/ai/tools/web-search.tool.ts`**
```typescript
// Calls Brave Search API
// Input: { query: string, context: string }
// Returns: { results: { title, snippet, url, date }[] }
// Uses BRAVE_SEARCH_API_KEY from config
// Endpoint: https://api.search.brave.com/res/v1/web/search
```

**`src/ai/tools/tool-registry.ts`**
- Registers all tools by name
- `execute(toolName: string, input: unknown): Promise<unknown>`
  - Validates input against tool's Zod schema
  - Calls the correct execution function
  - Returns typed result

### Completion Criteria
- `AIService.chat()` returns a valid response with either provider
- `AIService.stream()` yields chunks without error
- All three tools validate their inputs and return typed results
- Switching `AI_PROVIDER` env var between `anthropic` and `openai` works without code changes
- Token cost estimation returns a non-zero number

---

## Stage 6 — Shoe Catalog Module

### Goal
Expose the shoe catalog to the rest of the system — both to the AI tool (`shoe_search`) and directly to the API for browsing. Includes affiliate click tracking.

### Prerequisites
- Stage 2 complete (`shoe_catalog` table exists)
- Stage 3 complete (auth guards)

### Packages to Install

```bash
npm install @upstash/redis
```

### Files to Create

```
src/shoes/
├── shoes.module.ts
├── shoes.controller.ts
├── shoes.service.ts
└── dto/
    ├── shoe-query.dto.ts
    └── shoe-response.dto.ts
```

### Implementation Details

**`src/shoes/shoes.service.ts`**

`search(query: ShoeQueryDto): Promise<Shoe[]>`
- Builds a Supabase query dynamically based on provided filters:
  - `use_case`, `surface` — exact match
  - `price_usd` — between `budget_usd.min` and `budget_usd.max`
  - `experience_level` — match or 'all'
  - `foot_width_range` — match or 'all'
  - `drop_preference` — map 'low' to `drop_mm < 6`, 'moderate' to `6–10`, 'high' to `> 10`
  - `injury_compatible` — check if any element in array overlaps with `injury_notes`
- Order by `price_usd ASC` by default
- Cache result in Upstash Redis with 1-hour TTL
- Cache key: hash of the query parameters

`findById(id: string): Promise<Shoe | null>`
- SELECT single shoe by ID
- Cache in Redis with 1-hour TTL

`recordAffiliateClick(data: AffiliateClickData): Promise<void>`
- INSERT into `affiliate_clicks` table
- Include `shoe_id`, `user_id` or `session_id`, `conversation_id`, `clicked_url`, `affiliate_tag`
- Fire-and-forget (no await at controller level — don't make user wait for tracking)

`buildAffiliateUrl(shoe: Shoe, userId?: string, sessionId?: string): string`
- Takes base `affiliate_url` from shoe record
- Appends affiliate tag + tracking parameters
- Running Warehouse affiliate tag format: `?affil=runnersgarage`

**`src/shoes/shoes.controller.ts`**

```
GET /shoes
  Guard: OptionalJwtAuthGuard
  Query: ShoeQueryDto (all optional filters)
  Returns: { shoes: Shoe[], total: number }

GET /shoes/:id
  Guard: none (public)
  Returns: Shoe | 404

POST /shoes/:id/click
  Guard: OptionalJwtAuthGuard
  Body: { conversation_id?: string }
  Action:
    - Fetch shoe by ID
    - Build affiliate URL
    - Record click asynchronously
    - Return { redirect_url: affiliateUrl }
  Note: Client does the actual redirect — backend just logs and returns URL
```

### Shoe Search Response Shape

```typescript
{
  id: string
  brand: string
  model: string
  version: string | null
  fullName: string
  useCase: string
  surface: string
  dropMm: number | null
  stackHeightMm: number | null
  weightG: number | null
  priceUsd: number
  affiliateUrl: string
  imageUrl: string | null
  keyFeatures: string[]
  bestFor: string[]
  injuryCompatible: string[]
  experienceLevel: string
}
```

### Completion Criteria
- `GET /shoes` returns filtered results matching query parameters
- `GET /shoes` with no params returns all active shoes
- `GET /shoes?use_case=marathon_racer&budget_usd_max=150` returns correctly filtered results
- `POST /shoes/:id/click` returns an affiliate URL and inserts a row in `affiliate_clicks`
- Second identical query hits Redis cache (verify with query count in Supabase dashboard)

---

## Stage 7 — Conversation & Message Core

### Goal
Build the conversation and message storage layer. This stage does NOT include the AI call itself — it only handles creating, storing, and retrieving conversations and messages. Think of this as the "database layer" for chat.

### Prerequisites
- Stage 3 complete (auth guards)
- Stage 2 complete (`conversations` and `messages` tables exist)

### Packages to Install

```bash
npm install cookie-parser
npm install -D @types/cookie-parser
```

### Files to Create

```
src/chat/
├── chat.module.ts
├── chat.controller.ts             ← added in Stage 8
├── conversation.service.ts        ← this stage
├── message.service.ts             ← this stage
└── dto/
    ├── create-conversation.dto.ts
    ├── conversation-response.dto.ts
    └── message-response.dto.ts
```

### Implementation Details

**`src/chat/conversation.service.ts`**

`create(data: CreateConversationData): Promise<Conversation>`
- INSERT into `conversations`
- `user_id` from auth (or null for anonymous)
- `session_id` from cookie (for anonymous) or null
- `domain` detected or passed in
- Returns new conversation

`findAllForUser(userId: string, options: PaginationOptions): Promise<{ conversations, total }>`
- SELECT from conversations WHERE user_id = userId AND status != 'deleted'
- Order by `last_message_at DESC`
- Paginated

`findById(id: string, callerId: string | null, sessionId: string | null): Promise<Conversation | null>`
- SELECT conversation by ID
- Authorization check: `user_id = callerId` OR `session_id = sessionId`
- Returns null if not found or caller doesn't own it

`updateTitle(id: string, title: string): Promise<void>`
- UPDATE `conversations` set `title = title` where id = id

`incrementMessageCount(id: string): Promise<void>`
- UPDATE conversations SET message_count = message_count + 1, last_message_at = NOW()

`archive(id: string, userId: string): Promise<void>`
- UPDATE status = 'archived' where id AND user_id = userId

`delete(id: string, userId: string): Promise<void>`
- UPDATE status = 'deleted' where id AND user_id = userId (soft delete)

---

**`src/chat/message.service.ts`**

`save(data: SaveMessageData): Promise<Message>`
- INSERT into `messages`
- Includes all fields: role, content, tool_calls, tool_results, model info, cost, tokens

`getHistory(conversationId: string, limit: number = 20): Promise<Message[]>`
- SELECT last N messages from conversation ordered by created_at ASC
- These are the messages passed to the AI as context

`getFullHistory(conversationId: string): Promise<Message[]>`
- SELECT all messages — for the frontend conversation view

---

**Add to `main.ts`**
```typescript
// Enable cookies
app.use(cookieParser());
```

**Anonymous Session ID Middleware**
- In `AuthService`, update `getSessionId()`:
  - Read `rg-session-id` from signed cookie
  - If missing: generate UUID v4, set HTTP-only cookie (7-day expiry, SameSite=Lax)
  - Return the session ID
- This ensures every visitor (authed or not) has a persistent session ID

### Conversation Response Shape

```typescript
{
  id: string
  domain: string
  title: string | null
  status: string
  messageCount: number
  lastMessageAt: string | null
  createdAt: string
  messages?: Message[]  // only included when fetching single conversation
}
```

### Endpoints (informational — wired in Stage 8 controller)

```
GET  /conversations           list user's conversations (paginated)
GET  /conversations/:id       get conversation + messages
DELETE /conversations/:id     soft delete
```

### Completion Criteria
- Conversations can be created for both authenticated and anonymous users
- Anonymous conversation is linked by session cookie, not user ID
- Messages can be saved and retrieved in order
- Fetching a conversation you don't own returns null (not an error — prevents enumeration)
- `incrementMessageCount` updates both `message_count` and `last_message_at`

---

## Stage 8 — Chat AI Orchestration

### Goal
Build the actual chat endpoint — the most important feature in the entire backend. This stage wires everything together: auth, profile, conversation history, intent classification, tool selection, AI call, streaming, response processing, and profile extraction.

### Prerequisites
- ALL previous stages complete (1–7)
- At least one AI provider key in `.env`

### Packages to Install

```bash
npm install @nestjs/throttler
npm install uuid
npm install -D @types/uuid
```

### Files to Create

```
src/chat/
├── chat.controller.ts           ← SSE endpoint
├── chat.service.ts              ← orchestration
├── context-builder.service.ts   ← assembles AI context
├── intent-classifier.service.ts ← domain + action detection
├── response-processor.service.ts ← extracts saveable items, profile updates
├── profile-extractor.service.ts ← silently updates profile from message
└── dto/
    ├── send-message.dto.ts
    └── chat-response-metadata.dto.ts
```

### Implementation Details

**`src/chat/dto/send-message.dto.ts`**
```typescript
const SendMessageSchema = z.object({
  message: z.string().min(1).max(4000),
  conversation_id: z.string().uuid().optional(),
  domain: z.enum(['general','shoes','races','training','nutrition','recovery']).optional()
})
```

---

**`src/chat/context-builder.service.ts`**

`build(userId: string | null, conversationId: string | null): Promise<ChatContext>`
- Fetch user profile (if userId)
- Fetch last 20 messages from conversation (if conversationId)
- Build structured context object:
  ```typescript
  interface ChatContext {
    userProfile: UserProfile | null
    conversationHistory: AIMessage[]
    systemPrompt: string           // assembled below
    modelTier: ModelTier
  }
  ```

`buildSystemPrompt(profile: UserProfile | null, domain: string): string`
- Base: "You are an expert running coach, gear specialist, and race advisor..."
- Profile section (if profile exists): inject experience level, goals, mileage, injuries, budget
- Domain section: add domain-specific knowledge and instructions
- Response rules: when to ask clarifying questions, how to format recommendations, affiliate disclosure requirement
- Safety rules: always recommend professional advice for serious injury symptoms

`determineModelTier(domain: string, messageLength: number): ModelTier`
- `training` domain → STANDARD (complex plan generation)
- `recovery` domain → STANDARD (nuanced reasoning required)
- Message > 500 chars → STANDARD
- Otherwise → FAST

---

**`src/chat/intent-classifier.service.ts`**

`classify(message: string, domain?: string): IntentClassification`
- Rule-based first (fast, no AI cost):
  - Contains shoe brand names or "shoes" → `{ domain: 'shoes', action: 'recommend' }`
  - Contains "marathon", "race", "5K", "10K" → `{ domain: 'races', action: 'search' }` or `training`
  - Contains "plan", "training", "schedule" → `{ domain: 'training', action: 'generate' }`
  - Contains "eat", "nutrition", "fuel", "carb" → `{ domain: 'nutrition', action: 'advise' }`
  - Contains "pain", "injury", "hurt", "shin", "IT band" → `{ domain: 'recovery', action: 'advise' }`
- If domain explicitly passed → use it
- Returns: `{ domain, action, requiredTools: string[], needsClarification: boolean }`

`selectTools(intent: IntentClassification): ToolDefinition[]`
- `domain: 'shoes'` → [`shoe_search`]
- `domain: 'training'` → [`training_plan_generate`]
- `domain: 'races'` → [`web_search`] (Phase 2 will add `race_search`)
- `domain: 'general'` → [`web_search`] (optional, only if topic needs real-time data)
- Returns tool definitions in the format the AI provider expects

---

**`src/chat/chat.service.ts`** (core orchestration)

`sendMessage(params: SendMessageParams): AsyncIterable<ChatStreamEvent>`
```
params: {
  message: string
  conversationId?: string
  domain?: string
  user: AuthUser | null
  sessionId: string
}
```

Step-by-step:
1. Get or create conversation
   - If `conversationId` provided: verify ownership, load conversation
   - If not: create new conversation

2. Save user message to DB immediately
   - INSERT message with role='user', content=message

3. Build context
   - `contextBuilder.build(userId, conversationId)`
   - Returns system prompt + conversation history + model tier

4. Classify intent
   - `intentClassifier.classify(message, domain)`
   - Select tools

5. Call AI with streaming
   - `aiService.stream({ modelTier, messages, system, tools })`
   - As chunks arrive, yield `{ type: 'token', text: chunk.text }` events

6. Handle tool calls (if AI requests a tool)
   - When stream emits a tool_use block:
   - Yield `{ type: 'tool_use', tool: toolName, status: 'calling' }` event
   - Execute tool via `toolRegistry.execute(toolName, input)`
   - Feed tool result back to AI as next message in stream
   - Yield `{ type: 'tool_use', tool: toolName, status: 'complete' }` event
   - Continue streaming AI response

7. Collect full response text
   - Accumulate all tokens into final string

8. Post-processing (after stream ends)
   - Save assistant message to DB with all metadata (tokens, cost, model, tool calls)
   - `responseProcessor.extractSaveableItems(fullResponse, toolResults)`
   - `profileExtractor.extract(message, fullResponse)` → update profile if extractions found
   - Auto-generate conversation title if first message (call AI with short prompt: "Summarize in 4 words: ...")
   - `conversationService.incrementMessageCount(conversationId)`

9. Yield final metadata event
   ```
   { type: 'metadata', conversationId, saveableItems: [...], profileUpdates: [...] }
   ```

10. Yield `{ type: 'done' }` and close stream

---

**`src/chat/response-processor.service.ts`**

`extractSaveableItems(response: string, toolResults: ToolResult[]): SaveableItem[]`
- Inspects tool results for structured data
- If `shoe_search` was called → extract shoe objects as saveable items
- If `training_plan_generate` was called → extract plan as saveable item
- Each item includes: `item_type`, `title`, `data`, `domain`

---

**`src/chat/profile-extractor.service.ts`**

`extract(userMessage: string, aiResponse: string): Partial<UserProfile>`
- Rule-based extraction (no extra AI call):
  - "I run 40km a week" → `{ weeklyMileageKm: 40 }`
  - "training for my first marathon" → `{ primaryGoal: 'marathon' }`
  - "I have shin splints" → `{ injuryHistory: [...existing, { type: 'shin_splints', date: today }] }`
  - "I'm a beginner" → `{ experienceLevel: 'beginner' }`
- Returns partial profile update (only non-null discovered fields)

---

**`src/chat/chat.controller.ts`** (SSE streaming)

```typescript
@Post()
@UseGuards(OptionalJwtAuthGuard)
@Sse() // or manual SSE response
async chat(
  @Body() dto: SendMessageDto,
  @CurrentUser() user: AuthUser | undefined,
  @Req() req: RequestWithUser,
  @Res() res: Response
) {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const stream = this.chatService.sendMessage({
    message: dto.message,
    conversationId: dto.conversation_id,
    domain: dto.domain,
    user: user ?? null,
    sessionId: req.sessionId
  })

  for await (const event of stream) {
    res.write(`data: ${JSON.stringify(event)}\n\n`)
    if (event.type === 'done') break
  }

  res.end()
}
```

Additional conversation endpoints (also in this controller):
```
GET  /conversations            (requires JwtAuthGuard)
GET  /conversations/:id        (requires JwtAuthGuard)
DELETE /conversations/:id      (requires JwtAuthGuard)
```

### Completion Criteria
- `POST /chat` with a shoe question streams tokens back in real-time
- AI calls `shoe_search` tool when asked about shoes
- Response is saved to `messages` table with token counts
- New conversation is created if no `conversation_id` supplied
- `GET /conversations` returns list of user's conversations
- Profile extractor finds mileage in "I run 40km per week" message and updates profile
- Saveable items are returned in metadata event for a shoe recommendation response

---

## Stage 9 — Garage Module (Saved Items)

### Goal
Let users save AI recommendations to their Garage and manage their saved items. The Garage is the retention mechanic — it's what makes users come back.

### Prerequisites
- Stage 3 complete (auth guards)
- Stage 7 complete (`saved_items` table exists via Migration 004)

### Packages to Install

```bash
# No new packages
```

### Files to Create

```
src/garage/
├── garage.module.ts
├── garage.controller.ts
├── garage.service.ts
└── dto/
    ├── save-item.dto.ts
    ├── update-item.dto.ts
    └── item-response.dto.ts
```

### Implementation Details

**`src/garage/dto/save-item.dto.ts`**
```typescript
const SaveItemSchema = z.object({
  item_type: z.enum(['shoe','race','training_plan','nutrition_plan','recommendation']),
  domain: z.enum(['shoes','races','training','nutrition','recovery']),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  data: z.record(z.unknown()),         // flexible JSONB
  thumbnail_url: z.string().url().optional(),
  source_conversation_id: z.string().uuid().optional(),
  source_message_id: z.string().uuid().optional(),
  tags: z.array(z.string()).optional()
})
```

**`src/garage/garage.service.ts`**

`findAll(userId: string, filters: GarageFilters): Promise<{ items: SavedItem[], total: number }>`
- SELECT from `saved_items` WHERE user_id = userId
- Optional filters: `domain`, `item_type`
- Order: pinned items first, then by `created_at DESC`
- Paginated (page, limit)

`findOne(id: string, userId: string): Promise<SavedItem | null>`
- SELECT by id AND user_id (ownership enforced)

`save(userId: string, dto: SaveItemDto): Promise<SavedItem>`
- INSERT into `saved_items`
- Returns saved item

`update(id: string, userId: string, dto: UpdateItemDto): Promise<SavedItem>`
- UPDATE `title`, `description`, `tags`, `is_pinned` only
- Cannot update `data` (the actual recommendation never changes once saved)
- Returns updated item

`delete(id: string, userId: string): Promise<void>`
- Hard delete (user explicitly chose to remove it)

**`src/garage/garage.controller.ts`**

```
GET  /garage
  Guard: JwtAuthGuard
  Query: { domain?, item_type?, page?, limit? }
  Returns: { items: SavedItem[], total: number, page: number }

GET  /garage/:id
  Guard: JwtAuthGuard
  Returns: SavedItem | 404

POST /garage
  Guard: JwtAuthGuard
  Body: SaveItemDto
  Returns: SavedItem (201)

PUT  /garage/:id
  Guard: JwtAuthGuard
  Body: UpdateItemDto (title, description, tags, is_pinned — all optional)
  Returns: SavedItem

DELETE /garage/:id
  Guard: JwtAuthGuard
  Returns: { success: true } (204)
```

### Completion Criteria
- `POST /garage` saves a shoe recommendation correctly
- `GET /garage` returns items for authenticated user only
- `GET /garage?domain=shoes` returns only shoe items
- `PUT /garage/:id` with `is_pinned: true` moves item to top in subsequent GET
- Attempting to access another user's item returns 404
- `DELETE /garage/:id` removes the item permanently

---

## Stage 10 — Rate Limiting & Caching

### Goal
Enforce the free tier conversation limit (20/month) and add Redis-backed caching for shoe queries and AI responses. This protects against cost explosion and improves response time.

### Prerequisites
- Stage 3 (auth) and Stage 8 (chat) complete
- Upstash Redis account created, credentials in `.env`

### Packages to Install

```bash
npm install @upstash/redis
npm install @nestjs/throttler
```

### Files to Create

```
src/common/
├── guards/
│   └── conversation-rate-limit.guard.ts
└── services/
    └── cache.service.ts

src/redis/
├── redis.module.ts
└── redis.service.ts
```

### Implementation Details

**`src/redis/redis.service.ts`**
- Creates Upstash Redis client using `@upstash/redis`
- Wraps `get()`, `set()`, `incr()`, `expire()` with typed helpers
- Exported as a global module

**`src/common/guards/conversation-rate-limit.guard.ts`**
- Applied to `POST /chat` only
- Logic:
  ```
  If user is authenticated and not on Pro tier:
    key = `rate:conv:${userId}:${year}-${month}`
    count = await redis.incr(key)
    If count === 1: redis.expire(key, seconds_until_end_of_month)
    If count > 20: throw ForbiddenException('Monthly conversation limit reached. Upgrade to Pro.')
  If anonymous:
    key = `rate:conv:anon:${sessionId}:${year}-${month}`
    limit = 5 (anonymous users get 5/month)
  If Pro user: skip check entirely
  ```
- Rate limit headers in response: `X-RateLimit-Remaining`, `X-RateLimit-Reset`

**`src/common/services/cache.service.ts`**

`get<T>(key: string): Promise<T | null>`
`set<T>(key: string, value: T, ttlSeconds: number): Promise<void>`
`delete(key: string): Promise<void>`
`buildShoeQueryKey(query: ShoeQueryDto): string`
- Serialize query to sorted JSON, return `sha256` hash

**Caching applied in `ShoesService`:**
- Before DB query: check Redis for `shoe:search:{hash}`
- After DB query: store result with 1-hour TTL

**AI Response Caching (in `ChatService`):**
- Cache key: `ai:response:{hash}` where hash = sha256 of (system_prompt + last 3 messages + tool results)
- TTL: 24 hours
- Only cache responses with no tool calls (tool results are dynamic)
- Only cache `FAST` tier responses (not training plans — those should be fresh)

### Completion Criteria
- 21st conversation attempt in a calendar month returns `403` with meaningful message
- Anonymous user limit (5/month) enforced via session cookie
- Second identical shoe query returns in < 10ms (cache hit)
- Cache miss logs in development, silent in production
- `X-RateLimit-Remaining` header present on all `/chat` responses

---

## Stage 11 — Training Plan PDF Export

### Goal
Allow users to export a saved training plan as a downloadable PDF. This is a Pro feature and a key driver for subscription conversion.

### Prerequisites
- Stage 9 complete (Garage module)
- Stage 3 complete (auth guards)

### Packages to Install

```bash
npm install @react-pdf/renderer react react-dom
npm install -D @types/react @types/react-dom
```

### Files to Create

```
src/garage/
├── pdf/
│   ├── training-plan.pdf.tsx      ← React PDF template
│   └── pdf-generator.service.ts
```

### Implementation Details

**`src/garage/pdf/training-plan.pdf.tsx`**
- React component using `@react-pdf/renderer` primitives (`Document`, `Page`, `View`, `Text`, `StyleSheet`)
- Accepts typed `TrainingPlan` data as props
- Layout:
  - Header: plan title, goal race, target date, total weeks
  - Summary row: peak weekly km, total distance
  - Week-by-week table: week number, phase, total km, daily workouts
  - Footer: "Generated by RunnersGarage.com"
- Styled to be clean and printable (black/white friendly)

**`src/garage/pdf/pdf-generator.service.ts`**

`generateTrainingPlanPdf(plan: TrainingPlanData): Promise<Buffer>`
- Call `renderToStream(React.createElement(TrainingPlanPdfTemplate, { plan }))`
- Pipe to buffer
- Return buffer

**New endpoint in `GarageController`:**

```
GET /garage/:id/export/pdf
  Guard: JwtAuthGuard
  Validates:
    - Item must belong to user
    - Item type must be 'training_plan'
    - User must be on Pro tier (future — for now allow all authenticated)
  Response:
    - Content-Type: application/pdf
    - Content-Disposition: attachment; filename="training-plan.pdf"
    - Body: PDF buffer
```

### Completion Criteria
- `GET /garage/:id/export/pdf` for a saved training plan returns a valid PDF
- PDF contains the correct week count and workout data
- Non-training-plan item types return `400 Bad Request`
- PDF is readable and properly formatted

---

## Stage 12 — Observability & Production Hardening

### Goal
Add error tracking, request logging, performance monitoring, and production-ready configuration. This stage makes the backend debuggable and operable.

### Prerequisites
- All previous stages complete
- Sentry project created

### Packages to Install

```bash
npm install @sentry/nestjs @sentry/profiling-node
npm install compression
npm install -D @types/compression
```

### Files to Create

```
src/common/interceptors/
├── logging.interceptor.ts
└── performance.interceptor.ts

src/common/filters/
└── sentry-exception.filter.ts
```

### Implementation Details

**`src/common/interceptors/logging.interceptor.ts`**
- Logs every incoming request: method, path, user ID (if authed)
- Logs every response: status code, latency
- Uses NestJS Logger (not console.log)
- In production: structured JSON format (Railway picks this up)
- In development: human-readable format

**`src/common/filters/sentry-exception.filter.ts`**
- Wraps `HttpExceptionFilter`
- Captures all 5xx errors to Sentry
- Attaches user context (user ID, not email) to Sentry events
- Does NOT send 4xx errors to Sentry (client errors, not bugs)

**`src/main.ts` additions**
```typescript
// Sentry init (before anything else)
Sentry.init({ dsn: config.sentryDsn, environment: config.nodeEnv })

// Response compression
app.use(compression())

// Request size limit
app.use(express.json({ limit: '100kb' }))
```

**AI Cost Monitoring Endpoint (admin only)**

```
GET /admin/ai-costs
  Guard: JwtAuthGuard + admin check
  Query: { from?, to? }
  Returns: {
    totalCostUsd: number,
    byProvider: { openai: number, anthropic: number },
    byModelTier: { fast: number, standard: number },
    topUsers: { userId, totalCost }[]
  }
```

**Health check enhancement:**

```
GET /health
  Returns:
  {
    status: 'ok',
    timestamp: '...',
    version: '...',
    services: {
      database: 'ok' | 'error',
      redis: 'ok' | 'error',
      ai: 'ok' | 'error'
    }
  }
```
- Each service check is a lightweight ping (Supabase: `SELECT 1`, Redis: `PING`, AI: model list)
- If any service is down, overall status is 'degraded'

**Railway Deployment Config**

Create `railway.json`:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node dist/main.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### Completion Criteria
- Every API request produces a structured log line with method, path, status, latency
- Throwing a 500 error in any endpoint creates a Sentry event
- 400/404 errors do NOT create Sentry events
- `GET /health` accurately reports database and Redis connectivity
- `npm run build && node dist/main.js` starts the production server without errors
- Railway deployment succeeds and health check passes

---

## Summary Table

| Stage | What Gets Built | Key Output |
|---|---|---|
| 1 | NestJS setup, folder structure, config, global middleware | `GET /health` works |
| 2 | All Supabase tables, RLS policies, indexes | Complete database schema |
| 3 | Auth guards, session handling, user decorator | JWT verification working |
| 4 | User profile CRUD | `GET/PUT/DELETE /profile` |
| 5 | AI provider abstraction, tool definitions | `AIService.stream()` works |
| 6 | Shoe catalog queries, affiliate tracking | `GET /shoes`, affiliate click logging |
| 7 | Conversation and message storage | DB layer for chat ready |
| 8 | Chat SSE endpoint, AI orchestration, streaming | `POST /chat` streams AI response |
| 9 | Saved items CRUD | `GET/POST/PUT/DELETE /garage` |
| 10 | Rate limiting, Redis caching | Free tier enforced, responses cached |
| 11 | Training plan PDF export | `GET /garage/:id/export/pdf` |
| 12 | Sentry, logging, production config | Deployable to Railway |

---

## Environment Variables Reference

```
# Server
PORT=3001
NODE_ENV=development | production

# Frontend (for CORS)
FRONTEND_URL=http://localhost:3000

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...          # never expose to client
SUPABASE_ANON_KEY=...

# AI Providers (at least one required for Stage 8+)
AI_PROVIDER=anthropic                  # anthropic | openai
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...

# Web Search
BRAVE_SEARCH_API_KEY=...

# Caching & Rate Limiting
UPSTASH_REDIS_URL=...
UPSTASH_REDIS_TOKEN=...

# Email
RESEND_API_KEY=...

# Observability
SENTRY_DSN=...

# Affiliate
RUNNING_WAREHOUSE_AFFILIATE_TAG=runnersgarage
AMAZON_AFFILIATE_TAG=runnersgarage-20
```

---

*End of Backend Build Plan*
*Companion document: FRONTEND_PLAN.md (to be created)*
