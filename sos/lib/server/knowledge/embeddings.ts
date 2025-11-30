import OpenAI from 'openai';
import { supabaseAdmin } from '../supabase-admin';

/**
 * Embeddings Service
 * Gera embeddings vetoriais usando OpenAI para busca semântica
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Modelo de embeddings - text-embedding-3-small é mais barato e eficiente
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const BATCH_SIZE = 100; // Máximo de textos por request

interface EmbeddingResult {
  index: number;
  embedding: number[];
}

/**
 * Gera embedding para um único texto
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Limpar e truncar texto se necessário (limite de 8191 tokens)
    const cleanText = text.trim().slice(0, 8000);

    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: cleanText,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Gera embeddings em batch para múltiplos textos
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<EmbeddingResult[]> {
  const results: EmbeddingResult[] = [];

  // Processar em batches
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const cleanBatch = batch.map((t) => t.trim().slice(0, 8000));

    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: cleanBatch,
        dimensions: EMBEDDING_DIMENSIONS,
      });

      response.data.forEach((item, idx) => {
        results.push({
          index: i + idx,
          embedding: item.embedding,
        });
      });

      // Rate limiting: pequena pausa entre batches
      if (i + BATCH_SIZE < texts.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`Error generating embeddings batch ${i}-${i + BATCH_SIZE}:`, error);
      throw error;
    }
  }

  return results;
}

/**
 * Gera embeddings para todos os chunks de um documento
 */
export async function generateDocumentEmbeddings(documentId: string): Promise<{
  success: boolean;
  processedChunks: number;
  error?: string;
}> {
  try {
    // Buscar chunks sem embedding
    const { data: chunks, error: fetchError } = await supabaseAdmin
      .from('knowledge_chunks')
      .select('id, content')
      .eq('document_id', documentId)
      .is('embedding', null)
      .order('chunk_index');

    if (fetchError) {
      throw new Error(`Erro ao buscar chunks: ${fetchError.message}`);
    }

    if (!chunks || chunks.length === 0) {
      return {
        success: true,
        processedChunks: 0,
      };
    }

    console.log(`🔄 Gerando embeddings para ${chunks.length} chunks...`);

    // Gerar embeddings em batch
    const texts = chunks.map((c) => c.content);
    const embeddings = await generateEmbeddingsBatch(texts);

    // Atualizar cada chunk com seu embedding
    for (const result of embeddings) {
      const chunk = chunks[result.index];
      const embeddingString = `[${result.embedding.join(',')}]`;

      const { error: updateError } = await supabaseAdmin
        .from('knowledge_chunks')
        .update({ embedding: embeddingString })
        .eq('id', chunk.id);

      if (updateError) {
        console.error(`Error updating chunk ${chunk.id}:`, updateError);
      }
    }

    // Atualizar status do documento
    await supabaseAdmin
      .from('knowledge_documents')
      .update({ status: 'completed' })
      .eq('id', documentId);

    console.log(`✅ Embeddings gerados: ${embeddings.length} chunks processados`);

    return {
      success: true,
      processedChunks: embeddings.length,
    };
  } catch (error) {
    console.error('Error generating document embeddings:', error);

    await supabaseAdmin
      .from('knowledge_documents')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Erro ao gerar embeddings',
      })
      .eq('id', documentId);

    return {
      success: false,
      processedChunks: 0,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Processa todos os documentos pendentes de embeddings
 */
export async function processAllPendingEmbeddings(): Promise<{
  processed: number;
  failed: number;
}> {
  // Buscar documentos com chunks sem embedding
  const { data: documents } = await supabaseAdmin
    .from('knowledge_documents')
    .select(`
      id,
      knowledge_chunks!inner(id)
    `)
    .eq('status', 'completed')
    .is('knowledge_chunks.embedding', null);

  if (!documents || documents.length === 0) {
    return { processed: 0, failed: 0 };
  }

  let processed = 0;
  let failed = 0;

  for (const doc of documents) {
    const result = await generateDocumentEmbeddings(doc.id);
    if (result.success) {
      processed++;
    } else {
      failed++;
    }
  }

  return { processed, failed };
}

/**
 * Calcula similaridade de cosseno entre dois vetores
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export const embeddingsService = {
  generateEmbedding,
  generateEmbeddingsBatch,
  generateDocumentEmbeddings,
  processAllPendingEmbeddings,
  cosineSimilarity,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
};
