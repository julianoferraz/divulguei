# Code Map — Divulguei.Online

## Repository Root

```
/opt/divulguei-online/
├── ai/                          → AI development layer (documentation & workflow)
├── nginx/                       → Nginx configuration files
│   └── divulguei.conf           → External Nginx proxy config (SSL, domain routing)
├── packages/                    → Monorepo packages
│   ├── api/                     → Backend REST API
│   ├── web/                     → Frontend SPA
│   └── bot/                     → WhatsApp Bot
├── docker-compose.yml           → Docker services orchestration
├── nginx-web.conf               → Web container internal Nginx config (SPA routing)
├── AI_PROJECT_CONTEXT.md        → Legacy AI context document
├── DECISION_LOG.md              → Decision log template (empty)
├── PROJECT_BOOTSTRAP_CHECKLIST.md → Bootstrap checklist
├── QA_VALIDATION_REPORT.md      → QA audit results
└── README.md                    → Project readme
```

---

## packages/api — Backend REST API

```
packages/api/
├── Dockerfile                   → Multi-stage build (node:20-alpine)
├── package.json                 → Dependencies: fastify, pg, ioredis, openai, zod, etc.
├── tsconfig.json                → TypeScript config (ESNext, NodeNext)
└── src/
    ├── server.ts                → App entry: Fastify setup, plugin registration, route mounting, server start
    │
    ├── config/
    │   ├── database.ts          → PostgreSQL connection pool (pg), slow query warning (>1s)
    │   ├── env.ts               → Environment variable loader with defaults
    │   └── redis.ts             → Redis client (ioredis) setup
    │
    ├── middleware/
    │   ├── auth.ts              → JWT verification, requireAuth, requireAdmin, requireOwnerOrAdmin helpers
    │   └── city-context.ts      → Resolves :citySlug param to city record, attaches to request
    │
    ├── migrations/
    │   ├── run.ts               → Execute SQL migrations in order
    │   ├── seed.ts              → Seed initial data (Floresta-PE city, categories, admin user, sample data)
    │   └── sql/
    │       ├── 001_cities.sql         → Cities table + indexes
    │       ├── 002_categories.sql     → Categories table (hierarchical, typed)
    │       ├── 003_users.sql          → Users table (phone-based auth, roles)
    │       ├── 004_businesses.sql     → Businesses table (directory listings)
    │       ├── 005_business_claims.sql → Business ownership claims
    │       ├── 006_classifieds.sql    → Classified ads marketplace
    │       ├── 007_professionals.sql  → Professional services directory
    │       ├── 008_jobs.sql           → Job board listings
    │       ├── 009_events.sql         → Community events
    │       ├── 010_news.sql           → News sources + articles (RSS)
    │       ├── 011_public_services.sql → Public utility services
    │       ├── 012_whatsapp_groups.sql → WhatsApp group management
    │       ├── 013_alerts.sql         → User alert subscriptions
    │       ├── 014_interactions.sql   → Analytics/interaction logging
    │       └── 015_subscriptions.sql  → Business subscription plans
    │
    ├── modules/                 → Feature modules (each has routes.ts, some have schema.ts)
    │   ├── admin/
    │   │   └── routes.ts        → Admin dashboard, CRUD for cities/categories/groups/news-sources/subscriptions
    │   ├── alerts/
    │   │   └── routes.ts        → Create alert, list my alerts, delete alert
    │   ├── auth/
    │   │   ├── routes.ts        → WhatsApp OTP request/verify, Google OAuth, /me endpoint
    │   │   └── schema.ts        → Zod schemas for auth payloads
    │   ├── businesses/
    │   │   └── routes.ts        → Business CRUD, claiming, admin claim management
    │   ├── categories/
    │   │   └── routes.ts        → List categories (hierarchical), get by ID
    │   ├── cities/
    │   │   └── routes.ts        → List cities, get by slug
    │   ├── classifieds/
    │   │   └── routes.ts        → Classified CRUD, AI improve, status update
    │   ├── events/
    │   │   └── routes.ts        → Event CRUD, admin approval
    │   ├── interactions/
    │   │   └── routes.ts        → Log interaction endpoint
    │   ├── jobs/
    │   │   └── routes.ts        → Job CRUD
    │   ├── news/
    │   │   └── routes.ts        → List news, get article detail
    │   ├── professionals/
    │   │   └── routes.ts        → Professional CRUD
    │   ├── public-services/
    │   │   └── routes.ts        → List public services, admin CRUD
    │   ├── search/
    │   │   └── routes.ts        → AI-powered cross-entity search
    │   └── subscriptions/
    │       └── routes.ts        → Subscription management (admin)
    │
    ├── services/                → Shared service integrations
    │   ├── ai.ts                → OpenAI GPT-4.1-mini: intent classification, search, description improvement
    │   ├── vision.ts            → OpenAI GPT-4o: image analysis (extract product/business info)
    │   └── whisper.ts           → OpenAI Whisper: audio transcription (Portuguese)
    │
    └── utils/
        ├── helpers.ts           → Slug generation, date formatting, pagination parsing
        └── response.ts          → Standardized API response helpers (success, error, paginated)
```

