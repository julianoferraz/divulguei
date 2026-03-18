# System Overview — Divulguei.Online

## High-Level Architecture

Divulguei.Online is a **monorepo** containing three independent services that communicate through a shared PostgreSQL database and Redis cache. All services are containerized via Docker Compose and deployed to a single VPS.

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                 │
│                            │                                     │
│                    ┌───────▼───────┐                             │
│                    │  Nginx Proxy  │                             │
│                    │  (SSL + Routing)                            │
│                    └───┬───────┬───┘                             │
│                        │       │                                 │
│              ┌─────────▼─┐   ┌─▼──────────┐  ┌──────────────┐  │
│              │ Web (SPA) │   │ API        │  │ WhatsApp Bot │  │
│              │ React 18  │   │ Fastify 5  │  │ Baileys 6    │  │
│              │ Port 3000 │   │ Port 3001  │  │ No port      │  │
│              └───────────┘   └──┬─────┬───┘  └──┬───────┬───┘  │
│                                 │     │         │       │       │
│                          ┌──────▼─┐ ┌─▼────┐   │       │       │
│                          │Postgres│ │Redis │◄──┘       │       │
│                          │  16    │ │  7   │           │       │
│                          └────────┘ └──────┘           │       │
│                                                         │       │
│                                              ┌──────────▼────┐  │
│                                              │  OpenAI API   │  │
│                                              │  (External)   │  │
│                                              └───────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Services

### 1. API Backend (`packages/api`)

**Role**: Central REST API serving both the web frontend and the WhatsApp bot.

- **Framework**: Fastify 5 with TypeScript
- **Port**: 3001 (internal), exposed as 127.0.0.1:3011 on host
- **Responsibilities**:
  - User authentication (JWT with WhatsApp OTP + Google OAuth)
  - CRUD operations for all entities (businesses, classifieds, professionals, jobs, events, news, public services)
  - AI-powered search via OpenAI integration
  - File upload handling
  - Admin dashboard endpoints
  - Interaction logging and analytics
- **Middleware**:
  - `auth.ts` — JWT verification, user extraction, admin/owner checks
  - `city-context.ts` — Resolves city from `:citySlug` URL parameter
- **Modules**: auth, businesses, classifieds, professionals, jobs, events, news, public-services, alerts, search, interactions, subscriptions, categories, cities, admin

### 2. Web Frontend (`packages/web`)

**Role**: Single Page Application served via Nginx.

- **Framework**: React 18 + Vite 6 + Tailwind CSS 3
- **Port**: 3000 (Nginx container), exposed as 127.0.0.1:3012 on host
- **Routing**: React Router v6 with city-slug-scoped routes
- **State Management**: React hooks (useAuth context provider)
- **API Communication**: Fetch-based API client with JWT token injection

### 3. WhatsApp Bot (`packages/bot`)

**Role**: Automated WhatsApp assistant for search, classified creation, and alerts.

- **Library**: Baileys 6 (unofficial WhatsApp Web API)
- **Port**: None (outbound-only via WhatsApp Web Socket)
- **Responsibilities**:
  - Private message handling (text, audio, image)
  - Group message classification and selective response
  - Scheduled tasks (classified expiry, news fetch, alert notifications, daily reset)
  - Direct database access (PostgreSQL) and Redis session management
- **AI Integration**: OpenAI GPT-4.1-mini (classification), GPT-4o (vision), Whisper (audio transcription)

## Dependencies

### Internal Dependencies

| From | To | Protocol | Purpose |
|------|----|----------|---------|
| Web → API | HTTP (via Nginx proxy) | REST API calls |
| Bot → PostgreSQL | TCP (pg driver) | Direct database queries |
| Bot → Redis | TCP | Session state, cooldowns |
| API → PostgreSQL | TCP (pg driver) | All data operations |
| API → Redis | TCP (ioredis) | Auth codes, rate limiting, caching |
| API → OpenAI | HTTPS | AI search, description improvement |
| Bot → OpenAI | HTTPS | Intent classification, vision, whisper |

### External Dependencies

| Service | Purpose | Risk |
|---------|---------|------|
| **OpenAI API** | AI classification, search, vision, audio | Cost scaling, API availability |
| **WhatsApp (via Baileys)** | Bot messaging, user auth codes | Unofficial API, potential blocks |
| **RSS Feeds** | News aggregation | Feed availability, format changes |
| **GitHub** | Source code, CI/CD | Deployment pipeline dependency |

## Infrastructure

### Server
- **VPS**: Single server at 161.97.171.94
- **OS**: Linux
- **Orchestration**: Docker Compose v3.8
- **Reverse Proxy**: Nginx (external, via Nginx Proxy Manager for SSL)

### Docker Volumes
| Volume | Mount | Purpose |
|--------|-------|---------|
| `divulguei-pgdata` | `/var/lib/postgresql/data` | Persistent database storage |
| `divulguei-bot-auth` | `/app/auth` | Baileys session (QR code scan) |
| `divulguei-uploads` | `/app/uploads` | User-uploaded images |

### Docker Networks
| Network | Purpose |
|---------|---------|
| `default` | Internal service-to-service communication |
| `npm` | External access via Nginx Proxy Manager |

### Environment Configuration
- API: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `OPENAI_API_KEY`, `CORS_ORIGIN`
- Bot: `DB_HOST`, `REDIS_HOST`, `OPENAI_API_KEY`, `DEFAULT_CITY_ID`, `BOT_PHONE_NUMBER`
- Web: `VITE_API_BASE`, `VITE_WHATSAPP_NUMBER`
