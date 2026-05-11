-- Migration 010: Custom response templates
-- Allows organizations to save reusable response templates filtered by niche and rating.

CREATE TABLE IF NOT EXISTS response_templates (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title           TEXT        NOT NULL,
  content         TEXT        NOT NULL,
  niche           TEXT        DEFAULT NULL,  -- NULL = applies to all niches
  min_rating      INT         NOT NULL DEFAULT 1 CHECK (min_rating BETWEEN 1 AND 5),
  max_rating      INT         NOT NULL DEFAULT 5 CHECK (max_rating BETWEEN 1 AND 5),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_response_templates_org ON response_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_response_templates_niche ON response_templates(organization_id, niche);

-- RLS
ALTER TABLE response_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their org templates" ON response_templates
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );
