-- =====================================================
-- SISTEMA DE COMUNIDADE - CHAT EM GRUPO SECRETO
-- Data: 2025-01-23
-- =====================================================

-- =====================================================
-- 1. CHAT ROOMS (Salas de Chat)
-- =====================================================

CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'general', -- general, support, crisis
  max_members INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_chat_rooms_is_active ON chat_rooms(is_active);
CREATE INDEX idx_chat_rooms_type ON chat_rooms(type);

-- =====================================================
-- 2. CHAT PROFILES (Perfis Anônimos)
-- =====================================================

CREATE TABLE IF NOT EXISTS chat_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL UNIQUE,
  avatar_color TEXT DEFAULT '#E94057',
  bio TEXT,
  is_banned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id) -- Um perfil de chat por usuário
);

-- Índices
CREATE INDEX idx_chat_profiles_user_id ON chat_profiles(user_id);
CREATE INDEX idx_chat_profiles_nickname ON chat_profiles(nickname);
CREATE INDEX idx_chat_profiles_is_banned ON chat_profiles(is_banned);

-- =====================================================
-- 3. CHAT MESSAGES (Mensagens)
-- =====================================================

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES chat_profiles(id),
  message_type TEXT NOT NULL DEFAULT 'text', -- text, audio
  content TEXT, -- Texto da mensagem (null se áudio)
  audio_url TEXT, -- URL do áudio no Supabase Storage (null se texto)
  audio_duration INTEGER, -- Duração em segundos
  is_deleted BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false, -- Moderação automática
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CHECK (
    (message_type = 'text' AND content IS NOT NULL AND content != '') OR
    (message_type = 'audio' AND audio_url IS NOT NULL)
  )
);

-- Índices para performance
CREATE INDEX idx_chat_messages_room_created ON chat_messages(room_id, created_at DESC);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_is_flagged ON chat_messages(is_flagged);
CREATE INDEX idx_chat_messages_is_deleted ON chat_messages(is_deleted);

-- =====================================================
-- 4. CHAT REPORTS (Denúncias)
-- =====================================================

CREATE TABLE IF NOT EXISTS chat_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES chat_messages(id),
  reporter_id UUID NOT NULL REFERENCES chat_profiles(id),
  reason TEXT NOT NULL, -- abusive, personal_info, spam, harassment
  description TEXT,
  status TEXT DEFAULT 'pending', -- pending, reviewed, action_taken
  reviewed_by UUID REFERENCES admin_users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_chat_reports_status ON chat_reports(status);
CREATE INDEX idx_chat_reports_message_id ON chat_reports(message_id);
CREATE INDEX idx_chat_reports_created ON chat_reports(created_at DESC);

-- =====================================================
-- 5. CHAT ROOM MEMBERS (Membros por Sala)
-- =====================================================

CREATE TABLE IF NOT EXISTS chat_room_members (
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES chat_profiles(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (room_id, profile_id)
);

-- Índices
CREATE INDEX idx_chat_room_members_room ON chat_room_members(room_id);
CREATE INDEX idx_chat_room_members_profile ON chat_room_members(profile_id);

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================
-- ⚠️ IMPORTANTE: RLS DESABILITADO para funcionar com Clerk
-- Em produção, configure RLS corretamente ou use Service Role Key via API routes

-- Desabilitar RLS
ALTER TABLE chat_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Trigger para atualizar updated_at em chat_rooms
DROP TRIGGER IF EXISTS update_chat_rooms_updated_at ON chat_rooms;
CREATE TRIGGER update_chat_rooms_updated_at
  BEFORE UPDATE ON chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar updated_at em chat_profiles
DROP TRIGGER IF EXISTS update_chat_profiles_updated_at ON chat_profiles;
CREATE TRIGGER update_chat_profiles_updated_at
  BEFORE UPDATE ON chat_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. SALAS PRÉ-DEFINIDAS
-- =====================================================

INSERT INTO chat_rooms (name, description, type) VALUES
  ('Conversa Geral', 'Espaço livre para conversar sobre qualquer assunto', 'general'),
  ('Desabafos', 'Compartilhe seus sentimentos e desabafe em segurança', 'support'),
  ('Relacionamentos Tóxicos', 'Apoio para quem está ou esteve em relacionamento abusivo', 'support'),
  ('Autoestima e Amor Próprio', 'Fortalecimento pessoal e empoderamento feminino', 'support')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE chat_rooms IS 'Salas de chat da comunidade';
COMMENT ON TABLE chat_profiles IS 'Perfis anônimos das usuárias para chat (separado do Clerk)';
COMMENT ON TABLE chat_messages IS 'Mensagens enviadas nas salas de chat';
COMMENT ON TABLE chat_reports IS 'Denúncias de mensagens abusivas ou inadequadas';
COMMENT ON TABLE chat_room_members IS 'Membros ativos em cada sala';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
