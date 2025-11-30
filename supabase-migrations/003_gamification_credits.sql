-- =============================================
-- MIGRATION 003: Sistema de Gamificação - Créditos
-- =============================================
-- Descrição: Implementa sistema de créditos dinâmico para gamificação
-- Data: 2025-01-23
-- Autor: Claude Code
-- =============================================

-- 1. Tabela de histórico de créditos
-- =============================================
CREATE TABLE IF NOT EXISTS user_credits_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Pode ser positivo (ganhou) ou negativo (gastou)
  action_type TEXT NOT NULL, -- 'daily_login', 'journal_entry', 'analyzer_use', 'sos_use', 'challenge_complete', 'achievement_unlock', 'manual'
  description TEXT NOT NULL, -- Descrição legível: "Login diário - Dia 5 de streak"
  metadata JSONB DEFAULT '{}'::jsonb, -- Dados extras: { "streak_count": 5, "challenge_id": "uuid" }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_credits_history_user_id ON user_credits_history(user_id);
CREATE INDEX idx_credits_history_created_at ON user_credits_history(created_at DESC);
CREATE INDEX idx_credits_history_action_type ON user_credits_history(action_type);

-- 2. Tabela de login diário (para streak tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS daily_logins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  login_date DATE NOT NULL, -- Data do login (sem hora)
  streak_count INTEGER NOT NULL DEFAULT 1, -- Contador de dias consecutivos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_daily_logins_user_id ON daily_logins(user_id);
CREATE INDEX idx_daily_logins_date ON daily_logins(login_date DESC);

-- Constraint: Um login por dia por usuário
CREATE UNIQUE INDEX idx_daily_logins_user_date ON daily_logins(user_id, login_date);

-- 3. Adicionar campo de créditos na tabela profiles (se não existir)
-- =============================================
-- Nota: Este campo já existe (credits_remaining), mas vamos garantir que está correto
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'credits_remaining'
  ) THEN
    ALTER TABLE profiles ADD COLUMN credits_remaining INTEGER DEFAULT 3;
  END IF;
END $$;

