CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES cities(id),
  category_id UUID REFERENCES categories(id),
  owner_id UUID REFERENCES users(id),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  images JSONB DEFAULT '[]',
  address TEXT,
  neighborhood VARCHAR(100),
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  instagram VARCHAR(100),
  facebook VARCHAR(200),
  website VARCHAR(300),
  opening_hours JSONB,
  menu_url TEXT,
  is_claimed BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  source VARCHAR(30) DEFAULT 'manual' CHECK (source IN ('manual', 'instagram', 'facebook', 'google_business', 'import')),
  plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'premium')),
  views_count INTEGER DEFAULT 0,
  search_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_businesses_city_slug ON businesses(city_id, slug);
CREATE INDEX idx_businesses_city_category ON businesses(city_id, category_id);
CREATE INDEX idx_businesses_city_active ON businesses(city_id, is_active);
