-- Migration 002: Sprint 3 additions
-- Adiciona campos necessários para alertas e billing

-- Campo para rastrear quando os reviews foram verificados pela última vez
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS last_review_check TIMESTAMPTZ;

-- Campos adicionais de Stripe na organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ;

-- Índice para cron job (busca locais ativos com Google conectado)
CREATE INDEX IF NOT EXISTS idx_locations_active_google
  ON locations (active, google_access_token)
  WHERE active = true AND google_access_token IS NOT NULL;

-- Índice para alertas por review
CREATE INDEX IF NOT EXISTS idx_alerts_review_id
  ON alerts (review_id);

-- Índice para reviews por external_id (upsert do cron)
CREATE INDEX IF NOT EXISTS idx_reviews_external_id
  ON reviews (platform, external_id);

-- Unique constraint para evitar duplicatas no upsert
ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_platform_external_id_key;

ALTER TABLE reviews
  ADD CONSTRAINT reviews_platform_external_id_key UNIQUE (platform, external_id);

-- Atualizar função de updated_at para nova tabela (se necessário)
-- (a função já existe da migration 001, apenas garantir que os triggers existem)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_alerts_updated_at'
  ) THEN
    CREATE TRIGGER update_alerts_updated_at
      BEFORE UPDATE ON alerts
      FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
END
$$;
