-- =====================================================
-- AI Learning System - Migration
-- Sistema de aprendizado contínuo para a IA
-- =====================================================

-- 1. Tabela de Templates de Prompt (Prompt Library)
-- Armazena templates que tiveram bom desempenho
CREATE TABLE IF NOT EXISTS ai_prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Contexto de uso
  emotion VARCHAR(50) NOT NULL, -- triste, ansiosa, raiva, feliz, confusa, esperancosa, desesperada
  urgency VARCHAR(20) NOT NULL, -- baixa, media, alta, critica
  tone VARCHAR(20) NOT NULL DEFAULT 'amiga', -- formal, casual, amiga

  -- Template
  system_prompt TEXT NOT NULL,
  example_response TEXT,

  -- Métricas de performance
  times_used INTEGER DEFAULT 0,
  total_rating DECIMAL(10,2) DEFAULT 0,
  avg_rating DECIMAL(3,2) GENERATED ALWAYS AS (
    CASE WHEN times_used > 0 THEN total_rating / times_used ELSE 0 END
  ) STORED,
  positive_feedback_count INTEGER DEFAULT 0,
  negative_feedback_count INTEGER DEFAULT 0,

  -- A/B Testing
  is_active BOOLEAN DEFAULT true,
  is_control BOOLEAN DEFAULT false, -- Template de controle para comparação
  ab_test_group VARCHAR(10), -- 'A', 'B', 'C', etc.

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(100) DEFAULT 'system',

  -- Constraints
  CONSTRAINT valid_emotion CHECK (emotion IN ('triste', 'ansiosa', 'raiva', 'feliz', 'confusa', 'esperancosa', 'desesperada')),
  CONSTRAINT valid_urgency CHECK (urgency IN ('baixa', 'media', 'alta', 'critica')),
  CONSTRAINT valid_tone CHECK (tone IN ('formal', 'casual', 'amiga'))
);

-- Índices para busca rápida
CREATE INDEX idx_prompt_templates_emotion ON ai_prompt_templates(emotion);
CREATE INDEX idx_prompt_templates_urgency ON ai_prompt_templates(urgency);
CREATE INDEX idx_prompt_templates_active ON ai_prompt_templates(is_active);
CREATE INDEX idx_prompt_templates_avg_rating ON ai_prompt_templates(avg_rating DESC);

-- 2. Tabela de Métricas de Aprendizado
-- Registra métricas agregadas para análise de tendências
CREATE TABLE IF NOT EXISTS ai_learning_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Período
  metric_date DATE NOT NULL,
  metric_hour INTEGER, -- 0-23 para métricas por hora

  -- Métricas de Sentimento
  total_analyses INTEGER DEFAULT 0,
  emotion_distribution JSONB DEFAULT '{}', -- {"triste": 10, "ansiosa": 5, ...}
  urgency_distribution JSONB DEFAULT '{}', -- {"baixa": 10, "media": 5, ...}
  avg_confidence DECIMAL(5,4) DEFAULT 0,
  model_usage JSONB DEFAULT '{}', -- {"bert-pt": 80, "fallback": 20}

  -- Métricas de Humanização
  total_humanizations INTEGER DEFAULT 0,
  avg_roboticness_before DECIMAL(5,4) DEFAULT 0,
  avg_roboticness_after DECIMAL(5,4) DEFAULT 0,
  avg_improvement_percent DECIMAL(5,2) DEFAULT 0,

  -- Métricas de Feedback
  total_feedbacks INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  rating_distribution JSONB DEFAULT '{}', -- {"1": 2, "2": 5, "3": 10, ...}

  -- Métricas de Performance
  avg_bert_time_ms INTEGER DEFAULT 0,
  avg_gpt_time_ms INTEGER DEFAULT 0,
  avg_humanizer_time_ms INTEGER DEFAULT 0,
  avg_total_time_ms INTEGER DEFAULT 0,
  p95_total_time_ms INTEGER DEFAULT 0,

  -- Métricas de Crises
  total_crises INTEGER DEFAULT 0,
  crises_handled INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique por data/hora
  UNIQUE(metric_date, metric_hour)
);

-- Índices
CREATE INDEX idx_learning_metrics_date ON ai_learning_metrics(metric_date DESC);

