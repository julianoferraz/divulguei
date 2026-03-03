CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES cities(id),
  user_id UUID NOT NULL REFERENCES users(id),
  user_phone VARCHAR(20) NOT NULL,
  alert_type VARCHAR(30) NOT NULL CHECK (alert_type IN ('classified', 'job', 'event', 'business_promotion')),
  keywords TEXT,
  category_id UUID REFERENCES categories(id),
  filters JSONB,
  is_active BOOLEAN DEFAULT true,
  last_notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_city_type ON alerts(city_id, alert_type) WHERE is_active = true;
