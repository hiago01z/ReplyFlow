-- Migration 018: Booking.com — integração manual
-- Sem acesso direto via API pública gratuita: usuário vincula URL + importa avaliações manualmente.
-- Mesmo padrão do TripAdvisor (014) e Reclame Aqui (016).

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS booking_url       TEXT,
  ADD COLUMN IF NOT EXISTS booking_connected BOOLEAN NOT NULL DEFAULT false;

-- Permitir platform = 'booking' na tabela reviews
ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_platform_check;

ALTER TABLE reviews
  ADD CONSTRAINT reviews_platform_check
    CHECK (platform IN ('google', 'tripadvisor', 'facebook', 'reclame_aqui', 'booking'));
