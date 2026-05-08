-- Sprint 26: Extra-location add-on for Starter plan
-- extra_locations: cached count of active add-on locations purchased
-- add_on_subscriptions: tracks each Stripe subscription for an add-on

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS extra_locations INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS add_on_subscriptions (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id        UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT        NOT NULL UNIQUE,
  type                   TEXT        NOT NULL DEFAULT 'extra_location',
  quantity               INTEGER     NOT NULL DEFAULT 1,
  status                 TEXT        NOT NULL DEFAULT 'active', -- active | canceled
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_add_on_subscriptions_org ON add_on_subscriptions(organization_id);
