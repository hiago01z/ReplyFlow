-- Migration 015: Rastreio de expiração do token Facebook
-- long-lived user tokens duram 60 dias. Page access tokens derivados de long-lived tokens
-- são permanentes (não expiram enquanto o usuário não revogar acesso).
-- Armazenamos expires_at para alertar o usuário antes da expiração.

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS facebook_token_expires_at TIMESTAMPTZ;
