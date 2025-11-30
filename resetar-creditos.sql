-- ============================================
-- RESETAR CRÉDITOS DO USUÁRIO
-- Execute no Supabase SQL Editor
-- ============================================

-- Opção 1: Resetar créditos para 999 (desenvolvimento ilimitado)
UPDATE profiles
SET
  credits_remaining = 999,
  updated_at = NOW()
WHERE clerk_id = 'user_35mmvBerNrxj7cAGFDuOShopEA4';

-- Opção 2: Dar subscription premium (ilimitado)
UPDATE profiles
SET
  subscription_tier = 'premium',
  subscription_status = 'active',
  credits_remaining = 999,
  updated_at = NOW()
WHERE clerk_id = 'user_35mmvBerNrxj7cAGFDuOShopEA4';

-- Opção 3: Dar subscription pro (ilimitado)
UPDATE profiles
SET
  subscription_tier = 'pro',
  subscription_status = 'active',
  credits_remaining = 999,
  updated_at = NOW()
WHERE clerk_id = 'user_35mmvBerNrxj7cAGFDuOShopEA4';

-- Verificar resultado:
SELECT
  clerk_id,
  email,
  subscription_tier,
  subscription_status,
  credits_remaining,
  updated_at
FROM profiles
WHERE clerk_id = 'user_35mmvBerNrxj7cAGFDuOShopEA4';

-- ============================================
-- DICA: Para desenvolvimento, use Opção 2 ou 3
-- Isso desabilita completamente a verificação de créditos
-- ============================================
