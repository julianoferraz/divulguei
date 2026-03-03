CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES cities(id),
  source VARCHAR(30) NOT NULL CHECK (source IN ('web', 'whatsapp_private', 'whatsapp_group')),
  type VARCHAR(30) NOT NULL CHECK (type IN ('search', 'business_view', 'classified_view', 'professional_view', 'job_view', 'event_view', 'bot_query', 'group_response', 'ad_created', 'alert_created')),
  query TEXT,
  results_count INTEGER,
  business_id UUID REFERENCES businesses(id),
  classified_id UUID REFERENCES classifieds(id),
  group_id UUID REFERENCES whatsapp_groups(id),
  user_phone VARCHAR(20),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interactions_city_date ON interactions(city_id, created_at DESC);
CREATE INDEX idx_interactions_business ON interactions(business_id) WHERE business_id IS NOT NULL;
