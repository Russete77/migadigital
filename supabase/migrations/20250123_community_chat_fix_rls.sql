-- =====================================================
-- FIX: DESABILITAR RLS PARA TABELAS DE CHAT
-- Data: 2025-11-23
-- Motivo: Clerk auth não funciona com auth.jwt() do Supabase
-- =====================================================

-- Desabilitar RLS (temporariamente para desenvolvimento)
-- Em produção, use Service Role Key ou API routes
ALTER TABLE chat_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members DISABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Salas ativas visíveis para todas" ON chat_rooms;
DROP POLICY IF EXISTS "Perfis visíveis para todas" ON chat_profiles;
DROP POLICY IF EXISTS "Criar próprio perfil de chat" ON chat_profiles;
DROP POLICY IF EXISTS "Atualizar próprio perfil de chat" ON chat_profiles;
DROP POLICY IF EXISTS "Mensagens visíveis para todas" ON chat_messages;
DROP POLICY IF EXISTS "Enviar mensagens" ON chat_messages;
DROP POLICY IF EXISTS "Deletar próprias mensagens" ON chat_messages;
DROP POLICY IF EXISTS "Criar denúncias" ON chat_reports;
DROP POLICY IF EXISTS "Ver próprias denúncias" ON chat_reports;
DROP POLICY IF EXISTS "Ver membros das salas" ON chat_room_members;
DROP POLICY IF EXISTS "Entrar em salas" ON chat_room_members;

-- =====================================================
-- COMENTÁRIO
-- =====================================================

COMMENT ON TABLE chat_rooms IS 'RLS DESABILITADO - Acesso via client controlado pela aplicação';
COMMENT ON TABLE chat_profiles IS 'RLS DESABILITADO - Acesso via client controlado pela aplicação';
COMMENT ON TABLE chat_messages IS 'RLS DESABILITADO - Acesso via client controlado pela aplicação';

-- =====================================================
-- FIM
-- =====================================================
