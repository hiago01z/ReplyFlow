-- Migration 019: iFood — integração manual
-- Sem acesso direto via API pública: usuário vincula URL + importa avaliações manualmente.
-- Mesmo padrão do TripAdvisor (014), Reclame Aqui (016) e Booking.com (018).

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS ifood_url       TEXT,
  ADD COLUMN IF NOT EXISTS ifood_connected BOOLEAN NOT NULL DEFAULT false;

-- Permitir platform = 'ifood' na tabela reviews
ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_platform_check;

ALTER TABLE reviews
  ADD CONSTRAINT reviews_platform_check
    CHECK (platform IN ('google', 'tripadvisor', 'facebook', 'reclame_aqui', 'booking', 'ifood'));
