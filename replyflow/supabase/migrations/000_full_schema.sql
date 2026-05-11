-- ============================================================
-- ReplyFlow — Schema Completo para Produção
-- Arquivo: 000_full_schema.sql
--
-- Contém TODAS as migrations (001–012) em um único arquivo.
-- Execute este arquivo no Supabase Dashboard > SQL Editor
-- para subir o banco de dados do zero em produção.
--
-- Se já tiver algumas migrations aplicadas, aplique apenas
-- as individuais (007 em diante) para não duplicar tabelas.
-- ============================================================

-- ── Extensões ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELAS PRINCIPAIS
-- ============================================================

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id                              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                            TEXT        NOT NULL,
  plan                            TEXT        NOT NULL DEFAULT 'free'
                                               CHECK (plan IN ('free', 'starter', 'pro', 'agency')),
  stripe_customer_id              TEXT        UNIQUE,
  stripe_subscription_id          TEXT        UNIQUE,
  stripe_price_id                 TEXT,
  subscription_status             TEXT        DEFAULT 'inactive',
  subscription_current_period_end TIMESTAMPTZ,
  extra_locations                 INTEGER     NOT NULL DEFAULT 0,
  parent_agency_id                UUID        REFERENCES organizations(id) ON DELETE SET NULL DEFAULT NULL,
  alert_email                     TEXT        DEFAULT NULL,
  trial_ends_at                   TIMESTAMPTZ,
  webhook_url                     TEXT,
  webhook_secret                  TEXT,
  created_at                      TIMESTAMPTZ DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id              UUID        PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  organization_id UUID        REFERENCES organizations(id) ON DELETE CASCADE,
  role            TEXT        DEFAULT 'owner' CHECK (role IN ('owner', 'member')),
  name            TEXT,
  email           TEXT,
  whatsapp        TEXT        DEFAULT NULL,
  email_alerts    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Locations
CREATE TABLE IF NOT EXISTS locations (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id          UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name                     TEXT        NOT NULL,
  google_place_id          TEXT,
  google_account_id        TEXT,
  google_location_name     TEXT,
  google_access_token      TEXT,
  google_refresh_token     TEXT,
  google_token_expiry      TIMESTAMPTZ,
  niche                    TEXT        DEFAULT 'outro'
                                        CHECK (niche IN ('clinica', 'restaurante', 'academia', 'petshop', 'barbearia', 'outro')),
  tone                     TEXT        DEFAULT 'amigavel'
                                        CHECK (tone IN ('formal', 'amigavel', 'descontraido')),
  auto_publish             BOOLEAN     DEFAULT FALSE,
  auto_publish_min_rating  INTEGER     NOT NULL DEFAULT 3
                                        CHECK (auto_publish_min_rating >= 1 AND auto_publish_min_rating <= 5),
  active                   BOOLEAN     DEFAULT TRUE,
  last_review_check        TIMESTAMPTZ,
  is_public                BOOLEAN     NOT NULL DEFAULT FALSE,
  public_slug              TEXT        UNIQUE,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id           UUID        NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  platform              TEXT        NOT NULL DEFAULT 'google'
                                     CHECK (platform IN ('google', 'tripadvisor', 'facebook')),
  external_id           TEXT        NOT NULL,
  author_name           TEXT,
  author_photo_url      TEXT,
  rating                INTEGER     CHECK (rating BETWEEN 1 AND 5),
  content               TEXT,
  platform_published_at TIMESTAMPTZ,
  publish_after         TIMESTAMPTZ,
  status                TEXT        DEFAULT 'pending'
                                     CHECK (status IN ('pending', 'draft', 'approved', 'published', 'ignored')),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, external_id)
);

-- Responses
CREATE TABLE IF NOT EXISTS responses (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id    UUID        NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  content      TEXT        NOT NULL,
  ai_model     TEXT        DEFAULT 'gpt-4o-mini',
  tokens_used  INTEGER,
  approved_by  UUID        REFERENCES users(id),
  approved_at  TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT responses_review_id_unique UNIQUE (review_id)
);