---

## packages/web — Frontend SPA

```
packages/web/
├── Dockerfile                   → Multi-stage build (node:20-alpine → nginx:alpine)
├── index.html                   → SPA entry point
├── nginx.conf                   → Internal Nginx config (SPA fallback, API proxy)
├── package.json                 → Dependencies: react, react-router, tailwindcss, lucide-react, date-fns
├── postcss.config.js            → PostCSS + Tailwind plugin
├── tailwind.config.js           → Tailwind configuration (custom theme)
├── tsconfig.json                → TypeScript config
├── vite.config.ts               → Vite build config
└── src/
    ├── App.tsx                  → Root component: React Router routes, AuthProvider, city-scoped layout
    ├── main.tsx                 → ReactDOM entry, mounts App
    ├── index.css                → Tailwind directives + custom base styles
    ├── vite-env.d.ts            → Vite type declarations
    │
    ├── components/
    │   ├── Header.tsx           → Navigation bar, search bar, responsive menu
    │   ├── Footer.tsx           → Footer links, WhatsApp number
    │   ├── UI.tsx               → Reusable UI primitives (LoadingSpinner, EmptyState)
    │   └── WhatsAppFab.tsx      → Floating WhatsApp action button
    │
    ├── hooks/
    │   ├── useAuth.tsx          → Auth context: JWT management, login/logout, user profile, role checks
    │   └── useApi.ts            → Generic fetch wrapper with auth token injection
    │
    ├── pages/
    │   ├── CitySelector.tsx     → Root page: select city to enter
    │   ├── Home.tsx             → City homepage: hero search, featured content sections
    │   ├── Businesses.tsx       → Business directory with filters
    │   ├── BusinessDetail.tsx   → Business profile page
    │   ├── Classifieds.tsx      → Classified ads listing with filters
    │   ├── ClassifiedDetail.tsx → Classified ad detail page
    │   ├── ClassifiedCreate.tsx → New classified form with AI improvement
    │   ├── Professionals.tsx    → Professional services listing
    │   ├── Jobs.tsx             → Job board listing
    │   ├── Events.tsx           → Events calendar listing
    │   ├── EventDetail.tsx      → Event detail page
    │   ├── News.tsx             → News articles listing
    │   ├── PublicServices.tsx   → Public services directory
    │   ├── Login.tsx            → WhatsApp OTP authentication (2-step)
    │   ├── Profile.tsx          → User profile, alerts management
    │   └── admin/               → Admin panel pages
    │       ├── Dashboard.tsx    → Metrics overview
    │       ├── AdminBusinesses.tsx    → Business management
    │       ├── AdminClassifieds.tsx   → Classified moderation
    │       ├── AdminEvents.tsx        → Event approval
    │       ├── AdminCategories.tsx    → Category management
    │       ├── AdminCities.tsx        → City management
    │       ├── AdminGroups.tsx        → WhatsApp group config
    │       └── AdminClaims.tsx        → Business claim review
    │
    ├── services/
    │   └── api.ts               → API client: base URL, fetch with auth, response parsing
    │
    └── utils/
        └── format.ts            → Date, currency, phone formatting utilities
```

---

## packages/bot — WhatsApp Bot

```
packages/bot/
├── Dockerfile                   → Build from node:20-alpine
├── package.json                 → Dependencies: baileys, openai, pg, ioredis, node-cron, rss-parser
├── tsconfig.json                → TypeScript config
└── src/
    ├── index.ts                 → Entry point: initialize Baileys connection, register message handlers
    ├── config.ts                → Environment config loader (DB, Redis, OpenAI, bot settings)
    ├── connection.ts            → Baileys WhatsApp connection manager (QR auth, reconnection)
    ├── private.ts               → Private message handler: intent classification, search, classified/alert creation flows
    ├── group.ts                 → Group message handler: classification, smart responses, cooldown management
    ├── media.ts                 → Media processing: download audio/images from WhatsApp, prepare for AI
    └── cron.ts                  → Scheduled jobs: classified expiry, daily reset, news fetch, alert notifications
```

---

## Configuration Files

```
/opt/divulguei-online/
├── docker-compose.yml           → 5 services: postgres, redis, api, web, bot
├── nginx-web.conf               → Web container Nginx (SPA fallback, /api proxy, /uploads proxy)
├── nginx/divulguei.conf         → External Nginx (domain routing, SSL)
└── .github/workflows/           → CI/CD: auto-deploy on push to main
```
