import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';

/**
 * GET /api/credits/balance - Obter saldo atual
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, credits_remaining')
      .eq('clerk_id', userId)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      balance: profile.credits_remaining || 0,
      user_id: profile.id,
    });
  } catch (error) {
    console.error('Credits balance error:', error);
    return NextResponse.json({ error: 'Erro ao buscar saldo' }, { status: 500 });
  }
}
