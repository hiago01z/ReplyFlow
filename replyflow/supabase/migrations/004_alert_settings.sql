-- Migration 004: Alert settings
-- Adds custom alert email and email alerts toggle to organizations/users
-- Apply via Supabase Dashboard > SQL Editor

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS alert_email TEXT DEFAULT NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_alerts BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN organizations.alert_email IS 'Custom email for negative review alerts. Falls back to owner email if NULL.';
COMMENT ON COLUMN users.email_alerts        IS 'Whether the user receives email alerts for negative reviews.';
