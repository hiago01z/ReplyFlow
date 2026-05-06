-- Migration: 001_initial_schema
-- ReplyFlow — Schema inicial
-- Run via: npx supabase db push

-- Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- ORGANIZATIONS
-- ==========================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'agency')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- USERS (extensão do auth.users do Supabase)
-- ==========================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'member')),
  name TEXT,
  email TEXT,
  whatsapp TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- LOCATIONS
-- ==========================================
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  google_place_id TEXT,
  google_account_id TEXT,
  google_location_name TEXT,
  google_access_token TEXT,
  google_refresh_token TEXT,
  google_token_expiry TIMESTAMPTZ,
  niche TEXT DEFAULT 'outro' CHECK (niche IN ('clinica', 'restaurante', 'academia', 'petshop', 'barbearia', 'outro')),
  tone TEXT DEFAULT 'amigavel' CHECK (tone IN ('formal', 'amigavel', 'descontraido')),
  auto_publish BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- REVIEWS
-- ==========================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'google' CHECK (platform IN ('google', 'tripadvisor', 'facebook')),
  external_id TEXT NOT NULL,
  author_name TEXT,
  author_photo_url TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  content TEXT,
  platform_published_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'draft', 'approved', 'published', 'ignored')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, external_id)
);

-- ==========================================
-- RESPONSES
-- ==========================================
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  ai_model TEXT DEFAULT 'gpt-4o-mini',
  tokens_used INTEGER,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ALERTS
-- ==========================================
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email')),
  recipient TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Organizations: usuário acessa apenas sua organização
CREATE POLICY "users_own_org" ON organizations
  FOR ALL USING (
    id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Users: usuário acessa apenas usuários da mesma organização
CREATE POLICY "users_same_org" ON users
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Locations: acesso apenas a locais da própria organização
CREATE POLICY "locations_own_org" ON locations
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Reviews: acesso via location da organização
CREATE POLICY "reviews_own_org" ON reviews
  FOR ALL USING (
    location_id IN (
      SELECT l.id FROM locations l
      JOIN users u ON u.organization_id = l.organization_id
      WHERE u.id = auth.uid()
    )
  );

-- Responses: acesso via review da organização
CREATE POLICY "responses_own_org" ON responses
  FOR ALL USING (
    review_id IN (
      SELECT r.id FROM reviews r
      JOIN locations l ON l.id = r.location_id
      JOIN users u ON u.organization_id = l.organization_id
      WHERE u.id = auth.uid()
    )
  );

-- Alerts: acesso via review da organização
CREATE POLICY "alerts_own_org" ON alerts
  FOR ALL USING (
    review_id IN (
      SELECT r.id FROM reviews r
      JOIN locations l ON l.id = r.location_id
      JOIN users u ON u.organization_id = l.organization_id
      WHERE u.id = auth.uid()
    )
  );

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_locations_organization_id ON locations(organization_id);
CREATE INDEX idx_reviews_location_id ON reviews(location_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_responses_review_id ON responses(review_id);

-- ==========================================
-- TRIGGERS: updated_at automático
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_locations_updated_at BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_responses_updated_at BEFORE UPDATE ON responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
