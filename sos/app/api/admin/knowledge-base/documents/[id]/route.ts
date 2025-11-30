import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';

/**
 * DELETE: Remove um documento e seus chunks
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('knowledge_documents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting document:', error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir documento' },
      { status: 500 }
    );
  }
}

/**
 * GET: Busca um documento específico com todos os chunks
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Buscar documento
    const { data: document, error: docError } = await supabaseAdmin
      .from('knowledge_documents')
      .select('*')
      .eq('id', id)
      .single();

    if (docError) {
      throw docError;
    }

    // Buscar chunks com conteúdo completo
    const { data: chunks, error: chunksError } = await supabaseAdmin
      .from('knowledge_chunks')
      .select('id, chunk_index, content, content_length, metadata')
      .eq('document_id', id)
      .order('chunk_index', { ascending: true });

    if (chunksError) {
      console.error('Error fetching chunks:', chunksError);
    }

    return NextResponse.json({
      document,
      chunks: chunks || [],
    });
  } catch (error) {
    console.error('Get document error:', error);
    return NextResponse.json(
      { error: 'Documento não encontrado' },
      { status: 404 }
    );
  }
}

/**
 * PATCH: Atualiza chunks de um documento
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { chunks } = body;

    if (!chunks || typeof chunks !== 'object') {
      return NextResponse.json(
        { error: 'Chunks inválidos' },
        { status: 400 }
      );
    }

    // Atualizar cada chunk editado
    for (const [chunkId, content] of Object.entries(chunks)) {
      const { error } = await supabaseAdmin
        .from('knowledge_chunks')
        .update({
          content: content as string,
          content_length: (content as string).length,
          embedding: null, // Limpar embedding para regenerar depois
        })
        .eq('id', chunkId)
        .eq('document_id', id);

      if (error) {
        console.error('Error updating chunk:', error);
      }
    }

    // Atualizar updated_at do documento
    await supabaseAdmin
      .from('knowledge_documents')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update document error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar documento' },
      { status: 500 }
    );
  }
}
