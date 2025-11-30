-- =====================================================
-- DASHBOARD ADMIN + AI OBSERVATORY
-- Data: 2025-01-23
-- =====================================================

-- =====================================================
-- 1. ADMIN USERS
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer', -- viewer, moderator, admin
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para consultas rápidas por clerk_id
CREATE INDEX idx_admin_users_clerk_id ON admin_users(clerk_id);
CREATE INDEX idx_admin_users_role ON admin_users(role);

-- =====================================================
-- 2. AI RESPONSE LOGS (CORE - AI Observatory)
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_response_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES emergency_sessions(id),
  user_id TEXT NOT NULL, -- clerk_id
  ai_type TEXT NOT NULL, -- 'chat' ou 'analyzer'

  -- Input
  user_message TEXT NOT NULL,

  -- Sentiment Analysis (BERT)
  sentiment_emotion TEXT, -- triste, ansiosa, raiva, feliz, confusa, esperancosa, desesperada
  sentiment_intensity FLOAT, -- 0-1
  sentiment_urgency TEXT, -- baixa, media, alta, critica
  sentiment_keywords TEXT[], -- palavras-chave extraídas

  -- Response
  raw_response TEXT NOT NULL, -- resposta antes da humanização
  humanized_response TEXT, -- resposta após humanização

  -- Humanization Metrics
  roboticness_before FLOAT, -- 0-1 (quanto maior, mais robótico)
  roboticness_after FLOAT, -- 0-1
  removed_phrases TEXT[], -- frases removidas (ex: "Como um AI...")
  added_markers TEXT[], -- marcadores adicionados (ex: "olha...", "sabe...")
  emoji_count INTEGER DEFAULT 0,

  -- Performance
  processing_time_ms INTEGER, -- tempo total
  bert_time_ms INTEGER, -- tempo BERT sentiment
  gpt_time_ms INTEGER, -- tempo GPT
  humanizer_time_ms INTEGER, -- tempo humanização

  -- Feedback
  user_feedback INTEGER, -- 1-5 stars (null = sem feedback)
  user_feedback_tags TEXT[], -- ['muito_robotica', 'nao_entendeu', 'perfeita']
  user_feedback_comment TEXT,

  -- Flags
  was_crisis BOOLEAN DEFAULT false,
  was_escalated BOOLEAN DEFAULT false,
  was_moderated BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes para queries do dashboard
CREATE INDEX idx_ai_logs_created_at ON ai_response_logs(created_at DESC);
CREATE INDEX idx_ai_logs_session_id ON ai_response_logs(session_id);
CREATE INDEX idx_ai_logs_user_id ON ai_response_logs(user_id);
CREATE INDEX idx_ai_logs_ai_type ON ai_response_logs(ai_type);
CREATE INDEX idx_ai_logs_was_crisis ON ai_response_logs(was_crisis);
CREATE INDEX idx_ai_logs_sentiment_emotion ON ai_response_logs(sentiment_emotion);
CREATE INDEX idx_ai_logs_user_feedback ON ai_response_logs(user_feedback);

-- =====================================================
-- 3. AI FEEDBACK (usuárias dando thumbs up/down)
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_id UUID REFERENCES ai_response_logs(id),
  user_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  tags TEXT[], -- ['muito_robotica', 'nao_entendeu', 'ajudou_muito', 'tom_inadequado']
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_feedback_log_id ON ai_feedback(log_id);
CREATE INDEX idx_ai_feedback_rating ON ai_feedback(rating);

