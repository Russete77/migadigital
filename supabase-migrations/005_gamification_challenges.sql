-- =============================================
-- MIGRATION 005: Sistema de Gamificação - Challenges
-- =============================================
-- Descrição: Implementa desafios de 30 dias
-- Data: 2025-01-23
-- Autor: Claude Code
-- =============================================

-- 1. Tabela de definições de challenges
-- =============================================
CREATE TABLE IF NOT EXISTS challenges_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, -- 'no-contact-30', 'self-love-30', 'boundaries-30'
  name TEXT NOT NULL, -- Nome exibido: "No-Contact Challenge"
  description TEXT NOT NULL, -- Descrição do desafio
  duration_days INTEGER NOT NULL DEFAULT 30, -- Duração em dias
  daily_reward_credits INTEGER DEFAULT 5, -- Créditos por check-in diário
  completion_reward_credits INTEGER DEFAULT 200, -- Créditos ao completar
  badge_emoji TEXT DEFAULT '🏆', -- Emoji do badge
  category TEXT DEFAULT 'growth', -- 'growth', 'habits', 'boundaries'
  difficulty TEXT DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  daily_prompt TEXT, -- Prompt/reflexão diária (opcional)
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_challenges_slug ON challenges_definitions(slug);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges_definitions(is_active);

