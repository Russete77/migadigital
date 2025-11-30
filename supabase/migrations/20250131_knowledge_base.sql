-- ═══════════════════════════════════════════════════════════════════════════════
-- KNOWLEDGE BASE com pgvector para RAG
-- Sistema de Retrieval-Augmented Generation
-- ═══════════════════════════════════════════════════════════════════════════════

-- Habilitar extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABELA: knowledge_documents
-- Armazena os documentos originais (PDFs, textos)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL DEFAULT 'pdf', -- pdf, text, url
  source_url TEXT, -- URL do arquivo no storage
  file_name TEXT,
  file_size INTEGER,
  content_hash TEXT, -- Hash para evitar duplicatas
  total_chunks INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABELA: knowledge_chunks
-- Chunks de texto com embeddings para busca semântica
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  content_length INTEGER,
  embedding vector(1536), -- OpenAI text-embedding-3-small usa 1536 dimensões
  metadata JSONB DEFAULT '{}', -- página, seção, etc
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABELA: knowledge_categories
-- Categorias para organizar documentos
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS knowledge_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir categorias padrão
INSERT INTO knowledge_categories (name, description, icon, color) VALUES
  ('relacionamentos', 'Conteúdo sobre relacionamentos saudáveis e tóxicos', 'heart', 'red'),
  ('autoestima', 'Autoconhecimento e amor próprio', 'star', 'yellow'),
  ('violencia', 'Identificação e prevenção de violência', 'shield', 'purple'),
  ('recuperacao', 'Processo de cura e recuperação', 'sparkles', 'green'),
  ('limites', 'Como estabelecer limites saudáveis', 'lock', 'blue'),
  ('geral', 'Conteúdo geral de apoio emocional', 'book', 'gray')
ON CONFLICT (name) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABELA: document_categories (many-to-many)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS document_categories (
  document_id UUID REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  category_id UUID REFERENCES knowledge_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (document_id, category_id)
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABELA: knowledge_usage_logs
-- Logs de uso do conhecimento nas respostas
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS knowledge_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  response_log_id UUID REFERENCES ai_response_logs(id),
  chunk_ids UUID[] NOT NULL,
  query_text TEXT,
  similarity_scores FLOAT[],
  was_helpful BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ÍNDICES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Índice HNSW para busca vetorial rápida
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding
  ON knowledge_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Índices para queries comuns
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_status ON knowledge_documents(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_created_at ON knowledge_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_document_id ON knowledge_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_usage_logs_response ON knowledge_usage_logs(response_log_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- FUNÇÕES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Função de busca semântica
CREATE OR REPLACE FUNCTION search_knowledge(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  filter_categories UUID[] DEFAULT NULL
)
RETURNS TABLE (
  chunk_id UUID,
  document_id UUID,
  document_title TEXT,
  content TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id AS chunk_id,
    kc.document_id,
    kd.title AS document_title,
    kc.content,
    1 - (kc.embedding <=> query_embedding) AS similarity,
    kc.metadata
  FROM knowledge_chunks kc
  JOIN knowledge_documents kd ON kd.id = kc.document_id
  LEFT JOIN document_categories dc ON dc.document_id = kd.id
  WHERE
    kd.status = 'completed'
    AND (1 - (kc.embedding <=> query_embedding)) > match_threshold
    AND (filter_categories IS NULL OR dc.category_id = ANY(filter_categories))
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_knowledge_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_knowledge_documents_updated_at
  BEFORE UPDATE ON knowledge_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_documents_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_usage_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para leitura (todos podem ler conhecimento ativo)
CREATE POLICY "Anyone can read active documents" ON knowledge_documents
  FOR SELECT USING (status = 'completed');

CREATE POLICY "Anyone can read chunks" ON knowledge_chunks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM knowledge_documents kd
      WHERE kd.id = document_id AND kd.status = 'completed'
    )
  );

CREATE POLICY "Anyone can read categories" ON knowledge_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can read document_categories" ON document_categories
  FOR SELECT USING (true);

-- Políticas para escrita (apenas admins via service role)
-- O service role bypassa RLS, então não precisamos de políticas específicas

-- ═══════════════════════════════════════════════════════════════════════════════
-- STORAGE BUCKET
-- ═══════════════════════════════════════════════════════════════════════════════

-- Criar bucket para documentos (executar separadamente no Supabase Dashboard se necessário)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('knowledge-docs', 'knowledge-docs', false);

COMMENT ON TABLE knowledge_documents IS 'Documentos originais para base de conhecimento RAG';
COMMENT ON TABLE knowledge_chunks IS 'Chunks de texto com embeddings vetoriais para busca semântica';
COMMENT ON TABLE knowledge_categories IS 'Categorias para organização dos documentos';
COMMENT ON FUNCTION search_knowledge IS 'Busca semântica usando similaridade de cosseno nos embeddings';