-- 3. Tabela de Configurações de Humanização Adaptativa
-- Armazena pesos das regras de humanização baseado em feedback
CREATE TABLE IF NOT EXISTS ai_humanizer_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação da regra
  rule_name VARCHAR(100) NOT NULL UNIQUE,
  rule_type VARCHAR(50) NOT NULL, -- 'marker', 'contraction', 'emoji', 'pattern'

  -- Pesos (aprendidos com feedback)
  base_weight DECIMAL(5,4) DEFAULT 1.0, -- Peso inicial
  learned_weight DECIMAL(5,4) DEFAULT 1.0, -- Peso aprendido
  confidence DECIMAL(5,4) DEFAULT 0.5, -- Confiança no peso aprendido

  -- Estatísticas
  times_applied INTEGER DEFAULT 0,
  positive_correlation INTEGER DEFAULT 0, -- Quantas vezes foi associado a rating alto
  negative_correlation INTEGER DEFAULT 0, -- Quantas vezes foi associado a rating baixo

  -- Contexto
  best_emotions TEXT[], -- Emoções onde funciona melhor
  worst_emotions TEXT[], -- Emoções onde não funciona

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_rule_type CHECK (rule_type IN ('marker', 'contraction', 'emoji', 'pattern', 'removal'))
);

-- 4. Tabela de Experimentos A/B
CREATE TABLE IF NOT EXISTS ai_ab_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Configuração
  experiment_type VARCHAR(50) NOT NULL, -- 'prompt', 'humanizer', 'model'
  control_config JSONB NOT NULL, -- Configuração do grupo controle
  variant_config JSONB NOT NULL, -- Configuração da variante
  traffic_split DECIMAL(3,2) DEFAULT 0.50, -- % de tráfego para variante

  -- Status
  status VARCHAR(20) DEFAULT 'draft', -- draft, running, paused, completed
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,

  -- Resultados
  control_impressions INTEGER DEFAULT 0,
  variant_impressions INTEGER DEFAULT 0,
  control_conversions INTEGER DEFAULT 0, -- feedback positivo
  variant_conversions INTEGER DEFAULT 0,
  control_avg_rating DECIMAL(3,2) DEFAULT 0,
  variant_avg_rating DECIMAL(3,2) DEFAULT 0,

  -- Análise estatística
  p_value DECIMAL(10,8),
  is_significant BOOLEAN DEFAULT false,
  winner VARCHAR(20), -- 'control', 'variant', 'tie'

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(100),

  CONSTRAINT valid_status CHECK (status IN ('draft', 'running', 'paused', 'completed')),
  CONSTRAINT valid_experiment_type CHECK (experiment_type IN ('prompt', 'humanizer', 'model', 'full_pipeline'))
);

-- 5. Tabela de Log de Experimentos (qual usuário viu qual variante)
CREATE TABLE IF NOT EXISTS ai_ab_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES ai_ab_experiments(id) ON DELETE CASCADE,
  response_log_id UUID REFERENCES ai_response_logs(id) ON DELETE CASCADE,

  -- Atribuição
  variant VARCHAR(20) NOT NULL, -- 'control' ou 'variant'

  -- Resultado
  rating INTEGER,
  was_positive BOOLEAN,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ab_assignments_experiment ON ai_ab_assignments(experiment_id);

-- 6. Função para atualizar métricas de template após feedback
CREATE OR REPLACE FUNCTION update_template_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar template usado (se houver)
  IF NEW.template_id IS NOT NULL AND NEW.user_feedback IS NOT NULL THEN
    UPDATE ai_prompt_templates
    SET
      times_used = times_used + 1,
      total_rating = total_rating + NEW.user_feedback,
      positive_feedback_count = positive_feedback_count + CASE WHEN NEW.user_feedback >= 4 THEN 1 ELSE 0 END,
      negative_feedback_count = negative_feedback_count + CASE WHEN NEW.user_feedback <= 2 THEN 1 ELSE 0 END,
      updated_at = NOW()
    WHERE id = NEW.template_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Adicionar coluna template_id na tabela de logs se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_response_logs' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE ai_response_logs ADD COLUMN template_id UUID REFERENCES ai_prompt_templates(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_response_logs' AND column_name = 'ab_experiment_id'
  ) THEN
    ALTER TABLE ai_response_logs ADD COLUMN ab_experiment_id UUID REFERENCES ai_ab_experiments(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_response_logs' AND column_name = 'ab_variant'
  ) THEN
    ALTER TABLE ai_response_logs ADD COLUMN ab_variant VARCHAR(20);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_response_logs' AND column_name = 'model_used'
  ) THEN
    ALTER TABLE ai_response_logs ADD COLUMN model_used VARCHAR(50);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_response_logs' AND column_name = 'bert_confidence'
  ) THEN
    ALTER TABLE ai_response_logs ADD COLUMN bert_confidence DECIMAL(5,4);
  END IF;
