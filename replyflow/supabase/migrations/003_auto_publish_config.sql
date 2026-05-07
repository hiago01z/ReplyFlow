-- Migration: 003_auto_publish_config
-- Adiciona configuração de estrelas mínimas para auto-publicação
-- e campo publish_after para delay natural de 5-20 minutos

-- 1. Mínimo de estrelas para auto-publicar (padrão: 3 estrelas ou mais)
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS auto_publish_min_rating INTEGER NOT NULL DEFAULT 3
  CHECK (auto_publish_min_rating >= 1 AND auto_publish_min_rating <= 5);

-- 2. Timestamp para publicação com delay (NULL = sem delay agendado)
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS publish_after TIMESTAMPTZ NULL;

-- Índice para o cron buscar reviews agendados eficientemente
CREATE INDEX IF NOT EXISTS idx_reviews_publish_after
  ON reviews (publish_after)
  WHERE publish_after IS NOT NULL AND status = 'pending';
