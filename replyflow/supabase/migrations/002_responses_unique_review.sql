-- Migration: 002_responses_unique_review
-- Garante que cada review pode ter apenas uma resposta ativa
-- Necessario para o upsert com onConflict funcionar corretamente

-- Remover possiveis duplicatas antes de criar a constraint
-- (mantém a mais recente por review)
DELETE FROM responses
WHERE id NOT IN (
  SELECT DISTINCT ON (review_id) id
  FROM responses
  ORDER BY review_id, created_at DESC
);

-- Adicionar constraint UNIQUE
ALTER TABLE responses
  ADD CONSTRAINT responses_review_id_unique UNIQUE (review_id);
