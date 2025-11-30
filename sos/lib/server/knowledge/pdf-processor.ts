import { supabaseAdmin } from '../supabase-admin';
import crypto from 'crypto';

/**
 * PDF Processor Service
 * Processa PDFs e extrai texto em chunks para a base de conhecimento
 */

interface ProcessedChunk {
  content: string;
  metadata: {
    page?: number;
    section?: string;
    charStart: number;
    charEnd: number;
  };
}

interface ProcessingResult {
  documentId: string;
  totalChunks: number;
  status: 'completed' | 'failed';
  error?: string;
}

// Configurações de chunking
const CHUNK_SIZE = 1000; // caracteres por chunk
const CHUNK_OVERLAP = 200; // sobreposição entre chunks

/**
 * Gera hash MD5 do conteúdo para evitar duplicatas
 */
function generateContentHash(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Divide texto em chunks com sobreposição
 */
function splitIntoChunks(
  text: string,
  chunkSize: number = CHUNK_SIZE,
  overlap: number = CHUNK_OVERLAP
): ProcessedChunk[] {
  const chunks: ProcessedChunk[] = [];

  // Limpar texto
  const cleanText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (cleanText.length === 0) return chunks;

  // Tentar dividir por parágrafos primeiro
  const paragraphs = cleanText.split(/\n\n+/);
  let currentChunk = '';
  let charStart = 0;

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();

    if (currentChunk.length + trimmedParagraph.length + 2 <= chunkSize) {
      // Adicionar ao chunk atual
      currentChunk += (currentChunk ? '\n\n' : '') + trimmedParagraph;
    } else {
      // Salvar chunk atual se não estiver vazio
      if (currentChunk.length > 0) {
        chunks.push({
          content: currentChunk,
          metadata: {
            charStart,
            charEnd: charStart + currentChunk.length,
          },
        });
        charStart += currentChunk.length - overlap;
      }

      // Se o parágrafo for maior que o chunk size, dividir por frases
      if (trimmedParagraph.length > chunkSize) {
        const sentences = trimmedParagraph.match(/[^.!?]+[.!?]+/g) || [trimmedParagraph];
        currentChunk = '';

        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length <= chunkSize) {
            currentChunk += sentence;
          } else {
            if (currentChunk.length > 0) {
              chunks.push({
                content: currentChunk.trim(),
                metadata: {
                  charStart,
                  charEnd: charStart + currentChunk.length,
                },
              });
              charStart += currentChunk.length - overlap;
            }
            currentChunk = sentence;
          }
        }
      } else {
        currentChunk = trimmedParagraph;
      }
    }
  }

  // Adicionar último chunk
  if (currentChunk.length > 0) {
    chunks.push({
      content: currentChunk,
      metadata: {
        charStart,
        charEnd: charStart + currentChunk.length,
      },
    });
  }

  return chunks;
}

/**
 * Processa texto extraído de PDF e salva chunks no banco
 */
