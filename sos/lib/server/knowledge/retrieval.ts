import { supabaseAdmin } from '../supabase-admin';
import { generateEmbedding } from './embeddings';

/**
 * Knowledge Retrieval Service
 * Busca e recupera contexto relevante da base de conhecimento
 */

export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  content: string;
  similarity: number;
  metadata: {
    page?: number;
    section?: string;
  };
}

export interface RetrievalResult {
  chunks: RetrievedChunk[];
  totalFound: number;
  queryTime: number;
}

export interface RetrievalOptions {
  maxResults?: number;
  minSimilarity?: number;
  categoryIds?: string[];
  excludeDocumentIds?: string[];
}

const DEFAULT_OPTIONS: Required<Omit<RetrievalOptions, 'categoryIds' | 'excludeDocumentIds'>> = {
  maxResults: 5,
  minSimilarity: 0.7,
};

/**
 * Busca chunks relevantes na base de conhecimento
 */
export async function searchKnowledge(
  query: string,
  options: RetrievalOptions = {}
): Promise<RetrievalResult> {
  const startTime = Date.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Gerar embedding da query
    const queryEmbedding = await generateEmbedding(query);
    const embeddingString = `[${queryEmbedding.join(',')}]`;

    // Usar função RPC do Supabase para busca vetorial
    const { data, error } = await supabaseAdmin.rpc('search_knowledge', {
      query_embedding: embeddingString,
      match_threshold: opts.minSimilarity,
      match_count: opts.maxResults,
      filter_categories: opts.categoryIds || null,
    });

    if (error) {
      console.error('Error searching knowledge:', error);
      throw error;
    }

    const chunks: RetrievedChunk[] = (data || []).map((row: any) => ({
      chunkId: row.chunk_id,
      documentId: row.document_id,
      documentTitle: row.document_title,
      content: row.content,
      similarity: row.similarity,
      metadata: row.metadata || {},
    }));

    // Filtrar documentos excluídos se especificado
    const filteredChunks = opts.excludeDocumentIds
      ? chunks.filter((c) => !opts.excludeDocumentIds!.includes(c.documentId))
      : chunks;

    return {
      chunks: filteredChunks,
      totalFound: filteredChunks.length,
      queryTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Knowledge search error:', error);

    // Fallback: busca sem embedding (full-text search simples)
    return fallbackSearch(query, opts);
  }
}

/**
 * Busca fallback usando LIKE (caso embeddings falhem)
 */
async function fallbackSearch(
  query: string,
  options: Required<Omit<RetrievalOptions, 'categoryIds' | 'excludeDocumentIds'>>
): Promise<RetrievalResult> {
  const startTime = Date.now();

  // Extrair palavras-chave da query
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 5);

  if (keywords.length === 0) {
    return { chunks: [], totalFound: 0, queryTime: Date.now() - startTime };
  }

  // Buscar chunks que contenham as palavras-chave
  let queryBuilder = supabaseAdmin
    .from('knowledge_chunks')
    .select(
      `
      id,
      document_id,
      content,
      metadata,
      knowledge_documents!inner(title, status)
    `
    )
    .eq('knowledge_documents.status', 'completed');

  // Adicionar condições OR para cada keyword
  const orConditions = keywords.map((k) => `content.ilike.%${k}%`).join(',');
  queryBuilder = queryBuilder.or(orConditions);

  const { data, error } = await queryBuilder.limit(options.maxResults);

  if (error) {
    console.error('Fallback search error:', error);
    return { chunks: [], totalFound: 0, queryTime: Date.now() - startTime };
  }

  const chunks: RetrievedChunk[] = (data || []).map((row: any) => ({
    chunkId: row.id,
    documentId: row.document_id,
    documentTitle: row.knowledge_documents?.title || 'Documento',
    content: row.content,
    similarity: 0.5, // Similaridade fixa para fallback
    metadata: row.metadata || {},
  }));

  return {
    chunks,
    totalFound: chunks.length,
    queryTime: Date.now() - startTime,
  };
}

