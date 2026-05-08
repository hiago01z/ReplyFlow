-- Migration 008: WhatsApp field on users
-- Adds whatsapp column for Pro/Agency alert notifications via Evolution API
-- Apply via Supabase Dashboard > SQL Editor

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS whatsapp TEXT DEFAULT NULL;

COMMENT ON COLUMN users.whatsapp IS 'WhatsApp phone number (E.164 format: 5511999999999). Used for Pro/Agency review approval alerts.';
