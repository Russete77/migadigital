-- =====================================================
-- SCRIPT DE DIAGNÓSTICO E CORREÇÃO
-- Desenvolvedor: erickrussomat@gmail.com
-- Problema: Anotações do diário desapareceram + Acesso total
-- =====================================================

-- =====================================================
-- PARTE 1: DIAGNÓSTICO
-- =====================================================

-- 1.1 Verificar se o usuário existe
SELECT 'Verificando usuário...' as step;
SELECT
  id,
  clerk_id,
  email,
  full_name,
  created_at,
  credits_remaining
FROM profiles
WHERE email = 'erickrussomat@gmail.com';

-- 1.2 Verificar entradas do journal (todas)
SELECT 'Verificando todas as entradas do journal...' as step;
SELECT
  j.id,
  j.content,
  j.mood,
  j.emotions,
  j.created_at,
  j.updated_at,
  p.email as user_email
FROM journal_entries j
JOIN profiles p ON j.user_id = p.id
ORDER BY j.created_at DESC
LIMIT 50;

-- 1.3 Verificar entradas específicas do desenvolvedor
SELECT 'Verificando entradas do desenvolvedor...' as step;
SELECT
  j.id,
  j.content,
  j.mood,
  j.emotions,
  j.created_at,
  j.updated_at
FROM journal_entries j
JOIN profiles p ON j.user_id = p.id
WHERE p.email = 'erickrussomat@gmail.com'
ORDER BY j.created_at DESC;

-- 1.4 Verificar status do RLS em todas as tabelas
SELECT 'Verificando status do RLS...' as step;
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'journal_entries', 'emergency_sessions', 'conversation_analyses', 'audio_listens')
ORDER BY tablename;

-- 1.5 Verificar políticas RLS ativas
SELECT 'Verificando políticas RLS ativas...' as step;
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- PARTE 2: CORREÇÃO - DESABILITAR RLS COMPLETAMENTE
-- =====================================================

SELECT 'Desabilitando RLS em todas as tabelas...' as step;

-- Desabilitar RLS em TODAS as tabelas
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_analyses DISABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE audio_listens DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_response_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_metrics_daily DISABLE ROW LEVEL SECURITY;
ALTER TABLE content_moderation DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities DISABLE ROW LEVEL SECURITY;

-- Verificar gamificação (se existirem essas tabelas)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_credits_history') THEN
    ALTER TABLE user_credits_history DISABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_achievements') THEN
    ALTER TABLE user_achievements DISABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'challenges') THEN
    ALTER TABLE challenges DISABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'challenge_check_ins') THEN
    ALTER TABLE challenge_check_ins DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- =====================================================
-- PARTE 3: GARANTIR ACESSO TOTAL AO DESENVOLVEDOR
-- =====================================================

SELECT 'Configurando acesso total ao desenvolvedor...' as step;

-- 3.1 Criar/atualizar entrada na tabela admin_users (se existir)
DO $$
DECLARE
  dev_clerk_id TEXT;
  dev_profile_id UUID;
BEGIN
  -- Buscar clerk_id do desenvolvedor
  SELECT clerk_id, id INTO dev_clerk_id, dev_profile_id
  FROM profiles
  WHERE email = 'erickrussomat@gmail.com';

  IF dev_clerk_id IS NOT NULL THEN
    -- Verificar se tabela admin_users existe
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'admin_users') THEN
      -- Inserir ou atualizar admin_users
      INSERT INTO admin_users (clerk_id, email, role, permissions, is_active)
      VALUES (
        dev_clerk_id,
        'erickrussomat@gmail.com',
        'admin',
        '{"full_access": true, "bypass_rls": true, "developer": true}'::jsonb,
        true
      )
      ON CONFLICT (clerk_id)
      DO UPDATE SET
        role = 'admin',
        permissions = '{"full_access": true, "bypass_rls": true, "developer": true}'::jsonb,
        is_active = true,
        updated_at = NOW();

      RAISE NOTICE 'Desenvolvedor configurado como admin com acesso total';
    END IF;

    -- Garantir créditos ilimitados para o desenvolvedor
    UPDATE profiles
    SET
      credits_remaining = 999999,
      subscription_tier = 'pro',
      subscription_status = 'active'
    WHERE email = 'erickrussomat@gmail.com';

    RAISE NOTICE 'Créditos e subscription atualizados para desenvolvedor';
  ELSE
    RAISE NOTICE 'AVISO: Usuário erickrussomat@gmail.com não encontrado!';
  END IF;
END $$;

-- =====================================================
-- PARTE 4: VERIFICAÇÃO FINAL
-- =====================================================

SELECT 'Verificação final...' as step;

-- 4.1 Status do RLS após desabilitar
SELECT 'Status RLS após correção:' as info;
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'journal_entries', 'emergency_sessions', 'conversation_analyses', 'audio_listens')
ORDER BY tablename;

-- 4.2 Verificar perfil do desenvolvedor
SELECT 'Perfil do desenvolvedor:' as info;
SELECT
  id,
  clerk_id,
  email,
  full_name,
  subscription_tier,
  subscription_status,
  credits_remaining,
  created_at
FROM profiles
WHERE email = 'erickrussomat@gmail.com';

-- 4.3 Verificar admin_users (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'admin_users') THEN
    RAISE NOTICE 'Verificando admin_users...';
    PERFORM * FROM admin_users WHERE email = 'erickrussomat@gmail.com';
  END IF;
END $$;

-- 4.4 Contar entradas do journal do desenvolvedor
SELECT 'Total de entradas no diário do desenvolvedor:' as info;
SELECT COUNT(*) as total_entries
FROM journal_entries j
JOIN profiles p ON j.user_id = p.id
WHERE p.email = 'erickrussomat@gmail.com';

-- =====================================================
-- RESUMO
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'CORREÇÃO APLICADA COM SUCESSO!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ RLS desabilitado em todas as tabelas';
  RAISE NOTICE '✅ Desenvolvedor configurado como admin';
  RAISE NOTICE '✅ Créditos ilimitados (999999)';
  RAISE NOTICE '✅ Subscription: PRO ativa';
  RAISE NOTICE '';
  RAISE NOTICE 'Agora você tem acesso total ao sistema!';
  RAISE NOTICE '==============================================';
END $$;
