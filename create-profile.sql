-- Script para criar perfil do usuário manualmente no Supabase
-- Execute este SQL no SQL Editor do Supabase

-- Substitua os valores abaixo pelos seus dados reais:
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
  'user_35oonK02BylkH4bgPUy732561ch', -- ← Seu clerk_id (já detectado!)
  'seu-email@exemplo.com',             -- ← Seu email do Clerk
  'Seu Nome',                           -- ← Seu nome (opcional)
  NULL,                                 -- ← URL do avatar (opcional)
  'free',                               -- ← Plano (free/premium/pro)
  'active',                             -- ← Status (active/inactive)
  3,                                    -- ← Créditos grátis iniciais
  false                                 -- ← Onboarding não completado
)
ON CONFLICT (clerk_id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();

-- Verificar se foi criado:
SELECT * FROM profiles WHERE clerk_id = 'user_35oonK02BylkH4bgPUy732561ch';
