-- ============================================
-- MIGRAÇÃO COMPLETA DO BANCO DE DADOS
-- SOS Emocional 24h - Supabase Schema
-- ============================================
-- Execute este arquivo COMPLETO no SQL Editor do Supabase
-- ============================================

-- 1. Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tipos ENUM
DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'pro');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'canceled', 'past_due');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 3. TABELAS
-- ============================================

-- 3.1 Profiles (Usuários)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,

  -- Subscription
  subscription_tier subscription_tier DEFAULT 'free',
  subscription_status subscription_status DEFAULT 'inactive',
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,

  -- Créditos
  credits_remaining INT DEFAULT 3,
  credits_reset_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.2 Emergency Sessions (Sessões de SOS)
CREATE TABLE IF NOT EXISTS emergency_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Dados da sessão
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INT,

  -- Mensagens (JSONB para flexibilidade)
  messages JSONB DEFAULT '[]'::JSONB,

  -- Resultados
  outcome TEXT, -- "prevented", "distracted", "slept", "sent_anyway"
  mood_before INT CHECK (mood_before >= 1 AND mood_before <= 10),
  mood_after INT CHECK (mood_after >= 1 AND mood_after <= 10),

  -- Análise
  trigger_identified TEXT,
  intervention_effective BOOLEAN,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.3 Conversation Analyses (Análises de Conversa)
CREATE TABLE IF NOT EXISTS conversation_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Input
  conversation_text TEXT NOT NULL,
  conversation_images TEXT[], -- URLs do Supabase Storage

  -- Análise (JSONB estruturado)
  analysis_result JSONB NOT NULL,

  -- Engagement
  saved BOOLEAN DEFAULT FALSE,
  shared_anonymous BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.4 Journal Entries (Diário Emocional)
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Conteúdo
  content TEXT NOT NULL,
  mood INT CHECK (mood >= 1 AND mood <= 10),

  -- Análise
  triggers TEXT[],
  emotions TEXT[], -- "ansiedade", "raiva", "tristeza", etc

  -- Contexto
  related_to_ex BOOLEAN DEFAULT FALSE,
  emergency_session_id UUID REFERENCES emergency_sessions(id),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.5 Audio Listens (Escuta de Áudios)
CREATE TABLE IF NOT EXISTS audio_listens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  audio_id TEXT NOT NULL, -- slug do áudio

  -- Dados da escuta
  listened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE,
  completion_percentage INT DEFAULT 0,

  -- Feedback
  helpful BOOLEAN,
  notes TEXT
);

-- ============================================
-- 4. ÍNDICES (Performance)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_clerk_id ON profiles(clerk_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_emergency_sessions_user ON emergency_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_sessions_created ON emergency_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_user ON conversation_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created ON conversation_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_user ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_created ON journal_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audio_listens_user ON audio_listens(user_id);

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================
-- ⚠️ IMPORTANTE: Desabilitado temporariamente para API Express funcionar
-- Em produção, configure RLS corretamente ou use Service Role Key

-- Desabilitar RLS (para desenvolvimento com API Express)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_analyses DISABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE audio_listens DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. TRIGGERS
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para journal_entries
DROP TRIGGER IF EXISTS update_journal_updated_at ON journal_entries;
CREATE TRIGGER update_journal_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. DADOS INICIAIS (Opcional)
-- ============================================

-- Comentado: Insira seu usuário manualmente depois
-- INSERT INTO profiles (clerk_id, email, full_name, subscription_tier, credits_remaining)
-- VALUES ('user_35oonK02BylkH4bgPUy732561ch', 'seu@email.com', 'Seu Nome', 'free', 3)
-- ON CONFLICT (clerk_id) DO NOTHING;

-- ============================================
-- 8. VERIFICAÇÃO
-- ============================================

-- Contar registros em cada tabela
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'RESUMO DO BANCO DE DADOS';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tabelas criadas com sucesso!';
  RAISE NOTICE '';
  RAISE NOTICE 'Total de profiles: %', (SELECT COUNT(*) FROM profiles);
  RAISE NOTICE 'Total de emergency_sessions: %', (SELECT COUNT(*) FROM emergency_sessions);
  RAISE NOTICE 'Total de conversation_analyses: %', (SELECT COUNT(*) FROM conversation_analyses);
  RAISE NOTICE 'Total de journal_entries: %', (SELECT COUNT(*) FROM journal_entries);
  RAISE NOTICE 'Total de audio_listens: %', (SELECT COUNT(*) FROM audio_listens);
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migração concluída!';
  RAISE NOTICE '============================================';
END $$;

-- Listar todas as tabelas criadas
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as colunas
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN ('profiles', 'emergency_sessions', 'conversation_analyses', 'journal_entries', 'audio_listens')
ORDER BY table_name;
