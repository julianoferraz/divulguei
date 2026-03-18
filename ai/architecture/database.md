# Database Schema — Divulguei.Online

> PostgreSQL 16 — 15 migration files, executed sequentially.  
> All tables use UUID primary keys (`gen_random_uuid()`).  
> Timestamps: `created_at` and `updated_at` (with trigger for auto-update).

---

## Entity Relationship Diagram

```
cities ──────────────┬──── users
  │                  │       │
  ├── businesses ◄───┤       ├── classifieds
  │     │            │       ├── professionals
  │     ├── business_claims  ├── jobs
  │     └── subscriptions    ├── events
  │                  │       └── alerts
  ├── categories     │
  │                  │
  ├── news_sources ──┼── news_articles
  │                  │
  ├── public_services│
  │                  │
  ├── whatsapp_groups│
  │                  │
  └── interactions   │
```

---

## Tables

### 1. cities (001_cities.sql)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| name | VARCHAR(100) | NOT NULL | City name |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | URL-safe identifier |
| state | VARCHAR(2) | NOT NULL | State abbreviation (e.g., PE) |
| country | VARCHAR(50) | DEFAULT 'Brasil' | |
| population | INTEGER | | Estimated population |
| latitude | DECIMAL(10,7) | | Geographic coordinate |
| longitude | DECIMAL(10,7) | | Geographic coordinate |
| is_active | BOOLEAN | DEFAULT true | Soft-enable/disable |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `idx_cities_slug` on slug, `idx_cities_active` on is_active

---

### 2. categories (002_categories.sql)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| name | VARCHAR(100) | NOT NULL | Category label |
| slug | VARCHAR(100) | NOT NULL | URL-safe identifier |
| type | VARCHAR(20) | NOT NULL | business, classified, professional, job, event |
| parent_id | UUID | FK → categories(id) | For subcategories |
| icon | VARCHAR(50) | | Icon identifier |
| sort_order | INTEGER | DEFAULT 0 | Display ordering |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `idx_categories_type` on type, `idx_categories_parent` on parent_id  
**Unique**: (slug, type) combination

---

### 3. users (003_users.sql)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| name | VARCHAR(100) | | Display name |
| phone | VARCHAR(20) | UNIQUE | Primary identifier |
| email | VARCHAR(255) | UNIQUE | Optional |
| city_id | UUID | FK → cities(id) | Home city |
| role | VARCHAR(20) | DEFAULT 'resident' | admin, business_owner, advertiser, resident |
| auth_provider | VARCHAR(20) | DEFAULT 'whatsapp' | whatsapp, google |
| avatar_url | TEXT | | Profile picture |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `idx_users_phone`, `idx_users_city`, `idx_users_role`

---

### 4. businesses (004_businesses.sql)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| city_id | UUID | FK → cities(id) NOT NULL | |
| category_id | UUID | FK → categories(id) | |
| owner_id | UUID | FK → users(id) | Set after claiming |
| name | VARCHAR(200) | NOT NULL | Business name |
| slug | VARCHAR(200) | NOT NULL | URL identifier |
| description | TEXT | | |
| phone | VARCHAR(20) | | |
| whatsapp | VARCHAR(20) | | |
| instagram | VARCHAR(100) | | |
| facebook | VARCHAR(255) | | |
| website | VARCHAR(255) | | |
| address | TEXT | | |
| neighborhood | VARCHAR(100) | | |
| logo_url | TEXT | | |
| cover_url | TEXT | | |
| opening_hours | JSONB | | `{ mon: "08:00-18:00", ... }` |
| menu_url | TEXT | | Link to menu/catalog |
| latitude | DECIMAL(10,7) | | |
| longitude | DECIMAL(10,7) | | |
| is_claimed | BOOLEAN | DEFAULT false | Ownership verified |
| is_featured | BOOLEAN | DEFAULT false | Premium highlight |
| is_active | BOOLEAN | DEFAULT true | Soft delete flag |
| source | VARCHAR(20) | DEFAULT 'manual' | manual, instagram, facebook, google_business, import |
| plan | VARCHAR(20) | DEFAULT 'free' | free, basic, premium |
| views_count | INTEGER | DEFAULT 0 | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `idx_businesses_city`, `idx_businesses_category`, `idx_businesses_city_slug` (UNIQUE on city_id + slug), `idx_businesses_active` (partial: WHERE is_active=true)

---

