-- Migration 012: Public profile page for locations
-- Adds public_slug (unique URL identifier) and is_public toggle

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS public_slug   TEXT        UNIQUE,
  ADD COLUMN IF NOT EXISTS is_public     BOOLEAN     NOT NULL DEFAULT FALSE;

-- Index for fast slug lookups (public pages hit this frequently)
CREATE INDEX IF NOT EXISTS idx_locations_public_slug ON locations (public_slug)
  WHERE public_slug IS NOT NULL;

-- Allow anyone to read public location data (slug + name + is_public only)
-- Full RLS policy is on the existing rows; this policy adds a read-only public path
-- We handle authorization in the API route (no RLS bypass needed for the service client)
