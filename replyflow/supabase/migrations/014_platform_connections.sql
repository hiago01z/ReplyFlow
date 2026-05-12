-- Migration 014: Conexões de plataforma — TripAdvisor e Facebook
-- Cada local pode ter até 3 plataformas: Google (já existia) + TripAdvisor + Facebook

ALTER TABLE locations
  -- TripAdvisor: sem API oficial, usuário vincula a URL e importa avaliações manualmente
  ADD COLUMN IF NOT EXISTS tripadvisor_url       TEXT,
  ADD COLUMN IF NOT EXISTS tripadvisor_connected BOOLEAN NOT NULL DEFAULT false,

  -- Facebook: OAuth via Graph API — armazena page_id + page_access_token
  ADD COLUMN IF NOT EXISTS facebook_page_id      TEXT,
  ADD COLUMN IF NOT EXISTS facebook_page_name    TEXT,
  ADD COLUMN IF NOT EXISTS facebook_access_token TEXT,
  ADD COLUMN IF NOT EXISTS facebook_connected    BOOLEAN NOT NULL DEFAULT false;
