# Product Definition — Divulguei.Online

## Features Already Implemented

### Core Platform
- [x] **Multi-city support** — City selector, slug-based routing, per-city data isolation
- [x] **JWT Authentication** — WhatsApp OTP code + Google OAuth (backend), WhatsApp OTP in frontend
- [x] **Role-based access** — Admin, business_owner, advertiser, resident roles
- [x] **File uploads** — Image upload with MIME validation (JPG/PNG/WebP/GIF, 5MB max)
- [x] **Rate limiting** — Global 100 req/min via Fastify plugin

### Business Directory
- [x] CRUD for businesses (admin creates, owners can update after claiming)
- [x] Business claiming system with proof upload and admin approval
- [x] Category and neighborhood filtering
- [x] Search with pagination
- [x] View count tracking
- [x] Featured businesses support
- [x] Free/Basic/Premium plan field (database-level)

### Classified Marketplace
- [x] CRUD for classified ads (sell/buy/rent_offer/rent_search/service)
- [x] AI-powered description improvement (preview before applying)
- [x] Type, category, price range, and neighborhood filtering
- [x] Auto-expiration after 30 days (cron job)
- [x] Status management (active/expired/sold/rented/removed)

### Professional Services Directory
- [x] CRUD for professional profiles
- [x] Service area and specialization listing
- [x] Category filtering and search

### Job Board
- [x] CRUD for job postings (CLT/temporary/freelance/internship)
- [x] Filter by job type
- [x] Status tracking (active/filled/expired/removed)

### Events Calendar
- [x] CRUD with admin approval workflow
- [x] Date-based filtering (future events only)
- [x] Featured events support
- [x] Venue information with optional coordinates

### News Aggregation
- [x] RSS feed integration with configurable sources
- [x] Automated fetch every 2 hours (cron)
- [x] Duplicate detection by original URL

### Public Services Directory
- [x] Categorized listing (emergency/pharmacy/health/government/transport/utility)
- [x] Admin-managed CRUD

### Alert System
- [x] Keyword-based alerts for classifieds/jobs/events/promotions
- [x] Automated WhatsApp notifications every 30 minutes (cron)

### AI-Powered Search
- [x] Natural language query understanding via GPT-4.1-mini
- [x] Cross-entity search (businesses, classifieds, professionals, jobs, events)
- [x] Intent classification and smart result grouping

### WhatsApp Bot
- [x] Private chat: text search, audio transcription (Whisper), image analysis (GPT-4o Vision)
- [x] Private chat: classified creation flow (multi-step with Redis session)
- [x] Private chat: alert creation
- [x] Group chat: question/recommendation detection and smart responses
- [x] Group chat: rate limiting (cooldown + daily max)
- [x] Auto-registration of new WhatsApp groups

### Admin Dashboard
- [x] Metrics overview (businesses, classifieds, events, users, interactions)
- [x] Top searches analytics
- [x] Management of: businesses, classifieds, events, categories, cities, WhatsApp groups, business claims
- [x] Subscription management (manual creation)

### Infrastructure
- [x] Docker Compose (5 services: postgres, redis, api, web, bot)
- [x] Nginx reverse proxy with SPA fallback
- [x] GitHub Actions CI/CD (auto deploy to VPS on push)
- [x] Database migrations (15 sequential SQL files)
- [x] Seed data for initial city (Floresta-PE)

## Expected / Incomplete Features

| Feature | Status | Notes |
|---------|--------|-------|
| Premium business differentiation (UI) | Stub | Plan field exists in DB, no UI distinction |
| Google OAuth in frontend | Stub | Backend ready, no frontend Login integration |
| Map integration | Stub | Lat/long fields exist, no map display |
| Payment processing | Not started | Subscription table exists, no Stripe/PagSeguro |
| Analytics export (CSV/PDF) | Not started | Dashboard shows data, no export |
| Social sharing buttons | Not started | No OG tags or share buttons |
| Email notifications | Not started | Only WhatsApp alerts implemented |
| Automated tests | Not started | Vitest installed, no test files |
| E2E tests | Not started | No Cypress/Playwright setup |
| Mobile app | Not planned | Web-only for now |
| Multi-language (i18n) | Not planned | All hardcoded in Portuguese |
| Business menu display | Stub | DB field exists, not shown in frontend |
| Image gallery UI | Minimal | JSONB array support, basic display |
| Error boundaries (React) | Not started | No error boundary components |

## User Flows

### Resident Flow
1. Visit site → Select city → Browse home page
2. Search for business/service via search bar or AI search
3. Browse categories (businesses, classifieds, jobs, events, professionals)
4. View detail pages, get contact info (phone/WhatsApp)
5. Optionally: Login via WhatsApp → Create classified ad, set up alerts

### Business Owner Flow
1. Discover business already listed (imported or admin-created)
2. Login via WhatsApp → Claim business → Submit proof
3. Admin approves → Owner can update business profile
4. Optionally upgrade to premium plan (manual via admin)

### WhatsApp User Flow
1. Send message to bot number → Greeting and menu
2. Type search query or send audio/image → AI processes and returns results
3. Type "anunciar" → Multi-step classified creation flow
4. Type "alerta" → Set up keyword alert

### Admin Flow
1. Login → Access admin dashboard
2. Review metrics, manage content (CRUD all entities)
3. Approve/reject events and business claims
4. Configure WhatsApp groups and news sources

## Major Components

| Component | Package | Technology |
|-----------|---------|------------|
| REST API | `packages/api` | Fastify 5 + TypeScript |
| Web Frontend | `packages/web` | React 18 + Vite 6 + Tailwind |
| WhatsApp Bot | `packages/bot` | Baileys 6 + OpenAI |
| Database | Docker service | PostgreSQL 16 |
| Cache/Sessions | Docker service | Redis 7 |
| Reverse Proxy | Docker service | Nginx |
| CI/CD | `.github/workflows` | GitHub Actions |
