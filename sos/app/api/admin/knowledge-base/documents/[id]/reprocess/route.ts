import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';
import { generateDocumentEmbeddings } from '@/lib/server/knowledge/embeddings';

/**
 * POST: Reprocessa um documento (regenera embeddings)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar se documento existe
    const { data: doc, error: fetchError } = await supabaseAdmin
      .from('knowledge_documents')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchError || !doc) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar status para processing
    await supabaseAdmin
      .from('knowledge_documents')
      .update({ status: 'processing', error_message: null })
      .eq('id', id);

    // Limpar embeddings existentes
    await supabaseAdmin
      .from('knowledge_chunks')
      .update({ embedding: null })
      .eq('document_id', id);

    // Regenerar embeddings
    const result = await generateDocumentEmbeddings(id);

    return NextResponse.json({
      success: result.success,
      processedChunks: result.processedChunks,
      error: result.error,
    });
  } catch (error) {
    console.error('Reprocess document error:', error);
    return NextResponse.json(
      { error: 'Erro ao reprocessar documento' },
      { status: 500 }
    );
  }
}
