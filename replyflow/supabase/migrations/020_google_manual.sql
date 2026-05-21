-- Migration 020: Google manual mode
-- Adds google_url and google_connected to support manual review import
-- (like TripAdvisor/Booking). The existing google_access_token / google_refresh_token
-- columns are preserved for future API activation.

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS google_url       text    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS google_connected boolean DEFAULT false NOT NULL;

COMMENT ON COLUMN locations.google_url       IS 'Google Maps URL of the business listing (manual mode)';
COMMENT ON COLUMN locations.google_connected IS 'True when google_url is set and user has manually linked Google listing';
