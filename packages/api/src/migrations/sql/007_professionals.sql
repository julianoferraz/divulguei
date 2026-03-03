CREATE TABLE professionals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES cities(id),
  category_id UUID REFERENCES categories(id),
  user_id UUID REFERENCES users(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  photo_url TEXT,
  services_offered TEXT,
  service_area VARCHAR(200),
  neighborhood VARCHAR(100),
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  instagram VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_professionals_city_category ON professionals(city_id, category_id);
