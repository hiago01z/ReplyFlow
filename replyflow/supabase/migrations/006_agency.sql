-- Sprint 25: Agency multi-client panel
-- parent_agency_id links a client organization to its agency

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS parent_agency_id UUID REFERENCES organizations(id) ON DELETE SET NULL DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_parent_agency_id ON organizations(parent_agency_id);
