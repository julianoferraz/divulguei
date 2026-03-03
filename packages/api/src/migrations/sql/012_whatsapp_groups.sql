CREATE TABLE whatsapp_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES cities(id),
  group_jid VARCHAR(100) NOT NULL UNIQUE,
  group_name VARCHAR(200),
  group_type VARCHAR(30) DEFAULT 'general' CHECK (group_type IN ('general', 'sales', 'services', 'news', 'other')),
  is_active BOOLEAN DEFAULT true,
  cooldown_minutes INTEGER DEFAULT 10,
  max_daily_responses INTEGER DEFAULT 15,
  daily_response_count INTEGER DEFAULT 0,
  last_response_at TIMESTAMPTZ,
  blacklisted BOOLEAN DEFAULT false,
  blacklisted_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
