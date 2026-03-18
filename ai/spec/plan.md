# Implementation Plan — Divulguei.Online

## Implementation Strategy

The project follows a **city-by-city launch** model. The first city (Floresta, PE) is fully implemented. Future growth involves:

1. **Stabilize MVP** — Fix known issues, add error boundaries, improve UX
2. **Monetize** — Integrate payment processing for premium business plans
3. **Scale** — Add new cities, onboard local admins
4. **Enhance** — Map integration, social sharing, mobile optimization

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  ┌──────────────────┐           ┌────────────────────────┐     │
│  │  React SPA       │           │  WhatsApp Bot          │     │
│  │  (Vite + TW CSS) │           │  (Baileys + OpenAI)    │     │
│  │  Port: 3000      │           │  No public port        │     │
│  └────────┬─────────┘           └──────────┬─────────────┘     │
│           │                                 │                    │
├───────────┼─────────────────────────────────┼────────────────────┤
│           │         GATEWAY LAYER           │                    │
│           ▼                                 │                    │
│  ┌──────────────────┐                       │                    │
│  │  Nginx (Reverse  │                       │                    │
│  │  Proxy + SSL)    │                       │                    │
│  └────────┬─────────┘                       │                    │
│           │                                 │                    │
├───────────┼─────────────────────────────────┼────────────────────┤
│           │         SERVICE LAYER           │                    │
│           ▼                                 ▼                    │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              Fastify REST API (Port 3001)             │       │
│  │  ┌─────────┐ ┌───────┐ ┌──────┐ ┌───────┐ ┌──────┐ │       │
│  │  │ Auth    │ │Biz    │ │Class.│ │Search │ │Admin │ │       │
│  │  │ Module  │ │Module │ │Module│ │Module │ │Module│ │       │
│  │  └─────────┘ └───────┘ └──────┘ └───────┘ └──────┘ │       │
│  └────────────────────┬─────────────────────────────────┘       │
│                       │                                          │
├───────────────────────┼──────────────────────────────────────────┤
│                       │         DATA LAYER                       │
│              ┌────────┴────────┐                                 │
│              ▼                 ▼                                  │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│  │  PostgreSQL 16   │ │  Redis 7         │ │  OpenAI API      │ │
│  │  (Primary DB)    │ │  (Cache/Sessions)│ │  (AI Services)   │ │
│  │  Port: 5432      │ │  Port: 6379      │ │  External        │ │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

## Technology Stack Rationale

| Choice | Reason |
|--------|--------|
| **Fastify** | High performance, schema validation, TypeScript-first |
| **React + Vite** | Fast builds, modern DX, large ecosystem |
| **Tailwind CSS** | Utility-first, rapid UI development without custom CSS |
| **PostgreSQL** | Reliable, JSONB support for flexible fields, great for relational data |
| **Redis** | Fast ephemeral storage for auth codes, sessions, rate limiting |
| **Baileys** | Open-source WhatsApp Web API, no Meta Business API costs |
| **OpenAI** | Best-in-class NLU for search, classification, and content generation |
| **Docker Compose** | Simple single-server orchestration, reproducible environments |
| **Nginx** | Battle-tested reverse proxy, SSL termination, static file serving |

## Monorepo Structure

```
/opt/divulguei-online/
├── packages/
│   ├── api/        → Backend REST API (Fastify + TypeScript)
│   ├── web/        → Frontend SPA (React + Vite + Tailwind)
│   └── bot/        → WhatsApp Bot (Baileys + OpenAI)
├── ai/             → AI development layer (this documentation)
├── nginx/          → Nginx configuration
├── docker-compose.yml
└── .github/workflows/  → CI/CD
```

## Deployment Pipeline

1. Developer pushes to `main` branch on GitHub
2. GitHub Actions workflow triggers
3. SSH into VPS at 161.97.171.94
4. Run `docker compose up -d --build`
5. Services rebuild and restart automatically
6. Zero-downtime not guaranteed (brief downtime during rebuild)

## Priority Roadmap

### Phase 1: Stability (Current)
- Fix error handling gaps
- Add React error boundaries
- Improve input validation
- Add Redis persistence configuration

### Phase 2: Monetization
- Integrate payment gateway (Stripe or PagSeguro)
- Implement premium business features in UI
- Build subscription management workflow

### Phase 3: Growth
- Add map integration (Leaflet/OpenStreetMap)
- Implement social sharing (OG meta tags + share buttons)
- Set up automated testing (Vitest unit + Playwright E2E)
- Add new cities

### Phase 4: Enhancement
- Google OAuth in frontend
- Email notification support
- Analytics export (CSV/PDF)
- Image gallery improvements
- Mobile-responsive optimizations