-- =====================================================
-- 4. AI METRICS DAILY (agregação diária para gráficos)
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_metrics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,

  -- Volume
  total_responses INTEGER DEFAULT 0,
  total_chat_responses INTEGER DEFAULT 0,
  total_analyzer_responses INTEGER DEFAULT 0,

  -- Sentiment Distribution
  emotion_triste INTEGER DEFAULT 0,
  emotion_ansiosa INTEGER DEFAULT 0,
  emotion_raiva INTEGER DEFAULT 0,
  emotion_feliz INTEGER DEFAULT 0,
  emotion_confusa INTEGER DEFAULT 0,
  emotion_esperancosa INTEGER DEFAULT 0,
  emotion_desesperada INTEGER DEFAULT 0,

  -- Urgency Distribution
  urgency_baixa INTEGER DEFAULT 0,
  urgency_media INTEGER DEFAULT 0,
  urgency_alta INTEGER DEFAULT 0,
  urgency_critica INTEGER DEFAULT 0,

  -- Humanization
  avg_roboticness_before FLOAT,
  avg_roboticness_after FLOAT,
  avg_improvement_percent FLOAT, -- % de melhoria

  -- Performance
  avg_processing_time_ms INTEGER,
  avg_bert_time_ms INTEGER,
  avg_gpt_time_ms INTEGER,
  avg_humanizer_time_ms INTEGER,

  -- Feedback
  total_feedbacks INTEGER DEFAULT 0,
  avg_rating FLOAT,
  rating_1_count INTEGER DEFAULT 0,
  rating_2_count INTEGER DEFAULT 0,
  rating_3_count INTEGER DEFAULT 0,
  rating_4_count INTEGER DEFAULT 0,
  rating_5_count INTEGER DEFAULT 0,

  -- Crises
  total_crises INTEGER DEFAULT 0,
  total_escalated INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_metrics_date ON ai_metrics_daily(date DESC);

-- =====================================================
-- 5. CONTENT MODERATION (para chat da comunidade)
-- =====================================================

CREATE TABLE IF NOT EXISTS content_moderation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT NOT NULL, -- 'chat_message', 'journal_entry', 'profile_bio'
  content_id UUID NOT NULL,
  user_id TEXT NOT NULL,

  -- Detecção
  flagged_reason TEXT NOT NULL, -- 'personal_info', 'abuse', 'spam', 'crisis'
  detected_patterns TEXT[], -- ['telefone', 'cpf', '@instagram']
  ai_confidence FLOAT, -- 0-1

  -- Status
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, escalated
  reviewed_by UUID REFERENCES admin_users(id),
  reviewed_at TIMESTAMPTZ,
  moderator_notes TEXT,

  -- Ação tomada
  action_taken TEXT, -- 'blocked', 'edited', 'warning_sent', 'user_banned'

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_moderation_status ON content_moderation(status);
CREATE INDEX idx_moderation_created_at ON content_moderation(created_at DESC);
CREATE INDEX idx_moderation_user_id ON content_moderation(user_id);

-- =====================================================
-- 6. USER MANAGEMENT (para painel admin)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  activity_type TEXT NOT NULL, -- 'login', 'chat_message', 'journal_entry', 'credits_used'
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_activities_type ON user_activities(activity_type);
CREATE INDEX idx_activities_created_at ON user_activities(created_at DESC);

-- =====================================================
-- 7. FUNÇÃO PARA AGREGAÇÃO DIÁRIA AUTOMÁTICA
-- =====================================================

