import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';

/**
 * GET: Lista todos os documentos da base de conhecimento
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Buscar documentos
    let query = supabaseAdmin
      .from('knowledge_documents')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: documents, count, error } = await query;

    if (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }

    // Buscar estatísticas
    const [{ count: totalChunks }, pendingDocs, failedDocs] = await Promise.all([
      supabaseAdmin.from('knowledge_chunks').select('id', { count: 'exact', head: true }),
      supabaseAdmin
        .from('knowledge_documents')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabaseAdmin
        .from('knowledge_documents')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'failed'),
    ]);

    return NextResponse.json({
      documents: documents || [],
      total: count || 0,
      stats: {
        totalDocuments: count || 0,
        totalChunks: totalChunks || 0,
        pendingDocuments: pendingDocs.count || 0,
        failedDocuments: failedDocs.count || 0,
      },
    });
  } catch (error) {
    console.error('Knowledge documents API error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar documentos' },
      { status: 500 }
    );
  }
}
