CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200),
  phone VARCHAR(20) UNIQUE,
  email VARCHAR(200),
  city_id UUID REFERENCES cities(id),
  role VARCHAR(20) DEFAULT 'resident' CHECK (role IN ('admin', 'business_owner', 'advertiser', 'resident')),
  auth_provider VARCHAR(20) DEFAULT 'whatsapp' CHECK (auth_provider IN ('whatsapp', 'google', 'manual')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
