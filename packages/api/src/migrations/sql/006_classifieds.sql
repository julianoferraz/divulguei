CREATE TABLE classifieds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES cities(id),
  category_id UUID REFERENCES categories(id),
  user_id UUID REFERENCES users(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('sell', 'buy', 'rent_offer', 'rent_search', 'service')),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  description_original TEXT,
  price DECIMAL(12, 2),
  is_negotiable BOOLEAN DEFAULT false,
  images JSONB DEFAULT '[]',
  contact_phone VARCHAR(20),
  contact_name VARCHAR(100),
  neighborhood VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'sold', 'rented', 'removed')),
  is_featured BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_classifieds_city_status ON classifieds(city_id, status);
CREATE INDEX idx_classifieds_city_type ON classifieds(city_id, type);
CREATE INDEX idx_classifieds_expires ON classifieds(expires_at) WHERE status = 'active';