-- 2. Tabela de challenges ativos dos usuários
-- =============================================
CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges_definitions(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'failed', 'abandoned'
  current_day INTEGER DEFAULT 1, -- Dia atual do challenge (1-30)
  last_check_in_date DATE, -- Última data de check-in
  total_check_ins INTEGER DEFAULT 0, -- Total de check-ins feitos

  -- Metadados
  notes TEXT, -- Notas do usuário sobre o challenge
  motivation TEXT, -- Por que começou o challenge

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_status ON user_challenges(status);
CREATE INDEX IF NOT EXISTS idx_user_challenges_challenge_id ON user_challenges(challenge_id);

-- Constraint: Usuário só pode ter 1 challenge ativo do mesmo tipo
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_challenges_active_unique
ON user_challenges(user_id, challenge_id)
WHERE status = 'active';

-- 3. Tabela de check-ins diários
-- =============================================
CREATE TABLE IF NOT EXISTS challenge_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_challenge_id UUID NOT NULL REFERENCES user_challenges(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL, -- Dia do challenge (1-30)
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Dados do check-in
  mood INTEGER, -- 1-10
  notes TEXT, -- Reflexão/anotações do dia
  was_successful BOOLEAN DEFAULT true, -- Se manteve o desafio hoje

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_check_ins_user_challenge ON challenge_check_ins(user_challenge_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_date ON challenge_check_ins(check_in_date DESC);

-- Constraint: Um check-in por dia por challenge
CREATE UNIQUE INDEX IF NOT EXISTS idx_check_ins_unique_per_day
ON challenge_check_ins(user_challenge_id, check_in_date);

-- 4. Function: Começar um challenge
-- =============================================
CREATE OR REPLACE FUNCTION start_challenge(
  p_user_id UUID,
  p_challenge_slug TEXT,
  p_motivation TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_challenge_id UUID;
  v_user_challenge_id UUID;
  v_challenge_name TEXT;
BEGIN
  -- Buscar challenge
  SELECT id, name INTO v_challenge_id, v_challenge_name
  FROM challenges_definitions
  WHERE slug = p_challenge_slug AND is_active = true;

  IF v_challenge_id IS NULL THEN
    RAISE EXCEPTION 'Challenge não encontrado ou inativo';
  END IF;

  -- Verificar se já tem challenge ativo do mesmo tipo
  IF EXISTS (
    SELECT 1 FROM user_challenges
    WHERE user_id = p_user_id
    AND challenge_id = v_challenge_id
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Você já tem este challenge ativo';
  END IF;

  -- Criar challenge do usuário
  INSERT INTO user_challenges (user_id, challenge_id, motivation)
  VALUES (p_user_id, v_challenge_id, p_motivation)
  RETURNING id INTO v_user_challenge_id;

  RAISE NOTICE 'Challenge iniciado: %', v_challenge_name;

  RETURN jsonb_build_object(
    'success', true,
    'user_challenge_id', v_user_challenge_id,
    'challenge_name', v_challenge_name,
    'message', 'Challenge iniciado com sucesso!'
  );
END;
$$ LANGUAGE plpgsql;

-- 5. Function: Fazer check-in diário
-- =============================================
CREATE OR REPLACE FUNCTION challenge_daily_checkin(
  p_user_challenge_id UUID,
  p_mood INTEGER DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_was_successful BOOLEAN DEFAULT true
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_challenge_id UUID;
  v_current_day INTEGER;
  v_duration_days INTEGER;
  v_daily_reward INTEGER;
  v_completion_reward INTEGER;
  v_last_check_in DATE;
  v_today DATE := CURRENT_DATE;
  v_is_completed BOOLEAN := false;
  v_new_balance INTEGER;
BEGIN
  -- Buscar dados do challenge
  SELECT
    uc.user_id,
    uc.challenge_id,
    uc.current_day,
    uc.last_check_in_date,
    cd.duration_days,
    cd.daily_reward_credits,
    cd.completion_reward_credits
  INTO
    v_user_id,
    v_challenge_id,
    v_current_day,
    v_last_check_in,
    v_duration_days,
    v_daily_reward,
    v_completion_reward
  FROM user_challenges uc
  JOIN challenges_definitions cd ON cd.id = uc.challenge_id
  WHERE uc.id = p_user_challenge_id AND uc.status = 'active';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Challenge não encontrado ou não está ativo';
  END IF;

  -- Verificar se já fez check-in hoje
  IF v_last_check_in = v_today THEN
    RAISE EXCEPTION 'Você já fez check-in hoje';
  END IF;

  -- Verificar se perdeu o streak (não fez check-in ontem)
  IF v_last_check_in IS NOT NULL AND v_last_check_in < (v_today - INTERVAL '1 day')::DATE THEN
    -- Falhou no challenge (quebrou streak)
    UPDATE user_challenges
    SET
      status = 'failed',
      failed_at = NOW(),
      updated_at = NOW()
    WHERE id = p_user_challenge_id;

    RAISE EXCEPTION 'Challenge falhou: você quebrou o streak ao pular um dia';
  END IF;

  -- Inserir check-in
  INSERT INTO challenge_check_ins (user_challenge_id, day_number, mood, notes, was_successful)
  VALUES (p_user_challenge_id, v_current_day, p_mood, p_notes, p_was_successful);

  -- Atualizar challenge
  v_current_day := v_current_day + 1;

  -- Verificar se completou
  IF v_current_day > v_duration_days THEN
    v_is_completed := true;

    UPDATE user_challenges
    SET
      status = 'completed',
      completed_at = NOW(),
      current_day = v_duration_days,
      last_check_in_date = v_today,
      total_check_ins = total_check_ins + 1,
      updated_at = NOW()
    WHERE id = p_user_challenge_id;

    -- Dar recompensa de conclusão
    PERFORM update_user_credits(
      v_user_id,
      v_completion_reward,
      'challenge_complete',
      'Challenge completado!',
      jsonb_build_object('user_challenge_id', p_user_challenge_id)
    );

  ELSE
    UPDATE user_challenges
    SET
      current_day = v_current_day,
      last_check_in_date = v_today,
      total_check_ins = total_check_ins + 1,
      updated_at = NOW()
    WHERE id = p_user_challenge_id;
  END IF;

  -- Dar recompensa diária
  PERFORM update_user_credits(
    v_user_id,
    v_daily_reward,
    'challenge_checkin',
    'Check-in diário - Dia ' || v_current_day,
    jsonb_build_object('user_challenge_id', p_user_challenge_id, 'day', v_current_day)
  );

  -- Pegar novo saldo
  SELECT credits_remaining INTO v_new_balance FROM profiles WHERE id = v_user_id;

  -- Retornar resultado
  RETURN jsonb_build_object(
    'success', true,
    'day', v_current_day,
    'is_completed', v_is_completed,
    'credits_earned', v_daily_reward + CASE WHEN v_is_completed THEN v_completion_reward ELSE 0 END,
    'balance', v_new_balance,
    'message', CASE
      WHEN v_is_completed THEN 'Parabéns! Você completou o challenge!'
      ELSE 'Check-in realizado! Dia ' || v_current_day || ' de ' || v_duration_days
    END
  );
END;
$$ LANGUAGE plpgsql;

-- 6. Seed: Challenges iniciais (3 challenges)
-- =============================================
INSERT INTO challenges_definitions (slug, name, description, duration_days, daily_reward_credits, completion_reward_credits, badge_emoji, category, difficulty, order_index)
VALUES
  -- 1. No-Contact Challenge
  (
    'no-contact-30',
    'No-Contact Challenge',
    'Fique 30 dias sem entrar em contato com seu ex. Fortaleça sua independência emocional.',
    30,
    5,
    200,
    '🚫',
    'boundaries',
    'hard',
    1
  ),

  -- 2. Self-Love Challenge
  (
    'self-love-30',
    'Self-Love Challenge',
    'Pratique autocuidado por 30 dias. Escreva no diário diariamente sobre seu crescimento.',
    30,
    3,
    150,
    '❤️',
    'growth',
    'medium',
    2
  ),

  -- 3. Boundaries Challenge
  (
    'boundaries-30',
    'Boundaries Challenge',
    'Estabeleça e mantenha boundaries saudáveis por 30 dias. Documente sua evolução.',
    30,
    5,
    200,
    '🛡️',
    'boundaries',
    'medium',
    3
  )
ON CONFLICT (slug) DO NOTHING;

-- 7. Comentários das tabelas
-- =============================================
COMMENT ON TABLE challenges_definitions IS 'Definições de todos os challenges disponíveis';
COMMENT ON TABLE user_challenges IS 'Challenges ativos/completados/falhados de cada usuário';
COMMENT ON TABLE challenge_check_ins IS 'Check-ins diários de cada challenge';

COMMENT ON COLUMN user_challenges.current_day IS 'Dia atual do challenge (1 a duration_days)';
COMMENT ON COLUMN user_challenges.status IS 'active, completed, failed, abandoned';

-- =============================================
-- FIM DA MIGRATION 005
-- =============================================

-- Verificação final
SELECT
  'Migration 005 executada com sucesso!' as message,
  (SELECT COUNT(*) FROM challenges_definitions) as total_challenges,
  (SELECT COUNT(*) FROM user_challenges) as total_active_challenges;
