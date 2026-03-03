CREATE TABLE news_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES cities(id),
  name VARCHAR(200) NOT NULL,
  website_url TEXT,
  feed_url TEXT,
  feed_type VARCHAR(10) DEFAULT 'rss' CHECK (feed_type IN ('rss', 'api', 'manual')),
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE news_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES cities(id),
  source_id UUID NOT NULL REFERENCES news_sources(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  summary TEXT,
  content TEXT,
  image_url TEXT,
  original_url TEXT UNIQUE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_news_city_date ON news_articles(city_id, published_at DESC);
