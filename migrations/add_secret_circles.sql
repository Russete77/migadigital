-- ============================================
-- MIGRATION: Círculos Secretos
-- Adiciona features de auto-destruição, anonimato, polls
-- Data: 2025-01-24
-- ============================================

BEGIN;

-- ============================================
-- 1. EXTENDER CHAT_ROOMS
-- ============================================
ALTER TABLE chat_rooms
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS password_hash text,
  ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS template text DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS member_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- ============================================
-- 2. EXTENDER CHAT_MESSAGES (reações)
-- ============================================
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '{}';

-- Formato esperado: {"❤️": ["user_id_1", "user_id_2"], "🔥": ["user_id_3"]}

-- ============================================
-- 3. EXTENDER CHAT_ROOM_MEMBERS (anonimato + admin)
-- ============================================
ALTER TABLE chat_room_members
  ADD COLUMN IF NOT EXISTS anonymous_color text,  -- Cor anônima única por sala
  ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- ============================================
-- 4. CRIAR TABELA DE POLLS
-- ============================================
CREATE TABLE IF NOT EXISTS chat_polls (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  created_by uuid REFERENCES chat_profiles(id) ON DELETE SET NULL,
  question text NOT NULL,
  options jsonb NOT NULL,
  -- Formato: [{"id": "opt1", "text": "Opção A", "votes": ["user1", "user2"]}, ...]
  expires_at timestamp with time zone,
  is_anonymous boolean DEFAULT true,  -- Votações anônimas por padrão
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- 5. ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_chat_rooms_expires_at
  ON chat_rooms(expires_at)
  WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chat_rooms_status
  ON chat_rooms(status);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_tags
  ON chat_rooms USING gin(tags);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_by
  ON chat_rooms(created_by);

CREATE INDEX IF NOT EXISTS idx_chat_polls_room_id
  ON chat_polls(room_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created
  ON chat_messages(room_id, created_at DESC);

-- ============================================
-- 6. TRIGGER: AUTO-UPDATE MEMBER_COUNT
-- ============================================
CREATE OR REPLACE FUNCTION update_room_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE chat_rooms
    SET member_count = member_count + 1
    WHERE id = NEW.room_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE chat_rooms
    SET member_count = GREATEST(0, member_count - 1)
    WHERE id = OLD.room_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_member_count ON chat_room_members;
CREATE TRIGGER trigger_update_member_count
AFTER INSERT OR DELETE ON chat_room_members
FOR EACH ROW EXECUTE FUNCTION update_room_member_count();

-- ============================================
-- 7. FUNÇÃO: CLEANUP DE SALAS EXPIRADAS
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_rooms()
RETURNS TABLE(deleted_count integer) AS $$
DECLARE
  expired_count integer;
BEGIN
  -- 1. Marcar salas como expired
  UPDATE chat_rooms
  SET status = 'expired',
      updated_at = NOW()
  WHERE expires_at < NOW()
    AND status = 'active';

  -- 2. Deletar salas expiradas há mais de 24h (hard delete)
  WITH deleted AS (
    DELETE FROM chat_rooms
    WHERE status = 'expired'
      AND expires_at < NOW() - INTERVAL '24 hours'
    RETURNING id
  )
  SELECT COUNT(*)::integer INTO expired_count FROM deleted;

  RETURN QUERY SELECT expired_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. FUNÇÃO: GERAR COR ANÔNIMA ÚNICA
-- ============================================
CREATE OR REPLACE FUNCTION generate_anonymous_color(p_user_id uuid, p_room_id uuid)
RETURNS text AS $$
DECLARE
  colors text[] := ARRAY[
    '#FF6B6B',  -- Vermelho
    '#4ECDC4',  -- Turquesa
    '#FFE66D',  -- Amarelo
    '#A8E6CF',  -- Verde menta
    '#FF8B94',  -- Rosa
    '#C7CEEA',  -- Lavanda
    '#FFDAC1',  -- Pêssego
    '#B4F8C8',  -- Verde claro
    '#FBE7C6',  -- Bege
    '#A0E7E5'   -- Azul claro
  ];
  hash_value bigint;
  color_index integer;
BEGIN
  -- Gerar hash único baseado em user_id + room_id
  hash_value := ('x' || substr(md5(p_user_id::text || p_room_id::text), 1, 8))::bit(32)::bigint;
  color_index := (hash_value % array_length(colors, 1)) + 1;

  RETURN colors[color_index];
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 9. VIEWS ÚTEIS
-- ============================================

-- View: Salas ativas com detalhes
CREATE OR REPLACE VIEW active_rooms_with_details AS
SELECT
  r.id,
  r.name,
  r.description,
  r.type,
  r.template,
  r.tags,
  r.is_anonymous,
  r.expires_at,
  r.member_count,
  r.max_members,
  r.created_at,
  r.created_by,
  p.full_name as creator_name,
  EXTRACT(EPOCH FROM (r.expires_at - NOW())) / 3600 AS hours_until_expiration,
  CASE
    WHEN r.expires_at < NOW() + INTERVAL '2 hours' THEN 'expiring_soon'
    WHEN r.expires_at < NOW() + INTERVAL '24 hours' THEN 'expiring_today'
    ELSE 'active'
  END as urgency_level
FROM chat_rooms r
LEFT JOIN profiles p ON r.created_by = p.id
WHERE r.status = 'active'
  AND (r.expires_at IS NULL OR r.expires_at > NOW())
ORDER BY r.created_at DESC;

-- View: Mensagens recentes por sala
CREATE OR REPLACE VIEW recent_room_messages AS
SELECT
  m.id,
  m.room_id,
  m.sender_id,
  m.content,
  m.reactions,
  m.created_at,
  cp.nickname,
  cp.avatar_color,
  rm.anonymous_color,
  r.is_anonymous,
  CASE
    WHEN r.is_anonymous THEN rm.anonymous_color
    ELSE cp.avatar_color
  END as display_color
FROM chat_messages m
JOIN chat_profiles cp ON m.sender_id = cp.id
JOIN chat_rooms r ON m.room_id = r.id
LEFT JOIN chat_room_members rm ON m.room_id = rm.room_id AND m.sender_id = rm.profile_id
WHERE m.is_deleted = false
ORDER BY m.created_at DESC;

-- ============================================
-- 10. POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS nas tabelas de chat
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_polls ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer usuária autenticada pode VER salas ativas
CREATE POLICY "Salas ativas visíveis para todos"
  ON chat_rooms FOR SELECT
  USING (status = 'active' AND is_active = true);

-- Política: Apenas criadora pode DELETAR sua sala
CREATE POLICY "Apenas criadora pode deletar sala"
  ON chat_rooms FOR DELETE
  USING (auth.uid()::uuid IN (SELECT id FROM profiles WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'));

-- Política: Usuárias autenticadas podem CRIAR salas (max 3 ativas)
CREATE POLICY "Usuárias podem criar salas"
  ON chat_rooms FOR INSERT
  WITH CHECK (
    (SELECT COUNT(*) FROM chat_rooms
     WHERE created_by IN (SELECT id FROM profiles WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub')
     AND status = 'active') < 3
  );

-- Política: Membros podem VER mensagens da sala
CREATE POLICY "Membros veem mensagens"
  ON chat_messages FOR SELECT
  USING (
    room_id IN (
      SELECT rm.room_id FROM chat_room_members rm
      JOIN chat_profiles cp ON rm.profile_id = cp.id
      JOIN profiles p ON cp.user_id = p.id
      WHERE p.clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Política: Membros podem ENVIAR mensagens
CREATE POLICY "Membros podem enviar mensagens"
  ON chat_messages FOR INSERT
  WITH CHECK (
    sender_id IN (
      SELECT cp.id FROM chat_profiles cp
      JOIN profiles p ON cp.user_id = p.id
      WHERE p.clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
    AND room_id IN (
      SELECT rm.room_id FROM chat_room_members rm
      WHERE rm.profile_id = sender_id
    )
  );

-- ============================================
-- 11. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================
COMMENT ON COLUMN chat_rooms.created_by IS 'Usuária que criou a sala (nula se deletada)';
COMMENT ON COLUMN chat_rooms.expires_at IS 'Data de auto-destruição (nula = permanente)';
COMMENT ON COLUMN chat_rooms.password_hash IS 'Hash bcrypt para salas privadas (nulo = pública)';
COMMENT ON COLUMN chat_rooms.is_anonymous IS 'Se true, mensagens mostram cor anônima';
COMMENT ON COLUMN chat_rooms.tags IS 'Tags para categorização: ["ansiedade", "relacionamentos"]';
COMMENT ON COLUMN chat_rooms.template IS 'Tipo: vent, support, celebration, advice, custom';
COMMENT ON COLUMN chat_rooms.status IS 'Status: active, expired, archived';

COMMENT ON COLUMN chat_messages.reactions IS 'JSON: {"❤️": ["user_id"], "🔥": ["user_id"]}';

COMMENT ON COLUMN chat_room_members.anonymous_color IS 'Cor única gerada para esta sala (hex)';
COMMENT ON COLUMN chat_room_members.is_admin IS 'Se true, pode moderar/deletar sala';

COMMENT ON TABLE chat_polls IS 'Votações dentro das salas';
COMMENT ON COLUMN chat_polls.options IS 'Array: [{"id", "text", "votes": []}]';

-- ============================================
-- 12. POPULAR DADOS INICIAIS (OPCIONAL)
-- ============================================

-- Salas padrão (tipo "lounge" sempre disponível)
INSERT INTO chat_rooms (name, description, type, template, tags, is_active, status, max_members)
VALUES
  ('💬 Sala Geral', 'Converse sobre qualquer coisa', 'general', 'custom', ARRAY['geral', 'conversa'], true, 'active', 100),
  ('🫂 Apoio Mútuo', 'Grupo de apoio emocional', 'support', 'support', ARRAY['apoio', 'suporte'], true, 'active', 50)
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================
-- NOTAS FINAIS
-- ============================================
-- Para rodar a limpeza de salas expiradas, execute:
-- SELECT cleanup_expired_rooms();
--
-- Recomenda-se criar um cron job (pg_cron ou edge function):
-- SELECT cron.schedule('cleanup-rooms', '0 * * * *', 'SELECT cleanup_expired_rooms()');