END $$;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_update_template_metrics ON ai_response_logs;
CREATE TRIGGER trigger_update_template_metrics
  AFTER UPDATE OF user_feedback ON ai_response_logs
  FOR EACH ROW
  WHEN (NEW.user_feedback IS NOT NULL AND OLD.user_feedback IS NULL)
  EXECUTE FUNCTION update_template_metrics();

-- 7. Função para agregar métricas diárias (rodar via cron)
CREATE OR REPLACE FUNCTION aggregate_daily_metrics(target_date DATE DEFAULT CURRENT_DATE - 1)
RETURNS void AS $$
DECLARE
  metrics_record RECORD;
BEGIN
  -- Agregar métricas do dia
  INSERT INTO ai_learning_metrics (
    metric_date,
    total_analyses,
    emotion_distribution,
    urgency_distribution,
    avg_confidence,
    model_usage,
    total_humanizations,
    avg_roboticness_before,
    avg_roboticness_after,
    avg_improvement_percent,
    total_feedbacks,
    avg_rating,
    rating_distribution,
    avg_bert_time_ms,
    avg_gpt_time_ms,
    avg_humanizer_time_ms,
    avg_total_time_ms,
    total_crises,
    crises_handled
  )
  SELECT
    target_date,
    COUNT(*),
    jsonb_object_agg(COALESCE(sentiment_emotion, 'unknown'), emotion_count),
    jsonb_object_agg(COALESCE(sentiment_urgency, 'unknown'), urgency_count),
    AVG(bert_confidence),
    jsonb_object_agg(COALESCE(model_used, 'unknown'), model_count),
    COUNT(*) FILTER (WHERE roboticness_after IS NOT NULL),
    AVG(roboticness_before),
    AVG(roboticness_after),
    AVG(CASE WHEN roboticness_before > 0 THEN ((roboticness_before - roboticness_after) / roboticness_before * 100) ELSE 0 END),
    COUNT(*) FILTER (WHERE user_feedback IS NOT NULL),
    AVG(user_feedback),
    jsonb_object_agg(COALESCE(user_feedback::text, '0'), feedback_count),
    AVG(bert_time_ms)::INTEGER,
    AVG(gpt_time_ms)::INTEGER,
    AVG(humanizer_time_ms)::INTEGER,
    AVG(processing_time_ms)::INTEGER,
    COUNT(*) FILTER (WHERE was_crisis = true),
    COUNT(*) FILTER (WHERE was_crisis = true AND was_escalated = false)
  FROM (
    SELECT
      *,
      COUNT(*) OVER (PARTITION BY sentiment_emotion) as emotion_count,
      COUNT(*) OVER (PARTITION BY sentiment_urgency) as urgency_count,
      COUNT(*) OVER (PARTITION BY model_used) as model_count,
      COUNT(*) OVER (PARTITION BY user_feedback) as feedback_count
    FROM ai_response_logs
    WHERE DATE(created_at) = target_date
  ) subquery
  GROUP BY target_date
  ON CONFLICT (metric_date, metric_hour)
  DO UPDATE SET
    total_analyses = EXCLUDED.total_analyses,
    emotion_distribution = EXCLUDED.emotion_distribution,
    updated_at = NOW();

END;
$$ LANGUAGE plpgsql;

