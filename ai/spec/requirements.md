# Requirements — Divulguei.Online

## Functional Requirements

### FR-01: Multi-City Support
- The platform MUST support multiple cities simultaneously
- Each city MUST have a unique slug used in URL routing
- All content MUST be scoped to a city context
- City selection MUST be the entry point for users

### FR-02: User Authentication
- Users MUST be able to authenticate via WhatsApp OTP (6-digit code)
- The system SHOULD support Google OAuth as an alternative
- JWT tokens MUST be issued with configurable expiration (currently 30 days)
- Auth codes MUST be stored in Redis with 5-minute TTL
- Auth codes MUST be generated using cryptographically secure methods

### FR-03: Business Directory
- Businesses MUST be searchable by name, category, and neighborhood
- Business detail pages MUST display contact info, hours, and description
- Admins MUST be able to create, update, and soft-delete businesses
- Business owners MUST be able to claim their business with proof
- Admin MUST approve/reject claims
- View counts MUST be tracked per business

### FR-04: Classified Marketplace
- Users MUST be able to create classified ads after authentication
- Classifieds MUST support types: sell, buy, rent_offer, rent_search, service
- AI description improvement MUST be available as an optional preview
- Classifieds MUST auto-expire after 30 days
- Owners MUST be able to update status (sold, rented, removed)

### FR-05: Professional Services
- Authenticated users MUST be able to create professional profiles
- Profiles MUST include services offered, service area, and contact info
- Professionals MUST be filterable by category

### FR-06: Job Board
- Authenticated users MUST be able to post job listings
- Jobs MUST support types: CLT, temporary, freelance, internship
- Jobs MUST have expiration dates

### FR-07: Events Calendar
- Authenticated users MUST be able to submit events
- Events MUST require admin approval before public display
- Only future events MUST be shown in listings
- Admin events MUST be auto-approved

### FR-08: News Aggregation
- The system MUST fetch news from configured RSS feeds
- News MUST be fetched on a schedule (every 2 hours)
- Duplicate articles MUST be detected by original URL

### FR-09: Public Services
- Admin MUST be able to manage public service listings
- Services MUST be categorized (emergency, pharmacy, health, government, transport, utility)

### FR-10: Alert System
- Users MUST be able to create keyword-based alerts
- Alerts MUST check for matching new content every 30 minutes
- Notifications MUST be sent via WhatsApp

### FR-11: AI-Powered Search
- The search endpoint MUST accept natural language queries
- Intent MUST be classified using AI (GPT-4.1-mini)
- Results MUST be grouped by entity type (businesses, classifieds, professionals, jobs, events)

### FR-12: WhatsApp Bot
- The bot MUST handle private messages (text, audio, images)
- Audio MUST be transcribed via Whisper API
- Images MUST be analyzed via GPT-4o Vision
- Group messages MUST be classified and responded to selectively
- Bot MUST respect cooldown and daily response limits per group

### FR-13: Admin Dashboard
- Admin MUST access metrics (counts, top searches, interactions)
- Admin MUST be able to manage all entities via dashboard
- Admin routes MUST be protected by role check middleware

### FR-14: File Upload
- Users MUST be able to upload images (JPG, PNG, WebP, GIF)
- Files MUST be limited to 5MB
- MIME types MUST be validated server-side

## Non-Functional Requirements

### NFR-01: Performance
- API MUST respond within 500ms for standard CRUD operations
- Database queries MUST use connection pooling (max 20 connections)
- Slow queries (>1000ms) MUST be logged as warnings
- Pagination MUST be enforced (default 20, max 100 items per page)

### NFR-02: Security
- All SQL queries MUST use parameterized queries (no string concatenation)
- Auth codes MUST use `crypto.randomInt()` for generation
- JWT secrets MUST be at least 32 characters
- File uploads MUST validate MIME type and size server-side
- Admin endpoints MUST verify user role before processing
- Rate limiting MUST be applied globally (100 req/min)

### NFR-03: Availability
- The system MUST run in Docker containers for consistent deployment
- Database data MUST be persisted via Docker volumes
- CI/CD MUST auto-deploy on push to main branch

### NFR-04: Scalability
- The multi-city architecture MUST support adding cities without code changes
- Category hierarchy MUST support parent/child relationships
- Bot MUST auto-register new WhatsApp groups

### NFR-05: Observability
- All user interactions MUST be logged to the interactions table
- Health check endpoint MUST be available at `/api/health`
- Container logs MUST be accessible via `docker logs`

### NFR-06: Locale
- All user-facing content MUST be in Brazilian Portuguese (pt-BR)
- Dates MUST use America/Recife timezone
- Currency MUST be formatted as BRL (R$)

## Constraints

1. **Single VPS Deployment** — All services run on a single VPS (161.97.171.94)
2. **WhatsApp Dependency** — Primary auth and notification channel is WhatsApp (Baileys, unofficial API)
3. **OpenAI Dependency** — AI features depend on OpenAI API availability and pricing
4. **No Payment Gateway** — Subscription billing is manual (no Stripe/PagSeguro integration yet)
5. **Portuguese Only** — No internationalization framework; all strings hardcoded in pt-BR
6. **No Automated Tests** — Vitest installed but no test suites exist
7. **Single Database** — All cities share one PostgreSQL instance (no sharding)
8. **Redis In-Memory** — No Redis persistence configured; crash loses sessions and auth codes
