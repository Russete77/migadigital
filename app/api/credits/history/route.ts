import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';

/**
 * GET /api/credits/history - Historico de transacoes
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit')) || 20;
    const offset = Number(searchParams.get('offset')) || 0;

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 });
    }

    // Get credit history
    const { data: history, error } = await supabaseAdmin
      .from('user_credits_history')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching credit history:', error);
      return NextResponse.json({ error: 'Erro ao buscar historico' }, { status: 500 });
    }

    return NextResponse.json({
      history: history || [],
      total: history?.length || 0,
    });
  } catch (error) {
    console.error('Credits history error:', error);
    return NextResponse.json({ error: 'Erro ao buscar historico' }, { status: 500 });
  }
}
