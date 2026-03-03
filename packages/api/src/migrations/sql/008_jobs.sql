CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES cities(id),
  category_id UUID REFERENCES categories(id),
  business_id UUID REFERENCES businesses(id),
  user_id UUID REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  requirements TEXT,
  salary_info VARCHAR(100),
  job_type VARCHAR(20) DEFAULT 'clt' CHECK (job_type IN ('clt', 'temporary', 'freelance', 'internship')),
  contact_phone VARCHAR(20),
  contact_email VARCHAR(200),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'filled', 'expired', 'removed')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_city_status ON jobs(city_id, status);
