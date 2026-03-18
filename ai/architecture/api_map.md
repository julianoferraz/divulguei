# API Map — Divulguei.Online

> Complete REST API endpoint documentation.  
> Base URL: `/api`  
> All city-scoped routes use `:citySlug` parameter (e.g., `floresta`).

---

## Health Check

### `GET /api/health`
- **Auth**: None
- **Response**: `{ status: "ok", uptime: number, timestamp: string }`

---

## Authentication

### `POST /api/auth/whatsapp/request-code`
- **Auth**: None
- **Body**: `{ phone: string }` (Brazilian phone, 10-11 digits)
- **Response**: `{ message: "Código enviado via WhatsApp" }`
- **Notes**: Generates 6-digit code, stores in Redis (5min TTL), sends via WhatsApp bot

### `POST /api/auth/whatsapp/verify-code`
- **Auth**: None
- **Body**: `{ phone: string, code: string }`
- **Response**: `{ token: string, user: UserObject }`
- **Notes**: Verifies code from Redis, creates user if new, returns JWT (30-day expiry)

### `POST /api/auth/google`
- **Auth**: None
- **Body**: `{ credential: string }` (Google OAuth token)
- **Response**: `{ token: string, user: UserObject }`

### `GET /api/me`
- **Auth**: Required (JWT)
- **Response**: `{ user: UserObject }`

---

## Cities

### `GET /api/cities`
- **Auth**: None
- **Response**: `{ data: City[] }`
- **Notes**: Returns only active cities

### `GET /api/cities/:slug`
- **Auth**: None
- **Response**: `{ data: City }`

---

## Categories

### `GET /api/categories`
- **Auth**: None
- **Query**: `?type=business|classified|professional|job|event`
- **Response**: `{ data: Category[] }` (hierarchical, includes children)

### `GET /api/categories/:id`
- **Auth**: None
- **Response**: `{ data: Category }`

---

## Businesses

### `GET /api/:citySlug/businesses`
- **Auth**: None
- **Query**: `?page=1&limit=20&category_id=uuid&neighborhood=string&search=string&featured=true`
- **Response**: `{ data: Business[], pagination: { page, limit, total, pages } }`

### `GET /api/:citySlug/businesses/:slug`
- **Auth**: None
- **Response**: `{ data: Business }` (increments view count)

### `POST /api/:citySlug/businesses`
- **Auth**: Admin only
- **Body**: `{ name, description, category_id, phone?, whatsapp?, address?, neighborhood?, ... }`
- **Response**: `{ data: Business }`

### `PUT /api/:citySlug/businesses/:id`
- **Auth**: Admin or owner
- **Body**: Same as POST (partial update)
- **Response**: `{ data: Business }`

### `DELETE /api/:citySlug/businesses/:id`
- **Auth**: Admin only
- **Response**: `{ message: "..." }` (soft delete: sets is_active=false)

### `POST /api/:citySlug/businesses/:id/claim`
- **Auth**: Required
- **Body**: `{ proof_url: string }`
- **Response**: `{ data: Claim }`

---

## Business Claims (Admin)

### `GET /api/admin/claims`
- **Auth**: Admin only
- **Response**: `{ data: Claim[] }`

### `PUT /api/admin/claims/:id`
- **Auth**: Admin only
- **Body**: `{ status: "approved" | "rejected" }`
- **Response**: `{ data: Claim }`
- **Notes**: On approval, sets business owner_id and is_claimed=true

---

## Classifieds

### `GET /api/:citySlug/classifieds`
- **Auth**: None
- **Query**: `?page=1&limit=20&type=sell|buy|rent_offer|rent_search|service&category_id=uuid&min_price=0&max_price=1000&neighborhood=string&search=string`
- **Response**: `{ data: Classified[], pagination: {...} }`

### `GET /api/:citySlug/classifieds/:id`
- **Auth**: None
- **Response**: `{ data: Classified }` (increments view count)

### `POST /api/:citySlug/classifieds`
- **Auth**: Required
- **Body**: `{ title, description, type, category_id?, price?, is_negotiable?, images?, contact_phone, contact_name?, neighborhood? }`
- **Response**: `{ data: Classified }`

### `POST /api/:citySlug/classifieds/improve`
- **Auth**: Required
- **Body**: `{ title: string, description: string }`
- **Response**: `{ data: { improved_description: string } }`
- **Notes**: AI preview only, does not create/modify any classified

### `PUT /api/:citySlug/classifieds/:id`
- **Auth**: Owner or admin
- **Body**: Same as POST (partial update)
- **Response**: `{ data: Classified }`

### `DELETE /api/:citySlug/classifieds/:id`
- **Auth**: Owner or admin
- **Response**: `{ message: "..." }` (soft delete: sets status=removed)

### `PATCH /api/:citySlug/classifieds/:id/status`
- **Auth**: Owner or admin
- **Body**: `{ status: "sold" | "rented" | "removed" | "active" }`
- **Response**: `{ data: Classified }`

---

## Professionals

### `GET /api/:citySlug/professionals`
- **Auth**: None
- **Query**: `?page=1&limit=20&category_id=uuid&search=string`
- **Response**: `{ data: Professional[], pagination: {...} }`

### `GET /api/:citySlug/professionals/:id`
- **Auth**: None
- **Response**: `{ data: Professional }` (increments view count)

### `POST /api/:citySlug/professionals`
- **Auth**: Required
- **Body**: `{ name, description, category_id?, services_offered?, service_area?, phone?, whatsapp?, ... }`
- **Response**: `{ data: Professional }`

### `PUT /api/:citySlug/professionals/:id`
- **Auth**: Owner or admin
- **Response**: `{ data: Professional }`

### `DELETE /api/:citySlug/professionals/:id`
- **Auth**: Owner or admin
- **Response**: `{ message: "..." }`

