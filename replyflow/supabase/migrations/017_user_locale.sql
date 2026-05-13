-- Migration 017: preferred_locale por usuário
-- Salva o idioma detectado no registro (Accept-Language header).
-- Usado para traduzir emails, WhatsApp e PDFs no idioma correto do destinatário.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS preferred_locale TEXT NOT NULL DEFAULT 'pt'
  CHECK (preferred_locale IN ('pt', 'en', 'es'));

COMMENT ON COLUMN users.preferred_locale IS
  'Idioma do usuário detectado via Accept-Language no registro. pt | en | es.';
