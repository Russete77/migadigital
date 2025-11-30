-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum para planos
CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'pro');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'canceled', 'past_due');

-- Profiles
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

-- Emergency Sessions
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

-- Conversation Analyses
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

-- Journal Entries
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

-- Audio Listens
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

-- Índices para performance
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

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_listens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users view own profile" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
DROP POLICY IF EXISTS "Users view own sessions" ON emergency_sessions;
DROP POLICY IF EXISTS "Users insert own sessions" ON emergency_sessions;
DROP POLICY IF EXISTS "Users update own sessions" ON emergency_sessions;
DROP POLICY IF EXISTS "Users view own analyses" ON conversation_analyses;
DROP POLICY IF EXISTS "Users insert own analyses" ON conversation_analyses;
DROP POLICY IF EXISTS "Users update own analyses" ON conversation_analyses;
DROP POLICY IF EXISTS "Users view own journal" ON journal_entries;
DROP POLICY IF EXISTS "Users insert own journal" ON journal_entries;
DROP POLICY IF EXISTS "Users update own journal" ON journal_entries;
DROP POLICY IF EXISTS "Users delete own journal" ON journal_entries;
DROP POLICY IF EXISTS "Users view own audio listens" ON audio_listens;
DROP POLICY IF EXISTS "Users insert own audio listens" ON audio_listens;

-- Policies: usuária vê apenas seus dados
CREATE POLICY "Users view own profile" ON profiles
  FOR SELECT USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users view own sessions" ON emergency_sessions
  FOR SELECT USING (user_id IN (SELECT id FROM profiles WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users insert own sessions" ON emergency_sessions
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM profiles WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users update own sessions" ON emergency_sessions
  FOR UPDATE USING (user_id IN (SELECT id FROM profiles WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users view own analyses" ON conversation_analyses
  FOR SELECT USING (user_id IN (SELECT id FROM profiles WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users insert own analyses" ON conversation_analyses
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM profiles WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users update own analyses" ON conversation_analyses
  FOR UPDATE USING (user_id IN (SELECT id FROM profiles WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users view own journal" ON journal_entries
  FOR SELECT USING (user_id IN (SELECT id FROM profiles WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users insert own journal" ON journal_entries
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM profiles WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users update own journal" ON journal_entries
  FOR UPDATE USING (user_id IN (SELECT id FROM profiles WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users delete own journal" ON journal_entries
  FOR DELETE USING (user_id IN (SELECT id FROM profiles WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users view own audio listens" ON audio_listens
  FOR SELECT USING (user_id IN (SELECT id FROM profiles WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users insert own audio listens" ON audio_listens
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM profiles WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'));

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_journal_updated_at ON journal_entries;
CREATE TRIGGER update_journal_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