-- 4. Function: Calcular saldo atual de créditos
-- =============================================
-- Esta função calcula o saldo baseado no histórico
-- Útil para validar consistência dos dados
CREATE OR REPLACE FUNCTION calculate_user_credits(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_total INTEGER;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total
  FROM user_credits_history
  WHERE user_id = p_user_id;

  RETURN v_total;
END;
$$ LANGUAGE plpgsql;

-- 5. Function: Atualizar créditos do usuário
-- =============================================
-- Esta função adiciona/remove créditos e atualiza o saldo na tabela profiles
CREATE OR REPLACE FUNCTION update_user_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_action_type TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_new_balance INTEGER;
  v_history_id UUID;
BEGIN
  -- Validar que o usuário existe
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  -- Se for gasto, validar saldo suficiente
  IF p_amount < 0 THEN
    SELECT credits_remaining INTO v_new_balance
    FROM profiles
    WHERE id = p_user_id;

    IF v_new_balance + p_amount < 0 THEN
      RAISE EXCEPTION 'Créditos insuficientes';
    END IF;
  END IF;

  -- Inserir no histórico
  INSERT INTO user_credits_history (user_id, amount, action_type, description, metadata)
  VALUES (p_user_id, p_amount, p_action_type, p_description, p_metadata)
  RETURNING id INTO v_history_id;

  -- Atualizar saldo na tabela profiles
  UPDATE profiles
  SET
    credits_remaining = credits_remaining + p_amount,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credits_remaining INTO v_new_balance;

  -- Retornar resultado
  RETURN jsonb_build_object(
    'success', true,
    'history_id', v_history_id,
    'new_balance', v_new_balance,
    'amount', p_amount
  );
END;
$$ LANGUAGE plpgsql;

-- 6. Function: Processar login diário e dar recompensa
-- =============================================
CREATE OR REPLACE FUNCTION process_daily_login(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_last_login_date DATE;
  v_current_streak INTEGER := 1;
  v_credits_earned INTEGER := 3; -- Reward padrão de login
  v_new_balance INTEGER;
  v_is_first_login_today BOOLEAN;
BEGIN
  -- Verificar se já logou hoje
  SELECT login_date INTO v_last_login_date
  FROM daily_logins
  WHERE user_id = p_user_id
  ORDER BY login_date DESC
  LIMIT 1;

  -- Se já logou hoje, retornar sem fazer nada
  IF v_last_login_date = v_today THEN
    SELECT credits_remaining INTO v_new_balance FROM profiles WHERE id = p_user_id;

    RETURN jsonb_build_object(
      'already_logged_today', true,
      'streak_count', (SELECT streak_count FROM daily_logins WHERE user_id = p_user_id AND login_date = v_today),
      'credits_earned', 0,
      'balance', v_new_balance
    );
  END IF;

  -- Calcular streak
  IF v_last_login_date = v_yesterday THEN
    -- Continua o streak
    SELECT streak_count + 1 INTO v_current_streak
    FROM daily_logins
    WHERE user_id = p_user_id AND login_date = v_yesterday;
  ELSE
    -- Streak quebrado, recomeça
    v_current_streak := 1;
  END IF;

  -- Inserir login de hoje
  INSERT INTO daily_logins (user_id, login_date, streak_count)
  VALUES (p_user_id, v_today, v_current_streak);

  -- Dar créditos de recompensa
  PERFORM update_user_credits(
    p_user_id,
    v_credits_earned,
    'daily_login',
    'Login diário - Dia ' || v_current_streak || ' de streak',
    jsonb_build_object('streak_count', v_current_streak)
  );

  -- Pegar novo saldo
  SELECT credits_remaining INTO v_new_balance FROM profiles WHERE id = p_user_id;

  -- Retornar resultado
  RETURN jsonb_build_object(
    'already_logged_today', false,
    'streak_count', v_current_streak,
    'credits_earned', v_credits_earned,
    'balance', v_new_balance,
    'is_new_streak', v_current_streak = 1
  );
END;
$$ LANGUAGE plpgsql;

-- 7. Seed inicial: Dar créditos iniciais para usuários existentes
-- =============================================
-- Todos os usuários que ainda não têm histórico recebem 10 créditos de boas-vindas
DO $$
DECLARE
  v_profile RECORD;
BEGIN
  FOR v_profile IN
    SELECT id, clerk_id
    FROM profiles
    WHERE id NOT IN (SELECT DISTINCT user_id FROM user_credits_history)
  LOOP
    -- Inserir créditos de boas-vindas
    INSERT INTO user_credits_history (user_id, amount, action_type, description, metadata)
    VALUES (
      v_profile.id,
      10,
      'manual',
      'Créditos de boas-vindas - Migração do sistema de gamificação',
      jsonb_build_object('is_migration', true)
    );

    -- Atualizar saldo na tabela profiles
    UPDATE profiles
    SET credits_remaining = COALESCE(credits_remaining, 0) + 10
    WHERE id = v_profile.id;
  END LOOP;

  RAISE NOTICE 'Seed de créditos iniciais concluído';
END $$;

-- 8. Comentários das tabelas
-- =============================================
COMMENT ON TABLE user_credits_history IS 'Histórico completo de todas transações de créditos (ganhos e gastos)';
COMMENT ON TABLE daily_logins IS 'Registro de logins diários para tracking de streaks';

COMMENT ON COLUMN user_credits_history.amount IS 'Quantidade de créditos (positivo = ganhou, negativo = gastou)';
COMMENT ON COLUMN user_credits_history.action_type IS 'Tipo de ação que gerou a transação';
COMMENT ON COLUMN user_credits_history.metadata IS 'Dados adicionais em JSON (ex: streak_count, challenge_id)';

COMMENT ON COLUMN daily_logins.streak_count IS 'Número de dias consecutivos de login';

-- =============================================
-- FIM DA MIGRATION 003
-- =============================================

-- Verificação final
SELECT
  'Migration 003 executada com sucesso!' as message,
  (SELECT COUNT(*) FROM user_credits_history) as total_transactions,
  (SELECT COUNT(*) FROM daily_logins) as total_daily_logins,
  (SELECT SUM(credits_remaining) FROM profiles) as total_credits_in_system;
