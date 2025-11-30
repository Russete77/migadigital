-- =============================================
-- MIGRATION 004: Sistema de Gamificação - Achievements
-- =============================================
-- Descrição: Implementa sistema de conquistas/badges
-- Data: 2025-01-23
-- Autor: Claude Code
-- =============================================

-- 1. Tabela de definições de achievements
-- =============================================
CREATE TABLE IF NOT EXISTS achievements_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, -- 'despertar', 'escritora', 'em-chamas'
  name TEXT NOT NULL, -- Nome exibido: "Despertar"
  description TEXT NOT NULL, -- Descrição da conquista
  icon TEXT NOT NULL, -- Emoji: "💎"
  reward_credits INTEGER NOT NULL DEFAULT 0, -- Créditos ganhos ao desbloquear
  unlock_condition JSONB NOT NULL, -- { "type": "journal_count", "value": 10 }
  category TEXT DEFAULT 'general', -- 'general', 'journal', 'streak', 'analyzer', 'growth'
  order_index INTEGER DEFAULT 0, -- Ordem de exibição
  is_active BOOLEAN DEFAULT true, -- Se está ativo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_achievements_slug ON achievements_definitions(slug);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements_definitions(category);
CREATE INDEX IF NOT EXISTS idx_achievements_active ON achievements_definitions(is_active);

