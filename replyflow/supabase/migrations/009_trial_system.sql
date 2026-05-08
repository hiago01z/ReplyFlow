-- Migration: 009_trial_system
-- Adiciona sistema de trial de 7 dias para novas organizações
-- Durante o trial: plano free com respostas ilimitadas
-- Após o trial: plano free com limite de 10 respostas/mês

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Índice para queries de verificação de trial expirado
CREATE INDEX IF NOT EXISTS idx_organizations_trial_ends_at
  ON organizations (trial_ends_at)
  WHERE trial_ends_at IS NOT NULL;

-- Comentário explicativo
COMMENT ON COLUMN organizations.trial_ends_at IS
  'Data de expiração do trial de 7 dias. NULL = sem trial (org antiga). Durante o trial o plano free tem respostas ilimitadas.';