export async function processPDFContent(
  documentId: string,
  textContent: string,
  pageMapping?: { page: number; startChar: number; endChar: number }[]
): Promise<ProcessingResult> {
  try {
    // Atualizar status para processing
    await supabaseAdmin
      .from('knowledge_documents')
      .update({ status: 'processing' })
      .eq('id', documentId);

    // Verificar se já existe documento com mesmo hash
    const contentHash = generateContentHash(textContent);
    const { data: existing } = await supabaseAdmin
      .from('knowledge_documents')
      .select('id')
      .eq('content_hash', contentHash)
      .neq('id', documentId)
      .single();

    if (existing) {
      await supabaseAdmin
        .from('knowledge_documents')
        .update({
          status: 'failed',
          error_message: 'Documento duplicado já existe na base',
        })
        .eq('id', documentId);

      return {
        documentId,
        totalChunks: 0,
        status: 'failed',
        error: 'Documento duplicado',
      };
    }

    // Dividir em chunks
    const chunks = splitIntoChunks(textContent);

    if (chunks.length === 0) {
      await supabaseAdmin
        .from('knowledge_documents')
        .update({
          status: 'failed',
          error_message: 'Nenhum conteúdo extraído do documento',
        })
        .eq('id', documentId);

      return {
        documentId,
        totalChunks: 0,
        status: 'failed',
        error: 'Documento vazio',
      };
    }

    // Adicionar informação de página aos chunks se disponível
    if (pageMapping) {
      chunks.forEach((chunk) => {
        const pageInfo = pageMapping.find(
          (p) => chunk.metadata.charStart >= p.startChar && chunk.metadata.charStart < p.endChar
        );
        if (pageInfo) {
          chunk.metadata.page = pageInfo.page;
        }
      });
    }

    // Inserir chunks no banco (sem embedding ainda)
    const chunksToInsert = chunks.map((chunk, index) => ({
      document_id: documentId,
      chunk_index: index,
      content: chunk.content,
      content_length: chunk.content.length,
      metadata: chunk.metadata,
    }));

    const { error: insertError } = await supabaseAdmin
      .from('knowledge_chunks')
      .insert(chunksToInsert);

    if (insertError) {
      console.error('Error inserting chunks:', insertError);
      throw new Error(`Erro ao inserir chunks: ${insertError.message}`);
    }

    // Atualizar documento com hash e contagem
    await supabaseAdmin
      .from('knowledge_documents')
      .update({
        content_hash: contentHash,
        total_chunks: chunks.length,
        status: 'completed', // Será 'pending_embeddings' quando integrar embeddings
      })
      .eq('id', documentId);

    console.log(`✅ PDF processado: ${chunks.length} chunks criados para documento ${documentId}`);

    return {
      documentId,
      totalChunks: chunks.length,
      status: 'completed',
    };
  } catch (error) {
    console.error('Error processing PDF:', error);

    await supabaseAdmin
      .from('knowledge_documents')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Erro desconhecido',
      })
      .eq('id', documentId);

    return {
      documentId,
      totalChunks: 0,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Cria um novo documento e retorna o ID
 */
export async function createDocument(params: {
  title: string;
  description?: string;
  sourceType: 'pdf' | 'text' | 'url';
  fileName?: string;
  fileSize?: number;
  sourceUrl?: string;
  createdBy?: string;
  categoryIds?: string[];
}): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('knowledge_documents')
    .insert({
      title: params.title,
      description: params.description,
      source_type: params.sourceType,
      file_name: params.fileName,
      file_size: params.fileSize,
      source_url: params.sourceUrl,
      created_by: params.createdBy,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Erro ao criar documento: ${error.message}`);
  }

  // Adicionar categorias se especificadas
  if (params.categoryIds && params.categoryIds.length > 0) {
    await supabaseAdmin
      .from('document_categories')
      .insert(
        params.categoryIds.map((categoryId) => ({
          document_id: data.id,
          category_id: categoryId,
        }))
      );
  }

  return data.id;
}

/**
 * Deleta um documento e todos os chunks associados
 */
export async function deleteDocument(documentId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('knowledge_documents')
    .delete()
    .eq('id', documentId);

  if (error) {
    throw new Error(`Erro ao deletar documento: ${error.message}`);
  }
}

/**
 * Lista todos os documentos
 */
export async function listDocuments(params?: {
  status?: string;
  categoryId?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  documents: any[];
  total: number;
}> {
  let query = supabaseAdmin
    .from('knowledge_documents')
    .select('*, document_categories(category_id)', { count: 'exact' });

  if (params?.status) {
    query = query.eq('status', params.status);
  }

  if (params?.categoryId) {
    query = query.contains('document_categories', [{ category_id: params.categoryId }]);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(params?.offset || 0, (params?.offset || 0) + (params?.limit || 50) - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar documentos: ${error.message}`);
  }

  return {
    documents: data || [],
    total: count || 0,
  };
}

export const pdfProcessor = {
  createDocument,
  processPDFContent,
  deleteDocument,
  listDocuments,
  splitIntoChunks,
};
