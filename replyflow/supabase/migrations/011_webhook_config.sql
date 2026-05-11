-- Migration 011: Webhook personalizado de notificação
-- Adiciona suporte a webhook_url e webhook_secret em organizations
-- O webhook é chamado via POST quando um review negativo é recebido

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS webhook_url    TEXT,
  ADD COLUMN IF NOT EXISTS webhook_secret TEXT;

COMMENT ON COLUMN organizations.webhook_url    IS 'URL para receber webhooks de notificação (POST JSON)';
COMMENT ON COLUMN organizations.webhook_secret IS 'Segredo HMAC-SHA256 para assinar o payload (header X-ReplyFlow-Signature)';
