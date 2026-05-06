-- Seed de dados de demonstração para desenvolvimento local
-- Executar APÓS criar o schema (001_initial_schema.sql)
-- NÃO executar em produção

-- ============================================================
-- ATENÇÃO: Substitua o UUID abaixo pelo ID do seu usuário
-- criado no Supabase Authentication durante os testes.
-- Execute: SELECT id FROM auth.users LIMIT 1;
-- ============================================================

DO $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_location_id UUID;
  v_review_id_1 UUID;
  v_review_id_2 UUID;
  v_review_id_3 UUID;
  v_review_id_4 UUID;
BEGIN

  -- Usar primeiro usuário cadastrado (adapte conforme necessário)
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Nenhum usuário encontrado. Cadastre-se primeiro em /register';
    RETURN;
  END IF;

  -- Organização de demonstração
  INSERT INTO organizations (name, plan, stripe_customer_id, subscription_status)
  VALUES ('Clínica Demo', 'pro', NULL, 'active')
  RETURNING id INTO v_org_id;

  -- Usuário (profile)
  INSERT INTO users (id, organization_id, name, email, role)
  VALUES (v_user_id, v_org_id, 'Usuário Demo', (SELECT email FROM auth.users WHERE id = v_user_id), 'owner')
  ON CONFLICT (id) DO UPDATE SET organization_id = v_org_id, role = 'owner';

  -- Local
  INSERT INTO locations (
    organization_id, name, niche, tone,
    google_location_name, active
  )
  VALUES (
    v_org_id,
    'Clínica VitaSkin - Unidade Centro',
    'clinica_estetica',
    'profissional',
    NULL, -- sem Google real no seed
    true
  )
  RETURNING id INTO v_location_id;

  -- Reviews de demonstração
  INSERT INTO reviews (id, location_id, platform, external_id, author_name, rating, content, status, platform_published_at)
  VALUES
    (gen_random_uuid(), v_location_id, 'google', 'demo-review-1', 'Maria Silva', 5,
     'Atendimento incrível! A Dra. Ana foi super atenciosa e o resultado do procedimento ficou perfeito. Com certeza voltarei!',
     'pending', NOW() - INTERVAL '2 hours'),
    (gen_random_uuid(), v_location_id, 'google', 'demo-review-2', 'João Pereira', 4,
     'Boa clínica, equipe simpática. O tempo de espera foi um pouco longo mas o resultado valeu a pena.',
     'pending', NOW() - INTERVAL '5 hours'),
    (gen_random_uuid(), v_location_id, 'google', 'demo-review-3', 'Fernanda Costa', 2,
     'Fui para uma consulta e esperei 40 minutos além do horário marcado. A recepção não avisou sobre o atraso.',
     'pending', NOW() - INTERVAL '1 day'),
    (gen_random_uuid(), v_location_id, 'google', 'demo-review-4', 'Carlos Andrade', 5,
     'Excelente profissional, ambiente agradável e resultado acima do esperado. Super recomendo!',
     'published', NOW() - INTERVAL '3 days')
  RETURNING id INTO v_review_id_1;

  -- Resposta publicada para o review 4
  INSERT INTO responses (review_id, content, published_at, approved_at)
  SELECT
    r.id,
    'Obrigado pelo carinho, Carlos! Ficamos felizes que tenha ficado satisfeito com o atendimento e os resultados. Sua confiança é muito importante para nós. Esperamos vê-lo em breve! 😊',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
  FROM reviews r
  WHERE r.external_id = 'demo-review-4' AND r.location_id = v_location_id;

  RAISE NOTICE 'Seed concluído! Organização: %, Local: %', v_org_id, v_location_id;

END $$;
