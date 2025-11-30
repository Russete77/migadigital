-- ============================================
-- Script para criar perfil do usuário atual
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

-- 1. Verificar se perfil já existe
SELECT * FROM profiles WHERE clerk_id = 'user_35oonK02BylkH4bgPUy732561ch';

-- 2. Criar perfil (ajuste o email com o email real que você usou no Clerk)
INSERT INTO profiles (
  clerk_id,
  email,
  full_name,
  avatar_url,
  subscription_tier,
  subscription_status,
  credits_remaining,
  onboarding_completed
) VALUES (
  'user_35oonK02BylkH4bgPUy732561ch',  -- ✅ Clerk ID detectado automaticamente
  'seu-email@exemplo.com',              -- ⚠️ ALTERE AQUI: coloque seu email real
  'Seu Nome',                           -- ⚠️ ALTERE AQUI: seu nome (ou deixe NULL)
  NULL,                                 -- Avatar (opcional)
  'free',                               -- Plano inicial: free
  'active',                             -- Status: active
  3,                                    -- 3 créditos grátis
  false                                 -- Onboarding não completado
)
ON CONFLICT (clerk_id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  updated_at = NOW();

-- 3. Verificar se foi criado com sucesso
SELECT
  clerk_id,
  email,
  full_name,
  subscription_tier,
  credits_remaining,
  created_at
FROM profiles
WHERE clerk_id = 'user_35oonK02BylkH4bgPUy732561ch';

-- 4. (Opcional) Ver todos os perfis
-- SELECT * FROM profiles ORDER BY created_at DESC LIMIT 5;
