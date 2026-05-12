-- Migration 013: Limites de plano — contador de respostas IA + item ID do add-on
-- Sprint: Limites de Plano, Locais por Cliente Agência e Add-on Extra Local

-- Contador de respostas IA geradas no mês atual
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS ai_responses_count INTEGER NOT NULL DEFAULT 0;

-- Mês de referência do contador (formato YYYY-MM) — reset automático quando vira mês
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS ai_responses_month TEXT NOT NULL DEFAULT '';

-- ID do item de assinatura Stripe do add-on de local extra
-- Necessário para atualizar a quantity sem criar nova assinatura
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS stripe_extra_locations_item_id TEXT;
