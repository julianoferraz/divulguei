CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  plan VARCHAR(20) NOT NULL CHECK (plan IN ('basic', 'premium')),
  price DECIMAL(10, 2) NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  payment_method VARCHAR(30),
  payment_reference VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
