-- ============================================
-- MIGRATION: Adicionar suporte a mensagens de áudio
-- Data: 2025-01-24
-- ============================================

BEGIN;

-- Remover constraint antiga se existir
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_check;
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_message_type_check;

-- Adicionar nova constraint permitindo 'audio'
ALTER TABLE chat_messages
  ADD CONSTRAINT chat_messages_message_type_check
  CHECK (message_type IN ('text', 'audio', 'image', 'file'));

-- Garantir que a coluna message_type existe e tem valor padrão
ALTER TABLE chat_messages
  ALTER COLUMN message_type SET DEFAULT 'text';

COMMIT;

-- ============================================
-- NOTAS
-- ============================================
-- Esta migration permite que mensagens de áudio sejam salvas
-- Tipos suportados: text, audio, image, file