-- 8. Inserir templates iniciais baseados nas emoções
INSERT INTO ai_prompt_templates (name, description, emotion, urgency, tone, system_prompt, example_response, is_control)
VALUES
  -- Triste
  ('template_triste_default', 'Template padrão para tristeza', 'triste', 'media', 'amiga',
   'Você é uma amiga acolhedora que entende a dor da pessoa. Valide os sentimentos, ofereça conforto genuíno e lembre que ela não está sozinha. Use linguagem calorosa e empática.',
   'Olha, eu sinto muito que você está passando por isso. Tristeza dói mesmo, e tá tudo bem sentir assim. Você não precisa enfrentar isso sozinha, tá? Tô aqui contigo.',
   true),

  -- Ansiosa
  ('template_ansiosa_default', 'Template padrão para ansiedade', 'ansiosa', 'media', 'amiga',
   'Você é uma amiga calma que ajuda a pessoa a se acalmar. Use técnicas de grounding, respiração, e linguagem suave. Não minimize a ansiedade, valide e ajude a regular.',
   'Ei, respira comigo. Eu sei que a ansiedade tá forte agora, mas vai passar. Vamos fazer assim: inspira contando até 4, segura 4, solta em 4. Faz comigo.',
   true),

  -- Raiva
  ('template_raiva_default', 'Template padrão para raiva', 'raiva', 'media', 'amiga',
   'Você é uma amiga que valida a raiva sem julgamento. Ajude a pessoa a expressar de forma segura e a entender o que está por trás da raiva. Seja solidária.',
   'Olha, você tem todo direito de estar com raiva. Isso que aconteceu foi injusto mesmo. Às vezes a gente precisa sentir essa raiva pra depois conseguir processar.',
   true),

  -- Desesperada (CRÍTICO)
  ('template_desesperada_default', 'Template para situações críticas', 'desesperada', 'critica', 'amiga',
   'SITUAÇÃO CRÍTICA. Seja extremamente cuidadosa e presente. Valide a dor, não julgue, mantenha a pessoa falando. Pergunte diretamente sobre planos, mas com cuidado. Ofereça recursos de ajuda.',
   'Ei, eu tô aqui com você. O que você tá sentindo é muito pesado, e eu fico feliz que você me contou. Você não precisa passar por isso sozinha. Me conta mais sobre o que tá acontecendo?',
   true),

  -- Confusa
  ('template_confusa_default', 'Template para confusão', 'confusa', 'baixa', 'amiga',
   'Você é uma amiga que ajuda a clarear os pensamentos. Faça perguntas gentis para ajudar a pessoa a organizar ideias. Não dê respostas prontas, ajude ela a encontrar.',
   'Sabe, às vezes quando a gente tá confusa é porque tem muita coisa misturada na cabeça. Que tal a gente tentar separar uma coisa de cada vez? O que tá mais forte agora?',
   true),

  -- Esperançosa
  ('template_esperancosa_default', 'Template para esperança', 'esperancosa', 'baixa', 'amiga',
   'Você é uma amiga que celebra os momentos bons. Reforce a esperança de forma realista, reconheça o progresso, mas sem ser excessivamente otimista.',
   'Que bom ouvir isso! Esse sentimento de esperança é precioso, viu? Você tá construindo algo importante. O que você acha que te ajudou a chegar nesse momento?',
   true),

  -- Feliz
  ('template_feliz_default', 'Template para felicidade', 'feliz', 'baixa', 'amiga',
   'Você é uma amiga que celebra junto. Compartilhe da alegria de forma genuína, pergunte sobre o que está trazendo felicidade, ajude a saborear o momento.',
   'Ai que maravilha! Fico muito feliz por você! Me conta mais, o que aconteceu de bom? Quero celebrar contigo!',
   true)
ON CONFLICT DO NOTHING;

-- 9. Inserir pesos iniciais do humanizador
INSERT INTO ai_humanizer_weights (rule_name, rule_type, base_weight, best_emotions, worst_emotions)
VALUES
  ('marker_olha', 'marker', 1.0, ARRAY['triste', 'ansiosa'], ARRAY['feliz']),
  ('marker_sabe', 'marker', 1.0, ARRAY['triste', 'confusa'], ARRAY['raiva']),
  ('marker_entao', 'marker', 0.9, ARRAY['confusa'], ARRAY['desesperada']),
  ('marker_ei', 'marker', 1.1, ARRAY['ansiosa', 'desesperada'], ARRAY[]::TEXT[]),
  ('contraction_pra', 'contraction', 1.0, ARRAY['triste', 'ansiosa', 'raiva'], ARRAY[]::TEXT[]),
  ('contraction_ta', 'contraction', 1.0, ARRAY['ansiosa'], ARRAY['desesperada']),
  ('emoji_abraco', 'emoji', 0.9, ARRAY['triste', 'desesperada'], ARRAY['raiva']),
  ('emoji_coracao', 'emoji', 1.0, ARRAY['triste', 'esperancosa'], ARRAY['raiva']),
  ('emoji_estrela', 'emoji', 0.8, ARRAY['esperancosa', 'feliz'], ARRAY['desesperada', 'triste']),
  ('removal_como_ia', 'removal', 1.2, ARRAY[]::TEXT[], ARRAY[]::TEXT[]),
  ('removal_formal', 'removal', 1.1, ARRAY[]::TEXT[], ARRAY[]::TEXT[])