CREATE OR REPLACE FUNCTION aggregate_daily_metrics()
RETURNS void AS $$
DECLARE
  target_date DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
  INSERT INTO ai_metrics_daily (
    date,
    total_responses,
    total_chat_responses,
    total_analyzer_responses,

    -- Emotions
    emotion_triste,
    emotion_ansiosa,
    emotion_raiva,
    emotion_feliz,
    emotion_confusa,
    emotion_esperancosa,
    emotion_desesperada,

    -- Urgency
    urgency_baixa,
    urgency_media,
    urgency_alta,
    urgency_critica,

    -- Humanization
    avg_roboticness_before,
    avg_roboticness_after,
    avg_improvement_percent,

    -- Performance
    avg_processing_time_ms,
    avg_bert_time_ms,
    avg_gpt_time_ms,
    avg_humanizer_time_ms,

    -- Feedback
    total_feedbacks,
    avg_rating,
    rating_1_count,
    rating_2_count,
    rating_3_count,
    rating_4_count,
    rating_5_count,

    -- Crises
    total_crises,
    total_escalated
  )
  SELECT
    target_date,
    COUNT(*),
    COUNT(*) FILTER (WHERE ai_type = 'chat'),
    COUNT(*) FILTER (WHERE ai_type = 'analyzer'),

    -- Emotions
    COUNT(*) FILTER (WHERE sentiment_emotion = 'triste'),
    COUNT(*) FILTER (WHERE sentiment_emotion = 'ansiosa'),
    COUNT(*) FILTER (WHERE sentiment_emotion = 'raiva'),
    COUNT(*) FILTER (WHERE sentiment_emotion = 'feliz'),
    COUNT(*) FILTER (WHERE sentiment_emotion = 'confusa'),
    COUNT(*) FILTER (WHERE sentiment_emotion = 'esperancosa'),
    COUNT(*) FILTER (WHERE sentiment_emotion = 'desesperada'),

    -- Urgency
    COUNT(*) FILTER (WHERE sentiment_urgency = 'baixa'),
    COUNT(*) FILTER (WHERE sentiment_urgency = 'media'),
    COUNT(*) FILTER (WHERE sentiment_urgency = 'alta'),
    COUNT(*) FILTER (WHERE sentiment_urgency = 'critica'),

    -- Humanization
    AVG(roboticness_before),
    AVG(roboticness_after),
    AVG((roboticness_before - roboticness_after) / NULLIF(roboticness_before, 0) * 100),

    -- Performance
    AVG(processing_time_ms)::INTEGER,
    AVG(bert_time_ms)::INTEGER,
    AVG(gpt_time_ms)::INTEGER,
    AVG(humanizer_time_ms)::INTEGER,

    -- Feedback
    COUNT(user_feedback),
    AVG(user_feedback),
    COUNT(*) FILTER (WHERE user_feedback = 1),
    COUNT(*) FILTER (WHERE user_feedback = 2),
    COUNT(*) FILTER (WHERE user_feedback = 3),
    COUNT(*) FILTER (WHERE user_feedback = 4),
    COUNT(*) FILTER (WHERE user_feedback = 5),

    -- Crises
    COUNT(*) FILTER (WHERE was_crisis = true),
    COUNT(*) FILTER (WHERE was_escalated = true)
  FROM ai_response_logs
  WHERE DATE(created_at) = target_date
  ON CONFLICT (date) DO UPDATE SET
    total_responses = EXCLUDED.total_responses,
    total_chat_responses = EXCLUDED.total_chat_responses,
    total_analyzer_responses = EXCLUDED.total_analyzer_responses,
    emotion_triste = EXCLUDED.emotion_triste,
    emotion_ansiosa = EXCLUDED.emotion_ansiosa,
    emotion_raiva = EXCLUDED.emotion_raiva,
    emotion_feliz = EXCLUDED.emotion_feliz,
    emotion_confusa = EXCLUDED.emotion_confusa,
    emotion_esperancosa = EXCLUDED.emotion_esperancosa,
    emotion_desesperada = EXCLUDED.emotion_desesperada,
    urgency_baixa = EXCLUDED.urgency_baixa,
    urgency_media = EXCLUDED.urgency_media,
    urgency_alta = EXCLUDED.urgency_alta,
    urgency_critica = EXCLUDED.urgency_critica,
    avg_roboticness_before = EXCLUDED.avg_roboticness_before,
    avg_roboticness_after = EXCLUDED.avg_roboticness_after,
    avg_improvement_percent = EXCLUDED.avg_improvement_percent,
    avg_processing_time_ms = EXCLUDED.avg_processing_time_ms,
    avg_bert_time_ms = EXCLUDED.avg_bert_time_ms,
    avg_gpt_time_ms = EXCLUDED.avg_gpt_time_ms,
    avg_humanizer_time_ms = EXCLUDED.avg_humanizer_time_ms,
    total_feedbacks = EXCLUDED.total_feedbacks,
    avg_rating = EXCLUDED.avg_rating,
    rating_1_count = EXCLUDED.rating_1_count,
    rating_2_count = EXCLUDED.rating_2_count,
    rating_3_count = EXCLUDED.rating_3_count,
    rating_4_count = EXCLUDED.rating_4_count,
    rating_5_count = EXCLUDED.rating_5_count,
    total_crises = EXCLUDED.total_crises,
    total_escalated = EXCLUDED.total_escalated,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. COMENTÁRIOS DAS TABELAS
-- =====================================================

COMMENT ON TABLE admin_users IS 'Usuários com acesso ao dashboard admin';
COMMENT ON TABLE ai_response_logs IS 'Logs completos de todas as respostas da IA (chat + analyzer)';
COMMENT ON TABLE ai_feedback IS 'Feedback das usuárias sobre respostas da IA';
COMMENT ON TABLE ai_metrics_daily IS 'Métricas agregadas por dia (para gráficos)';
COMMENT ON TABLE content_moderation IS 'Moderação de conteúdo (chat, journal, etc)';
COMMENT ON TABLE user_activities IS 'Atividades das usuárias (para analytics)';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