-- Alerts
CREATE TABLE IF NOT EXISTS alerts (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id  UUID        NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  channel    TEXT        NOT NULL CHECK (channel IN ('whatsapp', 'email')),
  recipient  TEXT,
  sent_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Response Templates (Sprint 31)
CREATE TABLE IF NOT EXISTS response_templates (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title           TEXT        NOT NULL,
  content         TEXT        NOT NULL,
  niche           TEXT        DEFAULT NULL,
  min_rating      INT         NOT NULL DEFAULT 1 CHECK (min_rating BETWEEN 1 AND 5),
  max_rating      INT         NOT NULL DEFAULT 5 CHECK (max_rating BETWEEN 1 AND 5),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add-on Subscriptions (Sprint 26)
CREATE TABLE IF NOT EXISTS add_on_subscriptions (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id        UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT        NOT NULL UNIQUE,
  type                   TEXT        NOT NULL DEFAULT 'extra_location',
  quantity               INTEGER     NOT NULL DEFAULT 1,
  status                 TEXT        NOT NULL DEFAULT 'active',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE organizations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews            ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE add_on_subscriptions ENABLE ROW LEVEL SECURITY;

-- Organizations
DROP POLICY IF EXISTS "users_own_org" ON organizations;
CREATE POLICY "users_own_org" ON organizations
  FOR ALL USING (id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Users
DROP POLICY IF EXISTS "users_same_org" ON users;
CREATE POLICY "users_same_org" ON users
  FOR ALL USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Locations
DROP POLICY IF EXISTS "locations_own_org" ON locations;
CREATE POLICY "locations_own_org" ON locations
  FOR ALL USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Reviews
DROP POLICY IF EXISTS "reviews_own_org" ON reviews;
CREATE POLICY "reviews_own_org" ON reviews
  FOR ALL USING (
    location_id IN (
      SELECT l.id FROM locations l
      JOIN users u ON u.organization_id = l.organization_id
      WHERE u.id = auth.uid()
    )
  );

-- Responses
DROP POLICY IF EXISTS "responses_own_org" ON responses;
CREATE POLICY "responses_own_org" ON responses
  FOR ALL USING (
    review_id IN (
      SELECT r.id FROM reviews r
      JOIN locations l ON l.id = r.location_id
      JOIN users u ON u.organization_id = l.organization_id
      WHERE u.id = auth.uid()
    )
  );

-- Alerts
DROP POLICY IF EXISTS "alerts_own_org" ON alerts;
CREATE POLICY "alerts_own_org" ON alerts
  FOR ALL USING (
    review_id IN (
      SELECT r.id FROM reviews r
      JOIN locations l ON l.id = r.location_id
      JOIN users u ON u.organization_id = l.organization_id
      WHERE u.id = auth.uid()
    )
  );

-- Response Templates
DROP POLICY IF EXISTS "Users manage their org templates" ON response_templates;
CREATE POLICY "Users manage their org templates" ON response_templates
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Add-on Subscriptions
DROP POLICY IF EXISTS "addon_own_org" ON add_on_subscriptions;
CREATE POLICY "addon_own_org" ON add_on_subscriptions
  FOR ALL USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_organization_id          ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_locations_organization_id      ON locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_locations_active_google        ON locations(active, google_access_token) WHERE active = true AND google_access_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_locations_public_slug          ON locations(public_slug) WHERE public_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_location_id            ON reviews(location_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status                 ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating                 ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_external_id            ON reviews(platform, external_id);
CREATE INDEX IF NOT EXISTS idx_reviews_publish_after          ON reviews(publish_after) WHERE publish_after IS NOT NULL AND status = 'pending';
CREATE INDEX IF NOT EXISTS idx_responses_review_id            ON responses(review_id);
CREATE INDEX IF NOT EXISTS idx_alerts_review_id               ON alerts(review_id);
CREATE INDEX IF NOT EXISTS idx_response_templates_org         ON response_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_response_templates_niche       ON response_templates(organization_id, niche);
CREATE INDEX IF NOT EXISTS idx_organizations_parent_agency_id ON organizations(parent_agency_id);
CREATE INDEX IF NOT EXISTS idx_organizations_trial_ends_at    ON organizations(trial_ends_at) WHERE trial_ends_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_add_on_subscriptions_org       ON add_on_subscriptions(organization_id);

-- ============================================================
-- TRIGGERS: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_locations_updated_at
  BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_responses_updated_at
  BEFORE UPDATE ON responses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_response_templates_updated_at
  BEFORE UPDATE ON response_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- REALTIME (Sprint 20)
-- ============================================================
-- Habilita Realtime na tabela reviews para notificações ao vivo
ALTER PUBLICATION supabase_realtime ADD TABLE reviews;

-- ============================================================
-- COMMENTS
-- ============================================================
COMMENT ON COLUMN organizations.alert_email    IS 'Custom email for alerts. Falls back to owner email if NULL.';
COMMENT ON COLUMN organizations.trial_ends_at  IS 'Trial expiry (7 days). NULL = no trial. During trial, free plan has unlimited responses.';
COMMENT ON COLUMN organizations.webhook_url    IS 'URL to receive POST webhooks on new negative reviews.';
COMMENT ON COLUMN organizations.webhook_secret IS 'HMAC-SHA256 secret for webhook signature header.';
COMMENT ON COLUMN users.whatsapp               IS 'WhatsApp number (E.164: 5511999999999) for Pro/Agency alerts.';
COMMENT ON COLUMN users.email_alerts           IS 'Whether user receives email alerts for negative reviews.';
COMMENT ON COLUMN locations.is_public          IS 'Whether the public profile page is enabled for this location.';
COMMENT ON COLUMN locations.public_slug        IS 'URL-safe slug for the public profile (/l/{slug}).';