/**
 * Formata chunks recuperados como contexto para o prompt
 */
export function formatContextForPrompt(
  chunks: RetrievedChunk[],
  options: {
    maxLength?: number;
    includeSource?: boolean;
  } = {}
): string {
  const { maxLength = 3000, includeSource = false } = options;

  if (chunks.length === 0) {
    return '';
  }

  let context = '';
  let currentLength = 0;

  for (const chunk of chunks) {
    const header = includeSource ? `[Fonte: ${chunk.documentTitle}]\n` : '';
    const chunkText = header + chunk.content + '\n\n';

    if (currentLength + chunkText.length > maxLength) {
      // Truncar se necessário
      const remaining = maxLength - currentLength;
      if (remaining > 100) {
        context += chunkText.slice(0, remaining) + '...';
      }
      break;
    }

    context += chunkText;
    currentLength += chunkText.length;
  }

  return context.trim();
}

/**
 * Busca contexto relevante e formata para uso no prompt
 */
export async function getRelevantContext(
  query: string,
  options: RetrievalOptions & {
    maxContextLength?: number;
    includeSource?: boolean;
  } = {}
): Promise<{
  context: string;
  chunks: RetrievedChunk[];
  queryTime: number;
}> {
  const { maxContextLength = 3000, includeSource = false, ...retrievalOptions } = options;

  const result = await searchKnowledge(query, retrievalOptions);

  const context = formatContextForPrompt(result.chunks, {
    maxLength: maxContextLength,
    includeSource,
  });

  return {
    context,
    chunks: result.chunks,
    queryTime: result.queryTime,
  };
}

/**
 * Registra uso do conhecimento para analytics
 */
export async function logKnowledgeUsage(params: {
  responseLogId: string;
  chunkIds: string[];
  queryText: string;
  similarityScores: number[];
  wasHelpful?: boolean;
}): Promise<void> {
  try {
    await supabaseAdmin.from('knowledge_usage_logs').insert({
      response_log_id: params.responseLogId,
      chunk_ids: params.chunkIds,
      query_text: params.queryText,
      similarity_scores: params.similarityScores,
      was_helpful: params.wasHelpful,
    });
  } catch (error) {
    console.error('Error logging knowledge usage:', error);
    // Não falhar silenciosamente, apenas logar
  }
}

/**
 * Obtém estatísticas de uso da base de conhecimento
 */
export async function getKnowledgeStats(): Promise<{
  totalDocuments: number;
  totalChunks: number;
  totalUsages: number;
  avgSimilarity: number;
  topDocuments: { id: string; title: string; usageCount: number }[];
}> {
  const [documents, chunks, usages] = await Promise.all([
    supabaseAdmin
      .from('knowledge_documents')
      .select('id', { count: 'exact' })
      .eq('status', 'completed'),
    supabaseAdmin.from('knowledge_chunks').select('id', { count: 'exact' }),
    supabaseAdmin.from('knowledge_usage_logs').select('id, similarity_scores', { count: 'exact' }),
  ]);

  // Calcular média de similaridade
  let totalSimilarity = 0;
  let similarityCount = 0;
  (usages.data || []).forEach((log: any) => {
    if (log.similarity_scores) {
      log.similarity_scores.forEach((score: number) => {
        totalSimilarity += score;
        similarityCount++;
      });
    }
  });

  return {
    totalDocuments: documents.count || 0,
    totalChunks: chunks.count || 0,
    totalUsages: usages.count || 0,
    avgSimilarity: similarityCount > 0 ? totalSimilarity / similarityCount : 0,
    topDocuments: [], // TODO: Implementar agregação por documento
  };
}

export const knowledgeRetrieval = {
  searchKnowledge,
  formatContextForPrompt,
  getRelevantContext,
  logKnowledgeUsage,
  getKnowledgeStats,
};
