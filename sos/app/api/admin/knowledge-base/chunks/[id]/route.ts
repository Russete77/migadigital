import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';

/**
 * DELETE: Remove um chunk individual
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Buscar o chunk para pegar o document_id
    const { data: chunk, error: fetchError } = await supabaseAdmin
      .from('knowledge_chunks')
      .select('document_id')
      .eq('id', id)
      .single();

    if (fetchError || !chunk) {
      return NextResponse.json(
        { error: 'Chunk nao encontrado' },
        { status: 404 }
      );
    }

    // Excluir o chunk
    const { error: deleteError } = await supabaseAdmin
      .from('knowledge_chunks')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting chunk:', deleteError);
      throw deleteError;
    }

    // Atualizar contagem de chunks no documento
    const { count } = await supabaseAdmin
      .from('knowledge_chunks')
      .select('*', { count: 'exact', head: true })
      .eq('document_id', chunk.document_id);

    await supabaseAdmin
      .from('knowledge_documents')
      .update({
        total_chunks: count || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', chunk.document_id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete chunk error:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir chunk' },
      { status: 500 }
    );
  }
}
