-- ============================================
-- FIX: Adicionar políticas RLS para chat_room_members
-- Problema: RLS estava habilitado mas sem políticas de INSERT/SELECT
-- Data: 2025-01-24
-- ============================================

BEGIN;

-- ============================================
-- POLÍTICAS RLS PARA chat_room_members
-- ============================================

-- Política: Usuárias autenticadas podem VER suas próprias memberships
CREATE POLICY "Usuárias veem suas memberships"
  ON chat_room_members FOR SELECT
  USING (
    profile_id IN (
      SELECT cp.id FROM chat_profiles cp
      JOIN profiles p ON cp.user_id = p.id
      WHERE p.clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Política: Usuárias autenticadas podem ENTRAR em salas (criar membership)
CREATE POLICY "Usuárias podem entrar em salas"
  ON chat_room_members FOR INSERT
  WITH CHECK (
    -- Verificar se é o próprio perfil da usuária
    profile_id IN (
      SELECT cp.id FROM chat_profiles cp
      JOIN profiles p ON cp.user_id = p.id
      WHERE p.clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
    -- Verificar se a sala está ativa
    AND room_id IN (
      SELECT id FROM chat_rooms
      WHERE status = 'active' AND is_active = true
    )
  );

-- Política: Usuárias podem SAIR de salas (deletar sua membership)
CREATE POLICY "Usuárias podem sair de salas"
  ON chat_room_members FOR DELETE
  USING (
    profile_id IN (
      SELECT cp.id FROM chat_profiles cp
      JOIN profiles p ON cp.user_id = p.id
      WHERE p.clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Política: Admins podem ATUALIZAR memberships (promover/demover admins)
CREATE POLICY "Admins podem atualizar memberships"
  ON chat_room_members FOR UPDATE
  USING (
    room_id IN (
      SELECT rm.room_id FROM chat_room_members rm
      JOIN chat_profiles cp ON rm.profile_id = cp.id
      JOIN profiles p ON cp.user_id = p.id
      WHERE p.clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
        AND rm.is_admin = true
    )
  );

COMMIT;

-- ============================================
-- NOTAS
-- ============================================
-- Após rodar esta migration:
-- 1. Verifique no Supabase Dashboard que as políticas foram criadas
-- 2. Teste entrar em uma sala
-- 3. Verifique os logs do backend para confirmar que não há mais erros
