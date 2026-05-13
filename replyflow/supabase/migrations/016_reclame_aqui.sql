-- Migration 016: Reclame Aqui — integração manual
-- Sem API pública: usuário vincula URL + importa reclamações manualmente.
-- Mesmo padrão do TripAdvisor (014_platform_connections.sql).

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS reclame_aqui_url       TEXT,
  ADD COLUMN IF NOT EXISTS reclame_aqui_connected BOOLEAN NOT NULL DEFAULT false;

-- Permitir platform = 'reclame_aqui' na tabela reviews
ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_platform_check;

ALTER TABLE reviews
  ADD CONSTRAINT reviews_platform_check
    CHECK (platform IN ('google', 'tripadvisor', 'facebook', 'reclame_aqui'));
