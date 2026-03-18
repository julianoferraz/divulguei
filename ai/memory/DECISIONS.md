# Technical Decisions — Divulguei.Online

> Record of important technical decisions made during the project's lifecycle.  
> Format: Date | Decision | Reason | Impact

---

## Architecture Decisions

### 2026-01-XX — Monorepo with packages/ structure
- **Decision**: Organize code as `packages/api`, `packages/web`, `packages/bot` in a single repository
- **Reason**: Simplifies deployment, shared TypeScript config, single CI/CD pipeline
- **Impact**: All services are versioned and deployed together

### 2026-01-XX — PostgreSQL as primary database
- **Decision**: Use PostgreSQL 16 for all persistent data
- **Reason**: Reliability, JSONB support for flexible fields (opening_hours, images, metadata), strong relational integrity, excellent indexing
- **Impact**: All 15 tables in a single database instance

### 2026-01-XX — Redis for ephemeral data
- **Decision**: Use Redis 7 for auth codes, sessions, rate limiting, bot cooldowns
- **Reason**: Fast in-memory access, TTL support for expiring data, simple key-value semantics
- **Impact**: No persistence configured — data lost on restart (acceptable for ephemeral use cases)

### 2026-01-XX — Fastify over Express
- **Decision**: Use Fastify 5 as the API framework
- **Reason**: Superior performance, built-in schema validation, TypeScript-first design, plugin architecture
- **Impact**: All API modules use Fastify-style route registration

### 2026-01-XX — Baileys for WhatsApp integration
- **Decision**: Use Baileys (unofficial WhatsApp Web API) instead of Meta Business API
- **Reason**: Zero cost (no Meta Business Platform fees), full message access, audio/image handling
- **Impact**: Risk of WhatsApp banning the number; requires QR code re-scan if session expires

### 2026-01-XX — OpenAI for all AI features
- **Decision**: Use OpenAI APIs (GPT-4.1-mini, GPT-4o, Whisper) for search, classification, and content
- **Reason**: Best-in-class quality for Portuguese NLU, multimodal capabilities, easy integration
- **Impact**: Monthly API costs scale with usage; no per-user quotas implemented

### 2026-01-XX — JWT with 30-day expiry
- **Decision**: Issue JWT tokens valid for 30 days
- **Reason**: Convenience for users (don't need to re-login frequently), small-city audience less security-sensitive
- **Impact**: Long session window; no refresh token mechanism

### 2026-01-XX — WhatsApp OTP as primary auth
- **Decision**: Use WhatsApp message as OTP delivery instead of SMS
- **Reason**: Free (no SMS costs), WhatsApp is ubiquitous in Brazilian small cities, leverages existing bot infrastructure
- **Impact**: Users need WhatsApp to authenticate; Google OAuth is secondary option

### 2026-01-XX — City-scoped URL routing
- **Decision**: All content routes prefixed with `:citySlug` (e.g., `/floresta/empresas`)
- **Reason**: Clean multi-city support, SEO-friendly URLs, clear city context
- **Impact**: Every API and frontend route must include city context

### 2026-01-XX — Soft deletes everywhere
- **Decision**: Use `is_active=false` or `status=removed` instead of hard deletes
- **Reason**: Data preservation, audit trail, ability to restore
- **Impact**: Queries must filter by active status; storage grows over time

### 2026-01-XX — Docker Compose for deployment
- **Decision**: Deploy all services via Docker Compose on a single VPS
- **Reason**: Simple, cost-effective, easy to manage for a small team
- **Impact**: All services share one server's resources; no horizontal scaling

### 2026-01-XX — GitHub Actions for CI/CD
- **Decision**: Auto-deploy on push to main via SSH + docker compose
- **Reason**: Zero-config CI/CD, fast feedback loop
- **Impact**: Every push to main triggers a production deployment

## Data Model Decisions

### 2026-01-XX — JSONB for flexible fields
- **Decision**: Use JSONB columns for `opening_hours`, `images`, `filters`, `metadata`, `extra_info`
- **Reason**: Avoid schema explosion for semi-structured data
- **Impact**: No strict validation at DB level for these fields

### 2026-01-XX — UUID primary keys
- **Decision**: All tables use UUID (gen_random_uuid()) as primary key
- **Reason**: No sequential ID guessing, safe for distributed systems, URL-safe
- **Impact**: Slightly larger indexes than integer PKs

### 2026-01-XX — Interaction logging table
- **Decision**: Log all user interactions (search, views, ad creation) to `interactions` table
- **Reason**: Analytics, search optimization, understanding user behavior
- **Impact**: High-write table, needs periodic cleanup strategy

---

*Update this file whenever a significant technical decision is made.*