### 5. business_claims (005_business_claims.sql)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| business_id | UUID | FK → businesses(id) NOT NULL | |
| user_id | UUID | FK → users(id) NOT NULL | |
| status | VARCHAR(20) | DEFAULT 'pending' | pending, approved, rejected |
| proof_url | TEXT | | Uploaded proof document |
| reviewed_by | UUID | FK → users(id) | Admin who reviewed |
| reviewed_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `idx_claims_business`, `idx_claims_status`

---

### 6. classifieds (006_classifieds.sql)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| city_id | UUID | FK → cities(id) NOT NULL | |
| category_id | UUID | FK → categories(id) | |
| user_id | UUID | FK → users(id) NOT NULL | |
| type | VARCHAR(20) | NOT NULL | sell, buy, rent_offer, rent_search, service |
| title | VARCHAR(200) | NOT NULL | |
| description | TEXT | | AI-improved version |
| description_original | TEXT | | User's original text |
| price | DECIMAL(12,2) | | |
| is_negotiable | BOOLEAN | DEFAULT false | |
| images | JSONB | DEFAULT '[]' | Array of image URLs |
| contact_phone | VARCHAR(20) | NOT NULL | |
| contact_name | VARCHAR(100) | | |
| neighborhood | VARCHAR(100) | | |
| status | VARCHAR(20) | DEFAULT 'active' | active, expired, sold, rented, removed |
| is_featured | BOOLEAN | DEFAULT false | |
| expires_at | TIMESTAMPTZ | | Auto-set to 30 days |
| views_count | INTEGER | DEFAULT 0 | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `idx_classifieds_city`, `idx_classifieds_user`, `idx_classifieds_type`, `idx_classifieds_active` (partial: WHERE status='active')

---

### 7. professionals (007_professionals.sql)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| city_id | UUID | FK → cities(id) NOT NULL | |
| category_id | UUID | FK → categories(id) | |
| user_id | UUID | FK → users(id) NOT NULL | |
| name | VARCHAR(200) | NOT NULL | |
| description | TEXT | | |
| photo_url | TEXT | | |
| services_offered | TEXT | | |
| service_area | VARCHAR(200) | | |
| neighborhood | VARCHAR(100) | | |
| phone | VARCHAR(20) | | |
| whatsapp | VARCHAR(20) | | |
| instagram | VARCHAR(100) | | |
| is_active | BOOLEAN | DEFAULT true | |
| views_count | INTEGER | DEFAULT 0 | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `idx_professionals_city`, `idx_professionals_category`, `idx_professionals_active` (partial)

---

### 8. jobs (008_jobs.sql)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| city_id | UUID | FK → cities(id) NOT NULL | |
| category_id | UUID | FK → categories(id) | |
| business_id | UUID | FK → businesses(id) | Hiring business |
| user_id | UUID | FK → users(id) NOT NULL | |
| title | VARCHAR(200) | NOT NULL | |
| description | TEXT | | |
| requirements | TEXT | | |
| salary_info | VARCHAR(200) | | |
| job_type | VARCHAR(20) | NOT NULL | clt, temporary, freelance, internship |
| contact_phone | VARCHAR(20) | | |
| contact_email | VARCHAR(255) | | |
| status | VARCHAR(20) | DEFAULT 'active' | active, filled, expired, removed |
| expires_at | TIMESTAMPTZ | | |
| views_count | INTEGER | DEFAULT 0 | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `idx_jobs_city`, `idx_jobs_type`, `idx_jobs_active` (partial)

---

### 9. events (009_events.sql)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| city_id | UUID | FK → cities(id) NOT NULL | |
| category_id | UUID | FK → categories(id) | |
| user_id | UUID | FK → users(id) NOT NULL | |
| title | VARCHAR(200) | NOT NULL | |
| description | TEXT | | |
| image_url | TEXT | | |
| venue_name | VARCHAR(200) | | |
| venue_address | TEXT | | |
| latitude | DECIMAL(10,7) | | |
| longitude | DECIMAL(10,7) | | |
| starts_at | TIMESTAMPTZ | NOT NULL | |
| ends_at | TIMESTAMPTZ | | |
| entry_price | VARCHAR(100) | | |
| contact_phone | VARCHAR(20) | | |
| contact_whatsapp | VARCHAR(20) | | |
| is_approved | BOOLEAN | DEFAULT false | |
| is_featured | BOOLEAN | DEFAULT false | |
| views_count | INTEGER | DEFAULT 0 | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `idx_events_city`, `idx_events_starts`, `idx_events_approved` (partial: WHERE is_approved=true)

---

### 10. news_sources + news_articles (010_news.sql)