-- 2. Tabela de achievements desbloqueados pelos usuários
-- =============================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements_definitions(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraint: Um achievement por usuário (não pode desbloquear 2x)
  UNIQUE(user_id, achievement_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(unlocked_at DESC);

-- 3. Function: Verificar e desbloquear achievements automaticamente
-- =============================================
CREATE OR REPLACE FUNCTION check_and_unlock_achievements(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_achievement RECORD;
  v_unlocked_count INTEGER := 0;
  v_new_achievements JSONB := '[]'::jsonb;
  v_condition_type TEXT;
  v_condition_value INTEGER;
  v_user_value INTEGER;
  v_should_unlock BOOLEAN;
BEGIN
  -- Iterar por todos achievements ativos que o usuário ainda não desbloqueou
  FOR v_achievement IN
    SELECT ad.*
    FROM achievements_definitions ad
    WHERE ad.is_active = true
    AND ad.id NOT IN (
      SELECT achievement_id
      FROM user_achievements
      WHERE user_id = p_user_id
    )
  LOOP
    v_condition_type := v_achievement.unlock_condition->>'type';
    v_condition_value := (v_achievement.unlock_condition->>'value')::INTEGER;
    v_should_unlock := false;

    -- Verificar condição baseado no tipo
    CASE v_condition_type
      -- Contador de entradas no diário
      WHEN 'journal_count' THEN
        SELECT COUNT(*) INTO v_user_value
        FROM journal_entries
        WHERE user_id = p_user_id;

        v_should_unlock := v_user_value >= v_condition_value;

      -- Dias de streak
      WHEN 'streak_days' THEN
        SELECT COALESCE(MAX(streak_count), 0) INTO v_user_value
        FROM daily_logins
        WHERE user_id = p_user_id;

        v_should_unlock := v_user_value >= v_condition_value;

      -- Número de análises feitas
      WHEN 'analyzer_count' THEN
        SELECT COUNT(*) INTO v_user_value
        FROM conversation_analyses
        WHERE user_id = p_user_id;

        v_should_unlock := v_user_value >= v_condition_value;

      -- Total de créditos ganhos (lifetime)
      WHEN 'credits_earned' THEN
        SELECT COALESCE(SUM(amount), 0) INTO v_user_value
        FROM user_credits_history
        WHERE user_id = p_user_id AND amount > 0;

        v_should_unlock := v_user_value >= v_condition_value;

      -- Dias no app (desde criação da conta)
      WHEN 'days_since_signup' THEN
        SELECT EXTRACT(DAY FROM (NOW() - created_at))::INTEGER INTO v_user_value
        FROM profiles
        WHERE id = p_user_id;

        v_should_unlock := v_user_value >= v_condition_value;

      -- Sempre desbloqueado (achievements de boas-vindas)
      WHEN 'always' THEN
        v_should_unlock := true;

      ELSE
        -- Tipo de condição desconhecido
        v_should_unlock := false;
    END CASE;

    -- Se deve desbloquear
    IF v_should_unlock THEN
      -- Inserir achievement desbloqueado
      INSERT INTO user_achievements (user_id, achievement_id)
      VALUES (p_user_id, v_achievement.id);

      -- Dar recompensa de créditos (se houver)
      IF v_achievement.reward_credits > 0 THEN
        PERFORM update_user_credits(
          p_user_id,
          v_achievement.reward_credits,
          'achievement_unlock',
          'Achievement desbloqueado: ' || v_achievement.name,
          jsonb_build_object('achievement_id', v_achievement.id, 'achievement_slug', v_achievement.slug)
        );
      END IF;

      -- Adicionar ao resultado
      v_new_achievements := v_new_achievements || jsonb_build_object(
        'id', v_achievement.id,
        'slug', v_achievement.slug,
        'name', v_achievement.name,
        'icon', v_achievement.icon,
        'reward_credits', v_achievement.reward_credits
      );

      v_unlocked_count := v_unlocked_count + 1;
    END IF;
  END LOOP;

  -- Retornar resultado
  RETURN jsonb_build_object(
    'unlocked_count', v_unlocked_count,
    'new_achievements', v_new_achievements
  );
END;
$$ LANGUAGE plpgsql;

-- 4. Seed: Achievements iniciais (8 badges)
-- =============================================
INSERT INTO achievements_definitions (slug, name, description, icon, reward_credits, unlock_condition, category, order_index)
VALUES
  -- 1. Despertar (boas-vindas)
  (
    'despertar',
    'Despertar',
    'Deu o primeiro passo na sua jornada de autoconhecimento',
    '💎',
    10,
    '{"type": "always", "value": 0}',
    'general',
    1
  ),

  -- 2. Escritora (10 entradas no diário)
  (
    'escritora',
    'Escritora',
    'Criou 10 entradas no diário emocional',
    '📝',
    25,
    '{"type": "journal_count", "value": 10}',
    'journal',
    2
  ),

  -- 3. Em Chamas (7 dias de streak)
  (
    'em-chamas',
    'Em Chamas',
    'Manteve um streak de 7 dias consecutivos',
    '🔥',
    30,
    '{"type": "streak_days", "value": 7}',
    'streak',
    3
  ),

  -- 4. Rainha (30 dias de streak)
  (
    'rainha',
    'Rainha',
    'Manteve um streak de 30 dias consecutivos',
    '👑',
    150,
    '{"type": "streak_days", "value": 30}',
    'streak',
    4
  ),

  -- 5. Transformação (90 dias no app)
  (
    'transformacao',
    'Transformação',
    'Completou 90 dias desde o cadastro',
    '🦋',
    200,
    '{"type": "days_since_signup", "value": 90}',
    'growth',
    5
  ),

  -- 6. Autocuidado (primeira entrada no diário)
  (
    'autocuidado',
    'Autocuidado',
    'Criou sua primeira entrada no diário',
    '💪',
    15,
    '{"type": "journal_count", "value": 1}',
    'journal',
    6
  ),

  -- 7. Analista Expert (50 conversas analisadas)
  (
    'analista-expert',
    'Analista Expert',
    'Analisou 50 conversas com o Analyzer',
    '🎯',
    100,
    '{"type": "analyzer_count", "value": 50}',
    'analyzer',
    7
  ),

  -- 8. Milionária (ganhou 1000 créditos lifetime)
  (
    'milionaria',
    'Milionária',
    'Ganhou mais de 1000 créditos no total',
    '💰',
    300,
    '{"type": "credits_earned", "value": 1000}',
    'general',
    8
  )
ON CONFLICT (slug) DO NOTHING;

-- 5. Trigger: Auto-check achievements após ações importantes
-- =============================================
-- Quando usuário cria journal entry, verifica achievements
CREATE OR REPLACE FUNCTION trigger_check_achievements_on_journal()
RETURNS TRIGGER AS $$
BEGIN
  -- Chamar função de verificação de forma assíncrona (não bloqueia insert)
  PERFORM check_and_unlock_achievements(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger se existir
DROP TRIGGER IF EXISTS after_journal_entry_check_achievements ON journal_entries;

-- Criar trigger
CREATE TRIGGER after_journal_entry_check_achievements
AFTER INSERT ON journal_entries
FOR EACH ROW
EXECUTE FUNCTION trigger_check_achievements_on_journal();

-- Trigger para daily login
CREATE OR REPLACE FUNCTION trigger_check_achievements_on_login()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_and_unlock_achievements(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_daily_login_check_achievements ON daily_logins;

CREATE TRIGGER after_daily_login_check_achievements
AFTER INSERT ON daily_logins
FOR EACH ROW
EXECUTE FUNCTION trigger_check_achievements_on_login();

-- 6. Comentários das tabelas
-- =============================================
COMMENT ON TABLE achievements_definitions IS 'Definições de todas as conquistas/badges disponíveis';
COMMENT ON TABLE user_achievements IS 'Achievements desbloqueados por cada usuário';

COMMENT ON COLUMN achievements_definitions.unlock_condition IS 'JSON com tipo e valor da condição para desbloquear';
COMMENT ON COLUMN achievements_definitions.category IS 'Categoria para agrupamento visual';

-- 7. Desbloquear "Despertar" para todos usuários existentes
-- =============================================
DO $$
DECLARE
  v_despertar_id UUID;
  v_profile RECORD;
BEGIN
  -- Pegar ID do achievement "Despertar"
  SELECT id INTO v_despertar_id
  FROM achievements_definitions
  WHERE slug = 'despertar'
  LIMIT 1;

  IF v_despertar_id IS NOT NULL THEN
    -- Desbloquear para todos os usuários que ainda não têm
    FOR v_profile IN
      SELECT id FROM profiles
      WHERE id NOT IN (
        SELECT user_id FROM user_achievements WHERE achievement_id = v_despertar_id
      )
    LOOP
      INSERT INTO user_achievements (user_id, achievement_id)
      VALUES (v_profile.id, v_despertar_id);

      -- Dar 10 créditos de recompensa
      PERFORM update_user_credits(
        v_profile.id,
        10,
        'achievement_unlock',
        'Achievement desbloqueado: Despertar',
        jsonb_build_object('achievement_id', v_despertar_id, 'achievement_slug', 'despertar')
      );
    END LOOP;

    RAISE NOTICE 'Achievement "Despertar" desbloqueado para usuários existentes';
  END IF;
END $$;

-- =============================================
-- FIM DA MIGRATION 004
-- =============================================

-- Verificação final
SELECT
  'Migration 004 executada com sucesso!' as message,
  (SELECT COUNT(*) FROM achievements_definitions) as total_achievements,
  (SELECT COUNT(*) FROM user_achievements) as total_unlocked;
