CREATE TABLE public_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES cities(id),
  category VARCHAR(50) NOT NULL CHECK (category IN ('emergency', 'pharmacy', 'health', 'government', 'transport', 'utility')),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  phone VARCHAR(20),
  address TEXT,
  opening_hours JSONB,
  extra_info JSONB,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_public_services_city ON public_services(city_id, category);
