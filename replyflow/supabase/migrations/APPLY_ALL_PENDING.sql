-- ============================================================
-- APPLY ALL PENDING MIGRATIONS (004 → 018)
-- Execute no Supabase Dashboard → SQL Editor
-- Todas as operações usam IF NOT EXISTS — seguro rodar múltiplas vezes
-- ============================================================

-- ── 004: Alert settings ──────────────────────────────────────
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS alert_email TEXT DEFAULT NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_alerts BOOLEAN NOT NULL DEFAULT TRUE;

-- ── 005: Realtime ────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE reviews;

-- ── 006: Agency (parent_agency_id) ──────────────────────────
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS parent_agency_id UUID REFERENCES organizations(id) ON DELETE SET NULL DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_parent_agency_id ON organizations(parent_agency_id);

-- ── 007: Extra locations add-on ──────────────────────────────
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS extra_locations INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS add_on_subscriptions (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id        UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT        NOT NULL UNIQUE,
  type                   TEXT        NOT NULL DEFAULT 'extra_location',
  quantity               INTEGER     NOT NULL DEFAULT 1,
  status                 TEXT        NOT NULL DEFAULT 'active',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_add_on_subscriptions_org ON add_on_subscriptions(organization_id);

-- ── 008: WhatsApp column ─────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS whatsapp TEXT DEFAULT NULL;

-- ── 009: Trial system ────────────────────────────────────────
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_organizations_trial_ends_at
  ON organizations (trial_ends_at)
  WHERE trial_ends_at IS NOT NULL;

-- ── 010: Response templates ──────────────────────────────────
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

CREATE INDEX IF NOT EXISTS idx_response_templates_org   ON response_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_response_templates_niche ON response_templates(organization_id, niche);

ALTER TABLE response_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their org templates" ON response_templates;
CREATE POLICY "Users manage their org templates" ON response_templates
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- ── 011: Webhook config ──────────────────────────────────────
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS webhook_url    TEXT,
  ADD COLUMN IF NOT EXISTS webhook_secret TEXT;

-- ── 012: Public profile ──────────────────────────────────────
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS is_public   BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_locations_public_slug ON locations (public_slug)
  WHERE public_slug IS NOT NULL;

-- ── 013: Plan limits counter ─────────────────────────────────
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS ai_responses_count              INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_responses_month              TEXT    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS stripe_extra_locations_item_id  TEXT;

-- ── 014: Platform connections (TripAdvisor + Facebook) ───────
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS tripadvisor_url       TEXT,
  ADD COLUMN IF NOT EXISTS tripadvisor_connected BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS facebook_page_id      TEXT,
  ADD COLUMN IF NOT EXISTS facebook_page_name    TEXT,
  ADD COLUMN IF NOT EXISTS facebook_access_token TEXT,
  ADD COLUMN IF NOT EXISTS facebook_connected    BOOLEAN NOT NULL DEFAULT false;

-- ── 015: Facebook token expiry ───────────────────────────────
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS facebook_token_expires_at TIMESTAMPTZ;

-- ── 016: Reclame Aqui ────────────────────────────────────────
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS reclame_aqui_url       TEXT,
  ADD COLUMN IF NOT EXISTS reclame_aqui_connected BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_platform_check;

ALTER TABLE reviews
  ADD CONSTRAINT reviews_platform_check
    CHECK (platform IN ('google', 'tripadvisor', 'facebook', 'reclame_aqui', 'booking'));

-- ── 017: User preferred locale ───────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS preferred_locale TEXT NOT NULL DEFAULT 'pt'
  CHECK (preferred_locale IN ('pt', 'en', 'es'));

-- ── 018: Booking.com ─────────────────────────────────────────
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS booking_url       TEXT,
  ADD COLUMN IF NOT EXISTS booking_connected BOOLEAN NOT NULL DEFAULT false;

-- (constraint reviews_platform_check já atualizado acima incluindo 'booking')

-- ── Verificação final ────────────────────────────────────────
-- Execute esta query após rodar o bloco acima para confirmar as colunas:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'organizations'
  AND column_name IN ('alert_email','webhook_url','webhook_secret','trial_ends_at',
                      'ai_responses_count','extra_locations','parent_agency_id')
ORDER BY column_name;