#### news_sources

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| city_id | UUID | FK → cities(id) NOT NULL | |
| name | VARCHAR(200) | NOT NULL | Source name |
| website_url | VARCHAR(500) | | |
| feed_url | VARCHAR(500) | NOT NULL | RSS/API endpoint |
| feed_type | VARCHAR(20) | DEFAULT 'rss' | rss, api, manual |
| logo_url | TEXT | | |
| is_active | BOOLEAN | DEFAULT true | |
| last_fetched_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

#### news_articles

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| city_id | UUID | FK → cities(id) NOT NULL | |
| source_id | UUID | FK → news_sources(id) | |
| title | VARCHAR(500) | NOT NULL | |
| summary | TEXT | | |
| content | TEXT | | |
| image_url | TEXT | | |
| original_url | VARCHAR(500) | UNIQUE, NOT NULL | Dedup key |
| published_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `idx_articles_city`, `idx_articles_published`, `idx_articles_url` (UNIQUE)

---

### 11. public_services (011_public_services.sql)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| city_id | UUID | FK → cities(id) NOT NULL | |
| category | VARCHAR(20) | NOT NULL | emergency, pharmacy, health, government, transport, utility |
| title | VARCHAR(200) | NOT NULL | |
| description | TEXT | | |
| phone | VARCHAR(20) | | |
| address | TEXT | | |
| opening_hours | JSONB | | |
| extra_info | JSONB | | |
| sort_order | INTEGER | DEFAULT 0 | |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

### 12. whatsapp_groups (012_whatsapp_groups.sql)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| city_id | UUID | FK → cities(id) | |
| group_jid | VARCHAR(100) | UNIQUE, NOT NULL | WhatsApp group JID |
| group_name | VARCHAR(200) | | |
| group_type | VARCHAR(20) | DEFAULT 'general' | general, sales, services, news, other |
| is_active | BOOLEAN | DEFAULT true | |
| cooldown_minutes | INTEGER | DEFAULT 5 | Minutes between responses |
| max_daily_responses | INTEGER | DEFAULT 15 | |
| daily_response_count | INTEGER | DEFAULT 0 | Reset daily at midnight |
| last_response_at | TIMESTAMPTZ | | |
| blacklisted | BOOLEAN | DEFAULT false | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

### 13. alerts (013_alerts.sql)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| city_id | UUID | FK → cities(id) NOT NULL | |
| user_id | UUID | FK → users(id) | |
| user_phone | VARCHAR(20) | NOT NULL | Notification target |
| alert_type | VARCHAR(30) | NOT NULL | classified, job, event, business_promotion |
| keywords | TEXT | | Comma-separated match terms |
| category_id | UUID | FK → categories(id) | |
| filters | JSONB | | Additional filter criteria |
| is_active | BOOLEAN | DEFAULT true | |
| last_notified_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

### 14. interactions (014_interactions.sql)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| city_id | UUID | FK → cities(id) | |
| source | VARCHAR(20) | NOT NULL | web, whatsapp_private, whatsapp_group |
| type | VARCHAR(30) | NOT NULL | search, business_view, classified_view, classified_create, etc. |
| query | TEXT | | Search query text |
| results_count | INTEGER | | |
| business_id | UUID | FK → businesses(id) | |
| classified_id | UUID | FK → classifieds(id) | |
| group_id | UUID | FK → whatsapp_groups(id) | |
| user_phone | VARCHAR(20) | | |
| metadata | JSONB | | Additional context |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `idx_interactions_city`, `idx_interactions_type`, `idx_interactions_created`

---

### 15. subscriptions (015_subscriptions.sql)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| business_id | UUID | FK → businesses(id) NOT NULL | |
| plan | VARCHAR(20) | NOT NULL | free, basic, premium |
| price | DECIMAL(10,2) | NOT NULL | |
| started_at | TIMESTAMPTZ | DEFAULT NOW() | |
| expires_at | TIMESTAMPTZ | NOT NULL | |
| is_active | BOOLEAN | DEFAULT true | |
| payment_method | VARCHAR(50) | | |
| payment_reference | VARCHAR(200) | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `idx_subscriptions_business`, `idx_subscriptions_active` (partial)

---

## Key Relationships

- **cities** → 1:N → businesses, classifieds, professionals, jobs, events, news, public_services, groups, alerts, interactions
- **users** → 1:N → classifieds, professionals, jobs, events, alerts, business_claims
- **categories** → self-referencing (parent_id) for hierarchy
- **categories** → 1:N → businesses, classifieds, professionals, jobs, events
- **businesses** → 1:N → business_claims, subscriptions, jobs
- **news_sources** → 1:N → news_articles
- All FKs use ON DELETE CASCADE except where noted
