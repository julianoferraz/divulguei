# Coding Rules & Conventions — Divulguei.Online

## Language & Frameworks

- **Language**: TypeScript (strict mode) for all packages
- **Backend**: Fastify 5 with async/await pattern
- **Frontend**: React 18 with functional components and hooks
- **Bot**: Node.js with Baileys + OpenAI
- **Target**: Node.js 20 (Alpine Docker images)

## Code Style

### General
- Use `const` by default; `let` only when reassignment is needed; never `var`
- Use async/await instead of .then() chains
- Use template literals for string interpolation
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Prefer early returns over nested conditionals

### TypeScript
- Enable strict mode in all tsconfig.json files
- Use explicit types for function parameters and return values
- Use interfaces for object shapes, type for unions
- Avoid `any` — use `unknown` when type is truly unknown

### Naming Conventions
- **Files**: kebab-case (`city-context.ts`, `business-claims.sql`)
- **Variables/Functions**: camelCase (`getCityBySlug`, `isActive`)
- **Types/Interfaces**: PascalCase (`BusinessClaim`, `UserRole`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_PAGE_SIZE`, `MAX_FILE_SIZE`)
- **Database columns**: snake_case (`city_id`, `created_at`, `is_active`)
- **API routes**: kebab-case (`/public-services`, `/business-claims`)
- **URL slugs**: kebab-case, generated from names

### React Components
- One component per file
- Use functional components with hooks exclusively
- Page components in `pages/`, reusable components in `components/`
- Use `useAuth()` hook for authentication state
- Tailwind CSS for all styling — no inline styles or CSS modules

## Database

### SQL Conventions
- Table names: plural snake_case (`businesses`, `news_articles`)
- Column names: snake_case (`created_at`, `is_active`)
- Always include `id` (UUID), `created_at`, `updated_at` columns
- Use soft deletes (`is_active = false` or `status = 'removed'`)
- Always use parameterized queries (`$1`, `$2`) — NEVER string concatenation
- Create partial indexes for active/non-expired records
- Use JSONB for semi-structured data (opening_hours, images, metadata)

### Migrations
- Sequential numbering: `001_`, `002_`, etc.
- Each migration is a plain SQL file in `packages/api/src/migrations/sql/`
- Migrations are forward-only (no rollback files)
- Never modify a migration that has been deployed

## API Conventions

### Route Structure
- City-scoped: `/api/:citySlug/{resource}`
- Admin: `/api/admin/{resource}`
- Auth: `/api/auth/{action}`
- User: `/api/me/{resource}`
- File: `/api/upload`

### Response Format
```typescript
// Success
{ data: T }

// Success with pagination
{ data: T[], pagination: { page, limit, total, pages } }

// Error
{ error: string, statusCode: number }
```

### Pagination
- Default: `page=1`, `limit=20`
- Maximum: `limit=100`
- Always return `pagination` object in list responses

### Authentication
- JWT in `Authorization: Bearer <token>` header
- Middleware: `requireAuth` → extracts user from JWT
- Middleware: `requireAdmin` → checks user.role === 'admin'
- Middleware: `requireOwnerOrAdmin` → checks ownership or admin role

## Security Rules

1. **NEVER** hardcode secrets — use environment variables
2. **ALWAYS** use parameterized SQL queries
3. **ALWAYS** validate file uploads (MIME type + size) server-side
4. **ALWAYS** check authorization before data access
5. **ALWAYS** use `crypto.randomInt()` for security-sensitive random numbers
6. **NEVER** expose internal errors to API responses in production
7. **NEVER** log sensitive data (passwords, tokens, API keys)

## Git & Deployment

- Main branch: `main`
- Auto-deploy on push to `main` (GitHub Actions)
- Commit messages: descriptive, in English
- No force-push to `main`
- Test locally with Docker Compose before pushing

## Project-Specific Patterns

### City Context Middleware
Every city-scoped route resolves `:citySlug` to a city record via `city-context.ts` middleware.

### View Counting
Detail endpoints (businesses, classifieds, professionals, jobs, events) increment `views_count` on each GET.

### AI Service Pattern
AI services (ai.ts, vision.ts, whisper.ts) wrap OpenAI API calls with structured prompts and return parsed results.

### Bot Session Management
Bot uses Redis for multi-step conversation state (10-minute TTL): `bot:session:{phone}`.

---

*Update this file when new patterns or conventions are established.*
