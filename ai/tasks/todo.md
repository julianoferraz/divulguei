# Task List — Divulguei.Online

> Pending features, improvements, and fixes.  
> Priority: P0 (critical) → P1 (high) → P2 (medium) → P3 (low)

---

## P0 — Critical

- [ ] **Add React error boundaries** — Frontend crashes on unhandled errors with no recovery
- [ ] **Add timeout to OpenAI API calls** — Requests can hang indefinitely if API is slow
- [ ] **Configure Redis persistence** — Auth codes and sessions lost on Redis restart

## P1 — High Priority

- [ ] **Integrate payment gateway** — Subscriptions table exists but no payment processing (Stripe or PagSeguro)
- [ ] **Implement premium business features in UI** — Plan field exists but free/basic/premium show no difference
- [ ] **Add per-user rate limiting** — Only global rate limit exists (100 req/min), no per-user throttling
- [ ] **Add Google OAuth to frontend Login page** — Backend supports it, frontend only has WhatsApp OTP
- [ ] **Add automated tests** — Vitest installed but no test files; write unit tests for API modules
- [ ] **Add input sanitization for XSS** — Zod validates shape but doesn't sanitize HTML in user content
- [ ] **Add fallback when Redis unavailable** — Auth codes can't be stored if Redis is down

## P2 — Medium Priority

- [ ] **Add map integration** — Lat/long fields exist in businesses and events, add Leaflet/OpenStreetMap display
- [ ] **Add social sharing buttons** — No OG meta tags or share functionality on listing pages
- [ ] **Add email notification support** — Only WhatsApp alerts work; email as secondary channel
- [ ] **Improve image gallery UI** — JSONB array supports multiple images but display is minimal
- [ ] **Display business menu_url** — Field exists in DB but not shown on frontend detail pages
- [ ] **Add admin audit trail** — No logging of admin actions (create, delete, approve, reject)
- [ ] **Add analytics export** — Dashboard shows metrics but no CSV/PDF download
- [ ] **Add E2E tests** — Set up Playwright for critical user flows
- [ ] **Implement refresh tokens** — Current JWT has 30-day expiry with no refresh mechanism

## P3 — Low Priority

- [ ] **Add bot per-group city context** — Bot hardcodes DEFAULT_CITY_ID instead of per-group city
- [ ] **Implement advertiser role features** — Role exists but UI doesn't differentiate from resident
- [ ] **Add data export for GDPR** — Soft deletes don't purge data; no user data export
- [ ] **Add mobile-responsive improvements** — Basic responsive via Tailwind but could be optimized
- [ ] **Add business import tools** — Source field supports import but no import workflow exists
- [ ] **Optimize search performance** — Add full-text search indexes (tsvector) for better PostgreSQL search
- [ ] **Add OpenAI usage quotas** — No per-user or per-city limits on AI API calls
- [ ] **Set up monitoring/alerting** — No uptime monitoring, error alerting, or performance tracking

## Future Considerations

- [ ] Multi-language support (i18n framework)
- [ ] React Native mobile app
- [ ] Progressive Web App (PWA) features
- [ ] Webhook integrations for external services
- [ ] Public API for third-party developers
- [ ] Content moderation AI (auto-flag inappropriate classifieds/images)

---

*Keep this list updated as tasks are assigned, completed, or reprioritized.*