ON CONFLICT (rule_name) DO NOTHING;

-- 10. Função para atualizar pesos do humanizador baseado em feedback
CREATE OR REPLACE FUNCTION update_humanizer_weight(
  p_rule_name TEXT,
  p_is_positive BOOLEAN,
  p_is_negative BOOLEAN,
  p_emotion TEXT
)
RETURNS void AS $$
DECLARE
  current_record RECORD;
  new_learned_weight DECIMAL(5,4);
  new_confidence DECIMAL(5,4);
  learning_rate DECIMAL(5,4) := 0.05;
BEGIN
  -- Buscar registro atual
  SELECT * INTO current_record
  FROM ai_humanizer_weights
  WHERE rule_name = p_rule_name;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Incrementar contadores
  UPDATE ai_humanizer_weights
  SET
    times_applied = times_applied + 1,
    positive_correlation = positive_correlation + CASE WHEN p_is_positive THEN 1 ELSE 0 END,
    negative_correlation = negative_correlation + CASE WHEN p_is_negative THEN 1 ELSE 0 END,
    last_updated = NOW()
  WHERE rule_name = p_rule_name;

  -- Recalcular peso aprendido (após 10+ aplicações)
  IF current_record.times_applied >= 10 THEN
    -- Calcular taxa de sucesso
    SELECT
      CASE
        WHEN (positive_correlation + negative_correlation) > 0
        THEN positive_correlation::DECIMAL / (positive_correlation + negative_correlation)
        ELSE 0.5
      END,
      LEAST(1.0, times_applied::DECIMAL / 100) -- Confiança aumenta com mais dados
    INTO new_learned_weight, new_confidence
    FROM ai_humanizer_weights
    WHERE rule_name = p_rule_name;

    -- Ajustar peso: se taxa de sucesso > 0.5, aumentar; senão, diminuir
    new_learned_weight := current_record.base_weight *
      (0.5 + new_learned_weight); -- Range: 0.5x a 1.5x do peso base

    UPDATE ai_humanizer_weights
    SET
      learned_weight = new_learned_weight,
      confidence = new_confidence
    WHERE rule_name = p_rule_name;
  END IF;

  -- Atualizar best/worst emotions baseado no feedback
  IF p_is_positive AND NOT (p_emotion = ANY(current_record.best_emotions)) THEN
    UPDATE ai_humanizer_weights
    SET best_emotions = array_append(best_emotions, p_emotion)
    WHERE rule_name = p_rule_name
    AND NOT (p_emotion = ANY(best_emotions));
  END IF;

  IF p_is_negative AND NOT (p_emotion = ANY(current_record.worst_emotions)) THEN
    UPDATE ai_humanizer_weights
    SET worst_emotions = array_append(worst_emotions, p_emotion)
    WHERE rule_name = p_rule_name
    AND NOT (p_emotion = ANY(worst_emotions));
  END IF;

END;
$$ LANGUAGE plpgsql;

-- 11. Função para incrementar coluna (helper)
CREATE OR REPLACE FUNCTION increment_column(
  table_name TEXT,
  column_name TEXT,
  row_id UUID
)
RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE %I SET %I = %I + 1 WHERE id = $1', table_name, column_name, column_name)
  USING row_id;
END;
$$ LANGUAGE plpgsql;

-- 12. Adicionar coluna learning_processed se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_response_logs' AND column_name = 'learning_processed'
  ) THEN
    ALTER TABLE ai_response_logs ADD COLUMN learning_processed BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_response_logs' AND column_name = 'learning_processed_at'
  ) THEN
    ALTER TABLE ai_response_logs ADD COLUMN learning_processed_at TIMESTAMPTZ;
  END IF;
END $$;

-- Grant permissions
GRANT ALL ON ai_prompt_templates TO authenticated;
GRANT ALL ON ai_learning_metrics TO authenticated;
GRANT ALL ON ai_humanizer_weights TO authenticated;
GRANT ALL ON ai_ab_experiments TO authenticated;
GRANT ALL ON ai_ab_assignments TO authenticated;
