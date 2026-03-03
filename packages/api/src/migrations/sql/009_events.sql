CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES cities(id),
  category_id UUID REFERENCES categories(id),
  user_id UUID REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  image_url TEXT,
  venue_name VARCHAR(200),
  venue_address TEXT,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  entry_price VARCHAR(100),
  contact_phone VARCHAR(20),
  contact_whatsapp VARCHAR(20),
  is_approved BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_city_date ON events(city_id, starts_at);
CREATE INDEX idx_events_approved ON events(city_id, is_approved) WHERE is_approved = true;