---

## Jobs

### `GET /api/:citySlug/jobs`
- **Auth**: None
- **Query**: `?page=1&limit=20&job_type=clt|temporary|freelance|internship&search=string`
- **Response**: `{ data: Job[], pagination: {...} }`

### `GET /api/:citySlug/jobs/:id`
- **Auth**: None
- **Response**: `{ data: Job }` (increments view count)

### `POST /api/:citySlug/jobs`
- **Auth**: Required
- **Body**: `{ title, description, category_id?, business_id?, requirements?, salary_info?, job_type, contact_phone?, contact_email?, expires_at? }`
- **Response**: `{ data: Job }`

### `PUT /api/:citySlug/jobs/:id`
- **Auth**: Owner or admin
- **Response**: `{ data: Job }`

### `DELETE /api/:citySlug/jobs/:id`
- **Auth**: Owner or admin
- **Response**: `{ message: "..." }`

---

## Events

### `GET /api/:citySlug/events`
- **Auth**: None
- **Query**: `?page=1&limit=20&category_id=uuid&date=YYYY-MM-DD`
- **Response**: `{ data: Event[], pagination: {...} }` (only approved, future events)

### `GET /api/:citySlug/events/:id`
- **Auth**: None
- **Response**: `{ data: Event }` (increments view count)

### `POST /api/:citySlug/events`
- **Auth**: Required
- **Body**: `{ title, description, category_id?, image_url?, venue_name?, venue_address?, starts_at, ends_at?, entry_price?, contact_phone?, contact_whatsapp? }`
- **Response**: `{ data: Event }`
- **Notes**: Auto-approved if admin, pending otherwise

### `PUT /api/:citySlug/events/:id`
- **Auth**: Owner or admin
- **Response**: `{ data: Event }`

### `DELETE /api/:citySlug/events/:id`
- **Auth**: Owner or admin
- **Response**: `{ message: "..." }`

### `PUT /api/admin/events/:id/approve`
- **Auth**: Admin only
- **Body**: `{ is_approved: boolean }`
- **Response**: `{ data: Event }`

---

## News

### `GET /api/:citySlug/news`
- **Auth**: None
- **Query**: `?page=1&limit=20`
- **Response**: `{ data: NewsArticle[], pagination: {...} }`

### `GET /api/:citySlug/news/:id`
- **Auth**: None
- **Response**: `{ data: NewsArticle }`

---

## Public Services

### `GET /api/:citySlug/public-services`
- **Auth**: None
- **Response**: `{ data: PublicService[] }` (grouped by category)

### `POST /api/admin/public-services`
- **Auth**: Admin only
- **Body**: `{ city_id, category, title, description?, phone?, address?, opening_hours?, extra_info?, sort_order? }`
- **Response**: `{ data: PublicService }`

### `PUT /api/admin/public-services/:id`
- **Auth**: Admin only
- **Response**: `{ data: PublicService }`

### `DELETE /api/admin/public-services/:id`
- **Auth**: Admin only
- **Response**: `{ message: "..." }`

---

## Alerts

### `POST /api/:citySlug/alerts`
- **Auth**: Required
- **Body**: `{ alert_type: "classified"|"job"|"event"|"business_promotion", keywords?: string, category_id?: uuid }`
- **Response**: `{ data: Alert }`

### `GET /api/me/alerts`
- **Auth**: Required
- **Response**: `{ data: Alert[] }`

### `DELETE /api/me/alerts/:id`
- **Auth**: Required (owner only)
- **Response**: `{ message: "..." }`

---

## Search

### `POST /api/:citySlug/search`
- **Auth**: None
- **Body**: `{ query: string, source?: "web"|"whatsapp_private"|"whatsapp_group" }`
- **Response**: `{ data: { intent: string, sections: [{ type: string, title: string, items: any[] }] } }`
- **Notes**: AI classifies intent, searches relevant entities, returns grouped results

---

## File Upload

### `POST /api/upload`
- **Auth**: Required
- **Body**: `multipart/form-data` with `file` field
- **Constraints**: JPG, PNG, WebP, GIF only; max 5MB
- **Response**: `{ url: string, filename: string, size: number }`

---

## Admin

### `GET /api/admin/dashboard`
- **Auth**: Admin only
- **Response**: `{ data: { businesses, classifieds, events, users, interactions, topSearches } }`

### `POST /api/admin/cities`
- **Auth**: Admin only
- **Body**: `{ name, slug, state, country?, population?, latitude?, longitude? }`

### `PUT /api/admin/cities/:id`
- **Auth**: Admin only

### `POST /api/admin/categories`
- **Auth**: Admin only
- **Body**: `{ name, slug, type, parent_id?, icon?, sort_order? }`

### `PUT /api/admin/categories/:id`
- **Auth**: Admin only

### `DELETE /api/admin/categories/:id`
- **Auth**: Admin only

### `GET /api/admin/groups`
- **Auth**: Admin only
- **Response**: `{ data: WhatsAppGroup[] }`

### `POST /api/admin/groups`
- **Auth**: Admin only
- **Body**: `{ group_jid, group_name, city_id, group_type?, cooldown_minutes?, max_daily_responses? }`

### `PUT /api/admin/groups/:id`
- **Auth**: Admin only

### `GET /api/admin/news-sources`
- **Auth**: Admin only

### `POST /api/admin/news-sources`
- **Auth**: Admin only
- **Body**: `{ city_id, name, website_url?, feed_url, feed_type?, logo_url? }`

### `GET /api/admin/subscriptions`
- **Auth**: Admin only

### `POST /api/admin/subscriptions`
- **Auth**: Admin only
- **Body**: `{ business_id, plan, price, started_at?, expires_at?, payment_method?, payment_reference? }`
